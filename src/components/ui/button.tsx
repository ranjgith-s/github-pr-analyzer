import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Legacy support types
type BaseVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type LegacyVariant = 'flat' | 'bordered' | 'light' | 'solid' | 'default';
export type ExtendedVariant = BaseVariant | LegacyVariant;
type LegacyColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'destructive'
  | 'default';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    Omit<VariantProps<typeof buttonVariants>, 'variant'> {
  asChild?: boolean;
  variant?: ExtendedVariant;
  /** Legacy color prop (primary, secondary, success, etc.) used with flat/light variants */
  color?: LegacyColor;
  /** Optional leading adornment */
  startContent?: React.ReactNode;
  /** Optional trailing adornment */
  endContent?: React.ReactNode;
  /** Legacy NextUI-style handler; mapped to onClick */
  onPress?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick']; // bridge
  /** Legacy disabled prop */
  isDisabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      color,
      size,
      asChild = false,
      startContent,
      endContent,
      onPress,
      isDisabled,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const mappedVariant = mapVariant(variant);
    const tint = legacyTintClasses(variant, color);
    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant: mappedVariant, size, className }),
          tint
        )}
        // Preserve legacy data-color for tests/compat
        data-color={color}
        // Prefer standard disabled prop; allow legacy isDisabled
        disabled={isDisabled || props.disabled}
        // Bridge both onPress and onClick
        onClick={(e) => {
          onClick?.(e);
          onPress?.(e);
        }}
        {...props}
      >
        {startContent && (
          <span className="inline-flex items-center" aria-hidden="true">
            {startContent}
          </span>
        )}
        {children}
        {endContent && (
          <span className="inline-flex items-center" aria-hidden="true">
            {endContent}
          </span>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

function mapVariant(v?: ExtendedVariant): BaseVariant | undefined {
  switch (v) {
    case 'bordered':
      return 'outline';
    case 'flat':
    case 'light':
      return 'ghost';
    case 'solid':
    case 'default':
      return 'default';
    default:
      return v as BaseVariant | undefined;
  }
}

function legacyTintClasses(
  variant?: ExtendedVariant,
  color?: LegacyColor
): string {
  if (variant !== 'flat' && variant !== 'light') return '';
  const flat = {
    primary: 'text-primary bg-primary/15 hover:bg-primary/25',
    secondary: 'text-secondary bg-secondary/15 hover:bg-secondary/25',
    success: 'text-success bg-success/15 hover:bg-success/25',
    warning: 'text-warning bg-warning/15 hover:bg-warning/25',
    danger: 'text-destructive bg-destructive/15 hover:bg-destructive/25',
    destructive: 'text-destructive bg-destructive/15 hover:bg-destructive/25',
    default: 'text-foreground bg-muted/30 hover:bg-muted/50',
  } as Record<string, string>;
  const light = {
    primary: 'text-primary hover:bg-primary/15',
    secondary: 'text-secondary hover:bg-secondary/15',
    success: 'text-success hover:bg-success/15',
    warning: 'text-warning hover:bg-warning/15',
    danger: 'text-destructive hover:bg-destructive/15',
    destructive: 'text-destructive hover:bg-destructive/15',
    default: 'text-foreground hover:bg-muted/40',
  } as Record<string, string>;
  return (variant === 'flat' ? flat : light)[color || 'primary'] || '';
}

export { Button, buttonVariants };
