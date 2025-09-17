/**
 * Plotboard Scene Component
 * Visual representation of a scene in the plotboard
 */

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Scene } from '@/types/story';
import { 
  Edit,
  Link2,
  MoreVertical,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkles,
  Target,
  Hash
} from 'lucide-react';

interface PlotboardSceneProps {
  scene: Scene;
  laneId: string;
  index: number;
  viewMode: 'compact' | 'detailed' | 'timeline';
  isSelected: boolean;
  laneColor: string;
  onSelect: (sceneId: string, multi: boolean) => void;
  onEdit: (scene: Scene) => void;
  onConnect: (fromId: string, toId: string) => void;
  className?: string;
}

export function PlotboardScene({
  scene,
  laneId,
  index,
  viewMode,
  isSelected,
  laneColor,
  onSelect,
  onEdit,
  onConnect,
  className
}: PlotboardSceneProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'plotboard-scene',
    item: { sceneId: scene.id, fromLaneId: laneId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const getStatusIcon = () => {
    switch (scene.metadata?.status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'in-progress': return <Circle className="h-3 w-3 text-yellow-500" />;
      case 'planned': return <Circle className="h-3 w-3 text-gray-400" />;
      case 'problem': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getMoodColor = () => {
    const mood = scene.metadata?.mood;
    if (!mood) return laneColor;
    
    const moodColors: Record<string, string> = {
      tense: '#ff6b6b',
      romantic: '#ff9ff3',
      mysterious: '#a55eea',
      action: '#ff6348',
      emotional: '#54a0ff',
      humorous: '#feca57',
      dark: '#2c2c54',
      hopeful: '#00d2d3'
    };
    
    return moodColors[mood] || laneColor;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isConnecting) {
      // Complete connection
      onConnect(scene.id, '');
      setIsConnecting(false);
    } else {
      onSelect(scene.id, e.ctrlKey || e.metaKey);
    }
  };

  const handleDoubleClick = () => {
    onEdit(scene);
  };

  const handleConnectionStart = () => {
    setIsConnecting(true);
    setShowMenu(false);
  };

  // Compact View
  if (viewMode === 'compact') {
    return (
      <div
        ref={drag}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "plotboard-scene-compact relative group cursor-pointer transition-all duration-200",
          "w-32 h-20 rounded-lg border-2 p-2",
          isSelected && "ring-2 ring-cosmic-500",
          isDragging && "opacity-50",
          isConnecting && "ring-2 ring-blue-500 animate-pulse",
          className
        )}
        style={{
          borderColor: getMoodColor(),
          backgroundColor: `${getMoodColor()}10`
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-1">
            {getStatusIcon()}
            <Badge variant="outline" className="text-xs px-1 py-0">
              {scene.order}
            </Badge>
          </div>
          
          <h4 className="text-xs font-medium truncate flex-1">
            {scene.title}
          </h4>
          
          {scene.wordCount && (
            <div className="text-xs text-muted-foreground">
              {scene.wordCount} words
            </div>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 h-6 w-6"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>

        {/* Connection Anchor Points */}
        {isConnecting && (
          <>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
          </>
        )}
      </div>
    );
  }

  // Detailed View
  if (viewMode === 'detailed') {
    return (
      <Card
        ref={dragPreview}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "plotboard-scene-detailed relative group cursor-pointer transition-all duration-200",
          "w-64 min-h-[160px]",
          isSelected && "ring-2 ring-cosmic-500",
          isDragging && "opacity-50",
          isConnecting && "ring-2 ring-blue-500 animate-pulse",
          className
        )}
        style={{
          borderLeft: `4px solid ${getMoodColor()}`
        }}
      >
        <div ref={drag} className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <h4 className="font-semibold text-sm">{scene.title}</h4>
            </div>
            <Badge variant="outline" className="text-xs">
              Scene {scene.order}
            </Badge>
          </div>

          {/* Summary */}
          {scene.summary && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {scene.summary}
            </p>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            {scene.metadata?.pov && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{scene.metadata.pov}</span>
              </div>
            )}
            
            {scene.metadata?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{scene.metadata.location}</span>
              </div>
            )}
            
            {scene.metadata?.time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{scene.metadata.time}</span>
              </div>
            )}
            
            {scene.wordCount && (
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span>{scene.wordCount} words</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {scene.tags && scene.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {scene.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {scene.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{scene.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Characters */}
          {scene.metadata?.characters && scene.metadata.characters.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Characters:</span>
              <span className="truncate">
                {scene.metadata.characters.slice(0, 2).join(', ')}
                {scene.metadata.characters.length > 2 && ` +${scene.metadata.characters.length - 2}`}
              </span>
            </div>
          )}

          {/* Purpose/Goal */}
          {scene.metadata?.purpose && (
            <div className="flex items-start gap-1 text-xs mt-2">
              <Target className="h-3 w-3 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground line-clamp-2">
                {scene.metadata.purpose}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(scene);
                }}
                className="p-1 h-6 w-6"
                title="Edit Scene"
              >
                <Edit className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnectionStart();
                }}
                className="p-1 h-6 w-6"
                title="Connect Scene"
              >
                <Link2 className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 h-6 w-6"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Connection Indicators */}
          {scene.metadata?.connections && scene.metadata.connections.length > 0 && (
            <div className="absolute -right-1 top-1/2 -translate-y-1/2">
              <div className="flex flex-col gap-1">
                {scene.metadata.connections.map((conn, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: conn.color || '#666' }}
                    title={`Connected to: ${conn.targetTitle}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {showMenu && (
          <div className="absolute top-8 right-2 bg-background border rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(scene);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
            >
              <Edit className="h-3 w-3" />
              Edit Scene
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConnectionStart();
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
            >
              <Link2 className="h-3 w-3" />
              Create Connection
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Duplicate scene logic
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
            >
              <Sparkles className="h-3 w-3" />
              Duplicate
            </button>
          </div>
        )}
      </Card>
    );
  }

  // Timeline View
  return (
    <div
      ref={drag}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "plotboard-scene-timeline relative group cursor-pointer transition-all duration-200",
        "flex items-center gap-2 p-2 rounded-lg",
        isSelected && "ring-2 ring-cosmic-500",
        isDragging && "opacity-50",
        className
      )}
      style={{
        backgroundColor: `${getMoodColor()}10`,
        borderLeft: `3px solid ${getMoodColor()}`
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        {getStatusIcon()}
        <span className="font-medium text-sm">{scene.title}</span>
        {scene.metadata?.time && (
          <Badge variant="outline" className="text-xs">
            {scene.metadata.time}
          </Badge>
        )}
        {scene.wordCount && (
          <span className="text-xs text-muted-foreground">
            {scene.wordCount} words
          </span>
        )}
      </div>
      
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export default PlotboardScene;