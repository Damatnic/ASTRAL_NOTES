/**
 * Quick Notes Comprehensive Test Dashboard
 * Main component for running and displaying Quick Notes test results
 */

import React, { useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/utils/cn';

// Import test suites
import { quickNotesCrudTests } from './quickNotesCrudTests';
import { quickNotesAutoSaveTests } from './quickNotesAutoSaveTests';
import { quickNotesSearchTests } from './quickNotesSearchTests';
import { quickNotesAttachmentTests } from './quickNotesAttachmentTests';
import { quickNotesImportExportTests } from './quickNotesImportExportTests';

interface TestSuiteResult {
  suiteName: string;
  results: Array<{
    testName: string;
    passed: boolean;
    error?: string;
    details?: any;
    duration: number;
  }>;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

interface TestExecution {
  suiteName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: TestSuiteResult;
  startTime?: number;
  endTime?: number;
}

export function QuickNotesTestDashboard() {
  const [testExecutions, setTestExecutions] = useState<Record<string, TestExecution>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');

  const testSuites = [
    {
      id: 'crud',
      name: 'CRUD Operations',
      description: 'Create, Read, Update, Delete operations testing',
      runner: quickNotesCrudTests,
      icon: <FileText className="h-5 w-5" />,
      color: 'blue',
    },
    {
      id: 'autosave',
      name: 'Auto-Save Functionality',
      description: 'Auto-save, debouncing, and conflict resolution testing',
      runner: quickNotesAutoSaveTests,
      icon: <Clock className="h-5 w-5" />,
      color: 'green',
    },
    {
      id: 'search',
      name: 'Search & Filtering',
      description: 'Search functionality and filtering validation',
      runner: quickNotesSearchTests,
      icon: <Search className="h-5 w-5" />,
      color: 'purple',
    },
    {
      id: 'attachment',
      name: 'Project Attachment',
      description: 'Project attachment workflows and smart suggestions',
      runner: quickNotesAttachmentTests,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'orange',
    },
    {
      id: 'importexport',
      name: 'Import/Export',
      description: 'Import/export functionality across multiple formats',
      runner: quickNotesImportExportTests,
      icon: <Download className="h-5 w-5" />,
      color: 'indigo',
    },
  ];

  const runTestSuite = useCallback(async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    setTestExecutions(prev => ({
      ...prev,
      [suiteId]: {
        suiteName: suite.name,
        status: 'running',
        progress: 0,
        startTime: Date.now(),
      },
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTestExecutions(prev => ({
          ...prev,
          [suiteId]: {
            ...prev[suiteId],
            progress: Math.min(prev[suiteId]?.progress + Math.random() * 15, 95),
          },
        }));
      }, 200);

      const result = await suite.runner.runAllTests();

      clearInterval(progressInterval);

      setTestExecutions(prev => ({
        ...prev,
        [suiteId]: {
          ...prev[suiteId],
          status: 'completed',
          progress: 100,
          result,
          endTime: Date.now(),
        },
      }));
    } catch (error) {
      setTestExecutions(prev => ({
        ...prev,
        [suiteId]: {
          ...prev[suiteId],
          status: 'failed',
          progress: 100,
          endTime: Date.now(),
        },
      }));
    }
  }, [testSuites]);

  const runAllTests = useCallback(async () => {
    setIsRunningAll(true);
    
    for (const suite of testSuites) {
      await runTestSuite(suite.id);
    }
    
    setIsRunningAll(false);
  }, [testSuites, runTestSuite]);

  const resetTests = useCallback(() => {
    setTestExecutions({});
    setIsRunningAll(false);
  }, []);

  const exportResults = useCallback(() => {
    const results = Object.values(testExecutions)
      .filter(execution => execution.result)
      .map(execution => execution.result);

    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: results.length,
        totalTests: results.reduce((sum, r) => sum + r!.totalTests, 0),
        passedTests: results.reduce((sum, r) => sum + r!.passedTests, 0),
        failedTests: results.reduce((sum, r) => sum + r!.failedTests, 0),
        totalDuration: results.reduce((sum, r) => sum + r!.totalDuration, 0),
      },
      results,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-notes-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [testExecutions]);

  const getOverallStats = useCallback(() => {
    const completedExecutions = Object.values(testExecutions)
      .filter(execution => execution.result);

    if (completedExecutions.length === 0) {
      return {
        totalSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        totalDuration: 0,
        passRate: 0,
      };
    }

    const totalTests = completedExecutions.reduce((sum, e) => sum + e.result!.totalTests, 0);
    const passedTests = completedExecutions.reduce((sum, e) => sum + e.result!.passedTests, 0);
    const failedTests = completedExecutions.reduce((sum, e) => sum + e.result!.failedTests, 0);
    const totalDuration = completedExecutions.reduce((sum, e) => sum + e.result!.totalDuration, 0);

    return {
      totalSuites: completedExecutions.length,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
    };
  }, [testExecutions]);

  const getFilteredResults = useCallback(() => {
    const allResults = Object.values(testExecutions)
      .filter(execution => execution.result)
      .flatMap(execution => 
        execution.result!.results.map(result => ({
          ...result,
          suiteName: execution.suiteName,
        }))
      );

    let filtered = allResults;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.testName.toLowerCase().includes(query) ||
        result.suiteName.toLowerCase().includes(query) ||
        result.error?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(result =>
        filterStatus === 'passed' ? result.passed : !result.passed
      );
    }

    return filtered;
  }, [testExecutions, searchQuery, filterStatus]);

  const overallStats = getOverallStats();
  const filteredResults = getFilteredResults();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quick Notes Test Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive testing suite for Quick Notes functionality
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={runAllTests}
            disabled={isRunningAll}
            className="gap-2"
          >
            {isRunningAll ? (
              <>
                <Pause className="h-4 w-4" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={resetTests} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          {Object.keys(testExecutions).length > 0 && (
            <Button variant="outline" onClick={exportResults} className="gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          )}
        </div>
      </div>

      {/* Overall Statistics */}
      {overallStats.totalTests > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-foreground">{overallStats.totalSuites}</div>
            <div className="text-sm text-muted-foreground">Test Suites</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-2xl font-bold text-foreground">{overallStats.totalTests}</div>
            <div className="text-sm text-muted-foreground">Total Tests</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{overallStats.passedTests}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{overallStats.failedTests}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{overallStats.passRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Pass Rate</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="w-full">
        <div className="flex space-x-1 p-1 bg-muted rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'overview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'results'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Test Results
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'analytics'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Analytics
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testSuites.map(suite => {
                const execution = testExecutions[suite.id];
                const isRunning = execution?.status === 'running';
                const isCompleted = execution?.status === 'completed';
                const hasFailed = execution?.status === 'failed';

                return (
                  <Card key={suite.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', `bg-${suite.color}-100 text-${suite.color}-600`)}>
                          {suite.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{suite.name}</h3>
                          <p className="text-sm text-muted-foreground">{suite.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isCompleted && execution.result && (
                          <Badge variant={execution.result.failedTests === 0 ? 'default' : 'destructive'}>
                            {execution.result.passedTests}/{execution.result.totalTests}
                          </Badge>
                        )}
                        
                        {isRunning && (
                          <Badge variant="secondary">
                            {execution.progress.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {isRunning && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${execution.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Results Summary */}
                    {isCompleted && execution.result && (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {execution.result.passedTests}
                          </div>
                          <div className="text-xs text-muted-foreground">Passed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">
                            {execution.result.failedTests}
                          </div>
                          <div className="text-xs text-muted-foreground">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">
                            {execution.result.totalDuration}ms
                          </div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                        </div>
                      </div>
                    )}

                    {hasFailed && (
                      <div className="flex items-center gap-2 text-red-600 mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Test suite failed to execute</span>
                      </div>
                    )}

                    <Button
                      onClick={() => runTestSuite(suite.id)}
                      disabled={isRunning || isRunningAll}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {isRunning ? 'Running...' : 'Run Tests'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dropdown
                trigger={
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {filterStatus === 'all' ? 'All Tests' : 
                     filterStatus === 'passed' ? 'Passed Only' : 'Failed Only'}
                  </Button>
                }
              >
                <div className="p-1 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className="w-full justify-start"
                  >
                    All Tests
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterStatus('passed')}
                    className="w-full justify-start"
                  >
                    Passed Only
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterStatus('failed')}
                    className="w-full justify-start"
                  >
                    Failed Only
                  </Button>
                </div>
              </Dropdown>
            </div>

            {/* Test Results */}
            <div className="space-y-3">
              {filteredResults.length === 0 ? (
                <Card className="p-8 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Results</h3>
                  <p className="text-muted-foreground">
                    {Object.keys(testExecutions).length === 0
                      ? 'Run tests to see results here'
                      : 'No tests match your current filters'
                    }
                  </p>
                </Card>
              ) : (
                filteredResults.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{result.testName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {result.suiteName}
                            </Badge>
                          </div>
                          
                          {result.error && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                              {result.error}
                            </div>
                          )}
                          
                          {result.details && (
                            <details className="text-sm text-muted-foreground">
                              <summary className="cursor-pointer hover:text-foreground">
                                Show Details
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {result.duration}ms
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-foreground">Test Analytics</h3>
              </div>
              
              {overallStats.totalTests === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Run tests to see analytics</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(overallStats.totalDuration / 1000).toFixed(2)}s
                    </div>
                    <div className="text-sm text-blue-700">Total Duration</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {overallStats.passRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-700">Success Rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {overallStats.totalTests > 0 
                        ? (overallStats.totalDuration / overallStats.totalTests).toFixed(0)
                        : 0
                      }ms
                    </div>
                    <div className="text-sm text-purple-700">Avg Test Time</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {testSuites.length}
                    </div>
                    <div className="text-sm text-orange-700">Test Suites</div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}