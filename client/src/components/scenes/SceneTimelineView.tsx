/**
 * Scene Timeline View Component
 * Linear timeline view showing scenes in chronological or narrative order
 */

import React, { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Target,
  Plus,
  Filter,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Book,
  Film,
  Activity
} from 'lucide-react';
import { DraggableSceneCard } from './DraggableSceneCard';
import type { Scene, Character, Location } from '@/types/story';

interface SceneTimelineViewProps {
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  selectedSceneId?: string;
  expandedScenes?: Set<string>;
  onSceneSelect?: (sceneId: string) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneCreate?: () => void;
  onSceneView?: (sceneId: string) => void;
  onToggleExpanded?: (sceneId: string) => void;
  onSceneReorder?: (sceneId: string, newOrder: number) => void;
  showMetadata?: boolean;
  className?: string;
}

type TimelineMode = 'narrative' | 'chronological';
type GroupingMode = 'none' | 'chapter' | 'act' | 'location' | 'character' | 'timeofday';

export function SceneTimelineView({
  scenes,
  characters = [],
  locations = [],
  selectedSceneId,
  expandedScenes = new Set(),
  onSceneSelect,
  onSceneEdit,
  onSceneCreate,
  onSceneView,
  onToggleExpanded,
  onSceneReorder,
  showMetadata = true,
  className
}: SceneTimelineViewProps) {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('narrative');
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('chapter');
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Sort and group scenes
  const { sortedScenes, groupedScenes } = useMemo(() => {
    const sorted = [...scenes];

    // Sort based on timeline mode
    if (timelineMode === 'narrative') {
      sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
    } else {
      // Chronological sorting - would need timeline position data
      sorted.sort((a, b) => {
        // For now, fallback to order
        return (a.order || 0) - (b.order || 0);
      });
    }

    // Group scenes
    const grouped: { [key: string]: Scene[] } = {};
    
    if (groupingMode === 'none') {
      grouped['All Scenes'] = sorted;
    } else {
      sorted.forEach(scene => {
        let groupKey = 'Ungrouped';
        
        switch (groupingMode) {
          case 'chapter':
            groupKey = scene.chapterId ? `Chapter ${scene.chapterId}` : 'No Chapter';
            break;
          case 'act':
            groupKey = scene.actId ? `Act ${scene.actId}` : 'No Act';
            break;
          case 'location':
            const location = locations.find(loc => loc.id === scene.locationId);
            groupKey = location ? location.name : 'No Location';
            break;
          case 'character':
            const povChar = characters.find(char => char.id === scene.povCharacterId);
            groupKey = povChar ? `${povChar.name} POV` : 'No POV Character';
            break;
          case 'timeofday':
            groupKey = scene.timeOfDay ? scene.timeOfDay.charAt(0).toUpperCase() + scene.timeOfDay.slice(1) : 'No Time';
            break;
        }
        
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(scene);
      });
    }

    return { sortedScenes: sorted, groupedScenes: grouped };
  }, [scenes, timelineMode, groupingMode, characters, locations]);

  const handleMoveScene = (dragIndex: number, hoverIndex: number) => {
    if (!onSceneReorder) return;

    const draggedScene = sortedScenes[dragIndex];
    if (!draggedScene) return;

    // Calculate new order
    const newOrder = hoverIndex + 1;
    onSceneReorder(draggedScene.id, newOrder);
  };

  const toggleGroupCollapse = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey);
    } else {
      newCollapsed.add(groupKey);
    }
    setCollapsedGroups(newCollapsed);
  };

  const getGroupStats = (scenes: Scene[]) => {
    const totalWords = scenes.reduce((sum, scene) => sum + (scene.wordCount || 0), 0);
    const completedScenes = scenes.filter(scene => scene.status === 'completed').length;
    const duration = scenes.length; // Could be more sophisticated
    
    return { totalWords, completedScenes, total: scenes.length, duration };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn("scene-timeline-view", className)}>
        {/* Timeline Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scene Timeline
                <Badge variant="outline" className="ml-2">
                  {scenes.length} scenes
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                {/* Timeline Mode Toggle */}
                <div className="flex items-center border rounded-md">
                  <Button
                    size="sm"
                    variant={timelineMode === 'narrative' ? 'default' : 'ghost'}
                    onClick={() => setTimelineMode('narrative')}
                    className="rounded-r-none border-r"
                  >
                    <Book className="h-4 w-4 mr-1" />
                    Narrative
                  </Button>
                  <Button
                    size="sm"
                    variant={timelineMode === 'chronological' ? 'default' : 'ghost'}
                    onClick={() => setTimelineMode('chronological')}
                    className="rounded-l-none"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Chronological
                  </Button>
                </div>

                {/* Grouping Mode */}
                <select
                  value={groupingMode}
                  onChange={(e) => setGroupingMode(e.target.value as GroupingMode)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="none">No Grouping</option>
                  <option value="chapter">By Chapter</option>
                  <option value="act">By Act</option>
                  <option value="location">By Location</option>
                  <option value="character">By POV Character</option>
                  <option value="timeofday">By Time of Day</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>

                {onSceneCreate && (
                  <Button onClick={onSceneCreate}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Scene
                  </Button>
                )}
              </div>
            </div>

            {/* Timeline Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                {scenes.filter(s => s.status === 'completed').length} of {scenes.length} completed
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {scenes.reduce((sum, s) => sum + (s.wordCount || 0), 0).toLocaleString()} total words
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {new Set(scenes.map(s => s.locationId).filter(Boolean)).size} locations
              </div>
            </div>
          </CardHeader>

          {/* Filters */}
          {showFilters && (
            <CardContent className="border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                    <option value="">All Statuses</option>
                    <option value="planned">Planned</option>
                    <option value="outlined">Outlined</option>
                    <option value="drafted">Drafted</option>
                    <option value="revised">Revised</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Character</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                    <option value="">All Characters</option>
                    {characters.map(char => (
                      <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                    <option value="">All Locations</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                    <option value="">All Times</option>
                    <option value="dawn">Dawn</option>
                    <option value="morning">Morning</option>
                    <option value="midday">Midday</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Timeline Content */}
        <div className="space-y-6">
          {Object.entries(groupedScenes).map(([groupKey, groupScenes]) => {
            const isCollapsed = collapsedGroups.has(groupKey);
            const stats = getGroupStats(groupScenes);

            return (
              <Card key={groupKey} className="timeline-group">
                {groupingMode !== 'none' && (
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroupCollapse(groupKey)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {groupKey}
                        <Badge variant="outline" className="ml-2">
                          {groupScenes.length} scenes
                        </Badge>
                      </CardTitle>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{stats.completedScenes}/{stats.total} completed</span>
                        <span>{stats.totalWords.toLocaleString()} words</span>
                      </div>
                    </div>
                  </CardHeader>
                )}

                {!isCollapsed && (
                  <CardContent className={groupingMode !== 'none' ? 'pt-0' : ''}>
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
                      
                      {/* Timeline Scenes */}
                      <div className="space-y-6">
                        {groupScenes.map((scene, index) => (
                          <div key={scene.id} className="relative flex items-start gap-6">
                            {/* Timeline Marker */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 bg-background",
                                scene.status === 'completed' && "border-green-500 bg-green-500",
                                scene.status === 'drafted' && "border-blue-500 bg-blue-500",
                                scene.status === 'outlined' && "border-orange-500 bg-orange-500",
                                scene.status === 'planned' && "border-gray-400"
                              )} />
                              
                              {/* Scene Number */}
                              <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                                <Badge variant="outline" className="text-xs">
                                  #{scene.order || index + 1}
                                </Badge>
                              </div>
                            </div>

                            {/* Scene Card */}
                            <div className="flex-1 pt-0">
                              <DraggableSceneCard
                                scene={scene}
                                index={index}
                                characters={characters}
                                locations={locations}
                                isSelected={selectedSceneId === scene.id}
                                isExpanded={expandedScenes.has(scene.id)}
                                showMetadata={showMetadata}
                                viewMode="list"
                                onEdit={() => onSceneEdit?.(scene.id)}
                                onSelect={() => onSceneSelect?.(scene.id)}
                                onToggleExpanded={() => onToggleExpanded?.(scene.id)}
                                onViewChange={() => onSceneView?.(scene.id)}
                                onMoveScene={handleMoveScene}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {scenes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No scenes yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your story timeline by creating your first scene.
              </p>
              {onSceneCreate && (
                <Button onClick={onSceneCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Scene
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DndProvider>
  );
}

export default SceneTimelineView;