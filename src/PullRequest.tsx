import React, { useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
import { Timeline, Heading, TabNav } from '@heroui/react';
import { Box, Spinner, Button, Text } from '@heroui/react';
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, owner, repo, number, location.state]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Button as={RouterLink} to="/insights" sx={{ mb: 3 }}>
        Back to insights
      </Button>
      <Heading as="h2" sx={{ mb: 3 }}>
        {title}
      </Heading>
      <TabNav aria-label="Pull request views" sx={{ mb: 3 }}>
        <TabNav.Link selected>Timeline</TabNav.Link>
      </TabNav>
      <Timeline>
        {events?.map((ev, i) => (
          <Timeline.Item key={i}>
            <Timeline.Badge />
            <Timeline.Body>
              <Text>{`${ev.label}: ${new Date(ev.date).toLocaleString()}`}</Text>
            </Timeline.Body>
          </Timeline.Item>
        ))}
      </Timeline>
    </Box>
  );
}
