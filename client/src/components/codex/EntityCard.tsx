/**
 * Entity Card - Compact display component for individual entities
 */

import React from 'react';
import { Edit, ExternalLink, Star, Users, MapPin, Zap, Network, BarChart3, BookOpen, List, Search, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';

import { type CodexEntity, type EntityType } from '@/services/codexService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
  character: 'text-red-600 bg-red-50 border-red-200',
  location: 'text-blue-600 bg-blue-50 border-blue-200',
  object: 'text-green-600 bg-green-50 border-green-200',
  organization: 'text-purple-600 bg-purple-50 border-purple-200',
  event: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  lore: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  subplot: 'text-pink-600 bg-pink-50 border-pink-200',
  concept: 'text-teal-600 bg-teal-50 border-teal-200',
  custom: 'text-gray-600 bg-gray-50 border-gray-200'
};

interface EntityCardProps {
  entity: CodexEntity;
  onClick?: () => void;
  onEdit?: () => void;
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  showActions?: boolean;
  compact?: boolean;
  showType?: boolean;
  showImportance?: boolean;
  showDescription?: boolean;
  maxDescriptionLength?: number;
}

export default function EntityCard({
  entity,
  onClick,
  onEdit,
  onSelect,
  selected = false,
  showActions = true,
  compact = false,
  showType = true,
  showImportance = true,
  showDescription = true,
  maxDescriptionLength = 100
}: EntityCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on actions
    if ((e.target as HTMLElement).closest('.entity-actions')) {
      return;
    }
    onClick?.();
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(e.target.checked);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const truncateDescription = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const renderImportanceStars = (importance: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < importance ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const entityTags = Array.isArray(entity.tags) ? entity.tags : 
    typeof entity.tags === 'string' ? JSON.parse(entity.tags || '[]') : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`
          relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer
          ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${compact ? 'p-3' : 'p-4'}
        `}
        onClick={handleCardClick}
      >
        {/* Selection checkbox */}
        {onSelect && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelectChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Entity avatar/color indicator */}
        <div className="flex items-start space-x-3">
          <div 
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
              ${ENTITY_TYPE_COLORS[entity.type]}
            `}
            style={{ backgroundColor: entity.color || undefined }}
          >
            {entity.avatar ? (
              <img
                src={entity.avatar}
                alt={entity.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <div className={entity.color ? 'text-white' : ''}>
                {ENTITY_TYPE_ICONS[entity.type]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
                  {entity.name}
                </h3>
                
                <div className="flex items-center space-x-2 mt-1">
                  {showType && (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${ENTITY_TYPE_COLORS[entity.type]}`}
                    >
                      {entity.type}
                    </Badge>
                  )}
                  
                  {entity.isUniversal && (
                    <Badge variant="outline" className="text-xs">
                      Universal
                    </Badge>
                  )}
                  
                  {showImportance && (
                    <div className="flex items-center">
                      {renderImportanceStars(entity.importance)}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="entity-actions flex items-center space-x-1 ml-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditClick}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCardClick}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            {showDescription && entity.description && (
              <p className={`text-gray-600 mt-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                {truncateDescription(entity.description, maxDescriptionLength)}
              </p>
            )}

            {/* Tags */}
            {entityTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entityTags.slice(0, compact ? 2 : 3).map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {entityTags.length > (compact ? 2 : 3) && (
                  <Badge variant="outline" className="text-xs">
                    +{entityTags.length - (compact ? 2 : 3)}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer metadata */}
            {!compact && (
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>
                  {entity.category && `${entity.category} • `}
                  {new Date(entity.updatedAt).toLocaleDateString()}
                </span>
                
                {/* Connection indicators */}
                <div className="flex items-center space-x-2">
                  {entity.relationshipsFrom && entity.relationshipsFrom.length > 0 && (
                    <div className="flex items-center">
                      <Network className="w-3 h-3 mr-1" />
                      <span>{entity.relationshipsFrom.length}</span>
                    </div>
                  )}
                  
                  {entity.textReferences && entity.textReferences.length > 0 && (
                    <div className="flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span>{entity.textReferences.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Skeleton component for loading states
export function EntityCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={compact ? 'p-3' : 'p-4'}>
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          {!compact && (
            <>
              <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
              <div className="flex space-x-2">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
