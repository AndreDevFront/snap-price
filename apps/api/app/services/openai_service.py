import base64
import json
import re

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.analyze import AnalyzeResponse

# Prompt para identificar o produto pela imagem (gpt-4o com visão)
IDENTIFY_PROMPT = (
    "Identify this product in up to 10 words: brand, model, version. "
    "Reply ONLY with the product name, nothing else."
)

# Prompt para buscar preços reais na internet (gpt-4o-search-preview, texto-only)
SEARCH_PROMPT = """
You are a pricing expert for the Brazilian second-hand market.

Search the internet RIGHT NOW for the current price of "{product_name}" on Brazilian buy/sell platforms.

Rules:
- Find REAL and CURRENT prices from the platforms where this product is actually sold
- Pick the 4 most relevant platforms for this specific product type (do NOT always use the same ones)
- Use real listing URLs found during your search
- Prices must reflect what is being charged TODAY
- Respond ONLY with valid JSON, no extra text, no markdown

Required JSON format (use EXACTLY these English field names):
{{
  "name": "full product name",
  "category": "product category in Portuguese",
  "condition": "Novo | Seminovo | Bom estado | Usado | Desgastado",
  "estimatedPrice": average price as number,
  "priceRange": {{ "min": min_value, "max": max_value }},
  "confidence": number 0 to 100,
  "platforms": [
    {{ "name": "Platform Name", "price": numeric_value, "url": "https://real-listing-url" }}
  ],
  "tips": ["tip 1 in Portuguese", "tip 2 in Portuguese", "tip 3 in Portuguese"]
}}
""".strip()

# Prompt fallback caso o search falhe (gpt-4o com visão)
FALLBACK_SYSTEM = (
    "You are a pricing expert for the Brazilian market. "
    "Always respond ONLY with valid JSON using EXACTLY these English field names: "
    "name, category, condition, estimatedPrice, priceRange (with min and max), "
    "confidence, platforms (array of objects with name, price, url), tips (array of strings). "
    "Use Portuguese for category, condition, and tips values. No extra text."
)


def _clean_json(raw: str) -> str:
    """Remove blocos markdown e espaços extras."""
    clean = re.sub(r"^```(?:json)?\n?", "", raw, flags=re.IGNORECASE)
    clean = re.sub(r"\n?```$", "", clean).strip()
    return clean


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> AnalyzeResponse:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64}"

        # Passo 1: identificar o produto pela imagem (gpt-4o com visão)
        id_response = await self.client.chat.completions.create(
            model="gpt-4o",
            max_tokens=80,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url, "detail": "low"}},
                        {"type": "text", "text": IDENTIFY_PROMPT},
                    ],
                }
            ],
        )
        product_name = (id_response.choices[0].message.content or "product").strip()

        # Passo 2: buscar preços reais com gpt-4o-search-preview (texto-only, acessa internet)
        try:
            search_response = await self.client.chat.completions.create(
                model="gpt-4o-search-preview",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": SEARCH_PROMPT.format(product_name=product_name),
                    }
                ],
                web_search_options={},
            )
            raw = search_response.choices[0].message.content or ""
            clean = _clean_json(raw)
            data = json.loads(clean)
            return AnalyzeResponse(**data)
        except Exception:
            pass

        # Passo 3 (fallback): gpt-4o com visão, prompt rígido em inglês
        fallback_response = await self.client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            temperature=0.1,
            messages=[
                {"role": "system", "content": FALLBACK_SYSTEM},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                        {
                            "type": "text",
                            "text": (
                                f'Product: "{product_name}". '
                                "Return the JSON evaluation with prices from the 4 most relevant "
                                "Brazilian platforms for this product type. "
                                "IMPORTANT: use only these exact field names in English as shown."
                            ),
                        },
                    ],
                },
            ],
        )
        raw2 = fallback_response.choices[0].message.content or "{}"
        clean2 = _clean_json(raw2)
        return AnalyzeResponse(**json.loads(clean2))


openai_service = OpenAIService()
