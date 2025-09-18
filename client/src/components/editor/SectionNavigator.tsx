/**
 * Section Navigator Component
 * Provides document structure navigation, section markers, and alternative versions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { 
  BookOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Copy,
  GitBranch,
  Eye,
  EyeOff,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Bookmark,
  Camera,
  Hash,
  Navigation2,
  Layers,
  Compare,
  Star,
  Clock,
  User
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { 
  documentStructureService,
  type SectionMarker,
  type AlternativeVersion,
  type NavigationItem
} from '@/services/documentStructureService';

interface SectionNavigatorProps {
  editor: Editor | null;
  documentId: string;
  onSectionSelect?: (marker: SectionMarker) => void;
  onAlternativeSelect?: (alternative: AlternativeVersion) => void;
  className?: string;
}

const MARKER_TYPE_ICONS = {
  chapter: <BookOpen className="h-4 w-4" />,
  scene: <Camera className="h-4 w-4" />,
  section: <FileText className="h-4 w-4" />,
  note: <Edit3 className="h-4 w-4" />,
  bookmark: <Bookmark className="h-4 w-4" />,
  revision: <GitBranch className="h-4 w-4" />,
};

const MARKER_TYPE_COLORS = {
  chapter: 'bg-blue-100 text-blue-800 border-blue-200',
  scene: 'bg-green-100 text-green-800 border-green-200',
  section: 'bg-purple-100 text-purple-800 border-purple-200',
  note: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  bookmark: 'bg-red-100 text-red-800 border-red-200',
  revision: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function SectionNavigator({ 
  editor, 
  documentId, 
  onSectionSelect,
  onAlternativeSelect,
  className 
}: SectionNavigatorProps) {
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [markers, setMarkers] = useState<SectionMarker[]>([]);
  const [alternatives, setAlternatives] = useState<Map<string, AlternativeVersion[]>>(new Map());
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAlternatives, setShowAlternatives] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<SectionMarker['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMarkerType, setNewMarkerType] = useState<SectionMarker['type']>('section');
  const [newMarkerTitle, setNewMarkerTitle] = useState('');
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load document structure
  useEffect(() => {
    const loadStructure = () => {
      const docMarkers = documentStructureService.getMarkers(documentId);
      const nav = documentStructureService.generateNavigation(documentId);
      const altsMap = new Map<string, AlternativeVersion[]>();
      
      docMarkers.forEach(marker => {
        const alts = documentStructureService.getAlternatives(documentId, marker.id);
        if (alts.length > 0) {
          altsMap.set(marker.id, alts);
        }
      });

      setMarkers(docMarkers);
      setNavigation(nav);
      setAlternatives(altsMap);
    };

    const handleStructureChange = () => {
      loadStructure();
    };

    documentStructureService.on('marker-created', handleStructureChange);
    documentStructureService.on('marker-updated', handleStructureChange);
    documentStructureService.on('marker-deleted', handleStructureChange);
    documentStructureService.on('alternative-created', handleStructureChange);
    documentStructureService.on('alternative-updated', handleStructureChange);
    documentStructureService.on('alternative-deleted', handleStructureChange);

    loadStructure();

    return () => {
      documentStructureService.off('marker-created', handleStructureChange);
      documentStructureService.off('marker-updated', handleStructureChange);
      documentStructureService.off('marker-deleted', handleStructureChange);
      documentStructureService.off('alternative-created', handleStructureChange);
      documentStructureService.off('alternative-updated', handleStructureChange);
      documentStructureService.off('alternative-deleted', handleStructureChange);
    };
  }, [documentId]);

  // Auto-detect sections from editor content
  useEffect(() => {
    if (!editor || !autoDetectEnabled) return;

    const detectSections = () => {
      const content = editor.getText();
      if (content.length > 0) {
        documentStructureService.autoDetectSections(documentId, content);
      }
    };

    const timeoutId = setTimeout(detectSections, 2000);
    return () => clearTimeout(timeoutId);
  }, [editor, documentId, autoDetectEnabled]);

  // Filter options
  const filterOptions: DropdownOption[] = [
    { value: 'all', label: 'All Sections', icon: <Layers className="h-4 w-4" /> },
    { value: 'chapter', label: 'Chapters', icon: MARKER_TYPE_ICONS.chapter },
    { value: 'scene', label: 'Scenes', icon: MARKER_TYPE_ICONS.scene },
    { value: 'section', label: 'Sections', icon: MARKER_TYPE_ICONS.section },
    { value: 'note', label: 'Notes', icon: MARKER_TYPE_ICONS.note },
    { value: 'bookmark', label: 'Bookmarks', icon: MARKER_TYPE_ICONS.bookmark },
    { value: 'revision', label: 'Revisions', icon: MARKER_TYPE_ICONS.revision },
  ];

  const markerTypeOptions: DropdownOption[] = filterOptions.slice(1); // Exclude 'all'

  // Filter navigation items
  const filteredNavigation = navigation.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Create new marker
  const handleCreateMarker = useCallback(() => {
    if (!newMarkerTitle.trim() || !editor) return;

    const position = editor.state.selection.from;
    const marker = documentStructureService.createMarker(
      documentId,
      newMarkerType,
      newMarkerTitle,
      position
    );

    setNewMarkerTitle('');
    setShowCreateModal(false);
    toast.success('Section marker created');
  }, [editor, documentId, newMarkerType, newMarkerTitle, toast]);

  // Navigate to section
  const handleSectionClick = useCallback((marker: SectionMarker) => {
    if (editor) {
      // Move cursor to section position
      editor.commands.setTextSelection(marker.position);
      editor.commands.scrollIntoView();
    }
    
    setSelectedSection(marker.id);
    onSectionSelect?.(marker);
  }, [editor, onSectionSelect]);

  // Toggle section expansion
  const handleToggleExpanded = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Toggle alternatives view
  const handleToggleAlternatives = useCallback((sectionId: string) => {
    setShowAlternatives(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Create alternative version
  const handleCreateAlternative = useCallback((sectionId: string) => {
    const marker = markers.find(m => m.id === sectionId);
    if (!marker || !editor) return;

    // Get the content of the section
    const content = editor.getText().slice(
      marker.position,
      marker.position + (marker.length || 100)
    );

    const alternative = documentStructureService.createAlternative(
      documentId,
      sectionId,
      `Alternative ${alternatives.get(sectionId)?.length || 0 + 1}`,
      content,
      {
        description: 'Alternative version of this section',
      }
    );

    toast.success('Alternative version created');
  }, [documentId, markers, alternatives, editor, toast]);

  // Activate alternative
  const handleActivateAlternative = useCallback((sectionId: string, alternativeId: string) => {
    documentStructureService.setActiveAlternative(documentId, sectionId, alternativeId);
    toast.success('Alternative version activated');
    onAlternativeSelect?.(alternatives.get(sectionId)?.find(a => a.id === alternativeId)!);
  }, [documentId, alternatives, toast, onAlternativeSelect]);

  // Delete marker
  const handleDeleteMarker = useCallback((markerId: string) => {
    if (documentStructureService.deleteMarker(documentId, markerId)) {
      toast.success('Section marker deleted');
    }
  }, [documentId, toast]);

  // Render navigation item
  const renderNavigationItem = useCallback((item: NavigationItem, level: number = 0) => {
    const isSelected = selectedSection === item.id;
    const isExpanded = expandedSections.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const hasAlts = alternatives.has(item.id);
    const showAlts = showAlternatives.has(item.id);
    const itemAlternatives = alternatives.get(item.id) || [];

    return (
      <div key={item.id} className="space-y-1">
        <div 
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
            "hover:bg-muted/50",
            isSelected && "bg-cosmic-100 dark:bg-cosmic-900",
            level > 0 && "ml-4"
          )}
          onClick={() => {
            const marker = markers.find(m => m.id === item.id);
            if (marker) handleSectionClick(marker);
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpanded(item.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          {/* Type Icon */}
          <div className="text-muted-foreground">
            {MARKER_TYPE_ICONS[item.type]}
          </div>

          {/* Title */}
          <span className="flex-1 text-sm font-medium truncate">
            {item.title}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-1">
            <Badge 
              variant="outline" 
              className={cn("text-xs", MARKER_TYPE_COLORS[item.type])}
            >
              {item.type}
            </Badge>

            {hasAlts && (
              <Badge variant="secondary" className="text-xs">
                {itemAlternatives.length}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            {hasAlts && (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleAlternatives(item.id);
                }}
                title="Toggle alternatives"
              >
                <GitBranch className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateAlternative(item.id);
              }}
              title="Create alternative"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMarker(item.id);
              }}
              title="Delete marker"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Alternatives */}
        {hasAlts && showAlts && (
          <div className="ml-8 space-y-1">
            {itemAlternatives.map((alt, index) => (
              <div
                key={alt.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded border text-sm",
                  alt.isActive ? "bg-green-50 border-green-200" : "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2 flex-1">
                  <GitBranch className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{alt.title}</span>
                  <span className="text-xs text-muted-foreground">
                    v{alt.version}
                  </span>
                  {alt.isActive && (
                    <Star className="h-3 w-3 text-yellow-500" />
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {alt.wordCount} words
                  </span>
                  {!alt.isActive && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleActivateAlternative(item.id, alt.id)}
                      title="Activate this version"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [
    selectedSection, 
    expandedSections, 
    alternatives, 
    showAlternatives, 
    markers, 
    handleSectionClick, 
    handleToggleExpanded, 
    handleToggleAlternatives, 
    handleCreateAlternative, 
    handleActivateAlternative, 
    handleDeleteMarker
  ]);

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Navigation2 className="h-4 w-4 text-cosmic-600" />
            Document Structure
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoDetectEnabled(!autoDetectEnabled)}
              title={`Auto-detect: ${autoDetectEnabled ? 'On' : 'Off'}`}
            >
              <Hash className={cn("h-4 w-4", autoDetectEnabled ? "text-green-600" : "text-muted-foreground")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateModal(!showCreateModal)}
              title="Add section marker"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Dropdown
              options={filterOptions}
              value={filterType}
              onChange={(type) => setFilterType(type as any)}
              placeholder="Filter"
              className="flex-1"
            />
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections..."
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Create Marker Modal */}
        {showCreateModal && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex gap-2">
              <Dropdown
                options={markerTypeOptions}
                value={newMarkerType}
                onChange={(type) => setNewMarkerType(type as any)}
                placeholder="Type"
                className="w-32"
              />
              <Input
                value={newMarkerTitle}
                onChange={(e) => setNewMarkerTitle(e.target.value)}
                placeholder="Section title..."
                className="flex-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateMarker();
                  } else if (e.key === 'Escape') {
                    setShowCreateModal(false);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateMarker}
                disabled={!newMarkerTitle.trim()}
                size="sm"
                className="flex-1"
              >
                Create
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-3">
        <div ref={scrollRef} className="h-full overflow-y-auto space-y-1">
          {filteredNavigation.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sections found</p>
              <p className="text-xs">
                {searchQuery ? 'Try a different search term' : 'Create sections to navigate your document'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNavigation.map(item => renderNavigationItem(item))}
            </div>
          )}
        </div>

        {/* Stats */}
        {markers.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">{markers.length}</span> sections
              </div>
              <div>
                <span className="font-medium">
                  {Array.from(alternatives.values()).reduce((sum, alts) => sum + alts.length, 0)}
                </span> alternatives
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}