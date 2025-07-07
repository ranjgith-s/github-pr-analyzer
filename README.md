# PR-ism

PR-ism is a React + TypeScript application for exploring GitHub pull request and repository metrics. It visualizes draft time, review time, lead time, reviewer activity, and repository DevOps stats. The UI uses [heroUI](https://heroui.com) components for a GitHub-like look. Sign in with your GitHub token to get started.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Development](#development)
  - [Testing](#testing)
  - [Linting](#linting)
  - [Production build](#production-build)
- [Developer insights](#developer-insights)
- [Repository insights](#repository-insights)
- [License](#license)

## Features

- Authenticate with a GitHub personal access token (read-only repo access).
- View pull requests you authored or reviewed, with draft time, first review time, and total lead time.
- Inspect diff stats, comment counts, and reviewer activity (including change requests).
- Color-coded timeline bar with tooltips for draft, review, and merge phases.
- Filter pull requests by repository and author; open PRs directly on GitHub.
- Search GitHub users and visualize contributions with a radar chart.
- Explore repository metrics: deployment frequency, lead time for changes, change failure rate, mean time to restore, and more.
- Modern UI with heroUI and Tailwind CSS.

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

## Getting Started

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

## Developer insights

The developer page radar chart visualizes seven scores (0–10, higher is better):

- **Merge Success** – Ratio of merged PRs.
- **Cycle Efficiency** – Fewer review cycles = higher score.
- **Size Efficiency** – Smaller PRs score higher.
- **Lead Time** – Faster merges improve score.
- **Review Activity** – Number of PRs reviewed.
- **Feedback Score** – Avg. comments per PR.
- **Issue Resolution** – Issues closed via PRs.

## Repository insights

Enter a GitHub repository to see DevOps metrics:

- **Deployment Frequency** – Pushes per period.
- **Lead Time for Changes** – Commit to production time.
- **Change Failure Rate** – % of failed deployments.
- **Mean Time to Restore** – Time to resolve failures.
- Additional stats: open issues, PRs, commit activity.

## License

MIT License. See [LICENSE](LICENSE).

