import React, { useEffect, useState } from 'react';
import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/solid';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { Avatar, Button } from '../ui';
import {
  ShadBreadcrumb as Breadcrumb,
  ShadBreadcrumbList as BreadcrumbList,
  ShadBreadcrumbItem as BreadcrumbItem,
  ShadBreadcrumbSeparator as BreadcrumbSeparator,
  ShadBreadcrumbLink as BreadcrumbLink,
  ShadBreadcrumbPage as BreadcrumbPage,
} from '../ui';
import { ChevronUpIcon } from 'lucide-react';
import { getAuthenticatedUserProfile } from '../../utils/services/githubService';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';

interface GitHubUser {
  login: string;
  avatar_url: string;
}

// Renamed to avoid confusion with imported BreadcrumbItem component
interface AppBreadcrumb {
  label: string;
  to: string;
}

interface HeaderProps {
  breadcrumbs?: AppBreadcrumb[];
}

export default function Header({ breadcrumbs }: HeaderProps) {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<GitHubUser | null>(null);

  useEffect(() => {
    async function fetchUser() {
      if (!token) return;
      try {
        const userData = await getAuthenticatedUserProfile(token);
        setUser(userData);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, [token]);

  return (
    <header className="w-full px-6 py-3 border-border bg-background/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <Breadcrumb className="font-bold">
          <BreadcrumbList>
            <BreadcrumbItem key="root">
              <BreadcrumbLink asChild>
                <RouterLink to="/" className="flex items-center gap-1">
                  <ChevronUpIcon />
                  PR-ism
                </RouterLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs && breadcrumbs.length > 0 && <BreadcrumbSeparator />}
            {breadcrumbs &&
              breadcrumbs.map((bc, i) => (
                <React.Fragment key={`${bc.to || 'nolink'}::${bc.label}`}>
                  <BreadcrumbItem
                    aria-current={
                      i === breadcrumbs.length - 1 ? 'page' : undefined
                    }
                  >
                    {i === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{bc.label}</BreadcrumbPage>
                    ) : bc.to ? (
                      <BreadcrumbLink asChild>
                        <RouterLink to={bc.to}>{bc.label}</RouterLink>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbLink>{bc.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <>
            <Avatar className="h-6 w-6">
              <img
                src={user.avatar_url}
                alt="avatar"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </Avatar>
            <span className="text-sm font-medium font-mono text-muted-foreground">
              {user.login}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={logout}
              className="gap-1"
            >
              <ArrowLeftStartOnRectangleIcon className="w-4 h-4" />
            </Button>
          </>
        )}
        <ThemeSwitcher />
      </div>
    </header>
  );
}
