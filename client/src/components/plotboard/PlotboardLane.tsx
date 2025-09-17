/**
 * Plotboard Lane Component
 * Individual lane for organizing scenes in the visual plotboard
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import PlotboardScene from './PlotboardScene';
import type { Scene } from '@/types/story';
import type { PlotLane } from './VisualPlotboard';
import { 
  ChevronRight,
  ChevronDown,
  Plus,
  Settings,
  Palette,
  Trash2,
  GripVertical
} from 'lucide-react';

interface PlotboardLaneProps {
  lane: PlotLane;
  scenes: Scene[];
  viewMode: 'compact' | 'detailed' | 'timeline';
  selectedScenes: Set<string>;
  onSceneSelect: (sceneId: string, multi: boolean) => void;
  onSceneMove: (sceneId: string, fromLaneId: string, toLaneId: string, index: number) => void;
  onSceneEdit: (scene: Scene) => void;
  onSceneConnect: (fromId: string, toId: string) => void;
  onLaneExpand: (laneId: string) => void;
  onLaneDelete?: (laneId: string) => void;
  onLaneColorChange?: (laneId: string, color: string) => void;
  onAddScene?: (laneId: string) => void;
  isDraggable?: boolean;
  className?: string;
}

export function PlotboardLane({
  lane,
  scenes,
  viewMode,
  selectedScenes,
  onSceneSelect,
  onSceneMove,
  onSceneEdit,
  onSceneConnect,
  onLaneExpand,
  onLaneDelete,
  onLaneColorChange,
  onAddScene,
  isDraggable = true,
  className
}: PlotboardLaneProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'plotboard-scene',
    drop: (item: { sceneId: string; fromLaneId: string }, monitor) => {
      if (monitor.didDrop()) return;
      
      const dropPosition = monitor.getClientOffset();
      if (!dropPosition) return;

      // Calculate index based on drop position
      const laneElement = document.getElementById(`lane-${lane.id}`);
      if (!laneElement) return;

      const laneRect = laneElement.getBoundingClientRect();
      const relativeX = dropPosition.x - laneRect.left;
      const sceneWidth = viewMode === 'compact' ? 150 : 250;
      const index = Math.floor(relativeX / sceneWidth);

      onSceneMove(item.sceneId, item.fromLaneId, lane.id, Math.min(index, scenes.length));
    },
    canDrop: (item) => item.fromLaneId !== lane.id,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  });

  const laneColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#48dbfb', '#a55eea', '#fd79a8'
  ];

  const getLaneIcon = () => {
    switch (lane.type) {
      case 'main': return '📖';
      case 'subplot': return '🌿';
      case 'character': return '👤';
      case 'theme': return '💭';
      default: return '📌';
    }
  };

  const laneStyles = {
    borderLeft: `4px solid ${lane.color}`,
    backgroundColor: lane.isExpanded ? 'transparent' : `${lane.color}10`
  };

  return (
    <div
      ref={drop}
      id={`lane-${lane.id}`}
      className={cn(
        "plotboard-lane transition-all duration-300",
        isOver && canDrop && "bg-cosmic-100/20 dark:bg-cosmic-900/20",
        className
      )}
      style={laneStyles}
    >
      {/* Lane Header */}
      <div className="flex items-center justify-between p-3 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {isDraggable && (
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          )}
          
          <button
            onClick={() => onLaneExpand(lane.id)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {lane.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-lg">{getLaneIcon()}</span>
            <h3 className="font-semibold">{lane.title}</h3>
            <Badge variant="outline" className="text-xs">
              {scenes.length} scenes
            </Badge>
            {lane.type !== 'custom' && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: `${lane.color}20`, color: lane.color }}
              >
                {lane.type}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Word Count */}
          <Badge variant="outline" className="text-xs">
            {scenes.reduce((sum, s) => sum + (s.wordCount || 0), 0).toLocaleString()} words
          </Badge>

          {/* Add Scene */}
          {onAddScene && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddScene(lane.id)}
              className="p-1"
              title="Add Scene"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {/* Color Picker */}
          {onLaneColorChange && (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1"
                title="Change Color"
              >
                <Palette className="h-4 w-4" />
              </Button>
              
              {showColorPicker && (
                <div className="absolute right-0 top-full mt-1 p-2 bg-background border rounded-lg shadow-lg z-30">
                  <div className="grid grid-cols-5 gap-1">
                    {laneColors.map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          onLaneColorChange(lane.id, color);
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1"
            title="Lane Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Delete Lane */}
          {onLaneDelete && lane.type === 'custom' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onLaneDelete(lane.id)}
              className="p-1 text-red-500 hover:text-red-700"
              title="Delete Lane"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lane Content */}
      {lane.isExpanded && (
        <div 
          className={cn(
            "flex gap-3 p-3 overflow-x-auto min-h-[120px]",
            viewMode === 'timeline' && "items-start"
          )}
        >
          {scenes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground p-8">
                <p className="text-sm mb-2">No scenes in this lane</p>
                {onAddScene && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddScene(lane.id)}
                    className="mx-auto"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Scene
                  </Button>
                )}
              </div>
            </div>
          ) : (
            scenes.map((scene, index) => (
              <PlotboardScene
                key={scene.id}
                scene={scene}
                laneId={lane.id}
                index={index}
                viewMode={viewMode}
                isSelected={selectedScenes.has(scene.id)}
                laneColor={lane.color}
                onSelect={onSceneSelect}
                onEdit={onSceneEdit}
                onConnect={onSceneConnect}
              />
            ))
          )}
        </div>
      )}

      {/* Collapsed View */}
      {!lane.isExpanded && scenes.length > 0 && (
        <div className="p-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{scenes.length} scenes</span>
            <span>•</span>
            <span>{scenes.reduce((sum, s) => sum + (s.wordCount || 0), 0).toLocaleString()} words</span>
            <span>•</span>
            <div className="flex -space-x-1">
              {scenes.slice(0, 5).map((scene, i) => (
                <div
                  key={scene.id}
                  className="w-2 h-2 rounded-full border border-background"
                  style={{ 
                    backgroundColor: scene.metadata?.color || lane.color,
                    zIndex: 5 - i
                  }}
                  title={scene.title}
                />
              ))}
              {scenes.length > 5 && (
                <Badge variant="outline" className="text-xs ml-2">
                  +{scenes.length - 5}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lane Settings Panel */}
      {showSettings && (
        <div className="p-3 border-t bg-muted/50">
          <div className="space-y-2">
            <div className="text-sm font-medium">Lane Settings</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Show word count</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Show connections</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Auto-arrange</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Lock position</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlotboardLane;