/**
 * Timeline Track Component
 * Individual track for timeline events
 */

import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/utils/cn';
import TimelineEvent from './TimelineEvent';
import type { Scene, TimelineEvent as TEvent } from '@/types/story';

interface TimelineTrackProps {
  events: TEvent[];
  scenes: Scene[];
  scale: {
    unit: string;
    zoom: number;
    pixelsPerUnit: number;
  };
  type: 'story' | 'narrative';
  selectedEvents: Set<string>;
  playbackPosition: number;
  onEventSelect: (eventId: string, multi: boolean) => void;
  onEventEdit: (event: TEvent) => void;
  onSceneReorder: (sceneId: string, newPosition: number, timelineType: 'story' | 'narrative') => void;
  className?: string;
}

export function TimelineTrack({
  events,
  scenes,
  scale,
  type,
  selectedEvents,
  playbackPosition,
  onEventSelect,
  onEventEdit,
  onSceneReorder,
  className
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'timeline-event',
    drop: (item: { eventId: string; fromType: string }, monitor) => {
      const dropPosition = monitor.getClientOffset();
      if (!dropPosition || !trackRef.current) return;
      
      const trackRect = trackRef.current.getBoundingClientRect();
      const relativeX = dropPosition.x - trackRect.left;
      const position = Math.round(relativeX / scale.pixelsPerUnit);
      
      // Find the scene associated with this event
      const event = events.find(e => e.id === item.eventId);
      if (event?.sceneId) {
        onSceneReorder(event.sceneId, position, type);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });

  // Calculate timeline range
  const getTimelineRange = () => {
    if (events.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }
    
    const times = events
      .map(e => e.storyTime ? new Date(e.storyTime).getTime() : null)
      .filter(Boolean) as number[];
    
    if (times.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }
    
    return {
      start: new Date(Math.min(...times)),
      end: new Date(Math.max(...times))
    };
  };

  const range = getTimelineRange();
  const totalDays = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
  const trackWidth = Math.max(totalDays * scale.pixelsPerUnit, 1000);

  // Generate timeline markers
  const generateMarkers = () => {
    const markers = [];
    const { start, end } = range;
    
    if (scale.unit === 'days') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const daysSinceStart = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const x = daysSinceStart * scale.pixelsPerUnit;
        
        markers.push({
          x,
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isMainMarker: d.getDate() === 1 // First day of month
        });
      }
    } else if (scale.unit === 'weeks') {
      const startWeek = new Date(start);
      startWeek.setDate(startWeek.getDate() - startWeek.getDay()); // Start of week
      
      for (let w = new Date(startWeek); w <= end; w.setDate(w.getDate() + 7)) {
        const weeksSinceStart = Math.floor((w.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const x = weeksSinceStart * scale.pixelsPerUnit * 7;
        
        markers.push({
          x,
          label: `Week ${Math.floor(weeksSinceStart) + 1}`,
          isMainMarker: w.getDate() <= 7
        });
      }
    } else if (scale.unit === 'months') {
      for (let m = new Date(start); m <= end; m.setMonth(m.getMonth() + 1)) {
        const monthsSinceStart = (m.getFullYear() - start.getFullYear()) * 12 + 
                                (m.getMonth() - start.getMonth());
        const x = monthsSinceStart * scale.pixelsPerUnit * 30;
        
        markers.push({
          x,
          label: m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isMainMarker: m.getMonth() === 0 // January
        });
      }
    }
    
    return markers;
  };

  const markers = generateMarkers();

  // Calculate event positions
  const getEventPosition = (event: TEvent): number => {
    if (!event.storyTime) return 0;
    
    const eventTime = new Date(event.storyTime).getTime();
    const startTime = range.start.getTime();
    const daysSinceStart = (eventTime - startTime) / (1000 * 60 * 60 * 24);
    
    return daysSinceStart * scale.pixelsPerUnit;
  };

  // Group overlapping events
  const groupEvents = (): Array<{ events: TEvent[]; position: number }> => {
    const groups: Array<{ events: TEvent[]; position: number }> = [];
    const sorted = [...events].sort((a, b) => {
      const aTime = a.storyTime ? new Date(a.storyTime).getTime() : 0;
      const bTime = b.storyTime ? new Date(b.storyTime).getTime() : 0;
      return aTime - bTime;
    });
    
    sorted.forEach(event => {
      const position = getEventPosition(event);
      const existingGroup = groups.find(g => 
        Math.abs(g.position - position) < 50 // Events within 50px are grouped
      );
      
      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        groups.push({ events: [event], position });
      }
    });
    
    return groups;
  };

  const eventGroups = groupEvents();

  return (
    <div
      ref={(node) => {
        trackRef.current = node;
        drop(node);
      }}
      className={cn(
        "timeline-track relative",
        isOver && "bg-cosmic-100/20 dark:bg-cosmic-900/20",
        className
      )}
      style={{ width: trackWidth, height: '200px' }}
    >
      {/* Timeline Grid */}
      <div className="absolute inset-0">
        {/* Vertical grid lines and markers */}
        {markers.map((marker, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0"
            style={{ left: `${marker.x}px` }}
          >
            <div
              className={cn(
                "h-full border-l",
                marker.isMainMarker 
                  ? "border-gray-400 dark:border-gray-600" 
                  : "border-gray-200 dark:border-gray-800"
              )}
            />
            <div
              className={cn(
                "absolute -top-6 text-xs whitespace-nowrap",
                marker.isMainMarker ? "font-semibold" : "text-muted-foreground"
              )}
              style={{ left: '-30px', width: '60px', textAlign: 'center' }}
            >
              {marker.label}
            </div>
          </div>
        ))}
        
        {/* Horizontal lanes */}
        <div className="absolute top-8 left-0 right-0 h-px bg-border" />
        <div className="absolute top-24 left-0 right-0 h-px bg-border opacity-50" />
        <div className="absolute top-40 left-0 right-0 h-px bg-border opacity-30" />
      </div>

      {/* Events */}
      <div className="relative pt-8">
        {eventGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="absolute"
            style={{ left: `${group.position}px` }}
          >
            {group.events.map((event, eventIndex) => (
              <div
                key={event.id}
                className="absolute"
                style={{ 
                  top: `${eventIndex * 35}px`,
                  zIndex: selectedEvents.has(event.id) ? 10 : 1
                }}
              >
                <TimelineEvent
                  event={event}
                  scene={scenes.find(s => s.id === event.sceneId)}
                  isSelected={selectedEvents.has(event.id)}
                  scale={scale}
                  type={type}
                  onSelect={onEventSelect}
                  onEdit={onEventEdit}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Now Line (playback position) */}
      {playbackPosition > 0 && (
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none"
          style={{ left: `${playbackPosition}px` }}
        />
      )}

      {/* Drop Zone Indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-cosmic-500/10 border-2 border-cosmic-500 border-dashed rounded pointer-events-none" />
      )}
    </div>
  );
}

export default TimelineTrack;