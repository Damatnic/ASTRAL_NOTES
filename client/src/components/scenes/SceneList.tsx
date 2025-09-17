/**
 * Scene List Component
 * Displays scenes in various view modes with filtering and sorting
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Grid,
  List,
  Calendar,
  Search,
  Filter,
  SortDesc,
  Plus,
  Eye,
  Edit,
  ChevronDown,
  Users,
  MapPin,
  Clock,
  Activity,
  Target,
  FileText,
  Star,
  Hash,
  BarChart3,
  Columns,
  BookOpen
} from 'lucide-react';
import { SceneCard } from './SceneCard';
import { DraggableSceneCard } from './DraggableSceneCard';
import { SceneBoardView } from './SceneBoardView';
import { SceneTimelineView } from './SceneTimelineView';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Scene, Character, Location, Story } from '@/types/story';

interface SceneListProps {
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  story?: Story;
  viewMode?: 'card' | 'list' | 'board' | 'timeline';
  selectedSceneId?: string;
  expandedScenes?: Set<string>;
  onSceneSelect?: (sceneId: string) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneCreate?: () => void;
  onSceneView?: (sceneId: string) => void;
  onViewModeChange?: (mode: 'card' | 'list' | 'board' | 'timeline') => void;
  onToggleExpanded?: (sceneId: string) => void;
  onSceneReorder?: (sceneId: string, newOrder: number, newStatus?: string) => void;
  showMetadata?: boolean;
  className?: string;
}

type SortOption = 'order' | 'title' | 'updated' | 'wordcount' | 'status' | 'importance';
type FilterOption = 'all' | 'completed' | 'in-progress' | 'not-started' | 'bookmarked';

const SORT_OPTIONS: { value: SortOption; label: string; icon: any }[] = [
  { value: 'order', label: 'Scene Order', icon: Hash },
  { value: 'title', label: 'Title', icon: FileText },
  { value: 'updated', label: 'Last Updated', icon: Clock },
  { value: 'wordcount', label: 'Word Count', icon: BarChart3 },
  { value: 'status', label: 'Status', icon: Activity },
  { value: 'importance', label: 'Importance', icon: Star }
];

const FILTER_OPTIONS: { value: FilterOption; label: string; color?: string }[] = [
  { value: 'all', label: 'All Scenes' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'not-started', label: 'Not Started', color: 'bg-gray-100 text-gray-700' },
  { value: 'bookmarked', label: 'Bookmarked', color: 'bg-yellow-100 text-yellow-700' }
];

export function SceneList({
  scenes,
  characters = [],
  locations = [],
  story,
  viewMode = 'card',
  selectedSceneId,
  expandedScenes = new Set(),
  onSceneSelect,
  onSceneEdit,
  onSceneCreate,
  onSceneView,
  onViewModeChange,
  onToggleExpanded,
  onSceneReorder,
  showMetadata = true,
  className
}: SceneListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState<string>('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('');

  // Filter and sort scenes
  const filteredAndSortedScenes = useMemo(() => {
    let filtered = [...scenes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(scene =>
        scene.title.toLowerCase().includes(query) ||
        scene.summary?.toLowerCase().includes(query) ||
        scene.purpose?.toLowerCase().includes(query) ||
        scene.conflict?.toLowerCase().includes(query) ||
        scene.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(scene => {
        switch (filterBy) {
          case 'completed':
            return scene.status === 'completed';
          case 'in-progress':
            return scene.wordCount > 0 && scene.status !== 'completed';
          case 'not-started':
            return scene.wordCount === 0;
          case 'bookmarked':
            return scene.isBookmarked;
          default:
            return true;
        }
      });
    }

    // Apply character filter
    if (selectedCharacterFilter) {
      filtered = filtered.filter(scene =>
        scene.characters?.includes(selectedCharacterFilter) ||
        scene.povCharacterId === selectedCharacterFilter
      );
    }

    // Apply location filter
    if (selectedLocationFilter) {
      filtered = filtered.filter(scene => scene.locationId === selectedLocationFilter);
    }

    // Apply mood filter
    if (selectedMoodFilter) {
      filtered = filtered.filter(scene => scene.mood === selectedMoodFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'order':
          comparison = (a.order || 0) - (b.order || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'wordcount':
          comparison = (a.wordCount || 0) - (b.wordCount || 0);
          break;
        case 'status':
          const statusOrder = { 'planned': 0, 'outlined': 1, 'drafted': 2, 'revised': 3, 'completed': 4 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                      (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
        case 'importance':
          comparison = (a.importance || 0) - (b.importance || 0);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [scenes, searchQuery, sortBy, sortDirection, filterBy, selectedCharacterFilter, selectedLocationFilter, selectedMoodFilter]);

  // Get unique values for filters
  const availableCharacters = useMemo(() => {
    const characterIds = new Set<string>();
    scenes.forEach(scene => {
      scene.characters?.forEach(id => characterIds.add(id));
      if (scene.povCharacterId) characterIds.add(scene.povCharacterId);
    });
    return characters.filter(char => characterIds.has(char.id));
  }, [scenes, characters]);

  const availableLocations = useMemo(() => {
    const locationIds = new Set(scenes.map(scene => scene.locationId).filter(Boolean));
    return locations.filter(loc => locationIds.has(loc.id));
  }, [scenes, locations]);

  const availableMoods = useMemo(() => {
    const moods = new Set(scenes.map(scene => scene.mood).filter(Boolean));
    return Array.from(moods).sort();
  }, [scenes]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = scenes.length;
    const completed = scenes.filter(s => s.status === 'completed').length;
    const inProgress = scenes.filter(s => s.wordCount > 0 && s.status !== 'completed').length;
    const notStarted = scenes.filter(s => s.wordCount === 0).length;
    const totalWords = scenes.reduce((sum, s) => sum + (s.wordCount || 0), 0);
    const avgWords = total > 0 ? Math.round(totalWords / total) : 0;

    return { total, completed, inProgress, notStarted, totalWords, avgWords };
  }, [scenes]);

  const handleSortChange = (newSort: SortOption) => {
    if (sortBy === newSort) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterBy('all');
    setSelectedCharacterFilter('');
    setSelectedLocationFilter('');
    setSelectedMoodFilter('');
  };

  const hasActiveFilters = searchQuery || filterBy !== 'all' || selectedCharacterFilter || 
                         selectedLocationFilter || selectedMoodFilter;

  return (
    <div className={cn("scene-list", className)}>
      {/* Header & Controls */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Scenes
              <Badge variant="outline" className="ml-2">
                {filteredAndSortedScenes.length} of {scenes.length}
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <div className="flex items-center border rounded-md">
                <Button
                  size="sm"
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  onClick={() => onViewModeChange?.('card')}
                  className="rounded-r-none border-r"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => onViewModeChange?.('list')}
                  className="rounded-none border-r"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'board' ? 'default' : 'ghost'}
                  onClick={() => onViewModeChange?.('board')}
                  className="rounded-none border-r"
                >
                  <Columns className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  onClick={() => onViewModeChange?.('timeline')}
                  className="rounded-l-none"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>

              {onSceneCreate && (
                <Button onClick={onSceneCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Scene
                </Button>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {stats.completed} completed, {stats.inProgress} in progress, {stats.notStarted} not started
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              {stats.totalWords.toLocaleString()} total words ({stats.avgWords} avg)
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Basic Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scenes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {FILTER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(hasActiveFilters && "border-cosmic-500 text-cosmic-600")}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              <ChevronDown className={cn(
                "h-4 w-4 ml-1 transition-transform",
                showFilters && "rotate-180"
              )} />
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Character</label>
                  <select
                    value={selectedCharacterFilter}
                    onChange={(e) => setSelectedCharacterFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    <option value="">All Characters</option>
                    {availableCharacters.map(char => (
                      <option key={char.id} value={char.id}>
                        {char.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <select
                    value={selectedLocationFilter}
                    onChange={(e) => setSelectedLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    <option value="">All Locations</option>
                    {availableLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mood</label>
                  <select
                    value={selectedMoodFilter}
                    onChange={(e) => setSelectedMoodFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    <option value="">All Moods</option>
                    {availableMoods.map(mood => (
                      <option key={mood} value={mood}>
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {filteredAndSortedScenes.length} scenes match your filters
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scene Views */}
      {filteredAndSortedScenes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {scenes.length === 0 ? 'No scenes yet' : 'No scenes match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {scenes.length === 0 
                ? 'Start building your story by creating your first scene.'
                : 'Try adjusting your search terms or filters to find scenes.'
              }
            </p>
            {scenes.length === 0 && onSceneCreate && (
              <Button onClick={onSceneCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Scene
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Board View */}
          {viewMode === 'board' && (
            <SceneBoardView
              scenes={filteredAndSortedScenes}
              characters={characters}
              locations={locations}
              selectedSceneId={selectedSceneId}
              expandedScenes={expandedScenes}
              onSceneSelect={onSceneSelect}
              onSceneEdit={onSceneEdit}
              onSceneCreate={onSceneCreate}
              onSceneView={onSceneView}
              onToggleExpanded={onToggleExpanded}
              onSceneReorder={onSceneReorder}
              showMetadata={showMetadata}
            />
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <SceneTimelineView
              scenes={filteredAndSortedScenes}
              characters={characters}
              locations={locations}
              selectedSceneId={selectedSceneId}
              expandedScenes={expandedScenes}
              onSceneSelect={onSceneSelect}
              onSceneEdit={onSceneEdit}
              onSceneCreate={onSceneCreate}
              onSceneView={onSceneView}
              onToggleExpanded={onToggleExpanded}
              onSceneReorder={onSceneReorder}
              showMetadata={showMetadata}
            />
          )}

          {/* Card and List Views with Drag and Drop */}
          {(viewMode === 'card' || viewMode === 'list') && (
            <DndProvider backend={HTML5Backend}>
              <div className={cn(
                "scenes-container",
                viewMode === 'card' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                viewMode === 'list' && "space-y-4"
              )}>
                {filteredAndSortedScenes.map((scene, index) => (
                  <DraggableSceneCard
                    key={scene.id}
                    scene={scene}
                    index={index}
                    characters={characters}
                    locations={locations}
                    isSelected={selectedSceneId === scene.id}
                    isExpanded={expandedScenes.has(scene.id)}
                    showMetadata={showMetadata}
                    viewMode={viewMode}
                    onEdit={() => onSceneEdit?.(scene.id)}
                    onSelect={() => onSceneSelect?.(scene.id)}
                    onToggleExpanded={() => onToggleExpanded?.(scene.id)}
                    onViewChange={() => onSceneView?.(scene.id)}
                    onMoveScene={(dragIndex: number, hoverIndex: number) => {
                      if (!onSceneReorder) return;
                      const draggedScene = filteredAndSortedScenes[dragIndex];
                      if (draggedScene) {
                        onSceneReorder(draggedScene.id, hoverIndex + 1);
                      }
                    }}
                  />
                ))}
              </div>
            </DndProvider>
          )}
        </>
      )}
    </div>
  );
}

export default SceneList;