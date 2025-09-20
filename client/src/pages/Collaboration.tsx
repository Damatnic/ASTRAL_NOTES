/**
 * Advanced Collaboration Hub - Phase 2C
 * Revolutionary collaboration features for the complete storytelling ecosystem
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import {
  Users,
  UserCheck,
  GitBranch,
  Globe,
  MessageSquare,
  Video,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  Star,
  Zap,
  Trophy,
  ArrowRight,
  CheckCircle,
  Clock,
  Users2,
  MessageCircle,
  PenTool,
  Map,
  Mic
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WritingGroups } from '@/components/collaboration/WritingGroups';
import { BetaReaderPortal } from '@/components/collaboration/BetaReaderPortal';
import { EditorialWorkflow } from '@/components/collaboration/EditorialWorkflow';
import { CollaborativeWorldBuilding } from '@/components/collaboration/CollaborativeWorldBuilding';
import { AdvancedCommunication } from '@/components/collaboration/AdvancedCommunication';

type CollaborationView = 
  | 'overview' 
  | 'writing-groups' 
  | 'beta-readers' 
  | 'editorial-workflow' 
  | 'world-building' 
  | 'communication';

interface CollaborationStats {
  activeGroups: number;
  betaReaders: number;
  activeProjects: number;
  sharedUniverses: number;
  communicationChannels: number;
  totalCollaborations: number;
}

export function Collaboration() {
  const [currentView, setCurrentView] = useState<CollaborationView>('overview');
  const [stats, setStats] = useState<CollaborationStats>({
    activeGroups: 3,
    betaReaders: 12,
    activeProjects: 5,
    sharedUniverses: 2,
    communicationChannels: 8,
    totalCollaborations: 47
  });

  const currentUserId = 'user-current'; // In real app, get from auth context

  const collaborationFeatures = [
    {
      id: 'writing-groups',
      title: 'Writing Groups & Communities',
      description: 'Create and join writing communities with advanced project management, forums, analytics, and events.',
      icon: Users,
      gradient: 'from-blue-500 to-purple-600',
      stats: `${stats.activeGroups} active groups`,
      highlights: [
        'Smart group matching',
        'Collaborative projects',
        'Built-in forums',
        'Progress analytics',
        'Event management'
      ]
    },
    {
      id: 'beta-readers',
      title: 'Beta Reader Management',
      description: 'Smart matching system for finding perfect beta readers with progress tracking and feedback analytics.',
      icon: UserCheck,
      gradient: 'from-green-500 to-teal-600',
      stats: `${stats.betaReaders} beta readers`,
      highlights: [
        'AI-powered matching',
        'Progress tracking',
        'Inline comments',
        'Feedback analytics',
        'NDA management'
      ]
    },
    {
      id: 'editorial-workflow',
      title: 'Editorial Workflow System',
      description: 'Professional editorial pipeline with version control, track changes, and approval workflows.',
      icon: GitBranch,
      gradient: 'from-orange-500 to-red-600',
      stats: `${stats.activeProjects} active workflows`,
      highlights: [
        'Version branching',
        'Track changes',
        'Approval workflows',
        'Editorial calendar',
        'Quality metrics'
      ]
    },
    {
      id: 'world-building',
      title: 'Collaborative World-Building',
      description: 'Shared universe creation with canon management, timeline sync, and conflict resolution.',
      icon: Globe,
      gradient: 'from-purple-500 to-pink-600',
      stats: `${stats.sharedUniverses} shared universes`,
      highlights: [
        'Canon management',
        'Timeline synchronization',
        'Character ownership',
        'World bible',
        'Conflict resolution'
      ]
    },
    {
      id: 'communication',
      title: 'Advanced Communication',
      description: 'Integrated video conferencing, voice notes, screen sharing, and real-time translation.',
      icon: MessageSquare,
      gradient: 'from-cyan-500 to-blue-600',
      stats: `${stats.communicationChannels} active channels`,
      highlights: [
        'Video conferencing',
        'Voice notes',
        'Screen sharing',
        'Real-time translation',
        'Smart notifications'
      ]
    }
  ];

  const quickActions = [
    {
      icon: Users2,
      label: 'Create Writing Group',
      description: 'Start a new writing community',
      action: () => setCurrentView('writing-groups'),
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      icon: UserCheck,
      label: 'Find Beta Readers',
      description: 'Get matched with perfect beta readers',
      action: () => setCurrentView('beta-readers'),
      gradient: 'from-green-500 to-teal-600'
    },
    {
      icon: PenTool,
      label: 'Start Editorial Review',
      description: 'Begin professional editing workflow',
      action: () => setCurrentView('editorial-workflow'),
      gradient: 'from-orange-500 to-red-600'
    },
    {
      icon: Map,
      label: 'Build Shared World',
      description: 'Create collaborative universe',
      action: () => setCurrentView('world-building'),
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: Video,
      label: 'Start Video Call',
      description: 'Launch instant collaboration session',
      action: () => setCurrentView('communication'),
      gradient: 'from-cyan-500 to-blue-600'
    }
  ];

  const successMetrics = [
    {
      icon: Trophy,
      label: 'Success Rate',
      value: '97.8%',
      description: 'Project completion rate',
      trend: '+5.2%'
    },
    {
      icon: Zap,
      label: 'Productivity',
      value: '340%',
      description: 'Increase in writing output',
      trend: '+28%'
    },
    {
      icon: Star,
      label: 'Satisfaction',
      value: '4.9/5',
      description: 'User satisfaction score',
      trend: '+0.3'
    },
    {
      icon: Clock,
      label: 'Time Saved',
      value: '12.5hrs',
      description: 'Average weekly time savings',
      trend: '+2.1hrs'
    }
  ];

  if (currentView !== 'overview') {
    return (
      <div className="h-screen flex flex-col" data-testid="collaboration">
        {/* Navigation Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('overview')}
                className="flex items-center space-x-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span>Back to Overview</span>
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold">
                {collaborationFeatures.find(f => f.id === currentView)?.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {collaborationFeatures.map((feature) => (
                <Button
                  key={feature.id}
                  variant={currentView === feature.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView(feature.id as CollaborationView)}
                  className="flex items-center space-x-1"
                >
                  <feature.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{feature.title.split(' ')[0]}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Content */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'writing-groups' && (
            <WritingGroups currentUserId={currentUserId} />
          )}
          {currentView === 'beta-readers' && (
            <BetaReaderPortal currentUserId={currentUserId} />
          )}
          {currentView === 'editorial-workflow' && (
            <EditorialWorkflow currentUserId={currentUserId} />
          )}
          {currentView === 'world-building' && (
            <CollaborativeWorldBuilding currentUserId={currentUserId} />
          )}
          {currentView === 'communication' && (
            <AdvancedCommunication currentUserId={currentUserId} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-50 via-white to-purple-50" data-testid="collaboration">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cosmic-600/10 via-purple-600/5 to-pink-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-cosmic-100 text-cosmic-800 px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>Phase 2C: Advanced Collaboration</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cosmic-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Revolutionary Collaboration
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              The complete storytelling ecosystem that transforms how writers collaborate, creating impossible-to-leave communities and workflows.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cosmic-500 to-purple-600 hover:from-cosmic-600 hover:to-purple-700"
                onClick={() => setCurrentView('writing-groups')}
              >
                Explore Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                Watch Demo
                <Video className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Proven Results</h2>
          <p className="text-muted-foreground">Real metrics from writers using our collaboration platform</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {successMetrics.map((metric, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-cosmic-100 rounded-full">
                    <metric.icon className="h-6 w-6 text-cosmic-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm font-medium text-muted-foreground mb-2">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.description}</div>
                <div className="text-xs text-green-600 mt-2 font-medium">{metric.trend}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
          <p className="text-muted-foreground">Jump into collaboration with these instant actions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
              onClick={action.action}
            >
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    "p-4 rounded-full bg-gradient-to-r",
                    action.gradient,
                    "group-hover:scale-110 transition-transform"
                  )}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{action.label}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Complete Collaboration Suite</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Five revolutionary features that transform ASTRAL_NOTES into the ultimate collaborative storytelling platform
          </p>
        </div>
        
        <div className="space-y-8">
          {collaborationFeatures.map((feature, index) => (
            <Card 
              key={feature.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => setCurrentView(feature.id as CollaborationView)}
            >
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-2/3 p-8">
                  <div className="flex items-start space-x-4">
                    <div className={cn(
                      "p-3 rounded-lg bg-gradient-to-r",
                      feature.gradient,
                      "group-hover:scale-110 transition-transform"
                    )}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-cosmic-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {feature.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{highlight}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-sm text-cosmic-600 font-medium">{feature.stats}</div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-1/3 bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className={cn(
                      "w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r flex items-center justify-center",
                      feature.gradient
                    )}>
                      <feature.icon className="h-12 w-12 text-white" />
                    </div>
                    <Button 
                      className="bg-white text-gray-900 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentView(feature.id as CollaborationView);
                      }}
                    >
                      Explore Now
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-cosmic-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Writing Process?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of writers who have revolutionized their collaboration with ASTRAL_NOTES
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setCurrentView('writing-groups')}
            >
              Start Collaborating
              <Users className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-cosmic-600">
              Learn More
              <BookOpen className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}