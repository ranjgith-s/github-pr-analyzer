import React, { useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/solid';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Avatar, Breadcrumbs, BreadcrumbItem, Button } from '@heroui/react';
import { ChevronUpIcon } from 'lucide-react';

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
    <header className="w-full px-6 py-3 border-divider bg-background/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <Breadcrumbs
          variant="light"
          size="md"
          underline="hover"
          className="font-bold"
        >
          <BreadcrumbItem>
            <RouterLink to="/" className="flex items-center gap-1">
              <ChevronUpIcon/>
              PR-ism
            </RouterLink>
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
          <Avatar src={user.avatar_url} alt="avatar" size="sm" />
          <span className="font-mono text-sm px-2">{user.login}</span>
          <Button
            variant="bordered"
            color="primary"
            size="sm"
            endContent={
              <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
            }
            onPress={logout}
          >
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}
