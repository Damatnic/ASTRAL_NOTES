/**
 * Quick Notes Page
 * Standalone note-taking interface for rapid capture and organization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Archive,
  Trash2,
  Tag,
  FolderOpen,
  Grid,
  List,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Settings,
  Wand2,
  Link2,
  BarChart3,
  ArrowRight,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { quickNotesService, type QuickNote, type QuickNoteSearchOptions, type CreateQuickNoteData, type UpdateQuickNoteData } from '@/services/quickNotesService';
import { projectService } from '@/services/projectService';
import { projectAttachmentService, type AttachmentSuggestion } from '@/services/projectAttachmentService';
import { CreateNoteModal, BulkActionsModal, ImportExportModal } from '@/components/quick-notes';
import { ProjectSelectorModal, BulkOrganizationModal } from '@/components/attachment';
import { cn } from '@/utils/cn';

interface QuickNotesProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type FilterTab = 'all' | 'unattached' | 'attached' | 'archived';

export function QuickNotes({ className }: QuickNotesProps) {
  // State
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<QuickNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showBulkOrganization, setShowBulkOrganization] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Available tags and projects
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; title: string }>>([]);
  
  // Smart suggestions
  const [suggestions, setSuggestions] = useState<AttachmentSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load data
  const loadNotes = useCallback(() => {
    setIsLoading(true);
    try {
      const quickNotes = quickNotesService.getAllQuickNotes();
      setNotes(quickNotes);
      
      const tags = quickNotesService.getAllTags();
      setAvailableTags(tags);
      
      const projects = projectService.getAllProjects().map(p => ({ id: p.id, title: p.title }));
      setAvailableProjects(projects);
      
      // Load smart suggestions for unattached notes
      const unattachedNotes = quickNotes.filter(note => !note.projectId);
      if (unattachedNotes.length > 0) {
        const smartSuggestions = projectAttachmentService.generateAttachmentSuggestions();
        setSuggestions(smartSuggestions.slice(0, 10)); // Show top 10 suggestions
      }
    } catch (error) {
      console.error('Error loading quick notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter and search notes
  const filterNotes = useCallback(() => {
    let filtered = [...notes];

    // Filter by tab
    switch (activeTab) {
      case 'unattached':
        filtered = filtered.filter(note => !note.projectId);
        break;
      case 'attached':
        filtered = filtered.filter(note => note.projectId);
        break;
      case 'archived':
        filtered = filtered.filter(note => note.status === 'archived');
        break;
      default:
        filtered = filtered.filter(note => note.status !== 'archived');
        break;
    }

    // Search filter
    if (searchQuery.trim()) {
      const searchOptions: QuickNoteSearchOptions = {
        query: searchQuery,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };
      filtered = quickNotesService.searchQuickNotes(searchOptions);
      
      // Apply tab filter to search results
      switch (activeTab) {
        case 'unattached':
          filtered = filtered.filter(note => !note.projectId);
          break;
        case 'attached':
          filtered = filtered.filter(note => note.projectId);
          break;
        case 'archived':
          filtered = filtered.filter(note => note.status === 'archived');
          break;
        default:
          filtered = filtered.filter(note => note.status !== 'archived');
          break;
      }
    } else if (selectedTags.length > 0) {
      // Tag filter
      filtered = filtered.filter(note =>
        selectedTags.some(tag => note.tags.includes(tag))
      );
    }

    setFilteredNotes(filtered);
  }, [notes, searchQuery, selectedTags, activeTab]);

  // Effects
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    filterNotes();
  }, [filterNotes]);

  // Event handlers
  const handleCreateNote = (data: CreateQuickNoteData) => {
    try {
      quickNotesService.createQuickNote(data);
      loadNotes();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    try {
      quickNotesService.deleteQuickNote(noteId);
      loadNotes();
      setSelectedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleArchiveNote = (noteId: string) => {
    try {
      quickNotesService.archiveQuickNote(noteId);
      loadNotes();
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  const handleRestoreNote = (noteId: string) => {
    try {
      quickNotesService.restoreQuickNote(noteId);
      loadNotes();
    } catch (error) {
      console.error('Error restoring note:', error);
    }
  };

  const handleAttachToProject = (noteId: string, projectId: string) => {
    try {
      quickNotesService.attachToProject(noteId, projectId);
      loadNotes();
    } catch (error) {
      console.error('Error attaching note to project:', error);
    }
  };

  const handleDetachFromProject = (noteId: string) => {
    try {
      quickNotesService.detachFromProject(noteId);
      loadNotes();
    } catch (error) {
      console.error('Error detaching note from project:', error);
    }
  };

  const handleBulkDelete = () => {
    try {
      const deleted = quickNotesService.bulkDeleteQuickNotes(Array.from(selectedNotes));
      console.log(`Deleted ${deleted} notes`);
      loadNotes();
      setSelectedNotes(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk deleting notes:', error);
    }
  };

  const handleBulkArchive = () => {
    try {
      const updated = quickNotesService.bulkUpdateQuickNotes(Array.from(selectedNotes), { 
        status: 'archived',
        archivedAt: new Date().toISOString(),
      });
      console.log(`Archived ${updated} notes`);
      loadNotes();
      setSelectedNotes(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk archiving notes:', error);
    }
  };

  const handleBulkAttachToProject = (projectId: string) => {
    try {
      const updated = quickNotesService.bulkAttachToProject(Array.from(selectedNotes), projectId);
      console.log(`Attached ${updated} notes to project`);
      loadNotes();
      setSelectedNotes(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk attaching notes to project:', error);
    }
  };

  const handleExportNotes = () => {
    try {
      const exported = quickNotesService.exportQuickNotes('md');
      const blob = new Blob([exported], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quick-notes-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting notes:', error);
    }
  };

  const handleSelectNote = (noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(filteredNotes.map(note => note.id)));
    }
  };

  // Enhanced attachment handlers
  const handleQuickAttach = (noteId: string, projectId: string) => {
    try {
      const result = projectAttachmentService.attachNoteToProject(noteId, projectId, 'manual');
      if (result) {
        loadNotes(); // Reload to update attachment status
        console.log('Note attached successfully');
      }
    } catch (error) {
      console.error('Error attaching note:', error);
    }
  };

  const handleOpenProjectSelector = () => {
    if (selectedNotes.size > 0) {
      setShowProjectSelector(true);
    }
  };

  const handleProjectSelection = (projectId: string) => {
    try {
      selectedNotes.forEach(noteId => {
        projectAttachmentService.attachNoteToProject(noteId, projectId, 'manual');
      });
      loadNotes();
      setSelectedNotes(new Set());
      setShowProjectSelector(false);
      console.log(`Attached ${selectedNotes.size} notes to project`);
    } catch (error) {
      console.error('Error in bulk attachment:', error);
    }
  };

  const handleApplySuggestion = (suggestion: AttachmentSuggestion, accept: boolean) => {
    try {
      projectAttachmentService.applySuggestion(suggestion, accept);
      if (accept) {
        loadNotes(); // Reload to update attachment status
      }
      // Remove applied suggestion from the list
      setSuggestions(prev => prev.filter(s => 
        s.noteId !== suggestion.noteId || s.projectId !== suggestion.projectId
      ));
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  const handleBulkOrganizationComplete = (results: any) => {
    loadNotes();
    setShowBulkOrganization(false);
    console.log(`Organization complete: ${results.results.successful} notes processed`);
  };

  // Tab counts
  const tabCounts = {
    all: notes.filter(note => note.status !== 'archived').length,
    unattached: notes.filter(note => !note.projectId && note.status !== 'archived').length,
    attached: notes.filter(note => note.projectId && note.status !== 'archived').length,
    archived: notes.filter(note => note.status === 'archived').length,
  };

  // Priority and status icons
  const getPriorityIcon = (priority: QuickNote['priority']) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <Star className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'low': return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: QuickNote['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'review': return <BookOpen className="h-4 w-4 text-yellow-500" />;
      case 'archived': return <Archive className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="quick-notes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quick Capture</h1>
          <p className="text-muted-foreground">
            Capture your thoughts instantly - organize later or keep them free
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkOrganization(true)}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Smart Organize
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenProjectSelector}
            disabled={selectedNotes.size === 0}
            className="gap-2"
          >
            <Link2 className="h-4 w-4" />
            Attach Selected ({selectedNotes.size})
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Note
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowImportExport(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Tools
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tag Filter */}
          <Dropdown
            trigger={
              <Button variant="outline" className="gap-2">
                <Tag className="h-4 w-4" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            }
          >
            <div className="p-2 space-y-2 w-48">
              {availableTags.map(tag => (
                <label
                  key={tag}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded p-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags(prev => [...prev, tag]);
                      } else {
                        setSelectedTags(prev => prev.filter(t => t !== tag));
                      }
                    }}
                  />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
          </Dropdown>

          {/* View Mode */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Selection Actions */}
          {selectedNotes.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkActions(true)}
              className="gap-2"
            >
              Actions ({selectedNotes.size})
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as FilterTab)}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              All ({tabCounts.all})
            </button>
            <button
              onClick={() => setActiveTab('unattached')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'unattached'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              Unattached ({tabCounts.unattached})
            </button>
            <button
              onClick={() => setActiveTab('attached')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'attached'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              Attached ({tabCounts.attached})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'archived'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              Archived ({tabCounts.archived})
            </button>
          </div>

          {/* Select All */}
          {filteredNotes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedNotes.size === filteredNotes.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </Tabs>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && activeTab === 'unattached' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Smart Suggestions ({suggestions.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-sm"
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </Button>
          </div>

          {showSuggestions && (
            <div className="grid gap-3 max-h-80 overflow-y-auto">
              {suggestions.slice(0, 5).map(suggestion => {
                const note = notes.find(n => n.id === suggestion.noteId);
                const project = availableProjects.find(p => p.id === suggestion.projectId);
                
                if (!note || !project) return null;
                
                return (
                  <Card key={`${suggestion.noteId}-${suggestion.projectId}`} className="p-4 border-blue-200 bg-blue-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm truncate">{note.title}</h4>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{project.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {suggestion.reasons.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion, true)}
                          className="gap-1 text-xs"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion, false)}
                          className="gap-1 text-xs"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {suggestions.length > 5 && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkOrganization(true)}
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    View All {suggestions.length} Suggestions
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery || selectedTags.length > 0 ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'Create your first quick note to get started'
            }
          </p>
          {!searchQuery && selectedTags.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
        )}>
          {filteredNotes.map(note => (
            <QuickNoteCard
              key={note.id}
              note={note}
              viewMode={viewMode}
              isSelected={selectedNotes.has(note.id)}
              availableProjects={availableProjects}
              onSelect={() => handleSelectNote(note.id)}
              onDelete={() => handleDeleteNote(note.id)}
              onArchive={() => handleArchiveNote(note.id)}
              onRestore={() => handleRestoreNote(note.id)}
              onAttachToProject={handleAttachToProject}
              onDetachFromProject={() => handleDetachFromProject(note.id)}
              getPriorityIcon={getPriorityIcon}
              getStatusIcon={getStatusIcon}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateNote}
        availableProjects={availableProjects}
        availableTags={availableTags}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        selectedCount={selectedNotes.size}
        availableProjects={availableProjects}
        onBulkDelete={handleBulkDelete}
        onBulkArchive={handleBulkArchive}
        onBulkAttachToProject={handleBulkAttachToProject}
      />

      {/* Import/Export Modal */}
      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        onExport={handleExportNotes}
        onImport={(data) => {
          try {
            const result = quickNotesService.importQuickNotes(data);
            console.log(`Import result: ${result.imported} imported, ${result.errors.length} errors`);
            if (result.success) {
              loadNotes();
            }
          } catch (error) {
            console.error('Error importing notes:', error);
          }
        }}
      />

      {/* Enhanced Attachment Modals */}
      <ProjectSelectorModal
        isOpen={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        onSelect={handleProjectSelection}
        selectedNoteIds={Array.from(selectedNotes)}
        mode="bulk"
        title="Attach Notes to Project"
        description={`Choose a project to attach ${selectedNotes.size} selected note${selectedNotes.size !== 1 ? 's' : ''} to`}
      />

      <BulkOrganizationModal
        isOpen={showBulkOrganization}
        onClose={() => setShowBulkOrganization(false)}
        onComplete={handleBulkOrganizationComplete}
        selectedNoteIds={activeTab === 'unattached' ? filteredNotes.filter(n => !n.projectId).map(n => n.id) : []}
        initialMode="smart"
      />
    </div>
  );
}

// Quick Note Card Component
interface QuickNoteCardProps {
  note: QuickNote;
  viewMode: ViewMode;
  isSelected: boolean;
  availableProjects: Array<{ id: string; title: string }>;
  onSelect: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onAttachToProject: (noteId: string, projectId: string) => void;
  onDetachFromProject: () => void;
  getPriorityIcon: (priority: QuickNote['priority']) => React.ReactNode;
  getStatusIcon: (status: QuickNote['status']) => React.ReactNode;
  formatDate: (date: string) => string;
}

function QuickNoteCard({
  note,
  viewMode,
  isSelected,
  availableProjects,
  onSelect,
  onDelete,
  onArchive,
  onRestore,
  onAttachToProject,
  onDetachFromProject,
  getPriorityIcon,
  getStatusIcon,
  formatDate,
}: QuickNoteCardProps) {
  const [showActions, setShowActions] = useState(false);

  const attachedProject = availableProjects.find(p => p.id === note.projectId);

  if (viewMode === 'list') {
    return (
      <Card className={cn(
        'p-4 hover:shadow-md transition-all cursor-pointer border-l-4',
        isSelected ? 'ring-2 ring-primary bg-accent/50' : '',
        note.priority === 'urgent' ? 'border-l-red-500' :
        note.priority === 'high' ? 'border-l-orange-500' :
        note.priority === 'medium' ? 'border-l-blue-500' : 'border-l-gray-300'
      )}>
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {note.title}
              </h3>
              {getPriorityIcon(note.priority)}
              {getStatusIcon(note.status)}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {note.content || 'No content'}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDate(note.updatedAt)}</span>
              <span>•</span>
              <span>{note.wordCount} words</span>
              {attachedProject && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {attachedProject.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {note.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 2}
              </Badge>
            )}
          </div>

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                •••
              </Button>
            }
          >
            <div className="p-1 space-y-1 w-48">
              {note.status === 'archived' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRestore}
                  className="w-full justify-start gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchive}
                  className="w-full justify-start gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </Dropdown>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'p-4 hover:shadow-md transition-all cursor-pointer',
      isSelected ? 'ring-2 ring-primary bg-accent/50' : ''
    )}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 mt-0.5"
            />
            <h3 className="font-semibold text-foreground truncate">
              {note.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            {getPriorityIcon(note.priority)}
            {getStatusIcon(note.status)}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
          {note.content || 'No content'}
        </p>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="space-y-1">
            <div>{formatDate(note.updatedAt)}</div>
            <div>{note.wordCount} words</div>
          </div>

          {attachedProject && (
            <div className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              <span className="truncate max-w-20" title={attachedProject.title}>
                {attachedProject.title}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                •••
              </Button>
            }
          >
            <div className="p-1 space-y-1 w-48">
              {note.status === 'archived' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRestore}
                  className="w-full justify-start gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchive}
                  className="w-full justify-start gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )}
              
              {/* Project attachment */}
              {note.projectId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDetachFromProject}
                  className="w-full justify-start gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Detach from Project
                </Button>
              ) : (
                availableProjects.length > 0 && (
                  <Dropdown
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Attach to Project
                      </Button>
                    }
                  >
                    <div className="p-1 space-y-1 max-h-48 overflow-y-auto">
                      {availableProjects.map(project => (
                        <Button
                          key={project.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => onAttachToProject(note.id, project.id)}
                          className="w-full justify-start text-left"
                        >
                          {project.title}
                        </Button>
                      ))}
                    </div>
                  </Dropdown>
                )
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </Dropdown>
        </div>
      </div>
    </Card>
  );
}


