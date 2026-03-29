# 🧠 PsiAgent - Assistente Clínico Local

O **PsiAgent** é uma solução *open-source* projetada para psicólogos clínicos que desejam o poder da Inteligência Artificial na gestão de seus consultórios, sem comprometer o sigilo dos dados dos pacientes. Todo o processamento (Banco de Dados e LLM) ocorre localmente na máquina do profissional, eliminando riscos de vazamento em nuvem.

O projeto foi criado com intuito didático, focando em aprender como FastAPI, React, MCP e lógica agêntica conversam.

Nota: Como o projeto é completamente local, ele está sujeito a capacidade computacional local do usuário. Os modelos escolhidos, por padrão, são pequenos.

![Status](https://img.shields.io/badge/Status-Beta_v2.0-purple)  
![Stack](https://img.shields.io/badge/Tech-FastAPI_React_SQLite-blue)  
![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-green)

---

## Funcionalidades

### Core & Backend (Python)

- **Arquitetura MCP (Model Context Protocol):** Separação limpa entre o agente IA (LangGraph em `helpers/`) e as ferramentas (`mcp_server/`).
- **Persistência Zero-Config:** **SQLite** nativo em `db/clinical_data.db`, garantindo portabilidade instantânea sem Docker.
- **Memória Contextual:** Utilização do `LangGraph` com `MemorySaver` para manter o contexto da conversa ativo durante o atendimento.
- **API Segura:** FastAPI servindo endpoints protegidos via `Bearer Token`, com validação Pydantic rigorosa.

### Interface (em React)

- **Smart Rendering:** Suporte nativo a **Markdown** no chat (listas, negritos, tabelas) para estruturação de anotações clínicas.
- **Gestão Visual de Pacientes:**
  - **Sidebar Dinâmica:** Status de dívida em tempo real e seleção rápida.
  - **Patient Drawer:** Histórico completo de sessões acessível sem sair do chat.
  - **Edição In-Place:** Clique em qualquer nota antiga para corrigir ou complementar informações instantaneamente.
- **Sincronização em Tempo Real:** Ações do agente (ex: "registre o pagamento") refletem imediatamente na interface financeira.

---

<img width="1657" height="957" alt="image" src="https://github.com/user-attachments/assets/869a7808-b85b-4f81-af2b-d20b8371b9da" />
<img width="1645" height="956" alt="image" src="https://github.com/user-attachments/assets/2f02bb52-4c70-4acf-8a7e-caa509993b15" />
<img width="1651" height="942" alt="image" src="https://github.com/user-attachments/assets/443057b4-9a8b-4a34-a899-cd46abb3bada" />
<img width="1637" height="942" alt="image" src="https://github.com/user-attachments/assets/527b897b-220b-442f-b5ed-ce09c88e5693" />
<img width="407" height="918" alt="image" src="https://github.com/user-attachments/assets/12a0be48-4635-4077-9699-f8823bc0acc4" />






## Estrutura

O código foi reorganizado em módulos independentes para melhor manutenção:

```
psiagent/
├── db/              #  Modelos de Banco de Dados (SQLAlchemy)
├── main/            #  FastAPI App (Endpoints HTTP)
├── mcp_server/      #  Servidor MCP (Clinical Tools)
├── helpers/         #  Agente IA & Prompts (LangGraph)
└── psi-interface/   #  Frontend React
```

Detalhes em [STRUCTURE.md](STRUCTURE.md).

---

##  Como Rodar (Desenvolvimento)

### Pré-requisitos

- Python 3.12+ (Poetry para gerenciar dependências)
- Node.js 18+
- Ollama (rodando com modelo ex: `qwen3:8b`, `ministral-3:3b`)

---

### Setup Inicial

```bash
# Instale dependências Python
poetry install

# Crie o banco de dados
poetry run python db/models.py
```

---

### 1. Backend (3 componentes - execute em abas diferentes)

#### Terminal 1: Servidor MCP (Clinical Tools)
```bash
poetry run python mcp_server.py
```
→ Roda em `http://127.0.0.1:8000/sse`

#### Terminal 2: API FastAPI
```bash
poetry run uvicorn main:app --reload --port 8001
```
→ Roda em `http://127.0.0.1:8001` (config via .env)

#### Terminal 3: Ollama (ou execute separadamente)
```bash
ollama serve
```
→ Certifique-se que está rodando com algum modelo (ex: ministral-3:3b)

---
## ⚙️ Sistema de Configuração

Todas as configurações usam **variáveis de ambiente** para máxima robustez:

### Quick Config

```bash
# Arquivo .env já existe com valores padrão
# Para customizar:
nano .env

# Exemplos:
LLM_MODEL=ministral-3:3b  # Trocar modelo IA
API_PORT=9001             # Trocar porta
API_HOST=0.0.0.0          # Aceitar conexões externas
```

### Configurações Principais

| Variável | Padrão | O que faz |
|----------|--------|----------|
| `LLM_MODEL` | `qwen3:8b` | Modelo de IA via Ollama |
| `API_HOST` | `127.0.0.1` | Host da API (0.0.0.0 = externo) |
| `API_PORT` | `8001` | Porta da API |
| `MCP_HOST` | `127.0.0.1` | Host do servidor MCP |
| `MCP_PORT` | `8000` | Porta do MCP |
| `DEBUG` | `true` | Modo debug |
| `RELOAD` | `true` | Auto-reload uvicorn |
| `API_SECRET` | (você seta) | Token autenticação  |

### Consultar Configurações Ativas

```bash
poetry run python config.py
```

Mostra todas as env vars carregadas e URLs construídas automaticamente.

📖 **Documentação completa em [CONFIG.md](CONFIG.md)**

---

## ✅ Testes & Validação

### Verificar Configuração Carregada

```bash
poetry run python config.py
```

Exibe todas as variáveis de ambiente ativas (LLM, API, MCP, Database, etc).

---

### 2. Frontend (UI)

```bash
cd psi-interface
npm install
npm run dev
```

→ Acesse em: **http://localhost:5173**

<p align="center">
  <sub>Desenvolvido com foco em Ética e Privacidade. Nenhum dado sai da sua máquina.</sub>
</p>
