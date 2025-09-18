/**
 * Select Component
 */

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, value, onValueChange, placeholder, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
          <SelectValue value={value} placeholder={placeholder} />
        </SelectTrigger>
        {isOpen && (
          <SelectContent onClose={() => setIsOpen(false)}>
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === SelectItem) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  onClick: () => {
                    onValueChange?.(child.props.value);
                    setIsOpen(false);
                  }
                });
              }
              return child;
            })}
          </SelectContent>
        )}
      </div>
    );
  }
);

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    type="button"
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
));

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute top-full z-50 min-w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { value?: string; placeholder?: string }
>(({ className, value, placeholder, ...props }, ref) => (
  <span ref={ref} className={cn("truncate", className)} {...props}>
    {value || placeholder}
  </span>
));

Select.displayName = 'Select';
SelectTrigger.displayName = 'SelectTrigger';
SelectContent.displayName = 'SelectContent';
SelectItem.displayName = 'SelectItem';
SelectValue.displayName = 'SelectValue';

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };