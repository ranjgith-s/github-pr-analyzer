import React, { useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
// Table is currently an experimental component so we import it from the
// drafts entry point rather than the main package index.
import { Table } from '@primer/react/drafts';

function formatDuration(start, end) {
  if (!start || !end) return 'N/A';
  const diffMs = new Date(end) - new Date(start);
  if (diffMs < 0) return 'N/A';
  const diffHours = Math.floor(diffMs / 36e5);
  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

export default function MetricsTable({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const octokit = new Octokit({ auth: token });
      try {
        const user = await octokit.rest.users.getAuthenticated();
        const q = `is:pr author:${user.data.login}`;
        const search = await octokit.rest.search.issuesAndPullRequests({ q });
        const data = await Promise.all(
          search.data.items.map(async (item) => {
            const [owner, repo] = item.repository_url.split('/').slice(-2);
            const prNumber = item.number;
            const { data: pr } = await octokit.rest.pulls.get({
              owner,
              repo,
              pull_number: prNumber,
            });
            const { data: reviews } = await octokit.rest.pulls.listReviews({
              owner,
              repo,
              pull_number: prNumber,
            });

            let firstReview = null;
            const reviewers = new Set();
            let changesRequested = 0;
            reviews.forEach((rv) => {
              reviewers.add(rv.user.login);
              if (rv.state === 'CHANGES_REQUESTED') changesRequested += 1;
              if (!firstReview || new Date(rv.submitted_at) < new Date(firstReview)) {
                firstReview = rv.submitted_at;
              }
            });

            return {
              id: pr.id,
              repo: `${owner}/${repo}`,
              title: pr.title,
              state: pr.state,
              created_at: pr.created_at,
              closed_at: pr.merged_at || pr.closed_at,
              first_review_at: firstReview,
              reviewers: reviewers.size,
              changes_requested: changesRequested,
            };
          })
        );
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Table.Container>
      <Table aria-label="pull request metrics">
        <Table.Head>
          <Table.Row>
            <Table.Cell header>Repository</Table.Cell>
            <Table.Cell header>Title</Table.Cell>
            <Table.Cell header>Reviewers</Table.Cell>
            <Table.Cell header>Changes Requested</Table.Cell>
            <Table.Cell header>First Review</Table.Cell>
            <Table.Cell header>Time to Close</Table.Cell>
            <Table.Cell header>State</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {items.map((pr) => (
            <Table.Row key={pr.id}>
              <Table.Cell>{pr.repo}</Table.Cell>
              <Table.Cell>{pr.title}</Table.Cell>
              <Table.Cell>{pr.reviewers}</Table.Cell>
              <Table.Cell>{pr.changes_requested}</Table.Cell>
              <Table.Cell>
                {formatDuration(pr.created_at, pr.first_review_at)}
              </Table.Cell>
              <Table.Cell>
                {formatDuration(pr.created_at, pr.closed_at)}
              </Table.Cell>
              <Table.Cell>{pr.state}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Table.Container>
  );
}
