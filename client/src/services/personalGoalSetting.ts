import { EventEmitter } from 'events';

export interface WritingGoal {
  id: string;
  title: string;
  description: string;
  type: 'word_count' | 'time_based' | 'project_based' | 'habit_based' | 'skill_based' | 'creative_based';
  category: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'project' | 'lifetime';
  priority: 'low' | 'medium' | 'high' | 'critical';
  target: GoalTarget;
  currentProgress: number;
  milestones: AdaptiveMilestone[];
  timeline: {
    startDate: Date;
    targetDate: Date;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
  };
  status: 'not_started' | 'in_progress' | 'on_track' | 'behind' | 'ahead' | 'completed' | 'paused' | 'cancelled';
  difficulty: 'easy' | 'moderate' | 'challenging' | 'ambitious' | 'stretch';
  motivation: {
    whyImportant: string;
    personalValue: number;
    externalFactors: string[];
    rewardSystem: GoalReward[];
  };
  tracking: {
    method: 'automatic' | 'manual' | 'hybrid';
    frequency: 'daily' | 'weekly' | 'session_based';
    metrics: string[];
  };
  adaptiveSettings: {
    allowAutoAdjustment: boolean;
    difficultyTolerance: number;
    progressThreshold: number;
    reassessmentFrequency: number;
  };
  personalInsights: PersonalGoalInsight[];
  relatedGoals: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalTarget {
  value: number;
  unit: 'words' | 'hours' | 'pages' | 'chapters' | 'projects' | 'sessions' | 'skills' | 'habits';
  breakdown?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  flexible: boolean;
  minimumAcceptable?: number;
  stretchTarget?: number;
}

export interface AdaptiveMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  targetValue: number;
  targetDate: Date;
  actualValue?: number;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'adjusted';
  adaptations: MilestoneAdaptation[];
  celebration?: CelebrationPlan;
  difficulty: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
  personalNotes?: string;
}

export interface MilestoneAdaptation {
  id: string;
  date: Date;
  reason: 'behind_schedule' | 'ahead_schedule' | 'difficulty_change' | 'external_factors' | 'personal_growth';
  oldTarget: number;
  newTarget: number;
  oldDate: Date;
  newDate: Date;
  confidence: number;
  rationale: string;
}

export interface CelebrationPlan {
  type: 'simple' | 'moderate' | 'significant';
  activities: string[];
  shareWith: string[];
  reflectionPrompts: string[];
  nextStepPrep: string[];
}

export interface GoalReward {
  id: string;
  type: 'intrinsic' | 'extrinsic' | 'social' | 'experiential';
  description: string;
  triggerCondition: string;
  value: number;
  earned: boolean;
  earnedDate?: Date;
}

export interface PersonalGoalInsight {
  id: string;
  goalId: string;
  category: 'pattern' | 'strength' | 'challenge' | 'opportunity' | 'warning';
  insight: string;
  evidence: string[];
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  dateDiscovered: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface GoalProgress {
  goalId: string;
  date: Date;
  value: number;
  method: 'manual_entry' | 'automatic_tracking' | 'session_completion' | 'milestone_achievement';
  notes?: string;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  mood?: 'frustrated' | 'neutral' | 'satisfied' | 'motivated' | 'excited';
  context?: {
    timeOfDay: string;
    duration: number;
    environment: string;
    challenges: string[];
  };
}

export interface GoalAnalytics {
  goalId: string;
  overallProgress: {
    percentComplete: number;
    daysRemaining: number;
    currentPace: number;
    requiredPace: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  milestoneAnalysis: {
    completedOnTime: number;
    averageDelay: number;
    adaptationFrequency: number;
    successRate: number;
  };
  patterns: {
    bestPerformanceDays: string[];
    optimalSessionLength: number;
    motivationCorrelations: Array<{ factor: string; correlation: number }>;
    challengePeriods: Array<{ period: string; challenges: string[] }>;
  };
  predictions: {
    estimatedCompletion: Date;
    probabilityOfSuccess: number;
    riskFactors: string[];
    recommendations: string[];
  };
  personalizedInsights: {
    strengthsIdentified: string[];
    improvementAreas: string[];
    adaptationSuggestions: string[];
    motivationOptimizations: string[];
  };
}

export interface GoalRecommendation {
  id: string;
  type: 'new_goal' | 'adjustment' | 'milestone_change' | 'strategy_change' | 'timeline_adjustment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  implementation: {
    steps: string[];
    timeframe: string;
    difficulty: 'easy' | 'medium' | 'hard';
    resources: string[];
  };
  expectedBenefit: string;
  confidence: number;
  personalAlignment: number;
  relatedGoals: string[];
}

export interface SmartGoalSuggestion {
  type: WritingGoal['type'];
  category: WritingGoal['category'];
  title: string;
  description: string;
  suggestedTarget: GoalTarget;
  suggestedTimeline: number;
  difficulty: WritingGoal['difficulty'];
  reasoning: string;
  personalAlignment: number;
  prerequisites: string[];
  benefits: string[];
  similarGoalSuccessRate: number;
}

class PersonalGoalSettingService extends EventEmitter {
  private goals: Map<string, WritingGoal> = new Map();
  private progress: Map<string, GoalProgress[]> = new Map();
  private analytics: Map<string, GoalAnalytics> = new Map();
  private recommendations: GoalRecommendation[] = [];

  constructor() {
    super();
    this.loadDataFromStorage();
    this.initializeAnalytics();
    this.schedulePeriodicReviews();
  }

  async createGoal(goalData: Omit<WritingGoal, 'id' | 'currentProgress' | 'milestones' | 'status' | 'personalInsights' | 'createdAt' | 'updatedAt'>): Promise<WritingGoal> {
    const goal: WritingGoal = {
      ...goalData,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentProgress: 0,
      milestones: [],
      status: 'not_started',
      personalInsights: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate adaptive milestones
    goal.milestones = await this.generateAdaptiveMilestones(goal);

    this.goals.set(goal.id, goal);
    this.progress.set(goal.id, []);
    
    await this.saveGoalsToStorage();
    await this.analyzeGoal(goal.id);
    
    this.emit('goalCreated', goal);
    return goal;
  }

  async generateAdaptiveMilestones(goal: WritingGoal): Promise<AdaptiveMilestone[]> {
    const milestones: AdaptiveMilestone[] = [];
    const totalDuration = goal.timeline.targetDate.getTime() - goal.timeline.startDate.getTime();
    const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
    
    // Determine milestone frequency based on goal category
    let milestoneCount: number;
    switch (goal.category) {
      case 'daily':
        milestoneCount = Math.min(totalDays, 1);
        break;
      case 'weekly':
        milestoneCount = Math.min(Math.ceil(totalDays / 7), 3);
        break;
      case 'monthly':
        milestoneCount = Math.min(Math.ceil(totalDays / 30), 4);
        break;
      case 'quarterly':
        milestoneCount = Math.min(Math.ceil(totalDays / 90), 6);
        break;
      case 'yearly':
        milestoneCount = Math.min(Math.ceil(totalDays / 365), 12);
        break;
      case 'project':
        milestoneCount = this.calculateProjectMilestones(goal);
        break;
      default:
        milestoneCount = Math.max(2, Math.min(8, Math.ceil(totalDays / 30)));
    }

    // Generate milestones with adaptive difficulty curve
    for (let i = 0; i < milestoneCount; i++) {
      const progress = (i + 1) / milestoneCount;
      const milestone = await this.createAdaptiveMilestone(goal, i, progress, totalDuration);
      milestones.push(milestone);
    }

    return milestones;
  }

  private async createAdaptiveMilestone(goal: WritingGoal, index: number, progress: number, totalDuration: number): Promise<AdaptiveMilestone> {
    // Apply adaptive difficulty curve - easier start, challenging middle, achievable end
    const difficultyMultiplier = this.calculateDifficultyMultiplier(progress, goal.difficulty);
    const targetValue = Math.round(goal.target.value * progress * difficultyMultiplier);
    
    const milestoneDate = new Date(goal.timeline.startDate.getTime() + (totalDuration * progress));
    
    const milestone: AdaptiveMilestone = {
      id: `milestone_${Date.now()}_${index}`,
      goalId: goal.id,
      title: this.generateMilestoneTitle(goal, index + 1, targetValue),
      description: this.generateMilestoneDescription(goal, targetValue, milestoneDate),
      targetValue,
      targetDate: milestoneDate,
      status: 'pending',
      adaptations: [],
      difficulty: this.calculateMilestoneDifficulty(progress, goal.difficulty),
      importance: this.calculateMilestoneImportance(progress, index, goal.milestones?.length || 0),
      celebration: this.generateCelebrationPlan(progress, goal.motivation.personalValue)
    };

    return milestone;
  }

  private calculateDifficultyMultiplier(progress: number, goalDifficulty: WritingGoal['difficulty']): number {
    const baseMultipliers = {
      easy: 1.0,
      moderate: 0.95,
      challenging: 0.9,
      ambitious: 0.85,
      stretch: 0.8
    };

    const baseMult = baseMultipliers[goalDifficulty];
    
    // Apply S-curve for progressive difficulty
    if (progress < 0.3) {
      return baseMult * (0.7 + 0.3 * (progress / 0.3));
    } else if (progress < 0.7) {
      return baseMult * (1.0 + 0.1 * Math.sin((progress - 0.3) * Math.PI * 2.5));
    } else {
      return baseMult * (1.05 - 0.05 * ((progress - 0.7) / 0.3));
    }
  }

  private calculateMilestoneDifficulty(progress: number, goalDifficulty: WritingGoal['difficulty']): number {
    const baseDifficulty = {
      easy: 0.3,
      moderate: 0.5,
      challenging: 0.7,
      ambitious: 0.8,
      stretch: 0.9
    }[goalDifficulty];

    // Middle milestones are typically harder
    const progressMultiplier = 1 + 0.3 * Math.sin(progress * Math.PI);
    
    return Math.min(1.0, baseDifficulty * progressMultiplier);
  }

  private calculateMilestoneImportance(progress: number, index: number, totalMilestones: number): AdaptiveMilestone['importance'] {
    // First and last milestones are critical
    if (index === 0 || index === totalMilestones - 1) return 'critical';
    
    // Middle milestones based on progress
    if (progress > 0.4 && progress < 0.7) return 'high';
    if (progress > 0.2 && progress < 0.9) return 'medium';
    
    return 'low';
  }

  private generateMilestoneTitle(goal: WritingGoal, milestoneNumber: number, targetValue: number): string {
    const templates = {
      word_count: `Milestone ${milestoneNumber}: ${targetValue.toLocaleString()} words`,
      time_based: `Milestone ${milestoneNumber}: ${targetValue} hours`,
      project_based: `Milestone ${milestoneNumber}: ${targetValue} projects completed`,
      habit_based: `Milestone ${milestoneNumber}: ${targetValue} consistent days`,
      skill_based: `Milestone ${milestoneNumber}: ${targetValue} skills mastered`,
      creative_based: `Milestone ${milestoneNumber}: ${targetValue} creative pieces`
    };

    return templates[goal.type] || `Milestone ${milestoneNumber}: ${targetValue} ${goal.target.unit}`;
  }

  private generateMilestoneDescription(goal: WritingGoal, targetValue: number, date: Date): string {
    const formattedDate = date.toLocaleDateString();
    return `Reach ${targetValue} ${goal.target.unit} by ${formattedDate}. This milestone brings you ${Math.round((targetValue / goal.target.value) * 100)}% towards your goal: "${goal.title}".`;
  }

  private generateCelebrationPlan(progress: number, personalValue: number): CelebrationPlan {
    const celebrationIntensity = progress * personalValue;
    
    if (celebrationIntensity < 0.3) {
      return {
        type: 'simple',
        activities: ['Take a moment to acknowledge progress', 'Write a brief reflection'],
        shareWith: [],
        reflectionPrompts: ['What went well?', 'What did I learn?'],
        nextStepPrep: ['Review next milestone', 'Adjust if needed']
      };
    } else if (celebrationIntensity < 0.7) {
      return {
        type: 'moderate',
        activities: ['Treat yourself to something small', 'Share progress with a friend', 'Take photos/screenshots'],
        shareWith: ['close friend', 'writing buddy'],
        reflectionPrompts: ['How has my writing improved?', 'What strategies worked best?', 'What am I most proud of?'],
        nextStepPrep: ['Plan next phase strategy', 'Identify needed resources', 'Set environment']
      };
    } else {
      return {
        type: 'significant',
        activities: ['Plan a special celebration', 'Document the journey', 'Share widely', 'Reward yourself meaningfully'],
        shareWith: ['family', 'friends', 'writing community', 'social media'],
        reflectionPrompts: ['How has this changed me as a writer?', 'What obstacles did I overcome?', 'What wisdom can I share?', 'How will I build on this success?'],
        nextStepPrep: ['Conduct thorough review', 'Plan advanced strategies', 'Consider stretch goals', 'Prepare for next level']
      };
    }
  }

  private calculateProjectMilestones(goal: WritingGoal): number {
    // For project-based goals, create milestones based on typical project phases
    const projectPhases = ['Planning', 'First Draft', 'Revision', 'Final Polish', 'Completion'];
    return Math.min(goal.target.value * projectPhases.length, 10);
  }

  async updateProgress(goalId: string, progressData: Omit<GoalProgress, 'goalId' | 'date'>): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');

    const progress: GoalProgress = {
      ...progressData,
      goalId,
      date: new Date()
    };

    const goalProgress = this.progress.get(goalId) || [];
    goalProgress.push(progress);
    this.progress.set(goalId, goalProgress);

    // Update goal's current progress
    goal.currentProgress = this.calculateTotalProgress(goalId);
    goal.updatedAt = new Date();

    // Update goal status
    await this.updateGoalStatus(goal);

    // Check milestone completions
    await this.checkMilestoneCompletions(goal);

    // Trigger adaptive adjustments if needed
    if (goal.adaptiveSettings.allowAutoAdjustment) {
      await this.evaluateAdaptiveAdjustments(goal);
    }

    await this.saveGoalsToStorage();
    await this.saveProgressToStorage();
    await this.analyzeGoal(goalId);

    this.emit('progressUpdated', { goal, progress });
  }

  private calculateTotalProgress(goalId: string): number {
    const progressEntries = this.progress.get(goalId) || [];
    if (progressEntries.length === 0) return 0;

    // Sum all progress values
    return progressEntries.reduce((total, entry) => total + entry.value, 0);
  }

  private async updateGoalStatus(goal: WritingGoal): Promise<void> {
    const progressPercentage = (goal.currentProgress / goal.target.value) * 100;
    const today = new Date();
    const daysRemaining = Math.ceil((goal.timeline.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((goal.timeline.targetDate.getTime() - goal.timeline.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = ((totalDays - daysRemaining) / totalDays) * 100;

    if (progressPercentage >= 100) {
      goal.status = 'completed';
      goal.timeline.actualCompletion = today;
    } else if (goal.status === 'not_started' && progressPercentage > 0) {
      goal.status = 'in_progress';
    } else if (goal.status === 'in_progress' || goal.status === 'on_track' || goal.status === 'behind' || goal.status === 'ahead') {
      const variance = progressPercentage - expectedProgress;
      
      if (variance > 15) {
        goal.status = 'ahead';
      } else if (variance < -15) {
        goal.status = 'behind';
      } else {
        goal.status = 'on_track';
      }
    }
  }

  private async checkMilestoneCompletions(goal: WritingGoal): Promise<void> {
    const today = new Date();
    
    for (const milestone of goal.milestones) {
      if (milestone.status === 'pending' || milestone.status === 'in_progress') {
        if (goal.currentProgress >= milestone.targetValue) {
          milestone.status = 'completed';
          milestone.completedDate = today;
          milestone.actualValue = goal.currentProgress;
          
          this.emit('milestoneCompleted', { goal, milestone });
          
          // Execute celebration plan
          if (milestone.celebration) {
            this.emit('celebrationTriggered', milestone.celebration);
          }
        } else if (today > milestone.targetDate && milestone.status !== 'overdue') {
          milestone.status = 'overdue';
          this.emit('milestoneOverdue', { goal, milestone });
        } else if (goal.currentProgress > 0 && milestone.status === 'pending') {
          milestone.status = 'in_progress';
        }
      }
    }
  }

  private async evaluateAdaptiveAdjustments(goal: WritingGoal): Promise<void> {
    const analytics = this.analytics.get(goal.id);
    if (!analytics) return;

    const { overallProgress, predictions } = analytics;
    
    // Check if adjustments are needed based on current performance
    if (overallProgress.trend === 'declining' && predictions.probabilityOfSuccess < 0.6) {
      await this.suggestGoalAdjustments(goal, 'performance_decline');
    } else if (overallProgress.trend === 'improving' && overallProgress.currentPace > overallProgress.requiredPace * 1.5) {
      await this.suggestGoalAdjustments(goal, 'exceeding_expectations');
    }

    // Check overdue milestones for adjustment
    const overdueMilestones = goal.milestones.filter(m => m.status === 'overdue');
    if (overdueMilestones.length > 0) {
      await this.adaptOverdueMilestones(goal, overdueMilestones);
    }
  }

  private async suggestGoalAdjustments(goal: WritingGoal, reason: 'performance_decline' | 'exceeding_expectations'): Promise<void> {
    const recommendations: GoalRecommendation[] = [];

    if (reason === 'performance_decline') {
      recommendations.push({
        id: `rec_${Date.now()}_decline`,
        type: 'adjustment',
        priority: 'high',
        title: 'Consider Goal Adjustment',
        description: 'Your current pace suggests the goal may be too ambitious. Consider adjusting targets or timeline.',
        rationale: 'Maintaining achievable goals helps sustain motivation and builds confidence.',
        implementation: {
          steps: [
            'Review current target and timeline',
            'Identify specific challenges',
            'Adjust target by 20-30% or extend timeline',
            'Update milestones accordingly'
          ],
          timeframe: 'This week',
          difficulty: 'easy',
          resources: ['Goal adjustment worksheet', 'Progress analysis']
        },
        expectedBenefit: 'Improved motivation and realistic expectations',
        confidence: 0.8,
        personalAlignment: goal.motivation.personalValue,
        relatedGoals: goal.relatedGoals
      });
    } else {
      recommendations.push({
        id: `rec_${Date.now()}_exceed`,
        type: 'adjustment',
        priority: 'medium',
        title: 'Consider Stretch Goals',
        description: 'You\'re exceeding expectations! Consider increasing your target or adding related goals.',
        rationale: 'You have capacity for more ambitious targets while maintaining current momentum.',
        implementation: {
          steps: [
            'Analyze current success factors',
            'Increase target by 15-25%',
            'Add complementary goals',
            'Maintain sustainable pace'
          ],
          timeframe: 'Next milestone review',
          difficulty: 'medium',
          resources: ['Success analysis', 'Stretch goal templates']
        },
        expectedBenefit: 'Maximized potential and continued growth',
        confidence: 0.7,
        personalAlignment: goal.motivation.personalValue,
        relatedGoals: goal.relatedGoals
      });
    }

    this.recommendations.push(...recommendations);
    this.emit('recommendationsUpdated', recommendations);
  }

  private async adaptOverdueMilestones(goal: WritingGoal, overdueMilestones: AdaptiveMilestone[]): Promise<void> {
    for (const milestone of overdueMilestones) {
      const adaptation: MilestoneAdaptation = {
        id: `adapt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date(),
        reason: 'behind_schedule',
        oldTarget: milestone.targetValue,
        newTarget: Math.round(milestone.targetValue * 0.8), // Reduce by 20%
        oldDate: milestone.targetDate,
        newDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Add 1 week
        confidence: 0.7,
        rationale: 'Adjusted target and timeline to maintain achievability while accounting for current progress rate'
      };

      milestone.adaptations.push(adaptation);
      milestone.targetValue = adaptation.newTarget;
      milestone.targetDate = adaptation.newDate;
      milestone.status = 'adjusted';

      this.emit('milestoneAdapted', { goal, milestone, adaptation });
    }

    await this.saveGoalsToStorage();
  }

  async analyzeGoal(goalId: string): Promise<GoalAnalytics> {
    const goal = this.goals.get(goalId);
    const progressEntries = this.progress.get(goalId) || [];
    
    if (!goal) throw new Error('Goal not found');

    const analytics: GoalAnalytics = {
      goalId,
      overallProgress: this.calculateOverallProgress(goal, progressEntries),
      milestoneAnalysis: this.analyzeMilestones(goal),
      patterns: this.analyzePatterns(progressEntries),
      predictions: await this.generatePredictions(goal, progressEntries),
      personalizedInsights: await this.generatePersonalizedInsights(goal, progressEntries)
    };

    this.analytics.set(goalId, analytics);
    this.emit('analyticsUpdated', { goalId, analytics });
    
    return analytics;
  }

  private calculateOverallProgress(goal: WritingGoal, progressEntries: GoalProgress[]): GoalAnalytics['overallProgress'] {
    const percentComplete = (goal.currentProgress / goal.target.value) * 100;
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((goal.timeline.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate current pace (progress per day)
    const totalDays = Math.ceil((today.getTime() - goal.timeline.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentPace = totalDays > 0 ? goal.currentProgress / totalDays : 0;
    
    // Calculate required pace
    const requiredPace = daysRemaining > 0 ? (goal.target.value - goal.currentProgress) / daysRemaining : 0;
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (progressEntries.length >= 7) {
      const recentEntries = progressEntries.slice(-7);
      const recentAverage = recentEntries.reduce((sum, entry) => sum + entry.value, 0) / recentEntries.length;
      const olderEntries = progressEntries.slice(-14, -7);
      
      if (olderEntries.length > 0) {
        const olderAverage = olderEntries.reduce((sum, entry) => sum + entry.value, 0) / olderEntries.length;
        if (recentAverage > olderAverage * 1.1) trend = 'improving';
        else if (recentAverage < olderAverage * 0.9) trend = 'declining';
      }
    }

    return {
      percentComplete: Math.min(100, percentComplete),
      daysRemaining,
      currentPace,
      requiredPace,
      trend
    };
  }

  private analyzeMilestones(goal: WritingGoal): GoalAnalytics['milestoneAnalysis'] {
    const completedMilestones = goal.milestones.filter(m => m.status === 'completed');
    const totalMilestones = goal.milestones.length;
    
    let totalDelay = 0;
    let onTimeCount = 0;
    let adaptationCount = 0;

    completedMilestones.forEach(milestone => {
      if (milestone.completedDate && milestone.targetDate) {
        const delay = milestone.completedDate.getTime() - milestone.targetDate.getTime();
        totalDelay += Math.max(0, delay / (1000 * 60 * 60 * 24)); // Days
        
        if (delay <= 0) onTimeCount++;
      }
      
      adaptationCount += milestone.adaptations.length;
    });

    return {
      completedOnTime: totalMilestones > 0 ? onTimeCount / totalMilestones : 0,
      averageDelay: completedMilestones.length > 0 ? totalDelay / completedMilestones.length : 0,
      adaptationFrequency: totalMilestones > 0 ? adaptationCount / totalMilestones : 0,
      successRate: totalMilestones > 0 ? completedMilestones.length / totalMilestones : 0
    };
  }

  private analyzePatterns(progressEntries: GoalProgress[]): GoalAnalytics['patterns'] {
    // Analyze best performance days
    const dayPerformance: Record<string, { total: number; count: number }> = {};
    const sessionLengths: number[] = [];
    const motivationFactors: Record<string, number> = {};

    progressEntries.forEach(entry => {
      const dayName = entry.date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!dayPerformance[dayName]) {
        dayPerformance[dayName] = { total: 0, count: 0 };
      }
      dayPerformance[dayName].total += entry.value;
      dayPerformance[dayName].count++;

      if (entry.context?.duration) {
        sessionLengths.push(entry.context.duration);
      }

      if (entry.mood && entry.mood !== 'neutral') {
        motivationFactors[entry.mood] = (motivationFactors[entry.mood] || 0) + entry.value;
      }
    });

    const bestPerformanceDays = Object.entries(dayPerformance)
      .map(([day, data]) => ({ day, average: data.total / data.count }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 3)
      .map(item => item.day);

    const optimalSessionLength = sessionLengths.length > 0 ?
      sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length : 0;

    const motivationCorrelations = Object.entries(motivationFactors)
      .map(([factor, value]) => ({
        factor,
        correlation: value / progressEntries.length
      }))
      .sort((a, b) => b.correlation - a.correlation);

    return {
      bestPerformanceDays,
      optimalSessionLength,
      motivationCorrelations,
      challengePeriods: [] // TODO: Implement challenge period detection
    };
  }

  private async generatePredictions(goal: WritingGoal, progressEntries: GoalProgress[]): Promise<GoalAnalytics['predictions']> {
    // Simple linear prediction based on current pace
    const currentPace = this.calculateCurrentPace(progressEntries);
    const remainingProgress = goal.target.value - goal.currentProgress;
    const estimatedDaysToCompletion = currentPace > 0 ? remainingProgress / currentPace : Infinity;
    
    const estimatedCompletion = new Date(Date.now() + estimatedDaysToCompletion * 24 * 60 * 60 * 1000);
    
    // Calculate probability of success
    const today = new Date();
    const daysRemaining = Math.ceil((goal.timeline.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const probabilityOfSuccess = Math.min(1, Math.max(0, daysRemaining / estimatedDaysToCompletion));

    // Identify risk factors
    const riskFactors: string[] = [];
    if (probabilityOfSuccess < 0.7) riskFactors.push('Current pace insufficient');
    if (goal.milestones.filter(m => m.status === 'overdue').length > 0) riskFactors.push('Overdue milestones');
    if (progressEntries.length > 0 && progressEntries.slice(-5).every(e => e.mood === 'frustrated')) {
      riskFactors.push('Declining motivation');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (probabilityOfSuccess < 0.5) {
      recommendations.push('Consider adjusting target or timeline');
      recommendations.push('Increase daily/weekly commitment');
    } else if (probabilityOfSuccess > 0.9) {
      recommendations.push('Consider stretch goals');
    }

    return {
      estimatedCompletion,
      probabilityOfSuccess,
      riskFactors,
      recommendations
    };
  }

  private calculateCurrentPace(progressEntries: GoalProgress[]): number {
    if (progressEntries.length < 2) return 0;

    const recentEntries = progressEntries.slice(-7); // Last week
    const totalProgress = recentEntries.reduce((sum, entry) => sum + entry.value, 0);
    const daysSpanned = Math.max(1, Math.ceil(
      (recentEntries[recentEntries.length - 1].date.getTime() - recentEntries[0].date.getTime()) / (1000 * 60 * 60 * 24)
    ));

    return totalProgress / daysSpanned;
  }

  private async generatePersonalizedInsights(goal: WritingGoal, progressEntries: GoalProgress[]): Promise<GoalAnalytics['personalizedInsights']> {
    const insights: GoalAnalytics['personalizedInsights'] = {
      strengthsIdentified: [],
      improvementAreas: [],
      adaptationSuggestions: [],
      motivationOptimizations: []
    };

    // Analyze strengths
    const consistentDays = this.findConsistentPatterns(progressEntries);
    if (consistentDays.length > 0) {
      insights.strengthsIdentified.push(`Consistent performance on ${consistentDays.join(', ')}`);
    }

    const highQualityEntries = progressEntries.filter(e => e.quality === 'excellent' || e.quality === 'good');
    if (highQualityEntries.length > progressEntries.length * 0.6) {
      insights.strengthsIdentified.push('Maintaining high quality standards');
    }

    // Identify improvement areas
    const lowMotivationEntries = progressEntries.filter(e => e.mood === 'frustrated');
    if (lowMotivationEntries.length > progressEntries.length * 0.3) {
      insights.improvementAreas.push('Address motivation and frustration patterns');
    }

    const irregularProgress = this.detectIrregularProgress(progressEntries);
    if (irregularProgress) {
      insights.improvementAreas.push('Establish more consistent work rhythm');
    }

    // Suggest adaptations
    if (goal.adaptiveSettings.allowAutoAdjustment) {
      insights.adaptationSuggestions.push('Enable automatic milestone adjustments');
    }

    // Motivation optimizations
    const bestMoodDays = progressEntries
      .filter(e => e.mood === 'excited' || e.mood === 'motivated')
      .map(e => e.date.toLocaleDateString('en-US', { weekday: 'long' }));
    
    if (bestMoodDays.length > 0) {
      const mostCommonDay = this.findMostCommon(bestMoodDays);
      insights.motivationOptimizations.push(`Schedule important work on ${mostCommonDay}`);
    }

    return insights;
  }

  private findConsistentPatterns(progressEntries: GoalProgress[]): string[] {
    const dayPattern: Record<string, number> = {};
    
    progressEntries.forEach(entry => {
      const day = entry.date.toLocaleDateString('en-US', { weekday: 'long' });
      dayPattern[day] = (dayPattern[day] || 0) + 1;
    });

    return Object.entries(dayPattern)
      .filter(([_, count]) => count >= 3)
      .map(([day]) => day);
  }

  private detectIrregularProgress(progressEntries: GoalProgress[]): boolean {
    if (progressEntries.length < 7) return false;

    const gaps = [];
    for (let i = 1; i < progressEntries.length; i++) {
      const gap = progressEntries[i].date.getTime() - progressEntries[i - 1].date.getTime();
      gaps.push(gap / (1000 * 60 * 60 * 24)); // Days
    }

    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - averageGap, 2), 0) / gaps.length;

    return variance > averageGap * 2; // High variance indicates irregularity
  }

  private findMostCommon(array: string[]): string {
    const frequency: Record<string, number> = {};
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.entries(frequency).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  async generateSmartGoalSuggestions(userPreferences?: {
    focusAreas?: string[];
    timeAvailability?: number;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    motivationFactors?: string[];
  }): Promise<SmartGoalSuggestion[]> {
    const suggestions: SmartGoalSuggestion[] = [];

    // Analyze existing goals for patterns
    const existingGoals = Array.from(this.goals.values());
    const successfulGoalTypes = this.identifySuccessfulGoalPatterns(existingGoals);

    // Generate suggestions based on different goal types
    const suggestionTemplates = this.getGoalSuggestionTemplates();
    
    for (const template of suggestionTemplates) {
      const suggestion = await this.personalizeGoalSuggestion(template, userPreferences, successfulGoalTypes);
      if (suggestion.personalAlignment > 0.6) {
        suggestions.push(suggestion);
      }
    }

    // Sort by personal alignment and success probability
    suggestions.sort((a, b) => 
      (b.personalAlignment * b.similarGoalSuccessRate) - (a.personalAlignment * a.similarGoalSuccessRate)
    );

    return suggestions.slice(0, 8); // Return top 8 suggestions
  }

  private identifySuccessfulGoalPatterns(goals: WritingGoal[]): { type: string; category: string; difficulty: string }[] {
    return goals
      .filter(goal => goal.status === 'completed' || goal.status === 'on_track' || goal.status === 'ahead')
      .map(goal => ({
        type: goal.type,
        category: goal.category,
        difficulty: goal.difficulty
      }));
  }

  private getGoalSuggestionTemplates(): Omit<SmartGoalSuggestion, 'personalAlignment' | 'similarGoalSuccessRate'>[] {
    return [
      {
        type: 'word_count',
        category: 'daily',
        title: 'Daily Writing Habit',
        description: 'Build a consistent daily writing practice',
        suggestedTarget: { value: 500, unit: 'words', flexible: true, minimumAcceptable: 300, stretchTarget: 750 },
        suggestedTimeline: 30,
        difficulty: 'moderate',
        reasoning: 'Daily habits are easier to maintain and build momentum',
        prerequisites: ['15-30 minutes daily', 'Quiet writing space'],
        benefits: ['Improved writing fluency', 'Consistent progress', 'Habit formation']
      },
      {
        type: 'project_based',
        category: 'monthly',
        title: 'Short Story Collection',
        description: 'Complete a series of short stories',
        suggestedTarget: { value: 3, unit: 'projects', flexible: true, minimumAcceptable: 2, stretchTarget: 5 },
        suggestedTimeline: 90,
        difficulty: 'challenging',
        reasoning: 'Short stories allow for completion satisfaction while building skills',
        prerequisites: ['Story ideas', 'Character development skills', 'Plot structure knowledge'],
        benefits: ['Portfolio building', 'Skill development', 'Achievement satisfaction']
      },
      {
        type: 'skill_based',
        category: 'weekly',
        title: 'Writing Technique Mastery',
        description: 'Master specific writing techniques through focused practice',
        suggestedTarget: { value: 4, unit: 'skills', flexible: true, minimumAcceptable: 3, stretchTarget: 6 },
        suggestedTimeline: 56,
        difficulty: 'moderate',
        reasoning: 'Focused skill development creates measurable improvement',
        prerequisites: ['Learning resources', 'Practice time', 'Feedback system'],
        benefits: ['Skill enhancement', 'Confidence building', 'Technical improvement']
      }
    ];
  }

  private async personalizeGoalSuggestion(
    template: Omit<SmartGoalSuggestion, 'personalAlignment' | 'similarGoalSuccessRate'>,
    userPreferences?: any,
    successfulPatterns?: any[]
  ): Promise<SmartGoalSuggestion> {
    let personalAlignment = 0.5; // Base alignment
    
    // Adjust based on user preferences
    if (userPreferences?.focusAreas?.includes(template.type)) {
      personalAlignment += 0.2;
    }
    
    if (userPreferences?.experienceLevel === 'beginner' && template.difficulty === 'easy') {
      personalAlignment += 0.15;
    } else if (userPreferences?.experienceLevel === 'advanced' && template.difficulty === 'challenging') {
      personalAlignment += 0.15;
    }

    // Calculate success rate based on similar goals
    const similarGoalSuccessRate = successfulPatterns?.filter(pattern => 
      pattern.type === template.type && pattern.difficulty === template.difficulty
    ).length / Math.max(1, successfulPatterns?.length || 1);

    return {
      ...template,
      personalAlignment: Math.min(1, personalAlignment),
      similarGoalSuccessRate: similarGoalSuccessRate || 0.7 // Default success rate
    };
  }

  private schedulePeriodicReviews(): void {
    // Schedule daily progress checks
    setInterval(() => {
      this.performDailyReview();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Schedule weekly milestone reviews
    setInterval(() => {
      this.performWeeklyReview();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  private async performDailyReview(): Promise<void> {
    const activeGoals = Array.from(this.goals.values())
      .filter(goal => goal.status === 'in_progress' || goal.status === 'on_track' || goal.status === 'behind' || goal.status === 'ahead');

    for (const goal of activeGoals) {
      await this.analyzeGoal(goal.id);
      
      // Check for needed adaptations
      if (goal.adaptiveSettings.allowAutoAdjustment) {
        await this.evaluateAdaptiveAdjustments(goal);
      }
    }

    this.emit('dailyReviewCompleted', { reviewedGoals: activeGoals.length });
  }

  private async performWeeklyReview(): Promise<void> {
    const allGoals = Array.from(this.goals.values());
    
    // Generate new recommendations
    this.recommendations = [];
    
    for (const goal of allGoals) {
      if (goal.status === 'in_progress' || goal.status === 'on_track' || goal.status === 'behind' || goal.status === 'ahead') {
        const analytics = this.analytics.get(goal.id);
        if (analytics && analytics.predictions.probabilityOfSuccess < 0.7) {
          await this.suggestGoalAdjustments(goal, 'performance_decline');
        }
      }
    }

    this.emit('weeklyReviewCompleted', { 
      totalGoals: allGoals.length,
      newRecommendations: this.recommendations.length
    });
  }

  private initializeAnalytics(): void {
    // Initialize analytics for existing goals
    Array.from(this.goals.keys()).forEach(goalId => {
      this.analyzeGoal(goalId);
    });
  }

  // Storage methods
  private async loadDataFromStorage(): Promise<void> {
    await Promise.all([
      this.loadGoalsFromStorage(),
      this.loadProgressFromStorage()
    ]);
  }

  private async loadGoalsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('personal_goals');
      if (stored) {
        const goalsArray = JSON.parse(stored);
        goalsArray.forEach((goal: any) => {
          goal.timeline.startDate = new Date(goal.timeline.startDate);
          goal.timeline.targetDate = new Date(goal.timeline.targetDate);
          if (goal.timeline.estimatedCompletion) {
            goal.timeline.estimatedCompletion = new Date(goal.timeline.estimatedCompletion);
          }
          if (goal.timeline.actualCompletion) {
            goal.timeline.actualCompletion = new Date(goal.timeline.actualCompletion);
          }
          goal.createdAt = new Date(goal.createdAt);
          goal.updatedAt = new Date(goal.updatedAt);
          
          // Convert milestone dates
          goal.milestones.forEach((milestone: any) => {
            milestone.targetDate = new Date(milestone.targetDate);
            if (milestone.completedDate) {
              milestone.completedDate = new Date(milestone.completedDate);
            }
            milestone.adaptations.forEach((adaptation: any) => {
              adaptation.date = new Date(adaptation.date);
              adaptation.oldDate = new Date(adaptation.oldDate);
              adaptation.newDate = new Date(adaptation.newDate);
            });
          });

          this.goals.set(goal.id, goal);
        });
      }
    } catch (error) {
      console.error('Error loading goals from storage:', error);
    }
  }

  private async saveGoalsToStorage(): Promise<void> {
    try {
      const goalsArray = Array.from(this.goals.values());
      localStorage.setItem('personal_goals', JSON.stringify(goalsArray));
    } catch (error) {
      console.error('Error saving goals to storage:', error);
    }
  }

  private async loadProgressFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('goal_progress');
      if (stored) {
        const progressData = JSON.parse(stored);
        Object.entries(progressData).forEach(([goalId, progressArray]: [string, any]) => {
          const progress = progressArray.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          }));
          this.progress.set(goalId, progress);
        });
      }
    } catch (error) {
      console.error('Error loading progress from storage:', error);
    }
  }

  private async saveProgressToStorage(): Promise<void> {
    try {
      const progressData: Record<string, GoalProgress[]> = {};
      this.progress.forEach((progress, goalId) => {
        progressData[goalId] = progress;
      });
      localStorage.setItem('goal_progress', JSON.stringify(progressData));
    } catch (error) {
      console.error('Error saving progress to storage:', error);
    }
  }

  // Public getter methods
  getGoals(filter?: { status?: WritingGoal['status']; category?: WritingGoal['category'] }): WritingGoal[] {
    let goals = Array.from(this.goals.values());
    
    if (filter?.status) {
      goals = goals.filter(goal => goal.status === filter.status);
    }
    
    if (filter?.category) {
      goals = goals.filter(goal => goal.category === filter.category);
    }
    
    return goals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getGoal(id: string): WritingGoal | undefined {
    return this.goals.get(id);
  }

  getGoalProgress(goalId: string): GoalProgress[] {
    return this.progress.get(goalId) || [];
  }

  getGoalAnalytics(goalId: string): GoalAnalytics | undefined {
    return this.analytics.get(goalId);
  }

  getRecommendations(): GoalRecommendation[] {
    return [...this.recommendations].sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async deleteGoal(goalId: string): Promise<void> {
    this.goals.delete(goalId);
    this.progress.delete(goalId);
    this.analytics.delete(goalId);
    
    await this.saveGoalsToStorage();
    await this.saveProgressToStorage();
    
    this.emit('goalDeleted', goalId);
  }

  async pauseGoal(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');

    goal.status = 'paused';
    goal.updatedAt = new Date();
    
    await this.saveGoalsToStorage();
    this.emit('goalPaused', goal);
  }

  async resumeGoal(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');

    goal.status = goal.currentProgress > 0 ? 'in_progress' : 'not_started';
    goal.updatedAt = new Date();
    
    await this.saveGoalsToStorage();
    this.emit('goalResumed', goal);
  }
}

export const personalGoalSettingService = new PersonalGoalSettingService();
export default personalGoalSettingService;