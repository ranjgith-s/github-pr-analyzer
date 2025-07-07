import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useRepoInsights } from '../../hooks/useRepoInsights';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import { Card } from '@heroui/react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';

export default function RepoMetrics() {
  const { token } = useAuth();
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { data, loading, error } = useRepoInsights(
    token!,
    owner || null,
    repo || null
  );

  useDocumentTitle(`Repo Insights: ${owner}/${repo}`);
  useMetaDescription(
    `Insights and metrics for the repository ${owner}/${repo} including deployment frequency, lead time, and more.`
  );

  if (loading)
    return (
      <LoadingOverlay
        show={true}
        messages={[
          'Fetching repository info...',
          'Crunching numbers...',
          'Analyzing pull requests...',
        ]}
      />
    );
  if (error) return <div className="text-danger mb-6">{error}</div>;
  if (!data) return null;

  return (
    <div className="w-full max-w-5xl mt-10 mx-auto">
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
        <MetricCard title="Contributor Count" value={data.contributorCount} />
        <MetricCard
          title="Community Health Score"
          value={data.communityHealthScore}
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="p-4 rounded-lg border border-divider shadow-md">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <span className="text-base font-bold text-foreground">{value}</span>
    </Card>
  );
}
