# Contributing to PR-ism

Thanks for your interest in contributing!

## Quick start

1. Fork and clone the repo.
2. Install dependencies: `npm install`
3. Create a branch: `git checkout -b feat/<short-description>`
4. Dev server: `npm run dev`

## Quality checks

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Tests + coverage: `npm test`
- One-shot all checks: `npm run check`
- Build: `npm run build`
- Optional bundle analysis: `npm run build:analyze` (generates `build/bundle-analysis.html`)

## Pull requests

- Keep PRs focused and reasonably small.
- Include tests for behavior changes.
- Maintain or improve coverage (lines ≥ 90%).
- Update docs (README/specs/migration) where applicable.
- Ensure CI is green; fix any lint/type/test issues.

## Commit conventions

- Conventional commits are encouraged (feat:, fix:, chore:, docs:, refactor:, test:).
- Prefer descriptive messages.

## Local scripts

- Update README coverage after tests: `npm run update-coverage`.

## Reporting issues

Please include:

- Expected vs actual behavior
- Steps to reproduce
- Environment (OS, Node version)
- Screenshots/logs if relevant
