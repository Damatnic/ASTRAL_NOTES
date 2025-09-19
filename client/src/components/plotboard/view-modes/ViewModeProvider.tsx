/**
 * Advanced View Mode System
 * Multiple visualization modes: Timeline, Kanban, Grid, Mind Map
 * Surpasses LivingWriter, NovelCrafter, and Scrivener with superior visual organization
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  LayoutGrid, 
  Calendar, 
  Columns, 
  GitBranch, 
  List, 
  Map,
  Zap,
  Target,
  Clock,
  TrendingUp,
  BarChart3,
  Layers,
  Filter,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Scene, Character, Location, PlotThread } from '@/types/story';

export type ViewMode = 'timeline' | 'kanban' | 'grid' | 'mindmap' | 'list' | 'hybrid';

export interface ViewModeConfig {
  id: ViewMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  bestFor: string;
  layoutType: 'linear' | 'grid' | 'hierarchical' | 'network';
  supportsZoom: boolean;
  supportsPanning: boolean;
  supportsGrouping: boolean;
  supportsFiltering: boolean;
}

export interface ViewState {
  currentMode: ViewMode;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  showConnections: boolean;
  showMetadata: boolean;
  groupBy: 'none' | 'act' | 'chapter' | 'character' | 'plotthread' | 'status';
  sortBy: 'order' | 'created' | 'updated' | 'wordcount' | 'importance';
  filterCriteria: {
    status?: string[];
    characters?: string[];
    plotThreads?: string[];
    tags?: string[];
    wordCountRange?: [number, number];
  };
  layoutSettings: {
    cardSize: 'compact' | 'normal' | 'detailed';
    spacing: 'tight' | 'normal' | 'loose';
    showThumbnails: boolean;
    showProgressBars: boolean;
    orientation: 'horizontal' | 'vertical';
  };
  customizations: {
    colorScheme: 'default' | 'status' | 'character' | 'plotthread' | 'priority';
    showGridLines: boolean;
    snapToGrid: boolean;
    animationsEnabled: boolean;
  };
}

export const VIEW_MODE_CONFIGS: Record<ViewMode, ViewModeConfig> = {
  timeline: {
    id: 'timeline',
    name: 'Timeline View',
    description: 'Chronological visualization of scenes with temporal relationships',
    icon: <Calendar className="h-4 w-4" />,
    features: ['Chronological order', 'Time-based spacing', 'Dependency chains', 'Milestone markers'],
    bestFor: 'Understanding story progression and pacing',
    layoutType: 'linear',
    supportsZoom: true,
    supportsPanning: true,
    supportsGrouping: true,
    supportsFiltering: true
  },
  kanban: {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'Status-based columns for workflow management',
    icon: <Columns className="h-4 w-4" />,
    features: ['Status columns', 'Drag-and-drop workflow', 'WIP limits', 'Progress tracking'],
    bestFor: 'Managing scene development workflow',
    layoutType: 'grid',
    supportsZoom: false,
    supportsPanning: false,
    supportsGrouping: true,
    supportsFiltering: true
  },
  grid: {
    id: 'grid',
    name: 'Grid Layout',
    description: 'Flexible grid arrangement with custom grouping',
    icon: <LayoutGrid className="h-4 w-4" />,
    features: ['Flexible positioning', 'Custom grouping', 'Visual clustering', 'Spatial relationships'],
    bestFor: 'Free-form organization and visual exploration',
    layoutType: 'grid',
    supportsZoom: true,
    supportsPanning: true,
    supportsGrouping: true,
    supportsFiltering: true
  },
  mindmap: {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Hierarchical tree structure showing story relationships',
    icon: <GitBranch className="h-4 w-4" />,
    features: ['Hierarchical layout', 'Story branches', 'Relationship lines', 'Nested structures'],
    bestFor: 'Exploring story structure and plot connections',
    layoutType: 'hierarchical',
    supportsZoom: true,
    supportsPanning: true,
    supportsGrouping: false,
    supportsFiltering: true
  },
  list: {
    id: 'list',
    name: 'List View',
    description: 'Compact linear list with detailed information',
    icon: <List className="h-4 w-4" />,
    features: ['Compact display', 'Sortable columns', 'Quick scanning', 'Bulk operations'],
    bestFor: 'Detailed review and bulk editing',
    layoutType: 'linear',
    supportsZoom: false,
    supportsPanning: false,
    supportsGrouping: true,
    supportsFiltering: true
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid View',
    description: 'Combines multiple view modes in split screen',
    icon: <Layers className="h-4 w-4" />,
    features: ['Multi-pane layout', 'Synchronized views', 'Context switching', 'Cross-view interactions'],
    bestFor: 'Complex projects requiring multiple perspectives',
    layoutType: 'network',
    supportsZoom: true,
    supportsPanning: true,
    supportsGrouping: true,
    supportsFiltering: true
  }
};

const initialViewState: ViewState = {
  currentMode: 'grid',
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  showConnections: true,
  showMetadata: true,
  groupBy: 'none',
  sortBy: 'order',
  filterCriteria: {},
  layoutSettings: {
    cardSize: 'normal',
    spacing: 'normal',
    showThumbnails: true,
    showProgressBars: true,
    orientation: 'horizontal'
  },
  customizations: {
    colorScheme: 'default',
    showGridLines: false,
    snapToGrid: true,
    animationsEnabled: true
  }
};

interface ViewModeContextValue {
  viewState: ViewState;
  availableModes: ViewModeConfig[];
  currentConfig: ViewModeConfig;
  setViewMode: (mode: ViewMode) => void;
  updateViewState: (updates: Partial<ViewState>) => void;
  setZoom: (level: number) => void;
  setPan: (offset: { x: number; y: number }) => void;
  toggleConnections: () => void;
  toggleMetadata: () => void;
  setGrouping: (groupBy: ViewState['groupBy']) => void;
  setSorting: (sortBy: ViewState['sortBy']) => void;
  setFilter: (criteria: Partial<ViewState['filterCriteria']>) => void;
  resetView: () => void;
  exportViewConfig: () => string;
  importViewConfig: (config: string) => boolean;
  getViewModeCapabilities: () => ViewModeConfig['features'];
  isViewModeSupported: (feature: string) => boolean;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

interface ViewModeProviderProps {
  children: React.ReactNode;
  initialMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode, config: ViewModeConfig) => void;
  onViewStateChange?: (state: ViewState) => void;
}

export function ViewModeProvider({
  children,
  initialMode = 'grid',
  onViewModeChange,
  onViewStateChange
}: ViewModeProviderProps) {
  const [viewState, setViewState] = useState<ViewState>({
    ...initialViewState,
    currentMode: initialMode
  });

  const availableModes = useMemo(() => Object.values(VIEW_MODE_CONFIGS), []);
  const currentConfig = useMemo(() => VIEW_MODE_CONFIGS[viewState.currentMode], [viewState.currentMode]);

  const setViewMode = useCallback((mode: ViewMode) => {
    const newState = {
      ...viewState,
      currentMode: mode,
      // Reset view-specific settings when switching modes
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 }
    };
    
    setViewState(newState);
    onViewModeChange?.(mode, VIEW_MODE_CONFIGS[mode]);
    onViewStateChange?.(newState);
  }, [viewState, onViewModeChange, onViewStateChange]);

  const updateViewState = useCallback((updates: Partial<ViewState>) => {
    const newState = { ...viewState, ...updates };
    setViewState(newState);
    onViewStateChange?.(newState);
  }, [viewState, onViewStateChange]);

  const setZoom = useCallback((level: number) => {
    const clampedLevel = Math.max(0.25, Math.min(4, level));
    updateViewState({ zoomLevel: clampedLevel });
  }, [updateViewState]);

  const setPan = useCallback((offset: { x: number; y: number }) => {
    updateViewState({ panOffset: offset });
  }, [updateViewState]);

  const toggleConnections = useCallback(() => {
    updateViewState({ showConnections: !viewState.showConnections });
  }, [viewState.showConnections, updateViewState]);

  const toggleMetadata = useCallback(() => {
    updateViewState({ showMetadata: !viewState.showMetadata });
  }, [viewState.showMetadata, updateViewState]);

  const setGrouping = useCallback((groupBy: ViewState['groupBy']) => {
    updateViewState({ groupBy });
  }, [updateViewState]);

  const setSorting = useCallback((sortBy: ViewState['sortBy']) => {
    updateViewState({ sortBy });
  }, [updateViewState]);

  const setFilter = useCallback((criteria: Partial<ViewState['filterCriteria']>) => {
    updateViewState({ 
      filterCriteria: { ...viewState.filterCriteria, ...criteria }
    });
  }, [viewState.filterCriteria, updateViewState]);

  const resetView = useCallback(() => {
    const resetState = {
      ...initialViewState,
      currentMode: viewState.currentMode
    };
    setViewState(resetState);
    onViewStateChange?.(resetState);
  }, [viewState.currentMode, onViewStateChange]);

  const exportViewConfig = useCallback(() => {
    return JSON.stringify(viewState, null, 2);
  }, [viewState]);

  const importViewConfig = useCallback((config: string): boolean => {
    try {
      const parsedConfig = JSON.parse(config) as ViewState;
      
      // Validate the config has required properties
      if (parsedConfig.currentMode && VIEW_MODE_CONFIGS[parsedConfig.currentMode]) {
        setViewState(parsedConfig);
        onViewStateChange?.(parsedConfig);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [onViewStateChange]);

  const getViewModeCapabilities = useCallback(() => {
    return currentConfig.features;
  }, [currentConfig]);

  const isViewModeSupported = useCallback((feature: string) => {
    return currentConfig.features.includes(feature);
  }, [currentConfig]);

  const contextValue: ViewModeContextValue = {
    viewState,
    availableModes,
    currentConfig,
    setViewMode,
    updateViewState,
    setZoom,
    setPan,
    toggleConnections,
    toggleMetadata,
    setGrouping,
    setSorting,
    setFilter,
    resetView,
    exportViewConfig,
    importViewConfig,
    getViewModeCapabilities,
    isViewModeSupported
  };

  return (
    <ViewModeContext.Provider value={contextValue}>
      {children}
    </ViewModeContext.Provider>
  );
}

// View Mode Selector Component
interface ViewModeSelectorProps {
  className?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function ViewModeSelector({ 
  className, 
  showLabels = true, 
  orientation = 'horizontal',
  size = 'md' 
}: ViewModeSelectorProps) {
  const { viewState, availableModes, setViewMode } = useViewMode();

  const buttonSizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <div className={cn(
      "view-mode-selector flex gap-1 border rounded-lg p-1 bg-muted/50",
      orientation === 'vertical' ? 'flex-col' : 'flex-row',
      className
    )}>
      {availableModes.map((mode) => (
        <Button
          key={mode.id}
          variant={viewState.currentMode === mode.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode(mode.id)}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            buttonSizes[size],
            viewState.currentMode === mode.id && "shadow-sm",
            !showLabels && "px-2"
          )}
          title={`${mode.name} - ${mode.description}`}
        >
          {mode.icon}
          {showLabels && (
            <span className={orientation === 'vertical' ? 'truncate' : ''}>
              {mode.name}
            </span>
          )}
          {viewState.currentMode === mode.id && showLabels && (
            <Badge variant="secondary" className="text-xs ml-1">
              Active
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}

// View Mode Controls Component
interface ViewModeControlsProps {
  className?: string;
  showAdvanced?: boolean;
}

export function ViewModeControls({ className, showAdvanced = false }: ViewModeControlsProps) {
  const { 
    viewState, 
    currentConfig, 
    setZoom, 
    setPan, 
    toggleConnections, 
    toggleMetadata,
    setGrouping,
    setSorting,
    resetView
  } = useViewMode();

  const handleZoomIn = useCallback(() => {
    setZoom(viewState.zoomLevel * 1.2);
  }, [viewState.zoomLevel, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(viewState.zoomLevel / 1.2);
  }, [viewState.zoomLevel, setZoom]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  return (
    <div className={cn("view-mode-controls flex items-center gap-2", className)}>
      {/* Zoom Controls */}
      {currentConfig.supportsZoom && (
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={viewState.zoomLevel <= 0.25}
            className="px-2"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetZoom}
            className="px-3 text-xs font-mono min-w-16"
          >
            {Math.round(viewState.zoomLevel * 100)}%
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={viewState.zoomLevel >= 4}
            className="px-2"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Toggle Controls */}
      <div className="flex items-center gap-1">
        {currentConfig.supportsGrouping && (
          <Button
            size="sm"
            variant={viewState.showConnections ? 'default' : 'ghost'}
            onClick={toggleConnections}
            title="Toggle Connections"
          >
            <GitBranch className="h-4 w-4" />
          </Button>
        )}

        <Button
          size="sm"
          variant={viewState.showMetadata ? 'default' : 'ghost'}
          onClick={toggleMetadata}
          title="Toggle Metadata"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <>
          {/* Grouping */}
          {currentConfig.supportsGrouping && (
            <select
              value={viewState.groupBy}
              onChange={(e) => setGrouping(e.target.value as ViewState['groupBy'])}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="none">No Grouping</option>
              <option value="act">By Act</option>
              <option value="chapter">By Chapter</option>
              <option value="character">By Character</option>
              <option value="plotthread">By Plot Thread</option>
              <option value="status">By Status</option>
            </select>
          )}

          {/* Sorting */}
          <select
            value={viewState.sortBy}
            onChange={(e) => setSorting(e.target.value as ViewState['sortBy'])}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="order">Scene Order</option>
            <option value="created">Created Date</option>
            <option value="updated">Updated Date</option>
            <option value="wordcount">Word Count</option>
            <option value="importance">Importance</option>
          </select>
        </>
      )}

      {/* Reset Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={resetView}
        title="Reset View"
      >
        <Target className="h-4 w-4" />
      </Button>
    </div>
  );
}

// View Mode Info Panel
export function ViewModeInfo() {
  const { currentConfig, viewState } = useViewMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="view-mode-info bg-muted/50 rounded-lg p-4 border"
    >
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground mt-1">
          {currentConfig.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{currentConfig.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {currentConfig.description}
          </p>
          
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Best for: </span>
              <span className="text-xs">{currentConfig.bestFor}</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {currentConfig.features.map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ViewModeProvider;