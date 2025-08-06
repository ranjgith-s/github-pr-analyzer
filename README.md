# PR-ism

PR-ism is a React + TypeScript application for exploring GitHub pull request and repository metrics with data-driven insights. It provides comprehensive analysis of development workflows, reviewer activity, and DevOps performance metrics. The UI features a modern design using [heroUI](https://heroui.com) components with GitHub-like aesthetics. Sign in with your GitHub personal access token to get started.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Development](#development)
  - [Testing](#testing)
  - [Linting](#linting)
  - [Production build](#production-build)
- [Pull Request Analytics](#pull-request-analytics)
- [Developer Profile Analytics](#developer-profile-analytics)
- [Repository Analytics](#repository-analytics)
- [License](#license)

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

## License

MIT License. See [LICENSE](LICENSE).
