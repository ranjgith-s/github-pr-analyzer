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
