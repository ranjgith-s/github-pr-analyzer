import React, { useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
// Use the experimental DataTable component from Primer React
import { DataTable, Table, createColumnHelper } from '@primer/react/drafts';
import { Box, FormControl, Select, Text, Spinner, Link, Button, StateLabel } from '@primer/react';
import {useNavigate} from 'react-router-dom';


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
  const [repoFilter, setRepoFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const PAGE_SIZE = 25;
  const columnHelper = createColumnHelper();
  const navigate = useNavigate();

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    async function fetchData() {
      const octokit = new Octokit({ auth: token });
      try {
        const user = await octokit.rest.users.getAuthenticated();

        const authored = await octokit.rest.search.issuesAndPullRequests({
          q: `is:pr author:${user.data.login}`,
          per_page: 100,
        });

        const reviewed = await octokit.rest.search.issuesAndPullRequests({
          q: `is:pr reviewed-by:${user.data.login}`,
          per_page: 100,
        });

        const allItems = new Map();
        [...authored.data.items, ...reviewed.data.items].forEach((item) => {
          allItems.set(item.id, item);
        });

        const data = await Promise.all(
          Array.from(allItems.values()).map(async (item) => {
            const [owner, repo] = item.repository_url.split('/').slice(-2);
            const prNumber = item.number;

            const prData = await octokit.graphql(
              `query($owner:String!,$repo:String!,$number:Int!){
                 repository(owner:$owner,name:$repo){
                   pullRequest(number:$number){
                     id
                     title
                     author { login }
                     createdAt
                     publishedAt
                     closedAt
                     mergedAt
                     isDraft
                     reviews(first:100){
                       nodes{ author{login} state submittedAt }
                     }
                   }
                 }
               }`,
              { owner, repo, number: prNumber }
            );

            const pr = prData.repository.pullRequest;

            // fetch commits to determine lead time
            const commits = await octokit.paginate(
              octokit.rest.pulls.listCommits,
              {
                owner,
                repo,
                pull_number: prNumber,
                per_page: 100,
              }
            );
            const firstCommitAt = commits.reduce((earliest, c) => {
              const date = c.commit.author?.date || c.commit.committer?.date;
              return !earliest || new Date(date) < new Date(earliest)
                ? date
                : earliest;
            }, null);

            const reviewers = new Set();
            let firstReview = null;
            let changesRequested = 0;
            pr.reviews.nodes.forEach((rv) => {
              if (rv.author) reviewers.add(rv.author.login);
              if (rv.state === 'CHANGES_REQUESTED') changesRequested += 1;
              if (!firstReview || new Date(rv.submittedAt) < new Date(firstReview)) {
                firstReview = rv.submittedAt;
              }
            });

            return {
              id: pr.id,
              owner,
              repo_name: repo,
              repo: `${owner}/${repo}`,
              number: prNumber,
              title: pr.title,
              url: item.html_url,
              author: pr.author ? pr.author.login : 'unknown',
              state: pr.isDraft ? 'draft' : pr.mergedAt ? 'merged' : pr.closedAt ? 'closed' : 'open',
              created_at: pr.createdAt,
              published_at: pr.publishedAt,
              closed_at: pr.mergedAt || pr.closedAt,
              first_review_at: firstReview,
              first_commit_at: firstCommitAt,
              reviewers: reviewers.size,
              changes_requested: changesRequested,
              timeline: [
                {label: 'Created', date: pr.createdAt},
                {label: 'Published', date: pr.publishedAt},
                {label: 'First review', date: firstReview},
                {label: 'Closed', date: pr.mergedAt || pr.closedAt}
              ].filter(e => e.date)
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

  const repos = Array.from(new Set(items.map((i) => i.repo))).sort();
  const authors = Array.from(new Set(items.map((i) => i.author))).sort();

  const filteredItems = items.filter((item) => {
    return (
      (!repoFilter || item.repo === repoFilter) &&
      (!authorFilter || item.author === authorFilter)
    );
  });

  useEffect(() => {
    setPageIndex(0);
  }, [repoFilter, authorFilter]);

  const paginatedItems = filteredItems.slice(
    pageIndex * PAGE_SIZE,
    pageIndex * PAGE_SIZE + PAGE_SIZE
  );

  const selectedItem = items.find((i) => selectedIds.includes(i.id));

  const columns = [
    columnHelper.column({
      id: 'select',
      header: '',
      renderCell: row => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
        />
      )
    }),
    columnHelper.column({id: 'repo', header: 'Repository', field: 'repo', rowHeader: true}),
    columnHelper.column({
      id: 'title',
      header: 'Title',
      renderCell: row => (
        <Link
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'fg.default',
            textDecoration: 'none',
            '&:hover': {color: 'accent.fg', textDecoration: 'underline'}
          }}
        >
          {row.title}
        </Link>
      )
    }),
    columnHelper.column({
      id: 'author',
      header: 'Author',
      renderCell: row => (
        <Link
          href={`https://github.com/${row.author}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.author}
        </Link>
      )
    }),
    columnHelper.column({id: 'reviewers', header: 'Reviewers', field: 'reviewers'}),
    columnHelper.column({id: 'changes_requested', header: 'Changes Requested', field: 'changes_requested'}),
    columnHelper.column({
      id: 'draft_time',
      header: 'Draft Time',
      renderCell: row => formatDuration(row.created_at, row.published_at)
    }),
    columnHelper.column({
      id: 'first_review',
      header: 'First Review',
      renderCell: row => formatDuration(row.created_at, row.first_review_at)
    }),
    columnHelper.column({
      id: 'time_to_close',
      header: 'Time to Close',
      renderCell: row => formatDuration(row.created_at, row.closed_at)
    }),
    columnHelper.column({
      id: 'lead_time',
      header: 'Lead Time',
      renderCell: row => formatDuration(row.first_commit_at, row.closed_at)
    }),
    columnHelper.column({
      id: 'state',
      header: 'State',
      renderCell: row => {
        const statusMap = {
          open: 'pullOpened',
          closed: 'pullClosed',
          merged: 'pullMerged',
          draft: 'draft'
        };
        return <StateLabel status={statusMap[row.state]}>{row.state}</StateLabel>;
      }
    })
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{minHeight: '50vh'}}
      >
        <Spinner size="large" />
        <Text sx={{fontFamily: 'mono', mt: 2}}>
          looking into the pulls that you were involved in
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" marginBottom={3} sx={{ gap: 3 }}>
        <FormControl>
          <FormControl.Label>Repository</FormControl.Label>
          <Select value={repoFilter} onChange={(e) => setRepoFilter(e.target.value)}>
            <Select.Option value="">All</Select.Option>
            {repos.map((r) => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormControl.Label>Author</FormControl.Label>
          <Select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)}>
            <Select.Option value="">All</Select.Option>
            {authors.map((a) => (
              <Select.Option key={a} value={a}>
                {a}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      </Box>
      {selectedIds.length === 1 && (
        <Box marginBottom={2}>
          <Button onClick={() => navigate(`/pr/${selectedItem.owner}/${selectedItem.repo_name}/${selectedItem.number}`, { state: selectedItem })}>
            View pull request
          </Button>
        </Box>
      )}
      <DataTable
        aria-labelledby="pr-table"
        columns={columns}
        data={paginatedItems}
        cellPadding="condensed"
      />
      <Table.Pagination
        aria-label="Pagination"
        pageSize={PAGE_SIZE}
        totalCount={filteredItems.length}
        onChange={({pageIndex}) => setPageIndex(pageIndex)}
      />
    </>
  );
}
