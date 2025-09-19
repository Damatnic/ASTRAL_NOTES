/**
 * Smart Grouping System
 * Intelligent scene organization by Act, Chapter, Character, Location, Theme
 * Advanced algorithms for automatic grouping and relationship detection
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Layers, 
  Users, 
  MapPin, 
  BookOpen, 
  Target, 
  Sparkles,
  Filter,
  Settings,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Hash,
  Zap,
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff,
  Shuffle,
  Grid,
  List,
  ArrowUpDown
} from 'lucide-react';
import type { Scene, Character, Location, PlotThread, Act, Chapter } from '@/types/story';

export type GroupingCriteria = 
  | 'none'
  | 'act' 
  | 'chapter' 
  | 'character' 
  | 'location' 
  | 'plotthread' 
  | 'theme'
  | 'status'
  | 'importance'
  | 'timeline'
  | 'custom';

export interface GroupingRule {
  id: string;
  name: string;
  criteria: GroupingCriteria;
  icon: React.ReactNode;
  description: string;
  algorithm: 'exact' | 'fuzzy' | 'semantic' | 'ml';
  priority: number;
  isActive: boolean;
  customLogic?: (scenes: Scene[]) => SceneGroup[];
}

export interface SceneGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  criteria: GroupingCriteria;
  scenes: Scene[];
  metadata: {
    sceneCount: number;
    wordCount: number;
    completionRate: number;
    averageImportance: number;
    timeSpan?: { start: string; end: string };
    dominantCharacters: string[];
    dominantLocations: string[];
    themes: string[];
  };
  isExpanded: boolean;
  isVisible: boolean;
  customData?: Record<string, any>;
}

export interface GroupingState {
  activeRules: GroupingRule[];
  groups: SceneGroup[];
  hierarchicalGroups: Map<string, SceneGroup[]>; // Parent group ID -> child groups
  ungroupedScenes: Scene[];
  sortBy: 'name' | 'size' | 'completion' | 'importance' | 'chronology';
  sortOrder: 'asc' | 'desc';
  filterQuery: string;
  showEmptyGroups: boolean;
  groupingStrategy: 'single' | 'hierarchical' | 'hybrid';
}

const GROUPING_RULES: GroupingRule[] = [
  {
    id: 'act',
    name: 'By Act',
    criteria: 'act',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Group scenes by story acts (3-act, 5-act, etc.)',
    algorithm: 'exact',
    priority: 1,
    isActive: false
  },
  {
    id: 'chapter',
    name: 'By Chapter',
    criteria: 'chapter',
    icon: <Hash className="h-4 w-4" />,
    description: 'Organize scenes by chapter structure',
    algorithm: 'exact',
    priority: 2,
    isActive: false
  },
  {
    id: 'character',
    name: 'By Character',
    criteria: 'character',
    icon: <Users className="h-4 w-4" />,
    description: 'Group by POV character or main participants',
    algorithm: 'fuzzy',
    priority: 3,
    isActive: false
  },
  {
    id: 'location',
    name: 'By Location',
    criteria: 'location',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Organize by scene locations and settings',
    algorithm: 'exact',
    priority: 4,
    isActive: false
  },
  {
    id: 'plotthread',
    name: 'By Plot Thread',
    criteria: 'plotthread',
    icon: <Zap className="h-4 w-4" />,
    description: 'Group by subplot and story threads',
    algorithm: 'semantic',
    priority: 5,
    isActive: false
  },
  {
    id: 'theme',
    name: 'By Theme',
    criteria: 'theme',
    icon: <Target className="h-4 w-4" />,
    description: 'Intelligent grouping by thematic content',
    algorithm: 'ml',
    priority: 6,
    isActive: false
  },
  {
    id: 'status',
    name: 'By Status',
    criteria: 'status',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Group by development status and progress',
    algorithm: 'exact',
    priority: 7,
    isActive: false
  },
  {
    id: 'importance',
    name: 'By Importance',
    criteria: 'importance',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Organize by scene importance and impact',
    algorithm: 'exact',
    priority: 8,
    isActive: false
  }
];

const GROUP_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#EF4444'
];

interface SmartGroupingSystemProps {
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  plotThreads?: PlotThread[];
  acts?: Act[];
  chapters?: Chapter[];
  onGroupingChange?: (groups: SceneGroup[]) => void;
  onSceneGroupUpdate?: (sceneId: string, groupId: string) => void;
  className?: string;
}

export function SmartGroupingSystem({
  scenes,
  characters = [],
  locations = [],
  plotThreads = [],
  acts = [],
  chapters = [],
  onGroupingChange,
  onSceneGroupUpdate,
  className
}: SmartGroupingSystemProps) {
  const [groupingState, setGroupingState] = useState<GroupingState>({
    activeRules: [],
    groups: [],
    hierarchicalGroups: new Map(),
    ungroupedScenes: scenes,
    sortBy: 'name',
    sortOrder: 'asc',
    filterQuery: '',
    showEmptyGroups: false,
    groupingStrategy: 'single'
  });

  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Advanced grouping algorithms
  const groupingAlgorithms = useMemo(() => ({
    exact: (scenes: Scene[], criteria: GroupingCriteria): SceneGroup[] => {
      const groupMap = new Map<string, Scene[]>();

      scenes.forEach(scene => {
        let groupKey = 'Ungrouped';

        switch (criteria) {
          case 'act':
            groupKey = scene.actId ? `Act ${scene.actId}` : 'No Act';
            break;
          case 'chapter':
            groupKey = scene.chapterId ? `Chapter ${scene.chapterId}` : 'No Chapter';
            break;
          case 'location':
            if (scene.locationId) {
              const location = locations.find(l => l.id === scene.locationId);
              groupKey = location?.name || 'Unknown Location';
            } else {
              groupKey = 'No Location';
            }
            break;
          case 'status':
            groupKey = scene.status ? scene.status.charAt(0).toUpperCase() + scene.status.slice(1) : 'No Status';
            break;
          case 'importance':
            groupKey = scene.importance ? `Priority ${scene.importance}` : 'No Priority';
            break;
        }

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, []);
        }
        groupMap.get(groupKey)!.push(scene);
      });

      return Array.from(groupMap.entries()).map(([name, groupScenes], index) =>
        createSceneGroup(name, groupScenes, criteria, GROUP_COLORS[index % GROUP_COLORS.length])
      );
    },

    fuzzy: (scenes: Scene[], criteria: GroupingCriteria): SceneGroup[] => {
      const groupMap = new Map<string, Scene[]>();

      scenes.forEach(scene => {
        let groupKeys: string[] = [];

        switch (criteria) {
          case 'character':
            // Group by POV character or main characters
            if (scene.povCharacterId) {
              const character = characters.find(c => c.id === scene.povCharacterId);
              if (character) groupKeys.push(character.name);
            }
            
            // Also consider other important characters
            scene.characters?.forEach(charId => {
              const character = characters.find(c => c.id === charId);
              if (character && character.importance >= 3) {
                groupKeys.push(character.name);
              }
            });

            if (groupKeys.length === 0) groupKeys = ['No Main Character'];
            break;
        }

        // Add scene to all relevant groups
        groupKeys.forEach(key => {
          if (!groupMap.has(key)) {
            groupMap.set(key, []);
          }
          groupMap.get(key)!.push(scene);
        });
      });

      return Array.from(groupMap.entries()).map(([name, groupScenes], index) =>
        createSceneGroup(name, groupScenes, criteria, GROUP_COLORS[index % GROUP_COLORS.length])
      );
    },

    semantic: (scenes: Scene[], criteria: GroupingCriteria): SceneGroup[] => {
      const groupMap = new Map<string, Scene[]>();

      scenes.forEach(scene => {
        let groupKey = 'Ungrouped';

        switch (criteria) {
          case 'plotthread':
            if (scene.plotThreads && scene.plotThreads.length > 0) {
              const mainThread = plotThreads.find(pt => pt.id === scene.plotThreads![0]);
              groupKey = mainThread?.name || 'Unknown Plot Thread';
            } else {
              groupKey = 'Main Plot';
            }
            break;
        }

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, []);
        }
        groupMap.get(groupKey)!.push(scene);
      });

      return Array.from(groupMap.entries()).map(([name, groupScenes], index) =>
        createSceneGroup(name, groupScenes, criteria, GROUP_COLORS[index % GROUP_COLORS.length])
      );
    },

    ml: (scenes: Scene[], criteria: GroupingCriteria): SceneGroup[] => {
      // Simulated ML-based thematic grouping
      const themes = extractThemes(scenes);
      const groupMap = new Map<string, Scene[]>();

      scenes.forEach(scene => {
        const sceneThemes = analyzeSceneThemes(scene, themes);
        const dominantTheme = sceneThemes[0] || 'General';

        if (!groupMap.has(dominantTheme)) {
          groupMap.set(dominantTheme, []);
        }
        groupMap.get(dominantTheme)!.push(scene);
      });

      return Array.from(groupMap.entries()).map(([name, groupScenes], index) =>
        createSceneGroup(name, groupScenes, criteria, GROUP_COLORS[index % GROUP_COLORS.length])
      );
    }
  }), [characters, locations, plotThreads]);

  // Helper function to create scene groups
  const createSceneGroup = useCallback((
    name: string, 
    scenes: Scene[], 
    criteria: GroupingCriteria, 
    color: string
  ): SceneGroup => {
    const wordCount = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
    const completedScenes = scenes.filter(scene => scene.status === 'complete').length;
    const completionRate = scenes.length > 0 ? (completedScenes / scenes.length) * 100 : 0;
    const averageImportance = scenes.reduce((sum, scene) => sum + (scene.importance || 0), 0) / scenes.length;

    return {
      id: `${criteria}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      color,
      criteria,
      scenes,
      metadata: {
        sceneCount: scenes.length,
        wordCount,
        completionRate,
        averageImportance,
        dominantCharacters: extractDominantCharacters(scenes, characters),
        dominantLocations: extractDominantLocations(scenes, locations),
        themes: extractSceneGroupThemes(scenes)
      },
      isExpanded: true,
      isVisible: true
    };
  }, [characters, locations]);

  // Extract themes from scenes (simplified implementation)
  const extractThemes = useCallback((scenes: Scene[]): string[] => {
    const themeKeywords = [
      'love', 'betrayal', 'redemption', 'power', 'family', 'friendship',
      'sacrifice', 'revenge', 'discovery', 'growth', 'conflict', 'mystery'
    ];

    const themeCount = new Map<string, number>();
    
    scenes.forEach(scene => {
      const content = `${scene.title} ${scene.summary || ''} ${scene.notes || ''}`.toLowerCase();
      themeKeywords.forEach(theme => {
        if (content.includes(theme)) {
          themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
        }
      });
    });

    return Array.from(themeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }, []);

  const analyzeSceneThemes = useCallback((scene: Scene, availableThemes: string[]): string[] => {
    const content = `${scene.title} ${scene.summary || ''} ${scene.notes || ''}`.toLowerCase();
    return availableThemes.filter(theme => content.includes(theme));
  }, []);

  const extractDominantCharacters = useCallback((scenes: Scene[], characters: Character[]): string[] => {
    const charCount = new Map<string, number>();
    
    scenes.forEach(scene => {
      scene.characters?.forEach(charId => {
        charCount.set(charId, (charCount.get(charId) || 0) + 1);
      });
      
      if (scene.povCharacterId) {
        charCount.set(scene.povCharacterId, (charCount.get(scene.povCharacterId) || 0) + 2);
      }
    });

    return Array.from(charCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([charId]) => {
        const character = characters.find(c => c.id === charId);
        return character?.name || 'Unknown';
      });
  }, []);

  const extractDominantLocations = useCallback((scenes: Scene[], locations: Location[]): string[] => {
    const locCount = new Map<string, number>();
    
    scenes.forEach(scene => {
      if (scene.locationId) {
        locCount.set(scene.locationId, (locCount.get(scene.locationId) || 0) + 1);
      }
    });

    return Array.from(locCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([locId]) => {
        const location = locations.find(l => l.id === locId);
        return location?.name || 'Unknown';
      });
  }, []);

  const extractSceneGroupThemes = useCallback((scenes: Scene[]): string[] => {
    // Extract common themes from scene tags and content
    const tagCount = new Map<string, number>();
    
    scenes.forEach(scene => {
      scene.tags?.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  }, []);

  // Apply grouping rules
  const applyGrouping = useCallback(async () => {
    if (groupingState.activeRules.length === 0) {
      setGroupingState(prev => ({
        ...prev,
        groups: [],
        ungroupedScenes: scenes
      }));
      return;
    }

    setIsAnalyzing(true);

    try {
      const rule = groupingState.activeRules[0]; // For now, use single rule
      const algorithm = groupingAlgorithms[rule.algorithm];
      const newGroups = algorithm(scenes, rule.criteria);

      const updatedGroups = newGroups.map(group => ({
        ...group,
        isExpanded: true,
        isVisible: true
      }));

      const groupedSceneIds = new Set(
        updatedGroups.flatMap(group => group.scenes.map(scene => scene.id))
      );
      const ungrouped = scenes.filter(scene => !groupedSceneIds.has(scene.id));

      setGroupingState(prev => ({
        ...prev,
        groups: updatedGroups,
        ungroupedScenes: ungrouped
      }));

      onGroupingChange?.(updatedGroups);

    } catch (error) {
      console.error('Grouping failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [scenes, groupingState.activeRules, groupingAlgorithms, onGroupingChange]);

  // Toggle grouping rule
  const toggleRule = useCallback((ruleId: string) => {
    setGroupingState(prev => {
      const rule = GROUPING_RULES.find(r => r.id === ruleId);
      if (!rule) return prev;

      const isCurrentlyActive = prev.activeRules.some(r => r.id === ruleId);
      
      let newActiveRules;
      if (isCurrentlyActive) {
        newActiveRules = prev.activeRules.filter(r => r.id !== ruleId);
      } else {
        // For now, only allow one active rule (single strategy)
        newActiveRules = [{ ...rule, isActive: true }];
      }

      return {
        ...prev,
        activeRules: newActiveRules
      };
    });
  }, []);

  // Apply grouping when rules change
  useEffect(() => {
    applyGrouping();
  }, [applyGrouping]);

  // Filter and sort groups
  const filteredGroups = useMemo(() => {
    let filtered = groupingState.groups.filter(group => {
      if (!groupingState.showEmptyGroups && group.scenes.length === 0) {
        return false;
      }
      
      if (groupingState.filterQuery) {
        const query = groupingState.filterQuery.toLowerCase();
        return group.name.toLowerCase().includes(query) ||
               group.description?.toLowerCase().includes(query) ||
               group.metadata.themes.some(theme => theme.toLowerCase().includes(query));
      }
      
      return group.isVisible;
    });

    // Sort groups
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (groupingState.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.metadata.sceneCount - b.metadata.sceneCount;
          break;
        case 'completion':
          comparison = a.metadata.completionRate - b.metadata.completionRate;
          break;
        case 'importance':
          comparison = a.metadata.averageImportance - b.metadata.averageImportance;
          break;
      }

      return groupingState.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [groupingState]);

  const toggleGroupExpansion = useCallback((groupId: string) => {
    setGroupingState(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
      )
    }));
  }, []);

  const toggleGroupVisibility = useCallback((groupId: string) => {
    setGroupingState(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId ? { ...group, isVisible: !group.isVisible } : group
      )
    }));
  }, []);

  return (
    <div className={cn("smart-grouping-system", className)}>
      {/* Grouping Controls */}
      <Card className="grouping-controls mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Smart Grouping
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={showAdvanced ? 'default' : 'ghost'}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Advanced
              </Button>

              <Button
                size="sm"
                onClick={() => applyGrouping()}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Sparkles className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4 mr-1" />
                )}
                Analyze
              </Button>
            </div>
          </div>

          {/* Quick Rule Selection */}
          <div className="flex flex-wrap gap-2 mt-3">
            {GROUPING_RULES.map(rule => (
              <Button
                key={rule.id}
                size="sm"
                variant={groupingState.activeRules.some(r => r.id === rule.id) ? 'default' : 'outline'}
                onClick={() => toggleRule(rule.id)}
                className="flex items-center gap-2"
                title={rule.description}
              >
                {rule.icon}
                <span>{rule.name}</span>
              </Button>
            ))}
          </div>

          {/* Advanced Controls */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 border-t pt-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sort by:</label>
                    <select
                      value={groupingState.sortBy}
                      onChange={(e) => setGroupingState(prev => ({
                        ...prev,
                        sortBy: e.target.value as any
                      }))}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="name">Name</option>
                      <option value="size">Scene Count</option>
                      <option value="completion">Completion</option>
                      <option value="importance">Importance</option>
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setGroupingState(prev => ({
                      ...prev,
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                    }))}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {groupingState.sortOrder.toUpperCase()}
                  </Button>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-empty"
                      checked={groupingState.showEmptyGroups}
                      onChange={(e) => setGroupingState(prev => ({
                        ...prev,
                        showEmptyGroups: e.target.checked
                      }))}
                    />
                    <label htmlFor="show-empty" className="text-sm">
                      Show empty groups
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter groups..."
                    value={groupingState.filterQuery}
                    onChange={(e) => setGroupingState(prev => ({
                      ...prev,
                      filterQuery: e.target.value
                    }))}
                    className="text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
      </Card>

      {/* Groups Display */}
      <div className="groups-container space-y-4">
        {filteredGroups.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <GroupCard
                  group={group}
                  onToggleExpansion={() => toggleGroupExpansion(group.id)}
                  onToggleVisibility={() => toggleGroupVisibility(group.id)}
                  characters={characters}
                  locations={locations}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <Card className="empty-state">
            <CardContent className="py-8 text-center">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">No groups created</h3>
              <p className="text-muted-foreground mb-4">
                Select a grouping rule above to organize your scenes intelligently.
              </p>
              <Button onClick={() => toggleRule('act')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Start with Acts
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ungrouped Scenes */}
        {groupingState.ungroupedScenes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: filteredGroups.length * 0.05 }}
          >
            <Card className="ungrouped-scenes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-5 w-5" />
                  Ungrouped Scenes
                  <Badge variant="outline">
                    {groupingState.ungroupedScenes.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  These scenes don't fit the current grouping criteria and may need manual organization.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Individual Group Card Component
interface GroupCardProps {
  group: SceneGroup;
  onToggleExpansion: () => void;
  onToggleVisibility: () => void;
  characters: Character[];
  locations: Location[];
}

function GroupCard({ 
  group, 
  onToggleExpansion, 
  onToggleVisibility, 
  characters, 
  locations 
}: GroupCardProps) {
  return (
    <Card 
      className={cn(
        "group-card transition-all duration-200",
        !group.isVisible && "opacity-50"
      )}
      style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleExpansion}
              className="p-1"
            >
              {group.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {group.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {group.metadata.sceneCount} scenes
            </Badge>
            
            {group.metadata.completionRate > 0 && (
              <Badge variant={group.metadata.completionRate === 100 ? "default" : "secondary"}>
                {Math.round(group.metadata.completionRate)}% complete
              </Badge>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleVisibility}
              className="p-1"
            >
              {group.isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Group Metadata */}
        <AnimatePresence>
          {group.isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  {group.metadata.wordCount.toLocaleString()} words
                </div>
                
                {group.metadata.averageImportance > 0 && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {group.metadata.averageImportance.toFixed(1)} importance
                  </div>
                )}
              </div>

              {group.metadata.dominantCharacters.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {group.metadata.dominantCharacters.map(char => (
                      <Badge key={char} variant="outline" className="text-xs">
                        {char}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {group.metadata.dominantLocations.length > 0 && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {group.metadata.dominantLocations.map(loc => (
                      <Badge key={loc} variant="outline" className="text-xs">
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {group.metadata.themes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {group.metadata.themes.map(theme => (
                      <Badge key={theme} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>
    </Card>
  );
}

export default SmartGroupingSystem;