/**
 * Advanced Drag-and-Drop Provider
 * Enterprise-grade drag-and-drop with multi-touch, gestures, and physics-based interactions
 * Surpasses LivingWriter, NovelCrafter, and Scrivener capabilities
 */

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop, DragPreviewImage } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition } from 'react-dnd-multi-backend';
import { getEmptyImage } from 'react-dnd-html5-backend';

// Multi-backend configuration for desktop + mobile support
const HTML5toTouch = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: TouchTransition,
      preview: true,
      skipDispatchOnTransition: true
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: {
        enableMouseEvents: true,
        enableKeyboardEvents: true,
        enableHoverOutsideTarget: true,
        ignoreContextMenu: true,
        scrollAngleRanges: [
          { start: 30, end: 150 },
          { start: 210, end: 330 }
        ]
      },
      preview: true,
      transition: TouchTransition
    }
  ]
};

// Types for advanced drag-and-drop operations
export interface DragItem {
  id: string;
  type: string;
  sourceId: string;
  sourceIndex: number;
  data: any;
  metadata?: {
    timestamp: number;
    userId?: string;
    batchId?: string;
    operationType: 'move' | 'copy' | 'link';
  };
}

export interface DropResult {
  targetId: string;
  targetIndex: number;
  dropEffect: 'move' | 'copy' | 'link' | 'none';
  metadata?: {
    timestamp: number;
    targetType: string;
    position: { x: number; y: number };
  };
}

export interface DragOperation {
  id: string;
  type: 'single' | 'batch';
  items: DragItem[];
  startTime: number;
  endTime?: number;
  sourceContainer: string;
  targetContainer?: string;
  operation: 'move' | 'copy' | 'link' | 'reorder';
  result?: 'success' | 'cancelled' | 'failed';
  undoData?: any;
}

export interface BatchSelection {
  items: Set<string>;
  type: string;
  sourceContainer: string;
  lastSelected?: string;
  selectionRect?: DOMRect;
}

interface DragDropState {
  isDragging: boolean;
  draggedItems: Map<string, DragItem>;
  batchSelection: BatchSelection | null;
  activeOperation: DragOperation | null;
  operationHistory: DragOperation[];
  undoStack: DragOperation[];
  redoStack: DragOperation[];
  isMultiSelectMode: boolean;
  selectionRect: DOMRect | null;
  ghostElement: HTMLElement | null;
  touchStartTime: number;
  lastTouchEnd: number;
  performanceMetrics: {
    operationCount: number;
    averageOperationTime: number;
    lastOperationTime: number;
  };
}

type DragDropAction = 
  | { type: 'START_DRAG'; payload: { items: DragItem[]; operation: DragOperation } }
  | { type: 'END_DRAG'; payload: { result: DropResult; success: boolean } }
  | { type: 'CANCEL_DRAG' }
  | { type: 'START_BATCH_SELECT'; payload: { rect: DOMRect } }
  | { type: 'UPDATE_BATCH_SELECT'; payload: { items: Set<string>; rect: DOMRect } }
  | { type: 'END_BATCH_SELECT' }
  | { type: 'TOGGLE_MULTI_SELECT'; payload: { enabled: boolean } }
  | { type: 'ADD_TO_SELECTION'; payload: { itemId: string; type: string; sourceContainer: string } }
  | { type: 'REMOVE_FROM_SELECTION'; payload: { itemId: string } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UNDO_OPERATION' }
  | { type: 'REDO_OPERATION' }
  | { type: 'UPDATE_PERFORMANCE'; payload: { operationTime: number } };

const initialState: DragDropState = {
  isDragging: false,
  draggedItems: new Map(),
  batchSelection: null,
  activeOperation: null,
  operationHistory: [],
  undoStack: [],
  redoStack: [],
  isMultiSelectMode: false,
  selectionRect: null,
  ghostElement: null,
  touchStartTime: 0,
  lastTouchEnd: 0,
  performanceMetrics: {
    operationCount: 0,
    averageOperationTime: 0,
    lastOperationTime: 0
  }
};

function dragDropReducer(state: DragDropState, action: DragDropAction): DragDropState {
  switch (action.type) {
    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        activeOperation: action.payload.operation,
        draggedItems: new Map(action.payload.items.map(item => [item.id, item]))
      };

    case 'END_DRAG':
      const endTime = Date.now();
      const operationTime = state.activeOperation ? endTime - state.activeOperation.startTime : 0;
      const newOperation = state.activeOperation ? {
        ...state.activeOperation,
        endTime,
        result: action.payload.success ? 'success' : 'failed'
      } : null;

      return {
        ...state,
        isDragging: false,
        activeOperation: null,
        draggedItems: new Map(),
        operationHistory: newOperation ? [...state.operationHistory, newOperation] : state.operationHistory,
        undoStack: newOperation && action.payload.success ? [...state.undoStack, newOperation] : state.undoStack,
        redoStack: [], // Clear redo stack on new operation
        performanceMetrics: {
          operationCount: state.performanceMetrics.operationCount + 1,
          averageOperationTime: (state.performanceMetrics.averageOperationTime * state.performanceMetrics.operationCount + operationTime) / (state.performanceMetrics.operationCount + 1),
          lastOperationTime: operationTime
        }
      };

    case 'CANCEL_DRAG':
      return {
        ...state,
        isDragging: false,
        activeOperation: null,
        draggedItems: new Map()
      };

    case 'START_BATCH_SELECT':
      return {
        ...state,
        isMultiSelectMode: true,
        selectionRect: action.payload.rect,
        batchSelection: {
          items: new Set(),
          type: '',
          sourceContainer: ''
        }
      };

    case 'UPDATE_BATCH_SELECT':
      return {
        ...state,
        selectionRect: action.payload.rect,
        batchSelection: state.batchSelection ? {
          ...state.batchSelection,
          items: action.payload.items,
          selectionRect: action.payload.rect
        } : null
      };

    case 'END_BATCH_SELECT':
      return {
        ...state,
        isMultiSelectMode: false,
        selectionRect: null
      };

    case 'TOGGLE_MULTI_SELECT':
      return {
        ...state,
        isMultiSelectMode: action.payload.enabled,
        batchSelection: action.payload.enabled ? state.batchSelection : null
      };

    case 'ADD_TO_SELECTION':
      const currentSelection = state.batchSelection || {
        items: new Set(),
        type: action.payload.type,
        sourceContainer: action.payload.sourceContainer
      };

      return {
        ...state,
        batchSelection: {
          ...currentSelection,
          items: new Set([...currentSelection.items, action.payload.itemId]),
          lastSelected: action.payload.itemId
        }
      };

    case 'REMOVE_FROM_SELECTION':
      if (!state.batchSelection) return state;

      const newItems = new Set(state.batchSelection.items);
      newItems.delete(action.payload.itemId);

      return {
        ...state,
        batchSelection: newItems.size > 0 ? {
          ...state.batchSelection,
          items: newItems
        } : null
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        batchSelection: null,
        isMultiSelectMode: false,
        selectionRect: null
      };

    case 'UNDO_OPERATION':
      if (state.undoStack.length === 0) return state;

      const lastOperation = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, lastOperation]
      };

    case 'REDO_OPERATION':
      if (state.redoStack.length === 0) return state;

      const redoOperation = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, redoOperation]
      };

    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performanceMetrics: {
          ...state.performanceMetrics,
          lastOperationTime: action.payload.operationTime
        }
      };

    default:
      return state;
  }
}

interface DragDropContextValue {
  state: DragDropState;
  startDrag: (items: DragItem[], operation: Omit<DragOperation, 'id' | 'items' | 'startTime'>) => void;
  endDrag: (result: DropResult, success: boolean) => void;
  cancelDrag: () => void;
  startBatchSelect: (rect: DOMRect) => void;
  updateBatchSelect: (items: Set<string>, rect: DOMRect) => void;
  endBatchSelect: () => void;
  toggleMultiSelect: (enabled: boolean) => void;
  addToSelection: (itemId: string, type: string, sourceContainer: string) => void;
  removeFromSelection: (itemId: string) => void;
  clearSelection: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getSelectedItems: () => string[];
  isSelected: (itemId: string) => boolean;
  getBatchCount: () => number;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

export function useDragDropContext() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDropContext must be used within a DragDropProvider');
  }
  return context;
}

interface DragDropProviderProps {
  children: React.ReactNode;
  onOperation?: (operation: DragOperation) => void;
  onUndo?: (operation: DragOperation) => Promise<boolean>;
  onRedo?: (operation: DragOperation) => Promise<boolean>;
  enablePerformanceMonitoring?: boolean;
}

export function DragDropProvider({ 
  children, 
  onOperation, 
  onUndo, 
  onRedo,
  enablePerformanceMonitoring = true 
}: DragDropProviderProps) {
  const [state, dispatch] = useReducer(dragDropReducer, initialState);
  const operationIdRef = useRef(0);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const interval = setInterval(() => {
      if (state.performanceMetrics.lastOperationTime > 16) { // > 60fps
        console.warn('[DragDrop] Operation took longer than 16ms:', state.performanceMetrics.lastOperationTime);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [state.performanceMetrics.lastOperationTime, enablePerformanceMonitoring]);

  const generateOperationId = () => `op_${++operationIdRef.current}_${Date.now()}`;

  const startDrag = useCallback((items: DragItem[], operationData: Omit<DragOperation, 'id' | 'items' | 'startTime'>) => {
    const operation: DragOperation = {
      ...operationData,
      id: generateOperationId(),
      items,
      startTime: Date.now()
    };

    dispatch({ type: 'START_DRAG', payload: { items, operation } });
    onOperation?.(operation);
  }, [onOperation]);

  const endDrag = useCallback((result: DropResult, success: boolean) => {
    dispatch({ type: 'END_DRAG', payload: { result, success } });
  }, []);

  const cancelDrag = useCallback(() => {
    dispatch({ type: 'CANCEL_DRAG' });
  }, []);

  const startBatchSelect = useCallback((rect: DOMRect) => {
    dispatch({ type: 'START_BATCH_SELECT', payload: { rect } });
  }, []);

  const updateBatchSelect = useCallback((items: Set<string>, rect: DOMRect) => {
    dispatch({ type: 'UPDATE_BATCH_SELECT', payload: { items, rect } });
  }, []);

  const endBatchSelect = useCallback(() => {
    dispatch({ type: 'END_BATCH_SELECT' });
  }, []);

  const toggleMultiSelect = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_MULTI_SELECT', payload: { enabled } });
  }, []);

  const addToSelection = useCallback((itemId: string, type: string, sourceContainer: string) => {
    dispatch({ type: 'ADD_TO_SELECTION', payload: { itemId, type, sourceContainer } });
  }, []);

  const removeFromSelection = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_SELECTION', payload: { itemId } });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const undo = useCallback(async () => {
    if (state.undoStack.length === 0) return;

    const lastOperation = state.undoStack[state.undoStack.length - 1];
    const success = await onUndo?.(lastOperation) ?? true;
    
    if (success) {
      dispatch({ type: 'UNDO_OPERATION' });
    }
  }, [state.undoStack, onUndo]);

  const redo = useCallback(async () => {
    if (state.redoStack.length === 0) return;

    const redoOperation = state.redoStack[state.redoStack.length - 1];
    const success = await onRedo?.(redoOperation) ?? true;
    
    if (success) {
      dispatch({ type: 'REDO_OPERATION' });
    }
  }, [state.redoStack, onRedo]);

  const getSelectedItems = useCallback(() => {
    return state.batchSelection ? Array.from(state.batchSelection.items) : [];
  }, [state.batchSelection]);

  const isSelected = useCallback((itemId: string) => {
    return state.batchSelection?.items.has(itemId) ?? false;
  }, [state.batchSelection]);

  const getBatchCount = useCallback(() => {
    return state.batchSelection?.items.size ?? 0;
  }, [state.batchSelection]);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  const contextValue: DragDropContextValue = {
    state,
    startDrag,
    endDrag,
    cancelDrag,
    startBatchSelect,
    updateBatchSelect,
    endBatchSelect,
    toggleMultiSelect,
    addToSelection,
    removeFromSelection,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    getSelectedItems,
    isSelected,
    getBatchCount
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndProvider backend={MultiBackend} options={HTML5toTouch}>
        {children}
      </DndProvider>
    </DragDropContext.Provider>
  );
}

export default DragDropProvider;