import { EventEmitter } from 'events';

export interface WritingProject {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  genre?: string;
  targetWordCount?: number;
  currentWordCount: number;
  deadline?: Date;
  startDate: Date;
  lastModified: Date;
  completedDate?: Date;
  structure: ProjectStructure;
  automation: AutomationConfig;
  collaboration?: CollaborationSettings;
  metadata: ProjectMetadata;
  milestones: Milestone[];
  tasks: ProjectTask[];
  files: ProjectFile[];
  notes: ProjectNote[];
  analytics: ProjectAnalytics;
}

export type ProjectType = 
  | 'novel' | 'short-story' | 'novella' | 'screenplay' | 'play'
  | 'blog-series' | 'article-series' | 'academic-paper'
  | 'poetry-collection' | 'memoir' | 'biography'
  | 'technical-manual' | 'course-material' | 'custom';

export type ProjectStatus = 
  | 'planning' | 'outlining' | 'first-draft' | 'revision'
  | 'editing' | 'proofreading' | 'formatting' | 'completed'
  | 'published' | 'on-hold' | 'abandoned';

export interface ProjectStructure {
  format: 'linear' | 'chapters' | 'scenes' | 'acts' | 'sections' | 'custom';
  elements: StructureElement[];
  outline?: ProjectOutline;
  characterArcs?: CharacterArc[];
  plotLines?: PlotLine[];
  themes?: Theme[];
}

export interface StructureElement {
  id: string;
  type: 'part' | 'chapter' | 'scene' | 'section' | 'act';
  title: string;
  description?: string;
  order: number;
  wordCount: number;
  targetWordCount?: number;
  status: 'planned' | 'in-progress' | 'completed' | 'needs-revision';
  notes?: string;
  dependencies?: string[];
  children?: StructureElement[];
}

export interface ProjectOutline {
  id: string;
  format: 'three-act' | 'hero-journey' | 'freytag' | 'scene-sequence' | 'custom';
  beats: OutlineBeat[];
  completed: boolean;
  lastUpdated: Date;
}

export interface OutlineBeat {
  id: string;
  name: string;
  description: string;
  position: number;
  estimatedWords?: number;
  actualWords?: number;
  completed: boolean;
  notes?: string;
}

export interface CharacterArc {
  id: string;
  characterId: string;
  name: string;
  startState: string;
  endState: string;
  keyMoments: ArcMoment[];
  completed: boolean;
}

export interface ArcMoment {
  id: string;
  description: string;
  location: string; // chapter/scene reference
  impact: 'minor' | 'moderate' | 'major' | 'climactic';
}

export interface PlotLine {
  id: string;
  name: string;
  type: 'main' | 'subplot' | 'romance' | 'mystery' | 'character';
  description: string;
  events: PlotEvent[];
  resolution?: string;
  completed: boolean;
}

export interface PlotEvent {
  id: string;
  description: string;
  location: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  foreshadowing?: string[];
  consequences?: string[];
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  exploration: ThemeExploration[];
  resolution?: string;
}

export interface ThemeExploration {
  location: string;
  method: 'dialogue' | 'action' | 'symbolism' | 'metaphor' | 'conflict';
  description: string;
}

export interface AutomationConfig {
  enabled: boolean;
  rules: AutomationRule[];
  schedules: AutomatedSchedule[];
  workflows: ProjectWorkflow[];
  notifications: NotificationSettings;
  backups: BackupSettings;
  sync: SyncSettings;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  lastTriggered?: Date;
}

export interface AutomationTrigger {
  type: 'word-count' | 'time' | 'status-change' | 'deadline' | 'inactivity' | 'milestone';
  value: any;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}

export interface AutomationCondition {
  type: 'word-count' | 'time-range' | 'status' | 'deadline-proximity' | 'custom';
  operator: 'equals' | 'greater' | 'less' | 'between' | 'contains';
  value: any;
}

export interface AutomationAction {
  type: 'notification' | 'backup' | 'status-update' | 'email' | 'export' | 'sync' | 'custom';
  parameters: any;
  delay?: number;
}

export interface AutomatedSchedule {
  id: string;
  name: string;
  type: 'writing-session' | 'review' | 'backup' | 'sync' | 'deadline-check';
  schedule: SchedulePattern;
  actions: AutomationAction[];
  enabled: boolean;
}

export interface SchedulePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'cron';
  pattern: string; // cron expression or simple pattern
  timezone?: string;
}

export interface ProjectWorkflow {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
  currentStage: number;
  automated: boolean;
  customizable: boolean;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  tasks: StageTask[];
  requirements: StageRequirement[];
  automatedActions?: AutomationAction[];
  estimated_duration?: number;
}

export interface StageTask {
  id: string;
  name: string;
  description: string;
  type: 'writing' | 'editing' | 'research' | 'planning' | 'review' | 'formatting';
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  assignee?: string;
  deadline?: Date;
  dependencies?: string[];
}

export interface StageRequirement {
  type: 'word-count' | 'completion' | 'approval' | 'time' | 'quality';
  value: any;
  met: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours?: TimeRange;
}

export interface NotificationChannel {
  type: 'in-app' | 'email' | 'desktop' | 'mobile' | 'webhook';
  enabled: boolean;
  settings?: any;
}

export interface TimeRange {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  retention: number; // days
  location: 'local' | 'cloud' | 'both';
  versioning: boolean;
  compression: boolean;
}

export interface SyncSettings {
  enabled: boolean;
  platforms: SyncPlatform[];
  conflict_resolution: 'manual' | 'latest-wins' | 'merge' | 'branch';
  sync_frequency: 'real-time' | 'manual' | 'scheduled';
}

export interface SyncPlatform {
  type: 'google-drive' | 'dropbox' | 'onedrive' | 'git' | 'custom';
  enabled: boolean;
  settings: any;
}

export interface CollaborationSettings {
  enabled: boolean;
  collaborators: Collaborator[];
  permissions: Permission[];
  review_workflow: ReviewWorkflow;
  comments: CommentSettings;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'reviewer' | 'reader';
  permissions: string[];
  invited_at: Date;
  last_active?: Date;
}

export interface Permission {
  action: 'read' | 'write' | 'comment' | 'delete' | 'admin';
  scope: 'all' | 'sections' | 'chapters' | 'specific';
  targets?: string[];
}

export interface ReviewWorkflow {
  enabled: boolean;
  stages: ReviewStage[];
  auto_progress: boolean;
}

export interface ReviewStage {
  id: string;
  name: string;
  reviewers: string[];
  approval_required: boolean;
  deadline?: number; // days
}

export interface CommentSettings {
  enabled: boolean;
  inline_comments: boolean;
  threaded_comments: boolean;
  anonymous_allowed: boolean;
  moderation: boolean;
}

export interface ProjectMetadata {
  created_by: string;
  template_used?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  version: string;
  word_count_history: WordCountEntry[];
  time_tracking: TimeEntry[];
  quality_metrics: QualityMetric[];
}

export interface WordCountEntry {
  date: Date;
  count: number;
  session_words: number;
  element_id?: string;
}

export interface TimeEntry {
  date: Date;
  duration: number; // minutes
  activity: 'writing' | 'editing' | 'planning' | 'research' | 'review';
  element_id?: string;
}

export interface QualityMetric {
  date: Date;
  metric: 'readability' | 'complexity' | 'sentiment' | 'consistency' | 'style';
  value: number;
  element_id?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  type: 'word-count' | 'completion' | 'deadline' | 'quality' | 'custom';
  target_value: any;
  current_value: any;
  target_date?: Date;
  completed: boolean;
  completed_date?: Date;
  celebration?: CelebrationConfig;
}

export interface CelebrationConfig {
  enabled: boolean;
  type: 'notification' | 'animation' | 'sound' | 'share';
  message?: string;
  custom_action?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  assignee?: string;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  dependencies: string[];
  tags: string[];
  created_at: Date;
  completed_at?: Date;
  subtasks?: ProjectTask[];
}

export type TaskType = 
  | 'writing' | 'editing' | 'research' | 'planning' | 'review'
  | 'formatting' | 'publishing' | 'marketing' | 'admin';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  type: 'document' | 'research' | 'image' | 'audio' | 'video' | 'other';
  size: number;
  created_at: Date;
  modified_at: Date;
  version: number;
  locked_by?: string;
  element_id?: string;
  tags: string[];
}

export interface ProjectNote {
  id: string;
  title?: string;
  content: string;
  type: 'general' | 'character' | 'plot' | 'research' | 'idea' | 'todo';
  created_at: Date;
  modified_at: Date;
  tags: string[];
  linked_elements: string[];
  attachments: string[];
}

export interface ProjectAnalytics {
  total_words: number;
  daily_average: number;
  writing_streak: number;
  completion_percentage: number;
  time_spent: number; // hours
  productivity_score: number;
  quality_score: number;
  milestone_progress: MilestoneProgress[];
  writing_patterns: WritingPattern[];
  performance_trends: PerformanceTrend[];
}

export interface MilestoneProgress {
  milestone_id: string;
  progress_percentage: number;
  estimated_completion?: Date;
  on_track: boolean;
}

export interface WritingPattern {
  type: 'time' | 'word-count' | 'quality' | 'consistency';
  pattern: string;
  confidence: number;
  recommendations: string[];
}

export interface PerformanceTrend {
  metric: 'productivity' | 'quality' | 'consistency' | 'engagement';
  trend: 'improving' | 'declining' | 'stable';
  change_rate: number;
  period: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: ProjectStructure;
  default_workflows: ProjectWorkflow[];
  automation_rules: AutomationRule[];
  milestones: Milestone[];
  estimated_duration: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
}

class ProjectAutomationService extends EventEmitter {
  private projects: Map<string, WritingProject> = new Map();
  private templates: Map<string, ProjectTemplate> = new Map();
  private activeProject: WritingProject | null = null;
  private automationEngine: AutomationEngine;
  private workflowEngine: WorkflowEngine;
  private analyticsEngine: AnalyticsEngine;
  private collaborationManager: CollaborationManager;

  constructor() {
    super();
    this.automationEngine = new AutomationEngine(this);
    this.workflowEngine = new WorkflowEngine(this);
    this.analyticsEngine = new AnalyticsEngine(this);
    this.collaborationManager = new CollaborationManager(this);
    this.initializeTemplates();
    this.loadProjects();
    this.startAutomationEngine();
  }

  private initializeTemplates(): void {
    const defaultTemplates: ProjectTemplate[] = [
      {
        id: 'tpl-novel',
        name: 'Novel Project',
        description: 'Standard novel writing project with chapters',
        category: 'fiction',
        structure: {
          format: 'chapters',
          elements: [
            {
              id: 'ch1',
              type: 'chapter',
              title: 'Chapter 1',
              description: 'Opening chapter',
              order: 1,
              wordCount: 0,
              targetWordCount: 3000,
              status: 'planned'
            }
          ]
        },
        default_workflows: [
          {
            id: 'novel-workflow',
            name: 'Novel Writing Workflow',
            description: 'Standard novel writing process',
            stages: [
              {
                id: 'planning',
                name: 'Planning & Outlining',
                description: 'Create outline and plan story structure',
                tasks: [
                  {
                    id: 'outline',
                    name: 'Create Story Outline',
                    description: 'Develop detailed story outline',
                    type: 'planning',
                    status: 'pending'
                  },
                  {
                    id: 'characters',
                    name: 'Develop Characters',
                    description: 'Create character profiles',
                    type: 'planning',
                    status: 'pending'
                  }
                ],
                requirements: [
                  {
                    type: 'completion',
                    value: 'outline',
                    met: false
                  }
                ]
              },
              {
                id: 'first-draft',
                name: 'First Draft',
                description: 'Write the complete first draft',
                tasks: [
                  {
                    id: 'write-draft',
                    name: 'Write First Draft',
                    description: 'Complete first draft writing',
                    type: 'writing',
                    status: 'pending'
                  }
                ],
                requirements: [
                  {
                    type: 'word-count',
                    value: 80000,
                    met: false
                  }
                ]
              }
            ],
            currentStage: 0,
            automated: true,
            customizable: true
          }
        ],
        automation_rules: [
          {
            id: 'daily-backup',
            name: 'Daily Backup',
            trigger: {
              type: 'time',
              value: '18:00',
              frequency: 'daily'
            },
            conditions: [],
            actions: [
              {
                type: 'backup',
                parameters: { type: 'incremental' }
              }
            ],
            enabled: true
          }
        ],
        milestones: [
          {
            id: 'first-10k',
            name: 'First 10,000 Words',
            type: 'word-count',
            target_value: 10000,
            current_value: 0,
            completed: false
          },
          {
            id: 'halfway',
            name: 'Halfway Point',
            type: 'word-count',
            target_value: 40000,
            current_value: 0,
            completed: false
          },
          {
            id: 'first-draft-complete',
            name: 'First Draft Complete',
            type: 'completion',
            target_value: 'first-draft',
            current_value: 0,
            completed: false
          }
        ],
        estimated_duration: 180, // days
        complexity: 'complex'
      },
      {
        id: 'tpl-short-story',
        name: 'Short Story Project',
        description: 'Short story writing project',
        category: 'fiction',
        structure: {
          format: 'linear',
          elements: [
            {
              id: 'story',
              type: 'section',
              title: 'Short Story',
              description: 'Complete short story',
              order: 1,
              wordCount: 0,
              targetWordCount: 5000,
              status: 'planned'
            }
          ]
        },
        default_workflows: [],
        automation_rules: [],
        milestones: [
          {
            id: 'complete',
            name: 'Story Complete',
            type: 'word-count',
            target_value: 5000,
            current_value: 0,
            completed: false
          }
        ],
        estimated_duration: 7,
        complexity: 'simple'
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private loadProjects(): void {
    const savedProjects = localStorage.getItem('writingProjects');
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      Object.entries(parsed).forEach(([id, project]) => {
        this.projects.set(id, project as WritingProject);
      });
    }

    const activeProjectId = localStorage.getItem('activeProject');
    if (activeProjectId) {
      this.activeProject = this.projects.get(activeProjectId) || null;
    }
  }

  private saveProjects(): void {
    localStorage.setItem('writingProjects', 
      JSON.stringify(Object.fromEntries(this.projects))
    );
    
    if (this.activeProject) {
      localStorage.setItem('activeProject', this.activeProject.id);
    }
  }

  private startAutomationEngine(): void {
    this.automationEngine.start();
    this.workflowEngine.start();
    
    // Start periodic analytics updates
    setInterval(() => {
      if (this.activeProject) {
        this.updateProjectAnalytics(this.activeProject.id);
      }
    }, 60000); // Every minute
  }

  public createProject(
    name: string,
    type: ProjectType,
    templateId?: string
  ): WritingProject {
    const template = templateId ? this.templates.get(templateId) : null;
    
    const project: WritingProject = {
      id: `proj-${Date.now()}`,
      name,
      type,
      status: 'planning',
      priority: 'medium',
      currentWordCount: 0,
      startDate: new Date(),
      lastModified: new Date(),
      structure: template?.structure || {
        format: 'linear',
        elements: []
      },
      automation: {
        enabled: true,
        rules: template?.automation_rules || [],
        schedules: [],
        workflows: template?.default_workflows || [],
        notifications: {
          enabled: true,
          channels: [
            { type: 'in-app', enabled: true }
          ],
          frequency: 'daily'
        },
        backups: {
          enabled: true,
          frequency: 'daily',
          retention: 30,
          location: 'local',
          versioning: true,
          compression: false
        },
        sync: {
          enabled: false,
          platforms: [],
          conflict_resolution: 'manual',
          sync_frequency: 'manual'
        }
      },
      metadata: {
        created_by: 'current-user',
        template_used: templateId,
        tags: [],
        custom_fields: {},
        version: '1.0.0',
        word_count_history: [],
        time_tracking: [],
        quality_metrics: []
      },
      milestones: template?.milestones || [],
      tasks: [],
      files: [],
      notes: [],
      analytics: this.initializeAnalytics()
    };

    this.projects.set(project.id, project);
    this.activeProject = project;
    this.saveProjects();
    
    // Initialize automation for the project
    this.automationEngine.initializeProject(project);
    
    this.emit('projectCreated', project);
    return project;
  }

  private initializeAnalytics(): ProjectAnalytics {
    return {
      total_words: 0,
      daily_average: 0,
      writing_streak: 0,
      completion_percentage: 0,
      time_spent: 0,
      productivity_score: 0,
      quality_score: 0,
      milestone_progress: [],
      writing_patterns: [],
      performance_trends: []
    };
  }

  public updateWordCount(elementId: string, wordCount: number): void {
    if (!this.activeProject) return;

    const element = this.findStructureElement(this.activeProject.structure.elements, elementId);
    if (element) {
      const previousCount = element.wordCount;
      element.wordCount = wordCount;
      
      // Update project total
      const wordDiff = wordCount - previousCount;
      this.activeProject.currentWordCount += wordDiff;
      this.activeProject.lastModified = new Date();

      // Record in history
      this.activeProject.metadata.word_count_history.push({
        date: new Date(),
        count: this.activeProject.currentWordCount,
        session_words: wordDiff,
        element_id: elementId
      });

      // Check milestones
      this.checkMilestones();

      // Trigger automation rules
      this.automationEngine.trigger('word-count', {
        project: this.activeProject,
        element: element,
        wordCount,
        wordDiff
      });

      this.saveProjects();
      this.emit('wordCountUpdated', { elementId, wordCount, wordDiff });
    }
  }

  private findStructureElement(
    elements: StructureElement[],
    id: string
  ): StructureElement | null {
    for (const element of elements) {
      if (element.id === id) return element;
      if (element.children) {
        const found = this.findStructureElement(element.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private checkMilestones(): void {
    if (!this.activeProject) return;

    this.activeProject.milestones.forEach(milestone => {
      if (milestone.completed) return;

      let achieved = false;
      
      switch (milestone.type) {
        case 'word-count':
          achieved = this.activeProject!.currentWordCount >= milestone.target_value;
          milestone.current_value = this.activeProject!.currentWordCount;
          break;
        
        case 'completion':
          const element = this.findStructureElement(
            this.activeProject!.structure.elements,
            milestone.target_value
          );
          achieved = element?.status === 'completed';
          milestone.current_value = achieved ? 1 : 0;
          break;
      }

      if (achieved) {
        milestone.completed = true;
        milestone.completed_date = new Date();
        
        this.emit('milestoneAchieved', milestone);
        
        // Trigger celebration if configured
        if (milestone.celebration?.enabled) {
          this.triggerCelebration(milestone);
        }
      }
    });
  }

  private triggerCelebration(milestone: Milestone): void {
    if (!milestone.celebration) return;

    switch (milestone.celebration.type) {
      case 'notification':
        this.emit('notification', {
          type: 'milestone',
          title: `Milestone Achieved: ${milestone.name}`,
          message: milestone.celebration.message || milestone.description,
          milestone
        });
        break;
      
      case 'animation':
        this.emit('celebration', {
          type: 'animation',
          milestone
        });
        break;
      
      case 'share':
        this.emit('sharePrompt', {
          type: 'milestone',
          milestone,
          message: milestone.celebration.message
        });
        break;
    }
  }

  public addTask(
    title: string,
    description: string,
    type: TaskType,
    options?: Partial<ProjectTask>
  ): ProjectTask {
    if (!this.activeProject) throw new Error('No active project');

    const task: ProjectTask = {
      id: `task-${Date.now()}`,
      title,
      description,
      type,
      priority: options?.priority || 'medium',
      status: 'todo',
      dependencies: options?.dependencies || [],
      tags: options?.tags || [],
      created_at: new Date(),
      due_date: options?.due_date,
      estimated_hours: options?.estimated_hours,
      assignee: options?.assignee
    };

    this.activeProject.tasks.push(task);
    this.activeProject.lastModified = new Date();
    this.saveProjects();

    this.emit('taskAdded', task);
    return task;
  }

  public updateTaskStatus(taskId: string, status: ProjectTask['status']): void {
    if (!this.activeProject) return;

    const task = this.activeProject.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      
      if (status === 'completed') {
        task.completed_at = new Date();
      }

      this.activeProject.lastModified = new Date();
      this.saveProjects();

      this.emit('taskStatusChanged', task);

      // Check if this completes any workflow stage
      this.workflowEngine.checkStageCompletion(this.activeProject);
    }
  }

  public updateProjectAnalytics(projectId: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    const analytics = this.analyticsEngine.calculateAnalytics(project);
    project.analytics = analytics;
    
    this.saveProjects();
    this.emit('analyticsUpdated', { projectId, analytics });
  }

  public setActiveProject(projectId: string): void {
    const project = this.projects.get(projectId);
    if (project) {
      this.activeProject = project;
      localStorage.setItem('activeProject', projectId);
      this.emit('activeProjectChanged', project);
    }
  }

  public getProjectTemplates(): ProjectTemplate[] {
    return Array.from(this.templates.values());
  }

  public getProjects(): WritingProject[] {
    return Array.from(this.projects.values());
  }

  public getActiveProject(): WritingProject | null {
    return this.activeProject;
  }

  public addAutomationRule(rule: Omit<AutomationRule, 'id'>): AutomationRule {
    if (!this.activeProject) throw new Error('No active project');

    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };

    this.activeProject.automation.rules.push(newRule);
    this.automationEngine.registerRule(newRule, this.activeProject);
    this.saveProjects();

    this.emit('automationRuleAdded', newRule);
    return newRule;
  }

  public enableCollaboration(settings: CollaborationSettings): void {
    if (!this.activeProject) throw new Error('No active project');

    this.activeProject.collaboration = settings;
    this.collaborationManager.initializeProject(this.activeProject);
    this.saveProjects();

    this.emit('collaborationEnabled', settings);
  }

  public exportProject(projectId: string, format: 'json' | 'markdown' | 'docx'): string {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');

    switch (format) {
      case 'json':
        return JSON.stringify(project, null, 2);
      
      case 'markdown':
        return this.exportToMarkdown(project);
      
      case 'docx':
        return this.exportToDocx(project);
      
      default:
        throw new Error('Unsupported format');
    }
  }

  private exportToMarkdown(project: WritingProject): string {
    let markdown = `# ${project.name}\n\n`;
    
    if (project.description) {
      markdown += `${project.description}\n\n`;
    }

    markdown += `**Status**: ${project.status}\n`;
    markdown += `**Word Count**: ${project.currentWordCount.toLocaleString()}\n`;
    markdown += `**Created**: ${project.startDate.toLocaleDateString()}\n\n`;

    // Add structure elements
    project.structure.elements.forEach(element => {
      markdown += `## ${element.title}\n\n`;
      if (element.description) {
        markdown += `${element.description}\n\n`;
      }
      markdown += `Words: ${element.wordCount} / ${element.targetWordCount || 'No target'}\n\n`;
    });

    return markdown;
  }

  private exportToDocx(project: WritingProject): string {
    // Would integrate with a library like docx or mammoth for actual DOCX generation
    return `DOCX export for ${project.name} - ${project.currentWordCount} words`;
  }

  public importProject(data: string, format: 'json'): WritingProject {
    const projectData = JSON.parse(data);
    
    // Generate new ID to avoid conflicts
    projectData.id = `proj-${Date.now()}`;
    projectData.name = `${projectData.name} (Imported)`;
    
    this.projects.set(projectData.id, projectData);
    this.saveProjects();
    
    this.emit('projectImported', projectData);
    return projectData;
  }
}

class AutomationEngine {
  private service: ProjectAutomationService;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(service: ProjectAutomationService) {
    this.service = service;
  }

  start(): void {
    // Start checking automation rules periodically
    setInterval(() => this.checkScheduledRules(), 60000); // Every minute
  }

  initializeProject(project: WritingProject): void {
    project.automation.rules.forEach(rule => {
      this.registerRule(rule, project);
    });
  }

  registerRule(rule: AutomationRule, project: WritingProject): void {
    if (!rule.enabled) return;

    // Set up trigger monitoring based on rule type
    switch (rule.trigger.type) {
      case 'time':
        this.scheduleTimeBasedRule(rule, project);
        break;
      
      case 'word-count':
      case 'status-change':
      case 'milestone':
        // These are triggered by events, no setup needed
        break;
    }
  }

  private scheduleTimeBasedRule(rule: AutomationRule, project: WritingProject): void {
    if (rule.trigger.frequency === 'daily') {
      const interval = setInterval(() => {
        if (this.checkConditions(rule.conditions, project)) {
          this.executeActions(rule.actions, project);
          rule.lastTriggered = new Date();
        }
      }, 24 * 60 * 60 * 1000); // Daily

      this.intervals.set(rule.id, interval);
    }
  }

  trigger(eventType: string, data: any): void {
    const project = data.project as WritingProject;
    
    project.automation.rules.forEach(rule => {
      if (!rule.enabled) return;
      
      if (this.matchesTrigger(rule.trigger, eventType, data)) {
        if (this.checkConditions(rule.conditions, project)) {
          this.executeActions(rule.actions, project);
          rule.lastTriggered = new Date();
        }
      }
    });
  }

  private matchesTrigger(trigger: AutomationTrigger, eventType: string, data: any): boolean {
    switch (trigger.type) {
      case 'word-count':
        return eventType === 'word-count' && data.wordCount >= trigger.value;
      
      case 'status-change':
        return eventType === 'status-change' && data.status === trigger.value;
      
      case 'milestone':
        return eventType === 'milestone' && data.milestoneId === trigger.value;
      
      default:
        return false;
    }
  }

  private checkConditions(conditions: AutomationCondition[], project: WritingProject): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'word-count':
          return this.compareValues(
            project.currentWordCount,
            condition.operator,
            condition.value
          );
        
        case 'status':
          return condition.operator === 'equals' && project.status === condition.value;
        
        default:
          return true;
      }
    });
  }

  private compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'equals': return actual === expected;
      case 'greater': return actual > expected;
      case 'less': return actual < expected;
      default: return false;
    }
  }

  private executeActions(actions: AutomationAction[], project: WritingProject): void {
    actions.forEach(action => {
      setTimeout(() => {
        this.executeAction(action, project);
      }, action.delay || 0);
    });
  }

  private executeAction(action: AutomationAction, project: WritingProject): void {
    switch (action.type) {
      case 'notification':
        this.service.emit('notification', {
          type: 'automation',
          title: action.parameters.title,
          message: action.parameters.message,
          project
        });
        break;
      
      case 'backup':
        this.service.emit('backupRequested', {
          project,
          type: action.parameters.type
        });
        break;
      
      case 'status-update':
        project.status = action.parameters.status;
        this.service.emit('statusUpdated', { project, status: action.parameters.status });
        break;
      
      case 'sync':
        this.service.emit('syncRequested', { project });
        break;
    }
  }

  private checkScheduledRules(): void {
    // Check time-based rules
    const now = new Date();
    // Implementation for checking scheduled rules
  }
}

class WorkflowEngine {
  private service: ProjectAutomationService;

  constructor(service: ProjectAutomationService) {
    this.service = service;
  }

  start(): void {
    // Initialize workflow monitoring
  }

  checkStageCompletion(project: WritingProject): void {
    project.automation.workflows.forEach(workflow => {
      const currentStage = workflow.stages[workflow.currentStage];
      if (currentStage && this.isStageComplete(currentStage, project)) {
        this.advanceWorkflow(workflow, project);
      }
    });
  }

  private isStageComplete(stage: WorkflowStage, project: WritingProject): boolean {
    // Check if all requirements are met
    return stage.requirements.every(req => {
      switch (req.type) {
        case 'completion':
          const task = project.tasks.find(t => t.id === req.value);
          return task?.status === 'completed';
        
        case 'word-count':
          return project.currentWordCount >= req.value;
        
        default:
          return req.met;
      }
    });
  }

  private advanceWorkflow(workflow: ProjectWorkflow, project: WritingProject): void {
    if (workflow.currentStage < workflow.stages.length - 1) {
      workflow.currentStage++;
      
      const nextStage = workflow.stages[workflow.currentStage];
      
      // Execute automated actions for new stage
      if (nextStage.automatedActions) {
        nextStage.automatedActions.forEach(action => {
          // Execute action
        });
      }
      
      this.service.emit('workflowAdvanced', { workflow, stage: nextStage });
    } else {
      this.service.emit('workflowCompleted', workflow);
    }
  }
}

class AnalyticsEngine {
  private service: ProjectAutomationService;

  constructor(service: ProjectAutomationService) {
    this.service = service;
  }

  calculateAnalytics(project: WritingProject): ProjectAnalytics {
    const analytics: ProjectAnalytics = {
      total_words: project.currentWordCount,
      daily_average: this.calculateDailyAverage(project),
      writing_streak: this.calculateWritingStreak(project),
      completion_percentage: this.calculateCompletionPercentage(project),
      time_spent: this.calculateTimeSpent(project),
      productivity_score: this.calculateProductivityScore(project),
      quality_score: this.calculateQualityScore(project),
      milestone_progress: this.calculateMilestoneProgress(project),
      writing_patterns: this.identifyWritingPatterns(project),
      performance_trends: this.calculatePerformanceTrends(project)
    };

    return analytics;
  }

  private calculateDailyAverage(project: WritingProject): number {
    const daysSinceStart = Math.max(1, 
      Math.floor((Date.now() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    return Math.round(project.currentWordCount / daysSinceStart);
  }

  private calculateWritingStreak(project: WritingProject): number {
    const wordHistory = project.metadata.word_count_history
      .filter(entry => entry.session_words > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of wordHistory) {
      const entryDate = new Date(entry.date);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= streak + 1) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateCompletionPercentage(project: WritingProject): number {
    if (!project.targetWordCount) {
      // Calculate based on structure elements
      const totalTarget = project.structure.elements.reduce(
        (sum, el) => sum + (el.targetWordCount || 0), 0
      );
      
      if (totalTarget === 0) return 0;
      return Math.min(100, (project.currentWordCount / totalTarget) * 100);
    }
    
    return Math.min(100, (project.currentWordCount / project.targetWordCount) * 100);
  }

  private calculateTimeSpent(project: WritingProject): number {
    return project.metadata.time_tracking.reduce(
      (total, entry) => total + entry.duration, 0
    ) / 60; // Convert to hours
  }

  private calculateProductivityScore(project: WritingProject): number {
    // Simple productivity score based on words per hour
    const timeSpent = this.calculateTimeSpent(project);
    if (timeSpent === 0) return 0;
    
    const wordsPerHour = project.currentWordCount / timeSpent;
    return Math.min(100, (wordsPerHour / 500) * 100); // 500 words/hour = 100%
  }

  private calculateQualityScore(project: WritingProject): number {
    const qualityMetrics = project.metadata.quality_metrics;
    if (qualityMetrics.length === 0) return 0;
    
    const avgQuality = qualityMetrics.reduce(
      (sum, metric) => sum + metric.value, 0
    ) / qualityMetrics.length;
    
    return avgQuality * 100;
  }

  private calculateMilestoneProgress(project: WritingProject): MilestoneProgress[] {
    return project.milestones.map(milestone => ({
      milestone_id: milestone.id,
      progress_percentage: milestone.completed ? 100 : 
        (milestone.current_value / milestone.target_value) * 100,
      on_track: true, // Would calculate based on deadline
      estimated_completion: undefined // Would calculate based on current pace
    }));
  }

  private identifyWritingPatterns(project: WritingProject): WritingPattern[] {
    return [
      {
        type: 'time',
        pattern: 'Most productive in morning hours',
        confidence: 0.8,
        recommendations: ['Schedule writing sessions in the morning']
      }
    ];
  }

  private calculatePerformanceTrends(project: WritingProject): PerformanceTrend[] {
    return [
      {
        metric: 'productivity',
        trend: 'improving',
        change_rate: 0.15,
        period: '7 days'
      }
    ];
  }
}

class CollaborationManager {
  private service: ProjectAutomationService;

  constructor(service: ProjectAutomationService) {
    this.service = service;
  }

  initializeProject(project: WritingProject): void {
    if (!project.collaboration?.enabled) return;

    // Set up collaboration features
    this.setupReviewWorkflow(project);
    this.initializeComments(project);
  }

  private setupReviewWorkflow(project: WritingProject): void {
    // Implementation for review workflow
  }

  private initializeComments(project: WritingProject): void {
    // Implementation for comment system
  }
}

export const projectAutomationService = new ProjectAutomationService();
export default projectAutomationService;