import React from 'react';
import { Input, Card } from '../ui';

interface RepoOption {
  owner: string;
  repo: string;
  fullName: string;
}

interface Props {
  query: string;
  options: RepoOption[];
  onQueryChange: (value: string) => void;
  onSelect: (option: RepoOption) => void;
}

export default function SearchRepoBox({
  query,
  options,
  onQueryChange,
  onSelect,
}: Props) {
  return (
    <div className="relative w-full max-w-xl">
      <Input
        placeholder="Search GitHub repositories (owner/repo or URL)"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full"
        aria-label="Search GitHub repositories"
        clearable
      />
      {options.length > 0 && (
        <Card className="absolute w-full mt-1 z-10 p-0">
          {options.map((opt) => (
            <div
              key={opt.fullName}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 border-b last:border-b-0 border-border"
              onClick={() => onSelect(opt)}
            >
              <span className="font-mono text-sm text-foreground">
                {opt.fullName}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
