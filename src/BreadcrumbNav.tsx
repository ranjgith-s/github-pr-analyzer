import React from 'react';
import { Box, Breadcrumbs } from '@primer/react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';

export default function BreadcrumbNav() {
  const location = useLocation();
  const { owner, repo, number } = useParams();

  const items = [
    <Breadcrumbs.Item key="home" as={RouterLink} to="/">
      Pull Requests
    </Breadcrumbs.Item>,
  ];

  if (location.pathname.startsWith('/pr/')) {
    items.push(
      <Breadcrumbs.Item key="pr">{`${owner}/${repo} #${number}`}</Breadcrumbs.Item>
    );
  }

  return (
    <Box
      p={3}
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderColor="border.default"
      sx={{ bg: 'canvas.subtle' }}
    >
      <Breadcrumbs>{items}</Breadcrumbs>
    </Box>
  );
}
