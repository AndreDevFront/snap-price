from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine
from app.db import base  # noqa: F401 — importa todos os models para o Alembic ver
from app.routers import auth, analyze, history, health

app = FastAPI(
    title="SnapPrice API",
    version="1.0.0",
    description="API de avaliação de preços por imagem usando OpenAI Vision",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(history.router, prefix="/history", tags=["history"])
