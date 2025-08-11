import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'destructive'
    | 'success'
    | 'warning';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' &&
          'bg-primary text-primary-foreground border-transparent',
        variant === 'secondary' &&
          'bg-secondary text-secondary-foreground border-transparent',
        variant === 'outline' && 'text-foreground',
        variant === 'destructive' &&
          'bg-destructive text-destructive-foreground border-transparent',
        variant === 'success' &&
          'bg-success text-success-foreground border-transparent',
        variant === 'warning' &&
          'bg-warning text-warning-foreground border-transparent',
        className
      )}
      {...props}
    />
  );
}
