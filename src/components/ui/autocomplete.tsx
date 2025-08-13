/* eslint-disable */
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface AutocompleteProps {
  children: React.ReactNode;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bordered' | 'flat';
  disabled?: boolean;
  onSelect?: (value: string) => void;
  onInputChange?: (value: string) => void;
  className?: string;
  classNames?: { base?: string; listbox?: string };
  'data-testid'?: string;
}

export interface AutocompleteItemProps {
  value: string;
  children: React.ReactNode;
}

export const AutocompleteItem: React.FC<AutocompleteItemProps> = () => null; // marker

export const Autocomplete: React.FC<AutocompleteProps> = ({
  children,
  placeholder = 'Type to search...',
  size = 'md',
  variant = 'bordered',
  disabled,
  onSelect,
  onInputChange,
  className,
  classNames,
  'data-testid': testId,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const items = React.useMemo(() => {
    const acc: { value: string; label: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if ((child.type as any) === AutocompleteItem) {
        acc.push({
          value: (child.props as any).value,
          label: String((child.props as any).children),
        });
      }
    });
    return acc;
  }, [children]);

  const filtered = React.useMemo(
    () =>
      items.filter((i) =>
        i.label.toLowerCase().includes(inputValue.toLowerCase())
      ),
    [items, inputValue]
  );

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
    <div
      className={cn('relative', className, classNames?.base)}
      data-testid={testId}
    >
      <input
        type="text"
        disabled={disabled}
        value={inputValue}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        onChange={(e) => {
          setInputValue(e.target.value);
          onInputChange?.(e.target.value);
          setOpen(true);
        }}
        className={cn(
          'w-full rounded-md px-2 py-1.5 disabled:opacity-50',
          sizeClasses,
          variantClasses
        )}
      />
      {open && filtered.length > 0 && (
        <ul
          className={cn(
            'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg focus:outline-none',
            classNames?.listbox
          )}
        >
          {filtered.map((o) => (
            <li
              key={o.value}
              role="option"
              tabIndex={0}
              className="cursor-pointer select-none rounded-sm px-2 py-1 text-sm hover:bg-accent"
              data-testid="autocomplete-item"
              onMouseDown={(e) => {
                e.preventDefault();
                setInputValue(o.label);
                onSelect?.(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
      <ul className="hidden" aria-hidden="true">
        {items.map((o) => (
          <li key={`hidden-${o.value}`}>{o.label}</li>
        ))}
      </ul>
    </div>
  );
};

Autocomplete.displayName = 'Autocomplete';
