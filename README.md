# PR-ism

Line coverage: 95.06%

PR-ism is a React + TypeScript application for exploring GitHub pull request and repository metrics with data‑driven insights. It provides comprehensive analysis of development workflows, reviewer activity, and DevOps performance metrics. The UI features a modern design (currently migrating from HeroUI to shadcn/ui) with GitHub‑like aesthetics. Sign in with your GitHub personal access token (classic or fine‑grained) to get started.

## Table of Contents

- [PR-ism](#pr-ism)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Features](#features)
    - [🔐 Authentication \& Security](#-authentication--security)
    - [📊 Pull Request Analytics](#-pull-request-analytics)
    - [👨‍💻 Developer Profile Analytics](#-developer-profile-analytics)
    - [🏢 Repository Analytics](#-repository-analytics)
    - [🎨 User Experience](#-user-experience)
  - [Architecture](#architecture)
    - [High-Level Data Flow](#high-level-data-flow)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Configuration](#configuration)
    - [Development](#development)
    - [Testing](#testing)
    - [Linting](#linting)
    - [Production build](#production-build)
    - [Type Checking](#type-checking)
  - [Pull Request Analytics](#pull-request-analytics)
  - [Developer Profile Analytics](#developer-profile-analytics)
    - [Radar Chart Visualization](#radar-chart-visualization)
    - [Developer Profile Features](#developer-profile-features)
  - [Repository Analytics](#repository-analytics)
    - [DevOps Performance Metrics (DORA-aligned)](#devops-performance-metrics-dora-aligned)
    - [Repository Health Indicators](#repository-health-indicators)
    - [Search and Navigation](#search-and-navigation)
  - [Caching \& Rate Limits](#caching--rate-limits)
  - [Security Considerations](#security-considerations)
  - [Testing Strategy](#testing-strategy)
  - [Roadmap](#roadmap)
  - [Migration (HeroUI -\> shadcn/ui)](#migration-heroui---shadcnui)
  - [Contributing](#contributing)
  - [License](#license)

## Tech Stack

- React 19 + TypeScript
- Vite build tool
- Tailwind CSS (utility styling) + custom design tokens
- (Migrating) HeroUI -> shadcn/ui + Radix primitives
- React Router v6 (routing & URL search params sync)
- Recharts (radar charts & data viz)
- Octokit (@octokit/rest + GraphQL) for GitHub API access
- Jest + Testing Library for unit/integration tests
- ESLint + TypeScript ESLint + Prettier for code quality

Supporting utilities: in‑memory + localStorage caching, query validator, suggestion service, rate limit fetcher.

## Features

### 🔐 Authentication & Security

- Secure GitHub personal access token authentication (read-only repository access)
- Token validation and session management
- Protected routes with automatic redirection

### 📊 Pull Request Analytics

- **Comprehensive PR Metrics Table**: View all pull requests you authored or reviewed
- **Timeline Visualization**: Color-coded timeline bars showing draft, review, and merge phases with tooltips
- **Advanced Filtering**: Filter by repository, author, and search text
- **Pagination**: Dynamic page sizing with efficient data handling
- **Detailed Metrics**: Draft time, first review time, total lead time, reviewer activity
- **Diff Statistics**: Additions, deletions, comment counts, and change requests
- **Interactive Navigation**: Click any PR to view detailed timeline on dedicated page

### 👨‍💻 Developer Profile Analytics

- **GitHub User Search**: Real-time search with autocomplete suggestions
- **Radar Chart Visualization**: Seven-dimensional performance analysis using Recharts
- **Developer Profile Cards**: Avatar, bio, company, location, and GitHub statistics
- **Performance Metrics**:
  - Merge Success Rate (percentage of PRs merged)
  - Cycle Efficiency (review cycle optimization)
  - Size Efficiency (PR size management)
  - Lead Time Score (time to merge)
  - Review Activity (PRs reviewed)
  - Feedback Score (average comments per PR)
  - Issue Resolution (issues closed via PRs)

### 🏢 Repository Analytics

- **Repository Search**: GitHub URL pattern matching and validation
- **DevOps Metrics Dashboard**: DORA-aligned metrics
- **Comprehensive Repository Health**: 10+ key performance indicators
- **Real-time Data**: Live metrics from GitHub API

### 🎨 User Experience

- **Responsive Design**: Mobile-first layout with Tailwind CSS
- **Dark/Light Mode**: System preference detection with manual toggle
- **Loading States**: Animated loading overlays with contextual messages
- **Error Handling**: Graceful error states and user feedback
- **Breadcrumb Navigation**: Contextual navigation with dynamic breadcrumbs
- **Modern UI Components**: heroUI component library for consistent design

## Architecture

The codebase follows clean architecture principles. Domain logic is separated from UI and API concerns.

- **src/services/** – API modules for GitHub queries (via `@octokit/rest`).
- **src/hooks/** – Reusable hooks for fetching and formatting data.
- **src/contexts/AuthContext/** – Provides authentication state.
- **src/contexts/ThemeModeContext/** – Manages light/dark mode.
- **src/components/** – UI components (tables, cards, charts, etc.).
- **src/pages/** – Top-level pages for metrics, developer, and repository insights.
- **src/types/** – TypeScript types and interfaces.
- **src/utils/** – Utility functions and helpers.

### High-Level Data Flow

1. User authenticates with a personal access token (stored locally) via `AuthContext`.
2. Hooks (`usePullRequestMetrics`, `useDeveloperMetrics`, `useRepoInsights`) orchestrate fetches through `githubService`.
3. `githubService` wraps Octokit REST + GraphQL calls, performs batching & transformations, applies caching, and surfaces rate limit info.
4. Components/pages render metrics, charts, and tables; query editing state is synchronized with the URL for shareability.
5. LocalStorage persists: auth token, query history & bookmarks, color mode.

## Getting Started

### Prerequisites

- Node.js 18+ (recommended LTS)
- A GitHub Personal Access Token with at least `public_repo` scope (classic) OR a fine‑grained token granting read access to the specific repositories you want to analyze.

### Configuration

No server component: all calls go directly to the GitHub API from the browser using your token.

1. Create a PAT:

   - Classic: <https://github.com/settings/tokens> (scopes: `repo` if you need private repos, else `public_repo` only)
   - Fine‑grained: <https://github.com/settings/personal-access-tokens/new> (select repositories, read‑only)
2. Launch the app (`npm run dev`).
3. Paste the token into the login screen; it is stored in `localStorage` under key `token` until you logout.
4. Clear it anytime via the logout button or by clearing site data.

### Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter your GitHub personal access token.

### Testing

Run unit tests with coverage:

```bash
npm test
```

To update the coverage badge in the README after running tests:

```bash
node scripts/updateReadmeCoverage.js
```

This script replaces the placeholder text `Line coverage: 95.06%` with the latest percentage using `coverage/coverage-summary.json` (ensure tests were run with coverage first).

### Linting

Check code quality with ESLint:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

### Production build

Create a production build:

```bash
npm run build
```

The compiled files will be in the `build/` directory.

### Type Checking

Run a standalone type check (no emit):

```bash
npm run typecheck
```

## Pull Request Analytics

The pull request insights page provides a comprehensive table view of all your GitHub pull requests with advanced analytics:

- **Comprehensive Metrics Table**: Interactive table displaying all PRs you authored or reviewed
- **Timeline Visualization**: Color-coded timeline bars with hover tooltips showing:
  - Draft phase (time from creation to first publish)
  - Review phase (time from publish to first review)
  - Merge phase (time from review to close/merge)
- **Advanced Filtering**: Real-time filtering by repository, author, and search text
- **Dynamic Pagination**: Efficient handling of large datasets with customizable page sizes
- **Detailed Statistics**: View additions, deletions, comment counts, and change requests
- **Interactive Navigation**: Click any PR row to view detailed timeline breakdown
- **Export Capabilities**: Review data for performance analysis

Each pull request displays key metrics including draft time, first review time, total lead time, and reviewer activity with change request counts.

## Developer Profile Analytics

The developer profile page provides comprehensive analytics for any GitHub user through an intuitive radar chart and detailed metrics:

### Radar Chart Visualization

Interactive seven-dimensional performance radar chart built with Recharts showing scores from 0-10 (higher is better):

- **Merge Success** – Percentage of pull requests that were successfully merged
- **Cycle Efficiency** – Review efficiency based on average change requests per PR
- **Size Efficiency** – Scoring based on median lines changed (smaller PRs score higher)
- **Lead Time** – Speed of pull request completion from open to merge
- **Review Activity** – Contribution to code review process (PRs reviewed)
- **Feedback Score** – Quality of feedback measured by average comments per PR
- **Issue Resolution** – Problem-solving impact through issues closed via PRs

### Developer Profile Features

- **Real-time User Search**: GitHub username autocomplete with avatar previews
- **Comprehensive Profile Display**: Name, bio, company, location, follower/following counts
- **Repository Statistics**: Public repository count and GitHub profile link
- **Performance Metrics Cards**: Detailed breakdown of each radar chart dimension
- **Historical Analysis**: Metrics calculated from recent GitHub activity

The analytics help identify developer strengths and areas for improvement in the software development workflow.

## Repository Analytics

Comprehensive repository health and DevOps metrics analysis for any GitHub repository:

### DevOps Performance Metrics (DORA-aligned)

- **Deployment Frequency** – Number of pushes per time period indicating release cadence
- **Lead Time for Changes** – Average time from commit to production deployment
- **Change Failure Rate** – Percentage of deployments that result in failures
- **Mean Time to Restore** – Average time to recover from production failures

### Repository Health Indicators

- **Open Issue Count** – Current number of unresolved issues
- **Open Pull Request Count** – Active pull requests awaiting review/merge
- **Average PR Merge Time** – Mean time for pull requests to be merged
- **Weekly Commit Activity** – Commit frequency over recent weeks
- **Contributor Count** – Number of active repository contributors
- **Community Health Score** – Overall repository maintenance and activity score

### Search and Navigation

- **Intelligent Repository Search** – GitHub URL pattern matching and validation
- **Real-time Data Fetching** – Live metrics directly from GitHub API
- **Error Handling** – Graceful handling of private/inaccessible repositories
- **Responsive Dashboard** – Clean grid layout for metric visualization

Enter any GitHub repository URL or use the format `owner/repository` to explore comprehensive analytics and identify areas for workflow improvement.

## Caching & Rate Limits

The app employs multiple layers to remain responsive while respecting GitHub rate limits:

- In-memory caches (user, repo, PR commit lists) via lightweight cache objects.
- LocalStorage persistence for query history & bookmarks (no API secrets beyond the PAT itself).
- Search result caching (5 min TTL) keyed by normalized query + pagination params.
- Batched GraphQL queries reduce round trips (20 PRs per batch) followed by controlled concurrency when enriching with commits.
- Rate limit data (core resource) fetched after each metrics load and surfaced through `usePullRequestMetrics` (UI surfacing WIP per roadmap).

If you experience silent failures when limits exhaust, refresh after the reset time or reduce rapid query edits (live preview feature will use lightweight head requests to mitigate).

## Security Considerations

- PAT is stored client‑side in `localStorage` (key: `token`). Anyone with local machine/browser access could read it—use a low‑scope token.
- All requests are direct browser → GitHub API; no intermediate server retains credentials.
- Logout clears local storage token; always logout on shared machines.
- No write operations are performed; the application is read‑only.
- Avoid granting unnecessary scopes (private repo access only if required).

## Testing Strategy

Categories:

- Unit & hook tests (query construction, validators, suggestion service, hooks state transitions).
- Component rendering & interaction tests (table sorting/filtering, query editor flows, auth context behaviors).
- Edge cases: API errors mocked via Jest to verify graceful fallbacks, validation failures, empty states.
- Coverage target: Maintain ≥90% lines (current status updated via coverage script).

Run focused tests: `npm test -- <pattern>`.

## Roadmap

Planned / In Progress items extracted from specs & audit:

1. Live query preview (debounced count before Apply).
2. Pagination & sorting controls surfaced in UI (currently internal params only).
3. Rate limit awareness banner (remaining, reset time, warning threshold).
4. Analytics instrumentation (query diversity, sharing events, adoption metrics).
5. Enhanced suggestions (labels per repo, org/team templates).
6. Query history panel & improved bookmark management UI.
7. Onboarding tooltips & example queries (empty state education layer).
8. Performance optimizations (lazy enrichment of PR details; skip heavy calls for previews).
9. Component library migration completion (HeroUI fully removed).
10. Optional: drag‑and‑drop advanced visual query builder & query compression for long URLs.

See detailed spec: [`docs/specs/dynamic-query-filter-spec.md`](docs/specs/dynamic-query-filter-spec.md)

## Migration (HeroUI -> shadcn/ui)

Active incremental migration guided by: [`docs/migration/README.md`](docs/migration/README.md)

Snapshot:

- Wrappers introduced under `src/components/ui-bridge/` to allow internal swaps without widespread call‑site churn.
- Many primitives (Card, Badge, Avatar, Button, Input, Switch, etc.) already mapped; remaining focus on complex composites (Autocomplete, Table refinements, Dropdown, Modal finalization).
- Goal: zero `@heroui/react` imports outside the bridge layer, then removal from dependencies.

## Contributing

1. Fork & clone repository.
2. Create a feature branch (`feat/<short-description>` or `fix/<issue>`).
3. Install deps & ensure tests pass.
4. Add/adjust tests for any behavioral change (keep coverage ≥ existing).
Development checklist before PR:

- Run lint: `npm run lint`
- Type check: `npm run typecheck`
- Tests with coverage: `npm test`
- (If coverage changed) Update README: `npm run update-coverage`
- Open PR (include motivation, approach, screenshots, migration status)

Coding Guidelines:

- Keep components small & focused; prefer hooks for data/state logic.
- Avoid premature abstractions; introduce only when duplication >2 occurrences.
- Prefer functional purity in utilities; side effects localized to hooks/services.
- Follow existing naming conventions (camelCase functions, PascalCase components, kebab-case branch names).

## License

MIT License. See [LICENSE](LICENSE).
