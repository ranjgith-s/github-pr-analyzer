import { Octokit } from '@octokit/rest';

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export async function validateToken(token: string): Promise<GitHubUser> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.users.getAuthenticated();
  return data;
}
