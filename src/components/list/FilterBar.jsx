import React from 'react';
import { X, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function FilterBar({
  filters = [],
  values = {},
  onChange,
  onReset,
  className = '',
}) {
  const handleFilterChange = (key, value) => {
    onChange?.({ ...values, [key]: value });
  };

  const hasActiveFilters = Object.values(values).some(
    (v) => v !== '' && v !== null && v !== undefined
  );

  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filters.map((filter) => {
          const value = values[filter.key] ?? '';
          if (filter.type === 'select') {
            return (
              <div key={filter.key} className="w-full">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {filter.label}
                </label>
                <select
                  value={value}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">{filter.placeholder || `All ${filter.label}`}</option>
                  {(filter.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          if (filter.type === 'date') {
            return (
              <div key={filter.key} className="w-full">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {filter.label}
                </label>
                <input
                  type="date"
                  value={value}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            );
          }
          if (filter.type === 'dateRange') {
            return (
              <div key={filter.key} className="w-full">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {filter.label}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={values[`${filter.key}_from`] || ''}
                    onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="date"
                    value={values[`${filter.key}_to`] || ''}
                    onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            );
          }
          // text input
          return (
            <div key={filter.key} className="w-full">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {filter.label}
              </label>
              <input
                type="text"
                value={value}
                placeholder={filter.placeholder || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}