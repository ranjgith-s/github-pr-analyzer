import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRItem } from '../../types';
import { QueryParams } from '../../utils/queryUtils';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from '../ui';
import { Settings2Icon } from 'lucide-react';
import FiltersBar from './FiltersBar';
import ActionBar from './ActionBar';
import TableFooter from './TableFooter';
import { getUIColumns } from './columns';
import { useMetricsTable } from './useMetricsTable';
import { useStatusContent } from './useStatusContent';

interface MetricsTableProps {
  queryParams?: QueryParams;
  totalCount?: number;
  items: PRItem[];
  loading?: boolean;
  error?: string | null;
  onPageChange?: (p: number) => void;
  onPerPageChange?: (n: number) => void;
  onSortChange?: (s: string) => void;
  onOrderChange?: (o: 'asc' | 'desc') => void;
  resultCount?: number;
}

export default function MetricsTable(props: MetricsTableProps) {
  const { queryParams, totalCount, items, loading, error, resultCount } = props;
  const navigate = useNavigate();

  const {
    search,
    setSearch,
    pageIndex,
    pageSize,
    sort,
    order,
    selectedIds,
    visibleColumns,
    setVisibleColumns,
    columnsMenuOpen,
    setColumnsMenuOpen,
    filtered,
    toggleSelect,
    handlePerPageChange,
    handlePageChange,
    handleSortChange,
    totalPages,
    currentItems,
  } = useMetricsTable({
    queryParams,
    items,
    totalCount,
    onPageChange: props.onPageChange,
    onPerPageChange: props.onPerPageChange,
    onSortChange: props.onSortChange,
    onOrderChange: props.onOrderChange,
  });

  const columns = useMemo(
    () => getUIColumns(selectedIds, toggleSelect),
    [selectedIds, toggleSelect]
  );

  useEffect(() => {
    if (!visibleColumns.length) setVisibleColumns(columns.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, visibleColumns.length, setVisibleColumns]);

  const statusContent = useStatusContent({
    error,
    loading,
    resultCount,
    totalCount,
    filteredLength: filtered.length,
    pageSize,
    pageIndex,
    currentItemsLength: currentItems.length,
  });

  if (error) console.error('Failed to load pull request metrics:', error);

  if (loading) {
    return (
      <LoadingOverlay
        show={true}
        messages={[
          'Loading pull requests...',
          'Crunching numbers...',
          'Preparing table...',
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full justify-between items-start gap-4">
        <ActionBar
          disabled={selectedIds.length !== 1}
          onView={() => {
            const selectedItem = items.find((i) => selectedIds.includes(i.id));
            if (!selectedItem) return;
            navigate(
              `/pr/${selectedItem.owner}/${selectedItem.repo_name}/${selectedItem.number}`,
              {
                state: selectedItem,
              }
            );
          }}
        />
        <FiltersBar
          search={search}
          onSearch={setSearch}
          leftContent={
            <div
              className="flex items-center gap-2 text-sm"
              aria-label="Results status"
            >
              {statusContent.icon}
              <span className={`font-normal ${statusContent.className}`}>
                {statusContent.text}
              </span>
            </div>
          }
          rightContent={
            <DropdownMenu
              open={columnsMenuOpen}
              onOpenChange={setColumnsMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="Choose columns"
                  onClick={() => setColumnsMenuOpen((v) => !v)}
                >
                  <Settings2Icon size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent aria-label="Select columns">
                {columns.map((col) => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => {
                      setVisibleColumns((prev) =>
                        prev.includes(col.id)
                          ? prev.filter((c) => c !== col.id)
                          : [...prev, col.id]
                      );
                    }}
                    data-selected={visibleColumns.includes(col.id) || undefined}
                    className={
                      visibleColumns.includes(col.id)
                        ? 'data-[selected]:bg-accent/60'
                        : undefined
                    }
                  >
                    {col.header || '(select)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>
      <Table
        aria-label="PR Metrics Table"
        data-testid="metrics-table"
        isStriped
      >
        <TableHeader>
          {columns
            .filter((c) => visibleColumns.includes(c.id))
            .map((c) => (
              <TableColumn
                key={c.id}
                sortable={c.id !== 'select'}
                sortDirection={sort === c.id ? order : null}
                onSort={() => handleSortChange(c.id)}
              >
                <div className="flex flex-col gap-1">
                  <span>{c.header ? String(c.header).toUpperCase() : ''}</span>
                </div>
              </TableColumn>
            ))}
        </TableHeader>
        <TableBody
          items={currentItems}
          emptyContent={<span>No pull requests found.</span>}
        >
          {(row: PRItem) => (
            <TableRow
              key={row.id}
              onClick={() => toggleSelect(row.id)}
              className={selectedIds.includes(row.id) ? 'bg-accent/40' : ''}
            >
              {columns
                .filter((c) => visibleColumns.includes(c.id))
                .map((c) => (
                  <TableCell key={c.id} data-testid={`cell-${c.id}`}>
                    {c.cell
                      ? c.cell(row)
                      : c.accessorKey
                        ? (row as any)[c.accessorKey]
                        : null}
                  </TableCell>
                ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TableFooter
        pageSize={pageSize}
        totalPages={totalPages}
        pageIndex={pageIndex}
        onPerPageChange={handlePerPageChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
