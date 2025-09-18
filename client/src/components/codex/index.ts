/**
 * Codex System - Export file for all components and services
 */

// Main Components
export { default as CodexDashboard } from './CodexDashboard';
export { default as EntityEditor } from './EntityEditor';
export { default as EntityCard } from './EntityCard';
export { default as EntityGrid } from './EntityGrid';
export { default as AutoDetectionPanel } from './AutoDetectionPanel';

// Services
export { codexService } from '../../services/codexService';
export { autoDetectionService } from '../../services/autoDetectionService';
export { entityRelationshipService } from '../../services/entityRelationshipService';
export { codexSearchService } from '../../services/codexSearchService';

// Types
export type {
  CodexEntity,
  EntityType,
  EntityRelationship,
  RelationshipType,
  TextReference,
  MentionSuggestion,
  EntityCollection,
  ConsistencyCheck,
  EntitySearchFilters,
  EntityStats
} from '../../services/codexService';

export type {
  DetectionConfig,
  TextAnalysisResult,
  DetectedReference,
  DetectedSuggestion,
  AnalysisStatistics
} from '../../services/autoDetectionService';

export type {
  NetworkNode,
  NetworkEdge,
  NetworkGraph,
  NetworkStats,
  RelationshipPath,
  EntityInfluence,
  RelationshipCluster,
  VisualizationConfig
} from '../../services/entityRelationshipService';

export type {
  SearchFilters,
  SearchResult,
  SearchResults,
  SearchFacets,
  SavedSearch,
  AutocompleteSuggestion
} from '../../services/codexSearchService';