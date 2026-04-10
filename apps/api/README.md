# SnapPrice API

Backend FastAPI + PostgreSQL + SQLAlchemy.

## Setup local (desenvolvimento)

### 1. Crie o `.env`
```bash
cp .env.example .env
# Edite com sua OPENAI_API_KEY
```

> O `.env.example` já usa `localhost` como host do banco — correto para dev local.

### 2. Suba o banco via Docker
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Ative o ambiente virtual e instale dependências
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Rode as migrations
```bash
alembic upgrade head
```

### 5. Suba a API
```bash
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

Acesse: http://localhost:3000/docs

---

## Produção (Docker completo)

```bash
# Sobe API + banco juntos
docker-compose up -d
```

> Em produção o host do banco é `postgres` (nome do container na rede Docker).
> Defina `DATABASE_URL` via variável de ambiente — não commite o `.env` com secrets reais.

---

## Variáveis de ambiente

| Variável | Descrição | Dev default |
|---|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://postgres:postgres@localhost:5432/snapprice` |
| `OPENAI_API_KEY` | Chave da OpenAI | — |
| `SECRET_KEY` | Chave JWT | qualquer string segura |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiração do token | `10080` (7 dias) |
