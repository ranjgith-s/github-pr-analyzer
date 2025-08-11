import * as React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof RadixAvatar.Root> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({
  className,
  src,
  alt,
  fallback,
  ...props
}: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {src && (
        <RadixAvatar.Image
          src={src}
          alt={alt}
          className="aspect-square h-full w-full"
        />
      )}
      <RadixAvatar.Fallback className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">
        {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
