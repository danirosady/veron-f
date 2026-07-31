import React from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

export default function DataTable({
  columns,
  data,
  onSort,
  sortBy,
  sortOrder = 'asc',
  loading = false,
  emptyMessage = 'No data available',
  emptyTitle = 'No data found',
  emptyIcon,
  emptyAction,
  emptyActionLabel,
  rowKey = 'id',
  onRowClick,
  actions,
  className = '',
  skeletonRows = 5,
}) {
  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;
    if (sortBy === column.key) {
      onSort(column.key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(column.key, 'asc');
    }
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: skeletonRows }).map((_, idx) => (
      <tr key={`skeleton-${idx}`} className="border-b border-gray-100">
        {columns.map((col) => (
          <td key={col.key} className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </td>
        ))}
        {actions && <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-8 ml-auto" /></td>}
      </tr>
    ));
  };

  const renderRowActions = (row) => {
    if (!actions) return null;
    if (typeof actions === 'function') {
      return actions(row);
    }
    return null;
  };

  const totalCols = columns.length + (actions ? 1 : 0);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.headerClassName
                )}
                onClick={() => handleSort(column)}
                style={{ width: column.width, minWidth: column.minWidth }}
              >
                <div className={cn(
                  'flex items-center gap-1',
                  column.align === 'center' && 'justify-center',
                  column.align === 'right' && 'justify-end'
                )}>
                  {column.header}
                  {column.sortable && sortBy === column.key && (
                    sortOrder === 'asc'
                      ? <ChevronUp className="w-4 h-4 text-primary-600" />
                      : <ChevronDown className="w-4 h-4 text-primary-600" />
                  )}
                </div>
              </th>
            ))}
            {actions && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            renderSkeletonRows()
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="p-0">
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  message={emptyMessage}
                  action={emptyAction}
                  actionLabel={emptyActionLabel}
                />
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const key = row[rowKey] ?? idx;
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-700',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.cellClassName
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : (row[column.key] ?? '-')}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderRowActions(row)}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}