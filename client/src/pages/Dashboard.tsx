/**
 * Dashboard Page - Production Ready
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FolderOpen, FileText, Settings, BookOpen, Users, Brain, Zap } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { fetchProjectsAsync } from '@/store/slices/projectsSlice';
import { projectService } from '@/services/projectService';
import type { RootState, AppDispatch } from '@/store/store';

export function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, isLoading } = useSelector((state: RootState) => state.projects);

  // Load projects on component mount
  useEffect(() => {
    dispatch(fetchProjectsAsync());
  }, [dispatch]);

  // Get real statistics
  const stats = projectService.getOverallStats();
  const recentProjects = projectService.getRecentProjects(5);

  // Format time since last edit
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const edited = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - edited.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return edited.toLocaleDateString();
  };

  const dashboardStats = [
    { 
      label: 'Active Projects', 
      value: stats.activeProjects.toString(), 
      icon: FolderOpen,
      color: 'text-blue-600' 
    },
    { 
      label: 'Total Notes', 
      value: stats.totalNotes.toString(), 
      icon: FileText,
      color: 'text-green-600' 
    },
    { 
      label: 'Words Written', 
      value: stats.totalWords.toLocaleString(), 
      icon: BookOpen,
      color: 'text-purple-600' 
    },
    { 
      label: 'All Projects', 
      value: stats.totalProjects.toString(), 
      icon: Users,
      color: 'text-orange-600' 
    },
  ];

  return (
    <div className="p-6 space-y-8" data-testid="dashboard">
      {/* Enhanced Welcome section */}
      <div className="space-y-4">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold text-gradient mb-2">
            Your Personal Writing Assistant
          </h1>
          <p className="text-xl text-muted-foreground text-balance">
            {stats.totalProjects > 0 
              ? "Welcome back! Ready to continue writing?" 
              : "Let's begin your creative writing journey together"
            }
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          All systems ready
        </div>
      </div>

      {/* Enhanced Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Button
          variant="gradient"
          size="lg"
          className="h-28 flex-col gap-3 group"
          shimmer
          asChild
        >
          <Link to="/quick-notes">
            <PlusCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <div className="font-semibold">Quick Note</div>
              <div className="text-xs opacity-90">Start writing instantly</div>
            </div>
          </Link>
        </Button>
        
        <Button
          variant="elevated"
          size="lg"
          className="h-28 flex-col gap-3 group"
          asChild
        >
          <Link to="/ai-writing">
            <Brain className="h-7 w-7 group-hover:scale-110 transition-transform text-primary" />
            <div className="text-center">
              <div className="font-semibold">AI Assistant</div>
              <div className="text-xs text-muted-foreground">Get writing help</div>
            </div>
          </Link>
        </Button>
        
        <Button
          variant="glass"
          size="lg"
          className="h-28 flex-col gap-3 group"
          asChild
        >
          <Link to="/projects">
            <FolderOpen className="h-7 w-7 group-hover:scale-110 transition-transform text-primary" />
            <div className="text-center">
              <div className="font-semibold">My Projects</div>
              <div className="text-xs text-muted-foreground">Manage your work</div>
            </div>
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          size="lg"
          className="h-28 flex-col gap-3 group border border-border/50 hover:border-border"
          asChild
        >
          <Link to="/search">
            <FileText className="h-7 w-7 group-hover:scale-110 transition-transform text-muted-foreground group-hover:text-foreground" />
            <div className="text-center">
              <div className="font-semibold">Search Writing</div>
              <div className="text-xs text-muted-foreground">Find your content</div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Enhanced Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={stat.label} variant="modern" className="group hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${
                index === 0 ? 'from-blue-500/10 to-blue-600/20' :
                index === 1 ? 'from-green-500/10 to-green-600/20' :
                index === 2 ? 'from-purple-500/10 to-purple-600/20' :
                'from-orange-500/10 to-orange-600/20'
              }`}>
                <stat.icon className={`h-5 w-5 ${stat.color} group-hover:scale-110 transition-transform`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {index === 0 && 'Currently active'}
                {index === 1 && 'Total written'}
                {index === 2 && 'Completed works'}
                {index === 3 && 'This week'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Projects</h2>
          <Button variant="outline" asChild>
            <Link to="/projects">View All</Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading projects...</p>
            </div>
          ) : recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link to={`/projects/${project.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'writing' ? 'bg-green-100 text-green-800' :
                          project.status === 'editing' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'complete' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {project.wordCount.toLocaleString()} words
                        </span>
                      </div>
                    </div>
                    <CardDescription>
                      Last edited {formatTimeAgo(project.lastEditedAt)}
                      {project.description && (
                        <span className="block text-sm mt-1">{project.description}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))
          ) : null}
        </div>

        {recentProjects.length === 0 && !isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first project to get started with your writing journey.
              </p>
              <Button asChild>
                <Link to="/projects/new">Create Your First Project</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
