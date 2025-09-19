/**
 * Enhanced Button Component with Astral Theming
 * Supports multiple variants, sizes, states, and accessibility features
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background relative overflow-hidden group active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:from-indigo-700 hover:to-purple-700 hover:shadow-md focus-visible:ring-primary',
        destructive: 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow hover:from-red-700 hover:to-pink-700 hover:shadow-md focus-visible:ring-destructive',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-ring',
        ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary',
        success: 'bg-green-600 text-white shadow hover:bg-green-700 hover:shadow-md focus-visible:ring-green-500',
        warning: 'bg-yellow-600 text-white shadow hover:bg-yellow-700 hover:shadow-md focus-visible:ring-yellow-500',
        // Enhanced modern variants
        gradient: 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 focus-visible:ring-primary',
        cosmic: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 focus-visible:ring-violet-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-400/20 before:to-indigo-400/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity',
        astral: 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white shadow-xl hover:shadow-2xl hover:from-slate-800 hover:via-purple-800 hover:to-slate-800 focus-visible:ring-purple-500 border border-purple-500/30 hover:border-purple-400/50',
        glass: 'bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background/90 hover:border-border/70 focus-visible:ring-ring',
        elevated: 'bg-card shadow-lg hover:shadow-xl border border-border/50 text-card-foreground hover:bg-card/90 focus-visible:ring-ring hover:-translate-y-0.5',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm rounded-md',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 py-3 text-base',
        xl: 'h-12 px-8 py-3 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  pulse?: boolean;
  shimmer?: boolean;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'success' | 'warning';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    asChild = false, 
    loading = false, 
    loadingText = 'Loading...', 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    tooltip,
    pulse = false,
    shimmer = false,
    badge,
    badgeVariant = 'default',
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    const buttonContent = (
      <>
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        <span className={cn(loading && 'opacity-70')}>
          {loading ? loadingText : children}
        </span>
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </>
    );

    const badgeColors = {
      default: 'bg-primary text-primary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-white',
    };

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          isDisabled && 'opacity-50 pointer-events-none',
          pulse && 'animate-pulse',
          shimmer && 'relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        title={tooltip}
        {...props}
      >
        {buttonContent}
        {badge && (
          <span className={cn(
            'absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 text-xs font-medium rounded-full flex items-center justify-center',
            badgeColors[badgeVariant]
          )}>
            {badge}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };