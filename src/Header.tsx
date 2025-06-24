import React, { useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
import {
  ChevronUpIcon,
  ArrowLeftStartOnRectangleIcon,
} from '@heroicons/react/24/solid';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Avatar, Breadcrumbs, BreadcrumbItem, Button } from '@heroui/react';

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
    <div className="app-header flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-background/60 backdrop-blur-md dark:bg-background/60">
      <div className="flex items-center gap-2 text-foreground">
        <ChevronUpIcon width={24} height={24} />
        <Breadcrumbs
          variant="light"
          color="primary"
          size="md"
          underline="hover"
          className="font-bold"
        >
          <BreadcrumbItem color="primary">
            <RouterLink to="/">PR-ism</RouterLink>
          </BreadcrumbItem>
          {breadcrumb && (
            <BreadcrumbItem color="foreground" isCurrent>
              {breadcrumb.label}
            </BreadcrumbItem>
          )}
        </Breadcrumbs>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <Avatar
            src={user.avatar_url}
            alt="avatar"
            size="sm"
          />
          <span className="font-mono text-sm">{user.login}</span>
          <Button
            variant="bordered"
            color="primary"
            size="sm"
            className="flex items-center gap-1 px-3 py-1"
            endContent={
              <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
            }
            onPress={logout}
          >
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}
