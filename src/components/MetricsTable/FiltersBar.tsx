import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '../ui';

export interface FiltersBarProps {
  search: string;
  onSearch: (v: string) => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  // Props kept for compatibility with tests and callers
  repoFilter?: string;
  onRepoChange?: (v: string) => void;
  authorFilter?: string;
  onAuthorChange?: (v: string) => void;
  repos?: string[];
  authors?: string[];
  sort?: string;
  onSortChange?: (s: string) => void;
  order?: 'asc' | 'desc';
  onOrderChange?: (o: 'asc' | 'desc') => void;
  // Allow additional props without type errors in tests
  [key: string]: any;
}

const SearchBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div className="relative w-full">
    <MagnifyingGlassIcon
      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      placeholder="Search..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[240px] pl-8 pr-8 w-full"
      aria-label="Search pull requests"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && value) {
          e.preventDefault();
          onChange('');
        }
      }}
    />
    {value && (
      <button
        type="button"
        aria-label="Clear search"
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted/60"
        onClick={() => onChange('')}
      >
        <XMarkIcon className="h-4 w-4 text-muted-foreground" />
      </button>
    )}
  </div>
);

export default function FiltersBar(
  props: FiltersBarProps & Record<string, any>
) {
  const { search, onSearch, leftContent, rightContent } = props;

  return (
    <div className="mb-2">
      <div className="flex items-center gap-3">
        {leftContent && <div className="shrink-0">{leftContent}</div>}
        <div className="flex-1 min-w-[240px]">
          <SearchBox value={search} onChange={onSearch} />
        </div>
        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>
    </div>
  );
}
