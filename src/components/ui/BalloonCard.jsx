import React from 'react';
import { cn } from '@/lib/utils';

export default function BalloonCard({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 shadow-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
