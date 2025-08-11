import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  CardHeader as BaseCardHeader,
  CardFooter as BaseCardFooter,
  CardContent as BaseCardContent,
  CardBody as BaseCardBody,
  CardDescription as BaseCardDescription,
  CardTitle as BaseCardTitle,
} from '../ui/card';

export interface LegacyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  href?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  isPressable?: boolean;
  isHoverable?: boolean;
}

const shadowMap: Record<string, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

export const Card = React.forwardRef<HTMLElement, LegacyCardProps>(
  (
    {
      as = 'div',
      href,
      shadow = 'sm',
      isPressable,
      isHoverable,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const Comp: any = href ? 'a' : as || 'div';
    return (
      <Comp
        ref={ref as any}
        href={href}
        className={cn(
          'rounded-lg border bg-card text-card-foreground',
          shadowMap[shadow] || shadowMap.sm,
          (isPressable || isHoverable) &&
            'transition-shadow hover:shadow-md cursor-pointer',
          className
        )}
        {...rest}
      >
        {children}
      </Comp>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = BaseCardHeader;
export const CardFooter = BaseCardFooter;
export const CardContent = BaseCardContent;
export const CardBody = BaseCardBody;
export const CardDescription = BaseCardDescription;
export const CardTitle = BaseCardTitle;
