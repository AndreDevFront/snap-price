import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, DateTime, JSON, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    item_name: Mapped[str] = mapped_column(String, nullable=False)
    estimated_min: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_max: Mapped[float] = mapped_column(Float, nullable=False)
    avg_price: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    platforms: Mapped[dict] = mapped_column(JSON, nullable=False)
    tips: Mapped[list] = mapped_column(ARRAY(String), nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    user: Mapped["User"] = relationship(back_populates="analyses")
