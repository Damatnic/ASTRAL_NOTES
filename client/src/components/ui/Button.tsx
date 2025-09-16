/**
 * Enhanced Button Component with Astral Theming
 * Supports multiple variants, sizes, states, and accessibility features
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative overflow-hidden group',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl focus-visible:ring-indigo-500',
        destructive: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl focus-visible:ring-red-500',
        outline: 'border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-300 dark:hover:border-indigo-700 focus-visible:ring-indigo-500',
        secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-500',
        ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-slate-500',
        link: 'text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 focus-visible:ring-indigo-500',
        cosmic: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl focus-visible:ring-violet-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-400/20 before:to-indigo-400/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity',
        astral: 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white hover:from-slate-800 hover:via-purple-800 hover:to-slate-800 shadow-xl hover:shadow-2xl focus-visible:ring-purple-500 border border-purple-500/30 hover:border-purple-400/50',
        success: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl focus-visible:ring-emerald-500',
        warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl focus-visible:ring-amber-500',
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

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        title={tooltip}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };