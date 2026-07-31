import React from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export default function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  delay = 400,
  className = '',
  debounced = true,
}) {
  const debouncedValue = useDebounce(value, delay);

  React.useEffect(() => {
    if (debounced && onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, debounced, onSearch]);

  const handleClear = () => {
    onChange('');
    if (!debounced && onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}