/**
 * Visual Plotboard Component
 * Advanced scene arrangement with subplot lanes and visual story structure
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Grid,
  Plus,
  Layers,
  GitBranch,
  Activity,
  Zap,
  Users,
  Target,
  Flag,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Filter,
  Eye,
  EyeOff,
  Settings,
  Download,
  Upload,
  Palette,
  Link2,
  ArrowRight,
  BarChart3,
  Clock,
  MapPin,
  User,
  Hash,
  Sparkles,
  TrendingUp,
  Circle,
  Square as SquareIcon
} from 'lucide-react';
import { PlotboardLane } from './PlotboardLane';
import { PlotboardScene } from './PlotboardScene';
import { PlotboardConnections } from './PlotboardConnections';
import type { Scene, PlotThread, Character, Story } from '@/types/story';

interface VisualPlotboardProps {
  story: Story;
  scenes: Scene[];
  plotThreads: PlotThread[];
  characters: Character[];
  onSceneMove?: (sceneId: string, laneId: string, position: number) => void;
  onSceneEdit?: (sceneId: string) => void;
  onLaneCreate?: (lane: PlotLane) => void;
  onLaneEdit?: (laneId: string, updates: Partial<PlotLane>) => void;
  onConnectionCreate?: (fromId: string, toId: string, type: ConnectionType) => void;
  className?: string;
}

export interface PlotLane {
  id: string;
  title: string;
  type: 'main' | 'subplot' | 'character' | 'theme' | 'custom';
  color: string;
  description?: string;
  scenes: Scene[];
  isExpanded: boolean;
  order: number;
}

export interface SceneConnection {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  type: ConnectionType;
  label?: string;
  strength: 'weak' | 'medium' | 'strong';
}

export type ConnectionType = 
  | 'causal' // One scene causes another
  | 'thematic' // Scenes share themes
  | 'character' // Character development connection
  | 'parallel' // Scenes happen simultaneously
  | 'callback' // Reference to earlier scene
  | 'foreshadowing'; // Setup and payoff

const LANE_COLORS = {
  main: '#3B82F6', // Blue
  subplot: '#8B5CF6', // Purple
  character: '#10B981', // Green
  theme: '#F59E0B', // Amber
  custom: '#6B7280' // Gray
};

const CONNECTION_COLORS = {
  causal: '#EF4444', // Red
  thematic: '#8B5CF6', // Purple
  character: '#10B981', // Green
  parallel: '#F59E0B', // Amber
  callback: '#3B82F6', // Blue
  foreshadowing: '#EC4899' // Pink
};

export function VisualPlotboard({
  story,
  scenes,
  plotThreads,
  characters,
  onSceneMove,
  onSceneEdit,
  onLaneCreate,
  onLaneEdit,
  onConnectionCreate,
  className
}: VisualPlotboardProps) {
  const [lanes, setLanes] = useState<PlotLane[]>([]);
  const [connections, setConnections] = useState<SceneConnection[]>([]);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'timeline'>('detailed');
  const [showConnections, setShowConnections] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [highlightedConnections, setHighlightedConnections] = useState<Set<string>>(new Set());
  
  const boardRef = useRef<HTMLDivElement>(null);

  // Initialize lanes from plot threads
  useEffect(() => {
    initializeLanes();
  }, [plotThreads, scenes]);

  const initializeLanes = () => {
    // Create main plot lane
    const mainLane: PlotLane = {
      id: 'main-plot',
      title: 'Main Plot',
      type: 'main',
      color: LANE_COLORS.main,
      description: 'The primary storyline',
      scenes: scenes.filter(scene => !scene.plotThreadId || scene.plotThreadId === 'main'),
      isExpanded: true,
      order: 0
    };

    // Create subplot lanes from plot threads
    const subplotLanes: PlotLane[] = plotThreads.map((thread, index) => ({
      id: thread.id,
      title: thread.title,
      type: 'subplot',
      color: thread.color || LANE_COLORS.subplot,
      description: thread.description,
      scenes: scenes.filter(scene => scene.plotThreadId === thread.id),
      isExpanded: true,
      order: index + 1
    }));

    // Create character arc lanes for main characters
    const characterLanes: PlotLane[] = characters
      .filter(char => char.role === 'protagonist' || char.role === 'antagonist')
      .map((char, index) => ({
        id: `char-${char.id}`,
        title: `${char.name}'s Arc`,
        type: 'character',
        color: LANE_COLORS.character,
        description: `Character development for ${char.name}`,
        scenes: scenes.filter(scene => 
          scene.characters?.includes(char.id) || scene.povCharacterId === char.id
        ),
        isExpanded: false,
        order: plotThreads.length + index + 1
      }));

    setLanes([mainLane, ...subplotLanes, ...characterLanes]);
  };

  const handleSceneDrag = useCallback((sceneId: string, sourceLaneId: string, targetLaneId: string, position: number) => {
    if (sourceLaneId === targetLaneId) {
      // Reordering within the same lane
      setLanes(prev => prev.map(lane => {
        if (lane.id === sourceLaneId) {
          const newScenes = [...lane.scenes];
          const sceneIndex = newScenes.findIndex(s => s.id === sceneId);
          const [scene] = newScenes.splice(sceneIndex, 1);
          newScenes.splice(position, 0, scene);
          return { ...lane, scenes: newScenes };
        }
        return lane;
      }));
    } else {
      // Moving between lanes
      setLanes(prev => {
        const newLanes = [...prev];
        const sourceIndex = newLanes.findIndex(l => l.id === sourceLaneId);
        const targetIndex = newLanes.findIndex(l => l.id === targetLaneId);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          const scene = newLanes[sourceIndex].scenes.find(s => s.id === sceneId);
          if (scene) {
            // Remove from source
            newLanes[sourceIndex] = {
              ...newLanes[sourceIndex],
              scenes: newLanes[sourceIndex].scenes.filter(s => s.id !== sceneId)
            };
            // Add to target
            const targetScenes = [...newLanes[targetIndex].scenes];
            targetScenes.splice(position, 0, scene);
            newLanes[targetIndex] = {
              ...newLanes[targetIndex],
              scenes: targetScenes
            };
          }
        }
        return newLanes;
      });
    }

    onSceneMove?.(sceneId, targetLaneId, position);
  }, [onSceneMove]);

  const handleCreateLane = () => {
    const newLane: PlotLane = {
      id: `lane-${Date.now()}`,
      title: 'New Subplot',
      type: 'subplot',
      color: LANE_COLORS.subplot,
      scenes: [],
      isExpanded: true,
      order: lanes.length
    };
    setLanes([...lanes, newLane]);
    onLaneCreate?.(newLane);
  };

  const handleToggleLane = (laneId: string) => {
    setLanes(prev => prev.map(lane => 
      lane.id === laneId ? { ...lane, isExpanded: !lane.isExpanded } : lane
    ));
  };

  const handleCreateConnection = (fromId: string, toId: string, type: ConnectionType) => {
    const newConnection: SceneConnection = {
      id: `conn-${Date.now()}`,
      fromSceneId: fromId,
      toSceneId: toId,
      type,
      strength: 'medium'
    };
    setConnections([...connections, newConnection]);
    onConnectionCreate?.(fromId, toId, type);
  };

  const handleSceneClick = (sceneId: string) => {
    if (isCreatingConnection) {
      if (!connectionStart) {
        setConnectionStart(sceneId);
      } else if (connectionStart !== sceneId) {
        // Create connection
        handleCreateConnection(connectionStart, sceneId, 'causal');
        setConnectionStart(null);
        setIsCreatingConnection(false);
      }
    } else {
      setSelectedScene(sceneId === selectedScene ? null : sceneId);
      
      // Highlight related connections
      const related = connections.filter(conn => 
        conn.fromSceneId === sceneId || conn.toSceneId === sceneId
      );
      setHighlightedConnections(new Set(related.map(c => c.id)));
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Calculate board dimensions based on content
  const boardDimensions = {
    width: Math.max(...lanes.map(lane => lane.scenes.length)) * 200 + 100,
    height: lanes.filter(l => l.isExpanded).length * 200 + 100
  };

  // Calculate statistics
  const stats = {
    totalScenes: scenes.length,
    totalLanes: lanes.length,
    totalConnections: connections.length,
    averageScenesPerLane: Math.round(scenes.length / lanes.length),
    mainPlotScenes: lanes.find(l => l.type === 'main')?.scenes.length || 0,
    subplotScenes: scenes.length - (lanes.find(l => l.type === 'main')?.scenes.length || 0)
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn("visual-plotboard", className)}>
        {/* Header Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Grid className="h-5 w-5" />
                Visual Plotboard
                <Badge variant="outline" className="ml-2">
                  {stats.totalScenes} scenes
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                {/* View Mode */}
                <div className="flex items-center border rounded-md">
                  <Button
                    size="sm"
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('compact')}
                    className="rounded-r-none border-r"
                  >
                    Compact
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('detailed')}
                    className="rounded-none border-r"
                  >
                    Detailed
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('timeline')}
                    className="rounded-l-none"
                  >
                    Timeline
                  </Button>
                </div>

                {/* Visibility Controls */}
                <Button
                  size="sm"
                  variant={showConnections ? 'default' : 'ghost'}
                  onClick={() => setShowConnections(!showConnections)}
                  title="Toggle Connections"
                >
                  <Link2 className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant={showLabels ? 'default' : 'ghost'}
                  onClick={() => setShowLabels(!showLabels)}
                  title="Toggle Labels"
                >
                  <Hash className="h-4 w-4" />
                </Button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleZoom(-0.1)}
                    className="p-1"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <span className="text-xs px-2">{Math.round(zoomLevel * 100)}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleZoom(0.1)}
                    className="p-1"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Actions */}
                <Button
                  size="sm"
                  variant={isCreatingConnection ? 'default' : 'outline'}
                  onClick={() => {
                    setIsCreatingConnection(!isCreatingConnection);
                    setConnectionStart(null);
                  }}
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  Connect
                </Button>

                <Button
                  size="sm"
                  onClick={handleCreateLane}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Lane
                </Button>
              </div>
            </div>

            {/* Statistics Bar */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {stats.totalLanes} lanes
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                {stats.mainPlotScenes} main / {stats.subplotScenes} subplot
              </div>
              <div className="flex items-center gap-1">
                <Link2 className="h-4 w-4" />
                {stats.totalConnections} connections
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                {stats.averageScenesPerLane} avg scenes/lane
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Plotboard */}
        <Card className="overflow-hidden">
          <div 
            ref={boardRef}
            className="plotboard-container relative overflow-auto"
            style={{
              maxHeight: '70vh',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left'
            }}
          >
            <div 
              className="plotboard-content relative"
              style={{
                width: `${boardDimensions.width}px`,
                minHeight: `${boardDimensions.height}px`
              }}
            >
              {/* Connections Layer */}
              {showConnections && (
                <PlotboardConnections
                  connections={connections}
                  lanes={lanes}
                  highlightedConnections={highlightedConnections}
                  connectionColors={CONNECTION_COLORS}
                />
              )}

              {/* Lanes */}
              <div className="lanes-container space-y-4 p-4">
                {lanes.map((lane, index) => (
                  <PlotboardLane
                    key={lane.id}
                    lane={lane}
                    index={index}
                    viewMode={viewMode}
                    showLabels={showLabels}
                    isSelected={selectedLane === lane.id}
                    onToggle={() => handleToggleLane(lane.id)}
                    onSelect={() => setSelectedLane(lane.id === selectedLane ? null : lane.id)}
                    onSceneClick={handleSceneClick}
                    onSceneDrag={handleSceneDrag}
                    onSceneEdit={onSceneEdit}
                    selectedScene={selectedScene}
                    connectionStart={connectionStart}
                    isCreatingConnection={isCreatingConnection}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Connection Legend */}
        {showConnections && (
          <Card className="mt-4">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Connection Types:</div>
                <div className="flex items-center gap-4">
                  {Object.entries(CONNECTION_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating Connection Tooltip */}
        {isCreatingConnection && connectionStart && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <Card className="shadow-lg">
              <CardContent className="py-2 px-4">
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-cosmic-500 animate-pulse" />
                  <span>Click another scene to create connection</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingConnection(false);
                      setConnectionStart(null);
                    }}
                    className="ml-2 p-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default VisualPlotboard;