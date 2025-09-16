/**
 * Progress Component
 * For displaying progress bars and completion status
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'cosmic';
  showLabel?: boolean;
  label?: string;
}

const progressVariants = {
  size: {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  },
  variant: {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    cosmic: 'bg-gradient-to-r from-violet-500 to-indigo-500',
  },
};

export function Progress({ 
  value, 
  max = 100, 
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
  ...props 
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full bg-secondary rounded-full overflow-hidden',
        progressVariants.size[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out rounded-full',
            progressVariants.variant[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}