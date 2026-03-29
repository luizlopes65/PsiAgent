import os
import asyncio
import json
import logging
from datetime import datetime
from contextlib import asynccontextmanager, AsyncExitStack
from typing import Optional, List
import io

from fastapi import FastAPI, HTTPException, Depends, Security, UploadFile, File
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage
from mcp import ClientSession
from mcp.client.sse import sse_client

# Importações locais
from db import engine, Base, session_local, Patient, SessionLog, AppConfig
from helpers.agent import create_agent
from helpers.prompts import SYSTEM_PROMPT
from .models import ChatRequest, PatientResponse, UpdateSessionRequest, SettingsResponse, UpdateSettingsRequest
from config import settings

API_SECRET = settings.api_secret 
security = HTTPBearer()
api_secret_from_db = None
whisper_pipeline = None

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    global api_secret_from_db
    secret_to_check = api_secret_from_db if api_secret_from_db else API_SECRET
    if credentials.credentials != secret_to_check:
        raise HTTPException(status_code=401, detail="Token inválido.")

# --- VARIÁVEIS GLOBAIS ---
agent_executor = None
mcp_stack = AsyncExitStack() 
whisper_pipeline = None
whisper_loading = False
whisper_load_error = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent_executor, api_secret_from_db
    
    print("🛠️ Verificando Banco de Dados SQLite...")
    Base.metadata.create_all(bind=engine)
    
    with session_local() as session:
        app_config = session.query(AppConfig).filter(AppConfig.id == 1).first()
        
        if not app_config:
            app_config = AppConfig(id=1, api_secret=API_SECRET)
            session.add(app_config)
            session.commit()
            print(f"✅ Configuração inicial criada")
        
        api_secret_from_db = app_config.api_secret
        print(f"✅ Configuração carregada")
    
    checkpointer = MemorySaver()
    
    MCP_SERVER_URL = settings.mcp_server_url
    print(f"🔄 Conectando ao Servidor MCP em {MCP_SERVER_URL}...")

    try:
        sse_transport = await mcp_stack.enter_async_context(sse_client(MCP_SERVER_URL))
        read, write = sse_transport
        
        session = await mcp_stack.enter_async_context(ClientSession(read, write))
        await session.initialize()
        print("✅ Conexão MCP (Tools) estabelecida!")
        
        agent_executor = await create_agent(session, checkpointer)
        
        print(f"🚀 API Local pronta em {settings.api_url}")
        yield 
        
    except Exception as e:
        print(f"❌ Falha na inicialização: {e}")
        raise e
    finally:
        print("💤 Encerrando...")
        await mcp_stack.aclose()

def create_app() -> FastAPI:
    """Factory function para criar a aplicação FastAPI"""
    app = FastAPI(title="PsiAgent API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins, 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- ENDPOINTS ---

    @app.post("/chat", dependencies=[Depends(verify_token)])
    async def chat_endpoint(request: ChatRequest):
        """
        Endpoint de Chat com Streaming (SSE).
        Retorna eventos em tempo real: status (ferramentas) e tokens (texto).
        """
        if not agent_executor:
            raise HTTPException(status_code=503, detail="Agente offline.")

        async def event_generator():
            config = {"configurable": {"thread_id": request.thread_id}}
            inputs = {"messages": [HumanMessage(content=request.message)]}

            try:
                async for event in agent_executor.astream_events(inputs, config, version="v2"):
                    kind = event["event"]
                    
                    #texto normal
                    if kind == "on_chat_model_stream":
                        content = event["data"]["chunk"].content
                        if content:
                            data = json.dumps({"type": "token", "content": content})
                            yield f"data: {data}\n\n"

                    #ferramenta
                    elif kind == "on_tool_start":
                        tool_name = event['name']
                        msg = f"Acessando ferramenta: {tool_name}..."
                        if "buscar" in tool_name: msg = "🔍 Pesquisando no banco de dados..."
                        elif "criar" in tool_name: msg = "📝 Criando novo registro..."
                        elif "registrar" in tool_name: msg = "💾 Salvando sessão..."
                        elif "editar" in tool_name: msg = "✏️ Atualizando informações..."
                        elif "listar" in tool_name: msg = "📖 Lendo histórico clínico..."
                         
                        data = json.dumps({"type": "status", "content": msg})
                        yield f"data: {data}\n\n"
                
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as e:
                err_msg = f"Erro no processamento: {str(e)}"
                yield f"data: {json.dumps({'type': 'error', 'content': err_msg})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    @app.get("/patients", dependencies=[Depends(verify_token)], response_model=List[PatientResponse])
    async def list_patients():
        with session_local() as session:
            patients = session.query(Patient).all()
            return [
                PatientResponse(
                    id=p.id, 
                    nome=p.full_name,
                    valor_sessao=p.hourly_rate, 
                    queixa=p.main_complaint, 
                    divida=p.current_debt,
                    dia_recorrente=p.recurrence_week_day,
                    horario_recorrente=p.recurrence_time
                ) for p in patients
            ]

    @app.get("/patient/{patient_id}/history", dependencies=[Depends(verify_token)])
    async def get_patient_history(patient_id: int):
        with session_local() as session:
            logs = session.query(SessionLog).filter(SessionLog.patient_id == patient_id).all()
            return [
                {
                    "id": log.id,  
                    "data": log.session_date, 
                    "notas": log.content_private, 
                    "insights": log.insights_ai, 
                    "pago": log.is_paid
                } for log in logs
            ]

    @app.get("/interactions/{thread_id}", dependencies=[Depends(verify_token)])
    async def get_conversation(thread_id: str):
        if not agent_executor:
            raise HTTPException(status_code=503, detail="Agente offline.")

        config = {"configurable": {"thread_id": thread_id}}
        state = await agent_executor.aget_state(config)
        messages = state.values.get("messages", [])
        
        history = []
        for m in messages:
            role = "user" if isinstance(m, HumanMessage) else "assistant"
            if hasattr(m, 'content') and isinstance(m.content, str):
                history.append({"role": role, "content": m.content})
        
        return {"thread_id": thread_id, "history": history}

    @app.delete("/history/{thread_id}", dependencies=[Depends(verify_token)])
    async def delete_history(thread_id: str):
        config = {"configurable": {"thread_id": thread_id}}
        await agent_executor.update_state(config, {"messages": []})
        return {"status": "Memória resetada."}

    @app.patch("/session/{session_id}", dependencies=[Depends(verify_token)])
    async def update_session_notes(session_id: int, request: UpdateSessionRequest):
        """Atualiza as notas privadas de uma sessão específica"""
        with session_local() as session:
            log = session.query(SessionLog).filter(SessionLog.id == session_id).first()
            if not log:
                raise HTTPException(status_code=404, detail="Sessão não encontrada.")
            
            log.content_private = request.notas
            session.commit()
            return {"status": "Sessão atualizada com sucesso."}

    @app.delete("/patient/{patient_id}/sessions", dependencies=[Depends(verify_token)])
    async def delete_patient_sessions(patient_id: int):
        with session_local() as session:
            session.query(SessionLog).filter(SessionLog.patient_id == patient_id).delete()
            session.commit()
        return {"status": "Sessões apagadas."}

    # ─────────────────────────────────────────────────────────────────
    # 🔐 CONFIGURAÇÕES DE APLICAÇÃO
    # ─────────────────────────────────────────────────────────────────
    
    @app.get("/settings", dependencies=[Depends(verify_token)], response_model=SettingsResponse)
    async def get_settings():
        with session_local() as session:
            config = session.query(AppConfig).filter(AppConfig.id == 1).first()
            if not config:
                raise HTTPException(status_code=500, detail="Configuração não encontrada")
            
            return SettingsResponse(
                last_updated=config.updated_at.isoformat() if config.updated_at else None
            )

    @app.put("/settings", dependencies=[Depends(verify_token)])
    async def update_settings(request: UpdateSettingsRequest):
        global API_SECRET, api_secret_from_db
        
        with session_local() as session:
            config = session.query(AppConfig).filter(AppConfig.id == 1).first()
            if not config:
                raise HTTPException(status_code=500, detail="Configuração não encontrada")
            
            if config.api_secret != request.current_password:
                raise HTTPException(status_code=401, detail="Senha atual incorreta.")
            
            if len(request.new_password) < 8:
                raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 8 caracteres.")
            
            if "'" in request.new_password or '"' in request.new_password:
                raise HTTPException(status_code=400, detail="Senha não pode conter aspas.")
            
            config.api_secret = request.new_password
            config.updated_at = datetime.now()
            session.commit()
            
            API_SECRET = request.new_password
            api_secret_from_db = request.new_password
            
            return {
                "status": "Senha atualizada com sucesso.",
                "message": "⚠️ Você será desconectado. Faça login novamente com a nova senha."
            }


    return app
