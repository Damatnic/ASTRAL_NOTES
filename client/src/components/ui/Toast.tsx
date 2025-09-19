/**
 * Advanced Toast Notification System with Astral Theming
 * Features: animations, positioning, auto-dismiss, actions, progress bars
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  action?: ToastAction;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface ToastItemProps extends Toast {
  onDismiss: (id: string) => void;
}

const variantStyles = {
  default: {
    container: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    icon: null,
    iconColor: '',
  },
  success: {
    container: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
};

function ToastItem({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  persistent = false,
  action,
  onDismiss,
}: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  // Entrance animation
  useEffect(() => {
    const delay = process.env.NODE_ENV === 'test' ? 0 : 50;
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (persistent || duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);

      if (remaining <= 0) {
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, persistent]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  return (
    <div
      className={cn(
        'relative w-full max-w-sm rounded-lg border shadow-lg transition-all duration-300 ease-out',
        styles.container,
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Progress bar */}
      {!persistent && duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-t-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-75 ease-linear',
              variant === 'success' && 'bg-emerald-500',
              variant === 'error' && 'bg-red-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'info' && 'bg-blue-500',
              variant === 'default' && 'bg-slate-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          {IconComponent && (
            <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.iconColor)} />
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {description}
            </p>

            {/* Action */}
            {action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: Toast['position'];
}

function ToastContainer({ toasts, onDismiss, position = 'top-right' }: ToastContainerProps) {
  const groupedToasts = toasts.reduce((acc, toast) => {
    const toastPosition = toast.position || position;
    if (!acc[toastPosition]) acc[toastPosition] = [];
    acc[toastPosition].push(toast);
    return acc;
  }, {} as Record<string, Toast[]>);

  return (
    <>
      {Object.entries(groupedToasts).map(([pos, positionToasts]) => (
        <div
          key={pos}
          className={cn(
            'fixed z-50 flex flex-col gap-2 max-h-screen overflow-hidden',
            positionStyles[pos as keyof typeof positionStyles]
          )}
        >
          {positionToasts.map((toast) => (
            <ToastItem
              key={toast.id}
              {...toast}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      ))}
    </>
  );
}

// Toast Hook and Context
class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, ...toast };
    this.toasts.push(newToast);
    this.notify();
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  // Convenience methods
  success(description: string, options?: Partial<Toast>) {
    return this.add({ ...options, description, variant: 'success' });
  }

  error(description: string, options?: Partial<Toast>) {
    return this.add({ ...options, description, variant: 'error' });
  }

  warning(description: string, options?: Partial<Toast>) {
    return this.add({ ...options, description, variant: 'warning' });
  }

  info(description: string, options?: Partial<Toast>) {
    return this.add({ ...options, description, variant: 'info' });
  }
}

const toastManager = new ToastManager();

export const toast = {
  add: (toast: Omit<Toast, 'id'>) => toastManager.add(toast),
  success: (description: string, options?: Partial<Toast>) => toastManager.success(description, options),
  error: (description: string, options?: Partial<Toast>) => toastManager.error(description, options),
  warning: (description: string, options?: Partial<Toast>) => toastManager.warning(description, options),
  info: (description: string, options?: Partial<Toast>) => toastManager.info(description, options),
  dismiss: (id: string) => toastManager.dismiss(id),
  clear: () => toastManager.clear(),
};

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return (
    <>
      {children}
      {createPortal(
        <ToastContainer
          toasts={toasts}
          onDismiss={toastManager.dismiss.bind(toastManager)}
        />,
        document.body
      )}
    </>
  );
}

// Hook for using toasts
export function useToast() {
  return toast;
}

// Simple Toast component for testing compatibility
export function Toast({
  type = 'default',
  title,
  message,
  isVisible = true,
  onClose,
  action
}: {
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
  title?: string;
  message: string;
  isVisible?: boolean;
  onClose?: () => void;
  action?: ToastAction;
}) {
  if (!isVisible) return null;

  const variant = type === 'default' ? 'default' : type;
  
  return (
    <ToastItem
      id="test-toast"
      title={title}
      description={message}
      variant={variant}
      action={action}
      onDismiss={onClose || (() => {})}
    />
  );
}