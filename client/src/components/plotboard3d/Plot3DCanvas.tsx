/**
 * Plot3DCanvas Component
 * Revolutionary 3D plotboard with multi-dimensional story visualization
 * Core component for immersive story mapping and scene organization
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, Stats } from '@react-three/drei';
import { Vector3, Color, BufferGeometry, Float32BufferAttribute } from 'three';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Scene3DNode from './Scene3DNode';
import Connection3D from './Connection3D';
import TensionSurface from './TensionSurface';
import CharacterPath from './CharacterPath';
import type { Scene, Character, Story, PlotThread } from '@/types/story';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Settings,
  Eye,
  Layers,
  Sparkles,
  Activity,
  Users,
  Clock,
  Palette,
  Navigation,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
  metadata?: {
    dimension: string;
    scale: number;
    interpolation: 'linear' | 'bezier' | 'spline';
  };
}

export interface DimensionMapping {
  x: 'time' | 'tension' | 'character' | 'location' | 'theme' | 'wordcount' | 'importance';
  y: 'tension' | 'time' | 'character' | 'emotional' | 'pace' | 'complexity' | 'readability';
  z: 'character' | 'location' | 'plotthread' | 'act' | 'theme' | 'mood' | 'conflict';
}

export interface Plot3DCanvasProps {
  story: Story;
  scenes: Scene[];
  characters: Character[];
  plotThreads: PlotThread[];
  dimensions: DimensionMapping;
  viewMode: '3d' | '2d' | 'hybrid' | 'immersive';
  interactionMode: 'explore' | 'edit' | 'connect' | 'analyze' | 'present';
  visualStyle: 'realistic' | 'abstract' | 'crystalline' | 'organic' | 'cyberpunk';
  onSceneSelect?: (sceneId: string) => void;
  onSceneMove?: (sceneId: string, newPosition: Vector3D) => void;
  onConnectionCreate?: (fromSceneId: string, toSceneId: string) => void;
  className?: string;
}

interface PlotboardSettings {
  showGrid: boolean;
  showConnections: boolean;
  showPaths: boolean;
  showTensionSurface: boolean;
  showLabels: boolean;
  enablePhysics: boolean;
  ambientLighting: number;
  directionalLighting: number;
  fogDensity: number;
  particleEffects: boolean;
  animationSpeed: number;
}

interface CameraPreset {
  name: string;
  position: Vector3D;
  target: Vector3D;
  fov: number;
  description: string;
}

const CAMERA_PRESETS: CameraPreset[] = [
  {
    name: 'Director\'s View',
    position: { x: 0, y: 15, z: 20 },
    target: { x: 0, y: 0, z: 0 },
    fov: 75,
    description: 'Overview of entire story structure'
  },
  {
    name: 'Character Focus',
    position: { x: 10, y: 5, z: 10 },
    target: { x: 0, y: 2, z: 0 },
    fov: 60,
    description: 'Focus on character relationships and arcs'
  },
  {
    name: 'Timeline Flow',
    position: { x: -15, y: 8, z: 0 },
    target: { x: 10, y: 0, z: 0 },
    fov: 90,
    description: 'Follow the temporal flow of scenes'
  },
  {
    name: 'Tension Analysis',
    position: { x: 0, y: 25, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    fov: 45,
    description: 'Top-down view for tension heatmap analysis'
  },
  {
    name: 'Immersive Walk',
    position: { x: 2, y: 3, z: 5 },
    target: { x: 0, y: 2, z: 0 },
    fov: 100,
    description: 'First-person perspective through the story'
  }
];

const VISUAL_STYLES = {
  realistic: {
    background: '#87CEEB',
    gridColor: '#FFFFFF',
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    fogColor: '#87CEEB',
    materials: 'standard'
  },
  abstract: {
    background: '#1a1a2e',
    gridColor: '#16213e',
    ambientIntensity: 0.4,
    directionalIntensity: 1.0,
    fogColor: '#1a1a2e',
    materials: 'neon'
  },
  crystalline: {
    background: '#f0f8ff',
    gridColor: '#e6f3ff',
    ambientIntensity: 0.7,
    directionalIntensity: 0.6,
    fogColor: '#f0f8ff',
    materials: 'crystal'
  },
  organic: {
    background: '#2d5016',
    gridColor: '#4a7c1c',
    ambientIntensity: 0.5,
    directionalIntensity: 0.9,
    fogColor: '#2d5016',
    materials: 'organic'
  },
  cyberpunk: {
    background: '#0a0a0a',
    gridColor: '#ff00ff',
    ambientIntensity: 0.3,
    directionalIntensity: 1.2,
    fogColor: '#0a0a0a',
    materials: 'holographic'
  }
};

export function Plot3DCanvas({
  story,
  scenes,
  characters,
  plotThreads,
  dimensions,
  viewMode,
  interactionMode,
  visualStyle,
  onSceneSelect,
  onSceneMove,
  onConnectionCreate,
  className
}: Plot3DCanvasProps) {
  const [settings, setSettings] = useState<PlotboardSettings>({
    showGrid: true,
    showConnections: true,
    showPaths: true,
    showTensionSurface: false,
    showLabels: true,
    enablePhysics: false,
    ambientLighting: 0.6,
    directionalLighting: 0.8,
    fogDensity: 0.1,
    particleEffects: true,
    animationSpeed: 1.0
  });

  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>(CAMERA_PRESETS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);

  // Calculate 3D positions for scenes based on dimension mapping
  const scene3DPositions = useMemo(() => {
    const positions = new Map<string, Vector3D>();
    
    if (scenes.length === 0) return positions;

    // Get value range for each dimension
    const getValueForDimension = (scene: Scene, dimension: string): number => {
      switch (dimension) {
        case 'time':
          return scene.order || 0;
        case 'tension':
          return scene.metadata?.tension || 0;
        case 'character':
          return scene.characters.length;
        case 'location':
          return scene.locations.length;
        case 'theme':
          return scene.plotThreads.length;
        case 'wordcount':
          return scene.wordCount;
        case 'importance':
          return scene.metadata?.importance || 1;
        case 'emotional':
          return scene.metadata?.emotionalIntensity || 0;
        case 'pace':
          return scene.metadata?.pace || 50;
        case 'complexity':
          return scene.metadata?.complexity || 50;
        case 'readability':
          return scene.metadata?.readability || 50;
        case 'plotthread':
          return scene.plotThreads.length;
        case 'act':
          return scene.actId ? parseInt(scene.actId.split('-').pop() || '0') : 0;
        case 'mood':
          return scene.metadata?.mood || 0;
        case 'conflict':
          return scene.conflicts?.length || 0;
        default:
          return 0;
      }
    };

    // Calculate ranges for normalization
    const xValues = scenes.map(s => getValueForDimension(s, dimensions.x));
    const yValues = scenes.map(s => getValueForDimension(s, dimensions.y));
    const zValues = scenes.map(s => getValueForDimension(s, dimensions.z));

    const xRange = { min: Math.min(...xValues), max: Math.max(...xValues) };
    const yRange = { min: Math.min(...yValues), max: Math.max(...yValues) };
    const zRange = { min: Math.min(...zValues), max: Math.max(...zValues) };

    // Normalize and position scenes
    scenes.forEach(scene => {
      const xValue = getValueForDimension(scene, dimensions.x);
      const yValue = getValueForDimension(scene, dimensions.y);
      const zValue = getValueForDimension(scene, dimensions.z);

      const x = xRange.max > xRange.min 
        ? ((xValue - xRange.min) / (xRange.max - xRange.min)) * 20 - 10
        : 0;
      const y = yRange.max > yRange.min 
        ? ((yValue - yRange.min) / (yRange.max - yRange.min)) * 15 - 7.5
        : 0;
      const z = zRange.max > zRange.min 
        ? ((zValue - zRange.min) / (zRange.max - zRange.min)) * 20 - 10
        : 0;

      positions.set(scene.id, {
        x,
        y,
        z,
        metadata: {
          dimension: `${dimensions.x}-${dimensions.y}-${dimensions.z}`,
          scale: 1,
          interpolation: 'linear'
        }
      });
    });

    return positions;
  }, [scenes, dimensions]);

  // Generate connections between scenes
  const connections = useMemo(() => {
    const conns: Array<{ from: string; to: string; type: string; strength: number }> = [];
    
    scenes.forEach(scene => {
      // Add dependency connections
      scene.dependencies?.forEach(depId => {
        conns.push({
          from: depId,
          to: scene.id,
          type: 'dependency',
          strength: 0.8
        });
      });

      // Add plot thread connections
      scenes.forEach(otherScene => {
        if (scene.id !== otherScene.id) {
          const sharedThreads = scene.plotThreads.filter(t => 
            otherScene.plotThreads.includes(t)
          ).length;
          
          if (sharedThreads > 0) {
            conns.push({
              from: scene.id,
              to: otherScene.id,
              type: 'plotthread',
              strength: sharedThreads * 0.3
            });
          }
        }
      });
    });

    return conns;
  }, [scenes]);

  const handleSceneClick = (sceneId: string) => {
    setSelectedScene(sceneId === selectedScene ? null : sceneId);
    onSceneSelect?.(sceneId);
  };

  const handleCameraPreset = (preset: CameraPreset) => {
    setCurrentPreset(preset);
    if (controlsRef.current) {
      // Animate camera to new position
      controlsRef.current.setLookAt(
        preset.position.x, preset.position.y, preset.position.z,
        preset.target.x, preset.target.y, preset.target.z,
        true
      );
    }
  };

  const handlePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Style configuration
  const styleConfig = VISUAL_STYLES[visualStyle];

  return (
    <div className={cn("plot3d-canvas relative w-full h-full", className)}>
      {/* 3D Canvas */}
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border">
        <Canvas
          ref={canvasRef}
          dpr={[1, 2]}
          camera={{ 
            position: [currentPreset.position.x, currentPreset.position.y, currentPreset.position.z],
            fov: currentPreset.fov 
          }}
          style={{ background: styleConfig.background }}
        >
          {/* Lighting */}
          <ambientLight intensity={settings.ambientLighting} />
          <directionalLight 
            intensity={settings.directionalLighting}
            position={[10, 10, 5]}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />

          {/* Environment */}
          <fog attach="fog" args={[styleConfig.fogColor, 30, 100]} />
          
          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI}
            target={[currentPreset.target.x, currentPreset.target.y, currentPreset.target.z]}
          />

          {/* Grid */}
          {settings.showGrid && (
            <Grid
              cellSize={2}
              cellThickness={0.5}
              cellColor={styleConfig.gridColor}
              sectionSize={10}
              sectionThickness={1}
              sectionColor={styleConfig.gridColor}
              fadeDistance={50}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
            />
          )}

          {/* Tension Surface */}
          {settings.showTensionSurface && (
            <TensionSurface 
              scenes={scenes}
              positions={scene3DPositions}
              visualStyle={visualStyle}
            />
          )}

          {/* Scene Nodes */}
          {scenes.map(scene => {
            const position = scene3DPositions.get(scene.id);
            if (!position) return null;

            return (
              <Scene3DNode
                key={scene.id}
                scene={scene}
                position={position}
                isSelected={selectedScene === scene.id}
                visualStyle={visualStyle}
                showLabels={settings.showLabels}
                animationSpeed={settings.animationSpeed}
                onClick={handleSceneClick}
                onPositionChange={(newPos) => onSceneMove?.(scene.id, newPos)}
              />
            );
          })}

          {/* Connections */}
          {settings.showConnections && connections.map((conn, index) => {
            const fromPos = scene3DPositions.get(conn.from);
            const toPos = scene3DPositions.get(conn.to);
            if (!fromPos || !toPos) return null;

            return (
              <Connection3D
                key={`${conn.from}-${conn.to}-${index}`}
                from={fromPos}
                to={toPos}
                type={conn.type}
                strength={conn.strength}
                visualStyle={visualStyle}
                animated={isPlaying}
              />
            );
          })}

          {/* Character Paths */}
          {settings.showPaths && selectedCharacter && (
            <CharacterPath
              characterId={selectedCharacter}
              scenes={scenes}
              positions={scene3DPositions}
              visualStyle={visualStyle}
              animated={isPlaying}
            />
          )}

          {/* Performance Stats */}
          {process.env.NODE_ENV === 'development' && <Stats />}
        </Canvas>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <Card className="absolute top-4 left-4 p-4 space-y-4 max-w-sm">
          {/* View Mode Selector */}
          <div>
            <h3 className="font-semibold mb-2">Camera Presets</h3>
            <div className="grid grid-cols-1 gap-1">
              {CAMERA_PRESETS.map(preset => (
                <Button
                  key={preset.name}
                  size="sm"
                  variant={currentPreset.name === preset.name ? 'default' : 'ghost'}
                  onClick={() => handleCameraPreset(preset)}
                  className="justify-start text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Dimension Mapping */}
          <div>
            <h3 className="font-semibold mb-2">Dimensions</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-red-500">X-Axis:</span>
                <Badge variant="outline">{dimensions.x}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500">Y-Axis:</span>
                <Badge variant="outline">{dimensions.y}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-500">Z-Axis:</span>
                <Badge variant="outline">{dimensions.z}</Badge>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div>
            <h3 className="font-semibold mb-2">Playback</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPlaybackTime(0)}>
                <SkipBack className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handlePlayback}>
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button size="sm" variant="ghost">
                <SkipForward className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Character Filter */}
          <div>
            <h3 className="font-semibold mb-2">Focus Character</h3>
            <select
              value={selectedCharacter || ''}
              onChange={(e) => setSelectedCharacter(e.target.value || null)}
              className="w-full px-2 py-1 border rounded text-xs bg-background"
            >
              <option value="">All Characters</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>

          {/* Settings Toggles */}
          <div>
            <h3 className="font-semibold mb-2">Display</h3>
            <div className="space-y-2">
              {Object.entries(settings).slice(0, 6).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                  />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Scene Information Panel */}
      {selectedScene && (
        <Card className="absolute bottom-4 right-4 p-4 max-w-md">
          <h3 className="font-semibold mb-2">
            {scenes.find(s => s.id === selectedScene)?.title}
          </h3>
          <div className="text-sm space-y-1">
            <p>Position: {JSON.stringify(scene3DPositions.get(selectedScene))}</p>
            <p>Characters: {scenes.find(s => s.id === selectedScene)?.characters.length}</p>
            <p>Word Count: {scenes.find(s => s.id === selectedScene)?.wordCount}</p>
          </div>
        </Card>
      )}

      {/* Toggle Controls Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default Plot3DCanvas;