import React, { useEffect, useState } from 'react';
import { Box, TextInput, Button, Heading, Spinner, Text } from '@primer/react';
import { useAuth } from './AuthContext';
import { useRepoInsights } from './hooks/useRepoInsights';

export default function RepoInsightsPage() {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [owner, setOwner] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const { data, loading, error } = useRepoInsights(token!, owner, repo);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const loadingMessages = [
    'Fetching repo info...',
    'Crunching numbers...',
    'Analyzing pull requests...',
  ];

  useEffect(() => {
    const prev = document.title;
    document.title = 'Repo insights';
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(id);
  }, [loading, loadingMessages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pattern = /^(?:https?:\/\/github.com\/)?([^/]+)\/([^/]+)$/i;
    const match = input.trim().match(pattern);
    if (match) {
      setOwner(match[1]);
      setRepo(match[2]);
    } else {
      setOwner(null);
      setRepo(null);
      alert('Enter a valid GitHub repo URL like owner/repo');
    }
  };

  return (
    <Box p={3} position="relative">
      <form onSubmit={handleSubmit}>
        <Box mb={3} display="flex" sx={{ gap: 2 }}>
          <TextInput
            placeholder="owner/repo or URL"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button type="submit">Load</Button>
        </Box>
      </form>

      {loading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          sx={{ bg: 'canvas.overlay', opacity: 0.9, zIndex: 10 }}
        >
          <Spinner size="large" />
          <Text
            mt={2}
            sx={{
              fontFamily: 'mono',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            {loadingMessages[loadingMsgIndex]}
          </Text>
        </Box>
      )}

      {error && (
        <Text color="danger.fg" mb={3} display="block">
          {error}
        </Text>
      )}

      {data && !loading && (
        <Box
          display="grid"
          sx={{
            gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
            gap: 3,
          }}
        >
          <MetricCard
            title="Deployment Frequency"
            value={data.deploymentFrequency}
          />
          <MetricCard
            title="Lead Time for Changes"
            value={`${data.leadTime.toFixed(2)}h`}
          />
          <MetricCard
            title="Change Failure Rate"
            value={`${(data.changeFailureRate * 100).toFixed(1)}%`}
          />
          <MetricCard
            title="Mean Time to Restore"
            value={`${data.meanTimeToRestore.toFixed(2)}h`}
          />
          <MetricCard title="Open Issue Count" value={data.openIssues} />
          <MetricCard
            title="Open Pull Request Count"
            value={data.openPullRequests}
          />
          <MetricCard
            title="Average PR Merge Time"
            value={`${data.averageMergeTime.toFixed(2)}h`}
          />
          <MetricCard
            title="Weekly Commit Activity"
            value={data.weeklyCommits.join(', ')}
          />
          <MetricCard title="Contributor Count" value={data.contributorCount} />
          <MetricCard
            title="Community Health Score"
            value={data.communityHealthScore}
          />
        </Box>
      )}
    </Box>
  );
}

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
}

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <Box
      borderWidth={1}
      borderStyle="solid"
      borderColor="border.default"
      borderRadius={2}
      p={3}
      boxShadow="shadow.medium"
    >
      <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>
        {title}
      </Heading>
      <Text fontSize={1}>{value}</Text>
    </Box>
  );
}
