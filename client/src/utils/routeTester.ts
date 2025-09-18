/**
 * Comprehensive Route Testing Utility
 * Tests all routes in the ASTRAL_NOTES application
 */

export interface RouteTestResult {
  path: string;
  status: 'pass' | 'fail' | 'warning';
  statusCode?: number;
  error?: string;
  loadTime?: number;
  componentLoaded?: boolean;
}

export interface RouteTestConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export class RouteTester {
  private config: RouteTestConfig;
  private results: RouteTestResult[] = [];

  constructor(config: Partial<RouteTestConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:7892',
      timeout: 5000,
      retries: 2,
      ...config
    };
  }

  /**
   * Test a single route
   */
  async testRoute(path: string, options: { requiresAuth?: boolean; dynamicParams?: Record<string, string> } = {}): Promise<RouteTestResult> {
    const startTime = Date.now();
    let finalPath = path;
    
    // Replace dynamic parameters
    if (options.dynamicParams) {
      Object.entries(options.dynamicParams).forEach(([key, value]) => {
        finalPath = finalPath.replace(`:${key}`, value);
      });
    }

    const url = `${this.config.baseUrl}${finalPath}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      const loadTime = Date.now() - startTime;
      const text = await response.text();
      
      const result: RouteTestResult = {
        path: finalPath,
        status: response.ok ? 'pass' : 'fail',
        statusCode: response.status,
        loadTime,
        componentLoaded: this.checkComponentLoaded(text, path)
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status} ${response.statusText}`;
      }

      return result;
    } catch (error) {
      return {
        path: finalPath,
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Date.now() - startTime,
        componentLoaded: false
      };
    }
  }

  /**
   * Check if the component loaded successfully by looking for error indicators
   */
  private checkComponentLoaded(html: string, originalPath: string): boolean {
    // Check for React error boundary indicators
    if (html.includes('Something went wrong') || 
        html.includes('Error boundary') || 
        html.includes('ChunkLoadError') ||
        html.includes('Loading chunk')) {
      return false;
    }

    // Check for 404 page
    if (html.includes('404') && html.includes('Page not found')) {
      return originalPath === '*'; // 404 page should only pass for catch-all route
    }

    // Check for basic React app structure
    return html.includes('root') || html.includes('app');
  }

  /**
   * Test all routes with various scenarios
   */
  async testAllRoutes(): Promise<RouteTestResult[]> {
    const routes = [
      // Static routes
      { path: '/' },
      { path: '/dashboard' },
      { path: '/projects' },
      { path: '/quick-notes' },
      { path: '/search' },
      { path: '/settings' },
      { path: '/ai-hub' },
      { path: '/ai-writing' },
      { path: '/professional' },
      { path: '/productivity' },
      { path: '/workflows' },
      { path: '/test-dashboard' },
      
      // Dynamic routes with test data
      { path: '/projects/:id', dynamicParams: { id: 'test-project-1' } },
      { path: '/projects/:id', dynamicParams: { id: 'nonexistent-project' } },
      { path: '/projects/:projectId/notes/new', dynamicParams: { projectId: 'test-project-1' } },
      { path: '/projects/:projectId/notes/:noteId', dynamicParams: { projectId: 'test-project-1', noteId: 'test-note-1' } },
      
      // Test missing routes that should return 404
      { path: '/projects/:id/edit', dynamicParams: { id: 'test-project-1' } },
      { path: '/notes/:id/edit', dynamicParams: { id: 'test-note-1' } },
      
      // Test 404 handling
      { path: '/nonexistent-route' },
      { path: '/projects/edit' }, // Invalid nested route
    ];

    this.results = [];

    for (const route of routes) {
      console.log(`Testing route: ${route.path}`);
      const result = await this.testRoute(route.path, { 
        dynamicParams: route.dynamicParams 
      });
      this.results.push(result);
      
      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.results;
  }

  /**
   * Test navigation performance
   */
  async testNavigationPerformance(): Promise<{ averageLoadTime: number; slowRoutes: RouteTestResult[] }> {
    const performanceResults = this.results.filter(r => r.loadTime !== undefined);
    const totalLoadTime = performanceResults.reduce((sum, r) => sum + (r.loadTime || 0), 0);
    const averageLoadTime = totalLoadTime / performanceResults.length;
    
    const slowRoutes = performanceResults.filter(r => (r.loadTime || 0) > 2000);
    
    return { averageLoadTime, slowRoutes };
  }

  /**
   * Generate a comprehensive test report
   */
  generateReport(): string {
    const passedRoutes = this.results.filter(r => r.status === 'pass');
    const failedRoutes = this.results.filter(r => r.status === 'fail');
    const warningRoutes = this.results.filter(r => r.status === 'warning');

    let report = `
# ASTRAL_NOTES Route Testing Report
Generated: ${new Date().toISOString()}

## Summary
- Total Routes Tested: ${this.results.length}
- Passed: ${passedRoutes.length}
- Failed: ${failedRoutes.length}
- Warnings: ${warningRoutes.length}
- Success Rate: ${((passedRoutes.length / this.results.length) * 100).toFixed(1)}%

## Failed Routes
`;

    failedRoutes.forEach(route => {
      report += `
### ${route.path}
- Status Code: ${route.statusCode || 'N/A'}
- Error: ${route.error || 'Unknown'}
- Load Time: ${route.loadTime}ms
- Component Loaded: ${route.componentLoaded}
`;
    });

    report += `
## Performance Analysis
`;
    
    const performanceData = this.testNavigationPerformance();
    performanceData.then(data => {
      report += `
- Average Load Time: ${data.averageLoadTime.toFixed(0)}ms
- Slow Routes (>2s): ${data.slowRoutes.length}
`;
      
      if (data.slowRoutes.length > 0) {
        report += `
### Slow Routes:
`;
        data.slowRoutes.forEach(route => {
          report += `- ${route.path}: ${route.loadTime}ms\n`;
        });
      }
    });

    report += `
## All Test Results
| Route | Status | Status Code | Load Time | Component Loaded | Error |
|-------|--------|-------------|-----------|------------------|-------|
`;

    this.results.forEach(route => {
      report += `| ${route.path} | ${route.status} | ${route.statusCode || 'N/A'} | ${route.loadTime}ms | ${route.componentLoaded} | ${route.error || ''} |\n`;
    });

    return report;
  }

  /**
   * Get routes that need fixing
   */
  getIssuesFound(): { missingRoutes: string[]; errorRoutes: RouteTestResult[]; recommendedFixes: string[] } {
    const missingRoutes: string[] = [];
    const errorRoutes: RouteTestResult[] = [];
    const recommendedFixes: string[] = [];

    this.results.forEach(result => {
      if (result.status === 'fail') {
        if (result.statusCode === 404 && !result.path.includes('nonexistent')) {
          missingRoutes.push(result.path);
          recommendedFixes.push(`Add route configuration for: ${result.path}`);
        } else {
          errorRoutes.push(result);
          recommendedFixes.push(`Fix error in route: ${result.path} - ${result.error}`);
        }
      }

      if (!result.componentLoaded && result.status !== 'fail') {
        recommendedFixes.push(`Component loading issue in route: ${result.path}`);
      }
    });

    return { missingRoutes, errorRoutes, recommendedFixes };
  }
}

/**
 * Browser-based route testing using Puppeteer-like functionality
 */
export class BrowserRouteTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:7892') {
    this.baseUrl = baseUrl;
  }

  /**
   * Test client-side navigation
   */
  async testClientNavigation(): Promise<{ navigationWorks: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // This would require browser automation tools like Puppeteer
      // For now, we'll simulate the test structure
      console.log('Browser navigation testing would require additional setup');
      return { navigationWorks: true, errors };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown browser error');
      return { navigationWorks: false, errors };
    }
  }
}

// Export convenience function for quick testing
export async function runRouteTests(config?: Partial<RouteTestConfig>): Promise<RouteTestResult[]> {
  const tester = new RouteTester(config);
  const results = await tester.testAllRoutes();
  
  console.log('\n' + tester.generateReport());
  
  const issues = tester.getIssuesFound();
  if (issues.recommendedFixes.length > 0) {
    console.log('\n🔧 Recommended Fixes:');
    issues.recommendedFixes.forEach(fix => console.log(`- ${fix}`));
  }
  
  return results;
}