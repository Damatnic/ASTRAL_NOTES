/**
 * Personal Writing Analytics Component
 * Comprehensive analytics dashboard for individual writers
 * Tracks progress, patterns, and provides insights for personal improvement
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import personalAICoach from '@/services/personalAICoach';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Calendar,
  Award,
  Zap,
  Heart,
  Eye,
  BookOpen,
  PenTool,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Star,
  Users,
  Globe,
  Lightbulb,
  Coffee,
  Moon,
  Sun,
  Brain
} from 'lucide-react';

export interface PersonalWritingAnalyticsProps {
  userId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
}

interface AnalyticsData {
  productivity: {
    totalWords: number;
    averageSession: number;
    longestSession: number;
    totalSessions: number;
    streak: number;
    weeklyTrend: number;
  };
  quality: {
    averageRating: number;
    improvementTrend: number;
    consistencyScore: number;
    styleEvolution: number;
  };
  habits: {
    peakHours: string[];
    preferredDuration: number;
    mostProductiveMood: string;
    distractionRate: number;
  };
  goals: {
    completed: number;
    inProgress: number;
    completionRate: number;
    averageTimeToComplete: number;
  };
  insights: {
    strengthAreas: string[];
    improvementAreas: string[];
    personalityMatch: number;
    creativityIndex: number;
  };
}

const MOOD_COLORS = {
  energetic: '#10B981',
  focused: '#3B82F6',
  creative: '#8B5CF6',
  struggling: '#EF4444',
  inspired: '#F59E0B'
};

const TIMEFRAME_OPTIONS = [
  { value: 'week', label: 'This Week', icon: Calendar },
  { value: 'month', label: 'This Month', icon: Calendar },
  { value: 'quarter', label: 'Quarter', icon: Calendar },
  { value: 'year', label: 'Year', icon: Calendar }
];

export const PersonalWritingAnalytics: React.FC<PersonalWritingAnalyticsProps> = ({
  userId,
  timeframe,
  onTimeframeChange,
  className
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [showCelebration, setShowCelebration] = useState(false);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe, userId]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const analytics = personalAICoach.getPersonalAnalytics(timeframe);
      const streak = personalAICoach.getWritingStreak();
      const goals = personalAICoach.getPersonalGoals();
      const insights = personalAICoach.generatePersonalInsights();

      // Transform data for charts
      const data: AnalyticsData = {
        productivity: {
          totalWords: analytics.totalWords,
          averageSession: Math.round(analytics.averageSessionLength),
          longestSession: 120, // Would come from session data
          totalSessions: 15, // Would come from session data
          streak: streak.currentStreak,
          weeklyTrend: analytics.productivityTrend
        },
        quality: {
          averageRating: 7.5, // Would come from session ratings
          improvementTrend: analytics.qualityTrend,
          consistencyScore: analytics.consistencyScore * 100,
          styleEvolution: 85 // Would be calculated from style analysis
        },
        habits: {
          peakHours: analytics.peakProductivityHours,
          preferredDuration: analytics.averageSessionLength,
          mostProductiveMood: Object.entries(analytics.moodCorrelations)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'focused',
          distractionRate: 15 // Would come from session data
        },
        goals: {
          completed: goals.filter(g => g.current >= g.target).length,
          inProgress: goals.filter(g => g.current < g.target).length,
          completionRate: goals.length > 0 ? 
            (goals.filter(g => g.current >= g.target).length / goals.length) * 100 : 0,
          averageTimeToComplete: 14 // days, would be calculated
        },
        insights: {
          strengthAreas: insights.filter(i => i.category === 'strength').map(i => i.insight),
          improvementAreas: insights.filter(i => i.category === 'improvement').map(i => i.insight),
          personalityMatch: 85, // Would come from AI analysis
          creativityIndex: 78 // Would be calculated from content analysis
        }
      };

      setAnalyticsData(data);

      // Show celebration for achievements
      if (data.goals.completed > 0 || data.productivity.streak >= 7) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate chart data
  const productivityChartData = useMemo(() => {
    if (!analyticsData) return [];
    
    // Generate sample weekly data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      words: Math.floor(Math.random() * 800) + 200,
      sessions: Math.floor(Math.random() * 3) + 1,
      quality: Math.floor(Math.random() * 3) + 7
    }));
  }, [analyticsData, timeframe]);

  const moodDistributionData = useMemo(() => {
    if (!analyticsData) return [];
    
    return [
      { name: 'Focused', value: 35, color: MOOD_COLORS.focused },
      { name: 'Creative', value: 25, color: MOOD_COLORS.creative },
      { name: 'Energetic', value: 20, color: MOOD_COLORS.energetic },
      { name: 'Inspired', value: 15, color: MOOD_COLORS.inspired },
      { name: 'Struggling', value: 5, color: MOOD_COLORS.struggling }
    ];
  }, [analyticsData]);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Words Written"
          value={analyticsData?.productivity.totalWords || 0}
          change={analyticsData?.productivity.weeklyTrend || 0}
          icon={PenTool}
          format="number"
        />
        <MetricCard
          title="Writing Streak"
          value={analyticsData?.productivity.streak || 0}
          suffix="days"
          icon={Award}
          highlight={analyticsData?.productivity.streak >= 7}
        />
        <MetricCard
          title="Quality Score"
          value={analyticsData?.quality.averageRating || 0}
          suffix="/10"
          change={analyticsData?.quality.improvementTrend || 0}
          icon={Star}
          format="decimal"
        />
        <MetricCard
          title="Goal Completion"
          value={analyticsData?.goals.completionRate || 0}
          suffix="%"
          icon={Target}
          format="percentage"
        />
      </div>

      {/* Productivity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Writing Productivity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productivityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="words" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Personal Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData?.insights.strengthAreas.slice(0, 3).map((strength, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-green-700">{strength}</p>
              </div>
            ))}
            {analyticsData?.insights.improvementAreas.slice(0, 2).map((area, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-orange-700">{area}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Writing Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Peak Writing Hours</p>
              <div className="flex gap-2 mt-1">
                {analyticsData?.habits.peakHours.map(hour => (
                  <Badge key={hour} variant="outline">{hour}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Most Productive Mood</p>
              <Badge 
                className="mt-1" 
                style={{ 
                  backgroundColor: MOOD_COLORS[analyticsData?.habits.mostProductiveMood as keyof typeof MOOD_COLORS] + '20',
                  color: MOOD_COLORS[analyticsData?.habits.mostProductiveMood as keyof typeof MOOD_COLORS]
                }}
              >
                {analyticsData?.habits.mostProductiveMood}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Preferred Session Length</p>
              <p className="text-lg font-bold">{analyticsData?.habits.preferredDuration} min</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProductivityTab = () => (
    <div className="space-y-6">
      {/* Detailed Productivity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Word Count</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productivityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="words" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={productivityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[6, 10]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Session</p>
                <p className="text-2xl font-bold">{analyticsData?.productivity.averageSession}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{analyticsData?.productivity.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longest Session</p>
                <p className="text-2xl font-bold">{analyticsData?.productivity.longestSession}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHabitsTab = () => (
    <div className="space-y-6">
      {/* Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Writing Mood Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={moodDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {moodDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Habits Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Peak Hours</p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = `${i}:00`;
                  const isPeak = analyticsData?.habits.peakHours.includes(hour);
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "text-center py-1 px-2 rounded text-xs",
                        isPeak ? "bg-blue-500 text-white" : "bg-muted"
                      )}
                    >
                      {hour}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Distraction Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${analyticsData?.habits.distractionRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analyticsData?.habits.distractionRate}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Consistency Score</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${analyticsData?.quality.consistencyScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round(analyticsData?.quality.consistencyScore || 0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-6">
      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Completed Goals"
          value={analyticsData?.goals.completed || 0}
          icon={Target}
          highlight={analyticsData?.goals.completed > 0}
        />
        <MetricCard
          title="In Progress"
          value={analyticsData?.goals.inProgress || 0}
          icon={Activity}
        />
        <MetricCard
          title="Completion Rate"
          value={analyticsData?.goals.completionRate || 0}
          suffix="%"
          icon={TrendingUp}
          format="percentage"
        />
      </div>

      {/* Goal Progress Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Current Goals Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalAICoach.getPersonalGoals().slice(0, 5).map(goal => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{goal.description}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      goal.current >= goal.target ? "bg-green-500" : "bg-blue-500"
                    )}
                    style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={cn("personal-writing-analytics space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Writing Analytics</h1>
          <p className="text-muted-foreground">Track your progress and discover insights</p>
        </div>
        
        <div className="flex items-center gap-2">
          {TIMEFRAME_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={timeframe === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeframeChange?.(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
        <TabsContent value="productivity">{renderProductivityTab()}</TabsContent>
        <TabsContent value="habits">{renderHabitsTab()}</TabsContent>
        <TabsContent value="goals">{renderGoalsTab()}</TabsContent>
      </Tabs>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg shadow-lg"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Achievement Unlocked!</p>
                  <p className="text-sm opacity-90">Keep up the amazing work!</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  suffix?: string;
  icon: React.ComponentType<any>;
  format?: 'number' | 'decimal' | 'percentage';
  highlight?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  suffix = '',
  icon: Icon,
  format = 'number',
  highlight = false
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'decimal':
        return val.toFixed(1);
      case 'percentage':
        return Math.round(val);
      default:
        return val.toLocaleString();
    }
  };

  return (
    <Card className={cn("transition-all duration-200", highlight && "ring-2 ring-yellow-400")}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-lg",
            highlight ? "bg-yellow-100" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              highlight ? "text-yellow-600" : "text-primary"
            )} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {formatValue(value)}{suffix}
              </p>
              {change !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : change < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalWritingAnalytics;