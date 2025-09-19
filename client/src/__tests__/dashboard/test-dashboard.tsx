/**
 * 📊 PHASE 1 TESTING DASHBOARD & REAL-TIME PROGRESS TRACKING
 * 
 * Interactive dashboard for monitoring all Phase 1 testing activities:
 * 📈 Real-time test execution progress
 * 🎯 Quality metrics and KPIs
 * 🏆 Competitive benchmarking results
 * 🛡️ Security and reliability status
 * ♿ Accessibility compliance tracking
 * 
 * Provides executive-level visibility into testing progress and quality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ScatterChart, Scatter, AreaChart, Area
} from 'recharts';

// Test monitoring utilities
import { TestMonitor } from '@/test-utils/monitoring/TestMonitor';
import { ProgressTracker } from '@/test-utils/monitoring/ProgressTracker';
import { QualityMetricsCollector } from '@/test-utils/monitoring/QualityMetricsCollector';
import { CompetitiveAnalyzer } from '@/test-utils/monitoring/CompetitiveAnalyzer';

// Dashboard components
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProgressIndicator } from '@/components/dashboard/ProgressIndicator';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { AlertPanel } from '@/components/dashboard/AlertPanel';

interface TestSuiteStatus {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  testsTotal: number;
  testsCompleted: number;
  testsPassed: number;
  testsFailed: number;
  duration: number;
  coverage: number;
  performance: number;
  lastUpdated: Date;
}

interface QualityMetrics {
  overall: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    target: number;
  };
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  performance: {
    latency: number;
    throughput: number;
    memory: number;
    cpu: number;
  };
  accessibility: {
    wcagLevel: string;
    score: number;
    violations: number;
  };
  security: {
    vulnerabilities: number;
    score: number;
    compliance: string;
  };
}

interface CompetitiveMetrics {
  googleDocs: { performance: number; features: number; overall: number };
  livingWriter: { performance: number; features: number; overall: number };
  novelCrafter: { performance: number; features: number; overall: number };
  scrivener: { performance: number; features: number; overall: number };
}

const COLORS = {
  primary: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  green: '#059669'
};

export const TestDashboard: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuiteStatus[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [competitiveMetrics, setCompetitiveMetrics] = useState<CompetitiveMetrics | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '4h' | '12h' | '24h'>('4h');
  const [alerts, setAlerts] = useState<Array<{ id: string; type: string; message: string; timestamp: Date }>>([]);

  const testMonitor = new TestMonitor();
  const progressTracker = new ProgressTracker();
  const qualityCollector = new QualityMetricsCollector();
  const competitiveAnalyzer = new CompetitiveAnalyzer();

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Load test suite statuses
        const suites = await testMonitor.getAllTestSuites();
        setTestSuites(suites);

        // Load quality metrics
        const quality = await qualityCollector.getLatestMetrics();
        setQualityMetrics(quality);

        // Load competitive analysis
        const competitive = await competitiveAnalyzer.getLatestComparison();
        setCompetitiveMetrics(competitive);

        // Load alerts
        const recentAlerts = await testMonitor.getRecentAlerts();
        setAlerts(recentAlerts);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      }
    };

    initializeDashboard();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!isLive) return;

    const updateInterval = setInterval(async () => {
      try {
        // Update test suite progress
        const updatedSuites = await testMonitor.getAllTestSuites();
        setTestSuites(updatedSuites);

        // Update metrics if any tests completed
        const hasCompletedTests = updatedSuites.some(suite => 
          suite.status === 'completed' && 
          suite.lastUpdated > new Date(Date.now() - 10000) // Within last 10 seconds
        );

        if (hasCompletedTests) {
          const updatedQuality = await qualityCollector.getLatestMetrics();
          setQualityMetrics(updatedQuality);

          const updatedCompetitive = await competitiveAnalyzer.getLatestComparison();
          setCompetitiveMetrics(updatedCompetitive);
        }

        // Check for new alerts
        const newAlerts = await testMonitor.getRecentAlerts();
        setAlerts(newAlerts);
      } catch (error) {
        console.error('Failed to update dashboard:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(updateInterval);
  }, [isLive]);

  const calculateOverallProgress = () => {
    if (testSuites.length === 0) return 0;
    return testSuites.reduce((sum, suite) => sum + suite.progress, 0) / testSuites.length;
  };

  const getTestSuitesByCategory = () => {
    const categories = testSuites.reduce((acc, suite) => {
      if (!acc[suite.category]) {
        acc[suite.category] = [];
      }
      acc[suite.category].push(suite);
      return acc;
    }, {} as Record<string, TestSuiteStatus[]>);

    return Object.entries(categories).map(([category, suites]) => ({
      category,
      total: suites.length,
      completed: suites.filter(s => s.status === 'completed').length,
      running: suites.filter(s => s.status === 'running').length,
      failed: suites.filter(s => s.status === 'failed').length,
      avgProgress: suites.reduce((sum, s) => sum + s.progress, 0) / suites.length
    }));
  };

  const getPerformanceTrend = () => {
    return testSuites
      .filter(suite => suite.performance > 0)
      .map(suite => ({
        name: suite.name.substring(0, 20),
        performance: suite.performance,
        coverage: suite.coverage,
        category: suite.category
      }));
  };

  const getCoverageData = () => {
    if (!qualityMetrics) return [];
    
    return [
      { name: 'Statements', value: qualityMetrics.coverage.statements, target: 95 },
      { name: 'Branches', value: qualityMetrics.coverage.branches, target: 90 },
      { name: 'Functions', value: qualityMetrics.coverage.functions, target: 95 },
      { name: 'Lines', value: qualityMetrics.coverage.lines, target: 95 }
    ];
  };

  const getCompetitiveData = () => {
    if (!competitiveMetrics) return [];

    return [
      { 
        name: 'Google Docs', 
        performance: competitiveMetrics.googleDocs.performance,
        features: competitiveMetrics.googleDocs.features,
        overall: competitiveMetrics.googleDocs.overall
      },
      { 
        name: 'LivingWriter', 
        performance: competitiveMetrics.livingWriter.performance,
        features: competitiveMetrics.livingWriter.features,
        overall: competitiveMetrics.livingWriter.overall
      },
      { 
        name: 'NovelCrafter', 
        performance: competitiveMetrics.novelCrafter.performance,
        features: competitiveMetrics.novelCrafter.features,
        overall: competitiveMetrics.novelCrafter.overall
      },
      { 
        name: 'Scrivener', 
        performance: competitiveMetrics.scrivener.performance,
        features: competitiveMetrics.scrivener.features,
        overall: competitiveMetrics.scrivener.overall
      }
    ];
  };

  const runAllTests = async () => {
    try {
      setAlerts(prev => [...prev, {
        id: Date.now().toString(),
        type: 'info',
        message: 'Starting comprehensive test execution...',
        timestamp: new Date()
      }]);

      await testMonitor.runAllTestSuites();
    } catch (error) {
      setAlerts(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        message: `Test execution failed: ${error}`,
        timestamp: new Date()
      }]);
    }
  };

  const exportReport = async () => {
    try {
      const report = await testMonitor.generateComprehensiveReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phase1-testing-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="test-dashboard">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🎯 Phase 1 Testing Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time monitoring of comprehensive testing and quality assurance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isLive 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}
            >
              {isLive ? '🟢 Live' : '⏸️ Paused'}
            </button>
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              🚀 Run All Tests
            </button>
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              📊 Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Overall Progress"
          value={`${calculateOverallProgress().toFixed(1)}%`}
          trend={qualityMetrics?.overall.trend || 'stable'}
          color={COLORS.primary}
          icon="📈"
        />
        <MetricCard
          title="Quality Score"
          value={qualityMetrics?.overall.score.toFixed(1) || 'N/A'}
          target={qualityMetrics?.overall.target}
          color={COLORS.success}
          icon="🎯"
        />
        <MetricCard
          title="Test Coverage"
          value={`${qualityMetrics?.coverage.statements.toFixed(1) || 0}%`}
          target={95}
          color={COLORS.info}
          icon="🎭"
        />
        <MetricCard
          title="Security Score"
          value={qualityMetrics?.security.score.toFixed(1) || 'N/A'}
          target={98}
          color={COLORS.purple}
          icon="🛡️"
        />
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <AlertPanel 
          alerts={alerts} 
          onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
          className="mb-8"
        />
      )}

      {/* Test Suites Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Test Suite Progress</h3>
          <div className="space-y-4">
            {getTestSuitesByCategory().map((category) => (
              <div key={category.category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  <StatusBadge 
                    status={category.completed === category.total ? 'completed' : 
                           category.running > 0 ? 'running' : 'pending'} 
                  />
                </div>
                <ProgressIndicator 
                  progress={category.avgProgress} 
                  color={category.failed > 0 ? COLORS.error : COLORS.success}
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{category.completed}/{category.total} completed</span>
                  <span>{category.avgProgress.toFixed(1)}% progress</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Performance vs Coverage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={getPerformanceTrend()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="performance" name="Performance" unit="%" />
              <YAxis dataKey="coverage" name="Coverage" unit="%" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Test Suites" dataKey="coverage" fill={COLORS.primary} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🎭 Code Coverage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getCoverageData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.success} />
              <Bar dataKey="target" fill={COLORS.warning} opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">♿ Accessibility Compliance</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {qualityMetrics?.accessibility.score || 0}/100
            </div>
            <div className="text-lg text-gray-600 mb-4">
              WCAG {qualityMetrics?.accessibility.wcagLevel || 'AA'} Compliant
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Compliant', value: qualityMetrics?.accessibility.score || 0 },
                    { name: 'Issues', value: 100 - (qualityMetrics?.accessibility.score || 0) }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill={COLORS.success} />
                  <Cell fill={COLORS.error} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🛡️ Security Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Critical Vulnerabilities</span>
              <span className="font-bold text-green-600">
                {qualityMetrics?.security.vulnerabilities || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Security Score</span>
              <span className="font-bold text-blue-600">
                {qualityMetrics?.security.score || 0}/100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Compliance Level</span>
              <span className="font-bold text-purple-600">
                {qualityMetrics?.security.compliance || 'Enterprise'}
              </span>
            </div>
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${qualityMetrics?.security.score || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">🏆 Competitive Benchmarking</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={getCompetitiveData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="performance" fill={COLORS.primary} name="Performance Advantage" />
            <Bar dataKey="features" fill={COLORS.success} name="Feature Advantage" />
            <Bar dataKey="overall" fill={COLORS.purple} name="Overall Superiority" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          {getCompetitiveData().map((competitor) => (
            <div key={competitor.name} className="p-3 border rounded-lg">
              <div className="font-medium text-gray-900">{competitor.name}</div>
              <div className="text-2xl font-bold text-green-600">
                {competitor.overall.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Advantage</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">⚡ System Performance</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {qualityMetrics?.performance.latency || 0}ms
            </div>
            <div className="text-gray-600">Avg Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {qualityMetrics?.performance.throughput || 0}
            </div>
            <div className="text-gray-600">Throughput (req/s)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {qualityMetrics?.performance.memory || 0}MB
            </div>
            <div className="text-gray-600">Memory Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {qualityMetrics?.performance.cpu || 0}%
            </div>
            <div className="text-gray-600">CPU Usage</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p>ASTRAL_NOTES Phase 1 Comprehensive Testing Dashboard</p>
      </div>
    </div>
  );
};

export default TestDashboard;