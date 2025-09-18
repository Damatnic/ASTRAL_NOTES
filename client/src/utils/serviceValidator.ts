/**
 * AI Service Validation Utility
 * Comprehensive testing and validation for all AI services
 */

export interface ServiceValidationResult {
  serviceName: string;
  isInitialized: boolean;
  hasRequiredMethods: boolean;
  canPersistData: boolean;
  canEmitEvents: boolean;
  errorMessages: string[];
  performanceMetrics: {
    initTime: number;
    memoryUsage: number;
  };
}

export interface ValidationReport {
  totalServices: number;
  passedServices: number;
  failedServices: number;
  results: ServiceValidationResult[];
  overallStatus: 'passed' | 'failed' | 'partial';
  timestamp: string;
}

class ServiceValidator {
  private results: ServiceValidationResult[] = [];

  async validateService(service: any, serviceName: string): Promise<ServiceValidationResult> {
    const result: ServiceValidationResult = {
      serviceName,
      isInitialized: false,
      hasRequiredMethods: false,
      canPersistData: false,
      canEmitEvents: false,
      errorMessages: [],
      performanceMetrics: {
        initTime: 0,
        memoryUsage: 0
      }
    };

    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      // Test service initialization
      if (service && typeof service === 'object') {
        result.isInitialized = true;
      } else {
        result.errorMessages.push('Service not properly imported or initialized');
      }

      // Test required methods
      const requiredMethods = ['initialize', 'process', 'getStatus'];
      const availableMethods = requiredMethods.filter(method => 
        typeof service[method] === 'function'
      );
      
      if (availableMethods.length >= 2) {
        result.hasRequiredMethods = true;
      } else {
        result.errorMessages.push(`Missing required methods. Found: ${availableMethods.join(', ')}`);
      }

      // Test data persistence
      try {
        if (service.saveData && service.loadData) {
          await service.saveData('test', { validation: true });
          const testData = await service.loadData('test');
          result.canPersistData = testData?.validation === true;
        } else if (service.setPreference && service.getPreference) {
          service.setPreference('test', 'validation');
          const testPref = service.getPreference('test');
          result.canPersistData = testPref === 'validation';
        }
      } catch (error) {
        result.errorMessages.push(`Data persistence test failed: ${error}`);
      }

      // Test event emission
      try {
        if (service.on && service.emit) {
          let eventReceived = false;
          service.on('test-event', () => { eventReceived = true; });
          service.emit('test-event');
          result.canEmitEvents = eventReceived;
        }
      } catch (error) {
        result.errorMessages.push(`Event emission test failed: ${error}`);
      }

      // Performance metrics
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      result.performanceMetrics.initTime = endTime - startTime;
      result.performanceMetrics.memoryUsage = endMemory - startMemory;

    } catch (error) {
      result.errorMessages.push(`Validation error: ${error}`);
    }

    return result;
  }

  async validateAllServices(): Promise<ValidationReport> {
    const services = await this.importAllServices();
    this.results = [];

    for (const [serviceName, service] of Object.entries(services)) {
      const result = await this.validateService(service, serviceName);
      this.results.push(result);
    }

    const passedServices = this.results.filter(r => 
      r.isInitialized && r.hasRequiredMethods && r.errorMessages.length === 0
    ).length;

    const failedServices = this.results.length - passedServices;

    return {
      totalServices: this.results.length,
      passedServices,
      failedServices,
      results: this.results,
      overallStatus: failedServices === 0 ? 'passed' : (passedServices > 0 ? 'partial' : 'failed'),
      timestamp: new Date().toISOString()
    };
  }

  private async importAllServices(): Promise<Record<string, any>> {
    const services: Record<string, any> = {};

    try {
      // Writing Services
      services.aiWritingCompanion = (await import('../services/aiWritingCompanion')).aiWritingCompanion;
      services.creativityBooster = (await import('../services/creativityBooster')).creativityBooster;
      services.storyAssistant = (await import('../services/storyAssistant')).storyAssistant;
      services.voiceStyleCoach = (await import('../services/voiceStyleCoach')).voiceStyleCoach;
      services.predictiveWritingAssistant = (await import('../services/predictiveWritingAssistant')).predictiveWritingAssistant;
      services.writingMastery = (await import('../services/writingMastery')).writingMastery;
      services.writingPhilosophy = (await import('../services/writingPhilosophy')).writingPhilosophy;
      services.writingWellness = (await import('../services/writingWellness')).writingWellness;

      // Productivity Services
      services.personalAICoach = (await import('../services/personalAICoach')).personalAICoach;
      services.habitTracker = (await import('../services/habitTracker')).habitTracker;
      services.progressTracker = (await import('../services/progressTracker')).progressTracker;
      services.smartTemplates = (await import('../services/smartTemplates')).smartTemplates;
      services.voiceInteraction = (await import('../services/voiceInteraction')).voiceInteraction;
      services.projectAutomation = (await import('../services/projectAutomation')).projectAutomation;

      // Analytics Services
      services.personalAchievements = (await import('../services/personalAchievements')).personalAchievements;
      services.patternRecognition = (await import('../services/patternRecognition')).patternRecognition;
      services.publicationAnalytics = (await import('../services/publicationAnalytics')).publicationAnalytics;
      services.emotionalIntelligence = (await import('../services/emotionalIntelligence')).emotionalIntelligence;
      services.learningCurriculum = (await import('../services/learningCurriculum')).learningCurriculum;

      // Research & Knowledge
      services.personalKnowledgeAI = (await import('../services/personalKnowledgeAI')).personalKnowledgeAI;
      services.personalKnowledgeBase = (await import('../services/personalKnowledgeBase')).personalKnowledgeBaseService;
      services.researchAssistant = (await import('../services/researchAssistant')).researchAssistant;
      services.intelligentContentSuggestions = (await import('../services/intelligentContentSuggestions')).intelligentContentSuggestions;

      // Publishing & Platform
      services.authorPlatformTools = (await import('../services/authorPlatformTools')).default;
      services.portfolioGenerator = (await import('../services/portfolioGenerator')).default;
      services.socialMediaIntegration = (await import('../services/socialMediaIntegration')).default;
      services.contentExport = (await import('../services/contentExport')).default;
      services.personalLegacy = (await import('../services/personalLegacy')).default;

      // Infrastructure Services
      services.ultimateIntegration = (await import('../services/ultimateIntegration')).ultimateIntegration;
      services.serviceOrchestrator = (await import('../services/serviceOrchestrator')).default;
      services.backupVersioning = (await import('../services/backupVersioning')).default;
      services.predictiveWorkflow = (await import('../services/predictiveWorkflow')).predictiveWorkflow;
      services.personalGoalSetting = (await import('../services/personalGoalSetting')).default;
      
      // NovelCrafter features
      services.writingChallengesService = (await import('../services/writingChallengesService')).writingChallengesService;
      services.referenceImagesService = (await import('../services/referenceImagesService')).referenceImagesService;
      services.chapterPlanningService = (await import('../services/chapterPlanningService')).chapterPlanningService;
      services.dialogueWorkshopService = (await import('../services/dialogueWorkshopService')).dialogueWorkshopService;
      services.characterArcService = (await import('../services/characterArcService')).characterArcService;
      services.analyticsService = (await import('../services/analyticsService')).analyticsService;

    } catch (error) {
      console.error('Error importing services:', error);
    }

    return services;
  }

  generateReport(report: ValidationReport): string {
    let output = `\n=== AI SERVICE VALIDATION REPORT ===\n`;
    output += `Generated: ${report.timestamp}\n`;
    output += `Overall Status: ${report.overallStatus.toUpperCase()}\n`;
    output += `Total Services: ${report.totalServices}\n`;
    output += `Passed: ${report.passedServices}\n`;
    output += `Failed: ${report.failedServices}\n`;
    output += `Success Rate: ${((report.passedServices / report.totalServices) * 100).toFixed(1)}%\n\n`;

    // Service Details
    output += `=== SERVICE DETAILS ===\n`;
    report.results.forEach(result => {
      const status = result.isInitialized && result.hasRequiredMethods && result.errorMessages.length === 0 ? 'PASS' : 'FAIL';
      output += `\n${result.serviceName}: ${status}\n`;
      output += `  Initialized: ${result.isInitialized ? 'Yes' : 'No'}\n`;
      output += `  Required Methods: ${result.hasRequiredMethods ? 'Yes' : 'No'}\n`;
      output += `  Data Persistence: ${result.canPersistData ? 'Yes' : 'No'}\n`;
      output += `  Event Emission: ${result.canEmitEvents ? 'Yes' : 'No'}\n`;
      output += `  Init Time: ${result.performanceMetrics.initTime.toFixed(2)}ms\n`;
      output += `  Memory Usage: ${(result.performanceMetrics.memoryUsage / 1024).toFixed(2)}KB\n`;
      
      if (result.errorMessages.length > 0) {
        output += `  Errors:\n`;
        result.errorMessages.forEach(error => {
          output += `    - ${error}\n`;
        });
      }
    });

    // Performance Summary
    const avgInitTime = report.results.reduce((sum, r) => sum + r.performanceMetrics.initTime, 0) / report.results.length;
    const totalMemory = report.results.reduce((sum, r) => sum + r.performanceMetrics.memoryUsage, 0);
    
    output += `\n=== PERFORMANCE SUMMARY ===\n`;
    output += `Average Initialization Time: ${avgInitTime.toFixed(2)}ms\n`;
    output += `Total Memory Usage: ${(totalMemory / 1024).toFixed(2)}KB\n`;

    return output;
  }
}

export const serviceValidator = new ServiceValidator();
export default serviceValidator;