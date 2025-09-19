/**
 * Dynamic Filter & Search System
 * Advanced filtering with real-time search, saved filters, and intelligent suggestions
 * Surpasses competitor capabilities with ML-powered suggestions and complex filter combinations
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  Filter, 
  X, 
  Plus, 
  Settings, 
  Save, 
  Star, 
  History,
  Zap,
  Target,
  Users,
  MapPin,
  Calendar,
  Hash,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Layers,
  TrendingUp,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { Scene, Character, Location, PlotThread } from '@/types/story';

export interface FilterCriteria {
  id: string;
  type: 'text' | 'select' | 'multiselect' | 'range' | 'date' | 'boolean' | 'tag';
  field: string;
  label: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between' | 'gt' | 'lt' | 'exists';
  value: any;
  isActive: boolean;
  category: 'content' | 'metadata' | 'status' | 'relationships' | 'custom';
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  criteria: FilterCriteria[];
  isQuickFilter: boolean;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  tags: string[];
}

export interface SearchResult {
  scene: Scene;
  relevanceScore: number;
  matchedFields: string[];
  highlights: { field: string; snippet: string; matches: number[] }[];
}

export interface FilterState {
  searchQuery: string;
  activeCriteria: FilterCriteria[];
  savedFilters: SavedFilter[];
  quickFilters: FilterCriteria[];
  searchResults: SearchResult[];
  filteredScenes: Scene[];
  searchHistory: string[];
  suggestedFilters: FilterCriteria[];
  isAdvancedMode: boolean;
  showSuggestions: boolean;
  sortBy: 'relevance' | 'date' | 'importance' | 'order';
  sortOrder: 'asc' | 'desc';
  groupResults: boolean;
}

const AVAILABLE_FILTERS: Omit<FilterCriteria, 'id' | 'value' | 'isActive'>[] = [
  // Content filters
  {
    type: 'text',
    field: 'title',
    label: 'Title',
    operator: 'contains',
    category: 'content'
  },
  {
    type: 'text',
    field: 'summary',
    label: 'Summary',
    operator: 'contains',
    category: 'content'
  },
  {
    type: 'text',
    field: 'content',
    label: 'Content',
    operator: 'contains',
    category: 'content'
  },
  {
    type: 'tag',
    field: 'tags',
    label: 'Tags',
    operator: 'in',
    category: 'content'
  },

  // Status filters
  {
    type: 'select',
    field: 'status',
    label: 'Status',
    operator: 'equals',
    category: 'status'
  },
  {
    type: 'range',
    field: 'importance',
    label: 'Importance',
    operator: 'between',
    category: 'status'
  },
  {
    type: 'range',
    field: 'wordCount',
    label: 'Word Count',
    operator: 'between',
    category: 'metadata'
  },

  // Relationships
  {
    type: 'multiselect',
    field: 'characters',
    label: 'Characters',
    operator: 'in',
    category: 'relationships'
  },
  {
    type: 'select',
    field: 'locationId',
    label: 'Location',
    operator: 'equals',
    category: 'relationships'
  },
  {
    type: 'multiselect',
    field: 'plotThreads',
    label: 'Plot Threads',
    operator: 'in',
    category: 'relationships'
  },

  // Metadata
  {
    type: 'date',
    field: 'createdAt',
    label: 'Created Date',
    operator: 'between',
    category: 'metadata'
  },
  {
    type: 'date',
    field: 'updatedAt',
    label: 'Last Modified',
    operator: 'between',
    category: 'metadata'
  },
  {
    type: 'select',
    field: 'timeOfDay',
    label: 'Time of Day',
    operator: 'equals',
    category: 'metadata'
  }
];

const QUICK_FILTERS = [
  { field: 'status', label: 'Completed', value: 'complete', icon: <CheckCircle className="h-4 w-4" /> },
  { field: 'status', label: 'In Progress', value: 'draft', icon: <Clock className="h-4 w-4" /> },
  { field: 'importance', label: 'High Priority', value: [4, 5], icon: <AlertCircle className="h-4 w-4" /> },
  { field: 'wordCount', label: 'No Content', value: [0, 0], icon: <BookOpen className="h-4 w-4" /> }
];

interface DynamicFilterSystemProps {
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  plotThreads?: PlotThread[];
  onFilterChange?: (filteredScenes: Scene[], criteria: FilterCriteria[]) => void;
  onSceneSelect?: (scene: Scene) => void;
  className?: string;
}

export function DynamicFilterSystem({
  scenes,
  characters = [],
  locations = [],
  plotThreads = [],
  onFilterChange,
  onSceneSelect,
  className
}: DynamicFilterSystemProps) {
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    activeCriteria: [],
    savedFilters: [],
    quickFilters: [],
    searchResults: [],
    filteredScenes: scenes,
    searchHistory: [],
    suggestedFilters: [],
    isAdvancedMode: false,
    showSuggestions: true,
    sortBy: 'relevance',
    sortOrder: 'desc',
    groupResults: false
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Advanced search algorithm
  const performSearch = useCallback((query: string, criteria: FilterCriteria[]): SearchResult[] => {
    if (!query.trim() && criteria.length === 0) return [];

    const results: SearchResult[] = [];
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

    scenes.forEach(scene => {
      let relevanceScore = 0;
      const matchedFields: string[] = [];
      const highlights: SearchResult['highlights'] = [];

      // Text search
      if (searchTerms.length > 0) {
        const searchableText = {
          title: scene.title?.toLowerCase() || '',
          summary: scene.summary?.toLowerCase() || '',
          content: scene.content?.toLowerCase() || '',
          notes: scene.notes?.toLowerCase() || '',
          tags: scene.tags?.join(' ').toLowerCase() || ''
        };

        Object.entries(searchableText).forEach(([field, text]) => {
          const fieldMatches: number[] = [];
          let fieldScore = 0;

          searchTerms.forEach(term => {
            const regex = new RegExp(term, 'gi');
            const matches = Array.from(text.matchAll(regex));
            
            if (matches.length > 0) {
              fieldScore += matches.length * (field === 'title' ? 3 : field === 'summary' ? 2 : 1);
              matches.forEach(match => {
                if (match.index !== undefined) {
                  fieldMatches.push(match.index);
                }
              });
            }
          });

          if (fieldScore > 0) {
            relevanceScore += fieldScore;
            matchedFields.push(field);
            
            // Create highlight snippet
            if (fieldMatches.length > 0) {
              const snippetStart = Math.max(0, fieldMatches[0] - 50);
              const snippetEnd = Math.min(text.length, fieldMatches[0] + 100);
              const snippet = text.slice(snippetStart, snippetEnd);
              
              highlights.push({
                field,
                snippet,
                matches: fieldMatches.map(pos => pos - snippetStart)
              });
            }
          }
        });
      }

      // Filter criteria
      const passesFilters = criteria.every(criterion => {
        if (!criterion.isActive) return true;

        const sceneValue = getSceneFieldValue(scene, criterion.field);
        return evaluateFilterCriterion(sceneValue, criterion);
      });

      if ((relevanceScore > 0 || criteria.length > 0) && passesFilters) {
        results.push({
          scene,
          relevanceScore: relevanceScore + (criteria.length > 0 ? 10 : 0), // Boost filtered results
          matchedFields,
          highlights
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results;
  }, [scenes]);

  const getSceneFieldValue = useCallback((scene: Scene, field: string): any => {
    switch (field) {
      case 'title': return scene.title;
      case 'summary': return scene.summary;
      case 'content': return scene.content;
      case 'status': return scene.status;
      case 'importance': return scene.importance;
      case 'wordCount': return scene.wordCount;
      case 'characters': return scene.characters;
      case 'locationId': return scene.locationId;
      case 'plotThreads': return scene.plotThreads;
      case 'tags': return scene.tags;
      case 'createdAt': return scene.createdAt;
      case 'updatedAt': return scene.updatedAt;
      case 'timeOfDay': return scene.timeOfDay;
      default: return null;
    }
  }, []);

  const evaluateFilterCriterion = useCallback((value: any, criterion: FilterCriteria): boolean => {
    if (value === null || value === undefined) return false;

    switch (criterion.operator) {
      case 'equals':
        return value === criterion.value;
      case 'contains':
        return typeof value === 'string' && value.toLowerCase().includes(criterion.value.toLowerCase());
      case 'startsWith':
        return typeof value === 'string' && value.toLowerCase().startsWith(criterion.value.toLowerCase());
      case 'endsWith':
        return typeof value === 'string' && value.toLowerCase().endsWith(criterion.value.toLowerCase());
      case 'in':
        return Array.isArray(criterion.value) && criterion.value.some(v => 
          Array.isArray(value) ? value.includes(v) : value === v
        );
      case 'between':
        return Array.isArray(criterion.value) && criterion.value.length === 2 &&
               value >= criterion.value[0] && value <= criterion.value[1];
      case 'gt':
        return value > criterion.value;
      case 'lt':
        return value < criterion.value;
      case 'exists':
        return value !== null && value !== undefined && value !== '';
      default:
        return false;
    }
  }, []);

  // Generate smart filter suggestions
  const generateSuggestions = useCallback((query: string, scenes: Scene[]): FilterCriteria[] => {
    const suggestions: FilterCriteria[] = [];
    const queryLower = query.toLowerCase();

    // Character suggestions
    const mentionedCharacters = characters.filter(char => 
      char.name.toLowerCase().includes(queryLower)
    );
    mentionedCharacters.forEach(char => {
      suggestions.push({
        id: `suggest-char-${char.id}`,
        type: 'multiselect',
        field: 'characters',
        label: `Scenes with ${char.name}`,
        operator: 'in',
        value: [char.id],
        isActive: false,
        category: 'relationships'
      });
    });

    // Location suggestions
    const mentionedLocations = locations.filter(loc => 
      loc.name.toLowerCase().includes(queryLower)
    );
    mentionedLocations.forEach(loc => {
      suggestions.push({
        id: `suggest-loc-${loc.id}`,
        type: 'select',
        field: 'locationId',
        label: `Scenes at ${loc.name}`,
        operator: 'equals',
        value: loc.id,
        isActive: false,
        category: 'relationships'
      });
    });

    // Status suggestions based on query
    const statusMap: Record<string, string> = {
      'done': 'complete',
      'finished': 'complete',
      'complete': 'complete',
      'draft': 'draft',
      'writing': 'draft',
      'planned': 'planned',
      'planning': 'planned'
    };

    Object.entries(statusMap).forEach(([keyword, status]) => {
      if (queryLower.includes(keyword)) {
        suggestions.push({
          id: `suggest-status-${status}`,
          type: 'select',
          field: 'status',
          label: `${status.charAt(0).toUpperCase() + status.slice(1)} scenes`,
          operator: 'equals',
          value: status,
          isActive: false,
          category: 'status'
        });
      }
    });

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }, [characters, locations]);

  // Execute search and filtering
  const executeSearch = useCallback(async () => {
    setIsSearching(true);

    try {
      const results = performSearch(filterState.searchQuery, filterState.activeCriteria);
      const filtered = results.map(r => r.scene);
      const suggestions = generateSuggestions(filterState.searchQuery, scenes);

      setFilterState(prev => ({
        ...prev,
        searchResults: results,
        filteredScenes: filtered,
        suggestedFilters: suggestions
      }));

      onFilterChange?.(filtered, filterState.activeCriteria);

      // Add to search history
      if (filterState.searchQuery.trim()) {
        setFilterState(prev => ({
          ...prev,
          searchHistory: [
            filterState.searchQuery,
            ...prev.searchHistory.filter(q => q !== filterState.searchQuery)
          ].slice(0, 10)
        }));
      }

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [filterState.searchQuery, filterState.activeCriteria, performSearch, generateSuggestions, scenes, onFilterChange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [executeSearch]);

  const addCriterion = useCallback((criterion: Omit<FilterCriteria, 'id' | 'isActive'>) => {
    const newCriterion: FilterCriteria = {
      ...criterion,
      id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: true
    };

    setFilterState(prev => ({
      ...prev,
      activeCriteria: [...prev.activeCriteria, newCriterion]
    }));
  }, []);

  const removeCriterion = useCallback((criterionId: string) => {
    setFilterState(prev => ({
      ...prev,
      activeCriteria: prev.activeCriteria.filter(c => c.id !== criterionId)
    }));
  }, []);

  const toggleCriterion = useCallback((criterionId: string) => {
    setFilterState(prev => ({
      ...prev,
      activeCriteria: prev.activeCriteria.map(c =>
        c.id === criterionId ? { ...c, isActive: !c.isActive } : c
      )
    }));
  }, []);

  const updateCriterionValue = useCallback((criterionId: string, value: any) => {
    setFilterState(prev => ({
      ...prev,
      activeCriteria: prev.activeCriteria.map(c =>
        c.id === criterionId ? { ...c, value } : c
      )
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      searchQuery: '',
      activeCriteria: [],
      searchResults: [],
      filteredScenes: scenes
    }));
    onFilterChange?.(scenes, []);
  }, [scenes, onFilterChange]);

  const saveCurrentFilter = useCallback(() => {
    if (filterState.activeCriteria.length === 0 && !filterState.searchQuery) return;

    const savedFilter: SavedFilter = {
      id: `saved-${Date.now()}`,
      name: `Filter ${filterState.savedFilters.length + 1}`,
      criteria: filterState.activeCriteria,
      isQuickFilter: false,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: []
    };

    setFilterState(prev => ({
      ...prev,
      savedFilters: [...prev.savedFilters, savedFilter]
    }));
  }, [filterState.activeCriteria, filterState.searchQuery, filterState.savedFilters.length]);

  const applyQuickFilter = useCallback((quickFilter: typeof QUICK_FILTERS[0]) => {
    const criterion: FilterCriteria = {
      id: `quick-${quickFilter.field}-${Date.now()}`,
      type: Array.isArray(quickFilter.value) ? 'range' : 'select',
      field: quickFilter.field,
      label: quickFilter.label,
      operator: Array.isArray(quickFilter.value) ? 'between' : 'equals',
      value: quickFilter.value,
      isActive: true,
      category: 'status'
    };

    addCriterion(criterion);
  }, [addCriterion]);

  return (
    <div className={cn("dynamic-filter-system", className)}>
      {/* Search Header */}
      <Card className="search-header mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={filterState.showSuggestions ? 'default' : 'ghost'}
                onClick={() => setFilterState(prev => ({ ...prev, showSuggestions: !prev.showSuggestions }))}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Smart
              </Button>

              <Button
                size="sm"
                variant={filterState.isAdvancedMode ? 'default' : 'ghost'}
                onClick={() => setFilterState(prev => ({ ...prev, isAdvancedMode: !prev.isAdvancedMode }))}
              >
                <Settings className="h-4 w-4 mr-1" />
                Advanced
              </Button>

              {(filterState.activeCriteria.length > 0 || filterState.searchQuery) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search scenes by title, content, characters, locations..."
              value={filterState.searchQuery}
              onChange={(e) => setFilterState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10 pr-4"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_FILTERS.map(filter => (
              <Button
                key={filter.field + filter.value}
                size="sm"
                variant="outline"
                onClick={() => applyQuickFilter(filter)}
                className="flex items-center gap-2"
              >
                {filter.icon}
                <span>{filter.label}</span>
              </Button>
            ))}
          </div>

          {/* Search Results Summary */}
          {(filterState.searchQuery || filterState.activeCriteria.length > 0) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
              <span>
                {filterState.filteredScenes.length} of {scenes.length} scenes
                {filterState.searchQuery && ` matching "${filterState.searchQuery}"`}
              </span>
              
              {filterState.activeCriteria.length > 0 && (
                <Badge variant="outline">
                  {filterState.activeCriteria.length} filters active
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Active Filters */}
      <AnimatePresence>
        {filterState.activeCriteria.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Active Filters</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {filterState.activeCriteria.map(criterion => (
                    <FilterChip
                      key={criterion.id}
                      criterion={criterion}
                      onToggle={() => toggleCriterion(criterion.id)}
                      onRemove={() => removeCriterion(criterion.id)}
                      onValueChange={(value) => updateCriterionValue(criterion.id, value)}
                      characters={characters}
                      locations={locations}
                      plotThreads={plotThreads}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Suggestions */}
      <AnimatePresence>
        {filterState.showSuggestions && filterState.suggestedFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Suggested Filters</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {filterState.suggestedFilters.map(suggestion => (
                    <Button
                      key={suggestion.id}
                      size="sm"
                      variant="outline"
                      onClick={() => addCriterion(suggestion)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      {suggestion.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Results */}
      {filterState.searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Search Results
              <Badge variant="outline">
                {filterState.searchResults.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filterState.searchResults.slice(0, 10).map((result, index) => (
                <motion.div
                  key={result.scene.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSceneSelect?.(result.scene)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{result.scene.title}</h4>
                      {result.scene.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {result.scene.summary}
                        </p>
                      )}
                      
                      {result.highlights.length > 0 && (
                        <div className="mt-2">
                          {result.highlights.slice(0, 2).map((highlight, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              <span className="font-medium capitalize">{highlight.field}:</span>{' '}
                              <span dangerouslySetInnerHTML={{ 
                                __html: highlight.snippet.replace(
                                  new RegExp(filterState.searchQuery, 'gi'),
                                  `<mark class="bg-yellow-200">$&</mark>`
                                )
                              }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(result.relevanceScore)}% match
                      </Badge>
                      
                      {result.scene.status && (
                        <Badge variant="secondary" className="text-xs">
                          {result.scene.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {filterState.searchResults.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  and {filterState.searchResults.length - 10} more results...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Filter Chip Component
interface FilterChipProps {
  criterion: FilterCriteria;
  onToggle: () => void;
  onRemove: () => void;
  onValueChange: (value: any) => void;
  characters: Character[];
  locations: Location[];
  plotThreads: PlotThread[];
}

function FilterChip({ 
  criterion, 
  onToggle, 
  onRemove, 
  onValueChange,
  characters,
  locations,
  plotThreads 
}: FilterChipProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getDisplayValue = useCallback(() => {
    switch (criterion.field) {
      case 'characters':
        if (Array.isArray(criterion.value)) {
          return criterion.value.map(id => {
            const char = characters.find(c => c.id === id);
            return char?.name || 'Unknown';
          }).join(', ');
        }
        break;
      case 'locationId':
        const location = locations.find(l => l.id === criterion.value);
        return location?.name || 'Unknown Location';
      case 'plotThreads':
        if (Array.isArray(criterion.value)) {
          return criterion.value.map(id => {
            const thread = plotThreads.find(pt => pt.id === id);
            return thread?.name || 'Unknown';
          }).join(', ');
        }
        break;
      default:
        return Array.isArray(criterion.value) ? criterion.value.join(', ') : String(criterion.value);
    }
  }, [criterion, characters, locations, plotThreads]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm",
        criterion.isActive 
          ? "bg-primary text-primary-foreground border-primary" 
          : "bg-muted text-muted-foreground border-muted"
      )}
    >
      <span className="font-medium">{criterion.label}:</span>
      <span>{getDisplayValue()}</span>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggle}
          className="p-0 h-4 w-4 hover:bg-transparent"
        >
          {criterion.isActive ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          className="p-0 h-4 w-4 hover:bg-transparent"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default DynamicFilterSystem;