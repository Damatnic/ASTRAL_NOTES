import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, Target, Brain, Heart, BookOpen, Award, BarChart3, Clock, Star, Lightbulb, CheckCircle, AlertCircle, PlusCircle, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';

interface ReflectionEntry {
  id: string;
  date: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'project' | 'milestone' | 'breakthrough';
  title: string;
  content: string;
  mood: 'struggling' | 'neutral' | 'satisfied' | 'excited' | 'inspired';
  energyLevel: number;
  achievements: string[];
  challenges: string[];
  learnings: string[];
  goals: string[];
  gratitude: string[];
  tomorrowFocus: string[];
  tags: string[];
  isPrivate: boolean;
  wordCount?: number;
  writingQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  creativeBreakthroughs?: string[];
  skillsImproved?: string[];
  personalGrowth?: string[];
}

interface GrowthMetric {
  id: string;
  category: 'writing_skill' | 'creativity' | 'productivity' | 'mindset' | 'habits' | 'goals';
  name: string;
  description: string;
  currentLevel: number;
  previousLevel: number;
  maxLevel: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
  milestones: GrowthMilestone[];
  personalNotes: string;
}

interface GrowthMilestone {
  level: number;
  title: string;
  description: string;
  achieved: boolean;
  achievedDate?: Date;
  celebrationNote?: string;
}

interface PersonalInsight {
  id: string;
  type: 'pattern' | 'strength' | 'opportunity' | 'breakthrough' | 'warning' | 'celebration';
  category: 'writing' | 'creativity' | 'productivity' | 'wellness' | 'goals' | 'personal';
  insight: string;
  evidence: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations: string[];
  dateDiscovered: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  acknowledged: boolean;
  appliedActions: string[];
}

interface WritingJourney {
  startDate: Date;
  totalDays: number;
  totalEntries: number;
  totalWords: number;
  completedProjects: number;
  skillsLearned: string[];
  majorBreakthroughs: string[];
  challengesOvercome: string[];
  currentStreak: number;
  longestStreak: number;
  favoriteGenres: string[];
  growthAreas: string[];
  personalPhilosophy: string;
  futurePlans: string[];
}

const PersonalReflectionDashboard: React.FC = () => {
  const [reflectionEntries, setReflectionEntries] = useState<ReflectionEntry[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetric[]>([]);
  const [personalInsights, setPersonalInsights] = useState<PersonalInsight[]>([]);
  const [writingJourney, setWritingJourney] = useState<WritingJourney | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reflections' | 'growth' | 'insights' | 'journey'>('overview');
  const [showNewReflectionModal, setShowNewReflectionModal] = useState(false);
  const [selectedReflection, setSelectedReflection] = useState<ReflectionEntry | null>(null);
  const [reflectionFilter, setReflectionFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'project' | 'milestone' | 'breakthrough'>('all');
  const [insightFilter, setInsightFilter] = useState<'all' | 'unacknowledged' | 'actionable' | 'high_priority'>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [showPrivateEntries, setShowPrivateEntries] = useState(true);

  useEffect(() => {
    loadReflectionData();
    generateSampleData();
  }, []);

  const loadReflectionData = () => {
    // Load data from localStorage or API
    try {
      const storedEntries = localStorage.getItem('reflection_entries');
      if (storedEntries) {
        const entries = JSON.parse(storedEntries).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
        setReflectionEntries(entries);
      }

      const storedMetrics = localStorage.getItem('growth_metrics');
      if (storedMetrics) {
        const metrics = JSON.parse(storedMetrics).map((metric: any) => ({
          ...metric,
          lastUpdated: new Date(metric.lastUpdated),
          milestones: metric.milestones.map((milestone: any) => ({
            ...milestone,
            achievedDate: milestone.achievedDate ? new Date(milestone.achievedDate) : undefined
          }))
        }));
        setGrowthMetrics(metrics);
      }

      const storedInsights = localStorage.getItem('personal_insights');
      if (storedInsights) {
        const insights = JSON.parse(storedInsights).map((insight: any) => ({
          ...insight,
          dateDiscovered: new Date(insight.dateDiscovered)
        }));
        setPersonalInsights(insights);
      }

      const storedJourney = localStorage.getItem('writing_journey');
      if (storedJourney) {
        const journey = JSON.parse(storedJourney);
        journey.startDate = new Date(journey.startDate);
        setWritingJourney(journey);
      }
    } catch (error) {
      console.error('Error loading reflection data:', error);
    }
  };

  const generateSampleData = () => {
    // Generate sample data if none exists
    if (reflectionEntries.length === 0) {
      const sampleEntries: ReflectionEntry[] = [
        {
          id: 'entry_1',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          type: 'daily',
          title: 'Productive Writing Day',
          content: 'Had a really good writing session today. The words flowed more naturally and I felt connected to my characters.',
          mood: 'satisfied',
          energyLevel: 8,
          achievements: ['Completed Chapter 3', 'Developed character backstory'],
          challenges: ['Struggled with dialogue pacing'],
          learnings: ['Character motivation drives better dialogue'],
          goals: ['Write 1000 words tomorrow', 'Outline next chapter'],
          gratitude: ['Quiet morning time', 'Supportive writing community'],
          tomorrowFocus: ['Character development', 'Plot advancement'],
          tags: ['writing', 'character development', 'productivity'],
          isPrivate: false,
          wordCount: 1200,
          writingQuality: 'good'
        },
        {
          id: 'entry_2',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          type: 'weekly',
          title: 'Week in Review: Finding My Voice',
          content: 'This week was about discovering my authentic writing voice. I experimented with different styles and found what feels most natural.',
          mood: 'inspired',
          energyLevel: 9,
          achievements: ['Found unique voice', 'Completed 3 short stories', 'Joined writing group'],
          challenges: ['Time management', 'Self-doubt'],
          learnings: ['Authenticity resonates more than perfection', 'Community support is invaluable'],
          goals: ['Maintain writing schedule', 'Share work with group'],
          gratitude: ['Writing mentors', 'Creative freedom', 'Personal growth'],
          tomorrowFocus: ['Continue voice development', 'New story ideas'],
          tags: ['voice', 'community', 'growth'],
          isPrivate: false,
          wordCount: 4500,
          writingQuality: 'excellent',
          creativeBreakthroughs: ['Found personal writing style', 'Overcame perfectionism'],
          skillsImproved: ['Voice development', 'Character creation'],
          personalGrowth: ['Increased confidence', 'Better self-acceptance']
        }
      ];
      setReflectionEntries(sampleEntries);
    }

    if (growthMetrics.length === 0) {
      const sampleMetrics: GrowthMetric[] = [
        {
          id: 'metric_1',
          category: 'writing_skill',
          name: 'Character Development',
          description: 'Ability to create compelling, multi-dimensional characters',
          currentLevel: 7,
          previousLevel: 5,
          maxLevel: 10,
          trend: 'improving',
          lastUpdated: new Date(),
          milestones: [
            { level: 3, title: 'Basic Characters', description: 'Create simple character profiles', achieved: true, achievedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            { level: 5, title: 'Character Arcs', description: 'Develop character growth throughout story', achieved: true, achievedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
            { level: 7, title: 'Complex Characters', description: 'Create multi-layered characters with internal conflicts', achieved: true, achievedDate: new Date() },
            { level: 10, title: 'Master Characterization', description: 'Characters feel completely real and memorable', achieved: false }
          ],
          personalNotes: 'Major breakthrough in understanding character motivation this month'
        },
        {
          id: 'metric_2',
          category: 'productivity',
          name: 'Daily Writing Consistency',
          description: 'Ability to maintain regular writing practice',
          currentLevel: 8,
          previousLevel: 6,
          maxLevel: 10,
          trend: 'improving',
          lastUpdated: new Date(),
          milestones: [
            { level: 3, title: 'Weekly Writer', description: 'Write at least 3 times per week', achieved: true },
            { level: 5, title: 'Daily Practice', description: 'Write something every day for a month', achieved: true },
            { level: 8, title: 'Consistent Creator', description: 'Maintain daily writing for 3 months', achieved: true, achievedDate: new Date() },
            { level: 10, title: 'Writing Machine', description: 'Effortless daily writing habit for a year', achieved: false }
          ],
          personalNotes: 'Morning writing routine has been game-changing'
        }
      ];
      setGrowthMetrics(sampleMetrics);
    }

    if (personalInsights.length === 0) {
      const sampleInsights: PersonalInsight[] = [
        {
          id: 'insight_1',
          type: 'pattern',
          category: 'productivity',
          insight: 'You write 40% more effectively during morning hours',
          evidence: ['Average morning word count: 850', 'Average afternoon word count: 610', 'Consistent pattern over 30 days'],
          confidence: 0.9,
          impact: 'high',
          actionable: true,
          recommendations: ['Schedule important writing during morning hours', 'Protect morning time from distractions', 'Use afternoons for editing and planning'],
          dateDiscovered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          priority: 'high',
          acknowledged: false,
          appliedActions: []
        },
        {
          id: 'insight_2',
          type: 'strength',
          category: 'creativity',
          insight: 'Your creative breakthroughs often follow periods of struggle',
          evidence: ['3 major breakthroughs after challenging weeks', 'Pattern observed over 3 months', 'Quality increases significantly post-struggle'],
          confidence: 0.8,
          impact: 'medium',
          actionable: true,
          recommendations: ['Embrace difficult periods as growth opportunities', 'Document struggles to recognize patterns', 'Trust the creative process'],
          dateDiscovered: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          acknowledged: true,
          appliedActions: ['Started struggle documentation', 'Reframed difficult periods']
        }
      ];
      setPersonalInsights(sampleInsights);
    }

    if (!writingJourney) {
      const sampleJourney: WritingJourney = {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        totalDays: 365,
        totalEntries: 89,
        totalWords: 125000,
        completedProjects: 5,
        skillsLearned: ['Character Development', 'Plot Structure', 'Dialogue Writing', 'World Building'],
        majorBreakthroughs: ['Found unique voice', 'Overcame perfectionism', 'Developed consistent routine'],
        challengesOvercome: ['Writer\'s block', 'Self-doubt', 'Time management', 'Perfectionism'],
        currentStreak: 23,
        longestStreak: 45,
        favoriteGenres: ['Fantasy', 'Science Fiction', 'Literary Fiction'],
        growthAreas: ['Character Development', 'Dialogue', 'World Building'],
        personalPhilosophy: 'Writing is a journey of self-discovery and authentic expression',
        futurePlans: ['Complete first novel', 'Join writing workshop', 'Explore new genres']
      };
      setWritingJourney(sampleJourney);
    }
  };

  const filteredReflections = reflectionEntries.filter(entry => {
    if (reflectionFilter !== 'all' && entry.type !== reflectionFilter) return false;
    if (!showPrivateEntries && entry.isPrivate) return false;
    
    // Time range filter
    const now = new Date();
    const entryDate = entry.date;
    switch (timeRange) {
      case 'week':
        return entryDate > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return entryDate > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return entryDate > new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return entryDate > new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });

  const filteredInsights = personalInsights.filter(insight => {
    switch (insightFilter) {
      case 'unacknowledged':
        return !insight.acknowledged;
      case 'actionable':
        return insight.actionable;
      case 'high_priority':
        return insight.priority === 'high' || insight.priority === 'urgent';
      default:
        return true;
    }
  });

  const getMoodIcon = (mood: ReflectionEntry['mood']) => {
    switch (mood) {
      case 'struggling': return '😔';
      case 'neutral': return '😐';
      case 'satisfied': return '😊';
      case 'excited': return '😄';
      case 'inspired': return '🤩';
      default: return '😐';
    }
  };

  const getInsightIcon = (type: PersonalInsight['type']) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="w-4 h-4" />;
      case 'strength': return <Award className="w-4 h-4" />;
      case 'opportunity': return <Target className="w-4 h-4" />;
      case 'breakthrough': return <Lightbulb className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'celebration': return <Star className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: PersonalInsight['type']) => {
    switch (type) {
      case 'pattern': return 'text-blue-600 bg-blue-50';
      case 'strength': return 'text-green-600 bg-green-50';
      case 'opportunity': return 'text-purple-600 bg-purple-50';
      case 'breakthrough': return 'text-yellow-600 bg-yellow-50';
      case 'warning': return 'text-red-600 bg-red-50';
      case 'celebration': return 'text-pink-600 bg-pink-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateGrowthTrend = (metrics: GrowthMetric[]) => {
    const totalGrowth = metrics.reduce((sum, metric) => sum + (metric.currentLevel - metric.previousLevel), 0);
    const avgGrowth = totalGrowth / metrics.length;
    return avgGrowth > 0.5 ? 'improving' : avgGrowth < -0.5 ? 'declining' : 'stable';
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Recent Reflections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 col-span-1 lg:col-span-2"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Recent Reflections
          </h3>
          <button
            onClick={() => setShowNewReflectionModal(true)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {filteredReflections.slice(0, 3).map((entry) => (
            <motion.div
              key={entry.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setSelectedReflection(entry)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{entry.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getMoodIcon(entry.mood)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.date.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {entry.content}
              </p>
              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{entry.achievements.length} achievements</span>
                <span>{entry.learnings.length} learnings</span>
                {entry.wordCount && <span>{entry.wordCount} words</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Growth Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Growth Overview
        </h3>
        <div className="space-y-4">
          {growthMetrics.slice(0, 3).map((metric) => (
            <div key={metric.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.currentLevel}/{metric.maxLevel}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(metric.currentLevel / metric.maxLevel) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-blue-600 h-2 rounded-full"
                />
              </div>
              {metric.trend === 'improving' && (
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{metric.currentLevel - metric.previousLevel} levels
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 col-span-1 lg:col-span-2 xl:col-span-1"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          Key Insights
        </h3>
        <div className="space-y-3">
          {filteredInsights.slice(0, 3).map((insight) => (
            <div
              key={insight.id}
              className={`p-3 rounded-lg ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  {getInsightIcon(insight.type)}
                  <span className="ml-2 text-xs font-medium uppercase tracking-wide">
                    {insight.type}
                  </span>
                </div>
                {!insight.acknowledged && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              <p className="text-sm">{insight.insight}</p>
              <div className="mt-2 text-xs opacity-75">
                Confidence: {Math.round(insight.confidence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Writing Journey Stats */}
      {writingJourney && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 col-span-1 lg:col-span-2 xl:col-span-3"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Writing Journey
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {writingJourney.totalDays}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Days Writing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {writingJourney.totalWords.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {writingJourney.completedProjects}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Projects Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {writingJourney.currentStreak}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {writingJourney.skillsLearned.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Skills Learned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {writingJourney.majorBreakthroughs.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Breakthroughs</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderReflectionsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
            <select
              value={reflectionFilter}
              onChange={(e) => setReflectionFilter(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="project">Project</option>
              <option value="milestone">Milestone</option>
              <option value="breakthrough">Breakthrough</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
              <option value="year">Past Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button
            onClick={() => setShowPrivateEntries(!showPrivateEntries)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
              showPrivateEntries 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {showPrivateEntries ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Private Entries</span>
          </button>
          <button
            onClick={() => setShowNewReflectionModal(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Reflection</span>
          </button>
        </div>
      </div>

      {/* Reflections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredReflections.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedReflection(entry)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getMoodIcon(entry.mood)}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full uppercase tracking-wide">
                    {entry.type}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {entry.isPrivate && <EyeOff className="w-4 h-4 text-gray-400" />}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.date.toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                {entry.title}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {entry.content}
              </p>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="text-center">
                  <div className="font-medium text-green-600 dark:text-green-400">
                    {entry.achievements.length}
                  </div>
                  <div>Achievements</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    {entry.learnings.length}
                  </div>
                  <div>Learnings</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-600 dark:text-purple-400">
                    {entry.goals.length}
                  </div>
                  <div>Goals</div>
                </div>
              </div>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{entry.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderGrowthTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {growthMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{metric.name}</h3>
              <div className={`flex items-center text-sm ${
                metric.trend === 'improving' ? 'text-green-600 dark:text-green-400' :
                metric.trend === 'declining' ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                <TrendingUp className={`w-4 h-4 mr-1 ${metric.trend === 'declining' ? 'rotate-180' : ''}`} />
                {metric.trend}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{metric.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Level {metric.currentLevel}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {metric.maxLevel}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(metric.currentLevel / metric.maxLevel) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                />
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Progress: +{metric.currentLevel - metric.previousLevel} levels
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Milestones</h4>
              {metric.milestones.map((milestone) => (
                <div
                  key={milestone.level}
                  className={`flex items-center space-x-2 text-sm ${
                    milestone.achieved ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 ${milestone.achieved ? 'text-green-600' : 'text-gray-300'}`} />
                  <span>Level {milestone.level}: {milestone.title}</span>
                </div>
              ))}
            </div>

            {metric.personalNotes && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">{metric.personalNotes}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Insight Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</label>
            <select
              value={insightFilter}
              onChange={(e) => setInsightFilter(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Insights</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="actionable">Actionable</option>
              <option value="high_priority">High Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
              !insight.acknowledged ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {insight.type} • {insight.category}
                    </span>
                    {!insight.acknowledged && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {insight.insight}
                  </h3>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {insight.dateDiscovered.toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(insight.confidence * 100)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Confidence</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  insight.impact === 'high' ? 'text-red-600 dark:text-red-400' :
                  insight.impact === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {insight.impact.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Impact</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  insight.priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
                  insight.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                  insight.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {insight.priority.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Priority</div>
              </div>
            </div>

            {insight.evidence.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Evidence:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {insight.evidence.map((evidence, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.recommendations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Recommendations:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.appliedActions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Applied Actions:</h4>
                <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                  {insight.appliedActions.map((action, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {insight.actionable && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                    Actionable
                  </span>
                )}
              </div>
              {!insight.acknowledged && (
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Acknowledge
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderJourneyTab = () => (
    writingJourney && (
      <div className="space-y-6">
        {/* Journey Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Your Writing Journey</h2>
          <p className="text-blue-100 mb-4">
            Started {writingJourney.startDate.toLocaleDateString()} • {writingJourney.totalDays} days ago
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-3xl font-bold">{writingJourney.totalWords.toLocaleString()}</div>
              <div className="text-blue-100">Total Words</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{writingJourney.totalEntries}</div>
              <div className="text-blue-100">Reflections</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{writingJourney.completedProjects}</div>
              <div className="text-blue-100">Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{writingJourney.currentStreak}</div>
              <div className="text-blue-100">Current Streak</div>
            </div>
          </div>
        </motion.div>

        {/* Skills & Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Skills Learned
            </h3>
            <div className="space-y-3">
              {writingJourney.skillsLearned.map((skill, index) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Major Breakthroughs
            </h3>
            <div className="space-y-3">
              {writingJourney.majorBreakthroughs.map((breakthrough, index) => (
                <motion.div
                  key={breakthrough}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">{breakthrough}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Philosophy & Future */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Personal Philosophy
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-lg italic mb-6">
            "{writingJourney.personalPhilosophy}"
          </p>
          
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Future Plans</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {writingJourney.futurePlans.map((plan, index) => (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300">{plan}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Personal Reflection Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your writing journey, growth, and insights
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'reflections', label: 'Reflections', icon: BookOpen },
              { id: 'growth', label: 'Growth', icon: TrendingUp },
              { id: 'insights', label: 'Insights', icon: Brain },
              { id: 'journey', label: 'Journey', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'reflections' && renderReflectionsTab()}
            {activeTab === 'growth' && renderGrowthTab()}
            {activeTab === 'insights' && renderInsightsTab()}
            {activeTab === 'journey' && renderJourneyTab()}
          </motion.div>
        </AnimatePresence>

        {/* Reflection Detail Modal */}
        <AnimatePresence>
          {selectedReflection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedReflection(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getMoodIcon(selectedReflection.mood)}</span>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedReflection.title}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                          {selectedReflection.date.toLocaleDateString()} • {selectedReflection.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReflection(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Edit3 className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="prose dark:prose-invert max-w-none mb-6">
                    <p>{selectedReflection.content}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedReflection.achievements.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          Achievements
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {selectedReflection.achievements.map((achievement, i) => (
                            <li key={i}>• {achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReflection.challenges.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Challenges
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {selectedReflection.challenges.map((challenge, i) => (
                            <li key={i}>• {challenge}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReflection.learnings.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-1" />
                          Learnings
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {selectedReflection.learnings.map((learning, i) => (
                            <li key={i}>• {learning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReflection.goals.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Goals
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {selectedReflection.goals.map((goal, i) => (
                            <li key={i}>• {goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReflection.gratitude.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-pink-600 dark:text-pink-400 mb-2 flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          Gratitude
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {selectedReflection.gratitude.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReflection.tomorrowFocus.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Tomorrow's Focus
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {selectedReflection.tomorrowFocus.map((focus, i) => (
                            <li key={i}>• {focus}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {selectedReflection.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {selectedReflection.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PersonalReflectionDashboard;