/**
 * Advanced Kanban View
 * Status-based workflow management with WIP limits and progress tracking
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { 
  Columns, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Edit,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Filter,
  ArrowRight,
  User,
  Calendar,
  Hash
} from 'lucide-react';
import { DraggableSceneItem } from '../advanced-dnd/DraggableSceneItem';
import { DroppableLane } from '../advanced-dnd/DroppableLane';
import { useViewMode } from './ViewModeProvider';
import type { Scene, Character, Location } from '@/types/story';

interface KanbanColumn {
  id: string;
  title: string;
  status: Scene['status'];
  color: string;
  description?: string;
  wipLimit?: number;
  scenes: Scene[];
  completionCriteria?: string[];
  isSystemColumn: boolean;
}

interface KanbanViewProps {
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  onSceneMove?: (sceneId: string, fromColumn: string, toColumn: string, newIndex: number) => void;
  onSceneEdit?: (sceneId: string) => void;
  onSceneSelect?: (sceneId: string) => void;
  onColumnEdit?: (columnId: string) => void;
  onColumnCreate?: () => void;
  className?: string;
}

const DEFAULT_COLUMNS: Omit<KanbanColumn, 'scenes'>[] = [
  {
    id: 'ideas',
    title: 'Ideas',
    status: 'planned',
    color: '#6B7280', // Gray
    description: 'Scene concepts and rough ideas',
    wipLimit: undefined,
    completionCriteria: ['Basic concept defined'],
    isSystemColumn: true
  },
  {
    id: 'planned',
    title: 'Planned',
    status: 'planned',
    color: '#3B82F6', // Blue
    description: 'Scenes ready for development',
    wipLimit: 10,
    completionCriteria: ['Outline complete', 'Characters assigned', 'Location set'],
    isSystemColumn: true
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    status: 'draft',
    color: '#F59E0B', // Amber
    description: 'Currently being written',
    wipLimit: 5,
    completionCriteria: ['First draft started', 'Key plot points identified'],
    isSystemColumn: true
  },
  {
    id: 'review',
    title: 'Review',
    status: 'draft',
    color: '#8B5CF6', // Purple
    description: 'Awaiting feedback or revision',
    wipLimit: 8,
    completionCriteria: ['First draft complete', 'Self-review done'],
    isSystemColumn: true
  },
  {
    id: 'revision',
    title: 'Revision',
    status: 'revised',
    color: '#EC4899', // Pink
    description: 'Being edited and improved',
    wipLimit: 6,
    completionCriteria: ['Feedback incorporated', 'Quality check passed'],
    isSystemColumn: true
  },
  {
    id: 'complete',
    title: 'Complete',
    status: 'complete',
    color: '#10B981', // Green
    description: 'Finished scenes',
    wipLimit: undefined,
    completionCriteria: ['Final review passed', 'Ready for publication'],
    isSystemColumn: true
  }
];

export function KanbanView({
  scenes,
  characters = [],
  locations = [],
  onSceneMove,
  onSceneEdit,
  onSceneSelect,
  onColumnEdit,
  onColumnCreate,
  className
}: KanbanViewProps) {
  const { viewState } = useViewMode();
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [showWipWarnings, setShowWipWarnings] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'character' | 'location' | 'priority'>('none');

  // Organize scenes into columns
  const columns = useMemo((): KanbanColumn[] => {
    return DEFAULT_COLUMNS.map(columnDef => ({
      ...columnDef,
      scenes: scenes.filter(scene => {
        // Map scene status to column
        switch (columnDef.id) {
          case 'ideas':
            return !scene.status || scene.status === 'planned' && !scene.summary;
          case 'planned':
            return scene.status === 'planned' && scene.summary;
          case 'in-progress':
            return scene.status === 'draft' && scene.wordCount === 0;
          case 'review':
            return scene.status === 'draft' && scene.wordCount > 0;
          case 'revision':
            return scene.status === 'revised';
          case 'complete':
            return scene.status === 'complete';
          default:
            return false;
        }
      })
    }));
  }, [scenes]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalScenes = scenes.length;
    const completedScenes = scenes.filter(s => s.status === 'complete').length;
    const inProgressScenes = scenes.filter(s => s.status === 'draft').length;
    const completionRate = totalScenes > 0 ? (completedScenes / totalScenes) * 100 : 0;
    
    const totalWords = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
    const averageWordsPerScene = totalScenes > 0 ? Math.round(totalWords / totalScenes) : 0;
    
    const wipViolations = columns.filter(col => 
      col.wipLimit && col.scenes.length > col.wipLimit
    ).length;

    return {
      totalScenes,
      completedScenes,
      inProgressScenes,
      completionRate,
      totalWords,
      averageWordsPerScene,
      wipViolations
    };
  }, [scenes, columns]);

  // Group scenes within columns if needed
  const getGroupedScenes = useCallback((columnScenes: Scene[]) => {
    if (groupBy === 'none') return { 'All Scenes': columnScenes };

    const groups: Record<string, Scene[]> = {};

    columnScenes.forEach(scene => {
      let groupKey = 'Ungrouped';

      switch (groupBy) {
        case 'character':
          const mainChar = scene.povCharacterId || scene.characters?.[0];
          if (mainChar) {
            const character = characters.find(c => c.id === mainChar);
            groupKey = character?.name || 'Unknown Character';
          }
          break;
        case 'location':
          if (scene.locationId) {
            const location = locations.find(l => l.id === scene.locationId);
            groupKey = location?.name || 'Unknown Location';
          }
          break;
        case 'priority':
          groupKey = scene.importance ? `Priority ${scene.importance}` : 'No Priority';
          break;
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(scene);
    });

    return groups;
  }, [groupBy, characters, locations]);

  const handleColumnClick = useCallback((columnId: string) => {
    setSelectedColumn(selectedColumn === columnId ? null : columnId);
  }, [selectedColumn]);

  const handleSceneDrop = useCallback((
    sceneId: string, 
    sourceColumnId: string, 
    targetColumnId: string, 
    newIndex: number
  ) => {
    onSceneMove?.(sceneId, sourceColumnId, targetColumnId, newIndex);
  }, [onSceneMove]);

  return (
    <div className={cn("kanban-view h-full flex flex-col", className)}>
      {/* Kanban Header */}
      <Card className="kanban-header mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Columns className="h-5 w-5" />
                Kanban Board
              </CardTitle>
              
              <Badge variant="outline">
                {stats.totalScenes} scenes • {Math.round(stats.completionRate)}% complete
              </Badge>

              {stats.wipViolations > 0 && showWipWarnings && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {stats.wipViolations} WIP violations
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Grouping Options */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="none">No Grouping</option>
                <option value="character">By Character</option>
                <option value="location">By Location</option>
                <option value="priority">By Priority</option>
              </select>

              {/* View Options */}
              <Button
                size="sm"
                variant={showStats ? 'default' : 'ghost'}
                onClick={() => setShowStats(!showStats)}
                title="Toggle Statistics"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant={showWipWarnings ? 'default' : 'ghost'}
                onClick={() => setShowWipWarnings(!showWipWarnings)}
                title="Toggle WIP Warnings"
              >
                <AlertCircle className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                onClick={onColumnCreate}
                title="Add Custom Column"
              >
                <Plus className="h-4 w-4 mr-1" />
                Column
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{stats.completedScenes}/{stats.totalScenes} scenes</span>
            </div>
            
            <Progress value={stats.completionRate} className="h-2" />
            
            {showStats && (
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {stats.inProgressScenes} in progress
                </div>
                <div className="flex items-center gap-1">
                  <Edit className="h-4 w-4" />
                  {stats.averageWordsPerScene} avg words/scene
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {stats.totalWords.toLocaleString()} total words
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Kanban Columns */}
      <div className="kanban-board flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max p-4">
          {columns.map((column, index) => (
            <motion.div
              key={column.id}
              className="kanban-column flex-shrink-0 w-80"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "h-full flex flex-col cursor-pointer transition-all duration-200",
                  selectedColumn === column.id && "ring-2 ring-primary",
                  column.wipLimit && column.scenes.length > column.wipLimit && 
                  showWipWarnings && "ring-2 ring-destructive"
                )}
                onClick={() => handleColumnClick(column.id)}
                style={{ borderTopColor: column.color, borderTopWidth: '4px' }}
              >
                {/* Column Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: column.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{column.title}</h3>
                        {column.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {column.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline">
                        {column.scenes.length}
                      </Badge>
                      
                      {column.wipLimit && (
                        <Badge 
                          variant={column.scenes.length > column.wipLimit ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {column.scenes.length}/{column.wipLimit}
                        </Badge>
                      )}

                      {!column.isSystemColumn && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onColumnEdit?.(column.id);
                          }}
                          className="p-1"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* WIP Limit Warning */}
                  {column.wipLimit && column.scenes.length > column.wipLimit && showWipWarnings && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-destructive/10 border border-destructive/20 rounded p-2 mt-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        WIP limit exceeded ({column.scenes.length}/{column.wipLimit})
                      </div>
                    </motion.div>
                  )}

                  {/* Completion Criteria */}
                  {selectedColumn === column.id && column.completionCriteria && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-2 bg-muted rounded text-xs"
                    >
                      <div className="font-medium mb-1">Completion Criteria:</div>
                      <ul className="space-y-1">
                        {column.completionCriteria.map((criteria, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </CardHeader>

                {/* Column Content */}
                <CardContent className="flex-1 pt-0 overflow-y-auto">
                  <div className="space-y-3">
                    {Object.entries(getGroupedScenes(column.scenes)).map(([groupName, groupScenes]) => (
                      <div key={groupName}>
                        {groupBy !== 'none' && (
                          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            {groupName}
                            <Badge variant="outline" className="text-xs">
                              {groupScenes.length}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <AnimatePresence mode="popLayout">
                            {groupScenes.map((scene, sceneIndex) => (
                              <motion.div
                                key={scene.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ 
                                  layout: { duration: 0.3 },
                                  opacity: { duration: 0.2 }
                                }}
                              >
                                <DraggableSceneItem
                                  scene={scene}
                                  characters={characters}
                                  locations={locations}
                                  index={sceneIndex}
                                  laneId={column.id}
                                  viewMode="card"
                                  onEdit={() => onSceneEdit?.(scene.id)}
                                  onSelect={() => onSceneSelect?.(scene.id)}
                                  className="kanban-scene-card"
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}

                    {/* Empty State */}
                    {column.scenes.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                          <Target className="h-6 w-6" />
                        </div>
                        <p className="text-sm">No scenes in {column.title.toLowerCase()}</p>
                        <p className="text-xs mt-1">Drag scenes here or create new ones</p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="kanban-actions mt-4">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Workflow efficiency</span>
                <Badge variant={stats.wipViolations === 0 ? "default" : "destructive"}>
                  {stats.wipViolations === 0 ? 'Optimal' : 'Needs attention'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>Average cycle time: 3.2 days</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KanbanView;