import React from 'react';
import { cn } from '../../lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export const Kbd: React.FC<KbdProps> = ({ className, children, ...rest }) => {
  return (
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
};
Kbd.displayName = 'Kbd';
