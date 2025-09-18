import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface WritingContext {
  currentText: string;
  genre: string;
  mood: string;
  characters: string[];
  setting: string;
  plotPoints: string[];
  writingStyle: 'formal' | 'casual' | 'literary' | 'commercial' | 'academic';
  targetAudience: 'children' | 'young-adult' | 'adult' | 'all-ages';
  wordGoal?: number;
  chapterNumber?: number;
}

export interface AISuggestion {
  id: string;
  type: 'plot' | 'character' | 'dialogue' | 'description' | 'pacing' | 'style' | 'structure';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestion: string;
  reasoning: string;
  implementation: string;
  relatedElements: string[];
  confidence: number;
  createdAt: Date;
}

export interface WritingGoal {
  id: string;
  type: 'word-count' | 'chapter' | 'character-arc' | 'plot-point' | 'deadline';
  target: number | string | Date;
  current: number | string;
  description: string;
  deadline?: Date;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  isCompleted: boolean;
  milestones: {
    value: number | string;
    completedAt?: Date;
    description: string;
  }[];
}

export interface WritingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  goals: string[];
  achievements: string[];
  challenges: string[];
  mood: 'productive' | 'struggling' | 'inspired' | 'frustrated' | 'focused';
  qualityRating: number;
  notes: string;
}

export interface WritingAnalytics {
  totalSessions: number;
  totalWords: number;
  averageSessionLength: number;
  averageWordsPerSession: number;
  mostProductiveTime: string;
  writingStreak: number;
  goalsCompleted: number;
  improvementAreas: string[];
  strengths: string[];
  recommendations: string[];
}

export interface PersonalizedPrompt {
  id: string;
  title: string;
  prompt: string;
  category: 'character' | 'plot' | 'world' | 'dialogue' | 'description' | 'motivation';
  personalizedFor: WritingContext;
  effectivenessScore: number;
  timesUsed: number;
  lastUsed?: Date;
}

class AdvancedAICompanion extends BrowserEventEmitter {
  private writingContext: WritingContext;
  private activeSuggestions: Map<string, AISuggestion>;
  private writingGoals: Map<string, WritingGoal>;
  private writingSessions: Map<string, WritingSession>;
  private personalizedPrompts: Map<string, PersonalizedPrompt>;
  private currentSession: WritingSession | null;
  private analysisHistory: WritingAnalytics[];

  constructor() {
    super();
    this.writingContext = this.createDefaultContext();
    this.activeSuggestions = new Map();
    this.writingGoals = new Map();
    this.writingSessions = new Map();
    this.personalizedPrompts = new Map();
    this.currentSession = null;
    this.analysisHistory = [];
    
    this.initializePersonalizedPrompts();
    this.loadUserData();
  }

  private createDefaultContext(): WritingContext {
    return {
      currentText: '',
      genre: 'fiction',
      mood: 'neutral',
      characters: [],
      setting: '',
      plotPoints: [],
      writingStyle: 'casual',
      targetAudience: 'adult'
    };
  }

  // Context Management
  updateWritingContext(updates: Partial<WritingContext>): void {
    this.writingContext = { ...this.writingContext, ...updates };
    this.analyzeCurrentContext();
    this.generateContextualSuggestions();
    this.saveUserData();
    this.emit('contextUpdated', this.writingContext);
  }

  getWritingContext(): WritingContext {
    return { ...this.writingContext };
  }

  private analyzeCurrentContext(): void {
    // Analyze writing context for inconsistencies or opportunities
    const analysis = {
      characterDevelopment: this.analyzeCharacterDevelopment(),
      plotCoherence: this.analyzePlotCoherence(),
      pacing: this.analyzePacing(),
      styleConsistency: this.analyzeStyleConsistency()
    };

    this.emit('contextAnalyzed', analysis);
  }

  // AI Suggestion System
  private generateContextualSuggestions(): void {
    const suggestions: AISuggestion[] = [];

    // Generate suggestions based on current context
    if (this.writingContext.characters.length === 0) {
      suggestions.push(this.createSuggestion(
        'character',
        'high',
        'Add Character Development',
        'Your story lacks defined characters',
        'Consider adding 2-3 main characters with distinct personalities, goals, and backgrounds. Characters drive plot and create emotional connection.',
        'Stories with well-developed characters are 85% more engaging to readers.',
        'Start by creating a character profile including: name, age, motivation, greatest fear, and unique trait.'
      ));
    }

    if (this.writingContext.plotPoints.length < 3) {
      suggestions.push(this.createSuggestion(
        'plot',
        'high',
        'Develop Plot Structure',
        'Your story needs more plot development',
        'Consider using the three-act structure: Setup (25%), Confrontation (50%), Resolution (25%). Add conflict and tension.',
        'Well-structured plots keep readers engaged throughout the entire story.',
        'Outline key plot points: inciting incident, rising action, climax, falling action, and resolution.'
      ));
    }

    // Add suggestions to active list
    suggestions.forEach(suggestion => {
      this.activeSuggestions.set(suggestion.id, suggestion);
    });

    this.emit('suggestionsGenerated', suggestions);
    this.saveUserData();
  }

  private createSuggestion(
    type: AISuggestion['type'],
    priority: AISuggestion['priority'],
    title: string,
    description: string,
    suggestion: string,
    reasoning: string,
    implementation: string,
    relatedElements: string[] = []
  ): AISuggestion {
    return {
      id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      title,
      description,
      suggestion,
      reasoning,
      implementation,
      relatedElements,
      confidence: this.calculateConfidence(type, this.writingContext),
      createdAt: new Date()
    };
  }

  private calculateConfidence(type: AISuggestion['type'], context: WritingContext): number {
    // Calculate confidence based on context completeness
    let confidence = 0.5;
    
    if (context.genre) confidence += 0.1;
    if (context.characters.length > 0) confidence += 0.1;
    if (context.plotPoints.length > 0) confidence += 0.1;
    if (context.setting) confidence += 0.1;
    if (context.currentText.length > 100) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  getSuggestions(type?: AISuggestion['type']): AISuggestion[] {
    const suggestions = Array.from(this.activeSuggestions.values());
    if (type) {
      return suggestions.filter(s => s.type === type);
    }
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  applySuggestion(suggestionId: string): boolean {
    const suggestion = this.activeSuggestions.get(suggestionId);
    if (!suggestion) return false;

    // Mark as applied and remove from active suggestions
    this.activeSuggestions.delete(suggestionId);
    this.emit('suggestionApplied', suggestion);
    this.saveUserData();
    return true;
  }

  dismissSuggestion(suggestionId: string): boolean {
    const suggestion = this.activeSuggestions.get(suggestionId);
    if (!suggestion) return false;

    this.activeSuggestions.delete(suggestionId);
    this.emit('suggestionDismissed', suggestion);
    this.saveUserData();
    return true;
  }

  // Goal Management
  createWritingGoal(goalData: Partial<WritingGoal>): WritingGoal {
    const goal: WritingGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: goalData.type || 'word-count',
      target: goalData.target || 1000,
      current: goalData.current || 0,
      description: goalData.description || '',
      priority: goalData.priority || 'medium',
      progress: 0,
      isCompleted: false,
      milestones: goalData.milestones || [],
      ...goalData
    };

    this.writingGoals.set(goal.id, goal);
    this.emit('goalCreated', goal);
    this.saveUserData();
    return goal;
  }

  updateGoalProgress(goalId: string, current: number | string): boolean {
    const goal = this.writingGoals.get(goalId);
    if (!goal) return false;

    goal.current = current;
    goal.progress = this.calculateGoalProgress(goal);
    
    if (goal.progress >= 100 && !goal.isCompleted) {
      goal.isCompleted = true;
      this.emit('goalCompleted', goal);
    }

    this.writingGoals.set(goalId, goal);
    this.emit('goalUpdated', goal);
    this.saveUserData();
    return true;
  }

  private calculateGoalProgress(goal: WritingGoal): number {
    if (typeof goal.target === 'number' && typeof goal.current === 'number') {
      return Math.min((goal.current / goal.target) * 100, 100);
    }
    return 0;
  }

  getWritingGoals(): WritingGoal[] {
    return Array.from(this.writingGoals.values())
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  // Writing Session Management
  startWritingSession(): WritingSession {
    if (this.currentSession) {
      this.endWritingSession();
    }

    this.currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      wordsWritten: 0,
      goals: [],
      achievements: [],
      challenges: [],
      mood: 'focused',
      qualityRating: 0,
      notes: ''
    };

    this.writingSessions.set(this.currentSession.id, this.currentSession);
    this.emit('sessionStarted', this.currentSession);
    return this.currentSession;
  }

  updateSession(updates: Partial<WritingSession>): boolean {
    if (!this.currentSession) return false;

    Object.assign(this.currentSession, updates);
    this.writingSessions.set(this.currentSession.id, this.currentSession);
    this.emit('sessionUpdated', this.currentSession);
    this.saveUserData();
    return true;
  }

  endWritingSession(): WritingSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.writingSessions.set(this.currentSession.id, this.currentSession);
    
    const session = this.currentSession;
    this.currentSession = null;
    
    this.emit('sessionEnded', session);
    this.updateWritingAnalytics();
    this.saveUserData();
    return session;
  }

  getCurrentSession(): WritingSession | null {
    return this.currentSession;
  }

  // Analytics and Analysis
  private analyzeCharacterDevelopment(): any {
    return {
      characterCount: this.writingContext.characters.length,
      development: 'basic',
      suggestions: ['Add character backstories', 'Define character arcs']
    };
  }

  private analyzePlotCoherence(): any {
    return {
      plotPoints: this.writingContext.plotPoints.length,
      coherence: 'developing',
      suggestions: ['Add conflict resolution', 'Strengthen causality']
    };
  }

  private analyzePacing(): any {
    return {
      currentPace: 'moderate',
      recommendations: ['Vary sentence length', 'Add action sequences']
    };
  }

  private analyzeStyleConsistency(): any {
    return {
      style: this.writingContext.writingStyle,
      consistency: 'good',
      areas: ['Voice consistency', 'Tone maintenance']
    };
  }

  getWritingAnalytics(): WritingAnalytics {
    const sessions = Array.from(this.writingSessions.values());
    const completedSessions = sessions.filter(s => s.endTime);
    
    return {
      totalSessions: completedSessions.length,
      totalWords: completedSessions.reduce((sum, s) => sum + s.wordsWritten, 0),
      averageSessionLength: this.calculateAverageSessionLength(completedSessions),
      averageWordsPerSession: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.wordsWritten, 0) / completedSessions.length 
        : 0,
      mostProductiveTime: this.findMostProductiveTime(completedSessions),
      writingStreak: this.calculateWritingStreak(),
      goalsCompleted: Array.from(this.writingGoals.values()).filter(g => g.isCompleted).length,
      improvementAreas: this.identifyImprovementAreas(),
      strengths: this.identifyStrengths(),
      recommendations: this.generateRecommendations()
    };
  }

  private calculateAverageSessionLength(sessions: WritingSession[]): number {
    if (sessions.length === 0) return 0;
    
    const totalMinutes = sessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
      }
      return sum;
    }, 0);
    
    return totalMinutes / sessions.length;
  }

  private findMostProductiveTime(sessions: WritingSession[]): string {
    const hourCounts = new Map<number, number>();
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + session.wordsWritten);
    });

    if (hourCounts.size === 0) return 'No data';
    
    const mostProductiveHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    return `${mostProductiveHour}:00`;
  }

  private calculateWritingStreak(): number {
    const sessions = Array.from(this.writingSessions.values())
      .filter(s => s.endTime)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sessions) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);

      const daysDiff = (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak + 1) {
        break;
      }
    }

    return streak;
  }

  private identifyImprovementAreas(): string[] {
    const areas: string[] = [];
    const analytics = this.getWritingAnalytics();

    if (analytics.averageWordsPerSession < 300) {
      areas.push('Increase writing session productivity');
    }
    
    if (analytics.writingStreak < 3) {
      areas.push('Develop consistent writing habit');
    }

    if (this.writingContext.characters.length < 2) {
      areas.push('Character development');
    }

    return areas;
  }

  private identifyStrengths(): string[] {
    const strengths: string[] = [];
    const analytics = this.getWritingAnalytics();

    if (analytics.writingStreak >= 7) {
      strengths.push('Consistent writing habit');
    }

    if (analytics.averageWordsPerSession > 500) {
      strengths.push('High productivity sessions');
    }

    if (analytics.goalsCompleted > 0) {
      strengths.push('Goal achievement');
    }

    return strengths;
  }

  private generateRecommendations(): string[] {
    return [
      'Set daily word count goals',
      'Experiment with different writing times',
      'Take breaks during long sessions',
      'Review and revise regularly'
    ];
  }

  private updateWritingAnalytics(): void {
    const analytics = this.getWritingAnalytics();
    this.analysisHistory.push(analytics);
    
    // Keep only last 30 analytics records
    if (this.analysisHistory.length > 30) {
      this.analysisHistory = this.analysisHistory.slice(-30);
    }
  }

  // Personalized Prompts
  private initializePersonalizedPrompts(): void {
    const defaultPrompts: Partial<PersonalizedPrompt>[] = [
      {
        title: 'Character Motivation Deep Dive',
        prompt: 'What does your character want more than anything? What are they willing to sacrifice to get it?',
        category: 'character',
        effectivenessScore: 0.8
      },
      {
        title: 'Conflict Escalation',
        prompt: 'How can you make the current conflict worse for your protagonist? What would they least want to happen?',
        category: 'plot',
        effectivenessScore: 0.9
      },
      {
        title: 'Sensory World Building',
        prompt: 'Describe your setting using all five senses. What does it smell like? What sounds dominate?',
        category: 'world',
        effectivenessScore: 0.7
      }
    ];

    defaultPrompts.forEach(promptData => {
      const prompt: PersonalizedPrompt = {
        id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        personalizedFor: this.writingContext,
        timesUsed: 0,
        ...promptData
      } as PersonalizedPrompt;

      this.personalizedPrompts.set(prompt.id, prompt);
    });
  }

  getPersonalizedPrompts(category?: PersonalizedPrompt['category']): PersonalizedPrompt[] {
    let prompts = Array.from(this.personalizedPrompts.values());
    
    if (category) {
      prompts = prompts.filter(p => p.category === category);
    }

    return prompts.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
  }

  usePrompt(promptId: string): boolean {
    const prompt = this.personalizedPrompts.get(promptId);
    if (!prompt) return false;

    prompt.timesUsed++;
    prompt.lastUsed = new Date();
    this.personalizedPrompts.set(promptId, prompt);
    
    this.emit('promptUsed', prompt);
    this.saveUserData();
    return true;
  }

  // Data Persistence
  private saveUserData(): void {
    try {
      localStorage.setItem('advancedAI_context', JSON.stringify(this.writingContext));
      localStorage.setItem('advancedAI_suggestions', JSON.stringify(Array.from(this.activeSuggestions.values())));
      localStorage.setItem('advancedAI_goals', JSON.stringify(Array.from(this.writingGoals.values())));
      localStorage.setItem('advancedAI_sessions', JSON.stringify(Array.from(this.writingSessions.values())));
      localStorage.setItem('advancedAI_prompts', JSON.stringify(Array.from(this.personalizedPrompts.values())));
    } catch (error) {
      console.error('Failed to save advanced AI companion data:', error);
    }
  }

  private loadUserData(): void {
    try {
      const contextData = localStorage.getItem('advancedAI_context');
      if (contextData) {
        this.writingContext = { ...this.writingContext, ...JSON.parse(contextData) };
      }

      const suggestionsData = localStorage.getItem('advancedAI_suggestions');
      if (suggestionsData) {
        const suggestions = JSON.parse(suggestionsData);
        suggestions.forEach((suggestion: AISuggestion) => {
          this.activeSuggestions.set(suggestion.id, suggestion);
        });
      }

      const goalsData = localStorage.getItem('advancedAI_goals');
      if (goalsData) {
        const goals = JSON.parse(goalsData);
        goals.forEach((goal: WritingGoal) => {
          this.writingGoals.set(goal.id, goal);
        });
      }

      const sessionsData = localStorage.getItem('advancedAI_sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        sessions.forEach((session: WritingSession) => {
          this.writingSessions.set(session.id, session);
        });
      }

      const promptsData = localStorage.getItem('advancedAI_prompts');
      if (promptsData) {
        const prompts = JSON.parse(promptsData);
        prompts.forEach((prompt: PersonalizedPrompt) => {
          this.personalizedPrompts.set(prompt.id, prompt);
        });
      }
    } catch (error) {
      console.error('Failed to load advanced AI companion data:', error);
    }
  }
}

export const advancedAICompanion = new AdvancedAICompanion();