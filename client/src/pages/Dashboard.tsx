/**
 * Dashboard Page - Production Ready
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FolderOpen, FileText, Clock, BookOpen, Users } from 'lucide-react';
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
    <div className="p-6 space-y-8">
      {/* Welcome section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome to Astral Notes
        </h1>
        <p className="text-muted-foreground">
          {stats.totalProjects > 0 
            ? "Continue your creative writing journey" 
            : "Start your creative writing journey today"
          }
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-24 flex-col gap-2"
          asChild
        >
          <Link to="/projects/new">
            <PlusCircle className="h-6 w-6" />
            New Project
          </Link>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="h-24 flex-col gap-2"
          asChild
        >
          <Link to="/projects">
            <FolderOpen className="h-6 w-6" />
            View Projects
          </Link>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="h-24 flex-col gap-2"
          asChild
        >
          <Link to="/search">
            <FileText className="h-6 w-6" />
            Search Notes
          </Link>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="h-24 flex-col gap-2"
          asChild
        >
          <Link to="/settings">
            <Clock className="h-6 w-6" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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