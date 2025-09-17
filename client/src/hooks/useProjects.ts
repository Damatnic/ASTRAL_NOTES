/**
 * Projects Hook
 * Manages project state and operations using Redux
 */

import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import type { RootState } from '@/store/store';
import {
  fetchProjectsAsync,
  createProjectAsync,
  updateProjectAsync,
  deleteProjectAsync,
  setCurrentProject,
  clearError,
  setStatusFilter,
  setSearchFilter,
  setTagsFilter,
  clearFilters,
} from '@/store/slices/projectsSlice';
import type { Project } from '@/types/global';
import type { CreateProjectData, UpdateProjectData } from '@/services/projectService';

export function useProjects() {
  const dispatch = useDispatch();
  
  const {
    projects,
    currentProject,
    isLoading,
    error,
    filter,
  } = useSelector((state: RootState) => state.projects);

  // Load projects on mount
  useEffect(() => {
    dispatch(fetchProjectsAsync());
  }, [dispatch]);

  // Project operations
  const createProject = useCallback(async (projectData: CreateProjectData) => {
    const result = await dispatch(createProjectAsync(projectData));
    return result;
  }, [dispatch]);

  const updateProject = useCallback(async (id: string, projectData: UpdateProjectData) => {
    const result = await dispatch(updateProjectAsync({ id, projectData }));
    return result;
  }, [dispatch]);

  const deleteProject = useCallback(async (id: string) => {
    const result = await dispatch(deleteProjectAsync(id));
    return result;
  }, [dispatch]);

  const selectProject = useCallback((project: Project | null) => {
    dispatch(setCurrentProject(project));
  }, [dispatch]);

  // Filter operations
  const setStatusFilterValue = useCallback((status: Project['status'] | 'all') => {
    dispatch(setStatusFilter(status));
  }, [dispatch]);

  const setSearchFilterValue = useCallback((search: string) => {
    dispatch(setSearchFilter(search));
  }, [dispatch]);

  const setTagsFilterValue = useCallback((tags: string[]) => {
    dispatch(setTagsFilter(tags));
  }, [dispatch]);

  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const clearProjectError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Computed values
  const filteredProjects = projects.filter(project => {
    // Status filter
    if (filter.status !== 'all' && project.status !== filter.status) {
      return false;
    }

    // Search filter
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const matchesTitle = project.title.toLowerCase().includes(searchTerm);
      const matchesDescription = project.description?.toLowerCase().includes(searchTerm);
      const matchesTags = project.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(filterTag => 
        project.tags.some(projectTag => 
          projectTag.toLowerCase().includes(filterTag.toLowerCase())
        )
      );
      
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });

  // Project statistics
  const projectStats = {
    total: projects.length,
    byStatus: {
      planning: projects.filter(p => p.status === 'planning').length,
      writing: projects.filter(p => p.status === 'writing').length,
      editing: projects.filter(p => p.status === 'editing').length,
      complete: projects.filter(p => p.status === 'complete').length,
      archived: projects.filter(p => p.status === 'archived').length,
    },
    totalWords: projects.reduce((sum, project) => sum + project.wordCount, 0),
  };

  return {
    // Data
    projects: filteredProjects,
    allProjects: projects,
    currentProject,
    isLoading,
    error,
    filter,
    projectStats,

    // Operations
    createProject,
    updateProject,
    deleteProject,
    selectProject,

    // Filters
    setStatusFilter: setStatusFilterValue,
    setSearchFilter: setSearchFilterValue,
    setTagsFilter: setTagsFilterValue,
    clearFilters: clearAllFilters,
    clearError: clearProjectError,

    // Utilities
    refreshProjects: () => dispatch(fetchProjectsAsync()),
    getProjectById: (id: string) => projects.find(p => p.id === id),
    getProjectsByStatus: (status: Project['status']) => projects.filter(p => p.status === status),
    getProjectsByTag: (tag: string) => projects.filter(p => p.tags.includes(tag)),
    getAllTags: () => Array.from(new Set(projects.flatMap(p => p.tags))).sort(),
  };
}