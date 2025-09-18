/**
 * Personal AI Writing Coach Service
 * Provides personalized writing guidance, style analysis, and improvement suggestions
 * Tailored for individual writers to enhance their craft and productivity
 */

import { EventEmitter } from 'events';

export interface WritingStyle {
  readabilityScore: number;
  sentenceComplexity: 'simple' | 'moderate' | 'complex';
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  toneAnalysis: {
    formal: number;
    casual: number;
    emotional: number;
    objective: number;
  };
  pacingPattern: 'fast' | 'moderate' | 'slow' | 'varied';
  dialogueRatio: number;
  descriptiveRatio: number;
  averageSentenceLength: number;
  passiveVoicePercentage: number;
  uniqueWords: number;
  repetitiveWords: string[];
}

export interface WritingGoal {
  id: string;
  type: 'wordCount' | 'readability' | 'consistency' | 'creativity' | 'productivity';
  target: number;
  current: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high';
  description: string;
  deadline?: Date;
}

export interface WritingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  timeSpent: number; // minutes
  mood: 'energetic' | 'focused' | 'creative' | 'struggling' | 'inspired';
  distractions: number;
  qualityRating: number; // 1-10 self-rating
  notes?: string;
}

export interface AICoachSuggestion {
  id: string;
  type: 'style' | 'structure' | 'content' | 'productivity' | 'motivation';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  example?: string;
  actionable: boolean;
  estimatedImpact: number; // 1-10
  category: string;
  relevantText?: {
    start: number;
    end: number;
    original: string;
    suggested: string;
  };
}

export interface PersonalInsight {
  id: string;
  insight: string;
  category: 'strength' | 'weakness' | 'pattern' | 'improvement' | 'achievement';
  confidence: number;
  dataPoints: string[];
  actionItems: string[];
  celebrateProgress?: boolean;
}

export interface WritingStreak {
  currentStreak: number;
  longestStreak: number;
  streakType: 'daily' | 'weekly';
  lastWritingDate: Date;
  averageWordsPerDay: number;
  consistencyScore: number;
}

class PersonalAICoachService extends EventEmitter {
  private writingSessions: WritingSession[] = [];
  private writingGoals: WritingGoal[] = [];
  private personalInsights: PersonalInsight[] = [];
  private writingStreak: WritingStreak = {
    currentStreak: 0,
    longestStreak: 0,
    streakType: 'daily',
    lastWritingDate: new Date(),
    averageWordsPerDay: 0,
    consistencyScore: 0
  };
  private userPreferences = {
    coachingStyle: 'encouraging', // 'encouraging', 'direct', 'analytical'
    focusAreas: ['productivity', 'creativity', 'style'],
    notificationFrequency: 'moderate',
    privacyMode: true
  };

  constructor() {
    super();
    this.loadPersonalData();
    this.setupPersonalizedTracking();
  }

  // Personal Style Analysis
  public analyzeWritingStyle(text: string): WritingStyle {
    const sentences = this.splitIntoSentences(text);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    
    // Calculate readability (simplified Flesch-Kincaid)
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllables = this.calculateAverageSyllables(words);
    const readabilityScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllables;
    
    // Analyze tone
    const toneAnalysis = this.analyzeTone(text);
    
    // Detect pacing patterns
    const pacingPattern = this.analyzePacing(sentences);
    
    // Calculate dialogue vs narrative ratio
    const dialogueRatio = this.calculateDialogueRatio(text);
    
    // Find repetitive words
    const repetitiveWords = this.findRepetitiveWords(words);
    
    // Calculate passive voice percentage
    const passiveVoicePercentage = this.calculatePassiveVoice(text);

    return {
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      sentenceComplexity: avgSentenceLength > 20 ? 'complex' : avgSentenceLength > 15 ? 'moderate' : 'simple',
      vocabularyLevel: this.assessVocabularyLevel(words),
      toneAnalysis,
      pacingPattern,
      dialogueRatio,
      descriptiveRatio: this.calculateDescriptiveRatio(text),
      averageSentenceLength: avgSentenceLength,
      passiveVoicePercentage,
      uniqueWords: uniqueWords.size,
      repetitiveWords
    };
  }

  // Personal Writing Coach Suggestions
  public getPersonalizedSuggestions(text: string, context: {
    projectType: 'novel' | 'short_story' | 'poetry' | 'journal' | 'essay';
    currentMood: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    recentStruggle?: string;
  }): AICoachSuggestion[] {
    const style = this.analyzeWritingStyle(text);
    const suggestions: AICoachSuggestion[] = [];

    // Style-based suggestions
    if (style.readabilityScore < 30) {
      suggestions.push({
        id: `readability-${Date.now()}`,
        type: 'style',
        priority: 'high',
        title: 'Simplify for Better Flow',
        description: 'Your sentences are quite complex. Consider breaking them down for better readability.',
        actionable: true,
        estimatedImpact: 8,
        category: 'clarity',
        example: 'Try splitting long sentences at conjunctions like "and", "but", or "because".'
      });
    }

    if (style.passiveVoicePercentage > 20) {
      suggestions.push({
        id: `passive-voice-${Date.now()}`,
        type: 'style',
        priority: 'medium',
        title: 'Strengthen Your Voice',
        description: `${Math.round(style.passiveVoicePercentage)}% of your sentences use passive voice. Active voice creates more engaging prose.`,
        actionable: true,
        estimatedImpact: 7,
        category: 'voice',
        example: 'Change "The door was opened by Sarah" to "Sarah opened the door".'
      });
    }

    if (style.repetitiveWords.length > 0) {
      suggestions.push({
        id: `repetition-${Date.now()}`,
        type: 'style',
        priority: 'medium',
        title: 'Vary Your Vocabulary',
        description: `You're repeating these words: ${style.repetitiveWords.slice(0, 3).join(', ')}`,
        actionable: true,
        estimatedImpact: 6,
        category: 'vocabulary'
      });
    }

    // Context-based personal suggestions
    if (context.currentMood === 'struggling') {
      suggestions.push({
        id: `motivation-${Date.now()}`,
        type: 'motivation',
        priority: 'high',
        title: 'You\'re Making Progress!',
        description: 'Writing when it feels difficult is how we grow. Every word counts toward your goals.',
        actionable: false,
        estimatedImpact: 9,
        category: 'encouragement'
      });
    }

    if (context.timeOfDay === 'night' && this.getRecentProductivity() < 0.7) {
      suggestions.push({
        id: `productivity-${Date.now()}`,
        type: 'productivity',
        priority: 'medium',
        title: 'Consider Your Peak Hours',
        description: 'Your writing seems more productive during earlier hours. Perhaps save editing for late-night sessions?',
        actionable: true,
        estimatedImpact: 7,
        category: 'timing'
      });
    }

    // Project-type specific suggestions
    if (context.projectType === 'novel' && style.dialogueRatio < 0.1) {
      suggestions.push({
        id: `dialogue-${Date.now()}`,
        type: 'content',
        priority: 'medium',
        title: 'Bring Characters to Life',
        description: 'Adding some dialogue could help develop your characters and improve pacing.',
        actionable: true,
        estimatedImpact: 8,
        category: 'character_development'
      });
    }

    return this.prioritizePersonalSuggestions(suggestions);
  }

  // Personal Progress Tracking
  public startWritingSession(mood: WritingSession['mood']): string {
    const session: WritingSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      wordsWritten: 0,
      timeSpent: 0,
      mood,
      distractions: 0,
      qualityRating: 5
    };

    this.writingSessions.push(session);
    this.emit('sessionStarted', session);
    return session.id;
  }

  public updateWritingSession(sessionId: string, updates: Partial<WritingSession>): void {
    const session = this.writingSessions.find(s => s.id === sessionId);
    if (session) {
      Object.assign(session, updates);
      this.updateStreak();
      this.emit('sessionUpdated', session);
    }
  }

  public endWritingSession(sessionId: string, finalWordCount: number, qualityRating: number): WritingSession | null {
    const session = this.writingSessions.find(s => s.id === sessionId);
    if (session) {
      session.endTime = new Date();
      session.timeSpent = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
      session.wordsWritten = finalWordCount;
      session.qualityRating = qualityRating;
      
      this.analyzeSessionInsights(session);
      this.emit('sessionEnded', session);
      return session;
    }
    return null;
  }

  // Personal Goal Management
  public setPersonalGoal(goal: Omit<WritingGoal, 'id' | 'current'>): WritingGoal {
    const newGoal: WritingGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      current: 0
    };
    
    this.writingGoals.push(newGoal);
    this.emit('goalSet', newGoal);
    return newGoal;
  }

  public updateGoalProgress(goalId: string, progress: number): void {
    const goal = this.writingGoals.find(g => g.id === goalId);
    if (goal) {
      goal.current = Math.min(goal.target, goal.current + progress);
      
      if (goal.current >= goal.target) {
        this.celebrateGoalAchievement(goal);
      }
      
      this.emit('goalUpdated', goal);
    }
  }

  // Personal Insights Generation
  public generatePersonalInsights(): PersonalInsight[] {
    const insights: PersonalInsight[] = [];
    
    // Productivity patterns
    const productivityInsight = this.analyzeProductivityPatterns();
    if (productivityInsight) insights.push(productivityInsight);
    
    // Writing habits
    const habitsInsight = this.analyzeWritingHabits();
    if (habitsInsight) insights.push(habitsInsight);
    
    // Improvement areas
    const improvementInsight = this.analyzeImprovementAreas();
    if (improvementInsight) insights.push(improvementInsight);
    
    // Celebrate strengths
    const strengthsInsight = this.analyzeStrengths();
    if (strengthsInsight) insights.push(strengthsInsight);

    this.personalInsights = insights;
    return insights;
  }

  // Personal Writing Analytics
  public getPersonalAnalytics(timeframe: 'week' | 'month' | 'year'): {
    totalWords: number;
    averageSessionLength: number;
    productivityTrend: number;
    qualityTrend: number;
    consistencyScore: number;
    peakProductivityHours: string[];
    moodCorrelations: Record<string, number>;
    goalProgress: WritingGoal[];
    streak: WritingStreak;
  } {
    const cutoffDate = this.getCutoffDate(timeframe);
    const recentSessions = this.writingSessions.filter(s => s.startTime >= cutoffDate);
    
    return {
      totalWords: recentSessions.reduce((sum, s) => sum + s.wordsWritten, 0),
      averageSessionLength: recentSessions.reduce((sum, s) => sum + s.timeSpent, 0) / recentSessions.length,
      productivityTrend: this.calculateProductivityTrend(recentSessions),
      qualityTrend: this.calculateQualityTrend(recentSessions),
      consistencyScore: this.calculateConsistencyScore(recentSessions),
      peakProductivityHours: this.findPeakProductivityHours(recentSessions),
      moodCorrelations: this.analyzeMoodCorrelations(recentSessions),
      goalProgress: this.writingGoals.filter(g => !g.deadline || g.deadline >= new Date()),
      streak: this.writingStreak
    };
  }

  // Private helper methods
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private calculateAverageSyllables(words: string[]): number {
    // Simplified syllable counting
    return words.reduce((sum, word) => {
      const syllables = word.toLowerCase().replace(/[^aeiou]/g, '').length || 1;
      return sum + syllables;
    }, 0) / words.length;
  }

  private analyzeTone(text: string): WritingStyle['toneAnalysis'] {
    const formal = (text.match(/\b(however|therefore|consequently|furthermore)\b/gi) || []).length;
    const casual = (text.match(/\b(yeah|okay|cool|awesome|totally)\b/gi) || []).length;
    const emotional = (text.match(/[!]{1,3}|[?]{1,3}|\b(love|hate|amazing|terrible|wonderful|awful)\b/gi) || []).length;
    const objective = (text.match(/\b(data|evidence|research|study|analysis)\b/gi) || []).length;
    
    const total = formal + casual + emotional + objective + 1; // +1 to avoid division by zero
    
    return {
      formal: formal / total,
      casual: casual / total,
      emotional: emotional / total,
      objective: objective / total
    };
  }

  private analyzePacing(sentences: string[]): WritingStyle['pacingPattern'] {
    const lengths = sentences.map(s => s.trim().length);
    const variance = this.calculateVariance(lengths);
    const average = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    
    if (variance > average * 0.5) return 'varied';
    if (average < 50) return 'fast';
    if (average > 100) return 'slow';
    return 'moderate';
  }

  private calculateDialogueRatio(text: string): number {
    const dialogueMatches = text.match(/"[^"]*"/g) || [];
    const totalDialogueLength = dialogueMatches.reduce((sum, match) => sum + match.length, 0);
    return totalDialogueLength / text.length;
  }

  private calculateDescriptiveRatio(text: string): number {
    const descriptiveWords = text.match(/\b(beautiful|dark|bright|soft|loud|smooth|rough|warm|cold|sweet|bitter)\b/gi) || [];
    const totalWords = text.match(/\b\w+\b/g) || [];
    return descriptiveWords.length / totalWords.length;
  }

  private findRepetitiveWords(words: string[]): string[] {
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 4) { // Only consider longer words
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
    
    return Array.from(wordCount.entries())
      .filter(([word, count]) => count > Math.max(3, words.length / 100))
      .map(([word]) => word);
  }

  private calculatePassiveVoice(text: string): number {
    const passiveIndicators = text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || [];
    const totalSentences = this.splitIntoSentences(text).length;
    return (passiveIndicators.length / totalSentences) * 100;
  }

  private assessVocabularyLevel(words: string[]): WritingStyle['vocabularyLevel'] {
    const complexWords = words.filter(word => word.length > 6);
    const ratio = complexWords.length / words.length;
    
    if (ratio > 0.3) return 'expert';
    if (ratio > 0.2) return 'advanced';
    if (ratio > 0.1) return 'intermediate';
    return 'basic';
  }

  private prioritizePersonalSuggestions(suggestions: AICoachSuggestion[]): AICoachSuggestion[] {
    return suggestions.sort((a, b) => {
      // Priority order: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by estimated impact
      return b.estimatedImpact - a.estimatedImpact;
    });
  }

  private getRecentProductivity(): number {
    const recentSessions = this.writingSessions.slice(-10);
    if (recentSessions.length === 0) return 0.5;
    
    return recentSessions.reduce((sum, session) => {
      const efficiency = session.wordsWritten / Math.max(session.timeSpent, 1);
      return sum + Math.min(efficiency / 50, 1); // Normalize to 0-1
    }, 0) / recentSessions.length;
  }

  private analyzeSessionInsights(session: WritingSession): void {
    // Generate insights based on the session
    if (session.wordsWritten > this.getAverageWordsPerSession() * 1.5) {
      this.addInsight({
        id: `productivity-${Date.now()}`,
        insight: 'You had a particularly productive session today! Keep up the great work.',
        category: 'achievement',
        confidence: 0.9,
        dataPoints: [`${session.wordsWritten} words in ${Math.round(session.timeSpent)} minutes`],
        actionItems: ['Consider what factors contributed to this success'],
        celebrateProgress: true
      });
    }
  }

  private updateStreak(): void {
    const today = new Date().toDateString();
    const lastSessionToday = this.writingSessions.find(s => 
      s.startTime.toDateString() === today && s.wordsWritten > 0
    );
    
    if (lastSessionToday) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      const lastWritingDate = this.writingStreak.lastWritingDate.toDateString();
      
      if (lastWritingDate === yesterday) {
        this.writingStreak.currentStreak++;
      } else if (lastWritingDate !== today) {
        this.writingStreak.currentStreak = 1;
      }
      
      this.writingStreak.longestStreak = Math.max(
        this.writingStreak.longestStreak,
        this.writingStreak.currentStreak
      );
      this.writingStreak.lastWritingDate = new Date();
    }
  }

  private celebrateGoalAchievement(goal: WritingGoal): void {
    this.emit('goalAchieved', goal);
    this.addInsight({
      id: `goal-achieved-${Date.now()}`,
      insight: `Congratulations! You've achieved your ${goal.type} goal: ${goal.description}`,
      category: 'achievement',
      confidence: 1.0,
      dataPoints: [`Target: ${goal.target}`, `Achieved: ${goal.current}`],
      actionItems: ['Set a new challenging goal to continue growing'],
      celebrateProgress: true
    });
  }

  private addInsight(insight: PersonalInsight): void {
    this.personalInsights.push(insight);
    this.emit('newInsight', insight);
  }

  private analyzeProductivityPatterns(): PersonalInsight | null {
    const sessions = this.writingSessions.slice(-20);
    if (sessions.length < 5) return null;
    
    const hourlyProductivity = new Map<number, number>();
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const productivity = session.wordsWritten / Math.max(session.timeSpent, 1);
      hourlyProductivity.set(hour, (hourlyProductivity.get(hour) || 0) + productivity);
    });
    
    const bestHour = Array.from(hourlyProductivity.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (bestHour) {
      return {
        id: `productivity-pattern-${Date.now()}`,
        insight: `Your most productive writing time appears to be around ${bestHour[0]}:00. Consider scheduling important writing during this window.`,
        category: 'pattern',
        confidence: 0.8,
        dataPoints: [`Peak productivity at ${bestHour[0]}:00`],
        actionItems: ['Schedule challenging writing tasks during peak hours', 'Protect this time from distractions']
      };
    }
    
    return null;
  }

  private analyzeWritingHabits(): PersonalInsight | null {
    const sessions = this.writingSessions.slice(-30);
    if (sessions.length < 10) return null;
    
    const avgSessionLength = sessions.reduce((sum, s) => sum + s.timeSpent, 0) / sessions.length;
    
    if (avgSessionLength > 60) {
      return {
        id: `writing-habits-${Date.now()}`,
        insight: 'You tend to write in longer sessions. This is great for deep focus and flow states!',
        category: 'strength',
        confidence: 0.9,
        dataPoints: [`Average session: ${Math.round(avgSessionLength)} minutes`],
        actionItems: ['Continue leveraging your ability to focus for extended periods']
      };
    } else if (avgSessionLength < 20) {
      return {
        id: `writing-habits-${Date.now()}`,
        insight: 'You prefer shorter writing sessions. Consider the "pomodoro technique" to maximize these focused bursts.',
        category: 'improvement',
        confidence: 0.8,
        dataPoints: [`Average session: ${Math.round(avgSessionLength)} minutes`],
        actionItems: ['Try 25-minute focused sessions with 5-minute breaks', 'Set specific mini-goals for each session']
      };
    }
    
    return null;
  }

  private analyzeImprovementAreas(): PersonalInsight | null {
    const sessions = this.writingSessions.slice(-15);
    if (sessions.length < 5) return null;
    
    const consistencyScore = this.calculateConsistencyScore(sessions);
    
    if (consistencyScore < 0.5) {
      return {
        id: `improvement-${Date.now()}`,
        insight: 'Building a more consistent writing habit could significantly boost your progress.',
        category: 'improvement',
        confidence: 0.8,
        dataPoints: [`Consistency score: ${Math.round(consistencyScore * 100)}%`],
        actionItems: ['Try writing at the same time each day', 'Start with just 10 minutes daily', 'Track your writing streak']
      };
    }
    
    return null;
  }

  private analyzeStrengths(): PersonalInsight | null {
    if (this.writingStreak.currentStreak >= 7) {
      return {
        id: `strength-${Date.now()}`,
        insight: `Amazing! You're on a ${this.writingStreak.currentStreak}-day writing streak. Your consistency is a real strength!`,
        category: 'strength',
        confidence: 1.0,
        dataPoints: [`Current streak: ${this.writingStreak.currentStreak} days`],
        actionItems: ['Keep building this momentum'],
        celebrateProgress: true
      };
    }
    
    return null;
  }

  private getAverageWordsPerSession(): number {
    const sessions = this.writingSessions.slice(-20);
    if (sessions.length === 0) return 250; // Default assumption
    
    return sessions.reduce((sum, s) => sum + s.wordsWritten, 0) / sessions.length;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }

  private calculateProductivityTrend(sessions: WritingSession[]): number {
    if (sessions.length < 3) return 0;
    
    const productivities = sessions.map(s => s.wordsWritten / Math.max(s.timeSpent, 1));
    const firstHalf = productivities.slice(0, Math.floor(productivities.length / 2));
    const secondHalf = productivities.slice(Math.ceil(productivities.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  private calculateQualityTrend(sessions: WritingSession[]): number {
    if (sessions.length < 3) return 0;
    
    const qualities = sessions.map(s => s.qualityRating);
    const firstHalf = qualities.slice(0, Math.floor(qualities.length / 2));
    const secondHalf = qualities.slice(Math.ceil(qualities.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, q) => sum + q, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, q) => sum + q, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  private calculateConsistencyScore(sessions: WritingSession[]): number {
    if (sessions.length === 0) return 0;
    
    const sessionDates = sessions.map(s => s.startTime.toDateString());
    const uniqueDates = new Set(sessionDates);
    
    const totalDays = Math.ceil((Date.now() - sessions[0].startTime.getTime()) / (1000 * 60 * 60 * 24));
    return uniqueDates.size / Math.max(totalDays, 1);
  }

  private findPeakProductivityHours(sessions: WritingSession[]): string[] {
    const hourlyStats = new Map<number, { total: number; count: number }>();
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const productivity = session.wordsWritten / Math.max(session.timeSpent, 1);
      
      if (!hourlyStats.has(hour)) {
        hourlyStats.set(hour, { total: 0, count: 0 });
      }
      
      const stats = hourlyStats.get(hour)!;
      stats.total += productivity;
      stats.count += 1;
    });
    
    return Array.from(hourlyStats.entries())
      .map(([hour, stats]) => ({ hour, avg: stats.total / stats.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map(item => `${item.hour}:00`);
  }

  private analyzeMoodCorrelations(sessions: WritingSession[]): Record<string, number> {
    const moodStats = new Map<string, { totalWords: number; count: number }>();
    
    sessions.forEach(session => {
      if (!moodStats.has(session.mood)) {
        moodStats.set(session.mood, { totalWords: 0, count: 0 });
      }
      
      const stats = moodStats.get(session.mood)!;
      stats.totalWords += session.wordsWritten;
      stats.count += 1;
    });
    
    const result: Record<string, number> = {};
    moodStats.forEach((stats, mood) => {
      result[mood] = stats.totalWords / stats.count;
    });
    
    return result;
  }

  private getCutoffDate(timeframe: 'week' | 'month' | 'year'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
  }

  private loadPersonalData(): void {
    // Load from localStorage or IndexedDB
    const savedSessions = localStorage.getItem('astral_writing_sessions');
    if (savedSessions) {
      this.writingSessions = JSON.parse(savedSessions).map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined
      }));
    }
    
    const savedGoals = localStorage.getItem('astral_writing_goals');
    if (savedGoals) {
      this.writingGoals = JSON.parse(savedGoals);
    }
    
    const savedStreak = localStorage.getItem('astral_writing_streak');
    if (savedStreak) {
      this.writingStreak = {
        ...JSON.parse(savedStreak),
        lastWritingDate: new Date(JSON.parse(savedStreak).lastWritingDate)
      };
    }
  }

  private setupPersonalizedTracking(): void {
    // Auto-save data periodically
    setInterval(() => {
      localStorage.setItem('astral_writing_sessions', JSON.stringify(this.writingSessions));
      localStorage.setItem('astral_writing_goals', JSON.stringify(this.writingGoals));
      localStorage.setItem('astral_writing_streak', JSON.stringify(this.writingStreak));
    }, 60000); // Save every minute
  }

  // Public getters
  public getWritingStreak(): WritingStreak {
    return { ...this.writingStreak };
  }

  public getPersonalGoals(): WritingGoal[] {
    return [...this.writingGoals];
  }

  public getRecentInsights(limit = 10): PersonalInsight[] {
    return this.personalInsights.slice(-limit);
  }
}

export default new PersonalAICoachService();