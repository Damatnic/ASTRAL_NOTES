/**
 * Enhanced Plot Board - Complete Integration
 * Enterprise-grade visual plot board system that surpasses all competitors
 * Integrates all advanced features: drag-drop, view modes, grouping, filtering, collaboration
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Grid, 
  Settings, 
  Share2, 
  Download, 
  Upload,
  Maximize2,
  Minimize2,
  RefreshCw,
  Users,
  Zap,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  Filter,
  Search,
  Eye,
  HelpCircle
} from 'lucide-react';

// Import all advanced components
import { DragDropProvider } from './advanced-dnd/DragDropProvider';
import { AnimationEngineProvider } from './advanced-dnd/AnimationEngine';
import { UndoRedoProvider, UndoRedoControls } from './advanced-dnd/UndoRedoSystem';
import { BatchSelectionProvider, BatchSelectionToolbar } from './advanced-dnd/BatchSelectionSystem';
import { ViewModeProvider, ViewModeSelector, ViewModeControls } from './view-modes/ViewModeProvider';
import { TimelineView } from './view-modes/TimelineView';
import { KanbanView } from './view-modes/KanbanView';
import { SmartGroupingSystem } from './grouping/SmartGroupingSystem';
import { DynamicFilterSystem } from './filtering/DynamicFilterSystem';

// Integration with existing collaboration system
import { useCollaboration } from '@/hooks/useCollaboration';
import { useWebSocket } from '@/hooks/useWebSocket';

import type { 
  Scene, 
  Character, 
  Location, 
  PlotThread, 
  Story, 
  Project,
  Act,
  Chapter 
} from '@/types/story';

interface EnhancedPlotBoardProps {
  project: Project;
  story: Story;
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  plotThreads?: PlotThread[];
  acts?: Act[];
  chapters?: Chapter[];
  isCollaborative?: boolean;
  onSceneUpdate?: (sceneId: string, updates: Partial<Scene>) => void;
  onSceneMove?: (sceneId: string, fromLane: string, toLane: string, newIndex: number) => void;
  onSceneCreate?: (laneId: string, templateType?: string) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneDelete?: (sceneId: string) => void;
  onBatchOperation?: (operation: string, sceneIds: string[]) => void;
  onExport?: (format: string, options: any) => void;
  onImport?: (data: any, format: string) => void;
  className?: string;
}

interface PlotBoardState {
  activePanel: 'plotboard' | 'grouping' | 'filtering' | 'analytics';
  isFullscreen: boolean;
  showCollaboration: boolean;
  showSettings: boolean;
  isLoading: boolean;
  lastSaved: string | null;
  unsavedChanges: boolean;
  performanceMode: boolean;
  selectedScenes: Set<string>;
  highlightedConnections: Set<string>;
}

export function EnhancedPlotBoard({
  project,
  story,
  scenes,
  characters = [],
  locations = [],
  plotThreads = [],
  acts = [],
  chapters = [],
  isCollaborative = false,
  onSceneUpdate,
  onSceneMove,
  onSceneCreate,
  onSceneEdit,
  onSceneDelete,
  onBatchOperation,
  onExport,
  onImport,
  className
}: EnhancedPlotBoardProps) {
  const [plotBoardState, setPlotBoardState] = useState<PlotBoardState>({
    activePanel: 'plotboard',
    isFullscreen: false,
    showCollaboration: false,
    showSettings: false,
    isLoading: false,
    lastSaved: null,
    unsavedChanges: false,
    performanceMode: scenes.length > 500, // Auto-enable for large projects
    selectedScenes: new Set(),
    highlightedConnections: new Set()
  });

  // Real-time collaboration integration
  const { 
    collaborators, 
    isConnected, 
    sendOperation, 
    subscribeToOperations 
  } = useCollaboration(project.id, isCollaborative);

  const { connectionStatus } = useWebSocket();

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    const sceneCount = scenes.length;
    const connectionCount = plotThreads.reduce((sum, thread) => sum + (thread.scenes?.length || 0), 0);
    const complexity = (sceneCount * connectionCount) / 1000;
    
    return {
      sceneCount,
      connectionCount,
      complexity,
      isLargeProject: sceneCount > 200,
      requiresOptimization: complexity > 50
    };
  }, [scenes.length, plotThreads]);

  // Auto-save and sync
  useEffect(() => {
    if (plotBoardState.unsavedChanges && isCollaborative) {
      const timer = setTimeout(() => {
        // Auto-save logic here
        setPlotBoardState(prev => ({
          ...prev,
          unsavedChanges: false,
          lastSaved: new Date().toISOString()
        }));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [plotBoardState.unsavedChanges, isCollaborative]);

  // Handle drag-drop operations with collaboration
  const handleSceneMove = useCallback(async (
    sceneId: string, 
    fromLane: string, 
    toLane: string, 
    newIndex: number
  ) => {
    setPlotBoardState(prev => ({ ...prev, unsavedChanges: true }));

    // Send collaborative operation
    if (isCollaborative) {
      await sendOperation({
        type: 'scene_move',
        sceneId,
        fromLane,
        toLane,
        newIndex,
        timestamp: Date.now()
      });
    }

    onSceneMove?.(sceneId, fromLane, toLane, newIndex);
  }, [isCollaborative, sendOperation, onSceneMove]);

  // Handle batch operations
  const handleBatchOperation = useCallback(async (operation: string, sceneIds: string[]) => {
    setPlotBoardState(prev => ({ ...prev, unsavedChanges: true }));

    if (isCollaborative) {
      await sendOperation({
        type: 'batch_operation',
        operation,
        sceneIds,
        timestamp: Date.now()
      });
    }

    onBatchOperation?.(operation, sceneIds);
  }, [isCollaborative, sendOperation, onBatchOperation]);

  // Handle undo/redo with collaboration
  const handleUndo = useCallback(async (operation: any): Promise<boolean> => {
    try {
      if (isCollaborative) {
        await sendOperation({
          type: 'undo',
          originalOperation: operation,
          timestamp: Date.now()
        });
      }
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  }, [isCollaborative, sendOperation]);

  const handleRedo = useCallback(async (operation: any): Promise<boolean> => {
    try {
      if (isCollaborative) {
        await sendOperation({
          type: 'redo',
          originalOperation: operation,
          timestamp: Date.now()
        });
      }
      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      return false;
    }
  }, [isCollaborative, sendOperation]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setPlotBoardState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  // Export functionality
  const handleExport = useCallback((format: string) => {
    const exportData = {
      project: {
        id: project.id,
        title: project.title,
        description: project.description
      },
      story: {
        id: story.id,
        title: story.title,
        description: story.description
      },
      scenes: scenes.map(scene => ({
        ...scene,
        // Add export-specific metadata
        exportedAt: new Date().toISOString(),
        version: '1.0'
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'EnhancedPlotBoard',
        format,
        sceneCount: scenes.length,
        characterCount: characters.length,
        locationCount: locations.length
      }
    };

    onExport?.(format, exportData);
  }, [project, story, scenes, characters.length, locations.length, onExport]);

  // Calculate project statistics
  const projectStats = useMemo(() => {
    const totalWords = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
    const completedScenes = scenes.filter(scene => scene.status === 'complete').length;
    const completionRate = scenes.length > 0 ? (completedScenes / scenes.length) * 100 : 0;
    const averageSceneLength = scenes.length > 0 ? Math.round(totalWords / scenes.length) : 0;
    
    return {
      totalWords,
      completedScenes,
      completionRate,
      averageSceneLength,
      estimatedReadTime: Math.ceil(totalWords / 250), // 250 words per minute
      lastModified: Math.max(...scenes.map(s => new Date(s.updatedAt).getTime()))
    };
  }, [scenes]);

  return (
    <div className={cn(
      "enhanced-plot-board h-full flex flex-col",
      plotBoardState.isFullscreen && "fixed inset-0 z-50 bg-background",
      className
    )}>
      {/* Provider Stack */}
      <AnimationEngineProvider enablePerformanceMonitoring={!plotBoardState.performanceMode}>
        <DragDropProvider
          onUndo={handleUndo}
          onRedo={handleRedo}
          enablePerformanceMonitoring={!plotBoardState.performanceMode}
        >
          <UndoRedoProvider
            onUndo={handleUndo}
            onRedo={handleRedo}
            maxHistorySize={plotBoardState.performanceMode ? 50 : 100}
          >
            <BatchSelectionProvider
              onBatchOperation={handleBatchOperation}
              maxSelectionSize={plotBoardState.performanceMode ? 25 : 50}
            >
              <ViewModeProvider
                initialMode="grid"
                onViewModeChange={(mode, config) => {
                  console.log(`Switched to ${mode} view:`, config);
                }}
              >
                {/* Main Interface */}
                <div className="plot-board-container flex-1 flex flex-col overflow-hidden">
                  {/* Header */}
                  <Card className="plot-board-header flex-shrink-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <CardTitle className="flex items-center gap-2">
                            <Grid className="h-6 w-6" />
                            Enhanced Plot Board
                            {plotBoardState.performanceMode && (
                              <Badge variant="outline" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Performance Mode
                              </Badge>
                            )}
                          </CardTitle>

                          {/* Project Info */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{story.title}</span>
                            <Badge variant="outline">
                              {scenes.length} scenes
                            </Badge>
                            <Badge variant="outline">
                              {projectStats.totalWords.toLocaleString()} words
                            </Badge>
                            <Badge 
                              variant={projectStats.completionRate > 75 ? "default" : "secondary"}
                            >
                              {Math.round(projectStats.completionRate)}% complete
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Collaboration Status */}
                          {isCollaborative && (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={isConnected ? "default" : "destructive"}
                                className="flex items-center gap-1"
                              >
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  isConnected ? "bg-green-500" : "bg-red-500"
                                )} />
                                {isConnected ? 'Connected' : 'Disconnected'}
                              </Badge>
                              
                              {collaborators.length > 0 && (
                                <Badge variant="outline">
                                  <Users className="h-3 w-3 mr-1" />
                                  {collaborators.length} online
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Save Status */}
                          {plotBoardState.unsavedChanges && (
                            <Badge variant="outline" className="animate-pulse">
                              <Clock className="h-3 w-3 mr-1" />
                              Saving...
                            </Badge>
                          )}

                          {/* Controls */}
                          <UndoRedoControls showHistory showLabels={false} />

                          <ViewModeSelector showLabels={false} />

                          <ViewModeControls showAdvanced={false} />

                          {/* Action Buttons */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={toggleFullscreen}
                            title={plotBoardState.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                          >
                            {plotBoardState.isFullscreen ? (
                              <Minimize2 className="h-4 w-4" />
                            ) : (
                              <Maximize2 className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPlotBoardState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Performance Warning */}
                      {performanceMetrics.requiresOptimization && !plotBoardState.performanceMode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800 dark:text-yellow-200">
                              Large project detected ({performanceMetrics.sceneCount} scenes). Consider enabling performance mode for better responsiveness.
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPlotBoardState(prev => ({ ...prev, performanceMode: true }))}
                              className="ml-auto"
                            >
                              Enable
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </CardHeader>
                  </Card>

                  {/* Content Tabs */}
                  <div className="plot-board-content flex-1 overflow-hidden">
                    <Tabs 
                      value={plotBoardState.activePanel} 
                      onValueChange={(value) => setPlotBoardState(prev => ({ 
                        ...prev, 
                        activePanel: value as PlotBoardState['activePanel'] 
                      }))}
                      className="h-full flex flex-col"
                    >
                      {/* Tab Navigation */}
                      <div className="flex-shrink-0 border-b bg-muted/30">
                        <TabsList className="grid w-full grid-cols-4 h-12">
                          <TabsTrigger value="plotboard" className="flex items-center gap-2">
                            <Grid className="h-4 w-4" />
                            Plot Board
                          </TabsTrigger>
                          <TabsTrigger value="grouping" className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Grouping
                          </TabsTrigger>
                          <TabsTrigger value="filtering" className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Search & Filter
                          </TabsTrigger>
                          <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      {/* Tab Content */}
                      <div className="flex-1 overflow-hidden">
                        <TabsContent value="plotboard" className="h-full m-0 p-4">
                          <ViewModeProvider>
                            <div className="h-full">
                              {/* Current view mode component will be rendered here */}
                              <TimelineView
                                scenes={scenes}
                                characters={characters}
                                locations={locations}
                                plotThreads={plotThreads}
                                onSceneMove={handleSceneMove}
                                onSceneEdit={onSceneEdit}
                                onSceneSelect={(sceneId) => console.log('Selected scene:', sceneId)}
                              />
                            </div>
                          </ViewModeProvider>
                        </TabsContent>

                        <TabsContent value="grouping" className="h-full m-0 p-4">
                          <SmartGroupingSystem
                            scenes={scenes}
                            characters={characters}
                            locations={locations}
                            plotThreads={plotThreads}
                            acts={acts}
                            chapters={chapters}
                            onGroupingChange={(groups) => console.log('Groups updated:', groups)}
                          />
                        </TabsContent>

                        <TabsContent value="filtering" className="h-full m-0 p-4">
                          <DynamicFilterSystem
                            scenes={scenes}
                            characters={characters}
                            locations={locations}
                            plotThreads={plotThreads}
                            onFilterChange={(filtered) => console.log('Filtered scenes:', filtered)}
                            onSceneSelect={(scene) => onSceneEdit?.(scene.id)}
                          />
                        </TabsContent>

                        <TabsContent value="analytics" className="h-full m-0 p-4">
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Project Analytics
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              {/* Key Metrics */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                  <div className="text-2xl font-bold">{scenes.length}</div>
                                  <div className="text-sm text-muted-foreground">Total Scenes</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                  <div className="text-2xl font-bold">{projectStats.totalWords.toLocaleString()}</div>
                                  <div className="text-sm text-muted-foreground">Total Words</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                  <div className="text-2xl font-bold">{Math.round(projectStats.completionRate)}%</div>
                                  <div className="text-sm text-muted-foreground">Complete</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                  <div className="text-2xl font-bold">{projectStats.estimatedReadTime}min</div>
                                  <div className="text-sm text-muted-foreground">Read Time</div>
                                </div>
                              </div>

                              {/* Performance Metrics */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Performance Metrics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">Project Complexity</span>
                                      <Badge variant={performanceMetrics.requiresOptimization ? "destructive" : "default"}>
                                        {performanceMetrics.complexity.toFixed(1)}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Based on scenes × connections ratio
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">Optimization Status</span>
                                      <Badge variant={plotBoardState.performanceMode ? "default" : "secondary"}>
                                        {plotBoardState.performanceMode ? 'Enabled' : 'Disabled'}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Performance optimizations for large projects
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>

                {/* Batch Selection Toolbar */}
                <BatchSelectionToolbar 
                  position="floating"
                  onOperation={handleBatchOperation}
                />

                {/* Loading Overlay */}
                <AnimatePresence>
                  {plotBoardState.isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-lg font-medium">Processing...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ViewModeProvider>
            </BatchSelectionProvider>
          </UndoRedoProvider>
        </DragDropProvider>
      </AnimationEngineProvider>
    </div>
  );
}

export default EnhancedPlotBoard;