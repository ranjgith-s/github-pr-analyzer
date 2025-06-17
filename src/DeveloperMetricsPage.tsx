import React, { useState, useEffect } from 'react';
import {
  Box,
  TextInput,
  Spinner,
  Avatar,
  Heading,
  Text,
  Link,
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
    brief: 'ratio of merged pull requests',
    details:
      'Calculated as the number of merged pull requests divided by the total pull requests authored (last 30). The ratio is scaled from 0–10.',
  },
  {
    name: 'Cycle Efficiency',
    brief: 'fewer review cycles score higher',
    details:
      'Average change requests per pull request are doubled and subtracted from 10. The score bottoms out at 0 so fewer iterations result in a better value.',
  },
  {
    name: 'Size Efficiency',
    brief: 'smaller pull requests are rewarded',
    details:
      'Uses the median of additions and deletions for authored pull requests. The median size is divided by 100 and subtracted from 10 with a minimum of 0.',
  },
  {
    name: 'Lead Time',
    brief: 'time from open to merge',
    details:
      'Median hours between creating and merging a pull request. The median is divided by 12 and subtracted from 10 with a floor of 0.',
  },
  {
    name: 'Review Activity',
    brief: 'how many pull requests reviewed',
    details:
      'Counts the pull requests reviewed by the developer (last 30) and caps the value at 10.',
  },
  {
    name: 'Feedback Score',
    brief: 'average comments per pull request',
    details:
      'Computes the mean number of comments left on authored pull requests and limits the score to 10.',
  },
  {
    name: 'Issue Resolution',
    brief: 'issues closed via pull requests',
    details:
      "Tallies issues closed by the developer's pull requests. The total is capped at a maximum score of 10.",
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
              {METRIC_INFO.map((info) => (
                <Box
                  key={info.name}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="border.default"
                  borderRadius={2}
                  p={2}
                >
                  <Heading as="h3" sx={{ fontSize: 1, mb: 1 }}>
                    {info.name}
                  </Heading>
                  <Text sx={{ fontSize: 1 }}>{info.brief}</Text>
                  <Text as="p" sx={{ mt: 1, color: 'fg.muted', fontSize: 0 }}>
                    {info.details}
                  </Text>
                </Box>
              ))}
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
