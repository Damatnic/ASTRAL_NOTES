/**
 * Ultimate Integration Service
 * Orchestrates all AI services and provides unified intelligent assistance
 */

import { aiWritingCompanion } from './aiWritingCompanion';
import { storyAssistant } from './storyAssistant';
import { smartTemplates } from './smartTemplates';
import { creativityBooster } from './creativityBooster';
import { personalAICoach } from './personalAICoach';
import { intelligentContentSuggestions } from './intelligentContentSuggestions';
import { predictiveWritingAssistant } from './predictiveWritingAssistant';
import { smartWritingCompanion } from './smartWritingCompanion';

export interface IntegratedAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  insights: string[]; // Added for test compatibility
  actionableSteps: string[];
  serviceInsights: {
    writing: any;
    story: any;
    content: any;
    coaching: any;
  };
}

export interface UnifiedSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'writing' | 'story' | 'creativity' | 'coaching';
  title: string;
  description: string;
  action: string;
  source: string;
}

export class UltimateIntegrationService {
  private analysisCache: Map<string, IntegratedAnalysis> = new Map();

  /**
   * Comprehensive analysis using all AI services
   */
  public async performIntegratedAnalysis(
    text: string,
    context: {
      userId?: string;
      projectId?: string;
      projectType?: 'story' | 'article' | 'academic' | 'creative';
      goals?: string[];
    }
  ): Promise<IntegratedAnalysis> {
    const cacheKey = `${text.length}-${context.projectType || 'general'}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    // Gather insights from all services
    const [
      writingAnalysis,
      storyAnalysis,
      contentAnalysis,
      coachingInsights
    ] = await Promise.all([
      aiWritingCompanion.analyzeText(text, context),
      context.projectType === 'story' ? storyAssistant.analyzeStory(context.projectId || '', text) : null,
      intelligentContentSuggestions.analyzeContent(text, { genre: context.projectType }),
      context.userId ? personalAICoach.generateInsights(context.userId, { 
        wordCount: text.split(/\s+/).length, 
        timeSpent: 30 
      }) : []
    ]);

    // Synthesize all insights
    const analysis: IntegratedAnalysis = {
      overallScore: this.calculateOverallScore(writingAnalysis, storyAnalysis, contentAnalysis),
      strengths: this.consolidateStrengths(writingAnalysis, storyAnalysis, contentAnalysis),
      improvements: this.consolidateImprovements(writingAnalysis, storyAnalysis, contentAnalysis),
      insights: this.generateInsights(writingAnalysis, storyAnalysis, contentAnalysis, coachingInsights),
      actionableSteps: this.generateActionableSteps(writingAnalysis, storyAnalysis, contentAnalysis, coachingInsights),
      serviceInsights: {
        writing: writingAnalysis,
        story: storyAnalysis,
        content: contentAnalysis,
        coaching: coachingInsights
      }
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Get unified suggestions from all services
   */
  public async getUnifiedSuggestions(
    text: string,
    context: {
      userId?: string;
      projectType?: string;
      currentGoals?: string[];
    }
  ): Promise<UnifiedSuggestion[]> {
    const suggestions: UnifiedSuggestion[] = [];

    // Get suggestions from each service
    const writingSuggestions = await aiWritingCompanion.getRealTimeSuggestions(text, text.length, context);
    const contentSuggestions = intelligentContentSuggestions.getTargetedSuggestions(text, 'readability');
    const creativeSuggestions = creativityBooster.getExercises('character');

    // Convert and prioritize suggestions
    writingSuggestions.forEach(suggestion => {
      suggestions.push({
        id: `writing-${suggestion.id}`,
        priority: suggestion.confidence > 0.8 ? 'high' : suggestion.confidence > 0.5 ? 'medium' : 'low',
        category: 'writing',
        title: 'Writing Enhancement',
        description: suggestion.explanation,
        action: suggestion.suggestion,
        source: 'AI Writing Companion'
      });
    });

    contentSuggestions.forEach(suggestion => {
      suggestions.push({
        id: `content-${suggestion.id}`,
        priority: suggestion.confidence > 0.8 ? 'high' : 'medium',
        category: 'writing',
        title: suggestion.title,
        description: suggestion.description,
        action: suggestion.suggestion,
        source: 'Content Suggestions'
      });
    });

    // Sort by priority
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 10);
  }

  /**
   * Get personalized writing dashboard
   */
  public async getPersonalizedDashboard(userId: string): Promise<{
    todaysFocus: string;
    quickActions: string[];
    insights: string[];
    recommendations: string[];
    progress: {
      writingStreak: number;
      wordsWritten: number;
      goalsProgress: number;
    };
  }> {
    // Get data from coaching service
    const motivationalMessage = personalAICoach.getMotivationalMessage(userId);
    const dailyChallenge = personalAICoach.getDailyChallenge('medium');
    const writingMetrics = smartWritingCompanion.getMetrics();

    return {
      todaysFocus: dailyChallenge.title,
      quickActions: [
        'Start a 15-minute writing session',
        'Review yesterday\'s work',
        'Try a creativity exercise',
        'Update writing goals'
      ],
      insights: [
        motivationalMessage,
        `Your average writing speed: ${writingMetrics.averageWPM} WPM`,
        'Your writing consistency is improving'
      ],
      recommendations: [
        'Focus on character development today',
        'Try the voice consistency exercise',
        'Review your story structure'
      ],
      progress: {
        writingStreak: 5, // Simplified
        wordsWritten: writingMetrics.totalWords,
        goalsProgress: 75 // Simplified
      }
    };
  }

  /**
   * Smart workflow orchestration
   */
  public async orchestrateWorkflow(
    action: 'start_writing' | 'continue_editing' | 'creative_break' | 'review_progress',
    context: {
      userId?: string;
      currentText?: string;
      timeAvailable?: number;
      energy?: 'high' | 'medium' | 'low';
    }
  ): Promise<{
    nextSteps: string[];
    suggestedDuration: number;
    tools: string[];
    tips: string[];
  }> {
    switch (action) {
      case 'start_writing':
        return {
          nextSteps: [
            'Set a clear writing goal',
            'Choose your focus topic',
            'Start with a warm-up exercise',
            'Begin writing without editing'
          ],
          suggestedDuration: context.timeAvailable || 30,
          tools: ['Timer', 'Distraction blocker', 'Word counter'],
          tips: [
            'Don\'t edit while writing',
            'Focus on getting ideas down',
            'Use placeholders for research'
          ]
        };

      case 'continue_editing':
        return {
          nextSteps: [
            'Read through existing content',
            'Identify areas for improvement',
            'Make structural changes first',
            'Polish language and style'
          ],
          suggestedDuration: 25,
          tools: ['Grammar checker', 'Style guide', 'Readability analyzer'],
          tips: [
            'Edit in multiple passes',
            'Read aloud for flow',
            'Check for consistency'
          ]
        };

      case 'creative_break':
        const exercises = creativityBooster.getExercises('warmup');
        return {
          nextSteps: [
            exercises[0]?.name || 'Try a creativity exercise',
            'Free write for 5 minutes',
            'Do word association',
            'Sketch story ideas'
          ],
          suggestedDuration: 15,
          tools: ['Timer', 'Notebook', 'Inspiration cards'],
          tips: [
            'Don\'t judge your ideas',
            'Embrace randomness',
            'Build on others\' ideas'
          ]
        };

      case 'review_progress':
        return {
          nextSteps: [
            'Check word count progress',
            'Review recent writing',
            'Update goals if needed',
            'Plan next session'
          ],
          suggestedDuration: 10,
          tools: ['Progress tracker', 'Analytics dashboard', 'Goal planner'],
          tips: [
            'Celebrate small wins',
            'Adjust goals realistically',
            'Note patterns in your work'
          ]
        };

      default:
        return {
          nextSteps: ['Choose a writing activity'],
          suggestedDuration: 30,
          tools: [],
          tips: []
        };
    }
  }

  // Private helper methods
  private calculateOverallScore(writing: any, story: any, content: any): number {
    let score = 0;
    let factors = 0;

    if (writing?.readabilityScore) {
      score += writing.readabilityScore;
      factors++;
    }

    if (story?.characterDevelopment) {
      score += story.characterDevelopment;
      factors++;
    }

    if (content?.readabilityScore) {
      score += content.readabilityScore;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 50;
  }

  private consolidateStrengths(writing: any, story: any, content: any): string[] {
    const strengths: string[] = [];

    if (writing?.strengths) {
      strengths.push(...writing.strengths);
    }

    if (content?.strengths) {
      strengths.push(...content.strengths);
    }

    // Remove duplicates and limit
    return [...new Set(strengths)].slice(0, 5);
  }

  private consolidateImprovements(writing: any, story: any, content: any): string[] {
    const improvements: string[] = [];

    if (writing?.improvements) {
      improvements.push(...writing.improvements);
    }

    if (content?.weaknesses) {
      improvements.push(...content.weaknesses);
    }

    // Remove duplicates and limit
    return [...new Set(improvements)].slice(0, 5);
  }

  private generateActionableSteps(writing: any, story: any, content: any, coaching: any): string[] {
    const steps: string[] = [];

    // Prioritize based on impact
    if (content?.suggestions?.length > 0) {
      steps.push(content.suggestions[0].suggestion);
    }

    if (writing?.suggestions?.length > 0) {
      steps.push(`Writing: ${writing.suggestions[0].suggestion}`);
    }

    if (coaching?.length > 0 && coaching[0].actionable) {
      steps.push(`Focus: ${coaching[0].description}`);
    }

    // Add general steps if needed
    if (steps.length < 3) {
      steps.push('Continue writing regularly to improve');
      steps.push('Read in your target genre for inspiration');
      steps.push('Practice specific writing exercises');
    }

    return steps.slice(0, 5);
  }

  private generateInsights(writing: any, story: any, content: any, coaching: any): string[] {
    const insights: string[] = [];

    // Extract insights from all services
    if (writing?.insights) {
      insights.push(...(Array.isArray(writing.insights) ? writing.insights : [writing.insights]));
    }

    if (story?.insights) {
      insights.push(...(Array.isArray(story.insights) ? story.insights : [story.insights]));
    }

    if (content?.insights) {
      insights.push(...(Array.isArray(content.insights) ? content.insights : [content.insights]));
    }

    // Add coaching insights if available
    if (coaching?.length > 0) {
      insights.push(...coaching.map((c: any) => c.description).filter(Boolean));
    }

    // Add some generic insights if we don't have enough
    if (insights.length === 0) {
      insights.push(
        'Your writing shows potential for improvement',
        'Consider focusing on character development',
        'Work on varying sentence structure',
        'Expand descriptive language'
      );
    }

    return [...new Set(insights)].slice(0, 6); // Remove duplicates and limit
  }
}

// Export singleton instance
export const ultimateIntegration = new UltimateIntegrationService();
