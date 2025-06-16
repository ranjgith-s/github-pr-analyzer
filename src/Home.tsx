import React from 'react';
import { Box, Text } from '@primer/react';
import { Link as RouterLink } from 'react-router-dom';

export default function Home() {
  return (
    <Box display="flex" justifyContent="center" mt={6}>
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
    </Box>
  );
}
