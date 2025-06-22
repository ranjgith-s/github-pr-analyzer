import React, { useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useMetaDescription } from './hooks/useMetaDescription';

interface TimelineEntry {
  label: string;
  date: string;
}
export default function PullRequestPage() {
  const { token } = useAuth();
  const { owner, repo, number } = useParams();
  const location = useLocation();
  const [events, setEvents] = useState<TimelineEntry[] | null>(null);
  const [title, setTitle] = useState<string>(location.state?.title || '');
  const [loading, setLoading] = useState<boolean>(true);

  useDocumentTitle(title);
  useMetaDescription(title ? `Details for PR ${title}` : null);

  useEffect(() => {
    async function fetchData() {
      if (location.state && location.state.timeline && location.state.title) {
        setEvents(location.state.timeline);
        setTitle(location.state.title);
        setLoading(false);
        return;
      }
      const octokit = new Octokit({ auth: token });
      try {
        const { repository } = await octokit.graphql<any>(
          `query($owner:String!,$repo:String!,$number:Int!){
            repository(owner:$owner,name:$repo){
              pullRequest(number:$number){
                title
                createdAt
                publishedAt
                closedAt
                mergedAt
                reviews(first:100){ nodes{ submittedAt } }
              }
            }
          }`,
          { owner, repo, number: Number(number) }
        );
        const pr = repository.pullRequest;
        setTitle(pr.title);
        const firstReview = pr.reviews.nodes.reduce<string | null>(
          (acc, rv) => {
            return !acc || new Date(rv.submittedAt) < new Date(acc)
              ? rv.submittedAt
              : acc;
          },
          null
        );
        const timeline = [
          { label: 'Created', date: pr.createdAt },
          { label: 'Published', date: pr.publishedAt },
          { label: 'First review', date: firstReview },
          { label: 'Closed', date: pr.mergedAt || pr.closedAt },
        ].filter((e) => e.date);
        setEvents(timeline);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, location, owner, repo, number]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>{title}</h2>
      <nav style={{ marginBottom: 16 }}>
        <RouterLink to="/insights">Back to Insights</RouterLink>
      </nav>
      <div style={{ marginBottom: 24 }}>
        {events &&
          events.map((e, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold' }}>{e.label}:</span> {e.date}
            </div>
          ))}
      </div>
      {/* Add more PR details as needed */}
    </div>
  );
}
