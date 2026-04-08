from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.schemas.history import HistoryResponse, HistoryStats


def get_history(user_id: str, db: Session) -> HistoryResponse:
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )

    total = len(analyses)
    avg_confidence = (
        sum(a.confidence for a in analyses) / total if total > 0 else 0.0
    )
    total_value = sum(a.avg_price for a in analyses)

    return HistoryResponse(
        items=analyses,
        stats=HistoryStats(
            total=total,
            avg_confidence=round(avg_confidence, 2),
            total_value=round(total_value, 2),
        ),
    )
