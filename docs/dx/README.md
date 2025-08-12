# DX Audit — PR-ism

Date: 2025-08-12

Scope: Tooling, dependencies, scripts, CI/CD, testing, performance profiling, and documentation. Grounded by current repo signals: TypeScript check passes, 458 tests pass with ~95% coverage, Vite + React 19, Tailwind, Jest 29, jsdom env 30.

## Goals

- Keep dev loop fast and predictable (install → dev → test → build).
- Reduce version skew risks and automate checks in CI.
- Improve reliability of API‑heavy development by adding safety nets.

## Quick wins (low risk, high impact)

- Align Jest versions
  - Use consistent major versions (upgrade Jest to 30 or pin `jest-environment-jsdom` to ^29) to avoid subtle future breakages.
- Dependency hygiene
  - Move `tailwindcss` and `shadcn-ui` to `devDependencies` if not used at runtime.
- Engines & browserslist
  - Add `"engines": { "node": ">=18" }` and a `browserslist` to standardize builds and autoprefixer output.
- Combined check script
  - Add `check`: `npm run -s typecheck && npm run -s lint && npm -s test`.

## CI/CD

- GitHub Actions workflow
  - Matrix Node (18, 20, 22, 24). Steps: install, lint, typecheck, test (coverage), build.
  - Upload coverage to Codecov/Coveralls; enforce thresholds (can start at current global).
  - Optional: on `main` merge, run `updateReadmeCoverage` to keep README badge fresh.
- Dependency updates
  - Enable Renovate/Dependabot to keep Octokit, Vite, React, Testing Library, and ESLint up to date.

## Tooling upgrades

- Vite/Plugin alignment
  - Upgrade to Vite 5+ and matching `@vitejs/plugin-react` for React 19 + Node 24 improvements.
- Consider Vitest (optional)
  - For tighter Vite integration and even faster runs, migrate select unit tests to Vitest gradually.
- TypeScript strictness
  - Consider `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` guarded by incremental adoption.
- Runtime validation
  - Add `zod` for critical GitHub API responses in service boundaries.

## Testing strategy

- Keep Jest fast
  - Parallelize as today; verify watch mode works smoothly in dev.
- Storybook + a11y
  - Add Storybook with a11y addon to improve UI component coverage and visual regression checks.
- E2E smoke tests
  - Add Playwright tests for login, run query, view repo insights. Run on PRs with mocked GitHub API.

## Scripts & repo hygiene

- Add `npm run build:analyze` for bundle analysis (Vite plugin or rollup plugin-visualizer).
- Add Husky + lint-staged to run ESLint/Prettier on staged files; optional typecheck on TS‑changed files.
- Enforce consistent import paths via ESLint (no deep relative paths when alias exists).

## Performance & reliability

- TanStack Query adoption
  - Centralize caching/dedupe/retries/status across hooks.
- Conditional enrichment and virtualization
  - Defer heavy commit fetches; window large tables.
- Error boundaries and retry policies
  - Standardize transient failure handling with exponential backoff utilities.

## Documentation

- CONTRIBUTING.md
  - Steps: install, dev, test, typecheck, lint, build; PR checklist; coverage update guidance.
- ARCHITECTURE.md
  - Summarize data flow and key modules (services/hooks/contexts/components).
- ADRs (optional)
  - Capture decisions (e.g., TanStack Query migration, Vitest adoption).

## Suggested package.json deltas (summary)

- scripts:
  - `"check": "npm run -s typecheck && npm run -s lint && npm -s test"`
- engines/browserslist:
  - `"engines": { "node": ">=18" }`
  - `"browserslist": ["defaults", "not ie <= 11", "maintained node versions"]`

## Success metrics

- CI median time to green, flake rate, dependency lag (days behind latest), PRs blocked by quality gates, dev server start time, test run duration, bundle size trend.

## Roadmap (suggested)

- Week 1: Jest alignment, scripts, engines/browserslist, CI workflow.
- Weeks 2–3: Bundle analyzer, Husky + lint-staged, Renovate/Dependabot, Vite upgrade.
- Week 4+: Storybook + Playwright, TanStack Query pilot, TypeScript strictness, optional Vitest migration.
