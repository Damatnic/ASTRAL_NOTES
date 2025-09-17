/**
 * Scene Card Component
 * Interactive card displaying scene metadata with rich information display
 */

import React, { useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Clock,
  MapPin,
  User,
  Users,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  Target,
  FileText,
  Star,
  AlertTriangle,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
  Hash,
  Bookmark,
  Timer,
  Activity
} from 'lucide-react';
import type { Scene, Character, Location } from '@/types/story';

interface SceneCardProps {
  scene: Scene;
  characters?: Character[];
  locations?: Location[];
  isSelected?: boolean;
  isExpanded?: boolean;
  showMetadata?: boolean;
  viewMode?: 'card' | 'list' | 'board';
  onEdit?: () => void;
  onSelect?: () => void;
  onToggleExpanded?: () => void;
  onViewChange?: (sceneId: string) => void;
  className?: string;
}

const MOOD_COLORS = {
  tense: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  peaceful: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  mysterious: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  romantic: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  action: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  dramatic: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  comedic: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  melancholy: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
};

const POV_ICONS = {
  'first-person': User,
  'third-person-limited': Eye,
  'third-person-omniscient': Users,
  'second-person': MessageSquare
};

export function SceneCard({
  scene,
  characters = [],
  locations = [],
  isSelected = false,
  isExpanded = false,
  showMetadata = true,
  viewMode = 'card',
  onEdit,
  onSelect,
  onToggleExpanded,
  onViewChange,
  className
}: SceneCardProps) {
  const [showFullSummary, setShowFullSummary] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get scene characters and locations
  const sceneCharacters = characters.filter(char => 
    scene.characters?.includes(char.id)
  );
  const sceneLocation = locations.find(loc => loc.id === scene.locationId);

  // Calculate completion status
  const getCompletionStatus = () => {
    if (scene.wordCount === 0) return 'not-started';
    if (scene.status === 'completed') return 'completed';
    if (scene.wordCount > 0) return 'in-progress';
    return 'not-started';
  };

  const completionStatus = getCompletionStatus();
  const statusColors = {
    'not-started': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    'in-progress': 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    'completed': 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
  };

  // Format time display
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    // Handle various time formats
    if (timeStr.includes(':')) return timeStr;
    return `${timeStr}:00`;
  };

  // Get POV icon
  const POVIcon = scene.pointOfView ? POV_ICONS[scene.pointOfView] || Eye : Eye;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewChange) {
      onViewChange(scene.id);
    }
  };

  const truncatedSummary = scene.summary && scene.summary.length > 150 
    ? scene.summary.substring(0, 150) + '...'
    : scene.summary;

  const shouldShowExpansion = scene.summary && scene.summary.length > 150;

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "scene-card transition-all duration-200 cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-cosmic-500 shadow-lg",
        viewMode === 'list' && "mb-2",
        viewMode === 'board' && "w-72 h-fit",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Scene Number & Title */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-mono">
                #{scene.order || 'UN'}
              </Badge>
              {scene.chapterId && (
                <Badge variant="secondary" className="text-xs">
                  Ch. {scene.chapterId}
                </Badge>
              )}
              {scene.actId && (
                <Badge variant="secondary" className="text-xs">
                  Act {scene.actId}
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-2">
              {scene.title}
            </h3>

            {/* Status & Word Count */}
            <div className="flex items-center gap-2 text-sm">
              <Badge 
                className={cn(
                  "text-xs capitalize",
                  statusColors[completionStatus]
                )}
              >
                {completionStatus.replace('-', ' ')}
              </Badge>
              
              {scene.wordCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {scene.wordCount.toLocaleString()} words
                </Badge>
              )}

              {scene.estimatedWordCount && scene.wordCount === 0 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  ~{scene.estimatedWordCount.toLocaleString()} est.
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-start gap-1">
            {onToggleExpanded && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpanded();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Scene Summary */}
        {scene.summary && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {showFullSummary || !shouldShowExpansion ? scene.summary : truncatedSummary}
            </p>
            {shouldShowExpansion && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullSummary(!showFullSummary);
                }}
                className="text-xs text-cosmic-600 hover:text-cosmic-700 mt-1 font-medium"
              >
                {showFullSummary ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Metadata Section */}
        {showMetadata && (
          <div className="space-y-3">
            {/* Time & Location */}
            <div className="flex items-center gap-4 text-sm">
              {/* Time */}
              {(scene.timeOfDay || scene.specificTime) && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {scene.timeOfDay && (
                      <span className="capitalize">{scene.timeOfDay}</span>
                    )}
                    {scene.specificTime && (
                      <span className="ml-1">({formatTime(scene.specificTime)})</span>
                    )}
                  </span>
                </div>
              )}

              {/* Location */}
              {sceneLocation && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{sceneLocation.name}</span>
                </div>
              )}
            </div>

            {/* POV & Characters */}
            <div className="space-y-2">
              {/* Point of View */}
              {scene.pointOfView && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <POVIcon className="h-4 w-4" />
                  <span className="capitalize">{scene.pointOfView.replace('-', ' ')}</span>
                  {scene.povCharacterId && (
                    <span className="text-foreground font-medium ml-1">
                      - {sceneCharacters.find(c => c.id === scene.povCharacterId)?.name || 'Unknown'}
                    </span>
                  )}
                </div>
              )}

              {/* Characters */}
              {sceneCharacters.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {sceneCharacters.slice(0, 3).map(character => (
                      <Badge
                        key={character.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {character.name}
                      </Badge>
                    ))}
                    {sceneCharacters.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{sceneCharacters.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mood & Tags */}
            <div className="space-y-2">
              {/* Mood */}
              {scene.mood && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <Badge 
                    className={cn(
                      "text-xs capitalize",
                      MOOD_COLORS[scene.mood as keyof typeof MOOD_COLORS] || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {scene.mood}
                  </Badge>
                </div>
              )}

              {/* Tags */}
              {scene.tags && scene.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {scene.tags.slice(0, 4).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {scene.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{scene.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Metadata */}
            {isExpanded && (
              <div className="pt-3 border-t space-y-3">
                {/* Purpose & Conflict */}
                {(scene.purpose || scene.conflict) && (
                  <div className="space-y-2">
                    {scene.purpose && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                          <Target className="h-3 w-3" />
                          Purpose
                        </div>
                        <p className="text-sm pl-4">{scene.purpose}</p>
                      </div>
                    )}
                    
                    {scene.conflict && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                          <Zap className="h-3 w-3" />
                          Conflict
                        </div>
                        <p className="text-sm pl-4">{scene.conflict}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {scene.notes && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                      <FileText className="h-3 w-3" />
                      Notes
                    </div>
                    <p className="text-sm pl-4 text-muted-foreground">{scene.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(scene.createdAt).toLocaleDateString()}
                  </div>
                  {scene.updatedAt !== scene.createdAt && (
                    <div className="flex items-center gap-1.5">
                      <Timer className="h-3 w-3" />
                      Updated: {new Date(scene.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t mt-3">
          <div className="flex items-center gap-2">
            {scene.isBookmarked && (
              <Bookmark className="h-4 w-4 text-yellow-500" />
            )}
            {scene.hasNotes && (
              <FileText className="h-4 w-4 text-blue-500" />
            )}
            {scene.hasConflicts && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>

          <div className="flex items-center gap-1">
            {scene.importance && scene.importance > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: scene.importance }, (_, i) => (
                  <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SceneCard;