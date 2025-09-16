/**
 * Advanced Tabs Component with Astral Theming
 * Features: keyboard navigation, animations, vertical/horizontal layouts
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'cosmic' | 'astral' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const variantClasses = {
  default: {
    container: 'border-b border-slate-200 dark:border-slate-700',
    tab: 'px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-all hover:text-slate-700 dark:hover:text-slate-300',
    activeTab: 'border-indigo-500 text-indigo-600 dark:text-indigo-400',
    inactiveTab: 'text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600',
  },
  cosmic: {
    container: 'border-b border-violet-200 dark:border-violet-800',
    tab: 'px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-all hover:text-violet-700 dark:hover:text-violet-300',
    activeTab: 'border-violet-500 text-violet-600 dark:text-violet-400 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50',
    inactiveTab: 'text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-600',
  },
  astral: {
    container: 'border-b border-purple-500/30',
    tab: 'px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-all hover:text-purple-300',
    activeTab: 'border-purple-500 text-white bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900',
    inactiveTab: 'text-slate-400 hover:border-purple-500/50',
  },
  pills: {
    container: 'p-1 bg-slate-100 dark:bg-slate-800 rounded-lg',
    tab: 'px-4 py-2 text-sm font-medium rounded-md transition-all',
    activeTab: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm',
    inactiveTab: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
  },
  underline: {
    container: '',
    tab: 'px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-all relative',
    activeTab: 'text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500 after:rounded-full',
    inactiveTab: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
  },
};

const sizeClasses = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

export function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id || ''
  );
  
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  // Update indicator position
  useEffect(() => {
    if (variant === 'pills' || variant === 'underline') return;
    
    const activeTabElement = tabsRef.current?.querySelector(
      `[data-tab-id="${activeTab}"]`
    ) as HTMLElement;
    
    if (activeTabElement && tabsRef.current) {
      const tabsRect = tabsRef.current.getBoundingClientRect();
      const activeRect = activeTabElement.getBoundingClientRect();
      
      if (orientation === 'horizontal') {
        setIndicatorStyle({
          left: activeRect.left - tabsRect.left,
          width: activeRect.width,
          height: '2px',
          bottom: 0,
        });
      } else {
        setIndicatorStyle({
          top: activeRect.top - tabsRect.top,
          height: activeRect.height,
          width: '2px',
          left: 0,
        });
      }
    }
  }, [activeTab, orientation, variant]);

  const handleTabClick = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === tabId);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleTabClick(tabId);
        return;
    }

    // Skip disabled tabs
    while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = nextIndex > 0 ? nextIndex - 1 : tabs.length - 1;
      } else {
        nextIndex = nextIndex < tabs.length - 1 ? nextIndex + 1 : 0;
      }
    }

    if (nextIndex !== currentIndex) {
      const nextTab = tabsRef.current?.querySelector(
        `[data-tab-id="${tabs[nextIndex].id}"]`
      ) as HTMLElement;
      nextTab?.focus();
    }
  };

  const classes = variantClasses[variant];
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div 
      className={cn(
        'w-full',
        orientation === 'vertical' && 'flex gap-6',
        className
      )}
    >
      {/* Tab List */}
      <div
        ref={tabsRef}
        className={cn(
          'relative flex',
          orientation === 'vertical' ? 'flex-col w-48' : 'flex-row',
          fullWidth && orientation === 'horizontal' && 'w-full',
          classes.container
        )}
        role="tablist"
        aria-orientation={orientation}
      >
        {/* Moving indicator for non-pill variants */}
        {(variant === 'default' || variant === 'cosmic' || variant === 'astral') && (
          <div
            className={cn(
              'absolute transition-all duration-200 ease-out',
              variant === 'cosmic' ? 'bg-violet-500' : 'bg-indigo-500',
              variant === 'astral' && 'bg-purple-500'
            )}
            style={indicatorStyle}
          />
        )}

        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
              onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab.id)}
              disabled={tab.disabled}
              className={cn(
                classes.tab,
                sizeClasses[size],
                isActive ? classes.activeTab : classes.inactiveTab,
                fullWidth && orientation === 'horizontal' && 'flex-1',
                tab.disabled && 'opacity-50 cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-sm'
              )}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
            >
              <div className="flex items-center justify-center gap-2">
                {tab.icon && (
                  <span className="flex-shrink-0">{tab.icon}</span>
                )}
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span className={cn(
                    'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
                    isActive 
                      ? 'bg-white/20 text-current' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={cn(
        'flex-1',
        orientation === 'horizontal' ? 'mt-6' : ''
      )}>
        {activeTabData && (
          <div
            id={`panel-${activeTabData.id}`}
            role="tabpanel"
            aria-labelledby={activeTabData.id}
            className="focus:outline-none"
            tabIndex={0}
          >
            {activeTabData.content}
          </div>
        )}
      </div>
    </div>
  );
}

// Simplified tab component for basic use cases
interface SimpleTabsProps {
  children: React.ReactElement<SimpleTabProps>[];
  defaultTab?: string;
  className?: string;
}

interface SimpleTabProps {
  id: string;
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function SimpleTab({ children }: SimpleTabProps) {
  return <>{children}</>;
}

export function SimpleTabs({ children, defaultTab, className }: SimpleTabsProps) {
  const tabs: TabItem[] = React.Children.map(children, (child) => ({
    id: child.props.id,
    label: child.props.label,
    content: child.props.children,
    icon: child.props.icon,
    disabled: child.props.disabled,
  }));

  return (
    <Tabs
      tabs={tabs}
      defaultTab={defaultTab}
      className={className}
    />
  );
}