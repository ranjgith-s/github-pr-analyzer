# Dynamic Query Filter for PR Insights - Product Specification

## Overview

Transform the static PR Insights page (`/insights`) from showing only user-authored and user-reviewed PRs to a flexible, shareable query interface that allows users to dynamically filter GitHub pull requests using GitHub's search syntax.

## Current State

- **Route**: `/insights` displays `MetricsPage` component
- **Data Source**: `fetchPullRequestMetrics()` with hardcoded queries:
  - `is:pr author:${user.login}`  
  - `is:pr reviewed-by:${user.login}`
- **User Experience**: Static view of user's own PRs only
- **Sharing**: No URL sharing capability

## Problem Statement

Users cannot:

1. View PRs from other authors or repositories
2. Apply custom filters beyond their own activity
3. Share specific filtered views with team members
4. Save or bookmark useful query combinations
5. Understand what data is currently being displayed

## Solution: Dynamic Query Interface

### 1. Query Display & Editor

#### Current Query Indicator

- Display current active query in a prominent, readonly text field
- Show query syntax: `is:pr author:john reviewed-by:sarah repo:myorg/myrepo`
- Include helper text: "Showing X results for this query"

#### Query Editor

- Toggle between "Visual Filters" and "Advanced Query" modes
- Visual mode: Form fields for common filters (author, reviewer, repo, state, date range)
- Advanced mode: Free-text GitHub search syntax editor
- Real-time validation with error states for invalid syntax

### 2. Query Suggestions & Autocomplete

#### Intelligent Suggestions

- Show suggested completions as user types
- Categories:
  - **Users**: `author:username`, `reviewed-by:username`, `assignee:username`
  - **Repositories**: `repo:owner/name`, `org:organization`
  - **States**: `is:open`, `is:closed`, `is:merged`, `is:draft`
  - **Labels**: `label:"bug"`, `label:"enhancement"`
  - **Date Ranges**: `created:>2024-01-01`, `updated:<2024-12-31`

#### Value Suggestions

- Autocomplete usernames from organization members
- Suggest repository names from user's accessible repos
- Show available labels for selected repositories
- Date picker for date range filters

#### Query Examples

- Provide common query templates:
  - "My team's PRs": `org:myorg author:user1 author:user2 author:user3`
  - "Open reviews": `is:pr is:open review-requested:@me`
  - "Recent activity": `is:pr updated:>2024-01-01 involves:@me`

### 3. URL Sharing & Persistence

#### URL Structure

```text
/insights?q=is:pr+author:john+reviewed-by:sarah&page=1&sort=updated
```

#### Query Parameters

- `q`: URL-encoded GitHub search query
- `page`: Current page number (default: 1)
- `sort`: Sort order (updated, created, popularity)
- `per_page`: Results per page (default: 20)

#### Sharing Features

- "Copy Link" button to copy current URL
- "Share Query" modal with formatted link and description
- Browser back/forward navigation support
- Deep linking support for direct access

### 4. User Experience Flow

#### Initial Load

1. Check URL for query parameter
2. If no query: default to current behavior (`author:@me OR reviewed-by:@me`)
3. If query exists: validate and execute
4. Display query in read-only field with edit option

#### Query Editing

1. Click "Edit Query" button → opens query editor
2. User modifies query using visual filters or advanced text
3. Real-time preview shows result count
4. "Apply" button executes query and updates URL
5. Loading state with "Executing query..." message

#### Error Handling

- Invalid syntax: Show inline error with suggestion
- No results: Show empty state with query modification suggestions
- API errors: Graceful fallback with retry option

## Technical Implementation

### 1. Component Structure

```text
MetricsPage
├── QueryDisplay (readonly current query)
├── QueryEditor (modal/expandable)
│   ├── VisualFilters (form-based)
│   └── AdvancedEditor (text-based)
├── QuerySuggestions (autocomplete)
└── MetricsTable (existing, updated for dynamic data)
```

### 2. API Changes

#### Enhanced Hook: `usePullRequestMetrics`

```typescript
interface UsePullRequestMetricsOptions {
  query: string;
  page?: number;
  sort?: 'updated' | 'created' | 'popularity';
  perPage?: number;
}

export function usePullRequestMetrics(
  token: string, 
  options: UsePullRequestMetricsOptions
)
```

#### Enhanced Service: `fetchPullRequestMetrics`

```typescript
export async function fetchPullRequestMetrics(
  token: string,
  query: string,
  options?: SearchOptions
): Promise<PRSearchResult>
```

### 3. URL Management

#### React Router Integration

- Use `useSearchParams` for query parameter management
- Update URL without navigation using `setSearchParams`
- Parse query parameters on component mount

#### State Management

- Query state synchronized with URL
- Debounced query execution (500ms) for live preview
- Loading states for query validation and execution

### 4. GitHub API Integration

#### Search Query Validation

- Client-side basic syntax validation
- Server-side validation through GitHub API
- Graceful error handling for malformed queries

#### Rate Limiting Considerations

- Implement query result caching
- Debounce autocomplete requests
- Show rate limit status to users

## Success Metrics

### User Engagement

- **Query Diversity**: Track unique queries beyond default
- **Sharing Activity**: Monitor copied/shared URLs
- **Feature Adoption**: Visual vs Advanced editor usage

### Performance

- **Query Response Time**: < 2 seconds for results
- **Autocomplete Latency**: < 300ms for suggestions
- **Error Rate**: < 5% for valid GitHub queries

### User Experience

- **Task Completion**: Users can find specific PRs in < 30 seconds
- **Learning Curve**: New users discover advanced features within 3 sessions
- **Return Usage**: 70% of users return to use custom queries

## Implementation Phases

### Phase 1: Core Query Interface (Week 1-2)

- Query display and basic editor
- URL parameter handling
- Dynamic data fetching
- Basic error handling

### Phase 2: Enhanced UX (Week 3)

- Visual filter interface
- Query suggestions and autocomplete
- Sharing functionality
- Loading and empty states

### Phase 3: Polish & Optimization (Week 4)

- Performance optimization
- Advanced query examples
- User onboarding tooltips
- Analytics integration

## Risk Mitigation

### GitHub API Limits

- Implement request caching
- Show usage warnings
- Graceful degradation when limits approached

### Complex Query Learning Curve

- Provide extensive examples
- Visual filter builder for beginners
- Context-sensitive help

### URL Length Limits

- Query compression for very long searches
- Fallback to hash-based routing if needed

## Acceptance Criteria

### Must Have

- [x] Users can view and edit current query
- [x] Query changes update URL immediately (applies on explicit Apply action; no live execution while typing yet)
- [x] Shared URLs work correctly for other users (query read from `?q=` and Share modal copies URL)
- [x] Error states show helpful guidance (validation + fetch errors surfaced)
- [x] Visual filter builder for common use cases

### Should Have

- [x] Autocomplete for users, repos, and labels (syntax + value + templates)
- [ ] Query result preview before execution (NOT IMPLEMENTED: no live total count while editing)
- [x] Common query templates/examples (template suggestions in autocomplete)
- [x] Browser navigation (back/forward) works via URL search params

### Nice to Have

- [x] Saved query bookmarks (implemented via `useQueryHistory` + Bookmark button)
- [ ] Query performance metrics (NOT IMPLEMENTED)
- [ ] Advanced query builder with drag-drop (NOT IMPLEMENTED)
- [ ] Team-specific query suggestions (NOT IMPLEMENTED)

### Additional Implemented (Not Originally Listed)

- Query history (recent queries persisted in localStorage)
- Multi-channel sharing (Twitter, Slack, Email) in Share modal
- Real-time query validation with warnings + auto "is:pr" injection
- Result caching (in-memory + service-level cache for search results)
- Local bookmarks persistence
- Templates surfaced in autocomplete when query empty

### Gaps / Deviations

- Live preview (result count before Apply) absent; spec called for debounced execution and preview.
- Hook `usePullRequestMetrics` discards `total_count` from enhanced search response; only items length shown.
- Rate limit status / warnings not surfaced (spec: show usage warnings & graceful degradation).
- No UI controls yet for pagination & per-page adjustments (params handled internally, but not exposed in QueryDisplay/MetricsPage UI).
- Sorting UI not surfaced (sort param supported in context, but no control to change it on screen).
- Performance / latency metrics and analytics instrumentation (query diversity, sharing activity) not yet implemented.
- Team-specific or org-aware suggestions not present (only personal repos + generic labels).
- No compression/length mitigation for very long queries (not yet an issue, but noted in risks).

## Implementation Audit (2025-08-08)

Phase Coverage:

- Phase 1 (Core Query Interface): Achieved (query editing, URL params, dynamic fetch, error handling) except live preview.
- Phase 2 (Enhanced UX): Partially achieved (visual builder, autocomplete, sharing modal, empty/loading states, bookmarks added). Missing: live preview, richer suggestion categories (labels fetched per repo), deep analytical tracking.
- Phase 3 (Polish & Optimization): Not started (performance instrumentation, onboarding tooltips, query analytics).

Key Components Present:

- `QueryDisplay` (edit modes, validation, share, bookmark) ✅
- `VisualFilterBuilder` (authors, reviewers, repos, labels, states, draft, date ranges) ✅
- `QueryAutocomplete` + `SuggestionService` (syntax/value/templates suggestions) ✅
- URL sync via `useQueryContext` ✅
- Validation via `queryValidator` (adds `is:pr`, enforces qualifier/value formats) ✅
- Service layer: `fetchPullRequestMetrics` supports dynamic query, caching, GraphQL enrichment ✅

Outstanding Risks:

- Potential over-fetch: full PR detail retrieval even when only preview count needed.
- Missing rate limit feedback may lead to silent failures under heavy use.
- Lack of analytics impairs ability to measure adoption metrics defined in spec (query diversity, sharing, mode usage).

## Recommended Next Steps (Prioritized)

1. Live Query Preview: Add debounced (500–700ms) lightweight search (per_page=1) to fetch `total_count` while editing; render provisional count and error state before Apply.
2. Preserve & Expose Total Count: Update `usePullRequestMetrics` to return `{ items, totalCount, incomplete, loading, error }` when available; adjust `MetricsTable` & `QueryDisplay`.
3. Pagination & Sorting UI: Add controls (page selector, per-page, sort dropdown) that update URL params; implement `totalPages = Math.ceil(totalCount / per_page)`.
4. Rate Limit Awareness: Add hook (`useRateLimit`) querying `octokit.rateLimit.get` after searches; surface remaining requests + reset time, warn when <10%.
5. Performance & Reliability Metrics: Instrument timings (search latency, transform time) and error rates; log to console initially then integrate with analytics pipeline.
6. Analytics & Adoption Metrics: Capture events (edit_mode, applied_query_length, templates_used, share_clicked, bookmark_added) to measure defined success KPIs.
7. Enhanced Suggestions: Fetch repository-specific labels dynamically once repo filters chosen; add org/team suggestions if user belongs to orgs.
8. Query History UI: Optional panel/modal to browse & re-run history/bookmarks (with delete); improves discoverability.
9. Onboarding Tooltips / Examples: Provide inline "Try these" examples under empty state; highlight Visual vs Advanced toggle first time.
10. Optional Optimization: Defer GraphQL enrichment until details needed (lazy load) to reduce initial search latency, especially for previews.
11. Future (Stretch): Team-specific templates, drag-drop advanced builder, query compression for very long queries.

## Updated Timeline Projection

- Remaining Phase 2 items (1–3): ~2–3 days
- Rate limit + analytics (4–6): ~2 days
- Enhanced suggestions + history UI (7–8): ~2 days
- Onboarding + optimization (9–10): ~2–3 days

Total to reach spec parity + polish: ~8–10 working days.

---

**Document Version**: 1.1 (Updated after implementation audit)
**Last Updated**: August 8, 2025
**Status**: In Progress (Post Phase 2 Partial)
**Next Milestone**: Live Preview & Analytics Enablement
**Estimated Effort**: 4 weeks (1 developer)
