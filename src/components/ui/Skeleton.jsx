import React from 'react';
import { cn } from '@/lib/utils';

export default function Skeleton({
  className = '',
  width,
  height,
  variant = 'text',
}) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 rounded-xl',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse',
        variants[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

export function SkeletonRow({ columns = 5 }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
      {Array.from({ length: columns }).map((_, idx) => (
        <div key={idx} className="flex-1">
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-3 border-b border-gray-200 bg-gray-50">
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="flex-1">
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonRow key={idx} columns={columns} />
      ))}
    </div>
  );
}
