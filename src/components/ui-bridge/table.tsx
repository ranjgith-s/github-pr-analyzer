import * as React from 'react';
import { cn } from '../../lib/utils';

interface TableContextValue {
  isStriped?: boolean;
}
const TableContext = React.createContext<TableContextValue>({});

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  isStriped?: boolean;
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({
  className,
  isStriped,
  children,
  ...rest
}) => {
  return (
    <TableContext.Provider value={{ isStriped }}>
      <div
        className={cn('w-full overflow-x-auto rounded-md border', className)}
        {...rest}
      >
        <table className="w-full caption-bottom text-sm">{children}</table>
      </div>
    </TableContext.Provider>
  );
};
Table.displayName = 'Table';

/* eslint-disable react/prop-types */
export const TableHeader: React.FC<
  { children: React.ReactNode } & React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className, ...rest }) => (
  <thead className={cn('[&_tr]:border-b bg-muted/40', className)} {...rest}>
    <tr>{children}</tr>
  </thead>
);
TableHeader.displayName = 'TableHeader';

export const TableColumn: React.FC<
  React.ThHTMLAttributes<HTMLTableCellElement>
> = ({ className, ...rest }) => (
  <th
    className={cn(
      'h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap',
      className
    )}
    {...rest}
  />
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
    return children;
  };

  const rows = renderRows();

  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...rest}>
      {React.Children.map(rows as any, (child: any, idx: number) => {
        if (!React.isValidElement(child)) return child;
        const stripedClass = isStriped
          ? idx % 2 === 1
            ? 'bg-muted/30'
            : ''
          : '';
        const existingClass = (child.props as any)?.className;
        return React.cloneElement(child as React.ReactElement<any>, {
          className: cn(existingClass, stripedClass),
        });
      })}
    </tbody>
  );
}
TableBody.displayName = 'TableBody';

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...rest
}) => (
  <tr
    className={cn(
      'border-b transition-colors hover:bg-muted cursor-pointer',
      className
    )}
    {...rest}
  />
);
TableRow.displayName = 'TableRow';

export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement>
> = ({ className, ...rest }) => (
  <td
    className={cn(
      'p-3 align-middle [&:has([role=checkbox])]:pr-0 text-sm',
      className
    )}
    {...rest}
  />
);
/* eslint-enable react/prop-types */
TableCell.displayName = 'TableCell';
