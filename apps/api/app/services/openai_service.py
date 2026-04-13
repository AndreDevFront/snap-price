import base64
import json
import re

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.analyze import AnalyzeResponse

IDENTIFY_PROMPT = "Identifique este produto em até 10 palavras: marca, modelo, versão. Responda apenas o nome do produto."

SEARCH_PROMPT = """
Você é um especialista em avaliação de preços no mercado brasileiro.

Pesquise NA INTERNET agora o preço atual do produto "{product_name}" nas principais plataformas brasileiras de compra e venda onde ele é comercializado.

Regras:
- Busque preços REAIS e ATUAIS das plataformas onde este produto é realmente vendido
- Escolha as 4 plataformas mais relevantes para este tipo de produto (não use sempre as mesmas)
- Use URLs reais das listagens encontradas
- Os preços devem refletir o valor real praticado hoje

Retorne APENAS JSON válido neste formato:
{{
  "name": "nome completo do produto",
  "category": "categoria",
  "condition": "Novo | Seminovo | Bom estado | Usado | Desgastado",
  "estimatedPrice": preço médio em reais,
  "priceRange": {{ "min": valor_minimo, "max": valor_maximo }},
  "confidence": 0 a 100,
  "platforms": [
    {{ "name": "Nome da Plataforma", "price": valor_numerico, "url": "https://url-real-do-anuncio" }}
  ],
  "tips": ["dica 1", "dica 2", "dica 3"]
}}

Responda apenas com o JSON, sem texto adicional.
""".strip()


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> AnalyzeResponse:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64}"

        # Passo 1: identificar o produto pela imagem
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
        product_name = (id_response.choices[0].message.content or "produto").strip()

        # Passo 2: buscar preços reais com gpt-4o-search-preview (acesso à internet)
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

        raw = search_response.choices[0].message.content or "{}"
        clean = re.sub(r"^```(?:json)?\n?", "", raw, flags=re.IGNORECASE)
        clean = re.sub(r"\n?```$", "", clean).strip()

        try:
            return AnalyzeResponse(**json.loads(clean))
        except Exception:
            # Fallback: gpt-4o normal caso search retorne texto inválido
            fallback = await self.client.chat.completions.create(
                model="gpt-4o",
                max_tokens=1024,
                temperature=0.2,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em preços do mercado brasileiro. Retorne apenas JSON válido.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                            {
                                "type": "text",
                                "text": f"Produto: {product_name}. Retorne o JSON de avaliação com preços das plataformas mais relevantes para este produto no Brasil.",
                            },
                        ],
                    },
                ],
            )
            raw2 = fallback.choices[0].message.content or "{}"
            clean2 = re.sub(r"^```(?:json)?\n?", "", raw2, flags=re.IGNORECASE)
            clean2 = re.sub(r"\n?```$", "", clean2).strip()
            return AnalyzeResponse(**json.loads(clean2))


openai_service = OpenAIService()
