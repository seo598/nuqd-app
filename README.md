# NUQD — Digital Wealth App

A production-quality, **mobile-first** digital-wealth app: portfolio tracking, trading (buy/sell/swap), earn/savings, send/receive, activity, and profile — all fully interactive on **mock data**, with no backend required.

Built to feel more polished than a typical crypto wallet: sub-second perceived load with skeletons, optimistic UI, smooth 60fps SVG charts, graceful empty/loading/error states everywhere, light + dark themes, and accessible-by-default components.

> Demo software. No real funds, keys, or transactions. The recovery-phrase and address flows are illustrative.

---

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) + **TypeScript** | File-based stack navigation, RSC-ready, fast dev loop |
| Styling | **Tailwind CSS** wired to CSS variables | One utility set drives both light & dark themes from a single token source |
| State | **Zustand** (persisted) | Tiny, ergonomic; holds theme/session/settings/watchlist |
| Charts | **Hand-rolled SVG** (no chart lib) | Small bundle + full control over 60fps scrubbing |
| Icons | **lucide-react** | Consistent, tree-shakeable |
| Tests | **Vitest** | Fast unit tests for formatters and the mock API |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure (optional — sensible defaults exist)
cp .env.example .env.local

# 3. Run the dev server
npm run dev
# → http://localhost:4010

# 4. Run the unit tests
npm test
```

No secrets are hardcoded. All configuration flows through env vars — see `.env.example`. Client-exposed values must be prefixed `NEXT_PUBLIC_`.

### Try the error & loading states
Set a failure rate to see the graceful error UI (Retry buttons) on every screen:
```bash
# .env.local
NEXT_PUBLIC_MOCK_ERROR_RATE=0.4     # 40% of mock requests fail
NEXT_PUBLIC_MOCK_LATENCY_MS=1200    # slower network to see skeletons
```

## Project structure

```
app/
  layout.tsx           # root: fonts, ThemeProvider, centered phone frame
  page.tsx             # entry gate → onboarding or /home
  onboarding/          # value slides → auth → seed backup → confirm
  (app)/               # TAB shell (bottom tab bar) — guarded
    layout.tsx
    home/  wallet/  trade/  earn/  profile/
  (stack)/             # PUSHED screens (back chevron, no tabs) — guarded
    layout.tsx
    asset/[id]/  send/  receive/  activity/
components/
  ui/                  # design-system primitives (Button, Card, Sheet, …)
  charts/              # Sparkline, LineChart (interactive), Donut — pure SVG
  coin-row, activity-row, summary-card, primitives, page-header, bottom-tabs, brand …
lib/
  types.ts  config.ts  format.ts  mock-data.ts  api.ts  store.ts  use-async.ts  cn.ts
__tests__/             # Vitest: format.test.ts, api.test.ts
```

## Design system

The single source of truth is **`app/globals.css`** (color/elevation/radius tokens for light & dark) + **`tailwind.config.ts`** (maps tokens to utilities). Change a token once, every screen updates.

- Near-white bg, near-black text, one vibrant **teal accent** (`--accent`) for positive values, highlights and primary actions.
- White cards, 16–20px radii, soft shadows. Primary buttons are solid, fully-rounded pills.
- Geometric sans (**Space Grotesk** for balances/headings, **Inter** for body).

### Reusable components (usage notes)

| Component | Use it for |
|---|---|
| `<Button>` / `<ButtonLink>` | Actions / navigation styled as buttons. `variant` = primary·secondary·ghost·danger; `size`, `fullWidth`, `loading`. Icon-only buttons need `aria-label`. |
| `<Card interactive?>` | The standard surface container. `interactive` adds press/hover affordance. |
| `<CoinRow asset showHoldings? />` | The core list item: badge · name/ticker · sparkline · price · 24h change. Links to the asset screen. |
| `<StatPair label value />` | A labelled value block (key stats). |
| `<SummaryCard icon label value sub accent? />` | Dashboard tiles (Available / Earning). |
| `<SectionHeader title seeAllHref? />` | Section title with an optional "See all" link. |
| `<PageHeader title right? />` | Inner-page header: back chevron + centered title (sticky). |
| `<Segmented options value onChange ariaLabel />` | Pill selector — chart ranges, Buy/Sell/Swap, theme. |
| `<Sheet open onClose title>` | Bottom-sheet modal (pickers, confirmations). Closes on backdrop/Esc. |
| `<NumericKeypad value onChange />` | On-screen amount entry for trade flows. |
| `<Toggle checked onChange label />` | Accessible switch (settings). |
| `<LineChart data onScrub />` / `<Sparkline data />` / `<Donut segments>` | Pure-SVG charts. `LineChart` reports the scrubbed index for live balance readouts. |
| `<Skeleton>` / `<EmptyState>` / `<ErrorState onRetry>` | The three non-happy-path states, available on every screen. |

## Data & API layer

Every screen talks to **`lib/api.ts`** (never mock data directly). Each function returns a Promise with **simulated latency + optional failure** so loading/error states are real. Swap the function bodies for `fetch()` calls when a backend exists — the signatures are designed to stay the same. Mock records live in `lib/mock-data.ts` (deterministic, seeded).

## Accessibility & UX

- WCAG-AA-minded contrast in both themes; visible focus rings; `prefers-reduced-motion` respected.
- Every interactive element has a ≥44px touch target and a screen-reader label.
- Tabular figures on all numbers so balances don't jitter.
- Security UX: biometric/2FA toggles, explicit seed-phrase backup **with a confirmation quiz**, irreversible-action warnings.

## Testing

```bash
npm test
```
Covers the pure formatters (`format.test.ts`) and the mock API's contracts — filtering, portfolio math, and order derivation (`api.test.ts`).

## License

MIT — demo/reference project.
