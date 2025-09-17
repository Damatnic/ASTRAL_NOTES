/**
 * Advanced Search Component
 * Comprehensive search interface with filters, suggestions, and real-time results
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  Filter, 
  SortDesc, 
  Clock, 
  Zap,
  X,
  ChevronDown,
  ChevronUp,
  Hash,
  Calendar,
  Tag,
  User,
  MapPin,
  Package,
  BookOpen,
  MessageSquare,
  Scale,
  TrendingUp,
  FileText,
  Star
} from 'lucide-react';
import { searchService, type SearchOptions } from '@/services/searchService';
import type { SearchResult } from '@/types/story';

interface AdvancedSearchProps {
  projectId?: string;
  storyId?: string;
  onResultSelect?: (result: SearchResult) => void;
  onNavigate?: (id: string, type: string) => void;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

const TYPE_ICONS = {
  note: BookOpen,
  character: User,
  location: MapPin,
  item: Package,
  plotthread: Zap,
  scene: MessageSquare,
  worldrule: Scale,
  outline: FileText,
  research: BookOpen
};

const TYPE_COLORS = {
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  character: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  location: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  item: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  plotthread: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  scene: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  worldrule: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  outline: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  research: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
};

export function AdvancedSearch({
  projectId,
  storyId,
  onResultSelect,
  onNavigate,
  className,
  autoFocus = false,
  placeholder = "Search everything..."
}: AdvancedSearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Search filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title' | 'type'>('relevance');
  const [exactPhrase, setExactPhrase] = useState(false);
  const [fuzzySearch, setFuzzySearch] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | undefined>();

  // Search statistics
  const searchStats = useMemo(() => {
    if (projectId) {
      return searchService.getSearchStats(projectId);
    }
    return null;
  }, [projectId]);

  // Available filter options
  const availableTypes = ['note', 'character', 'location', 'item', 'plotthread', 'scene', 'worldrule', 'outline', 'research'];
  const availableTags = ['important', 'draft', 'complete', 'review', 'todo']; // Would be dynamically loaded

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        setResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTypes, selectedTags, sortBy, exactPhrase, fuzzySearch, dateRange, projectId, storyId]);

  // Get suggestions on input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2 && query.length < 20) {
        const newSuggestions = searchService.getSuggestions(query, projectId);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0 && document.activeElement === searchInputRef.current);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, projectId]);

  // Load popular searches on mount
  useEffect(() => {
    const popular = searchService.getPopularSearches(projectId);
    setPopularSearches(popular);
  }, [projectId]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchOptions: SearchOptions = {
        query: query.trim(),
        projectId,
        storyId,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy,
        exactPhrase,
        fuzzySearch,
        dateRange,
        limit: 50,
        includeContent: true
      };

      const searchResults = await searchService.search(searchOptions);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, projectId, storyId, selectedTypes, selectedTags, sortBy, exactPhrase, fuzzySearch, dateRange]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleResultSelect = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else if (onNavigate) {
      onNavigate(result.id, result.type);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedTags([]);
    setDateRange(undefined);
    setExactPhrase(false);
    setFuzzySearch(false);
    setSortBy('relevance');
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedTags.length > 0 || dateRange || exactPhrase || fuzzySearch;

  const getTypeIcon = (type: string) => {
    const IconComponent = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || BookOpen;
    return <IconComponent className="h-4 w-4" />;
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={cn("advanced-search", className)}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 pr-12 h-12 text-lg"
          />
          {(isLoading || hasActiveFilters) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTypes.length + selectedTags.length + (dateRange ? 1 : 0) + (exactPhrase ? 1 : 0) + (fuzzySearch ? 1 : 0)} filters
                </Badge>
              )}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-cosmic-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full p-3 text-left hover:bg-muted flex items-center gap-2"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>{highlightText(suggestion, query)}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter Controls */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 text-sm border rounded bg-background"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Content Types */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Content Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm border transition-colors",
                        selectedTypes.includes(type)
                          ? "bg-cosmic-500 text-white border-cosmic-500"
                          : "border-gray-300 hover:border-cosmic-300"
                      )}
                    >
                      {getTypeIcon(type)}
                      <span className="ml-1 capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm border transition-colors",
                        selectedTags.includes(tag)
                          ? "bg-cosmic-500 text-white border-cosmic-500"
                          : "border-gray-300 hover:border-cosmic-300"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Options */}
              <div>
                <h4 className="font-medium mb-2">Search Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exactPhrase}
                      onChange={(e) => setExactPhrase(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Exact phrase matching</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fuzzySearch}
                      onChange={(e) => setFuzzySearch(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Fuzzy search (find similar words)</span>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Popular Searches */}
      {!query && popularSearches.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular Searches
          </h4>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map(search => (
              <button
                key={search}
                onClick={() => setQuery(search)}
                className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query && (
        <div className="mt-6 space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {isLoading ? 'Searching...' : `${results.length} results for "${query}"`}
            </h3>
            {searchStats && (
              <Badge variant="outline" className="text-xs">
                Searching {searchStats.totalItems} items
              </Badge>
            )}
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found</p>
                <p className="text-sm">Try adjusting your search terms or filters</p>
              </div>
            )}

            {results.map((result) => (
              <Card
                key={result.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleResultSelect(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getTypeIcon(result.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">
                          {highlightText(result.title, query)}
                        </h4>
                        <Badge className={TYPE_COLORS[result.type as keyof typeof TYPE_COLORS]}>
                          {result.type}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3" />
                          {Math.round(result.relevance * 100)}%
                        </div>
                      </div>
                      
                      {result.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {highlightText(result.content.slice(0, 200), query)}
                          {result.content.length > 200 && '...'}
                        </p>
                      )}
                      
                      {result.matches && result.matches.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {result.matches.length} match{result.matches.length > 1 ? 'es' : ''} found
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search Statistics */}
      {searchStats && !query && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Search Index Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">{searchStats.totalItems}</div>
                  <div className="text-muted-foreground">Total Items</div>
                </div>
                <div>
                  <div className="font-medium">{searchStats.totalWords.toLocaleString()}</div>
                  <div className="text-muted-foreground">Total Words</div>
                </div>
                <div>
                  <div className="font-medium">{Object.keys(searchStats.itemsByType).length}</div>
                  <div className="text-muted-foreground">Content Types</div>
                </div>
                <div>
                  <div className="font-medium">
                    {new Date(searchStats.lastIndexed).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground">Last Indexed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdvancedSearch;