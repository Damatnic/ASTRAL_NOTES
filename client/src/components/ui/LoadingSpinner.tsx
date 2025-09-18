/**
 * Enhanced Loading Spinner Component
 * Modern loading animations with multiple variants
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2, Brain, Zap, Star } from 'lucide-react';

const spinnerVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'text-primary',
        muted: 'text-muted-foreground',
        primary: 'text-primary',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        destructive: 'text-red-600',
      },
      size: {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      speed: {
        slow: 'animate-spin [animation-duration:2s]',
        default: 'animate-spin',
        fast: 'animate-spin [animation-duration:0.5s]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      speed: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  type?: 'spinner' | 'dots' | 'pulse' | 'brain' | 'zap' | 'star';
  text?: string;
  center?: boolean;
}

export function LoadingSpinner({
  className,
  variant,
  size,
  speed,
  type = 'spinner',
  text,
  center = false,
  ...props
}: LoadingSpinnerProps) {
  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current animate-pulse',
                  size === 'sm' && 'h-1 w-1',
                  size === 'default' && 'h-1.5 w-1.5',
                  size === 'lg' && 'h-2 w-2',
                  size === 'xl' && 'h-3 w-3'
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s',
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div
            className={cn(
              'rounded-full bg-current animate-pulse',
              size === 'sm' && 'h-4 w-4',
              size === 'default' && 'h-6 w-6',
              size === 'lg' && 'h-8 w-8',
              size === 'xl' && 'h-12 w-12'
            )}
          />
        );

      case 'brain':
        return (
          <Brain
            className={cn(
              spinnerVariants({ size, speed }),
              'animate-pulse'
            )}
          />
        );

      case 'zap':
        return (
          <Zap
            className={cn(
              spinnerVariants({ size }),
              'animate-bounce'
            )}
          />
        );

      case 'star':
        return (
          <Star
            className={cn(
              spinnerVariants({ size, speed }),
              'animate-pulse'
            )}
          />
        );

      default:
        return (
          <Loader2
            className={spinnerVariants({ size, speed })}
          />
        );
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-center gap-2',
        center && 'justify-center',
        className
      )}
      {...props}
    >
      <div className={spinnerVariants({ variant })}>
        {renderSpinner()}
      </div>
      {text && (
        <span className={cn(
          'text-sm font-medium',
          variant === 'muted' && 'text-muted-foreground',
          variant === 'primary' && 'text-primary',
          variant === 'success' && 'text-green-600',
          variant === 'warning' && 'text-yellow-600',
          variant === 'destructive' && 'text-red-600'
        )}>
          {text}
        </span>
      )}
    </div>
  );

  if (center) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton loading component
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  avatar?: boolean;
  button?: boolean;
}

export function Skeleton({
  className,
  lines = 1,
  avatar = false,
  button = false,
  ...props
}: SkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)} {...props}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-muted h-10 w-10"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-muted rounded',
              i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>

      {button && (
        <div className="mt-4">
          <div className="h-9 bg-muted rounded w-20"></div>
        </div>
      )}
    </div>
  );
}

// Page loading component
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 h-16 w-16 mx-auto"></div>
          <LoadingSpinner
            size="xl"
            variant="primary"
            type="brain"
            className="relative z-10"
          />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{text}</p>
          <div className="flex justify-center">
            <LoadingSpinner type="dots" variant="muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
