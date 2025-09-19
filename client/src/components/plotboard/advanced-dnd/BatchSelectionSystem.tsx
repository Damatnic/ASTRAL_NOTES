/**
 * Advanced Batch Selection System
 * Multi-select scenes with rubber band selection, keyboard shortcuts, and visual feedback
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  MousePointer, 
  Square, 
  CheckSquare, 
  Copy, 
  Move, 
  Trash2, 
  MoreHorizontal,
  Edit,
  Link,
  Tag,
  Layers,
  ArrowRight,
  X,
  SelectAll
} from 'lucide-react';
import type { Scene } from '@/types/story';

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean;
}

export interface BatchSelectionState {
  selectedItems: Set<string>;
  selectionType: 'scene' | 'lane' | 'mixed';
  sourceContainer: string | null;
  lastSelectedItem: string | null;
  selectionRect: SelectionRect | null;
  isMultiSelectMode: boolean;
  isDragSelecting: boolean;
  anchor: string | null; // For shift-click range selection
}

export interface BatchOperation {
  type: 'move' | 'copy' | 'delete' | 'edit' | 'tag' | 'group';
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  dangerous?: boolean;
  requiresTarget?: boolean;
}

const BATCH_OPERATIONS: BatchOperation[] = [
  {
    type: 'move',
    description: 'Move scenes',
    icon: <Move className="h-4 w-4" />,
    shortcut: 'Ctrl+X',
    requiresTarget: true
  },
  {
    type: 'copy',
    description: 'Duplicate scenes',
    icon: <Copy className="h-4 w-4" />,
    shortcut: 'Ctrl+C'
  },
  {
    type: 'delete',
    description: 'Delete scenes',
    icon: <Trash2 className="h-4 w-4" />,
    shortcut: 'Delete',
    dangerous: true
  },
  {
    type: 'edit',
    description: 'Bulk edit',
    icon: <Edit className="h-4 w-4" />,
    shortcut: 'Ctrl+E'
  },
  {
    type: 'tag',
    description: 'Add tags',
    icon: <Tag className="h-4 w-4" />
  },
  {
    type: 'group',
    description: 'Create group',
    icon: <Layers className="h-4 w-4" />
  }
];

interface BatchSelectionContextValue {
  state: BatchSelectionState;
  selectItem: (itemId: string, type: 'scene' | 'lane', container: string, extend?: boolean) => void;
  deselectItem: (itemId: string) => void;
  selectRange: (fromId: string, toId: string, items: string[]) => void;
  selectAll: (items: string[], type: 'scene' | 'lane', container: string) => void;
  clearSelection: () => void;
  toggleMultiSelectMode: (enabled: boolean) => void;
  startDragSelection: (x: number, y: number) => void;
  updateDragSelection: (x: number, y: number) => void;
  endDragSelection: () => void;
  isSelected: (itemId: string) => boolean;
  getSelectionCount: () => number;
  getSelectedItems: () => string[];
  canPerformOperation: (operation: BatchOperation) => boolean;
}

const BatchSelectionContext = React.createContext<BatchSelectionContextValue | null>(null);

export function useBatchSelection() {
  const context = React.useContext(BatchSelectionContext);
  if (!context) {
    throw new Error('useBatchSelection must be used within a BatchSelectionProvider');
  }
  return context;
}

interface BatchSelectionProviderProps {
  children: React.ReactNode;
  onBatchOperation?: (operation: string, itemIds: string[]) => void;
  onSelectionChange?: (selectedItems: string[]) => void;
  maxSelectionSize?: number;
}

export function BatchSelectionProvider({
  children,
  onBatchOperation,
  onSelectionChange,
  maxSelectionSize = 50
}: BatchSelectionProviderProps) {
  const [state, setState] = useState<BatchSelectionState>({
    selectedItems: new Set(),
    selectionType: 'scene',
    sourceContainer: null,
    lastSelectedItem: null,
    selectionRect: null,
    isMultiSelectMode: false,
    isDragSelecting: false,
    anchor: null
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Notify selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(state.selectedItems));
  }, [state.selectedItems, onSelectionChange]);

  const selectItem = useCallback((
    itemId: string, 
    type: 'scene' | 'lane', 
    container: string, 
    extend = false
  ) => {
    setState(prev => {
      const newSelection = new Set(extend ? prev.selectedItems : []);
      
      // Check selection limit
      if (newSelection.size >= maxSelectionSize && !newSelection.has(itemId)) {
        console.warn(`Selection limit of ${maxSelectionSize} items reached`);
        return prev;
      }

      // Add or toggle item
      if (extend && newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }

      return {
        ...prev,
        selectedItems: newSelection,
        selectionType: type,
        sourceContainer: container,
        lastSelectedItem: itemId,
        anchor: extend ? prev.anchor : itemId
      };
    });
  }, [maxSelectionSize]);

  const deselectItem = useCallback((itemId: string) => {
    setState(prev => {
      const newSelection = new Set(prev.selectedItems);
      newSelection.delete(itemId);
      
      return {
        ...prev,
        selectedItems: newSelection,
        lastSelectedItem: newSelection.size > 0 ? prev.lastSelectedItem : null,
        anchor: newSelection.has(prev.anchor || '') ? prev.anchor : null
      };
    });
  }, []);

  const selectRange = useCallback((fromId: string, toId: string, items: string[]) => {
    const fromIndex = items.indexOf(fromId);
    const toIndex = items.indexOf(toId);
    
    if (fromIndex === -1 || toIndex === -1) return;

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const rangeItems = items.slice(start, end + 1);

    setState(prev => {
      const newSelection = new Set(prev.selectedItems);
      rangeItems.forEach(id => newSelection.add(id));
      
      return {
        ...prev,
        selectedItems: newSelection,
        lastSelectedItem: toId
      };
    });
  }, []);

  const selectAll = useCallback((items: string[], type: 'scene' | 'lane', container: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set(items.slice(0, maxSelectionSize)),
      selectionType: type,
      sourceContainer: container,
      lastSelectedItem: items[0] || null,
      anchor: items[0] || null
    }));
  }, [maxSelectionSize]);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set(),
      lastSelectedItem: null,
      anchor: null,
      selectionRect: null,
      isDragSelecting: false
    }));
  }, []);

  const toggleMultiSelectMode = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isMultiSelectMode: enabled,
      selectedItems: enabled ? prev.selectedItems : new Set()
    }));
  }, []);

  const startDragSelection = useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      selectionRect: {
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        isActive: true
      },
      isDragSelecting: true
    }));
  }, []);

  const updateDragSelection = useCallback((x: number, y: number) => {
    setState(prev => {
      if (!prev.selectionRect) return prev;
      
      return {
        ...prev,
        selectionRect: {
          ...prev.selectionRect,
          endX: x,
          endY: y
        }
      };
    });
  }, []);

  const endDragSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectionRect: null,
      isDragSelecting: false
    }));
  }, []);

  const isSelected = useCallback((itemId: string) => {
    return state.selectedItems.has(itemId);
  }, [state.selectedItems]);

  const getSelectionCount = useCallback(() => {
    return state.selectedItems.size;
  }, [state.selectedItems]);

  const getSelectedItems = useCallback(() => {
    return Array.from(state.selectedItems);
  }, [state.selectedItems]);

  const canPerformOperation = useCallback((operation: BatchOperation) => {
    if (state.selectedItems.size === 0) return false;
    
    switch (operation.type) {
      case 'move':
      case 'copy':
        return state.selectedItems.size > 0;
      case 'delete':
        return state.selectedItems.size > 0;
      case 'edit':
        return state.selectedItems.size > 0;
      case 'tag':
        return state.selectedItems.size > 0;
      case 'group':
        return state.selectedItems.size > 1;
      default:
        return false;
    }
  }, [state.selectedItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            // Would need access to current items
            break;
          case 'x':
            if (state.selectedItems.size > 0) {
              event.preventDefault();
              onBatchOperation?.('move', getSelectedItems());
            }
            break;
          case 'c':
            if (state.selectedItems.size > 0) {
              event.preventDefault();
              onBatchOperation?.('copy', getSelectedItems());
            }
            break;
          case 'e':
            if (state.selectedItems.size > 0) {
              event.preventDefault();
              onBatchOperation?.('edit', getSelectedItems());
            }
            break;
        }
      } else {
        switch (event.key) {
          case 'Delete':
            if (state.selectedItems.size > 0) {
              event.preventDefault();
              onBatchOperation?.('delete', getSelectedItems());
            }
            break;
          case 'Escape':
            clearSelection();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedItems, getSelectedItems, onBatchOperation, clearSelection]);

  const contextValue: BatchSelectionContextValue = {
    state,
    selectItem,
    deselectItem,
    selectRange,
    selectAll,
    clearSelection,
    toggleMultiSelectMode,
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    isSelected,
    getSelectionCount,
    getSelectedItems,
    canPerformOperation
  };

  return (
    <BatchSelectionContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative">
        {children}
        <SelectionOverlay />
      </div>
    </BatchSelectionContext.Provider>
  );
}

// Selection overlay for rubber band selection
function SelectionOverlay() {
  const { state } = useBatchSelection();

  if (!state.selectionRect?.isActive) return null;

  const rect = state.selectionRect;
  const left = Math.min(rect.startX, rect.endX);
  const top = Math.min(rect.startY, rect.endY);
  const width = Math.abs(rect.endX - rect.startX);
  const height = Math.abs(rect.endY - rect.startY);

  return (
    <motion.div
      className="fixed pointer-events-none z-50 bg-blue-200 bg-opacity-30 border-2 border-blue-400 border-dashed"
      style={{
        left,
        top,
        width,
        height
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.1 }}
    />
  );
}

// Batch selection toolbar
interface BatchSelectionToolbarProps {
  className?: string;
  position?: 'top' | 'bottom' | 'floating';
  onOperation?: (operation: string, itemIds: string[]) => void;
}

export function BatchSelectionToolbar({ 
  className, 
  position = 'floating',
  onOperation 
}: BatchSelectionToolbarProps) {
  const { 
    state, 
    clearSelection, 
    getSelectionCount, 
    getSelectedItems, 
    canPerformOperation 
  } = useBatchSelection();

  const selectionCount = getSelectionCount();
  const selectedItems = getSelectedItems();

  const handleOperation = useCallback((operationType: string) => {
    onOperation?.(operationType, selectedItems);
  }, [onOperation, selectedItems]);

  if (selectionCount === 0) return null;

  const positionClasses = {
    top: 'top-4 left-1/2 transform -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
    floating: 'top-4 right-4'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.9 }}
        className={cn(
          "fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-4",
          positionClasses[position],
          className
        )}
      >
        <div className="flex items-center gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <span className="font-medium">
              {selectionCount} scene{selectionCount !== 1 ? 's' : ''} selected
            </span>
            {state.selectionType !== 'scene' && (
              <Badge variant="secondary" className="text-xs">
                {state.selectionType}
              </Badge>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Operations */}
          <div className="flex items-center gap-2">
            {BATCH_OPERATIONS.map(operation => (
              <Button
                key={operation.type}
                size="sm"
                variant={operation.dangerous ? "destructive" : "outline"}
                onClick={() => handleOperation(operation.type)}
                disabled={!canPerformOperation(operation)}
                title={`${operation.description}${operation.shortcut ? ` (${operation.shortcut})` : ''}`}
                className="flex items-center gap-2"
              >
                {operation.icon}
                <span className="hidden sm:inline">{operation.description}</span>
              </Button>
            ))}
          </div>

          {/* Clear Selection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            title="Clear selection (Esc)"
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress indicator for large selections */}
        {selectionCount > 10 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Selection progress</span>
              <span>{selectionCount}/50</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(selectionCount / 50) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for handling rubber band selection
export function useRubberBandSelection(
  containerRef: React.RefObject<HTMLElement>,
  items: Array<{ id: string; element: HTMLElement }>,
  onSelectionChange?: (selectedIds: string[]) => void
) {
  const { startDragSelection, updateDragSelection, endDragSelection, selectItem } = useBatchSelection();
  const [isSelecting, setIsSelecting] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0 || !containerRef.current) return; // Only left click
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    startPosRef.current = { x, y };
    setIsSelecting(true);
    startDragSelection(event.clientX, event.clientY);
  }, [containerRef, startDragSelection]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isSelecting || !startPosRef.current || !containerRef.current) return;

    updateDragSelection(event.clientX, event.clientY);

    // Calculate selection rectangle
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = event.clientX - containerRect.left;
    const currentY = event.clientY - containerRect.top;
    
    const selectionRect = {
      left: Math.min(startPosRef.current.x, currentX),
      top: Math.min(startPosRef.current.y, currentY),
      right: Math.max(startPosRef.current.x, currentX),
      bottom: Math.max(startPosRef.current.y, currentY)
    };

    // Check which items intersect with selection
    const selectedIds: string[] = [];
    items.forEach(item => {
      const elementRect = item.element.getBoundingClientRect();
      const relativeRect = {
        left: elementRect.left - containerRect.left,
        top: elementRect.top - containerRect.top,
        right: elementRect.right - containerRect.left,
        bottom: elementRect.bottom - containerRect.top
      };

      const intersects = !(
        relativeRect.left > selectionRect.right ||
        relativeRect.right < selectionRect.left ||
        relativeRect.top > selectionRect.bottom ||
        relativeRect.bottom < selectionRect.top
      );

      if (intersects) {
        selectedIds.push(item.id);
      }
    });

    onSelectionChange?.(selectedIds);
  }, [isSelecting, containerRef, items, updateDragSelection, onSelectionChange]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;
    
    setIsSelecting(false);
    startPosRef.current = null;
    endDragSelection();
  }, [isSelecting, endDragSelection]);

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  return {
    isSelecting,
    handleMouseDown
  };
}

export default BatchSelectionProvider;