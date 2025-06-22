import React, { useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
import {
  ChevronUpIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

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
    <div
      className="app-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottom: '1px solid #eee',
        background: '#f8fafc',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#222' }}
      >
        <ChevronUpIcon width={24} height={24} />
        <nav
          className="breadcrumbs-modern"
          style={{ fontWeight: 'bold', display: 'flex', gap: 8 }}
        >
          <RouterLink to="/">PR-ism</RouterLink>
          {breadcrumb && (
            <RouterLink to={breadcrumb.to}>{breadcrumb.label}</RouterLink>
          )}
        </nav>
      </div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={user.avatar_url}
            alt="avatar"
            width={24}
            height={24}
            style={{ borderRadius: '50%' }}
          />
          <span style={{ fontFamily: 'monospace', fontSize: 14 }}>
            {user.login}
          </span>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ArrowRightOnRectangleIcon width={18} height={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
