import React from 'react';
import clsx from 'clsx';

interface ChipProps {
  children: React.ReactNode;
  onClose?: () => void;
  variant?: 'flat' | 'solid' | 'bordered';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorMap: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  default: 'bg-muted text-muted-foreground',
};

const flatOverlay: Record<string, string> = {
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
      ? 'border border-default-300 bg-background'
      : variant === 'solid'
        ? colorMap[color]
        : flatOverlay[color];

  return (
    <span className={clsx(base, sizeClasses, variantClasses, className)}>
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer outline-none focus:ring-2 focus:ring-primary/50 rounded-full p-0.5 hover:opacity-80"
          aria-label="Remove"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
};
