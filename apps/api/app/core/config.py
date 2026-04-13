from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    OPENAI_API_KEY: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 dias
    CORS_ORIGINS: List[str] = ["*"]

    # Google Custom Search (opcional — sem essas vars o GPT estima os preços)
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_CSE_ID: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
