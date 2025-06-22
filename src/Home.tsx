import React from 'react';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useMetaDescription } from './hooks/useMetaDescription';
import {
  FolderIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid';
import { Link as RouterLink } from 'react-router-dom';

export default function Home() {
  useDocumentTitle('PR-ism Home');
  useMetaDescription('Access GitHub pull request insights and metrics.');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: 48,
        gap: 24,
      }}
    >
      <RouterLink
        to="/insights"
        style={{
          padding: 32,
          width: '100%',
          maxWidth: 400,
          border: '1px solid #eee',
          borderRadius: 16,
          boxShadow: '0 2px 8px 0 rgba(80, 120, 255, 0.08)',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowsRightLeftIcon width={20} height={20} />
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>
            Pull request insights
          </span>
        </div>
        <p style={{ marginTop: 16, color: '#888' }}>
          See metrics for your pull requests, including review time and lead
          time.
        </p>
      </RouterLink>
      <RouterLink
        to="/developer"
        style={{
          padding: 32,
          width: '100%',
          maxWidth: 400,
          border: '1px solid #eee',
          borderRadius: 16,
          boxShadow: '0 2px 8px 0 rgba(80, 120, 255, 0.08)',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserGroupIcon width={20} height={20} />
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>
            Developer insights
          </span>
        </div>
        <p style={{ marginTop: 16, color: '#888' }}>
          View a developer&apos;s contributions and review activity across
          GitHub repositories with radar charts.
        </p>
      </RouterLink>
      <RouterLink
        to="/repo"
        style={{
          padding: 32,
          width: '100%',
          maxWidth: 400,
          border: '1px solid #eee',
          borderRadius: 16,
          boxShadow: '0 2px 8px 0 rgba(80, 120, 255, 0.08)',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderIcon width={20} height={20} />
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>
            Repository insights
          </span>
        </div>
        <p style={{ marginTop: 16, color: '#888' }}>
          Explore repository health and DevOps metrics from GitHub.
        </p>
      </RouterLink>
    </div>
  );
}
