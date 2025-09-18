import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressProps {
  value: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function Progress({ 
  value, 
  className, 
  size = 'md',
  variant = 'default' 
}: ProgressProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn(
      'w-full bg-gray-200 rounded-full overflow-hidden',
      sizeClasses[size],
      className
    )}>
      <div 
        className={cn(
          'h-full transition-all duration-300 ease-out rounded-full',
          variantClasses[variant]
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}