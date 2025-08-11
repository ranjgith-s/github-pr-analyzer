/* eslint-disable */
import * as React from 'react';
import { cn } from '../../lib/utils';

interface DropdownCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  selectionMode?: 'single' | 'multiple';
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  closeOnSelect?: boolean;
}
const DropdownContext = React.createContext<DropdownCtx | null>(null);

export const Dropdown: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...rest }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block" {...rest}>
      <DropdownContext.Provider value={{ open, setOpen }}>{children}</DropdownContext.Provider>
    </div>
  );
};
Dropdown.displayName = 'Dropdown';

export const DropdownTrigger: React.FC<{ children: React.ReactElement<any> }> = ({ children }) => {
  const ctx = React.useContext(DropdownContext)!;
  const child = children as React.ReactElement<any>;
  const handleClick = (e: any) => {
    child.props?.onClick?.(e);
    ctx.setOpen(!ctx.open);
  };
  return React.cloneElement(child, {
    onClick: handleClick,
    'aria-haspopup': 'menu',
    'aria-expanded': ctx.open,
  });
};
DropdownTrigger.displayName = 'DropdownTrigger';

export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  selectionMode?: 'single' | 'multiple';
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  closeOnSelect?: boolean;
  'aria-label'?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  className,
  selectionMode,
  selectedKeys,
  onSelectionChange,
  closeOnSelect = true,
  ...rest
}) => {
  const ctx = React.useContext(DropdownContext)!;
  React.useEffect(() => {
    if (ctx) {
      ctx.selectionMode = selectionMode;
      ctx.selectedKeys = selectedKeys;
      ctx.onSelectionChange = onSelectionChange;
      ctx.closeOnSelect = closeOnSelect;
    }
  }, [ctx, selectionMode, selectedKeys, onSelectionChange, closeOnSelect]);
  if (!ctx.open) return null;
  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-1 min-w-[160px] rounded-md border bg-popover p-1 shadow-md focus:outline-none',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
DropdownMenu.displayName = 'DropdownMenu';

export interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
  itemKey: string;
  closeOnSelect?: boolean;
  role?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  className,
  itemKey,
  role = 'menuitem',
  onClick,
  ...rest
}) => {
  const ctx = React.useContext(DropdownContext)!;
  const isSelected = ctx.selectedKeys?.has(itemKey);
  return (
    <div
      role={role}
      tabIndex={0}
      data-selected={isSelected ? '' : undefined}
      className={cn(
        'cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[selected]:bg-accent/60',
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        if (ctx.selectionMode === 'single') {
          const set = new Set<string>();
          set.add(itemKey);
          ctx.onSelectionChange?.(set);
        } else if (ctx.selectionMode === 'multiple') {
          const set = new Set(ctx.selectedKeys || []);
            if (set.has(itemKey)) set.delete(itemKey); else set.add(itemKey);
          ctx.onSelectionChange?.(set);
        }
        if (ctx.closeOnSelect !== false) ctx.setOpen(false);
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
DropdownItem.displayName = 'DropdownItem';
