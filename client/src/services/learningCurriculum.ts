/**
 * Learning Curriculum Service
 * Provides structured learning paths for writing improvement
 */

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  objectives: string[];
  exercises: Exercise[];
  prerequisites?: string[];
}

export interface Exercise {
  id: string;
  type: 'reading' | 'writing' | 'analysis' | 'practice';
  title: string;
  instructions: string;
  timeEstimate: number;
  materials?: string[];
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  modules: string[]; // Module IDs
  estimatedDuration: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface Progress {
  userId: string;
  pathId: string;
  completedModules: string[];
  currentModule: string;
  overallProgress: number; // 0-100
  timeSpent: number;
  achievements: string[];
}

export class LearningCurriculumService {
  private modules: Map<string, LearningModule> = new Map();
  private paths: Map<string, LearningPath> = new Map();
  private userProgress: Map<string, Progress[]> = new Map();

  constructor() {
    this.initializeDefaultCurriculum();
  }

  /**
   * Get available learning paths
   */
  public getLearningPaths(level?: 'beginner' | 'intermediate' | 'advanced'): LearningPath[] {
    let paths = Array.from(this.paths.values());
    
    if (level) {
      paths = paths.filter(path => path.skillLevel === level);
    }
    
    return paths;
  }

  /**
   * Get all learning modules
   */
  public getLearningModules(level?: 'beginner' | 'intermediate' | 'advanced'): LearningModule[] {
    let modules = Array.from(this.modules.values());
    
    if (level) {
      modules = modules.filter(module => module.level === level);
    }
    
    return modules;
  }

  /**
   * Get a specific module by ID
   */
  public getModule(moduleId: string): LearningModule | null {
    return this.modules.get(moduleId) || null;
  }

  /**
   * Get modules for a learning path
   */
  public getPathModules(pathId: string): LearningModule[] {
    const path = this.paths.get(pathId);
    if (!path) return [];
    
    return path.modules.map(moduleId => this.modules.get(moduleId)!).filter(Boolean);
  }

  /**
   * Start a learning path
   */
  public startLearningPath(userId: string, pathId: string): Progress {
    const path = this.paths.get(pathId);
    if (!path) throw new Error('Learning path not found');
    
    const progress: Progress = {
      userId,
      pathId,
      completedModules: [],
      currentModule: path.modules[0] || '',
      overallProgress: 0,
      timeSpent: 0,
      achievements: []
    };
    
    const userProgresses = this.userProgress.get(userId) || [];
    userProgresses.push(progress);
    this.userProgress.set(userId, userProgresses);
    
    return progress;
  }

  /**
   * Complete a module
   */
  public completeModule(userId: string, pathId: string, moduleId: string): Progress | null {
    const userProgresses = this.userProgress.get(userId) || [];
    const progressIndex = userProgresses.findIndex(p => p.pathId === pathId);
    
    if (progressIndex === -1) return null;
    
    const progress = userProgresses[progressIndex];
    if (!progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
    }
    
    // Update current module
    const path = this.paths.get(pathId);
    if (path) {
      const nextModuleIndex = path.modules.indexOf(moduleId) + 1;
      if (nextModuleIndex < path.modules.length) {
        progress.currentModule = path.modules[nextModuleIndex];
      }
      
      // Update progress percentage
      progress.overallProgress = Math.round((progress.completedModules.length / path.modules.length) * 100);
      
      // Check for achievements
      if (progress.overallProgress === 100) {
        progress.achievements.push(`Completed ${path.name}`);
      }
    }
    
    userProgresses[progressIndex] = progress;
    this.userProgress.set(userId, userProgresses);
    
    return progress;
  }

  /**
   * Get user progress
   */
  public getUserProgress(userId: string): Progress[] {
    return this.userProgress.get(userId) || [];
  }

  /**
   * Get recommended next steps
   */
  public getRecommendedNextSteps(userId: string): {
    continueCurrentPath?: string;
    suggestedNewPaths: string[];
    skillGaps: string[];
  } {
    const progresses = this.getUserProgress(userId);
    const activePath = progresses.find(p => p.overallProgress < 100);
    
    return {
      continueCurrentPath: activePath?.pathId,
      suggestedNewPaths: ['creative-writing-fundamentals', 'advanced-storytelling'],
      skillGaps: ['Character development', 'Dialogue writing', 'Plot structure']
    };
  }

  /**
   * Get personalized curriculum
   */
  public getPersonalizedCurriculum(
    userId: string, 
    interests: string[], 
    currentLevel: 'beginner' | 'intermediate' | 'advanced'
  ): LearningPath[] {
    const allPaths = this.getLearningPaths();
    
    // Filter by level and interests
    return allPaths.filter(path => {
      const levelMatch = path.skillLevel === currentLevel || 
                        (currentLevel === 'intermediate' && path.skillLevel === 'beginner');
      const interestMatch = interests.some(interest => 
        path.name.toLowerCase().includes(interest.toLowerCase()) ||
        path.description.toLowerCase().includes(interest.toLowerCase())
      );
      
      return levelMatch && (interests.length === 0 || interestMatch);
    }).slice(0, 5);
  }

  /**
   * Start a specific module
   */
  public startModule(userId: string, moduleId: string): {
    module: LearningModule | null;
    progress: { started: boolean; startTime: string };
    nextSteps: string[];
  } {
    const module = this.modules.get(moduleId);
    if (!module) {
      return {
        module: null,
        progress: { started: false, startTime: '' },
        nextSteps: ['Module not found']
      };
    }

    return {
      module,
      progress: { started: true, startTime: new Date().toISOString() },
      nextSteps: [
        'Complete the first exercise',
        'Track your progress',
        'Take notes on key concepts'
      ]
    };
  }

  /**
   * Perform skill assessment
   */
  public performSkillAssessment(skills: string[]): {
    assessment: Record<string, 'beginner' | 'intermediate' | 'advanced'>;
    recommendations: LearningPath[];
    focusAreas: string[];
  } {
    const assessment: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {};
    
    // Ensure skills is an array
    const skillsArray = Array.isArray(skills) ? skills : [];
    
    // Simplified assessment based on skill list
    skillsArray.forEach(skill => {
      assessment[skill] = 'beginner'; // Default to beginner
    });
    
    const recommendations = this.getLearningPaths('beginner');
    const focusAreas = skills.slice(0, 3); // Focus on first 3 skills
    
    return {
      assessment,
      recommendations: recommendations.slice(0, 3),
      focusAreas
    };
  }

  // Private helper methods
  private initializeDefaultCurriculum(): void {
    // Initialize modules
    const modules: LearningModule[] = [
      {
        id: 'writing-basics',
        title: 'Writing Fundamentals',
        description: 'Learn the core principles of effective writing',
        level: 'beginner',
        duration: 45,
        objectives: [
          'Understand sentence structure',
          'Learn paragraph organization',
          'Master basic grammar rules'
        ],
        exercises: [
          {
            id: 'ex-1',
            type: 'writing',
            title: 'Write a descriptive paragraph',
            instructions: 'Describe your favorite place using all five senses',
            timeEstimate: 15
          },
          {
            id: 'ex-2',
            type: 'analysis',
            title: 'Analyze sentence structure',
            instructions: 'Identify subjects, verbs, and objects in given sentences',
            timeEstimate: 10
          }
        ]
      },
      {
        id: 'character-development',
        title: 'Character Development',
        description: 'Create compelling, three-dimensional characters',
        level: 'intermediate',
        duration: 60,
        objectives: [
          'Develop character backstories',
          'Create character arcs',
          'Write authentic dialogue'
        ],
        exercises: [
          {
            id: 'ex-3',
            type: 'writing',
            title: 'Character profile creation',
            instructions: 'Create a detailed profile for a fictional character',
            timeEstimate: 30
          }
        ],
        prerequisites: ['writing-basics']
      },
      {
        id: 'advanced-storytelling',
        title: 'Advanced Storytelling Techniques',
        description: 'Master complex narrative structures and techniques',
        level: 'advanced',
        duration: 90,
        objectives: [
          'Understand non-linear narratives',
          'Master multiple POV techniques',
          'Create compelling plot twists'
        ],
        exercises: [
          {
            id: 'ex-4',
            type: 'writing',
            title: 'Non-linear narrative',
            instructions: 'Write a story that jumps between different time periods',
            timeEstimate: 45
          }
        ],
        prerequisites: ['character-development']
      }
    ];

    modules.forEach(module => {
      this.modules.set(module.id, module);
    });

    // Initialize learning paths
    const paths: LearningPath[] = [
      {
        id: 'creative-writing-fundamentals',
        name: 'Creative Writing Fundamentals',
        description: 'A comprehensive introduction to creative writing',
        modules: ['writing-basics', 'character-development'],
        estimatedDuration: 105,
        skillLevel: 'beginner'
      },
      {
        id: 'master-storyteller',
        name: 'Master Storyteller Path',
        description: 'Advanced techniques for experienced writers',
        modules: ['character-development', 'advanced-storytelling'],
        estimatedDuration: 150,
        skillLevel: 'advanced'
      }
    ];

    paths.forEach(path => {
      this.paths.set(path.id, path);
    });
  }
}

// Export singleton instance
export const learningCurriculum = new LearningCurriculumService();
