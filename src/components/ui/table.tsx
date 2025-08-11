/* eslint-disable */
import * as React from 'react';
import { cn } from '../../lib/utils';

interface TableCtx {
  isStriped?: boolean;
}
const TableContext = React.createContext<TableCtx>({});

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  isStriped?: boolean;
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({
  className,
  isStriped,
  children,
  ...rest
}) => (
  <TableContext.Provider value={{ isStriped }}>
    <div
      className={cn('w-full overflow-x-auto rounded-md border', className)}
      {...rest}
    >
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  </TableContext.Provider>
);
Table.displayName = 'Table';

export const TableHeader = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('[&_tr]:border-b bg-muted/40', className)} {...rest}>
    <tr>{children}</tr>
  </thead>
);
TableHeader.displayName = 'TableHeader';

type TableColumnProps = React.ThHTMLAttributes<HTMLTableCellElement>;
export function TableColumn(props: TableColumnProps) {
  const { className, ...rest } = props;
  return (
    <th
      className={cn(
        'h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap',
        className
      )}
      {...rest}
    />
  );
}
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

export const TableRow = ({
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      'border-b transition-colors hover:bg-muted cursor-pointer',
      className
    )}
    {...rest}
  />
);
TableRow.displayName = 'TableRow';

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
export function TableCell(props: TableCellProps) {
  const { className, ...rest } = props;
  return (
    <td
      className={cn(
        'p-3 align-middle [&:has([role=checkbox])]:pr-0 text-sm',
        className
      )}
      {...rest}
    />
  );
}
TableCell.displayName = 'TableCell';
