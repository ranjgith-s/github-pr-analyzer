import React from 'react';
import { Box, Text } from '@primer/react';
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
        <Text fontSize={2} fontWeight="bold">
          Pull request insights
        </Text>
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
        <Text fontSize={2} fontWeight="bold">
          Developer PR Metrics Radar
        </Text>
        <Text as="p" mt={2} color="fg.muted">
          Visualize a developer&apos;s contributions and review activities
          across GitHub repositories using insightful radar metrics.
        </Text>
      </Box>
    </Box>
  );
}
