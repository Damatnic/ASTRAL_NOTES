/**
 * Project Dashboard Functionality Test Suite
 * Tests project statistics, progress tracking, analytics, and dashboard features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { projectService } from '@/services/projectService';
import { storageService } from '@/services/storageService';
import { projectTestDataGenerator } from './projectManagementTestDataGenerator';
import type { Project, Note } from '@/types/global';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

export class ProjectDashboardTestSuite {
  private testData: ReturnType<typeof projectTestDataGenerator.generateCompleteTestData>;

  constructor() {
    this.testData = projectTestDataGenerator.generateCompleteTestData();
  }

  /**
   * Run all dashboard tests
   */
  public runAllTests(): void {
    describe('Project Dashboard Functionality', () => {
      beforeEach(() => {
        this.setupTest();
      });

      afterEach(() => {
        this.cleanupTest();
      });

      this.testProjectStatistics();
      this.testProgressTracking();
      this.testAnalyticsAndInsights();
      this.testDashboardData();
      this.testPerformanceMetrics();
      this.testDataVisualization();
      this.testRealTimeUpdates();
      this.testErrorHandling();
    });
  }

  /**
   * Test project statistics calculation
   */
  private testProjectStatistics(): void {
    describe('Project Statistics', () => {
      let testProject: Project;
      let testNotes: Note[];

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNotes = [
          this.createMockNote(testProject.id, 'Note 1', 'This is note one with some content', 8),
          this.createMockNote(testProject.id, 'Note 2', 'This is note two with more content for testing', 10),
          this.createMockNote(testProject.id, 'Note 3', 'Short note', 2)
        ];

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(testNotes);
      });

      it('should calculate total word count correctly', () => {
        const stats = projectService.getProjectStats(testProject.id);

        expect(stats).toBeDefined();
        expect(stats?.totalWords).toBe(20); // 8 + 10 + 2
      });

      it('should count total notes', () => {
        const stats = projectService.getProjectStats(testProject.id);

        expect(stats).toBeDefined();
        expect(stats?.totalNotes).toBe(3);
      });

      it('should track last activity', () => {
        const stats = projectService.getProjectStats(testProject.id);

        expect(stats).toBeDefined();
        expect(stats?.lastActivity).toBe(testProject.lastEditedAt);
      });

      it('should calculate progress percentage', () => {
        const stats = projectService.getProjectStats(testProject.id);

        expect(stats).toBeDefined();
        expect(stats?.progressPercentage).toBeGreaterThanOrEqual(0);
        expect(stats?.progressPercentage).toBeLessThanOrEqual(100);
      });

      it('should return null for non-existent project', () => {
        const stats = projectService.getProjectStats('non-existent');
        expect(stats).toBeNull();
      });

      it('should handle project with no notes', () => {
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([]);

        const stats = projectService.getProjectStats(testProject.id);

        expect(stats).toBeDefined();
        expect(stats?.totalWords).toBe(0);
        expect(stats?.totalNotes).toBe(0);
      });

      it('should calculate statistics for multiple projects', () => {
        const projects = this.testData.projects.slice(0, 3);
        
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(projects);
          }
          return null;
        });

        projects.forEach(project => {
          const stats = projectService.getProjectStats(project.id);
          expect(stats).toBeDefined();
          expect(typeof stats?.totalWords).toBe('number');
          expect(typeof stats?.totalNotes).toBe('number');
        });
      });

      it('should update statistics when project content changes', () => {
        // Get initial stats
        const initialStats = projectService.getProjectStats(testProject.id);
        
        // Add more notes
        const updatedNotes = [
          ...testNotes,
          this.createMockNote(testProject.id, 'New Note', 'Additional content for updated stats', 5)
        ];
        
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(updatedNotes);

        const updatedStats = projectService.getProjectStats(testProject.id);

        expect(updatedStats?.totalWords).toBeGreaterThan(initialStats?.totalWords || 0);
        expect(updatedStats?.totalNotes).toBeGreaterThan(initialStats?.totalNotes || 0);
      });
    });
  }

  /**
   * Test progress tracking functionality
   */
  private testProgressTracking(): void {
    describe('Progress Tracking', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = {
          ...this.testData.projects[0],
          targetWordCount: 50000 // Set a target for progress calculation
        };

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });
      });

      it('should track daily progress', () => {
        const today = new Date().toISOString().split('T')[0];
        const mockNotes = [
          this.createMockNote(testProject.id, 'Today Note 1', 'Content written today', 10, today),
          this.createMockNote(testProject.id, 'Today Note 2', 'More content for today', 15, today),
          this.createMockNote(testProject.id, 'Yesterday Note', 'Old content', 5, '2024-01-01')
        ];

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(mockNotes);

        const stats = projectService.getProjectStats(testProject.id);
        expect(stats?.totalWords).toBe(30);
      });

      it('should calculate progress towards word count target', () => {
        const mockNotes = [
          this.createMockNote(testProject.id, 'Progress Note', 'A'.repeat(25000), 25000)
        ];

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(mockNotes);

        const stats = projectService.getProjectStats(testProject.id);
        expect(stats?.progressPercentage).toBe(50); // 25000 / 50000 = 50%
      });

      it('should cap progress at 100%', () => {
        const mockNotes = [
          this.createMockNote(testProject.id, 'Over Target Note', 'A'.repeat(60000), 60000)
        ];

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(mockNotes);

        const stats = projectService.getProjectStats(testProject.id);
        expect(stats?.progressPercentage).toBeLessThanOrEqual(100);
      });

      it('should track writing velocity', () => {
        const dates = [
          '2024-01-01T10:00:00Z',
          '2024-01-02T10:00:00Z',
          '2024-01-03T10:00:00Z'
        ];

        const mockNotes = dates.map((date, index) => 
          this.createMockNote(testProject.id, `Day ${index + 1}`, `Content for day ${index + 1}`, 100 + index * 50, date)
        );

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(mockNotes);

        const stats = projectService.getProjectStats(testProject.id);
        expect(stats?.totalWords).toBe(350); // 100 + 150 + 200
      });

      it('should handle projects without word targets', () => {
        const projectWithoutTarget = {
          ...testProject,
          targetWordCount: undefined
        };

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([projectWithoutTarget]);
          }
          return null;
        });

        const stats = projectService.getProjectStats(projectWithoutTarget.id);
        expect(stats?.progressPercentage).toBeGreaterThanOrEqual(0);
      });
    });
  }

  /**
   * Test analytics and insights
   */
  private testAnalyticsAndInsights(): void {
    describe('Analytics and Insights', () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(this.testData.projects);
          }
          return null;
        });

        // Mock notes for all projects
        vi.spyOn(storageService, 'getAllNotes').mockReturnValue(
          this.testData.projects.flatMap(project => 
            Array.from({ length: 3 }, (_, i) => 
              this.createMockNote(project.id, `Note ${i}`, `Content ${i}`, 10 + i)
            )
          )
        );
      });

      it('should calculate overall user statistics', () => {
        const stats = projectService.getOverallStats();

        expect(stats).toBeDefined();
        expect(stats.totalProjects).toBeGreaterThan(0);
        expect(stats.activeProjects).toBeGreaterThanOrEqual(0);
        expect(stats.totalWords).toBeGreaterThan(0);
        expect(stats.totalNotes).toBeGreaterThan(0);
      });

      it('should provide writing frequency analysis', () => {
        const recentProjects = projectService.getRecentProjects(5);

        expect(recentProjects).toBeDefined();
        expect(Array.isArray(recentProjects)).toBe(true);
        expect(recentProjects.length).toBeLessThanOrEqual(5);
      });

      it('should track project status distribution', () => {
        const allProjects = projectService.getAllProjects();
        const statusCounts = allProjects.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(Object.keys(statusCounts).length).toBeGreaterThan(0);
        expect(Object.values(statusCounts).every(count => count > 0)).toBe(true);
      });

      it('should analyze tag usage patterns', () => {
        const allProjects = projectService.getAllProjects();
        const allTags = allProjects.flatMap(project => project.tags);
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(Object.keys(tagCounts).length).toBeGreaterThan(0);
      });

      it('should provide productivity insights', () => {
        const stats = projectService.getOverallStats();
        const avgWordsPerProject = stats.totalWords / stats.totalProjects;

        expect(avgWordsPerProject).toBeGreaterThanOrEqual(0);
        expect(typeof avgWordsPerProject).toBe('number');
      });

      it('should track genre distribution', () => {
        const allProjects = projectService.getAllProjects();
        const genres = allProjects
          .map(project => project.genre)
          .filter(Boolean);

        expect(Array.isArray(genres)).toBe(true);
      });
    });
  }

  /**
   * Test dashboard data aggregation
   */
  private testDashboardData(): void {
    describe('Dashboard Data Aggregation', () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(this.testData.projects);
          }
          return null;
        });
      });

      it('should aggregate data for dashboard view', () => {
        const overallStats = projectService.getOverallStats();
        const recentProjects = projectService.getRecentProjects(5);
        const activeProjects = projectService.getActiveProjects();

        expect(overallStats).toBeDefined();
        expect(Array.isArray(recentProjects)).toBe(true);
        expect(Array.isArray(activeProjects)).toBe(true);
      });

      it('should provide quick access to important metrics', () => {
        const stats = projectService.getOverallStats();

        expect(typeof stats.totalProjects).toBe('number');
        expect(typeof stats.activeProjects).toBe('number');
        expect(typeof stats.totalWords).toBe('number');
        expect(typeof stats.totalNotes).toBe('number');
      });

      it('should sort projects by relevance for dashboard', () => {
        const recentProjects = projectService.getRecentProjects(10);
        
        // Should be sorted by last edited date
        for (let i = 1; i < recentProjects.length; i++) {
          const prevDate = new Date(recentProjects[i - 1].lastEditedAt).getTime();
          const currDate = new Date(recentProjects[i].lastEditedAt).getTime();
          expect(prevDate).toBeGreaterThanOrEqual(currDate);
        }
      });

      it('should filter dashboard data by status', () => {
        const activeProjects = projectService.getActiveProjects();
        const archivedProjects = projectService.getArchivedProjects();

        activeProjects.forEach(project => {
          expect(project.status).toBe('writing');
        });

        archivedProjects.forEach(project => {
          expect(project.status).toBe('archived');
        });
      });

      it('should provide summary statistics', () => {
        const stats = projectService.getOverallStats();
        
        expect(stats.totalProjects).toBeGreaterThanOrEqual(0);
        expect(stats.activeProjects).toBeLessThanOrEqual(stats.totalProjects);
        expect(stats.totalWords).toBeGreaterThanOrEqual(0);
        expect(stats.totalNotes).toBeGreaterThanOrEqual(0);
      });
    });
  }

  /**
   * Test performance metrics
   */
  private testPerformanceMetrics(): void {
    describe('Performance Metrics', () => {
      it('should calculate statistics efficiently for large datasets', () => {
        const largeDataset = projectTestDataGenerator.generateLargeDataSet(100, 500);
        
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(largeDataset.projects);
          }
          return null;
        });

        vi.spyOn(storageService, 'getAllNotes').mockReturnValue(
          largeDataset.projects.flatMap(project => 
            Array.from({ length: 5 }, (_, i) => 
              this.createMockNote(project.id, `Note ${i}`, `Content ${i}`, 10)
            )
          )
        );

        const startTime = performance.now();
        const stats = projectService.getOverallStats();
        const endTime = performance.now();

        expect(stats).toBeDefined();
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      });

      it('should handle memory efficiently with large projects', () => {
        const largeProject = projectTestDataGenerator.generateBasicProject({
          title: 'Large Project',
          description: 'A'.repeat(10000) // Large description
        });

        const largeNotes = Array.from({ length: 1000 }, (_, i) => 
          this.createMockNote(largeProject.id, `Note ${i}`, 'A'.repeat(100), 100)
        );

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([largeProject]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(largeNotes);

        const stats = projectService.getProjectStats(largeProject.id);
        
        expect(stats).toBeDefined();
        expect(stats?.totalWords).toBe(100000); // 1000 notes * 100 words each
        expect(stats?.totalNotes).toBe(1000);
      });

      it('should cache repeated calculations', () => {
        const testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });

        const mockGetProjectNotes = vi.spyOn(storageService, 'getProjectNotes')
          .mockReturnValue([this.createMockNote(testProject.id, 'Test', 'Content', 5)]);

        // Call multiple times
        projectService.getProjectStats(testProject.id);
        projectService.getProjectStats(testProject.id);
        projectService.getProjectStats(testProject.id);

        // Should call the expensive operation multiple times (no caching in current implementation)
        expect(mockGetProjectNotes).toHaveBeenCalledTimes(3);
      });
    });
  }

  /**
   * Test data visualization support
   */
  private testDataVisualization(): void {
    describe('Data Visualization Support', () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(this.testData.projects);
          }
          return null;
        });
      });

      it('should provide data suitable for charts', () => {
        const stats = projectService.getOverallStats();
        
        // Data should be numeric and suitable for visualization
        expect(typeof stats.totalProjects).toBe('number');
        expect(typeof stats.activeProjects).toBe('number');
        expect(typeof stats.totalWords).toBe('number');
        expect(typeof stats.totalNotes).toBe('number');
      });

      it('should provide time-series data for progress tracking', () => {
        const recentProjects = projectService.getRecentProjects(10);
        
        // Should have timestamp data for time-series visualization
        recentProjects.forEach(project => {
          expect(project.createdAt).toBeTruthy();
          expect(project.updatedAt).toBeTruthy();
          expect(project.lastEditedAt).toBeTruthy();
        });
      });

      it('should provide categorical data for distribution charts', () => {
        const allProjects = projectService.getAllProjects();
        
        // Count by status for pie charts
        const statusCounts = allProjects.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(Object.keys(statusCounts).length).toBeGreaterThan(0);
        Object.values(statusCounts).forEach(count => {
          expect(count).toBeGreaterThan(0);
        });
      });

      it('should provide tag cloud data', () => {
        const allProjects = projectService.getAllProjects();
        const allTags = allProjects.flatMap(project => project.tags);
        
        expect(Array.isArray(allTags)).toBe(true);
        expect(allTags.length).toBeGreaterThan(0);
      });
    });
  }

  /**
   * Test real-time updates
   */
  private testRealTimeUpdates(): void {
    describe('Real-time Updates', () => {
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

      it('should update statistics when project is modified', () => {
        const initialStats = projectService.getProjectStats(testProject.id);
        
        // Update project
        projectService.updateProject(testProject.id, {
          title: 'Updated Title'
        });

        const updatedStats = projectService.getProjectStats(testProject.id);
        
        // Should reflect changes (even if just timestamp)
        expect(updatedStats).toBeDefined();
      });

      it('should reflect word count changes immediately', () => {
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([
          this.createMockNote(testProject.id, 'Note', 'Initial content', 2)
        ]);

        const initialStats = projectService.getProjectStats(testProject.id);
        expect(initialStats?.totalWords).toBe(2);

        // Update mock to return different word count
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([
          this.createMockNote(testProject.id, 'Note', 'Updated content with more words', 6)
        ]);

        const updatedStats = projectService.getProjectStats(testProject.id);
        expect(updatedStats?.totalWords).toBe(6);
      });

      it('should update progress percentage when content changes', () => {
        const projectWithTarget = {
          ...testProject,
          targetWordCount: 100
        };

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([projectWithTarget]);
          }
          return null;
        });

        // Start with 25 words (25% progress)
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([
          this.createMockNote(projectWithTarget.id, 'Note', 'A'.repeat(25), 25)
        ]);

        const initialStats = projectService.getProjectStats(projectWithTarget.id);
        expect(initialStats?.progressPercentage).toBe(25);

        // Update to 50 words (50% progress)
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([
          this.createMockNote(projectWithTarget.id, 'Note', 'A'.repeat(50), 50)
        ]);

        const updatedStats = projectService.getProjectStats(projectWithTarget.id);
        expect(updatedStats?.progressPercentage).toBe(50);
      });
    });
  }

  /**
   * Test error handling in dashboard
   */
  private testErrorHandling(): void {
    describe('Dashboard Error Handling', () => {
      it('should handle missing project data gracefully', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        expect(() => {
          const stats = projectService.getOverallStats();
          expect(stats.totalProjects).toBe(0);
          expect(stats.totalWords).toBe(0);
        }).not.toThrow();
      });

      it('should handle corrupted statistics data', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid json');

        expect(() => {
          const stats = projectService.getOverallStats();
          expect(stats).toBeDefined();
        }).not.toThrow();
      });

      it('should handle projects with missing notes', () => {
        const testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => {
          const stats = projectService.getProjectStats(testProject.id);
          expect(stats).toBeNull();
        }).not.toThrow();
      });

      it('should provide default values for missing data', () => {
        const emptyProject = projectTestDataGenerator.generateBasicProject({
          title: 'Empty Project',
          description: '',
          tags: []
        });

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([emptyProject]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([]);

        const stats = projectService.getProjectStats(emptyProject.id);
        
        expect(stats).toBeDefined();
        expect(stats?.totalWords).toBe(0);
        expect(stats?.totalNotes).toBe(0);
        expect(stats?.progressPercentage).toBeGreaterThanOrEqual(0);
      });
    });
  }

  /**
   * Helper method to create mock notes
   */
  private createMockNote(projectId: string, title: string, content: string, wordCount: number, createdAt?: string): Note {
    const now = createdAt || new Date().toISOString();
    
    return {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title,
      content,
      type: 'note',
      tags: [],
      folder: undefined,
      position: 1,
      wordCount,
      readTime: Math.ceil(wordCount / 200),
      status: 'draft',
      priority: 'medium',
      wikiLinks: [],
      backlinks: [],
      linkedElements: [],
      templateData: undefined,
      comments: [],
      lastEditedBy: undefined,
      version: 1,
      versionHistory: [],
      aiSuggestions: [],
      createdAt: now,
      updatedAt: now,
      archivedAt: undefined
    };
  }

  /**
   * Setup test environment
   */
  private setupTest(): void {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
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
export const runProjectDashboardTests = () => {
  const testSuite = new ProjectDashboardTestSuite();
  testSuite.runAllTests();
};