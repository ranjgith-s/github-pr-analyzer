export interface FilterState {
  authors: string[];
  reviewers: string[];
  repositories: string[];
  labels: string[];
  state: 'open' | 'closed' | 'merged' | 'all';
  isDraft: boolean | null;
  dateRange: {
    created?: { start?: Date; end?: Date };
    updated?: { start?: Date; end?: Date };
  };
  assignees: string[];
  involves: string[];
}

export function parseGitHubQuery(query: string): FilterState {
  const filters: FilterState = {
    authors: [],
    reviewers: [],
    repositories: [],
    labels: [],
    state: 'all',
    isDraft: null,
    dateRange: {},
    assignees: [],
    involves: [],
  };

  // Parse authors
  const authorMatches = query.match(/author:(\S+)/g);
  if (authorMatches) {
    filters.authors = authorMatches.map((match) =>
      match.replace('author:', '').replace(/"/g, '')
    );
  }

  // Parse reviewers
  const reviewerMatches = query.match(/reviewed-by:(\S+)/g);
  if (reviewerMatches) {
    filters.reviewers = reviewerMatches.map((match) =>
      match.replace('reviewed-by:', '').replace(/"/g, '')
    );
  }

  // Parse repositories
  const repoMatches = query.match(/repo:(\S+)/g);
  if (repoMatches) {
    filters.repositories = repoMatches.map((match) =>
      match.replace('repo:', '').replace(/"/g, '')
    );
  }

  // Parse labels
  const labelMatches = query.match(/label:"([^"]+)"/g);
  if (labelMatches) {
    filters.labels = labelMatches.map((match) =>
      match.replace(/label:"|"/g, '')
    );
  }

  // Parse assignees
  const assigneeMatches = query.match(/assignee:(\S+)/g);
  if (assigneeMatches) {
    filters.assignees = assigneeMatches.map((match) =>
      match.replace('assignee:', '').replace(/"/g, '')
    );
  }

  // Parse involves
  const involvesMatches = query.match(/involves:(\S+)/g);
  if (involvesMatches) {
    filters.involves = involvesMatches.map((match) =>
      match.replace('involves:', '').replace(/"/g, '')
    );
  }

  // Parse state
  if (query.includes('is:open')) filters.state = 'open';
  else if (query.includes('is:closed')) filters.state = 'closed';
  else if (query.includes('is:merged')) filters.state = 'merged';

  // Parse draft status
  if (query.includes('-is:draft')) filters.isDraft = false;
  else if (query.includes('is:draft')) filters.isDraft = true;

  // Parse date ranges
  const createdAfter = query.match(/created:>(\S+)/);
  const createdBefore = query.match(/created:<(\S+)/);
  const updatedAfter = query.match(/updated:>(\S+)/);
  const updatedBefore = query.match(/updated:<(\S+)/);

  if (createdAfter || createdBefore) {
    filters.dateRange.created = {
      start: createdAfter ? new Date(createdAfter[1]) : undefined,
      end: createdBefore ? new Date(createdBefore[1]) : undefined,
    };
  }

  if (updatedAfter || updatedBefore) {
    filters.dateRange.updated = {
      start: updatedAfter ? new Date(updatedAfter[1]) : undefined,
      end: updatedBefore ? new Date(updatedBefore[1]) : undefined,
    };
  }

  return filters;
}

export function buildGitHubQuery(filters: FilterState): string {
  const parts: string[] = ['is:pr'];

  // Add authors
  filters.authors.forEach((author) => {
    parts.push(`author:${author}`);
  });

  // Add reviewers
  filters.reviewers.forEach((reviewer) => {
    parts.push(`reviewed-by:${reviewer}`);
  });

  // Add repositories
  filters.repositories.forEach((repo) => {
    parts.push(`repo:${repo}`);
  });

  // Add labels
  filters.labels.forEach((label) => {
    parts.push(`label:"${label}"`);
  });

  // Add assignees
  filters.assignees.forEach((assignee) => {
    parts.push(`assignee:${assignee}`);
  });

  // Add involves
  filters.involves.forEach((involve) => {
    parts.push(`involves:${involve}`);
  });

  // Add state
  if (filters.state !== 'all') {
    parts.push(`is:${filters.state}`);
  }

  // Add draft status
  if (filters.isDraft === true) {
    parts.push('is:draft');
  } else if (filters.isDraft === false) {
    parts.push('-is:draft');
  }

  // Add date ranges
  if (filters.dateRange.created?.start) {
    parts.push(`created:>${formatDate(filters.dateRange.created.start)}`);
  }
  if (filters.dateRange.created?.end) {
    parts.push(`created:<${formatDate(filters.dateRange.created.end)}`);
  }
  if (filters.dateRange.updated?.start) {
    parts.push(`updated:>${formatDate(filters.dateRange.updated.start)}`);
  }
  if (filters.dateRange.updated?.end) {
    parts.push(`updated:<${formatDate(filters.dateRange.updated.end)}`);
  }

  return parts.join(' ');
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getQueryComplexity(
  query: string
): 'simple' | 'moderate' | 'complex' {
  const parts = query.split(' ').length;
  const hasDateRanges = /created:|updated:/.test(query);
  const hasComplexOperators = /OR|AND|\(|\)/.test(query);

  if (hasComplexOperators || parts > 8) return 'complex';
  if (hasDateRanges || parts > 4) return 'moderate';
  return 'simple';
}
