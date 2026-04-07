# 📸 SnapPrice

> Aponte a câmera para qualquer item usado e descubra o preço justo de mercado em segundos — powered by OpenAI Vision.

![Tech Stack](https://img.shields.io/badge/Expo-Router_v4-000?logo=expo&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo&logoColor=white)

---

## 🗂 Estrutura do Monorepo

```
snap-price/
├── apps/
│   ├── mobile/          # React Native + Expo Router v4
│   └── api/             # NestJS REST API
├── packages/
│   └── ui/              # Design System compartilhado
└── turbo.json
```

---

## 🚀 Roadmap por Sprints

| Sprint | Período | Status |
|--------|---------|--------|
| Sprint 1 — Fundação | Semana 1-2 | ✅ Concluído |
| Sprint 2 — Core Feature | Semana 3-4 | ✅ Concluído |
| Sprint 3 — Auth + Persistência | Semana 5-6 | 🟡 Em andamento |
| Sprint 4 — Polish + Deploy | Semana 7-8 | ⬜ Pendente |

---

## ✅ Sprint 1 — Fundação

- [x] Setup monorepo Turborepo
- [x] Expo Router v4 com tabs + stack navigation
- [x] Design System: tokens de cor, tipografia, componentes base
- [x] Tela Home com histórico mockado
- [x] Tela de câmera com Expo Camera

## ✅ Sprint 2 — Core Feature

- [x] Backend NestJS + endpoint `POST /api/v1/analyze`
- [x] Integração OpenAI Vision (GPT-4o) com fallback mock
- [x] Tela de resultado conectada ao dado real
- [x] TanStack Query `useMutation` + Zustand store
- [x] `analyzeImage` service + `useAnalyze` hook
- [x] Dockerfile + docker-compose para a API

## 🟡 Sprint 3 — Auth + Persistência

- [ ] Tela de login/cadastro
- [ ] JWT + Prisma + PostgreSQL
- [ ] Histórico real salvo no banco
- [ ] Perfil do usuário

## ⬜ Sprint 4 — Polish + Deploy

- [ ] Animações Reanimated 3
- [ ] Testes Maestro E2E
- [ ] EAS Build + Deploy nas stores
- [ ] Monetização: Expo IAP (plano Pro)

---

## ⚙️ Como rodar

### Pré-requisitos
- Node.js >= 20
- npm >= 10

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
# API
cp apps/api/.env.example apps/api/.env
# Edite apps/api/.env e adicione sua OPENAI_API_KEY

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

### 3. Rodar a API
```bash
npm run dev --filter=api
# ou com Docker:
cd apps/api && docker-compose up
```

### 4. Rodar o app mobile
```bash
npm run dev --filter=mobile
```

---

## 🛠 Stack Completa

**Mobile:** React Native · Expo SDK 52 · Expo Router v4 · TypeScript · Reanimated 3 · TanStack Query · Zustand · Expo Camera · Expo IAP

**Backend:** NestJS · TypeScript · Prisma · PostgreSQL · JWT · OpenAI Vision API (GPT-4o)

**Infra:** Turborepo · Docker · EAS Build · EAS Submit · GitHub Actions

---

## 👨‍💻 Autor

**André Luz da Silva** — Frontend Engineer Sênior · React · React Native · Next.js

[![GitHub](https://img.shields.io/badge/GitHub-AndreDevFront-181717?logo=github)](https://github.com/AndreDevFront)
