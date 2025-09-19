/**
 * Creativity Booster Service
 * Provides creative inspiration and writing exercises
 */

export interface CreativeExercise {
  id: string;
  name: string;
  title: string; // Added for test compatibility
  type: 'warmup' | 'character' | 'plot' | 'setting';
  description: string;
  instructions: string[];
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Inspiration {
  id: string;
  type: 'quote' | 'scenario' | 'question';
  title: string; // Added for test compatibility
  content: string;
  category: string; // Added for test compatibility
  source?: string;
  mood: 'uplifting' | 'mysterious' | 'energetic';
}

export class CreativityBoosterService {
  private exercises: CreativeExercise[] = [];
  private inspirations: Inspiration[] = [];

  constructor() {
    this.initializeContent();
  }

  /**
   * Get creative exercises
   */
  public getExercises(type?: CreativeExercise['type']): CreativeExercise[] {
    return type ? this.exercises.filter(ex => ex.type === type) : this.exercises;
  }

  /**
   * Get random inspiration
   */
  public getInspiration(count: number = 3): Inspiration[] {
    const shuffled = this.inspirations.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Generate random writing prompt
   */
  public generateRandomPrompt(): string {
    const characters = ['a retired detective', 'a young artist', 'a mysterious stranger'];
    const settings = ['an abandoned mansion', 'a bustling marketplace', 'a quiet coffee shop'];
    const conflicts = ['discovers a secret', 'loses something precious', 'faces their greatest fear'];

    const character = characters[Math.floor(Math.random() * characters.length)];
    const setting = settings[Math.floor(Math.random() * settings.length)];
    const conflict = conflicts[Math.floor(Math.random() * conflicts.length)];

    return `Write about ${character} in ${setting} who ${conflict}.`;
  }

  /**
   * Get word associations for brainstorming
   */
  public getWordAssociations(startWord: string): string[] {
    const associations: Record<string, string[]> = {
      'fire': ['heat', 'light', 'destruction', 'passion'],
      'water': ['flow', 'calm', 'life', 'mystery'],
      'forest': ['green', 'wild', 'ancient', 'hidden'],
      'night': ['dark', 'quiet', 'mysterious', 'peaceful'],
      'love': ['heart', 'connection', 'warmth', 'joy']
    };

    return associations[startWord.toLowerCase()] || ['mystery', 'adventure', 'discovery'];
  }

  /**
   * Generate writing constraints
   */
  public generateConstraints(count: number = 1): string[] {
    const constraints = [
      'Write without using the letter "e"',
      'Every sentence must be exactly 7 words',
      'Write entirely in questions',
      'Use only dialogue - no narration',
      'Write in second person perspective'
    ];

    const shuffled = constraints.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Start a timed writing session
   */
  public startTimedSession(duration: number, type?: string): {
    id: string;
    duration: number;
    type: string;
    sessionId: string;
    prompt: string;
    startTime: Date;
    endTime: Date;
  } {
    const sessionId = `session-${Date.now()}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 1000); // Convert seconds to milliseconds
    
    return {
      id: sessionId, // Added for test compatibility
      duration, // Added for test compatibility
      type: type || 'freewriting', // Added for test compatibility
      sessionId,
      prompt: this.generateRandomPrompt(),
      startTime,
      endTime
    };
  }

  private initializeContent(): void {
    this.exercises = [
      {
        id: 'exercise-1',
        name: 'Character Speed Dating',
        title: 'Character Speed Dating', // Added for test compatibility
        type: 'character',
        description: 'Quickly develop character personalities',
        instructions: [
          'Set timer for 2 minutes',
          'Create character with name, age, defining trait',
          'Write their biggest fear and greatest desire',
          'Repeat 5 times'
        ],
        duration: 10,
        difficulty: 'easy'
      },
      {
        id: 'exercise-2',
        name: 'Setting Sensory Immersion',
        title: 'Setting Sensory Immersion', // Added for test compatibility
        type: 'setting',
        description: 'Create vivid settings using all senses',
        instructions: [
          'Choose a location',
          'List what you see, hear, smell, taste, touch',
          'Write paragraph with all sensory details'
        ],
        duration: 15,
        difficulty: 'medium'
      },
      {
        id: 'exercise-3',
        name: 'Plot Twist Generator',
        title: 'Plot Twist Generator', // Added for test compatibility
        type: 'plot',
        description: 'Practice creating unexpected developments',
        instructions: [
          'Start with simple scenario',
          'Write obvious continuation',
          'Brainstorm 5 unexpected twists',
          'Develop the most interesting one'
        ],
        duration: 20,
        difficulty: 'hard'
      }
    ];

    this.inspirations = [
      {
        id: 'quote-1',
        type: 'quote',
        title: 'Hemingway on First Drafts', // Added for test compatibility
        content: 'The first draft of anything is shit.',
        category: 'motivation', // Added for test compatibility
        source: 'Ernest Hemingway',
        mood: 'uplifting'
      },
      {
        id: 'scenario-1',
        type: 'scenario',
        title: 'The Mysterious Door', // Added for test compatibility
        content: 'A child finds a door that wasn\'t there yesterday.',
        category: 'fantasy', // Added for test compatibility
        mood: 'mysterious'
      },
      {
        id: 'question-1',
        type: 'question',
        title: 'Alternative Physics', // Added for test compatibility
        content: 'What if gravity worked differently in your world?',
        category: 'worldbuilding', // Added for test compatibility
        mood: 'energetic'
      }
    ];
  }
}

// Export singleton instance
export const creativityBooster = new CreativityBoosterService();
