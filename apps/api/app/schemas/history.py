from pydantic import BaseModel
from datetime import datetime
from typing import Any


class AnalysisItem(BaseModel):
    id: str
    item_name: str
    estimated_min: float
    estimated_max: float
    avg_price: float
    confidence: float
    platforms: Any
    tips: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryStats(BaseModel):
    total: int
    avg_confidence: float
    total_value: float


class HistoryResponse(BaseModel):
    items: list[AnalysisItem]
    stats: HistoryStats
