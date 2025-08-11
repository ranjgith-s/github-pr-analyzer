import * as React from 'react';
import { cn } from '../../lib/utils';

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
      'h-8 min-w-[2rem] rounded-md border bg-background text-sm flex items-center justify-center px-2 transition-colors',
      active && 'bg-primary text-primary-foreground'
    );

  const small = size === 'sm';
  const controlCls = cn(
    'inline-flex items-center justify-center rounded-md border bg-background hover:bg-muted text-sm font-medium disabled:opacity-50 disabled:pointer-events-none h-8 px-2',
    small && 'h-7 text-xs'
  );

  return (
    <nav className={cn('flex items-center gap-1', className)} {...rest}>
      <button
        type="button"
        className={controlCls}
        disabled={page === 1}
        onClick={() => onChange?.(page - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
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
      <button
        type="button"
        className={controlCls}
        disabled={page === total}
        onClick={() => onChange?.(page + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};
Pagination.displayName = 'Pagination';
