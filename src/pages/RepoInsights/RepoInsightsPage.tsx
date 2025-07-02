import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import SearchRepoBox from '../../components/SearchRepoBox/SearchRepoBox';

export default function RepoInsightsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{ owner: string; repo: string; fullName: string }[]>([]);
  const navigate = useNavigate();

  useDocumentTitle('Repository insights');
  useMetaDescription('Repository metrics and DevOps insights.');

  useEffect(() => {
    if (!query) {
      setOptions([]);
      return;
    }
    const pattern = /^(?:https?:\/\/github.com\/)?([^/]+)\/([^/]+)$/i;
    const match = query.trim().match(pattern);
    if (match) {
      setOptions([
        {
          owner: match[1],
          repo: match[2],
          fullName: `${match[1]}/${match[2]}`,
        },
      ]);
    } else {
      setOptions([]);
    }
  }, [query]);

  const handleSelect = (opt: { owner: string; repo: string; fullName: string }) => {
    setQuery(opt.fullName);
    setOptions([]);
    navigate(`/repo/${opt.owner}/${opt.repo}`);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-4">
      <div className="w-full max-w-xl flex flex-col items-center mt-24">
        <h1 className="text-4xl font-semibold mb-8 text-gray-600 tracking-tight">
          Repository Insights
        </h1>
        <SearchRepoBox
          query={query}
          options={options}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
