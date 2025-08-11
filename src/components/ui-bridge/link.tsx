import React from 'react';
import { cn } from '../../lib/utils';

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  isExternal?: boolean;
  size?: 'sm' | 'md';
}

// Minimal Link bridge to replace HeroUI Link while keeping call sites stable.
export const Link: React.FC<LinkProps> = ({
  isExternal,
  size = 'md',
  className,
  children,
  ...rest
}) => {
  const base = 'font-medium text-primary hover:underline underline-offset-2';
  const sizing = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <a
      className={cn(base, sizing, className)}
      {...(isExternal && {
        target: '_blank',
        rel: 'noopener noreferrer',
      })}
      {...rest}
    >
      {children}
    </a>
  );
};

Link.displayName = 'Link';
