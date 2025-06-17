import React, { useState, useEffect } from 'react';
import {
  Box,
  TextInput,
  Spinner,
  Avatar,
  Heading,
  Text,
  Link,
  Label,
} from '@primer/react';
import { RadarChart, Radar, PolarAngleAxis } from 'recharts';
import { useAuth } from './AuthContext';
import { searchUsers } from './services/github';
import { useDeveloperMetrics } from './hooks/useDeveloperMetrics';
import { useUserPullRequests } from './hooks/useUserPullRequests';
import { useDebounce } from './hooks/useDebounce';
import { GitHubUser } from './services/auth';

const METRIC_INFO = [
  {
    name: 'Merge Success',
    key: 'mergeSuccess',
    valueKey: 'mergeRate',
    format: (n: number) => `${Math.round(n * 100)}%`,
    valueDesc: 'of recent PRs were merged',
    brief: 'ratio of merged pull requests',
    details: 'Shows how many of your recent pull requests merged successfully.',
  },
  {
    name: 'Cycle Efficiency',
    key: 'cycleEfficiency',
    valueKey: 'averageChanges',
    valueDesc: 'average change requests per PR',
    brief: 'fewer review cycles score higher',
    details: 'Scores drop when pull requests need many changes.',
  },
  {
    name: 'Size Efficiency',
    key: 'sizeEfficiency',
    valueKey: 'medianSize',
    valueDesc: 'median lines changed',
    brief: 'smaller pull requests are rewarded',
    details:
      'Looks at median lines changed. Smaller pull requests score higher.',
  },
  {
    name: 'Lead Time',
    key: 'leadTimeScore',
    valueKey: 'medianLeadTime',
    valueDesc: 'median hours to merge',
    brief: 'time from open to merge',
    details: 'Shows median time to merge in hours. Faster merges score higher.',
  },
  {
    name: 'Review Activity',
    key: 'reviewActivity',
    valueKey: 'reviewsCount',
    valueDesc: 'PRs reviewed',
    brief: 'how many pull requests reviewed',
    details: "Counts how many pull requests you've reviewed recently.",
  },
  {
    name: 'Feedback Score',
    key: 'feedbackScore',
    valueKey: 'averageComments',
    valueDesc: 'average comments per PR',
    brief: 'average comments per pull request',
    details: 'Average number of comments you leave on your pull requests.',
  },
  {
    name: 'Issue Resolution',
    key: 'issueResolution',
    valueKey: 'issuesClosed',
    valueDesc: 'issues closed via PRs',
    brief: 'issues closed via pull requests',
    details: 'Counts issues closed through your pull requests.',
  },
];

function getTimeline(prs: { created_at: string }[]) {
  const byMonth: Record<string, number> = {};
  prs.forEach((pr) => {
    const d = new Date(pr.created_at);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });
  return Object.entries(byMonth).map(([period, count]) => ({ period, count }));
}

export default function DeveloperMetricsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const [options, setOptions] = useState<GitHubUser[]>([]);
  const [selected, setSelected] = useState<GitHubUser | null>(null);
  const { data, loading } = useDeveloperMetrics(
    token!,
    selected?.login || null
  );
  const { items: prs } = useUserPullRequests(token!, selected?.login || null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Developer insights';
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setOptions([]);
      return;
    }
    let cancel = false;
    async function load() {
      try {
        const res = await searchUsers(token!, debouncedQuery);
        if (!cancel) setOptions(res);
      } catch (err) {
        if (!cancel) console.error(err);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [debouncedQuery, token]);

  const handleSelect = (user: GitHubUser) => {
    setSelected(user);
    setQuery(user.login);
    setOptions([]);
  };

  const chartData = data
    ? [
        { metric: 'Merge Success', value: data.mergeSuccess },
        { metric: 'Cycle Efficiency', value: data.cycleEfficiency },
        { metric: 'Size Efficiency', value: data.sizeEfficiency },
        { metric: 'Lead Time', value: data.leadTimeScore },
        { metric: 'Review Activity', value: data.reviewActivity },
        { metric: 'Feedback Score', value: data.feedbackScore },
        { metric: 'Issue Resolution', value: data.issueResolution },
      ]
    : [];

  return (
    <Box p={3}>
      <Box
        mb={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        sx={{ gap: 3 }}
      >
        <Heading as="h2" sx={{ fontSize: 4 }}>
          Developer insights
        </Heading>
        <Box position="relative" width="100%" maxWidth={300}>
          <TextInput
            placeholder="Search GitHub user"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: '100%' }}
          />
          {options.length > 0 && (
            <Box
              position="absolute"
              width="100%"
              borderWidth={1}
              borderStyle="solid"
              borderColor="border.default"
              borderRadius={2}
              bg="canvas.overlay"
              mt={1}
              zIndex={1}
            >
              {options.map((u) => (
                <Box
                  key={u.login}
                  p={2}
                  display="flex"
                  alignItems="center"
                  sx={{ cursor: 'pointer', '&:hover': { bg: 'neutral.muted' } }}
                  onClick={() => handleSelect(u)}
                >
                  <Avatar src={u.avatar_url} size={20} mr={2} />
                  <Text>{u.login}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <Spinner size="large" />
        </Box>
      )}

      {data && !loading && (
        <>
          <Box
            display="grid"
            sx={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 4,
            }}
          >
            <Box
              p={3}
              borderWidth={1}
              borderStyle="solid"
              borderColor="border.default"
              borderRadius={2}
              boxShadow="shadow.medium"
              sx={{ animation: 'fadeInUp 0.3s ease-out' }}
            >
              <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
                <Avatar src={data.avatar_url} size={64} />
                <Box>
                  <Heading as="h2" sx={{ fontSize: 3 }}>
                    {data.name || data.login}
                  </Heading>
                  <Text color="fg.muted">{data.login}</Text>
                </Box>
              </Box>
              {data.bio && (
                <Text as="p" mt={2} sx={{ maxWidth: 300 }}>
                  {data.bio}
                </Text>
              )}
              <Box mt={2} sx={{ display: 'grid', rowGap: 1 }}>
                {data.company && <Text>🏢 {data.company}</Text>}
                {data.location && <Text>📍 {data.location}</Text>}
                <Text>Repos: {data.public_repos}</Text>
                <Text>Followers: {data.followers}</Text>
                <Text>Following: {data.following}</Text>
                <Link
                  href={data.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </Link>
                <Link
                  href={`${data.html_url}?tab=repositories`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Repositories
                </Link>
                <Link
                  href={`${data.html_url}?tab=stars`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stars
                </Link>
              </Box>
            </Box>
            <Box
              p={3}
              borderWidth={1}
              borderStyle="solid"
              borderColor="border.default"
              borderRadius={2}
              boxShadow="shadow.medium"
              sx={{ animation: 'fadeInUp 0.3s ease-out' }}
            >
              <RadarChart width={500} height={400} data={chartData}>
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontFamily: 'monospace', fontSize: 10 }}
                />
                <Radar
                  dataKey="value"
                  stroke="#2da44e"
                  fill="#2da44e"
                  fillOpacity={0.6}
                />
              </RadarChart>
              <Box as="table" width="100%" mt={3} sx={{ fontSize: 1 }}>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
                    <tr key={row.metric}>
                      <td>{row.metric}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          </Box>
          <Box mt={4}>
            <Box
              display="grid"
              sx={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 3,
              }}
            >
              {METRIC_INFO.map((info) => {
                const score = data
                  ? (data as any)[info.key as keyof typeof data]
                  : null;
                const variant =
                  score === null
                    ? 'default'
                    : score < 3
                      ? 'danger'
                      : score <= 8
                        ? 'attention'
                        : 'success';
                return (
                  <Box
                    key={info.name}
                    borderWidth={1}
                    borderStyle="solid"
                    borderColor="border.default"
                    borderRadius={2}
                    p={2}
                  >
                    <Heading
                      as="h3"
                      sx={{
                        fontSize: 1,
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {info.name}
                      {typeof score === 'number' && (
                        <Label variant={variant} size="small">
                          {score}
                        </Label>
                      )}
                    </Heading>
                    <Text sx={{ fontSize: 1 }}>{info.brief}</Text>
                    <Text as="p" sx={{ mt: 1, color: 'fg.muted', fontSize: 0 }}>
                      {info.details}
                    </Text>
                    {data && (
                      <Text as="p" sx={{ mt: 1, fontSize: 0 }}>
                        <Label variant={variant} size="small" mr={1}>
                          {info.format
                            ? info.format((data as any)[info.valueKey])
                            : (data as any)[info.valueKey]}
                        </Label>{' '}
                        {info.valueDesc}
                      </Text>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
          {prs.length > 0 && (
            <Box mt={4}>
              <Heading as="h3" sx={{ mb: 2, fontSize: 2 }}>
                Recent Pull Requests
              </Heading>
              <Box as="ul" pl={3} sx={{ listStyleType: 'disc' }}>
                {prs.map((pr) => (
                  <li key={pr.id}>
                    <Link
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pr.repo} - {pr.title}
                    </Link>
                  </li>
                ))}
              </Box>
            </Box>
          )}
          {prs.length > 0 && (
            <Box mt={4}>
              <Heading as="h3" sx={{ mb: 2, fontSize: 2 }}>
                Contribution Timeline
              </Heading>
              <RadarChart width={500} height={250} data={getTimeline(prs)}>
                <PolarAngleAxis dataKey="period" />
                <Radar
                  dataKey="count"
                  stroke="#0969da"
                  fill="#0969da"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
