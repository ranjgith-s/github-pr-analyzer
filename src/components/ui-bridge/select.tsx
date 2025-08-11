import React from 'react';
import clsx from 'clsx';

// Lightweight Select bridge replacing HeroUI dependency.
// Supports single selection only (matching current usage patterns).
// Props subset implemented: label, placeholder, variant, size, selectedKeys, onSelectionChange,
// isDisabled, className, classNames.trigger/label/value.

interface SelectProps {
  children: React.ReactNode;
  label?: string;
  placeholder?: string;
  variant?: 'bordered' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  selectedKeys?: Iterable<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  isDisabled?: boolean;
  className?: string;
  classNames?: { trigger?: string; label?: string; value?: string };
}

interface SelectItemProps {
  children: React.ReactNode;
  // HeroUI used `key` attribute; we derive it from React key if not provided.
  value?: string;
}

export const SelectItem: React.FC<SelectItemProps> = () => null; // marker only

function normalizeKey(key: string | null | undefined): string {
  if (!key) return '';
  // React adds ".$" prefix to explicit keys sometimes; strip it.
  return key.startsWith('.$') ? key.slice(2) : key;
}

export const Select: React.FC<SelectProps> = ({
  children,
  label,
  placeholder = 'Select...',
  variant = 'bordered',
  size = 'md',
  selectedKeys,
  onSelectionChange,
  isDisabled,
  className,
  classNames,
}) => {
  const items: { key: string; label: string }[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if ((child.type as any) === SelectItem) {
      const c: any = child as any;
      const key = normalizeKey(child.key?.toString()) || c.props.value;
      items.push({ key: key || '', label: String(c.props.children) });
    }
  });

  const current = selectedKeys ? Array.from(selectedKeys)[0] : undefined;

  const sizeClasses =
    size === 'sm'
      ? 'h-9 text-sm'
      : size === 'lg'
        ? 'h-11 text-base'
        : 'h-10 text-sm';
  const variantClasses =
    variant === 'bordered'
      ? 'border border-default-300 bg-default-50 focus:bg-white focus:border-primary outline-none'
      : 'bg-default-100';

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label
          className={clsx(
            'text-xs font-medium text-default-600',
            classNames?.label
          )}
        >
          {label}
        </label>
      )}
      <select
        disabled={isDisabled}
        className={clsx(
          'w-full rounded-lg px-2 py-1.5 appearance-none cursor-pointer disabled:opacity-50',
          sizeClasses,
          variantClasses,
          classNames?.trigger
        )}
        value={current ?? ''}
        onChange={(e) => {
          const key = e.target.value;
          onSelectionChange?.(new Set([key]));
        }}
      >
        {/* Placeholder option to mimic HeroUI placeholder when nothing selected */}
        {!current && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {items.map((it) => (
          <option
            key={it.key}
            value={it.key}
            className={clsx(classNames?.value)}
          >
            {it.label}
          </option>
        ))}
      </select>
    </div>
  );
};
