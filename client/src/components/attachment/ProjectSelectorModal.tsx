/**
 * Project Selector Modal
 * Advanced modal for selecting projects with search, filtering, and preview
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FolderOpen, 
  Calendar, 
  Target, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  X,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { projectService } from '@/services/projectService';
import { projectAttachmentService } from '@/services/projectAttachmentService';
import { quickNotesService, type QuickNote } from '@/services/quickNotesService';
import type { Project } from '@/types/global';
import { cn } from '@/utils/cn';

interface ProjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  selectedNoteIds: string[];
  mode?: 'single' | 'bulk';
  title?: string;
  description?: string;
}

type FilterTab = 'all' | 'recent' | 'active' | 'compatible';

export function ProjectSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedNoteIds,
  mode = 'single',
  title = 'Select Project',
  description = 'Choose a project to attach the note(s) to'
}: ProjectSelectorModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load projects and suggestions
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedNoteIds]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allProjects = projectService.getAllProjects()
        .filter(p => p.status !== 'deleted' && p.status !== 'archived');
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get suggestions for selected notes
  const suggestions = useMemo(() => {
    if (!showSuggestions || selectedNoteIds.length === 0) return [];
    
    const allSuggestions = selectedNoteIds.flatMap(noteId => 
      projectAttachmentService.generateAttachmentSuggestions(noteId)
    );
    
    // Group by project and calculate average confidence
    const suggestionMap = new Map<string, { projectId: string; confidence: number; count: number; reasons: Set<string> }>();
    
    allSuggestions.forEach(suggestion => {
      const existing = suggestionMap.get(suggestion.projectId);
      if (existing) {
        existing.confidence = (existing.confidence * existing.count + suggestion.confidence) / (existing.count + 1);
        existing.count += 1;
        suggestion.reasons.forEach(reason => existing.reasons.add(reason));
      } else {
        suggestionMap.set(suggestion.projectId, {
          projectId: suggestion.projectId,
          confidence: suggestion.confidence,
          count: 1,
          reasons: new Set(suggestion.reasons)
        });
      }
    });
    
    return Array.from(suggestionMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }, [selectedNoteIds, showSuggestions]);

  // Filter projects based on active tab and search
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];
    
    // Apply tab filter
    switch (activeTab) {
      case 'recent':
        filtered = projectService.getRecentProjects(10);
        break;
      case 'active':
        filtered = filtered.filter(p => p.status === 'writing');
        break;
      case 'compatible':
        // Show projects with matching tags from selected notes
        if (selectedNoteIds.length > 0) {
          const selectedNotes = selectedNoteIds
            .map(id => quickNotesService.getQuickNoteById(id))
            .filter(Boolean) as QuickNote[];
          
          const allNoteTags = new Set(selectedNotes.flatMap(note => note.tags));
          
          filtered = filtered.filter(project => 
            project.tags.some(tag => allNoteTags.has(tag))
          );
        }
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        project.genre?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [projects, activeTab, searchQuery, selectedNoteIds]);

  // Get project statistics
  const getProjectStats = (project: Project) => {
    const attachedNotes = quickNotesService.getAllQuickNotes()
      .filter(note => note.projectId === project.id);
    
    return {
      attachedNotesCount: attachedNotes.length,
      totalWordCount: project.wordCount,
      lastActivity: project.lastEditedAt
    };
  };

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleConfirm = () => {
    if (selectedProject) {
      onSelect(selectedProject);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
            {mode === 'bulk' && (
              <p className="text-sm text-muted-foreground mt-1">
                Attaching {selectedNoteIds.length} note{selectedNoteIds.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Projects', count: projects.length },
                { key: 'recent', label: 'Recent', count: projectService.getRecentProjects(10).length },
                { key: 'active', label: 'Active', count: projects.filter(p => p.status === 'writing').length },
                { key: 'compatible', label: 'Compatible', count: 0 } // Count calculated dynamically
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as FilterTab)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {tab.label} {tab.key !== 'compatible' && `(${tab.count})`}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </Button>
          </div>
        </div>

        {/* Smart Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Smart Suggestions
            </h3>
            <div className="grid gap-3">
              {suggestions.map(suggestion => {
                const project = projects.find(p => p.id === suggestion.projectId);
                if (!project) return null;

                return (
                  <Card
                    key={suggestion.projectId}
                    className={cn(
                      'p-4 cursor-pointer border transition-all hover:shadow-md',
                      selectedProject === suggestion.projectId
                        ? 'ring-2 ring-primary bg-accent/50'
                        : 'hover:bg-accent/30'
                    )}
                    onClick={() => handleSelectProject(suggestion.projectId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground truncate">
                            {project.title}
                          </h4>
                          <Badge 
                            variant={suggestion.confidence >= 0.8 ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {Math.round(suggestion.confidence * 100)}% match
                          </Badge>
                          {suggestion.confidence >= 0.8 && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {Array.from(suggestion.reasons).slice(0, 2).join(', ')}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            {project.status}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {project.wordCount.toLocaleString()} words
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Project List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            All Projects
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredProjects.length})
            </span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h4 className="text-lg font-medium text-foreground mb-1">No projects found</h4>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first project to get started'}
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProjects.map(project => {
                const stats = getProjectStats(project);
                const isSelected = selectedProject === project.id;

                return (
                  <Card
                    key={project.id}
                    className={cn(
                      'p-4 cursor-pointer border transition-all hover:shadow-md',
                      isSelected
                        ? 'ring-2 ring-primary bg-accent/50'
                        : 'hover:bg-accent/30'
                    )}
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground truncate">
                            {project.title}
                          </h4>
                          <span className={cn(
                            'px-2 py-1 text-xs rounded-full font-medium',
                            project.status === 'writing' ? 'bg-green-100 text-green-800' :
                            project.status === 'editing' ? 'bg-yellow-100 text-yellow-800' :
                            project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'complete' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {project.status}
                          </span>
                        </div>
                        
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {project.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {stats.totalWordCount.toLocaleString()} words
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {stats.attachedNotesCount} notes
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatTimeAgo(stats.lastActivity)}
                          </span>
                        </div>

                        {project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedProject && (
              <>Selected: {projects.find(p => p.id === selectedProject)?.title}</>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedProject}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Attach to Project
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}