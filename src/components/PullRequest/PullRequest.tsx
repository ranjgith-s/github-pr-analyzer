import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import { Card, Breadcrumbs, BreadcrumbItem } from '../ui';
import { Button } from '../ui-bridge';
import { fetchPullRequestDetails } from '../../utils/services/githubService';

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
      if (!token || !owner || !repo || !number) return;
      try {
        const pr = await fetchPullRequestDetails(token, owner, repo, number);
        setTitle(pr.title);
        const firstReview = pr.reviews.nodes.reduce(
          (acc: string | null, rv: { submittedAt: string }) => {
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
      <div className="flex justify-center items-center mt-12">
        <span>Loading pull request details...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs className="mb-4">
        <BreadcrumbItem href="/insights">Insights</BreadcrumbItem>
        <BreadcrumbItem isCurrent>{title}</BreadcrumbItem>
      </Breadcrumbs>
      <Card className="mb-6 p-4">
        <h2 className="text-xl font-bold mb-2 text-foreground">{title}</h2>
        <div className="mb-4">
          {events && (
            <ol className="relative border-s border-border pl-6">
              {events.map((e) => (
                <li
                  key={`${e.label}-${e.date}`}
                  className="mb-6 last:mb-0 flex items-start"
                >
                  <span
                    className="flex-shrink-0 w-3 h-3 mt-1.5 rounded-full bg-primary border-2 border-background shadow"
                    aria-hidden="true"
                  ></span>
                  <div className="ml-4">
                    <span className="block font-semibold text-primary">
                      {e.label}
                    </span>
                    <span className="block text-sm text-foreground/70">
                      {e.date}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <Button as="a" href="/insights" color="primary" variant="flat">
          Back to Insights
        </Button>
      </Card>
      {/* Add more PR details as needed */}
    </div>
  );
}
