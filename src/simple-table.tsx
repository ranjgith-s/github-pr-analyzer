import React from 'react';

export function DataTable({
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props}>{children}</table>;
}

export function DataTablePagination({
  page,
  pages,
  onPageChange,
  ...props
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-label="Pagination" {...props}>
      Page {page} of {pages}
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </button>
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}

export const Table = {
  Pagination: DataTablePagination,
};
