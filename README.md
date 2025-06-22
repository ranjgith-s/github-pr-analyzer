# PR-ism

PR-ism is a small React and TypeScript application for exploring metrics about your pull requests. It shows how long a pull request stayed in draft, the time to the first review, and the total time until it was merged or closed. The app also lists the reviewers and how many change requests they made.

The user interface uses [heroUI](https://heroui.com) components to match GitHub's visual style. After you sign in with your GitHub token, the table lists pull requests with filters for repository and author. Selecting a pull request title opens it on GitHub.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Development](#development)
  - [Testing](#testing)
  - [Production build](#production-build)
- [Developer insights](#developer-insights)
- [Repository insights](#repository-insights)
  - [License](#license)

## Features

- Authenticate with a personal access token.
- View pull requests you authored or reviewed.
- See draft time, first review time and total lead time for each pull request.
- Inspect diff statistics and comment counts.
- Color‑coded timeline bar with tooltips for draft, review and merge phases.
- Display reviewer names with links and change requests.
- Filter pull requests by repository and author.
- Open pull requests directly on GitHub.
- Search GitHub users and visualize contributions with a radar chart.
- Explore repository metrics such as deployment frequency and lead time for changes.

## Architecture

The codebase follows clean architecture principles. Domain logic is kept separate from UI concerns and external APIs.

- **src/services** – API modules used to query GitHub via `@octokit/rest`.
- **src/hooks** – reusable hooks that fetch and format data.
- **src/AuthContext.tsx** – provides authentication state to the rest of the app.
- **React components** – present the data retrieved from hooks and services.

## Getting Started

### Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

When the app opens at `http://localhost:5173`, enter a GitHub personal access token with read-only repository access.

### Testing

Run unit tests with coverage:

```bash
npm test
```

To update the coverage badge in the README after running the tests, execute:

```bash
node scripts/updateReadmeCoverage.js
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

Format source files with Prettier:

```bash
npm run format
```

### Production build

Create a production build:

```bash
npm run build
```

The compiled files will be available in the `build/` directory.

## Developer insights

The radar chart on the developer page visualizes seven scores scaled from 0 to 10.
Higher numbers indicate better performance:

- **Merge Success** – ratio of merged pull requests.
- **Cycle Efficiency** – fewer review cycles yield a higher score.
- **Size Efficiency** – smaller pull requests score higher.
- **Lead Time** – quicker merges improve the score.
- **Review Activity** – how many pull requests the developer reviewed.
- **Feedback Score** – average number of comments per pull request.
- **Issue Resolution** – number of issues closed via pull requests.

## Repository insights

Enter any GitHub repository to see DevOps metrics:

- **Deployment Frequency** – number of pushes per period.
- **Lead Time for Changes** – time from commit to production.
- **Change Failure Rate** – percentage of failed deployments.
- **Mean Time to Restore** – how quickly failures are resolved.
- Additional stats for open issues, pull requests and commit activity.

## License

This project is released under the [MIT License](LICENSE).

Line coverage: 66.73%
