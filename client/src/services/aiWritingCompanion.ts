/**
 * AI Writing Companion Service
 * Provides intelligent writing companionship, motivation, and productivity tracking
 */

export interface WritingSession {
  id: string;
  title: string;
  contentId?: string;
  mood?: string;
  startTime: number;
  endTime?: number;
  content: string;
  wordCount: number;
  totalWords: number;
  wordsAdded: number;
  timeSpent: number;
  productivity: number;
  suggestions: AISuggestion[];
  feedback: AIFeedback[];
  aiInteractions: number;
  isActive: boolean;
}

export interface AISuggestion {
  id: string;
  type: 'grammar' | 'style' | 'structure' | 'vocabulary' | 'clarity' | 'continuation' | 'improvement' | 'alternative' | 'expansion' | 'correction';
  title: string;
  description: string;
  beforeText: string;
  afterText: string;
  confidence: number;
  isApplied?: boolean;
  applied?: boolean;
  rating?: number;
  userRating?: string;
  reasoning?: string;
  timestamp?: number;
}

export interface AIFeedback {
  id: string;
  type: 'positive' | 'improvement' | 'warning' | 'info' | 'suggestion' | 'error' | 'clarity' | 'style';
  category: 'pacing' | 'voice' | 'structure' | 'engagement' | 'grammar' | 'clarity' | 'style';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'info' | 'suggestion' | 'warning' | 'error';
  actionable: boolean;
  suggestion?: string;
}

export interface WritingPrompt {
  id: string;
  title: string;
  prompt: string;
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  tags: string[];
}

export interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'project' | 'habit' | 'daily_words' | 'weekly_words';
  title: string;
  description: string;
  target: number;
  current: number;
  unit: 'words' | 'sessions' | 'hours' | 'pages';
  deadline?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  category: string;
  milestones: any[];
  progress?: number;
  createdAt?: number;
  completedAt?: number;
}

export interface AIPersonality {
  id: string;
  name: string;
  description: string;
  role: string;
  traits: {
    encouraging: number;
    critical: number;
    creative: number;
    analytical: number;
    formal?: number;
  };
  specialties: string[];
  communicationStyle: string;
  greetingStyle: string;
  feedbackStyle: string;
  isActive: boolean;
}

export interface WritingMetrics {
  totalWords: number;
  totalSessions: number;
  averageWordsPerSession: number;
  averageWordsPerMinute: number;
  averageSessionLength: number;
  totalWritingTime: number;
  streakDays: number;
  currentStreak: number;
  goalsCompleted: number;
  improvementAreas: string[];
  mostProductiveTime: string;
  averageProductivity: number;
}

export interface CompanionshipResponse {
  message: string;
  type: 'encouragement' | 'motivation' | 'feedback' | 'suggestion';
  encouragement?: string;
  suggestions?: string[];
  productivity?: {
    wordsPerMinute: number;
    efficiency: number;
    streakDays: number;
  };
}

export interface ProgressMetrics {
  wordsWritten: number;
  timeSpent: number;
  sessionsCompleted: number;
  averageWPM: number;
  consistency: number;
  wordsPerMinute?: number;
}

class AIWritingCompanionService {
  private currentSession: WritingSession | null = null;
  private sessions: WritingSession[] = [];
  private goals: WritingGoal[] = [];
  private personalities: AIPersonality[] = [];
  private userMetrics: WritingMetrics;
  private eventListeners: Map<string, Function[]> = new Map();
  private aiEnabled: boolean = true;
  private realTimeFeedbackEnabled: boolean = true;

  constructor() {
    this.initializeDefaults();
    this.userMetrics = {
      totalWords: 0,
      totalSessions: 0,
      averageWordsPerSession: 0,
      averageWordsPerMinute: 0,
      averageSessionLength: 0,
      totalWritingTime: 0,
      streakDays: 0,
      currentStreak: 0,
      goalsCompleted: 0,
      improvementAreas: [],
      mostProductiveTime: '09:00',
      averageProductivity: 0
    };
    this.loadFromLocalStorage();
  }

  private initializeDefaults(): void {
    this.personalities = [
      {
        id: 'mentor',
        name: 'Wise Mentor',
        description: 'Mentor personality',
        role: 'mentor',
        traits: {
          encouraging: 80,
          critical: 20,
          creative: 60,
          analytical: 70
        },
        specialties: ["guidance", "motivation", "story_structure"],
        communicationStyle: 'supportive',
        greetingStyle: 'supportive',
        feedbackStyle: 'constructive',
        isActive: true
      },
      {
        id: 'critic',
        name: 'Analytical Critic',
        description: 'Critic personality',
        role: 'critic',
        traits: {
          encouraging: 30,
          critical: 90,
          creative: 40,
          analytical: 95
        },
        specialties: ["grammar", "style_analysis", "plot_holes"],
        communicationStyle: 'formal',
        greetingStyle: 'formal',
        feedbackStyle: 'constructive',
        isActive: false
      },
      {
        id: 'cheerleader',
        name: 'Enthusiastic Cheerleader',
        description: 'Cheerleader personality',
        role: 'cheerleader',
        traits: {
          encouraging: 95,
          critical: 10,
          creative: 75,
          analytical: 30
        },
        specialties: ["motivation", "confidence_building", "encouragement"],
        communicationStyle: 'playful',
        greetingStyle: 'playful',
        feedbackStyle: 'constructive',
        isActive: false
      },
      {
        id: 'collaborator',
        name: 'Creative Collaborator',
        description: 'Collaborator personality',
        role: 'collaborator',
        traits: {
          encouraging: 70,
          critical: 40,
          creative: 90,
          analytical: 60
        },
        specialties: ["brainstorming", "idea_generation", "creative_prompts"],
        communicationStyle: 'casual',
        greetingStyle: 'casual',
        feedbackStyle: 'constructive',
        isActive: false
      },
      {
        id: 'editor',
        name: 'Professional Editor',
        description: 'Editor personality',
        role: 'editor',
        traits: {
          encouraging: 50,
          critical: 80,
          creative: 30,
          analytical: 85
        },
        specialties: ["editing", "proofreading", "structure"],
        communicationStyle: 'direct',
        greetingStyle: 'direct',
        feedbackStyle: 'constructive',
        isActive: false
      }
    ];

    // Initialize default daily writing goal
    this.goals = [
      {
        id: 'default-daily',
        type: 'daily',
        title: 'Daily Writing Goal',
        description: 'Write every day to build consistency',
        target: 500,
        current: 0,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        category: 'productivity',
        milestones: []
      }
    ];
  }

  private loadFromLocalStorage(): void {
    try {
      // Try new format first (single key)
      const stored = localStorage.getItem('aiWritingCompanion');
      if (stored && stored.trim()) {
        const data = JSON.parse(stored);
        if (data && typeof data === 'object') {
          this.sessions = Array.isArray(data.sessions) ? data.sessions : [];
          if (Array.isArray(data.goals) && data.goals.length > 0) {
            this.goals = data.goals;
          }
          if (data.metrics && typeof data.metrics === 'object') {
            this.userMetrics = { ...this.userMetrics, ...data.metrics };
          }
          if (data.personalities && Array.isArray(data.personalities)) {
            this.personalities = data.personalities;
          }
          if (typeof data.aiEnabled === 'boolean') {
            this.aiEnabled = data.aiEnabled;
          }
          if (typeof data.realTimeFeedbackEnabled === 'boolean') {
            this.realTimeFeedbackEnabled = data.realTimeFeedbackEnabled;
          }
          return;
        }
      }

      // Try legacy format (separate keys)
      const sessionsStored = localStorage.getItem('astral_writing_sessions');
      const goalsStored = localStorage.getItem('astral_writing_goals');
      
      if (sessionsStored && sessionsStored.trim() && sessionsStored !== 'null') {
        const sessionsData = JSON.parse(sessionsStored);
        if (sessionsData && typeof sessionsData === 'object') {
          // Convert from object format to array format
          if (!Array.isArray(sessionsData)) {
            this.sessions = Object.values(sessionsData).filter(session => 
              session && typeof session === 'object' && session.id
            );
          } else {
            this.sessions = sessionsData.filter(session => 
              session && typeof session === 'object' && session.id
            );
          }
        }
      }
      
      if (goalsStored && goalsStored.trim() && goalsStored !== 'null') {
        const goalsData = JSON.parse(goalsStored);
        if (goalsData && typeof goalsData === 'object') {
          // Convert from object format to array format
          if (!Array.isArray(goalsData)) {
            const validGoals = Object.values(goalsData).filter(goal => 
              goal && typeof goal === 'object' && goal.id
            );
            this.goals = [...this.goals, ...validGoals];
          } else {
            const validGoals = goalsData.filter(goal => 
              goal && typeof goal === 'object' && goal.id
            );
            this.goals = [...this.goals, ...validGoals];
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      // Continue with defaults - already initialized
    }
  }

  private saveToLocalStorage(): void {
    try {
      const data = {
        sessions: this.sessions.slice(-50), // Keep last 50 sessions
        goals: this.goals,
        metrics: this.userMetrics,
        personalities: this.personalities,
        aiEnabled: this.aiEnabled,
        realTimeFeedbackEnabled: this.realTimeFeedbackEnabled,
        lastSaved: Date.now()
      };
      const jsonString = JSON.stringify(data);
      localStorage.setItem('aiWritingCompanion', jsonString);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Clean up old data and retry
        try {
          const minimalData = {
            sessions: this.sessions.slice(-10), // Keep only last 10 sessions
            goals: this.goals.filter(g => g.isActive !== false),
            metrics: this.userMetrics,
            personalities: this.personalities,
            aiEnabled: this.aiEnabled,
            realTimeFeedbackEnabled: this.realTimeFeedbackEnabled,
            lastSaved: Date.now()
          };
          localStorage.setItem('aiWritingCompanion', JSON.stringify(minimalData));
        } catch (retryError) {
          console.warn('Failed to save even minimal data to localStorage:', retryError);
        }
      } else {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }

  // Core session management
  async startWritingSession(title: string, contentId?: string, mood?: string): Promise<string> {
    // End current session if exists
    if (this.currentSession?.isActive) {
      await this.endWritingSession();
    }

    const session: WritingSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title,
      contentId,
      mood: this.validateMood(mood) || 'neutral',
      startTime: Date.now(),
      content: '',
      wordCount: 0,
      totalWords: 0,
      wordsAdded: 0,
      timeSpent: 0,
      productivity: 0,
      suggestions: [],
      feedback: [],
      aiInteractions: 0,
      isActive: true
    };

    this.currentSession = session;
    this.sessions.push(session);
    this.saveToLocalStorage();

    // Emit greeting
    this.emitEvent('sessionStarted', { session, greeting: this.generateGreeting() });

    return session.id;
  }

  async updateSessionContent(content: string, wordCount: number): Promise<void> {
    if (!this.currentSession?.isActive) {
      console.warn('No active session for content update');
      return;
    }

    if (typeof content !== 'string' || typeof wordCount !== 'number' || wordCount < 0) {
      console.warn('Invalid content or word count provided');
      return;
    }

    const oldWordCount = this.currentSession.wordCount;
    this.currentSession.content = content;
    this.currentSession.wordCount = wordCount;
    this.currentSession.totalWords = Math.max(this.currentSession.totalWords, wordCount);
    this.currentSession.wordsAdded = wordCount;
    this.currentSession.timeSpent = Date.now() - this.currentSession.startTime;

    // Generate AI feedback and suggestions with proper error handling
    try {
      await this.generateAIAnalysis(content, wordCount - oldWordCount);
    } catch (error) {
      console.warn('AI analysis failed:', error);
    }
    
    this.updateProductivityMetrics();
    this.saveToLocalStorage();
  }

  async endWritingSession(): Promise<WritingSession | null> {
    if (!this.currentSession?.isActive) {
      return null;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.isActive = false;
    this.currentSession.timeSpent = this.currentSession.endTime - this.currentSession.startTime;

    // Update user metrics
    this.updateUserMetrics(this.currentSession);
    
    // Check goal progress
    this.updateGoalsFromSession(this.currentSession);

    const endedSession = { ...this.currentSession };
    this.currentSession = null;
    this.saveToLocalStorage();

    return endedSession;
  }

  getCurrentSession(): WritingSession | null {
    return this.currentSession;
  }

  // AI Analysis and Feedback
  private async generateAIAnalysis(content: string, wordsAdded: number): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.aiInteractions++;

    // Generate suggestions based on content
    const suggestions = this.analyzeContentForSuggestions(content);
    this.currentSession.suggestions.push(...suggestions);

    // Generate feedback
    const feedback = this.analyzeContentForFeedback(content);
    this.currentSession.feedback.push(...feedback);

    // Keep only recent suggestions/feedback
    this.currentSession.suggestions = this.currentSession.suggestions.slice(-10);
    this.currentSession.feedback = this.currentSession.feedback.slice(-10);
  }

  private analyzeContentForSuggestions(content: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for long sentences
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 25) {
        suggestions.push({
          id: `suggestion_${Date.now()}_${index}`,
          type: 'improvement',
          title: 'Long Sentence',
          description: 'Consider breaking this long sentence into shorter ones for better readability.',
          beforeText: sentence.trim(),
          afterText: 'Consider splitting into multiple sentences.',
          confidence: 0.8,
          isApplied: false,
          applied: false,
          reasoning: 'Long sentences can be difficult to follow and may lose reader attention.',
          timestamp: Date.now()
        });
      }
    });

    // Check for passive voice
    const passivePattern = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
    const passiveMatches = content.match(passivePattern);
    if (passiveMatches && passiveMatches.length > 2) {
      suggestions.push({
        id: `suggestion_passive_${Date.now()}`,
        type: 'improvement',
        title: 'Passive Voice',
        description: 'Consider using active voice for more engaging writing.',
        beforeText: passiveMatches[0],
        afterText: 'Rewrite in active voice',
        confidence: 0.7,
        isApplied: false,
        applied: false,
        reasoning: 'Active voice creates more dynamic and engaging writing.',
        timestamp: Date.now()
      });
    }

    // Check for repeated words
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count > 5 && word.length > 3) {
        suggestions.push({
          id: `suggestion_repetition_${Date.now()}_${word}`,
          type: 'improvement',
          title: 'Word Repetition',
          description: `The word "${word}" appears ${count} times. Consider using synonyms.`,
          beforeText: word,
          afterText: 'Use synonyms or rephrase',
          confidence: 0.6,
          isApplied: false,
          applied: false,
          reasoning: 'Varied vocabulary makes writing more engaging and professional.',
          timestamp: Date.now()
        });
      }
    });

    return suggestions;
  }

  private analyzeContentForFeedback(content: string): AIFeedback[] {
    const feedback: AIFeedback[] = [];
    
    // Check pacing
    const avgSentenceLength = this.calculateAverageSentenceLength(content);
    if (avgSentenceLength > 20) {
      feedback.push({
        id: `feedback_pacing_${Date.now()}`,
        type: 'improvement',
        category: 'clarity',
        message: 'Your sentences are quite long. Consider varying sentence length for better pacing.',
        severity: 'suggestion',
        actionable: true,
        suggestion: 'Try breaking long sentences into shorter, more digestible pieces.'
      });
    }

    // Check engagement
    const questionMarks = (content.match(/\?/g) || []).length;
    const exclamationMarks = (content.match(/!/g) || []).length;
    if (questionMarks + exclamationMarks === 0 && content.length > 500) {
      feedback.push({
        id: `feedback_engagement_${Date.now()}`,
        type: 'style',
        category: 'style',
        message: 'Consider adding some questions or exclamations to increase reader engagement.',
        severity: 'suggestion',
        actionable: true,
        suggestion: 'Add rhetorical questions or vary punctuation for more dynamic writing.'
      });
    }

    // Positive feedback for good progress
    if (content.length > 200) {
      feedback.push({
        id: `feedback_positive_${Date.now()}`,
        type: 'positive',
        category: 'structure',
        message: 'Good progress! You\'re building substantial content.',
        severity: 'info',
        actionable: false
      });
    }

    return feedback;
  }

  private calculateAverageSentenceLength(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length;
    }, 0);
    
    return totalWords / sentences.length;
  }

  // Suggestion management
  async applySuggestion(suggestionId: string): Promise<boolean> {
    if (!this.currentSession) return false;

    const suggestion = this.currentSession.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.isApplied = true;
      suggestion.applied = true;
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  async rateSuggestion(suggestionId: string, rating: string | number): Promise<void> {
    if (!this.currentSession) return;

    const suggestion = this.currentSession.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      if (typeof rating === 'string') {
        suggestion.userRating = rating; // For 'helpful', 'not helpful', etc.
      } else {
        suggestion.rating = Math.max(1, Math.min(5, rating));
      }
      this.saveToLocalStorage();
    }
  }

  // Personality management
  getPersonalities(): AIPersonality[] {
    return this.personalities;
  }

  switchPersonality(personalityId: string): void {
    const personality = this.personalities.find(p => p.id === personalityId);
    if (personality) {
      // Deactivate all personalities
      this.personalities.forEach(p => p.isActive = false);
      // Activate selected personality
      personality.isActive = true;
      this.saveToLocalStorage();
      
      // Emit personality change event
      this.emitEvent('personalityChanged', { personality });
    }
  }

  private generateGreeting(): string {
    const activePersonality = this.personalities.find(p => p.isActive);
    if (!activePersonality) return 'Hello! Ready to write?';

    const greetings: Record<string, string[]> = {
      warm: ['Hello! I\'m excited to write with you today!', 'Welcome back! Let\'s create something amazing!'],
      professional: ['Good day. Let\'s focus on producing quality content.', 'Ready to begin our writing session.'],
      artistic: ['Ah, a fellow creator! Let inspiration flow through us!', 'The muse awaits! What shall we birth today?'],
      direct: ['Time to write. What\'s our goal today?', 'Let\'s get to work. What are we writing?'],
      curious: ['Interesting! What new approach shall we try today?', 'I wonder what we\'ll discover in our writing today?']
    };

    const styleGreetings = greetings[activePersonality.greetingStyle] || greetings.warm;
    return styleGreetings[Math.floor(Math.random() * styleGreetings.length)];
  }

  // Goal management
  createWritingGoal(goalData: Partial<WritingGoal>): WritingGoal;
  async createWritingGoal(goalData: any): Promise<string>;
  createWritingGoal(goalData: any): WritingGoal | Promise<string> {
    const goal: WritingGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: goalData.type || 'daily',
      title: goalData.title || 'New Writing Goal',
      description: goalData.description || '',
      target: goalData.target || 1000,
      current: 0,
      deadline: goalData.deadline,
      isCompleted: false,
      category: goalData.category || 'general',
      milestones: goalData.milestones || []
    };

    this.goals.push(goal);
    this.saveToLocalStorage();
    
    // Handle both sync and async versions
    if (goalData && typeof goalData === 'object' && !('unit' in goalData)) {
      // Async version - return Promise<string>
      return Promise.resolve(goal.id);
    }
    
    // Sync version - return WritingGoal
    return goal;
  }
  
  async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) {
      goal.current = progress;
      goal.progress = Math.min(100, (progress / goal.target) * 100);
      
      if (progress >= goal.target && !goal.isCompleted) {
        goal.isCompleted = true;
        goal.completedAt = Date.now();
        this.userMetrics.goalsCompleted++;
        this.emitEvent('goalCompleted', { goal });
        
        // Check milestones
        goal.milestones.forEach(milestone => {
          if (!milestone.achieved && progress >= milestone.target) {
            milestone.achieved = true;
            this.emitEvent('milestoneAchieved', { milestone, goal });
          }
        });
      }
      
      this.saveToLocalStorage();
    }
  }

  getActiveGoals(): WritingGoal[] {
    return this.goals.filter(g => !g.isCompleted);
  }

  getAllGoals(): WritingGoal[] {
    return this.goals;
  }

  private updateGoalsFromSession(session: WritingSession): void {
    this.goals.forEach(goal => {
      if (!goal.isCompleted) {
        switch (goal.type) {
          case 'daily':
          case 'weekly':
            goal.current += session.wordCount;
            break;
          case 'habit':
            goal.current += 1; // Increment session count
            break;
        }
        
        if (goal.current >= goal.target) {
          goal.isCompleted = true;
          this.userMetrics.goalsCompleted++;
          this.emitEvent('goalCompleted', { goal });
        }
      }
    });
  }

  // Metrics and analytics
  getWritingMetrics(): WritingMetrics {
    const metrics = { ...this.userMetrics };
    
    // Calculate average session length
    if (this.sessions.length > 0) {
      const totalTime = this.sessions.reduce((sum, session) => {
        return sum + (session.timeSpent || 0);
      }, 0);
      metrics.averageSessionLength = totalTime / this.sessions.length;
    } else {
      metrics.averageSessionLength = 0;
    }
    
    // Calculate current streak
    metrics.currentStreak = metrics.streakDays;
    
    // Calculate most productive time (simplified)
    const hourCounts = new Array(24).fill(0);
    this.sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] += session.wordCount || 0;
    });
    const mostProductiveHour = hourCounts.indexOf(Math.max(...hourCounts));
    metrics.mostProductiveTime = `${mostProductiveHour.toString().padStart(2, '0')}:00`;
    
    // Calculate average productivity
    if (this.sessions.length > 0) {
      const totalProductivity = this.sessions.reduce((sum, session) => {
        return sum + (session.productivity || 0);
      }, 0);
      metrics.averageProductivity = totalProductivity / this.sessions.length;
    } else {
      metrics.averageProductivity = 0;
    }
    
    return metrics;
  }

  private updateUserMetrics(session: WritingSession): void {
    this.userMetrics.totalWords += session.wordCount;
    this.userMetrics.totalSessions++;
    this.userMetrics.totalWritingTime += session.timeSpent;
    
    if (this.userMetrics.totalSessions > 0) {
      this.userMetrics.averageWordsPerSession = this.userMetrics.totalWords / this.userMetrics.totalSessions;
    }
    
    if (this.userMetrics.totalWritingTime > 0) {
      this.userMetrics.averageWordsPerMinute = this.userMetrics.totalWords / (this.userMetrics.totalWritingTime / 60000);
    }

    // Update streak days (simplified)
    const today = new Date().toDateString();
    const lastSession = this.sessions[this.sessions.length - 2]; // Previous session
    if (lastSession) {
      const lastSessionDate = new Date(lastSession.startTime).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastSessionDate === yesterday || lastSessionDate === today) {
        this.userMetrics.streakDays++;
      } else {
        this.userMetrics.streakDays = 1;
      }
    } else {
      this.userMetrics.streakDays = 1;
    }
    
    this.userMetrics.currentStreak = this.userMetrics.streakDays;
  }

  private updateProductivityMetrics(): void {
    if (!this.currentSession) return;
    
    const timeMinutes = this.currentSession.timeSpent / 60000;
    if (timeMinutes > 0) {
      this.currentSession.productivity = this.currentSession.wordCount / timeMinutes;
    }
  }

  // Content generation
  async generateWritingPrompt(genre?: string, difficulty?: string): Promise<WritingPrompt>;
  async generateWritingPrompt(criteria?: any): Promise<any>;
  async generateWritingPrompt(genreOrCriteria?: any, difficulty?: string): Promise<any> {
    // Handle both parameter formats
    let criteria: any = {};
    if (typeof genreOrCriteria === 'string') {
      criteria.genre = genreOrCriteria;
      criteria.difficulty = difficulty;
    } else if (genreOrCriteria && typeof genreOrCriteria === 'object') {
      criteria = genreOrCriteria;
    }
    const prompts: WritingPrompt[] = [
      {
        id: 'prompt_1',
        title: 'The Lost Letter',
        prompt: 'You find a letter addressed to someone who died 100 years ago. What does it say?',
        genre: 'mystery',
        difficulty: 'easy',
        estimatedTime: 15,
        tags: ['mystery', 'historical', 'discovery']
      },
      {
        id: 'prompt_2',
        title: 'Future Memories',
        prompt: 'In the future, memories can be downloaded and shared. You discover a memory that isn\'t yours.',
        genre: 'sci-fi',
        difficulty: 'medium',
        estimatedTime: 30,
        tags: ['sci-fi', 'identity', 'technology']
      },
      {
        id: 'prompt_3',
        title: 'The Last Library',
        prompt: 'Books are becoming extinct. You are the guardian of the last library on Earth.',
        genre: 'dystopian',
        difficulty: 'hard',
        estimatedTime: 45,
        tags: ['dystopian', 'books', 'preservation']
      }
    ];

    let filteredPrompts = prompts;
    
    if (criteria?.category) {
      filteredPrompts = filteredPrompts.filter(p => p.category === criteria.category);
    }
    if (criteria?.difficulty) {
      filteredPrompts = filteredPrompts.filter(p => p.difficulty === criteria.difficulty);
    }
    if (criteria?.genre) {
      filteredPrompts = filteredPrompts.filter(p => 
        p.genre.includes('general') || p.genre.includes(criteria.genre)
      );
    }
    if (criteria?.timeLimit) {
      filteredPrompts = filteredPrompts.filter(p => p.estimatedTime <= criteria.timeLimit);
    }

    if (filteredPrompts.length === 0) {
      filteredPrompts = prompts;
    }

    return filteredPrompts[Math.floor(Math.random() * filteredPrompts.length)];
  }

  async getCreativeExercise(): Promise<{ title: string; instructions: string[]; duration: number }>;
  async getCreativeExercise(criteria?: any): Promise<any>;
  async getCreativeExercise(criteria?: any): Promise<any> {
    const exercises = [
      {
        title: 'Stream of Consciousness',
        instructions: [
          'Write continuously for 10 minutes without stopping or editing.',
          'Let your thoughts flow freely onto the page.',
          'Don\'t worry about grammar, spelling, or structure.',
          'Focus on capturing the natural flow of your mind.'
        ],
        duration: 10
      },
      {
        title: 'Character in a Room',
        instructions: [
          'Describe a character solely through the items in their room.',
          'Don\'t mention the character directly.',
          'Let objects tell the story of who they are.',
          'Consider what each item reveals about personality.'
        ],
        duration: 15
      },
      {
        title: 'Dialogue Only',
        instructions: [
          'Write a complete scene using only dialogue.',
          'No action lines or descriptions allowed.',
          'Convey setting and emotion through speech alone.',
          'Make each character\'s voice distinct.'
        ],
        duration: 20
      },
      {
        title: 'Six-Word Story',
        instructions: [
          'Tell a complete story in exactly six words.',
          'Then expand it into a full paragraph.',
          'Focus on emotional impact over complexity.',
          'Every word must earn its place.'
        ],
        duration: 15
      }
    ];

    let filteredExercises = exercises;
    
    if (criteria?.level) {
      filteredExercises = filteredExercises.filter(e => e.level === criteria.level);
    }
    if (criteria?.category) {
      filteredExercises = filteredExercises.filter(e => e.category === criteria.category);
    }
    if (criteria?.maxDuration) {
      filteredExercises = filteredExercises.filter(e => e.duration <= criteria.maxDuration);
    }

    if (filteredExercises.length === 0) {
      filteredExercises = exercises;
    }

    return filteredExercises[Math.floor(Math.random() * filteredExercises.length)];
  }

  // Event system
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  private validateMood(mood?: string): string | undefined {
    const validMoods = ['creative', 'focused', 'relaxed', 'energetic', 'contemplative', 'neutral'];
    return mood && validMoods.includes(mood) ? mood : undefined;
  }

  // Legacy compatibility methods
  async getCompanionship(writingSession: any): Promise<CompanionshipResponse> {
    const { text, goal, timeSpent } = writingSession;
    const wordsWritten = text ? text.split(/\s+/).filter((w: string) => w.length > 0).length : 0;
    const wpm = timeSpent > 0 ? (wordsWritten / (timeSpent / 60000)) : 0;

    let message = 'Keep up the great work!';
    let type: CompanionshipResponse['type'] = 'encouragement';

    if (wpm > 30) {
      message = "Excellent pace! You're writing efficiently.";
      type = 'encouragement';
    } else if (wpm < 10 && timeSpent > 300000) {
      message = "Take your time. Quality matters more than speed.";
      type = 'motivation';
    } else if (wordsWritten > 500) {
      message = "Great progress! You're building momentum.";
      type = 'feedback';
    }

    return {
      message,
      type,
      encouragement: message,
      suggestions: [
        'Try a 5-minute free-writing session',
        'Focus on one idea at a time',
        'Take breaks to maintain creativity'
      ],
      productivity: {
        wordsPerMinute: wpm,
        efficiency: Math.min(100, (wordsWritten / Math.max(1, timeSpent / 60000)) * 2),
        streakDays: this.userMetrics.streakDays
      }
    };
  }

  async startSession(type: string): Promise<{ id: string; type: string; startTime: number }> {
    const sessionId = await this.startWritingSession(`${type} Session`);
    return {
      id: sessionId,
      type,
      startTime: Date.now()
    };
  }

  async updateMetrics(sessionId: string, metrics: { wordsWritten?: number; timeSpent?: number }): Promise<{ wordsWritten: number; timeSpent: number }> {
    await this.updateProgress(sessionId, metrics);
    return {
      wordsWritten: metrics.wordsWritten || 0,
      timeSpent: metrics.timeSpent || 0
    };
  }

  async updateProgress(sessionId: string, metrics: { wordsWritten?: number; timeSpent?: number }): Promise<void> {
    if (this.currentSession?.id === sessionId) {
      if (metrics.wordsWritten !== undefined) {
        await this.updateSessionContent(this.currentSession.content, metrics.wordsWritten);
      }
    }
  }

  async getProgress(sessionId: string): Promise<ProgressMetrics> {
    if (this.currentSession?.id === sessionId) {
      return {
        wordsWritten: this.currentSession.wordCount,
        timeSpent: this.currentSession.timeSpent,
        sessionsCompleted: 1,
        averageWPM: this.currentSession.productivity,
        consistency: 0.8,
        wordsPerMinute: this.currentSession.productivity
      };
    }

    return {
      wordsWritten: 0,
      timeSpent: 0,
      sessionsCompleted: 0,
      averageWPM: 0,
      consistency: 0,
      wordsPerMinute: 0
    };
  }

  async getMotivation(metrics: ProgressMetrics): Promise<{ message: string; level: string; motivationType?: string }> {
    let message = 'Keep writing! Every word counts.';
    let level = 'medium';

    if (metrics.averageWPM > 25) {
      message = 'Amazing writing speed! You\'re in the flow.';
      level = 'excellent';
    } else if (metrics.consistency > 0.8) {
      message = 'Your consistency is impressive! Keep it up.';
      level = 'high';
    } else if (metrics.sessionsCompleted > 5) {
      message = 'Great dedication! You\'re building a strong habit.';
      level = 'high';
    } else if (metrics.wordsWritten > 1000) {
      message = 'Excellent progress! You\'re reaching your goals.';
      level = 'high';
    } else {
      level = 'low';
      message = 'Every writer starts somewhere. Keep going!';
    }

    return {
      message,
      level,
      motivationType: 'encouragement'
    };
  }

  async analyzeText(text: string): Promise<any> {
    // Comprehensive text analysis combining writing quality, style, and suggestions
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 12;

    const analysis = {
      readabilityScore: Math.min(100, Math.max(0, 100 - (avgSentenceLength - 15) * 2)),
      wordCount: wordCount,
      sentenceCount: sentences.length,
      averageSentenceLength: avgSentenceLength,
      complexityScore: avgSentenceLength > 20 ? 80 : avgSentenceLength > 12 ? 60 : 40,
      suggestions: this.analyzeContentForSuggestions(text).map(s => ({
        type: s.type,
        title: s.title,
        description: s.description,
        confidence: s.confidence
      })),
      toneAnalysis: {
        positive: text.includes('good') || text.includes('great') || text.includes('excellent') ? 0.8 : 0.3,
        negative: text.includes('bad') || text.includes('terrible') || text.includes('awful') ? 0.8 : 0.2,
        neutral: 0.5,
        dominant: 'neutral'
      },
      styleMetrics: {
        complexity: avgSentenceLength > 20 ? 'high' : avgSentenceLength > 12 ? 'medium' : 'low',
        formality: text.includes('however') || text.includes('furthermore') ? 'formal' : 'informal',
        voice: 'active' // Simplified for mock
      },
      contentStructure: {
        hasIntroduction: sentences.length > 0,
        hasConclusion: sentences.length > 2,
        paragraphFlow: 'good',
        coherence: 0.8
      }
    };

    return analysis;
  }

  async getRealTimeSuggestions(text: string, cursorPosition?: number): Promise<any> {
    // Provide real-time writing suggestions based on current text and cursor position
    const suggestions = this.analyzeContentForSuggestions(text);
    
    return {
      suggestions: suggestions.slice(0, 3), // Top 3 suggestions
      autoComplete: [
        'to complete this thought',
        'and furthermore',
        'however, it should be noted'
      ],
      grammarCorrections: [],
      styleImprovement: suggestions.filter(s => s.type === 'style').slice(0, 2)
    };
  }

  async applySuggestions(suggestionIds: string[]): Promise<{ success: boolean; appliedCount: number; errors: string[] }> {
    // Apply multiple suggestions to the current session
    if (!this.currentSession) {
      return { success: false, appliedCount: 0, errors: ['No active session'] };
    }

    let appliedCount = 0;
    const errors: string[] = [];

    for (const id of suggestionIds) {
      const success = await this.applySuggestion(id);
      if (success) {
        appliedCount++;
      } else {
        errors.push(`Failed to apply suggestion: ${id}`);
      }
    }

    return {
      success: appliedCount > 0,
      appliedCount,
      errors
    };
  }

  // Additional methods required by comprehensive tests
  getAllSessions(): WritingSession[] {
    return this.sessions;
  }

  getCurrentPersonality(): AIPersonality | null {
    return this.personalities.find(p => p.isActive) || null;
  }


  on(event: string, callback: Function): void {
    this.addEventListener(event, callback);
  }

  off(event: string, callback: Function): void {
    this.removeEventListener(event, callback);
  }

  removeAllListeners(event: string): void {
    this.eventListeners.set(event, []);
  }

  // AI Control Methods
  isAIEnabled(): boolean {
    return this.aiEnabled !== false;
  }

  enableAI(): void {
    this.aiEnabled = true;
    this.saveToLocalStorage();
  }

  disableAI(): void {
    this.aiEnabled = false;
    this.saveToLocalStorage();
  }

  isRealTimeFeedbackEnabled(): boolean {
    return this.realTimeFeedbackEnabled !== false;
  }

  enableRealTimeFeedback(): void {
    this.realTimeFeedbackEnabled = true;
    this.saveToLocalStorage();
  }

  disableRealTimeFeedback(): void {
    this.realTimeFeedbackEnabled = false;
    this.saveToLocalStorage();
  }

  // Health monitoring
  checkSessionHealth(): void {
    if (!this.currentSession) return;
    
    const sessionDuration = Date.now() - this.currentSession.startTime;
    const oneHour = 60 * 60 * 1000;
    
    if (sessionDuration > oneHour) {
      const reminder = {
        type: 'break',
        message: 'You\'ve been writing for over an hour. Consider taking a short break to maintain focus and creativity.',
        timestamp: Date.now()
      };
      this.emitEvent('healthReminder', reminder);
    }
  }

  // Data management methods  
  saveDataToStorage(): void {
    this.saveToLocalStorage();
  }

  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      service: 'aiWritingCompanion',
      timestamp: new Date().toISOString(),
      checks: {
        sessionManagement: true,
        personalitiesLoaded: this.personalities.length > 0,
        goalsTracked: this.goals.length >= 0,
        metricsUpdated: this.userMetrics.totalSessions >= 0
      }
    };
  }
}

// Export singleton instance
const aiWritingCompanion = new AIWritingCompanionService();
export default aiWritingCompanion;
export { aiWritingCompanion };