import * as React from 'react';
import { ButtonProps as BaseButtonProps, buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';

// HeroUI-compatible Button wrapper that adapts legacy props (variant, color, startContent, endContent, onPress, isDisabled)
// and maps them to the shadcn BaseButton API. This allows incremental migration.

export interface LegacyButtonProps
  extends Omit<BaseButtonProps, 'variant' | 'size'> {
  variant?: 'flat' | 'bordered' | 'light' | 'ghost' | 'solid' | 'default';
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onPress?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  isDisabled?: boolean;
  href?: string;
  as?: 'a' | 'button';
}

const flatColorClasses: Record<string, string> = {
  primary: 'text-primary bg-primary/15 hover:bg-primary/25',
  secondary: 'text-secondary bg-secondary/15 hover:bg-secondary/25',
  success: 'text-success bg-success/15 hover:bg-success/25',
  warning: 'text-warning bg-warning/15 hover:bg-warning/25',
  danger: 'text-destructive bg-destructive/15 hover:bg-destructive/25',
  default: 'text-foreground bg-muted/30 hover:bg-muted/50',
};

const borderedColorClasses: Record<string, string> = {
  primary: 'border-primary text-primary',
  secondary: 'border-secondary text-secondary',
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  danger: 'border-destructive text-destructive',
  default: 'border-input text-foreground',
};

const lightColorClasses: Record<string, string> = {
  primary: 'text-primary hover:bg-primary/15',
  secondary: 'text-secondary hover:bg-secondary/15',
  success: 'text-success hover:bg-success/15',
  warning: 'text-warning hover:bg-warning/15',
  danger: 'text-destructive hover:bg-destructive/15',
  default: 'text-foreground hover:bg-muted/40',
};

function mapVariant(
  legacy?: LegacyButtonProps['variant']
): BaseButtonProps['variant'] {
  switch (legacy) {
    case 'bordered':
      return 'outline';
    case 'ghost':
      return 'ghost';
    case 'solid':
    case 'default':
      return 'default';
    case 'flat':
    case 'light':
      return 'ghost';
    default:
      return 'default';
  }
}

function mapSize(size?: LegacyButtonProps['size']): BaseButtonProps['size'] {
  switch (size) {
    case 'sm':
      return 'sm';
    case 'lg':
      return 'lg';
    case 'icon':
      return 'icon';
    case 'md':
    default:
      return 'default';
  }
}

export const Button = React.forwardRef<HTMLButtonElement, LegacyButtonProps>(
  (
    {
      className,
      variant: legacyVariant,
      color = 'primary',
      size: legacySize,
      startContent,
      endContent,
      onPress,
      isDisabled,
      children,
      href,
      as,
      ...rest
    },
    ref
  ) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[ui-bridge] Button is deprecated. Import from ../ui and adapt props.'
      );
    }

    const mappedVariant = mapVariant(legacyVariant);
    const mappedSize = mapSize(legacySize);

    let legacyClasses = '';
    if (legacyVariant === 'flat') {
      legacyClasses = flatColorClasses[color] || '';
    } else if (legacyVariant === 'bordered') {
      legacyClasses = cn('border bg-transparent', borderedColorClasses[color]);
    } else if (legacyVariant === 'light') {
      legacyClasses = cn('bg-transparent', lightColorClasses[color]);
    }

    if (
      color === 'danger' &&
      !['flat', 'bordered', 'light'].includes(String(legacyVariant))
    ) {
      legacyClasses = cn(
        legacyClasses,
        mappedVariant === 'default' &&
          'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      );
    }

    const Comp: any = href || as === 'a' ? 'a' : 'button';

    return (
      <Comp
        ref={ref}
        href={href}
        disabled={isDisabled || (rest as any).disabled}
        onClick={onPress || (rest as any).onClick}
        className={cn(
          buttonVariants({ variant: mappedVariant, size: mappedSize }),
          color === 'primary' &&
            mappedVariant === 'outline' &&
            'border-primary text-primary',
          color === 'primary' &&
            mappedVariant === 'ghost' &&
            legacyVariant !== 'flat' &&
            legacyVariant !== 'light' &&
            'text-primary',
          color === 'secondary' && 'data-[color=secondary]',
          legacyClasses,
          'inline-flex items-center gap-2',
          className
        )}
        data-color={color}
        {...rest}
      >
        {startContent && (
          <span className="inline-flex items-center">{startContent}</span>
        )}
        <span className="inline-flex items-center">{children}</span>
        {endContent && (
          <span className="inline-flex items-center">{endContent}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
