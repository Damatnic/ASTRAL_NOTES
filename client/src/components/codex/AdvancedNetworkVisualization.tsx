/**
 * Advanced Network Visualization Component - Phase 1C Feature
 * Interactive relationship mapping with D3.js integration
 * Real-time collaboration, timeline integration, and advanced analytics
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Settings,
  Download,
  Share,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';

import { advancedCodexService } from '@/services/advancedCodexService';
import type {
  AdvancedCodexEntity,
  AdvancedEntityType,
  EntityLink,
  Timeline,
  TimelineEvent
} from '@/types/codex';

// Visualization configuration
export interface VisualizationConfig {
  layout: 'force' | 'hierarchical' | 'circular' | 'cluster' | 'timeline';
  nodeSize: 'uniform' | 'importance' | 'connections';
  edgeStyle: 'straight' | 'curved' | 'bundled';
  colorScheme: 'type' | 'importance' | 'cluster' | 'timeline' | 'custom';
  showLabels: boolean;
  showEdgeLabels: boolean;
  enablePhysics: boolean;
  enableCollision: boolean;
  animationSpeed: number;
  zoomLevel: number;
  centerOnSelection: boolean;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  clusters: NetworkCluster[];
  timeline?: TimelineIntegration;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: AdvancedEntityType;
  size: number;
  color: string;
  importance: number;
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
  entity: AdvancedCodexEntity;
  connections: number;
  clusterId?: string;
  timelinePosition?: number;
  isVisible: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  color: string;
  label?: string;
  bidirectional: boolean;
  isVisible: boolean;
  isHighlighted: boolean;
  path?: string; // SVG path for curved edges
}

export interface NetworkCluster {
  id: string;
  name: string;
  nodes: string[];
  color: string;
  type: 'family' | 'organization' | 'location' | 'theme' | 'subplot' | 'auto';
  position?: { x: number; y: number };
  radius?: number;
}

export interface TimelineIntegration {
  events: TimelineEvent[];
  currentTime: number;
  playbackSpeed: number;
  isPlaying: boolean;
  duration: number;
}

export interface FilterSettings {
  entityTypes: AdvancedEntityType[];
  importanceRange: [number, number];
  connectionRange: [number, number];
  linkTypes: string[];
  clusters: string[];
  timeRange?: [number, number];
  showOrphans: boolean;
  searchQuery: string;
}

interface AdvancedNetworkVisualizationProps {
  projectId: string;
  data?: NetworkData;
  config?: Partial<VisualizationConfig>;
  selectedEntityId?: string;
  onNodeClick?: (node: NetworkNode) => void;
  onNodeDoubleClick?: (node: NetworkNode) => void;
  onEdgeClick?: (edge: NetworkEdge) => void;
  onSelectionChange?: (selectedNodes: NetworkNode[]) => void;
  onConfigChange?: (config: VisualizationConfig) => void;
  enableCollaboration?: boolean;
  enableTimeline?: boolean;
  className?: string;
  height?: number;
  width?: number;
}

const DEFAULT_CONFIG: VisualizationConfig = {
  layout: 'force',
  nodeSize: 'importance',
  edgeStyle: 'curved',
  colorScheme: 'type',
  showLabels: true,
  showEdgeLabels: false,
  enablePhysics: true,
  enableCollision: true,
  animationSpeed: 1,
  zoomLevel: 1,
  centerOnSelection: true
};

const COLOR_SCHEMES = {
  type: {
    character: '#FF6B6B',
    location: '#4ECDC4',
    object: '#45B7D1',
    organization: '#96CEB4',
    lore: '#FFEAA7',
    theme: '#DDA0DD',
    subplot: '#F39C12'
  },
  importance: {
    1: '#E3F2FD',
    2: '#BBDEFB',
    3: '#90CAF9',
    4: '#42A5F5',
    5: '#1976D2'
  }
};

export default function AdvancedNetworkVisualization({
  projectId,
  data: externalData,
  config: externalConfig,
  selectedEntityId,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  onSelectionChange,
  onConfigChange,
  enableCollaboration = true,
  enableTimeline = false,
  className = '',
  height = 600,
  width
}: AdvancedNetworkVisualizationProps) {
  // State management
  const [data, setData] = useState<NetworkData | null>(null);
  const [config, setConfig] = useState<VisualizationConfig>({ ...DEFAULT_CONFIG, ...externalConfig });
  const [filters, setFilters] = useState<FilterSettings>({
    entityTypes: [],
    importanceRange: [1, 5],
    connectionRange: [0, 100],
    linkTypes: [],
    clusters: [],
    showOrphans: true,
    searchQuery: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<NetworkNode[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // D3 references
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkEdge> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  // Timeline state
  const [timelineState, setTimelineState] = useState<TimelineIntegration>({
    events: [],
    currentTime: 0,
    playbackSpeed: 1,
    isPlaying: false,
    duration: 100
  });

  // Dimensions
  const actualWidth = width || (containerRef.current?.clientWidth || 800);
  const actualHeight = isFullscreen ? window.innerHeight - 100 : height;

  // Load data effect
  useEffect(() => {
    if (externalData) {
      setData(externalData);
    } else {
      loadNetworkData();
    }
  }, [projectId, externalData]);

  // Configuration effect
  useEffect(() => {
    if (externalConfig) {
      setConfig(prev => ({ ...prev, ...externalConfig }));
    }
  }, [externalConfig]);

  // Selection effect
  useEffect(() => {
    if (selectedEntityId && data) {
      const node = data.nodes.find(n => n.id === selectedEntityId);
      if (node) {
        setSelectedNodes([node]);
        if (config.centerOnSelection) {
          centerOnNode(node);
        }
      }
    }
  }, [selectedEntityId, data, config.centerOnSelection]);

  // Data loading
  const loadNetworkData = useCallback(async () => {
    setIsLoading(true);
    try {
      const networkData = await advancedCodexService.generateNetworkVisualization(projectId, {
        types: filters.entityTypes.length > 0 ? filters.entityTypes : undefined
      });
      
      // Transform to component format
      const transformedData: NetworkData = {
        nodes: networkData.nodes.map(node => ({
          ...node,
          isVisible: true,
          isSelected: false,
          isHighlighted: false,
          connections: networkData.edges.filter(e => e.source === node.id || e.target === node.id).length
        })),
        edges: networkData.edges.map(edge => ({
          ...edge,
          isVisible: true,
          isHighlighted: false
        })),
        clusters: networkData.clusters
      };
      
      setData(transformedData);
    } catch (error) {
      console.error('Failed to load network data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filters.entityTypes]);

  // D3 visualization setup
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Setup SVG structure
    const g = svg.append('g').attr('class', 'network-container');
    const edgesGroup = g.append('g').attr('class', 'edges');
    const nodesGroup = g.append('g').attr('class', 'nodes');
    const labelsGroup = g.append('g').attr('class', 'labels');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initialize simulation
    const simulation = d3.forceSimulation<NetworkNode>(data.nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkEdge>(data.edges)
        .id((d: any) => d.id)
        .distance((d: any) => 50 + (100 - d.weight) * 2)
        .strength(0.1)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(actualWidth / 2, actualHeight / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5));

    simulationRef.current = simulation;

    // Create edges
    const edges = edgesGroup
      .selectAll('path')
      .data(data.edges.filter(e => e.isVisible))
      .enter()
      .append('path')
      .attr('class', 'edge')
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => Math.max(1, d.weight / 2))
      .attr('fill', 'none')
      .attr('opacity', 0.6)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onEdgeClick?.(d);
      });

    // Create nodes
    const nodes = nodesGroup
      .selectAll('circle')
      .data(data.nodes.filter(n => n.isVisible))
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, NetworkNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeSelection(d, event.shiftKey);
        onNodeClick?.(d);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        onNodeDoubleClick?.(d);
      });

    // Create labels
    const labels = labelsGroup
      .selectAll('text')
      .data(data.nodes.filter(n => n.isVisible && config.showLabels))
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .text(d => d.label);

    // Simulation tick
    simulation.on('tick', () => {
      // Update edge paths
      edges.attr('d', (d: any) => {
        if (config.edgeStyle === 'curved') {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        } else {
          return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        }
      });

      // Update node positions
      nodes
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      // Update label positions
      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y! + d.size + 15);
    });

    return () => {
      simulation.stop();
    };
  }, [data, config, actualWidth, actualHeight]);

  // Node selection handler
  const handleNodeSelection = useCallback((node: NetworkNode, multiSelect = false) => {
    let newSelection: NetworkNode[];
    
    if (multiSelect) {
      const isSelected = selectedNodes.some(n => n.id === node.id);
      if (isSelected) {
        newSelection = selectedNodes.filter(n => n.id !== node.id);
      } else {
        newSelection = [...selectedNodes, node];
      }
    } else {
      newSelection = [node];
    }
    
    setSelectedNodes(newSelection);
    onSelectionChange?.(newSelection);
    
    // Update visual selection
    if (data) {
      const updatedData = {
        ...data,
        nodes: data.nodes.map(n => ({
          ...n,
          isSelected: newSelection.some(selected => selected.id === n.id)
        }))
      };
      setData(updatedData);
    }
  }, [selectedNodes, data, onSelectionChange]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        1.5
      );
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        0.67
      );
    }
  }, []);

  const handleZoomReset = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
    }
  }, []);

  // Center on node
  const centerOnNode = useCallback((node: NetworkNode) => {
    if (svgRef.current && node.x !== undefined && node.y !== undefined) {
      const svg = d3.select(svgRef.current);
      const transform = d3.zoomIdentity
        .translate(actualWidth / 2 - node.x, actualHeight / 2 - node.y)
        .scale(1.5);
      
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        transform
      );
    }
  }, [actualWidth, actualHeight]);

  // Filter application
  const applyFilters = useCallback((newFilters: Partial<FilterSettings>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    if (data) {
      const filteredData = {
        ...data,
        nodes: data.nodes.map(node => ({
          ...node,
          isVisible: shouldNodeBeVisible(node, { ...filters, ...newFilters })
        })),
        edges: data.edges.map(edge => ({
          ...edge,
          isVisible: shouldEdgeBeVisible(edge, data.nodes, { ...filters, ...newFilters })
        }))
      };
      
      setData(filteredData);
    }
  }, [data, filters]);

  // Helper functions
  const shouldNodeBeVisible = (node: NetworkNode, currentFilters: FilterSettings): boolean => {
    if (currentFilters.entityTypes.length > 0 && !currentFilters.entityTypes.includes(node.type)) {
      return false;
    }
    
    if (node.importance < currentFilters.importanceRange[0] || node.importance > currentFilters.importanceRange[1]) {
      return false;
    }
    
    if (node.connections < currentFilters.connectionRange[0] || node.connections > currentFilters.connectionRange[1]) {
      return false;
    }
    
    if (!currentFilters.showOrphans && node.connections === 0) {
      return false;
    }
    
    if (currentFilters.searchQuery && !node.label.toLowerCase().includes(currentFilters.searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  };

  const shouldEdgeBeVisible = (edge: NetworkEdge, nodes: NetworkNode[], currentFilters: FilterSettings): boolean => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode?.isVisible || !targetNode?.isVisible) {
      return false;
    }
    
    if (currentFilters.linkTypes.length > 0 && !currentFilters.linkTypes.includes(edge.type)) {
      return false;
    }
    
    return true;
  };

  // Timeline controls
  const handleTimelinePlay = useCallback(() => {
    setTimelineState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleTimelineStep = useCallback((direction: 'forward' | 'backward') => {
    setTimelineState(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(prev.duration, prev.currentTime + (direction === 'forward' ? 1 : -1)))
    }));
  }, []);

  // Export functionality
  const handleExport = useCallback(async (format: 'png' | 'svg' | 'json') => {
    if (!svgRef.current || !data) return;
    
    switch (format) {
      case 'svg':
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const svgLink = document.createElement('a');
        svgLink.href = svgUrl;
        svgLink.download = `network-${projectId}.svg`;
        svgLink.click();
        break;
        
      case 'png':
        // Convert SVG to canvas and then to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        const svgString = new XMLSerializer().serializeToString(svgRef.current);
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
        
        img.onload = () => {
          canvas.width = actualWidth;
          canvas.height = actualHeight;
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `network-${projectId}.png`;
              link.click();
            }
          });
        };
        img.src = svgDataUrl;
        break;
        
      case 'json':
        const jsonData = JSON.stringify(data, null, 2);
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `network-${projectId}.json`;
        jsonLink.click();
        break;
    }
  }, [data, projectId, actualWidth, actualHeight]);

  // Configuration update
  const updateConfig = useCallback((updates: Partial<VisualizationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [config, onConfigChange]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: actualHeight }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: actualHeight }}>
        <p className="text-gray-500">No network data available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
    >
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-1">
          <Tooltip content="Zoom In">
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Zoom Out">
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Reset View">
            <Button variant="ghost" size="sm" onClick={handleZoomReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Tooltip content="Filters">
            <Button 
              variant={showFilters ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Settings">
            <Button 
              variant={showSettings ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Tooltip content="Export">
            <Button variant="ghost" size="sm" onClick={() => handleExport('png')}>
              <Download className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Fullscreen">
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Timeline Controls */}
      {enableTimeline && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTimelineStep('backward')}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                variant={timelineState.isPlaying ? "default" : "ghost"}
                size="sm"
                onClick={handleTimelinePlay}
              >
                {timelineState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTimelineStep('forward')}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              
              <div className="w-48">
                <Slider
                  value={[timelineState.currentTime]}
                  max={timelineState.duration}
                  step={1}
                  onValueChange={([value]) => 
                    setTimelineState(prev => ({ ...prev, currentTime: value }))
                  }
                />
              </div>
              
              <span className="text-sm font-mono">
                {timelineState.currentTime} / {timelineState.duration}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Panel */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="p-3 bg-white/90 backdrop-blur">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Nodes:</span>
              <span className="font-medium">{data.nodes.filter(n => n.isVisible).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Edges:</span>
              <span className="font-medium">{data.edges.filter(e => e.isVisible).length}</span>
            </div>
            {selectedNodes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Selected:</span>
                <span className="font-medium">{selectedNodes.length}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Main Visualization */}
      <svg
        ref={svgRef}
        width={actualWidth}
        height={actualHeight}
        className="border border-gray-200 bg-gray-50"
        style={{ cursor: 'grab' }}
      />

      {/* Side Panels */}
      {showFilters && (
        <div className="absolute top-16 left-4 z-10 w-80">
          <Card className="p-4 bg-white shadow-lg">
            <h3 className="font-medium mb-4">Filters</h3>
            {/* Filter controls would go here */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Entity Types</label>
                {/* Multi-select for entity types */}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Importance</label>
                <Slider
                  value={filters.importanceRange}
                  max={5}
                  min={1}
                  step={1}
                  onValueChange={(value) => applyFilters({ importanceRange: value as [number, number] })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => applyFilters({ searchQuery: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Search entities..."
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {showSettings && (
        <div className="absolute top-16 right-4 z-10 w-80">
          <Card className="p-4 bg-white shadow-lg">
            <h3 className="font-medium mb-4">Visualization Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Layout</label>
                <Select
                  value={config.layout}
                  onValueChange={(value) => updateConfig({ layout: value as any })}
                >
                  <option value="force">Force-Directed</option>
                  <option value="hierarchical">Hierarchical</option>
                  <option value="circular">Circular</option>
                  <option value="cluster">Clustered</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Node Size</label>
                <Select
                  value={config.nodeSize}
                  onValueChange={(value) => updateConfig({ nodeSize: value as any })}
                >
                  <option value="uniform">Uniform</option>
                  <option value="importance">By Importance</option>
                  <option value="connections">By Connections</option>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Labels</label>
                <button
                  onClick={() => updateConfig({ showLabels: !config.showLabels })}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    className={`${
                      config.showLabels ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Physics</label>
                <button
                  onClick={() => updateConfig({ enablePhysics: !config.enablePhysics })}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    className={`${
                      config.enablePhysics ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}