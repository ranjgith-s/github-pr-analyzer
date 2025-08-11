import * as React from 'react';
import { Badge as BaseBadge } from '../ui/badge';
import { cn } from '../../lib/utils';

// HeroUI-compatible Badge wrapper. Supports legacy `color`, `variant`, `size` props.
// Maps to shadcn badge styling with minimal class additions to approximate HeroUI styles.
export interface LegacyBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger';
  variant?: 'flat' | 'solid' | 'bordered' | 'faded' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

const colorToVariant: Record<string, string> = {
  default: 'outline',
  primary: 'default',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
};

const sizeClasses: Record<string, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

// Additional background tints for "flat" / "faded" / "light" variants.
const flatTintClasses: Record<string, string> = {
  primary: 'bg-primary/15 text-primary border-transparent',
  secondary: 'bg-secondary/15 text-secondary border-transparent',
  success: 'bg-success/15 text-success border-transparent',
  warning: 'bg-warning/15 text-warning border-transparent',
  danger: 'bg-destructive/15 text-destructive border-transparent',
  default: 'bg-muted/30 text-foreground border-transparent',
};

export const Badge: React.FC<LegacyBadgeProps> = ({
  color = 'default',
  variant: legacyVariant = 'solid',
  size = 'md',
  className,
  children,
  ...rest
}) => {
  // If using a flat/faded/light style, manually style instead of base variant mapping.
  const isFlatLike = ['flat', 'faded', 'light'].includes(legacyVariant);
  const mappedVariant = colorToVariant[color] || 'outline';

  if (isFlatLike) {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-md font-semibold transition-colors border',
          sizeClasses[size],
          flatTintClasses[color] || flatTintClasses.default,
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <BaseBadge
      // @ts-expect-error - Base badge variant limited set; we map accordingly.
      variant={mappedVariant}
      className={cn(sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </BaseBadge>
  );
};
