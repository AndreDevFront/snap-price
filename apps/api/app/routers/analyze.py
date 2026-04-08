from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.analysis import Analysis
from app.schemas.analyze import AnalyzeResponse
from app.services.openai_service import openai_service

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

router = APIRouter()


@router.post("", response_model=AnalyzeResponse, status_code=201)
async def analyze_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Formato não suportado. Use JPEG, PNG, WEBP ou GIF.",
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Imagem muito grande. Máximo 10MB.",
        )

    result = await openai_service.analyze_image(image_bytes, file.content_type)

    analysis = Analysis(
        user_id=current_user.id,
        item_name=result.name,
        estimated_min=result.priceRange["min"],
        estimated_max=result.priceRange["max"],
        avg_price=result.estimatedPrice,
        confidence=result.confidence,
        platforms=[p.model_dump() for p in result.platforms],
        tips=result.tips,
    )
    db.add(analysis)
    db.commit()

    return result
