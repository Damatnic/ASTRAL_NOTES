/**
 * Draggable Scene Card Component
 * Scene card with drag-and-drop functionality for reordering
 */

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { cn } from '@/utils/cn';
import { SceneCard } from './SceneCard';
import type { Scene, Character, Location } from '@/types/story';

interface DragItem {
  type: string;
  id: string;
  index: number;
}

interface DraggableSceneCardProps {
  scene: Scene;
  index: number;
  characters?: Character[];
  locations?: Location[];
  isSelected?: boolean;
  isExpanded?: boolean;
  showMetadata?: boolean;
  viewMode?: 'card' | 'list' | 'board';
  onEdit?: () => void;
  onSelect?: () => void;
  onToggleExpanded?: () => void;
  onViewChange?: (sceneId: string) => void;
  onMoveScene: (dragIndex: number, hoverIndex: number) => void;
  className?: string;
}

const ITEM_TYPE = 'scene';

export function DraggableSceneCard({
  scene,
  index,
  characters,
  locations,
  isSelected,
  isExpanded,
  showMetadata,
  viewMode = 'card',
  onEdit,
  onSelect,
  onToggleExpanded,
  onViewChange,
  onMoveScene,
  className
}: DraggableSceneCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: (): DragItem => ({
      type: ITEM_TYPE,
      id: scene.id,
      index
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  // Drop functionality
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMoveScene(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    }
  });

  // Combine drag and drop refs
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={cn(
        "draggable-scene-card transition-all duration-200",
        isDragging && "opacity-50 scale-95 rotate-2 shadow-lg",
        className
      )}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Drag Handle Indicator */}
      <div className={cn(
        "absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10",
        isDragging && "opacity-100"
      )}>
        <div className="flex flex-col gap-0.5">
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
        </div>
      </div>

      {/* Scene Card */}
      <div className="group">
        <SceneCard
          scene={scene}
          characters={characters}
          locations={locations}
          isSelected={isSelected}
          isExpanded={isExpanded}
          showMetadata={showMetadata}
          viewMode={viewMode}
          onEdit={onEdit}
          onSelect={onSelect}
          onToggleExpanded={onToggleExpanded}
          onViewChange={onViewChange}
          className={cn(
            "relative pl-6", // Add left padding for drag handle
            isDragging && "ring-2 ring-cosmic-500 shadow-xl"
          )}
        />
      </div>
    </div>
  );
}

export default DraggableSceneCard;