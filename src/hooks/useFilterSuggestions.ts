import { useState, useEffect } from 'react';
import { Octokit } from '@octokit/rest';
import { useAuth } from '../contexts/AuthContext/AuthContext';

export interface FilterSuggestions {
  users: string[];
  repositories: string[];
  labels: string[];
  loading: boolean;
  error: string | null;
}

export function useFilterSuggestions(): FilterSuggestions {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<FilterSuggestions>({
    users: [],
    repositories: [],
    labels: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadSuggestions() {
      if (!token) return;

      try {
        setSuggestions((prev) => ({ ...prev, loading: true, error: null }));

        const octokit = new Octokit({ auth: token });

        // Load suggestions in parallel using Octokit
        const [users, repositories, labels] = await Promise.all([
          fetchUserSuggestions(octokit),
          fetchRepositorySuggestions(octokit),
          fetchLabelSuggestions(),
        ]);

        setSuggestions({
          users,
          repositories,
          labels,
          loading: false,
          error: null,
        });
      } catch (error) {
        setSuggestions((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load suggestions',
        }));
      }
    }

    loadSuggestions();
  }, [token]);

  return suggestions;
}

async function fetchUserSuggestions(octokit: Octokit): Promise<string[]> {
  try {
    /*
      Previous implementation used octokit.rest.users.listFollowersForAuthenticatedUser (GET /user/followers).
      That endpoint can return 403 for:
        - Fine-grained / GitHub App installation tokens (no concept of an authenticated user in same way)
        - SSO restricted org tokens without proper authorization
        - Tokens missing read:user scope (classic PAT)
      Fix: Resolve the authenticated user's login, then call the public endpoint
      GET /users/{username}/followers (listFollowersForUser) which does not require auth scope beyond public data.
      This avoids 403 while still leveraging auth for higher rate limits.
    */
    const me = await octokit.rest.users.getAuthenticated();
    const username = me.data.login;

    const followers = await octokit.rest.users.listFollowersForUser({
      username,
      per_page: 30,
    });

    return ['@me', ...followers.data.map((u) => u.login)];
  } catch (error: any) {
    // Provide minimal noise; only warn once per session key
    if (process.env.NODE_ENV !== 'test') {
      const status = error?.status;
      const message = error?.message || 'unknown';
      console.warn(
        `User suggestion fallback triggered (status: ${status} message: ${message})`
      );
    }
    return ['@me'];
  }
}

async function fetchRepositorySuggestions(octokit: Octokit): Promise<string[]> {
  try {
    // Fetch user's repositories using Octokit
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 50,
      sort: 'updated',
      direction: 'desc',
    });

    return repos.map((repo) => repo.full_name);
  } catch (error) {
    console.warn('Failed to fetch repository suggestions:', error);
    return [];
  }
}

async function fetchLabelSuggestions(): Promise<string[]> {
  // For now, return common labels
  // In future, could aggregate from user's repositories
  return [
    'bug',
    'enhancement',
    'documentation',
    'good first issue',
    'help wanted',
    'question',
    'wontfix',
    'duplicate',
    'invalid',
  ];
}
