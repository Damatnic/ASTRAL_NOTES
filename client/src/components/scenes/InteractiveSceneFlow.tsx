import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Settings,
  Share2,
  Filter,
  Search,
  Grid3x3,
  List,
  GitBranch,
  Clock,
  Users,
  MapPin,
  Zap,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import type { Scene, Character, PlotThread } from '@/types/story';

interface FlowNode {
  id: string;
  scene: Scene;
  position: { x: number; y: number };
  connections: string[];
  level: number;
  branch: string;
  metadata: {
    tension: number;
    importance: number;
    emotionalIntensity: number;
    pacing: number;
  };
}

interface FlowConnection {
  id: string;
  from: string;
  to: string;
  type: 'sequential' | 'parallel' | 'flashback' | 'foreshadowing' | 'thematic';
  strength: number;
  color: string;
}

export interface InteractiveSceneFlowProps {
  scenes: Scene[];
  characters: Character[];
  plotThreads: PlotThread[];
  selectedSceneId?: string;
  viewMode: 'timeline' | 'narrative' | 'character' | 'theme' | 'tension';
  onSceneSelect?: (sceneId: string) => void;
  onSceneReorder?: (fromIndex: number, toIndex: number) => void;
  onConnectionCreate?: (fromSceneId: string, toSceneId: string, type: string) => void;
  className?: string;
}

const FLOW_LAYOUTS = {
  timeline: {
    name: 'Timeline Flow',
    description: 'Linear progression through story time',
    nodeSpacing: { x: 200, y: 100 },
    direction: 'horizontal'
  },
  narrative: {
    name: 'Narrative Structure',
    description: 'Story beats and dramatic structure',
    nodeSpacing: { x: 180, y: 120 },
    direction: 'diagonal'
  },
  character: {
    name: 'Character Arcs',
    description: 'Character journey visualization',
    nodeSpacing: { x: 150, y: 200 },
    direction: 'vertical'
  },
  theme: {
    name: 'Thematic Threads',
    description: 'Plot threads and theme development',
    nodeSpacing: { x: 160, y: 150 },
    direction: 'radial'
  },
  tension: {
    name: 'Tension Curve',
    description: 'Dramatic tension and conflict resolution',
    nodeSpacing: { x: 180, y: 80 },
    direction: 'curve'
  }
};

const SceneFlowNode: React.FC<{
  node: FlowNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isPlaying: boolean;
  currentTime: number;
  scale: number;
  onSelect: () => void;
  onDrag: (info: PanInfo) => void;
  onConnectionStart: () => void;
}> = ({ 
  node, 
  isSelected, 
  isHighlighted, 
  isPlaying, 
  currentTime, 
  scale,
  onSelect, 
  onDrag,
  onConnectionStart 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const sceneTypeColors = {
    opening: '#10B981',
    inciting: '#F59E0B',
    rising: '#EF4444',
    climax: '#8B5CF6',
    falling: '#3B82F6',
    resolution: '#06B6D4'
  };

  const tensionIntensity = node.metadata.tension / 100;
  const emotionalIntensity = node.metadata.emotionalIntensity / 100;
  const importanceScale = 0.8 + (node.metadata.importance / 100) * 0.4;

  const getSceneType = (scene: Scene): keyof typeof sceneTypeColors => {
    const order = scene.order || 0;
    const totalScenes = 20; // Approximate for demo
    const progress = order / totalScenes;
    
    if (progress < 0.1) return 'opening';
    if (progress < 0.25) return 'inciting';
    if (progress < 0.75) return 'rising';
    if (progress < 0.85) return 'climax';
    if (progress < 0.95) return 'falling';
    return 'resolution';
  };

  const sceneType = getSceneType(node.scene);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        zIndex: isSelected ? 50 : isHighlighted ? 40 : 30
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: importanceScale,
        rotateZ: isSelected ? 5 : 0
      }}
      whileHover={{ scale: importanceScale * 1.1 }}
      whileTap={{ scale: importanceScale * 0.95 }}
      drag
      dragMomentum={false}
      onDrag={(_, info) => onDrag(info)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      onDoubleClick={() => setShowDetails(true)}
    >
      <Card 
        className={cn(
          "relative p-3 min-w-[120px] max-w-[180px] transition-all duration-200 border-2",
          isSelected && "ring-2 ring-blue-400 shadow-lg",
          isHighlighted && "ring-1 ring-yellow-400",
          isHovered && "shadow-md"
        )}
        style={{
          borderColor: sceneTypeColors[sceneType],
          background: `linear-gradient(135deg, ${sceneTypeColors[sceneType]}15, ${sceneTypeColors[sceneType]}05)`
        }}
      >
        {/* Scene Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate">
              {node.scene.title}
            </h4>
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="outline" 
                className="text-xs px-1 py-0"
                style={{ borderColor: sceneTypeColors[sceneType] }}
              >
                {sceneType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                #{node.scene.order}
              </span>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onConnectionStart();
            }}
          >
            <Share2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{node.scene.characters.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{node.scene.locations.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{Math.floor(node.scene.wordCount / 200)}m</span>
          </div>
        </div>

        {/* Tension Indicator */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Tension:</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-300"
                style={{ width: `${tensionIntensity * 100}%` }}
              />
            </div>
            <span className="text-muted-foreground">{Math.round(tensionIntensity * 100)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Impact:</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                style={{ width: `${emotionalIntensity * 100}%` }}
              />
            </div>
            <span className="text-muted-foreground">{Math.round(emotionalIntensity * 100)}</span>
          </div>
        </div>

        {/* Playback Progress */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: currentTime >= node.scene.order ? '100%' : '0%' }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* Connection Points */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-background border-2 border-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-background border-2 border-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </Card>

      {/* Detailed Tooltip */}
      <AnimatePresence>
        {(isHovered || showDetails) && (
          <motion.div
            className="absolute top-full left-0 mt-2 p-3 bg-background border rounded-lg shadow-lg z-50 min-w-[200px]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2 text-xs">
              <div>
                <strong>Summary:</strong> {node.scene.summary || 'No summary available'}
              </div>
              <div>
                <strong>Characters:</strong> {node.scene.characters.join(', ') || 'None'}
              </div>
              <div>
                <strong>Word Count:</strong> {node.scene.wordCount} words
              </div>
              <div>
                <strong>Plot Threads:</strong> {node.scene.plotThreads.join(', ') || 'None'}
              </div>
              {showDetails && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(false)}
                  className="mt-2 w-full"
                >
                  Close
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FlowConnection: React.FC<{
  connection: FlowConnection;
  fromNode: FlowNode;
  toNode: FlowNode;
  isHighlighted: boolean;
  isAnimated: boolean;
  scale: number;
}> = ({ connection, fromNode, toNode, isHighlighted, isAnimated, scale }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const startX = fromNode.position.x + 90; // Center of node
  const startY = fromNode.position.y + 40;
  const endX = toNode.position.x + 90;
  const endY = toNode.position.y + 40;
  
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - 50;
  
  const pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  
  const connectionStyles = {
    sequential: { color: '#3B82F6', dashArray: 'none', width: 2 },
    parallel: { color: '#10B981', dashArray: '5,5', width: 2 },
    flashback: { color: '#F59E0B', dashArray: '10,2,2,2', width: 1.5 },
    foreshadowing: { color: '#8B5CF6', dashArray: '15,5', width: 1.5 },
    thematic: { color: '#EC4899', dashArray: '3,3', width: 1 }
  };
  
  const style = connectionStyles[connection.type];
  
  return (
    <svg 
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: '100%', 
        height: '100%',
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
    >
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={style.color}
            opacity={isHighlighted ? 1 : 0.6}
          />
        </marker>
      </defs>
      
      <motion.path
        d={pathData}
        stroke={style.color}
        strokeWidth={style.width}
        strokeDasharray={style.dashArray}
        fill="none"
        opacity={isHighlighted ? 1 : 0.4}
        markerEnd={`url(#arrowhead-${connection.id})`}
        initial={{ pathLength: 0 }}
        animate={{ 
          pathLength: 1,
          strokeDashoffset: isAnimated ? [0, -20] : 0
        }}
        transition={{ 
          pathLength: { duration: 0.8 },
          strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" }
        }}
      />
    </svg>
  );
};

export const InteractiveSceneFlow: React.FC<InteractiveSceneFlowProps> = ({
  scenes,
  characters,
  plotThreads,
  selectedSceneId,
  viewMode,
  onSceneSelect,
  onSceneReorder,
  onConnectionCreate,
  className
}) => {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [scale, setScale] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCharacter, setFilterCharacter] = useState<string>('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout>();

  // Generate flow layout based on view mode
  const generateLayout = useCallback(() => {
    const layout = FLOW_LAYOUTS[viewMode];
    const newNodes: FlowNode[] = [];
    const newConnections: FlowConnection[] = [];

    scenes.forEach((scene, index) => {
      let position = { x: 0, y: 0 };
      
      switch (viewMode) {
        case 'timeline':
          position = {
            x: index * layout.nodeSpacing.x + 50,
            y: 100 + (scene.metadata?.tension || 0) * 2
          };
          break;
          
        case 'narrative':
          const storyProgress = index / scenes.length;
          const tensionCurve = Math.sin(storyProgress * Math.PI) * 200;
          position = {
            x: index * layout.nodeSpacing.x + 50,
            y: 200 - tensionCurve + (scene.metadata?.tension || 0) * 1.5
          };
          break;
          
        case 'character':
          const mainCharacter = scene.characters[0] || '';
          const charIndex = characters.findIndex(c => c.name === mainCharacter);
          position = {
            x: 100 + (charIndex * layout.nodeSpacing.x),
            y: index * 80 + 50
          };
          break;
          
        case 'theme':
          const plotThread = scene.plotThreads[0] || '';
          const threadIndex = plotThreads.findIndex(pt => pt.name === plotThread);
          const angle = (threadIndex / plotThreads.length) * 2 * Math.PI;
          position = {
            x: 400 + Math.cos(angle) * (100 + index * 10),
            y: 300 + Math.sin(angle) * (100 + index * 10)
          };
          break;
          
        case 'tension':
          position = {
            x: index * layout.nodeSpacing.x + 50,
            y: 300 - (scene.metadata?.tension || 0) * 2
          };
          break;
      }

      const node: FlowNode = {
        id: scene.id,
        scene,
        position,
        connections: scene.dependencies || [],
        level: Math.floor(index / 5),
        branch: scene.plotThreads[0] || 'main',
        metadata: {
          tension: scene.metadata?.tension || 0,
          importance: scene.metadata?.importance || 50,
          emotionalIntensity: scene.metadata?.emotionalIntensity || 0,
          pacing: scene.metadata?.pace || 50
        }
      };

      newNodes.push(node);

      // Create connections
      if (index > 0) {
        newConnections.push({
          id: `${scenes[index - 1].id}-${scene.id}`,
          from: scenes[index - 1].id,
          to: scene.id,
          type: 'sequential',
          strength: 1,
          color: '#3B82F6'
        });
      }

      // Add dependency connections
      scene.dependencies?.forEach(depId => {
        if (scenes.find(s => s.id === depId)) {
          newConnections.push({
            id: `${depId}-${scene.id}-dep`,
            from: depId,
            to: scene.id,
            type: 'thematic',
            strength: 0.7,
            color: '#EC4899'
          });
        }
      });
    });

    setNodes(newNodes);
    setConnections(newConnections);
  }, [scenes, characters, plotThreads, viewMode]);

  useEffect(() => {
    generateLayout();
  }, [generateLayout]);

  // Filter and search functionality
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = !searchTerm || 
      node.scene.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.scene.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCharacter = !filterCharacter || 
      node.scene.characters.includes(filterCharacter);
    
    return matchesSearch && matchesCharacter;
  });

  const handleNodeDrag = (nodeId: string, info: PanInfo) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              position: { 
                x: node.position.x + info.delta.x / scale, 
                y: node.position.y + info.delta.y / scale 
              } 
            }
          : node
      )
    );
  };

  const handlePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    } else {
      setIsPlaying(true);
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= scenes.length) {
            setIsPlaying(false);
            clearInterval(playbackIntervalRef.current!);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(2, prev + delta)));
  };

  const handleReset = () => {
    setScale(1);
    setCurrentTime(0);
    setIsPlaying(false);
    generateLayout();
  };

  return (
    <div className={cn("interactive-scene-flow relative w-full h-full bg-background", className)}>
      {/* Controls Panel */}
      {showControls && (
        <Card className="absolute top-4 left-4 p-4 z-40 space-y-4 max-w-sm">
          {/* Search and Filter */}
          <div className="space-y-2">
            <Input
              placeholder="Search scenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
              icon={<Search className="h-4 w-4" />}
            />
            
            <select
              value={filterCharacter}
              onChange={(e) => setFilterCharacter(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm bg-background"
            >
              <option value="">All Characters</option>
              {characters.map(char => (
                <option key={char.id} value={char.name}>{char.name}</option>
              ))}
            </select>
          </div>

          {/* View Mode Info */}
          <div>
            <h3 className="font-semibold text-sm mb-1">
              {FLOW_LAYOUTS[viewMode].name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {FLOW_LAYOUTS[viewMode].description}
            </p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCurrentTime(0)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handlePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCurrentTime(scenes.length)}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleZoom(-0.1)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-mono">{Math.round(scale * 100)}%</span>
            <Button size="sm" variant="ghost" onClick={() => handleZoom(0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="text-xs space-y-1 pt-2 border-t">
            <div className="flex justify-between">
              <span>Total Scenes:</span>
              <span>{scenes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Filtered:</span>
              <span>{filteredNodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Connections:</span>
              <span>{connections.length}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Toggle Controls Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 z-40"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Flow Canvas */}
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden border rounded-lg bg-gradient-to-br from-background to-muted/20"
        style={{ 
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)` 
        }}
      >
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * scale}px ${40 * scale}px`
          }}
        />

        {/* Connections */}
        {connections.map(connection => {
          const fromNode = nodes.find(n => n.id === connection.from);
          const toNode = nodes.find(n => n.id === connection.to);
          
          if (!fromNode || !toNode) return null;
          
          const isHighlighted = highlightedNodes.has(connection.from) || 
                               highlightedNodes.has(connection.to);
          
          return (
            <FlowConnection
              key={connection.id}
              connection={connection}
              fromNode={fromNode}
              toNode={toNode}
              isHighlighted={isHighlighted}
              isAnimated={isPlaying}
              scale={scale}
            />
          );
        })}

        {/* Scene Nodes */}
        {filteredNodes.map(node => (
          <SceneFlowNode
            key={node.id}
            node={node}
            isSelected={selectedSceneId === node.id}
            isHighlighted={highlightedNodes.has(node.id)}
            isPlaying={isPlaying}
            currentTime={currentTime}
            scale={scale}
            onSelect={() => onSceneSelect?.(node.id)}
            onDrag={(info) => handleNodeDrag(node.id, info)}
            onConnectionStart={() => {
              // Handle connection creation
              console.log('Start connection from', node.id);
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <Card className="absolute bottom-4 right-4 p-3 z-40">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-500 rounded"></div>
            <span>Sequential</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-2 border-dashed border-green-500 rounded"></div>
            <span>Parallel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-2 border-dotted border-pink-500 rounded"></div>
            <span>Thematic</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InteractiveSceneFlow;