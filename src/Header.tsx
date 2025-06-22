import React, { useEffect, useState } from 'react';
import { Box, Avatar, Text, Button, Breadcrumbs } from '@heroui/react';
import { Octokit } from '@octokit/rest';
import { TriangleUpIcon, SignOutIcon } from '@primer/octicons-react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ColorModeToggle from './ColorModeToggle';

interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface BreadcrumbItem {
  label: string;
  to: string;
}

interface HeaderProps {
  breadcrumb?: BreadcrumbItem;
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
      as="header"
      className="app-header"
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
        sx={{ gap: 2, color: 'fg.default' }}
      >
        <TriangleUpIcon size={24} />
        <Breadcrumbs className="breadcrumbs-modern" sx={{ fontWeight: 'bold' }}>
          <Breadcrumbs.Item as={RouterLink} to="/">
            PR-ism
          </Breadcrumbs.Item>
          {breadcrumb && (
            <Breadcrumbs.Item as={RouterLink} to={breadcrumb.to}>
              {breadcrumb.label}
            </Breadcrumbs.Item>
          )}
        </Breadcrumbs>
      </Box>
      {user && (
        <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
          <ColorModeToggle />
          <Avatar src={user.avatar_url} size={24} />
          <Text fontSize={1} sx={{ fontFamily: 'mono' }}>
            {user.login}
          </Text>
          <Button onClick={logout} trailingIcon={SignOutIcon}>
            Sign out
          </Button>
        </Box>
      )}
    </Box>
  );
}
