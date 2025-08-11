import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, clearable, onClear, ...props }, ref) => {
    return (
      <div className={cn('relative', clearable && 'pr-6')}>
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        />
        {clearable && props.value && (
          <button
            type="button"
            aria-label="Clear input"
            onClick={() => {
              if (onClear) onClear();
              if (ref && typeof ref !== 'function' && ref.current) {
                ref.current.value = '';
                ref.current.dispatchEvent(
                  new Event('input', { bubbles: true })
                );
              }
            }}
            className="absolute inset-y-0 right-1 my-auto inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
