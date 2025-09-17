/**
 * Dual Timeline Component
 * Shows both story chronology and narrative order with character views
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TimelineTrack from './TimelineTrack';
import TimelineEvent from './TimelineEvent';
import CharacterTimeline from './CharacterTimeline';
import type { Scene, Character, Timeline, TimelineEvent as TEvent } from '@/types/story';
import { 
  Calendar,
  Clock,
  User,
  Layers,
  GitBranch,
  ArrowUpDown,
  ZoomIn,
  ZoomOut,
  Maximize,
  Filter,
  Download,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';

interface DualTimelineProps {
  timeline: Timeline;
  scenes: Scene[];
  characters: Character[];
  onSceneReorder: (sceneId: string, newPosition: number, timelineType: 'story' | 'narrative') => void;
  onEventAdd: (event: Partial<TEvent>) => void;
  onEventEdit: (event: TEvent) => void;
  onEventDelete: (eventId: string) => void;
  className?: string;
}

interface TimelineViewMode {
  type: 'dual' | 'story' | 'narrative' | 'character';
  characterId?: string;
}

interface TimelineScale {
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  zoom: number; // 0.25 to 4
  pixelsPerUnit: number;
}

export function DualTimeline({
  timeline,
  scenes,
  characters,
  onSceneReorder,
  onEventAdd,
  onEventEdit,
  onEventDelete,
  className
}: DualTimelineProps) {
  const [viewMode, setViewMode] = useState<TimelineViewMode>({ type: 'dual' });
  const [scale, setScale] = useState<TimelineScale>({
    unit: 'days',
    zoom: 1,
    pixelsPerUnit: 100
  });
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    characters: new Set<string>(),
    eventTypes: new Set<string>(),
    dateRange: null as { start: Date; end: Date } | null
  });
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackPosition(prev => {
          const maxPosition = calculateTimelineLength();
          if (prev >= maxPosition) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }
    
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const calculateTimelineLength = (): number => {
    // Calculate total timeline length based on events
    const allEvents = [...(timeline.events || [])];
    if (allEvents.length === 0) return 1000;
    
    const latestDate = Math.max(...allEvents.map(e => 
      e.storyTime ? new Date(e.storyTime).getTime() : 0
    ));
    const earliestDate = Math.min(...allEvents.map(e => 
      e.storyTime ? new Date(e.storyTime).getTime() : 0
    ));
    
    return ((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) * scale.pixelsPerUnit; // Days
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => ({
      ...prev,
      zoom: direction === 'in' 
        ? Math.min(prev.zoom * 1.2, 4)
        : Math.max(prev.zoom / 1.2, 0.25),
      pixelsPerUnit: direction === 'in'
        ? Math.min(prev.pixelsPerUnit * 1.2, 400)
        : Math.max(prev.pixelsPerUnit / 1.2, 25)
    }));
  };

  const handleScaleChange = (unit: TimelineScale['unit']) => {
    const unitPixels = {
      minutes: 10,
      hours: 50,
      days: 100,
      weeks: 200,
      months: 400,
      years: 800
    };
    
    setScale(prev => ({
      ...prev,
      unit,
      pixelsPerUnit: unitPixels[unit] * prev.zoom
    }));
  };

  const handleEventSelect = (eventId: string, multi: boolean) => {
    setSelectedEvents(prev => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(eventId)) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }
      } else {
        next.clear();
        next.add(eventId);
      }
      return next;
    });
  };

  const handleExport = () => {
    // Export timeline data as JSON or image
    const data = {
      timeline,
      scenes,
      viewMode,
      scale,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredEvents = (): TEvent[] => {
    let events = timeline.events || [];
    
    // Apply character filter
    if (filters.characters.size > 0) {
      events = events.filter(e => 
        e.characterIds?.some(id => filters.characters.has(id))
      );
    }
    
    // Apply event type filter
    if (filters.eventTypes.size > 0) {
      events = events.filter(e => filters.eventTypes.has(e.type));
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      events = events.filter(e => {
        if (!e.storyTime) return false;
        const eventDate = new Date(e.storyTime);
        return eventDate >= filters.dateRange!.start && eventDate <= filters.dateRange!.end;
      });
    }
    
    return events;
  };

  const renderDualView = () => (
    <div className="dual-timeline-view space-y-4">
      {/* Story Chronology Track */}
      <div className="story-track">
        <div className="track-header flex items-center justify-between p-2 bg-muted/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cosmic-600" />
            <h3 className="font-semibold">Story Chronology</h3>
            <Badge variant="outline" className="text-xs">
              {timeline.storyOrder?.length || 0} scenes
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Actual order of events in the story world
          </div>
        </div>
        
        <TimelineTrack
          events={getFilteredEvents().filter(e => e.timeline === 'story')}
          scenes={scenes}
          scale={scale}
          type="story"
          selectedEvents={selectedEvents}
          playbackPosition={playbackPosition}
          onEventSelect={handleEventSelect}
          onEventEdit={onEventEdit}
          onSceneReorder={onSceneReorder}
        />
      </div>

      {/* Connection Lines */}
      <div className="connection-layer relative h-12">
        <svg className="absolute inset-0 w-full h-full">
          {/* Draw connection lines between corresponding events */}
          {timeline.storyOrder?.map((sceneId, index) => {
            const narrativeIndex = timeline.narrativeOrder?.indexOf(sceneId) || 0;
            const storyX = index * scale.pixelsPerUnit;
            const narrativeX = narrativeIndex * scale.pixelsPerUnit;
            
            return (
              <line
                key={sceneId}
                x1={storyX}
                y1={0}
                x2={narrativeX}
                y2={48}
                stroke="#666"
                strokeWidth={1}
                strokeDasharray="2,2"
                opacity={0.5}
              />
            );
          })}
        </svg>
        
        <div className="flex items-center justify-center h-full">
          <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Narrative Order Track */}
      <div className="narrative-track">
        <div className="track-header flex items-center justify-between p-2 bg-muted/50">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold">Narrative Order</h3>
            <Badge variant="outline" className="text-xs">
              {timeline.narrativeOrder?.length || 0} scenes
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Order in which events are revealed to the reader
          </div>
        </div>
        
        <TimelineTrack
          events={getFilteredEvents().filter(e => e.timeline === 'narrative')}
          scenes={scenes}
          scale={scale}
          type="narrative"
          selectedEvents={selectedEvents}
          playbackPosition={playbackPosition}
          onEventSelect={handleEventSelect}
          onEventEdit={onEventEdit}
          onSceneReorder={onSceneReorder}
        />
      </div>
    </div>
  );

  const renderCharacterView = () => {
    const character = characters.find(c => c.id === viewMode.characterId);
    if (!character) return null;
    
    return (
      <CharacterTimeline
        character={character}
        events={getFilteredEvents().filter(e => 
          e.characterIds?.includes(character.id)
        )}
        scenes={scenes}
        scale={scale}
        selectedEvents={selectedEvents}
        onEventSelect={handleEventSelect}
        onEventEdit={onEventEdit}
      />
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className={cn("dual-timeline", className)}>
        {/* Timeline Header */}
        <div className="timeline-header border-b p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Mode Selector */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode.type === 'dual' ? 'default' : 'ghost'}
                  onClick={() => setViewMode({ type: 'dual' })}
                  className="px-3"
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Dual
                </Button>
                <Button
                  size="sm"
                  variant={viewMode.type === 'story' ? 'default' : 'ghost'}
                  onClick={() => setViewMode({ type: 'story' })}
                  className="px-3"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Story
                </Button>
                <Button
                  size="sm"
                  variant={viewMode.type === 'narrative' ? 'default' : 'ghost'}
                  onClick={() => setViewMode({ type: 'narrative' })}
                  className="px-3"
                >
                  <GitBranch className="h-4 w-4 mr-1" />
                  Narrative
                </Button>
                <Button
                  size="sm"
                  variant={viewMode.type === 'character' ? 'default' : 'ghost'}
                  onClick={() => setViewMode({ type: 'character' })}
                  className="px-3"
                >
                  <User className="h-4 w-4 mr-1" />
                  Character
                </Button>
              </div>

              {/* Character Selector for Character View */}
              {viewMode.type === 'character' && (
                <select
                  value={viewMode.characterId || ''}
                  onChange={(e) => setViewMode({ 
                    type: 'character', 
                    characterId: e.target.value 
                  })}
                  className="px-3 py-1 border rounded bg-background"
                >
                  <option value="">Select Character</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Scale Selector */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <select
                  value={scale.unit}
                  onChange={(e) => handleScaleChange(e.target.value as TimelineScale['unit'])}
                  className="px-2 py-1 border rounded text-sm bg-background"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>

            {/* Timeline Controls */}
            <div className="flex items-center gap-2">
              {/* Playback Controls */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPlaybackPosition(0)}
                  className="p-1"
                  title="Reset"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleZoom('out')}
                  className="p-1"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2">{Math.round(scale.zoom * 100)}%</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleZoom('in')}
                  className="p-1"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setScale({ unit: 'days', zoom: 1, pixelsPerUnit: 100 })}
                  className="p-1"
                  title="Fit to Screen"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>

              {/* Filter Button */}
              <Button
                size="sm"
                variant={showFilters ? 'default' : 'ghost'}
                onClick={() => setShowFilters(!showFilters)}
                className="p-2"
                title="Filters"
              >
                <Filter className="h-4 w-4" />
                {(filters.characters.size > 0 || filters.eventTypes.size > 0) && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {filters.characters.size + filters.eventTypes.size}
                  </Badge>
                )}
              </Button>

              {/* Export Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExport}
                className="p-2"
                title="Export Timeline"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Settings */}
              <Button
                size="sm"
                variant="ghost"
                className="p-2"
                title="Timeline Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                {/* Character Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Characters</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {characters.map(char => (
                      <label key={char.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.characters.has(char.id)}
                          onChange={(e) => {
                            const next = new Set(filters.characters);
                            if (e.target.checked) {
                              next.add(char.id);
                            } else {
                              next.delete(char.id);
                            }
                            setFilters(prev => ({ ...prev, characters: next }));
                          }}
                        />
                        {char.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Event Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Event Types</label>
                  <div className="space-y-1">
                    {['scene', 'milestone', 'note', 'custom'].map(type => (
                      <label key={type} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.eventTypes.has(type)}
                          onChange={(e) => {
                            const next = new Set(filters.eventTypes);
                            if (e.target.checked) {
                              next.add(type);
                            } else {
                              next.delete(type);
                            }
                            setFilters(prev => ({ ...prev, eventTypes: next }));
                          }}
                        />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      className="w-full px-2 py-1 border rounded text-sm bg-background"
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        if (date) {
                          setFilters(prev => ({
                            ...prev,
                            dateRange: {
                              start: date,
                              end: prev.dateRange?.end || new Date()
                            }
                          }));
                        }
                      }}
                    />
                    <input
                      type="date"
                      className="w-full px-2 py-1 border rounded text-sm bg-background"
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        if (date) {
                          setFilters(prev => ({
                            ...prev,
                            dateRange: {
                              start: prev.dateRange?.start || new Date(),
                              end: date
                            }
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilters({
                    characters: new Set(),
                    eventTypes: new Set(),
                    dateRange: null
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Body */}
        <div 
          ref={timelineRef}
          className="timeline-body relative overflow-x-auto overflow-y-hidden"
          style={{ height: viewMode.type === 'dual' ? '400px' : '250px' }}
        >
          {viewMode.type === 'dual' && renderDualView()}
          {viewMode.type === 'story' && (
            <TimelineTrack
              events={getFilteredEvents().filter(e => e.timeline === 'story')}
              scenes={scenes}
              scale={scale}
              type="story"
              selectedEvents={selectedEvents}
              playbackPosition={playbackPosition}
              onEventSelect={handleEventSelect}
              onEventEdit={onEventEdit}
              onSceneReorder={onSceneReorder}
            />
          )}
          {viewMode.type === 'narrative' && (
            <TimelineTrack
              events={getFilteredEvents().filter(e => e.timeline === 'narrative')}
              scenes={scenes}
              scale={scale}
              type="narrative"
              selectedEvents={selectedEvents}
              playbackPosition={playbackPosition}
              onEventSelect={handleEventSelect}
              onEventEdit={onEventEdit}
              onSceneReorder={onSceneReorder}
            />
          )}
          {viewMode.type === 'character' && renderCharacterView()}

          {/* Playback Position Indicator */}
          {isPlaying && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none"
              style={{ left: `${playbackPosition}px` }}
            >
              <div className="absolute -top-1 -left-2 w-5 h-5 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Timeline Footer */}
        <div className="timeline-footer border-t p-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{getFilteredEvents().length} events</span>
              <span>{selectedEvents.size} selected</span>
              <span>{scenes.length} scenes total</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-3 w-3" />
              <span>Drag scenes to reorder • Click to select • Double-click to edit</span>
            </div>
          </div>
        </div>
      </Card>
    </DndProvider>
  );
}

export default DualTimeline;