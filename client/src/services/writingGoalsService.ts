/**
 * Writing Goals & Tracking Service
 * Comprehensive goal setting, progress tracking, and productivity analytics
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export interface WritingGoal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project' | 'custom';
  targetType: 'words' | 'time' | 'pages' | 'chapters' | 'scenes';
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  projectId?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  streak: number;
  bestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WritingSession {
  id: string;
  goalId?: string;
  projectId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  wordsWritten: number;
  pagesWritten: number;
  mood: 'frustrated' | 'neutral' | 'motivated' | 'inspired' | 'focused';
  quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  interruptions: number;
  distractions: string[];
  achievements: string[];
}

export interface WritingHabit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetValue: number;
  currentStreak: number;
  bestStreak: number;
  isActive: boolean;
  lastCompleted?: Date;
  completionHistory: Date[];
}

export interface ProductivityMetrics {
  totalWordsWritten: number;
  totalTimeSpent: number; // in minutes
  averageWordsPerMinute: number;
  averageSessionLength: number;
  totalSessions: number;
  goalsCompleted: number;
  currentStreak: number;
  bestDay: {
    date: Date;
    wordsWritten: number;
  };
  productivityScore: number; // 0-100
  trends: {
    wordsPerDay: Array<{ date: Date; count: number }>;
    timePerDay: Array<{ date: Date; minutes: number }>;
    moodTrends: Array<{ date: Date; mood: WritingSession['mood'] }>;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'milestone' | 'productivity' | 'consistency' | 'quality';
  icon: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
  requirements: {
    type: string;
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface WritingInsight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'suggestion';
  title: string;
  message: string;
  actionable?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  createdAt: Date;
  isRead: boolean;
}

class WritingGoalsService extends BrowserEventEmitter {
  private goals: WritingGoal[] = [];
  private sessions: WritingSession[] = [];
  private habits: WritingHabit[] = [];
  private achievements: Achievement[] = [];
  private insights: WritingInsight[] = [];
  private currentSession: WritingSession | null = null;
  private storageKey = 'astral_notes_writing_goals';
  private saveTimeoutId: number | null = null;
  private batchOperationInProgress = false;

  constructor() {
    super();
    this.loadData();
    this.initializeAchievements();
    this.startDailyTracking();
  }

  // Goal Management
  createGoal(goalData: Omit<WritingGoal, 'id' | 'currentValue' | 'streak' | 'bestStreak' | 'createdAt' | 'updatedAt'>): WritingGoal {
    const goal: WritingGoal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentValue: 0,
      streak: 0,
      bestStreak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.goals.push(goal);
    if (!this.batchOperationInProgress) {
      this.saveGoals();
    }
    this.emit('goalCreated', goal);
    this.generateInsights();
    return goal;
  }

  updateGoal(goalId: string, updates: Partial<WritingGoal>): WritingGoal | null {
    const goalIndex = this.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return null;

    const previousValue = this.goals[goalIndex].currentValue;
    this.goals[goalIndex] = {
      ...this.goals[goalIndex],
      ...updates,
      updatedAt: new Date()
    };

    // Check if goal was completed
    if (previousValue < this.goals[goalIndex].targetValue && 
        this.goals[goalIndex].currentValue >= this.goals[goalIndex].targetValue) {
      this.completeGoal(goalId);
    }

    if (!this.batchOperationInProgress) {
      this.saveGoals();
    }
    this.emit('goalUpdated', this.goals[goalIndex]);
    return this.goals[goalIndex];
  }

  deleteGoal(goalId: string): boolean {
    const goalIndex = this.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return false;

    const goal = this.goals[goalIndex];
    this.goals.splice(goalIndex, 1);
    this.saveGoals();
    this.emit('goalDeleted', { goalId, goal });
    return true;
  }

  getGoal(goalId: string): WritingGoal | null {
    return this.goals.find(g => g.id === goalId) || null;
  }

  getAllGoals(): WritingGoal[] {
    return [...this.goals];
  }

  getActiveGoals(): WritingGoal[] {
    return this.goals.filter(g => g.status === 'active');
  }

  getGoalsByProject(projectId: string): WritingGoal[] {
    return this.goals.filter(g => g.projectId === projectId);
  }

  completeGoal(goalId: string): void {
    const goal = this.getGoal(goalId);
    if (!goal) return;

    goal.status = 'completed';
    goal.updatedAt = new Date();
    this.saveGoals();
    this.emit('goalCompleted', goal);
    this.checkAchievements();
    this.generateCompletionInsight(goal);
  }

  // Session Management
  startSession(goalId?: string, projectId?: string): WritingSession {
    if (this.currentSession) {
      this.endSession();
    }

    this.currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      goalId,
      projectId,
      startTime: new Date(),
      duration: 0,
      wordsWritten: 0,
      pagesWritten: 0,
      mood: 'neutral',
      quality: 3,
      interruptions: 0,
      distractions: [],
      achievements: []
    };

    this.emit('sessionStarted', this.currentSession);
    return this.currentSession;
  }

  updateSession(updates: Partial<WritingSession>): WritingSession | null {
    if (!this.currentSession) return null;

    const previousWords = this.currentSession.wordsWritten;
    
    this.currentSession = {
      ...this.currentSession,
      ...updates
    };

    // Update duration
    if (this.currentSession.startTime && !this.currentSession.endTime) {
      this.currentSession.duration = Math.floor(
        (Date.now() - this.currentSession.startTime.getTime()) / (1000 * 60)
      );
    }

    // Update goals if words were added
    if (updates.wordsWritten && updates.wordsWritten > previousWords) {
      this.updateGoalsProgress(updates.wordsWritten - previousWords);
    }

    this.emit('sessionUpdated', this.currentSession);
    return this.currentSession;
  }

  endSession(): WritingSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.currentSession.duration = Math.floor(
      (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / (1000 * 60)
    );

    this.sessions.push({ ...this.currentSession });
    this.debouncedSave();
    
    const completedSession = { ...this.currentSession };
    this.currentSession = null;

    this.emit('sessionEnded', completedSession);
    this.checkAchievements();
    this.generateSessionInsights(completedSession);
    
    return completedSession;
  }

  getCurrentSession(): WritingSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  getAllSessions(): WritingSession[] {
    return [...this.sessions];
  }

  getSessionsByDateRange(startDate: Date, endDate: Date): WritingSession[] {
    return this.sessions.filter(s => 
      s.startTime >= startDate && s.startTime <= endDate
    );
  }

  // Habit Management
  createHabit(habitData: Omit<WritingHabit, 'id' | 'currentStreak' | 'bestStreak' | 'completionHistory'>): WritingHabit {
    const habit: WritingHabit = {
      ...habitData,
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentStreak: 0,
      bestStreak: 0,
      completionHistory: []
    };

    this.habits.push(habit);
    this.saveHabits();
    this.emit('habitCreated', habit);
    return habit;
  }

  completeHabit(habitId: string): boolean {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already completed today
    const alreadyCompleted = habit.completionHistory.some(date => {
      const completionDate = new Date(date);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === today.getTime();
    });

    if (alreadyCompleted) return false;

    habit.completionHistory.push(new Date());
    habit.lastCompleted = new Date();
    this.updateHabitStreak(habit);
    
    this.saveHabits();
    this.emit('habitCompleted', habit);
    this.checkAchievements();
    
    return true;
  }

  private updateHabitStreak(habit: WritingHabit): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const currentDate = new Date(today);

    // Count consecutive days backwards
    while (true) {
      const hasCompletion = habit.completionHistory.some(date => {
        const completionDate = new Date(date);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === currentDate.getTime();
      });

      if (hasCompletion) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    habit.currentStreak = streak;
    if (streak > habit.bestStreak) {
      habit.bestStreak = streak;
    }
  }

  // Analytics & Metrics
  getProductivityMetrics(dateRange?: { start: Date; end: Date }): ProductivityMetrics {
    let sessions = this.sessions;
    
    if (dateRange) {
      sessions = this.getSessionsByDateRange(dateRange.start, dateRange.end);
    }

    const totalWordsWritten = sessions.reduce((sum, s) => sum + s.wordsWritten, 0);
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.length;
    const goalsCompleted = this.goals.filter(g => g.status === 'completed').length;

    const averageWordsPerMinute = totalTimeSpent > 0 ? totalWordsWritten / totalTimeSpent : 0;
    const averageSessionLength = totalSessions > 0 ? totalTimeSpent / totalSessions : 0;

    // Find best day
    const dailyWords = this.groupSessionsByDay(sessions);
    const bestDay = Object.entries(dailyWords).reduce(
      (best, [date, words]) => words > best.wordsWritten ? { date: new Date(date), wordsWritten: words } : best,
      { date: new Date(), wordsWritten: 0 }
    );

    // Calculate current streak
    const currentStreak = this.calculateCurrentStreak();

    // Generate trends
    const trends = this.generateTrends(sessions);

    // Calculate productivity score (0-100)
    const productivityScore = this.calculateProductivityScore(sessions);

    return {
      totalWordsWritten,
      totalTimeSpent,
      averageWordsPerMinute,
      averageSessionLength,
      totalSessions,
      goalsCompleted,
      currentStreak,
      bestDay,
      productivityScore,
      trends
    };
  }

  private groupSessionsByDay(sessions: WritingSession[]): Record<string, number> {
    return sessions.reduce((acc, session) => {
      const date = session.startTime.toDateString();
      acc[date] = (acc[date] || 0) + session.wordsWritten;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateCurrentStreak(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    const currentDate = new Date(today);

    while (true) {
      const hasSession = this.sessions.some(session => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === currentDate.getTime() && session.wordsWritten > 0;
      });

      if (hasSession) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  private generateTrends(sessions: WritingSession[]): ProductivityMetrics['trends'] {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const wordsPerDay = last30Days.map(date => {
      const daysSessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });
      
      return {
        date: new Date(date),
        count: daysSessions.reduce((sum, s) => sum + s.wordsWritten, 0)
      };
    });

    const timePerDay = last30Days.map(date => {
      const daysSessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });
      
      return {
        date: new Date(date),
        minutes: daysSessions.reduce((sum, s) => sum + s.duration, 0)
      };
    });

    const moodTrends = last30Days.map(date => {
      const daysSessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });
      
      // Get most common mood for the day
      const moods = daysSessions.map(s => s.mood);
      const moodCounts = moods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonMood = Object.entries(moodCounts).reduce(
        (max, [mood, count]) => count > max.count ? { mood: mood as WritingSession['mood'], count } : max,
        { mood: 'neutral' as WritingSession['mood'], count: 0 }
      );
      
      return {
        date: new Date(date),
        mood: mostCommonMood.mood
      };
    });

    return { wordsPerDay, timePerDay, moodTrends };
  }

  private calculateProductivityScore(sessions: WritingSession[]): number {
    if (sessions.length === 0) return 0;

    const factors = {
      consistency: this.calculateConsistencyScore(sessions),
      quality: this.calculateQualityScore(sessions),
      efficiency: this.calculateEfficiencyScore(sessions),
      goalCompletion: this.calculateGoalCompletionScore()
    };

    // Weighted average
    const weights = { consistency: 0.3, quality: 0.25, efficiency: 0.25, goalCompletion: 0.2 };
    
    return Math.round(
      factors.consistency * weights.consistency +
      factors.quality * weights.quality +
      factors.efficiency * weights.efficiency +
      factors.goalCompletion * weights.goalCompletion
    );
  }

  private calculateConsistencyScore(sessions: WritingSession[]): number {
    const last7Days = 7;
    const daysWithSessions = new Set();
    
    sessions.forEach(session => {
      const daysAgo = Math.floor((Date.now() - session.startTime.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < last7Days) {
        daysWithSessions.add(Math.floor(daysAgo));
      }
    });

    return Math.min((daysWithSessions.size / last7Days) * 100, 100);
  }

  private calculateQualityScore(sessions: WritingSession[]): number {
    if (sessions.length === 0) return 0;
    const averageQuality = sessions.reduce((sum, s) => sum + s.quality, 0) / sessions.length;
    return (averageQuality / 5) * 100;
  }

  private calculateEfficiencyScore(sessions: WritingSession[]): number {
    if (sessions.length === 0) return 0;
    const averageWPM = sessions.reduce((sum, s) => {
      return sum + (s.duration > 0 ? s.wordsWritten / s.duration : 0);
    }, 0) / sessions.length;
    
    // Assume 20 WPM is excellent, scale accordingly
    return Math.min((averageWPM / 20) * 100, 100);
  }

  private calculateGoalCompletionScore(): number {
    const activeGoals = this.getActiveGoals();
    if (activeGoals.length === 0) return 100;
    
    const completionRates = activeGoals.map(goal => 
      Math.min(goal.currentValue / goal.targetValue, 1)
    );
    
    const averageCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    return averageCompletion * 100;
  }

  // Achievement System
  private initializeAchievements(): void {
    this.achievements = [
      {
        id: 'first-session',
        title: 'Getting Started',
        description: 'Complete your first writing session',
        category: 'milestone',
        icon: '🚀',
        isUnlocked: false,
        requirements: { type: 'sessions', value: 1 },
        rarity: 'common'
      },
      {
        id: 'daily-writer',
        title: 'Daily Writer',
        description: 'Write for 7 consecutive days',
        category: 'streak',
        icon: '📝',
        isUnlocked: false,
        requirements: { type: 'daily_streak', value: 7 },
        rarity: 'common'
      },
      {
        id: 'word-warrior',
        title: 'Word Warrior',
        description: 'Write 10,000 words total',
        category: 'milestone',
        icon: '⚔️',
        isUnlocked: false,
        requirements: { type: 'total_words', value: 10000 },
        rarity: 'rare'
      },
      {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Write after 10 PM',
        category: 'productivity',
        icon: '🦉',
        isUnlocked: false,
        requirements: { type: 'late_night_session', value: 1 },
        rarity: 'common'
      },
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Write before 6 AM',
        category: 'productivity',
        icon: '🐦',
        isUnlocked: false,
        requirements: { type: 'early_morning_session', value: 1 },
        rarity: 'common'
      },
      {
        id: 'marathon-writer',
        title: 'Marathon Writer',
        description: 'Write for 4 hours in a single session',
        category: 'productivity',
        icon: '🏃‍♂️',
        isUnlocked: false,
        requirements: { type: 'long_session', value: 240 },
        rarity: 'epic'
      },
      {
        id: 'goal-crusher',
        title: 'Goal Crusher',
        description: 'Complete 5 writing goals',
        category: 'milestone',
        icon: '🎯',
        isUnlocked: false,
        requirements: { type: 'goals_completed', value: 5 },
        rarity: 'rare'
      },
      {
        id: 'consistency-master',
        title: 'Consistency Master',
        description: 'Write for 30 consecutive days',
        category: 'streak',
        icon: '👑',
        isUnlocked: false,
        requirements: { type: 'daily_streak', value: 30 },
        rarity: 'legendary'
      }
    ];

    this.loadAchievements();
  }

  private checkAchievements(): void {
    const metrics = this.getProductivityMetrics();
    const unlockedAchievements: Achievement[] = [];

    this.achievements.forEach(achievement => {
      if (achievement.isUnlocked) return;

      let shouldUnlock = false;

      switch (achievement.requirements.type) {
        case 'sessions':
          shouldUnlock = this.sessions.length >= achievement.requirements.value;
          break;
        case 'total_words':
          shouldUnlock = metrics.totalWordsWritten >= achievement.requirements.value;
          break;
        case 'daily_streak':
          shouldUnlock = metrics.currentStreak >= achievement.requirements.value;
          break;
        case 'goals_completed':
          shouldUnlock = metrics.goalsCompleted >= achievement.requirements.value;
          break;
        case 'late_night_session':
          shouldUnlock = this.sessions.some(s => s.startTime.getHours() >= 22);
          break;
        case 'early_morning_session':
          shouldUnlock = this.sessions.some(s => s.startTime.getHours() < 6);
          break;
        case 'long_session':
          shouldUnlock = this.sessions.some(s => s.duration >= achievement.requirements.value);
          break;
      }

      if (shouldUnlock) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        unlockedAchievements.push(achievement);
      }
    });

    if (unlockedAchievements.length > 0) {
      this.saveAchievements();
      this.emit('achievementsUnlocked', unlockedAchievements);
      unlockedAchievements.forEach(achievement => {
        this.generateAchievementInsight(achievement);
      });
    }
  }

  getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.isUnlocked);
  }

  // Insights & Recommendations
  private generateInsights(): void {
    this.generateProductivityInsights();
    this.generateGoalInsights();
    this.generateHabitInsights();
  }

  private generateProductivityInsights(): void {
    const metrics = this.getProductivityMetrics();
    const recentSessions = this.getSessionsByDateRange(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date()
    );

    // Low productivity warning
    if (metrics.productivityScore < 30 && recentSessions.length > 3) {
      this.addInsight({
        type: 'warning',
        title: 'Productivity Warning',
        message: 'Your productivity has been lower than usual this week. Consider adjusting your writing schedule or environment.',
        actionable: true,
        action: {
          label: 'View Tips',
          callback: () => this.emit('showProductivityTips')
        }
      });
    }

    // Consistency tip
    if (metrics.currentStreak === 0 && this.sessions.length > 5) {
      this.addInsight({
        type: 'tip',
        title: 'Build a Streak',
        message: 'You haven\'t written today yet. Even 10 minutes of writing can help maintain momentum!',
        actionable: true,
        action: {
          label: 'Start Session',
          callback: () => this.emit('startQuickSession')
        }
      });
    }

    // Best time recommendation
    const hourlyProductivity = this.analyzeProductivityByHour();
    if (hourlyProductivity.bestHour) {
      this.addInsight({
        type: 'suggestion',
        title: 'Optimal Writing Time',
        message: `You're most productive around ${hourlyProductivity.bestHour}:00. Consider scheduling your main writing sessions then.`,
        actionable: false
      });
    }
  }

  private generateGoalInsights(): void {
    const activeGoals = this.getActiveGoals();
    
    activeGoals.forEach(goal => {
      const progress = (goal.currentValue / goal.targetValue) * 100;
      const timeRemaining = goal.endDate.getTime() - Date.now();
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

      if (progress < 25 && daysRemaining <= 7) {
        this.addInsight({
          type: 'warning',
          title: 'Goal at Risk',
          message: `"${goal.title}" is behind schedule. You need to increase your pace to meet the deadline.`,
          actionable: true,
          action: {
            label: 'Adjust Goal',
            callback: () => this.emit('adjustGoal', goal.id)
          }
        });
      }

      if (progress >= 90) {
        this.addInsight({
          type: 'achievement',
          title: 'Almost There!',
          message: `You're very close to completing "${goal.title}". A final push will get you there!`,
          actionable: true,
          action: {
            label: 'Finish Goal',
            callback: () => this.emit('focusOnGoal', goal.id)
          }
        });
      }
    });
  }

  private generateHabitInsights(): void {
    this.habits.forEach(habit => {
      if (habit.currentStreak > 0 && habit.currentStreak === habit.bestStreak) {
        this.addInsight({
          type: 'achievement',
          title: 'New Record!',
          message: `You've set a new personal best for "${habit.name}" with a ${habit.currentStreak}-day streak!`,
          actionable: false
        });
      }

      if (habit.currentStreak === 0 && habit.bestStreak > 0) {
        this.addInsight({
          type: 'tip',
          title: 'Restart Your Habit',
          message: `You had a great ${habit.bestStreak}-day streak with "${habit.name}". Why not start again today?`,
          actionable: true,
          action: {
            label: 'Complete Today',
            callback: () => this.completeHabit(habit.id)
          }
        });
      }
    });
  }

  private generateSessionInsights(session: WritingSession): void {
    // High productivity session
    if (session.wordsWritten > 1000) {
      this.addInsight({
        type: 'achievement',
        title: 'Productive Session!',
        message: `Great work! You wrote ${session.wordsWritten} words in ${session.duration} minutes.`,
        actionable: false
      });
    }

    // Long session warning
    if (session.duration > 180) { // 3 hours
      this.addInsight({
        type: 'tip',
        title: 'Take Breaks',
        message: 'Long writing sessions are great, but remember to take breaks to maintain quality and avoid burnout.',
        actionable: false
      });
    }

    // Quality check
    if (session.quality <= 2) {
      this.addInsight({
        type: 'suggestion',
        title: 'Quality Matters',
        message: 'Consider what factors affect your writing quality. Environment, time of day, and mood all play a role.',
        actionable: false
      });
    }
  }

  private generateCompletionInsight(goal: WritingGoal): void {
    this.addInsight({
      type: 'achievement',
      title: 'Goal Completed!',
      message: `Congratulations! You've successfully completed "${goal.title}". Time to set your next challenge!`,
      actionable: true,
      action: {
        label: 'Set New Goal',
        callback: () => this.emit('createNewGoal')
      }
    });
  }

  private generateAchievementInsight(achievement: Achievement): void {
    this.addInsight({
      type: 'achievement',
      title: `Achievement Unlocked! ${achievement.icon}`,
      message: `${achievement.title}: ${achievement.description}`,
      actionable: false
    });
  }

  private addInsight(insight: Omit<WritingInsight, 'id' | 'createdAt' | 'isRead'>): void {
    const newInsight: WritingInsight = {
      ...insight,
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isRead: false
    };

    this.insights.unshift(newInsight);
    
    // Keep only last 50 insights
    if (this.insights.length > 50) {
      this.insights = this.insights.slice(0, 50);
    }

    this.saveInsights();
    this.emit('newInsight', newInsight);
  }

  getInsights(unreadOnly: boolean = false): WritingInsight[] {
    return unreadOnly ? this.insights.filter(i => !i.isRead) : [...this.insights];
  }

  markInsightRead(insightId: string): void {
    const insight = this.insights.find(i => i.id === insightId);
    if (insight) {
      insight.isRead = true;
      this.saveInsights();
    }
  }

  // Helper Methods
  private updateGoalsProgress(wordsWritten: number): void {
    // Only update the goal associated with the current session
    if (this.currentSession?.goalId) {
      const goal = this.getGoal(this.currentSession.goalId);
      if (goal && goal.targetType === 'words' && goal.status === 'active') {
        const previousValue = goal.currentValue;
        goal.currentValue = Math.min(goal.currentValue + wordsWritten, goal.targetValue);
        
        if (previousValue < goal.targetValue && goal.currentValue >= goal.targetValue) {
          this.completeGoal(goal.id);
        }
      }
    }

    this.saveGoals();
  }

  private analyzeProductivityByHour(): { bestHour: number | null; hourlyStats: Record<number, number> } {
    const hourlyStats: Record<number, number> = {};
    
    this.sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const wpm = session.duration > 0 ? session.wordsWritten / session.duration : 0;
      hourlyStats[hour] = (hourlyStats[hour] || 0) + wpm;
    });

    const bestHour = Object.entries(hourlyStats).reduce(
      (best, [hour, productivity]) => productivity > best.productivity ? { hour: parseInt(hour), productivity } : best,
      { hour: -1, productivity: 0 }
    );

    return {
      bestHour: bestHour.hour >= 0 ? bestHour.hour : null,
      hourlyStats
    };
  }

  private startDailyTracking(): void {
    // Check and update streaks daily
    const checkStreaks = () => {
      this.habits.forEach(habit => {
        if (habit.isActive) {
          this.updateHabitStreak(habit);
        }
      });
      this.generateInsights();
    };

    // Check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      checkStreaks();
      setInterval(checkStreaks, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilMidnight);
  }

  // Storage Methods
  private saveGoals(): void {
    try {
      localStorage.setItem(`${this.storageKey}_goals`, JSON.stringify(this.goals));
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  }

  private saveSessions(): void {
    try {
      // Only keep last 1000 sessions for performance
      const sessionsToSave = this.sessions.slice(-1000);
      localStorage.setItem(`${this.storageKey}_sessions`, JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  private debouncedSave(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }
    
    this.saveTimeoutId = window.setTimeout(() => {
      this.saveSessions();
      this.saveTimeoutId = null;
    }, 100);
  }

  public batchOperations(operations: () => void): void {
    this.batchOperationInProgress = true;
    operations();
    this.batchOperationInProgress = false;
    this.debouncedSave();
  }

  private saveHabits(): void {
    try {
      localStorage.setItem(`${this.storageKey}_habits`, JSON.stringify(this.habits));
    } catch (error) {
      console.error('Failed to save habits:', error);
    }
  }

  private saveAchievements(): void {
    try {
      localStorage.setItem(`${this.storageKey}_achievements`, JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  private saveInsights(): void {
    try {
      localStorage.setItem(`${this.storageKey}_insights`, JSON.stringify(this.insights));
    } catch (error) {
      console.error('Failed to save insights:', error);
    }
  }

  private loadData(): void {
    this.loadGoals();
    this.loadSessions();
    this.loadHabits();
    this.loadAchievements();
    this.loadInsights();
  }

  private loadGoals(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_goals`);
      if (stored) {
        this.goals = JSON.parse(stored).map((goal: any) => ({
          ...goal,
          startDate: new Date(goal.startDate),
          endDate: new Date(goal.endDate),
          createdAt: new Date(goal.createdAt),
          updatedAt: new Date(goal.updatedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      this.goals = [];
    }
  }

  private loadSessions(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_sessions`);
      if (stored) {
        this.sessions = JSON.parse(stored).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.sessions = [];
    }
  }

  private loadHabits(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_habits`);
      if (stored) {
        this.habits = JSON.parse(stored).map((habit: any) => ({
          ...habit,
          lastCompleted: habit.lastCompleted ? new Date(habit.lastCompleted) : undefined,
          completionHistory: habit.completionHistory.map((date: string) => new Date(date))
        }));
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
      this.habits = [];
    }
  }

  private loadAchievements(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_achievements`);
      if (stored) {
        const savedAchievements = JSON.parse(stored);
        // Merge with default achievements, preserving unlock status
        this.achievements.forEach(achievement => {
          const saved = savedAchievements.find((s: Achievement) => s.id === achievement.id);
          if (saved) {
            achievement.isUnlocked = saved.isUnlocked;
            achievement.unlockedAt = saved.unlockedAt ? new Date(saved.unlockedAt) : undefined;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  }

  private loadInsights(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_insights`);
      if (stored) {
        this.insights = JSON.parse(stored).map((insight: any) => ({
          ...insight,
          createdAt: new Date(insight.createdAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
      this.insights = [];
    }
  }

  // Test helper method to reset service state
  resetForTesting(): void {
    this.goals = [];
    this.sessions = [];
    this.habits = [];
    this.achievements = [];
    this.insights = [];
    this.currentSession = null;
    this.emit('reset');
  }
}

export const writingGoalsService = new WritingGoalsService();
export default writingGoalsService;