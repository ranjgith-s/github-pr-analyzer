import * as React from 'react';
import { cn } from '../../lib/utils';

export type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement>;

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  className,
  children,
  ...rest
}) => {
  return (
    <div
      role="group"
      className={cn('inline-flex w-auto rounded-md overflow-hidden', className)}
      {...rest}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as any, {
          className: cn(
            'rounded-none first:rounded-l-md last:rounded-r-md',
            (child as any).props.className
          ),
        });
      })}
    </div>
  );
};
ButtonGroup.displayName = 'ButtonGroup';
