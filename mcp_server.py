"""
MCP Server - Entry point limpo
Importa o servidor MCP do submódulo mcp_server/
"""

from mcp_server.server import mcp

if __name__ == "__main__":
    print("🚀 Iniciando Servidor MCP (Clinical Tools)...")
    mcp.run(transport="sse")
