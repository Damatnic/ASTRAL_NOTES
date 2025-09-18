/**
 * Performance Test Component
 * Tests route loading performance and lazy loading
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Timer, Zap, TrendingUp, Activity, ChevronRight } from 'lucide-react';

interface PerformanceMetrics {
  routePath: string;
  routeName: string;
  loadTime: number;
  componentSize?: number;
  memoryUsage?: number;
  renderTime?: number;
  status: 'fast' | 'moderate' | 'slow' | 'error';
}

interface NavigationTest {
  from: string;
  to: string;
  description: string;
}

export function PerformanceTest() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const performanceRoutes = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/projects', name: 'Projects' },
    { path: '/quick-notes', name: 'Quick Notes' },
    { path: '/ai-hub', name: 'AI Hub' },
    { path: '/ai-writing', name: 'AI Writing' },
    { path: '/productivity', name: 'Productivity' },
    { path: '/workflows', name: 'Workflows' },
    { path: '/professional', name: 'Professional' },
    { path: '/search', name: 'Search' },
    { path: '/settings', name: 'Settings' },
    { path: '/test-dashboard', name: 'Test Dashboard' }
  ];

  const navigationTests: NavigationTest[] = [
    { from: '/dashboard', to: '/projects', description: 'Dashboard to Projects' },
    { from: '/projects', to: '/quick-notes', description: 'Projects to Quick Notes' },
    { from: '/quick-notes', to: '/ai-hub', description: 'Quick Notes to AI Hub' },
    { from: '/ai-hub', to: '/productivity', description: 'AI Hub to Productivity' },
    { from: '/productivity', to: '/settings', description: 'Productivity to Settings' }
  ];

  const measurePerformance = async (routePath: string, routeName: string): Promise<PerformanceMetrics> => {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      // Navigate to route
      navigate(routePath);
      
      // Wait for route to load and components to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const loadTime = Math.round(endTime - startTime);
      const memoryDiff = endMemory - startMemory;
      
      // Determine performance status
      let status: PerformanceMetrics['status'] = 'fast';
      if (loadTime > 2000) status = 'slow';
      else if (loadTime > 1000) status = 'moderate';
      
      return {
        routePath,
        routeName,
        loadTime,
        memoryUsage: memoryDiff,
        renderTime: loadTime, // Simplified - actual render time would need more complex measurement
        status
      };
    } catch (error) {
      return {
        routePath,
        routeName,
        loadTime: 0,
        status: 'error'
      };
    }
  };

  const runPerformanceTests = async () => {
    setIsRunning(true);
    setMetrics([]);
    
    for (const route of performanceRoutes) {
      setCurrentTest(route.name);
      const metric = await measurePerformance(route.path, route.name);
      setMetrics(prev => [...prev, metric]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCurrentTest(null);
    setIsRunning(false);
  };

  const runNavigationTest = async () => {
    setIsRunning(true);
    const startTime = performance.now();
    
    for (const test of navigationTests) {
      setCurrentTest(test.description);
      navigate(test.from);
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate(test.to);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const totalTime = performance.now() - startTime;
    console.log(`Navigation test completed in ${Math.round(totalTime)}ms`);
    
    setCurrentTest(null);
    setIsRunning(false);
  };

  const getStatusColor = (status: PerformanceMetrics['status']) => {
    switch (status) {
      case 'fast':
        return 'text-green-600 bg-green-50';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'slow':
        return 'text-red-600 bg-red-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: PerformanceMetrics['status'], loadTime: number) => {
    const color = getStatusColor(status);
    return (
      <Badge variant="outline" className={color}>
        {status.toUpperCase()} ({loadTime}ms)
      </Badge>
    );
  };

  const averageLoadTime = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length)
    : 0;

  const fastRoutes = metrics.filter(m => m.status === 'fast').length;
  const slowRoutes = metrics.filter(m => m.status === 'slow').length;

  // Lazy loading validation
  const validateLazyLoading = () => {
    const scriptTags = document.querySelectorAll('script[src*="assets"]');
    const chunkCount = scriptTags.length;
    
    return {
      isWorking: chunkCount > 1, // Should have multiple chunks if lazy loading is working
      chunkCount,
      details: `Found ${chunkCount} dynamic chunks loaded`
    };
  };

  const lazyLoadingInfo = validateLazyLoading();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Performance Testing
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Measure route loading times and validate lazy loading
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={runPerformanceTests}
                disabled={isRunning}
                variant="default"
              >
                {isRunning ? 'Running...' : 'Test Route Performance'}
              </Button>
              <Button
                onClick={runNavigationTest}
                disabled={isRunning}
                variant="outline"
              >
                Test Navigation
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current test indicator */}
          {currentTest && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="h-4 w-4 animate-pulse text-blue-600" />
              <span className="text-blue-600 font-medium">Testing: {currentTest}</span>
            </div>
          )}

          {/* Summary stats */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">Average Load Time</p>
                    <p className="text-2xl font-bold">{averageLoadTime}ms</p>
                  </div>
                  <Timer className="h-8 w-8 text-blue-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-green-600">Fast Routes</p>
                    <p className="text-2xl font-bold text-green-600">{fastRoutes}</p>
                  </div>
                  <Zap className="h-8 w-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-red-600">Slow Routes</p>
                    <p className="text-2xl font-bold text-red-600">{slowRoutes}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">Total Tested</p>
                    <p className="text-2xl font-bold">{metrics.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-gray-500" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lazy loading info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lazy Loading Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${lazyLoadingInfo.isWorking ? 'text-green-600' : 'text-red-600'}`}>
                  {lazyLoadingInfo.isWorking ? '✅' : '❌'}
                  <span className="font-medium">
                    {lazyLoadingInfo.isWorking ? 'Working' : 'Not Working'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {lazyLoadingInfo.details}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Performance results */}
          {metrics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Performance Results</h3>
              <div className="space-y-2">
                {metrics.map((metric, index) => (
                  <Card key={index} className="transition-all duration-200">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {metric.routePath}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{metric.routeName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Load time: {metric.loadTime}ms
                            {metric.memoryUsage && ` • Memory: ${(metric.memoryUsage / 1024).toFixed(1)}KB`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(metric.status, metric.loadTime)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(metric.routePath)}
                        >
                          Visit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}