"""Seed inicial — cria um usuário de teste."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

def seed():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "test@snapprice.com").first():
            db.add(User(email="test@snapprice.com", name="Usuário Teste", password=hash_password("123456")))
            db.commit()
            print("✅ Seed concluído — test@snapprice.com / 123456")
        else:
            print("ℹ️  Seed já aplicado")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
