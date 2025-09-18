/**
 * Advanced Dropdown Component with Astral Theming
 * Features: keyboard navigation, positioning, animations, grouping
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
  group?: string;
}

interface DropdownProps {
  options?: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  multiSelect?: boolean;
  className?: string;
  variant?: 'default' | 'cosmic' | 'astral';
  size?: 'sm' | 'md' | 'lg';
  // Popover/trigger mode props
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

const variantClasses = {
  default: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
  cosmic: 'border-violet-300 dark:border-violet-600 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50',
  astral: 'border-purple-500/30 bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900',
};

const sizeClasses = {
  sm: 'h-8 px-2 text-sm',
  md: 'h-10 px-3',
  lg: 'h-12 px-4 text-lg',
};

export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  searchable = false,
  multiSelect = false,
  className,
  variant = 'default',
  size = 'md',
  trigger,
  children,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiSelect ? (Array.isArray(value) ? value : value ? [value] : []) : []
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Group options if groups are defined
  const groupedOptions = filteredOptions.length > 0 ? filteredOptions.reduce((acc, option) => {
    const group = option.group || '';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, DropdownOption[]>) : {};

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      const newSelectedValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      
      setSelectedValues(newSelectedValues);
      onChange?.(newSelectedValues as any);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
    }
  };

  const getDisplayValue = () => {
    if (multiSelect) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option?.label || selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    }
    
    const selectedOption = options.find(opt => opt.value === value);
    return selectedOption?.label || placeholder;
  };

  // If trigger is provided, use trigger/popover mode
  if (trigger) {
    return (
      <div ref={dropdownRef} className={cn('relative', className)}>
        {/* Custom Trigger */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="cursor-pointer"
        >
          {trigger}
        </div>
        
        {/* Dropdown Menu */}
        {isOpen && (
          <div className={cn(
            'absolute top-full left-0 z-50 mt-1 rounded-lg border shadow-lg',
            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
            'min-w-max'
          )}>
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          sizeClasses[size],
          variantClasses[variant],
          isOpen ? 'ring-2 ring-indigo-500' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400 dark:hover:border-slate-500',
          error ? 'border-red-500 ring-red-500' : '',
          'text-left'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={cn(
          'truncate',
          !value && !selectedValues.length ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'
        )}>
          {getDisplayValue()}
        </span>
        <ChevronDown 
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform',
            isOpen ? 'rotate-180' : ''
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border shadow-lg',
          'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          'max-h-60 overflow-auto'
        )}>
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Options */}
          <div className="py-1">
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group}>
                {group && (
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {group}
                  </div>
                )}
                {groupOptions.map((option, index) => {
                  const globalIndex = filteredOptions.indexOf(option);
                  const isSelected = multiSelect 
                    ? selectedValues.includes(option.value)
                    : value === option.value;
                  const isHighlighted = globalIndex === highlightedIndex;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full flex items-center px-3 py-2 text-sm text-left transition-colors',
                        isHighlighted ? 'bg-indigo-50 dark:bg-indigo-950/50' : '',
                        isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white',
                        option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {option.icon && (
                        <span className="mr-2 flex-shrink-0">{option.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}