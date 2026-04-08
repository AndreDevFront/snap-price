import base64
import json
import re

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.analyze import AnalyzeResponse

SYSTEM_PROMPT = """
Você é um especialista em avaliação de preços de produtos usados no mercado brasileiro.
Quando receber a imagem de um item, responda APENAS com JSON válido no seguinte formato:
{
  "name": "nome do produto com modelo/versão",
  "category": "categoria do produto",
  "condition": "Novo | Seminovo | Bom estado | Usado | Desgastado",
  "estimatedPrice": número em reais (BRL),
  "priceRange": { "min": número, "max": número },
  "confidence": número de 0 a 100 representando a confiança na avaliação,
  "platforms": [
    { "name": "Mercado Livre", "price": número, "url": "https://www.mercadolivre.com.br" },
    { "name": "OLX", "price": número, "url": "https://www.olx.com.br" },
    { "name": "Facebook", "price": número, "url": "https://www.facebook.com/marketplace" },
    { "name": "eBay", "price": número, "url": "https://www.ebay.com" }
  ],
  "tips": ["dica 1", "dica 2", "dica 3"]
}
Responda apenas com o JSON, sem explicações adicionais.
""".strip()


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> AnalyzeResponse:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64}"

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url, "detail": "high"},
                        },
                        {
                            "type": "text",
                            "text": "Avalie este item e retorne o JSON com o preço de mercado no Brasil.",
                        },
                    ],
                },
            ],
        )

        raw = response.choices[0].message.content or "{}"
        # Remove blocos markdown (```json ... ```)
        clean = re.sub(r"^```(?:json)?\n?", "", raw, flags=re.IGNORECASE)
        clean = re.sub(r"\n?```$", "", clean).strip()
        return AnalyzeResponse(**json.loads(clean))


openai_service = OpenAIService()
