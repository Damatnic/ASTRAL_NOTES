/**
 * Version History Component
 * Manages document versions, revisions, and conflict resolution
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  History, 
  Save, 
  Clock, 
  GitBranch, 
  RotateCcw, 
  Eye, 
  GitCompare as Compare,
  AlertTriangle,
  Check,
  X,
  Plus,
  Download,
  Upload,
  Merge,
  Split,
  FileText,
  User,
  Calendar,
  Search,
  Filter,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import type { Editor } from '@tiptap/core';

interface VersionHistoryProps {
  editor: Editor | null;
  content: string;
  noteId: string;
  onVersionRestore?: (version: DocumentVersion) => void;
  onVersionCreate?: (label?: string) => void;
  onConflictResolve?: (resolution: ConflictResolution) => void;
  className?: string;
}

interface DocumentVersion {
  id: string;
  label?: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: Date;
  size: number; // content length
  wordCount: number;
  isAutoSave: boolean;
  parentId?: string;
  tags?: string[];
  note?: string;
  changesSummary?: {
    added: number;
    removed: number;
    modified: number;
  };
}

interface ConflictResolution {
  conflictId: string;
  resolution: 'accept_current' | 'accept_incoming' | 'merge_manual';
  mergedContent?: string;
}

interface VersionConflict {
  id: string;
  currentVersion: DocumentVersion;
  incomingVersion: DocumentVersion;
  conflictAreas: Array<{
    type: 'insertion' | 'deletion' | 'modification';
    currentText: string;
    incomingText: string;
    position: { start: number; end: number };
  }>;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface VersionDiff {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

export function VersionHistory({
  editor,
  content,
  noteId,
  onVersionRestore,
  onVersionCreate,
  onConflictResolve,
  className
}: VersionHistoryProps) {
  const toast = useToast();
  
  // State
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [conflicts, setConflicts] = useState<VersionConflict[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null);
  const [diff, setDiff] = useState<VersionDiff[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'auto'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    const currentUser = {
      id: 'current-user',
      name: 'Current User',
      email: 'user@example.com',
    };

    const sampleVersions: DocumentVersion[] = [
      {
        id: 'v1',
        label: 'Initial draft',
        content: content,
        author: currentUser,
        createdAt: new Date(),
        size: content.length,
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
        isAutoSave: false,
        tags: ['draft'],
        changesSummary: { added: 100, removed: 0, modified: 0 },
      },
      {
        id: 'v2',
        content: content,
        author: currentUser,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        size: content.length,
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
        isAutoSave: true,
        parentId: 'v1',
        changesSummary: { added: 15, removed: 5, modified: 8 },
      },
      {
        id: 'v3',
        label: 'Added conclusion',
        content: content,
        author: {
          id: 'collaborator',
          name: 'Sarah Chen',
          email: 'sarah@example.com',
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        size: content.length,
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
        isAutoSave: false,
        parentId: 'v2',
        tags: ['review'],
        note: 'Added comprehensive conclusion section',
        changesSummary: { added: 45, removed: 2, modified: 12 },
      },
    ];

    setVersions(sampleVersions.reverse()); // Most recent first
  }, [content]);

  // Filter versions
  const filteredVersions = useMemo(() => {
    return versions.filter(version => {
      // Filter by type
      if (filterType === 'manual' && version.isAutoSave) return false;
      if (filterType === 'auto' && !version.isAutoSave) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          version.label?.toLowerCase().includes(query) ||
          version.author.name.toLowerCase().includes(query) ||
          version.note?.toLowerCase().includes(query) ||
          version.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [versions, filterType, searchQuery]);

  // Create new version
  const createVersion = useCallback(() => {
    if (!editor) return;
    
    const newVersion: DocumentVersion = {
      id: `v${Date.now()}`,
      label: newVersionLabel || undefined,
      content: editor.getHTML(),
      author: {
        id: 'current-user',
        name: 'Current User',
        email: 'user@example.com',
      },
      createdAt: new Date(),
      size: editor.getHTML().length,
      wordCount: editor.storage.characterCount.words(),
      isAutoSave: false,
      parentId: versions[0]?.id,
      tags: newVersionLabel ? ['manual'] : [],
      changesSummary: { added: 0, removed: 0, modified: 0 }, // Would be calculated
    };
    
    setVersions(prev => [newVersion, ...prev]);
    setNewVersionLabel('');
    setShowCreateDialog(false);
    onVersionCreate?.(newVersionLabel);
    
    toast.success('Version saved');
  }, [editor, newVersionLabel, versions, onVersionCreate, toast]);

  // Restore version
  const restoreVersion = useCallback((version: DocumentVersion) => {
    if (!editor) return;
    
    editor.commands.setContent(version.content);
    onVersionRestore?.(version);
    
    toast.success(`Restored to version from ${version.createdAt.toLocaleString()}`);
  }, [editor, onVersionRestore, toast]);

  // Compare versions
  const compareVersions = useCallback((version1Id: string, version2Id: string) => {
    const v1 = versions.find(v => v.id === version1Id);
    const v2 = versions.find(v => v.id === version2Id);
    
    if (!v1 || !v2) return;
    
    setSelectedVersions([version1Id, version2Id]);
    
    // Simple diff implementation (in production, use a proper diff library)
    const lines1 = v1.content.split('\n');
    const lines2 = v2.content.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    
    const newDiff: VersionDiff[] = [];
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        newDiff.push({ type: 'unchanged', content: line1, lineNumber: i + 1 });
      } else if (!line1) {
        newDiff.push({ type: 'added', content: line2, lineNumber: i + 1 });
      } else if (!line2) {
        newDiff.push({ type: 'removed', content: line1, lineNumber: i + 1 });
      } else {
        newDiff.push({ type: 'removed', content: line1, lineNumber: i + 1 });
        newDiff.push({ type: 'added', content: line2, lineNumber: i + 1 });
      }
    }
    
    setDiff(newDiff);
    setShowDiff(true);
  }, [versions]);

  // Export version
  const exportVersion = useCallback((version: DocumentVersion) => {
    const dataStr = JSON.stringify({
      version,
      exportedAt: new Date().toISOString(),
      noteId,
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `version-${version.id}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Version exported');
  }, [noteId, toast]);

  // Toggle version expansion
  const toggleVersionExpansion = useCallback((versionId: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  }, []);

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const tabs: TabItem[] = [
    {
      id: 'versions',
      label: 'Versions',
      icon: <History className="h-4 w-4" />,
      badge: filteredVersions.length.toString(),
      content: (
        <div className="space-y-4">
          {/* Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Save Version
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDiff(!showDiff)}
                disabled={selectedVersions === null}
                className="flex items-center gap-1"
              >
                <Compare className="h-3 w-3" />
                Compare
              </Button>
            </div>
            
            {/* Search and Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search versions..."
                  className="w-full pl-7 pr-3 py-1 border rounded text-sm"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="all">All</option>
                <option value="manual">Manual</option>
                <option value="auto">Auto-save</option>
              </select>
            </div>
          </div>

          {/* Create Version Dialog */}
          {showCreateDialog && (
            <Card className="p-3 border-cosmic-200">
              <div className="space-y-3">
                <h3 className="font-medium">Create New Version</h3>
                <input
                  type="text"
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                  placeholder="Version label (optional)..."
                  className="w-full px-3 py-2 border rounded text-sm"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={createVersion}>
                    Save Version
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Versions List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredVersions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2" />
                <p>No versions found</p>
                <p className="text-sm">Create your first version to track changes</p>
              </div>
            ) : (
              filteredVersions.map((version, index) => {
                const isExpanded = expandedVersions.has(version.id);
                const isSelected = selectedVersions?.includes(version.id);
                
                return (
                  <Card
                    key={version.id}
                    className={cn(
                      "p-3 cursor-pointer transition-colors",
                      isSelected && "ring-2 ring-cosmic-500",
                      index === 0 && "border-cosmic-200 bg-cosmic-50/50"
                    )}
                    onClick={() => {
                      if (selectedVersions === null) {
                        setSelectedVersions([version.id, '']);
                      } else if (selectedVersions[1] === '') {
                        setSelectedVersions([selectedVersions[0], version.id]);
                      } else {
                        setSelectedVersions([version.id, '']);
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <Avatar
                            src={version.author.avatar}
                            alt={version.author.name}
                            size="xs"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {version.label ? (
                                <span className="font-medium text-sm">{version.label}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {version.isAutoSave ? 'Auto-save' : 'Manual save'}
                                </span>
                              )}
                              {index === 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              {version.isAutoSave && (
                                <Badge variant="outline" className="text-xs bg-blue-50">
                                  Auto
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{version.author.name}</span>
                              <span>{formatTimeAgo(version.createdAt)}</span>
                              <span>{version.wordCount} words</span>
                              <span>{formatSize(version.size)}</span>
                            </div>
                            
                            {version.changesSummary && (
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-green-600">+{version.changesSummary.added}</span>
                                <span className="text-red-600">-{version.changesSummary.removed}</span>
                                <span className="text-blue-600">~{version.changesSummary.modified}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVersionExpansion(version.id);
                          }}
                          className="p-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-2 border-t space-y-2">
                          {version.note && (
                            <p className="text-xs text-muted-foreground">{version.note}</p>
                          )}
                          
                          {version.tags && version.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {version.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreVersion(version);
                              }}
                              className="h-6 px-2 text-xs"
                              disabled={index === 0}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportVersion(version);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'diff',
      label: 'Compare',
      icon: <Compare className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          {!showDiff || selectedVersions === null ? (
            <div className="text-center py-8 text-muted-foreground">
              <Compare className="h-12 w-12 mx-auto mb-2" />
              <p>Select two versions to compare</p>
              <p className="text-sm">Click on versions in the list to select them</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Version Comparison</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDiff(false)}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Close
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
                  <strong>Version A:</strong> {selectedVersions[0]}
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
                  <strong>Version B:</strong> {selectedVersions[1]}
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto border rounded">
                {diff.map((line, index) => (
                  <div
                    key={index}
                    className={cn(
                      "px-3 py-1 text-xs font-mono",
                      line.type === 'added' && "bg-green-100 dark:bg-green-900/20",
                      line.type === 'removed' && "bg-red-100 dark:bg-red-900/20",
                      line.type === 'unchanged' && "bg-background"
                    )}
                  >
                    <span className="inline-block w-8 text-muted-foreground">
                      {line.lineNumber}
                    </span>
                    <span className="inline-block w-4">
                      {line.type === 'added' && '+'}
                      {line.type === 'removed' && '-'}
                      {line.type === 'unchanged' && ' '}
                    </span>
                    <span>{line.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'conflicts',
      label: 'Conflicts',
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: conflicts.length > 0 ? conflicts.length.toString() : undefined,
      content: (
        <div className="space-y-4">
          {conflicts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No conflicts detected</p>
              <p className="text-sm">All versions are in sync</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <Card key={conflict.id} className="p-3 border-amber-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Version Conflict</span>
                      <Badge variant="outline" className="text-xs">
                        {conflict.conflictAreas.length} conflicts
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Conflict between versions from{' '}
                      {conflict.currentVersion.createdAt.toLocaleString()} and{' '}
                      {conflict.incomingVersion.createdAt.toLocaleString()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Accept Current
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Accept Incoming
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs"
                      >
                        Merge Manually
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className={cn("version-history w-80", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitBranch className="h-4 w-4" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs tabs={tabs} variant="underline" />
      </CardContent>
    </Card>
  );
}

export default VersionHistory;