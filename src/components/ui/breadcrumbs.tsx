import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'plain' | 'muted';
}

const sizeMap: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const Breadcrumbs = ({
  className,
  children,
  size = 'md',
  variant = 'plain',
  ...rest
}: BreadcrumbsProps) => (
  <nav
    aria-label="Breadcrumb"
    className={cn(
      'flex items-center gap-2 overflow-x-auto',
      sizeMap[size] || sizeMap.md,
      variant === 'muted' && 'bg-muted/40 rounded-md px-2 py-1',
      className
    )}
    {...rest}
  >
    <ol className="flex items-center gap-2 min-w-0">{children}</ol>
  </nav>
);
Breadcrumbs.displayName = 'Breadcrumbs';

export interface BreadcrumbItemProps
  extends React.LiHTMLAttributes<HTMLLIElement> {
  isCurrent?: boolean;
  href?: string;
}

export const BreadcrumbItem = ({
  className,
  children,
  isCurrent,
  href,
  ...rest
}: BreadcrumbItemProps) => {
  const content = href ? (
    <a
      href={href}
      className={cn(
        'truncate whitespace-nowrap transition-colors',
        isCurrent
          ? 'font-semibold text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </a>
  ) : (
    <span
      className={cn(
        'truncate whitespace-nowrap',
        isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
      )}
    >
      {children}
    </span>
  );
  return (
    <li
      aria-current={isCurrent ? 'page' : undefined}
      className={cn('flex items-center gap-1 max-w-[14ch]', className)}
      {...rest}
    >
      {content}
    </li>
  );
};
BreadcrumbItem.displayName = 'BreadcrumbItem';
