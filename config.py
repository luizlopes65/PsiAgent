"""
⚙️ Configuração Centralizada - PsiAgent

Este módulo lê todas as env vars e valida os valores.
Use em qualquer lugar: from config import settings

Exemplo:
    from config import settings
    
    model = settings.llm_model
    print(f"Rodando em {settings.api_host}:{settings.api_port}")
"""

import os
from typing import Literal
from dotenv import load_dotenv

# Carrega .env automaticamente
load_dotenv()


class Settings:
    """Configurações centralizadas com valores padrão e validação"""
    
    llm_model: str = os.getenv("LLM_MODEL", "qwen3:8b")
    llm_provider: str = os.getenv("LLM_PROVIDER", "ollama")
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    
    # ====== API FastAPI ======
    api_host: str = os.getenv("API_HOST", "127.0.0.1")
    api_port: int = int(os.getenv("API_PORT", "8001"))
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    reload: bool = os.getenv("RELOAD", "true").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "info").lower()
    
    # ====== MCP Server ======
    mcp_host: str = os.getenv("MCP_HOST", "127.0.0.1")
    mcp_port: int = int(os.getenv("MCP_PORT", "8000"))
    
    # ====== Banco de Dados ======
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./db/clinical_data.db")
    
    # ====== Segurança ======
    api_secret: str = os.getenv("API_SECRET", "admin")
    
    # ====== CORS ======
    cors_origins: list = os.getenv("CORS_ORIGINS", "*").split(",") \
        if os.getenv("CORS_ORIGINS") != "*" else ["*"]
    
    # ====== Timeouts ======
    mcp_connect_timeout: int = int(os.getenv("MCP_CONNECT_TIMEOUT", "30"))
    llm_timeout: int = int(os.getenv("LLM_TIMEOUT", "120"))
    
    # ====== URLs Construídas Automaticamente ======
    @property
    def mcp_server_url(self) -> str:
        """URL do servidor MCP (para conexão API -> MCP)"""
        return f"http://{self.mcp_host}:{self.mcp_port}/sse"
    
    @property
    def api_url(self) -> str:
        """URL da API (para logs e referência)"""
        return f"http://{self.api_host}:{self.api_port}"
    
    # ====== Info/Debug ======
    def __str__(self) -> str:
        """Exibe configurações ativas (para debug)"""
        return f"""
🔧 PsiAgent - Configurações Ativas:
  
  🤖 LLM:
    - Modelo: {self.llm_model}
    - Provider: {self.llm_provider}
    - Ollama Host: {self.ollama_host}
  
  🚀 API:
    - Host: {self.api_host}:{self.api_port}
    - URL: {self.api_url}
    - Debug: {self.debug}
    - Reload: {self.reload}
    - Log Level: {self.log_level}
  
  🔧 MCP:
    - Host: {self.mcp_host}:{self.mcp_port}
    - URL: {self.mcp_server_url}
  
  🗄️ Database:
    - URL: {self.database_url}
  
  🔐 Segurança:
    - API Secret: {'***' if self.api_secret != 'admin' else 'admin (padrão)'}
    - CORS Origins: {self.cors_origins}
"""


# Instância global - use sempre assim:
# from config import settings
settings = Settings()


if __name__ == "__main__":
    # Script de debug para verificar configurações
    print(settings)
    print("✅ Configurações carregadas com sucesso!")
