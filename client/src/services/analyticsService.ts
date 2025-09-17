/**
 * Analytics Service
 * Tracks and analyzes writing statistics across projects, stories, and scenes
 */

export interface WritingSession {
  id: string;
  projectId: string;
  storyId?: string;
  sceneId?: string;
  noteId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  wordsWritten: number;
  wordsDeleted: number;
  netWordsWritten: number;
  keystrokeCount: number;
  sessionType: 'writing' | 'editing' | 'planning' | 'research';
  metadata?: {
    focusTime?: number; // time actually writing vs paused
    pauseCount?: number;
    averageWPM?: number;
    peakWPM?: number;
  };
}

export interface WritingGoal {
  id: string;
  projectId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project' | 'custom';
  target: number; // target word count
  targetType: 'words' | 'scenes' | 'chapters' | 'hours';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  title: string;
  description?: string;
}

export interface WritingStreak {
  currentStreak: number;
  longestStreak: number;
  lastWritingDate: Date;
  streakStartDate: Date;
  totalWritingDays: number;
}

export interface ProjectStatistics {
  projectId: string;
  totalWords: number;
  totalScenes: number;
  totalCharacters: number;
  totalLocations: number;
  completedScenes: number;
  draftedScenes: number;
  plannedScenes: number;
  averageWordsPerScene: number;
  estimatedWordsRemaining: number;
  projectProgress: number; // percentage
  writingSessions: number;
  totalWritingTime: number; // in minutes
  averageSessionLength: number;
  wordsPerHour: number;
  mostProductiveTimeOfDay: string;
  dailyWordCounts: { date: string; words: number }[];
  weeklyProgress: { week: string; words: number; sessions: number }[];
  monthlyProgress: { month: string; words: number; sessions: number }[];
}

export interface StoryStatistics {
  storyId: string;
  totalWords: number;
  totalScenes: number;
  completedScenes: number;
  estimatedWords: number;
  progress: number;
  averageWordsPerScene: number;
  charactersCount: number;
  locationsCount: number;
  plotThreadsCount: number;
  writingSessions: number;
  totalWritingTime: number;
  lastUpdated: Date;
}

class AnalyticsService {
  private readonly STORAGE_KEYS = {
    WRITING_SESSIONS: 'astral_writing_sessions',
    WRITING_GOALS: 'astral_writing_goals',
    WRITING_STREAKS: 'astral_writing_streaks',
    PROJECT_STATS: 'astral_project_stats'
  };

  private writingSessions: WritingSession[] = [];
  private writingGoals: WritingGoal[] = [];
  private writingStreaks: Map<string, WritingStreak> = new Map();
  private currentSession: WritingSession | null = null;
  private sessionStartTime: Date | null = null;
  private initialWordCount: number = 0;
  private wordCountTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadData();
    this.setupAutoSave();
  }

  private loadData(): void {
    try {
      // Load writing sessions
      const sessionsData = localStorage.getItem(this.STORAGE_KEYS.WRITING_SESSIONS);
      if (sessionsData) {
        this.writingSessions = JSON.parse(sessionsData).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        }));
      }

      // Load writing goals
      const goalsData = localStorage.getItem(this.STORAGE_KEYS.WRITING_GOALS);
      if (goalsData) {
        this.writingGoals = JSON.parse(goalsData).map((goal: any) => ({
          ...goal,
          startDate: new Date(goal.startDate),
          endDate: goal.endDate ? new Date(goal.endDate) : undefined
        }));
      }

      // Load writing streaks
      const streaksData = localStorage.getItem(this.STORAGE_KEYS.WRITING_STREAKS);
      if (streaksData) {
        const streaksObj = JSON.parse(streaksData);
        Object.entries(streaksObj).forEach(([projectId, streak]: [string, any]) => {
          this.writingStreaks.set(projectId, {
            ...streak,
            lastWritingDate: new Date(streak.lastWritingDate),
            streakStartDate: new Date(streak.streakStartDate)
          });
        });
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.WRITING_SESSIONS, JSON.stringify(this.writingSessions));
      localStorage.setItem(this.STORAGE_KEYS.WRITING_GOALS, JSON.stringify(this.writingGoals));
      
      const streaksObj: Record<string, WritingStreak> = {};
      this.writingStreaks.forEach((streak, projectId) => {
        streaksObj[projectId] = streak;
      });
      localStorage.setItem(this.STORAGE_KEYS.WRITING_STREAKS, JSON.stringify(streaksObj));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  private setupAutoSave(): void {
    setInterval(() => {
      this.saveData();
    }, 30000); // Save every 30 seconds
  }

  // Writing Session Management
  public startWritingSession(
    projectId: string, 
    sessionType: WritingSession['sessionType'] = 'writing',
    targetId?: { storyId?: string; sceneId?: string; noteId?: string }
  ): string {
    if (this.currentSession) {
      this.endWritingSession();
    }

    const sessionId = this.generateId('session');
    this.sessionStartTime = new Date();
    this.initialWordCount = this.getCurrentWordCount(projectId, targetId);

    this.currentSession = {
      id: sessionId,
      projectId,
      storyId: targetId?.storyId,
      sceneId: targetId?.sceneId,
      noteId: targetId?.noteId,
      startTime: this.sessionStartTime,
      duration: 0,
      wordsWritten: 0,
      wordsDeleted: 0,
      netWordsWritten: 0,
      keystrokeCount: 0,
      sessionType,
      metadata: {
        focusTime: 0,
        pauseCount: 0,
        averageWPM: 0,
        peakWPM: 0
      }
    };

    // Start word count tracking
    this.startWordCountTracking(projectId, targetId);

    return sessionId;
  }

  public endWritingSession(): WritingSession | null {
    if (!this.currentSession || !this.sessionStartTime) {
      return null;
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - this.sessionStartTime.getTime()) / (1000 * 60));
    const currentWordCount = this.getCurrentWordCount(this.currentSession.projectId, {
      storyId: this.currentSession.storyId,
      sceneId: this.currentSession.sceneId,
      noteId: this.currentSession.noteId
    });

    this.currentSession.endTime = endTime;
    this.currentSession.duration = duration;
    this.currentSession.netWordsWritten = currentWordCount - this.initialWordCount;
    this.currentSession.wordsWritten = Math.max(0, this.currentSession.netWordsWritten);
    this.currentSession.wordsDeleted = Math.max(0, -this.currentSession.netWordsWritten);

    // Calculate WPM
    if (duration > 0) {
      this.currentSession.metadata!.averageWPM = Math.round(this.currentSession.wordsWritten / duration);
    }

    // Add to sessions history
    this.writingSessions.push({ ...this.currentSession });

    // Update writing streak
    this.updateWritingStreak(this.currentSession.projectId);

    // Stop word count tracking
    if (this.wordCountTimer) {
      clearInterval(this.wordCountTimer);
      this.wordCountTimer = null;
    }

    const completedSession = { ...this.currentSession };
    this.currentSession = null;
    this.sessionStartTime = null;

    this.saveData();
    return completedSession;
  }

  public pauseSession(): void {
    if (this.currentSession) {
      this.currentSession.metadata!.pauseCount = (this.currentSession.metadata!.pauseCount || 0) + 1;
    }
  }

  public resumeSession(): void {
    // Implementation for resume functionality
  }

  private startWordCountTracking(
    projectId: string, 
    targetId?: { storyId?: string; sceneId?: string; noteId?: string }
  ): void {
    this.wordCountTimer = setInterval(() => {
      if (this.currentSession) {
        const currentWords = this.getCurrentWordCount(projectId, targetId);
        const wordsChange = currentWords - this.initialWordCount;
        this.currentSession.netWordsWritten = wordsChange;
      }
    }, 5000); // Update every 5 seconds
  }

  private getCurrentWordCount(
    projectId: string, 
    targetId?: { storyId?: string; sceneId?: string; noteId?: string }
  ): number {
    // This would integrate with actual content services
    // For now, return 0 as placeholder
    return 0;
  }

  // Writing Goals Management
  public createWritingGoal(goal: Omit<WritingGoal, 'id'>): WritingGoal {
    const newGoal: WritingGoal = {
      ...goal,
      id: this.generateId('goal')
    };

    this.writingGoals.push(newGoal);
    this.saveData();
    return newGoal;
  }

  public updateWritingGoal(goalId: string, updates: Partial<WritingGoal>): WritingGoal | null {
    const goalIndex = this.writingGoals.findIndex(goal => goal.id === goalId);
    if (goalIndex === -1) return null;

    this.writingGoals[goalIndex] = { ...this.writingGoals[goalIndex], ...updates };
    this.saveData();
    return this.writingGoals[goalIndex];
  }

  public deleteWritingGoal(goalId: string): boolean {
    const initialLength = this.writingGoals.length;
    this.writingGoals = this.writingGoals.filter(goal => goal.id !== goalId);
    
    if (this.writingGoals.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  public getWritingGoals(projectId?: string): WritingGoal[] {
    if (projectId) {
      return this.writingGoals.filter(goal => goal.projectId === projectId);
    }
    return [...this.writingGoals];
  }

  public getActiveGoals(projectId?: string): WritingGoal[] {
    return this.getWritingGoals(projectId).filter(goal => goal.isActive);
  }

  // Statistics Generation
  public getProjectStatistics(projectId: string): ProjectStatistics {
    const sessions = this.writingSessions.filter(session => session.projectId === projectId);
    const totalWords = sessions.reduce((sum, session) => sum + session.netWordsWritten, 0);
    const totalWritingTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    
    // Generate daily word counts for the last 30 days
    const dailyWordCounts = this.generateDailyWordCounts(projectId, 30);
    const weeklyProgress = this.generateWeeklyProgress(projectId, 12);
    const monthlyProgress = this.generateMonthlyProgress(projectId, 6);

    return {
      projectId,
      totalWords,
      totalScenes: 0, // Would be calculated from actual project data
      totalCharacters: 0,
      totalLocations: 0,
      completedScenes: 0,
      draftedScenes: 0,
      plannedScenes: 0,
      averageWordsPerScene: 0,
      estimatedWordsRemaining: 0,
      projectProgress: 0,
      writingSessions: sessions.length,
      totalWritingTime,
      averageSessionLength: sessions.length > 0 ? totalWritingTime / sessions.length : 0,
      wordsPerHour: totalWritingTime > 0 ? Math.round((totalWords / totalWritingTime) * 60) : 0,
      mostProductiveTimeOfDay: this.getMostProductiveTimeOfDay(projectId),
      dailyWordCounts,
      weeklyProgress,
      monthlyProgress
    };
  }

  public getWritingStreak(projectId: string): WritingStreak {
    return this.writingStreaks.get(projectId) || {
      currentStreak: 0,
      longestStreak: 0,
      lastWritingDate: new Date(),
      streakStartDate: new Date(),
      totalWritingDays: 0
    };
  }

  private updateWritingStreak(projectId: string): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const streak = this.writingStreaks.get(projectId) || {
      currentStreak: 0,
      longestStreak: 0,
      lastWritingDate: new Date(0),
      streakStartDate: today,
      totalWritingDays: 0
    };

    const lastWritingDate = new Date(streak.lastWritingDate);
    lastWritingDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastWritingDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, don't change streak
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      streak.currentStreak += 1;
      streak.totalWritingDays += 1;
    } else {
      // Streak broken
      streak.currentStreak = 1;
      streak.streakStartDate = today;
      streak.totalWritingDays += 1;
    }

    // Update longest streak
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastWritingDate = today;
    this.writingStreaks.set(projectId, streak);
  }

  private generateDailyWordCounts(projectId: string, days: number): { date: string; words: number }[] {
    const result: { date: string; words: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayWords = this.writingSessions
        .filter(session => 
          session.projectId === projectId && 
          session.startTime.toISOString().split('T')[0] === dateStr
        )
        .reduce((sum, session) => sum + session.netWordsWritten, 0);

      result.push({ date: dateStr, words: Math.max(0, dayWords) });
    }

    return result;
  }

  private generateWeeklyProgress(projectId: string, weeks: number): { week: string; words: number; sessions: number }[] {
    const result: { week: string; words: number; sessions: number }[] = [];
    const today = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekStr = `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`;

      const weekSessions = this.writingSessions.filter(session => 
        session.projectId === projectId &&
        session.startTime >= weekStart &&
        session.startTime <= weekEnd
      );

      const words = weekSessions.reduce((sum, session) => sum + session.netWordsWritten, 0);

      result.push({ 
        week: weekStr, 
        words: Math.max(0, words), 
        sessions: weekSessions.length 
      });
    }

    return result;
  }

  private generateMonthlyProgress(projectId: string, months: number): { month: string; words: number; sessions: number }[] {
    const result: { month: string; words: number; sessions: number }[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const monthStr = monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      const monthSessions = this.writingSessions.filter(session => 
        session.projectId === projectId &&
        session.startTime >= monthStart &&
        session.startTime <= monthEnd
      );

      const words = monthSessions.reduce((sum, session) => sum + session.netWordsWritten, 0);

      result.push({ 
        month: monthStr, 
        words: Math.max(0, words), 
        sessions: monthSessions.length 
      });
    }

    return result;
  }

  private getMostProductiveTimeOfDay(projectId: string): string {
    const hourlyWords: Record<number, number> = {};

    this.writingSessions
      .filter(session => session.projectId === projectId)
      .forEach(session => {
        const hour = session.startTime.getHours();
        hourlyWords[hour] = (hourlyWords[hour] || 0) + session.netWordsWritten;
      });

    let maxWords = 0;
    let mostProductiveHour = 9; // Default to 9 AM

    Object.entries(hourlyWords).forEach(([hour, words]) => {
      if (words > maxWords) {
        maxWords = words;
        mostProductiveHour = parseInt(hour);
      }
    });

    if (mostProductiveHour < 12) {
      return `${mostProductiveHour}:00 AM`;
    } else if (mostProductiveHour === 12) {
      return '12:00 PM';
    } else {
      return `${mostProductiveHour - 12}:00 PM`;
    }
  }

  // Utility Methods
  public getCurrentSession(): WritingSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  public getRecentSessions(projectId?: string, limit: number = 10): WritingSession[] {
    let sessions = [...this.writingSessions];
    
    if (projectId) {
      sessions = sessions.filter(session => session.projectId === projectId);
    }

    return sessions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  public exportAnalyticsData(projectId?: string): any {
    const data = {
      sessions: projectId 
        ? this.writingSessions.filter(s => s.projectId === projectId)
        : this.writingSessions,
      goals: projectId 
        ? this.writingGoals.filter(g => g.projectId === projectId)
        : this.writingGoals,
      streaks: projectId 
        ? { [projectId]: this.writingStreaks.get(projectId) }
        : Object.fromEntries(this.writingStreaks)
    };

    return data;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const analyticsService = new AnalyticsService();