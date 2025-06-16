import React, { useEffect, useState } from 'react';
import { Box, Avatar, Text, Button, Breadcrumbs } from '@primer/react';
import { Octokit } from '@octokit/rest';
import { TriangleUpIcon } from '@primer/octicons-react';
import { useAuth } from './AuthContext';

interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface HeaderProps {
  breadcrumb?: string;
}

export default function Header({ breadcrumb }: HeaderProps) {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<GitHubUser | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const octokit = new Octokit({ auth: token });
      try {
        const { data } = await octokit.rest.users.getAuthenticated();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, [token]);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      p={3}
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderColor="border.default"
      sx={{ bg: 'canvas.subtle' }}
    >
      <Box
        display="flex"
        alignItems="center"
        sx={{ gap: 2, color: 'accent.fg' }}
      >
        <TriangleUpIcon size={24} fill="blue" />
        <Breadcrumbs sx={{ fontWeight: 'bold' }}>
          <Breadcrumbs.Item to="/">PR-ism</Breadcrumbs.Item>
          {breadcrumb && <Breadcrumbs.Item>{breadcrumb}</Breadcrumbs.Item>}
        </Breadcrumbs>
      </Box>
      {user && (
        <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
          <Avatar src={user.avatar_url} size={24} />
          <Text>{user.login}</Text>
          <Button onClick={logout}>Logout</Button>
        </Box>
      )}
    </Box>
  );
}
