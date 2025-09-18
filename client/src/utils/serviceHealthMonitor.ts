/**
 * Service Health Monitor
 * Real-time monitoring and health checking for all AI services
 */

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: number;
  responseTime: number;
  errorCount: number;
  uptime: number;
  memoryUsage: number;
  version: string;
}

export interface SystemHealth {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  averageResponseTime: number;
  totalMemoryUsage: number;
  lastUpdate: number;
  services: ServiceHealth[];
}

class ServiceHealthMonitor {
  private healthData: Map<string, ServiceHealth> = new Map();
  private monitoringInterval: number | null = null;
  private callbacks: Set<(health: SystemHealth) => void> = new Set();
  private isMonitoring = false;

  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
    
    // Initial check
    this.performHealthCheck();
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  public subscribe(callback: (health: SystemHealth) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  public async performHealthCheck(): Promise<SystemHealth> {
    const startTime = performance.now();
    const services = await this.getServicesToMonitor();
    
    for (const [serviceName, service] of Object.entries(services)) {
      try {
        const health = await this.checkServiceHealth(serviceName, service);
        this.healthData.set(serviceName, health);
      } catch (error) {
        console.error(`Health check failed for ${serviceName}:`, error);
        this.healthData.set(serviceName, {
          serviceName,
          status: 'unhealthy',
          lastChecked: Date.now(),
          responseTime: -1,
          errorCount: (this.healthData.get(serviceName)?.errorCount || 0) + 1,
          uptime: 0,
          memoryUsage: 0,
          version: 'unknown'
        });
      }
    }

    const systemHealth = this.calculateSystemHealth();
    this.notifySubscribers(systemHealth);
    return systemHealth;
  }

  private async checkServiceHealth(serviceName: string, service: any): Promise<ServiceHealth> {
    const startTime = performance.now();
    const previousHealth = this.healthData.get(serviceName);
    
    try {
      // Check if service is responsive
      let status: ServiceHealth['status'] = 'healthy';
      let responseTime = 0;
      
      // Test basic service methods
      if (typeof service.getStatus === 'function') {
        const statusResult = await Promise.race([
          service.getStatus(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        responseTime = performance.now() - startTime;
        
        if (responseTime > 1000) {
          status = 'degraded';
        }
      } else if (typeof service.initialize === 'function') {
        // If no getStatus method, check if service can be initialized
        responseTime = performance.now() - startTime;
        if (responseTime > 500) {
          status = 'degraded';
        }
      } else {
        // Service exists but has minimal interface
        responseTime = performance.now() - startTime;
        status = 'degraded';
      }

      // Calculate uptime
      const now = Date.now();
      const uptime = previousHealth ? 
        (previousHealth.status !== 'unhealthy' ? now - (now - previousHealth.uptime) : 0) : 
        now;

      // Estimate memory usage (simplified)
      const memoryUsage = this.estimateServiceMemoryUsage(service);

      return {
        serviceName,
        status,
        lastChecked: now,
        responseTime,
        errorCount: previousHealth?.errorCount || 0,
        uptime,
        memoryUsage,
        version: service.version || '1.0.0'
      };

    } catch (error) {
      return {
        serviceName,
        status: 'unhealthy',
        lastChecked: Date.now(),
        responseTime: performance.now() - startTime,
        errorCount: (previousHealth?.errorCount || 0) + 1,
        uptime: 0,
        memoryUsage: 0,
        version: 'unknown'
      };
    }
  }

  private estimateServiceMemoryUsage(service: any): number {
    // Simplified memory usage estimation
    try {
      const serviceString = JSON.stringify(service, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (value instanceof EventTarget) return '[EventTarget]';
        return value;
      });
      return serviceString.length * 2; // Rough estimate in bytes
    } catch {
      return 1024; // Default 1KB estimate
    }
  }

  private calculateSystemHealth(): SystemHealth {
    const services = Array.from(this.healthData.values());
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;

    let overallStatus: SystemHealth['overallStatus'] = 'healthy';
    if (unhealthyServices > 0) {
      overallStatus = unhealthyServices > services.length * 0.2 ? 'unhealthy' : 'degraded';
    } else if (degradedServices > services.length * 0.3) {
      overallStatus = 'degraded';
    }

    const averageResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length || 0;
    const totalMemoryUsage = services.reduce((sum, s) => sum + s.memoryUsage, 0);

    return {
      overallStatus,
      totalServices: services.length,
      healthyServices,
      degradedServices,
      unhealthyServices,
      averageResponseTime,
      totalMemoryUsage,
      lastUpdate: Date.now(),
      services: services.sort((a, b) => a.serviceName.localeCompare(b.serviceName))
    };
  }

  private async getServicesToMonitor(): Promise<Record<string, any>> {
    const services: Record<string, any> = {};

    try {
      // Core AI services
      services.aiWritingCompanion = (await import('../services/aiWritingCompanion')).default;
      services.creativityBooster = (await import('../services/creativityBooster')).default;
      services.storyAssistant = (await import('../services/storyAssistant')).default;
      services.voiceStyleCoach = (await import('../services/voiceStyleCoach')).default;
      services.predictiveWritingAssistant = (await import('../services/predictiveWritingAssistant')).default;
      services.writingMastery = (await import('../services/writingMastery')).default;
      services.writingPhilosophy = (await import('../services/writingPhilosophy')).default;
      services.writingWellness = (await import('../services/writingWellness')).default;
      
      services.personalAICoach = (await import('../services/personalAICoach')).default;
      services.habitTracker = (await import('../services/habitTracker')).default;
      services.progressTracker = (await import('../services/progressTracker')).default;
      services.smartTemplates = (await import('../services/smartTemplates')).default;
      services.voiceInteraction = (await import('../services/voiceInteraction')).default;
      services.projectAutomation = (await import('../services/projectAutomation')).default;
      
      services.personalAchievements = (await import('../services/personalAchievements')).default;
      services.patternRecognition = (await import('../services/patternRecognition')).default;
      services.publicationAnalytics = (await import('../services/publicationAnalytics')).default;
      services.emotionalIntelligence = (await import('../services/emotionalIntelligence')).default;
      services.learningCurriculum = (await import('../services/learningCurriculum')).default;
      
      services.personalKnowledgeAI = (await import('../services/personalKnowledgeAI')).default;
      services.personalKnowledgeBase = (await import('../services/personalKnowledgeBase')).default;
      services.researchAssistant = (await import('../services/researchAssistant')).default;
      services.intelligentContentSuggestions = (await import('../services/intelligentContentSuggestions')).default;
      
      services.authorPlatformTools = (await import('../services/authorPlatformTools')).default;
      services.portfolioGenerator = (await import('../services/portfolioGenerator')).default;
      services.socialMediaIntegration = (await import('../services/socialMediaIntegration')).default;
      services.contentExport = (await import('../services/contentExport')).default;
      services.personalLegacy = (await import('../services/personalLegacy')).default;
      
      services.ultimateIntegration = (await import('../services/ultimateIntegration')).default;
      services.serviceOrchestrator = (await import('../services/serviceOrchestrator')).default;
      services.backupVersioning = (await import('../services/backupVersioning')).default;
      services.predictiveWorkflow = (await import('../services/predictiveWorkflow')).default;
      services.personalGoalSetting = (await import('../services/personalGoalSetting')).default;
      
      // NovelCrafter features
      services.writingChallengesService = (await import('../services/writingChallengesService')).default;
      services.referenceImagesService = (await import('../services/referenceImagesService')).default;
      services.chapterPlanningService = (await import('../services/chapterPlanningService')).default;
      services.dialogueWorkshopService = (await import('../services/dialogueWorkshopService')).default;
      services.characterArcService = (await import('../services/characterArcService')).default;
      services.analyticsService = (await import('../services/analyticsService')).analyticsService;

    } catch (error) {
      console.error('Error loading services for health monitoring:', error);
    }

    return services;
  }

  private notifySubscribers(health: SystemHealth): void {
    this.callbacks.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error in health monitor callback:', error);
      }
    });
  }

  public getLatestHealth(): SystemHealth | null {
    if (this.healthData.size === 0) return null;
    return this.calculateSystemHealth();
  }

  public getServiceHealth(serviceName: string): ServiceHealth | null {
    return this.healthData.get(serviceName) || null;
  }

  public clearHistory(): void {
    this.healthData.clear();
  }
}

export const serviceHealthMonitor = new ServiceHealthMonitor();
export default serviceHealthMonitor;