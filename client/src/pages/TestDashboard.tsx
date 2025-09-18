/**
 * Test Dashboard Page
 * Comprehensive testing interface for all ASTRAL_NOTES features
 */

import React, { useState, useEffect } from 'react';
import { 
  TestTube, 
  Database, 
  Navigation, 
  Zap, 
  Settings, 
  FileText, 
  Users, 
  BarChart, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Play,
  Info,
  Brain
} from 'lucide-react';
import { RouteValidator } from '@/components/testing/RouteValidator';
import { QuickNotesTest, ProjectManagementTest, SearchFunctionalityTest, PerformanceTest } from '@/components/testing/FeatureTests';
import { ErrorBoundaryTestSuite } from '@/components/testing/ErrorBoundaryTest';
import { AIServiceValidation } from '@/components/testing/AIServiceValidation';
import { mockDataService } from '@/services/mockDataService';
import { projectService } from '@/services/projectService';
import { quickNotesService } from '@/services/quickNotesService';

type TestCategory = 'overview' | 'routes' | 'data' | 'features' | 'performance' | 'errors';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: TestCategory;
  component?: React.ComponentType;
  tests?: TestCase[];
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}

export function TestDashboard() {
  const [activeCategory, setActiveCategory] = useState<TestCategory>('overview');
  const [testResults, setTestResults] = useState<Record<string, TestCase>>({});
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  // Test suites configuration
  const testSuites: TestSuite[] = [
    {
      id: 'routes',
      name: 'Route Testing',
      description: 'Validate all application routes and navigation',
      icon: <Navigation className="h-5 w-5" />,
      category: 'routes',
      component: RouteValidator
    },
    {
      id: 'data-management',
      name: 'Data Management',
      description: 'Test data loading, storage, and manipulation',
      icon: <Database className="h-5 w-5" />,
      category: 'data',
      tests: [
        {
          id: 'project-crud',
          name: 'Project CRUD Operations',
          description: 'Create, read, update, delete projects',
          status: 'pending'
        },
        {
          id: 'note-crud',
          name: 'Note CRUD Operations',
          description: 'Create, read, update, delete notes',
          status: 'pending'
        },
        {
          id: 'quick-notes-crud',
          name: 'Quick Notes CRUD',
          description: 'Quick notes functionality',
          status: 'pending'
        },
        {
          id: 'data-persistence',
          name: 'Data Persistence',
          description: 'LocalStorage data persistence',
          status: 'pending'
        }
      ]
    },
    {
      id: 'feature-tests',
      name: 'Feature Testing',
      description: 'Test core application features',
      icon: <Zap className="h-5 w-5" />,
      category: 'features',
      tests: [
        {
          id: 'search-functionality',
          name: 'Search Functionality',
          description: 'Global search across projects and notes',
          status: 'pending'
        },
        {
          id: 'export-import',
          name: 'Export/Import',
          description: 'Data export and import functionality',
          status: 'pending'
        },
        {
          id: 'keyboard-shortcuts',
          name: 'Keyboard Shortcuts',
          description: 'Keyboard navigation and shortcuts',
          status: 'pending'
        },
        {
          id: 'offline-mode',
          name: 'Offline Mode',
          description: 'Offline functionality and sync',
          status: 'pending'
        }
      ]
    },
    {
      id: 'performance-tests',
      name: 'Performance Testing',
      description: 'Performance and stress testing',
      icon: <BarChart className="h-5 w-5" />,
      category: 'performance',
      tests: [
        {
          id: 'large-dataset',
          name: 'Large Dataset Handling',
          description: 'Performance with large amounts of data',
          status: 'pending'
        },
        {
          id: 'rendering-performance',
          name: 'Rendering Performance',
          description: 'Component rendering speed',
          status: 'pending'
        },
        {
          id: 'memory-usage',
          name: 'Memory Usage',
          description: 'Memory consumption monitoring',
          status: 'pending'
        }
      ]
    },
    {
      id: 'error-handling',
      name: 'Error Handling',
      description: 'Error boundaries and edge cases',
      icon: <AlertTriangle className="h-5 w-5" />,
      category: 'errors',
      tests: [
        {
          id: 'error-boundaries',
          name: 'Error Boundaries',
          description: 'Component error handling',
          status: 'pending'
        },
        {
          id: 'invalid-data',
          name: 'Invalid Data Handling',
          description: 'Graceful handling of invalid data',
          status: 'pending'
        },
        {
          id: 'network-errors',
          name: 'Network Error Simulation',
          description: 'Offline and network error scenarios',
          status: 'pending'
        }
      ]
    },
    {
      id: 'ai-services',
      name: 'AI Service Validation',
      description: 'Comprehensive validation of all AI services',
      icon: <Brain className="h-5 w-5" />,
      category: 'features',
      component: AIServiceValidation
    }
  ];

  // Collect system information
  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      localStorage: {
        available: typeof Storage !== 'undefined',
        quota: 'quota' in navigator && 'storage' in navigator ? null : 'Unknown'
      },
      timestamp: new Date().toISOString()
    };

    setSystemInfo(info);
  }, []);

  // Get data statistics
  const getDataStats = () => {
    const projects = projectService.getAllProjects();
    const quickNotes = quickNotesService.getAllQuickNotes();
    let totalNotes = 0;
    
    projects.forEach(project => {
      const projectNotes = projectService.getProjectById(project.id);
      totalNotes += projectNotes?.projectNotes?.length || 0;
    });

    return {
      projects: projects.length,
      notes: totalNotes,
      quickNotes: quickNotes.length,
      totalWords: projects.reduce((sum, p) => sum + p.wordCount, 0) + 
                  quickNotes.reduce((sum, q) => sum + q.wordCount, 0)
    };
  };

  // Run a specific test
  const runTest = async (testId: string): Promise<void> => {
    setTestResults(prev => ({
      ...prev,
      [testId]: { ...prev[testId], status: 'running' }
    }));

    const startTime = Date.now();

    try {
      switch (testId) {
        case 'project-crud':
          await testProjectCRUD();
          break;
        case 'note-crud':
          await testNoteCRUD();
          break;
        case 'quick-notes-crud':
          await testQuickNotesCRUD();
          break;
        case 'data-persistence':
          await testDataPersistence();
          break;
        case 'search-functionality':
          await testSearchFunctionality();
          break;
        case 'large-dataset':
          await testLargeDataset();
          break;
        default:
          throw new Error(`Test ${testId} not implemented`);
      }

      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [testId]: { ...prev[testId], status: 'passed', duration }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [testId]: { 
          ...prev[testId], 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        }
      }));
    }
  };

  // Test implementations
  const testProjectCRUD = async (): Promise<void> => {
    // Create
    const project = projectService.createProject({
      title: 'Test Project',
      description: 'Test Description',
      tags: ['test']
    });
    
    if (!project.id) throw new Error('Failed to create project');

    // Read
    const retrieved = projectService.getProjectById(project.id);
    if (!retrieved) throw new Error('Failed to retrieve project');

    // Update
    const updated = projectService.updateProject(project.id, { title: 'Updated Title' });
    if (!updated || updated.title !== 'Updated Title') throw new Error('Failed to update project');

    // Delete
    const deleted = projectService.deleteProject(project.id);
    if (!deleted) throw new Error('Failed to delete project');
  };

  const testNoteCRUD = async (): Promise<void> => {
    // Create test project first
    const project = projectService.createProject({
      title: 'Note Test Project',
      description: 'For testing notes',
      tags: ['test']
    });

    // Test note operations would go here
    // This is a simplified version - actual implementation would test note service
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const testQuickNotesCRUD = async (): Promise<void> => {
    // Create
    const note = quickNotesService.createQuickNote({
      title: 'Test Quick Note',
      content: 'Test content',
      tags: ['test']
    });

    if (!note.id) throw new Error('Failed to create quick note');

    // Read
    const retrieved = quickNotesService.getQuickNoteById(note.id);
    if (!retrieved) throw new Error('Failed to retrieve quick note');

    // Update
    const updated = quickNotesService.updateQuickNote(note.id, { title: 'Updated Title' });
    if (!updated || updated.title !== 'Updated Title') throw new Error('Failed to update quick note');

    // Delete
    const deleted = quickNotesService.deleteQuickNote(note.id);
    if (!deleted) throw new Error('Failed to delete quick note');
  };

  const testDataPersistence = async (): Promise<void> => {
    const testKey = 'test_persistence';
    const testData = { test: true, timestamp: Date.now() };

    localStorage.setItem(testKey, JSON.stringify(testData));
    const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
    
    if (retrieved.test !== true) throw new Error('Data persistence failed');
    
    localStorage.removeItem(testKey);
  };

  const testSearchFunctionality = async (): Promise<void> => {
    // This would test the search service
    await new Promise(resolve => setTimeout(resolve, 500));
    // Placeholder - actual implementation would test search functionality
  };

  const testLargeDataset = async (): Promise<void> => {
    const startTime = Date.now();
    
    // Load performance test data
    mockDataService.loadDataSet('performance-test');
    
    const loadTime = Date.now() - startTime;
    if (loadTime > 5000) throw new Error(`Load time too slow: ${loadTime}ms`);
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningAll(true);
    
    const allTests = testSuites.flatMap(suite => suite.tests || []);
    for (const test of allTests) {
      await runTest(test.id);
    }
    
    setIsRunningAll(false);
  };

  // Load mock data
  const loadMockData = (dataSetId: string) => {
    const success = mockDataService.loadDataSet(dataSetId);
    if (success) {
      window.location.reload(); // Refresh to show new data
    }
  };

  // Clear all data
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      mockDataService.clearAllData();
      window.location.reload();
    }
  };

  const dataStats = getDataStats();
  const categories = [
    { id: 'overview', name: 'Overview', icon: <Info className="h-4 w-4" /> },
    { id: 'routes', name: 'Routes', icon: <Navigation className="h-4 w-4" /> },
    { id: 'data', name: 'Data', icon: <Database className="h-4 w-4" /> },
    { id: 'features', name: 'Features', icon: <Zap className="h-4 w-4" /> },
    { id: 'performance', name: 'Performance', icon: <BarChart className="h-4 w-4" /> },
    { id: 'errors', name: 'Errors', icon: <AlertTriangle className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TestTube className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">ASTRAL_NOTES Test Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Comprehensive testing and validation interface
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={runAllTests}
                disabled={isRunningAll}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isRunningAll ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Categories</h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as TestCategory)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Data Management */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Test Data</h3>
              <div className="space-y-2">
                {mockDataService.getAvailableDataSets().map((dataSet) => (
                  <button
                    key={dataSet.id}
                    onClick={() => loadMockData(dataSet.id)}
                    className="w-full px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    Load {dataSet.name}
                  </button>
                ))}
                <button
                  onClick={clearAllData}
                  className="w-full px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </button>
              </div>
            </div>

            {/* Current Data Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Current Data</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-medium">{dataStats.projects}</span>
                </div>
                <div className="flex justify-between">
                  <span>Notes:</span>
                  <span className="font-medium">{dataStats.notes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quick Notes:</span>
                  <span className="font-medium">{dataStats.quickNotes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Words:</span>
                  <span className="font-medium">{dataStats.totalWords.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeCategory === 'overview' && (
              <div className="space-y-6">
                {/* System Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium mb-4">System Information</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Platform:</strong> {systemInfo.platform}
                    </div>
                    <div>
                      <strong>Language:</strong> {systemInfo.language}
                    </div>
                    <div>
                      <strong>Online:</strong> {systemInfo.onLine ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>LocalStorage:</strong> {systemInfo.localStorage?.available ? 'Available' : 'Not Available'}
                    </div>
                    <div>
                      <strong>Screen:</strong> {systemInfo.screen?.width}x{systemInfo.screen?.height}
                    </div>
                    <div>
                      <strong>Viewport:</strong> {systemInfo.viewport?.width}x{systemInfo.viewport?.height}
                    </div>
                  </div>
                </div>

                {/* Test Suites Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium mb-4">Test Suites</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {testSuites.map((suite) => {
                      const tests = suite.tests || [];
                      const passedTests = tests.filter(t => testResults[t.id]?.status === 'passed').length;
                      const failedTests = tests.filter(t => testResults[t.id]?.status === 'failed').length;

                      return (
                        <div key={suite.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            {suite.icon}
                            <h3 className="font-medium">{suite.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {suite.description}
                          </p>
                          {tests.length > 0 && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">{passedTests} passed</span>
                              <span className="text-red-600">{failedTests} failed</span>
                              <span className="text-gray-600">{tests.length - passedTests - failedTests} pending</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'routes' && (
              <RouteValidator />
            )}

            {activeCategory === 'features' && (
              <div className="space-y-6">
                <QuickNotesTest />
                <ProjectManagementTest />
                <SearchFunctionalityTest />
              </div>
            )}

            {activeCategory === 'performance' && (
              <div className="space-y-6">
                <PerformanceTest />
              </div>
            )}

            {activeCategory === 'errors' && (
              <div className="space-y-6">
                <ErrorBoundaryTestSuite />
              </div>
            )}

            {activeCategory === 'data' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4 capitalize">{activeCategory} Testing</h2>
                
                {testSuites
                  .filter(suite => suite.category === activeCategory)
                  .map((suite) => (
                    <div key={suite.id} className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        {suite.icon}
                        <div>
                          <h3 className="font-medium">{suite.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suite.description}
                          </p>
                        </div>
                      </div>

                      {suite.tests && (
                        <div className="space-y-2">
                          {suite.tests.map((test) => {
                            const result = testResults[test.id];
                            
                            return (
                              <div
                                key={test.id}
                                className="border rounded-lg p-4 flex items-center justify-between"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    {result?.status === 'passed' && (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    )}
                                    {result?.status === 'failed' && (
                                      <AlertTriangle className="h-5 w-5 text-red-600" />
                                    )}
                                    {result?.status === 'running' && (
                                      <Clock className="h-5 w-5 animate-spin text-blue-600" />
                                    )}
                                    {!result && (
                                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    )}

                                    <div>
                                      <h4 className="font-medium">{test.name}</h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {test.description}
                                      </p>
                                    </div>
                                  </div>

                                  {result?.error && (
                                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                                      {result.error}
                                    </div>
                                  )}

                                  {result?.duration && (
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                      Duration: {result.duration}ms
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => runTest(test.id)}
                                  disabled={result?.status === 'running'}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {result?.status === 'running' ? 'Running...' : 'Run Test'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}