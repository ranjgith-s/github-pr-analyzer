export interface TimelineEntry {
  label: string;
  date: string;
}

export interface PRItem {
  id: string;
  owner: string;
  repo_name: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  author: string;
  state: 'open' | 'closed' | 'merged' | 'draft';
  created_at: string;
  published_at?: string;
  closed_at?: string;
  first_review_at?: string | null;
  first_commit_at?: string | null;
  reviewers: string[];
  changes_requested: number;
  additions: number;
  deletions: number;
  comment_count: number;
  timeline: TimelineEntry[];
}

export interface DeveloperMetrics {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  public_repos: number;
  mergeSuccess: number;
  mergeRate: number;
  cycleEfficiency: number;
  averageChanges: number;
  sizeEfficiency: number;
  medianSize: number;
  leadTimeScore: number;
  medianLeadTime: number;
  reviewActivity: number;
  reviewsCount: number;
  feedbackScore: number;
  averageComments: number;
  issueResolution: number;
  issuesClosed: number;
}

export interface RepoInsights {
  deploymentFrequency: number;
  leadTime: number;
  changeFailureRate: number;
  meanTimeToRestore: number;
  openIssues: number;
  openPullRequests: number;
  averageMergeTime: number;
  weeklyCommits: number[];
  contributorCount: number;
  communityHealthScore: number;
}