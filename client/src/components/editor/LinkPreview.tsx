/**
 * Link Preview Component
 * Shows rich previews on hover and detects broken links
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  ExternalLink,
  AlertTriangle,
  User,
  MapPin,
  Package,
  Zap,
  BookOpen,
  FileText,
  Hash,
  Clock,
  Eye,
  Link2,
  Loader2,
  X
} from 'lucide-react';
import { noteService } from '@/services/noteService';
import { wikiLinkService } from '@/services/wikiLinkService';
import type { Note, Character, Location } from '@/types/story';

interface LinkPreviewProps {
  link: string;
  projectId: string;
  position?: { x: number; y: number };
  onClose?: () => void;
  onNavigate?: (id: string, type: string) => void;
  className?: string;
}

interface PreviewData {
  id: string;
  type: string;
  title: string;
  description?: string;
  content?: string;
  tags?: string[];
  wordCount?: number;
  lastUpdated?: Date;
  exists: boolean;
  backlinks?: number;
  linkedFrom?: string[];
  metadata?: any;
}

const TYPE_ICONS = {
  note: BookOpen,
  character: User,
  location: MapPin,
  item: Package,
  plotthread: Zap,
  research: FileText
};

const TYPE_COLORS = {
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  character: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  location: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  item: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  plotthread: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  research: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
};

export function LinkPreview({
  link,
  projectId,
  position,
  onClose,
  onNavigate,
  className
}: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [link, projectId]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to resolve the link
      const resolved = wikiLinkService.resolveLink(link, projectId);
      
      if (resolved) {
        // Link exists - load full preview
        const item = noteService.getNoteById(resolved.id);
        
        if (item) {
          const backlinks = wikiLinkService.getBacklinks(resolved.id, resolved.title, projectId);
          
          const previewData: PreviewData = {
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.metadata?.description || extractDescription(item.content),
            content: item.content.substring(0, 500),
            tags: item.tags,
            wordCount: item.content.split(/\s+/).length,
            lastUpdated: new Date(item.updatedAt),
            exists: true,
            backlinks: backlinks.length,
            linkedFrom: backlinks.slice(0, 3).map(bl => bl.sourceTitle),
            metadata: item.metadata
          };
          
          setPreview(previewData);
        } else {
          setError('Item not found');
        }
      } else {
        // Link doesn't exist - show as broken
        setPreview({
          id: '',
          type: 'note',
          title: link,
          description: 'This link points to a non-existent note',
          exists: false,
          backlinks: 0
        });
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      setError('Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  const extractDescription = (content: string): string => {
    // Extract first paragraph or first 150 characters
    const paragraphs = content.split('\n\n');
    const firstPara = paragraphs[0] || '';
    return firstPara.length > 150 ? firstPara.substring(0, 150) + '...' : firstPara;
  };

  const handleNavigate = () => {
    if (preview && preview.exists && onNavigate) {
      onNavigate(preview.id, preview.type);
    }
  };

  const getTypeIcon = () => {
    if (!preview) return BookOpen;
    return TYPE_ICONS[preview.type as keyof typeof TYPE_ICONS] || BookOpen;
  };

  const TypeIcon = getTypeIcon();

  // Position the preview
  const style: React.CSSProperties = position ? {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 1000
  } : {};

  return (
    <Card 
      className={cn(
        "link-preview max-w-sm shadow-lg",
        !preview?.exists && "border-red-500",
        className
      )}
      style={style}
    >
      {isLoading ? (
        <div className="p-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : preview ? (
        <div>
          {/* Header */}
          <div className="p-3 border-b">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <TypeIcon className={cn(
                  "h-5 w-5 mt-0.5 flex-shrink-0",
                  !preview.exists && "text-red-500"
                )} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {preview.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        preview.exists 
                          ? TYPE_COLORS[preview.type as keyof typeof TYPE_COLORS]
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {preview.exists ? preview.type : 'broken link'}
                    </Badge>
                    {preview.exists && preview.backlinks !== undefined && preview.backlinks > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {preview.backlinks} backlinks
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-3">
            {preview.exists ? (
              <>
                {/* Description */}
                {preview.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {preview.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-2 text-xs">
                  {preview.wordCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{preview.wordCount} words</span>
                    </div>
                  )}

                  {preview.lastUpdated && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Updated {preview.lastUpdated.toLocaleDateString()}</span>
                    </div>
                  )}

                  {preview.linkedFrom && preview.linkedFrom.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span>Linked from:</span>
                      </div>
                      <div className="pl-5 space-y-0.5">
                        {preview.linkedFrom.map((source, index) => (
                          <div key={index} className="text-muted-foreground">
                            • {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {preview.tags && preview.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      {preview.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {preview.tags.length > 3 && (
                        <span className="text-muted-foreground">+{preview.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {onNavigate && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={handleNavigate}
                      className="flex items-center gap-2 text-xs text-cosmic-600 hover:text-cosmic-700 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View full note</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Broken Link Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-700 dark:text-red-300">
                        Broken Link
                      </p>
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                        This link points to a non-existent note. Would you like to create it?
                      </p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="text-xs text-muted-foreground">
                    <p>Possible actions:</p>
                    <ul className="mt-1 space-y-0.5 ml-3">
                      <li>• Create a new note with this title</li>
                      <li>• Check if the link text is correct</li>
                      <li>• Search for similar notes</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export default LinkPreview;