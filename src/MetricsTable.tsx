import React, { useEffect, useState } from "react";
// Use the experimental DataTable component from Primer React
import { DataTable, Table, createColumnHelper } from "@primer/react/drafts";
import {
  Box,
  FormControl,
  Select,
  Text,
  Spinner,
  Link,
  Button,
  StateLabel,
  Tooltip,
} from "@primer/react";
import { useNavigate } from "react-router-dom";
import { usePullRequestMetrics } from "./hooks/usePullRequestMetrics";
import { PRItem } from "./types";

interface MetricsTableProps {
  token: string;
}



function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return "N/A";
  const diffMs = new Date(end) - new Date(start);
  if (diffMs < 0) return "N/A";
  const diffHours = Math.floor(diffMs / 36e5);
  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

export default function MetricsTable({ token }: MetricsTableProps) {
  const { items, loading } = usePullRequestMetrics(token);
  const [repoFilter, setRepoFilter] = useState<string>("");
  const [authorFilter, setAuthorFilter] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const PAGE_SIZE = 25;
  const columnHelper = createColumnHelper<PRItem>();
  const navigate = useNavigate();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };


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
    pageIndex * PAGE_SIZE + PAGE_SIZE,
  );

  const selectedItem = items.find((i) => selectedIds.includes(i.id));

  const columns = [
    columnHelper.column({
      id: "select",
      header: "",
      renderCell: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
        />
      ),
    }),
    columnHelper.column({
      id: "repo",
      header: "Repository",
      field: "repo",
      rowHeader: true,
    }),
    columnHelper.column({
      id: "title",
      header: "Title",
      renderCell: (row) => (
        <Link
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "fg.default",
            textDecoration: "none",
            "&:hover": { color: "accent.fg", textDecoration: "underline" },
          }}
        >
          {row.title}
        </Link>
      ),
    }),
    columnHelper.column({
      id: "author",
      header: "Author",
      renderCell: (row) => (
        <Link
          href={`https://github.com/${row.author}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.author}
        </Link>
      ),
    }),
    columnHelper.column({
      id: "reviewers",
      header: "Reviewers",
      field: "reviewers",
    }),
    columnHelper.column({
      id: "changes_requested",
      header: "Changes Requested",
      field: "changes_requested",
    }),
    columnHelper.column({
      id: "diff",
      header: "Diff",
      renderCell: (row) => (
        <Text as="span">
          <Text as="span" color="success.fg">{`+${row.additions}`}</Text>{" "}
          <Text as="span" color="danger.fg">{`-${row.deletions}`}</Text>
        </Text>
      ),
    }),
    columnHelper.column({
      id: "comment_count",
      header: "Comments",
      field: "comment_count",
    }),
    columnHelper.column({
      id: "timeline",
      header: "Timeline",
      renderCell: (row) => {
        const created = new Date(row.created_at);
        const published = row.published_at ? new Date(row.published_at) : created;
        const reviewed = row.first_review_at ? new Date(row.first_review_at) : published;
        const closed = row.closed_at ? new Date(row.closed_at) : reviewed;
        const draftMs = Math.max(published.getTime() - created.getTime(), 0);
        const reviewMs = Math.max(reviewed.getTime() - published.getTime(), 0);
        const closeMs = Math.max(closed.getTime() - reviewed.getTime(), 0);
        const total = draftMs + reviewMs + closeMs || 1;

        const tooltipText = [
          `Draft: ${formatDuration(row.created_at, row.published_at)}`,
          `Review: ${formatDuration(
            row.published_at || row.created_at,
            row.first_review_at,
          )}`,
          `Close: ${formatDuration(
            row.first_review_at || row.published_at || row.created_at,
            row.closed_at,
          )}`,
        ].join("\n");

        return (
          <Tooltip aria-label={tooltipText} direction="s">
            <Box
              display="flex"
              height="6px"
              width={80}
              sx={{ overflow: "hidden", borderRadius: 1 }}
            >
              <Box
                bg="accent.emphasis"
                style={{ width: `${(draftMs / total) * 100}%` }}
              />
              <Box
                bg="attention.emphasis"
                style={{ width: `${(reviewMs / total) * 100}%` }}
              />
              <Box
                bg="success.emphasis"
                style={{ width: `${(closeMs / total) * 100}%` }}
              />
            </Box>
          </Tooltip>
        );
      },
    }),
    columnHelper.column({
      id: "lead_time",
      header: "Lead Time",
      renderCell: (row) => formatDuration(row.first_commit_at, row.closed_at),
    }),
    columnHelper.column({
      id: "state",
      header: "State",
      renderCell: (row) => {
        const statusMap = {
          open: "pullOpened",
          closed: "pullClosed",
          merged: "pullMerged",
          draft: "draft",
        };
        return (
          <StateLabel status={statusMap[row.state]}>{row.state}</StateLabel>
        );
      },
    }),
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "50vh" }}
      >
        <Spinner size="large" />
        <Text sx={{ fontFamily: "mono", mt: 2 }}>
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
          <Select
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
          >
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
          <Select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
          >
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
          <Button
            onClick={() =>
              navigate(
                `/pr/${selectedItem!.owner}/${selectedItem!.repo_name}/${selectedItem!.number}`,
                { state: selectedItem },
              )
            }
          >
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
        onChange={({ pageIndex }) => setPageIndex(pageIndex)}
      />
    </>
  );
}
