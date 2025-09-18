/**
 * Route Validator Component
 * Tests all application routes and validates their functionality
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Navigation, AlertTriangle } from 'lucide-react';
import { projectService } from '@/services/projectService';
import { quickNotesService } from '@/services/quickNotesService';

interface RouteTest {
  path: string;
  name: string;
  description: string;
  requiresData?: boolean;
  dynamic?: boolean;
  params?: Record<string, string>;
}

interface RouteTestResult {
  path: string;
  status: 'pending' | 'testing' | 'passed' | 'failed';
  error?: string;
  loadTime?: number;
  timestamp?: string;
}

export function RouteValidator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [testResults, setTestResults] = useState<Record<string, RouteTestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [autoTest, setAutoTest] = useState(false);

  // Define all routes to test
  const routes: RouteTest[] = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      description: 'Main dashboard page showing project overview and recent activity'
    },
    {
      path: '/projects',
      name: 'Projects List',
      description: 'List of all user projects with filtering and search capabilities'
    },
    {
      path: '/projects/:id',
      name: 'Project Dashboard',
      description: 'Individual project dashboard showing notes and details',
      dynamic: true,
      requiresData: true
    },
    {
      path: '/projects/:id/edit',
      name: 'Project Editor',
      description: 'Edit project details and settings',
      dynamic: true,
      requiresData: true
    },
    {
      path: '/projects/:projectId/notes/new',
      name: 'New Note Editor',
      description: 'Create new note within a project',
      dynamic: true,
      requiresData: true
    },
    {
      path: '/projects/:projectId/notes/:noteId',
      name: 'Note Editor',
      description: 'Edit existing note within a project',
      dynamic: true,
      requiresData: true
    },
    {
      path: '/quick-notes',
      name: 'Quick Notes',
      description: 'Standalone quick notes for capturing ideas'
    },
    {
      path: '/notes/:id/edit',
      name: 'Standalone Note Editor',
      description: 'Edit standalone quick note',
      dynamic: true,
      requiresData: true
    },
    {
      path: '/ai-hub',
      name: 'AI Hub',
      description: 'AI-powered writing assistance and tools'
    },
    {
      path: '/ai-writing',
      name: 'AI Writing',
      description: 'AI writing companion and assistance features'
    },
    {
      path: '/productivity',
      name: 'Productivity Dashboard',
      description: 'Productivity tracking and analytics'
    },
    {
      path: '/workflows',
      name: 'Workflows',
      description: 'Writing workflows and automation tools'
    },
    {
      path: '/professional',
      name: 'Professional Tools',
      description: 'Professional writing and publishing tools'
    },
    {
      path: '/search',
      name: 'Search',
      description: 'Global search across all projects and notes'
    },
    {
      path: '/settings',
      name: 'Settings',
      description: 'Application settings and preferences'
    },
    {
      path: '/test-dashboard',
      name: 'Test Dashboard',
      description: 'Testing dashboard for QA and validation',
      requiresData: false
    }
  ];

  // Get dynamic route parameters
  const getDynamicParams = (route: RouteTest): Record<string, string> => {
    if (!route.dynamic || !route.requiresData) return {};

    const projects = projectService.getAllProjects();
    const quickNotes = quickNotesService.getAllQuickNotes();

    if (projects.length === 0) {
      // Create a test project if none exist
      const testProject = projectService.createProject({
        title: 'Test Project for Route Validation',
        description: 'Automatically created for testing purposes',
        tags: ['test']
      });
      projects.push(testProject);
    }

    const project = projects[0];
    const projectNotes = projectService.getProjectById(project.id);

    if (route.path.includes('/:projectId/notes/:noteId')) {
      // Need both project and note ID
      return {
        projectId: project.id,
        noteId: projectNotes?.projectNotes?.[0]?.id || 'test-note'
      };
    } else if (route.path.includes('/:projectId')) {
      // Need project ID
      return {
        projectId: project.id
      };
    } else if (route.path.includes('/notes/:id/edit')) {
      // Standalone note edit - need quick note ID
      if (quickNotes.length === 0) {
        // Create a test quick note if none exist
        const testNote = quickNotesService.createQuickNote({
          title: 'Test Note for Route Validation',
          content: 'Automatically created for testing purposes',
          tags: ['test']
        });
        return {
          id: testNote.id
        };
      }
      return {
        id: quickNotes[0].id
      };
    } else if (route.path.includes('/:id')) {
      // Generic ID (project)
      return {
        id: project.id
      };
    }

    return {};
  };

  // Build actual path from template
  const buildPath = (route: RouteTest): string => {
    let path = route.path;
    const params = getDynamicParams(route);

    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });

    return path;
  };

  // Test a single route
  const testRoute = async (route: RouteTest): Promise<RouteTestResult> => {
    const startTime = Date.now();
    const path = buildPath(route);

    try {
      setTestResults(prev => ({
        ...prev,
        [route.path]: {
          path: route.path,
          status: 'testing'
        }
      }));

      // Navigate to the route
      navigate(path);

      // Wait a bit for the route to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if we're at the expected location
      const success = window.location.pathname === path || 
                     window.location.pathname.startsWith(path.split('?')[0]);

      if (!success) {
        throw new Error(`Navigation failed. Expected: ${path}, Actual: ${window.location.pathname}`);
      }

      // Check for error boundaries or 404 pages
      const hasError = document.querySelector('[data-error-boundary]') ||
                      document.querySelector('.error-page') ||
                      document.textContent?.includes('404') ||
                      document.textContent?.includes('Page not found');

      if (hasError) {
        throw new Error('Page loaded with error state');
      }

      const loadTime = Date.now() - startTime;

      return {
        path: route.path,
        status: 'passed',
        loadTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const loadTime = Date.now() - startTime;
      return {
        path: route.path,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime,
        timestamp: new Date().toISOString()
      };
    }
  };

  // Test all routes
  const testAllRoutes = async () => {
    setIsRunning(true);
    setTestResults({});

    for (const route of routes) {
      setCurrentTest(route.path);
      const result = await testRoute(route);
      setTestResults(prev => ({
        ...prev,
        [route.path]: result
      }));

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest(null);
    setIsRunning(false);
  };

  // Test individual route
  const testSingleRoute = async (route: RouteTest) => {
    const result = await testRoute(route);
    setTestResults(prev => ({
      ...prev,
      [route.path]: result
    }));
  };

  // Clear all test results
  const clearResults = () => {
    setTestResults({});
    setCurrentTest(null);
  };

  // Auto-test on component mount if enabled
  useEffect(() => {
    if (autoTest) {
      testAllRoutes();
    }
  }, [autoTest]);

  // Get test statistics
  const getStats = () => {
    const results = Object.values(testResults);
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const pending = routes.length - total;

    return { total: routes.length, passed, failed, pending };
  };

  const stats = getStats();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Navigation className="h-6 w-6" />
              Route Validator
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Test all application routes and validate their functionality
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoTest}
                onChange={(e) => setAutoTest(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-test on load</span>
            </label>

            <button
              onClick={testAllRoutes}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test All Routes'
              )}
            </button>

            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Routes</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-green-600">Passed</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>

        {/* Current test indicator */}
        {currentTest && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin text-blue-600" />
              <span className="font-medium text-blue-600">
                Currently testing: {routes.find(r => r.path === currentTest)?.name}
              </span>
            </div>
          </div>
        )}

        {/* Route list */}
        <div className="space-y-2">
          {routes.map((route) => {
            const result = testResults[route.path];
            const isCurrentTest = currentTest === route.path;

            return (
              <div
                key={route.path}
                className={`border rounded-lg p-4 transition-colors ${
                  isCurrentTest
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                    : result?.status === 'passed'
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : result?.status === 'failed'
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {result?.status === 'passed' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {result?.status === 'failed' && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {result?.status === 'testing' && (
                          <Clock className="h-5 w-5 animate-spin text-blue-600" />
                        )}
                        {!result && (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}

                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {route.path}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-medium">{route.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {route.description}
                        </p>
                      </div>
                    </div>

                    {route.requiresData && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Requires test data</span>
                      </div>
                    )}

                    {result?.error && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                        {result.error}
                      </div>
                    )}

                    {result?.loadTime && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Load time: {result.loadTime}ms
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testSingleRoute(route)}
                      disabled={isRunning}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Test
                    </button>

                    <button
                      onClick={() => navigate(buildPath(route))}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Visit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}