import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

export interface PaginationProps {
  total: number; // total pages
  page: number; // current page (1-based)
  onChange?: (page: number) => void;
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  'data-testid'?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  page,
  onChange,
  className,
  size = 'md',
  ...rest
}) => {
  if (total <= 1) return null;
  const maxButtons = 5;
  const pages: number[] = [];
  let start = Math.max(1, page - Math.floor(maxButtons / 2));
  let end = start + maxButtons - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - maxButtons + 1);
  }
  for (let p = start; p <= end; p++) pages.push(p);

  const buttonCls = (active: boolean) =>
    cn(
      'h-8 min-w-[2rem] rounded-md border bg-background text-sm flex items-center justify-center px-2',
      active && 'bg-primary text-primary-foreground'
    );

  const controlSize = size === 'sm' ? 'sm' : 'default';

  return (
    <nav className={cn('flex items-center gap-1', className)} {...rest}>
      <Button
        variant="ghost"
        size={controlSize as any}
        disabled={page === 1}
        onClick={() => onChange?.(page - 1)}
        aria-label="Previous page"
      >
        ‹
      </Button>
      {start > 1 && (
        <button
          type="button"
          className={buttonCls(false)}
          onClick={() => onChange?.(1)}
        >
          1
        </button>
      )}
      {start > 2 && <span className="px-1 text-muted-foreground">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={buttonCls(p === page)}
          onClick={() => onChange?.(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {end < total - 1 && <span className="px-1 text-muted-foreground">…</span>}
      {end < total && (
        <button
          type="button"
          className={buttonCls(false)}
          onClick={() => onChange?.(total)}
        >
          {total}
        </button>
      )}
      <Button
        variant="ghost"
        size={controlSize as any}
        disabled={page === total}
        onClick={() => onChange?.(page + 1)}
        aria-label="Next page"
      >
        ›
      </Button>
    </nav>
  );
};
Pagination.displayName = 'Pagination';
