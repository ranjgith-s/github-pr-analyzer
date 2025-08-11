import * as React from 'react';
import {
  Avatar as BaseAvatar,
  AvatarProps as BaseAvatarProps,
} from '../ui/avatar';
import { cn } from '../../lib/utils';

export interface LegacyAvatarProps extends Omit<BaseAvatarProps, 'className'> {
  size?: 'sm' | 'md' | 'lg' | 'xs';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export const Avatar = ({
  size = 'md',
  className,
  ...rest
}: LegacyAvatarProps) => {
  return (
    <BaseAvatar
      className={cn(sizeClasses[size] || sizeClasses.md, className)}
      {...rest}
    />
  );
};
Avatar.displayName = 'Avatar';
