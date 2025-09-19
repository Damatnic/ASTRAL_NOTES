/**
 * Advanced Timeline View
 * Chronological visualization with dependency chains, milestones, and temporal spacing
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  MapPin,
  Flag,
  Zap,
  ArrowRight,
  Target,
  Timer,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { DraggableSceneItem } from '../advanced-dnd/DraggableSceneItem';
import { useViewMode } from './ViewModeProvider';
import type { Scene, Character, Location, PlotThread } from '@/types/story';

interface TimelineViewProps {
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  plotThreads?: PlotThread[];
  onSceneMove?: (sceneId: string, newPosition: number) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneSelect?: (sceneId: string) => void;
  className?: string;
}

interface TimelineUnit {
  type: 'scene' | 'milestone' | 'break' | 'parallel';
  id: string;
  scene?: Scene;
  milestone?: {
    title: string;
    description: string;
    type: 'plot' | 'character' | 'world';
    importance: 'low' | 'medium' | 'high' | 'critical';
  };
  position: number; // Relative position 0-1
  duration?: number; // In story time (minutes)
  dependencies: string[]; // Scene IDs this depends on
  parallels: string[]; // Scene IDs that happen simultaneously
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'main' | 'subplot' | 'character' | 'world';
  color: string;
  units: TimelineUnit[];
  isVisible: boolean;
  height: number;
}

const TRACK_COLORS = {
  main: '#3B82F6',     // Blue
  subplot: '#8B5CF6',  // Purple
  character: '#10B981', // Green
  world: '#F59E0B'     // Amber
};

const TIMELINE_SCALE_OPTIONS = [
  { value: 'scene', label: 'By Scene', unit: 'scenes' },
  { value: 'chapter', label: 'By Chapter', unit: 'chapters' },
  { value: 'act', label: 'By Act', unit: 'acts' },
  { value: 'time', label: 'Story Time', unit: 'hours' },
  { value: 'word', label: 'Word Count', unit: 'words' }
];

export function TimelineView({
  scenes,
  characters = [],
  locations = [],
  plotThreads = [],
  onSceneMove,
  onSceneEdit,
  onSceneSelect,
  className
}: TimelineViewProps) {
  const { viewState, setZoom, setPan } = useViewMode();
  const [timeScale, setTimeScale] = useState<string>('scene');
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showParallels, setShowParallels] = useState(true);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);

  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<number>();

  // Create timeline tracks from scenes and plot threads
  const tracks = useMemo((): TimelineTrack[] => {
    const mainTrack: TimelineTrack = {
      id: 'main',
      name: 'Main Plot',
      type: 'main',
      color: TRACK_COLORS.main,
      units: scenes.map((scene, index) => ({
        type: 'scene' as const,
        id: scene.id,
        scene,
        position: index / Math.max(scenes.length - 1, 1),
        duration: scene.estimatedReadTime || 10,
        dependencies: scene.dependencies || [],
        parallels: []
      })),
      isVisible: true,
      height: 120
    };

    const subplotTracks: TimelineTrack[] = plotThreads.map(thread => ({
      id: thread.id,
      name: thread.name,
      type: 'subplot',
      color: thread.color || TRACK_COLORS.subplot,
      units: scenes
        .filter(scene => scene.plotThreads?.includes(thread.id))
        .map((scene, index, filteredScenes) => ({
          type: 'scene' as const,
          id: `${thread.id}-${scene.id}`,
          scene,
          position: index / Math.max(filteredScenes.length - 1, 1),
          duration: scene.estimatedReadTime || 10,
          dependencies: scene.dependencies || [],
          parallels: []
        })),
      isVisible: true,
      height: 80
    }));

    const characterTracks: TimelineTrack[] = characters
      .filter(char => char.role === 'protagonist' || char.role === 'antagonist')
      .map(char => ({
        id: `char-${char.id}`,
        name: `${char.name}'s Arc`,
        type: 'character',
        color: TRACK_COLORS.character,
        units: scenes
          .filter(scene => scene.characters?.includes(char.id) || scene.povCharacterId === char.id)
          .map((scene, index, filteredScenes) => ({
            type: 'scene' as const,
            id: `${char.id}-${scene.id}`,
            scene,
            position: index / Math.max(filteredScenes.length - 1, 1),
            duration: scene.estimatedReadTime || 10,
            dependencies: scene.dependencies || [],
            parallels: []
          })),
        isVisible: false, // Hidden by default
        height: 60
      }));

    return [mainTrack, ...subplotTracks, ...characterTracks];
  }, [scenes, plotThreads, characters]);

  // Calculate timeline dimensions and positions
  const timelineMetrics = useMemo(() => {
    const totalDuration = scenes.reduce((sum, scene) => sum + (scene.estimatedReadTime || 10), 0);
    const visibleTracks = tracks.filter(track => track.isVisible);
    const totalHeight = visibleTracks.reduce((sum, track) => sum + track.height + 20, 0);
    const width = Math.max(1200, scenes.length * 150);

    return {
      totalDuration,
      totalHeight,
      width,
      visibleTracks,
      sceneWidth: width / scenes.length,
      trackSpacing: 20
    };
  }, [tracks, scenes]);

  // Generate milestones based on story structure
  const milestones = useMemo(() => {
    const storyMilestones = [];
    const sceneCount = scenes.length;

    if (sceneCount > 0) {
      storyMilestones.push({
        id: 'opening',
        title: 'Opening',
        description: 'Story begins',
        type: 'plot' as const,
        importance: 'critical' as const,
        position: 0
      });

      if (sceneCount > 4) {
        storyMilestones.push({
          id: 'inciting-incident',
          title: 'Inciting Incident',
          description: 'Plot catalyst',
          type: 'plot' as const,
          importance: 'critical' as const,
          position: 0.15
        });
      }

      if (sceneCount > 8) {
        storyMilestones.push({
          id: 'midpoint',
          title: 'Midpoint',
          description: 'Story pivot',
          type: 'plot' as const,
          importance: 'high' as const,
          position: 0.5
        });
      }

      if (sceneCount > 12) {
        storyMilestones.push({
          id: 'climax',
          title: 'Climax',
          description: 'Story climax',
          type: 'plot' as const,
          importance: 'critical' as const,
          position: 0.85
        });
      }

      storyMilestones.push({
        id: 'resolution',
        title: 'Resolution',
        description: 'Story ends',
        type: 'plot' as const,
        importance: 'critical' as const,
        position: 1
      });
    }

    return storyMilestones;
  }, [scenes.length]);

  // Playback animation
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setPlaybackPosition(prev => {
          const next = prev + 0.005;
          return next >= 1 ? 0 : next;
        });
        playbackRef.current = requestAnimationFrame(animate);
      };
      playbackRef.current = requestAnimationFrame(animate);
    } else if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
    }

    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
    };
  }, [isPlaying]);

  const handleToggleTrack = useCallback((trackId: string) => {
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex >= 0) {
      tracks[trackIndex].isVisible = !tracks[trackIndex].isVisible;
      // Force re-render by creating new array
      setSelectedTrack(prev => prev === trackId ? null : prev);
    }
  }, [tracks]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    const currentPan = viewState.panOffset;
    setPan({
      x: currentPan.x + info.delta.x,
      y: currentPan.y + info.delta.y
    });
  }, [viewState.panOffset, setPan]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSceneHover = useCallback((sceneId: string | null) => {
    if (sceneId && showDependencies) {
      const scene = scenes.find(s => s.id === sceneId);
      if (scene?.dependencies) {
        // Highlight dependencies
      }
    }
  }, [scenes, showDependencies]);

  return (
    <div className={cn("timeline-view relative h-full overflow-hidden", className)}>
      {/* Timeline Controls */}
      <Card className="timeline-controls mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline View
              </h3>
              
              <Badge variant="outline">
                {scenes.length} scenes • {timelineMetrics.totalDuration}min read
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Scale Selection */}
              <select
                value={timeScale}
                onChange={(e) => setTimeScale(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                {TIMELINE_SCALE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Playback Controls */}
              <div className="flex items-center gap-1 border rounded">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPlaybackPosition(0)}
                  className="px-2"
                >
                  <SkipBack className="h-3 w-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlayback}
                  className="px-2"
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPlaybackPosition(1)}
                  className="px-2"
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
              </div>

              {/* View Options */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={showDependencies ? 'default' : 'ghost'}
                  onClick={() => setShowDependencies(!showDependencies)}
                  title="Show Dependencies"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant={showMilestones ? 'default' : 'ghost'}
                  onClick={() => setShowMilestones(!showMilestones)}
                  title="Show Milestones"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 relative">
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full relative"
                style={{ width: `${playbackPosition * 100}%` }}
                transition={{ duration: 0.1 }}
              >
                <motion.div
                  className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: timelineMetrics.width }}
                  onDrag={(event, info) => {
                    const newPosition = Math.max(0, Math.min(1, info.point.x / timelineMetrics.width));
                    setPlaybackPosition(newPosition);
                  }}
                />
              </motion.div>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Start</span>
              <span>{Math.round(playbackPosition * 100)}%</span>
              <span>End</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Track Legend */}
      <Card className="track-legend mb-4">
        <CardContent className="py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            {tracks.map(track => (
              <Button
                key={track.id}
                size="sm"
                variant={track.isVisible ? 'default' : 'ghost'}
                onClick={() => handleToggleTrack(track.id)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <span>{track.name}</span>
                <Badge variant="outline" className="text-xs">
                  {track.units.length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Timeline */}
      <Card className="timeline-container flex-1 overflow-hidden">
        <motion.div
          ref={timelineRef}
          className="timeline-content relative"
          style={{
            width: timelineMetrics.width,
            height: timelineMetrics.totalHeight,
            transform: `scale(${viewState.zoomLevel}) translate(${viewState.panOffset.x}px, ${viewState.panOffset.y}px)`
          }}
          onPan={handlePan}
          drag
          dragMomentum={false}
        >
          {/* Milestones */}
          {showMilestones && (
            <div className="milestones absolute inset-0 pointer-events-none">
              {milestones.map(milestone => (
                <motion.div
                  key={milestone.id}
                  className="milestone absolute top-0 bottom-0 flex flex-col items-center"
                  style={{ left: `${milestone.position * 100}%` }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: milestone.position * 0.5 }}
                >
                  <div className="milestone-line w-px bg-border h-full" />
                  <div className={cn(
                    "milestone-marker absolute top-4 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium shadow-md",
                    {
                      'bg-red-500 text-white': milestone.importance === 'critical',
                      'bg-orange-500 text-white': milestone.importance === 'high',
                      'bg-blue-500 text-white': milestone.importance === 'medium',
                      'bg-gray-500 text-white': milestone.importance === 'low'
                    }
                  )}>
                    <Flag className="h-3 w-3 mb-1" />
                    <div className="whitespace-nowrap">{milestone.title}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tracks */}
          <div className="tracks">
            {timelineMetrics.visibleTracks.map((track, trackIndex) => (
              <motion.div
                key={track.id}
                className="track relative mb-4 p-4 border rounded-lg"
                style={{ 
                  height: track.height,
                  borderLeftColor: track.color,
                  borderLeftWidth: '4px'
                }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: trackIndex * 0.1 }}
              >
                {/* Track Header */}
                <div className="track-header absolute left-4 top-2 z-10">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="font-medium text-sm">{track.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {track.units.length}
                    </Badge>
                  </div>
                </div>

                {/* Track Content */}
                <div className="track-content relative mt-8 h-full">
                  {track.units.map((unit, unitIndex) => (
                    <motion.div
                      key={unit.id}
                      className="timeline-unit absolute"
                      style={{
                        left: `${unit.position * 85 + 10}%`,
                        width: `${Math.max(timelineMetrics.sceneWidth - 10, 150)}px`
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (trackIndex * 0.1) + (unitIndex * 0.05) }}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                    >
                      {unit.type === 'scene' && unit.scene && (
                        <DraggableSceneItem
                          scene={unit.scene}
                          characters={characters}
                          locations={locations}
                          index={unitIndex}
                          laneId={track.id}
                          viewMode="compact"
                          onEdit={() => onSceneEdit?.(unit.scene!.id)}
                          onSelect={() => onSceneSelect?.(unit.scene!.id)}
                          className="timeline-scene-card"
                        />
                      )}

                      {/* Duration indicator */}
                      {unit.duration && (
                        <div className="duration-indicator absolute -bottom-2 left-0 right-0 text-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {unit.duration}min
                        </div>
                      )}

                      {/* Dependencies */}
                      {showDependencies && unit.dependencies.length > 0 && (
                        <div className="dependencies absolute -top-2 left-0">
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {unit.dependencies.length}
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Playback Position Indicator */}
          <motion.div
            className="playback-indicator absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-20"
            style={{ left: `${playbackPosition * 100}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isPlaying ? 1 : 0.3 }}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full" />
          </motion.div>
        </motion.div>
      </Card>

      {/* Timeline Statistics */}
      <Card className="timeline-stats mt-4">
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>{scenes.length} scenes</span>
              </div>
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span>{timelineMetrics.totalDuration} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{Math.round(timelineMetrics.totalDuration / scenes.length)} avg per scene</span>
              </div>
            </div>
            
            <div className="text-muted-foreground">
              Viewing: {timeScale} scale • Zoom: {Math.round(viewState.zoomLevel * 100)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TimelineView;