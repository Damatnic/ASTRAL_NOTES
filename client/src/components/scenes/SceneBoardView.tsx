/**
 * Scene Board View Component
 * Kanban-style board view for scenes with drag-and-drop support
 */

import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus,
  MoreHorizontal,
  Filter,
  SortDesc,
  Activity,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { DraggableSceneCard } from './DraggableSceneCard';
import type { Scene, Character, Location } from '@/types/story';

interface SceneBoardViewProps {
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  selectedSceneId?: string;
  expandedScenes?: Set<string>;
  onSceneSelect?: (sceneId: string) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneCreate?: () => void;
  onSceneView?: (sceneId: string) => void;
  onToggleExpanded?: (sceneId: string) => void;
  onSceneReorder?: (sceneId: string, newOrder: number, newStatus?: string) => void;
  showMetadata?: boolean;
  className?: string;
}

interface BoardColumn {
  id: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  scenes: Scene[];
}

const BOARD_COLUMNS: Omit<BoardColumn, 'scenes'>[] = [
  {
    id: 'planned',
    title: 'Planned',
    description: 'Scenes in planning phase',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 dark:bg-gray-900'
  },
  {
    id: 'outlined',
    title: 'Outlined',
    description: 'Scenes with outline complete',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 dark:bg-blue-900'
  },
  {
    id: 'drafted',
    title: 'In Progress',
    description: 'Scenes being written',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 dark:bg-orange-900'
  },
  {
    id: 'revised',
    title: 'Revised',
    description: 'Scenes under revision',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 dark:bg-purple-900'
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Finished scenes',
    color: 'text-green-700',
    bgColor: 'bg-green-50 dark:bg-green-900'
  }
];

export function SceneBoardView({
  scenes,
  characters = [],
  locations = [],
  selectedSceneId,
  expandedScenes = new Set(),
  onSceneSelect,
  onSceneEdit,
  onSceneCreate,
  onSceneView,
  onToggleExpanded,
  onSceneReorder,
  showMetadata = true,
  className
}: SceneBoardViewProps) {
  const [draggedScene, setDraggedScene] = useState<Scene | null>(null);

  // Group scenes by status
  const columns: BoardColumn[] = BOARD_COLUMNS.map(column => ({
    ...column,
    scenes: scenes.filter(scene => scene.status === column.id)
  }));

  // Handle scene movement within the same column
  const handleMoveScene = useCallback((dragIndex: number, hoverIndex: number, columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column || !onSceneReorder) return;

    const draggedScene = column.scenes[dragIndex];
    if (!draggedScene) return;

    // Calculate new order based on position in column
    const newOrder = hoverIndex + 1;
    onSceneReorder(draggedScene.id, newOrder);
  }, [columns, onSceneReorder]);

  // Handle scene movement between columns
  const handleMoveSceneToColumn = useCallback((sceneId: string, targetColumnId: string) => {
    if (!onSceneReorder) return;

    const targetColumn = columns.find(col => col.id === targetColumnId);
    if (!targetColumn) return;

    // Place at end of target column
    const newOrder = targetColumn.scenes.length + 1;
    onSceneReorder(sceneId, newOrder, targetColumnId);
  }, [columns, onSceneReorder]);

  // Calculate column statistics
  const getColumnStats = (column: BoardColumn) => {
    const totalWords = column.scenes.reduce((sum, scene) => sum + (scene.wordCount || 0), 0);
    const avgWords = column.scenes.length > 0 ? Math.round(totalWords / column.scenes.length) : 0;
    return { totalWords, avgWords, count: column.scenes.length };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn("scene-board-view", className)}>
        {/* Board Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Scene Board</h2>
              <p className="text-muted-foreground">
                Organize scenes by status with drag-and-drop
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <SortDesc className="h-4 w-4 mr-1" />
                Sort
              </Button>
              {onSceneCreate && (
                <Button onClick={onSceneCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Scene
                </Button>
              )}
            </div>
          </div>

          {/* Board Statistics */}
          <div className="grid grid-cols-5 gap-4">
            {columns.map(column => {
              const stats = getColumnStats(column);
              return (
                <Card key={column.id} className="p-3">
                  <div className="text-center">
                    <div className={cn("text-lg font-semibold", column.color)}>
                      {stats.count}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {column.title}
                    </div>
                    {stats.totalWords > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {stats.totalWords.toLocaleString()} words
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Board Columns */}
        <div className="grid grid-cols-5 gap-6 h-full min-h-[600px]">
          {columns.map(column => (
            <BoardColumn
              key={column.id}
              column={column}
              characters={characters}
              locations={locations}
              selectedSceneId={selectedSceneId}
              expandedScenes={expandedScenes}
              onSceneSelect={onSceneSelect}
              onSceneEdit={onSceneEdit}
              onSceneView={onSceneView}
              onToggleExpanded={onToggleExpanded}
              onMoveScene={(dragIndex, hoverIndex) => 
                handleMoveScene(dragIndex, hoverIndex, column.id)
              }
              onMoveSceneToColumn={handleMoveSceneToColumn}
              showMetadata={showMetadata}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}

// Individual Board Column Component
interface BoardColumnProps {
  column: BoardColumn;
  characters: Character[];
  locations: Location[];
  selectedSceneId?: string;
  expandedScenes: Set<string>;
  onSceneSelect?: (sceneId: string) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneView?: (sceneId: string) => void;
  onToggleExpanded?: (sceneId: string) => void;
  onMoveScene: (dragIndex: number, hoverIndex: number) => void;
  onMoveSceneToColumn: (sceneId: string, targetColumnId: string) => void;
  showMetadata: boolean;
}

function BoardColumn({
  column,
  characters,
  locations,
  selectedSceneId,
  expandedScenes,
  onSceneSelect,
  onSceneEdit,
  onSceneView,
  onToggleExpanded,
  onMoveScene,
  onMoveSceneToColumn,
  showMetadata
}: BoardColumnProps) {
  const stats = {
    totalWords: column.scenes.reduce((sum, scene) => sum + (scene.wordCount || 0), 0),
    count: column.scenes.length
  };

  return (
    <Card className={cn("board-column h-full flex flex-col", column.bgColor)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-lg", column.color)}>
            {column.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {column.scenes.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {column.description}
        </p>
        {stats.totalWords > 0 && (
          <div className="text-xs text-muted-foreground">
            {stats.totalWords.toLocaleString()} words total
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {column.scenes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">No scenes in {column.title.toLowerCase()}</div>
            </div>
          ) : (
            column.scenes.map((scene, index) => (
              <DraggableSceneCard
                key={scene.id}
                scene={scene}
                index={index}
                characters={characters}
                locations={locations}
                isSelected={selectedSceneId === scene.id}
                isExpanded={expandedScenes.has(scene.id)}
                showMetadata={showMetadata}
                viewMode="board"
                onEdit={() => onSceneEdit?.(scene.id)}
                onSelect={() => onSceneSelect?.(scene.id)}
                onToggleExpanded={() => onToggleExpanded?.(scene.id)}
                onViewChange={() => onSceneView?.(scene.id)}
                onMoveScene={onMoveScene}
                className="mb-3"
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SceneBoardView;