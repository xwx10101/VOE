# FamilyMind AI

**Understand the signals. Strengthen the family.**

FamilyMind AI is a competition-ready prototype of a privacy-conscious, multi-generational family
wellbeing platform. It connects the everyday signals a family chooses to share, explains what needs
attention, and turns that understanding into a small, editable family plan.

Everything runs in the browser with deterministic logic. There is no backend, no account, and no live
model dependency.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build (tsc + vite)
npm run preview    # preview the production build
npm run typecheck  # strict TypeScript check
npm run test       # 56 Vitest unit + component tests
```

The first visit shows a ~22 second cinematic introduction. It is skippable, pausable, replayable, plays
once per browser session, and degrades to a static card under `prefers-reduced-motion`.

## Routes

| Route         | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `/`           | Public landing page, problem narrative, interactive preview, impact      |
| `/onboarding` | Five-step household setup, with **Use Al Noor Demo Family**              |
| `/assessment` | Eight-question family check-in with review, goals, and private note     |
| `/results`    | Explainable Harmony Score, categories, strengths, prioritised actions    |
| `/dashboard`  | Nine household cards, each with a real action or drill-down              |
| `/coach`      | AI Family Coach — scenario chips, simulated streaming, safety routing    |
| `/plan`       | Seven-day plan: edit, replace, complete, reduce workload, print          |
| `/schedule`   | Week/day schedule, conflicts, overload, optimisation proposals, undo     |
| `/student`    | Student Support: workload, study blocks, break timer, sharing controls   |
| `/care`       | Older Adult Care: dignified routines, two-stage backup, memory prompt    |
| `/memories`   | Memory Vault CRUD with search, filters, visibility, empty/error states   |
| `/trust`      | Trust Center: 13 sections, privacy matrix, interactive explanation       |
| `/demo`       | Eight-step deterministic judge demonstration (3–5 minutes)               |

Unknown routes render a real 404 screen, not a blank page.

## The demonstration household

The **Al Noor family** (Omar 44, Mariam 41, Zayed 16, Latifa 12, Fatima 70) is loaded as deterministic
demo data. The demo check-in always produces **45 / Needs Attention**, because the scoring is a fixed
subtraction table rather than a model.

### Scoring

Start at 100 and subtract the reported severity of each answered question (stress −8/−18/−28,
communication −6/−14/−22, family time −5/−11/−18, task distribution −6/−13/−20, student pressure
−5/−12/−18, care continuity −7/−15, missed routines −4/−8/−12, rest −5/−12), clamp to 0–100.

| Score  | Status                     |
| ------ | -------------------------- |
| 80–100 | Strong Foundation          |
| 60–79  | Stable with Opportunities  |
| 40–59  | Needs Attention            |
| 0–39   | Priority Support           |

Category scores (Connection, Responsibility Balance, Student Support, Care Continuity, Rest and
Recovery) are integer values derived from the same answers. Every result exposes a “How this was
calculated” panel listing each deduction.

Recommendations, plan generation, schedule optimisation, and coach responses are all pure functions of
the same inputs — identical inputs always produce identical output.

## Presenter flow (about 4 minutes)

1. **`/demo`** → *Meet the Al Noor family* (three generations, one ordinary week).
2. *Discover the connected signals* → the Wednesday overlap.
3. *Complete the check-in* → deterministic **45 / Needs Attention**, with every deduction listed.
4. *Understand the recommendation* → open the reasoning panel; the family controls the outcome.
5. *Generate the weekly plan* → seven actions, max two a day, each with a reason.
6. *Optimise the schedule* → select proposals, apply, and show before/after responsibility split.
7. *Review privacy* → the matrix: private entries never enter household summaries.
8. *Final actions* → “FamilyMind AI does not replace the family’s judgment.”

Press `←` / `→` to move between steps, **Restart** to reset the deterministic state, **Presenter notes**
for talking points, **Exit demo** to explore the rest of the product.

## Architecture

```
src/
  components/
    layout/       PublicLayout, AppShell, Brand, CinematicIntro
    shared/       Button, ScoreRing, Charts, Modal, Feedback, Explainability
    marketing/    HeroSignalPreview
  data/           demo household, assessment questions, navigation
  lib/            scoring, recommendations, scheduleOptimizer, safety, ai, storage
  pages/          one module per route
  state/          FamilyContext (state + localStorage persistence)
  styles/         design tokens, components, motion, print
  tests/          unit + component + journey tests
  types/          central domain types
```

- **Deterministic engine** — `lib/scoring.ts`, `lib/recommendations.ts`, `lib/scheduleOptimizer.ts`.
- **AI abstraction** — `lib/ai.ts` exposes a `CoachProvider` interface with a local rules provider and a
  disabled remote-provider stub. A live model can be added behind a server proxy; no keys are read in
  the browser.
- **Safety layer** — `lib/safety.ts` classifies crisis, sensitive, and ordinary messages. Crisis language
  stops ordinary coaching, never invents hotline numbers, and directs the family to human support.
- **Storage** — `lib/storage.ts` uses namespaced keys (`familymind:v1:*`), guards every browser API, and
  falls back safely when storage is blocked or corrupted.
- **Optimisation** — `scheduleOptimizer.ts` proposes changes only. Nothing is applied until the family
  selects and confirms; an undo snapshot is kept.
- **Error handling** — route-level error boundary, empty states, storage fallbacks, and a deterministic
  coach fallback. No technical stack traces are shown.

## Accessibility

Semantic landmarks and a skip link; visible focus rings; native radio groups and `<dialog>` modals with
focus restoration; field labels and descriptions; inline validation plus an error summary; ARIA live
regions for generated results; textual summaries and legends for every chart; 44px primary touch
targets; `prefers-reduced-motion` support; no zoom blocking; no colour-only status.

## Privacy and ethics

- No diagnosis, no emergency monitoring, no clinical claims.
- Private journals, exact mood notes, and coach conversations never enter household summaries.
- Consent is per member and revocable; there is no secret monitoring, tracking, camera, microphone, or
  location access, and no analytics.
- Local data only, with **Restore Al Noor demo** and **Clear all local data** controls in Trust & Safety.
- Prototype metrics are labelled as illustrative and are not clinical outcomes.

## Testing

`npm run test` runs 56 tests covering:

- scoring, status bands, category ranges, incomplete answers, determinism
- recommendations and weekly plan constraints (max two actions per day)
- schedule proposals, move/backup/add-event application, conflicts, balance, free windows
- safety classification, sanitisation, crisis routing, coach response structure
- page rendering for every core module (jsdom)
- journeys: complete the check-in → 45 result, plan completion, optimisation apply/undo, memory CRUD

## Notes and limitations

- The prototype is English-only; Arabic RTL is deliberately not half-implemented.
- Nothing is scientifically validated. The Harmony Score is a prioritisation aid for the family, not a
  judgement about any person.
- The cinematic intro uses only SVG, CSS, and a requestAnimationFrame timeline (no video, no audio).
