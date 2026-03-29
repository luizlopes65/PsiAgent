from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, BaseMessage, SystemMessage
from langchain.chat_models import init_chat_model
from langgraph.prebuilt import ToolNode
from langchain_core.tools import StructuredTool
import asyncio
from contextlib import AsyncExitStack
from pydantic import create_model, Field
from mcp import ClientSession
from mcp.client.sse import sse_client 
from mcp.types import Tool as McpTool
from .prompts import SYSTEM_PROMPT
from config import settings

def create_pydantic_model_from_mcp_schema(name: str, schema: dict):
    """Converte JSON Schema do MCP para Pydantic (Para o LLM entender os args)"""
    fields = {}
    if "properties" in schema:
        for field_name, field_info in schema["properties"].items():
            field_type = str 
            if field_info.get("type") == "integer": field_type = int
            elif field_info.get("type") == "number": field_type = float
            elif field_info.get("type") == "boolean": field_type = bool # Adicionado suporte a booleano
            
            description = field_info.get("description", "")
            fields[field_name] = (field_type, Field(description=description))
            
    return create_model(f"{name}Schema", **fields)

def mcp_to_langchain_tool(mcp_tool: McpTool, session: ClientSession):
    """Wrapper que conecta o LangChain ao MCP via SSE"""
    
    args_schema = create_pydantic_model_from_mcp_schema(mcp_tool.name, mcp_tool.inputSchema)

    async def _tool_func(**kwargs):
        # Executa a tool no servidor (server_clinical.py)
        result = await session.call_tool(mcp_tool.name, arguments=kwargs)
        
        output_text = []
        if result.content:
            for content in result.content:
                if content.type == 'text':
                    output_text.append(content.text)
        return "\n".join(output_text)

    return StructuredTool.from_function(
        func=None,
        coroutine=_tool_func,
        name=mcp_tool.name,
        description=mcp_tool.description,
        args_schema=args_schema 
    )

async def create_agent(session: ClientSession, checkpointer=None):
    class AgentState(TypedDict):
        messages: Annotated[Sequence[BaseMessage], add_messages]

    result = await session.list_tools()
    raw_mcp_tools = result.tools
    print(f"🩺 Tools Clínicas carregadas: {[t.name for t in raw_mcp_tools]}")

    mcp_tools = [mcp_to_langchain_tool(t, session) for t in raw_mcp_tools]
    model = init_chat_model(model=settings.llm_model, model_provider=settings.llm_provider)
    tool_node = ToolNode(mcp_tools)

    async def call_model(state: AgentState) -> AgentState:
        system_prompt = SystemMessage(content=(SYSTEM_PROMPT
        ))
        
        model_with_tool = model.bind_tools(mcp_tools)
        response = await model_with_tool.ainvoke([system_prompt] + state["messages"])
        return {"messages": [response]}

    def should_continue(state: AgentState):
        messages = state["messages"]
        last_message = messages[-1]

        if last_message.tool_calls:
            return "continue"
        
        return "end"

    graph = StateGraph(AgentState)

    graph.add_node("model", call_model)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("model")

    graph.add_conditional_edges(
        "model",
        should_continue,
        {
            "continue": "tools",  
            "end": END            
        }
    )

    graph.add_edge("tools", "model") 

    agent = graph.compile(checkpointer=checkpointer)
    return agent

async def run_test():
    SERVER_URL = settings.mcp_server_url
    
    print(f"🔌 Conectando ao Servidor Clínico em {SERVER_URL}...")
    
    async with AsyncExitStack() as stack:
        sse_transport = await stack.enter_async_context(sse_client(SERVER_URL))
        read, write = sse_transport
        
        session = await stack.enter_async_context(ClientSession(read, write))
        await session.initialize()
        
        agent = await create_agent(session)
        
        current_state = {"messages": []}
        print("\n🧠 PsiAgent Pronto! (Digite 'sair' para encerrar)")
        
        while True:
            try:
                user_msg = input("\nPSICÓLOGO: ")
                if user_msg.lower() in ["sair", "exit"]: break
                
                current_state["messages"].append(HumanMessage(content=user_msg))
                
                output = await agent.ainvoke(current_state)
                
                current_state = output
                
                last_msg = output['messages'][-1].content
                print(f"IA: {last_msg}")
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Erro: {e}")

if __name__ == '__main__':
    asyncio.run(run_test())
