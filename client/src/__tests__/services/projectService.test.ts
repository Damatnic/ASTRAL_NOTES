// Project Service Tests
// Comprehensive testing for project management functionality

import { vi } from 'vitest';
import { ProjectService } from '../../services/projectService';
import { resetAllMocks, createMockProject, createMockStory, createMockCharacter } from '../testSetup';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock UUID generation
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-1234'),
}));

describe('ProjectService', () => {
  let projectService: ProjectService;

  beforeEach(() => {
    resetAllMocks();
    projectService = ProjectService.getInstance();
    
    // Reset service state
    (projectService as any).projects = new Map();
    (projectService as any).currentProject = null;
  });

  describe('Project Management', () => {
    it('creates a new project', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'Test Description',
        userId: 'user-1',
      };

      const project = await projectService.createProject(projectData);

      expect(project).toMatchObject({
        id: expect.any(String),
        title: 'Test Project',
        description: 'Test Description',
        userId: 'user-1',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'astral-projects',
        expect.stringContaining(project.id)
      );
    });

    it('retrieves all projects', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const projects = await projectService.getProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject(mockProject);
    });

    it('retrieves a project by ID', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const project = await projectService.getProject(mockProject.id);

      expect(project).toMatchObject(mockProject);
    });

    it('returns null for non-existent project', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const project = await projectService.getProject('non-existent-id');

      expect(project).toBeNull();
    });

    it('updates a project', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedProject = await projectService.updateProject(mockProject.id, updates);

      expect(updatedProject).toMatchObject({
        ...mockProject,
        ...updates,
        updatedAt: expect.any(String),
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('deletes a project', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const result = await projectService.deleteProject(mockProject.id);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'astral-projects',
        JSON.stringify([])
      );
    });

    it('handles project not found during deletion', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const result = await projectService.deleteProject('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('Story Management', () => {
    it('creates a new story', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const storyData = {
        title: 'Test Story',
        description: 'Test Story Description',
        projectId: mockProject.id,
      };

      const story = await projectService.createStory(storyData);

      expect(story).toMatchObject({
        id: expect.any(String),
        title: 'Test Story',
        description: 'Test Story Description',
        projectId: mockProject.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('retrieves stories for a project', async () => {
      const mockProject = createMockProject();
      const mockStory = createMockStory();
      mockProject.stories = [mockStory];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const stories = await projectService.getStories(mockProject.id);

      expect(stories).toHaveLength(1);
      expect(stories[0]).toMatchObject(mockStory);
    });

    it('updates a story', async () => {
      const mockProject = createMockProject();
      const mockStory = createMockStory();
      mockProject.stories = [mockStory];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const updates = {
        title: 'Updated Story Title',
        description: 'Updated Story Description',
      };

      const updatedStory = await projectService.updateStory(mockStory.id, updates);

      expect(updatedStory).toMatchObject({
        ...mockStory,
        ...updates,
        updatedAt: expect.any(String),
      });
    });

    it('deletes a story', async () => {
      const mockProject = createMockProject();
      const mockStory = createMockStory();
      mockProject.stories = [mockStory];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const result = await projectService.deleteStory(mockStory.id);

      expect(result).toBe(true);
    });
  });

  describe('Character Management', () => {
    it('creates a new character', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const characterData = {
        name: 'Test Character',
        description: 'Test Character Description',
        projectId: mockProject.id,
      };

      const character = await projectService.createCharacter(characterData);

      expect(character).toMatchObject({
        id: expect.any(String),
        name: 'Test Character',
        description: 'Test Character Description',
        projectId: mockProject.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('retrieves characters for a project', async () => {
      const mockProject = createMockProject();
      const mockCharacter = createMockCharacter();
      mockProject.characters = [mockCharacter];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const characters = await projectService.getCharacters(mockProject.id);

      expect(characters).toHaveLength(1);
      expect(characters[0]).toMatchObject(mockCharacter);
    });

    it('updates a character', async () => {
      const mockProject = createMockProject();
      const mockCharacter = createMockCharacter();
      mockProject.characters = [mockCharacter];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const updates = {
        name: 'Updated Character Name',
        description: 'Updated Character Description',
      };

      const updatedCharacter = await projectService.updateCharacter(mockCharacter.id, updates);

      expect(updatedCharacter).toMatchObject({
        ...mockCharacter,
        ...updates,
        updatedAt: expect.any(String),
      });
    });

    it('deletes a character', async () => {
      const mockProject = createMockProject();
      const mockCharacter = createMockCharacter();
      mockProject.characters = [mockCharacter];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const result = await projectService.deleteCharacter(mockCharacter.id);

      expect(result).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    it('searches across projects', async () => {
      const mockProject1 = createMockProject();
      mockProject1.title = 'Fantasy Adventure';
      
      const mockProject2 = createMockProject();
      mockProject2.id = 'project-2';
      mockProject2.title = 'Sci-Fi Thriller';
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject1, mockProject2]));

      const results = await projectService.search('fantasy');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        type: 'project',
        item: mockProject1,
        score: expect.any(Number),
      });
    });

    it('searches with filters', async () => {
      const mockProject = createMockProject();
      const mockCharacter = createMockCharacter();
      mockCharacter.name = 'Fantasy Hero';
      mockProject.characters = [mockCharacter];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const results = await projectService.search('fantasy', {
        types: ['character'],
        projectId: mockProject.id,
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('character');
      expect(results[0].item).toMatchObject(mockCharacter);
    });

    it('returns empty results for no matches', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const results = await projectService.search('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('calculates project statistics', async () => {
      const mockProject = createMockProject();
      const mockStory = createMockStory();
      mockStory.wordCount = 1500;
      const mockCharacter = createMockCharacter();
      
      mockProject.stories = [mockStory];
      mockProject.characters = [mockCharacter];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const stats = await projectService.getProjectStatistics(mockProject.id);

      expect(stats).toMatchObject({
        totalWords: 1500,
        storiesCount: 1,
        charactersCount: 1,
        locationsCount: 0,
        plotThreadsCount: 0,
        scenesCount: 0,
        lastUpdated: expect.any(String),
      });
    });

    it('calculates writing progress', async () => {
      const mockProject = createMockProject();
      mockProject.settings.wordTarget = 50000;
      
      const mockStory = createMockStory();
      mockStory.wordCount = 25000;
      mockProject.stories = [mockStory];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const progress = await projectService.getWritingProgress(mockProject.id);

      expect(progress).toMatchObject({
        currentWords: 25000,
        targetWords: 50000,
        percentage: 50,
        wordsRemaining: 25000,
        isOnTrack: expect.any(Boolean),
      });
    });
  });

  describe('Backup and Export', () => {
    it('creates a project backup', async () => {
      const mockProject = createMockProject();
      const mockStory = createMockStory();
      const mockCharacter = createMockCharacter();
      
      mockProject.stories = [mockStory];
      mockProject.characters = [mockCharacter];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const backup = await projectService.createBackup(mockProject.id);

      expect(backup).toMatchObject({
        version: '1.0.0',
        timestamp: expect.any(String),
        project: mockProject,
        stories: [mockStory],
        characters: [mockCharacter],
        locations: [],
        plotThreads: [],
      });
    });

    it('restores from backup', async () => {
      const mockProject = createMockProject();
      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        project: mockProject,
        stories: [],
        characters: [],
        locations: [],
        plotThreads: [],
      };

      const restoredProject = await projectService.restoreFromBackup(backup);

      expect(restoredProject).toMatchObject(mockProject);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('exports project data', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const exportData = await projectService.exportProject(mockProject.id, 'json');

      expect(exportData).toMatchObject({
        format: 'json',
        data: expect.any(String),
        filename: expect.stringContaining('.json'),
      });
    });
  });

  describe('Collaboration', () => {
    it('shares a project', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const shareData = await projectService.shareProject(mockProject.id, {
        permissions: 'read',
        expiresIn: '7d',
      });

      expect(shareData).toMatchObject({
        shareId: expect.any(String),
        url: expect.any(String),
        permissions: 'read',
        expiresAt: expect.any(String),
      });
    });

    it('revokes project sharing', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const result = await projectService.revokeShare('share-id-123');

      expect(result).toBe(true);
    });
  });

  describe('Templates', () => {
    it('creates project from template', async () => {
      const template = {
        id: 'template-1',
        name: 'Novel Template',
        description: 'Template for novel writing',
        structure: {
          stories: [{ title: 'Main Story', description: 'Main storyline' }],
          characters: [{ name: 'Protagonist', role: 'main' }],
        },
      };

      const project = await projectService.createFromTemplate(template, {
        title: 'My Novel',
        userId: 'user-1',
      });

      expect(project).toMatchObject({
        title: 'My Novel',
        userId: 'user-1',
        stories: expect.arrayContaining([
          expect.objectContaining({ title: 'Main Story' }),
        ]),
        characters: expect.arrayContaining([
          expect.objectContaining({ name: 'Protagonist' }),
        ]),
      });
    });

    it('saves project as template', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const template = await projectService.saveAsTemplate(mockProject.id, {
        name: 'My Template',
        description: 'Custom template',
      });

      expect(template).toMatchObject({
        id: expect.any(String),
        name: 'My Template',
        description: 'Custom template',
        structure: expect.any(Object),
      });
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const projects = await projectService.getProjects();

      expect(projects).toEqual([]);
    });

    it('handles invalid JSON in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const projects = await projectService.getProjects();

      expect(projects).toEqual([]);
    });

    it('handles missing project during update', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      await expect(
        projectService.updateProject('non-existent', { title: 'New Title' })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('Event System', () => {
    it('emits events on project creation', async () => {
      const onProjectCreated = vi.fn();
      projectService.on('project-created', onProjectCreated);

      const project = await projectService.createProject({
        title: 'Test Project',
        userId: 'user-1',
      });

      expect(onProjectCreated).toHaveBeenCalledWith(project);
    });

    it('emits events on project update', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const onProjectUpdated = vi.fn();
      projectService.on('project-updated', onProjectUpdated);

      const updatedProject = await projectService.updateProject(mockProject.id, {
        title: 'Updated Title',
      });

      expect(onProjectUpdated).toHaveBeenCalledWith(updatedProject);
    });

    it('emits events on project deletion', async () => {
      const mockProject = createMockProject();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockProject]));

      const onProjectDeleted = vi.fn();
      projectService.on('project-deleted', onProjectDeleted);

      await projectService.deleteProject(mockProject.id);

      expect(onProjectDeleted).toHaveBeenCalledWith(mockProject.id);
    });
  });
});