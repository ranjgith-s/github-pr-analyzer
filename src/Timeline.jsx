import React, {useEffect, useState} from 'react';
import {Octokit} from '@octokit/rest';
import {Timeline} from '@primer/react';
import {Box, Spinner, Button, Text} from '@primer/react';
import {useParams, useLocation, Link as RouterLink} from 'react-router-dom';

export default function TimelinePage({token}) {
  const {owner, repo, number} = useParams();
  const location = useLocation();
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (location.state && location.state.timeline) {
        setEvents(location.state.timeline);
        setLoading(false);
        return;
      }
      const octokit = new Octokit({auth: token});
      try {
        const {repository} = await octokit.graphql(
          `query($owner:String!,$repo:String!,$number:Int!){
            repository(owner:$owner,name:$repo){
              pullRequest(number:$number){
                createdAt
                publishedAt
                closedAt
                mergedAt
                reviews(first:100){ nodes{ submittedAt } }
              }
            }
          }`,
          {owner, repo, number: parseInt(number, 10)}
        );
        const pr = repository.pullRequest;
        const firstReview = pr.reviews.nodes.reduce((acc, rv) => {
          return !acc || new Date(rv.submittedAt) < new Date(acc)
            ? rv.submittedAt
            : acc;
        }, null);
        const timeline = [
          {label: 'Created', date: pr.createdAt},
          {label: 'Published', date: pr.publishedAt},
          {label: 'First review', date: firstReview},
          {label: 'Closed', date: pr.mergedAt || pr.closedAt}
        ].filter(e => e.date);
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
      <Button as={RouterLink} to="/" sx={{mb: 3}}>
        Back
      </Button>
      <Timeline>
        {events.map((ev, i) => (
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
