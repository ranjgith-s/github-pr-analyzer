/* eslint-disable */
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps {
  children: React.ReactNode;
  label?: string;
  placeholder?: string;
  variant?: 'bordered' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  selectedKey?: string | null;
  onChange?: (key: string) => void;
  disabled?: boolean;
  className?: string;
  classNames?: { trigger?: string; label?: string; value?: string };
}

export interface SelectItemProps {
  children: React.ReactNode;
  value: string;
}

export const SelectItem: React.FC<SelectItemProps> = () => null; // marker

export const Select: React.FC<SelectProps> = ({
  children,
  label,
  placeholder = 'Select...',
  variant = 'bordered',
  size = 'md',
  selectedKey,
  onChange,
  disabled,
  className,
  classNames,
}) => {
  const items: { value: string; label: string }[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if ((child.type as any) === SelectItem) {
      items.push({
        value: (child.props as any).value,
        label: String((child.props as any).children),
      });
    }
  });

  const sizeClasses =
    size === 'sm'
      ? 'h-9 text-sm'
      : size === 'lg'
        ? 'h-11 text-base'
        : 'h-10 text-sm';
  const variantClasses =
    variant === 'bordered'
      ? 'border border-border bg-muted/20 focus:bg-background focus:border-primary outline-none'
      : 'bg-muted/30';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label
          className={cn(
            'text-xs font-medium text-muted-foreground',
            classNames?.label
          )}
        >
          {label}
        </label>
      )}
      <select
        disabled={disabled}
        className={cn(
          'w-full rounded-md px-2 py-1.5 appearance-none cursor-pointer disabled:opacity-50',
          sizeClasses,
          variantClasses,
          classNames?.trigger
        )}
        value={selectedKey ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {!selectedKey && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {items.map((it) => (
          <option
            key={it.value}
            value={it.value}
            className={cn(classNames?.value)}
          >
            {it.label}
          </option>
        ))}
      </select>
    </div>
  );
};

Select.displayName = 'Select';
