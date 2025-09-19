/**
 * Advanced Draggable Scene Item
 * High-performance draggable scene with multi-touch support, physics animations, and batch operations
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useDrag, useDrop, ConnectDragSource, ConnectDropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { motion, useAnimation, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SceneCard } from '@/components/scenes/SceneCard';
import { useDragDropContext, DragItem, DropResult } from './DragDropProvider';
import type { Scene, Character, Location } from '@/types/story';

export const DRAG_TYPES = {
  SCENE: 'scene',
  SCENE_BATCH: 'scene_batch',
  PLOT_ELEMENT: 'plot_element'
} as const;

interface DraggableSceneItemProps {
  scene: Scene;
  characters?: Character[];
  locations?: Location[];
  index: number;
  laneId: string;
  viewMode?: 'card' | 'compact' | 'timeline';
  isGhost?: boolean;
  isDragOverlay?: boolean;
  canDrag?: boolean;
  canDrop?: boolean;
  onEdit?: () => void;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

interface DragCollectedProps {
  isDragging: boolean;
  canDrag: boolean;
  dragSource: ConnectDragSource;
}

interface DropCollectedProps {
  isOver: boolean;
  isValidDrop: boolean;
  canDrop: boolean;
  dropTarget: ConnectDropTarget;
  draggedItemType: string | null;
}

const PHYSICS_CONFIG = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1
};

const GESTURE_CONFIG = {
  dragElastic: 0.1,
  dragMomentum: false,
  dragTransition: { bounceStiffness: 600, bounceDamping: 20 }
};

export function DraggableSceneItem({
  scene,
  characters = [],
  locations = [],
  index,
  laneId,
  viewMode = 'card',
  isGhost = false,
  isDragOverlay = false,
  canDrag = true,
  canDrop = true,
  onEdit,
  onSelect,
  onDoubleClick,
  className,
  style
}: DraggableSceneItemProps) {
  const {
    state,
    startDrag,
    endDrag,
    addToSelection,
    removeFromSelection,
    isSelected,
    getSelectedItems,
    getBatchCount,
    toggleMultiSelect
  } = useDragDropContext();

  const ref = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const [isDragPreview, setIsDragPreview] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [isLongPress, setIsLongPress] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);

  // Motion values for physics-based animations
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useTransform(scale, [0.8, 1], [0.6, 1]);
  const controls = useAnimation();

  const selected = isSelected(scene.id);
  const batchCount = getBatchCount();

  // Create drag item with metadata
  const createDragItem = useCallback((): DragItem => ({
    id: scene.id,
    type: batchCount > 1 ? DRAG_TYPES.SCENE_BATCH : DRAG_TYPES.SCENE,
    sourceId: laneId,
    sourceIndex: index,
    data: {
      scene,
      selectedIds: batchCount > 1 ? getSelectedItems() : [scene.id],
      batchSize: batchCount > 1 ? batchCount : 1
    },
    metadata: {
      timestamp: Date.now(),
      operationType: 'move'
    }
  }), [scene, laneId, index, batchCount, getSelectedItems]);

  // Drag configuration
  const [{ isDragging, dragSource }, drag, dragPreview] = useDrag<DragItem, DropResult, DragCollectedProps>({
    type: batchCount > 1 ? DRAG_TYPES.SCENE_BATCH : DRAG_TYPES.SCENE,
    item: createDragItem,
    canDrag: canDrag && !isGhost,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
      dragSource: monitor.getDropResult()?.targetId ? null : monitor.getDropResult()
    }),
    begin: (monitor) => {
      const item = createDragItem();
      const selectedIds = batchCount > 1 ? getSelectedItems() : [scene.id];
      
      startDrag([item], {
        type: batchCount > 1 ? 'batch' : 'single',
        sourceContainer: laneId,
        operation: 'move'
      });

      // Start physics animation
      controls.start({
        scale: 1.05,
        rotateZ: Math.random() * 4 - 2, // Slight random rotation
        transition: PHYSICS_CONFIG
      });

      setIsDragPreview(true);
      return item;
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      const didDrop = monitor.didDrop();

      if (didDrop && dropResult) {
        endDrag(dropResult, true);
      } else {
        endDrag({
          targetId: laneId,
          targetIndex: index,
          dropEffect: 'none'
        }, false);
      }

      // Reset physics
      controls.start({
        scale: 1,
        rotateZ: 0,
        x: 0,
        y: 0,
        transition: PHYSICS_CONFIG
      });

      setIsDragPreview(false);
    }
  });

  // Drop configuration
  const [{ isOver, isValidDrop, draggedItemType }, drop] = useDrop<DragItem, DropResult, DropCollectedProps>({
    accept: [DRAG_TYPES.SCENE, DRAG_TYPES.SCENE_BATCH],
    canDrop: (item) => canDrop && item.sourceId !== laneId,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      isValidDrop: monitor.canDrop(),
      canDrop: monitor.canDrop(),
      dropTarget: monitor.getDropResult(),
      draggedItemType: monitor.getItemType() as string
    }),
    hover: (item, monitor) => {
      if (!ref.current || !monitor.isOver({ shallow: true })) return;

      // Physics-based hover feedback
      if (isValidDrop) {
        controls.start({
          scale: 1.02,
          transition: { ...PHYSICS_CONFIG, stiffness: 600 }
        });
      }
    },
    drop: (item, monitor): DropResult => {
      if (!monitor.isOver({ shallow: true })) {
        return {
          targetId: laneId,
          targetIndex: index,
          dropEffect: 'none'
        };
      }

      return {
        targetId: laneId,
        targetIndex: index,
        dropEffect: 'move',
        metadata: {
          timestamp: Date.now(),
          targetType: 'scene',
          position: monitor.getClientOffset() || { x: 0, y: 0 }
        }
      };
    }
  });

  // Combine drag and drop refs
  const dragDropRef = useCallback((node: HTMLDivElement) => {
    ref.current = node;
    drag(drop(node));
  }, [drag, drop]);

  // Set up drag preview
  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  // Handle selection logic
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select mode
      if (selected) {
        removeFromSelection(scene.id);
      } else {
        addToSelection(scene.id, DRAG_TYPES.SCENE, laneId);
      }
    } else if (event.shiftKey && getSelectedItems().length > 0) {
      // Range selection (simplified - would need more logic for proper range)
      addToSelection(scene.id, DRAG_TYPES.SCENE, laneId);
    } else {
      // Single selection
      onSelect?.();
    }
  }, [selected, scene.id, laneId, onSelect, addToSelection, removeFromSelection, getSelectedItems]);

  // Handle double-click/tap
  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.();
  }, [onDoubleClick]);

  // Touch gesture handling
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTap;

    if (timeDiff < 300) {
      setTapCount(prev => prev + 1);
      if (tapCount + 1 === 2) {
        handleDoubleClick();
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }

    setLastTap(now);

    // Long press for multi-select
    const timer = window.setTimeout(() => {
      setIsLongPress(true);
      toggleMultiSelect(true);
      addToSelection(scene.id, DRAG_TYPES.SCENE, laneId);
      
      // Haptic feedback on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);

    setLongPressTimer(timer);
  }, [lastTap, tapCount, handleDoubleClick, toggleMultiSelect, addToSelection, scene.id, laneId]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!isLongPress && tapCount === 1) {
      // Single tap
      setTimeout(() => {
        if (tapCount === 1) {
          handleClick({ preventDefault: () => {} } as React.MouseEvent);
        }
      }, 300);
    }

    setIsLongPress(false);
  }, [longPressTimer, isLongPress, tapCount, handleClick]);

  // Physics-based pan handling
  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (!isDragging) return;

    // Update motion values for smooth dragging
    x.set(info.offset.x);
    y.set(info.offset.y);

    // Scale based on drag distance for visual feedback
    const distance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const newScale = Math.max(0.95, 1 - distance * 0.0005);
    scale.set(newScale);
  }, [isDragging, x, y, scale]);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    // Snap back animation
    controls.start({
      x: 0,
      y: 0,
      scale: 1,
      transition: PHYSICS_CONFIG
    });
  }, [controls]);

  // Memoize motion props for performance
  const motionProps = useMemo(() => ({
    style: { x, y, scale, opacity },
    animate: controls,
    transition: PHYSICS_CONFIG,
    whileHover: !isDragging ? { scale: 1.02 } : {},
    whileTap: !isDragging ? { scale: 0.98 } : {},
    onPan: handlePan,
    onPanEnd: handlePanEnd,
    ...GESTURE_CONFIG
  }), [x, y, scale, opacity, controls, isDragging, handlePan, handlePanEnd]);

  // Compute visual states
  const visualState = useMemo(() => ({
    isSelected: selected,
    isDragging,
    isOver,
    isValidDrop,
    isBatchItem: batchCount > 1 && selected,
    showBatchIndicator: batchCount > 1 && selected
  }), [selected, isDragging, isOver, isValidDrop, batchCount]);

  return (
    <motion.div
      ref={dragDropRef}
      className={cn(
        "draggable-scene-item relative",
        {
          "opacity-50": isDragging && !isDragOverlay,
          "ring-2 ring-cosmic-500 ring-offset-2": visualState.isSelected,
          "ring-2 ring-blue-400 ring-offset-1": visualState.isOver && visualState.isValidDrop,
          "ring-2 ring-red-400 ring-offset-1": visualState.isOver && !visualState.isValidDrop,
          "cursor-grab": canDrag && !isDragging,
          "cursor-grabbing": isDragging,
          "shadow-lg": isDragging || visualState.isSelected,
          "z-50": isDragPreview
        },
        className
      )}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid={`draggable-scene-${scene.id}`}
      {...motionProps}
    >
      {/* Batch Selection Indicator */}
      {visualState.showBatchIndicator && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-2 -right-2 z-10 bg-cosmic-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg"
        >
          {batchCount}
        </motion.div>
      )}

      {/* Drop Zone Indicator */}
      {visualState.isOver && visualState.isValidDrop && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-blue-100 dark:bg-blue-900 rounded-lg border-2 border-dashed border-blue-400 flex items-center justify-center z-0"
        >
          <div className="text-blue-600 font-medium text-sm">Drop here</div>
        </motion.div>
      )}

      {/* Scene Card */}
      <div className={cn("relative", { "pointer-events-none": isDragging })}>
        <SceneCard
          scene={scene}
          characters={characters}
          locations={locations}
          isSelected={visualState.isSelected}
          viewMode={viewMode}
          onEdit={onEdit}
          onSelect={() => {}} // Handled by our click handler
          className={cn({
            "opacity-90": isDragging,
            "shadow-xl": visualState.isSelected || isDragging
          })}
        />
      </div>

      {/* Performance overlay for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 left-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
          {Math.round(1000 / 16)}fps
        </div>
      )}
    </motion.div>
  );
}

export default DraggableSceneItem;