/**
 * Service Orchestrator - Coordinates all AI services and provides unified management
 */

import { EventEmitter } from 'events';

// Import all AI services
import aiWritingCompanionService from './aiWritingCompanion';
import voiceInteractionService from './voiceInteraction';
import predictiveWorkflowService from './predictiveWorkflow';
import personalKnowledgeAIService from './personalKnowledgeAI';
import ultimateIntegrationService from './ultimateIntegration';
import creativityBoosterService from './creativityBooster';
import writingMasteryService from './writingMastery';
import personalAICoachService from './personalAICoach';
import habitTrackerService from './habitTracker';
import progressTrackerService from './progressTracker';
import personalAchievementsService from './personalAchievements';
import personalGoalSettingService from './personalGoalSetting';
import intelligentContentSuggestionsService from './intelligentContentSuggestions';
import patternRecognitionService from './patternRecognition';
import learningCurriculumService from './learningCurriculum';
import emotionalIntelligenceService from './emotionalIntelligence';
import predictiveWritingAssistantService from './predictiveWritingAssistant';
import voiceStyleCoachService from './voiceStyleCoach';
import writingPhilosophyService from './writingPhilosophy';
import writingWellnessService from './writingWellness';
import personalLegacyService from './personalLegacy';
import personalKnowledgeBaseService from './personalKnowledgeBase';
import smartTemplatesService from './smartTemplates';
import researchAssistantService from './researchAssistant';
import projectAutomationService from './projectAutomation';
import backupVersioningService from './backupVersioning';
import contentExportService from './contentExport';
import authorPlatformToolsService from './authorPlatformTools';
import portfolioGeneratorService from './portfolioGenerator';
import socialMediaIntegrationService from './socialMediaIntegration';
import publicationAnalyticsService from './publicationAnalytics';
import storyAssistantService from './storyAssistant';

export interface ServiceInfo {
  id: string;
  name: string;
  description: string;
  category: 'writing' | 'productivity' | 'analytics' | 'automation' | 'learning' | 'publishing' | 'research';
  version: string;
  status: 'active' | 'inactive' | 'error' | 'initializing';
  dependencies: string[];
  capabilities: string[];
  memoryUsage?: number;
  lastActivity?: number;
  errorCount: number;
  successRate: number;
}

export interface ServiceMetrics {
  totalServices: number;
  activeServices: number;
  errorServices: number;
  averageResponseTime: number;
  memoryUsage: number;
  requestsPerMinute: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export interface ServiceEvent {
  serviceId: string;
  event: 'started' | 'stopped' | 'error' | 'success' | 'warning';
  timestamp: number;
  data?: any;
  message?: string;
}

export interface OrchestrationRule {
  id: string;
  name: string;
  condition: string;
  actions: OrchestrationAction[];
  priority: number;
  isActive: boolean;
}

export interface OrchestrationAction {
  type: 'start_service' | 'stop_service' | 'notify' | 'scale' | 'redirect';
  target: string;
  parameters?: Record<string, any>;
}

class ServiceOrchestrator extends EventEmitter {
  private services: Map<string, ServiceInfo> = new Map();
  private eventHistory: ServiceEvent[] = [];
  private orchestrationRules: OrchestrationRule[] = [];
  private metricsInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    super();
    this.initializeServices();
    this.setupMetricsCollection();
    this.setupOrchestrationRules();
  }

  private initializeServices() {
    const serviceDefinitions: Omit<ServiceInfo, 'status' | 'lastActivity' | 'errorCount' | 'successRate'>[] = [
      {
        id: 'ai-writing-companion',
        name: 'AI Writing Companion',
        description: 'Intelligent writing assistant with multiple personalities',
        category: 'writing',
        version: '1.0.0',
        dependencies: [],
        capabilities: ['text-generation', 'style-adaptation', 'feedback', 'suggestions']
      },
      {
        id: 'voice-interaction',
        name: 'Voice Interaction',
        description: 'Voice-to-text and AI voice commands',
        category: 'productivity',
        version: '1.0.0',
        dependencies: ['ai-writing-companion'],
        capabilities: ['speech-recognition', 'voice-commands', 'audio-feedback']
      },
      {
        id: 'predictive-workflow',
        name: 'Predictive Workflow',
        description: 'AI-powered workflow automation and prediction',
        category: 'automation',
        version: '1.0.0',
        dependencies: ['pattern-recognition'],
        capabilities: ['workflow-prediction', 'automation', 'scheduling']
      },
      {
        id: 'personal-knowledge-ai',
        name: 'Personal Knowledge AI',
        description: 'Semantic search and knowledge management',
        category: 'research',
        version: '1.0.0',
        dependencies: ['personal-knowledge-base'],
        capabilities: ['semantic-search', 'knowledge-graphs', 'categorization']
      },
      {
        id: 'creativity-booster',
        name: 'Creativity Booster',
        description: 'AI-powered creative inspiration and ideation',
        category: 'writing',
        version: '1.0.0',
        dependencies: ['ai-writing-companion'],
        capabilities: ['idea-generation', 'creative-prompts', 'inspiration']
      },
      {
        id: 'writing-mastery',
        name: 'Writing Mastery',
        description: 'Advanced writing skills development',
        category: 'learning',
        version: '1.0.0',
        dependencies: ['progress-tracker', 'personal-ai-coach'],
        capabilities: ['skill-assessment', 'lessons', 'progress-tracking']
      },
      {
        id: 'personal-ai-coach',
        name: 'Personal AI Coach',
        description: 'Personalized coaching for writing improvement',
        category: 'learning',
        version: '1.0.0',
        dependencies: ['habit-tracker', 'progress-tracker'],
        capabilities: ['goal-setting', 'coaching', 'motivation', 'feedback']
      },
      {
        id: 'habit-tracker',
        name: 'Habit Tracker',
        description: 'Track and maintain writing habits',
        category: 'productivity',
        version: '1.0.0',
        dependencies: [],
        capabilities: ['habit-tracking', 'reminders', 'analytics']
      },
      {
        id: 'progress-tracker',
        name: 'Progress Tracker',
        description: 'Track writing progress and achievements',
        category: 'analytics',
        version: '1.0.0',
        dependencies: [],
        capabilities: ['progress-tracking', 'metrics', 'reporting']
      },
      {
        id: 'intelligent-content-suggestions',
        name: 'Intelligent Content Suggestions',
        description: 'AI-powered content suggestions and recommendations',
        category: 'writing',
        version: '1.0.0',
        dependencies: ['personal-knowledge-ai', 'pattern-recognition'],
        capabilities: ['content-suggestions', 'recommendations', 'auto-completion']
      },
      {
        id: 'pattern-recognition',
        name: 'Pattern Recognition',
        description: 'Identify patterns in writing and behavior',
        category: 'analytics',
        version: '1.0.0',
        dependencies: [],
        capabilities: ['pattern-analysis', 'trend-detection', 'insights']
      },
      {
        id: 'emotional-intelligence',
        name: 'Emotional Intelligence',
        description: 'Analyze and enhance emotional aspects of writing',
        category: 'writing',
        version: '1.0.0',
        dependencies: ['ai-writing-companion'],
        capabilities: ['emotion-analysis', 'mood-tracking', 'emotional-guidance']
      },
      {
        id: 'voice-style-coach',
        name: 'Voice & Style Coach',
        description: 'Develop and maintain consistent writing voice and style',
        category: 'learning',
        version: '1.0.0',
        dependencies: ['ai-writing-companion', 'pattern-recognition'],
        capabilities: ['style-analysis', 'voice-development', 'consistency-checking']
      },
      {
        id: 'research-assistant',
        name: 'Research Assistant',
        description: 'AI-powered research assistance and organization',
        category: 'research',
        version: '1.0.0',
        dependencies: ['personal-knowledge-ai'],
        capabilities: ['research-assistance', 'fact-checking', 'source-organization']
      },
      {
        id: 'smart-templates',
        name: 'Smart Templates',
        description: 'Intelligent templates and content scaffolding',
        category: 'productivity',
        version: '1.0.0',
        dependencies: ['ai-writing-companion'],
        capabilities: ['template-generation', 'scaffolding', 'structure-guidance']
      },
      {
        id: 'story-assistant',
        name: 'Story Assistant',
        description: 'Specialized assistant for narrative writing',
        category: 'writing',
        version: '1.0.0',
        dependencies: ['ai-writing-companion', 'creativity-booster'],
        capabilities: ['story-development', 'character-analysis', 'plot-assistance']
      },
      {
        id: 'publication-analytics',
        name: 'Publication Analytics',
        description: 'Analytics for published content performance',
        category: 'analytics',
        version: '1.0.0',
        dependencies: ['pattern-recognition'],
        capabilities: ['performance-tracking', 'engagement-analysis', 'optimization-suggestions']
      },
      {
        id: 'portfolio-generator',
        name: 'Portfolio Generator',
        description: 'Generate professional writing portfolios',
        category: 'publishing',
        version: '1.0.0',
        dependencies: ['content-export'],
        capabilities: ['portfolio-creation', 'formatting', 'presentation']
      }
    ];

    // Initialize services with default status
    serviceDefinitions.forEach(def => {
      this.services.set(def.id, {
        ...def,
        status: 'active',
        lastActivity: Date.now(),
        errorCount: 0,
        successRate: 100
      });
    });

    this.isInitialized = true;
    this.emit('orchestrator:initialized', { serviceCount: this.services.size });
  }

  private setupMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds
  }

  private setupOrchestrationRules() {
    const defaultRules: OrchestrationRule[] = [
      {
        id: 'auto-restart-failed',
        name: 'Auto-restart Failed Services',
        condition: 'service.status === "error" && service.errorCount < 3',
        actions: [
          { type: 'start_service', target: 'self' }
        ],
        priority: 1,
        isActive: true
      },
      {
        id: 'dependency-check',
        name: 'Check Dependencies',
        condition: 'service.dependencies.length > 0',
        actions: [
          { type: 'notify', target: 'system', parameters: { level: 'warning' } }
        ],
        priority: 2,
        isActive: true
      },
      {
        id: 'performance-optimization',
        name: 'Performance Optimization',
        condition: 'system.memoryUsage > 80',
        actions: [
          { type: 'scale', target: 'system', parameters: { action: 'optimize' } }
        ],
        priority: 3,
        isActive: true
      }
    ];

    this.orchestrationRules = defaultRules;
  }

  private collectMetrics() {
    const metrics: ServiceMetrics = {
      totalServices: this.services.size,
      activeServices: Array.from(this.services.values()).filter(s => s.status === 'active').length,
      errorServices: Array.from(this.services.values()).filter(s => s.status === 'error').length,
      averageResponseTime: 45, // Mock value
      memoryUsage: 67, // Mock percentage
      requestsPerMinute: 234, // Mock value
      systemHealth: this.calculateSystemHealth()
    };

    this.emit('metrics:updated', metrics);
  }

  private calculateSystemHealth(): 'healthy' | 'degraded' | 'critical' {
    const errorPercentage = (this.getMetrics().errorServices / this.getMetrics().totalServices) * 100;
    
    if (errorPercentage > 25) return 'critical';
    if (errorPercentage > 10) return 'degraded';
    return 'healthy';
  }

  // Public API
  public getServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  public getService(serviceId: string): ServiceInfo | undefined {
    return this.services.get(serviceId);
  }

  public getServicesByCategory(category: string): ServiceInfo[] {
    return Array.from(this.services.values()).filter(s => s.category === category);
  }

  public getMetrics(): ServiceMetrics {
    return {
      totalServices: this.services.size,
      activeServices: Array.from(this.services.values()).filter(s => s.status === 'active').length,
      errorServices: Array.from(this.services.values()).filter(s => s.status === 'error').length,
      averageResponseTime: 45,
      memoryUsage: 67,
      requestsPerMinute: 234,
      systemHealth: this.calculateSystemHealth()
    };
  }

  public async startService(serviceId: string): Promise<boolean> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    try {
      service.status = 'initializing';
      this.services.set(serviceId, service);

      // Check dependencies
      for (const depId of service.dependencies) {
        const dependency = this.services.get(depId);
        if (!dependency || dependency.status !== 'active') {
          throw new Error(`Dependency ${depId} is not available`);
        }
      }

      // Simulate service startup
      await new Promise(resolve => setTimeout(resolve, 1000));

      service.status = 'active';
      service.lastActivity = Date.now();
      this.services.set(serviceId, service);

      this.logEvent(serviceId, 'started', 'Service started successfully');
      return true;
    } catch (error) {
      service.status = 'error';
      service.errorCount++;
      this.services.set(serviceId, service);

      this.logEvent(serviceId, 'error', `Failed to start service: ${error.message}`);
      return false;
    }
  }

  public async stopService(serviceId: string): Promise<boolean> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    try {
      service.status = 'inactive';
      this.services.set(serviceId, service);

      this.logEvent(serviceId, 'stopped', 'Service stopped successfully');
      return true;
    } catch (error) {
      this.logEvent(serviceId, 'error', `Failed to stop service: ${error.message}`);
      return false;
    }
  }

  public async restartService(serviceId: string): Promise<boolean> {
    await this.stopService(serviceId);
    await new Promise(resolve => setTimeout(resolve, 500));
    return await this.startService(serviceId);
  }

  public getServiceHealth(serviceId: string): { status: string; health: number; issues: string[] } {
    const service = this.services.get(serviceId);
    if (!service) {
      return { status: 'unknown', health: 0, issues: ['Service not found'] };
    }

    const issues: string[] = [];
    let health = 100;

    if (service.status === 'error') {
      health -= 50;
      issues.push('Service is in error state');
    }

    if (service.errorCount > 0) {
      health -= service.errorCount * 10;
      issues.push(`${service.errorCount} recent errors`);
    }

    if (service.successRate < 95) {
      health -= (100 - service.successRate);
      issues.push(`Low success rate: ${service.successRate}%`);
    }

    return {
      status: service.status,
      health: Math.max(0, health),
      issues
    };
  }

  public getEventHistory(serviceId?: string, limit = 50): ServiceEvent[] {
    let events = this.eventHistory;
    
    if (serviceId) {
      events = events.filter(e => e.serviceId === serviceId);
    }

    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public async executeWorkflow(workflowId: string, parameters: Record<string, any> = {}): Promise<any> {
    // Coordinate multiple services for complex workflows
    try {
      switch (workflowId) {
        case 'complete-writing-session':
          await this.executeWritingSessionWorkflow(parameters);
          break;
        case 'content-publishing-pipeline':
            await this.executePublishingWorkflow(parameters);
            break;
        case 'research-and-synthesis':
          await this.executeResearchWorkflow(parameters);
          break;
        default:
          throw new Error(`Unknown workflow: ${workflowId}`);
      }
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  private async executeWritingSessionWorkflow(params: any) {
    // Coordinate AI Writing Companion, Voice Interaction, and Progress Tracker
    const services = ['ai-writing-companion', 'voice-interaction', 'progress-tracker'];
    
    for (const serviceId of services) {
      const service = this.services.get(serviceId);
      if (service?.status !== 'active') {
        await this.startService(serviceId);
      }
    }

    this.logEvent('workflow', 'success', 'Writing session workflow completed');
  }

  private async executePublishingWorkflow(params: any) {
    // Coordinate Content Export, Portfolio Generator, and Publication Analytics
    const services = ['content-export', 'portfolio-generator', 'publication-analytics'];
    
    for (const serviceId of services) {
      const service = this.services.get(serviceId);
      if (service?.status !== 'active') {
        await this.startService(serviceId);
      }
    }

    this.logEvent('workflow', 'success', 'Publishing workflow completed');
  }

  private async executeResearchWorkflow(params: any) {
    // Coordinate Research Assistant and Personal Knowledge AI
    const services = ['research-assistant', 'personal-knowledge-ai'];
    
    for (const serviceId of services) {
      const service = this.services.get(serviceId);
      if (service?.status !== 'active') {
        await this.startService(serviceId);
      }
    }

    this.logEvent('workflow', 'success', 'Research workflow completed');
  }

  private logEvent(serviceId: string, event: ServiceEvent['event'], message?: string, data?: any) {
    const eventRecord: ServiceEvent = {
      serviceId,
      event,
      timestamp: Date.now(),
      message,
      data
    };

    this.eventHistory.push(eventRecord);
    
    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }

    this.emit('service:event', eventRecord);
  }

  public destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.removeAllListeners();
  }
}

// Create and export singleton instance
const serviceOrchestrator = new ServiceOrchestrator();
export default serviceOrchestrator;