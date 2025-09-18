/**
 * Analytics Dashboard Component
 * Comprehensive writing analytics and performance insights
 * Final NovelCrafter feature to achieve 100% completion
 */

import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import type { WritingSession, WritingGoal, WritingStreak, ProjectStatistics } from '../../services/analyticsService';

interface AnalyticsDashboardProps {
  projectId?: string;
  className?: string;
}

interface DashboardTab {
  id: string;
  label: string;
  icon: string;
}

const tabs: DashboardTab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'sessions', label: 'Sessions', icon: '⏱️' },
  { id: 'insights', label: 'Insights', icon: '💡' }
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [projectStats, setProjectStats] = useState<ProjectStatistics | null>(null);
  const [writingStreak, setWritingStreak] = useState<WritingStreak | null>(null);
  const [currentSession, setCurrentSession] = useState<WritingSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<WritingSession[]>([]);
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [projectId]);

  const loadAnalyticsData = async () => {
    try {
      if (projectId) {
        const stats = analyticsService.getProjectStatistics(projectId);
        const streak = analyticsService.getWritingStreak(projectId);
        const projectGoals = analyticsService.getWritingGoals(projectId);
        const sessions = analyticsService.getRecentSessions(projectId, 10);
        
        setProjectStats(stats);
        setWritingStreak(streak);
        setGoals(projectGoals);
        setRecentSessions(sessions);
      } else {
        const sessions = analyticsService.getRecentSessions(undefined, 10);
        const allGoals = analyticsService.getWritingGoals();
        
        setRecentSessions(sessions);
        setGoals(allGoals);
      }

      const current = analyticsService.getCurrentSession();
      setCurrentSession(current);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setLoading(false);
    }
  };

  const startNewSession = () => {
    if (projectId) {
      const sessionId = analyticsService.startWritingSession(projectId);
      console.log('Started session:', sessionId);
      loadAnalyticsData();
    }
  };

  const endCurrentSession = () => {
    const session = analyticsService.endWritingSession();
    console.log('Ended session:', session);
    loadAnalyticsData();
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Current Session Status */}
      <div className="glass-morphism p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          ⏱️ Writing Session
        </h3>
        
        {currentSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {formatDuration(Math.floor((Date.now() - currentSession.startTime.getTime()) / (1000 * 60)))}
                </div>
                <div className="text-gray-400">Active session</div>
              </div>
              <button
                onClick={endCurrentSession}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                End Session
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Words Written</div>
                <div className="text-white font-semibold">{currentSession.netWordsWritten}</div>
              </div>
              <div>
                <div className="text-gray-400">Session Type</div>
                <div className="text-white font-semibold capitalize">{currentSession.sessionType}</div>
              </div>
              <div>
                <div className="text-gray-400">Keystrokes</div>
                <div className="text-white font-semibold">{currentSession.keystrokeCount}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">No active writing session</div>
            {projectId && (
              <button
                onClick={startNewSession}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Start Writing Session
              </button>
            )}
          </div>
        )}
      </div>

      {/* Project Statistics */}
      {projectStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-morphism p-4 rounded-xl">
            <div className="text-2xl font-bold text-blue-400">{projectStats.totalWords.toLocaleString()}</div>
            <div className="text-gray-400">Total Words</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl">
            <div className="text-2xl font-bold text-green-400">{projectStats.writingSessions}</div>
            <div className="text-gray-400">Writing Sessions</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl">
            <div className="text-2xl font-bold text-purple-400">{formatDuration(projectStats.totalWritingTime)}</div>
            <div className="text-gray-400">Total Time</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl">
            <div className="text-2xl font-bold text-yellow-400">{projectStats.wordsPerHour}</div>
            <div className="text-gray-400">Words/Hour</div>
          </div>
        </div>
      )}

      {/* Writing Streak */}
      {writingStreak && (
        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🔥 Writing Streak
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{writingStreak.currentStreak}</div>
              <div className="text-gray-400">Current Streak</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{writingStreak.longestStreak}</div>
              <div className="text-gray-400">Longest Streak</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400">{writingStreak.totalWritingDays}</div>
              <div className="text-gray-400">Total Days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProductivityTab = () => (
    <div className="space-y-6">
      {/* Daily Word Counts Chart */}
      {projectStats && (
        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Word Counts (Last 30 Days)</h3>
          
          <div className="space-y-2">
            {projectStats.dailyWordCounts.slice(-7).map((day, index) => (
              <div key={day.date} className="flex items-center justify-between py-2">
                <div className="text-gray-400 w-20">{formatDate(new Date(day.date))}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (day.words / Math.max(...projectStats.dailyWordCounts.map(d => d.words))) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-white font-semibold w-16 text-right">{day.words}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak Performance Analysis */}
      {projectStats && (
        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 mb-2">Most Productive Time</div>
              <div className="text-2xl font-bold text-green-400">{projectStats.mostProductiveTimeOfDay}</div>
            </div>
            
            <div>
              <div className="text-gray-400 mb-2">Average Session Length</div>
              <div className="text-2xl font-bold text-blue-400">{formatDuration(projectStats.averageSessionLength)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-6">
      {/* Active Goals */}
      <div className="glass-morphism p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🎯 Writing Goals
        </h3>
        
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.filter(goal => goal.isActive).map(goal => (
              <div key={goal.id} className="border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white">{goal.title}</h4>
                  <span className="text-sm text-gray-400 capitalize">{goal.type}</span>
                </div>
                
                <div className="text-gray-400 text-sm mb-3">{goal.description}</div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">0 / {goal.target} {goal.targetType}</span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No active goals. Create your first writing goal to track progress!
          </div>
        )}
      </div>
    </div>
  );

  const renderSessionsTab = () => (
    <div className="space-y-6">
      {/* Recent Sessions */}
      <div className="glass-morphism p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          ⏱️ Recent Writing Sessions
        </h3>
        
        {recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map(session => (
              <div key={session.id} className="border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {session.sessionType === 'writing' ? '✍️' : 
                       session.sessionType === 'editing' ? '✂️' : 
                       session.sessionType === 'planning' ? '📝' : '🔍'}
                    </div>
                    <div>
                      <div className="font-semibold text-white capitalize">{session.sessionType} Session</div>
                      <div className="text-gray-400 text-sm">{formatDate(session.startTime)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">+{session.netWordsWritten}</div>
                    <div className="text-gray-400 text-sm">{formatDuration(session.duration)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm border-t border-gray-600 pt-3">
                  <div>
                    <div className="text-gray-400">Keystrokes</div>
                    <div className="text-white">{session.keystrokeCount}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Avg WPM</div>
                    <div className="text-white">{session.metadata?.averageWPM || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Focus Time</div>
                    <div className="text-white">{formatDuration(session.metadata?.focusTime || 0)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No recent sessions found. Start writing to see your session history!
          </div>
        )}
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Writing Insights */}
      <div className="glass-morphism p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          💡 Writing Insights
        </h3>
        
        <div className="space-y-4">
          <div className="border border-blue-500 bg-blue-500/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Productivity Tip</h4>
                <p className="text-gray-300 text-sm">
                  {projectStats ? 
                    `Your most productive time is ${projectStats.mostProductiveTimeOfDay}. Consider scheduling important writing sessions during this time.` :
                    'Track your writing sessions to discover your most productive times of day.'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-green-500 bg-green-500/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <h4 className="font-semibold text-green-400 mb-1">Goal Setting</h4>
                <p className="text-gray-300 text-sm">
                  {goals.length > 0 ? 
                    'Great job setting writing goals! Consistent daily targets help build strong writing habits.' :
                    'Set daily or weekly word count goals to improve your writing consistency and track progress.'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-purple-500 bg-purple-500/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔥</div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-1">Streak Building</h4>
                <p className="text-gray-300 text-sm">
                  {writingStreak && writingStreak.currentStreak > 0 ? 
                    `Excellent ${writingStreak.currentStreak}-day streak! Keep it up by writing something every day, even if it's just a few sentences.` :
                    'Start building a writing streak by writing something every day. Even 100 words counts!'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'productivity': return renderProductivityTab();
      case 'goals': return renderGoalsTab();
      case 'sessions': return renderSessionsTab();
      case 'insights': return renderInsightsTab();
      default: return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <div className={`analytics-dashboard ${className}`}>
        <div className="glass-morphism rounded-xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          📊 Analytics Dashboard
        </h1>
        <p className="text-gray-400">
          {projectId ? 'Project writing analytics and insights' : 'Global writing analytics and insights'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 glass-morphism rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;