import * as React from 'react';
import { cn } from '../../lib/utils';

// Simple Dropdown implementation mimicking minimal HeroUI API used in MetricsTable
// API surface: <Dropdown><DropdownTrigger><Button/></DropdownTrigger><DropdownMenu selectionMode [selectedKeys] onSelectionChange>{children}</DropdownMenu></Dropdown>
// Each child is <DropdownItem key onClick>label</DropdownItem>

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSelectionChange?: (keys: any) => void; // match loose HeroUI usage
  selectionMode?: 'single' | 'multiple';
  selectedKeys?: Set<string>;
  closeOnSelect?: boolean;
}
const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export const Dropdown: React.FC<
  { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>
> = ({ children, ...rest }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block" {...rest}>
      <DropdownContext.Provider value={{ open, setOpen }}>
        {children}
      </DropdownContext.Provider>
    </div>
  );
};
Dropdown.displayName = 'Dropdown';

export const DropdownTrigger: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const ctx = React.useContext(DropdownContext)!;
  // Wrap trigger to toggle menu
  return React.cloneElement(children as any, {
    onClick: (e: any) => {
      (children as any).props?.onClick?.(e);
      ctx.setOpen(!ctx.open);
    },
    'aria-haspopup': 'menu',
    'aria-expanded': ctx.open,
  });
};
DropdownTrigger.displayName = 'DropdownTrigger';

interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  selectionMode?: 'single' | 'multiple';
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: any) => void;
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
      (ctx as any).selectionMode = selectionMode;
      (ctx as any).selectedKeys = selectedKeys;
      (ctx as any).onSelectionChange = onSelectionChange;
      (ctx as any).closeOnSelect = closeOnSelect;
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

interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
  closeOnSelect?: boolean;
  itemKey: string; // explicit prop instead of using reserved key
  role?: string;
}
export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  className,
  onClick,
  itemKey,
  role = 'menuitem',
  ...rest
}) => {
  const ctx = React.useContext(DropdownContext)!;
  const isSelected = ctx.selectedKeys?.has(itemKey);
  return (
    <div
      role={role}
      tabIndex={0}
      data-selected={isSelected ? '' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (ctx.selectionMode === 'single') {
          const newSet = new Set<string>();
          newSet.add(itemKey);
          ctx.onSelectionChange?.(newSet);
        } else if (ctx.selectionMode === 'multiple') {
          const newSet = new Set(ctx.selectedKeys || []);
          if (newSet.has(itemKey)) newSet.delete(itemKey);
          else newSet.add(itemKey);
          ctx.onSelectionChange?.(newSet);
        }
        if (ctx.closeOnSelect !== false) ctx.setOpen(false);
      }}
      className={cn(
        'cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[selected]:bg-accent/60',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
DropdownItem.displayName = 'DropdownItem';
