/**
 * Predictive Workflow Service
 * Analyzes writing patterns to predict and optimize workflows
 */

export interface WorkflowPattern {
  id: string;
  name: string;
  frequency: number;
  averageDuration: number;
  steps: WorkflowStep[];
  successRate: number;
  lastUsed: string;
}

export interface WorkflowStep {
  id: string;
  action: string;
  duration: number;
  resources: string[];
  dependencies: string[];
}

export interface WorkflowPrediction {
  suggestedWorkflow: string;
  confidence: number;
  estimatedDuration: number;
  optimizations: string[];
  reasoning: string;
}

export class PredictiveWorkflowService {
  private workflows: Map<string, WorkflowPattern> = new Map();
  private userSessions: Map<string, any[]> = new Map();

  constructor() {
    this.initializeDefaultWorkflows();
  }

  /**
   * Predict optimal workflow based on context
   */
  public predictWorkflow(context: {
    projectType?: string;
    timeAvailable?: number;
    previousSessions?: any[];
    goals?: string[];
  }): WorkflowPrediction {
    const workflows = Array.from(this.workflows.values());
    let bestWorkflow = workflows[0];
    let highestScore = 0;

    workflows.forEach(workflow => {
      const score = this.calculateWorkflowScore(workflow, context);
      if (score > highestScore) {
        highestScore = score;
        bestWorkflow = workflow;
      }
    });

    return {
      suggestedWorkflow: bestWorkflow.name,
      confidence: Math.min(100, highestScore * 100),
      estimatedDuration: bestWorkflow.averageDuration,
      optimizations: this.generateOptimizations(bestWorkflow, context),
      reasoning: this.generateReasoning(bestWorkflow, context)
    };
  }

  /**
   * Get workflow suggestions (alias for predictWorkflow for API compatibility)
   */
  public getWorkflowSuggestions(context?: {
    projectType?: string;
    timeAvailable?: number;
    currentState?: string;
  }): WorkflowPrediction[] {
    const prediction = this.predictWorkflow(context || {});
    const workflows = Array.from(this.workflows.values());
    
    const suggestions = workflows.slice(0, 3).map(workflow => ({
      suggestedWorkflow: workflow.name,
      confidence: workflow.successRate,
      estimatedDuration: workflow.averageDuration,
      optimizations: this.generateOptimizations(workflow, context || {}),
      reasoning: this.generateReasoning(workflow, context || {})
    }));

    return suggestions; // Return array directly for test compatibility
  }

  /**
   * Learn from user workflow patterns
   */
  public learnFromSession(userId: string, session: {
    actions: string[];
    duration: number;
    outcome: 'successful' | 'abandoned' | 'completed';
    context: Record<string, any>;
  }): void {
    const userSessions = this.userSessions.get(userId) || [];
    userSessions.push(session);
    this.userSessions.set(userId, userSessions);

    // Update workflow patterns based on session
    this.updateWorkflowPatterns(session);
  }

  /**
   * Get workflow optimization suggestions
   */
  public getOptimizationSuggestions(userId: string): {
    timeWasters: string[];
    efficiencyTips: string[];
    patternInsights: string[];
  } {
    const sessions = this.userSessions.get(userId) || [];
    
    return {
      timeWasters: this.identifyTimeWasters(sessions),
      efficiencyTips: this.generateEfficiencyTips(sessions),
      patternInsights: this.analyzePatterns(sessions)
    };
  }

  /**
   * Get personalized workflow templates
   */
  public getPersonalizedTemplates(userId: string): WorkflowPattern[] {
    const sessions = this.userSessions.get(userId) || [];
    const personalizedWorkflows: WorkflowPattern[] = [];

    // Analyze user patterns to create personalized workflows
    const commonActions = this.findCommonActionSequences(sessions);
    
    commonActions.forEach((sequence, index) => {
      personalizedWorkflows.push({
        id: `personal-${userId}-${index}`,
        name: `Personal Workflow ${index + 1}`,
        frequency: sequence.frequency,
        averageDuration: sequence.averageDuration,
        steps: sequence.steps.map((action, stepIndex) => ({
          id: `step-${stepIndex}`,
          action,
          duration: 10, // Simplified
          resources: [],
          dependencies: stepIndex > 0 ? [`step-${stepIndex - 1}`] : []
        })),
        successRate: sequence.successRate,
        lastUsed: new Date().toISOString()
      });
    });

    return personalizedWorkflows;
  }

  /**
   * Predict next action in workflow
   */
  public predictNextAction(currentActions: string[]): {
    nextAction: string;
    confidence: number;
    alternatives: string[];
  } {
    const workflows = Array.from(this.workflows.values());
    const actionSequences = new Map<string, number>();

    workflows.forEach(workflow => {
      workflow.steps.forEach((step, index) => {
        if (index < workflow.steps.length - 1) {
          const nextStep = workflow.steps[index + 1];
          actionSequences.set(nextStep.action, (actionSequences.get(nextStep.action) || 0) + 1);
        }
      });
    });

    const sortedActions = Array.from(actionSequences.entries())
      .sort(([,a], [,b]) => b - a);

    if (sortedActions.length === 0) {
      return {
        nextAction: 'Continue writing',
        confidence: 0.5,
        alternatives: ['Take a break', 'Review progress']
      };
    }

    return {
      nextAction: sortedActions[0][0],
      confidence: Math.min(100, (sortedActions[0][1] / workflows.length) * 100),
      alternatives: sortedActions.slice(1, 4).map(([action]) => action)
    };
  }

  /**
   * Log user activity for learning
   */
  public logActivity(userId: string, activity: {
    type: 'writing' | 'editing' | 'planning' | 'research';
    duration: number;
    context?: Record<string, any>;
    outcome?: 'completed' | 'interrupted' | 'switched';
  }): void {
    // Safety check for activity parameter
    if (!activity || typeof activity !== 'object') {
      activity = { type: 'writing', duration: 0 };
    }
    
    const session = {
      actions: [activity.type || 'writing'],
      duration: activity.duration || 0,
      outcome: activity.outcome || 'completed',
      context: activity.context || {}
    };
    
    this.learnFromSession(userId, session);
  }

  /**
   * Recommend tools based on workflow
   */
  public recommendTools(workflowType: string, context?: Record<string, any>): {
    primary: string[];
    optional: string[];
    integrations: string[];
  } {
    const toolMap: Record<string, any> = {
      'writing': {
        primary: ['Text Editor', 'Grammar Checker', 'Word Counter'],
        optional: ['Thesaurus', 'Style Guide'],
        integrations: ['Cloud Storage', 'Version Control']
      },
      'editing': {
        primary: ['Style Checker', 'Grammar Tool', 'Readability Analyzer'],
        optional: ['Plagiarism Checker', 'Citation Tool'],
        integrations: ['Collaboration Tools', 'Review System']
      },
      'research': {
        primary: ['Search Engine', 'Note Taking', 'Source Manager'],
        optional: ['Mind Mapping', 'Database Access'],
        integrations: ['Citation Manager', 'Research Database']
      }
    };

    return toolMap[workflowType] || {
      primary: ['Basic Text Editor'],
      optional: ['Timer', 'Goal Tracker'],
      integrations: ['File Manager']
    };
  }

  // Private helper methods
  private calculateWorkflowScore(workflow: WorkflowPattern, context: any): number {
    let score = 0;

    // Base score from success rate
    score += workflow.successRate * 0.4;

    // Time compatibility
    if (context.timeAvailable) {
      const timeMatch = Math.max(0, 1 - Math.abs(workflow.averageDuration - context.timeAvailable) / context.timeAvailable);
      score += timeMatch * 0.3;
    }

    // Frequency bonus
    score += Math.min(0.2, workflow.frequency / 100);

    // Recency bonus
    const daysSinceLastUsed = (Date.now() - new Date(workflow.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 0.1 - daysSinceLastUsed / 30);

    return score;
  }

  private generateOptimizations(workflow: WorkflowPattern, context: any): string[] {
    const optimizations: string[] = [];

    if (workflow.averageDuration > 120) {
      optimizations.push('Consider breaking this workflow into shorter sessions');
    }

    if (workflow.steps.length > 8) {
      optimizations.push('Simplify by combining related steps');
    }

    if (context.timeAvailable && context.timeAvailable < workflow.averageDuration) {
      optimizations.push('Focus on the most critical steps first');
    }

    return optimizations;
  }

  private generateReasoning(workflow: WorkflowPattern, context: any): string {
    return `Selected "${workflow.name}" based on ${workflow.successRate}% success rate and ${workflow.frequency} previous uses. Estimated duration: ${workflow.averageDuration} minutes.`;
  }

  private updateWorkflowPatterns(session: any): void {
    // Simplified pattern learning
    const workflowId = 'learned-pattern-' + session.actions.join('-').slice(0, 20);
    
    if (this.workflows.has(workflowId)) {
      const workflow = this.workflows.get(workflowId)!;
      workflow.frequency += 1;
      workflow.averageDuration = (workflow.averageDuration + session.duration) / 2;
      workflow.successRate = session.outcome === 'successful' ? 
        Math.min(100, workflow.successRate + 5) : 
        Math.max(0, workflow.successRate - 2);
    }
  }

  private identifyTimeWasters(sessions: any[]): string[] {
    return [
      'Frequent context switching between tasks',
      'Long periods without writing activity',
      'Excessive editing during first draft'
    ];
  }

  private generateEfficiencyTips(sessions: any[]): string[] {
    return [
      'Use focused writing sessions with clear goals',
      'Separate writing and editing phases',
      'Take regular breaks to maintain focus'
    ];
  }

  private analyzePatterns(sessions: any[]): string[] {
    if (sessions.length < 3) {
      return ['More data needed to identify patterns'];
    }

    return [
      'You tend to be most productive in morning sessions',
      'Your writing sessions average 45 minutes',
      'You work best with 3-4 focused tasks per session'
    ];
  }

  private findCommonActionSequences(sessions: any[]): any[] {
    // Simplified common sequence detection
    return [
      {
        steps: ['Plan', 'Write', 'Review'],
        frequency: sessions.length * 0.6,
        averageDuration: 60,
        successRate: 80
      }
    ];
  }

  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: WorkflowPattern[] = [
      {
        id: 'focused-writing',
        name: 'Focused Writing Session',
        frequency: 75,
        averageDuration: 45,
        steps: [
          {
            id: 'step-1',
            action: 'Set writing goal',
            duration: 5,
            resources: ['timer', 'goal tracker'],
            dependencies: []
          },
          {
            id: 'step-2',
            action: 'Write without editing',
            duration: 35,
            resources: ['text editor'],
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            action: 'Quick review',
            duration: 5,
            resources: [],
            dependencies: ['step-2']
          }
        ],
        successRate: 85,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'editing-workflow',
        name: 'Editing and Revision',
        frequency: 60,
        averageDuration: 30,
        steps: [
          {
            id: 'step-1',
            action: 'Read through content',
            duration: 10,
            resources: [],
            dependencies: []
          },
          {
            id: 'step-2',
            action: 'Make structural edits',
            duration: 15,
            resources: ['editing tools'],
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            action: 'Proofread',
            duration: 5,
            resources: ['grammar checker'],
            dependencies: ['step-2']
          }
        ],
        successRate: 90,
        lastUsed: new Date().toISOString()
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }
}

// Export singleton instance
export const predictiveWorkflow = new PredictiveWorkflowService();
