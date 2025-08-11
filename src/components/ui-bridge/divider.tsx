import React from 'react';
import { cn } from '../../lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

// Minimal Divider bridge (replaces HeroUI Divider)
// Supports orientation + custom class styling. Additional props can be added as needed.
export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className,
  ...rest
}) => {
  const isVertical = orientation === 'vertical';
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        isVertical ? 'w-px h-full mx-2' : 'h-px w-full my-2',
        className
      )}
      {...rest}
    />
  );
};

Divider.displayName = 'Divider';
