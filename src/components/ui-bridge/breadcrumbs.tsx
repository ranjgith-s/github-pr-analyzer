import React from 'react';
import clsx from 'clsx';

// Breadcrumbs bridge (TSX) replacing HeroUI dependency.
// Maintains minimal prop surface used in app code.
// Props currently supported:
// - Breadcrumbs: variant (light|solid), size (sm|md|lg), underline (placeholder), className
// - BreadcrumbItem: color (foreground|*), isCurrent, className
// Additional props can be added during further migration if needed.

interface BreadcrumbsProps {
  children: React.ReactNode;
  variant?: 'light' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  underline?: 'hover' | 'always' | 'none';
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  children,
  variant = 'light',
  size = 'md',
  // underline currently unused (styling hook placeholder)
  underline, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
}) => {
  const sizeClasses =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const variantClasses =
    variant === 'solid' ? 'bg-muted/40 px-2 py-1 rounded-md' : 'bg-transparent';

  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx(
        'flex items-center gap-2 overflow-x-auto',
        variantClasses,
        sizeClasses,
        className
      )}
    >
      <ol className="flex items-center gap-2 min-w-0">{children}</ol>
    </nav>
  );
};

interface BreadcrumbItemProps {
  children: React.ReactNode;
  color?: 'foreground' | string;
  isCurrent?: boolean;
  className?: string;
}

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  children,
  color,
  isCurrent = false,
  className,
}) => {
  const baseLinkClasses = clsx(
    'whitespace-nowrap truncate',
    isCurrent
      ? 'font-semibold text-foreground'
      : color === 'foreground'
        ? 'text-foreground'
        : 'text-muted-foreground',
    !isCurrent && 'hover:text-foreground transition-colors',
    className
  );

  if (React.isValidElement(children)) {
    return (
      <li
        aria-current={isCurrent ? 'page' : undefined}
        className="flex items-center gap-1 max-w-[14ch]"
      >
        {React.cloneElement(children as React.ReactElement<any>, {
          className: clsx((children as any).props?.className, baseLinkClasses),
        })}
      </li>
    );
  }
  return (
    <li
      aria-current={isCurrent ? 'page' : undefined}
      className="flex items-center gap-1 max-w-[14ch]"
    >
      <span className={baseLinkClasses}>{children}</span>
    </li>
  );
};
