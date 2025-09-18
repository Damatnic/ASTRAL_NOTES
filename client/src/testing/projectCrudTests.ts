/**
 * Project Management CRUD Operations Test Suite
 * Comprehensive testing for all Create, Read, Update, Delete operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { projectService, type CreateProjectData, type UpdateProjectData } from '@/services/projectService';
import { storageService } from '@/services/storageService';
import { projectTestDataGenerator } from './projectManagementTestDataGenerator';
import type { Project } from '@/types/global';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock console to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

export class ProjectCrudTestSuite {
  private testData: ReturnType<typeof projectTestDataGenerator.generateCompleteTestData>;

  constructor() {
    this.testData = projectTestDataGenerator.generateCompleteTestData();
  }

  /**
   * Run all CRUD tests
   */
  public runAllTests(): void {
    describe('Project CRUD Operations', () => {
      beforeEach(() => {
        this.setupTest();
      });

      afterEach(() => {
        this.cleanupTest();
      });

      this.testProjectCreation();
      this.testProjectReading();
      this.testProjectUpdating();
      this.testProjectDeletion();
      this.testProjectDuplication();
      this.testProjectArchival();
      this.testProjectRestoration();
      this.testProjectValidation();
      this.testProjectErrorHandling();
      this.testProjectEdgeCases();
    });
  }

  /**
   * Test project creation operations
   */
  private testProjectCreation(): void {
    describe('Project Creation', () => {
      it('should create a basic project with minimal data', () => {
        const projectData: CreateProjectData = {
          title: 'Test Project',
          description: 'A test project',
          tags: ['test']
        };

        const project = projectService.createProject(projectData);

        expect(project).toBeDefined();
        expect(project.id).toBeTruthy();
        expect(project.title).toBe('Test Project');
        expect(project.description).toBe('A test project');
        expect(project.tags).toEqual(['test']);
        expect(project.status).toBe('planning');
        expect(project.wordCount).toBe(0);
        expect(project.createdAt).toBeTruthy();
        expect(project.updatedAt).toBeTruthy();
        expect(project.userId).toBe('local-user');
      });

      it('should create project with all optional fields', () => {
        const projectData: CreateProjectData = {
          title: 'Complete Project',
          description: 'A project with all fields',
          tags: ['fantasy', 'novel'],
          genre: 'Fantasy'
        };

        const project = projectService.createProject(projectData);

        expect(project.title).toBe('Complete Project');
        expect(project.genre).toBe('Fantasy');
        expect(project.tags).toEqual(['fantasy', 'novel']);
        expect(project.plotboard).toBeDefined();
        expect(project.settings).toBeDefined();
        expect(project.collaborators).toEqual([]);
      });

      it('should handle empty title gracefully', () => {
        const projectData: CreateProjectData = {
          title: '',
          description: 'Project with empty title'
        };

        const project = projectService.createProject(projectData);

        expect(project.title).toBe('Untitled Project');
      });

      it('should trim whitespace from title and description', () => {
        const projectData: CreateProjectData = {
          title: '   Whitespace Project   ',
          description: '   Description with spaces   '
        };

        const project = projectService.createProject(projectData);

        expect(project.title).toBe('Whitespace Project');
        expect(project.description).toBe('Description with spaces');
      });

      it('should generate unique IDs for multiple projects', () => {
        const projects = [];
        
        for (let i = 0; i < 5; i++) {
          const project = projectService.createProject({
            title: `Project ${i}`,
            description: `Description ${i}`
          });
          projects.push(project);
        }

        const ids = projects.map(p => p.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(5);
      });

      it('should save project to storage on creation', () => {
        const projectData: CreateProjectData = {
          title: 'Storage Test Project'
        };

        projectService.createProject(projectData);

        expect(mockLocalStorage.setItem).toHaveBeenCalled();
        const saveCall = vi.mocked(mockLocalStorage.setItem).mock.calls.find(
          call => call[0] === 'astral_projects'
        );
        expect(saveCall).toBeDefined();
      });
    });
  }

  /**
   * Test project reading operations
   */
  private testProjectReading(): void {
    describe('Project Reading', () => {
      beforeEach(() => {
        // Setup test projects
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(this.testData.projects);
          }
          return null;
        });
      });

      it('should retrieve all projects', () => {
        const projects = projectService.getAllProjects();

        expect(projects).toBeDefined();
        expect(Array.isArray(projects)).toBe(true);
        expect(projects.length).toBe(this.testData.projects.length);
      });

      it('should retrieve project by ID', () => {
        const testProject = this.testData.projects[0];
        const project = projectService.getProjectById(testProject.id);

        expect(project).toBeDefined();
        expect(project?.id).toBe(testProject.id);
        expect(project?.title).toBe(testProject.title);
      });

      it('should return null for non-existent project ID', () => {
        const project = projectService.getProjectById('non-existent-id');
        expect(project).toBeNull();
      });

      it('should get active projects only', () => {
        const activeProjects = projectService.getActiveProjects();
        
        expect(activeProjects).toBeDefined();
        expect(Array.isArray(activeProjects)).toBe(true);
        activeProjects.forEach(project => {
          expect(project.status).toBe('writing');
        });
      });

      it('should get archived projects only', () => {
        const archivedProjects = projectService.getArchivedProjects();
        
        expect(archivedProjects).toBeDefined();
        expect(Array.isArray(archivedProjects)).toBe(true);
        archivedProjects.forEach(project => {
          expect(project.status).toBe('archived');
        });
      });

      it('should get projects by status', () => {
        const planningProjects = projectService.getProjectsByStatus('planning');
        
        expect(planningProjects).toBeDefined();
        planningProjects.forEach(project => {
          expect(project.status).toBe('planning');
        });
      });

      it('should get projects by tags', () => {
        const testTags = ['fantasy'];
        const taggedProjects = projectService.getProjectsByTags(testTags);
        
        expect(taggedProjects).toBeDefined();
        taggedProjects.forEach(project => {
          expect(project.tags.some(tag => testTags.includes(tag))).toBe(true);
        });
      });

      it('should get recent projects', () => {
        const recentProjects = projectService.getRecentProjects(3);
        
        expect(recentProjects).toBeDefined();
        expect(recentProjects.length).toBeLessThanOrEqual(3);
        
        // Should be sorted by lastEditedAt descending
        for (let i = 1; i < recentProjects.length; i++) {
          const prevDate = new Date(recentProjects[i - 1].lastEditedAt);
          const currDate = new Date(recentProjects[i].lastEditedAt);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      });

      it('should handle empty storage gracefully', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const projects = projectService.getAllProjects();
        expect(projects).toEqual([]);
      });

      it('should handle corrupted storage data', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid json');
        
        // Should not throw error
        expect(() => {
          const projects = projectService.getAllProjects();
          expect(projects).toEqual([]);
        }).not.toThrow();
      });
    });
  }

  /**
   * Test project updating operations
   */
  private testProjectUpdating(): void {
    describe('Project Updating', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });
      });

      it('should update project title', () => {
        const updateData: UpdateProjectData = {
          title: 'Updated Title'
        };

        const updated = projectService.updateProject(testProject.id, updateData);

        expect(updated).toBeDefined();
        expect(updated?.title).toBe('Updated Title');
        expect(updated?.updatedAt).not.toBe(testProject.updatedAt);
      });

      it('should update project description', () => {
        const updateData: UpdateProjectData = {
          description: 'Updated description'
        };

        const updated = projectService.updateProject(testProject.id, updateData);

        expect(updated).toBeDefined();
        expect(updated?.description).toBe('Updated description');
      });

      it('should update project status', () => {
        const updateData: UpdateProjectData = {
          status: 'writing'
        };

        const updated = projectService.updateProject(testProject.id, updateData);

        expect(updated).toBeDefined();
        expect(updated?.status).toBe('writing');
      });

      it('should update project tags', () => {
        const updateData: UpdateProjectData = {
          tags: ['updated', 'tags']
        };

        const updated = projectService.updateProject(testProject.id, updateData);

        expect(updated).toBeDefined();
        expect(updated?.tags).toEqual(['updated', 'tags']);
      });

      it('should update multiple fields at once', () => {
        const updateData: UpdateProjectData = {
          title: 'Multi-Update Title',
          description: 'Multi-update description',
          status: 'research',
          tags: ['multi', 'update']
        };

        const updated = projectService.updateProject(testProject.id, updateData);

        expect(updated).toBeDefined();
        expect(updated?.title).toBe('Multi-Update Title');
        expect(updated?.description).toBe('Multi-update description');
        expect(updated?.status).toBe('research');
        expect(updated?.tags).toEqual(['multi', 'update']);
      });

      it('should return null for non-existent project', () => {
        const updated = projectService.updateProject('non-existent', {
          title: 'Should not work'
        });

        expect(updated).toBeNull();
      });

      it('should preserve unchanged fields', () => {
        const originalCreatedAt = testProject.createdAt;
        const originalUserId = testProject.userId;

        const updated = projectService.updateProject(testProject.id, {
          title: 'New Title'
        });

        expect(updated).toBeDefined();
        expect(updated?.createdAt).toBe(originalCreatedAt);
        expect(updated?.userId).toBe(originalUserId);
        expect(updated?.description).toBe(testProject.description);
      });

      it('should recalculate word count when content changes', () => {
        // Mock project notes with content
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([
          {
            id: 'note-1',
            projectId: testProject.id,
            title: 'Test Note',
            content: 'This is a test note with words',
            wordCount: 7,
            type: 'note',
            tags: [],
            position: 1,
            readTime: 1,
            status: 'draft',
            priority: 'medium',
            wikiLinks: [],
            backlinks: [],
            linkedElements: [],
            comments: [],
            version: 1,
            versionHistory: [],
            aiSuggestions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);

        const updated = projectService.updateProject(testProject.id, {
          title: 'Updated with word count'
        });

        expect(updated).toBeDefined();
        expect(updated?.wordCount).toBeGreaterThan(0);
      });

      it('should save updated project to storage', () => {
        projectService.updateProject(testProject.id, {
          title: 'Storage Update Test'
        });

        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  }

  /**
   * Test project deletion operations
   */
  private testProjectDeletion(): void {
    describe('Project Deletion', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });
      });

      it('should soft delete project (change status)', () => {
        const success = projectService.deleteProject(testProject.id);

        expect(success).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      it('should return false for non-existent project', () => {
        const success = projectService.deleteProject('non-existent');
        expect(success).toBe(false);
      });

      it('should permanently delete project and its notes', () => {
        // Mock storage data
        const mockData = {
          projects: [testProject],
          notes: {
            [testProject.id]: [
              { id: 'note-1', projectId: testProject.id, title: 'Note 1' },
              { id: 'note-2', projectId: testProject.id, title: 'Note 2' }
            ]
          }
        };

        vi.spyOn(storageService, 'getData').mockReturnValue(mockData);
        vi.spyOn(storageService, 'saveData').mockReturnValue(true);

        const success = projectService.permanentlyDeleteProject(testProject.id);

        expect(success).toBe(true);
        expect(storageService.saveData).toHaveBeenCalledWith({
          projects: [],
          notes: {}
        });
      });

      it('should handle permanent deletion of non-existent project', () => {
        vi.spyOn(storageService, 'getData').mockReturnValue({
          projects: [],
          notes: {}
        });

        const success = projectService.permanentlyDeleteProject('non-existent');
        expect(success).toBe(false);
      });
    });
  }

  /**
   * Test project duplication
   */
  private testProjectDuplication(): void {
    describe('Project Duplication', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });

        // Mock project notes
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([
          {
            id: 'note-1',
            projectId: testProject.id,
            title: 'Original Note',
            content: 'Original content',
            wordCount: 2,
            type: 'note',
            tags: [],
            position: 1,
            readTime: 1,
            status: 'draft',
            priority: 'medium',
            wikiLinks: [],
            backlinks: [],
            linkedElements: [],
            comments: [],
            version: 1,
            versionHistory: [],
            aiSuggestions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);

        vi.spyOn(storageService, 'saveProjectNotes').mockImplementation(() => {});
      });

      it('should duplicate project with copy suffix', () => {
        const duplicated = projectService.duplicateProject(testProject.id);

        expect(duplicated).toBeDefined();
        expect(duplicated?.id).not.toBe(testProject.id);
        expect(duplicated?.title).toBe(`${testProject.title} (Copy)`);
        expect(duplicated?.description).toBe(testProject.description);
        expect(duplicated?.tags).toEqual(testProject.tags);
      });

      it('should duplicate project notes', () => {
        const duplicated = projectService.duplicateProject(testProject.id);

        expect(duplicated).toBeDefined();
        expect(storageService.saveProjectNotes).toHaveBeenCalledWith(
          duplicated?.id,
          expect.arrayContaining([
            expect.objectContaining({
              title: 'Original Note',
              content: 'Original content',
              projectId: duplicated?.id
            })
          ])
        );
      });

      it('should return null for non-existent project', () => {
        const duplicated = projectService.duplicateProject('non-existent');
        expect(duplicated).toBeNull();
      });

      it('should update word count for duplicated project', () => {
        const duplicated = projectService.duplicateProject(testProject.id);

        expect(duplicated).toBeDefined();
        expect(duplicated?.wordCount).toBeGreaterThan(0);
      });
    });
  }

  /**
   * Test project archival and restoration
   */
  private testProjectArchival(): void {
    describe('Project Archival', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });
      });

      it('should archive project', () => {
        const archived = projectService.archiveProject(testProject.id);

        expect(archived).toBeDefined();
        expect(archived?.status).toBe('archived');
      });

      it('should restore archived project', () => {
        // First archive the project
        projectService.archiveProject(testProject.id);
        
        // Then restore it
        const restored = projectService.restoreProject(testProject.id);

        expect(restored).toBeDefined();
        expect(restored?.status).toBe('writing');
      });

      it('should handle archival of non-existent project', () => {
        const archived = projectService.archiveProject('non-existent');
        expect(archived).toBeNull();
      });

      it('should handle restoration of non-existent project', () => {
        const restored = projectService.restoreProject('non-existent');
        expect(restored).toBeNull();
      });
    });
  }

  /**
   * Test project validation
   */
  private testProjectValidation(): void {
    describe('Project Validation', () => {
      it('should handle project with special characters', () => {
        const projectData: CreateProjectData = {
          title: 'Prójéct wîth Spëcïål Çhárâctërs',
          description: 'Dëscríptíõn wîth ùnïcödë çhäracters'
        };

        const project = projectService.createProject(projectData);

        expect(project).toBeDefined();
        expect(project.title).toBe('Prójéct wîth Spëcïål Çhárâctërs');
        expect(project.description).toBe('Dëscríptíõn wîth ùnïcödë çhäracters');
      });

      it('should handle very long titles', () => {
        const longTitle = 'A'.repeat(1000);
        const projectData: CreateProjectData = {
          title: longTitle
        };

        const project = projectService.createProject(projectData);

        expect(project).toBeDefined();
        expect(project.title).toBe(longTitle);
      });

      it('should handle empty arrays and undefined values', () => {
        const projectData: CreateProjectData = {
          title: 'Test Project',
          tags: [],
          description: undefined
        };

        const project = projectService.createProject(projectData);

        expect(project).toBeDefined();
        expect(project.tags).toEqual([]);
        expect(project.description).toBe('');
      });

      it('should validate required fields on creation', () => {
        // Test with completely empty object
        expect(() => {
          projectService.createProject({} as CreateProjectData);
        }).not.toThrow();
      });
    });
  }

  /**
   * Test error handling
   */
  private testProjectErrorHandling(): void {
    describe('Project Error Handling', () => {
      beforeEach(() => {
        // Suppress console errors for these tests
        console.error = vi.fn();
        console.warn = vi.fn();
      });

      afterEach(() => {
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      });

      it('should handle localStorage errors gracefully', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => {
          const projects = projectService.getAllProjects();
          expect(projects).toEqual([]);
        }).not.toThrow();
      });

      it('should handle localStorage save errors', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage full');
        });

        expect(() => {
          projectService.createProject({ title: 'Test' });
        }).not.toThrow();
      });

      it('should handle malformed JSON in storage', () => {
        mockLocalStorage.getItem.mockReturnValue('{"invalid": json');

        expect(() => {
          const projects = projectService.getAllProjects();
          expect(projects).toEqual([]);
        }).not.toThrow();
      });

      it('should handle null storage values', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        expect(() => {
          const projects = projectService.getAllProjects();
          expect(projects).toEqual([]);
        }).not.toThrow();
      });

      it('should handle invalid project data structures', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
          { id: 'valid-1', title: 'Valid Project' },
          { id: null, title: '' }, // Invalid project
          'invalid-string', // Not an object
          null // Null project
        ]));

        expect(() => {
          const projects = projectService.getAllProjects();
          expect(Array.isArray(projects)).toBe(true);
        }).not.toThrow();
      });
    });
  }

  /**
   * Test edge cases
   */
  private testProjectEdgeCases(): void {
    describe('Project Edge Cases', () => {
      it('should handle concurrent operations', () => {
        const projectData: CreateProjectData = {
          title: 'Concurrent Test'
        };

        // Simulate multiple rapid operations
        const project1 = projectService.createProject(projectData);
        const project2 = projectService.createProject(projectData);
        const updated = projectService.updateProject(project1.id, { title: 'Updated' });

        expect(project1.id).not.toBe(project2.id);
        expect(updated?.title).toBe('Updated');
      });

      it('should handle maximum storage capacity', () => {
        // Create many projects to test storage limits
        const projects = [];
        for (let i = 0; i < 1000; i++) {
          const project = projectService.createProject({
            title: `Bulk Project ${i}`,
            description: `Description ${i}`.repeat(100) // Make it larger
          });
          projects.push(project);
        }

        expect(projects.length).toBe(1000);
        expect(projects.every(p => p.id)).toBe(true);
      });

      it('should handle unicode and emoji in project data', () => {
        const projectData: CreateProjectData = {
          title: '📚 My Novel 📖 with 中文 and العربية',
          description: '🚀 A story about 👨‍🚀 astronauts and 🛸 aliens',
          tags: ['🌟', 'sci-fi', '中文', 'العربية']
        };

        const project = projectService.createProject(projectData);

        expect(project.title).toBe('📚 My Novel 📖 with 中文 and العربية');
        expect(project.description).toBe('🚀 A story about 👨‍🚀 astronauts and 🛸 aliens');
        expect(project.tags).toEqual(['🌟', 'sci-fi', '中文', 'العربية']);
      });

      it('should handle date edge cases', () => {
        const project = projectService.createProject({ title: 'Date Test' });

        expect(new Date(project.createdAt).getTime()).toBeCloseTo(Date.now(), -3);
        expect(new Date(project.updatedAt).getTime()).toBeCloseTo(Date.now(), -3);
        expect(new Date(project.lastEditedAt).getTime()).toBeCloseTo(Date.now(), -3);
      });

      it('should handle rapid successive updates', () => {
        const project = projectService.createProject({ title: 'Rapid Update Test' });
        
        // Perform rapid updates
        for (let i = 0; i < 10; i++) {
          projectService.updateProject(project.id, { title: `Update ${i}` });
        }

        const final = projectService.getProjectById(project.id);
        expect(final?.title).toBe('Update 9');
      });
    });
  }

  /**
   * Setup test environment
   */
  private setupTest(): void {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.clear.mockImplementation(() => {});
  }

  /**
   * Cleanup test environment
   */
  private cleanupTest(): void {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  }
}

// Export function to run tests
export const runProjectCrudTests = () => {
  const testSuite = new ProjectCrudTestSuite();
  testSuite.runAllTests();
};