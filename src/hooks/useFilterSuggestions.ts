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
    // Fetch organization members and collaborators using Octokit
    const collaborators =
      await octokit.rest.users.listFollowersForAuthenticatedUser({
        per_page: 20,
      });

    return ['@me', ...collaborators.data.map((user) => user.login)];
  } catch (error) {
    console.warn('Failed to fetch user suggestions:', error);
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
