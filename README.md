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
│   └── api/             # NestJS REST API (Sprint 2)
├── packages/
│   └── ui/              # Design System compartilhado
└── turbo.json
```

---

## 🚀 Roadmap por Sprints

| Sprint | Período | Status |
|--------|---------|--------|
| Sprint 1 — Fundação | Semana 1-2 | 🟡 Em andamento |
| Sprint 2 — Core Feature | Semana 3-4 | ⬜ Pendente |
| Sprint 3 — Auth + Persistência | Semana 5-6 | ⬜ Pendente |
| Sprint 4 — Polish + Deploy | Semana 7-8 | ⬜ Pendente |

---

## 🛠 Sprint 1 — Fundação

- [x] Setup monorepo Turborepo
- [x] Expo Router v4 com tabs + stack navigation
- [x] Design System: tokens de cor, tipografia, componentes base
- [x] Tela Home com histórico mockado
- [x] Tela de câmera com Expo Camera

## ⚙️ Sprint 2 — Core Feature

- [ ] Backend NestJS + endpoint `/analyze`
- [ ] Integração OpenAI Vision
- [ ] Tela de resultado com preços e confiança
- [ ] TanStack Query + Zustand

## 🔐 Sprint 3 — Auth + Persistência

- [ ] Tela de login/cadastro
- [ ] JWT + Prisma + PostgreSQL
- [ ] Histórico real salvo no banco
- [ ] Perfil do usuário

## ✨ Sprint 4 — Polish + Deploy

- [ ] Animações Reanimated 3
- [ ] Testes Maestro E2E
- [ ] EAS Build + Deploy nas stores
- [ ] Monetização: Expo IAP (plano Pro)

---

## 📦 Como rodar

```bash
# Instalar dependências
npm install

# Rodar todos os apps em paralelo
npm run dev

# Rodar só o mobile
npm run dev --filter=mobile

# Rodar só a API
npm run dev --filter=api
```

---

## 🧰 Stack Completa

**Mobile:** React Native · Expo SDK 52 · Expo Router v4 · TypeScript · Reanimated 3 · TanStack Query · Zustand · Expo Camera · Expo IAP

**Backend:** NestJS · TypeScript · Prisma · PostgreSQL · JWT · OpenAI Vision API

**Infra:** Turborepo · EAS Build · EAS Submit · GitHub Actions

---

## 👨‍💻 Autor

**André Luz da Silva** — Frontend Engineer Sênior · React · React Native · Next.js

[![GitHub](https://img.shields.io/badge/GitHub-AndreDevFront-181717?logo=github)](https://github.com/AndreDevFront)
