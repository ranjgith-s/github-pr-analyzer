import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useDeveloperMetrics } from '../../hooks/useDeveloperMetrics';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import DeveloperMetricCard from '../../components/DeveloperMetricCard/DeveloperMetricCard';
import ProfileHeader from './ProfileHeader';
import RadarChartCard from './RadarChartCard';
import { DeveloperMetrics } from 'src/types';

const METRIC_INFO = [
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

export default function DeveloperProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { token } = useAuth();
  const { data, loading } = useDeveloperMetrics(token!, username!);

  useDocumentTitle(
    data
      ? `${data.name || data.login} - Developer Insights`
      : 'Developer Insights'
  );
  useMetaDescription('Developer insights for GitHub pull requests.');

  const loadingMessages = [
    'Fetching user data...',
    'Analyzing contributions...',
    'Building radar chart...',
  ];

  return (
    <div style={{ padding: 24 }}>
      <LoadingOverlay show={loading} messages={loadingMessages} />
      {data && !loading && (
        <>
          <div className="grid gap-8 md:grid-cols-2">
            <ProfileHeader data={data} />
            <RadarChartCard data={data} />
          </div>
          <div className="mt-8">
            <div className="grid gap-6 md:grid-cols-3">
              {METRIC_INFO.map((info) => (
                <DeveloperMetricCard
                  key={info.name}
                  name={info.name}
                  brief={info.brief}
                  details={info.details}
                  valueDesc={info.valueDesc}
                  score={
                    data
                      ? (data[info.key as keyof DeveloperMetrics] as number)
                      : null
                  }
                  value={
                    data
                      ? (data[
                          info.valueKey as keyof DeveloperMetrics
                        ] as number)
                      : 0
                  }
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
