/**
 * Professional Writing Toolkit - Complete suite of professional writing tools
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { 
  Briefcase, 
  FileText, 
  Target, 
  Calendar, 
  DollarSign, 
  Users,
  BarChart3,
  Settings,
  Download,
  Upload,
  Share,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Trophy,
  Star,
  TrendingUp,
  Globe,
  Mail,
  Phone,
  MapPin,
  Award,
  BookOpen,
  PenTool,
  Zap,
  Brain,
  Shield,
  Sparkles
} from 'lucide-react';

// Import services
import portfolioGeneratorService from '@/services/portfolioGenerator';
import authorPlatformToolsService from '@/services/authorPlatformTools';
import publicationAnalyticsService from '@/services/publicationAnalytics';
import socialMediaIntegrationService from '@/services/socialMediaIntegration';
import contentExportService from '@/services/contentExport';

interface Project {
  id: string;
  title: string;
  type: 'article' | 'book' | 'blog' | 'academic' | 'marketing' | 'technical';
  status: 'draft' | 'review' | 'published' | 'archived';
  deadline?: number;
  client?: string;
  wordCount: number;
  targetWordCount: number;
  rate?: number;
  currency?: string;
  createdAt: number;
  updatedAt: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  projects: number;
  totalEarnings: number;
  averageRating: number;
  lastContact: number;
}

interface PublicationMetrics {
  totalPublications: number;
  totalViews: number;
  totalEngagement: number;
  averageRating: number;
  topPerformingContent: string[];
  recentTrends: Array<{ date: string; views: number; engagement: number }>;
}

interface ProfessionalGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  targetDate: number;
  category: 'income' | 'publications' | 'clients' | 'skills' | 'recognition';
  isCompleted: boolean;
}

export function ProfessionalWritingToolkit() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<PublicationMetrics | null>(null);
  const [goals, setGoals] = useState<ProfessionalGoal[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    loadProfessionalData();
  }, []);

  const loadProfessionalData = async () => {
    // Mock professional data
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'AI in Healthcare: A Comprehensive Guide',
        type: 'article',
        status: 'review',
        deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        client: 'TechMed Publications',
        wordCount: 4200,
        targetWordCount: 5000,
        rate: 0.15,
        currency: 'USD',
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 2 * 60 * 60 * 1000
      },
      {
        id: '2',
        title: 'The Future of Remote Work',
        type: 'blog',
        status: 'published',
        client: 'Future Trends Blog',
        wordCount: 2800,
        targetWordCount: 3000,
        rate: 0.12,
        currency: 'USD',
        createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
      },
      {
        id: '3',
        title: 'Complete Guide to Digital Marketing',
        type: 'book',
        status: 'draft',
        deadline: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
        wordCount: 12000,
        targetWordCount: 50000,
        rate: 5000,
        currency: 'USD',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 1 * 60 * 60 * 1000
      }
    ];

    const mockClients: Client[] = [
      {
        id: '1',
        name: 'TechMed Publications',
        email: 'editor@techmed.com',
        company: 'TechMed Publications Inc.',
        projects: 3,
        totalEarnings: 2250,
        averageRating: 4.8,
        lastContact: Date.now() - 2 * 24 * 60 * 60 * 1000
      },
      {
        id: '2',
        name: 'Future Trends Blog',
        email: 'content@futuretrends.com',
        projects: 5,
        totalEarnings: 1800,
        averageRating: 4.6,
        lastContact: Date.now() - 7 * 24 * 60 * 60 * 1000
      },
      {
        id: '3',
        name: 'Global Marketing Corp',
        email: 'marketing@globalcorp.com',
        company: 'Global Marketing Corporation',
        projects: 1,
        totalEarnings: 5000,
        averageRating: 5.0,
        lastContact: Date.now() - 1 * 24 * 60 * 60 * 1000
      }
    ];

    const mockMetrics: PublicationMetrics = {
      totalPublications: 47,
      totalViews: 125000,
      totalEngagement: 8500,
      averageRating: 4.7,
      topPerformingContent: [
        'The Future of Remote Work',
        'AI in Healthcare: A Comprehensive Guide',
        'Digital Marketing Strategies'
      ],
      recentTrends: [
        { date: '2024-01-01', views: 1200, engagement: 85 },
        { date: '2024-01-02', views: 1350, engagement: 92 },
        { date: '2024-01-03', views: 1180, engagement: 78 }
      ]
    };

    const mockGoals: ProfessionalGoal[] = [
      {
        id: '1',
        title: 'Reach $10,000 Monthly Income',
        description: 'Achieve consistent monthly income of $10,000 from writing projects',
        targetValue: 10000,
        currentValue: 7500,
        targetDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        category: 'income',
        isCompleted: false
      },
      {
        id: '2',
        title: 'Publish 50 Articles This Year',
        description: 'Complete and publish 50 high-quality articles across various platforms',
        targetValue: 50,
        currentValue: 32,
        targetDate: Date.now() + 120 * 24 * 60 * 60 * 1000,
        category: 'publications',
        isCompleted: false
      },
      {
        id: '3',
        title: 'Build Network of 20 Regular Clients',
        description: 'Establish ongoing relationships with 20 reliable clients',
        targetValue: 20,
        currentValue: 8,
        targetDate: Date.now() + 180 * 24 * 60 * 60 * 1000,
        category: 'clients',
        isCompleted: false
      }
    ];

    setProjects(mockProjects);
    setClients(mockClients);
    setMetrics(mockMetrics);
    setGoals(mockGoals);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-500';
      case 'review': return 'bg-blue-500';
      case 'published': return 'bg-green-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />;
      case 'book': return <BookOpen className="h-4 w-4" />;
      case 'blog': return <Globe className="h-4 w-4" />;
      case 'academic': return <Award className="h-4 w-4" />;
      case 'marketing': return <Target className="h-4 w-4" />;
      case 'technical': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const calculateEarnings = () => {
    return projects.reduce((total, project) => {
      if (project.rate && project.status === 'published') {
        return total + (project.rate * (project.wordCount / 1000));
      }
      return total;
    }, 0);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status !== 'published' && p.status !== 'archived').length}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateEarnings())}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPublications || 0}</div>
            <p className="text-xs text-muted-foreground">Lifetime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageRating || 0}</div>
            <p className="text-xs text-muted-foreground">Client satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Projects</CardTitle>
              <CardDescription>Active writing projects and deadlines</CardDescription>
            </div>
            <Button>
              <PenTool className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getTypeIcon(project.type)}
                  <div>
                    <h4 className="font-medium">{project.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{project.client}</span>
                      {project.deadline && (
                        <>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>Due {formatDate(project.deadline)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {project.wordCount.toLocaleString()} / {project.targetWordCount.toLocaleString()} words
                    </div>
                    <Progress 
                      value={(project.wordCount / project.targetWordCount) * 100} 
                      className="w-24 h-2"
                    />
                  </div>
                  <Badge className={`text-white ${getStatusColor(project.status)}`}>
                    {project.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Professional Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Goals</CardTitle>
          <CardDescription>Track your writing career objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">{goal.title}</span>
                  </div>
                  <Badge variant="outline">
                    {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                  </Badge>
                </div>
                <Progress value={(goal.currentValue / goal.targetValue) * 100} />
                <div className="text-sm text-muted-foreground">
                  {goal.currentValue} / {goal.targetValue} • Due {formatDate(goal.targetDate)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage your writing projects and track progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button>
            <PenTool className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(project.type)}
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>
                      {project.client} • {project.type} • Created {formatDate(project.createdAt)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-white ${getStatusColor(project.status)}`}>
                    {project.status}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(project.wordCount / project.targetWordCount) * 100} 
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">
                        {Math.round((project.wordCount / project.targetWordCount) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.wordCount.toLocaleString()} / {project.targetWordCount.toLocaleString()} words
                    </p>
                  </div>
                  
                  {project.rate && (
                    <div>
                      <p className="text-sm font-medium mb-1">Earnings</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(project.rate * (project.wordCount / 1000))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(project.rate)} per 1000 words
                      </p>
                    </div>
                  )}
                </div>

                {project.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      Deadline: {formatDate(project.deadline)} 
                      {project.deadline < Date.now() ? ' (Overdue)' : ''}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clients</h2>
          <p className="text-muted-foreground">Manage your client relationships and track interactions</p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <CardDescription>
                    {client.company && `${client.company} • `}
                    Last contact: {formatDate(client.lastContact)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{client.averageRating}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Projects</p>
                  <p className="text-2xl font-bold">{client.projects}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(client.totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{client.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline">
                  <Mail className="h-3 w-3 mr-1" />
                  Contact
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-3 w-3 mr-1" />
                  New Project
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">Track your writing business performance and growth</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEngagement.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Comments, shares, likes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPublications}</div>
              <p className="text-xs text-muted-foreground">Published works</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageRating}</div>
              <p className="text-xs text-muted-foreground">Average client rating</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>AI-powered insights about your writing business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-medium text-green-900">Strong Performance</h4>
              <p className="text-sm text-green-700 mt-1">
                Your client satisfaction rate is 20% above industry average. Great work maintaining quality!
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-medium text-blue-900">Growth Opportunity</h4>
              <p className="text-sm text-blue-700 mt-1">
                Consider raising your rates. Your quality metrics suggest you could charge 15-20% more.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-medium text-yellow-900">Trend Alert</h4>
              <p className="text-sm text-yellow-700 mt-1">
                AI and technology content is trending up 35%. Consider expanding in this niche.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Professional Writing Toolkit</h1>
          <p className="text-muted-foreground">
            Complete suite of tools for managing your professional writing business
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {renderProjects()}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          {renderClients()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}