import React, { useState, useEffect } from 'react';
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
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <h2 style={{ fontSize: 32 }}>Developer insights</h2>
        <SearchUserBox
          query={query}
          options={options}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />
      </div>

      <LoadingOverlay show={loading} messages={loadingMessages} />

      {data && !loading && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 32,
            }}
          >
            <div
              style={{
                padding: 24,
                border: '1px solid #eee',
                borderRadius: 16,
                boxShadow: '0 2px 8px 0 rgba(80, 120, 255, 0.08)',
                animation: 'fadeInUp 0.3s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <img
                  src={data.avatar_url}
                  alt="avatar"
                  width={64}
                  height={64}
                  style={{ borderRadius: '50%' }}
                />
                <div>
                  <h2 style={{ fontSize: 24, margin: 0 }}>
                    {data.name || data.login}
                  </h2>
                  <span style={{ color: '#888' }}>{data.login}</span>
                </div>
              </div>
              {data.bio && (
                <p style={{ marginTop: 16, maxWidth: 300 }}>{data.bio}</p>
              )}
              <div style={{ marginTop: 16, display: 'grid', rowGap: 4 }}>
                {data.company && <span>🏢 {data.company}</span>}
                {data.location && <span>📍 {data.location}</span>}
                <span>Repos: {data.public_repos}</span>
                <span>Followers: {data.followers}</span>
                <span>Following: {data.following}</span>
                <a
                  href={data.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </div>
            </div>
            <div
              style={{
                padding: 24,
                border: '1px solid #eee',
                borderRadius: 16,
                boxShadow: '0 2px 8px 0 rgba(80, 120, 255, 0.08)',
                animation: 'fadeInUp 0.3s ease-out',
              }}
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
            </div>
          </div>
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 24,
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
