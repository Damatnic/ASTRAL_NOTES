/**
 * Enhanced Input Component with Validation States
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';

const inputVariants = cva(
  'flex w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input focus-visible:ring-ring hover:border-ring/50',
        error: 'border-destructive focus-visible:ring-destructive hover:border-destructive/70',
        success: 'border-green-500 focus-visible:ring-green-500 hover:border-green-600',
        warning: 'border-yellow-500 focus-visible:ring-yellow-500 hover:border-yellow-600',
      },
      inputSize: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: string;
  success?: string;
  warning?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant, 
    inputSize,
    error, 
    success, 
    warning, 
    leftIcon, 
    rightIcon, 
    showPasswordToggle = false,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [actualType, setActualType] = React.useState(type);

    React.useEffect(() => {
      if (showPasswordToggle && type === 'password') {
        setActualType(showPassword ? 'text' : 'password');
      } else {
        setActualType(type);
      }
    }, [showPassword, type, showPasswordToggle]);

    // Determine variant based on validation states
    const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;

    const inputElement = (
      <input
        type={actualType}
        className={cn(
          inputVariants({ variant: currentVariant, inputSize }),
          leftIcon && 'pl-10',
          (rightIcon || showPasswordToggle) && 'pr-10',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    const validationMessage = error || success || warning;
    const validationIcon = error ? (
      <AlertCircle className="h-4 w-4 text-destructive" />
    ) : success ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : warning ? (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    ) : null;

    if (leftIcon || rightIcon || showPasswordToggle || validationMessage) {
      return (
        <div className="space-y-1">
          <div className="relative">
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {leftIcon}
              </div>
            )}
            {inputElement}
            {(rightIcon || showPasswordToggle || validationIcon) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {showPasswordToggle && type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
                {rightIcon && <div className="text-muted-foreground">{rightIcon}</div>}
                {validationIcon}
              </div>
            )}
          </div>
          {validationMessage && (
            <p className={cn(
              'text-xs',
              error && 'text-destructive',
              success && 'text-green-600',
              warning && 'text-yellow-600'
            )}>
              {validationMessage}
            </p>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

export { Input };