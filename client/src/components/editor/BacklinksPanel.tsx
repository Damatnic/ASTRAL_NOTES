/**
 * Backlinks Panel Component
 * Shows all backlinks to the current note/element with context
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Hash,
  Filter,
  SortDesc,
  User,
  MapPin,
  Package,
  Zap,
  BookOpen,
  MessageSquare,
  Scale,
  Calendar
} from 'lucide-react';
import type { Backlink } from '@/types/story';
import { wikiLinkService } from '@/services/wikiLinkService';

interface BacklinksPanelProps {
  targetId: string;
  targetTitle: string;
  targetType: string;
  projectId: string;
  onNavigate?: (id: string, type: string) => void;
  className?: string;
}

const TYPE_ICONS = {
  note: BookOpen,
  character: User,
  location: MapPin,
  item: Package,
  plotthread: Zap,
  scene: MessageSquare,
  worldrule: Scale,
  outline: BookOpen,
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

export function BacklinksPanel({
  targetId,
  targetTitle,
  targetType,
  projectId,
  onNavigate,
  className
}: BacklinksPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'type'>('recent');
  const [filterType, setFilterType] = useState<string>('all');

  // Get backlinks
  const backlinks = useMemo(() => {
    return wikiLinkService.getBacklinks(targetId, targetTitle, projectId);
  }, [targetId, targetTitle, projectId]);

  // Filter and sort backlinks
  const filteredBacklinks = useMemo(() => {
    let filtered = backlinks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(backlink =>
        backlink.sourceTitle.toLowerCase().includes(query) ||
        backlink.context?.toLowerCase().includes(query) ||
        backlink.linkText.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(backlink => backlink.sourceType === filterType);
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle));
        break;
      case 'type':
        filtered.sort((a, b) => {
          if (a.sourceType !== b.sourceType) {
            return a.sourceType.localeCompare(b.sourceType);
          }
          return a.sourceTitle.localeCompare(b.sourceTitle);
        });
        break;
      case 'recent':
      default:
        // Keep original order (most recent first)
        break;
    }

    return filtered;
  }, [backlinks, searchQuery, filterType, sortBy]);

  // Get unique types for filter
  const availableTypes = useMemo(() => {
    const types = new Set(backlinks.map(bl => bl.sourceType));
    return Array.from(types).sort();
  }, [backlinks]);

  const getTypeIcon = (type: string) => {
    const IconComponent = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || BookOpen;
    return <IconComponent className="h-4 w-4" />;
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const handleNavigateToSource = (backlink: Backlink) => {
    if (onNavigate) {
      onNavigate(backlink.sourceId, backlink.sourceType);
    }
  };

  return (
    <Card className={cn("backlinks-panel", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Backlinks
            <Badge variant="outline" className="ml-2">
              {backlinks.length}
            </Badge>
          </CardTitle>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Pages that link to "{targetTitle}"
        </div>
      </CardHeader>

      <CardContent>
        {/* Search and Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search backlinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1 text-sm border rounded bg-background"
              >
                <option value="all">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <SortDesc className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'alphabetical' | 'type')}
                className="px-2 py-1 text-sm border rounded bg-background"
              >
                <option value="recent">Most Recent</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backlinks List */}
        <div className="space-y-3">
          {filteredBacklinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {backlinks.length === 0 ? (
                <>
                  <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No backlinks found</p>
                  <p className="text-sm">
                    This {targetType} hasn't been linked from any other pages yet.
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No backlinks match your search</p>
                  <p className="text-sm">
                    Try adjusting your search terms or filters.
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredBacklinks.map((backlink) => (
              <div
                key={backlink.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleNavigateToSource(backlink)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getTypeIcon(backlink.sourceType)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {highlightText(backlink.sourceTitle, searchQuery)}
                      </div>
                      <Badge 
                        className={cn(
                          "text-xs mt-1",
                          TYPE_COLORS[backlink.sourceType as keyof typeof TYPE_COLORS]
                        )}
                      >
                        {backlink.sourceType}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToSource(backlink);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Context */}
                {backlink.context && (
                  <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                    <div className="text-xs text-muted-foreground mb-1">Context:</div>
                    <div className="italic">
                      "{highlightText(backlink.context, searchQuery)}"
                    </div>
                  </div>
                )}

                {/* Link Text if different from target title */}
                {backlink.linkText !== targetTitle && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Linked as: <span className="font-medium">{backlink.linkText}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {backlinks.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredBacklinks.length} of {backlinks.length} backlinks
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            
            {/* Type breakdown */}
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(
                backlinks.reduce((acc, bl) => {
                  acc[bl.sourceType] = (acc[bl.sourceType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <Badge
                  key={type}
                  className={cn(
                    "text-xs",
                    TYPE_COLORS[type as keyof typeof TYPE_COLORS]
                  )}
                >
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BacklinksPanel;