/**
 * Productivity Dashboard - Analytics and insights for writing productivity
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Clock, 
  BookOpen, 
  PenTool, 
  Award, 
  Flame,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Trophy,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Import services
import progressTrackerService from '@/services/progressTracker';
import habitTrackerService from '@/services/habitTracker';
import personalAchievementsService from '@/services/personalAchievements';
import personalGoalSettingService from '@/services/personalGoalSetting';
import writingMasteryService from '@/services/writingMastery';

interface WritingMetrics {
  dailyWordCount: number;
  weeklyWordCount: number;
  monthlyWordCount: number;
  totalWordCount: number;
  averageSessionLength: number;
  writingStreak: number;
  todayProgress: number;
  weeklyGoal: number;
  monthlyGoal: number;
}

interface ProductivityInsight {
  id: string;
  type: 'achievement' | 'trend' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
  importance: 'high' | 'medium' | 'low';
  timestamp: number;
}

interface WritingHabit {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  streak: number;
  isActive: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: 'writing' | 'productivity' | 'learning' | 'wellness';
}

export function ProductivityDashboard() {
  const [metrics, setMetrics] = useState<WritingMetrics>({
    dailyWordCount: 1247,
    weeklyWordCount: 8934,
    monthlyWordCount: 34567,
    totalWordCount: 156789,
    averageSessionLength: 45,
    writingStreak: 12,
    todayProgress: 67,
    weeklyGoal: 10000,
    monthlyGoal: 50000
  });

  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [habits, setHabits] = useState<WritingHabit[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadProductivityData();
  }, []);

  const loadProductivityData = async () => {
    // Load insights
    const insightsList: ProductivityInsight[] = [
      {
        id: '1',
        type: 'achievement',
        title: 'Writing Streak Milestone',
        description: 'Congratulations! You\'ve maintained a 12-day writing streak.',
        value: '12 days',
        importance: 'high',
        timestamp: Date.now()
      },
      {
        id: '2',
        type: 'trend',
        title: 'Productivity Increase',
        description: 'Your writing speed has increased by 15% this week.',
        value: '+15%',
        trend: 'up',
        importance: 'medium',
        timestamp: Date.now() - 86400000
      },
      {
        id: '3',
        type: 'recommendation',
        title: 'Optimal Writing Time',
        description: 'You\'re most productive between 9-11 AM. Schedule important writing sessions during this time.',
        importance: 'medium',
        timestamp: Date.now() - 172800000
      },
      {
        id: '4',
        type: 'milestone',
        title: 'Monthly Goal Progress',
        description: 'You\'re 69% towards your monthly word count goal. Keep it up!',
        value: '69%',
        importance: 'high',
        timestamp: Date.now() - 259200000
      }
    ];

    const habitsList: WritingHabit[] = [
      {
        id: '1',
        name: 'Daily Writing',
        description: 'Write at least 500 words every day',
        targetValue: 500,
        currentValue: 1247,
        streak: 12,
        isActive: true,
        frequency: 'daily',
        category: 'writing'
      },
      {
        id: '2',
        name: 'Morning Pages',
        description: 'Write 3 pages of stream-of-consciousness every morning',
        targetValue: 3,
        currentValue: 3,
        streak: 8,
        isActive: true,
        frequency: 'daily',
        category: 'productivity'
      },
      {
        id: '3',
        name: 'Reading Time',
        description: 'Read for at least 30 minutes daily',
        targetValue: 30,
        currentValue: 45,
        streak: 15,
        isActive: true,
        frequency: 'daily',
        category: 'learning'
      },
      {
        id: '4',
        name: 'Writing Break',
        description: 'Take a 5-minute break every hour while writing',
        targetValue: 5,
        currentValue: 4,
        streak: 6,
        isActive: true,
        frequency: 'daily',
        category: 'wellness'
      }
    ];

    setInsights(insightsList);
    setHabits(habitsList);
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'writing': return 'bg-purple-500';
      case 'productivity': return 'bg-green-500';
      case 'learning': return 'bg-blue-500';
      case 'wellness': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Words</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dailyWordCount.toLocaleString()}</div>
            <Progress value={metrics.todayProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{metrics.todayProgress}% of daily goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Writing Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.writingStreak}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageSessionLength}m</div>
            <p className="text-xs text-muted-foreground">per writing session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalWordCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Towards Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Progress towards your weekly writing goal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Words Written</span>
                  <span>{metrics.weeklyWordCount.toLocaleString()} / {metrics.weeklyGoal.toLocaleString()}</span>
                </div>
                <Progress value={(metrics.weeklyWordCount / metrics.weeklyGoal) * 100} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((metrics.weeklyWordCount / metrics.weeklyGoal) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Progress</CardTitle>
            <CardDescription>Progress towards your monthly writing goal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Words Written</span>
                  <span>{metrics.monthlyWordCount.toLocaleString()} / {metrics.monthlyGoal.toLocaleString()}</span>
                </div>
                <Progress value={(metrics.monthlyWordCount / metrics.monthlyGoal) * 100} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((metrics.monthlyWordCount / metrics.monthlyGoal) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Insights</CardTitle>
          <CardDescription>AI-powered insights about your writing productivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {insight.type === 'achievement' && <Award className="h-5 w-5 text-yellow-500" />}
                  {insight.type === 'trend' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {insight.type === 'recommendation' && <Zap className="h-5 w-5 text-blue-500" />}
                  {insight.type === 'milestone' && <Trophy className="h-5 w-5 text-purple-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    {insight.trend && getTrendIcon(insight.trend)}
                    {insight.value && (
                      <Badge variant="secondary" className="text-xs">
                        {insight.value}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                </div>
                <Badge 
                  className={`text-white text-xs ${getImportanceColor(insight.importance)}`}
                >
                  {insight.importance}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHabits = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Writing Habits</h2>
          <p className="text-muted-foreground">Track and maintain your writing habits</p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          Add Habit
        </Button>
      </div>

      <div className="grid gap-4">
        {habits.map((habit) => (
          <Card key={habit.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{habit.name}</CardTitle>
                  <CardDescription>{habit.description}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`text-white ${getCategoryColor(habit.category)}`}>
                    {habit.category}
                  </Badge>
                  <Badge variant={habit.isActive ? "default" : "secondary"}>
                    {habit.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{habit.currentValue} / {habit.targetValue}</span>
                  </div>
                  <Progress value={(habit.currentValue / habit.targetValue) * 100} />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">{habit.streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      {habit.currentValue >= habit.targetValue ? 'Completed today' : 'In progress'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>Comprehensive writing analytics and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>Advanced analytics charts will be available here</p>
              <p className="text-sm">Coming soon with interactive charts and detailed metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productivity Dashboard</h1>
          <p className="text-muted-foreground">
            Track your writing progress, habits, and achieve your goals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Set Goals
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          {renderHabits()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalytics()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {insight.type === 'achievement' && <Award className="h-5 w-5 text-yellow-500" />}
                      {insight.type === 'trend' && <TrendingUp className="h-5 w-5 text-green-500" />}
                      {insight.type === 'recommendation' && <Zap className="h-5 w-5 text-blue-500" />}
                      {insight.type === 'milestone' && <Trophy className="h-5 w-5 text-purple-500" />}
                      <CardTitle>{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {insight.trend && getTrendIcon(insight.trend)}
                      {insight.value && (
                        <Badge variant="secondary">
                          {insight.value}
                        </Badge>
                      )}
                      <Badge className={`text-white ${getImportanceColor(insight.importance)}`}>
                        {insight.importance}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}