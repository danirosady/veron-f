import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable search + status filter bar.
 *
 * Row 1: Search input (flex-1) | Status pills (All / Active / Inactive)
 * Row 2 (optional): Extra filter selects passed as children
 *
 * Usage:
 *   <SearchFilterBar
 *     search={search}
 *     onSearchChange={setSearch}
 *     searchPlaceholder="Search units..."
 *     statusValue={status}
 *     onStatusChange={setStatus}
 *     statusOptions={[{ value: 'all', label: 'All' }, ...]}
 *   >
 *     <select>Company</select>
 *     <select>Project</select>
 *   </SearchFilterBar>
 */
export default function SearchFilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  statusValue = 'all',
  onStatusChange,
  statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  children,
  className = '',
}) {
  const hasExtraFilters = React.Children.count(children) > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Row 1: Search + Status Pills */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-center">
          {statusOptions.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusChange?.(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                statusValue === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Extra Filters (if any) */}
      {hasExtraFilters && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
