# 📁 Estrutura do Projeto - PsiAgent

## Novo Layout Organizado

```
psiagent/
├── db/                          # 🗄️ Modelos de Banco de Dados
│   ├── __init__.py             # Exports: Patient, SessionLog, engine, session_local
│   └── models.py               # Classes SQLAlchemy: Patient, SessionLog, Interaction
│
├── main/                        # 🚀 Aplicação FastAPI
│   ├── __init__.py             # Cria e exporta a instância app
│   ├── app.py                  # Endpoints e lógica da API
│   └── models.py               # Modelos Pydantic (ChatRequest, PatientResponse, etc)
│
├── mcp_server/                 # 🔧 Servidor MCP (Model Context Protocol)
│   ├── __init__.py             # Exports: mcp
│   └── server.py               # Tools clínicas (buscar_paciente, registrar_sessao, etc)
│
├── helpers/                     # 🛠️ Utilitários e Helpers
│   ├── __init__.py             # Exports: create_agent, SYSTEM_PROMPT
│   ├── agent.py                # create_agent() - Orquestração LangGraph
│   └── prompts.py              # SYSTEM_PROMPT - Instruções do assistente IA
│
├── main.py                      # 📌 Entry point - poetry run python main.py
├── mcp_server.py               # 📌 Entry point - poetry run python mcp_server.py
├── config.py                    # ⚙️  Configurações centralizadas (env vars)
├── .env                         # 🔧 Variáveis de ambiente (desenvolvimento)
├── pyproject.toml              # Poetry config
├── README.md                    # Documentação
├── STRUCTURE.md                # Esta estrutura
├── CONFIG.md                   # Guia de configuração
│
└── psi-interface/              # 🎨 Frontend React
    └── src/App.jsx
```

## 📌 Entry Points

### API FastAPI
```bash
# Desenvolvimento (com config de .env)
poetry run python main.py

# Ou via uvicorn direto
poetry run uvicorn main:app --reload --port 8001
```

### MCP Server (Clinical Tools)
```bash
poetry run python mcp_server.py
```

### Teste de Streaming
```bash
poetry run python test_streaming.py
```

## 🎯 Estrutura de Imports

### Cliente (ex: psi-interface)
```python
# Chamar a API
fetch('http://localhost:8001/chat', {
    headers: { 'Authorization': `Bearer ${token}` }
})
```

### Código externo dentro do projeto
```python
# Importar database
from db import Patient, SessionLog, engine, session_local

# Importar helpers
from helpers import create_agent, SYSTEM_PROMPT

# Importar app (agora exportada pelo __init__)
from main import app, create_app

# Importar configurações
from config import settings
print(settings.api_url)       # http://127.0.0.1:8001
print(settings.mcp_server_url)  # http://127.0.0.1:8000/sse
```

## 🔄 Fluxo de Dados

```
React UI (psi-interface)
    ↓
    → FastAPI API (main/)
         ↓
         → Database (db/)
         ↓
         → LangGraph Agent (helpers/agent.py)
              ↓
              → MCP Server (mcp_server/)
                   ↓
                   → Database Tools
```

## 📦 Cada módulo é responsável por:

| Módulo | Responsabilidade |
|--------|-----------------|
| **db/** | Modelos de banco de dados, migrations, schema |
| **main/** | Endpoints HTTP, rotas FastAPI, validação |
| **mcp_server/** | Tools disponíveis para o agente (CRUD de pacientes) |
| **helpers/** | Lógica do agente IA, prompts, orquestração |

