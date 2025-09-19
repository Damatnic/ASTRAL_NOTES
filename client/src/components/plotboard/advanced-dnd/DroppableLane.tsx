/**
 * Advanced Droppable Lane
 * High-performance drop zone with real-time feedback, auto-scroll, and smart positioning
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useDrop, ConnectDropTarget } from 'react-dnd';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Eye, 
  EyeOff, 
  Settings,
  MoreHorizontal,
  Activity,
  Users,
  Target,
  Layers
} from 'lucide-react';
import { DraggableSceneItem, DRAG_TYPES } from './DraggableSceneItem';
import { useDragDropContext, DragItem, DropResult } from './DragDropProvider';
import type { Scene, Character, Location } from '@/types/story';

export interface PlotLane {
  id: string;
  title: string;
  type: 'main' | 'subplot' | 'character' | 'theme' | 'custom';
  color: string;
  description?: string;
  scenes: Scene[];
  isExpanded: boolean;
  isVisible: boolean;
  order: number;
  metadata?: {
    characterId?: string;
    plotThreadId?: string;
    themeId?: string;
    wordCount?: number;
    estimatedDuration?: number;
  };
}

interface DroppableLaneProps {
  lane: PlotLane;
  characters?: Character[];
  locations?: Location[];
  viewMode?: 'card' | 'compact' | 'timeline';
  isActive?: boolean;
  isCollapsed?: boolean;
  showStats?: boolean;
  onSceneMove?: (sceneId: string, sourceLaneId: string, targetLaneId: string, targetIndex: number) => void;
  onSceneAdd?: (laneId: string, position?: number) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneSelect?: (sceneId: string) => void;
  onLaneToggle?: (laneId: string) => void;
  onLaneEdit?: (laneId: string) => void;
  onLaneSettings?: (laneId: string) => void;
  className?: string;
}

interface DropCollectedProps {
  isOver: boolean;
  isValidDrop: boolean;
  canDrop: boolean;
  draggedItem: DragItem | null;
  dropTarget: ConnectDropTarget;
}

const LANE_COLORS = {
  main: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    header: 'bg-blue-100 dark:bg-blue-900',
    accent: 'text-blue-700 dark:text-blue-300'
  },
  subplot: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
    header: 'bg-purple-100 dark:bg-purple-900',
    accent: 'text-purple-700 dark:text-purple-300'
  },
  character: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    header: 'bg-green-100 dark:bg-green-900',
    accent: 'text-green-700 dark:text-green-300'
  },
  theme: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    header: 'bg-amber-100 dark:bg-amber-900',
    accent: 'text-amber-700 dark:text-amber-300'
  },
  custom: {
    bg: 'bg-gray-50 dark:bg-gray-950',
    border: 'border-gray-200 dark:border-gray-800',
    header: 'bg-gray-100 dark:bg-gray-900',
    accent: 'text-gray-700 dark:text-gray-300'
  }
};

const AUTO_SCROLL_CONFIG = {
  threshold: 50, // Pixels from edge to start scrolling
  speed: 10, // Scroll speed multiplier
  acceleration: 1.5 // Speed increase factor
};

export function DroppableLane({
  lane,
  characters = [],
  locations = [],
  viewMode = 'card',
  isActive = false,
  isCollapsed = false,
  showStats = true,
  onSceneMove,
  onSceneAdd,
  onSceneEdit,
  onSceneSelect,
  onLaneToggle,
  onLaneEdit,
  onLaneSettings,
  className
}: DroppableLaneProps) {
  const { state, getBatchCount } = useDragDropContext();
  const laneRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  const controls = useAnimation();
  const headerControls = useAnimation();

  // Calculate lane statistics
  const stats = useMemo(() => {
    const wordCount = lane.scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
    const completedScenes = lane.scenes.filter(scene => scene.status === 'complete').length;
    const completionRate = lane.scenes.length > 0 ? (completedScenes / lane.scenes.length) * 100 : 0;
    
    return {
      sceneCount: lane.scenes.length,
      wordCount,
      completedScenes,
      completionRate: Math.round(completionRate),
      estimatedReadTime: Math.ceil(wordCount / 250) // Assuming 250 words per minute
    };
  }, [lane.scenes]);

  const colorScheme = LANE_COLORS[lane.type] || LANE_COLORS.custom;

  // Drop configuration with smart positioning
  const [{ isOver, isValidDrop, draggedItem }, drop] = useDrop<DragItem, DropResult, DropCollectedProps>({
    accept: [DRAG_TYPES.SCENE, DRAG_TYPES.SCENE_BATCH],
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      isValidDrop: monitor.canDrop(),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
      dropTarget: monitor.getDropResult()
    }),
    canDrop: (item) => {
      // Prevent dropping on self if moving within same lane
      if (item.sourceId === lane.id && item.data.selectedIds?.length === 1) {
        return false;
      }
      return true;
    },
    hover: (item, monitor) => {
      if (!laneRef.current || !monitor.isOver({ shallow: true })) {
        setDropIndex(null);
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const laneRect = laneRef.current.getBoundingClientRect();
      const relativeY = clientOffset.y - laneRect.top;
      
      // Calculate drop index based on scene positions
      let newDropIndex = 0;
      const sceneElements = laneRef.current.querySelectorAll('[data-testid^="draggable-scene-"]');
      
      for (let i = 0; i < sceneElements.length; i++) {
        const element = sceneElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementY = rect.top - laneRect.top + rect.height / 2;
        
        if (relativeY > elementY) {
          newDropIndex = i + 1;
        }
      }

      setDropIndex(newDropIndex);

      // Auto-scroll logic
      handleAutoScroll(clientOffset, laneRect);
    },
    drop: (item, monitor): DropResult => {
      setDropIndex(null);
      stopAutoScroll();

      if (!monitor.isOver({ shallow: true })) {
        return {
          targetId: lane.id,
          targetIndex: -1,
          dropEffect: 'none'
        };
      }

      const finalIndex = dropIndex !== null ? dropIndex : lane.scenes.length;
      
      // Trigger scene move callback
      if (item.data.selectedIds?.length === 1) {
        onSceneMove?.(item.data.selectedIds[0], item.sourceId, lane.id, finalIndex);
      } else if (item.data.selectedIds?.length > 1) {
        // Handle batch move
        item.data.selectedIds.forEach((sceneId: string, idx: number) => {
          onSceneMove?.(sceneId, item.sourceId, lane.id, finalIndex + idx);
        });
      }

      return {
        targetId: lane.id,
        targetIndex: finalIndex,
        dropEffect: 'move',
        metadata: {
          timestamp: Date.now(),
          targetType: 'lane',
          position: monitor.getClientOffset() || { x: 0, y: 0 }
        }
      };
    }
  });

  // Auto-scroll handling
  const handleAutoScroll = useCallback((clientOffset: { x: number; y: number }, laneRect: DOMRect) => {
    if (!scrollRef.current) return;

    const { y } = clientOffset;
    const scrollElement = scrollRef.current;
    const scrollRect = scrollElement.getBoundingClientRect();
    
    const distanceFromTop = y - scrollRect.top;
    const distanceFromBottom = scrollRect.bottom - y;

    if (distanceFromTop < AUTO_SCROLL_CONFIG.threshold) {
      startAutoScroll('up', distanceFromTop);
    } else if (distanceFromBottom < AUTO_SCROLL_CONFIG.threshold) {
      startAutoScroll('down', distanceFromBottom);
    } else {
      stopAutoScroll();
    }
  }, []);

  const startAutoScroll = useCallback((direction: 'up' | 'down', distance: number) => {
    if (isAutoScrolling && scrollDirection === direction) return;

    setIsAutoScrolling(true);
    setScrollDirection(direction);

    const scroll = () => {
      if (!scrollRef.current) return;

      const intensity = Math.max(0.1, (AUTO_SCROLL_CONFIG.threshold - distance) / AUTO_SCROLL_CONFIG.threshold);
      const scrollAmount = AUTO_SCROLL_CONFIG.speed * intensity * AUTO_SCROLL_CONFIG.acceleration;

      if (direction === 'up') {
        scrollRef.current.scrollTop -= scrollAmount;
      } else {
        scrollRef.current.scrollTop += scrollAmount;
      }

      autoScrollRef.current = requestAnimationFrame(scroll);
    };

    autoScrollRef.current = requestAnimationFrame(scroll);
  }, [isAutoScrolling, scrollDirection]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    setIsAutoScrolling(false);
    setScrollDirection(null);
  }, []);

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, []);

  // Animation effects
  useEffect(() => {
    if (isOver && isValidDrop) {
      controls.start({
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        scale: 1.02,
        transition: { duration: 0.2 }
      });
      
      headerControls.start({
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        transition: { duration: 0.2 }
      });
    } else {
      controls.start({
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        scale: 1,
        transition: { duration: 0.2 }
      });

      headerControls.start({
        backgroundColor: 'transparent',
        transition: { duration: 0.2 }
      });
    }
  }, [isOver, isValidDrop, controls, headerControls]);

  const handleToggle = useCallback(() => {
    onLaneToggle?.(lane.id);
  }, [lane.id, onLaneToggle]);

  const handleAddScene = useCallback(() => {
    onSceneAdd?.(lane.id);
  }, [lane.id, onSceneAdd]);

  const getDropIndicatorPosition = useCallback((index: number) => {
    if (!laneRef.current) return 0;
    
    const sceneElements = laneRef.current.querySelectorAll('[data-testid^="draggable-scene-"]');
    if (index === 0) return 0;
    if (index >= sceneElements.length) {
      const lastElement = sceneElements[sceneElements.length - 1] as HTMLElement;
      return lastElement ? lastElement.offsetTop + lastElement.offsetHeight + 8 : 0;
    }
    
    const element = sceneElements[index] as HTMLElement;
    return element ? element.offsetTop - 4 : 0;
  }, []);

  return (
    <motion.div
      ref={drop}
      className={cn(
        "droppable-lane relative rounded-lg border-2 transition-all duration-200",
        colorScheme.bg,
        colorScheme.border,
        {
          "ring-2 ring-blue-400 ring-offset-2": isOver && isValidDrop,
          "ring-2 ring-red-400 ring-offset-2": isOver && !isValidDrop,
          "shadow-lg": isActive || isOver
        },
        className
      )}
      animate={controls}
      layout
      data-testid={`droppable-lane-${lane.id}`}
    >
      {/* Lane Header */}
      <motion.div
        className={cn(
          "lane-header p-4 rounded-t-lg border-b",
          colorScheme.header,
          colorScheme.border
        )}
        animate={headerControls}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Toggle Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggle}
              className="p-1 hover:bg-white/20"
            >
              {lane.isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* Lane Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn("font-semibold truncate", colorScheme.accent)}>
                  {lane.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", colorScheme.accent)}
                >
                  {lane.type}
                </Badge>
              </div>
              
              {lane.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {lane.description}
                </p>
              )}
            </div>
          </div>

          {/* Statistics */}
          {showStats && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>{stats.sceneCount}</span>
              </div>
              
              {stats.wordCount > 0 && (
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{stats.wordCount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{stats.completionRate}%</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddScene}
              className="p-2 hover:bg-white/20"
              title="Add Scene"
            >
              <Plus className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onLaneSettings?.(lane.id)}
              className="p-2 hover:bg-white/20"
              title="Lane Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.completionRate > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={cn("h-2 rounded-full", 
                  stats.completionRate === 100 ? "bg-green-500" : colorScheme.accent.replace('text-', 'bg-')
                )}
                initial={{ width: 0 }}
                animate={{ width: `${stats.completionRate}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Lane Content */}
      <AnimatePresence>
        {lane.isExpanded && (
          <motion.div
            ref={scrollRef}
            className="lane-content p-4 max-h-96 overflow-y-auto"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div ref={laneRef} className="scenes-container space-y-3 relative">
              {/* Drop Indicator */}
              {isOver && dropIndex !== null && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-blue-400 rounded-full z-10"
                  style={{ top: getDropIndicatorPosition(dropIndex) }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Scene Items */}
              <AnimatePresence mode="popLayout">
                {lane.scenes.map((scene, index) => (
                  <motion.div
                    key={scene.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      layout: { duration: 0.3 },
                      opacity: { duration: 0.2 },
                      y: { duration: 0.2 }
                    }}
                  >
                    <DraggableSceneItem
                      scene={scene}
                      characters={characters}
                      locations={locations}
                      index={index}
                      laneId={lane.id}
                      viewMode={viewMode}
                      onEdit={() => onSceneEdit?.(scene.id)}
                      onSelect={() => onSceneSelect?.(scene.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty State */}
              {lane.scenes.length === 0 && !isOver && (
                <motion.div
                  className="empty-lane-state p-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No scenes in this lane</p>
                    <p className="text-xs mt-1">Drag scenes here or click + to add</p>
                  </div>
                </motion.div>
              )}

              {/* Drop Zone Placeholder */}
              {isOver && isValidDrop && lane.scenes.length === 0 && (
                <motion.div
                  className="drop-zone-placeholder p-8 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-950"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center text-blue-600">
                    <Plus className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">
                      Drop {getBatchCount() > 1 ? `${getBatchCount()} scenes` : 'scene'} here
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-scroll Indicators */}
      {isAutoScrolling && (
        <motion.div
          className={cn(
            "absolute right-2 z-20 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium",
            scrollDirection === 'up' ? 'top-2' : 'bottom-2'
          )}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Auto-scrolling {scrollDirection}
        </motion.div>
      )}
    </motion.div>
  );
}

export default DroppableLane;