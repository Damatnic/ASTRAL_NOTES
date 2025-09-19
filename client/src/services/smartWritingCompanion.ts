/**
 * Smart Writing Companion Service
 * Provides intelligent writing assistance and contextual support
 */

export interface WritingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  wordCount: number;
  charactersTyped: number;
  pauseTime: number;
  productivity: 'high' | 'medium' | 'low';
}

export interface WritingMetrics {
  averageWPM: number;
  totalWords: number;
  activeTime: number;
  distractionEvents: number;
  focusScore: number;
  sessionCount: number; // For test compatibility
  lastSessionDuration?: number; // For test compatibility
}

export interface SmartSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'flow' | 'word_choice';
  message: string;
  replacement?: string;
  confidence: number;
}

export class SmartWritingCompanionService {
  private currentSession: WritingSession | null = null;
  private sessionHistory: WritingSession[] = [];
  private suggestions: SmartSuggestion[] = [];

  /**
   * Start a new writing session
   */
  public startSession(): WritingSession {
    this.currentSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      wordCount: 0,
      charactersTyped: 0,
      pauseTime: 0,
      productivity: 'medium'
    };

    return this.currentSession;
  }

  /**
   * End current writing session
   */
  public endSession(): WritingSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.currentSession.productivity = this.calculateProductivity(this.currentSession);
    
    this.sessionHistory.push(this.currentSession);
    const completedSession = this.currentSession;
    this.currentSession = null;

    return completedSession;
  }

  /**
   * Update current session metrics
   */
  public updateSession(data: { wordCount?: number; charactersTyped?: number }): void {
    if (!this.currentSession) return;

    if (data.wordCount !== undefined) {
      this.currentSession.wordCount = data.wordCount;
    }
    if (data.charactersTyped !== undefined) {
      this.currentSession.charactersTyped = data.charactersTyped;
    }
  }

  /**
   * Get writing metrics
   */
  public getMetrics(): WritingMetrics {
    const totalSessions = this.sessionHistory.length;
    if (totalSessions === 0) {
      return {
        averageWPM: 0,
        totalWords: 0,
        activeTime: 0,
        distractionEvents: 0,
        focusScore: 0,
        sessionCount: 0
      };
    }

    const totalWords = this.sessionHistory.reduce((sum, s) => sum + s.wordCount, 0);
    const totalTime = this.sessionHistory.reduce((sum, s) => {
      if (s.endTime) {
        return sum + (s.endTime.getTime() - s.startTime.getTime()) / 60000; // minutes
      }
      return sum;
    }, 0);

    return {
      averageWPM: totalTime > 0 ? Math.round(totalWords / totalTime) : 0,
      totalWords,
      activeTime: totalTime,
      distractionEvents: 0, // Simplified
      focusScore: this.calculateFocusScore(),
      sessionCount: totalSessions
    };
  }

  /**
   * Get smart suggestions for text
   */
  public getSuggestions(text: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Grammar suggestions
    if (text.includes(' i ')) {
      suggestions.push({
        id: 'grammar-1',
        type: 'grammar',
        message: 'Consider capitalizing "I"',
        replacement: text.replace(/ i /g, ' I '),
        confidence: 0.9
      });
    }

    // Style suggestions
    if (text.includes('very ')) {
      suggestions.push({
        id: 'style-1',
        type: 'style',
        message: 'Consider using a stronger adjective instead of "very"',
        confidence: 0.7
      });
    }

    // Flow suggestions
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
      if (avgLength > 30) {
        suggestions.push({
          id: 'flow-1',
          type: 'flow',
          message: 'Consider breaking up long sentences for better readability',
          confidence: 0.8
        });
      }
    }

    return suggestions;
  }

  /**
   * Get productivity insights
   */
  public getProductivityInsights(): {
    bestWritingTime: string;
    averageSessionLength: number;
    productivityTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  } {
    if (this.sessionHistory.length === 0) {
      return {
        bestWritingTime: 'Not enough data',
        averageSessionLength: 0,
        productivityTrend: 'stable',
        recommendations: ['Start tracking your writing sessions to get insights']
      };
    }

    const avgSessionLength = this.sessionHistory.reduce((sum, s) => {
      if (s.endTime) {
        return sum + (s.endTime.getTime() - s.startTime.getTime()) / 60000;
      }
      return sum;
    }, 0) / this.sessionHistory.length;

    const recommendations = [];
    if (avgSessionLength < 15) {
      recommendations.push('Try longer writing sessions for better flow');
    }
    if (avgSessionLength > 90) {
      recommendations.push('Consider taking breaks during long sessions');
    }

    return {
      bestWritingTime: 'Morning', // Simplified
      averageSessionLength: Math.round(avgSessionLength),
      productivityTrend: 'stable',
      recommendations
    };
  }

  /**
   * Get writing streak information
   */
  public getWritingStreak(): { currentStreak: number; longestStreak: number; lastWritingDate: string | null } {
    if (this.sessionHistory.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastWritingDate: null };
    }

    const lastSession = this.sessionHistory[this.sessionHistory.length - 1];
    return {
      currentStreak: 1, // Simplified
      longestStreak: 1, // Simplified
      lastWritingDate: lastSession.startTime.toISOString()
    };
  }

  /**
   * Update metrics with word count and time
   */
  public updateMetrics(wordCount: number, timeMinutes: number): WritingMetrics {
    // Create a synthetic session for metrics calculation
    const syntheticSession: WritingSession = {
      id: `synthetic-${Date.now()}`,
      startTime: new Date(Date.now() - timeMinutes * 60000),
      endTime: new Date(),
      wordCount,
      charactersTyped: wordCount * 5, // Approximate
      pauseTime: 0,
      productivity: this.calculateProductivityFromWPM(wordCount / timeMinutes)
    };

    this.sessionHistory.push(syntheticSession);
    const metrics = this.getMetrics();
    metrics.lastSessionDuration = timeMinutes;
    return metrics;
  }

  /**
   * Create a writing goal
   */
  public createGoal(projectId: string, goalData: {
    type: string;
    target: number;
    deadline?: string;
    description?: string;
    unit?: string;
  }): { id: string; projectId: string; type: string; target: number; deadline?: string; description?: string; unit?: string; progress: number; status: string } {
    return {
      id: `goal-${Date.now()}`,
      projectId,
      type: goalData.type,
      target: goalData.target,
      deadline: goalData.deadline,
      description: goalData.description,
      unit: goalData.unit,
      progress: 0,
      status: 'active'
    };
  }

  /**
   * Get personalized feedback for text
   */
  public getPersonalizedFeedback(projectId: string, text: string): string[] {
    const suggestions = this.getSuggestions(text);
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Return array of feedback strings for API compatibility
    const feedback: string[] = [];
    
    // Add strengths
    if (wordCount > 100) feedback.push('Good content length');
    if (sentenceCount > 3) feedback.push('Good sentence variety');
    
    // Add improvements
    feedback.push(...suggestions.map(s => s.message));
    
    // Add personalized tips
    feedback.push(
      'Try varying your sentence structure',
      'Consider using more descriptive words',
      'Break up long paragraphs for better readability'
    );
    
    return feedback;
  }

  // Private helper methods
  private calculateProductivity(session: WritingSession): 'high' | 'medium' | 'low' {
    if (!session.endTime) return 'medium';

    const duration = (session.endTime.getTime() - session.startTime.getTime()) / 60000; // minutes
    const wpm = duration > 0 ? session.wordCount / duration : 0;

    if (wpm > 25) return 'high';
    if (wpm > 15) return 'medium';
    return 'low';
  }

  private calculateFocusScore(): number {
    if (this.sessionHistory.length === 0) return 0;

    const productiveSessions = this.sessionHistory.filter(s => s.productivity === 'high').length;
    return Math.round((productiveSessions / this.sessionHistory.length) * 100);
  }

  private calculateProductivityFromWPM(wpm: number): 'high' | 'medium' | 'low' {
    if (wpm > 25) return 'high';
    if (wpm > 15) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const smartWritingCompanion = new SmartWritingCompanionService();
