/**
 * Attachment Analytics Component
 * Comprehensive analytics dashboard for note attachment insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Target, 
  FolderOpen, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { projectAttachmentService, type AttachmentAnalytics } from '@/services/projectAttachmentService';
import { projectService } from '@/services/projectService';
import { quickNotesService } from '@/services/quickNotesService';
import type { Project } from '@/types/global';
import { cn } from '@/utils/cn';

interface AttachmentAnalyticsProps {
  className?: string;
}

type AnalyticsTab = 'overview' | 'projects' | 'activity' | 'suggestions';

export function AttachmentAnalytics({ className }: AttachmentAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [analytics, setAnalytics] = useState<AttachmentAnalytics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const analyticsData = projectAttachmentService.getAttachmentAnalytics();
      setAnalytics(analyticsData);
      
      const allProjects = projectService.getAllProjects().filter(p => p.status !== 'deleted');
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange: selectedTimeRange,
      ...analytics
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attachment-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Unknown Project';
  };

  const organizationRate = analytics 
    ? Math.round((analytics.totalAttachments / (analytics.totalAttachments + analytics.unattachedNotes)) * 100)
    : 0;

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Attachments</p>
              <p className="text-2xl font-bold">{analytics?.totalAttachments || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unattached Notes</p>
              <p className="text-2xl font-bold">{analytics?.unattachedNotes || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organization Rate</p>
              <p className="text-2xl font-bold">{organizationRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Confidence</p>
              <p className="text-2xl font-bold">
                {analytics?.averageConfidence ? Math.round(analytics.averageConfidence * 100) + '%' : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Organization Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Organization Progress
          </CardTitle>
          <CardDescription>
            Track your note organization journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Notes Organized</span>
              <span className="text-sm text-muted-foreground">
                {analytics?.totalAttachments || 0} of {(analytics?.totalAttachments || 0) + (analytics?.unattachedNotes || 0)}
              </span>
            </div>
            <Progress value={organizationRate} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {analytics?.unattachedNotes ? `${analytics.unattachedNotes} notes remaining` : 'All notes organized!'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachment Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Attachment Methods
          </CardTitle>
          <CardDescription>
            How your notes are being attached
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics && Object.entries(analytics.attachmentsByType).map(([type, count]) => {
              const total = analytics.totalAttachments;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      type === 'manual' ? 'bg-blue-500' :
                      type === 'auto' ? 'bg-green-500' :
                      type === 'suggested' ? 'bg-purple-500' :
                      'bg-gray-500'
                    )} />
                    <span className="text-sm capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Distribution
          </CardTitle>
          <CardDescription>
            Notes attached per project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics && Object.entries(analytics.projectDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([projectId, count]) => {
                const project = projects.find(p => p.id === projectId);
                const maxCount = Math.max(...Object.values(analytics.projectDistribution));
                const percentage = Math.round((count / maxCount) * 100);
                
                return (
                  <div key={projectId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {project?.title || 'Unknown Project'}
                        </span>
                        {project && (
                          <Badge variant="outline" className="text-xs">
                            {project.status}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">{count} notes</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest attachment operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics?.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              analytics?.recentActivity.map(activity => {
                const project = projects.find(p => p.id === activity.projectId);
                const note = quickNotesService.getQuickNoteById(activity.noteId);
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={cn(
                      'p-1 rounded-full',
                      activity.type === 'attached' ? 'bg-green-100' :
                      activity.type === 'detached' ? 'bg-red-100' :
                      activity.type === 'suggested' ? 'bg-blue-100' :
                      'bg-gray-100'
                    )}>
                      {activity.type === 'attached' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {activity.type === 'detached' && <AlertCircle className="h-4 w-4 text-red-600" />}
                      {activity.type === 'suggested' && <Target className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'migrated' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.type === 'attached' && 'Note attached'}
                        {activity.type === 'detached' && 'Note detached'}
                        {activity.type === 'suggested' && 'Suggestion created'}
                        {activity.type === 'migrated' && 'Note migrated'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        "{note?.title || 'Unknown note'}" 
                        {activity.type !== 'detached' && (
                          <> → {project?.title || 'Unknown project'}</>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuggestionsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{analytics?.suggestions.pending || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold">{analytics?.suggestions.accepted || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{analytics?.suggestions.rejected || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggestion Performance</CardTitle>
          <CardDescription>
            How well our AI suggestions are performing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics && (() => {
              const total = analytics.suggestions.accepted + analytics.suggestions.rejected;
              const acceptanceRate = total > 0 ? Math.round((analytics.suggestions.accepted / total) * 100) : 0;
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Acceptance Rate</span>
                    <span className="text-sm text-muted-foreground">{acceptanceRate}%</span>
                  </div>
                  <Progress value={acceptanceRate} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics.suggestions.accepted} accepted out of {total} reviewed suggestions
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading && !analytics) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attachment Analytics</h2>
          <p className="text-muted-foreground">
            Insights into your note organization patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            {[
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '90d', label: '90D' },
              { key: 'all', label: 'All' }
            ].map(range => (
              <button
                key={range.key}
                onClick={() => setSelectedTimeRange(range.key as any)}
                className={cn(
                  'px-3 py-1 text-sm',
                  selectedTimeRange === range.key
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <Button variant="outline" onClick={loadAnalytics} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={exportAnalytics} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'projects', label: 'Projects', icon: <FolderOpen className="h-4 w-4" /> },
            { key: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
            { key: 'suggestions', label: 'Suggestions', icon: <Target className="h-4 w-4" /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AnalyticsTab)}
              className={cn(
                'flex items-center gap-2 px-1 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'projects' && renderProjectsTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'suggestions' && renderSuggestionsTab()}
      </div>
    </div>
  );
}