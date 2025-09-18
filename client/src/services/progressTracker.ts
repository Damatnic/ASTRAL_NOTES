import { EventEmitter } from 'events';

export interface PhaseProgress {
  phaseNumber: number;
  phaseName: string;
  totalTasks: number;
  completedTasks: number;
  currentTask?: string;
  percentage: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  subTasks: TaskProgress[];
}

export interface TaskProgress {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  percentage: number;
  startedAt?: Date;
  completedAt?: Date;
  dependencies?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
}

export interface OverallProgress {
  totalPhases: number;
  completedPhases: number;
  currentPhase: number;
  overallPercentage: number;
  startDate: Date;
  lastUpdateDate: Date;
  estimatedCompletionDate?: Date;
  velocity: number; // tasks per day
  phases: PhaseProgress[];
}

export interface ProgressUpdate {
  timestamp: Date;
  type: 'phase_started' | 'phase_completed' | 'task_started' | 'task_completed' | 'progress_update';
  phaseNumber: number;
  taskId?: string;
  message: string;
  percentageChange: number;
}

class ProgressTrackerService extends EventEmitter {
  private overallProgress: OverallProgress;
  private updates: ProgressUpdate[] = [];
  private currentPhaseStartTime: Date = new Date();

  constructor() {
    super();
    this.overallProgress = this.initializeProgress();
    this.loadProgress();
  }

  private initializeProgress(): OverallProgress {
    return {
      totalPhases: 10,
      completedPhases: 6,
      currentPhase: 7,
      overallPercentage: 60,
      startDate: new Date('2024-01-01'),
      lastUpdateDate: new Date(),
      velocity: 0,
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Foundation Setup',
          totalTasks: 5,
          completedTasks: 5,
          percentage: 100,
          startedAt: new Date('2024-01-01'),
          completedAt: new Date('2024-01-02'),
          subTasks: []
        },
        {
          phaseNumber: 2,
          phaseName: 'Core Features',
          totalTasks: 5,
          completedTasks: 5,
          percentage: 100,
          startedAt: new Date('2024-01-02'),
          completedAt: new Date('2024-01-03'),
          subTasks: []
        },
        {
          phaseNumber: 3,
          phaseName: 'Advanced Features',
          totalTasks: 5,
          completedTasks: 5,
          percentage: 100,
          startedAt: new Date('2024-01-03'),
          completedAt: new Date('2024-01-04'),
          subTasks: []
        },
        {
          phaseNumber: 4,
          phaseName: 'AI Integration Excellence',
          totalTasks: 5,
          completedTasks: 5,
          percentage: 100,
          startedAt: new Date('2024-01-04'),
          completedAt: new Date('2024-01-05'),
          subTasks: [
            { id: 'ai-1', name: 'Personal AI writing coach', status: 'completed', percentage: 100, priority: 'high' },
            { id: 'ai-2', name: 'Intelligent content suggestions', status: 'completed', percentage: 100, priority: 'high' },
            { id: 'ai-3', name: 'Writing analytics tracking', status: 'completed', percentage: 100, priority: 'medium' },
            { id: 'ai-4', name: 'Context-aware story assistance', status: 'completed', percentage: 100, priority: 'high' },
            { id: 'ai-5', name: 'Personalized writing environment', status: 'completed', percentage: 100, priority: 'medium' }
          ]
        },
        {
          phaseNumber: 5,
          phaseName: 'Personal Optimization Excellence',
          totalTasks: 5,
          completedTasks: 5,
          percentage: 100,
          startedAt: new Date('2024-01-05'),
          completedAt: new Date('2024-01-06'),
          subTasks: [
            { id: 'opt-1', name: 'Habit tracking system', status: 'completed', percentage: 100, priority: 'high' },
            { id: 'opt-2', name: 'Creativity booster', status: 'completed', percentage: 100, priority: 'medium' },
            { id: 'opt-3', name: 'Advanced goal setting', status: 'completed', percentage: 100, priority: 'high' },
            { id: 'opt-4', name: 'Writing wellness system', status: 'completed', percentage: 100, priority: 'medium' },
            { id: 'opt-5', name: 'Personal reflection dashboard', status: 'completed', percentage: 100, priority: 'high' }
          ]
        },
        {
          phaseNumber: 6,
          phaseName: 'Personal Mastery and Legacy',
          totalTasks: 5,
          completedTasks: 5,
          percentage: 100,
          startedAt: new Date('2024-01-06'),
          completedAt: new Date(),
          subTasks: [
            { id: 'mas-1', name: 'Writing mastery assessment', status: 'completed', percentage: 100, priority: 'high' },
            { id: 'mas-2', name: 'Personal legacy management', status: 'completed', percentage: 100, priority: 'high' },
            { id: 'mas-3', name: 'Personal knowledge base', status: 'completed', percentage: 100, priority: 'medium' },
            { id: 'mas-4', name: 'Writing philosophy tracker', status: 'completed', percentage: 100, priority: 'medium' },
            { id: 'mas-5', name: 'Achievement celebration system', status: 'completed', percentage: 100, priority: 'high' }
          ]
        },
        {
          phaseNumber: 7,
          phaseName: 'Advanced Personal Intelligence',
          totalTasks: 5,
          completedTasks: 0,
          percentage: 0,
          currentTask: 'Starting Phase 7 implementation',
          startedAt: new Date(),
          subTasks: [
            { id: 'adv-1', name: 'Predictive writing assistant', status: 'pending', percentage: 0, priority: 'critical', estimatedHours: 8 },
            { id: 'adv-2', name: 'Emotional intelligence system', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 6 },
            { id: 'adv-3', name: 'Pattern recognition engine', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 7 },
            { id: 'adv-4', name: 'Learning curriculum generator', status: 'pending', percentage: 0, priority: 'medium', estimatedHours: 5 },
            { id: 'adv-5', name: 'Voice and style coach', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 6 }
          ]
        },
        {
          phaseNumber: 8,
          phaseName: 'Personal Workflow Automation',
          totalTasks: 5,
          completedTasks: 0,
          percentage: 0,
          startedAt: new Date(),
          subTasks: [
            { id: 'wf-1', name: 'Smart templates and snippets', status: 'pending', percentage: 0, priority: 'medium', estimatedHours: 4 },
            { id: 'wf-2', name: 'Automated research assistant', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 8 },
            { id: 'wf-3', name: 'Writing project automation', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 6 },
            { id: 'wf-4', name: 'Intelligent backup and versioning', status: 'pending', percentage: 0, priority: 'critical', estimatedHours: 5 },
            { id: 'wf-5', name: 'Cross-platform synchronization', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 7 }
          ]
        },
        {
          phaseNumber: 9,
          phaseName: 'Personal Publishing Platform',
          totalTasks: 5,
          completedTasks: 0,
          percentage: 0,
          startedAt: new Date(),
          subTasks: [
            { id: 'pub-1', name: 'Multi-format export engine', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 6 },
            { id: 'pub-2', name: 'Personal blog integration', status: 'pending', percentage: 0, priority: 'medium', estimatedHours: 5 },
            { id: 'pub-3', name: 'E-book generator', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 7 },
            { id: 'pub-4', name: 'Print formatting tools', status: 'pending', percentage: 0, priority: 'medium', estimatedHours: 4 },
            { id: 'pub-5', name: 'Distribution management', status: 'pending', percentage: 0, priority: 'low', estimatedHours: 3 }
          ]
        },
        {
          phaseNumber: 10,
          phaseName: 'Ultimate Personal Assistant',
          totalTasks: 5,
          completedTasks: 0,
          percentage: 0,
          startedAt: new Date(),
          subTasks: [
            { id: 'ult-1', name: 'Complete AI integration', status: 'pending', percentage: 0, priority: 'critical', estimatedHours: 10 },
            { id: 'ult-2', name: 'Predictive project planning', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 8 },
            { id: 'ult-3', name: 'Personal writing mentor', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 9 },
            { id: 'ult-4', name: 'Career development tools', status: 'pending', percentage: 0, priority: 'medium', estimatedHours: 6 },
            { id: 'ult-5', name: 'Legacy preservation system', status: 'pending', percentage: 0, priority: 'high', estimatedHours: 7 }
          ]
        }
      ]
    };
  }

  private loadProgress(): void {
    const saved = localStorage.getItem('astralProgressTracker');
    if (saved) {
      this.overallProgress = JSON.parse(saved);
    }
    
    const savedUpdates = localStorage.getItem('astralProgressUpdates');
    if (savedUpdates) {
      this.updates = JSON.parse(savedUpdates);
    }

    this.calculateVelocity();
  }

  private saveProgress(): void {
    localStorage.setItem('astralProgressTracker', JSON.stringify(this.overallProgress));
    localStorage.setItem('astralProgressUpdates', JSON.stringify(this.updates.slice(-100)));
  }

  private calculateVelocity(): void {
    const daysSinceStart = Math.max(1, 
      Math.floor((Date.now() - new Date(this.overallProgress.startDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    
    const totalCompletedTasks = this.overallProgress.phases.reduce(
      (sum, phase) => sum + phase.completedTasks, 0
    );
    
    this.overallProgress.velocity = totalCompletedTasks / daysSinceStart;
    
    // Estimate completion
    const remainingTasks = this.overallProgress.phases.reduce(
      (sum, phase) => sum + (phase.totalTasks - phase.completedTasks), 0
    );
    
    if (this.overallProgress.velocity > 0) {
      const daysToCompletion = remainingTasks / this.overallProgress.velocity;
      this.overallProgress.estimatedCompletionDate = new Date(
        Date.now() + (daysToCompletion * 24 * 60 * 60 * 1000)
      );
    }
  }

  public updateTaskProgress(phaseNumber: number, taskId: string, status: TaskProgress['status'], percentage: number): void {
    const phase = this.overallProgress.phases.find(p => p.phaseNumber === phaseNumber);
    if (!phase) return;

    const task = phase.subTasks.find(t => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.status === 'completed';
    task.status = status;
    task.percentage = percentage;

    if (status === 'in_progress' && !task.startedAt) {
      task.startedAt = new Date();
      phase.currentTask = task.name;
    }

    if (status === 'completed' && !wasCompleted) {
      task.completedAt = new Date();
      task.actualHours = task.startedAt ? 
        (task.completedAt.getTime() - task.startedAt.getTime()) / (1000 * 60 * 60) : 
        task.estimatedHours;
      
      phase.completedTasks++;
    }

    // Update phase percentage
    phase.percentage = (phase.completedTasks / phase.totalTasks) * 100;

    // Check if phase is complete
    if (phase.completedTasks === phase.totalTasks && !phase.completedAt) {
      phase.completedAt = new Date();
      this.overallProgress.completedPhases++;
      
      this.addUpdate({
        timestamp: new Date(),
        type: 'phase_completed',
        phaseNumber,
        message: `Phase ${phaseNumber}: ${phase.phaseName} completed!`,
        percentageChange: 10
      });

      // Auto-start next phase if exists
      const nextPhase = this.overallProgress.phases.find(p => p.phaseNumber === phaseNumber + 1);
      if (nextPhase && !nextPhase.startedAt) {
        nextPhase.startedAt = new Date();
        this.overallProgress.currentPhase = nextPhase.phaseNumber;
      }
    }

    // Update overall percentage
    this.updateOverallPercentage();
    
    this.overallProgress.lastUpdateDate = new Date();
    this.calculateVelocity();
    this.saveProgress();
    
    this.emit('progressUpdate', this.getProgressSummary());
  }

  private updateOverallPercentage(): void {
    const totalTasks = this.overallProgress.phases.reduce((sum, phase) => sum + phase.totalTasks, 0);
    const completedTasks = this.overallProgress.phases.reduce((sum, phase) => sum + phase.completedTasks, 0);
    this.overallProgress.overallPercentage = Math.round((completedTasks / totalTasks) * 100);
  }

  private addUpdate(update: ProgressUpdate): void {
    this.updates.push(update);
    this.emit('update', update);
  }

  public getProgressSummary(): string {
    const current = this.overallProgress.phases.find(p => p.phaseNumber === this.overallProgress.currentPhase);
    const remainingPhases = this.overallProgress.totalPhases - this.overallProgress.completedPhases;
    const remainingTasks = this.overallProgress.phases.reduce(
      (sum, phase) => sum + (phase.totalTasks - phase.completedTasks), 0
    );

    const summary = `
📊 **ASTRAL_NOTES Development Progress**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Progress: ${this.overallProgress.overallPercentage}% Complete
[${this.generateProgressBar(this.overallProgress.overallPercentage)}]

📍 **Current Status**
• Phase: ${current?.phaseNumber}/${this.overallProgress.totalPhases} - ${current?.phaseName}
• Current Task: ${current?.currentTask || 'Setting up next task...'}
• Phase Progress: ${current?.percentage.toFixed(1)}% (${current?.completedTasks}/${current?.totalTasks} tasks)

📈 **Statistics**
• Completed Phases: ${this.overallProgress.completedPhases}/${this.overallProgress.totalPhases}
• Remaining Tasks: ${remainingTasks}
• Velocity: ${this.overallProgress.velocity.toFixed(2)} tasks/day
• Est. Completion: ${this.overallProgress.estimatedCompletionDate?.toLocaleDateString() || 'Calculating...'}

🎯 **Remaining Phases** (${remainingPhases} phases)
${this.overallProgress.phases
  .filter(p => p.phaseNumber > this.overallProgress.completedPhases)
  .slice(0, 3)
  .map(p => `  ${p.phaseNumber}. ${p.phaseName} - ${p.subTasks.length} tasks`)
  .join('\n')}

⏱️ **Recent Activity**
${this.updates.slice(-3).reverse().map(u => `  • ${u.message}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return summary;
  }

  private generateProgressBar(percentage: number): string {
    const filled = Math.floor(percentage / 2.5);
    const empty = 40 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  public getCurrentPhaseTasks(): TaskProgress[] {
    const current = this.overallProgress.phases.find(
      p => p.phaseNumber === this.overallProgress.currentPhase
    );
    return current?.subTasks || [];
  }

  public startPhase(phaseNumber: number): void {
    const phase = this.overallProgress.phases.find(p => p.phaseNumber === phaseNumber);
    if (!phase) return;

    phase.startedAt = new Date();
    this.overallProgress.currentPhase = phaseNumber;
    this.currentPhaseStartTime = new Date();

    this.addUpdate({
      timestamp: new Date(),
      type: 'phase_started',
      phaseNumber,
      message: `Started Phase ${phaseNumber}: ${phase.phaseName}`,
      percentageChange: 0
    });

    this.saveProgress();
    this.emit('phaseStarted', phase);
  }

  public getTimeMetrics(): {
    totalDays: number;
    averagePhaseTime: number;
    currentPhaseTime: number;
    estimatedRemainingDays: number;
  } {
    const totalDays = Math.floor(
      (Date.now() - new Date(this.overallProgress.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const completedPhaseTimes = this.overallProgress.phases
      .filter(p => p.completedAt)
      .map(p => (p.completedAt!.getTime() - p.startedAt.getTime()) / (1000 * 60 * 60 * 24));

    const averagePhaseTime = completedPhaseTimes.length > 0
      ? completedPhaseTimes.reduce((a, b) => a + b, 0) / completedPhaseTimes.length
      : 1;

    const currentPhaseTime = Math.floor(
      (Date.now() - this.currentPhaseStartTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    const remainingPhases = this.overallProgress.totalPhases - this.overallProgress.completedPhases;
    const estimatedRemainingDays = Math.ceil(remainingPhases * averagePhaseTime);

    return {
      totalDays,
      averagePhaseTime,
      currentPhaseTime,
      estimatedRemainingDays
    };
  }

  public exportProgress(): string {
    return JSON.stringify({
      progress: this.overallProgress,
      updates: this.updates,
      exportDate: new Date()
    }, null, 2);
  }
}

export const progressTrackerService = new ProgressTrackerService();
export default progressTrackerService;