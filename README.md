# PR-ism

PR-ism is a small React and TypeScript application for exploring metrics about your pull requests. It surfaces how long a pull request stayed in draft, the time to the first review and the total time until it was merged or closed. The app also shows who reviewed the pull requests and how many change requests were made.

The user interface relies on [Primer](https://primer.style) to match the look and feel of GitHub. After signing in with your GitHub token, a table displays the pull requests with filters for repository and author. Selecting a title in the table opens the pull request on GitHub.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Development](#development)
  - [Testing](#testing)
  - [Production build](#production-build)
- [Developer insights](#developer-insights)
  - [License](#license)

## Features

- Authenticate with a personal access token.
- View pull requests you authored or reviewed.
- Metrics for draft time, first review and total lifespan.
- Display reviewer names with links and change requests.
- Filter by repository and author.
- Direct links to each pull request.

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

When the app opens at `http://localhost:5173`, enter a personal GitHub token with read‑only repository access when prompted.

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

## License

This project is released under the [MIT License](LICENSE).

Line coverage: 84.57%
