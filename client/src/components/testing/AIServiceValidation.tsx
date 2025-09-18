/**
 * AI Service Validation Component
 * Provides UI for testing and validating all AI services
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { ShadcnTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BarChart3, 
  Clock, 
  HardDrive,
  Download,
  RefreshCw
} from 'lucide-react';
import { serviceValidator, ValidationReport, ServiceValidationResult } from '@/utils/serviceValidator';

export function AIServiceValidation() {
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runValidation = async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 100);

      const report = await serviceValidator.validateAllServices();
      
      clearInterval(progressInterval);
      setProgress(100);
      setValidationReport(report);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (result: ServiceValidationResult) => {
    if (result.isInitialized && result.hasRequiredMethods && result.errorMessages.length === 0) {
      return 'text-green-600 bg-green-100';
    } else if (result.isInitialized || result.hasRequiredMethods) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-red-600 bg-red-100';
    }
  };

  const getStatusIcon = (result: ServiceValidationResult) => {
    if (result.isInitialized && result.hasRequiredMethods && result.errorMessages.length === 0) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (result.isInitialized || result.hasRequiredMethods) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const downloadReport = () => {
    if (!validationReport) return;
    
    const reportText = serviceValidator.generateReport(validationReport);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-service-validation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => {
    if (!validationReport) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validationReport.totalServices}</div>
              <p className="text-xs text-muted-foreground">AI services tested</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{validationReport.passedServices}</div>
              <p className="text-xs text-muted-foreground">Fully functional</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{validationReport.failedServices}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Badge className={validationReport.overallStatus === 'passed' ? 'bg-green-500' : 'bg-yellow-500'}>
                {validationReport.overallStatus}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((validationReport.passedServices / validationReport.totalServices) * 100).toFixed(1)}%
              </div>
              <Progress 
                value={(validationReport.passedServices / validationReport.totalServices) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Status</CardTitle>
            <CardDescription>
              Overall system health: <Badge className={validationReport.overallStatus === 'passed' ? 'bg-green-500' : 'bg-yellow-500'}>
                {validationReport.overallStatus.toUpperCase()}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Generated: {new Date(validationReport.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderServiceDetails = () => {
    if (!validationReport) return null;

    const groupedResults = validationReport.results.reduce((groups, result) => {
      // Categorize services based on name patterns
      let category = 'Other';
      if (result.serviceName.includes('writing') || result.serviceName.includes('Writing') || 
          ['creativityBooster', 'storyAssistant', 'voiceStyleCoach', 'writingMastery', 'writingPhilosophy', 'writingWellness'].includes(result.serviceName)) {
        category = 'Writing Services';
      } else if (['personalAICoach', 'habitTracker', 'progressTracker', 'smartTemplates', 'voiceInteraction', 'projectAutomation'].includes(result.serviceName)) {
        category = 'Productivity Services';
      } else if (['personalAchievements', 'patternRecognition', 'publicationAnalytics', 'emotionalIntelligence', 'learningCurriculum'].includes(result.serviceName)) {
        category = 'Analytics Services';
      } else if (['personalKnowledgeAI', 'personalKnowledgeBase', 'researchAssistant', 'intelligentContentSuggestions'].includes(result.serviceName)) {
        category = 'Research & Knowledge';
      } else if (['authorPlatformTools', 'portfolioGenerator', 'socialMediaIntegration', 'contentExport', 'personalLegacy'].includes(result.serviceName)) {
        category = 'Publishing & Platform';
      } else if (['ultimateIntegration', 'serviceOrchestrator', 'backupVersioning', 'crossPlatformSync', 'predictiveWorkflow', 'personalGoalSetting'].includes(result.serviceName)) {
        category = 'Infrastructure Services';
      }

      if (!groups[category]) groups[category] = [];
      groups[category].push(result);
      return groups;
    }, {} as Record<string, ServiceValidationResult[]>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedResults).map(([category, results]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>{results.length} services in this category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.serviceName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result)}
                        <h4 className="font-medium">{result.serviceName}</h4>
                      </div>
                      <Badge className={getStatusColor(result)}>
                        {result.isInitialized && result.hasRequiredMethods && result.errorMessages.length === 0 ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${result.isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs">Initialized</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${result.hasRequiredMethods ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs">Methods</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${result.canPersistData ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <span className="text-xs">Persistence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${result.canEmitEvents ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <span className="text-xs">Events</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.performanceMetrics.initTime.toFixed(2)}ms
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {(result.performanceMetrics.memoryUsage / 1024).toFixed(2)}KB
                      </div>
                    </div>

                    {result.errorMessages.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <h5 className="text-sm font-medium text-red-800 mb-1">Errors:</h5>
                        <ul className="text-xs text-red-700 space-y-1">
                          {result.errorMessages.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderPerformance = () => {
    if (!validationReport) return null;

    const avgInitTime = validationReport.results.reduce((sum, r) => sum + r.performanceMetrics.initTime, 0) / validationReport.results.length;
    const totalMemory = validationReport.results.reduce((sum, r) => sum + r.performanceMetrics.memoryUsage, 0);
    const slowestService = validationReport.results.reduce((max, r) => 
      r.performanceMetrics.initTime > max.performanceMetrics.initTime ? r : max
    );
    const heaviestService = validationReport.results.reduce((max, r) => 
      r.performanceMetrics.memoryUsage > max.performanceMetrics.memoryUsage ? r : max
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Overall system performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Init Time</span>
                  <span>{avgInitTime.toFixed(2)}ms</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: &lt; 50ms per service
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Memory Usage</span>
                  <span>{(totalMemory / 1024).toFixed(2)}KB</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: &lt; 10MB total
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Issues</CardTitle>
              <CardDescription>Services requiring optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Slowest Service</h4>
                <div className="text-xs text-muted-foreground">
                  {slowestService.serviceName}: {slowestService.performanceMetrics.initTime.toFixed(2)}ms
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium">Heaviest Service</h4>
                <div className="text-xs text-muted-foreground">
                  {heaviestService.serviceName}: {(heaviestService.performanceMetrics.memoryUsage / 1024).toFixed(2)}KB
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Performance Chart</CardTitle>
            <CardDescription>Initialization time for each service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationReport.results
                .sort((a, b) => b.performanceMetrics.initTime - a.performanceMetrics.initTime)
                .map((result) => (
                  <div key={result.serviceName} className="flex items-center gap-3">
                    <div className="w-32 text-xs truncate">{result.serviceName}</div>
                    <div className="flex-1">
                      <Progress 
                        value={(result.performanceMetrics.initTime / slowestService.performanceMetrics.initTime) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="w-16 text-xs text-right">{result.performanceMetrics.initTime.toFixed(2)}ms</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Service Validation</h1>
          <p className="text-muted-foreground">
            Comprehensive testing and validation of all AI services
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runValidation} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running...' : 'Run Validation'}
          </Button>
          {validationReport && (
            <Button 
              variant="outline" 
              onClick={downloadReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Running AI service validation...</span>
            </div>
            <Progress value={progress} className="mt-3" />
          </CardContent>
        </Card>
      )}

      {validationReport && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Service Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {renderServiceDetails()}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {renderPerformance()}
          </TabsContent>
        </Tabs>
      )}

      {!validationReport && !isRunning && (
        <Card>
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p className="mb-4">Run validation to test all AI services</p>
              <Button onClick={runValidation}>
                <Play className="h-4 w-4 mr-2" />
                Start Validation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}