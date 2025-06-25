import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useRepoInsights } from './hooks/useRepoInsights';
import LoadingOverlay from './LoadingOverlay';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useMetaDescription } from './hooks/useMetaDescription';
import { Input, Button, Card } from '@heroui/react';

export default function RepoInsightsPage() {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [owner, setOwner] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const { data, loading, error } = useRepoInsights(token!, owner, repo);
  const loadingMessages = [
    'Fetching repository info...',
    'Crunching numbers...',
    'Analyzing pull requests...',
  ];

  useDocumentTitle('Repository insights');
  useMetaDescription('Repository metrics and DevOps insights.');

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
      alert('Enter a repository in the format owner/repo');
    }
  };

  return (
    <div className="p-6 relative">
      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex gap-2">
          <Input
            placeholder="Enter repository (owner/repo or URL)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow"
            aria-label="Repository input"
            isClearable
          />
          <Button type="submit" color="primary" className="px-6">
            Load Insights
          </Button>
        </div>
      </form>

      <LoadingOverlay show={loading} messages={loadingMessages} />

      {error && <div className="text-danger mb-6">{error}</div>}

      {data && !loading && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Repository Insights</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Deployment Frequency"
              value={`${data.deploymentFrequency} pushes`}
            />
            <MetricCard
              title="Lead Time for Changes"
              value={`${data.leadTime.toFixed(2)} hours`}
            />
            <MetricCard
              title="Change Failure Rate"
              value={`${(data.changeFailureRate * 100).toFixed(1)}%`}
            />
            <MetricCard
              title="Mean Time to Restore"
              value={`${data.meanTimeToRestore.toFixed(2)} hours`}
            />
            <MetricCard title="Open Issue Count" value={data.openIssues} />
            <MetricCard
              title="Open Pull Request Count"
              value={data.openPullRequests}
            />
            <MetricCard
              title="Average PR Merge Time"
              value={`${data.averageMergeTime.toFixed(2)} hours`}
            />
            <MetricCard
              title="Weekly Commit Activity"
              value={data.weeklyCommits.join(', ')}
            />
            <MetricCard
              title="Contributor Count"
              value={data.contributorCount}
            />
            <MetricCard
              title="Community Health Score"
              value={data.communityHealthScore}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
}

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <Card className="p-4 rounded-lg border border-divider shadow-md">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <span className="text-base font-bold text-foreground">{value}</span>
    </Card>
  );
}
