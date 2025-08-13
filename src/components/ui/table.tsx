/* eslint-disable */
import * as React from 'react';
import { cn } from '../../lib/utils';

type TableSize = 'sm' | 'md' | 'lg';

interface TableCtx {
  isStriped?: boolean;
  size?: TableSize;
  stickyHeader?: boolean;
}
const TableContext = React.createContext<TableCtx>({});

// Split props: move aria-* and role to <table>, keep others (including data-*) on container
function splitContainerAndTableA11y<T extends Record<string, any>>(props: T) {
  const containerProps: Record<string, any> = {};
  const tableA11y: Record<string, any> = {};
  for (const key in props) {
    if (key.startsWith('aria-') || key === 'role') {
      tableA11y[key] = (props as any)[key];
    } else {
      containerProps[key] = (props as any)[key];
    }
  }
  return { containerProps, tableA11y };
}

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  isStriped?: boolean;
  size?: TableSize;
  stickyHeader?: boolean;
  tableProps?: React.TableHTMLAttributes<HTMLTableElement>;
  children: React.ReactNode;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, isStriped, size = 'md', stickyHeader, children, tableProps, ...rest }, ref) => {
    const { containerProps, tableA11y } = splitContainerAndTableA11y(rest);
    const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
    return (
      <TableContext.Provider value={{ isStriped, size, stickyHeader }}>
        <div className={cn('w-full overflow-x-auto rounded-md border', className)} {...containerProps}>
          <table
            className={cn('w-full caption-bottom', sizeClass)}
            {...tableA11y}
            {...tableProps}
            ref={ref}
          >
            {children}
          </table>
        </div>
      </TableContext.Provider>
    );
  }
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className, ...rest }, ref) => {
  const { stickyHeader } = React.useContext(TableContext);
  return (
    <thead
      ref={ref}
      className={cn(
        '[&_tr]:border-b bg-muted/40',
        stickyHeader && 'sticky top-0 z-10 bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40',
        className
      )}
      {...rest}
    >
      <tr>{children}</tr>
    </thead>
  );
});
TableHeader.displayName = 'TableHeader';

type TableColumnBaseProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
};
export const TableColumn = React.forwardRef<HTMLTableCellElement, TableColumnBaseProps>(
  (props, ref) => {
    const { className, children, sortable, sortDirection = null, onSort, scope, ...rest } = props;
    const ariaSort = sortable
      ? sortDirection === 'asc'
        ? 'ascending'
        : sortDirection === 'desc'
          ? 'descending'
          : 'none'
      : undefined;
    return (
      <th
        ref={ref}
        scope={scope ?? 'col'}
        aria-sort={ariaSort as any}
        className={cn(
          'h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap select-none',
          sortable && 'cursor-pointer',
          className
        )}
        {...rest}
        onClick={(e) => {
          rest.onClick?.(e);
          if (sortable) onSort?.();
        }}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {sortable && (
            <span aria-hidden="true" className="text-[10px] opacity-70">
              {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : '↕'}
            </span>
          )}
        </span>
      </th>
    );
  }
);
TableColumn.displayName = 'TableColumn';

export interface TableBodyProps<T = any>
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'children'> {
  items?: T[];
  emptyContent?: React.ReactNode;
  children?: React.ReactNode | ((item: T, index: number) => React.ReactNode);
}

export function TableBody<T>({
  items,
  emptyContent,
  children,
  className,
  ...rest
}: TableBodyProps<T>) {
  const { isStriped } = React.useContext(TableContext);
  const renderRows = () => {
    if (items && typeof children === 'function') {
      if (items.length === 0) {
        return (
          <tr>
            <td
              colSpan={100}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyContent || 'No data.'}
            </td>
          </tr>
        );
      }
      return items.map((item, idx) => children(item, idx));
    }
    return children as any;
  };
  const rows = renderRows();
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...rest}>
      {React.Children.map(rows as any, (child: any, idx: number) => {
        if (!React.isValidElement(child)) return child;
        const striped = isStriped ? (idx % 2 === 1 ? 'bg-muted/30' : '') : '';
        return React.cloneElement(child as React.ReactElement<any>, {
          className: cn((child.props as any).className, striped),
        });
      })}
    </tbody>
  );
}
TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
  clickable?: boolean;
}
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, hoverable = true, clickable = true, ...rest }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors',
        hoverable && 'hover:bg-muted',
        clickable && 'cursor-pointer',
        className
      )}
      {...rest}
    />
  )
);
TableRow.displayName = 'TableRow';

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    const { size } = React.useContext(TableContext);
    const pad = size === 'sm' ? 'p-2' : size === 'lg' ? 'p-4' : 'p-3';
    const text = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
    return (
      <td
        ref={ref}
        className={cn(
          pad,
          'align-middle [&:has([role=checkbox])]:pr-0',
          text,
          className
        )}
        {...rest}
      />
    );
  }
);
TableCell.displayName = 'TableCell';

// Optional caption & footer for completeness
export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...rest }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-2 text-sm text-muted-foreground', className)}
    {...rest}
  />
));
TableCaption.displayName = 'TableCaption';

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...rest }, ref) => (
  <tfoot ref={ref} className={cn('[&_tr]:border-t bg-muted/30', className)} {...rest} />
));
TableFooter.displayName = 'TableFooter';
