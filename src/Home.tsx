import React from 'react';
import { Box, Text } from '@primer/react';
import {
  RepoIcon,
  PeopleIcon,
  GitPullRequestIcon,
} from '@primer/octicons-react';
import { Link as RouterLink } from 'react-router-dom';

export default function Home() {
  return (
    <Box display="flex" justifyContent="center" mt={6} sx={{ gap: 3 }}>
      <Box
        as={RouterLink}
        to="/insights"
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.default',
          borderRadius: 2,
          boxShadow: 'shadow.medium',
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': { boxShadow: 'shadow.large', textDecoration: 'none' },
        }}
      >
        <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
          <GitPullRequestIcon />
          <Text fontSize={2} fontWeight="bold">
            Pull request insights
          </Text>
        </Box>
        <Text as="p" mt={2} color="fg.muted">
          Dive into metrics about your pull requests to track review timelines
          and lead time.
        </Text>
      </Box>
      <Box
        as={RouterLink}
        to="/developer"
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.default',
          borderRadius: 2,
          boxShadow: 'shadow.medium',
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': { boxShadow: 'shadow.large', textDecoration: 'none' },
        }}
      >
        <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
          <PeopleIcon />
          <Text fontSize={2} fontWeight="bold">
            Developer Insights
          </Text>
        </Box>
        <Text as="p" mt={2} color="fg.muted">
          Visualize a developer&apos;s contributions and review activities
          across GitHub repositories using insightful radar metrics.
        </Text>
      </Box>
      <Box
        as={RouterLink}
        to="/repo"
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.default',
          borderRadius: 2,
          boxShadow: 'shadow.medium',
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': { boxShadow: 'shadow.large', textDecoration: 'none' },
        }}
      >
        <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
          <RepoIcon />
          <Text fontSize={2} fontWeight="bold">
            Repo Insights
          </Text>
        </Box>
        <Text as="p" mt={2} color="fg.muted">
          Explore repository health and DevOps metrics calculated from GitHub.
        </Text>
      </Box>
    </Box>
  );
}
