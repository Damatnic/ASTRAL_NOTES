/**
 * Projects Redux Slice - LocalStorage Implementation
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Project } from '@/types/global';
import { projectService, type CreateProjectData, type UpdateProjectData } from '@/services/projectService';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    status: Project['status'] | 'all';
    search: string;
    tags: string[];
  };
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  filter: {
    status: 'all',
    search: '',
    tags: [],
  },
};

// Async thunks for localStorage operations
export const fetchProjectsAsync = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const projects = projectService.getAllProjects();
      return projects;
    } catch (error) {
      return rejectWithValue('Failed to load projects from storage.');
    }
  }
);

export const createProjectAsync = createAsyncThunk(
  'projects/createProject',
  async (projectData: CreateProjectData, { rejectWithValue }) => {
    try {
      const project = projectService.createProject(projectData);
      return project;
    } catch (error) {
      return rejectWithValue('Failed to create project.');
    }
  }
);

export const updateProjectAsync = createAsyncThunk(
  'projects/updateProject',
  async (params: { id: string; projectData: UpdateProjectData }, { rejectWithValue }) => {
    try {
      const { id, projectData } = params;
      const project = projectService.updateProject(id, projectData);
      if (!project) {
        return rejectWithValue('Project not found.');
      }
      return project;
    } catch (error) {
      return rejectWithValue('Failed to update project.');
    }
  }
);

export const deleteProjectAsync = createAsyncThunk(
  'projects/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = projectService.deleteProject(id);
      if (!success) {
        return rejectWithValue('Project not found.');
      }
      return id;
    } catch (error) {
      return rejectWithValue('Failed to delete project.');
    }
  }
);

// Slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProjectInList: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    removeProjectFromList: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
    },
    setStatusFilter: (state, action: PayloadAction<Project['status'] | 'all'>) => {
      state.filter.status = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload;
    },
    setTagsFilter: (state, action: PayloadAction<string[]>) => {
      state.filter.tags = action.payload;
    },
    clearFilters: (state) => {
      state.filter = {
        status: 'all',
        search: '',
        tags: [],
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch projects
    builder
      .addCase(fetchProjectsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
        state.error = null;
      })
      .addCase(fetchProjectsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create project
    builder
      .addCase(createProjectAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProjectAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload);
        state.error = null;
      })
      .addCase(createProjectAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update project
    builder
      .addCase(updateProjectAsync.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProjectAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete project
    builder
      .addCase(deleteProjectAsync.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProjectAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentProject,
  clearError,
  updateProjectInList,
  removeProjectFromList,
  setStatusFilter,
  setSearchFilter,
  setTagsFilter,
  clearFilters,
} = projectsSlice.actions;

export default projectsSlice.reducer;