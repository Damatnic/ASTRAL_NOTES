/**
 * Pacing Analysis Service
 * Analyzes story pacing, writing goals, and provides insights
 */

import type { Project, Story, Scene, Chapter } from '@/types/story';

export interface PacingMetrics {
  scenePace: 'slow' | 'steady' | 'fast' | 'variable';
  averageSceneLength: number;
  shortestScene: { id: string; title: string; wordCount: number };
  longestScene: { id: string; title: string; wordCount: number };
  pacingScore: number; // 0-100
  recommendations: string[];
}

export interface TensionArc {
  sceneId: string;
  sceneTitle: string;
  tensionLevel: number; // 0-100
  emotionalIntensity: number; // 0-100
  actionLevel: number; // 0-100
  dialogueRatio: number; // 0-1
}

export interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project' | 'deadline';
  target: number;
  unit: 'words' | 'scenes' | 'chapters' | 'pages';
  startDate: Date;
  endDate?: Date;
  current: number;
  completed: boolean;
  streak?: number;
  bestStreak?: number;
}

export interface WritingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  scenesCompleted: string[];
  goalProgress: Record<string, number>;
  productivity: number; // words per minute
  focusScore: number; // 0-100 based on consistency
}

export interface PacingReport {
  projectId: string;
  timestamp: Date;
  overall: PacingMetrics;
  tensionArcs: TensionArc[];
  actPacing: Array<{
    actNumber: number;
    scenes: number;
    wordCount: number;
    pacing: 'slow' | 'steady' | 'fast';
    tensionPeak: number;
  }>;
  chapterPacing: Array<{
    chapterId: string;
    title: string;
    wordCount: number;
    sceneCount: number;
    averageTension: number;
    pacingNotes: string[];
  }>;
  genreExpectations: {
    matches: string[];
    deviations: string[];
    suggestions: string[];
  };
}

export interface ProductivityAnalytics {
  totalWords: number;
  totalScenes: number;
  averageWordsPerDay: number;
  averageWordsPerSession: number;
  mostProductiveTime: string;
  mostProductiveDay: string;
  writingStreak: number;
  longestStreak: number;
  goalsCompleted: number;
  goalsInProgress: number;
  estimatedCompletionDate?: Date;
}

// Genre-specific pacing expectations
const GENRE_PACING_PROFILES = {
  thriller: {
    expectedTensionPattern: 'escalating',
    averageSceneLength: 1500,
    actionToDialogueRatio: 0.6,
    pacingDescriptors: ['fast', 'relentless', 'intense'],
    chapterEndExpectation: 'cliffhanger'
  },
  romance: {
    expectedTensionPattern: 'wave',
    averageSceneLength: 2000,
    actionToDialogueRatio: 0.3,
    pacingDescriptors: ['steady', 'emotional', 'building'],
    chapterEndExpectation: 'emotional'
  },
  mystery: {
    expectedTensionPattern: 'stepped',
    averageSceneLength: 1800,
    actionToDialogueRatio: 0.4,
    pacingDescriptors: ['methodical', 'revealing', 'suspenseful'],
    chapterEndExpectation: 'revelation'
  },
  fantasy: {
    expectedTensionPattern: 'epic',
    averageSceneLength: 2500,
    actionToDialogueRatio: 0.5,
    pacingDescriptors: ['varied', 'building', 'immersive'],
    chapterEndExpectation: 'progression'
  },
  literary: {
    expectedTensionPattern: 'subtle',
    averageSceneLength: 2200,
    actionToDialogueRatio: 0.2,
    pacingDescriptors: ['contemplative', 'character-driven', 'nuanced'],
    chapterEndExpectation: 'thematic'
  }
};

class PacingAnalysisService {
  private static instance: PacingAnalysisService;
  private writingGoals: Map<string, WritingGoal> = new Map();
  private writingSessions: WritingSession[] = [];
  private currentSession: WritingSession | null = null;

  private constructor() {
    this.loadGoals();
    this.loadSessions();
  }

  public static getInstance(): PacingAnalysisService {
    if (!PacingAnalysisService.instance) {
      PacingAnalysisService.instance = new PacingAnalysisService();
    }
    return PacingAnalysisService.instance;
  }

  /**
   * Analyze story pacing
   */
  public analyzePacing(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    chapters?: Chapter[]
  ): PacingReport {
    const tensionArcs = this.calculateTensionArcs(scenes);
    const overall = this.calculateOverallPacing(scenes, tensionArcs);
    const actPacing = this.analyzeActPacing(stories, scenes, tensionArcs);
    const chapterPacing = this.analyzeChapterPacing(chapters || [], scenes, tensionArcs);
    const genreExpectations = this.compareToGenreExpectations(
      project.metadata?.genre || 'general',
      overall,
      tensionArcs
    );

    return {
      projectId: project.id,
      timestamp: new Date(),
      overall,
      tensionArcs,
      actPacing,
      chapterPacing,
      genreExpectations
    };
  }

  /**
   * Calculate tension arcs for all scenes
   */
  private calculateTensionArcs(scenes: Scene[]): TensionArc[] {
    return scenes.map(scene => {
      const tensionLevel = this.calculateSceneTension(scene);
      const emotionalIntensity = this.calculateEmotionalIntensity(scene);
      const actionLevel = this.calculateActionLevel(scene);
      const dialogueRatio = this.calculateDialogueRatio(scene);

      return {
        sceneId: scene.id,
        sceneTitle: scene.title,
        tensionLevel,
        emotionalIntensity,
        actionLevel,
        dialogueRatio
      };
    });
  }

  /**
   * Calculate scene tension based on content analysis
   */
  private calculateSceneTension(scene: Scene): number {
    let tension = 30; // Base tension

    // Keywords that indicate tension
    const tensionKeywords = {
      high: ['danger', 'attack', 'fight', 'death', 'explosion', 'scream', 'panic', 'terror'],
      medium: ['worry', 'concern', 'problem', 'conflict', 'argument', 'suspicion', 'mystery'],
      low: ['calm', 'peace', 'rest', 'quiet', 'gentle', 'safe', 'comfortable']
    };

    const content = scene.content.toLowerCase();
    
    // Count tension indicators
    tensionKeywords.high.forEach(keyword => {
      if (content.includes(keyword)) tension += 10;
    });
    
    tensionKeywords.medium.forEach(keyword => {
      if (content.includes(keyword)) tension += 5;
    });
    
    tensionKeywords.low.forEach(keyword => {
      if (content.includes(keyword)) tension -= 5;
    });

    // Check for conflict markers
    if (scene.metadata?.conflict) {
      const conflictLevels: Record<string, number> = {
        'physical': 20,
        'verbal': 15,
        'internal': 10,
        'societal': 12
      };
      tension += conflictLevels[scene.metadata.conflict] || 10;
    }

    // Check for mood
    if (scene.metadata?.mood) {
      const moodTension: Record<string, number> = {
        'tense': 15,
        'suspenseful': 12,
        'dramatic': 10,
        'calm': -10,
        'peaceful': -15,
        'romantic': -5
      };
      tension += moodTension[scene.metadata.mood] || 0;
    }

    // Short sentences increase tension
    const sentences = scene.content.split(/[.!?]+/);
    const avgSentenceLength = sentences.reduce((sum, s) => 
      sum + s.split(' ').length, 0
    ) / sentences.length;
    
    if (avgSentenceLength < 10) tension += 10;
    if (avgSentenceLength > 20) tension -= 5;

    // Exclamation marks indicate tension
    const exclamations = (scene.content.match(/!/g) || []).length;
    tension += Math.min(exclamations * 3, 15);

    // Questions create uncertainty
    const questions = (scene.content.match(/\?/g) || []).length;
    tension += Math.min(questions * 2, 10);

    return Math.max(0, Math.min(100, tension));
  }

  /**
   * Calculate emotional intensity
   */
  private calculateEmotionalIntensity(scene: Scene): number {
    let intensity = 20; // Base intensity

    const emotionalKeywords = {
      high: ['love', 'hate', 'passion', 'despair', 'joy', 'grief', 'ecstasy', 'agony', 'tears'],
      medium: ['happy', 'sad', 'angry', 'afraid', 'excited', 'disappointed', 'hopeful'],
      low: ['content', 'neutral', 'indifferent', 'calm', 'steady']
    };

    const content = scene.content.toLowerCase();
    
    emotionalKeywords.high.forEach(keyword => {
      if (content.includes(keyword)) intensity += 12;
    });
    
    emotionalKeywords.medium.forEach(keyword => {
      if (content.includes(keyword)) intensity += 6;
    });
    
    emotionalKeywords.low.forEach(keyword => {
      if (content.includes(keyword)) intensity -= 3;
    });

    // Check for internal monologue (indicated by italics or thought patterns)
    const thoughtPatterns = content.match(/thought|felt|realized|understood|knew/gi) || [];
    intensity += Math.min(thoughtPatterns.length * 3, 15);

    // Emotional punctuation
    const emotionalPunctuation = (content.match(/[!?…—]/g) || []).length;
    intensity += Math.min(emotionalPunctuation * 2, 10);

    return Math.max(0, Math.min(100, intensity));
  }

  /**
   * Calculate action level
   */
  private calculateActionLevel(scene: Scene): number {
    let actionLevel = 10; // Base action

    const actionKeywords = {
      high: ['run', 'jump', 'fight', 'chase', 'escape', 'attack', 'dodge', 'crash', 'explode'],
      medium: ['walk', 'move', 'grab', 'push', 'pull', 'throw', 'catch', 'climb'],
      low: ['sit', 'stand', 'wait', 'rest', 'pause', 'stop', 'think']
    };

    const content = scene.content.toLowerCase();
    
    actionKeywords.high.forEach(keyword => {
      const matches = content.match(new RegExp(keyword, 'gi')) || [];
      actionLevel += matches.length * 8;
    });
    
    actionKeywords.medium.forEach(keyword => {
      const matches = content.match(new RegExp(keyword, 'gi')) || [];
      actionLevel += matches.length * 4;
    });
    
    actionKeywords.low.forEach(keyword => {
      const matches = content.match(new RegExp(keyword, 'gi')) || [];
      actionLevel -= matches.length * 2;
    });

    // Active voice increases action level
    const activeVoicePatterns = content.match(/\b(he|she|they|it|I|we)\s+\w+ed\b/gi) || [];
    actionLevel += Math.min(activeVoicePatterns.length * 2, 20);

    // Scene metadata
    if (scene.metadata?.type === 'action') actionLevel += 30;
    if (scene.metadata?.type === 'dialogue') actionLevel -= 15;

    return Math.max(0, Math.min(100, actionLevel));
  }

  /**
   * Calculate dialogue ratio
   */
  private calculateDialogueRatio(scene: Scene): number {
    const totalWords = scene.content.split(/\s+/).length;
    if (totalWords === 0) return 0;

    // Count dialogue (text within quotes)
    const dialogueMatches = scene.content.match(/"[^"]+"/g) || [];
    const dialogueWords = dialogueMatches.reduce((sum, match) => 
      sum + match.split(/\s+/).length, 0
    );

    return Math.min(1, dialogueWords / totalWords);
  }

  /**
   * Calculate overall pacing metrics
   */
  private calculateOverallPacing(scenes: Scene[], tensionArcs: TensionArc[]): PacingMetrics {
    const sceneLengths = scenes.map(s => s.wordCount || 0);
    const averageSceneLength = sceneLengths.reduce((sum, len) => sum + len, 0) / sceneLengths.length;
    
    // Find shortest and longest scenes
    let shortestScene = scenes[0];
    let longestScene = scenes[0];
    
    scenes.forEach(scene => {
      if ((scene.wordCount || 0) < (shortestScene.wordCount || 0)) {
        shortestScene = scene;
      }
      if ((scene.wordCount || 0) > (longestScene.wordCount || 0)) {
        longestScene = scene;
      }
    });

    // Calculate pacing variation
    const lengthVariation = this.calculateStandardDeviation(sceneLengths);
    const tensionVariation = this.calculateStandardDeviation(
      tensionArcs.map(arc => arc.tensionLevel)
    );

    // Determine scene pace
    let scenePace: PacingMetrics['scenePace'] = 'steady';
    if (averageSceneLength < 1000) scenePace = 'fast';
    else if (averageSceneLength > 2500) scenePace = 'slow';
    else if (lengthVariation > averageSceneLength * 0.5) scenePace = 'variable';

    // Calculate pacing score
    const pacingScore = this.calculatePacingScore(
      scenePace,
      averageSceneLength,
      lengthVariation,
      tensionVariation,
      tensionArcs
    );

    // Generate recommendations
    const recommendations = this.generatePacingRecommendations(
      scenePace,
      averageSceneLength,
      lengthVariation,
      tensionArcs
    );

    return {
      scenePace,
      averageSceneLength: Math.round(averageSceneLength),
      shortestScene: {
        id: shortestScene.id,
        title: shortestScene.title,
        wordCount: shortestScene.wordCount || 0
      },
      longestScene: {
        id: longestScene.id,
        title: longestScene.title,
        wordCount: longestScene.wordCount || 0
      },
      pacingScore,
      recommendations
    };
  }

  /**
   * Analyze act pacing
   */
  private analyzeActPacing(
    stories: Story[],
    scenes: Scene[],
    tensionArcs: TensionArc[]
  ): PacingReport['actPacing'] {
    const actPacing = [];
    
    // Group scenes by act
    stories.forEach(story => {
      if (story.acts) {
        story.acts.forEach(act => {
          const actScenes = scenes.filter(scene => 
            scene.storyId === story.id && scene.actId === act.id
          );
          
          const actTension = tensionArcs.filter(arc => 
            actScenes.some(s => s.id === arc.sceneId)
          );
          
          const wordCount = actScenes.reduce((sum, s) => sum + (s.wordCount || 0), 0);
          const tensionPeak = Math.max(...actTension.map(t => t.tensionLevel), 0);
          
          let pacing: 'slow' | 'steady' | 'fast' = 'steady';
          const avgSceneLength = wordCount / actScenes.length;
          if (avgSceneLength < 1200) pacing = 'fast';
          else if (avgSceneLength > 2200) pacing = 'slow';
          
          actPacing.push({
            actNumber: act.order,
            scenes: actScenes.length,
            wordCount,
            pacing,
            tensionPeak
          });
        });
      }
    });
    
    return actPacing;
  }

  /**
   * Analyze chapter pacing
   */
  private analyzeChapterPacing(
    chapters: Chapter[],
    scenes: Scene[],
    tensionArcs: TensionArc[]
  ): PacingReport['chapterPacing'] {
    return chapters.map(chapter => {
      const chapterScenes = scenes.filter(s => s.chapterId === chapter.id);
      const chapterTension = tensionArcs.filter(arc => 
        chapterScenes.some(s => s.id === arc.sceneId)
      );
      
      const wordCount = chapterScenes.reduce((sum, s) => sum + (s.wordCount || 0), 0);
      const averageTension = chapterTension.reduce((sum, t) => 
        sum + t.tensionLevel, 0
      ) / (chapterTension.length || 1);
      
      const pacingNotes = [];
      
      // Check chapter ending
      if (chapterScenes.length > 0) {
        const lastScene = chapterScenes[chapterScenes.length - 1];
        const lastTension = chapterTension.find(t => t.sceneId === lastScene.id);
        
        if (lastTension) {
          if (lastTension.tensionLevel > 70) {
            pacingNotes.push('Strong cliffhanger ending');
          } else if (lastTension.tensionLevel < 30) {
            pacingNotes.push('Resolution ending - consider adding hook');
          }
        }
      }
      
      // Check chapter length
      if (wordCount < 2000) {
        pacingNotes.push('Very short chapter - consider expanding');
      } else if (wordCount > 5000) {
        pacingNotes.push('Long chapter - consider splitting');
      }
      
      // Check tension progression
      if (chapterTension.length > 2) {
        const firstHalfTension = chapterTension.slice(0, Math.floor(chapterTension.length / 2))
          .reduce((sum, t) => sum + t.tensionLevel, 0) / Math.floor(chapterTension.length / 2);
        const secondHalfTension = chapterTension.slice(Math.floor(chapterTension.length / 2))
          .reduce((sum, t) => sum + t.tensionLevel, 0) / Math.ceil(chapterTension.length / 2);
        
        if (secondHalfTension > firstHalfTension * 1.3) {
          pacingNotes.push('Good tension escalation');
        } else if (secondHalfTension < firstHalfTension * 0.7) {
          pacingNotes.push('Tension drops - may feel anticlimactic');
        }
      }
      
      return {
        chapterId: chapter.id,
        title: chapter.title,
        wordCount,
        sceneCount: chapterScenes.length,
        averageTension: Math.round(averageTension),
        pacingNotes
      };
    });
  }

  /**
   * Compare to genre expectations
   */
  private compareToGenreExpectations(
    genre: string,
    overall: PacingMetrics,
    tensionArcs: TensionArc[]
  ): PacingReport['genreExpectations'] {
    const profile = GENRE_PACING_PROFILES[genre as keyof typeof GENRE_PACING_PROFILES] || 
                   GENRE_PACING_PROFILES.fantasy;
    
    const matches: string[] = [];
    const deviations: string[] = [];
    const suggestions: string[] = [];
    
    // Check scene length
    const lengthDiff = Math.abs(overall.averageSceneLength - profile.averageSceneLength);
    if (lengthDiff < 200) {
      matches.push(`Scene length matches ${genre} expectations`);
    } else {
      deviations.push(`Scenes are ${overall.averageSceneLength > profile.averageSceneLength ? 'longer' : 'shorter'} than typical ${genre}`);
      suggestions.push(`Consider ${overall.averageSceneLength > profile.averageSceneLength ? 'tightening' : 'expanding'} scenes`);
    }
    
    // Check action/dialogue ratio
    const avgDialogueRatio = tensionArcs.reduce((sum, arc) => 
      sum + arc.dialogueRatio, 0
    ) / tensionArcs.length;
    const avgActionRatio = 1 - avgDialogueRatio;
    
    if (Math.abs(avgActionRatio - profile.actionToDialogueRatio) < 0.1) {
      matches.push('Action/dialogue balance fits genre');
    } else {
      if (avgActionRatio < profile.actionToDialogueRatio) {
        deviations.push('More dialogue-heavy than typical ' + genre);
        suggestions.push('Consider adding more action sequences');
      } else {
        deviations.push('More action-heavy than typical ' + genre);
        suggestions.push('Consider adding more character moments and dialogue');
      }
    }
    
    // Check tension pattern
    const tensionPattern = this.analyzeTensionPattern(tensionArcs);
    if (tensionPattern === profile.expectedTensionPattern) {
      matches.push('Tension arc follows genre conventions');
    } else {
      deviations.push(`Tension pattern is ${tensionPattern} instead of ${profile.expectedTensionPattern}`);
      suggestions.push(`Adjust tension progression for ${genre} expectations`);
    }
    
    return { matches, deviations, suggestions };
  }

  /**
   * Analyze tension pattern
   */
  private analyzeTensionPattern(tensionArcs: TensionArc[]): string {
    if (tensionArcs.length < 3) return 'insufficient';
    
    const firstThird = tensionArcs.slice(0, Math.floor(tensionArcs.length / 3));
    const middleThird = tensionArcs.slice(Math.floor(tensionArcs.length / 3), Math.floor(tensionArcs.length * 2 / 3));
    const lastThird = tensionArcs.slice(Math.floor(tensionArcs.length * 2 / 3));
    
    const avgFirst = firstThird.reduce((sum, arc) => sum + arc.tensionLevel, 0) / firstThird.length;
    const avgMiddle = middleThird.reduce((sum, arc) => sum + arc.tensionLevel, 0) / middleThird.length;
    const avgLast = lastThird.reduce((sum, arc) => sum + arc.tensionLevel, 0) / lastThird.length;
    
    if (avgLast > avgMiddle && avgMiddle > avgFirst) {
      return 'escalating';
    } else if (Math.abs(avgFirst - avgMiddle) < 10 && Math.abs(avgMiddle - avgLast) < 10) {
      return 'steady';
    } else if (avgMiddle > avgFirst && avgMiddle > avgLast) {
      return 'peaked';
    } else {
      // Check for wave pattern
      let peaks = 0;
      for (let i = 1; i < tensionArcs.length - 1; i++) {
        if (tensionArcs[i].tensionLevel > tensionArcs[i - 1].tensionLevel &&
            tensionArcs[i].tensionLevel > tensionArcs[i + 1].tensionLevel) {
          peaks++;
        }
      }
      
      if (peaks >= 3) return 'wave';
      if (peaks >= 2) return 'stepped';
      
      return 'variable';
    }
  }

  /**
   * Calculate pacing score
   */
  private calculatePacingScore(
    pace: PacingMetrics['scenePace'],
    avgLength: number,
    lengthVariation: number,
    tensionVariation: number,
    tensionArcs: TensionArc[]
  ): number {
    let score = 70; // Base score
    
    // Consistent pacing is good
    if (pace === 'steady') score += 10;
    else if (pace === 'variable') score += 5;
    
    // Ideal scene length
    if (avgLength >= 1500 && avgLength <= 2500) score += 10;
    else if (avgLength < 500 || avgLength > 4000) score -= 15;
    
    // Some variation is good
    if (lengthVariation > avgLength * 0.2 && lengthVariation < avgLength * 0.4) {
      score += 5;
    } else if (lengthVariation > avgLength * 0.6) {
      score -= 10;
    }
    
    // Tension should vary
    if (tensionVariation > 15 && tensionVariation < 30) {
      score += 10;
    } else if (tensionVariation < 10) {
      score -= 10; // Too monotonous
    }
    
    // Check for proper tension escalation
    const tensionProgression = this.checkTensionProgression(tensionArcs);
    score += tensionProgression;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check tension progression quality
   */
  private checkTensionProgression(tensionArcs: TensionArc[]): number {
    if (tensionArcs.length < 5) return 0;
    
    let score = 0;
    
    // Check for climax near end (but not at very end)
    const climaxPosition = tensionArcs.reduce((maxIdx, arc, idx, arr) => 
      arc.tensionLevel > arr[maxIdx].tensionLevel ? idx : maxIdx, 0
    );
    
    const relativePosition = climaxPosition / tensionArcs.length;
    if (relativePosition > 0.6 && relativePosition < 0.9) {
      score += 10; // Well-positioned climax
    }
    
    // Check for variety
    const tensionLevels = tensionArcs.map(arc => arc.tensionLevel);
    const uniqueLevels = new Set(tensionLevels.map(level => Math.round(level / 10)));
    if (uniqueLevels.size > 5) score += 5;
    
    return score;
  }

  /**
   * Generate pacing recommendations
   */
  private generatePacingRecommendations(
    pace: PacingMetrics['scenePace'],
    avgLength: number,
    lengthVariation: number,
    tensionArcs: TensionArc[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Scene length recommendations
    if (avgLength < 1000) {
      recommendations.push('Scenes are very short - consider combining or expanding key scenes');
    } else if (avgLength > 3000) {
      recommendations.push('Scenes are quite long - consider breaking up complex scenes');
    }
    
    // Pacing recommendations
    if (pace === 'variable') {
      recommendations.push('Scene lengths vary significantly - ensure this serves the narrative');
    } else if (pace === 'slow') {
      recommendations.push('Overall pacing is slow - consider tightening prose and increasing tension');
    } else if (pace === 'fast') {
      recommendations.push('Pacing is very fast - ensure readers have time to absorb important moments');
    }
    
    // Variation recommendations
    if (lengthVariation < avgLength * 0.1) {
      recommendations.push('Scene lengths are very uniform - vary length for better rhythm');
    }
    
    // Tension recommendations
    const avgTension = tensionArcs.reduce((sum, arc) => sum + arc.tensionLevel, 0) / tensionArcs.length;
    if (avgTension < 30) {
      recommendations.push('Overall tension is low - consider adding more conflict or stakes');
    } else if (avgTension > 70) {
      recommendations.push('Tension is consistently high - add breathing room for readers');
    }
    
    // Check for flat middle
    if (tensionArcs.length > 10) {
      const middleStart = Math.floor(tensionArcs.length * 0.3);
      const middleEnd = Math.floor(tensionArcs.length * 0.7);
      const middleTension = tensionArcs.slice(middleStart, middleEnd);
      const middleVariation = this.calculateStandardDeviation(
        middleTension.map(arc => arc.tensionLevel)
      );
      
      if (middleVariation < 10) {
        recommendations.push('Middle section lacks tension variation - avoid sagging middle syndrome');
      }
    }
    
    // Check ending
    if (tensionArcs.length > 0) {
      const lastTension = tensionArcs[tensionArcs.length - 1].tensionLevel;
      if (lastTension > 80) {
        recommendations.push('Story ends at peak tension - consider adding denouement');
      } else if (lastTension < 20) {
        recommendations.push('Ending is very low tension - consider adding final hook or question');
      }
    }
    
    return recommendations;
  }

  /**
   * Create writing goal
   */
  public createGoal(goal: Omit<WritingGoal, 'id' | 'current' | 'completed'>): WritingGoal {
    const newGoal: WritingGoal = {
      id: this.generateId(),
      ...goal,
      current: 0,
      completed: false,
      streak: 0,
      bestStreak: 0
    };
    
    this.writingGoals.set(newGoal.id, newGoal);
    this.saveGoals();
    
    return newGoal;
  }

  /**
   * Update goal progress
   */
  public updateGoalProgress(goalId: string, progress: number): void {
    const goal = this.writingGoals.get(goalId);
    if (!goal) return;
    
    goal.current += progress;
    
    if (goal.current >= goal.target) {
      goal.completed = true;
      
      // Update streak
      if (goal.type === 'daily') {
        goal.streak = (goal.streak || 0) + 1;
        goal.bestStreak = Math.max(goal.bestStreak || 0, goal.streak);
      }
    }
    
    this.saveGoals();
  }

  /**
   * Start writing session
   */
  public startWritingSession(projectId: string): WritingSession {
    if (this.currentSession) {
      this.endWritingSession();
    }
    
    this.currentSession = {
      id: this.generateId(),
      startTime: new Date(),
      wordsWritten: 0,
      scenesCompleted: [],
      goalProgress: {},
      productivity: 0,
      focusScore: 100
    };
    
    return this.currentSession;
  }

  /**
   * End writing session
   */
  public endWritingSession(): WritingSession | null {
    if (!this.currentSession) return null;
    
    this.currentSession.endTime = new Date();
    const duration = (this.currentSession.endTime.getTime() - 
                     this.currentSession.startTime.getTime()) / 60000; // minutes
    
    this.currentSession.productivity = duration > 0 ? 
      this.currentSession.wordsWritten / duration : 0;
    
    this.writingSessions.push(this.currentSession);
    this.saveSessions();
    
    const session = this.currentSession;
    this.currentSession = null;
    
    return session;
  }

  /**
   * Update session progress
   */
  public updateSessionProgress(wordsWritten: number, sceneCompleted?: string): void {
    if (!this.currentSession) return;
    
    this.currentSession.wordsWritten += wordsWritten;
    
    if (sceneCompleted) {
      this.currentSession.scenesCompleted.push(sceneCompleted);
    }
    
    // Update relevant goals
    this.writingGoals.forEach(goal => {
      if (goal.unit === 'words' && !goal.completed) {
        const progress = Math.min(wordsWritten, goal.target - goal.current);
        this.updateGoalProgress(goal.id, progress);
        this.currentSession!.goalProgress[goal.id] = 
          (this.currentSession!.goalProgress[goal.id] || 0) + progress;
      } else if (goal.unit === 'scenes' && sceneCompleted && !goal.completed) {
        this.updateGoalProgress(goal.id, 1);
        this.currentSession!.goalProgress[goal.id] = 
          (this.currentSession!.goalProgress[goal.id] || 0) + 1;
      }
    });
  }

  /**
   * Get productivity analytics
   */
  public getProductivityAnalytics(projectId: string): ProductivityAnalytics {
    const projectSessions = this.writingSessions.filter(s => 
      s.id.includes(projectId) // Simplified - would need proper project tracking
    );
    
    const totalWords = projectSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
    const totalScenes = projectSessions.reduce((sum, s) => sum + s.scenesCompleted.length, 0);
    
    // Calculate daily averages
    const sessionDates = projectSessions.map(s => 
      new Date(s.startTime).toDateString()
    );
    const uniqueDays = new Set(sessionDates).size;
    const averageWordsPerDay = uniqueDays > 0 ? totalWords / uniqueDays : 0;
    
    // Calculate session average
    const averageWordsPerSession = projectSessions.length > 0 ? 
      totalWords / projectSessions.length : 0;
    
    // Find most productive times
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<string, number>();
    
    projectSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + session.wordsWritten);
      dayCounts.set(day, (dayCounts.get(day) || 0) + session.wordsWritten);
    });
    
    const mostProductiveHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    const mostProductiveDay = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    // Calculate streaks
    const dailyGoals = Array.from(this.writingGoals.values())
      .filter(g => g.type === 'daily');
    const currentStreak = Math.max(...dailyGoals.map(g => g.streak || 0), 0);
    const longestStreak = Math.max(...dailyGoals.map(g => g.bestStreak || 0), 0);
    
    // Count goals
    const goals = Array.from(this.writingGoals.values());
    const goalsCompleted = goals.filter(g => g.completed).length;
    const goalsInProgress = goals.filter(g => !g.completed).length;
    
    // Estimate completion
    let estimatedCompletionDate: Date | undefined;
    const projectGoal = goals.find(g => g.type === 'project' && !g.completed);
    if (projectGoal && averageWordsPerDay > 0) {
      const remainingWords = projectGoal.target - projectGoal.current;
      const daysToComplete = Math.ceil(remainingWords / averageWordsPerDay);
      estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + daysToComplete);
    }
    
    return {
      totalWords,
      totalScenes,
      averageWordsPerDay: Math.round(averageWordsPerDay),
      averageWordsPerSession: Math.round(averageWordsPerSession),
      mostProductiveTime: mostProductiveHour ? 
        `${mostProductiveHour[0]}:00` : 'No data',
      mostProductiveDay: mostProductiveDay?.[0] || 'No data',
      writingStreak: currentStreak,
      longestStreak,
      goalsCompleted,
      goalsInProgress,
      estimatedCompletionDate
    };
  }

  /**
   * Get goal recommendations
   */
  public getGoalRecommendations(
    currentWordCount: number,
    targetWordCount: number,
    currentPace: number
  ): string[] {
    const recommendations: string[] = [];
    const remainingWords = targetWordCount - currentWordCount;
    
    if (currentPace > 0) {
      const daysToComplete = Math.ceil(remainingWords / currentPace);
      recommendations.push(`At current pace, you'll complete in ${daysToComplete} days`);
      
      if (daysToComplete > 180) {
        recommendations.push('Consider increasing daily word count goal');
      } else if (daysToComplete < 30) {
        recommendations.push('Great pace! You\'re on track for rapid completion');
      }
    }
    
    // Suggest daily goals based on timeline preferences
    const goalSuggestions = [
      { words: 250, timeline: Math.ceil(remainingWords / 250), label: 'Relaxed' },
      { words: 500, timeline: Math.ceil(remainingWords / 500), label: 'Steady' },
      { words: 1000, timeline: Math.ceil(remainingWords / 1000), label: 'Ambitious' },
      { words: 2000, timeline: Math.ceil(remainingWords / 2000), label: 'Intensive' }
    ];
    
    goalSuggestions.forEach(suggestion => {
      if (suggestion.timeline > 0 && suggestion.timeline < 365) {
        recommendations.push(
          `${suggestion.label}: ${suggestion.words} words/day = ${suggestion.timeline} days to complete`
        );
      }
    });
    
    return recommendations;
  }

  /**
   * Helper: Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Load goals from storage
   */
  private loadGoals(): void {
    const stored = localStorage.getItem('writingGoals');
    if (stored) {
      const goals = JSON.parse(stored) as WritingGoal[];
      goals.forEach(goal => {
        goal.startDate = new Date(goal.startDate);
        if (goal.endDate) goal.endDate = new Date(goal.endDate);
        this.writingGoals.set(goal.id, goal);
      });
    }
  }

  /**
   * Save goals to storage
   */
  private saveGoals(): void {
    const goals = Array.from(this.writingGoals.values());
    localStorage.setItem('writingGoals', JSON.stringify(goals));
  }

  /**
   * Load sessions from storage
   */
  private loadSessions(): void {
    const stored = localStorage.getItem('writingSessions');
    if (stored) {
      this.writingSessions = JSON.parse(stored).map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined
      }));
    }
  }

  /**
   * Save sessions to storage
   */
  private saveSessions(): void {
    localStorage.setItem('writingSessions', JSON.stringify(this.writingSessions));
  }
}

// Export singleton instance
export const pacingAnalysisService = PacingAnalysisService.getInstance();