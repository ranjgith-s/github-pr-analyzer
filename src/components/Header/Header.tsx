import React, { useEffect, useState } from 'react';
import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/solid';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { Avatar } from '../ui';
import { Button, BreadcrumbItem, Breadcrumbs } from '../ui-bridge';
import { ChevronUpIcon } from 'lucide-react';
import { getAuthenticatedUserProfile } from '../../utils/services/githubService';

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
    <header className="w-full px-6 py-3 border-divider bg-background/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <Breadcrumbs
          variant="light"
          size="md"
          underline="hover"
          className="font-bold"
        >
          {/* Explicit key to avoid implicit index key collision */}
          <BreadcrumbItem key="root">
            <RouterLink to="/" className="flex items-center gap-1">
              <ChevronUpIcon />
              PR-ism
            </RouterLink>
          </BreadcrumbItem>
          {breadcrumbs &&
            breadcrumbs.map((bc, i) => (
              <BreadcrumbItem
                // Use stable unique key derived from path+label
                key={`${bc.to || 'nolink'}::${bc.label}`}
                color={i === breadcrumbs.length - 1 ? 'foreground' : undefined}
                isCurrent={i === breadcrumbs.length - 1}
              >
                {bc.to ? (
                  <RouterLink to={bc.to}>{bc.label}</RouterLink>
                ) : (
                  bc.label
                )}
              </BreadcrumbItem>
            ))}
        </Breadcrumbs>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <Avatar src={user.avatar_url} alt="avatar" className="h-8 w-8" />
          <span className="font-mono text-sm px-2">{user.login}</span>
          <Button
            variant="bordered"
            color="primary"
            size="sm"
            endContent={<ArrowLeftStartOnRectangleIcon className="w-5 h-5" />}
            onPress={logout}
          >
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}
