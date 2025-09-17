/**
 * Plotboard Connections Component
 * Renders connection lines between related scenes
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import type { SceneConnection } from './VisualPlotboard';

interface PlotboardConnectionsProps {
  connections: SceneConnection[];
  containerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

export function PlotboardConnections({
  connections,
  containerRef,
  zoom = 1,
  className
}: PlotboardConnectionsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [paths, setPaths] = useState<Array<{
    id: string;
    path: string;
    color: string;
    type: string;
    label?: string;
    midpoint: Point;
  }>>([]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    calculatePaths();
  }, [connections, dimensions, zoom]);

  const updateDimensions = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  };

  const getConnectionColor = (type: SceneConnection['type']): string => {
    const colors = {
      causal: '#ff6b6b',      // Red - cause and effect
      thematic: '#4ecdc4',    // Teal - thematic connections
      character: '#45b7d1',   // Blue - character development
      parallel: '#96ceb4',    // Green - parallel storylines
      callback: '#feca57',    // Yellow - callbacks/references
      foreshadowing: '#a55eea', // Purple - foreshadowing
      conflict: '#ff6348',    // Orange - conflict escalation
      resolution: '#00d2d3'   // Cyan - resolution
    };
    return colors[type] || '#666';
  };

  const getConnectionStyle = (type: SceneConnection['type']): string => {
    // Return different stroke patterns for different connection types
    switch (type) {
      case 'foreshadowing':
        return '5,5'; // Dashed
      case 'parallel':
        return '10,5'; // Long dash
      case 'callback':
        return '2,2'; // Dotted
      default:
        return ''; // Solid
    }
  };

  const calculatePaths = () => {
    if (!containerRef.current) return;

    const newPaths = connections.map(connection => {
      const fromElement = containerRef.current?.querySelector(
        `[data-scene-id="${connection.fromId}"]`
      ) as HTMLElement;
      const toElement = containerRef.current?.querySelector(
        `[data-scene-id="${connection.toId}"]`
      ) as HTMLElement;

      if (!fromElement || !toElement) {
        return null;
      }

      const containerRect = containerRef.current!.getBoundingClientRect();
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      // Calculate connection points
      const fromPoint: Point = {
        x: (fromRect.left + fromRect.right) / 2 - containerRect.left,
        y: (fromRect.top + fromRect.bottom) / 2 - containerRect.top
      };

      const toPoint: Point = {
        x: (toRect.left + toRect.right) / 2 - containerRect.left,
        y: (toRect.top + toRect.bottom) / 2 - containerRect.top
      };

      // Apply zoom
      fromPoint.x /= zoom;
      fromPoint.y /= zoom;
      toPoint.x /= zoom;
      toPoint.y /= zoom;

      // Calculate control points for curved path
      const dx = toPoint.x - fromPoint.x;
      const dy = toPoint.y - fromPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Adjust curve based on connection type
      let curveOffset = distance * 0.2;
      if (connection.type === 'parallel') {
        curveOffset = 0; // Straight line for parallel connections
      } else if (connection.type === 'callback') {
        curveOffset = distance * 0.4; // More curved for callbacks
      }

      // Control points for cubic bezier curve
      const cp1: Point = {
        x: fromPoint.x + dx * 0.3,
        y: fromPoint.y + curveOffset
      };

      const cp2: Point = {
        x: toPoint.x - dx * 0.3,
        y: toPoint.y + curveOffset
      };

      // Calculate midpoint for label
      const t = 0.5;
      const midpoint: Point = {
        x: Math.pow(1 - t, 3) * fromPoint.x + 
           3 * Math.pow(1 - t, 2) * t * cp1.x + 
           3 * (1 - t) * Math.pow(t, 2) * cp2.x + 
           Math.pow(t, 3) * toPoint.x,
        y: Math.pow(1 - t, 3) * fromPoint.y + 
           3 * Math.pow(1 - t, 2) * t * cp1.y + 
           3 * (1 - t) * Math.pow(t, 2) * cp2.y + 
           Math.pow(t, 3) * toPoint.y
      };

      // Create SVG path
      const path = `M ${fromPoint.x},${fromPoint.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${toPoint.x},${toPoint.y}`;

      return {
        id: connection.id,
        path,
        color: getConnectionColor(connection.type),
        type: connection.type,
        label: connection.label,
        midpoint
      };
    }).filter(Boolean) as typeof paths;

    setPaths(newPaths);
  };

  const getArrowMarker = (color: string, type: string) => {
    const markerId = `arrow-${type}-${color.replace('#', '')}`;
    return (
      <defs key={markerId}>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={color}
            opacity={0.8}
          />
        </marker>
      </defs>
    );
  };

  return (
    <svg
      ref={svgRef}
      className={cn(
        "plotboard-connections absolute inset-0 pointer-events-none",
        className
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left'
      }}
    >
      {/* Define arrow markers */}
      {paths.map(p => getArrowMarker(p.color, p.type))}

      {/* Render connection paths */}
      <g className="connections">
        {paths.map(pathData => (
          <g key={pathData.id} className="connection-group">
            {/* Shadow path for better visibility */}
            <path
              d={pathData.path}
              fill="none"
              stroke="white"
              strokeWidth={4}
              opacity={0.5}
              className="connection-shadow"
            />
            
            {/* Main connection path */}
            <path
              d={pathData.path}
              fill="none"
              stroke={pathData.color}
              strokeWidth={2}
              strokeDasharray={getConnectionStyle(pathData.type)}
              markerEnd={`url(#arrow-${pathData.type}-${pathData.color.replace('#', '')})`}
              className="connection-line"
              opacity={0.7}
            />

            {/* Connection label */}
            {pathData.label && (
              <g transform={`translate(${pathData.midpoint.x}, ${pathData.midpoint.y})`}>
                <rect
                  x={-30}
                  y={-10}
                  width={60}
                  height={20}
                  fill="white"
                  stroke={pathData.color}
                  strokeWidth={1}
                  rx={4}
                  opacity={0.9}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  className="text-xs fill-current"
                  fill={pathData.color}
                >
                  {pathData.label}
                </text>
              </g>
            )}

            {/* Interactive hover area */}
            <path
              d={pathData.path}
              fill="none"
              stroke="transparent"
              strokeWidth={10}
              className="connection-hover pointer-events-auto cursor-pointer"
              onClick={() => console.log('Connection clicked:', pathData)}
            />
          </g>
        ))}
      </g>

      {/* Legend */}
      <g transform={`translate(20, ${dimensions.height - 150})`} className="legend">
        <rect
          x={0}
          y={0}
          width={150}
          height={130}
          fill="white"
          stroke="#e0e0e0"
          strokeWidth={1}
          rx={4}
          opacity={0.9}
        />
        <text x={10} y={20} className="text-sm font-semibold">
          Connection Types
        </text>
        {Object.entries({
          causal: 'Cause & Effect',
          thematic: 'Thematic',
          character: 'Character Arc',
          parallel: 'Parallel',
          callback: 'Callback',
          foreshadowing: 'Foreshadowing'
        }).map(([type, label], index) => (
          <g key={type} transform={`translate(10, ${35 + index * 15})`}>
            <line
              x1={0}
              y1={5}
              x2={20}
              y2={5}
              stroke={getConnectionColor(type as any)}
              strokeWidth={2}
              strokeDasharray={getConnectionStyle(type as any)}
            />
            <text x={25} y={9} className="text-xs">
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default PlotboardConnections;