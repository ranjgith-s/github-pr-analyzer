import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ChipProps {
  children: React.ReactNode;
  onClose?: () => void;
  variant?: 'flat' | 'solid' | 'bordered';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const solid: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  default: 'bg-muted text-muted-foreground',
};

const flat: Record<string, string> = {
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/30 text-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning-foreground',
  default: 'bg-muted/60 text-muted-foreground',
};

export const Chip: React.FC<ChipProps> = ({
  children,
  onClose,
  variant = 'flat',
  color = 'default',
  size = 'md',
  className,
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] h-5 px-1.5'
      : size === 'lg'
        ? 'text-sm h-7 px-3'
        : 'text-xs h-6 px-2';
  const base = 'inline-flex items-center rounded-full font-medium gap-1';
  const variantClasses =
    variant === 'bordered'
      ? 'border border-border bg-background'
      : variant === 'solid'
        ? solid[color]
        : flat[color];

  return (
    <span
      className={cn(base, sizeClasses, variantClasses, className)}
      data-testid="chip"
    >
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer outline-none focus:ring-2 focus:ring-primary/50 rounded-full p-0.5 hover:opacity-80"
          aria-label="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
};
Chip.displayName = 'Chip';
