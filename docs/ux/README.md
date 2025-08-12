# UX Audit — PR-ism

Date: 2025-08-12

Scope: End-to-end app UX across navigation, query/editing, loading/error states, accessibility (a11y), performance, and observability. Grounded by current healthy test suite (~95% line coverage) and recent config review.

## Goals

- Reduce friction to first value (time-to-first-insight).
- Make heavy operations predictable, cancellable, and previewable.
- Improve accessibility and responsiveness for all users.
- Preserve user context via SPA navigation and clear feedback loops.

## Quick wins (low risk, high impact)

- SPA navigation on Home
  - Replace anchor tags with router Links to avoid full page reloads and preserve state/history.
  - File: `src/pages/Home/Home.tsx`
- Rate limit indicator
  - Surface remaining/limit/reset using existing `getRateLimit(token)` in a header badge; warn below threshold (e.g., <20%). Offer “retry after reset”.
- Token entry polish
  - Add show/hide toggle, paste detection, and inline success state after `validateToken`. Link to fine‑grained token creation and highlight minimal scopes.
- Consistent route protection
  - Wrap data pages with `RequireAuth` (redirect unauthenticated to `/login`).
- Avatar alt text
  - Use `alt={`${user.login} avatar`}` instead of generic text.

## Medium‑term enhancements

- Live query preview & Apply
  - Debounced count preview; only fetch full results on Apply. Provide a “Cancel” to stop in‑flight queries.
- Autocomplete keyboarding & a11y
  - Full keyboard support (Up/Down, Enter, Esc), `role=listbox/option`, `aria‑activedescendant`, labelled input.
  - Shortcut: `/` focuses query input; Enter applies.
- Empty and error states
  - Curated example queries on empty, clear remediation for API errors (rate limit countdown, retry).
- Loading experience
  - Use skeletons on dashboards; consider row virtualization for large tables.
- Breadcrumbs
  - Ellipsize long crumb labels, show tooltip on hover, ensure `aria-current` on last item.

## Longer‑term UX

- Saved searches & templates
  - Pin favorites, manage via a side panel; share URLs with compressed queries.
- Rich PR details
  - Time‑in‑state visualization, first response/approval latency, reviewer distribution.
- Onboarding overlays
  - First‑run guided tour with dismissible tips.

## Accessibility (a11y)

- Dialogs/modals
  - Trap focus, return focus on close, ensure `aria-labelledby`/`aria-describedby`.
- Tables
  - Use `<caption>`, header scope, `aria-sort` on sortable headers.
- Contrast & motion
  - Validate contrast in both themes; honor `prefers-reduced-motion` (reduce animations).

## Performance & data fetching

- Conditional enrichment
  - Batch remains good; only fetch commits for visible rows or on detail expansion.
- Caching strategy
  - Consider TanStack Query for dedupe, stale‑while‑revalidate, retries, and status indicators.
- Code splitting
  - Lazy‑load charts and PR detail routes via `React.lazy`/`Suspense`.
- Virtualization
  - Large tables: windowed rendering to keep TTI low.

## Error handling & resilience

- App‑level ErrorBoundary
  - Friendly fallback UI with “try again”.
- Transient failure policy
  - Backoff on 502/503/504; surface readable errors with suggestions.
- Offline mode
  - Show offline banner; disable actions until connectivity returns.

## Small targeted code changes

- Home: swap `<a>` for `<Link>`.
- Header: avatar `alt` uses username; breadcrumb root link has `aria-label="Home"`.
- Add `RequireAuth` wrapper to protect insights routes.

## Success metrics

- UX: time‑to‑first‑insight, query completion rate, preview→apply conversion, error banner impressions, rate‑limit retry success.
- A11y: keyboard navigation success, axe violations trend, reduced motion adherence.
- Performance: initial bundle size, first interaction latency on heavy pages, API calls per applied query.

## Roadmap (suggested)

- Week 1: Quick wins (links, alt text, RequireAuth, rate limit badge).
- Weeks 2–3: Preview/apply flow, autocomplete a11y, empty/error states, skeletons.
- Week 4+: Conditional enrichment, virtualization, code splitting, query persistence UX.

## References

- DORA metrics guidance (for correlating UX to throughput).
- React a11y best practices; WAI‑ARIA authoring practices.
