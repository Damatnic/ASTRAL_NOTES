/**
 * Testing Progress Dashboard - Live Monitoring System
 * Real-time visualization of testing progress, metrics, and quality gates
 */

import React, { useState, useEffect } from 'react';
import { testingProgressTracker, TestPhase, TestMetrics, ProgressReport, RiskIndicator } from '../../services/TestingProgressTracker';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, Shield, Target } from 'lucide-react';

interface DashboardData {
  overallProgress: number;
  phases: TestPhase[];
  currentMetrics: TestMetrics;
  activeRisks: RiskIndicator[];
  recentReports: ProgressReport[];
  velocity: any;
}

export const TestingProgressDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('phase1');
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds

  useEffect(() => {
    loadDashboardData();
    
    // Setup real-time updates
    const interval = setInterval(loadDashboardData, refreshInterval);
    
    // Listen to tracker events
    testingProgressTracker.on('taskUpdated', loadDashboardData);
    testingProgressTracker.on('metricsUpdated', loadDashboardData);
    testingProgressTracker.on('reportGenerated', loadDashboardData);

    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);

  const loadDashboardData = () => {
    const data = testingProgressTracker.getDashboardData();
    setDashboardData(data);
  };

  const getPhaseStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-blue-600 bg-blue-100 border-blue-300';
    }
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { overallProgress, phases, currentMetrics, activeRisks, recentReports, velocity } = dashboardData;

  // Data for charts
  const phaseProgressData = phases.map(phase => ({
    name: phase.name.split(' ')[0],
    progress: phase.completionPercentage,
    status: phase.status
  }));

  const metricsData = [
    { name: 'Coverage', value: currentMetrics.testCoverage, target: 95, unit: '%' },
    { name: 'Performance', value: 100 - (currentMetrics.executionTime / 1000 * 10), target: 90, unit: '%' },
    { name: 'Quality', value: 100 - currentMetrics.errorRate, target: 95, unit: '%' },
    { name: 'Reliability', value: 100 - currentMetrics.flakyTests, target: 98, unit: '%' }
  ];

  const velocityData = recentReports.slice(-7).map((report, index) => ({
    day: `Day ${index + 1}`,
    velocity: report.velocity?.velocityScore || 0,
    completed: report.velocity?.completedTasks || 0,
    planned: report.velocity?.plannedTasks || 0
  }));

  const riskDistribution = [
    { name: 'Low', value: activeRisks.filter(r => r.severity === 'low').length, fill: '#10B981' },
    { name: 'Medium', value: activeRisks.filter(r => r.severity === 'medium').length, fill: '#F59E0B' },
    { name: 'High', value: activeRisks.filter(r => r.severity === 'high').length, fill: '#EF4444' },
    { name: 'Critical', value: activeRisks.filter(r => r.severity === 'critical').length, fill: '#DC2626' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ASTRAL_NOTES Testing Command Center</h1>
            <p className="text-gray-600 mt-2">Expert Testing Orchestrator - Live Progress Tracking</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{overallProgress.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="4"/>
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="4"
                  strokeDasharray={`${overallProgress * 1.76} 176`}
                  className="transition-all duration-500"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Test Coverage</p>
              <p className="text-2xl font-semibold text-gray-900">{currentMetrics.testCoverage.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${currentMetrics.testCoverage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Test Performance</p>
              <p className="text-2xl font-semibold text-gray-900">{currentMetrics.executionTime.toFixed(0)}ms</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">Avg execution time</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quality Score</p>
              <p className="text-2xl font-semibold text-gray-900">{(100 - currentMetrics.errorRate).toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">{currentMetrics.errorRate.toFixed(1)}% error rate</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Velocity</p>
              <p className="text-2xl font-semibold text-gray-900">{velocity.velocityScore || 0}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">Sprint {velocity.sprintNumber || 1}</span>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={phaseProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name="Current" />
              <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Phase View */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Details</h3>
        <div className="flex space-x-4 mb-6">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPhase === phase.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {phase.name}
            </button>
          ))}
        </div>

        {phases.find(p => p.id === selectedPhase) && (
          <div className="space-y-4">
            {phases.find(p => p.id === selectedPhase)!.subtasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {task.currentCoverage.toFixed(1)}% / {task.coverageTarget}%
                    </div>
                    <div className="text-xs text-gray-500">Coverage</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(task.currentCoverage / task.coverageTarget) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Risks</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activeRisks.map((risk) => (
              <div key={risk.id} className={`border rounded-lg p-3 ${getRiskSeverityColor(risk.severity)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="font-medium">{risk.category.toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-medium">{risk.severity.toUpperCase()}</span>
                </div>
                <p className="text-sm mt-1">{risk.description}</p>
                <div className="text-xs mt-2 opacity-75">
                  Owner: {risk.owner} | Due: {new Date(risk.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))}
            {activeRisks.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No active risks detected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Velocity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Velocity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={velocityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Completed Tasks" />
            <Area type="monotone" dataKey="planned" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Planned Tasks" />
            <Line type="monotone" dataKey="velocity" stroke="#F59E0B" strokeWidth={3} name="Velocity Score" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with Controls */}
      <div className="mt-8 flex justify-between items-center text-sm text-gray-500">
        <div>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <div className="flex items-center space-x-4">
          <label>
            Refresh interval:
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TestingProgressDashboard;