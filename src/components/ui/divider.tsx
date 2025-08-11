import * as React from 'react';
import { cn } from '../../lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

// shadcn-style Divider primitive
// Provides a11y via role=separator and aria-orientation.
export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className,
  ...rest
}) => {
  const vertical = orientation === 'vertical';
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        vertical ? 'w-px h-full mx-2' : 'h-px w-full my-2',
        className
      )}
      {...rest}
    />
  );
};

Divider.displayName = 'Divider';
