/**
 * Writing Dashboard Component
 * Comprehensive analytics and statistics dashboard for writing progress
 */

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Calendar,
  Award,
  Zap,
  BookOpen,
  PenTool,
  Activity,
  Timer,
  Trophy,
  Flame,
  Star,
  Users,
  MapPin,
  Hash,
  Play,
  Pause,
  Square,
  Settings,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { analyticsService, type ProjectStatistics, type WritingStreak, type WritingSession, type WritingGoal } from '@/services/analyticsService';
import { WritingGoalCard } from './WritingGoalCard';
import { SessionTimer } from './SessionTimer';
import { ProgressChart } from './ProgressChart';
import { WritingHeatmap } from './WritingHeatmap';

interface WritingDashboardProps {
  projectId: string;
  className?: string;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';
type MetricType = 'words' | 'time' | 'sessions' | 'goals';

export function WritingDashboard({
  projectId,
  className
}: WritingDashboardProps) {
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [writingStreak, setWritingStreak] = useState<WritingStreak | null>(null);
  const [activeGoals, setActiveGoals] = useState<WritingGoal[]>([]);
  const [recentSessions, setRecentSessions] = useState<WritingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WritingSession | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('words');
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [projectId]);

  // Update current session state
  useEffect(() => {
    const session = analyticsService.getCurrentSession();
    setCurrentSession(session);

    // Set up session polling
    const interval = setInterval(() => {
      const updatedSession = analyticsService.getCurrentSession();
      setCurrentSession(updatedSession);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load all analytics data
      const stats = analyticsService.getProjectStatistics(projectId);
      const streak = analyticsService.getWritingStreak(projectId);
      const goals = analyticsService.getActiveGoals(projectId);
      const sessions = analyticsService.getRecentSessions(projectId, 10);

      setStatistics(stats);
      setWritingStreak(streak);
      setActiveGoals(goals);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate today's progress
  const todayProgress = useMemo(() => {
    if (!statistics) return { words: 0, time: 0, sessions: 0 };

    const today = new Date().toISOString().split('T')[0];
    const todayData = statistics.dailyWordCounts.find(day => day.date === today);
    
    const todaySessions = recentSessions.filter(session => 
      session.startTime.toISOString().split('T')[0] === today
    );

    return {
      words: todayData?.words || 0,
      time: todaySessions.reduce((sum, session) => sum + session.duration, 0),
      sessions: todaySessions.length
    };
  }, [statistics, recentSessions]);

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!activeGoals.length || !statistics) return [];

    return activeGoals.map(goal => {
      let progress = 0;
      let current = 0;

      switch (goal.type) {
        case 'daily':
          current = todayProgress.words;
          progress = Math.min((current / goal.target) * 100, 100);
          break;
        case 'weekly':
          const thisWeek = statistics.weeklyProgress[statistics.weeklyProgress.length - 1];
          current = thisWeek?.words || 0;
          progress = Math.min((current / goal.target) * 100, 100);
          break;
        case 'monthly':
          const thisMonth = statistics.monthlyProgress[statistics.monthlyProgress.length - 1];
          current = thisMonth?.words || 0;
          progress = Math.min((current / goal.target) * 100, 100);
          break;
        case 'project':
          current = statistics.totalWords;
          progress = Math.min((current / goal.target) * 100, 100);
          break;
      }

      return { goal, progress, current };
    });
  }, [activeGoals, statistics, todayProgress]);

  const handleStartSession = () => {
    analyticsService.startWritingSession(projectId, 'writing');
    setCurrentSession(analyticsService.getCurrentSession());
  };

  const handleEndSession = () => {
    analyticsService.endWritingSession();
    setCurrentSession(null);
    loadDashboardData(); // Refresh data
  };

  const handlePauseSession = () => {
    analyticsService.pauseSession();
  };

  if (isLoading) {
    return (
      <div className={cn("writing-dashboard", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("writing-dashboard space-y-6", className)}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Writing Dashboard</h1>
          <p className="text-muted-foreground">Track your writing progress and achieve your goals</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{todayProgress.words.toLocaleString()}</span>
                <Badge variant="outline">words</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {todayProgress.time}m
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {todayProgress.sessions} sessions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Writing Streak */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Writing Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{writingStreak?.currentStreak || 0}</span>
                <Badge variant="outline">days</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Best: {writingStreak?.longestStreak || 0} days
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Project Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              Project Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{statistics?.totalWords.toLocaleString() || 0}</span>
                <Badge variant="outline">words</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div>{statistics?.totalScenes || 0} scenes</div>
                <div>{statistics?.writingSessions || 0} sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Productivity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{statistics?.wordsPerHour || 0}</span>
                <Badge variant="outline">wph</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Peak: {statistics?.mostProductiveTimeOfDay || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Writing Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SessionTimer
            currentSession={currentSession}
            onStart={handleStartSession}
            onEnd={handleEndSession}
            onPause={handlePauseSession}
          />
        </CardContent>
      </Card>

      {/* Goals and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Goals
              <Badge variant="outline" className="ml-auto">
                {activeGoals.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active goals</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Create Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goalProgress.map(({ goal, progress, current }) => (
                  <WritingGoalCard
                    key={goal.id}
                    goal={goal}
                    progress={progress}
                    current={current}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.slice(0, 5).map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        session.sessionType === 'writing' && "bg-green-500",
                        session.sessionType === 'editing' && "bg-blue-500",
                        session.sessionType === 'planning' && "bg-purple-500",
                        session.sessionType === 'research' && "bg-orange-500"
                      )} />
                      <div>
                        <div className="font-medium capitalize">{session.sessionType}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.startTime.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">+{session.netWordsWritten} words</div>
                      <div className="text-sm text-muted-foreground">{session.duration}m</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Progress Chart
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-2 py-1 text-sm border rounded bg-background"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              data={statistics?.dailyWordCounts || []}
              timeRange={timeRange}
              metricType={selectedMetric}
            />
          </CardContent>
        </Card>

        {/* Writing Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Writing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WritingHeatmap
              sessions={recentSessions}
              timeRange={timeRange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Detailed Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Writing Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Session</span>
                  <span>{Math.round(statistics?.averageSessionLength || 0)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Words per Hour</span>
                  <span>{statistics?.wordsPerHour || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span>{statistics?.writingSessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Time</span>
                  <span>{Math.round((statistics?.totalWritingTime || 0) / 60)}h</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Content Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Scenes</span>
                  <span>{statistics?.totalScenes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed Scenes</span>
                  <span>{statistics?.completedScenes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Words/Scene</span>
                  <span>{Math.round(statistics?.averageWordsPerScene || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{Math.round(statistics?.projectProgress || 0)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Streaks & Achievements</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span>{writingStreak?.currentStreak || 0} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longest Streak</span>
                  <span>{writingStreak?.longestStreak || 0} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Writing Days</span>
                  <span>{writingStreak?.totalWritingDays || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak Time</span>
                  <span>{statistics?.mostProductiveTimeOfDay || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WritingDashboard;