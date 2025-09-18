/**
 * Project Editor Page
 * Edit project details and settings
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { projectService } from '@/services/projectService';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import type { Project } from '@/types';

export function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    status: 'active' as const
  });

  useEffect(() => {
    if (!id) {
      navigate('/projects');
      return;
    }

    try {
      const projectData = projectService.getProject(id);
      if (!projectData) {
        showToast('Project not found', 'error');
        navigate('/projects');
        return;
      }

      setProject(projectData);
      setFormData({
        title: projectData.title,
        description: projectData.description || '',
        tags: projectData.tags || [],
        status: projectData.status
      });
    } catch (error) {
      console.error('Error loading project:', error);
      showToast('Error loading project', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  const handleSave = async () => {
    if (!project || !id) return;

    setSaving(true);
    try {
      const updatedProject: Project = {
        ...project,
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags,
        status: formData.status,
        updatedAt: new Date().toISOString()
      };

      projectService.updateProject(id, updatedProject);
      setProject(updatedProject);
      showToast('Project updated successfully', 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      showToast('Error updating project', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !id) return;

    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      projectService.deleteProject(id);
      showToast('Project deleted successfully', 'success');
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Error deleting project', 'error');
    }
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground mb-2">Project not found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${id}`)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>
        <h1 className="text-3xl font-bold">Edit Project</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Project Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project title"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter project description"
                rows={4}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="fiction, novel, writing"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'archived' | 'completed' }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
            className="shrink-0"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}