import * as React from 'react';
import { cn } from '../../lib/utils';

export type KbdProps = React.HTMLAttributes<HTMLElement>;

// Simple keyboard key indicator. Mirrors legacy bridge styling (so migration is no-op visually).
export const Kbd: React.FC<KbdProps> = ({ className, children, ...rest }) => (
  <kbd
    className={cn(
      'inline-flex items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-semibold text-muted-foreground',
      className
    )}
    {...rest}
  >
    {children}
  </kbd>
);
Kbd.displayName = 'Kbd';
