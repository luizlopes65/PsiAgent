# 🔧 Sistema de Configuração - PsiAgent

> **Todas as configurações usam variáveis de ambiente (env vars) para máxima robustez e segurança.**

---

## 📋 Quick Start

### 1. Crie seu arquivo `.env`

```bash
# Opção A: Copie o padrão
cp .env.example .env

# Opção B: Use direto o padrão (já está em repo)
# O arquivo .env já existe com valores padrão
```

### 2. Customize conforme necessário

Edite `.env` e altere os valores desejados:

```bash
# Mudar modelo IA
LLM_MODEL=ministral-3:3b

# Mudar portas
API_PORT=9001
MCP_PORT=9000
```

### 3. Rode os serviços

```bash
# API (carrega .env automaticamente)
poetry run uvicorn main:app --reload --port 8001

# Ou deixe o main.py lidar com tudo:
poetry run python main.py
```

---

## 📦 Variáveis de Ambiente

### 🤖 LLM (Ollama)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `LLM_MODEL` | `qwen3:8b` | Modelo disponível em Ollama |
| `LLM_PROVIDER` | `ollama` | Provider (manter como ollama) |
| `OLLAMA_HOST` | `http://localhost:11434` | URL do Ollama (pode ser remoto) |

**Modelos recomendados:**
- `qwen3:8b` - Melhor custo/benefício
- `ministral-3:3b` - Mais leve, rápido
- `llama2` - Alternativa robusta

---

### 🚀 API FastAPI

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `API_HOST` | `127.0.0.1` | Host (0.0.0.0 para produção) |
| `API_PORT` | `8001` | Porta HTTP |
| `DEBUG` | `true` | Modo debug (false em produção) |
| `RELOAD` | `true` | Auto-reload (false em produção) |
| `LOG_LEVEL` | `info` | debug, info, warning, error, critical |

---

### 🔧 MCP Server (Ferramentas Clínicas)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MCP_HOST` | `127.0.0.1` | Host do servidor MCP |
| `MCP_PORT` | `8000` | Porta do servidor MCP |

A API se conecta ao MCP via: `http://{MCP_HOST}:{MCP_PORT}/sse`

---

### 🗄️ Banco de Dados

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | `sqlite:///./db/clinical_data.db` | Conexão ao banco |

**Exemplos:**
```
# SQLite (desenvolvimento)
sqlite:///./db/clinical_data.db

# PostgreSQL (produção)
postgresql://user:password@localhost/psiagent_db

# MySQL (produção)
mysql+pymysql://user:password@localhost/psiagent_db
```

---

### 🔐 Segurança

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `API_SECRET` | `admin` | Token Bearer para endpoints (⚠️ trocar em produção) |
| `CORS_ORIGINS` | `*` | CORS permitido (restringir em produção) |

**Gerar token seguro (produção):**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

### 📲 Timeouts

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MCP_CONNECT_TIMEOUT` | `30` | Timeout conexão MCP (segundos) |
| `LLM_TIMEOUT` | `120` | Timeout resposta LLM (segundos) |

---

## 🔍 Verificar Configurações Ativas

```bash

poetry run python config.py

---

## 🎯 Cenários Comuns

### Desenvolvimento Local

```env
API_HOST=127.0.0.1
API_PORT=8001
DEBUG=true
RELOAD=true
LOG_LEVEL=debug
CORS_ORIGINS=*
```

---

## 🚀 Como Usar em Código

```python
from config import settings

# Acessar qualquer configuração
print(settings.api_port)           
print(settings.llm_model)          
print(settings.mcp_server_url)    
print(settings.api_url)            

# URLs construídas automaticamente
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins
)

# Sempre import do config
# from config import settings
```

---

## ⚙️ Fluxo de Carregamento

```
1. Arquivo .env é lido (dotenv carrega)
2. config.py lê env vars com os.getenv()
3. settings global oferece acesso centralizado
4. Aplicação usa settings em qualquer lugar
```

---

### ✅ Gere senhas seguras para o app

```bash
# Token seguro de 32 caracteres
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

