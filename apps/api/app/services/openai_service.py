import base64
import json
import re

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.analyze import AnalyzeResponse
from app.services.search_service import search_real_prices

SYSTEM_PROMPT_BASE = """
Você é um especialista em avaliação de preços de produtos usados no mercado brasileiro.

Quando receber a imagem de um item, identifique o produto e retorne APENAS JSON válido no seguinte formato:

{
  "name": "nome do produto com marca, modelo e versão quando identificável",
  "category": "categoria do produto",
  "condition": "Novo | Seminovo | Bom estado | Usado | Desgastado",
  "estimatedPrice": número em reais (BRL) representando o preço médio de mercado,
  "priceRange": { "min": número, "max": número },
  "confidence": número de 0 a 100 representando a confiança na avaliação,
  "platforms": [
    { "name": "Nome da plataforma", "price": número, "url": "URL de busca" }
  ],
  "tips": ["dica prática 1", "dica prática 2", "dica prática 3"]
}

Responda apenas com o JSON, sem explicações adicionais.
""".strip()

SYSTEM_PROMPT_WITH_SEARCH = """
Você é um especialista em avaliação de preços de produtos usados no mercado brasileiro.

Já foram realizadas buscas reais nas principais plataformas brasileiras e os resultados estão abaixo.
Use-os como base para preencher o campo "platforms" do JSON — mantenha os preços e URLs reais encontrados.
Se os resultados da busca tiverem menos de 4 plataformas, complemente com estimativas para atingir 4.

Retorne APENAS JSON válido no seguinte formato:

{
  "name": "nome do produto com marca, modelo e versão quando identificável",
  "category": "categoria do produto",
  "condition": "Novo | Seminovo | Bom estado | Usado | Desgastado",
  "estimatedPrice": número em reais (BRL) — use a média dos preços encontrados,
  "priceRange": { "min": número, "max": número },
  "confidence": número de 0 a 100 representando a confiança na avaliação,
  "platforms": [
    { "name": "Nome da plataforma", "price": número, "url": "URL real da listagem" }
  ],
  "tips": ["dica prática 1", "dica prática 2", "dica prática 3"]
}

Responda apenas com o JSON, sem explicações adicionais.
""".strip()


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> AnalyzeResponse:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64}"

        # Passo 1: identificar o produto pela imagem (resposta rápida, sem plataformas)
        id_response = await self.client.chat.completions.create(
            model="gpt-4o",
            max_tokens=80,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url, "detail": "low"}},
                        {"type": "text", "text": "Identifique este produto em até 10 palavras: marca, modelo, versão. Responda apenas o nome do produto."},
                    ],
                }
            ],
        )
        product_name = (id_response.choices[0].message.content or "").strip()

        # Passo 2: buscar preços reais nas plataformas
        real_prices = await search_real_prices(product_name)

        # Passo 3: montar o prompt com ou sem resultados reais
        if real_prices:
            search_context = "\n".join(
                f"- {p['name']}: R$ {p['price']:.2f} → {p['url']}" for p in real_prices
            )
            system_prompt = SYSTEM_PROMPT_WITH_SEARCH
            user_text = (
                f"Produto identificado: {product_name}\n\n"
                f"Resultados reais encontrados nas plataformas:\n{search_context}\n\n"
                "Retorne o JSON de avaliação usando os preços reais acima."
            )
        else:
            system_prompt = SYSTEM_PROMPT_BASE
            user_text = (
                "Identifique este item e retorne o JSON com preços estimados "
                "das plataformas mais relevantes para este tipo de produto no Brasil."
            )

        # Passo 4: geração final do JSON completo
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                        {"type": "text", "text": user_text},
                    ],
                },
            ],
        )

        raw = response.choices[0].message.content or "{}"
        clean = re.sub(r"^```(?:json)?\n?", "", raw, flags=re.IGNORECASE)
        clean = re.sub(r"\n?```$", "", clean).strip()
        return AnalyzeResponse(**json.loads(clean))


openai_service = OpenAIService()
