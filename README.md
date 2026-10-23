# 🫀 NasmaCare · نسمة كير

**AI that cares for your family, every day.**

A bilingual (Arabic/English, full RTL/LTR) family-wellbeing intelligence platform — built for
**"AI for Family"**, the **Advanced Track (Champions)** of the **6th COE STEM Competition —
Abu Dhabi University**, in celebration of the UAE **Year of Family 2026**.

> Modern families juggle fragmented health routines, medications, meals, schedules, and elder
> care — scattered across notes, memory, and guesswork. NasmaCare unifies all of it into one
> AI-powered family wellbeing platform, so care for the people you love stops being a burden
> and becomes intelligent, proactive, and shared.

## ✨ The five modules

| Module | What it does |
|---|---|
| 💊 **Smart Medication Intelligence** | Per-member schedules, adherence analytics, missed-dose risk, refill countdowns |
| 🍽️ **AI Meal Planner** | Constraint-solving weekly plans (allergies, conditions, AED budget) from 40+ bilingual recipes + auto shopping list |
| 📅 **Family Schedule Intelligence** | Unified week view with automatic conflict detection & AI resolution suggestions |
| 🛡️ **Elder Safety & Predictive Alerts** | BP/glucose trends, z-score anomaly detection, printable weekly health reports |
| 🤖 **Nasma AI Assistant** *(signature)* | Bilingual intent engine that understands Arabic & English and **acts** inside the app — no API key needed |

## ▶️ Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

**Demo account (one click on the login page):** `demo@nasmacare.com` / `demo1234`
— opens the Al Mansouri family home, fully populated.

## 🛠️ Tech stack

React 18 · Vite · TypeScript (strict) · Tailwind CSS · shadcn/ui · Framer Motion ·
React Router v6 · Zustand · react-i18next · Recharts · lucide-react · sonner ·
vite-plugin-pwa · Vitest

## 🗂️ Where things live

```
src/
  ai/          # offline AI engines (intent, meal solver, anomaly, summarizer)
  components/  # ui/ (shadcn) · shared/ · layout/ · brand/ · feature folders
  config/      # app.config.ts — modules, flags, demo creds, storage keys
  data/        # ✏️ ALL mock data — edit here (mockFamily, recipes, …)
  i18n/        # locales/en.json + ar.json — 100% of UI strings, zero hardcoding
  lib/         # api.ts (swappable data layer) · utils · motion variants
  pages/       # one file per route
  stores/      # Zustand stores per domain
  types/       # shared TypeScript types
docs/          # API_CONTRACT.md · AI_EXPLAINED.md (Phase 6)
```

Every major file starts with a `// ✏️ TEAM GUIDE:` header explaining what it does and how to
edit it safely. Brand colors: `src/index.css` (CSS variables) + `tailwind.config.ts`.

## 🔐 Notes

- Auth is local (Phase 1): salted **SHA-256 (Web Crypto)** password hashing, sessions in
  localStorage. The data layer (`src/lib/api.ts`) is shaped so a REST backend can replace it
  without touching the UI.
- Optional future LLM hook for the assistant lives behind `.env` keys — see `.env.example`.
  With no keys, the built-in offline bilingual intent engine runs everything.

## 🏗️ Build status

- ✅ **Phase 1 — Foundation & Auth Experience**: design system, logo, i18n/RTL engine,
  landing page, login/register (multi-step), onboarding wizard, demo account.
- ⏭️ Phase 2 — App shell & dashboard · Phase 3 — Medications & schedule ·
  Phase 4 — Meals & safety · Phase 5 — Nasma AI Assistant · Phase 6 — PWA & QA.
