/**
 * Advanced Projects Page with Enhanced Management Features
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  FolderOpen, 
  Search, 
  Filter, 
  Archive, 
  Trash2, 
  Edit, 
  Eye, 
  LayoutGrid, 
  List,
  SortAsc,
  SortDesc,
  Calendar,
  BookOpen,
  Target,
  Star,
  Copy,
  Download,
  Upload,
  Settings,
  MoreHorizontal,
  FileText,
  Link2,
  BarChart3,
  Wand2,
  ChevronRight
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';
import { fetchProjectsAsync, deleteProjectAsync, setSearchFilter, setStatusFilter } from '@/store/slices/projectsSlice';
import { projectService } from '@/services/projectService';
import { quickNotesService, type QuickNote } from '@/services/quickNotesService';
import { projectAttachmentService } from '@/services/projectAttachmentService';
import { AttachmentAnalytics, BulkOrganizationModal } from '@/components/attachment';
import { exportService } from '@/services/exportService';
import { PROJECT_STATUS_OPTIONS, WRITING_GENRES } from '@/utils/constants';
import type { RootState, AppDispatch } from '@/store/store';
import type { Project } from '@/types/global';

type ViewMode = 'grid' | 'list' | 'table';
type SortField = 'title' | 'lastEdited' | 'created' | 'wordCount' | 'status';
type SortDirection = 'asc' | 'desc';

export function Projects() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, isLoading, filter } = useSelector((state: RootState) => state.projects);
  const toast = useToast();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filter.search);
  const [sortField, setSortField] = useState<SortField>('lastEdited');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Modal states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showBulkOrganization, setShowBulkOrganization] = useState(false);
  const [showAttachmentAnalytics, setShowAttachmentAnalytics] = useState(false);
  
  // Batch operations
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  
  // Attachment data
  const [attachedNotes, setAttachedNotes] = useState<Record<string, QuickNote[]>>({});
  const [showAttachedNotes, setShowAttachedNotes] = useState<Record<string, boolean>>({});

  // Load projects on component mount
  useEffect(() => {
    dispatch(fetchProjectsAsync());
    loadAttachedNotes();
  }, [dispatch]);

  // Load attached notes for all projects
  const loadAttachedNotes = () => {
    const allQuickNotes = quickNotesService.getAllQuickNotes();
    const notesByProject: Record<string, QuickNote[]> = {};
    
    allQuickNotes.forEach(note => {
      if (note.projectId) {
        if (!notesByProject[note.projectId]) {
          notesByProject[note.projectId] = [];
        }
        notesByProject[note.projectId].push(note);
      }
    });
    
    setAttachedNotes(notesByProject);
  };

  // Advanced filtering and sorting with memoization
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Status filter
      if (filter.status !== 'all' && project.status !== filter.status) {
        return false;
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          project.title.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          project.genre?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'lastEdited':
          aValue = new Date(a.lastEditedAt);
          bValue = new Date(b.lastEditedAt);
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'wordCount':
          aValue = a.wordCount;
          bValue = b.wordCount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, filter, sortField, sortDirection]);

  // Project statistics with attachment data
  const projectStats = useMemo(() => {
    const total = projects.length;
    const byStatus = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalWords = projects.reduce((sum, project) => sum + project.wordCount, 0);
    const averageWords = total > 0 ? Math.round(totalWords / total) : 0;
    
    // Calculate attachment statistics
    const totalAttachedNotes = Object.values(attachedNotes).reduce((sum, notes) => sum + notes.length, 0);
    const projectsWithNotes = Object.keys(attachedNotes).length;
    const attachmentAnalytics = projectAttachmentService.getAttachmentAnalytics();

    return { 
      total, 
      byStatus, 
      totalWords, 
      averageWords, 
      totalAttachedNotes,
      projectsWithNotes,
      unattachedNotes: attachmentAnalytics.unattachedNotes
    };
  }, [projects, attachedNotes]);

  // Format time since last edit
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const edited = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - edited.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return edited.toLocaleDateString();
  };

  // Event handlers
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(setSearchFilter(searchQuery));
  };

  const handleStatusFilter = (status: Project['status'] | 'all') => {
    dispatch(setStatusFilter(status));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Project actions
  const handleDeleteProject = async (project: Project) => {
    setSelectedProject(project);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    if (selectedProject) {
      try {
        await dispatch(deleteProjectAsync(selectedProject.id));
        toast.success(`Project "${selectedProject.title}" deleted successfully`);
        setShowDeleteConfirm(false);
        setSelectedProject(null);
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const handleArchiveProject = async (project: Project) => {
    setSelectedProject(project);
    setShowArchiveConfirm(true);
  };

  const confirmArchiveProject = async () => {
    if (selectedProject) {
      try {
        await projectService.archiveProject(selectedProject.id);
        await dispatch(fetchProjectsAsync());
        toast.success(`Project "${selectedProject.title}" archived successfully`);
        setShowArchiveConfirm(false);
        setSelectedProject(null);
      } catch (error) {
        toast.error('Failed to archive project');
      }
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      const duplicatedProject = await projectService.duplicateProject(project.id);
      await dispatch(fetchProjectsAsync());
      toast.success(`Project duplicated as "${duplicatedProject.title}"`);
    } catch (error) {
      toast.error('Failed to duplicate project');
    }
  };

  const handleExportProject = (project: Project) => {
    try {
      exportService.downloadProjectAsMarkdown(project.id);
      toast.success(`Project "${project.title}" exported successfully`);
    } catch (error) {
      toast.error('Failed to export project');
    }
  };

  const handleExportAll = () => {
    try {
      exportService.downloadDataAsJson();
      toast.success('All projects exported successfully');
    } catch (error) {
      toast.error('Failed to export projects');
    }
  };

  // Batch operations
  const handleSelectProject = (projectId: string, selected: boolean) => {
    const newSelected = new Set(selectedProjects);
    if (selected) {
      newSelected.add(projectId);
    } else {
      newSelected.delete(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProjects(new Set(filteredAndSortedProjects.map(p => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProjects.size === 0) return;
    
    const projectTitles = Array.from(selectedProjects)
      .map(id => projects.find(p => p.id === id)?.title)
      .filter(Boolean);
    
    if (window.confirm(`Are you sure you want to delete ${selectedProjects.size} projects?\n\n${projectTitles.join('\n')}`)) {
      try {
        await Promise.all(Array.from(selectedProjects).map(id => 
          dispatch(deleteProjectAsync(id))
        ));
        toast.success(`${selectedProjects.size} projects deleted successfully`);
        setSelectedProjects(new Set());
      } catch (error) {
        toast.error('Failed to delete some projects');
      }
    }
  };

  // Dropdown options for sorting
  const sortOptions: DropdownOption[] = [
    { value: 'lastEdited', label: 'Last Edited', icon: <Calendar className="h-4 w-4" /> },
    { value: 'created', label: 'Date Created', icon: <Calendar className="h-4 w-4" /> },
    { value: 'title', label: 'Title', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'wordCount', label: 'Word Count', icon: <Target className="h-4 w-4" /> },
    { value: 'status', label: 'Status', icon: <Settings className="h-4 w-4" /> },
  ];

  const viewModeOptions: DropdownOption[] = [
    { value: 'grid', label: 'Grid View', icon: <LayoutGrid className="h-4 w-4" /> },
    { value: 'list', label: 'List View', icon: <List className="h-4 w-4" /> },
    { value: 'table', label: 'Table View', icon: <List className="h-4 w-4" /> },
  ];

  const bulkActionsOptions: DropdownOption[] = [
    { value: 'export', label: 'Export Selected', icon: <Download className="h-4 w-4" /> },
    { value: 'archive', label: 'Archive Selected', icon: <Archive className="h-4 w-4" /> },
    { value: 'delete', label: 'Delete Selected', icon: <Trash2 className="h-4 w-4" /> },
  ];

  const getProjectActions = (project: Project): DropdownOption[] => [
    { value: 'view', label: 'View', icon: <Eye className="h-4 w-4" /> },
    { value: 'edit', label: 'Edit', icon: <Edit className="h-4 w-4" /> },
    { value: 'duplicate', label: 'Duplicate', icon: <Copy className="h-4 w-4" /> },
    { value: 'export', label: 'Export', icon: <Download className="h-4 w-4" /> },
    { value: 'favorite', label: 'Add to Favorites', icon: <Star className="h-4 w-4" /> },
    { value: 'archive', label: 'Archive', icon: <Archive className="h-4 w-4" /> },
    { value: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" /> },
  ];

  const handleProjectAction = (project: Project, action: string) => {
    switch (action) {
      case 'view':
        window.location.href = `/projects/${project.id}`;
        break;
      case 'edit':
        window.location.href = `/projects/${project.id}/edit`;
        break;
      case 'duplicate':
        handleDuplicateProject(project);
        break;
      case 'export':
        handleExportProject(project);
        break;
      case 'archive':
        handleArchiveProject(project);
        break;
      case 'delete':
        handleDeleteProject(project);
        break;
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'export':
        // Export selected projects
        break;
      case 'archive':
        // Archive selected projects
        break;
      case 'delete':
        handleBatchDelete();
        break;
    }
  };

  // Attachment-related event handlers
  const handleToggleAttachedNotes = (projectId: string) => {
    setShowAttachedNotes(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleDetachNote = async (noteId: string) => {
    try {
      const success = projectAttachmentService.detachNoteFromProject(noteId);
      if (success) {
        loadAttachedNotes();
        toast.success('Note detached successfully');
      } else {
        toast.error('Failed to detach note');
      }
    } catch (error) {
      console.error('Error detaching note:', error);
      toast.error('Error detaching note');
    }
  };

  const handleBulkOrganizationComplete = (results: any) => {
    loadAttachedNotes();
    toast.success(`Organization complete: ${results.results.successful} notes processed`);
    setShowBulkOrganization(false);
  };

  const handleGenerateSmartSuggestions = async (projectId: string) => {
    try {
      // This would open a modal or generate suggestions for the specific project
      const suggestions = projectAttachmentService.generateAttachmentSuggestions();
      const projectSuggestions = suggestions.filter(s => s.projectId === projectId);
      
      if (projectSuggestions.length > 0) {
        toast.success(`Found ${projectSuggestions.length} smart suggestions for this project`);
      } else {
        toast.info('No new suggestions found for this project');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="projects-overview">
      {/* Enhanced Header with Stats */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-gradient">
              My Writing Projects
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              Organize, create, and manage your literary masterpieces
            </p>
            
            {/* Quick stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {projects.length} projects
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {projects.filter(p => p.status === 'active').length} active
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {projects.filter(p => p.status === 'completed').length} completed
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="glass" 
              onClick={() => setShowBulkOrganization(true)} 
              leftIcon={<Wand2 className="h-4 w-4" />}
            >
              Organize Notes
            </Button>
            <Button 
              variant="gradient" 
              onClick={() => setShowNewProjectModal(true)}
              leftIcon={<PlusCircle className="h-4 w-4" />}
              shimmer
            >
              New Project
            </Button>
          </div>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projectStats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Words Written</p>
                <p className="text-2xl font-bold">{projectStats.totalWords.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Writing</p>
                <p className="text-2xl font-bold">{projectStats.byStatus.writing || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{projectStats.byStatus.complete || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search, Filter, and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects by title, description, genre, or tags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="cosmic"
              />
            </div>
          </form>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={showFilters ? 'cosmic' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filter
            </Button>
            
            <Dropdown
              options={sortOptions}
              value={sortField}
              onChange={(value) => handleSort(value as SortField)}
              placeholder="Sort by..."
              variant="cosmic"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            
            <Dropdown
              options={viewModeOptions}
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              placeholder="View mode..."
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-4 border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/30">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter.status === 'all' ? 'cosmic' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilter('all')}
                  >
                    All ({projectStats.total})
                  </Button>
                  {PROJECT_STATUS_OPTIONS.filter(option => option.value !== 'deleted').map((status) => (
                    <Button
                      key={status.value}
                      variant={filter.status === status.value ? 'cosmic' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusFilter(status.value as Project['status'])}
                    >
                      {status.label} ({projectStats.byStatus[status.value] || 0})
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Batch Actions */}
        {selectedProjects.size > 0 && (
          <Card className="p-4 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedProjects(new Set())}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Dropdown
                  options={bulkActionsOptions}
                  onChange={handleBulkAction}
                  placeholder="Bulk Actions..."
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Projects Content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </CardContent>
        </Card>
      ) : filteredAndSortedProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects found'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {projects.length === 0 
                ? 'Create your first project to get started with your writing journey.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {projects.length === 0 && (
              <Button 
                variant="cosmic" 
                onClick={() => setShowNewProjectModal(true)}
                leftIcon={<PlusCircle className="h-4 w-4" />}
              >
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {filteredAndSortedProjects.map((project) => (
            <Card key={project.id} variant="modern" className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedProjects.has(project.id)}
                        onChange={(e) => handleSelectProject(project.id, e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                        <Link
                          to={`/projects/${project.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {project.title}
                        </Link>
                      </CardTitle>
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
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </div>
                  
                  <Dropdown
                    options={getProjectActions(project)}
                    onChange={(action) => handleProjectAction(project, action)}
                    placeholder={<MoreHorizontal className="h-4 w-4" />}
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Progress bar if target word count exists */}
                  {project.targetWordCount && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round((project.wordCount / project.targetWordCount) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((project.wordCount / project.targetWordCount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {(project.wordCount ?? 0).toLocaleString()} words
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeAgo(project.lastEditedAt)}
                      </span>
                      {project.genre && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {project.genre}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {(project.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(project.tags ?? []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 text-violet-700 dark:text-violet-300 rounded-md text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {(project.tags ?? []).length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-xs">
                          +{(project.tags ?? []).length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Attached Notes Section */}
                  {attachedNotes[project.id] && attachedNotes[project.id].length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Attached Notes ({attachedNotes[project.id].length})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateSmartSuggestions(project.id)}
                            className="text-xs"
                          >
                            <Wand2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAttachedNotes(project.id)}
                            className="text-xs"
                          >
                            <ChevronRight className={`h-3 w-3 transition-transform ${showAttachedNotes[project.id] ? 'rotate-90' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      {showAttachedNotes[project.id] && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {attachedNotes[project.id].slice(0, 3).map(note => (
                            <div key={note.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{note.title}</p>
                                <p className="text-muted-foreground truncate">{note.content.slice(0, 50)}...</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDetachNote(note.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {attachedNotes[project.id].length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{attachedNotes[project.id].length - 3} more notes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        description={`Are you sure you want to delete "${selectedProject?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />

      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={confirmArchiveProject}
        title="Archive Project"
        description={`Are you sure you want to archive "${selectedProject?.title}"? You can restore it later from archived projects.`}
        confirmText="Archive"
      />

      {/* Attachment System Modals */}
      <BulkOrganizationModal
        isOpen={showBulkOrganization}
        onClose={() => setShowBulkOrganization(false)}
        onComplete={handleBulkOrganizationComplete}
      />

      <Modal isOpen={showAttachmentAnalytics} onClose={() => setShowAttachmentAnalytics(false)} size="large">
        <AttachmentAnalytics />
      </Modal>
    </div>
  );
}
