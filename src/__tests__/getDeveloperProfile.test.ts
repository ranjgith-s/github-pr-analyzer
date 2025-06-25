import { getDeveloperProfile } from '../services/github';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      users: {
        getByUsername: jest.fn().mockResolvedValue({
          data: {
            login: 'octocat',
            name: 'Octo Cat',
            avatar_url: 'img',
            html_url: 'url',
            bio: 'bio',
            company: 'company',
            location: 'location',
            followers: 1,
            following: 2,
            public_repos: 3,
          },
        }),
      },
    },
  })),
}));

describe('getDeveloperProfile', () => {
  it('returns developer profile with expected fields', async () => {
    const profile = await getDeveloperProfile('token', 'octocat');
    expect(profile).toEqual({
      login: 'octocat',
      name: 'Octo Cat',
      avatar_url: 'img',
      html_url: 'url',
      bio: 'bio',
      company: 'company',
      location: 'location',
      followers: 1,
      following: 2,
      public_repos: 3,
    });
  });
});
