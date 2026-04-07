import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';

const SYSTEM_PROMPT = `
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
`.trim();

@Injectable()
export class OpenAIService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<AnalyzeResponseDto> {
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: 'Avalie este item e retorne o JSON com o preço de mercado no Brasil.',
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    // Remove possíveis blocos markdown (```json ... ```)
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean) as AnalyzeResponseDto;
  }
}
