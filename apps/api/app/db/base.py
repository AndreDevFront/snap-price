# Importa todos os models para o Alembic detectar automaticamente
from app.db.session import Base  # noqa
from app.models.user import User  # noqa
from app.models.analysis import Analysis  # noqa
