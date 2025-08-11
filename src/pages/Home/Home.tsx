import React from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import {
  FolderIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid';
import { Card } from '../../components/ui';

export default function Home() {
  useDocumentTitle('PR-ism Home');
  useMetaDescription('Access GitHub pull request insights and metrics.');
  return (
    <div className="flex justify-center mt-12 gap-6">
      <a href="/insights" className="w-full max-w-sm">
        <Card className="p-8 w-full hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <ArrowsRightLeftIcon width={20} height={20} />
            <span className="text-lg font-bold">Pull Request Insights</span>
          </div>
          <p className="mt-4 text-foreground/60">
            See metrics for your pull requests, including review time and lead
            time.
          </p>
        </Card>
      </a>
      <a href="/developer" className="w-full max-w-sm">
        <Card className="p-8 w-full hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <UserGroupIcon width={20} height={20} />
            <span className="text-lg font-bold">Developer Insights</span>
          </div>
          <p className="mt-4 text-foreground/60">
            View a developer&apos;s contributions and review activity across
            GitHub repositories with radar charts.
          </p>
        </Card>
      </a>
      <a href="/repo" className="w-full max-w-sm">
        <Card className="p-8 w-full hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <FolderIcon width={20} height={20} />
            <span className="text-lg font-bold">Repository Insights</span>
          </div>
          <p className="mt-4 text-foreground/60">
            Explore repository health and DevOps metrics from GitHub.
          </p>
        </Card>
      </a>
    </div>
  );
}
