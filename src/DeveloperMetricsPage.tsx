import React, { useState, useEffect } from 'react';
import { Box, TextInput, Spinner, Avatar, Heading, Text } from '@primer/react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from './AuthContext';
import { searchUsers } from './services/github';
import { useDeveloperMetrics } from './hooks/useDeveloperMetrics';
import { GitHubUser } from './services/auth';

export default function DeveloperMetricsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<GitHubUser[]>([]);
  const [selected, setSelected] = useState<GitHubUser | null>(null);
  const { data, loading } = useDeveloperMetrics(
    token!,
    selected?.login || null
  );

  useEffect(() => {
    if (!query) {
      setOptions([]);
      return;
    }
    let cancel = false;
    async function load() {
      try {
        const res = await searchUsers(token!, query);
        if (!cancel) setOptions(res);
      } catch (err) {
        if (!cancel) console.error(err);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [query, token]);

  const handleSelect = (user: GitHubUser) => {
    setSelected(user);
    setQuery(user.login);
    setOptions([]);
  };

  const chartData = data
    ? [
        { metric: 'Acceptance Rate', value: data.acceptanceRate },
        { metric: 'Review Cycles', value: data.reviewCycles },
        { metric: 'PR Size', value: data.prSize },
        { metric: 'Lead Time', value: data.leadTime },
        { metric: 'Reviews', value: data.reviewParticipation },
        { metric: 'Feedback', value: data.feedbackThoroughness },
        { metric: 'Issues Closed', value: data.issuesClosed },
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
          >
            <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
              <Avatar src={data.avatar_url} size={48} />
              <Heading as="h2" sx={{ fontSize: 3 }}>
                {data.login}
              </Heading>
            </Box>
          </Box>
          <Box
            p={3}
            borderWidth={1}
            borderStyle="solid"
            borderColor="border.default"
            borderRadius={2}
            boxShadow="shadow.medium"
          >
            <RadarChart width={500} height={400} data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </Box>
        </Box>
      )}
    </Box>
  );
}
