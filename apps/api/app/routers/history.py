from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.history import HistoryResponse, AnalysisItem
from app.services import history_service

router = APIRouter()


@router.get("", response_model=HistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return history_service.get_history(current_user.id, db)


@router.get("/{analysis_id}", response_model=AnalysisItem)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return history_service.get_by_id(current_user.id, analysis_id, db)


@router.delete("/{analysis_id}", status_code=204)
def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    history_service.delete(current_user.id, analysis_id, db)
