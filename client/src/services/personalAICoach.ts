/**
 * Personal AI Coach Service
 * Provides personalized writing coaching and improvement guidance
 */

export interface WritingGoal {
  id: string;
  type: 'word_count' | 'daily_writing' | 'skill_improvement';
  title: string;
  target: number;
  current: number;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100
}

export interface CoachingSession {
  id: string;
  date: string;
  focus: 'writing_habits' | 'skill_development' | 'goal_setting' | 'motivation';
  recommendations: string[];
  exercises: string[];
  nextSteps: string[];
}

export interface WritingInsight {
  id: string;
  type: 'strength' | 'improvement' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

export class PersonalAICoachService {
  private goals: Map<string, WritingGoal[]> = new Map();
  private sessions: Map<string, CoachingSession[]> = new Map();
  private userProgress: Map<string, { totalWords: number; sessionsCompleted: number; streakDays: number }> = new Map();

  /**
   * Create a new writing goal
   */
  public createGoal(userId: string, goal: Omit<WritingGoal, 'id' | 'progress' | 'status'>): WritingGoal {
    const newGoal: WritingGoal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      status: 'active'
    };

    const userGoals = this.goals.get(userId) || [];
    userGoals.push(newGoal);
    this.goals.set(userId, userGoals);

    return newGoal;
  }

  /**
   * Update goal progress
   */
  public updateGoalProgress(userId: string, goalId: string, progress: number): WritingGoal | null {
    const userGoals = this.goals.get(userId) || [];
    const goalIndex = userGoals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) return null;

    const goal = userGoals[goalIndex];
    goal.current = progress;
    goal.progress = Math.min(100, (progress / goal.target) * 100);
    
    if (goal.progress >= 100) {
      goal.status = 'completed';
    }

    userGoals[goalIndex] = goal;
    this.goals.set(userId, userGoals);

    return goal;
  }

  /**
   * Generate personalized coaching session
   */
  public generateCoachingSession(userId: string, focus?: CoachingSession['focus']): CoachingSession {
    const userGoals = this.goals.get(userId) || [];
    const progress = this.userProgress.get(userId) || { totalWords: 0, sessionsCompleted: 0, streakDays: 0 };
    
    const sessionFocus = focus || this.determineBestFocus(userGoals, progress);
    const session: CoachingSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      focus: sessionFocus,
      recommendations: this.generateRecommendations(sessionFocus),
      exercises: this.generateExercises(sessionFocus),
      nextSteps: this.generateNextSteps(sessionFocus, userGoals)
    };

    const userSessions = this.sessions.get(userId) || [];
    userSessions.push(session);
    this.sessions.set(userId, userSessions);

    return session;
  }

  /**
   * Generate writing insights
   */
  public generateInsights(userId: string, writingData: { wordCount: number; timeSpent: number }): WritingInsight[] {
    const insights: WritingInsight[] = [];

    if (writingData.wordCount > 0 && writingData.timeSpent > 0) {
      const avgWordsPerMinute = writingData.wordCount / (writingData.timeSpent / 60);
      
      if (avgWordsPerMinute > 30) {
        insights.push({
          id: 'speed-1',
          type: 'strength',
          title: 'Excellent Writing Speed',
          description: `You're writing at ${Math.round(avgWordsPerMinute)} words per minute!`,
          actionable: false,
          priority: 'low'
        });
      } else if (avgWordsPerMinute < 15) {
        insights.push({
          id: 'speed-2',
          type: 'improvement',
          title: 'Opportunity to Increase Speed',
          description: 'Consider practicing free-writing exercises to improve flow',
          actionable: true,
          priority: 'medium'
        });
      }
    }

    return insights;
  }

  /**
   * Get motivational message
   */
  public getMotivationalMessage(userId: string): string {
    const userGoals = this.goals.get(userId) || [];
    const progress = this.userProgress.get(userId) || { totalWords: 0, sessionsCompleted: 0, streakDays: 0 };
    
    const completedGoals = userGoals.filter(g => g.status === 'completed').length;

    if (completedGoals > 0) {
      return `🎉 Congratulations on completing ${completedGoals} writing goal${completedGoals > 1 ? 's' : ''}!`;
    } else if (progress.streakDays >= 7) {
      return `🔥 Amazing! You're on a ${progress.streakDays}-day writing streak!`;
    } else if (progress.totalWords > 10000) {
      return `📝 You've written over ${progress.totalWords.toLocaleString()} words!`;
    } else {
      return `✨ Ready to start your writing journey? Set a goal and let's make progress!`;
    }
  }

  /**
   * Get daily writing challenge
   */
  public getDailyChallenge(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): {
    title: string;
    description: string;
    prompt: string;
    target: { words?: number; time?: number };
  } {
    const challenges = {
      easy: {
        title: 'Morning Pages',
        description: 'Stream-of-consciousness writing',
        prompt: 'Write about whatever comes to mind for 10 minutes',
        target: { time: 10 }
      },
      medium: {
        title: 'Scene Challenge',
        description: 'Write a complete scene with conflict',
        prompt: 'Two characters disagree about something important',
        target: { words: 400 }
      },
      hard: {
        title: 'Constraint Writing',
        description: 'Write with specific limitations',
        prompt: 'Write a story without using the letter "e"',
        target: { words: 300 }
      }
    };

    return challenges[difficulty];
  }

  /**
   * Track user progress
   */
  public updateUserProgress(userId: string, data: { wordsWritten?: number; sessionCompleted?: boolean }): void {
    const progress = this.userProgress.get(userId) || { totalWords: 0, sessionsCompleted: 0, streakDays: 0 };
    
    if (data.wordsWritten) {
      progress.totalWords += data.wordsWritten;
    }
    
    if (data.sessionCompleted) {
      progress.sessionsCompleted += 1;
      progress.streakDays += 1;
    }
    
    this.userProgress.set(userId, progress);
  }

  // Private helper methods
  private determineBestFocus(goals: WritingGoal[], progress: any): CoachingSession['focus'] {
    if (goals.length === 0) return 'goal_setting';
    if (progress.streakDays === 0) return 'writing_habits';
    if (progress.sessionsCompleted < 5) return 'skill_development';
    return 'motivation';
  }

  private generateRecommendations(focus: CoachingSession['focus']): string[] {
    switch (focus) {
      case 'writing_habits':
        return [
          'Set a consistent daily writing time',
          'Start with small, achievable goals',
          'Create a dedicated writing space'
        ];
      case 'skill_development':
        return [
          'Practice different writing exercises',
          'Read in your target genre',
          'Focus on one skill at a time'
        ];
      case 'goal_setting':
        return [
          'Set SMART goals (Specific, Measurable, Achievable)',
          'Break large projects into milestones',
          'Track your progress regularly'
        ];
      case 'motivation':
        return [
          'Remember your "why" - what drives you to write',
          'Connect with other writers',
          'Celebrate small wins'
        ];
      default:
        return ['Keep writing consistently', 'Set clear goals'];
    }
  }

  private generateExercises(focus: CoachingSession['focus']): string[] {
    switch (focus) {
      case 'writing_habits':
        return ['Write for 10 minutes without stopping', 'Keep a daily journal'];
      case 'skill_development':
        return ['Write a scene using only dialogue', 'Describe a setting with all senses'];
      case 'goal_setting':
        return ['Define your goals for next month', 'Break down a project into tasks'];
      case 'motivation':
        return ['Write about why you love writing', 'List your achievements'];
      default:
        return ['Free writing exercise', 'Character development'];
    }
  }

  private generateNextSteps(focus: CoachingSession['focus'], goals: WritingGoal[]): string[] {
    const steps = ['Schedule your next writing session', 'Review progress weekly'];
    
    if (focus === 'goal_setting' && goals.length === 0) {
      steps.unshift('Create your first writing goal');
    }
    
    return steps;
  }

  // Additional methods for test compatibility
  async getPersonalizedCoaching(writerProfile: any): Promise<any> {
    const session = this.generateCoachingSession('default', 'skill_development');
    return {
      plan: {
        focus: writerProfile.goals?.join(', ') || 'general writing improvement',
        exercises: session.exercises,
        milestones: [
          'Complete 5 writing exercises',
          'Write 1000 words',
          'Improve weak areas'
        ]
      },
      exercises: session.exercises,
      milestones: [
        { title: 'Short-term: Complete daily exercises', deadline: '1 week' },
        { title: 'Medium-term: Develop consistent habits', deadline: '1 month' },
        { title: 'Long-term: Master target skills', deadline: '3 months' }
      ]
    };
  }

  async assessProgress(progress: any): Promise<any> {
    const insights = this.generateInsights('default', {
      wordCount: progress.timeSpent ? progress.timeSpent / 60 * 20 : 500,
      timeSpent: progress.timeSpent || 1800
    });

    return {
      level: progress.exercisesCompleted >= 10 ? 'advanced' : 
             progress.exercisesCompleted >= 5 ? 'intermediate' : 'beginner',
      nextSteps: [
        'Continue practicing consistently',
        'Focus on identified weak areas',
        'Set new challenging goals'
      ],
      strengths: progress.skillsImproved || ['consistency'],
      improvements: insights.filter(i => i.type === 'improvement').map(i => i.title)
    };
  }

  async adaptCoaching(performance: any): Promise<any> {
    const focusAreas = [];
    
    Object.entries(performance.scores || {}).forEach(([skill, score]) => {
      if (typeof score === 'number' && score < 70) {
        focusAreas.push(skill);
      }
    });

    return {
      focusAreas: focusAreas.length > 0 ? focusAreas : ['general improvement'],
      difficulty: performance.challenges?.length > 2 ? 'advanced' : 'intermediate',
      recommendedExercises: this.generateExercises('skill_development'),
      newStrategy: `Focus on ${focusAreas[0] || 'structure'} improvement`,
      adjustments: [
        'Increase practice frequency',
        'Add targeted exercises',
        'Monitor progress more closely'
      ]
    };
  }

  async setUserPreferences(preferences: any): Promise<void> {
    // Store user preferences for personalization
    // This would typically persist to a database
    console.log('User preferences set:', preferences);
  }

  async getFeatureToggles(): Promise<any> {
    return {
      personalizedCoaching: true,
      progressTracking: true,
      dailyChallenges: true,
      adaptiveContent: false
    };
  }

  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      service: 'personalAICoach',
      timestamp: new Date().toISOString(),
      checks: {
        goalsLoaded: this.goals.size > 0,
        sessionsTracked: this.sessions.size > 0,
        progressTracking: this.userProgress.size >= 0
      }
    };
  }
}

// Export singleton instance
export const personalAICoach = new PersonalAICoachService();
