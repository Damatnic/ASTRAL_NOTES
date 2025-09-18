import { EventEmitter } from 'events';

export interface LearningCurriculum {
  id: string;
  userId: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'master';
  currentModule: LearningModule | null;
  modules: LearningModule[];
  progress: CurriculumProgress;
  personalizedPath: LearningPath;
  schedule: LearningSchedule;
  achievements: LearningAchievement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: ModuleCategory;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedHours: number;
  prerequisites: string[];
  skills: SkillObjective[];
  lessons: Lesson[];
  exercises: Exercise[];
  resources: Resource[];
  assessment?: Assessment;
  completionCriteria: CompletionCriteria;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

export type ModuleCategory = 
  | 'fundamentals' | 'grammar' | 'vocabulary' | 'structure'
  | 'character' | 'dialogue' | 'description' | 'plot'
  | 'style' | 'voice' | 'genre' | 'editing'
  | 'publishing' | 'marketing' | 'advanced';

export interface SkillObjective {
  id: string;
  name: string;
  description: string;
  targetLevel: number; // 0-100
  currentLevel: number;
  importance: 'critical' | 'important' | 'helpful' | 'optional';
  measurable: boolean;
  metrics?: string[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: 'video' | 'text' | 'interactive' | 'practice' | 'example';
  content: string;
  duration: number; // minutes
  objectives: string[];
  keyTakeaways: string[];
  examples?: Example[];
  quiz?: Quiz;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'writing' | 'analysis' | 'revision' | 'creativity' | 'research';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // minutes
  instructions: string[];
  prompts?: string[];
  constraints?: string[];
  rubric: EvaluationRubric;
  submissions: ExerciseSubmission[];
  bestScore?: number;
}

export interface ExerciseSubmission {
  id: string;
  exerciseId: string;
  content: string;
  submittedAt: Date;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  aiEvaluation?: AIEvaluation;
}

export interface AIEvaluation {
  overallScore: number;
  criteria: CriterionScore[];
  suggestions: string[];
  examples: string[];
  nextSteps: string[];
}

export interface CriterionScore {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface EvaluationRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
  passingScore: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
  examples?: string[];
}

export interface Assessment {
  id: string;
  moduleId: string;
  type: 'quiz' | 'project' | 'portfolio' | 'peer-review';
  title: string;
  description: string;
  timeLimit?: number;
  questions?: Question[];
  project?: ProjectRequirements;
  attempts: AssessmentAttempt[];
  passingScore: number;
  bestScore?: number;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface Quiz {
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  bestScore?: number;
}

export interface ProjectRequirements {
  description: string;
  deliverables: string[];
  criteria: string[];
  examples?: string[];
  resources?: Resource[];
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  startedAt: Date;
  completedAt?: Date;
  answers: Answer[];
  score?: number;
  feedback?: string;
  passed?: boolean;
}

export interface Answer {
  questionId: string;
  answer: string | string[];
  correct?: boolean;
  feedback?: string;
}

export interface Resource {
  id: string;
  type: 'book' | 'article' | 'video' | 'podcast' | 'tool' | 'community';
  title: string;
  author?: string;
  url?: string;
  description: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  tags: string[];
  rating?: number;
  required: boolean;
}

export interface Example {
  id: string;
  title: string;
  content: string;
  analysis?: string;
  techniques?: string[];
  genre?: string;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  goal: string;
  modules: string[]; // module IDs in order
  estimatedDuration: number; // total hours
  adaptations: PathAdaptation[];
  milestones: Milestone[];
}

export interface PathAdaptation {
  date: Date;
  reason: string;
  changes: string[];
  impact: 'minor' | 'moderate' | 'major';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  requiredModules: string[];
  reward?: string;
  achieved: boolean;
  achievedAt?: Date;
}

export interface LearningSchedule {
  dailyGoal: number; // minutes
  preferredTimes: TimeSlot[];
  reminders: boolean;
  flexibility: 'strict' | 'moderate' | 'flexible';
  vacationDates: Date[];
  studyStreak: number;
  lastStudyDate?: Date;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string;
  focus: 'theory' | 'practice' | 'review' | 'any';
}

export interface CurriculumProgress {
  overall: number; // 0-100
  modulesCompleted: number;
  totalModules: number;
  hoursCompleted: number;
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  skillLevels: Map<string, number>;
  strengths: string[];
  weaknesses: string[];
}

export interface LearningAchievement {
  id: string;
  type: 'module' | 'skill' | 'streak' | 'milestone' | 'special';
  title: string;
  description: string;
  icon?: string;
  unlockedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface CompletionCriteria {
  minScore?: number;
  requiredLessons: string[];
  requiredExercises: string[];
  timeRequirement?: number;
  customCriteria?: string[];
}

export interface AdaptiveSettings {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  pacePreference: 'slow' | 'moderate' | 'fast' | 'intensive';
  focusAreas: string[];
  avoidAreas: string[];
  adaptationLevel: 'low' | 'medium' | 'high';
}

class LearningCurriculumService extends EventEmitter {
  private curriculum: LearningCurriculum | null = null;
  private modules: Map<string, LearningModule> = new Map();
  private submissions: Map<string, ExerciseSubmission[]> = new Map();
  private resources: Map<string, Resource> = new Map();
  private adaptiveSettings: AdaptiveSettings = {
    learningStyle: 'mixed',
    pacePreference: 'moderate',
    focusAreas: [],
    avoidAreas: [],
    adaptationLevel: 'medium'
  };

  constructor() {
    super();
    this.initializeModules();
    this.loadUserProgress();
  }

  private initializeModules(): void {
    const fundamentalModules: LearningModule[] = [
      {
        id: 'mod-fundamentals-1',
        title: 'Writing Fundamentals',
        description: 'Master the core principles of effective writing',
        category: 'fundamentals',
        difficulty: 'easy',
        estimatedHours: 10,
        prerequisites: [],
        skills: [
          {
            id: 'skill-grammar',
            name: 'Grammar Mastery',
            description: 'Understanding and applying grammar rules',
            targetLevel: 80,
            currentLevel: 0,
            importance: 'critical',
            measurable: true,
            metrics: ['Error rate', 'Variety of structures']
          },
          {
            id: 'skill-clarity',
            name: 'Clear Communication',
            description: 'Writing with clarity and precision',
            targetLevel: 85,
            currentLevel: 0,
            importance: 'critical',
            measurable: true
          }
        ],
        lessons: this.generateLessons('fundamentals'),
        exercises: this.generateExercises('fundamentals'),
        resources: this.generateResources('fundamentals'),
        completionCriteria: {
          minScore: 70,
          requiredLessons: ['lesson-1', 'lesson-2', 'lesson-3'],
          requiredExercises: ['exercise-1', 'exercise-2']
        },
        status: 'available'
      },
      {
        id: 'mod-character-1',
        title: 'Character Development Mastery',
        description: 'Create memorable, three-dimensional characters',
        category: 'character',
        difficulty: 'medium',
        estimatedHours: 15,
        prerequisites: ['mod-fundamentals-1'],
        skills: [
          {
            id: 'skill-characterization',
            name: 'Deep Characterization',
            description: 'Creating complex, believable characters',
            targetLevel: 75,
            currentLevel: 0,
            importance: 'important',
            measurable: true
          }
        ],
        lessons: this.generateLessons('character'),
        exercises: this.generateExercises('character'),
        resources: this.generateResources('character'),
        completionCriteria: {
          minScore: 75,
          requiredLessons: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'],
          requiredExercises: ['exercise-1', 'exercise-2', 'exercise-3']
        },
        status: 'locked'
      },
      {
        id: 'mod-style-1',
        title: 'Finding Your Voice',
        description: 'Develop a unique and compelling writing style',
        category: 'style',
        difficulty: 'hard',
        estimatedHours: 20,
        prerequisites: ['mod-fundamentals-1', 'mod-character-1'],
        skills: [
          {
            id: 'skill-voice',
            name: 'Distinctive Voice',
            description: 'Developing a unique writing voice',
            targetLevel: 70,
            currentLevel: 0,
            importance: 'important',
            measurable: false
          }
        ],
        lessons: this.generateLessons('style'),
        exercises: this.generateExercises('style'),
        resources: this.generateResources('style'),
        completionCriteria: {
          minScore: 70,
          requiredLessons: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5'],
          requiredExercises: ['exercise-1', 'exercise-2', 'exercise-3', 'exercise-4']
        },
        status: 'locked'
      }
    ];

    fundamentalModules.forEach(module => {
      this.modules.set(module.id, module);
    });
  }

  private generateLessons(category: string): Lesson[] {
    const lessonTemplates: Record<string, Lesson[]> = {
      fundamentals: [
        {
          id: 'lesson-1',
          moduleId: 'mod-fundamentals-1',
          title: 'The Power of Clear Sentences',
          type: 'text',
          content: 'Understanding sentence structure and clarity...',
          duration: 30,
          objectives: ['Identify sentence types', 'Write clear sentences', 'Avoid common errors'],
          keyTakeaways: ['Clarity is key', 'Vary sentence structure', 'Edit ruthlessly'],
          completed: false
        },
        {
          id: 'lesson-2',
          moduleId: 'mod-fundamentals-1',
          title: 'Paragraph Construction',
          type: 'interactive',
          content: 'Building effective paragraphs...',
          duration: 45,
          objectives: ['Structure paragraphs', 'Use topic sentences', 'Create flow'],
          keyTakeaways: ['One idea per paragraph', 'Strong transitions', 'Coherent flow'],
          completed: false
        },
        {
          id: 'lesson-3',
          moduleId: 'mod-fundamentals-1',
          title: 'Grammar Essentials',
          type: 'video',
          content: 'Master essential grammar rules...',
          duration: 60,
          objectives: ['Apply grammar rules', 'Identify errors', 'Write correctly'],
          keyTakeaways: ['Grammar enhances clarity', 'Rules have purposes', 'Practice makes perfect'],
          quiz: {
            questions: [
              {
                id: 'q1',
                type: 'multiple-choice',
                question: 'Which sentence is grammatically correct?',
                options: ['Me and John went', 'John and I went', 'John and me went'],
                correctAnswer: 'John and I went',
                points: 10
              }
            ],
            passingScore: 70,
            attempts: 0
          },
          completed: false
        }
      ],
      character: [
        {
          id: 'lesson-1',
          moduleId: 'mod-character-1',
          title: 'Character Psychology',
          type: 'text',
          content: 'Understanding character motivation and psychology...',
          duration: 40,
          objectives: ['Understand motivation', 'Create backstory', 'Build personality'],
          keyTakeaways: ['Characters need depth', 'Motivation drives action', 'Flaws create interest'],
          completed: false
        },
        {
          id: 'lesson-2',
          moduleId: 'mod-character-1',
          title: 'Dialogue That Reveals',
          type: 'interactive',
          content: 'Writing dialogue that reveals character...',
          duration: 50,
          objectives: ['Write natural dialogue', 'Show personality', 'Advance plot'],
          keyTakeaways: ['Dialogue reveals character', 'Each voice unique', 'Subtext matters'],
          completed: false
        }
      ],
      style: [
        {
          id: 'lesson-1',
          moduleId: 'mod-style-1',
          title: 'Elements of Style',
          type: 'text',
          content: 'Exploring the elements that create style...',
          duration: 35,
          objectives: ['Identify style elements', 'Analyze voice', 'Develop awareness'],
          keyTakeaways: ['Style is choice', 'Consistency matters', 'Read widely'],
          completed: false
        }
      ]
    };

    return lessonTemplates[category] || [];
  }

  private generateExercises(category: string): Exercise[] {
    const exerciseTemplates: Record<string, Exercise[]> = {
      fundamentals: [
        {
          id: 'exercise-1',
          title: 'Sentence Variety Practice',
          description: 'Practice writing sentences with different structures',
          type: 'writing',
          difficulty: 'easy',
          timeLimit: 30,
          instructions: [
            'Write 5 simple sentences',
            'Convert them to compound sentences',
            'Create complex variations'
          ],
          rubric: {
            criteria: [
              {
                name: 'Variety',
                description: 'Demonstrates sentence variety',
                weight: 0.5,
                levels: [
                  { score: 100, description: 'Excellent variety' },
                  { score: 70, description: 'Good variety' },
                  { score: 40, description: 'Limited variety' }
                ]
              },
              {
                name: 'Clarity',
                description: 'Maintains clarity',
                weight: 0.5,
                levels: [
                  { score: 100, description: 'Crystal clear' },
                  { score: 70, description: 'Mostly clear' },
                  { score: 40, description: 'Often unclear' }
                ]
              }
            ],
            totalPoints: 100,
            passingScore: 70
          },
          submissions: []
        },
        {
          id: 'exercise-2',
          title: 'Paragraph Flow',
          description: 'Create paragraphs with smooth transitions',
          type: 'writing',
          difficulty: 'medium',
          timeLimit: 45,
          instructions: [
            'Write 3 connected paragraphs',
            'Use transition words',
            'Maintain topic focus'
          ],
          prompts: [
            'Describe a memorable journey',
            'Explain a complex concept',
            'Argue for or against something'
          ],
          rubric: {
            criteria: [
              {
                name: 'Transitions',
                description: 'Smooth transitions between ideas',
                weight: 0.4,
                levels: [
                  { score: 100, description: 'Seamless flow' },
                  { score: 70, description: 'Good connections' },
                  { score: 40, description: 'Choppy transitions' }
                ]
              },
              {
                name: 'Focus',
                description: 'Maintains topic focus',
                weight: 0.3,
                levels: [
                  { score: 100, description: 'Laser focused' },
                  { score: 70, description: 'Generally focused' },
                  { score: 40, description: 'Often drifts' }
                ]
              },
              {
                name: 'Structure',
                description: 'Paragraph structure',
                weight: 0.3,
                levels: [
                  { score: 100, description: 'Perfect structure' },
                  { score: 70, description: 'Good structure' },
                  { score: 40, description: 'Weak structure' }
                ]
              }
            ],
            totalPoints: 100,
            passingScore: 70
          },
          submissions: []
        }
      ],
      character: [
        {
          id: 'exercise-1',
          title: 'Character Profile Creation',
          description: 'Develop a complete character profile',
          type: 'creativity',
          difficulty: 'medium',
          timeLimit: 60,
          instructions: [
            'Create a detailed character profile',
            'Include backstory and motivation',
            'Define personality traits and flaws'
          ],
          rubric: {
            criteria: [
              {
                name: 'Depth',
                description: 'Character depth and complexity',
                weight: 0.5,
                levels: [
                  { score: 100, description: 'Three-dimensional' },
                  { score: 70, description: 'Well-developed' },
                  { score: 40, description: 'Surface-level' }
                ]
              },
              {
                name: 'Consistency',
                description: 'Internal consistency',
                weight: 0.5,
                levels: [
                  { score: 100, description: 'Perfectly consistent' },
                  { score: 70, description: 'Mostly consistent' },
                  { score: 40, description: 'Contradictory' }
                ]
              }
            ],
            totalPoints: 100,
            passingScore: 75
          },
          submissions: []
        }
      ],
      style: [
        {
          id: 'exercise-1',
          title: 'Style Imitation',
          description: 'Imitate different writing styles',
          type: 'writing',
          difficulty: 'hard',
          instructions: [
            'Choose 3 different authors',
            'Write a paragraph in each style',
            'Analyze the differences'
          ],
          rubric: {
            criteria: [
              {
                name: 'Accuracy',
                description: 'Accurately captures style',
                weight: 0.6,
                levels: [
                  { score: 100, description: 'Perfect mimicry' },
                  { score: 70, description: 'Good approximation' },
                  { score: 40, description: 'Vague resemblance' }
                ]
              },
              {
                name: 'Analysis',
                description: 'Quality of analysis',
                weight: 0.4,
                levels: [
                  { score: 100, description: 'Insightful analysis' },
                  { score: 70, description: 'Good observations' },
                  { score: 40, description: 'Surface analysis' }
                ]
              }
            ],
            totalPoints: 100,
            passingScore: 70
          },
          submissions: []
        }
      ]
    };

    return exerciseTemplates[category] || [];
  }

  private generateResources(category: string): Resource[] {
    const resourceTemplates: Record<string, Resource[]> = {
      fundamentals: [
        {
          id: 'res-1',
          type: 'book',
          title: 'The Elements of Style',
          author: 'Strunk & White',
          description: 'Classic guide to writing clearly',
          difficulty: 'beginner',
          tags: ['grammar', 'style', 'classic'],
          required: true
        },
        {
          id: 'res-2',
          type: 'article',
          title: 'Common Grammar Mistakes',
          url: 'https://example.com/grammar',
          description: 'Avoid these common errors',
          difficulty: 'beginner',
          duration: 15,
          tags: ['grammar', 'mistakes', 'tips'],
          required: false
        }
      ],
      character: [
        {
          id: 'res-3',
          type: 'video',
          title: 'Creating Memorable Characters',
          url: 'https://example.com/characters',
          description: 'Video guide to character creation',
          difficulty: 'intermediate',
          duration: 45,
          tags: ['character', 'video', 'tutorial'],
          required: true
        }
      ],
      style: [
        {
          id: 'res-4',
          type: 'book',
          title: 'Finding Your Voice',
          author: 'Various Authors',
          description: 'Anthology of unique writing voices',
          difficulty: 'advanced',
          tags: ['style', 'voice', 'examples'],
          required: false
        }
      ]
    };

    return resourceTemplates[category] || [];
  }

  private loadUserProgress(): void {
    const savedCurriculum = localStorage.getItem('learningCurriculum');
    if (savedCurriculum) {
      this.curriculum = JSON.parse(savedCurriculum);
    }

    const savedSubmissions = localStorage.getItem('exerciseSubmissions');
    if (savedSubmissions) {
      const parsed = JSON.parse(savedSubmissions);
      Object.entries(parsed).forEach(([exerciseId, submissions]) => {
        this.submissions.set(exerciseId, submissions as ExerciseSubmission[]);
      });
    }

    const savedSettings = localStorage.getItem('adaptiveSettings');
    if (savedSettings) {
      this.adaptiveSettings = JSON.parse(savedSettings);
    }
  }

  private saveData(): void {
    if (this.curriculum) {
      localStorage.setItem('learningCurriculum', JSON.stringify(this.curriculum));
    }
    
    localStorage.setItem('exerciseSubmissions', 
      JSON.stringify(Object.fromEntries(this.submissions))
    );
    
    localStorage.setItem('adaptiveSettings', JSON.stringify(this.adaptiveSettings));
  }

  public generatePersonalizedCurriculum(
    skillAssessment: Map<string, number>,
    goals: string[],
    timeCommitment: number, // hours per week
    preferredStyle: AdaptiveSettings['learningStyle']
  ): LearningCurriculum {
    // Assess current level
    const averageSkill = Array.from(skillAssessment.values()).reduce((a, b) => a + b, 0) / skillAssessment.size;
    const level = this.determineLevel(averageSkill);

    // Select appropriate modules
    const selectedModules = this.selectModules(skillAssessment, goals, level);
    
    // Create personalized path
    const path = this.createLearningPath(selectedModules, goals, timeCommitment);

    // Setup schedule
    const schedule = this.createSchedule(timeCommitment);

    // Initialize curriculum
    this.curriculum = {
      id: `curriculum-${Date.now()}`,
      userId: 'current-user',
      level,
      currentModule: selectedModules[0] || null,
      modules: selectedModules,
      progress: {
        overall: 0,
        modulesCompleted: 0,
        totalModules: selectedModules.length,
        hoursCompleted: 0,
        totalHours: selectedModules.reduce((sum, m) => sum + m.estimatedHours, 0),
        currentStreak: 0,
        longestStreak: 0,
        skillLevels: skillAssessment,
        strengths: this.identifyStrengths(skillAssessment),
        weaknesses: this.identifyWeaknesses(skillAssessment)
      },
      personalizedPath: path,
      schedule,
      achievements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update adaptive settings
    this.adaptiveSettings.learningStyle = preferredStyle;
    this.adaptiveSettings.focusAreas = goals;

    this.saveData();
    this.emit('curriculumGenerated', this.curriculum);

    return this.curriculum;
  }

  private determineLevel(averageSkill: number): LearningCurriculum['level'] {
    if (averageSkill < 25) return 'beginner';
    if (averageSkill < 50) return 'intermediate';
    if (averageSkill < 75) return 'advanced';
    return 'master';
  }

  private selectModules(
    skills: Map<string, number>,
    goals: string[],
    level: LearningCurriculum['level']
  ): LearningModule[] {
    const selected: LearningModule[] = [];
    const allModules = Array.from(this.modules.values());

    // First, add modules that address weaknesses
    skills.forEach((level, skill) => {
      if (level < 50) {
        const relevantModules = allModules.filter(m => 
          m.skills.some(s => s.name.toLowerCase().includes(skill.toLowerCase()))
        );
        selected.push(...relevantModules);
      }
    });

    // Then add modules for goals
    goals.forEach(goal => {
      const goalModules = allModules.filter(m => 
        m.title.toLowerCase().includes(goal.toLowerCase()) ||
        m.description.toLowerCase().includes(goal.toLowerCase())
      );
      selected.push(...goalModules);
    });

    // Remove duplicates and sort by difficulty
    const unique = Array.from(new Set(selected.map(m => m.id)))
      .map(id => allModules.find(m => m.id === id)!)
      .sort((a, b) => {
        const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });

    // Respect prerequisites
    return this.orderByPrerequisites(unique);
  }

  private orderByPrerequisites(modules: LearningModule[]): LearningModule[] {
    const ordered: LearningModule[] = [];
    const remaining = [...modules];

    while (remaining.length > 0) {
      const available = remaining.find(m => 
        m.prerequisites.every(p => ordered.some(o => o.id === p))
      );

      if (available) {
        ordered.push(available);
        remaining.splice(remaining.indexOf(available), 1);
      } else {
        // Add module without met prerequisites (shouldn't happen with proper data)
        ordered.push(remaining.shift()!);
      }
    }

    return ordered;
  }

  private createLearningPath(
    modules: LearningModule[],
    goals: string[],
    timeCommitment: number
  ): LearningPath {
    const totalHours = modules.reduce((sum, m) => sum + m.estimatedHours, 0);
    const weeksToComplete = Math.ceil(totalHours / timeCommitment);

    return {
      id: `path-${Date.now()}`,
      name: 'Personalized Writing Journey',
      description: `Custom path focusing on: ${goals.join(', ')}`,
      goal: goals[0],
      modules: modules.map(m => m.id),
      estimatedDuration: totalHours,
      adaptations: [],
      milestones: this.generateMilestones(modules)
    };
  }

  private generateMilestones(modules: LearningModule[]): Milestone[] {
    const milestones: Milestone[] = [];
    const quarterSize = Math.floor(modules.length / 4);

    if (quarterSize > 0) {
      milestones.push({
        id: 'milestone-1',
        title: 'Strong Start',
        description: 'Complete your first quarter of modules',
        requiredModules: modules.slice(0, quarterSize).map(m => m.id),
        reward: 'Beginner Badge',
        achieved: false
      });

      milestones.push({
        id: 'milestone-2',
        title: 'Halfway There',
        description: 'Reach the midpoint of your journey',
        requiredModules: modules.slice(0, Math.floor(modules.length / 2)).map(m => m.id),
        reward: 'Persistence Award',
        achieved: false
      });

      milestones.push({
        id: 'milestone-3',
        title: 'Final Stretch',
        description: 'Complete three-quarters of your curriculum',
        requiredModules: modules.slice(0, quarterSize * 3).map(m => m.id),
        reward: 'Advanced Certificate',
        achieved: false
      });
    }

    milestones.push({
      id: 'milestone-4',
      title: 'Curriculum Complete',
      description: 'Finish all modules in your personalized path',
      requiredModules: modules.map(m => m.id),
      reward: 'Master Writer Badge',
      achieved: false
    });

    return milestones;
  }

  private createSchedule(hoursPerWeek: number): LearningSchedule {
    const minutesPerDay = (hoursPerWeek * 60) / 7;
    
    return {
      dailyGoal: Math.round(minutesPerDay),
      preferredTimes: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', focus: 'theory' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '10:00', focus: 'practice' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '10:00', focus: 'review' }
      ],
      reminders: true,
      flexibility: 'moderate',
      vacationDates: [],
      studyStreak: 0
    };
  }

  private identifyStrengths(skills: Map<string, number>): string[] {
    return Array.from(skills.entries())
      .filter(([_, level]) => level >= 70)
      .map(([skill, _]) => skill);
  }

  private identifyWeaknesses(skills: Map<string, number>): string[] {
    return Array.from(skills.entries())
      .filter(([_, level]) => level < 40)
      .map(([skill, _]) => skill);
  }

  public startLesson(lessonId: string): void {
    if (!this.curriculum) return;

    const module = this.curriculum.modules.find(m => 
      m.lessons.some(l => l.id === lessonId)
    );

    if (module) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson && !lesson.completed) {
        this.emit('lessonStarted', { module, lesson });
      }
    }
  }

  public completeLesson(lessonId: string, quiz?: { answers: Answer[]; score: number }): void {
    if (!this.curriculum) return;

    const module = this.curriculum.modules.find(m => 
      m.lessons.some(l => l.id === lessonId)
    );

    if (module) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) {
        lesson.completed = true;
        lesson.completedAt = new Date();

        if (quiz && lesson.quiz) {
          lesson.quiz.bestScore = Math.max(lesson.quiz.bestScore || 0, quiz.score);
          lesson.quiz.attempts++;
        }

        this.updateModuleProgress(module);
        this.checkMilestones();
        this.saveData();

        this.emit('lessonCompleted', { module, lesson, quiz });
      }
    }
  }

  public submitExercise(exerciseId: string, content: string): ExerciseSubmission {
    const submission: ExerciseSubmission = {
      id: `sub-${Date.now()}`,
      exerciseId,
      content,
      submittedAt: new Date()
    };

    // Perform AI evaluation
    submission.aiEvaluation = this.evaluateSubmission(exerciseId, content);
    submission.score = submission.aiEvaluation.overallScore;

    // Store submission
    const submissions = this.submissions.get(exerciseId) || [];
    submissions.push(submission);
    this.submissions.set(exerciseId, submissions);

    // Update exercise best score
    const module = this.curriculum?.modules.find(m => 
      m.exercises.some(e => e.id === exerciseId)
    );

    if (module) {
      const exercise = module.exercises.find(e => e.id === exerciseId);
      if (exercise) {
        exercise.bestScore = Math.max(exercise.bestScore || 0, submission.score || 0);
        this.updateModuleProgress(module);
      }
    }

    this.saveData();
    this.emit('exerciseSubmitted', submission);

    return submission;
  }

  private evaluateSubmission(exerciseId: string, content: string): AIEvaluation {
    // Simplified evaluation logic
    const wordCount = content.split(/\s+/).length;
    const sentences = content.match(/[.!?]+/g)?.length || 0;
    const paragraphs = content.split(/\n\n+/).length;

    const criteria: CriterionScore[] = [
      {
        name: 'Length',
        score: Math.min(100, wordCount / 2),
        maxScore: 100,
        feedback: wordCount < 100 ? 'Try to write more' : 'Good length'
      },
      {
        name: 'Structure',
        score: Math.min(100, (sentences / paragraphs) * 10),
        maxScore: 100,
        feedback: 'Consider your paragraph structure'
      }
    ];

    const overallScore = criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length;

    return {
      overallScore,
      criteria,
      suggestions: [
        'Focus on clarity',
        'Vary your sentence structure',
        'Use specific examples'
      ],
      examples: [
        'Instead of "nice", try "elegant" or "charming"'
      ],
      nextSteps: [
        'Review the lesson on sentence variety',
        'Practice with more complex topics'
      ]
    };
  }

  private updateModuleProgress(module: LearningModule): void {
    if (!this.curriculum) return;

    const completedLessons = module.lessons.filter(l => l.completed).length;
    const completedExercises = module.exercises.filter(e => e.bestScore && e.bestScore >= 70).length;

    const lessonProgress = (completedLessons / module.lessons.length) * 50;
    const exerciseProgress = (completedExercises / module.exercises.length) * 50;

    const moduleProgress = lessonProgress + exerciseProgress;

    if (moduleProgress === 100 && module.status !== 'completed') {
      module.status = 'completed';
      module.completedAt = new Date();
      this.curriculum.progress.modulesCompleted++;
      
      // Unlock next module
      const nextModule = this.curriculum.modules.find(m => 
        m.prerequisites.includes(module.id) && m.status === 'locked'
      );
      
      if (nextModule) {
        nextModule.status = 'available';
        this.curriculum.currentModule = nextModule;
      }
      
      this.awardAchievement({
        id: `ach-${Date.now()}`,
        type: 'module',
        title: `Completed ${module.title}`,
        description: `Mastered all lessons and exercises in ${module.title}`,
        unlockedAt: new Date(),
        rarity: module.difficulty === 'expert' ? 'legendary' : 
                module.difficulty === 'hard' ? 'epic' : 
                module.difficulty === 'medium' ? 'rare' : 'common'
      });
    }

    this.updateOverallProgress();
  }

  private updateOverallProgress(): void {
    if (!this.curriculum) return;

    const totalModules = this.curriculum.modules.length;
    const completedModules = this.curriculum.modules.filter(m => m.status === 'completed').length;
    
    this.curriculum.progress.overall = (completedModules / totalModules) * 100;
    this.curriculum.progress.modulesCompleted = completedModules;
    
    // Update hours
    this.curriculum.progress.hoursCompleted = this.curriculum.modules
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.estimatedHours, 0);
  }

  private checkMilestones(): void {
    if (!this.curriculum) return;

    this.curriculum.personalizedPath.milestones.forEach(milestone => {
      if (!milestone.achieved) {
        const requiredComplete = milestone.requiredModules.every(id => {
          const module = this.curriculum!.modules.find(m => m.id === id);
          return module && module.status === 'completed';
        });

        if (requiredComplete) {
          milestone.achieved = true;
          milestone.achievedAt = new Date();
          
          this.awardAchievement({
            id: `ach-${Date.now()}`,
            type: 'milestone',
            title: milestone.title,
            description: milestone.description,
            unlockedAt: new Date(),
            rarity: 'epic'
          });
        }
      }
    });
  }

  private awardAchievement(achievement: LearningAchievement): void {
    if (this.curriculum) {
      this.curriculum.achievements.push(achievement);
      this.saveData();
      this.emit('achievementUnlocked', achievement);
    }
  }

  public adaptCurriculum(feedback: {
    tooEasy?: boolean;
    tooHard?: boolean;
    notInterested?: string[];
    moreOf?: string[];
  }): void {
    if (!this.curriculum) return;

    const adaptation: PathAdaptation = {
      date: new Date(),
      reason: Object.keys(feedback).join(', '),
      changes: [],
      impact: 'moderate'
    };

    if (feedback.tooEasy) {
      // Skip to harder modules
      const current = this.curriculum.currentModule;
      if (current) {
        const harderModule = this.curriculum.modules.find(m => 
          m.difficulty === 'hard' || m.difficulty === 'expert'
        );
        if (harderModule) {
          this.curriculum.currentModule = harderModule;
          adaptation.changes.push(`Skipped to ${harderModule.title}`);
        }
      }
    }

    if (feedback.tooHard) {
      // Add remedial content
      adaptation.changes.push('Added supplementary exercises');
      adaptation.impact = 'major';
    }

    if (feedback.notInterested && feedback.notInterested.length > 0) {
      // Remove or deprioritize modules
      adaptation.changes.push(`Removed focus on ${feedback.notInterested.join(', ')}`);
    }

    if (feedback.moreOf && feedback.moreOf.length > 0) {
      // Add more related modules
      adaptation.changes.push(`Added more ${feedback.moreOf.join(', ')} content`);
    }

    this.curriculum.personalizedPath.adaptations.push(adaptation);
    this.saveData();
    this.emit('curriculumAdapted', adaptation);
  }

  public getProgress(): CurriculumProgress | null {
    return this.curriculum?.progress || null;
  }

  public getNextLesson(): Lesson | null {
    if (!this.curriculum || !this.curriculum.currentModule) return null;

    const incomplete = this.curriculum.currentModule.lessons.find(l => !l.completed);
    return incomplete || null;
  }

  public getRecommendations(): string[] {
    if (!this.curriculum) return [];

    const recommendations: string[] = [];
    const progress = this.curriculum.progress;

    if (progress.currentStreak === 0) {
      recommendations.push('Start a daily practice routine to build consistency');
    }

    if (progress.weaknesses.length > 0) {
      recommendations.push(`Focus on improving: ${progress.weaknesses.join(', ')}`);
    }

    if (progress.overall < 25) {
      recommendations.push('Complete the fundamentals module first');
    }

    return recommendations;
  }

  public exportProgress(): string {
    return JSON.stringify({
      curriculum: this.curriculum,
      submissions: Array.from(this.submissions.entries()),
      adaptiveSettings: this.adaptiveSettings,
      exportDate: new Date()
    }, null, 2);
  }
}

export const learningCurriculumService = new LearningCurriculumService();
export default learningCurriculumService;