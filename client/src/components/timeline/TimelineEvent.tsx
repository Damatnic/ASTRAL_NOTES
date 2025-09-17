/**
 * Timeline Event Component
 * Individual event representation on the timeline
 */

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import type { Scene, TimelineEvent as TEvent } from '@/types/story';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Star,
  Flag,
  AlertCircle,
  Edit,
  MoreVertical,
  Link2
} from 'lucide-react';

interface TimelineEventProps {
  event: TEvent;
  scene?: Scene;
  isSelected: boolean;
  scale: {
    unit: string;
    zoom: number;
    pixelsPerUnit: number;
  };
  type: 'story' | 'narrative';
  onSelect: (eventId: string, multi: boolean) => void;
  onEdit: (event: TEvent) => void;
  className?: string;
}

export function TimelineEvent({
  event,
  scene,
  isSelected,
  scale,
  type,
  onSelect,
  onEdit,
  className
}: TimelineEventProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'timeline-event',
    item: { eventId: event.id, fromType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const getEventIcon = () => {
    switch (event.type) {
      case 'scene': return FileText;
      case 'milestone': return Flag;
      case 'note': return AlertCircle;
      case 'custom': return Star;
      default: return Calendar;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case 'scene': return 'bg-blue-500';
      case 'milestone': return 'bg-green-500';
      case 'note': return 'bg-yellow-500';
      case 'custom': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getImportanceSize = () => {
    switch (event.importance) {
      case 'critical': return 'w-32 h-12';
      case 'major': return 'w-28 h-10';
      case 'normal': return 'w-24 h-8';
      case 'minor': return 'w-20 h-6';
      default: return 'w-24 h-8';
    }
  };

  const Icon = getEventIcon();
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(event.id, e.ctrlKey || e.metaKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(event);
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return 'No date';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Calculate width based on duration if available
  const eventWidth = event.duration 
    ? Math.max(event.duration * scale.pixelsPerUnit / 60, 60) // duration in minutes
    : undefined;

  return (
    <>
      <div
        ref={drag}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "timeline-event relative group cursor-pointer transition-all duration-200",
          "flex items-center gap-1 px-2 py-1 rounded border",
          getImportanceSize(),
          isSelected && "ring-2 ring-cosmic-500 z-10",
          isDragging && "opacity-50",
          event.type === 'milestone' && "border-2",
          className
        )}
        style={{
          width: eventWidth,
          backgroundColor: event.color ? `${event.color}20` : undefined,
          borderColor: event.color || undefined
        }}
      >
        {/* Event Icon */}
        <div className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
          getEventColor()
        )}>
          <Icon className="h-3 w-3 text-white" />
        </div>

        {/* Event Title */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">
            {scene?.title || event.title || 'Untitled'}
          </div>
          {event.importance === 'critical' && (
            <div className="text-xs text-muted-foreground truncate">
              {formatTime(event.storyTime)}
            </div>
          )}
        </div>

        {/* Quick Actions (shown on hover) */}
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-0.5 bg-background border rounded shadow-sm hover:bg-muted"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>

        {/* Connection Points */}
        {event.connections && event.connections.length > 0 && (
          <>
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-cosmic-500 rounded-full" />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-cosmic-500 rounded-full" />
          </>
        )}

        {/* Status Indicators */}
        {event.metadata?.status && (
          <div className="absolute -top-1 -left-1">
            {event.metadata.status === 'completed' && (
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            )}
            {event.metadata.status === 'in-progress' && (
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            )}
            {event.metadata.status === 'blocked' && (
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            )}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && !isDragging && (
        <div className="absolute z-50 p-3 bg-background border rounded-lg shadow-lg -top-2 left-full ml-2 min-w-[250px]">
          <div className="space-y-2">
            {/* Title */}
            <div className="font-semibold text-sm">
              {scene?.title || event.title || 'Untitled Event'}
            </div>

            {/* Type and Importance */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {event.type}
              </Badge>
              {event.importance && event.importance !== 'normal' && (
                <Badge 
                  variant={event.importance === 'critical' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {event.importance}
                </Badge>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-xs text-muted-foreground">
                {event.description}
              </p>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {event.storyTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{formatTime(event.storyTime)}</span>
                </div>
              )}
              
              {event.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{event.duration} min</span>
                </div>
              )}
              
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              {event.characterIds && event.characterIds.length > 0 && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>{event.characterIds.length} characters</span>
                </div>
              )}
            </div>

            {/* Scene Info */}
            {scene && (
              <div className="pt-2 border-t">
                <div className="text-xs space-y-1">
                  {scene.wordCount && (
                    <div>Word count: {scene.wordCount}</div>
                  )}
                  {scene.metadata?.mood && (
                    <div>Mood: {scene.metadata.mood}</div>
                  )}
                  {scene.metadata?.conflict && (
                    <div>Conflict: {scene.metadata.conflict}</div>
                  )}
                </div>
              </div>
            )}

            {/* Connections */}
            {event.connections && event.connections.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1 text-xs mb-1">
                  <Link2 className="h-3 w-3" />
                  <span>Connected to:</span>
                </div>
                <div className="space-y-0.5">
                  {event.connections.map((conn, i) => (
                    <div key={i} className="text-xs text-muted-foreground pl-4">
                      • {conn.targetTitle || conn.targetId}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute top-6 right-0 bg-background border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
              setShowMenu(false);
            }}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2"
          >
            <Edit className="h-3 w-3" />
            Edit Event
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Duplicate logic
              setShowMenu(false);
            }}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2"
          >
            <Star className="h-3 w-3" />
            Duplicate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Delete logic
              setShowMenu(false);
            }}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2 text-red-500"
          >
            <AlertCircle className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </>
  );
}

export default TimelineEvent;