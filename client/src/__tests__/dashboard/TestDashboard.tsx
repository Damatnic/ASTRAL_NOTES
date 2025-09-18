/**
 * Comprehensive Test Results Dashboard
 * Interactive UI for viewing test results, coverage, and analytics
 */

import React, { useState, useEffect } from 'react';
import { TestOrchestrator } from '../utils/TestOrchestrator';
import { TestReporter } from '../utils/TestReporter';
import { PerformanceBenchmark } from '../utils/PerformanceBenchmark';
import { QualityGates } from '../utils/QualityGates';

interface TestDashboardProps {
  testResults?: any;
  coverageData?: any;
  performanceData?: any;
  qualityGateResults?: any;
}

interface DashboardState {
  activeTab: 'overview' | 'suites' | 'coverage' | 'performance' | 'quality' | 'trends';
  selectedSuite: string | null;
  timeRange: '24h' | '7d' | '30d' | '90d';
  refreshing: boolean;
  lastUpdated: Date;
}

export const TestDashboard: React.FC<TestDashboardProps> = ({
  testResults,
  coverageData,
  performanceData,
  qualityGateResults,
}) => {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'overview',
    selectedSuite: null,
    timeRange: '7d',
    refreshing: false,
    lastUpdated: new Date(),
  });

  const [results, setResults] = useState({
    summary: {
      totalSuites: 8,
      passedSuites: 7,
      failedSuites: 1,
      totalTests: 6500,
      passedTests: 6350,
      failedTests: 150,
      successRate: 97.7,
      executionTime: 125000, // ms
    },
    suites: [
      {
        name: 'UI Components',
        status: 'passed',
        tests: 150,
        passed: 148,
        failed: 2,
        coverage: 94,
        executionTime: 8500,
      },
      {
        name: 'AI Services',
        status: 'passed',
        tests: 85,
        passed: 85,
        failed: 0,
        coverage: 96,
        executionTime: 15000,
      },
      {
        name: 'Routing',
        status: 'passed',
        tests: 45,
        passed: 43,
        failed: 2,
        coverage: 89,
        executionTime: 5500,
      },
      {
        name: 'Quick Notes',
        status: 'passed',
        tests: 250,
        passed: 245,
        failed: 5,
        coverage: 91,
        executionTime: 18000,
      },
      {
        name: 'Project Management',
        status: 'passed',
        tests: 280,
        passed: 275,
        failed: 5,
        coverage: 93,
        executionTime: 22000,
      },
      {
        name: 'Enhanced Editor',
        status: 'failed',
        tests: 5200,
        passed: 5065,
        failed: 135,
        coverage: 87,
        executionTime: 45000,
      },
      {
        name: 'Performance',
        status: 'passed',
        tests: 25,
        passed: 24,
        failed: 1,
        coverage: 85,
        executionTime: 8000,
      },
      {
        name: 'Accessibility',
        status: 'passed',
        tests: 75,
        passed: 75,
        failed: 0,
        coverage: 88,
        executionTime: 6000,
      },
    ],
    coverage: {
      global: {
        statements: 92.3,
        branches: 88.7,
        functions: 94.1,
        lines: 91.8,
      },
      trend: [
        { date: '2024-01-01', statements: 85.2, branches: 82.1, functions: 87.8, lines: 84.9 },
        { date: '2024-01-02', statements: 87.1, branches: 84.3, functions: 89.2, lines: 86.7 },
        { date: '2024-01-03', statements: 89.5, branches: 86.8, functions: 91.4, lines: 88.9 },
        { date: '2024-01-04', statements: 91.2, branches: 87.9, functions: 93.1, lines: 90.5 },
        { date: '2024-01-05', statements: 92.3, branches: 88.7, functions: 94.1, lines: 91.8 },
      ],
    },
    performance: {
      averageLoadTime: 1250,
      memoryUsage: 67.5, // MB
      testExecutionTime: 125000,
      slowestSuites: [
        { name: 'Enhanced Editor', time: 45000 },
        { name: 'Project Management', time: 22000 },
        { name: 'Quick Notes', time: 18000 },
      ],
    },
    quality: {
      overallScore: 91.5,
      accessibilityScore: 96,
      securityScore: 94,
      codeQualityScore: 89,
      trends: [
        { date: '2024-01-01', score: 87.2 },
        { date: '2024-01-02', score: 88.5 },
        { date: '2024-01-03', score: 89.8 },
        { date: '2024-01-04', score: 90.7 },
        { date: '2024-01-05', score: 91.5 },
      ],
    },
  });

  const refreshData = async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState(prev => ({ 
        ...prev, 
        refreshing: false, 
        lastUpdated: new Date() 
      }));
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setState(prev => ({ ...prev, refreshing: false }));
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">{results.summary.successRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-3xl font-bold text-blue-600">{results.summary.totalTests.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">🧪</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage</p>
              <p className="text-3xl font-bold text-purple-600">{results.coverage.global.statements}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Execution Time</p>
              <p className="text-3xl font-bold text-orange-600">{Math.round(results.summary.executionTime / 1000)}s</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Suites Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Test Suites Overview</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {results.suites.map((suite, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    suite.status === 'passed' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{suite.name}</h3>
                    <p className="text-sm text-gray-600">
                      {suite.passed}/{suite.tests} tests passed
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="text-gray-600">Coverage:</span>
                    <span className="ml-1 font-medium">{suite.coverage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <span className="ml-1 font-medium">{Math.round(suite.executionTime / 1000)}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuites = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Test Suite Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.suites.map((suite, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        suite.status === 'passed' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">{suite.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      suite.status === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {suite.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="flex items-center">
                        <span className="text-green-600 font-medium">{suite.passed}</span>
                        <span className="mx-1">/</span>
                        <span>{suite.tests}</span>
                      </div>
                      {suite.failed > 0 && (
                        <span className="text-red-600 text-xs">{suite.failed} failed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${suite.coverage}%` }}
                        />
                      </div>
                      <span>{suite.coverage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(suite.executionTime / 1000)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      onClick={() => setState(prev => ({ ...prev, selectedSuite: suite.name }))}
                    >
                      View Details
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCoverage = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(results.coverage.global).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 capitalize">{key}</p>
                <p className="text-2xl font-bold text-gray-900">{value}%</p>
              </div>
              <div className="w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-300"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${value}, 100`}
                    strokeLinecap="round"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Coverage Trends</h2>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end space-x-2">
            {results.coverage.trend.map((point, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-blue-600 rounded-t absolute bottom-0"
                    style={{ height: `${(point.statements / 100) * 200}px` }}
                  />
                </div>
                <span className="text-xs text-gray-600 mt-2">
                  {new Date(point.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Load Time</h3>
          <div className="text-3xl font-bold text-blue-600">{results.performance.averageLoadTime}ms</div>
          <p className="text-sm text-gray-600 mt-2">Average load time</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage</h3>
          <div className="text-3xl font-bold text-green-600">{results.performance.memoryUsage}MB</div>
          <p className="text-sm text-gray-600 mt-2">Peak memory usage</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Time</h3>
          <div className="text-3xl font-bold text-purple-600">
            {Math.round(results.performance.testExecutionTime / 1000)}s
          </div>
          <p className="text-sm text-gray-600 mt-2">Total execution time</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Slowest Test Suites</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {results.performance.slowestSuites.map((suite, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{suite.name}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(suite.time / 50000) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(suite.time / 1000)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuality = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-6xl font-bold text-green-600 mb-2">{results.quality.overallScore}</div>
          <p className="text-xl text-gray-600">Overall Quality Score</p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.quality.accessibilityScore}</div>
                <p className="text-sm text-gray-600">Accessibility</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.quality.securityScore}</div>
                <p className="text-sm text-gray-600">Security</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.quality.codeQualityScore}</div>
                <p className="text-sm text-gray-600">Code Quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quality Trends</h2>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end space-x-2">
            {results.quality.trends.map((point, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-green-600 rounded-t absolute bottom-0"
                    style={{ height: `${(point.score / 100) * 200}px` }}
                  />
                </div>
                <span className="text-xs text-gray-600 mt-2">
                  {new Date(point.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'suites', name: 'Test Suites', icon: '🧪' },
    { id: 'coverage', name: 'Coverage', icon: '📈' },
    { id: 'performance', name: 'Performance', icon: '⚡' },
    { id: 'quality', name: 'Quality', icon: '🛡️' },
    { id: 'trends', name: 'Trends', icon: '📉' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">🚀 ASTRAL_NOTES Test Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Last updated: {state.lastUpdated.toLocaleTimeString()}
              </span>
              <button
                onClick={refreshData}
                disabled={state.refreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {state.refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex space-x-8 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                state.activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="pb-8">
          {state.activeTab === 'overview' && renderOverview()}
          {state.activeTab === 'suites' && renderSuites()}
          {state.activeTab === 'coverage' && renderCoverage()}
          {state.activeTab === 'performance' && renderPerformance()}
          {state.activeTab === 'quality' && renderQuality()}
          {state.activeTab === 'trends' && renderQuality()} {/* Reuse quality for trends */}
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;