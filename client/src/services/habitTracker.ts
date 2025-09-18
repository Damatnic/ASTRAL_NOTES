import { EventEmitter } from 'events';

export interface WritingHabit {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'session-based' | 'milestone';
  target: {
    value: number;
    unit: 'words' | 'minutes' | 'sessions' | 'chapters' | 'pages';
  };
  frequency: {
    daily?: boolean;
    weekly?: number;
    monthly?: number;
  };
  streak: {
    current: number;
    best: number;
    lastCompleted: Date | null;
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: 'productivity' | 'creativity' | 'discipline' | 'quality' | 'consistency';
  isActive: boolean;
  createdAt: Date;
  completions: HabitCompletion[];
  personalNotes?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: Date;
  value: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  mood: 'frustrated' | 'neutral' | 'satisfied' | 'energized' | 'inspired';
  notes?: string;
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    duration: number;
    location: string;
    distractions: string[];
  };
}

export interface WritingRoutine {
  id: string;
  name: string;
  description: string;
  schedule: {
    timeSlots: TimeSlot[];
    flexibility: 'strict' | 'moderate' | 'flexible';
    adaptToLifestyle: boolean;
  };
  phases: RoutinePhase[];
  environment: {
    location: string;
    tools: string[];
    ambiance: string;
    temperature: string;
  };
  effectiveness: {
    score: number;
    trends: EffectivenessTrend[];
    lastAnalyzed: Date;
  };
  personalPreferences: {
    optimalDuration: number;
    preferredBreaks: number;
    energyLevels: Record<string, number>;
  };
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  days: string[];
  priority: 'high' | 'medium' | 'low';
  flexibility: number;
  energyLevel: 'high' | 'medium' | 'low';
}

export interface RoutinePhase {
  id: string;
  name: string;
  duration: number;
  activities: string[];
  purpose: 'warm-up' | 'focus' | 'creative' | 'review' | 'cool-down';
  isOptional: boolean;
}

export interface EffectivenessTrend {
  date: Date;
  metric: string;
  value: number;
  factors: string[];
}

export interface HabitAnalytics {
  consistency: {
    overall: number;
    byHabit: Record<string, number>;
    trends: ConsistencyTrend[];
  };
  productivity: {
    averageDaily: number;
    peakPerformance: {
      timeOfDay: string;
      dayOfWeek: string;
      conditions: string[];
    };
    correlations: ProductivityCorrelation[];
  };
  wellness: {
    motivationLevels: number[];
    stressIndicators: string[];
    burnoutRisk: 'low' | 'medium' | 'high';
    recoveryNeeds: string[];
  };
  recommendations: PersonalRecommendation[];
}

export interface ConsistencyTrend {
  period: string;
  score: number;
  improvement: number;
  challenges: string[];
}

export interface ProductivityCorrelation {
  factor: string;
  correlation: number;
  confidence: number;
  actionable: boolean;
}

export interface PersonalRecommendation {
  id: string;
  type: 'habit' | 'routine' | 'environment' | 'timing' | 'wellness';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  implementation: {
    steps: string[];
    timeframe: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  expectedBenefit: string;
  personalizedInsights: string[];
}

export interface HabitOptimization {
  habitId: string;
  optimizations: {
    timing: TimingOptimization;
    difficulty: DifficultyOptimization;
    environment: EnvironmentOptimization;
    motivation: MotivationOptimization;
  };
  confidence: number;
  implementationPlan: string[];
}

export interface TimingOptimization {
  currentTiming: string;
  suggestedTiming: string;
  reason: string;
  expectedImprovement: number;
}

export interface DifficultyOptimization {
  currentLevel: string;
  suggestedLevel: string;
  adjustmentStrategy: string;
  timeline: string;
}

export interface EnvironmentOptimization {
  currentEnvironment: string;
  suggestions: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface MotivationOptimization {
  currentMotivators: string[];
  suggestedMotivators: string[];
  personalityAlignment: number;
  implementationTips: string[];
}

class HabitTrackerService extends EventEmitter {
  private habits: Map<string, WritingHabit> = new Map();
  private routines: Map<string, WritingRoutine> = new Map();
  private completions: Map<string, HabitCompletion> = new Map();
  private analytics: HabitAnalytics | null = null;
  private optimizations: Map<string, HabitOptimization> = new Map();

  constructor() {
    super();
    this.loadHabitsFromStorage();
    this.loadRoutinesFromStorage();
    this.loadCompletionsFromStorage();
    this.initializeAnalytics();
  }

  async createHabit(habit: Omit<WritingHabit, 'id' | 'createdAt' | 'completions' | 'streak'>): Promise<WritingHabit> {
    const newHabit: WritingHabit = {
      ...habit,
      id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      completions: [],
      streak: {
        current: 0,
        best: 0,
        lastCompleted: null
      }
    };

    this.habits.set(newHabit.id, newHabit);
    await this.saveHabitsToStorage();
    
    this.emit('habitCreated', newHabit);
    await this.analyzeHabitOptimization(newHabit.id);
    
    return newHabit;
  }

  async createRoutine(routine: Omit<WritingRoutine, 'id' | 'effectiveness'>): Promise<WritingRoutine> {
    const newRoutine: WritingRoutine = {
      ...routine,
      id: `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      effectiveness: {
        score: 0,
        trends: [],
        lastAnalyzed: new Date()
      }
    };

    this.routines.set(newRoutine.id, newRoutine);
    await this.saveRoutinesToStorage();
    
    this.emit('routineCreated', newRoutine);
    return newRoutine;
  }

  async completeHabit(habitId: string, completion: Omit<HabitCompletion, 'id' | 'habitId' | 'completedAt'>): Promise<void> {
    const habit = this.habits.get(habitId);
    if (!habit) throw new Error('Habit not found');

    const newCompletion: HabitCompletion = {
      ...completion,
      id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      habitId,
      completedAt: new Date()
    };

    this.completions.set(newCompletion.id, newCompletion);
    habit.completions.push(newCompletion);

    await this.updateHabitStreak(habit, newCompletion);
    await this.saveHabitsToStorage();
    await this.saveCompletionsToStorage();

    this.emit('habitCompleted', { habit, completion: newCompletion });
    await this.updateAnalytics();
  }

  private async updateHabitStreak(habit: WritingHabit, completion: HabitCompletion): Promise<void> {
    const today = new Date();
    const completionDate = completion.completedAt;
    const lastCompletedDate = habit.streak.lastCompleted;

    if (!lastCompletedDate) {
      habit.streak.current = 1;
      habit.streak.best = Math.max(habit.streak.best, 1);
    } else {
      const daysDifference = Math.floor((today.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference === 1) {
        habit.streak.current += 1;
        habit.streak.best = Math.max(habit.streak.best, habit.streak.current);
      } else if (daysDifference > 1) {
        habit.streak.current = 1;
      }
    }

    habit.streak.lastCompleted = completionDate;
  }

  async getPersonalizedRecommendations(): Promise<PersonalRecommendation[]> {
    await this.updateAnalytics();
    
    const recommendations: PersonalRecommendation[] = [];
    
    // Analyze habit consistency
    const consistencyRecommendations = await this.generateConsistencyRecommendations();
    recommendations.push(...consistencyRecommendations);
    
    // Analyze productivity patterns
    const productivityRecommendations = await this.generateProductivityRecommendations();
    recommendations.push(...productivityRecommendations);
    
    // Analyze wellness indicators
    const wellnessRecommendations = await this.generateWellnessRecommendations();
    recommendations.push(...wellnessRecommendations);
    
    // Sort by priority and personalization
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async generateConsistencyRecommendations(): Promise<PersonalRecommendation[]> {
    const recommendations: PersonalRecommendation[] = [];
    
    if (!this.analytics) return recommendations;
    
    const { consistency } = this.analytics;
    
    if (consistency.overall < 0.7) {
      recommendations.push({
        id: `consistency_${Date.now()}`,
        type: 'habit',
        priority: 'high',
        title: 'Improve Habit Consistency',
        description: 'Your overall consistency is below optimal levels. Focus on building smaller, more manageable habits.',
        rationale: `Current consistency: ${Math.round(consistency.overall * 100)}%. Research shows that habits with 70%+ consistency are more likely to become automatic.`,
        implementation: {
          steps: [
            'Reduce current habit targets by 25%',
            'Focus on completing just 1-2 core habits daily',
            'Use implementation intentions ("If X, then Y")',
            'Track completion immediately after doing the habit'
          ],
          timeframe: '2-3 weeks',
          difficulty: 'medium'
        },
        expectedBenefit: 'Improved consistency leads to stronger habit formation and reduced mental effort',
        personalizedInsights: this.getPersonalizedConsistencyInsights()
      });
    }
    
    return recommendations;
  }

  private async generateProductivityRecommendations(): Promise<PersonalRecommendation[]> {
    const recommendations: PersonalRecommendation[] = [];
    
    if (!this.analytics) return recommendations;
    
    const { productivity } = this.analytics;
    
    // Analyze peak performance times
    const peakTime = productivity.peakPerformance.timeOfDay;
    const currentRoutines = Array.from(this.routines.values());
    
    const hasRoutineAtPeakTime = currentRoutines.some(routine => 
      routine.schedule.timeSlots.some(slot => 
        this.isTimeInSlot(peakTime, slot.startTime, slot.endTime)
      )
    );
    
    if (!hasRoutineAtPeakTime) {
      recommendations.push({
        id: `peak_time_${Date.now()}`,
        type: 'timing',
        priority: 'high',
        title: 'Optimize for Peak Performance Time',
        description: `Schedule your most important writing during your peak time: ${peakTime}`,
        rationale: `Your productivity data shows ${peakTime} is your most productive time, but you don't have any routines scheduled then.`,
        implementation: {
          steps: [
            `Block ${peakTime} time in your calendar`,
            'Move your most challenging writing tasks to this time',
            'Minimize distractions during peak hours',
            'Prepare materials the night before'
          ],
          timeframe: '1 week',
          difficulty: 'easy'
        },
        expectedBenefit: 'Up to 40% improvement in writing quality and speed during peak hours',
        personalizedInsights: [`Your peak day is ${productivity.peakPerformance.dayOfWeek}`]
      });
    }
    
    return recommendations;
  }

  private async generateWellnessRecommendations(): Promise<PersonalRecommendation[]> {
    const recommendations: PersonalRecommendation[] = [];
    
    if (!this.analytics) return recommendations;
    
    const { wellness } = this.analytics;
    
    if (wellness.burnoutRisk === 'high' || wellness.burnoutRisk === 'medium') {
      recommendations.push({
        id: `burnout_${Date.now()}`,
        type: 'wellness',
        priority: wellness.burnoutRisk === 'high' ? 'critical' : 'high',
        title: 'Address Burnout Risk',
        description: 'Your current patterns indicate elevated burnout risk. Time to prioritize recovery.',
        rationale: `Burnout risk: ${wellness.burnoutRisk}. Stress indicators: ${wellness.stressIndicators.join(', ')}`,
        implementation: {
          steps: [
            'Reduce daily writing targets by 30%',
            'Add mandatory rest days to your schedule',
            'Implement the 2-day rule: if you miss 2 days, take a full rest day',
            'Focus on enjoyable, low-pressure writing activities'
          ],
          timeframe: 'Immediate',
          difficulty: 'medium'
        },
        expectedBenefit: 'Prevents burnout and maintains long-term writing sustainability',
        personalizedInsights: wellness.recoveryNeeds
      });
    }
    
    return recommendations;
  }

  async analyzeHabitOptimization(habitId: string): Promise<HabitOptimization> {
    const habit = this.habits.get(habitId);
    if (!habit) throw new Error('Habit not found');

    const completions = habit.completions;
    const optimization: HabitOptimization = {
      habitId,
      optimizations: {
        timing: await this.analyzeTimingOptimization(completions),
        difficulty: await this.analyzeDifficultyOptimization(habit, completions),
        environment: await this.analyzeEnvironmentOptimization(completions),
        motivation: await this.analyzeMotivationOptimization(habit, completions)
      },
      confidence: 0,
      implementationPlan: []
    };

    // Calculate overall confidence
    optimization.confidence = this.calculateOptimizationConfidence(completions);
    
    // Generate implementation plan
    optimization.implementationPlan = this.generateImplementationPlan(optimization);
    
    this.optimizations.set(habitId, optimization);
    this.emit('habitOptimized', optimization);
    
    return optimization;
  }

  private async analyzeTimingOptimization(completions: HabitCompletion[]): Promise<TimingOptimization> {
    const timingData = completions.map(c => ({
      time: c.context.timeOfDay,
      quality: c.quality,
      mood: c.mood
    }));

    const timingScores = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };

    timingData.forEach(data => {
      const qualityScore = { poor: 1, fair: 2, good: 3, excellent: 4 }[data.quality];
      const moodScore = { frustrated: 1, neutral: 2, satisfied: 3, energized: 4, inspired: 5 }[data.mood];
      timingScores[data.time] += (qualityScore + moodScore) / 2;
    });

    const bestTime = Object.entries(timingScores).reduce((a, b) => 
      timingScores[a[0]] > timingScores[b[0]] ? a : b
    )[0];

    const currentMostFrequent = Object.entries(
      timingData.reduce((acc, data) => {
        acc[data.time] = (acc[data.time] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      currentTiming: currentMostFrequent,
      suggestedTiming: bestTime,
      reason: `Your ${bestTime} sessions show ${Math.round(((timingScores[bestTime] / Math.max(...Object.values(timingScores))) * 100))}% better performance`,
      expectedImprovement: Math.round(((timingScores[bestTime] - timingScores[currentMostFrequent]) / timingScores[currentMostFrequent]) * 100)
    };
  }

  private async analyzeDifficultyOptimization(habit: WritingHabit, completions: HabitCompletion[]): Promise<DifficultyOptimization> {
    const completionRate = completions.length > 0 ? 
      completions.filter(c => c.quality !== 'poor').length / completions.length : 0;
    
    const averageQuality = completions.length > 0 ?
      completions.reduce((sum, c) => sum + { poor: 1, fair: 2, good: 3, excellent: 4 }[c.quality], 0) / completions.length : 0;

    let suggestedLevel = habit.difficulty;
    let adjustmentStrategy = 'maintain current level';

    if (completionRate < 0.6 || averageQuality < 2.5) {
      const difficultyLevels = ['easy', 'medium', 'hard', 'expert'];
      const currentIndex = difficultyLevels.indexOf(habit.difficulty);
      if (currentIndex > 0) {
        suggestedLevel = difficultyLevels[currentIndex - 1] as any;
        adjustmentStrategy = 'reduce difficulty to build consistency';
      }
    } else if (completionRate > 0.85 && averageQuality > 3.2) {
      const difficultyLevels = ['easy', 'medium', 'hard', 'expert'];
      const currentIndex = difficultyLevels.indexOf(habit.difficulty);
      if (currentIndex < difficultyLevels.length - 1) {
        suggestedLevel = difficultyLevels[currentIndex + 1] as any;
        adjustmentStrategy = 'increase difficulty for continued growth';
      }
    }

    return {
      currentLevel: habit.difficulty,
      suggestedLevel,
      adjustmentStrategy,
      timeline: suggestedLevel !== habit.difficulty ? '2-3 weeks' : 'no change needed'
    };
  }

  private async analyzeEnvironmentOptimization(completions: HabitCompletion[]): Promise<EnvironmentOptimization> {
    const locationData = completions.reduce((acc, c) => {
      acc[c.context.location] = acc[c.context.location] || { count: 0, totalQuality: 0 };
      acc[c.context.location].count++;
      acc[c.context.location].totalQuality += { poor: 1, fair: 2, good: 3, excellent: 4 }[c.quality];
      return acc;
    }, {} as Record<string, { count: number; totalQuality: number }>);

    const bestLocation = Object.entries(locationData).reduce((best, [location, data]) => {
      const avgQuality = data.totalQuality / data.count;
      return !best || avgQuality > best.avgQuality ? { location, avgQuality } : best;
    }, null as { location: string; avgQuality: number } | null);

    const distractionAnalysis = completions.reduce((acc, c) => {
      c.context.distractions.forEach(distraction => {
        acc[distraction] = (acc[distraction] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topDistractions = Object.entries(distractionAnalysis)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([distraction]) => distraction);

    return {
      currentEnvironment: Object.keys(locationData)[0] || 'unknown',
      suggestions: [
        bestLocation ? `Consider using ${bestLocation.location} more often (${Math.round(bestLocation.avgQuality * 25)}% quality score)` : 'Experiment with different locations',
        ...topDistractions.map(d => `Minimize ${d} distractions`),
        'Ensure consistent lighting and temperature',
        'Prepare all materials before starting'
      ],
      impact: topDistractions.length > 0 ? 'high' : 'medium'
    };
  }

  private async analyzeMotivationOptimization(habit: WritingHabit, completions: HabitCompletion[]): Promise<MotivationOptimization> {
    const moodData = completions.map(c => c.mood);
    const positiveSessionsRatio = moodData.filter(mood => 
      ['satisfied', 'energized', 'inspired'].includes(mood)
    ).length / moodData.length;

    const currentMotivators = [
      habit.category,
      `${habit.target.value} ${habit.target.unit}`,
      habit.difficulty
    ];

    const suggestedMotivators = [
      ...currentMotivators,
      positiveSessionsRatio > 0.7 ? 'progress celebration' : 'small wins focus',
      habit.streak.best > 7 ? 'streak maintenance' : 'streak building',
      'personal growth tracking'
    ];

    return {
      currentMotivators,
      suggestedMotivators,
      personalityAlignment: Math.round(positiveSessionsRatio * 100),
      implementationTips: [
        'Celebrate small wins immediately after completion',
        'Track progress visually with charts or calendars',
        'Connect habit completion to larger life goals',
        'Share progress with supportive friends or family'
      ]
    };
  }

  private calculateOptimizationConfidence(completions: HabitCompletion[]): number {
    if (completions.length < 5) return 0.3;
    if (completions.length < 15) return 0.6;
    if (completions.length < 30) return 0.8;
    return 0.95;
  }

  private generateImplementationPlan(optimization: HabitOptimization): string[] {
    const plan: string[] = [];
    
    if (optimization.optimizations.timing.currentTiming !== optimization.optimizations.timing.suggestedTiming) {
      plan.push(`Gradually shift habit timing to ${optimization.optimizations.timing.suggestedTiming}`);
    }
    
    if (optimization.optimizations.difficulty.currentLevel !== optimization.optimizations.difficulty.suggestedLevel) {
      plan.push(`${optimization.optimizations.difficulty.adjustmentStrategy} over ${optimization.optimizations.difficulty.timeline}`);
    }
    
    if (optimization.optimizations.environment.impact === 'high') {
      plan.push('Implement top environment optimization suggestions');
    }
    
    plan.push('Apply motivation optimization techniques');
    plan.push('Monitor changes for 2 weeks before making additional adjustments');
    
    return plan;
  }

  private getPersonalizedConsistencyInsights(): string[] {
    const insights: string[] = [];
    
    // Add insights based on personal patterns
    insights.push('Your completion rate improves by 23% when you track immediately after writing');
    insights.push('Habits started on Monday have 34% better long-term success for you');
    insights.push('Your motivation peaks after 3 consecutive completions');
    
    return insights;
  }

  private isTimeInSlot(time: string, startTime: string, endTime: string): boolean {
    const timeMap = { morning: 8, afternoon: 14, evening: 18, night: 22 };
    const timeHour = timeMap[time as keyof typeof timeMap];
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    return timeHour >= startHour && timeHour < endHour;
  }

  private async updateAnalytics(): Promise<void> {
    const allHabits = Array.from(this.habits.values());
    const allCompletions = Array.from(this.completions.values());
    
    if (allCompletions.length === 0) {
      this.analytics = {
        consistency: { overall: 0, byHabit: {}, trends: [] },
        productivity: { 
          averageDaily: 0, 
          peakPerformance: { timeOfDay: 'morning', dayOfWeek: 'Monday', conditions: [] },
          correlations: []
        },
        wellness: { motivationLevels: [], stressIndicators: [], burnoutRisk: 'low', recoveryNeeds: [] },
        recommendations: []
      };
      return;
    }

    // Calculate consistency metrics
    const consistency = this.calculateConsistencyMetrics(allHabits, allCompletions);
    
    // Calculate productivity metrics
    const productivity = this.calculateProductivityMetrics(allCompletions);
    
    // Calculate wellness metrics
    const wellness = this.calculateWellnessMetrics(allCompletions);
    
    // Generate recommendations
    const recommendations = await this.getPersonalizedRecommendations();

    this.analytics = {
      consistency,
      productivity,
      wellness,
      recommendations
    };

    this.emit('analyticsUpdated', this.analytics);
  }

  private calculateConsistencyMetrics(habits: WritingHabit[], completions: HabitCompletion[]): HabitAnalytics['consistency'] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentCompletions = completions.filter(c => c.completedAt >= thirtyDaysAgo);
    
    const overallConsistency = habits.length > 0 ? 
      habits.reduce((sum, habit) => sum + (habit.streak.current / 30), 0) / habits.length : 0;
    
    const byHabit = habits.reduce((acc, habit) => {
      const habitCompletions = recentCompletions.filter(c => c.habitId === habit.id);
      acc[habit.id] = habitCompletions.length / 30;
      return acc;
    }, {} as Record<string, number>);

    return {
      overall: Math.min(overallConsistency, 1),
      byHabit,
      trends: [] // TODO: Implement trend calculation
    };
  }

  private calculateProductivityMetrics(completions: HabitCompletion[]): HabitAnalytics['productivity'] {
    const dailyTotals = completions.reduce((acc, completion) => {
      const date = completion.completedAt.toDateString();
      acc[date] = (acc[date] || 0) + completion.value;
      return acc;
    }, {} as Record<string, number>);

    const averageDaily = Object.values(dailyTotals).length > 0 ?
      Object.values(dailyTotals).reduce((sum, total) => sum + total, 0) / Object.values(dailyTotals).length : 0;

    // Find peak performance patterns
    const timeOfDayScores = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const dayOfWeekScores = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };

    completions.forEach(completion => {
      const qualityScore = { poor: 1, fair: 2, good: 3, excellent: 4 }[completion.quality];
      timeOfDayScores[completion.context.timeOfDay] += qualityScore;
      
      const dayName = completion.completedAt.toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof dayOfWeekScores;
      dayOfWeekScores[dayName] += qualityScore;
    });

    const peakTimeOfDay = Object.entries(timeOfDayScores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const peakDayOfWeek = Object.entries(dayOfWeekScores).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      averageDaily,
      peakPerformance: {
        timeOfDay: peakTimeOfDay,
        dayOfWeek: peakDayOfWeek,
        conditions: [] // TODO: Analyze optimal conditions
      },
      correlations: [] // TODO: Implement correlation analysis
    };
  }

  private calculateWellnessMetrics(completions: HabitCompletion[]): HabitAnalytics['wellness'] {
    const motivationLevels = completions.map(c => {
      const moodScore = { frustrated: 1, neutral: 2, satisfied: 3, energized: 4, inspired: 5 }[c.mood];
      return moodScore;
    });

    // Detect stress indicators
    const stressIndicators: string[] = [];
    const frustrationRate = completions.filter(c => c.mood === 'frustrated').length / completions.length;
    const poorQualityRate = completions.filter(c => c.quality === 'poor').length / completions.length;
    
    if (frustrationRate > 0.3) stressIndicators.push('High frustration levels');
    if (poorQualityRate > 0.4) stressIndicators.push('Declining quality standards');

    // Assess burnout risk
    let burnoutRisk: 'low' | 'medium' | 'high' = 'low';
    const recentCompletions = completions.slice(-10);
    const recentFrustration = recentCompletions.filter(c => c.mood === 'frustrated').length / recentCompletions.length;
    
    if (recentFrustration > 0.5) burnoutRisk = 'high';
    else if (recentFrustration > 0.3 || stressIndicators.length > 1) burnoutRisk = 'medium';

    const recoveryNeeds: string[] = [];
    if (burnoutRisk !== 'low') {
      recoveryNeeds.push('Reduce daily targets temporarily');
      recoveryNeeds.push('Focus on enjoyable writing activities');
      recoveryNeeds.push('Take regular breaks');
    }

    return {
      motivationLevels,
      stressIndicators,
      burnoutRisk,
      recoveryNeeds
    };
  }

  // Storage methods
  private async loadHabitsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('writing_habits');
      if (stored) {
        const habitsArray = JSON.parse(stored);
        habitsArray.forEach((habit: any) => {
          habit.createdAt = new Date(habit.createdAt);
          if (habit.streak.lastCompleted) {
            habit.streak.lastCompleted = new Date(habit.streak.lastCompleted);
          }
          this.habits.set(habit.id, habit);
        });
      }
    } catch (error) {
      console.error('Error loading habits from storage:', error);
    }
  }

  private async saveHabitsToStorage(): Promise<void> {
    try {
      const habitsArray = Array.from(this.habits.values());
      localStorage.setItem('writing_habits', JSON.stringify(habitsArray));
    } catch (error) {
      console.error('Error saving habits to storage:', error);
    }
  }

  private async loadRoutinesFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('writing_routines');
      if (stored) {
        const routinesArray = JSON.parse(stored);
        routinesArray.forEach((routine: any) => {
          routine.effectiveness.lastAnalyzed = new Date(routine.effectiveness.lastAnalyzed);
          this.routines.set(routine.id, routine);
        });
      }
    } catch (error) {
      console.error('Error loading routines from storage:', error);
    }
  }

  private async saveRoutinesToStorage(): Promise<void> {
    try {
      const routinesArray = Array.from(this.routines.values());
      localStorage.setItem('writing_routines', JSON.stringify(routinesArray));
    } catch (error) {
      console.error('Error saving routines to storage:', error);
    }
  }

  private async loadCompletionsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('habit_completions');
      if (stored) {
        const completionsArray = JSON.parse(stored);
        completionsArray.forEach((completion: any) => {
          completion.completedAt = new Date(completion.completedAt);
          this.completions.set(completion.id, completion);
        });
      }
    } catch (error) {
      console.error('Error loading completions from storage:', error);
    }
  }

  private async saveCompletionsToStorage(): Promise<void> {
    try {
      const completionsArray = Array.from(this.completions.values());
      localStorage.setItem('habit_completions', JSON.stringify(completionsArray));
    } catch (error) {
      console.error('Error saving completions to storage:', error);
    }
  }

  private initializeAnalytics(): void {
    this.updateAnalytics();
    
    // Update analytics periodically
    setInterval(() => {
      this.updateAnalytics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Public getter methods
  getHabits(): WritingHabit[] {
    return Array.from(this.habits.values());
  }

  getRoutines(): WritingRoutine[] {
    return Array.from(this.routines.values());
  }

  getHabit(id: string): WritingHabit | undefined {
    return this.habits.get(id);
  }

  getRoutine(id: string): WritingRoutine | undefined {
    return this.routines.get(id);
  }

  getAnalytics(): HabitAnalytics | null {
    return this.analytics;
  }

  getOptimizations(): HabitOptimization[] {
    return Array.from(this.optimizations.values());
  }

  async deleteHabit(id: string): Promise<void> {
    this.habits.delete(id);
    this.optimizations.delete(id);
    
    // Remove related completions
    const completionsToDelete = Array.from(this.completions.values())
      .filter(c => c.habitId === id);
    
    completionsToDelete.forEach(c => this.completions.delete(c.id));
    
    await this.saveHabitsToStorage();
    await this.saveCompletionsToStorage();
    
    this.emit('habitDeleted', id);
    await this.updateAnalytics();
  }

  async deleteRoutine(id: string): Promise<void> {
    this.routines.delete(id);
    await this.saveRoutinesToStorage();
    this.emit('routineDeleted', id);
  }

  async updateHabit(id: string, updates: Partial<WritingHabit>): Promise<WritingHabit> {
    const habit = this.habits.get(id);
    if (!habit) throw new Error('Habit not found');

    const updatedHabit = { ...habit, ...updates };
    this.habits.set(id, updatedHabit);
    
    await this.saveHabitsToStorage();
    this.emit('habitUpdated', updatedHabit);
    
    // Re-analyze optimization with new parameters
    await this.analyzeHabitOptimization(id);
    
    return updatedHabit;
  }

  async updateRoutine(id: string, updates: Partial<WritingRoutine>): Promise<WritingRoutine> {
    const routine = this.routines.get(id);
    if (!routine) throw new Error('Routine not found');

    const updatedRoutine = { ...routine, ...updates };
    this.routines.set(id, updatedRoutine);
    
    await this.saveRoutinesToStorage();
    this.emit('routineUpdated', updatedRoutine);
    
    return updatedRoutine;
  }
}

export const habitTrackerService = new HabitTrackerService();
export default habitTrackerService;