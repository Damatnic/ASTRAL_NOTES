/**
 * Entity Relationship Service
 * Manages complex relationships between entities with visualization and analysis
 */

import { api } from './api';
import { codexService, type CodexEntity, type EntityRelationship, type RelationshipType } from './codexService';

// Network visualization types
export interface NetworkNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  importance: number;
  group: string;
  entity: CodexEntity;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: RelationshipType;
  weight: number;
  color: string;
  strength: number;
  isDirectional: boolean;
  relationship: EntityRelationship;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: NetworkStats;
}

export interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  averageConnections: number;
  mostConnectedNode: NetworkNode | null;
  networkDensity: number;
  componentCount: number;
  centralityScores: Record<string, number>;
}

// Relationship analysis types
export interface RelationshipPath {
  entities: CodexEntity[];
  relationships: EntityRelationship[];
  pathLength: number;
  totalStrength: number;
  pathType: 'direct' | 'indirect';
}

export interface EntityInfluence {
  entityId: string;
  entity: CodexEntity;
  directConnections: number;
  indirectConnections: number;
  influenceScore: number;
  centralityRank: number;
  connectionTypes: Record<RelationshipType, number>;
}

export interface RelationshipCluster {
  id: string;
  name: string;
  entities: CodexEntity[];
  relationships: EntityRelationship[];
  clusterType: 'family' | 'organization' | 'location' | 'story' | 'mixed';
  strength: number;
  center: CodexEntity;
}

export interface RelationshipSuggestion {
  fromEntityId: string;
  toEntityId: string;
  suggestedType: RelationshipType;
  confidence: number;
  reason: string;
  evidence: string[];
}

// Visualization configuration
export interface VisualizationConfig {
  layout: 'force' | 'hierarchical' | 'circular' | 'grid' | 'cluster';
  nodeSize: 'uniform' | 'importance' | 'connections';
  edgeThickness: 'uniform' | 'strength' | 'importance';
  colorScheme: 'type' | 'importance' | 'cluster' | 'custom';
  showLabels: boolean;
  showEdgeLabels: boolean;
  filterByType: RelationshipType[];
  filterByStrength: [number, number];
  maxNodes: number;
  animationSpeed: number;
}

class EntityRelationshipService {
  private visualizationConfig: VisualizationConfig = {
    layout: 'force',
    nodeSize: 'importance',
    edgeThickness: 'strength',
    colorScheme: 'type',
    showLabels: true,
    showEdgeLabels: false,
    filterByType: [],
    filterByStrength: [1, 10],
    maxNodes: 100,
    animationSpeed: 1000
  };

  // Color schemes for different entity types
  private typeColors: Record<string, string> = {
    character: '#FF6B6B',
    location: '#4ECDC4',
    object: '#45B7D1',
    organization: '#96CEB4',
    event: '#FFEAA7',
    lore: '#DDA0DD',
    subplot: '#F39C12',
    concept: '#A569BD',
    custom: '#95A5A6'
  };

  // NETWORK GRAPH GENERATION
  async generateNetworkGraph(projectId: string, config?: Partial<VisualizationConfig>): Promise<NetworkGraph> {
    const finalConfig = { ...this.visualizationConfig, ...config };
    
    // Get entities and relationships
    const entities = await codexService.getEntitiesByProject(projectId);
    const allRelationships: EntityRelationship[] = [];
    
    // Get relationships for all entities
    for (const entity of entities) {
      const relationships = await codexService.getEntityRelationships(entity.id);
      allRelationships.push(...relationships);
    }
    
    // Create nodes
    const nodes = this.createNetworkNodes(entities, finalConfig);
    
    // Create edges
    const edges = this.createNetworkEdges(allRelationships, finalConfig);
    
    // Calculate network statistics
    const stats = this.calculateNetworkStats(nodes, edges);
    
    // Apply layout calculations
    this.applyLayout(nodes, edges, finalConfig.layout);
    
    return {
      nodes: nodes.slice(0, finalConfig.maxNodes),
      edges,
      stats
    };
  }

  async generateEntitySubgraph(entityId: string, depth: number = 2): Promise<NetworkGraph> {
    const connections = await codexService.getEntityConnections(entityId, depth);
    
    const nodes = this.createNetworkNodes(connections.entities, this.visualizationConfig);
    const edges = this.createNetworkEdges(connections.relationships, this.visualizationConfig);
    const stats = this.calculateNetworkStats(nodes, edges);
    
    this.applyLayout(nodes, edges, this.visualizationConfig.layout);
    
    return { nodes, edges, stats };
  }

  private createNetworkNodes(entities: CodexEntity[], config: VisualizationConfig): NetworkNode[] {
    return entities.map(entity => {
      let size = 10; // Default size
      
      if (config.nodeSize === 'importance') {
        size = entity.importance * 4 + 5; // 5-25 range
      } else if (config.nodeSize === 'connections') {
        // This would need connection count data
        size = 10;
      }
      
      let color = this.typeColors[entity.type] || this.typeColors.custom;
      
      if (config.colorScheme === 'importance') {
        const intensity = entity.importance / 5;
        color = this.interpolateColor('#E0E0E0', '#FF0000', intensity);
      }
      
      return {
        id: entity.id,
        label: entity.name,
        type: entity.type,
        size,
        color,
        importance: entity.importance,
        group: entity.category || entity.type,
        entity
      };
    });
  }

  private createNetworkEdges(relationships: EntityRelationship[], config: VisualizationConfig): NetworkEdge[] {
    return relationships
      .filter(rel => {
        // Apply filters
        if (config.filterByType.length > 0 && !config.filterByType.includes(rel.type)) {
          return false;
        }
        if (rel.strength < config.filterByStrength[0] || rel.strength > config.filterByStrength[1]) {
          return false;
        }
        return true;
      })
      .map(relationship => {
        let weight = 1; // Default weight
        
        if (config.edgeThickness === 'strength') {
          weight = relationship.strength / 2; // 0.5-5 range
        }
        
        return {
          id: relationship.id,
          source: relationship.fromEntityId,
          target: relationship.toEntityId,
          label: relationship.type,
          type: relationship.type,
          weight,
          color: this.getRelationshipColor(relationship.type),
          strength: relationship.strength,
          isDirectional: relationship.isDirectional,
          relationship
        };
      });
  }

  private getRelationshipColor(type: RelationshipType): string {
    const colors: Record<RelationshipType, string> = {
      family: '#FF69B4',
      organization: '#32CD32',
      location: '#1E90FF',
      conflict: '#FF4500',
      alliance: '#9ACD32',
      owns: '#FFD700',
      member_of: '#8A2BE2',
      located_in: '#20B2AA',
      loves: '#FF1493',
      hates: '#DC143C',
      rivals: '#FF8C00',
      mentor: '#4169E1',
      custom: '#778899'
    };
    return colors[type] || colors.custom;
  }

  // LAYOUT ALGORITHMS
  private applyLayout(nodes: NetworkNode[], edges: NetworkEdge[], layout: string): void {
    switch (layout) {
      case 'force':
        this.applyForceDirectedLayout(nodes, edges);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(nodes, edges);
        break;
      case 'circular':
        this.applyCircularLayout(nodes);
        break;
      case 'grid':
        this.applyGridLayout(nodes);
        break;
      case 'cluster':
        this.applyClusterLayout(nodes, edges);
        break;
    }
  }

  private applyForceDirectedLayout(nodes: NetworkNode[], edges: NetworkEdge[]): void {
    // Simple force-directed layout simulation
    const width = 800;
    const height = 600;
    
    // Initialize random positions
    nodes.forEach(node => {
      node.x = Math.random() * width;
      node.y = Math.random() * height;
    });
    
    // Run simulation iterations
    for (let iteration = 0; iteration < 100; iteration++) {
      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          const dx = node2.x! - node1.x!;
          const dy = node2.y! - node1.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const repulsion = 1000 / (distance * distance);
          
          const fx = (dx / distance) * repulsion;
          const fy = (dy / distance) * repulsion;
          
          node1.x! -= fx;
          node1.y! -= fy;
          node2.x! += fx;
          node2.y! += fy;
        }
      }
      
      // Attraction along edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        
        if (source && target) {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const attraction = distance * 0.01 * edge.strength;
          
          const fx = (dx / distance) * attraction;
          const fy = (dy / distance) * attraction;
          
          source.x! += fx;
          source.y! += fy;
          target.x! -= fx;
          target.y! -= fy;
        }
      });
      
      // Apply cooling
      const cooling = 0.95;
      nodes.forEach(node => {
        node.x! *= cooling;
        node.y! *= cooling;
      });
    }
    
    // Center the graph
    const centerX = width / 2;
    const centerY = height / 2;
    const avgX = nodes.reduce((sum, n) => sum + n.x!, 0) / nodes.length;
    const avgY = nodes.reduce((sum, n) => sum + n.y!, 0) / nodes.length;
    
    nodes.forEach(node => {
      node.x! += centerX - avgX;
      node.y! += centerY - avgY;
    });
  }

  private applyHierarchicalLayout(nodes: NetworkNode[], edges: NetworkEdge[]): void {
    // Group by importance/type and arrange in levels
    const levels = new Map<number, NetworkNode[]>();
    
    nodes.forEach(node => {
      const level = node.importance;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(node);
    });
    
    const levelHeight = 100;
    const nodeSpacing = 150;
    
    Array.from(levels.keys()).sort((a, b) => b - a).forEach((level, levelIndex) => {
      const levelNodes = levels.get(level)!;
      const startX = -(levelNodes.length * nodeSpacing) / 2;
      
      levelNodes.forEach((node, nodeIndex) => {
        node.x = startX + (nodeIndex * nodeSpacing);
        node.y = levelIndex * levelHeight;
      });
    });
  }

  private applyCircularLayout(nodes: NetworkNode[]): void {
    const radius = Math.min(300, nodes.length * 10);
    const angleStep = (2 * Math.PI) / nodes.length;
    
    nodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
    });
  }

  private applyGridLayout(nodes: NetworkNode[]): void {
    const gridSize = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 100;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      node.x = col * spacing;
      node.y = row * spacing;
    });
  }

  private applyClusterLayout(nodes: NetworkNode[], edges: NetworkEdge[]): void {
    // Group nodes by type/category
    const clusters = new Map<string, NetworkNode[]>();
    
    nodes.forEach(node => {
      const cluster = node.group;
      if (!clusters.has(cluster)) {
        clusters.set(cluster, []);
      }
      clusters.get(cluster)!.push(node);
    });
    
    // Arrange clusters in a circle
    const clusterRadius = 200;
    const clusterKeys = Array.from(clusters.keys());
    const clusterAngleStep = (2 * Math.PI) / clusterKeys.length;
    
    clusterKeys.forEach((clusterKey, clusterIndex) => {
      const clusterNodes = clusters.get(clusterKey)!;
      const clusterAngle = clusterIndex * clusterAngleStep;
      const clusterX = Math.cos(clusterAngle) * clusterRadius;
      const clusterY = Math.sin(clusterAngle) * clusterRadius;
      
      // Arrange nodes within cluster
      const nodeRadius = 50;
      const nodeAngleStep = (2 * Math.PI) / clusterNodes.length;
      
      clusterNodes.forEach((node, nodeIndex) => {
        const nodeAngle = nodeIndex * nodeAngleStep;
        node.x = clusterX + Math.cos(nodeAngle) * nodeRadius;
        node.y = clusterY + Math.sin(nodeAngle) * nodeRadius;
      });
    });
  }

  // NETWORK ANALYSIS
  private calculateNetworkStats(nodes: NetworkNode[], edges: NetworkEdge[]): NetworkStats {
    const connectionCounts = new Map<string, number>();
    const centralityScores = new Map<string, number>();
    
    // Count connections for each node
    nodes.forEach(node => {
      connectionCounts.set(node.id, 0);
    });
    
    edges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    });
    
    // Calculate centrality scores (simplified)
    nodes.forEach(node => {
      const connections = connectionCounts.get(node.id) || 0;
      centralityScores.set(node.id, connections / Math.max(nodes.length - 1, 1));
    });
    
    const totalConnections = Array.from(connectionCounts.values()).reduce((sum, count) => sum + count, 0);
    const averageConnections = totalConnections / (nodes.length || 1);
    
    const mostConnectedNode = nodes.reduce((max, node) => {
      const connections = connectionCounts.get(node.id) || 0;
      const maxConnections = connectionCounts.get(max?.id || '') || 0;
      return connections > maxConnections ? node : max;
    }, null as NetworkNode | null);
    
    const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
    const networkDensity = maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0;
    
    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      averageConnections,
      mostConnectedNode,
      networkDensity,
      componentCount: this.calculateComponentCount(nodes, edges),
      centralityScores: Object.fromEntries(centralityScores)
    };
  }

  private calculateComponentCount(nodes: NetworkNode[], edges: NetworkEdge[]): number {
    const visited = new Set<string>();
    let componentCount = 0;
    
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      edges.forEach(edge => {
        if (edge.source === nodeId && !visited.has(edge.target)) {
          dfs(edge.target);
        }
        if (edge.target === nodeId && !visited.has(edge.source)) {
          dfs(edge.source);
        }
      });
    };
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
        componentCount++;
      }
    });
    
    return componentCount;
  }

  // RELATIONSHIP ANALYSIS
  async findRelationshipPath(fromEntityId: string, toEntityId: string, maxDepth: number = 4): Promise<RelationshipPath[]> {
    const response = await api.get(`/api/codex/relationships/path/${fromEntityId}/${toEntityId}`, {
      params: { maxDepth }
    });
    return response;
  }

  async analyzeEntityInfluence(projectId: string): Promise<EntityInfluence[]> {
    const response = await api.get(`/api/codex/analysis/influence/${projectId}`);
    return response;
  }

  async discoverRelationshipClusters(projectId: string): Promise<RelationshipCluster[]> {
    const response = await api.get(`/api/codex/analysis/clusters/${projectId}`);
    return response;
  }

  async suggestRelationships(projectId: string): Promise<RelationshipSuggestion[]> {
    const response = await api.post(`/api/codex/relationships/suggest/${projectId}`);
    return response;
  }

  // UTILITY METHODS
  private interpolateColor(color1: string, color2: string, factor: number): string {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // CONFIGURATION
  updateVisualizationConfig(config: Partial<VisualizationConfig>): void {
    this.visualizationConfig = { ...this.visualizationConfig, ...config };
  }

  getVisualizationConfig(): VisualizationConfig {
    return { ...this.visualizationConfig };
  }

  // EXPORT METHODS
  async exportNetworkData(projectId: string, format: 'json' | 'graphml' | 'gexf' = 'json'): Promise<Blob> {
    const response = await api.get(`/api/codex/relationships/export/${projectId}`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  }

  async importNetworkData(projectId: string, file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/codex/relationships/import/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  }
}

// Export singleton instance
export const entityRelationshipService = new EntityRelationshipService();
export default entityRelationshipService;