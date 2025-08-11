import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LegacySpinnerProps extends React.HTMLAttributes<SVGElement> {
  size?: 'sm' | 'md' | 'lg';
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger';
  label?: string; // accessibility label
}

const sizeMap: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colorMap: Record<string, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

export const Spinner: React.FC<LegacySpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label = 'Loading',
  ...rest
}) => {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center justify-center"
    >
      <Loader2
        aria-hidden="true"
        className={cn(
          'animate-spin',
          sizeMap[size] || sizeMap.md,
          colorMap[color] || colorMap.primary,
          className
        )}
        {...rest}
      />
    </span>
  );
};
