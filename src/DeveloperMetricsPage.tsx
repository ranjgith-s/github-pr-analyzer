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
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useAuth } from './AuthContext';
import { searchUsers } from './services/github';
import { useDeveloperMetrics } from './hooks/useDeveloperMetrics';
import { useDebounce } from './hooks/useDebounce';
import { GitHubUser } from './services/auth';

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
      <Box mb={3} position="relative" maxWidth={300}>
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

      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <Spinner size="large" />
        </Box>
      )}

      {data && !loading && (
        <Box display="flex" sx={{ gap: 4, flexWrap: 'wrap' }}>
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
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar
                dataKey="value"
                stroke="var(--color-accent-fg)"
                fill="var(--color-accent-subtle)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </Box>
        </Box>
      )}
    </Box>
  );
}
