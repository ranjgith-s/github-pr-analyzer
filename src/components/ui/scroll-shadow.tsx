/* eslint-disable */
import * as React from 'react';
import { cn } from '../../lib/utils';

export type ScrollShadowProps = React.HTMLAttributes<HTMLDivElement>;

// Native ScrollShadow: simple overflow container with gradient fades top/bottom.
export const ScrollShadow = React.forwardRef<HTMLDivElement, ScrollShadowProps>(
  ({ className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('relative overflow-auto', className)}
      {...rest}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background to-transparent z-10" />
      <div className="relative z-0">{children}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-background to-transparent z-10" />
    </div>
  )
);
ScrollShadow.displayName = 'ScrollShadow';

export { ScrollShadow as default };
