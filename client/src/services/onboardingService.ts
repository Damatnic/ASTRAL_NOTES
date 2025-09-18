import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  skippable: boolean;
  prerequisites?: string[];
  metadata?: Record<string, any>;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'professional' | 'ai' | 'collaboration';
  steps: OnboardingStep[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
}

export interface UserProgress {
  completedFlows: string[];
  completedSteps: string[];
  currentFlow?: string;
  currentStep?: string;
  preferences: {
    showTips: boolean;
    autoAdvance: boolean;
    skipAnimations: boolean;
    reminderFrequency: 'daily' | 'weekly' | 'never';
  };
  analytics: {
    flowsStarted: number;
    flowsCompleted: number;
    totalTimeSpent: number;
    averageStepTime: number;
    helpRequestsCount: number;
    lastActiveDate: number;
  };
}

export class OnboardingService extends BrowserEventEmitter {
  private flows: Map<string, OnboardingFlow> = new Map();
  private userProgress: UserProgress;
  private currentOverlay: HTMLElement | null = null;
  private isActive: boolean = false;

  constructor() {
    super();
    this.userProgress = this.loadUserProgress();
    this.initializeDefaultFlows();
  }

  private loadUserProgress(): UserProgress {
    const saved = localStorage.getItem('astral_onboarding_progress');
    return saved ? JSON.parse(saved) : {
      completedFlows: [],
      completedSteps: [],
      preferences: {
        showTips: true,
        autoAdvance: false,
        skipAnimations: false,
        reminderFrequency: 'daily'
      },
      analytics: {
        flowsStarted: 0,
        flowsCompleted: 0,
        totalTimeSpent: 0,
        averageStepTime: 0,
        helpRequestsCount: 0,
        lastActiveDate: Date.now()
      }
    };
  }

  private saveUserProgress(): void {
    localStorage.setItem('astral_onboarding_progress', JSON.stringify(this.userProgress));
  }

  private initializeDefaultFlows(): void {
    const basicFlow: OnboardingFlow = {
      id: 'basic-introduction',
      name: 'Getting Started with ASTRAL_NOTES',
      description: 'Learn the fundamentals of our writing platform',
      category: 'basic',
      estimatedTime: 10,
      difficulty: 'beginner',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to ASTRAL_NOTES',
          description: 'Discover a revolutionary writing platform designed for creative excellence',
          component: 'WelcomeStep',
          position: 'center',
          skippable: false
        },
        {
          id: 'dashboard-overview',
          title: 'Your Writing Dashboard',
          description: 'Explore your personalized workspace and navigation',
          component: 'DashboardTour',
          targetElement: '.dashboard-container',
          position: 'center',
          skippable: true
        },
        {
          id: 'create-first-project',
          title: 'Create Your First Project',
          description: 'Set up your writing project with our guided wizard',
          component: 'ProjectCreation',
          targetElement: '.create-project-button',
          position: 'bottom',
          skippable: false
        },
        {
          id: 'editor-basics',
          title: 'Writing Editor Essentials',
          description: 'Master the core editing features and shortcuts',
          component: 'EditorTour',
          targetElement: '.editor-container',
          position: 'top',
          skippable: true
        },
        {
          id: 'save-and-sync',
          title: 'Auto-Save and Synchronization',
          description: 'Understanding how your work is automatically protected',
          component: 'SaveFeatures',
          targetElement: '.auto-save-indicator',
          position: 'right',
          skippable: true
        }
      ]
    };

    const aiFlow: OnboardingFlow = {
      id: 'ai-assistant-intro',
      name: 'AI Writing Assistant',
      description: 'Harness the power of AI to enhance your writing',
      category: 'ai',
      estimatedTime: 15,
      difficulty: 'intermediate',
      prerequisites: ['basic-introduction'],
      steps: [
        {
          id: 'ai-overview',
          title: 'Meet Your AI Writing Companion',
          description: 'Discover intelligent writing assistance and creative collaboration',
          component: 'AIOverview',
          targetElement: '.ai-panel',
          position: 'left',
          skippable: false
        },
        {
          id: 'writing-suggestions',
          title: 'Smart Writing Suggestions',
          description: 'Learn how AI analyzes your text and provides contextual improvements',
          component: 'SuggestionsTour',
          targetElement: '.suggestions-panel',
          position: 'right',
          skippable: true
        },
        {
          id: 'goal-setting',
          title: 'AI-Powered Goal Tracking',
          description: 'Set writing goals and let AI help you achieve them',
          component: 'GoalSetting',
          targetElement: '.goals-section',
          position: 'bottom',
          skippable: true
        },
        {
          id: 'writing-analytics',
          title: 'Writing Analytics and Insights',
          description: 'Understand your writing patterns and improvements',
          component: 'AnalyticsTour',
          targetElement: '.analytics-panel',
          position: 'top',
          skippable: true
        }
      ]
    };

    const professionalFlow: OnboardingFlow = {
      id: 'professional-features',
      name: 'Professional Writing Tools',
      description: 'Advanced features for serious writers and authors',
      category: 'professional',
      estimatedTime: 20,
      difficulty: 'advanced',
      prerequisites: ['basic-introduction', 'ai-assistant-intro'],
      steps: [
        {
          id: 'manuscript-preparation',
          title: 'Manuscript Preparation',
          description: 'Professional formatting and export options',
          component: 'ManuscriptTour',
          targetElement: '.manuscript-panel',
          position: 'center',
          skippable: true
        },
        {
          id: 'version-control',
          title: 'Version Control System',
          description: 'Track changes and manage document versions like a pro',
          component: 'VersionControlTour',
          targetElement: '.version-control-panel',
          position: 'left',
          skippable: true
        },
        {
          id: 'world-building',
          title: 'World Building Tools',
          description: 'Create consistent fictional universes with our specialized tools',
          component: 'WorldBuildingTour',
          targetElement: '.world-building-panel',
          position: 'right',
          skippable: true
        },
        {
          id: 'timeline-management',
          title: 'Timeline and Plot Structure',
          description: 'Organize complex narratives with visual timeline tools',
          component: 'TimelineTour',
          targetElement: '.timeline-panel',
          position: 'bottom',
          skippable: true
        }
      ]
    };

    this.flows.set(basicFlow.id, basicFlow);
    this.flows.set(aiFlow.id, aiFlow);
    this.flows.set(professionalFlow.id, professionalFlow);
  }

  public startFlow(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow) return false;

    if (flow.prerequisites) {
      const missingPrereqs = flow.prerequisites.filter(
        prereq => !this.userProgress.completedFlows.includes(prereq)
      );
      if (missingPrereqs.length > 0) {
        this.emit('prerequisitesMissing', { flowId, missingPrereqs });
        return false;
      }
    }

    this.userProgress.currentFlow = flowId;
    this.userProgress.currentStep = flow.steps[0]?.id;
    this.userProgress.analytics.flowsStarted++;
    this.isActive = true;

    this.saveUserProgress();
    this.emit('flowStarted', { flow });
    this.showCurrentStep();
    return true;
  }

  public nextStep(): boolean {
    if (!this.userProgress.currentFlow || !this.userProgress.currentStep) return false;

    const flow = this.flows.get(this.userProgress.currentFlow);
    if (!flow) return false;

    const currentStepIndex = flow.steps.findIndex(step => step.id === this.userProgress.currentStep);
    if (currentStepIndex === -1) return false;

    this.completeCurrentStep();

    if (currentStepIndex + 1 >= flow.steps.length) {
      this.completeFlow();
      return false;
    }

    this.userProgress.currentStep = flow.steps[currentStepIndex + 1].id;
    this.saveUserProgress();
    this.showCurrentStep();
    return true;
  }

  public previousStep(): boolean {
    if (!this.userProgress.currentFlow || !this.userProgress.currentStep) return false;

    const flow = this.flows.get(this.userProgress.currentFlow);
    if (!flow) return false;

    const currentStepIndex = flow.steps.findIndex(step => step.id === this.userProgress.currentStep);
    if (currentStepIndex <= 0) return false;

    this.userProgress.currentStep = flow.steps[currentStepIndex - 1].id;
    this.saveUserProgress();
    this.showCurrentStep();
    return true;
  }

  public skipStep(): boolean {
    if (!this.userProgress.currentFlow || !this.userProgress.currentStep) return false;

    const flow = this.flows.get(this.userProgress.currentFlow);
    if (!flow) return false;

    const currentStep = flow.steps.find(step => step.id === this.userProgress.currentStep);
    if (!currentStep?.skippable) return false;

    return this.nextStep();
  }

  public completeCurrentStep(): void {
    if (!this.userProgress.currentStep) return;

    if (!this.userProgress.completedSteps.includes(this.userProgress.currentStep)) {
      this.userProgress.completedSteps.push(this.userProgress.currentStep);
    }

    this.emit('stepCompleted', { stepId: this.userProgress.currentStep });
    this.saveUserProgress();
  }

  public completeFlow(): void {
    if (!this.userProgress.currentFlow) return;

    if (!this.userProgress.completedFlows.includes(this.userProgress.currentFlow)) {
      this.userProgress.completedFlows.push(this.userProgress.currentFlow);
      this.userProgress.analytics.flowsCompleted++;
    }

    const flowId = this.userProgress.currentFlow;
    this.userProgress.currentFlow = undefined;
    this.userProgress.currentStep = undefined;
    this.isActive = false;

    this.hideOverlay();
    this.emit('flowCompleted', { flowId });
    this.saveUserProgress();
    this.suggestNextFlow();
  }

  public exitFlow(): void {
    if (!this.isActive) return;

    const flowId = this.userProgress.currentFlow;
    this.userProgress.currentFlow = undefined;
    this.userProgress.currentStep = undefined;
    this.isActive = false;

    this.hideOverlay();
    this.emit('flowExited', { flowId });
    this.saveUserProgress();
  }

  private showCurrentStep(): void {
    if (!this.userProgress.currentFlow || !this.userProgress.currentStep) return;

    const flow = this.flows.get(this.userProgress.currentFlow);
    const step = flow?.steps.find(s => s.id === this.userProgress.currentStep);
    
    if (!step) return;

    this.hideOverlay();
    this.createStepOverlay(step, flow!);
    this.emit('stepShown', { step, flow });
  }

  private createStepOverlay(step: OnboardingStep, flow: OnboardingFlow): void {
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML = `
      <div class="onboarding-backdrop"></div>
      <div class="onboarding-modal" data-position="${step.position || 'center'}">
        <div class="onboarding-header">
          <h3>${step.title}</h3>
          <div class="onboarding-progress">
            <span>${flow.steps.findIndex(s => s.id === step.id) + 1}/${flow.steps.length}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${((flow.steps.findIndex(s => s.id === step.id) + 1) / flow.steps.length) * 100}%"></div>
            </div>
          </div>
          <button class="onboarding-close" onclick="window.onboardingService?.exitFlow()">×</button>
        </div>
        <div class="onboarding-content">
          <p>${step.description}</p>
          <div class="onboarding-component" data-component="${step.component}"></div>
        </div>
        <div class="onboarding-footer">
          <button class="onboarding-btn secondary" onclick="window.onboardingService?.previousStep()" 
                  ${flow.steps.findIndex(s => s.id === step.id) === 0 ? 'disabled' : ''}>
            Previous
          </button>
          ${step.skippable ? `<button class="onboarding-btn tertiary" onclick="window.onboardingService?.skipStep()">Skip</button>` : ''}
          <button class="onboarding-btn primary" onclick="window.onboardingService?.nextStep()">
            ${flow.steps.findIndex(s => s.id === step.id) === flow.steps.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    `;

    if (step.targetElement) {
      this.highlightElement(step.targetElement);
    }

    document.body.appendChild(overlay);
    this.currentOverlay = overlay;

    // Expose service to window for button callbacks
    (window as any).onboardingService = this;
  }

  private highlightElement(selector: string): void {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;

    element.style.position = 'relative';
    element.style.zIndex = '10001';
    element.classList.add('onboarding-highlight');
  }

  private hideOverlay(): void {
    if (this.currentOverlay) {
      this.currentOverlay.remove();
      this.currentOverlay = null;
    }

    // Remove all highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
      (el as HTMLElement).style.zIndex = '';
    });
  }

  private suggestNextFlow(): void {
    const availableFlows = Array.from(this.flows.values()).filter(flow => {
      if (this.userProgress.completedFlows.includes(flow.id)) return false;
      
      if (flow.prerequisites) {
        return flow.prerequisites.every(prereq => 
          this.userProgress.completedFlows.includes(prereq)
        );
      }
      
      return true;
    });

    if (availableFlows.length > 0) {
      this.emit('flowSuggested', { flows: availableFlows });
    }
  }

  public getAvailableFlows(): OnboardingFlow[] {
    return Array.from(this.flows.values()).filter(flow => {
      if (flow.prerequisites) {
        return flow.prerequisites.every(prereq => 
          this.userProgress.completedFlows.includes(prereq)
        );
      }
      return true;
    });
  }

  public getFlowProgress(flowId: string): number {
    const flow = this.flows.get(flowId);
    if (!flow) return 0;

    const completedSteps = flow.steps.filter(step => 
      this.userProgress.completedSteps.includes(step.id)
    ).length;

    return (completedSteps / flow.steps.length) * 100;
  }

  public getUserProgress(): UserProgress {
    return { ...this.userProgress };
  }

  public updatePreferences(preferences: Partial<UserProgress['preferences']>): void {
    this.userProgress.preferences = { ...this.userProgress.preferences, ...preferences };
    this.saveUserProgress();
    this.emit('preferencesUpdated', { preferences: this.userProgress.preferences });
  }

  public requestHelp(context?: string): void {
    this.userProgress.analytics.helpRequestsCount++;
    this.saveUserProgress();
    this.emit('helpRequested', { context, step: this.userProgress.currentStep });
  }

  public isFlowActive(): boolean {
    return this.isActive;
  }

  public getCurrentStep(): OnboardingStep | null {
    if (!this.userProgress.currentFlow || !this.userProgress.currentStep) return null;
    
    const flow = this.flows.get(this.userProgress.currentFlow);
    return flow?.steps.find(step => step.id === this.userProgress.currentStep) || null;
  }
}

export const onboardingService = new OnboardingService();