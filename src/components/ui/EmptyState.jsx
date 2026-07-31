import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data',
  message = 'There is nothing here yet.',
  action,
  actionLabel,
  className = '',
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">{message}</p>
      {action && actionLabel && (
        <Button onClick={action} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
