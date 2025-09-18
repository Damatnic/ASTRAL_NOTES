/**
 * Codex Dashboard - Main interface for the Story Wiki system
 * Central hub for all entity management and organization
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, Grid3X3, List, BookOpen, Users, MapPin, Zap, Network, BarChart3, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { codexService, type CodexEntity, type EntityType, type EntityStats } from '@/services/codexService';
import { codexSearchService, type SearchFilters, type SearchResults } from '@/services/codexSearchService';
import { entityRelationshipService, type NetworkGraph } from '@/services/entityRelationshipService';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';

// Sub-components (to be created)
import EntityCard from './EntityCard';
import EntityGrid from './EntityGrid';
import EntityList from './EntityList';
import NetworkVisualization from './NetworkVisualization';
import QuickStats from './QuickStats';
import EntityFilters from './EntityFilters';
import CreateEntityModal from './CreateEntityModal';
import ImportExportPanel from './ImportExportPanel';

// Types for dashboard state
interface DashboardState {
  entities: CodexEntity[];
  searchResults: SearchResults | null;
  networkGraph: NetworkGraph | null;
  stats: EntityStats | null;
  isLoading: boolean;
  activeTab: 'overview' | 'entities' | 'relationships' | 'analytics';
  viewMode: 'grid' | 'list' | 'network';
  searchQuery: string;
  filters: SearchFilters;
  selectedEntities: Set<string>;
}

interface CodexDashboardProps {
  projectId?: string;
  isUniversal?: boolean;
  onEntitySelect?: (entity: CodexEntity) => void;
  onEntityEdit?: (entity: CodexEntity) => void;
  showCreateButton?: boolean;
  showImportExport?: boolean;
  compact?: boolean;
}

const ENTITY_TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  character: <Users className="w-4 h-4" />,
  location: <MapPin className="w-4 h-4" />,
  object: <Zap className="w-4 h-4" />,
  organization: <Network className="w-4 h-4" />,
  event: <BarChart3 className="w-4 h-4" />,
  lore: <BookOpen className="w-4 h-4" />,
  subplot: <List className="w-4 h-4" />,
  concept: <Search className="w-4 h-4" />,
  custom: <Grid3X3 className="w-4 h-4" />
};

const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  character: 'bg-red-500',
  location: 'bg-blue-500',
  object: 'bg-green-500',
  organization: 'bg-purple-500',
  event: 'bg-yellow-500',
  lore: 'bg-indigo-500',
  subplot: 'bg-pink-500',
  concept: 'bg-teal-500',
  custom: 'bg-gray-500'
};

export default function CodexDashboard({
  projectId,
  isUniversal = false,
  onEntitySelect,
  onEntityEdit,
  showCreateButton = true,
  showImportExport = true,
  compact = false
}: CodexDashboardProps) {
  const [state, setState] = useState<DashboardState>({
    entities: [],
    searchResults: null,
    networkGraph: null,
    stats: null,
    isLoading: true,
    activeTab: 'overview',
    viewMode: 'grid',
    searchQuery: '',
    filters: {},
    selectedEntities: new Set()
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Load initial data and restore UI state
  useEffect(() => {
    try {
      const key = `codexDashboard:${projectId || (isUniversal ? 'universal' : 'default')}`;
      const persisted = localStorage.getItem(key);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        setState(prev => ({
          ...prev,
          viewMode: parsed.viewMode || prev.viewMode,
          searchQuery: parsed.searchQuery || prev.searchQuery,
          filters: parsed.filters || prev.filters,
        }));
      }
    } catch {}
    loadDashboardData();
  }, [projectId, isUniversal]);

  // Search effect
  useEffect(() => {
    if (state.searchQuery || Object.keys(state.filters).length > 0) {
      performSearch();
    } else {
      setState(prev => ({ ...prev, searchResults: null }));
    }
  }, [state.searchQuery, state.filters]);

  // Persist UI state
  useEffect(() => {
    try {
      const key = `codexDashboard:${projectId || (isUniversal ? 'universal' : 'default')}`;
      const toSave = {
        viewMode: state.viewMode,
        searchQuery: state.searchQuery,
        filters: state.filters,
      };
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch {}
  }, [state.viewMode, state.searchQuery, state.filters, projectId, isUniversal]);

  const loadDashboardData = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [entities, stats] = await Promise.all([
        isUniversal 
          ? codexService.getUniversalEntities()
          : projectId 
            ? codexService.getEntitiesByProject(projectId)
            : [],
        projectId ? codexService.getEntityStats(projectId) : null
      ]);

      setState(prev => ({
        ...prev,
        entities,
        stats,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const performSearch = async () => {
    try {
      const searchFilters: SearchFilters = {
        ...state.filters,
        query: state.searchQuery || undefined,
        projectId: projectId,
        limit: 50
      };

      const results = await codexSearchService.search(searchFilters);
      setState(prev => ({ ...prev, searchResults: results }));
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const loadNetworkGraph = async () => {
    if (!projectId) return;
    
    try {
      const graph = await entityRelationshipService.generateNetworkGraph(projectId);
      setState(prev => ({ ...prev, networkGraph: graph }));
    } catch (error) {
      console.error('Failed to load network graph:', error);
    }
  };

  // Event handlers
  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  const handleEntityClick = (entity: CodexEntity) => {
    if (onEntitySelect) {
      onEntitySelect(entity);
    }
  };

  const handleEntityEdit = (entity: CodexEntity) => {
    if (onEntityEdit) {
      onEntityEdit(entity);
    }
  };

  const handleEntitySelect = (entityId: string, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedEntities);
      if (selected) {
        newSelected.add(entityId);
      } else {
        newSelected.delete(entityId);
      }
      return { ...prev, selectedEntities: newSelected };
    });
  };

  const handleBulkAction = async (action: 'delete' | 'export' | 'tag') => {
    const selectedIds = Array.from(state.selectedEntities);
    if (selectedIds.length === 0) return;

    try {
      switch (action) {
        case 'delete':
          await codexService.bulkDeleteEntities(selectedIds);
          break;
        case 'export':
          // Handle export
          break;
        case 'tag':
          // Handle bulk tagging
          break;
      }
      
      // Refresh data
      await loadDashboardData();
      setState(prev => ({ ...prev, selectedEntities: new Set() }));
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
    }
  };

  const handleTabChange = (tab: DashboardState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
    
    if (tab === 'relationships' && !state.networkGraph) {
      loadNetworkGraph();
    }
  };

  const handleViewModeChange = (mode: DashboardState['viewMode']) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  // Computed values
  const displayEntities = state.searchResults?.results.map(r => r.entity) || state.entities;
  const hasSelection = state.selectedEntities.size > 0;
  const entityTypes = useMemo(() => {
    const types = new Set(state.entities.map(e => e.type));
    return Array.from(types);
  }, [state.entities]);

  // Render helpers
  const renderEntityList = () => {
    if (state.isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      );
    }

    if (displayEntities.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {state.searchQuery ? 'No entities found' : 'No entities yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {state.searchQuery 
              ? 'Try adjusting your search terms or filters'
              : 'Start building your story world by creating your first entity'
            }
          </p>
          {showCreateButton && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Entity
            </Button>
          )}
        </div>
      );
    }

    switch (state.viewMode) {
      case 'grid':
        return (
          <EntityGrid
            entities={displayEntities}
            searchResults={state.searchResults}
            selectedEntities={state.selectedEntities}
            onEntityClick={handleEntityClick}
            onEntityEdit={handleEntityEdit}
            onEntitySelect={handleEntitySelect}
          />
        );
      case 'list':
        return (
          <EntityList
            entities={displayEntities}
            searchResults={state.searchResults}
            selectedEntities={state.selectedEntities}
            onEntityClick={handleEntityClick}
            onEntityEdit={handleEntityEdit}
            onEntitySelect={handleEntitySelect}
          />
        );
      case 'network':
        return state.networkGraph ? (
          <NetworkVisualization
            graph={state.networkGraph}
            onNodeClick={handleEntityClick}
            height={compact ? 400 : 600}
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            <Button onClick={loadNetworkGraph}>Load Network View</Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Compact search bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search entities..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Compact entity display */}
        <div className="max-h-96 overflow-y-auto">
          {renderEntityList()}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isUniversal ? 'Universal Codex' : 'Story Codex'}
              </h1>
              <p className="text-gray-500">
                Manage your story entities, relationships, and world-building
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {hasSelection && (
                <div className="flex items-center space-x-2 mr-4">
                  <span className="text-sm text-gray-500">
                    {state.selectedEntities.size} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('export')}
                  >
                    Export
                  </Button>
                </div>
              )}
              
              {showImportExport && (
                <Button
                  variant="outline"
                  onClick={() => setShowImportExport(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Import/Export
                </Button>
              )}
              
              {showCreateButton && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Entity
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="px-6 pb-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search entities by name, description, or tags..."
                value={state.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button
                variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={state.viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={state.viewMode === 'network' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('network')}
              >
                <Network className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <EntityFilters
                  filters={state.filters}
                  entityTypes={entityTypes}
                  availableTags={state.stats?.popularTags.map(t => t.tag) || []}
                  onChange={handleFilterChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={state.activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="flex-none px-6 pt-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="entities">
                Entities ({displayEntities.length})
              </TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="overview" className="p-6 space-y-6">
              {state.stats && <QuickStats stats={state.stats} />}
              
              {/* Recent entities */}
              <div>
                <h3 className="text-lg font-medium mb-4">Recent Entities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.stats?.recentlyCreated.slice(0, 6).map(entity => (
                    <EntityCard
                      key={entity.id}
                      entity={entity}
                      onClick={() => handleEntityClick(entity)}
                      onEdit={() => handleEntityEdit(entity)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="entities" className="p-6">
              {renderEntityList()}
            </TabsContent>

            <TabsContent value="relationships" className="p-6">
              {state.networkGraph ? (
                <NetworkVisualization
                  graph={state.networkGraph}
                  onNodeClick={handleEntityClick}
                  height={600}
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Button onClick={loadNetworkGraph}>Load Relationship Network</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="p-6">
              {state.stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Analytics components would go here */}
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Entity Distribution</h3>
                    <div className="space-y-2">
                      {Object.entries(state.stats.entitiesByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded ${ENTITY_TYPE_COLORS[type as EntityType]} mr-2`} />
                            <span className="capitalize">{type}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onEntityCreated={loadDashboardData}
      />

      {showImportExport && (
        <ImportExportPanel
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          projectId={projectId}
          onImportComplete={loadDashboardData}
        />
      )}
    </div>
  );
}

export { ENTITY_TYPE_ICONS, ENTITY_TYPE_COLORS };
