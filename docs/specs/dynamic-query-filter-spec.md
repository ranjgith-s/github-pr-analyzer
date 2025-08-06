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

- [ ] Users can view and edit current query
- [ ] Query changes update URL immediately
- [ ] Shared URLs work correctly for other users
- [ ] Error states show helpful guidance
- [ ] Visual filter builder for common use cases

### Should Have

- [ ] Autocomplete for users, repos, and labels
- [ ] Query result preview before execution
- [ ] Common query templates/examples
- [ ] Browser navigation (back/forward) works

### Nice to Have

- [ ] Saved query bookmarks
- [ ] Query performance metrics
- [ ] Advanced query builder with drag-drop
- [ ] Team-specific query suggestions

## Future Enhancements

- **Saved Queries**: Personal query library
- **Team Templates**: Organization-wide query templates  
- **Query Analytics**: Popular queries and success metrics
- **Advanced Visualizations**: Charts and graphs for query results
- **Real-time Updates**: Live query result updates via webhooks

---

**Document Version**: 1.0  
**Last Updated**: August 6, 2025  
**Status**: Ready for Implementation  
**Estimated Effort**: 4 weeks (1 developer)
