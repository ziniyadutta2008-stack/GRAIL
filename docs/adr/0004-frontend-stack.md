# ADR-0004: Vite SPA with plain CSS tokens; pinned toolchain majors

Status: Accepted. Date: 2026-10-17.

## Context

CLAUDE.md specifies React, TypeScript, Vite, React Router, TanStack Query, React Hook Form + Zod, Recharts, Vitest, React Testing Library and Playwright. ATLAS uses Next.js and Tailwind.

## Decision

- Vite 8 + React 19 + React Router 8 (declarative routes) + TanStack Query 5.
- Styling uses CSS custom properties in a single `tokens.css` plus small component stylesheets, with no utility framework. Reasons: the token set is small and fixed by the brief, the cascade stays inspectable for accessibility review, and the dependency surface is smaller.
- Zod is used now for runtime configuration. React Hook Form and Recharts are added when the first form (Stage 2 AI system intake) and the first chart (Stage 3 KPI trend) are built, so no dependency is installed unused.
- Toolchain majors are pinned to versions the lint ecosystem supports today:
  - **TypeScript 6.0** rather than 7.0: `typescript-eslint` 8.71 requires `<6.1`.
  - **ESLint 9** rather than 10: `eslint-plugin-jsx-a11y` 6.10 supports ESLint up to 9.
  Revisit both when the plugins add support.
- Node 24 LTS (`.nvmrc`), with npm 11 pinned by the `packageManager` field (matching ATLAS's npm usage).
- Fonts: Inter (variable) and JetBrains Mono are self-hosted through `@fontsource` packages and bundled by Vite. No third-party font CDN is used.
- Icons are a small set of inline SVGs, so no icon library is added.

## Consequences

The design-token contrast checks read `tokens.css` directly, so tokens have one source of truth.
