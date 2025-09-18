/**
 * Entity Grid - Grid layout for displaying multiple entities
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, Grid3X3, List, SortAsc, SortDesc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { type CodexEntity } from '@/services/codexService';
import { type SearchResults } from '@/services/codexSearchService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import EntityCard, { EntityCardSkeleton } from './EntityCard';

interface EntityGridProps {
  entities: CodexEntity[];
  searchResults?: SearchResults | null;
  selectedEntities?: Set<string>;
  onEntityClick?: (entity: CodexEntity) => void;
  onEntityEdit?: (entity: CodexEntity) => void;
  onEntitySelect?: (entityId: string, selected: boolean) => void;
  loading?: boolean;
  compact?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  showViewToggle?: boolean;
  columnsConfig?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

type SortField = 'name' | 'type' | 'importance' | 'updatedAt' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function EntityGrid({
  entities,
  searchResults,
  selectedEntities = new Set(),
  onEntityClick,
  onEntityEdit,
  onEntitySelect,
  loading = false,
  compact = false,
  showFilters = false,
  showSorting = true,
  showViewToggle = false,
  columnsConfig = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  }
}: EntityGridProps) {
  const [localFilter, setLocalFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('importance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Filter entities locally if no search results
  const filteredEntities = useMemo(() => {
    if (searchResults) {
      return searchResults.results.map(r => r.entity);
    }

    let filtered = [...entities];

    // Apply local filter
    if (localFilter) {
      const filterLower = localFilter.toLowerCase();
      filtered = filtered.filter(entity =>
        entity.name.toLowerCase().includes(filterLower) ||
        entity.description.toLowerCase().includes(filterLower) ||
        entity.type.toLowerCase().includes(filterLower)
      );
    }

    return filtered;
  }, [entities, searchResults, localFilter]);

  // Sort entities
  const sortedEntities = useMemo(() => {
    return [...filteredEntities].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'importance':
          aValue = a.importance;
          bValue = b.importance;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEntities, sortField, sortOrder]);

  const handleSelectAll = () => {
    if (!onEntitySelect) return;

    const allSelected = sortedEntities.every(entity => selectedEntities.has(entity.id));
    sortedEntities.forEach(entity => {
      onEntitySelect(entity.id, !allSelected);
    });
  };

  const handleSortFieldChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getGridClasses = () => {
    const { sm, md, lg, xl } = columnsConfig;
    const baseClass = 'grid gap-4';
    
    if (viewMode === 'compact') {
      return `${baseClass} grid-cols-${Math.min(sm * 2, 2)} md:grid-cols-${Math.min(md * 2, 4)} lg:grid-cols-${Math.min(lg * 2, 6)} xl:grid-cols-${Math.min(xl * 2, 8)}`;
    }
    
    return `${baseClass} grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {(showFilters || showSorting) && (
          <div className="flex items-center justify-between">
            <div className="w-64">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex space-x-2">
              <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="w-24 h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        )}
        
        <div className={getGridClasses()}>
          {[...Array(12)].map((_, i) => (
            <EntityCardSkeleton key={i} compact={viewMode === 'compact'} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {(showFilters || showSorting || showViewToggle) && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Local search filter */}
          {showFilters && !searchResults && (
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Filter entities..."
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            {/* Selection controls */}
            {onEntitySelect && selectedEntities.size > 0 && (
              <div className="flex items-center space-x-2 mr-4">
                <span className="text-sm text-gray-600">
                  {selectedEntities.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {sortedEntities.every(e => selectedEntities.has(e.id)) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}

            {/* View mode toggle */}
            {showViewToggle && (
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Sorting */}
            {showSorting && (
              <>
                <Select
                  value={sortField}
                  onValueChange={(value) => handleSortFieldChange(value as SortField)}
                >
                  <option value="importance">Importance</option>
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                  <option value="updatedAt">Updated</option>
                  <option value="createdAt">Created</option>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      {searchResults && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {searchResults.total} result{searchResults.total !== 1 ? 's' : ''} found
            {searchResults.queryTime && ` in ${searchResults.queryTime}ms`}
          </span>
          
          {searchResults.hasMore && (
            <span>
              Showing {searchResults.results.length} of {searchResults.total}
            </span>
          )}
        </div>
      )}

      {/* Entity grid */}
      <AnimatePresence mode="popLayout">
        {sortedEntities.length > 0 ? (
          <motion.div
            className={getGridClasses()}
            layout
          >
            {sortedEntities.map((entity, index) => (
              <motion.div
                key={entity.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <EntityCard
                  entity={entity}
                  onClick={() => onEntityClick?.(entity)}
                  onEdit={() => onEntityEdit?.(entity)}
                  onSelect={onEntitySelect ? (selected) => onEntitySelect(entity.id, selected) : undefined}
                  selected={selectedEntities.has(entity.id)}
                  compact={viewMode === 'compact' || compact}
                  showActions={!compact}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <Search className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No entities found
            </h3>
            <p className="text-gray-500">
              {localFilter || searchResults 
                ? 'Try adjusting your search terms or filters'
                : 'Get started by creating your first entity'
              }
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load more button for search results */}
      {searchResults && searchResults.hasMore && (
        <div className="flex justify-center pt-6">
          <Button variant="outline">
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper component for entity type distribution
export function EntityTypeDistribution({ entities }: { entities: CodexEntity[] }) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    entities.forEach(entity => {
      counts[entity.type] = (counts[entity.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [entities]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
      {distribution.map(({ type, count }) => (
        <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="capitalize">{type}</span>
          <span className="font-medium">{count}</span>
        </div>
      ))}
    </div>
  );
}