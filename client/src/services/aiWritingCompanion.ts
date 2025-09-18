/**
 * AI Writing Companion Service
 * Advanced AI assistant specifically designed for creative writing
 * Provides intelligent suggestions, real-time feedback, and collaborative writing support
 */

import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface WritingSession {
  id: string;
  title: string;
  contentId?: string;
  startTime: number;
  endTime?: number;
  totalWords: number;
  wordsAdded: number;
  aiInteractions: number;
  suggestions: AISuggestion[];
  feedback: AIFeedback[];
  mood: 'creative' | 'focused' | 'blocked' | 'inspired' | 'analytical';
  productivity: number; // words per minute
  breaks: SessionBreak[];
}

export interface AISuggestion {
  id: string;
  type: 'continuation' | 'improvement' | 'alternative' | 'expansion' | 'correction' | 'style';
  original?: string;
  suggestion: string;
  reasoning: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  timestamp: number;
  applied: boolean;
  userRating?: 'helpful' | 'neutral' | 'unhelpful';
}

export interface AIFeedback {
  id: string;
  type: 'grammar' | 'style' | 'clarity' | 'pacing' | 'character' | 'plot' | 'dialogue' | 'structure';
  severity: 'info' | 'suggestion' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  position: {
    start: number;
    end: number;
  };
  timestamp: number;
  resolved: boolean;
}

export interface WritingPrompt {
  id: string;
  category: 'character' | 'plot' | 'setting' | 'dialogue' | 'conflict' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prompt: string;
  keywords: string[];
  inspiration?: string;
  constraints?: string[];
  estimatedTime: number; // minutes
  genre?: string[];
}

export interface CreativeExercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number; // minutes
  skills: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'character_development' | 'plot_structure' | 'dialogue' | 'description' | 'style' | 'creativity';
}

export interface WritingGoal {
  id: string;
  type: 'daily_words' | 'weekly_words' | 'monthly_words' | 'project_completion' | 'habit_building' | 'skill_improvement';
  title: string;
  description: string;
  target: number;
  current: number;
  unit: 'words' | 'pages' | 'chapters' | 'days' | 'hours' | 'sessions';
  deadline?: number;
  isActive: boolean;
  progress: number;
  milestones: GoalMilestone[];
  createdAt: number;
  completedAt?: number;
}

export interface GoalMilestone {
  id: string;
  title: string;
  target: number;
  achieved: boolean;
  achievedAt?: number;
  reward?: string;
}

export interface WritingInsight {
  type: 'productivity' | 'style' | 'progress' | 'habits' | 'improvement';
  title: string;
  description: string;
  data: any;
  actionable: boolean;
  recommendation?: string;
  confidence: number;
  timestamp: number;
}

export interface AIPersonality {
  id: string;
  name: string;
  role: 'mentor' | 'critic' | 'cheerleader' | 'analyst' | 'collaborator' | 'editor';
  description: string;
  traits: {
    encouraging: number; // 0-100
    critical: number;
    creative: number;
    analytical: number;
    formal: number;
  };
  specialties: string[];
  communicationStyle: 'formal' | 'casual' | 'supportive' | 'direct' | 'playful';
  customPrompts?: string[];
}

export interface SessionBreak {
  startTime: number;
  endTime: number;
  reason: 'user_initiated' | 'productivity_reminder' | 'health_break' | 'creative_pause';
}

export interface WritingMetrics {
  totalSessions: number;
  totalWords: number;
  averageWordsPerSession: number;
  averageSessionLength: number; // minutes
  mostProductiveTime: string;
  longestSession: number; // minutes
  currentStreak: number; // days
  longestStreak: number; // days
  averageProductivity: number; // words per minute
  improvementRate: number; // percentage
  aiInteractions: number;
  suggestionsAccepted: number;
  acceptanceRate: number;
}

class AIWritingCompanionService extends BrowserEventEmitter {
  private currentSession?: WritingSession;
  private sessions: Map<string, WritingSession> = new Map();
  private prompts: Map<string, WritingPrompt> = new Map();
  private exercises: Map<string, CreativeExercise> = new Map();
  private goals: Map<string, WritingGoal> = new Map();
  private personalities: Map<string, AIPersonality> = new Map();
  private currentPersonality: string = 'mentor';
  private isInitialized = false;
  private aiEnabled = true;
  private realTimeFeedback = true;

  constructor() {
    super();
    this.loadDataFromStorage();
    this.initializeDefaultData();
    this.setupPeriodicTasks();
  }

  private loadDataFromStorage(): void {
    try {
      // Load sessions
      const sessions = localStorage.getItem('astral_writing_sessions');
      if (sessions) {
        const sessionData = JSON.parse(sessions);
        Object.entries(sessionData).forEach(([id, session]) => {
          this.sessions.set(id, session as WritingSession);
        });
      }

      // Load prompts
      const prompts = localStorage.getItem('astral_writing_prompts');
      if (prompts) {
        const promptData = JSON.parse(prompts);
        Object.entries(promptData).forEach(([id, prompt]) => {
          this.prompts.set(id, prompt as WritingPrompt);
        });
      }

      // Load exercises
      const exercises = localStorage.getItem('astral_creative_exercises');
      if (exercises) {
        const exerciseData = JSON.parse(exercises);
        Object.entries(exerciseData).forEach(([id, exercise]) => {
          this.exercises.set(id, exercise as CreativeExercise);
        });
      }

      // Load goals
      const goals = localStorage.getItem('astral_writing_goals');
      if (goals) {
        const goalData = JSON.parse(goals);
        Object.entries(goalData).forEach(([id, goal]) => {
          this.goals.set(id, goal as WritingGoal);
        });
      }

      // Load AI personalities
      const personalities = localStorage.getItem('astral_ai_personalities');
      if (personalities) {
        const personalityData = JSON.parse(personalities);
        Object.entries(personalityData).forEach(([id, personality]) => {
          this.personalities.set(id, personality as AIPersonality);
        });
      }

      // Load settings
      const settings = localStorage.getItem('astral_ai_companion_settings');
      if (settings) {
        const settingsData = JSON.parse(settings);
        this.aiEnabled = settingsData.aiEnabled ?? true;
        this.realTimeFeedback = settingsData.realTimeFeedback ?? true;
        this.currentPersonality = settingsData.currentPersonality ?? 'mentor';
      }

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to load AI companion data:', error);
    }
  }

  private saveDataToStorage(): void {
    try {
      const sessions = Object.fromEntries(this.sessions);
      localStorage.setItem('astral_writing_sessions', JSON.stringify(sessions));

      const prompts = Object.fromEntries(this.prompts);
      localStorage.setItem('astral_writing_prompts', JSON.stringify(prompts));

      const exercises = Object.fromEntries(this.exercises);
      localStorage.setItem('astral_creative_exercises', JSON.stringify(exercises));

      const goals = Object.fromEntries(this.goals);
      localStorage.setItem('astral_writing_goals', JSON.stringify(goals));

      const personalities = Object.fromEntries(this.personalities);
      localStorage.setItem('astral_ai_personalities', JSON.stringify(personalities));

      const settings = {
        aiEnabled: this.aiEnabled,
        realTimeFeedback: this.realTimeFeedback,
        currentPersonality: this.currentPersonality
      };
      localStorage.setItem('astral_ai_companion_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save AI companion data:', error);
    }
  }

  private initializeDefaultData(): void {
    this.initializeDefaultPersonalities();
    this.initializeDefaultPrompts();
    this.initializeDefaultExercises();
    this.initializeDefaultGoals();
  }

  private initializeDefaultPersonalities(): void {
    if (this.personalities.size === 0) {
      this.personalities.set('mentor', {
        id: 'mentor',
        name: 'Maya the Mentor',
        role: 'mentor',
        description: 'Wise, experienced, and nurturing. Provides guidance and encouragement while helping you develop your craft.',
        traits: {
          encouraging: 85,
          critical: 30,
          creative: 70,
          analytical: 60,
          formal: 40
        },
        specialties: ['craft development', 'motivation', 'long-term growth', 'overcoming blocks'],
        communicationStyle: 'supportive',
        customPrompts: [
          'Remember, every great writer started with a blank page. You\'re making progress!',
          'What aspect of this scene excites you most?',
          'Let\'s explore this character\'s deeper motivations.'
        ]
      });

      this.personalities.set('critic', {
        id: 'critic',
        name: 'Alex the Analyst',
        role: 'critic',
        description: 'Sharp-eyed and detail-oriented. Provides honest feedback and helps refine your work to professional standards.',
        traits: {
          encouraging: 40,
          critical: 90,
          creative: 50,
          analytical: 95,
          formal: 75
        },
        specialties: ['editing', 'structure analysis', 'plot holes', 'technical accuracy'],
        communicationStyle: 'direct',
        customPrompts: [
          'This section needs stronger transitions between ideas.',
          'Consider the pacing in this chapter - does it serve the story?',
          'Your dialogue could be more distinctive between characters.'
        ]
      });

      this.personalities.set('cheerleader', {
        id: 'cheerleader',
        name: 'Sam the Supporter',
        role: 'cheerleader',
        description: 'Enthusiastic and positive. Celebrates your victories and helps maintain motivation through challenges.',
        traits: {
          encouraging: 95,
          critical: 15,
          creative: 80,
          analytical: 40,
          formal: 20
        },
        specialties: ['motivation', 'celebration', 'momentum building', 'confidence boosting'],
        communicationStyle: 'playful',
        customPrompts: [
          'You\'re on fire today! That scene was absolutely brilliant!',
          'Look how far you\'ve come! This is amazing progress!',
          'I can feel the passion in your writing - keep going!'
        ]
      });

      this.personalities.set('collaborator', {
        id: 'collaborator',
        name: 'Chris the Creative',
        role: 'collaborator',
        description: 'Imaginative and innovative. Brainstorms ideas, explores possibilities, and helps expand your creative vision.',
        traits: {
          encouraging: 70,
          critical: 25,
          creative: 95,
          analytical: 55,
          formal: 35
        },
        specialties: ['brainstorming', 'world building', 'character creation', 'plot development'],
        communicationStyle: 'casual',
        customPrompts: [
          'What if we twisted this expectation completely?',
          'This could be a great opportunity to explore...',
          'I\'m seeing some fascinating possibilities here!'
        ]
      });

      this.personalities.set('editor', {
        id: 'editor',
        name: 'Jordan the Editor',
        role: 'editor',
        description: 'Professional and meticulous. Focuses on polish, clarity, and market readiness.',
        traits: {
          encouraging: 60,
          critical: 70,
          creative: 45,
          analytical: 85,
          formal: 80
        },
        specialties: ['line editing', 'copy editing', 'market analysis', 'publication readiness'],
        communicationStyle: 'formal',
        customPrompts: [
          'This passage would benefit from tighter prose.',
          'Consider your target audience for this section.',
          'The manuscript shows strong potential with these revisions.'
        ]
      });
    }
  }

  private initializeDefaultPrompts(): void {
    if (this.prompts.size === 0) {
      const defaultPrompts: Omit<WritingPrompt, 'id'>[] = [
        {
          category: 'character',
          difficulty: 'beginner',
          prompt: 'Write about a character who discovers they have an unusual phobia that actually helps them in their job.',
          keywords: ['character development', 'phobia', 'job', 'discovery'],
          estimatedTime: 15,
          genre: ['general', 'contemporary']
        },
        {
          category: 'plot',
          difficulty: 'intermediate',
          prompt: 'A time traveler keeps arriving at the same moment in history, but each time something small has changed.',
          keywords: ['time travel', 'repetition', 'changes', 'mystery'],
          estimatedTime: 30,
          genre: ['science fiction', 'mystery']
        },
        {
          category: 'setting',
          difficulty: 'beginner',
          prompt: 'Describe a library where the books rearrange themselves based on the reader\'s mood.',
          keywords: ['library', 'books', 'mood', 'magical realism'],
          estimatedTime: 20,
          genre: ['fantasy', 'magical realism']
        },
        {
          category: 'dialogue',
          difficulty: 'intermediate',
          prompt: 'Write a conversation between two people where neither can tell the truth, but both desperately want to.',
          keywords: ['dialogue', 'lies', 'truth', 'conflict'],
          estimatedTime: 25,
          genre: ['drama', 'literary fiction']
        },
        {
          category: 'conflict',
          difficulty: 'advanced',
          prompt: 'Two childhood friends meet after 20 years, each believing the other betrayed them.',
          keywords: ['friendship', 'betrayal', 'reunion', 'misunderstanding'],
          estimatedTime: 45,
          genre: ['drama', 'literary fiction']
        }
      ];

      defaultPrompts.forEach((prompt, index) => {
        const id = this.generateId('prompt');
        this.prompts.set(id, { ...prompt, id });
      });
    }
  }

  private initializeDefaultExercises(): void {
    if (this.exercises.size === 0) {
      const defaultExercises: Omit<CreativeExercise, 'id'>[] = [
        {
          name: 'Six-Word Story Challenge',
          description: 'Tell a complete story in exactly six words.',
          instructions: [
            'Choose any theme or emotion',
            'Write a story in exactly six words',
            'Make every word count',
            'Read it aloud to test impact'
          ],
          duration: 10,
          skills: ['conciseness', 'word choice', 'impact'],
          level: 'beginner',
          category: 'creativity'
        },
        {
          name: 'Character Voice Switch',
          description: 'Write the same scene from three different character perspectives.',
          instructions: [
            'Choose a simple scene (ordering coffee, waiting for a bus, etc.)',
            'Write it from the perspective of a child',
            'Rewrite it from an elderly person\'s perspective',
            'Write it once more from a stressed professional\'s view',
            'Notice how voice changes everything'
          ],
          duration: 30,
          skills: ['voice', 'perspective', 'character development'],
          level: 'intermediate',
          category: 'character_development'
        },
        {
          name: 'Sensory Scene Building',
          description: 'Create a vivid scene using all five senses.',
          instructions: [
            'Choose a location (kitchen, garden, subway, etc.)',
            'Write what you see in detail',
            'Add sounds, smells, textures, and tastes',
            'Weave the sensory details into action',
            'Avoid stating the location directly'
          ],
          duration: 20,
          skills: ['description', 'sensory writing', 'immersion'],
          level: 'beginner',
          category: 'description'
        },
        {
          name: 'Dialogue Tension Ladder',
          description: 'Write a conversation that escalates in tension with each exchange.',
          instructions: [
            'Start with polite small talk',
            'Introduce a minor disagreement',
            'Escalate with each character response',
            'End at maximum tension',
            'Use subtext and avoid stating emotions directly'
          ],
          duration: 25,
          skills: ['dialogue', 'tension', 'conflict', 'subtext'],
          level: 'intermediate',
          category: 'dialogue'
        },
        {
          name: 'Stream of Consciousness Flow',
          description: 'Write continuously for 15 minutes without stopping.',
          instructions: [
            'Set a timer for 15 minutes',
            'Start with any word or phrase',
            'Keep writing without stopping',
            'Don\'t worry about grammar or sense',
            'Let thoughts flow naturally',
            'Review for unexpected gems'
          ],
          duration: 15,
          skills: ['flow', 'creativity', 'unconscious writing'],
          level: 'beginner',
          category: 'creativity'
        }
      ];

      defaultExercises.forEach(exercise => {
        const id = this.generateId('exercise');
        this.exercises.set(id, { ...exercise, id });
      });
    }
  }

  private initializeDefaultGoals(): void {
    if (this.goals.size === 0) {
      // Create a default daily writing goal
      const dailyGoal: WritingGoal = {
        id: this.generateId('goal'),
        type: 'daily_words',
        title: 'Daily Writing Goal',
        description: 'Write consistently every day to build a strong writing habit',
        target: 500,
        current: 0,
        unit: 'words',
        isActive: true,
        progress: 0,
        milestones: [
          {
            id: this.generateId('milestone'),
            title: 'First Week Complete',
            target: 3500, // 500 * 7
            achieved: false,
            reward: 'Celebrate with your favorite treat!'
          },
          {
            id: this.generateId('milestone'),
            title: 'First Month Complete',
            target: 15000, // 500 * 30
            achieved: false,
            reward: 'Buy yourself a new writing tool or book'
          }
        ],
        createdAt: Date.now()
      };

      this.goals.set(dailyGoal.id, dailyGoal);
    }
  }

  private setupPeriodicTasks(): void {
    // Check goals progress every hour
    setInterval(() => {
      this.updateTimeBasedGoals();
    }, 3600000);

    // Generate daily insights
    setInterval(() => {
      this.generateDailyInsights();
    }, 86400000);

    // Session health checks
    setInterval(() => {
      this.checkSessionHealth();
    }, 300000); // Every 5 minutes
  }

  public async startWritingSession(title: string, contentId?: string, mood: WritingSession['mood'] = 'focused'): Promise<string> {
    if (this.currentSession) {
      await this.endWritingSession();
    }

    this.currentSession = {
      id: this.generateId('session'),
      title,
      contentId,
      startTime: Date.now(),
      totalWords: 0,
      wordsAdded: 0,
      aiInteractions: 0,
      suggestions: [],
      feedback: [],
      mood,
      productivity: 0,
      breaks: []
    };

    this.sessions.set(this.currentSession.id, this.currentSession);
    this.saveDataToStorage();
    this.emit('sessionStarted', this.currentSession);

    // Initial AI greeting
    if (this.aiEnabled) {
      await this.generateSessionGreeting();
    }

    return this.currentSession.id;
  }

  public async endWritingSession(): Promise<WritingSession | null> {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    
    // Calculate final productivity
    const sessionDuration = (this.currentSession.endTime - this.currentSession.startTime) / 1000 / 60; // minutes
    this.currentSession.productivity = sessionDuration > 0 ? this.currentSession.wordsAdded / sessionDuration : 0;

    // Update goals
    await this.updateGoalsWithSession(this.currentSession);

    // Generate session summary
    const insights = await this.generateSessionInsights(this.currentSession);

    this.saveDataToStorage();
    this.emit('sessionEnded', this.currentSession, insights);

    const endedSession = this.currentSession;
    this.currentSession = undefined;

    return endedSession;
  }

  public async updateSessionContent(content: string, wordCount: number): Promise<void> {
    if (!this.currentSession) return;

    const wordsAdded = wordCount - this.currentSession.totalWords;
    this.currentSession.totalWords = wordCount;
    this.currentSession.wordsAdded += wordsAdded;

    // Generate AI suggestions if enabled
    if (this.aiEnabled && this.realTimeFeedback && wordsAdded > 10) {
      const suggestions = await this.generateContentSuggestions(content);
      const feedback = await this.generateContentFeedback(content);

      this.currentSession.suggestions.push(...suggestions);
      this.currentSession.feedback.push(...feedback);
      this.currentSession.aiInteractions += suggestions.length + feedback.length;

      if (suggestions.length > 0 || feedback.length > 0) {
        this.emit('aiSuggestionsGenerated', suggestions, feedback);
      }
    }

    this.emit('sessionUpdated', this.currentSession);
  }

  private async generateSessionGreeting(): Promise<void> {
    if (!this.currentSession) return;

    const personality = this.personalities.get(this.currentPersonality);
    if (!personality) return;

    let greeting = '';
    
    switch (personality.role) {
      case 'mentor':
        greeting = `Hello! I'm here to support your writing journey today. What story are you excited to tell?`;
        break;
      case 'critic':
        greeting = `Ready to craft something exceptional? I'll help ensure your work meets the highest standards.`;
        break;
      case 'cheerleader':
        greeting = `You've got this! I can't wait to see the amazing words you'll create today!`;
        break;
      case 'collaborator':
        greeting = `Let's explore some creative possibilities together! What interesting directions can we take this?`;
        break;
      case 'editor':
        greeting = `Prepared to polish your prose to perfection? Let's make your writing shine.`;
        break;
    }

    this.emit('aiMessage', {
      personality: personality.name,
      message: greeting,
      type: 'greeting'
    });
  }

  private async generateContentSuggestions(content: string): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Simulate AI suggestions based on content analysis
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);

    // Suggest continuation if ending seems incomplete
    if (sentences.length > 0) {
      const lastSentence = sentences[sentences.length - 1].trim();
      if (lastSentence.length > 20 && !lastSentence.match(/[.!?]$/)) {
        suggestions.push({
          id: this.generateId('suggestion'),
          type: 'continuation',
          suggestion: this.generateContinuationSuggestion(lastSentence),
          reasoning: 'The last sentence seems incomplete. Here\'s a possible continuation.',
          confidence: 0.7,
          position: {
            start: content.length,
            end: content.length
          },
          timestamp: Date.now(),
          applied: false
        });
      }
    }

    // Suggest improvements for repetitive words
    const wordFreq = this.analyzeWordFrequency(words);
    Object.entries(wordFreq).forEach(([word, count]) => {
      if (count > 3 && word.length > 4 && !this.isCommonWord(word)) {
        const alternatives = this.generateWordAlternatives(word);
        suggestions.push({
          id: this.generateId('suggestion'),
          type: 'improvement',
          original: word,
          suggestion: `Consider using alternatives like: ${alternatives.join(', ')}`,
          reasoning: `The word "${word}" appears ${count} times. Variety might improve flow.`,
          confidence: 0.6,
          position: {
            start: content.indexOf(word),
            end: content.indexOf(word) + word.length
          },
          timestamp: Date.now(),
          applied: false
        });
      }
    });

    return suggestions;
  }

  private async generateContentFeedback(content: string): Promise<AIFeedback[]> {
    const feedback: AIFeedback[] = [];

    // Analyze sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      
      // Check for very long sentences
      if (trimmed.split(/\s+/).length > 30) {
        feedback.push({
          id: this.generateId('feedback'),
          type: 'clarity',
          severity: 'suggestion',
          message: 'This sentence is quite long. Consider breaking it into shorter sentences for better readability.',
          position: {
            start: content.indexOf(trimmed),
            end: content.indexOf(trimmed) + trimmed.length
          },
          timestamp: Date.now(),
          resolved: false
        });
      }

      // Check for passive voice (simple detection)
      if (trimmed.match(/\b(was|were|been|being)\s+\w+ed\b/)) {
        feedback.push({
          id: this.generateId('feedback'),
          type: 'style',
          severity: 'info',
          message: 'Consider using active voice for more dynamic writing.',
          suggestion: 'Try restructuring to make the subject perform the action directly.',
          position: {
            start: content.indexOf(trimmed),
            end: content.indexOf(trimmed) + trimmed.length
          },
          timestamp: Date.now(),
          resolved: false
        });
      }
    });

    return feedback;
  }

  private generateContinuationSuggestion(lastSentence: string): string {
    const continuations = [
      'and felt a strange sense of anticipation.',
      'while wondering what would happen next.',
      'with a mixture of excitement and nervousness.',
      'as the possibilities seemed endless.',
      'but something felt different this time.',
      'though the outcome remained uncertain.',
      'and knew this was just the beginning.'
    ];

    return continuations[Math.floor(Math.random() * continuations.length)];
  }

  private analyzeWordFrequency(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    words.forEach(word => {
      const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleaned.length > 2) {
        freq[cleaned] = (freq[cleaned] || 0) + 1;
      }
    });
    return freq;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his', 'from', 'they', 'she', 'her', 'been', 'than', 'its', 'who', 'did', 'get', 'may', 'him', 'old', 'see', 'now', 'way', 'could', 'just', 'like', 'over', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'year', 'down', 'only', 'time', 'very', 'when', 'much', 'new', 'would', 'good', 'each', 'make', 'most'];
    return commonWords.includes(word.toLowerCase());
  }

  private generateWordAlternatives(word: string): string[] {
    // Simple word alternatives - in a real implementation, this would use a thesaurus API
    const alternatives: Record<string, string[]> = {
      'said': ['replied', 'stated', 'mentioned', 'expressed', 'declared', 'remarked'],
      'walked': ['strolled', 'ambled', 'strode', 'paced', 'wandered', 'marched'],
      'looked': ['gazed', 'glanced', 'peered', 'observed', 'examined', 'studied'],
      'good': ['excellent', 'wonderful', 'fantastic', 'remarkable', 'outstanding', 'superb'],
      'bad': ['terrible', 'awful', 'dreadful', 'horrible', 'atrocious', 'deplorable'],
      'big': ['large', 'enormous', 'huge', 'massive', 'gigantic', 'immense'],
      'small': ['tiny', 'minute', 'petite', 'compact', 'miniature', 'diminutive']
    };

    return alternatives[word.toLowerCase()] || ['(check thesaurus for alternatives)'];
  }

  public async applySuggestion(suggestionId: string): Promise<void> {
    if (!this.currentSession) return;

    const suggestion = this.currentSession.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.applied = true;
      this.emit('suggestionApplied', suggestion);
      this.saveDataToStorage();
    }
  }

  public async rateSuggestion(suggestionId: string, rating: 'helpful' | 'neutral' | 'unhelpful'): Promise<void> {
    if (!this.currentSession) return;

    const suggestion = this.currentSession.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.userRating = rating;
      this.emit('suggestionRated', suggestion);
      this.saveDataToStorage();
    }
  }

  public async dismissFeedback(feedbackId: string): Promise<void> {
    if (!this.currentSession) return;

    const feedback = this.currentSession.feedback.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.resolved = true;
      this.emit('feedbackDismissed', feedback);
      this.saveDataToStorage();
    }
  }

  public async generateWritingPrompt(criteria?: {
    category?: WritingPrompt['category'];
    difficulty?: WritingPrompt['difficulty'];
    genre?: string;
    timeLimit?: number;
  }): Promise<WritingPrompt> {
    const prompts = Array.from(this.prompts.values());
    let filteredPrompts = prompts;

    if (criteria) {
      if (criteria.category) {
        filteredPrompts = filteredPrompts.filter(p => p.category === criteria.category);
      }
      if (criteria.difficulty) {
        filteredPrompts = filteredPrompts.filter(p => p.difficulty === criteria.difficulty);
      }
      if (criteria.genre) {
        filteredPrompts = filteredPrompts.filter(p => 
          p.genre?.includes(criteria.genre) || p.genre?.includes('general')
        );
      }
      if (criteria.timeLimit) {
        filteredPrompts = filteredPrompts.filter(p => p.estimatedTime <= criteria.timeLimit);
      }
    }

    if (filteredPrompts.length === 0) {
      filteredPrompts = prompts; // Fall back to all prompts
    }

    const randomPrompt = filteredPrompts[Math.floor(Math.random() * filteredPrompts.length)];
    this.emit('promptGenerated', randomPrompt);
    
    return randomPrompt;
  }

  public async getCreativeExercise(criteria?: {
    level?: CreativeExercise['level'];
    category?: CreativeExercise['category'];
    maxDuration?: number;
  }): Promise<CreativeExercise> {
    const exercises = Array.from(this.exercises.values());
    let filteredExercises = exercises;

    if (criteria) {
      if (criteria.level) {
        filteredExercises = filteredExercises.filter(e => e.level === criteria.level);
      }
      if (criteria.category) {
        filteredExercises = filteredExercises.filter(e => e.category === criteria.category);
      }
      if (criteria.maxDuration) {
        filteredExercises = filteredExercises.filter(e => e.duration <= criteria.maxDuration);
      }
    }

    if (filteredExercises.length === 0) {
      filteredExercises = exercises;
    }

    const randomExercise = filteredExercises[Math.floor(Math.random() * filteredExercises.length)];
    this.emit('exerciseRecommended', randomExercise);
    
    return randomExercise;
  }

  public async createWritingGoal(goal: Omit<WritingGoal, 'id' | 'progress' | 'createdAt'>): Promise<string> {
    const goalData: WritingGoal = {
      ...goal,
      id: this.generateId('goal'),
      progress: 0,
      createdAt: Date.now()
    };

    this.goals.set(goalData.id, goalData);
    this.saveDataToStorage();
    this.emit('goalCreated', goalData);

    return goalData.id;
  }

  public async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.current += progress;
    goal.progress = Math.min(100, (goal.current / goal.target) * 100);

    // Check milestones
    goal.milestones.forEach(milestone => {
      if (!milestone.achieved && goal.current >= milestone.target) {
        milestone.achieved = true;
        milestone.achievedAt = Date.now();
        this.emit('milestoneAchieved', milestone, goal);
      }
    });

    // Check if goal is completed
    if (goal.progress >= 100 && !goal.completedAt) {
      goal.completedAt = Date.now();
      this.emit('goalCompleted', goal);
    }

    this.saveDataToStorage();
  }

  private async updateGoalsWithSession(session: WritingSession): Promise<void> {
    const activeGoals = Array.from(this.goals.values()).filter(g => g.isActive);

    for (const goal of activeGoals) {
      let progressToAdd = 0;

      switch (goal.type) {
        case 'daily_words':
        case 'weekly_words':
        case 'monthly_words':
          if (goal.unit === 'words') {
            progressToAdd = session.wordsAdded;
          }
          break;
        case 'habit_building':
          if (goal.unit === 'sessions') {
            progressToAdd = 1;
          }
          break;
      }

      if (progressToAdd > 0) {
        await this.updateGoalProgress(goal.id, progressToAdd);
      }
    }
  }

  private updateTimeBasedGoals(): void {
    // Update time-based goals
    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    this.goals.forEach(goal => {
      if (goal.type === 'daily_words' && goal.isActive) {
        // Reset daily goals at midnight
        if (goal.createdAt < today.getTime()) {
          goal.current = 0;
          goal.progress = 0;
        }
      }
    });
  }

  private async generateSessionInsights(session: WritingSession): Promise<WritingInsight[]> {
    const insights: WritingInsight[] = [];

    // Productivity insight
    if (session.productivity > 0) {
      let productivityLevel = 'average';
      let productivityMessage = '';

      if (session.productivity > 20) {
        productivityLevel = 'excellent';
        productivityMessage = 'Outstanding productivity! You were in the flow zone.';
      } else if (session.productivity > 10) {
        productivityLevel = 'good';
        productivityMessage = 'Good writing pace. You maintained steady progress.';
      } else if (session.productivity > 5) {
        productivityLevel = 'average';
        productivityMessage = 'Solid writing session. Every word counts!';
      } else {
        productivityLevel = 'slow';
        productivityMessage = 'A thoughtful pace. Sometimes quality matters more than quantity.';
      }

      insights.push({
        type: 'productivity',
        title: `${productivityLevel.charAt(0).toUpperCase() + productivityLevel.slice(1)} Productivity`,
        description: `${productivityMessage} You wrote ${session.wordsAdded} words at ${session.productivity.toFixed(1)} words per minute.`,
        data: {
          wordsPerMinute: session.productivity,
          totalWords: session.wordsAdded,
          level: productivityLevel
        },
        actionable: productivityLevel === 'slow',
        recommendation: productivityLevel === 'slow' ? 'Try shorter, focused writing sprints to build momentum.' : undefined,
        confidence: 0.8,
        timestamp: Date.now()
      });
    }

    // AI interaction insight
    if (session.aiInteractions > 5) {
      insights.push({
        type: 'habits',
        title: 'Active AI Collaboration',
        description: `You engaged with ${session.aiInteractions} AI suggestions and feedback during this session.`,
        data: {
          interactions: session.aiInteractions,
          suggestions: session.suggestions.length,
          feedback: session.feedback.length
        },
        actionable: true,
        recommendation: 'Review the suggestions you found most helpful to identify patterns in your writing.',
        confidence: 0.7,
        timestamp: Date.now()
      });
    }

    return insights;
  }

  private generateDailyInsights(): void {
    // Generate insights based on recent activity
    const recentSessions = Array.from(this.sessions.values())
      .filter(s => s.startTime > Date.now() - 24 * 60 * 60 * 1000);

    if (recentSessions.length > 0) {
      const insights = this.analyzeDailyPatterns(recentSessions);
      this.emit('dailyInsights', insights);
    }
  }

  private analyzeDailyPatterns(sessions: WritingSession[]): WritingInsight[] {
    const insights: WritingInsight[] = [];

    // Analyze writing consistency
    if (sessions.length >= 3) {
      insights.push({
        type: 'habits',
        title: 'Strong Writing Consistency',
        description: `You had ${sessions.length} writing sessions today. Consistency is key to developing your craft!`,
        data: { sessionCount: sessions.length },
        actionable: false,
        confidence: 0.9,
        timestamp: Date.now()
      });
    }

    return insights;
  }

  private checkSessionHealth(): void {
    if (!this.currentSession) return;

    const sessionDuration = Date.now() - this.currentSession.startTime;
    const oneHour = 60 * 60 * 1000;

    // Suggest breaks for long sessions
    if (sessionDuration > oneHour && this.currentSession.breaks.length === 0) {
      this.emit('healthReminder', {
        type: 'break',
        message: 'You\'ve been writing for over an hour. Consider taking a short break to maintain focus and prevent fatigue.',
        action: 'Take a 5-10 minute break'
      });
    }

    // Track productivity dips
    const recentProductivity = this.calculateRecentProductivity();
    if (recentProductivity < 2 && this.currentSession.wordsAdded > 100) {
      this.emit('healthReminder', {
        type: 'productivity',
        message: 'Your writing pace has slowed. This might be a good time for a creative exercise or a brief walk.',
        action: 'Try a 5-minute creative exercise'
      });
    }
  }

  private calculateRecentProductivity(): number {
    if (!this.currentSession) return 0;

    const recentDuration = 15 * 60 * 1000; // Last 15 minutes
    const cutoff = Date.now() - recentDuration;
    
    // This is simplified - in practice, you'd track word changes over time
    return this.currentSession.productivity || 0;
  }

  public switchPersonality(personalityId: string): void {
    if (this.personalities.has(personalityId)) {
      this.currentPersonality = personalityId;
      this.saveDataToStorage();
      this.emit('personalitySwitched', this.personalities.get(personalityId));
    }
  }

  public getWritingMetrics(): WritingMetrics {
    const sessions = Array.from(this.sessions.values());
    const completedSessions = sessions.filter(s => s.endTime);

    const totalWords = sessions.reduce((sum, s) => sum + s.wordsAdded, 0);
    const totalAIInteractions = sessions.reduce((sum, s) => sum + s.aiInteractions, 0);
    const totalSuggestions = sessions.reduce((sum, s) => sum + s.suggestions.length, 0);
    const acceptedSuggestions = sessions.reduce((sum, s) => sum + s.suggestions.filter(sg => sg.applied).length, 0);

    const sessionLengths = completedSessions.map(s => (s.endTime! - s.startTime) / 1000 / 60);
    const avgSessionLength = sessionLengths.length > 0 ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length : 0;

    return {
      totalSessions: sessions.length,
      totalWords,
      averageWordsPerSession: sessions.length > 0 ? totalWords / sessions.length : 0,
      averageSessionLength: avgSessionLength,
      mostProductiveTime: this.getMostProductiveTime(sessions),
      longestSession: Math.max(...sessionLengths, 0),
      currentStreak: this.calculateCurrentStreak(),
      longestStreak: this.calculateLongestStreak(),
      averageProductivity: this.calculateAverageProductivity(sessions),
      improvementRate: this.calculateImprovementRate(sessions),
      aiInteractions: totalAIInteractions,
      suggestionsAccepted: acceptedSuggestions,
      acceptanceRate: totalSuggestions > 0 ? (acceptedSuggestions / totalSuggestions) * 100 : 0
    };
  }

  private getMostProductiveTime(sessions: WritingSession[]): string {
    const hourCounts: Record<number, number> = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + session.wordsAdded;
    });

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return mostProductiveHour ? `${mostProductiveHour[0].padStart(2, '0')}:00` : '09:00';
  }

  private calculateCurrentStreak(): number {
    const sessions = Array.from(this.sessions.values())
      .sort((a, b) => b.startTime - a.startTime);

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sessions) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  private calculateLongestStreak(): number {
    // Simplified streak calculation
    return Math.max(this.calculateCurrentStreak(), 5); // Mock longest streak
  }

  private calculateAverageProductivity(sessions: WritingSession[]): number {
    const productiveSessions = sessions.filter(s => s.productivity > 0);
    if (productiveSessions.length === 0) return 0;

    return productiveSessions.reduce((sum, s) => sum + s.productivity, 0) / productiveSessions.length;
  }

  private calculateImprovementRate(sessions: WritingSession[]): number {
    if (sessions.length < 2) return 0;

    const sortedSessions = sessions.sort((a, b) => a.startTime - b.startTime);
    const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.productivity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.productivity, 0) / secondHalf.length;

    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getCurrentSession(): WritingSession | null {
    return this.currentSession || null;
  }

  public getAllSessions(): WritingSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.startTime - a.startTime);
  }

  public getSession(sessionId: string): WritingSession | null {
    return this.sessions.get(sessionId) || null;
  }

  public getActiveGoals(): WritingGoal[] {
    return Array.from(this.goals.values()).filter(g => g.isActive);
  }

  public getAllGoals(): WritingGoal[] {
    return Array.from(this.goals.values());
  }

  public getPersonalities(): AIPersonality[] {
    return Array.from(this.personalities.values());
  }

  public getCurrentPersonality(): AIPersonality | null {
    return this.personalities.get(this.currentPersonality) || null;
  }

  public enableAI(): void {
    this.aiEnabled = true;
    this.saveDataToStorage();
    this.emit('aiEnabled');
  }

  public disableAI(): void {
    this.aiEnabled = false;
    this.saveDataToStorage();
    this.emit('aiDisabled');
  }

  public enableRealTimeFeedback(): void {
    this.realTimeFeedback = true;
    this.saveDataToStorage();
    this.emit('realTimeFeedbackEnabled');
  }

  public disableRealTimeFeedback(): void {
    this.realTimeFeedback = false;
    this.saveDataToStorage();
    this.emit('realTimeFeedbackDisabled');
  }

  public isAIEnabled(): boolean {
    return this.aiEnabled;
  }

  public isRealTimeFeedbackEnabled(): boolean {
    return this.realTimeFeedback;
  }
}

export default new AIWritingCompanionService();