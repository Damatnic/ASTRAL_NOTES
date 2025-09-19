/**
 * Advanced Undo/Redo System for Drag & Drop Operations
 * Real-time collaborative undo/redo with conflict resolution
 */

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Undo, 
  Redo, 
  History, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import type { Scene } from '@/types/story';

// Operation types that can be undone/redone
export interface UndoableOperation {
  id: string;
  type: 'move' | 'copy' | 'delete' | 'create' | 'edit' | 'reorder' | 'batch';
  timestamp: number;
  userId?: string;
  userName?: string;
  
  // Operation details
  description: string;
  affectedItems: string[]; // IDs of affected scenes/items
  
  // Undo data - information needed to reverse the operation
  undoData: {
    type: string;
    payload: any;
    previousState?: any;
    affectedContainers: string[]; // Lane IDs affected
  };
  
  // Redo data - information needed to replay the operation
  redoData: {
    type: string;
    payload: any;
    newState?: any;
  };
  
  // Collaboration metadata
  collaborationData?: {
    sessionId: string;
    conflictResolution?: 'auto' | 'manual' | 'merge';
    dependencies: string[]; // Operation IDs this depends on
    conflicts: string[]; // Operation IDs this conflicts with
  };
  
  // Status tracking
  status: 'pending' | 'applied' | 'undone' | 'redone' | 'failed' | 'conflicted';
  retryCount: number;
  error?: string;
}

export interface UndoRedoState {
  operations: UndoableOperation[];
  undoStack: string[]; // Operation IDs
  redoStack: string[]; // Operation IDs
  currentPosition: number;
  maxHistorySize: number;
  
  // Collaboration state
  remoteOperations: Map<string, UndoableOperation>;
  pendingOperations: string[];
  conflictedOperations: string[];
  
  // UI state
  isUndoing: boolean;
  isRedoing: boolean;
  showHistory: boolean;
  lastOperation?: UndoableOperation;
  
  // Performance metrics
  operationTimes: number[];
  averageOperationTime: number;
}

type UndoRedoAction =
  | { type: 'ADD_OPERATION'; payload: UndoableOperation }
  | { type: 'UNDO_OPERATION' }
  | { type: 'REDO_OPERATION' }
  | { type: 'SET_OPERATION_STATUS'; payload: { id: string; status: UndoableOperation['status']; error?: string } }
  | { type: 'ADD_REMOTE_OPERATION'; payload: UndoableOperation }
  | { type: 'RESOLVE_CONFLICT'; payload: { operationId: string; resolution: 'accept' | 'reject' | 'merge' } }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_HISTORY_SIZE'; payload: number }
  | { type: 'TOGGLE_HISTORY_VIEW' }
  | { type: 'UPDATE_PERFORMANCE'; payload: { operationTime: number } };

const initialState: UndoRedoState = {
  operations: [],
  undoStack: [],
  redoStack: [],
  currentPosition: -1,
  maxHistorySize: 100,
  remoteOperations: new Map(),
  pendingOperations: [],
  conflictedOperations: [],
  isUndoing: false,
  isRedoing: false,
  showHistory: false,
  operationTimes: [],
  averageOperationTime: 0
};

function undoRedoReducer(state: UndoRedoState, action: UndoRedoAction): UndoRedoState {
  switch (action.type) {
    case 'ADD_OPERATION':
      const newOperation = action.payload;
      const newOperations = [...state.operations, newOperation];
      const newUndoStack = [...state.undoStack, newOperation.id];
      
      // Truncate history if needed
      if (newOperations.length > state.maxHistorySize) {
        const removedCount = newOperations.length - state.maxHistorySize;
        newOperations.splice(0, removedCount);
        newUndoStack.splice(0, removedCount);
      }
      
      return {
        ...state,
        operations: newOperations,
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new operation
        currentPosition: newUndoStack.length - 1,
        lastOperation: newOperation
      };

    case 'UNDO_OPERATION':
      if (state.undoStack.length === 0 || state.isUndoing) return state;
      
      const undoOperationId = state.undoStack[state.undoStack.length - 1];
      const undoOperation = state.operations.find(op => op.id === undoOperationId);
      
      if (!undoOperation) return state;
      
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, undoOperationId],
        currentPosition: state.currentPosition - 1,
        isUndoing: true,
        operations: state.operations.map(op =>
          op.id === undoOperationId ? { ...op, status: 'undone' } : op
        )
      };

    case 'REDO_OPERATION':
      if (state.redoStack.length === 0 || state.isRedoing) return state;
      
      const redoOperationId = state.redoStack[state.redoStack.length - 1];
      const redoOperation = state.operations.find(op => op.id === redoOperationId);
      
      if (!redoOperation) return state;
      
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, redoOperationId],
        currentPosition: state.currentPosition + 1,
        isRedoing: true,
        operations: state.operations.map(op =>
          op.id === redoOperationId ? { ...op, status: 'redone' } : op
        )
      };

    case 'SET_OPERATION_STATUS':
      return {
        ...state,
        isUndoing: action.payload.status !== 'undone' ? false : state.isUndoing,
        isRedoing: action.payload.status !== 'redone' ? false : state.isRedoing,
        operations: state.operations.map(op =>
          op.id === action.payload.id 
            ? { ...op, status: action.payload.status, error: action.payload.error }
            : op
        )
      };

    case 'ADD_REMOTE_OPERATION':
      const remoteOp = action.payload;
      const newRemoteOps = new Map(state.remoteOperations);
      newRemoteOps.set(remoteOp.id, remoteOp);
      
      // Check for conflicts
      const hasConflict = state.operations.some(localOp => 
        localOp.affectedItems.some(item => remoteOp.affectedItems.includes(item)) &&
        Math.abs(localOp.timestamp - remoteOp.timestamp) < 1000 // Within 1 second
      );
      
      return {
        ...state,
        remoteOperations: newRemoteOps,
        conflictedOperations: hasConflict 
          ? [...state.conflictedOperations, remoteOp.id]
          : state.conflictedOperations
      };

    case 'RESOLVE_CONFLICT':
      const { operationId, resolution } = action.payload;
      
      return {
        ...state,
        conflictedOperations: state.conflictedOperations.filter(id => id !== operationId),
        operations: resolution === 'accept' 
          ? [...state.operations, state.remoteOperations.get(operationId)!]
          : state.operations
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        operations: [],
        undoStack: [],
        redoStack: [],
        currentPosition: -1,
        lastOperation: undefined
      };

    case 'SET_HISTORY_SIZE':
      return {
        ...state,
        maxHistorySize: action.payload
      };

    case 'TOGGLE_HISTORY_VIEW':
      return {
        ...state,
        showHistory: !state.showHistory
      };

    case 'UPDATE_PERFORMANCE':
      const newTimes = [...state.operationTimes, action.payload.operationTime].slice(-50); // Keep last 50
      const avgTime = newTimes.reduce((sum, time) => sum + time, 0) / newTimes.length;
      
      return {
        ...state,
        operationTimes: newTimes,
        averageOperationTime: avgTime
      };

    default:
      return state;
  }
}

interface UndoRedoContextValue {
  state: UndoRedoState;
  addOperation: (operation: Omit<UndoableOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>) => string;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  getOperationHistory: () => UndoableOperation[];
  clearHistory: () => void;
  setHistorySize: (size: number) => void;
  toggleHistoryView: () => void;
  resolveConflict: (operationId: string, resolution: 'accept' | 'reject' | 'merge') => void;
  getConflictedOperations: () => UndoableOperation[];
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
}

interface UndoRedoProviderProps {
  children: React.ReactNode;
  onUndo?: (operation: UndoableOperation) => Promise<boolean>;
  onRedo?: (operation: UndoableOperation) => Promise<boolean>;
  onOperationAdded?: (operation: UndoableOperation) => void;
  onConflictDetected?: (operation: UndoableOperation) => void;
  maxHistorySize?: number;
  enablePerformanceTracking?: boolean;
}

export function UndoRedoProvider({
  children,
  onUndo,
  onRedo,
  onOperationAdded,
  onConflictDetected,
  maxHistorySize = 100,
  enablePerformanceTracking = true
}: UndoRedoProviderProps) {
  const [state, dispatch] = useReducer(undoRedoReducer, {
    ...initialState,
    maxHistorySize
  });
  
  const operationIdRef = useRef(0);

  const generateOperationId = useCallback(() => {
    return `op_${++operationIdRef.current}_${Date.now()}`;
  }, []);

  const addOperation = useCallback((
    operationData: Omit<UndoableOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>
  ): string => {
    const operation: UndoableOperation = {
      ...operationData,
      id: generateOperationId(),
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    dispatch({ type: 'ADD_OPERATION', payload: operation });
    onOperationAdded?.(operation);

    return operation.id;
  }, [generateOperationId, onOperationAdded]);

  const undo = useCallback(async (): Promise<boolean> => {
    if (state.undoStack.length === 0 || state.isUndoing) return false;

    const operationId = state.undoStack[state.undoStack.length - 1];
    const operation = state.operations.find(op => op.id === operationId);

    if (!operation) return false;

    const startTime = performance.now();

    try {
      dispatch({ type: 'UNDO_OPERATION' });

      const success = await onUndo?.(operation) ?? true;

      if (success) {
        dispatch({ 
          type: 'SET_OPERATION_STATUS', 
          payload: { id: operationId, status: 'undone' }
        });
      } else {
        dispatch({ 
          type: 'SET_OPERATION_STATUS', 
          payload: { id: operationId, status: 'failed', error: 'Undo operation failed' }
        });
      }

      if (enablePerformanceTracking) {
        const operationTime = performance.now() - startTime;
        dispatch({ type: 'UPDATE_PERFORMANCE', payload: { operationTime } });
      }

      return success;
    } catch (error) {
      dispatch({ 
        type: 'SET_OPERATION_STATUS', 
        payload: { 
          id: operationId, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }, [state.undoStack, state.isUndoing, state.operations, onUndo, enablePerformanceTracking]);

  const redo = useCallback(async (): Promise<boolean> => {
    if (state.redoStack.length === 0 || state.isRedoing) return false;

    const operationId = state.redoStack[state.redoStack.length - 1];
    const operation = state.operations.find(op => op.id === operationId);

    if (!operation) return false;

    const startTime = performance.now();

    try {
      dispatch({ type: 'REDO_OPERATION' });

      const success = await onRedo?.(operation) ?? true;

      if (success) {
        dispatch({ 
          type: 'SET_OPERATION_STATUS', 
          payload: { id: operationId, status: 'redone' }
        });
      } else {
        dispatch({ 
          type: 'SET_OPERATION_STATUS', 
          payload: { id: operationId, status: 'failed', error: 'Redo operation failed' }
        });
      }

      if (enablePerformanceTracking) {
        const operationTime = performance.now() - startTime;
        dispatch({ type: 'UPDATE_PERFORMANCE', payload: { operationTime } });
      }

      return success;
    } catch (error) {
      dispatch({ 
        type: 'SET_OPERATION_STATUS', 
        payload: { 
          id: operationId, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }, [state.redoStack, state.isRedoing, state.operations, onRedo, enablePerformanceTracking]);

  const getOperationHistory = useCallback(() => {
    return [...state.operations].reverse(); // Most recent first
  }, [state.operations]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const setHistorySize = useCallback((size: number) => {
    dispatch({ type: 'SET_HISTORY_SIZE', payload: size });
  }, []);

  const toggleHistoryView = useCallback(() => {
    dispatch({ type: 'TOGGLE_HISTORY_VIEW' });
  }, []);

  const resolveConflict = useCallback((operationId: string, resolution: 'accept' | 'reject' | 'merge') => {
    dispatch({ type: 'RESOLVE_CONFLICT', payload: { operationId, resolution } });
  }, []);

  const getConflictedOperations = useCallback(() => {
    return state.conflictedOperations
      .map(id => state.remoteOperations.get(id))
      .filter(Boolean) as UndoableOperation[];
  }, [state.conflictedOperations, state.remoteOperations]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const canUndo = state.undoStack.length > 0 && !state.isUndoing;
  const canRedo = state.redoStack.length > 0 && !state.isRedoing;

  const contextValue: UndoRedoContextValue = {
    state,
    addOperation,
    undo,
    redo,
    canUndo,
    canRedo,
    getOperationHistory,
    clearHistory,
    setHistorySize,
    toggleHistoryView,
    resolveConflict,
    getConflictedOperations
  };

  return (
    <UndoRedoContext.Provider value={contextValue}>
      {children}
    </UndoRedoContext.Provider>
  );
}

// Undo/Redo Control Component
interface UndoRedoControlsProps {
  className?: string;
  showHistory?: boolean;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UndoRedoControls({ 
  className, 
  showHistory = false, 
  showLabels = false,
  size = 'md' 
}: UndoRedoControlsProps) {
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    toggleHistoryView, 
    state,
    getConflictedOperations 
  } = useUndoRedo();

  const conflictedOps = getConflictedOperations();
  const hasConflicts = conflictedOps.length > 0;

  const buttonSize = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  }[size] as 'sm' | 'md' | 'lg';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Undo Button */}
      <Button
        size={buttonSize}
        variant="outline"
        onClick={undo}
        disabled={!canUndo || state.isUndoing}
        className="relative"
        title={`Undo${canUndo ? ` (${state.undoStack.length} operations)` : ''}`}
      >
        {state.isUndoing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Undo className="h-4 w-4" />
        )}
        {showLabels && <span className="ml-2">Undo</span>}
        {canUndo && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {state.undoStack.length}
          </Badge>
        )}
      </Button>

      {/* Redo Button */}
      <Button
        size={buttonSize}
        variant="outline"
        onClick={redo}
        disabled={!canRedo || state.isRedoing}
        className="relative"
        title={`Redo${canRedo ? ` (${state.redoStack.length} operations)` : ''}`}
      >
        {state.isRedoing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Redo className="h-4 w-4" />
        )}
        {showLabels && <span className="ml-2">Redo</span>}
        {canRedo && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {state.redoStack.length}
          </Badge>
        )}
      </Button>

      {/* History Button */}
      {showHistory && (
        <Button
          size={buttonSize}
          variant="ghost"
          onClick={toggleHistoryView}
          title="Operation History"
        >
          <History className="h-4 w-4" />
          {showLabels && <span className="ml-2">History</span>}
        </Button>
      )}

      {/* Conflict Indicator */}
      {hasConflicts && (
        <Button
          size={buttonSize}
          variant="destructive"
          className="relative"
          title={`${conflictedOps.length} conflicted operations`}
        >
          <AlertCircle className="h-4 w-4" />
          <Badge variant="destructive" className="ml-2 text-xs">
            {conflictedOps.length}
          </Badge>
        </Button>
      )}

      {/* Performance Indicator */}
      {process.env.NODE_ENV === 'development' && state.averageOperationTime > 0 && (
        <div className="text-xs text-muted-foreground">
          {state.averageOperationTime.toFixed(1)}ms avg
        </div>
      )}
    </div>
  );
}

// Operation History Panel
export function OperationHistoryPanel() {
  const { state, getOperationHistory, resolveConflict, getConflictedOperations } = useUndoRedo();
  const history = getOperationHistory();
  const conflicts = getConflictedOperations();

  if (!state.showHistory) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 right-4 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-50 overflow-hidden"
    >
      <div className="p-4 border-b">
        <h3 className="font-semibold">Operation History</h3>
        <p className="text-sm text-muted-foreground">
          {history.length} operations • {conflicts.length} conflicts
        </p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {conflicts.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Conflicts to Resolve
            </h4>
            {conflicts.map(op => (
              <div key={op.id} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{op.description}</p>
                  <p className="text-xs text-muted-foreground">
                    by {op.userName} • {new Date(op.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveConflict(op.id, 'accept')}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveConflict(op.id, 'reject')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          {history.map((operation, index) => (
            <motion.div
              key={operation.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-3 border-b last:border-b-0 flex items-center gap-3",
                {
                  'bg-green-50 dark:bg-green-900/20': operation.status === 'applied',
                  'bg-yellow-50 dark:bg-yellow-900/20': operation.status === 'undone',
                  'bg-blue-50 dark:bg-blue-900/20': operation.status === 'redone',
                  'bg-red-50 dark:bg-red-900/20': operation.status === 'failed'
                }
              )}
            >
              <div className="flex-shrink-0">
                {operation.status === 'applied' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {operation.status === 'undone' && <Undo className="h-4 w-4 text-yellow-600" />}
                {operation.status === 'redone' && <Redo className="h-4 w-4 text-blue-600" />}
                {operation.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                {operation.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{operation.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(operation.timestamp).toLocaleTimeString()}</span>
                  {operation.userName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {operation.userName}
                      </span>
                    </>
                  )}
                  {operation.affectedItems.length > 1 && (
                    <>
                      <span>•</span>
                      <span>{operation.affectedItems.length} items</span>
                    </>
                  )}
                </div>
              </div>

              <Badge
                variant={
                  operation.status === 'applied' ? 'default' :
                  operation.status === 'failed' ? 'destructive' :
                  'secondary'
                }
                className="text-xs"
              >
                {operation.status}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default UndoRedoProvider;