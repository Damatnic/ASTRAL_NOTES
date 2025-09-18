/**
 * Avatar Component
 * Displays user profile pictures with fallback initials
 */

import React from 'react';
import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

export function Avatar({
  src,
  alt,
  size = 'md',
  fallback,
  className
}: AvatarProps) {
  const initials = fallback || alt?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden",
      sizeClasses[size],
      className
    )}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={(e) => {
            // Hide image on error and show fallback
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {initials}
        </span>
      )}
    </div>
  );
}

export default Avatar;
