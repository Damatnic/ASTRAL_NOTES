/**
 * AI Hub Dashboard - Central control panel for all AI services
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { ShadcnTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Brain, 
  Zap, 
  Activity, 
  Settings, 
  BookOpen, 
  PenTool, 
  Mic, 
  TrendingUp,
  Users,
  Cloud,
  Workflow,
  Target,
  BarChart3,
  Lightbulb,
  Shield,
  Sparkles
} from 'lucide-react';

// Import AI services
import aiWritingCompanionService from '@/services/aiWritingCompanion';
import voiceInteractionService from '@/services/voiceInteraction';
import predictiveWorkflowService from '@/services/predictiveWorkflow';
import personalKnowledgeAIService from '@/services/personalKnowledgeAI';
import ultimateIntegrationService from '@/services/ultimateIntegration';
import creativityBoosterService from '@/services/creativityBooster';
import writingMasteryService from '@/services/writingMastery';
import personalAICoachService from '@/services/personalAICoach';

interface AIServiceStatus {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  usage: number;
  icon: React.ComponentType<any>;
  category: 'writing' | 'productivity' | 'analytics' | 'automation' | 'learning';
  features: string[];
}

interface SystemMetrics {
  totalServices: number;
  activeServices: number;
  dailyUsage: number;
  performanceScore: number;
  userSatisfaction: number;
}

export function AIHubDashboard() {
  const [services, setServices] = useState<AIServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalServices: 35,
    activeServices: 32,
    dailyUsage: 87,
    performanceScore: 94,
    userSatisfaction: 96
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAIServices();
  }, []);

  const loadAIServices = async () => {
    const serviceList: AIServiceStatus[] = [
      {
        id: 'ai-writing-companion',
        name: 'AI Writing Companion',
        description: 'Intelligent writing assistant with 5 personalities',
        status: 'active',
        usage: 92,
        icon: PenTool,
        category: 'writing',
        features: ['Real-time suggestions', 'Style adaptation', 'Grammar checking', 'Character voices']
      },
      {
        id: 'voice-interaction',
        name: 'Voice Interaction',
        description: 'Voice-to-text and AI voice commands',
        status: 'active',
        usage: 68,
        icon: Mic,
        category: 'productivity',
        features: ['Voice dictation', 'Command recognition', 'Audio feedback', 'Multi-language']
      },
      {
        id: 'predictive-workflow',
        name: 'Predictive Workflow',
        description: 'AI-powered workflow automation and prediction',
        status: 'active',
        usage: 85,
        icon: Workflow,
        category: 'automation',
        features: ['Workflow prediction', 'Task automation', 'Pattern recognition', 'Smart scheduling']
      },
      {
        id: 'personal-knowledge-ai',
        name: 'Personal Knowledge AI',
        description: 'Semantic search and knowledge management',
        status: 'active',
        usage: 76,
        icon: Brain,
        category: 'productivity',
        features: ['Semantic search', 'Knowledge graphs', 'Auto-categorization', 'Context awareness']
      },
      {
        id: 'creativity-booster',
        name: 'Creativity Booster',
        description: 'AI-powered creative inspiration and ideation',
        status: 'active',
        usage: 59,
        icon: Lightbulb,
        category: 'writing',
        features: ['Idea generation', 'Creative prompts', 'Story seeds', 'Character development']
      },
      {
        id: 'writing-mastery',
        name: 'Writing Mastery',
        description: 'Advanced writing skills development',
        status: 'active',
        usage: 73,
        icon: Target,
        category: 'learning',
        features: ['Skill assessment', 'Personalized lessons', 'Progress tracking', 'Expert feedback']
      },
      {
        id: 'personal-ai-coach',
        name: 'Personal AI Coach',
        description: 'Personalized coaching for writing improvement',
        status: 'active',
        usage: 81,
        icon: Users,
        category: 'learning',
        features: ['Goal setting', 'Progress monitoring', 'Motivation tracking', 'Habit formation']
      },
      {
        id: 'analytics-intelligence',
        name: 'Analytics Intelligence',
        description: 'Advanced writing analytics and insights',
        status: 'active',
        usage: 64,
        icon: BarChart3,
        category: 'analytics',
        features: ['Performance metrics', 'Trend analysis', 'Predictive insights', 'Custom reports']
      }
    ];

    setServices(serviceList);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'writing': return 'bg-blue-500';
      case 'productivity': return 'bg-green-500';
      case 'analytics': return 'bg-purple-500';
      case 'automation': return 'bg-orange-500';
      case 'learning': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalServices}</div>
            <p className="text-xs text-muted-foreground">AI-powered features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeServices}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performanceScore}%</div>
            <Progress value={metrics.performanceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.userSatisfaction}%</div>
            <Progress value={metrics.userSatisfaction} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used AI features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="flex flex-col gap-2 h-auto p-4">
              <PenTool className="h-5 w-5" />
              <span className="text-sm">Start Writing</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-2 h-auto p-4">
              <Mic className="h-5 w-5" />
              <span className="text-sm">Voice Mode</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-2 h-auto p-4">
              <Brain className="h-5 w-5" />
              <span className="text-sm">Smart Search</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-2 h-auto p-4">
              <Target className="h-5 w-5" />
              <span className="text-sm">Set Goals</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['writing', 'productivity', 'analytics', 'automation', 'learning'].map((category) => {
          const categoryServices = services.filter(s => s.category === category);
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category} Services</CardTitle>
                <CardDescription>{categoryServices.length} active services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryServices.slice(0, 3).map((service) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <service.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-white ${getStatusColor(service.status)}`}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                  {categoryServices.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full">
                      View {categoryServices.length - 3} more...
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-4">
      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <service.icon className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    className={`text-white ${getCategoryColor(service.category)}`}
                  >
                    {service.category}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={`text-white ${getStatusColor(service.status)}`}
                  >
                    {service.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Usage</span>
                    <span>{service.usage}%</span>
                  </div>
                  <Progress value={service.usage} />
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button size="sm" variant="outline">
                    <Activity className="h-3 w-3 mr-1" />
                    Monitor
                  </Button>
                  <Button size="sm" variant="outline">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Hub</h1>
          <p className="text-muted-foreground">
            Central command center for all your AI-powered writing tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Quick Setup
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {renderServices()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Detailed analytics and insights coming soon...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Advanced analytics features will be available here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global AI Settings</CardTitle>
              <CardDescription>Configure AI behavior and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <p>Global settings panel coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}