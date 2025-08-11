import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
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

// Extended props to absorb legacy bridge Button API for smoother migration.
type BaseVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type LegacyVariant =
  | 'flat'
  | 'bordered'
  | 'light'
  | 'ghost'
  | 'solid'
  | 'default';
type ExtendedVariant = BaseVariant | LegacyVariant;

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    Omit<VariantProps<typeof buttonVariants>, 'variant'> {
  asChild?: boolean;
  variant?: ExtendedVariant;
  // Legacy convenience props
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'destructive'
    | 'default';
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onPress?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  isDisabled?: boolean;
  href?: string;
  as?: 'a' | 'button';
}

function mapVariant(variant?: ExtendedVariant): BaseVariant | undefined {
  switch (variant) {
    case 'bordered':
      return 'outline';
    case 'flat':
    case 'light':
      return 'ghost';
    case 'solid':
    case 'default':
      return 'default';
    default:
      return variant as BaseVariant | undefined;
  }
}

function legacyTintClasses(
  variant?: ExtendedVariant,
  color?: ButtonProps['color']
): string {
  if (variant !== 'flat' && variant !== 'light') return '';
  const base =
    variant === 'flat'
      ? {
          primary: 'text-primary bg-primary/15 hover:bg-primary/25',
          secondary: 'text-secondary bg-secondary/15 hover:bg-secondary/25',
          success: 'text-success bg-success/15 hover:bg-success/25',
          warning: 'text-warning bg-warning/15 hover:bg-warning/25',
          danger: 'text-destructive bg-destructive/15 hover:bg-destructive/25',
          destructive:
            'text-destructive bg-destructive/15 hover:bg-destructive/25',
          default: 'text-foreground bg-muted/30 hover:bg-muted/50',
        }
      : {
          primary: 'text-primary hover:bg-primary/15',
          secondary: 'text-secondary hover:bg-secondary/15',
          success: 'text-success hover:bg-success/15',
          warning: 'text-warning hover:bg-warning/15',
          danger: 'text-destructive hover:bg-destructive/15',
          destructive: 'text-destructive hover:bg-destructive/15',
          default: 'text-foreground hover:bg-muted/40',
        };
  return (base as any)[color || 'primary'] || '';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      color = 'primary',
      startContent,
      endContent,
      onPress,
      isDisabled,
      href,
      as,
      children,
      ...props
    },
    ref
  ) => {
    const mappedVariant = mapVariant(variant);
    const Comp: any = asChild ? Slot : href || as === 'a' ? 'a' : 'button';

    const extraColorClasses = cn(
      // Outline primary coloring when mapped
      color === 'primary' &&
        mappedVariant === 'outline' &&
        'border-primary text-primary',
      // Ghost primary explicit color when not using tinted flat/light styles
      color === 'primary' &&
        mappedVariant === 'ghost' &&
        !['flat', 'light'].includes(String(variant)) &&
        'text-primary',
      // Danger/destructive default background mapping if coming from solid/default
      (color === 'danger' || color === 'destructive') &&
        mappedVariant === 'default' &&
        'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    );

    return (
      <Comp
        ref={ref}
        href={href}
        disabled={isDisabled || (props as any).disabled}
        onClick={onPress || (props as any).onClick}
        data-color={color}
        className={cn(
          buttonVariants({ variant: mappedVariant, size, className }),
          legacyTintClasses(variant, color),
          extraColorClasses,
          startContent || endContent ? 'inline-flex items-center gap-2' : null
        )}
        {...props}
      >
        {startContent && (
          <span className="inline-flex items-center">{startContent}</span>
        )}
        <span
          className={
            startContent || endContent ? 'inline-flex items-center' : undefined
          }
        >
          {children}
        </span>
        {endContent && (
          <span className="inline-flex items-center">{endContent}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
