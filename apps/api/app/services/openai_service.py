import base64
import json
import re

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.analyze import AnalyzeResponse

SYSTEM_PROMPT = """
Você é um especialista em avaliação de preços de produtos usados no mercado brasileiro.

Quando receber a imagem de um item, identifique o produto e pesquise onde ele é realmente vendido.
Retorne APENAS JSON válido no seguinte formato:

{
  "name": "nome do produto com marca, modelo e versão quando identificável",
  "category": "categoria do produto",
  "condition": "Novo | Seminovo | Bom estado | Usado | Desgastado",
  "estimatedPrice": número em reais (BRL) representando o preço médio de mercado,
  "priceRange": { "min": número, "max": número },
  "confidence": número de 0 a 100 representando a confiança na avaliação,
  "platforms": [
    { "name": "Nome real da plataforma", "price": número, "url": "URL de busca real" }
  ],
  "tips": ["dica prática 1", "dica prática 2", "dica prática 3"]
}

Regras importantes para o campo "platforms":
- Inclua exatamente 4 plataformas onde este tipo de produto é REALMENTE comercializado no Brasil
- Escolha as plataformas mais relevantes para o item específico (ex: para eletrônicos use Mercado Livre, Shopee, OLX, Amazon; para roupas use Enjoei, Shopee, OLX, Mercado Livre; para veículos use OLX, Webmotors, iCarros, Mercado Livre; para imóveis use ZAP, Viva Real, OLX, Quinto Andar; para livros use Estante Virtual, Mercado Livre, OLX, Enjoei)
- Não repita plataformas
- Os preços devem refletir o valor real praticado em cada plataforma (podem variar entre si)
- A URL deve ser a URL de busca do produto naquela plataforma

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
            temperature=0.2,
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
                            "text": "Identifique este item e retorne o JSON com preços reais das plataformas mais relevantes para este tipo de produto no Brasil.",
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
