import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { searchUsers } from '../../utils/services/github';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import { GitHubUser } from '../../utils/services/auth';
import SearchUserBox from '../../components/SearchUserBox/SearchUserBox';

export default function DeveloperMetricsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const [options, setOptions] = useState<GitHubUser[]>([]);
  const navigate = useNavigate();

  useDocumentTitle('Developer insights');
  useMetaDescription('Developer insights for GitHub pull requests.');

  useEffect(() => {
    if (!debouncedQuery) {
      setOptions([]);
      return;
    }
    let cancel = false;
    async function load() {
      try {
        const res = await searchUsers(token!, debouncedQuery);
        if (!cancel) setOptions(res);
      } catch (err) {
        if (!cancel) console.error(err);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [debouncedQuery, token]);

  const handleSelect = (user: GitHubUser) => {
    setQuery(user.login);
    setOptions([]);
    navigate(`/developer/${user.login}`);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-4">
      <div className="w-full max-w-xl flex flex-col items-center mt-24">
        <h1 className="text-4xl font-semibold mb-8 text-gray-600 tracking-tight">
          Developer Insights
        </h1>
        <SearchUserBox
          query={query}
          options={options}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
