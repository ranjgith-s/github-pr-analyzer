import * as React from 'react';
import { cn } from '../../lib/utils';

// Simple horizontal button group wrapper.
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'bordered' | 'solid' | 'light';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  className,
  children,
  variant: _variant, // currently unused, individual Buttons handle their own style
  ...rest
}) => {
  return (
    <div
      role="group"
      className={cn('inline-flex w-auto rounded-md overflow-hidden', className)}
      {...rest}
    >
      {React.Children.map(children, (child, idx) => {
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
