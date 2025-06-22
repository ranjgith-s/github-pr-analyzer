import React, { useState, useEffect } from 'react';
import { Avatar, Link } from '@heroui/react';
import { Box, Heading, Text } from './primer-shim';
import { RadarChart, Radar, PolarAngleAxis } from 'recharts';
import { useAuth } from './AuthContext';
import { searchUsers } from './services/github';
import { useDeveloperMetrics } from './hooks/useDeveloperMetrics';
import { useDebounce } from './hooks/useDebounce';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useMetaDescription } from './hooks/useMetaDescription';
import { GitHubUser } from './services/auth';
import LoadingOverlay from './LoadingOverlay';
import SearchUserBox from './SearchUserBox';
import DeveloperMetricCard from './DeveloperMetricCard';

import type { DeveloperMetrics } from './services/github';

interface MetricInfo {
  name: string;
  key: keyof DeveloperMetrics;
  valueKey: keyof DeveloperMetrics;
  valueDesc: string;
  brief: string;
  details: string;
  format?: (n: number) => string;
}

const METRIC_INFO: MetricInfo[] = [
  {
    name: 'Merge Success',
    key: 'mergeSuccess',
    valueKey: 'mergeRate',
    format: (n: number) => `${Math.round(n * 100)}%`,
    valueDesc: 'of recent pull requests merged',
    brief: 'ratio of merged pull requests',
    details:
      'Shows the percentage of your recent pull requests that merged successfully.',
  },
  {
    name: 'Cycle Efficiency',
    key: 'cycleEfficiency',
    valueKey: 'averageChanges',
    valueDesc: 'average change requests per pull request',
    brief: 'fewer review cycles earn a higher score',
    details: 'The score decreases when pull requests require many changes.',
  },
  {
    name: 'Size Efficiency',
    key: 'sizeEfficiency',
    valueKey: 'medianSize',
    valueDesc: 'median lines changed',
    brief: 'smaller pull requests get higher scores',
    details:
      'Based on median lines changed. Smaller pull requests get higher scores.',
  },
  {
    name: 'Lead Time',
    key: 'leadTimeScore',
    valueKey: 'medianLeadTime',
    valueDesc: 'median hours to merge',
    brief: 'time from opening to merging',
    details:
      'Shows the median time to merge, in hours. Faster merges score higher.',
  },
  {
    name: 'Review Activity',
    key: 'reviewActivity',
    valueKey: 'reviewsCount',
    valueDesc: 'pull requests reviewed',
    brief: "how many pull requests you've reviewed",
    details: "Counts the pull requests you've reviewed recently.",
  },
  {
    name: 'Feedback Score',
    key: 'feedbackScore',
    valueKey: 'averageComments',
    valueDesc: 'average comments per pull request',
    brief: 'average comments per pull request',
    details: 'The average number of comments you leave on your pull requests.',
  },
  {
    name: 'Issue Resolution',
    key: 'issueResolution',
    valueKey: 'issuesClosed',
    valueDesc: 'issues closed by pull requests',
    brief: 'issues closed by your pull requests',
    details: 'Counts the issues you closed with pull requests.',
  },
];

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
  const loadingMessages = [
    'Fetching user data...',
    'Analyzing contributions...',
    'Building radar chart...',
  ];

  useDocumentTitle('Developer insights');
  useMetaDescription('Developer insights for GitHub pull requests.');

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
        <SearchUserBox
          query={query}
          options={options}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />
      </Box>

      <LoadingOverlay show={loading} messages={loadingMessages} />

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
                <DeveloperMetricCard
                  key={info.name}
                  name={info.name}
                  brief={info.brief}
                  details={info.details}
                  valueDesc={info.valueDesc}
                  score={data ? (data[info.key] as number) : null}
                  value={data ? (data[info.valueKey] as number) : 0}
                  format={info.format}
                />
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
