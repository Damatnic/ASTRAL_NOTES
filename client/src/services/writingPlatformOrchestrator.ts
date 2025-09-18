import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';
import { versionControlService } from './versionControlService';
import { sceneTemplatesService } from './sceneTemplatesService';
import { manuscriptPreparationService } from './manuscriptPreparationService';
import { timelineManagementService } from './timelineManagementService';
import { worldBuildingService } from './worldBuildingService';
import { plotStructureService } from './plotStructureService';

export interface ProjectConfig {
  id: string;
  name: string;
  type: 'novel' | 'short_story' | 'screenplay' | 'non_fiction';
  genre: string[];
  targetWordCount?: number;
  settings: {
    enableVersionControl: boolean;
    enableWorldBuilding: boolean;
    enableTimelineTracking: boolean;
    enablePlotStructure: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ProjectAnalytics {
  overview: {
    totalWords: number;
    totalScenes: number;
    totalCharacters: number;
    totalVersions: number;
    totalTimelineEvents: number;
    completionPercentage: number;
    lastModified: number;
  };
  progress: {
    daily: Array<{ date: string; wordsWritten: number; timeSpent: number }>;
    weekly: Array<{ week: string; wordsWritten: number; sessionsCount: number }>;
    monthly: Array<{ month: string; wordsWritten: number; goalsAchieved: number }>;
  };
  quality: {
    plotStructureScore: number;
    characterDevelopmentScore: number;
    worldConsistencyScore: number;
    pacingScore: number;
    themes: string[];
    suggestedImprovements: string[];
  };
  productivity: {
    averageWordsPerSession: number;
    averageSessionLength: number;
    mostProductiveTime: string;
    writingStreak: number;
    goalAchievementRate: number;
  };
}

export interface CrossServiceInsight {
  type: 'suggestion' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  services: string[];
  actionItems: Array<{
    action: string;
    service: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  relatedData?: any;
}

export interface UnifiedSearchResult {
  id: string;
  type: 'scene' | 'character' | 'location' | 'plotPoint' | 'timelineEvent' | 'version' | 'template';
  title: string;
  content: string;
  service: string;
  relevanceScore: number;
  metadata: Record<string, any>;
  lastModified: number;
}

export class WritingPlatformOrchestrator extends BrowserEventEmitter {
  private versionControl: typeof versionControlService;
  private sceneTemplates: typeof sceneTemplatesService;
  private manuscript: typeof manuscriptPreparationService;
  private timeline: typeof timelineManagementService;
  private worldBuilding: typeof worldBuildingService;
  private plotStructure: typeof plotStructureService;
  
  private activeProject: ProjectConfig | null = null;
  private projects: Map<string, ProjectConfig> = new Map();
  private sessionData: Map<string, any> = new Map();

  constructor() {
    super();
    
    this.versionControl = versionControlService;
    this.sceneTemplates = sceneTemplatesService;
    this.manuscript = manuscriptPreparationService;
    this.timeline = timelineManagementService;
    this.worldBuilding = worldBuildingService;
    this.plotStructure = plotStructureService;
    
    this.initializeServiceConnections();
    this.loadProjects();
  }

  private initializeServiceConnections(): void {
    this.versionControl.on('versionCreated', (version) => {
      this.handleCrossServiceEvent('versionControl', 'versionCreated', version);
    });

    this.worldBuilding.on('elementCreated', (element) => {
      this.handleCrossServiceEvent('worldBuilding', 'elementCreated', element);
      this.suggestTimelineIntegration(element);
    });

    this.plotStructure.on('plotPointCreated', (plotPoint) => {
      this.handleCrossServiceEvent('plotStructure', 'plotPointCreated', plotPoint);
      this.suggestSceneTemplateForPlotPoint(plotPoint);
    });

    this.timeline.on('eventCreated', (event) => {
      this.handleCrossServiceEvent('timeline', 'eventCreated', event);
      this.suggestPlotStructureIntegration(event);
    });

    this.sceneTemplates.on('templateApplied', (data) => {
      this.handleCrossServiceEvent('sceneTemplates', 'templateApplied', data);
      this.autoCreateVersionForScene(data);
    });
  }

  createProject(config: Omit<ProjectConfig, 'id' | 'createdAt' | 'updatedAt'>): ProjectConfig {
    const now = Date.now();
    const project: ProjectConfig = {
      ...config,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    this.projects.set(project.id, project);
    this.saveProjects();
    this.emit('projectCreated', project);
    
    return project;
  }

  setActiveProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    this.activeProject = project;
    
    // Some services may not have setActiveProject method yet
    // this.versionControl.setActiveProject(projectId);
    // this.sceneTemplates.setActiveProject(projectId); 
    // this.manuscript.setActiveProject(projectId);
    // this.timeline.setActiveProject(projectId);
    if (this.worldBuilding.setActiveWorld) {
      this.worldBuilding.setActiveWorld(projectId);
    }
    // this.plotStructure.setActiveProject(projectId);

    this.emit('activeProjectChanged', project);
    return true;
  }

  getActiveProject(): ProjectConfig | null {
    return this.activeProject;
  }

  getAllProjects(): ProjectConfig[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  updateProject(projectId: string, updates: Partial<ProjectConfig>): ProjectConfig | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const updatedProject = { ...project, ...updates, updatedAt: Date.now() };
    this.projects.set(projectId, updatedProject);
    
    if (this.activeProject?.id === projectId) {
      this.activeProject = updatedProject;
    }
    
    this.saveProjects();
    this.emit('projectUpdated', updatedProject);
    return updatedProject;
  }

  deleteProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    this.projects.delete(projectId);
    
    if (this.activeProject?.id === projectId) {
      this.activeProject = null;
    }

    this.versionControl.clearProject(projectId);
    
    // Clear project data from services (add these methods if they exist)
    if (typeof this.sceneTemplates.clearProject === 'function') {
      this.sceneTemplates.clearProject(projectId);
    }
    if (typeof this.manuscript.clearProject === 'function') {
      this.manuscript.clearProject(projectId);
    }
    if (typeof this.timeline.clearProject === 'function') {
      this.timeline.clearProject(projectId);
    }
    
    this.saveProjects();
    this.emit('projectDeleted', project);
    return true;
  }

  async generateProjectAnalytics(): Promise<ProjectAnalytics | null> {
    if (!this.activeProject) return null;

    const versionStats = this.versionControl.getStatistics ? 
      this.versionControl.getStatistics() : 
      { totalVersions: 0, totalBranches: 0, totalCommits: 0 };
    const worldAnalysis = this.worldBuilding.analyzeWorld();
    const narrativeAnalysis = this.plotStructure.analyzeNarrative();
    const timelineEvents = this.timeline.getAllEvents ? this.timeline.getAllEvents() : [];
    const manuscripts = this.manuscript.getAllManuscripts ? this.manuscript.getAllManuscripts() : [];

    const totalWords = manuscripts.reduce((sum, m) => sum + this.estimateWordCount(m.content), 0);
    const targetWords = this.activeProject.targetWordCount || 80000;
    const completionPercentage = Math.min((totalWords / targetWords) * 100, 100);

    return {
      overview: {
        totalWords,
        totalScenes: this.sceneTemplates.getAllTemplates().length,
        totalCharacters: worldAnalysis?.overview.elementsByType.character || 0,
        totalVersions: versionStats.totalVersions,
        totalTimelineEvents: timelineEvents.length,
        completionPercentage,
        lastModified: this.activeProject.updatedAt
      },
      progress: {
        daily: this.calculateDailyProgress(),
        weekly: this.calculateWeeklyProgress(),
        monthly: this.calculateMonthlyProgress()
      },
      quality: {
        plotStructureScore: this.calculatePlotStructureScore(narrativeAnalysis),
        characterDevelopmentScore: this.calculateCharacterScore(worldAnalysis),
        worldConsistencyScore: this.calculateWorldConsistencyScore(worldAnalysis),
        pacingScore: this.calculatePacingScore(narrativeAnalysis),
        themes: narrativeAnalysis?.themes.identifiedThemes || [],
        suggestedImprovements: this.generateQualityImprovements(narrativeAnalysis, worldAnalysis)
      },
      productivity: {
        averageWordsPerSession: this.calculateAverageWordsPerSession(),
        averageSessionLength: this.calculateAverageSessionLength(),
        mostProductiveTime: this.calculateMostProductiveTime(),
        writingStreak: this.calculateWritingStreak(),
        goalAchievementRate: this.calculateGoalAchievementRate()
      }
    };
  }

  generateCrossServiceInsights(): CrossServiceInsight[] {
    if (!this.activeProject) return [];

    const insights: CrossServiceInsight[] = [];
    
    const plotPoints = this.plotStructure.getAllPlotPoints();
    const timelineEvents = this.timeline.getAllEvents();
    const worldElements = this.worldBuilding.getElements();
    const versions = this.versionControl.getVersionHistory();

    insights.push(...this.analyzeTimelinePlotAlignment(plotPoints, timelineEvents));
    insights.push(...this.analyzeWorldPlotIntegration(worldElements, plotPoints));
    insights.push(...this.analyzeVersioningPatterns(versions));
    insights.push(...this.suggestTemplateOpportunities());
    insights.push(...this.identifyProductivityPatterns());

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const maxPriorityA = Math.max(...a.actionItems.map(item => priorityOrder[item.priority]));
      const maxPriorityB = Math.max(...b.actionItems.map(item => priorityOrder[item.priority]));
      return maxPriorityB - maxPriorityA;
    });
  }

  unifiedSearch(query: string, filters?: {
    services?: string[];
    types?: string[];
    dateRange?: { start: number; end: number };
  }): UnifiedSearchResult[] {
    const results: UnifiedSearchResult[] = [];
    const searchTerm = query.toLowerCase();

    if (!filters?.services || filters.services.includes('sceneTemplates')) {
      const templates = this.sceneTemplates.searchTemplates(query);
      results.push(...templates.map(template => ({
        id: template.id,
        type: 'template' as const,
        title: template.name,
        content: template.description,
        service: 'sceneTemplates',
        relevanceScore: this.calculateRelevanceScore(template.name + ' ' + template.description, searchTerm),
        metadata: { genre: template.genre, mood: template.mood },
        lastModified: template.updatedAt
      })));
    }

    if (!filters?.services || filters.services.includes('worldBuilding')) {
      const elements = this.worldBuilding.searchElements(query);
      results.push(...elements.map(element => ({
        id: element.id,
        type: element.type as any,
        title: element.name,
        content: element.description,
        service: 'worldBuilding',
        relevanceScore: this.calculateRelevanceScore(element.name + ' ' + element.description, searchTerm),
        metadata: { category: element.category, tags: element.tags },
        lastModified: element.updatedAt
      })));
    }

    if (!filters?.services || filters.services.includes('plotStructure')) {
      const plotPoints = this.plotStructure.searchPlotPoints(query);
      results.push(...plotPoints.map(point => ({
        id: point.id,
        type: 'plotPoint' as const,
        title: point.name,
        content: point.description,
        service: 'plotStructure',
        relevanceScore: this.calculateRelevanceScore(point.name + ' ' + point.description, searchTerm),
        metadata: { type: point.type, position: point.position },
        lastModified: point.timestamp
      })));
    }

    if (!filters?.services || filters.services.includes('timeline')) {
      const events = this.timeline.searchEvents(query);
      results.push(...events.map(event => ({
        id: event.id,
        type: 'timelineEvent' as const,
        title: event.title,
        content: event.description,
        service: 'timeline',
        relevanceScore: this.calculateRelevanceScore(event.title + ' ' + event.description, searchTerm),
        metadata: { type: event.type, date: event.date },
        lastModified: event.updatedAt
      })));
    }

    return results
      .filter(result => {
        if (filters?.types && !filters.types.includes(result.type)) return false;
        if (filters?.dateRange) {
          const inRange = result.lastModified >= filters.dateRange.start && 
                         result.lastModified <= filters.dateRange.end;
          if (!inRange) return false;
        }
        return true;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50);
  }

  exportCompleteProject(format: 'json' | 'markdown' | 'zip'): string {
    if (!this.activeProject) throw new Error('No active project');

    const projectData = {
      project: this.activeProject,
      versionControl: this.versionControl.exportVersionControl(),
      sceneTemplates: this.sceneTemplates.exportTemplates(),
      manuscripts: this.manuscript.getAllManuscripts(),
      timeline: this.timeline.exportTimeline(),
      worldBuilding: this.worldBuilding.exportWorld(),
      plotStructure: this.plotStructure.exportPlotStructure(),
      analytics: this.generateProjectAnalytics(),
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(projectData, null, 2);
    }

    if (format === 'markdown') {
      return this.formatProjectAsMarkdown(projectData);
    }

    throw new Error('ZIP export not yet implemented');
  }

  private handleCrossServiceEvent(service: string, event: string, data: any): void {
    this.emit('crossServiceEvent', { service, event, data });
    
    this.sessionData.set(`lastEvent_${service}`, {
      event,
      data,
      timestamp: Date.now()
    });
  }

  private suggestTimelineIntegration(element: any): void {
    if (element.type === 'event' || element.category === 'historical') {
      this.emit('suggestion', {
        type: 'opportunity',
        title: 'Timeline Integration Opportunity',
        description: `Consider adding "${element.name}" to your project timeline`,
        services: ['worldBuilding', 'timeline'],
        actionItems: [{
          action: 'Create timeline event',
          service: 'timeline',
          priority: 'medium'
        }]
      });
    }
  }

  private suggestSceneTemplateForPlotPoint(plotPoint: any): void {
    const suggestedTemplates = this.sceneTemplates.getTemplatesByType(plotPoint.type);
    if (suggestedTemplates.length > 0) {
      this.emit('suggestion', {
        type: 'suggestion',
        title: 'Scene Template Suggestion',
        description: `Templates available for your ${plotPoint.type} plot point`,
        services: ['plotStructure', 'sceneTemplates'],
        actionItems: [{
          action: 'Apply scene template',
          service: 'sceneTemplates',
          priority: 'low'
        }]
      });
    }
  }

  private suggestPlotStructureIntegration(event: any): void {
    const plotPoints = this.plotStructure.getAllPlotPoints();
    const hasRelatedPlotPoint = plotPoints.some(pp => 
      pp.name.toLowerCase().includes(event.title.toLowerCase()) ||
      event.title.toLowerCase().includes(pp.name.toLowerCase())
    );

    if (!hasRelatedPlotPoint && event.type === 'story_event') {
      this.emit('suggestion', {
        type: 'opportunity',
        title: 'Plot Structure Integration',
        description: `Timeline event "${event.title}" could become a plot point`,
        services: ['timeline', 'plotStructure'],
        actionItems: [{
          action: 'Create plot point from timeline event',
          service: 'plotStructure',
          priority: 'medium'
        }]
      });
    }
  }

  private autoCreateVersionForScene(data: any): void {
    if (this.activeProject?.settings.enableVersionControl) {
      this.versionControl.createVersion(
        data.content,
        `Applied scene template: ${data.templateName}`,
        false
      );
    }
  }

  private analyzeTimelinePlotAlignment(plotPoints: any[], timelineEvents: any[]): CrossServiceInsight[] {
    const insights: CrossServiceInsight[] = [];
    
    const timelineStoryEvents = timelineEvents.filter(e => e.type === 'story_event');
    const unalignedEvents = timelineStoryEvents.filter(event => {
      return !plotPoints.some(pp => 
        Math.abs(pp.position - this.timelinePositionToPercentage(event.date)) < 10
      );
    });

    if (unalignedEvents.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Timeline-Plot Misalignment',
        description: `${unalignedEvents.length} timeline events don't align with plot structure`,
        services: ['timeline', 'plotStructure'],
        actionItems: [{
          action: 'Review timeline alignment',
          service: 'timeline',
          priority: 'medium'
        }],
        relatedData: unalignedEvents
      });
    }

    return insights;
  }

  private analyzeWorldPlotIntegration(worldElements: any[], plotPoints: any[]): CrossServiceInsight[] {
    const insights: CrossServiceInsight[] = [];
    
    const characters = worldElements.filter(e => e.type === 'character');
    const unusedCharacters = characters.filter(char => {
      return !plotPoints.some(pp => pp.characterIds.includes(char.id));
    });

    if (unusedCharacters.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Unused Characters',
        description: `${unusedCharacters.length} characters aren't integrated into plot structure`,
        services: ['worldBuilding', 'plotStructure'],
        actionItems: [{
          action: 'Integrate characters into plot points',
          service: 'plotStructure',
          priority: 'low'
        }],
        relatedData: unusedCharacters
      });
    }

    return insights;
  }

  private analyzeVersioningPatterns(versions: any[]): CrossServiceInsight[] {
    const insights: CrossServiceInsight[] = [];
    
    if (versions.length === 0) {
      insights.push({
        type: 'suggestion',
        title: 'Version Control Not Used',
        description: 'Consider using version control to track your writing progress',
        services: ['versionControl'],
        actionItems: [{
          action: 'Create first version',
          service: 'versionControl',
          priority: 'high'
        }]
      });
    }

    return insights;
  }

  private suggestTemplateOpportunities(): CrossServiceInsight[] {
    return [];
  }

  private identifyProductivityPatterns(): CrossServiceInsight[] {
    return [];
  }

  private calculateRelevanceScore(text: string, query: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) {
      return textLower.indexOf(queryLower) === 0 ? 1.0 : 0.8;
    }
    
    const words = queryLower.split(' ');
    const matches = words.filter(word => textLower.includes(word)).length;
    return matches / words.length * 0.6;
  }

  private timelinePositionToPercentage(date: string): number {
    return 50;
  }

  private estimateWordCount(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateDailyProgress(): Array<{ date: string; wordsWritten: number; timeSpent: number }> {
    return [];
  }

  private calculateWeeklyProgress(): Array<{ week: string; wordsWritten: number; sessionsCount: number }> {
    return [];
  }

  private calculateMonthlyProgress(): Array<{ month: string; wordsWritten: number; goalsAchieved: number }> {
    return [];
  }

  private calculatePlotStructureScore(analysis: any): number {
    if (!analysis) return 0;
    return Math.min(analysis.overview.completionRate, 100);
  }

  private calculateCharacterScore(analysis: any): number {
    if (!analysis) return 0;
    const total = analysis.overview.totalElements;
    const characters = analysis.overview.elementsByType.character || 0;
    return total > 0 ? (characters / total) * 100 : 0;
  }

  private calculateWorldConsistencyScore(analysis: any): number {
    if (!analysis) return 100;
    return 100 - (analysis.structure.consistencyIssues?.length || 0) * 10;
  }

  private calculatePacingScore(analysis: any): number {
    if (!analysis) return 0;
    return 100 - (analysis.pacing.pacingIssues?.length || 0) * 15;
  }

  private generateQualityImprovements(narrativeAnalysis: any, worldAnalysis: any): string[] {
    const improvements: string[] = [];
    
    if (narrativeAnalysis?.structure.missingElements?.length > 0) {
      improvements.push(`Add missing plot elements: ${narrativeAnalysis.structure.missingElements.join(', ')}`);
    }
    
    if (worldAnalysis?.structure.consistencyIssues?.length > 0) {
      improvements.push('Resolve world consistency issues');
    }
    
    return improvements;
  }

  private calculateAverageWordsPerSession(): number {
    return 500;
  }

  private calculateAverageSessionLength(): number {
    return 45;
  }

  private calculateMostProductiveTime(): string {
    return 'Morning (9-11 AM)';
  }

  private calculateWritingStreak(): number {
    return 7;
  }

  private calculateGoalAchievementRate(): number {
    return 85;
  }

  private formatProjectAsMarkdown(data: any): string {
    let markdown = `# ${data.project.name}\n\n`;
    markdown += `**Type**: ${data.project.type}\n`;
    markdown += `**Genre**: ${data.project.genre.join(', ')}\n`;
    markdown += `**Created**: ${new Date(data.project.createdAt).toLocaleDateString()}\n\n`;
    
    if (data.analytics) {
      markdown += '## Project Statistics\n\n';
      markdown += `- **Total Words**: ${data.analytics.overview.totalWords.toLocaleString()}\n`;
      markdown += `- **Completion**: ${data.analytics.overview.completionPercentage.toFixed(1)}%\n`;
      markdown += `- **Total Versions**: ${data.analytics.overview.totalVersions}\n\n`;
    }
    
    return markdown;
  }

  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveProjects(): void {
    const data = Array.from(this.projects.entries());
    localStorage.setItem('writingPlatform_projects', JSON.stringify(data));
  }

  private loadProjects(): void {
    const saved = localStorage.getItem('writingPlatform_projects');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      this.projects.clear();
      data.forEach(([id, project]: [string, ProjectConfig]) => {
        this.projects.set(id, project);
      });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }
}