/**
 * Project Dashboard - Comprehensive Project Management Interface
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Archive, 
  Download, 
  Share, 
  Target, 
  Calendar, 
  Clock, 
  BookOpen,
  FileText,
  BarChart3,
  TrendingUp,
  Eye,
  Search,
  Filter,
  Settings,
  Star,
  Tag,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { CreateStoryModal, type StoryFormData } from '@/components/modals/CreateStoryModal';
import { projectService } from '@/services/projectService';
import { noteService } from '@/services/noteService';
import { exportService } from '@/services/exportService';
import { NOTE_TYPES } from '@/utils/constants';
import type { Project, Note } from '@/types/global';

type NoteSortField = 'title' | 'created' | 'updated' | 'wordCount' | 'type';
type NoteSortDirection = 'asc' | 'desc';

export function ProjectDashboard() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteType, setSelectedNoteType] = useState<string>('all');
  const [sortField, setSortField] = useState<NoteSortField>('updated');
  const [sortDirection, setSortDirection] = useState<NoteSortDirection>('desc');
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);

  // Load project and notes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        navigate('/projects');
        return;
      }

      try {
        setIsLoading(true);
        
        const [projectData, notesData] = await Promise.all([
          projectService.getProjectById(projectId),
          noteService.getProjectNotes(projectId)
        ]);

        if (!projectData) {
          toast.error('Project not found');
          navigate('/projects');
          return;
        }

        setProject(projectData);
        setNotes(notesData);
      } catch (error) {
        toast.error('Failed to load project data');
        navigate('/projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, navigate, toast]);

  // Filtered and sorted notes
  const filteredAndSortedNotes = useMemo(() => {
    const filtered = notes.filter(note => {
      // Type filter
      if (selectedNoteType !== 'all' && note.type !== selectedNoteType) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });

    // Sort notes
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updated':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'wordCount':
          aValue = a.wordCount;
          bValue = b.wordCount;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [notes, searchQuery, selectedNoteType, sortField, sortDirection]);

  // Project statistics
  const projectStats = useMemo(() => {
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => sum + note.wordCount, 0);
    const notesByType = notes.reduce((acc, note) => {
      acc[note.type] = (acc[note.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lastUpdated = notes.length > 0 
      ? new Date(Math.max(...notes.map(note => new Date(note.updatedAt).getTime())))
      : null;

    const averageWordCount = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
    const readingTime = Math.ceil(totalWords / 200); // Average reading speed

    const progress = project?.targetWordCount 
      ? Math.min(100, (totalWords / project.targetWordCount) * 100)
      : 0;

    return {
      totalNotes,
      totalWords,
      notesByType,
      lastUpdated,
      averageWordCount,
      readingTime,
      progress
    };
  }, [notes, project]);

  // Event handlers
  const handleDeleteNote = async (note: Note) => {
    setSelectedNote(note);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      await noteService.deleteNote(selectedNote.id);
      setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
      toast.success(`Note "${selectedNote.title}" deleted successfully`);
      setShowDeleteConfirm(false);
      setSelectedNote(null);
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleArchiveProject = () => {
    setShowArchiveConfirm(true);
  };

  const confirmArchiveProject = async () => {
    if (!project) return;

    try {
      await projectService.archiveProject(project.id);
      toast.success(`Project "${project.title}" archived successfully`);
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to archive project');
    }
  };

  const handleExportProject = () => {
    if (!project) return;
    
    try {
      exportService.downloadProjectAsMarkdown(project.id);
      toast.success(`Project "${project.title}" exported successfully`);
    } catch (error) {
      toast.error('Failed to export project');
    }
  };

  const handleCreateNote = () => {
    navigate(`/projects/${projectId}/notes/new`);
  };

  const handleCreateStory = async (storyData: StoryFormData) => {
    try {
      // In a real app, this would call your API to create the story
      const newStoryId = `story-${Date.now()}`;
      
      // For now, navigate to the story editor with the new story
      navigate(`/projects/${projectId}/stories/${newStoryId}/edit`, {
        state: { storyData }
      });
      
      setShowCreateStoryModal(false);
      toast.success('Story created successfully!');
    } catch (error) {
      toast.error('Failed to create story');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Dropdown options
  const noteTypeOptions: DropdownOption[] = [
    { value: 'all', label: 'All Types', icon: <FileText className="h-4 w-4" /> },
    ...NOTE_TYPES.map(type => ({
      value: type.value,
      label: type.label,
      icon: <FileText className="h-4 w-4" />
    }))
  ];

  const sortOptions: DropdownOption[] = [
    { value: 'updated', label: 'Last Updated', icon: <Clock className="h-4 w-4" /> },
    { value: 'created', label: 'Date Created', icon: <Calendar className="h-4 w-4" /> },
    { value: 'title', label: 'Title', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'wordCount', label: 'Word Count', icon: <Target className="h-4 w-4" /> },
    { value: 'type', label: 'Type', icon: <Tag className="h-4 w-4" /> },
  ];

  const projectActions: DropdownOption[] = [
    { value: 'edit', label: 'Edit Project', icon: <Edit className="h-4 w-4" /> },
    { value: 'export', label: 'Export Project', icon: <Download className="h-4 w-4" /> },
    { value: 'duplicate', label: 'Duplicate Project', icon: <Copy className="h-4 w-4" /> },
    { value: 'archive', label: 'Archive Project', icon: <Archive className="h-4 w-4" /> },
  ];

  const handleProjectAction = (action: string) => {
    switch (action) {
      case 'edit':
        setShowEditProjectModal(true);
        break;
      case 'export':
        handleExportProject();
        break;
      case 'archive':
        handleArchiveProject();
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  {project.description && (
                    <p className="text-muted-foreground">{project.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Updated {formatTimeAgo(project.updatedAt)}
                    </span>
                    {project.genre && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {project.genre}
                      </span>
                    )}
                  </div>
                </div>
                <Dropdown
                  options={projectActions}
                  onChange={handleProjectAction}
                  placeholder={<Settings className="h-4 w-4" />}
                />
              </div>
            </CardHeader>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Total Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.totalNotes}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {projectStats.averageWordCount} words per note
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Total Words
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.totalWords.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {projectStats.readingTime} min reading time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(projectStats.progress)}%</div>
                <p className="text-xs text-muted-foreground">
                  {project.targetWordCount ? `of ${project.targetWordCount.toLocaleString()} target` : 'No target set'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projectStats.lastUpdated ? formatTimeAgo(projectStats.lastUpdated.toISOString()) : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Most recent activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {project.targetWordCount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Word Count Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{projectStats.totalWords.toLocaleString()} words</span>
                    <span>{project.targetWordCount.toLocaleString()} target</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(projectStats.progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {project.targetWordCount - projectStats.totalWords > 0 
                      ? `${(project.targetWordCount - projectStats.totalWords).toLocaleString()} words remaining`
                      : 'Target achieved!'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(projectStats.notesByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(projectStats.notesByType).length === 0 && (
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <FileText className="h-4 w-4" />,
      badge: notes.length,
      content: (
        <div className="space-y-6">
          {/* Notes Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                variant="cosmic"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Dropdown
                options={noteTypeOptions}
                value={selectedNoteType}
                onChange={setSelectedNoteType}
                placeholder="Filter by type"
              />
              
              <Dropdown
                options={sortOptions}
                value={sortField}
                onChange={(value) => setSortField(value as NoteSortField)}
                placeholder="Sort by"
              />
              
              <Dropdown
                trigger={
                  <Button
                    variant="cosmic"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create New
                  </Button>
                }
                options={[
                  { 
                    label: 'Quick Note', 
                    value: 'note',
                    icon: <FileText className="h-4 w-4" />
                  },
                  { 
                    label: 'Story/Novel', 
                    value: 'story',
                    icon: <BookOpen className="h-4 w-4" />
                  }
                ]}
                onSelect={(value) => {
                  if (value === 'note') {
                    handleCreateNote();
                  } else if (value === 'story') {
                    setShowCreateStoryModal(true);
                  }
                }}
              />
            </div>
          </div>

          {/* Notes List */}
          {filteredAndSortedNotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {notes.length === 0 ? 'No notes yet' : 'No notes found'}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {notes.length === 0 
                    ? 'Create your first note to start writing.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {notes.length === 0 && (
                  <Button 
                    variant="cosmic" 
                    onClick={handleCreateNote}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create Your First Note
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedNotes.map((note) => (
                <Card key={note.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                            <Link
                              to={`/projects/${projectId}/notes/${note.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {note.title}
                            </Link>
                          </CardTitle>
                          <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                            {note.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {note.content.substring(0, 150)}...
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          asChild
                        >
                          <Link to={`/projects/${projectId}/notes/${note.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => handleDeleteNote(note)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {note.wordCount} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(note.updatedAt)}
                        </span>
                      </div>
                      
                      {note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 text-violet-700 dark:text-violet-300 rounded-md text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-xs">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="project-dashboard">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/projects')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Projects
        </Button>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            project.status === 'writing' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
            project.status === 'editing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
            project.status === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
            project.status === 'complete' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400' :
            'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <Tabs tabs={tabs} variant="cosmic" />

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        description={`Are you sure you want to delete "${selectedNote?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />

      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={confirmArchiveProject}
        title="Archive Project"
        description={`Are you sure you want to archive "${project.title}"? You can restore it later from archived projects.`}
        confirmText="Archive"
      />

      <CreateStoryModal
        isOpen={showCreateStoryModal}
        onClose={() => setShowCreateStoryModal(false)}
        onSubmit={handleCreateStory}
        projectId={projectId}
      />
    </div>
  );
}
