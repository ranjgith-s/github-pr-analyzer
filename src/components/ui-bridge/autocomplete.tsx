import React, { useState, useMemo } from 'react';
import clsx from 'clsx';

interface AutocompleteProps {
  children: React.ReactNode;
  placeholder?: string;
  variant?: 'bordered' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  onSelectionChange?: (value: string | null) => void;
  isDisabled?: boolean;
  className?: string;
  classNames?: { base?: string; listbox?: string };
  // Additional filtering customization hooks could be added later
}

interface AutocompleteItemProps {
  children: React.ReactNode;
  // Value taken from key
}

export const AutocompleteItem: React.FC<AutocompleteItemProps> = () => null; // sentinel

export const Autocomplete: React.FC<AutocompleteProps> = ({
  children,
  placeholder = 'Type to search...',
  variant = 'bordered',
  size = 'md',
  onSelectionChange,
  isDisabled,
  className,
  classNames,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(() => {
    const acc: { key: string; label: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if ((child.type as any) === AutocompleteItem) {
        const key = child.key?.toString() || '';
        acc.push({ key, label: String((child as any).props.children) });
      }
    });
    return acc;
  }, [children]);

  const filtered = useMemo(
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
      ? 'border border-default-300 bg-default-50 focus:bg-white focus:border-primary outline-none'
      : 'bg-default-100';

  return (
    <div className={clsx('relative', className, classNames?.base)}>
      <input
        type="text"
        disabled={isDisabled}
        value={inputValue}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 100)}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        className={clsx(
          'w-full rounded-lg px-2 py-1.5',
          sizeClasses,
          variantClasses,
          'disabled:opacity-50'
        )}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          className={clsx(
            'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-default-200 bg-background p-1 shadow-lg focus:outline-none',
            classNames?.listbox
          )}
        >
          {filtered.map((option) => (
            <li
              key={option.key}
              role="option"
              tabIndex={0}
              className="cursor-pointer select-none rounded-sm px-2 py-1 text-sm hover:bg-muted"
              onMouseDown={(e) => {
                e.preventDefault();
                setInputValue(option.label);
                onSelectionChange?.(option.key);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
