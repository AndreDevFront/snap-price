# SnapPrice API

> NestJS REST API — implementada na **Sprint 2**.

## Stack planejada

- **NestJS** — framework principal
- **TypeScript** — strict mode
- **Prisma** — ORM (Sprint 3)
- **PostgreSQL** — banco de dados (Sprint 3)
- **OpenAI Vision API** — análise de imagens
- **JWT** — autenticação (Sprint 3)
- **Docker** — containerização

## Endpoint principal

```
POST /analyze
Content-Type: multipart/form-data

{ image: File }

Response:
{
  name: string
  category: string
  estimatedPrice: number
  priceRange: { min: number; max: number }
  confidence: number
  platforms: Array<{ name: string; price: number }>
  tips: string[]
}
```

## Rodar (Sprint 2+)

```bash
cd apps/api
npm install
npm run dev
```
