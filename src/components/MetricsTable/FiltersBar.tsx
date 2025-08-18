import React from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from '../ui';
import { firstKey } from './utils';

interface FiltersBarProps {
  search: string;
  onSearch: (v: string) => void;
  repoFilter: string;
  onRepoChange: (repo: string) => void;
  authorFilter: string;
  onAuthorChange: (author: string) => void;
  repos: string[];
  authors: string[];
  sort: string;
  onSortChange: (s: string) => void;
  order: 'asc' | 'desc';
  onOrderChange: (o: 'asc' | 'desc') => void;
  pageSize: number;
  onPerPageChange: (n: number) => void;
}

// using shared firstKey util

export default function FiltersBar(props: FiltersBarProps) {
  const {
    search,
    onSearch,
    repoFilter,
    onRepoChange,
    authorFilter,
    onAuthorChange,
    repos,
    authors,
    sort,
    onSortChange,
    order,
    onOrderChange,
    pageSize,
    onPerPageChange,
  } = props;

  return (
    <div className="flex mb-6 gap-3 items-center flex-wrap">
      {/* Search with adornments */}
      <div className="relative">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="min-w-[240px] pl-8 pr-8"
          aria-label="Search pull requests"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted/60"
            onClick={() => onSearch('')}
          >
            <XMarkIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {/* Repository filter */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="ghost"
            className="min-w-[160px]"
            aria-label="Repository filter"
            endContent={
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            }
          >
            {repoFilter || 'Repository'}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Select repository"
          selectionMode="single"
          selectedKeys={repoFilter ? new Set([repoFilter]) : new Set()}
          onSelectionChange={(keys: any) => onRepoChange(firstKey(keys))}
        >
          <>
            <DropdownItem
              itemKey=""
              role="menuitem"
              onClick={() => onRepoChange('')}
            >
              All
            </DropdownItem>
            {repos.map((r) => (
              <DropdownItem
                key={r || 'all-repos'}
                itemKey={r || 'all-repos'}
                data-testid={`repo-option-${r}`}
                role="menuitem"
                onClick={() => onRepoChange(r)}
              >
                {r}
              </DropdownItem>
            ))}
          </>
        </DropdownMenu>
      </Dropdown>
      {/* Author filter */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="ghost"
            className="min-w-[160px]"
            aria-label="Author filter"
            endContent={
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            }
          >
            {authorFilter || 'Author'}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Select author"
          selectionMode="single"
          selectedKeys={authorFilter ? new Set([authorFilter]) : new Set()}
          onSelectionChange={(keys: any) => onAuthorChange(firstKey(keys))}
        >
          <>
            <DropdownItem
              itemKey=""
              role="menuitem"
              onClick={() => onAuthorChange('')}
            >
              All
            </DropdownItem>
            {authors.map((a) => (
              <DropdownItem
                key={a || 'all-authors'}
                itemKey={a || 'all-authors'}
                data-testid={`author-option-${a}`}
                role="menuitem"
                onClick={() => onAuthorChange(a)}
              >
                {a}
              </DropdownItem>
            ))}
          </>
        </DropdownMenu>
      </Dropdown>
      {/* Sort field */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="ghost"
            className="min-w-[120px]"
            aria-label="Sort field"
            endContent={
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            }
          >
            Sort: {sort}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Select sort field"
          selectionMode="single"
          selectedKeys={new Set([sort])}
          onSelectionChange={(keys: any) => onSortChange(firstKey(keys))}
        >
          <>
            <DropdownItem
              itemKey="updated"
              role="menuitem"
              onClick={() => onSortChange('updated')}
            >
              updated
            </DropdownItem>
            <DropdownItem
              itemKey="created"
              role="menuitem"
              onClick={() => onSortChange('created')}
            >
              created
            </DropdownItem>
            <DropdownItem
              itemKey="comments"
              role="menuitem"
              onClick={() => onSortChange('comments')}
            >
              comments
            </DropdownItem>
          </>
        </DropdownMenu>
      </Dropdown>
      {/* Order */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="ghost"
            className="min-w-[100px]"
            aria-label="Sort order"
            endContent={
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            }
          >
            Order: {order}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Select order"
          selectionMode="single"
          selectedKeys={new Set([order])}
          onSelectionChange={(keys: any) =>
            onOrderChange(firstKey(keys) as 'asc' | 'desc')
          }
        >
          <>
            <DropdownItem
              itemKey="desc"
              role="menuitem"
              onClick={() => onOrderChange('desc')}
            >
              desc
            </DropdownItem>
            <DropdownItem
              itemKey="asc"
              role="menuitem"
              onClick={() => onOrderChange('asc')}
            >
              asc
            </DropdownItem>
          </>
        </DropdownMenu>
      </Dropdown>
      {/* Page size */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="ghost"
            className="min-w-[120px]"
            aria-label="Items per page"
            endContent={
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            }
          >
            Per page: {pageSize}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Select per page"
          selectionMode="single"
          selectedKeys={new Set([String(pageSize)])}
          onSelectionChange={(keys: any) =>
            onPerPageChange(Number(firstKey(keys)))
          }
        >
          <>
            {[10, 20, 30, 40, 50].map((n) => (
              <DropdownItem
                key={n}
                itemKey={String(n)}
                role="menuitem"
                onClick={() => onPerPageChange(n)}
              >
                {n}
              </DropdownItem>
            ))}
          </>
        </DropdownMenu>
      </Dropdown>

      {/* Clear basic filters */}
      <Button
        variant="outline"
        aria-label="Clear filters"
        startContent={<ArrowUturnLeftIcon className="h-4 w-4" />}
        onClick={() => {
          if (search) onSearch('');
          if (repoFilter) onRepoChange('');
          if (authorFilter) onAuthorChange('');
        }}
      >
        Reset
      </Button>
    </div>
  );
}
