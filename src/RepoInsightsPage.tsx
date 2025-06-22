import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useRepoInsights } from './hooks/useRepoInsights';
import LoadingOverlay from './LoadingOverlay';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useMetaDescription } from './hooks/useMetaDescription';

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
    <div style={{ padding: 24, position: 'relative' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
          <input
            placeholder="owner/repo or URL"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flexGrow: 1,
              padding: 8,
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              background: '#2da44e',
              color: '#fff',
              border: 'none',
            }}
          >
            Load
          </button>
        </div>
      </form>

      <LoadingOverlay show={loading} messages={loadingMessages} />

      {error && <div style={{ color: 'red', marginBottom: 24 }}>{error}</div>}

      {data && !loading && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>
            Repository Insights
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
              gap: 24,
            }}
          >
            <MetricCard
              title="Deployment Frequency"
              value={`${data.deploymentFrequency} pushes`}
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
    <div
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h3>
      <span style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
        {value}
      </span>
    </div>
  );
}
