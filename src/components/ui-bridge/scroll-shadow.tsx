import * as React from 'react';
import { cn } from '../../lib/utils';

// Minimal ScrollShadow replacement for HeroUI's ScrollShadow.
// Simply renders a scrollable container with subtle fade overlays using gradients.
export type ScrollShadowProps = React.HTMLAttributes<HTMLDivElement>;

export const ScrollShadow: React.FC<ScrollShadowProps> = ({
  className,
  children,
  ...rest
}) => {
  return (
    <div className={cn('relative overflow-auto', className)} {...rest}>
      {/* Top shadow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background to-transparent z-10" />
      {/* Scrollable content */}
      <div className="relative z-0">{children}</div>
      {/* Bottom shadow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-background to-transparent z-10" />
    </div>
  );
};
ScrollShadow.displayName = 'ScrollShadow';
