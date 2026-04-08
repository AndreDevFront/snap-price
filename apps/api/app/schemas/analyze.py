from pydantic import BaseModel
from typing import Any


class PlatformPrice(BaseModel):
    name: str
    price: float
    url: str


class AnalyzeResponse(BaseModel):
    name: str
    category: str
    condition: str
    estimatedPrice: float
    priceRange: dict[str, float]
    confidence: float
    platforms: list[PlatformPrice]
    tips: list[str]
