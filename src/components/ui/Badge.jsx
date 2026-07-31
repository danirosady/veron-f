import React from 'react';
import { cn } from '@/lib/utils';

const variants = {
  mounted: 'bg-blue-100 text-blue-800',
  spare: 'bg-yellow-100 text-yellow-800',
  dismounted: 'bg-gray-100 text-gray-800',
  scrap: 'bg-red-100 text-red-800',
  running: 'bg-green-100 text-green-800',
  new_tyre: 'bg-emerald-100 text-emerald-800',
  repair: 'bg-orange-100 text-orange-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-orange-100 text-orange-800',
  default: 'bg-gray-100 text-gray-800',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant] || variants.default,
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
