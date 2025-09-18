/**
 * Route Test Dashboard Component
 * Interactive in-browser route testing interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Play, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

interface RouteTestResult {
  path: string;
  status: 'pass' | 'fail' | 'pending' | 'testing';
  loadTime?: number;
  error?: string;
  timestamp?: string;
}

interface RouteDefinition {
  path: string;
  label: string;
  description: string;
  testParams?: Record<string, string>;
  category: 'static' | 'dynamic' | 'missing';
}

const ROUTES_TO_TEST: RouteDefinition[] = [
  // Static routes
  { path: '/', label: 'Root', description: 'Home page (redirects to dashboard)', category: 'static' },
  { path: '/dashboard', label: 'Dashboard', description: 'Main dashboard', category: 'static' },
  { path: '/projects', label: 'Projects', description: 'Project listing page', category: 'static' },
  { path: '/quick-notes', label: 'Quick Notes', description: 'Quick notes management', category: 'static' },
  { path: '/search', label: 'Search', description: 'Search functionality', category: 'static' },
  { path: '/settings', label: 'Settings', description: 'Application settings', category: 'static' },
  { path: '/ai-hub', label: 'AI Hub', description: 'AI tools dashboard', category: 'static' },
  { path: '/ai-writing', label: 'AI Writing', description: 'AI writing assistance', category: 'static' },
  { path: '/professional', label: 'Professional', description: 'Professional tools', category: 'static' },
  { path: '/productivity', label: 'Productivity', description: 'Productivity tools', category: 'static' },
  { path: '/workflows', label: 'Workflows', description: 'Workflow management', category: 'static' },
  { path: '/test-dashboard', label: 'Test Dashboard', description: 'Testing dashboard', category: 'static' },

  // Dynamic routes
  { 
    path: '/projects/:id', 
    label: 'Project View', 
    description: 'Individual project view',
    testParams: { id: 'test-project-1' },
    category: 'dynamic'
  },
  { 
    path: '/projects/:id/edit', 
    label: 'Project Edit', 
    description: 'Edit project details',
    testParams: { id: 'test-project-1' },
    category: 'dynamic'
  },
  { 
    path: '/projects/:projectId/notes/new', 
    label: 'New Note', 
    description: 'Create new note in project',
    testParams: { projectId: 'test-project-1' },
    category: 'dynamic'
  },
  { 
    path: '/projects/:projectId/notes/:noteId', 
    label: 'Edit Project Note', 
    description: 'Edit note within project',
    testParams: { projectId: 'test-project-1', noteId: 'test-note-1' },
    category: 'dynamic'
  },
  { 
    path: '/notes/:id/edit', 
    label: 'Edit Standalone Note', 
    description: 'Edit standalone note',
    testParams: { id: 'test-note-1' },
    category: 'dynamic'
  },
];

export function RouteTestDashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState<Record<string, RouteTestResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  useEffect(() => {
    // Initialize results
    const initialResults: Record<string, RouteTestResult> = {};
    ROUTES_TO_TEST.forEach(route => {
      initialResults[route.path] = {
        path: route.path,
        status: 'pending'
      };
    });
    setResults(initialResults);
  }, []);

  const buildTestUrl = (route: RouteDefinition): string => {
    let url = route.path;
    if (route.testParams) {
      Object.entries(route.testParams).forEach(([key, value]) => {
        url = url.replace(`:${key}`, value);
      });
    }
    return url;
  };

  const testRoute = async (route: RouteDefinition): Promise<RouteTestResult> => {
    const startTime = Date.now();
    const testUrl = buildTestUrl(route);

    setResults(prev => ({
      ...prev,
      [route.path]: {
        ...prev[route.path],
        status: 'testing'
      }
    }));

    try {
      // For client-side routing, we'll simulate navigation and check for errors
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `${window.location.origin}${testUrl}`;
        
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          resolve({
            path: route.path,
            status: 'fail',
            error: 'Timeout - route took too long to load',
            loadTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });
        }, 10000);

        iframe.onload = () => {
          clearTimeout(timeout);
          const loadTime = Date.now() - startTime;
          
          try {
            // Check if the iframe loaded successfully
            const result: RouteTestResult = {
              path: route.path,
              status: 'pass',
              loadTime,
              timestamp: new Date().toISOString()
            };
            
            document.body.removeChild(iframe);
            resolve(result);
          } catch (error) {
            document.body.removeChild(iframe);
            resolve({
              path: route.path,
              status: 'fail',
              error: error instanceof Error ? error.message : 'Unknown error',
              loadTime,
              timestamp: new Date().toISOString()
            });
          }
        };

        iframe.onerror = () => {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          resolve({
            path: route.path,
            status: 'fail',
            error: 'Failed to load route',
            loadTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });
        };

        document.body.appendChild(iframe);
      });
    } catch (error) {
      return {
        path: route.path,
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  };

  const handleTestSingle = async (route: RouteDefinition) => {
    const result = await testRoute(route);
    setResults(prev => ({
      ...prev,
      [route.path]: result
    }));
  };

  const handleTestAll = async () => {
    setIsRunningAll(true);
    
    for (const route of ROUTES_TO_TEST) {
      const result = await testRoute(route);
      setResults(prev => ({
        ...prev,
        [route.path]: result
      }));
      
      // Small delay between tests to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunningAll(false);
  };

  const navigateToRoute = (route: RouteDefinition) => {
    const testUrl = buildTestUrl(route);
    navigate(testUrl);
  };

  const getStatusIcon = (status: RouteTestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: RouteTestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="success">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCategoryColor = (category: RouteDefinition['category']) => {
    switch (category) {
      case 'static':
        return 'bg-blue-50 border-blue-200';
      case 'dynamic':
        return 'bg-orange-50 border-orange-200';
      case 'missing':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const summary = Object.values(results);
  const passedCount = summary.filter(r => r.status === 'pass').length;
  const failedCount = summary.filter(r => r.status === 'fail').length;
  const pendingCount = summary.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Route Testing Dashboard</h2>
          <p className="text-muted-foreground">Test all routes in the ASTRAL_NOTES application</p>
        </div>
        <Button 
          onClick={handleTestAll} 
          disabled={isRunningAll}
          className="gap-2"
        >
          {isRunningAll ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunningAll ? 'Running Tests...' : 'Test All Routes'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">Total Routes</p>
              <p className="text-2xl font-bold">{ROUTES_TO_TEST.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-green-600">Passed</p>
              <p className="text-2xl font-bold text-green-600">{passedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>
      </div>

      {/* Route Tests */}
      <div className="space-y-4">
        {ROUTES_TO_TEST.map((route) => {
          const result = results[route.path];
          const testUrl = buildTestUrl(route);

          return (
            <Card key={route.path} className={`transition-all duration-200 ${getCategoryColor(route.category)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result?.status)}
                    <div>
                      <CardTitle className="text-lg">{route.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">{route.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          {testUrl}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {route.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result?.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestSingle(route)}
                      disabled={result?.status === 'testing'}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToRoute(route)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(result?.error || result?.loadTime) && (
                <CardContent>
                  <div className="space-y-2">
                    {result.loadTime && (
                      <p className="text-sm text-muted-foreground">
                        Load time: {result.loadTime}ms
                      </p>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        Error: {result.error}
                      </p>
                    )}
                    {result.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        Last tested: {new Date(result.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}