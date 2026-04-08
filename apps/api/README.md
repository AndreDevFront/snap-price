# SnapPrice API — FastAPI

Backend da aplicação SnapPrice construído com **FastAPI + SQLAlchemy + Alembic**.

## Stack

- **FastAPI** — framework web async
- **SQLAlchemy 2.0** — ORM com Mapped columns
- **Alembic** — migrations
- **PostgreSQL** — banco de dados
- **OpenAI Vision (gpt-4o)** — análise de imagens
- **JWT** (python-jose) — autenticação
- **Passlib + bcrypt** — hash de senhas

## Setup

```bash
# 1. Cria e ativa o ambiente virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/Mac

# 2. Instala as dependências
pip install -r requirements.txt

# 3. Copia o .env
copy .env.example .env        # Windows
cp .env.example .env          # Linux/Mac
# Edita o .env com suas credenciais

# 4. Roda as migrations
alembic upgrade head

# 5. Seed (opcional)
python scripts/seed.py

# 6. Sobe o servidor
uvicorn app.main:app --reload --port 3000
```

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | ❌ | Health check |
| POST | `/auth/register` | ❌ | Cadastro |
| POST | `/auth/login` | ❌ | Login |
| GET | `/auth/me` | ✅ | Perfil do usuário |
| POST | `/analyze` | ✅ | Analisa imagem |
| GET | `/history` | ✅ | Histórico de análises |

## Docs

Com o servidor rodando, acesse:
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc
