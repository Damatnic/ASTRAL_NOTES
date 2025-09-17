/**
 * Create Project Modal
 * Advanced project creation with templates, settings, and validation
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  BookOpen, 
  FileText, 
  PenTool, 
  Film, 
  Users, 
  Globe, 
  X,
  Plus,
  Sparkles,
  Target,
  Calendar,
  Tag
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { toast } from '@/components/ui/Toast';
import { WRITING_GENRES, PROJECT_STATUS_OPTIONS } from '@/utils/constants';
import type { CreateProjectData } from '@/services/projectService';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  genre?: string;
  targetWordCount?: number;
  tags: string[];
  color: string;
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'novel',
    name: 'Novel',
    description: 'A full-length novel with chapters, characters, and complex plot structures',
    icon: BookOpen,
    genre: 'Fiction',
    targetWordCount: 80000,
    tags: ['novel', 'fiction', 'chapters'],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'short-story',
    name: 'Short Story',
    description: 'A concise narrative with focused plot and limited characters',
    icon: FileText,
    genre: 'Fiction',
    targetWordCount: 5000,
    tags: ['short-story', 'fiction'],
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'screenplay',
    name: 'Screenplay',
    description: 'Script for film or television with scenes, dialogue, and stage directions',
    icon: Film,
    genre: 'Screenplay',
    targetWordCount: 25000,
    tags: ['screenplay', 'script', 'film'],
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'poetry',
    name: 'Poetry Collection',
    description: 'A collection of poems with themes, styles, and emotional depth',
    icon: PenTool,
    genre: 'Poetry',
    targetWordCount: 10000,
    tags: ['poetry', 'verse', 'collection'],
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'non-fiction',
    name: 'Non-Fiction',
    description: 'Factual writing including memoirs, biographies, or educational content',
    icon: Users,
    genre: 'Non-Fiction',
    targetWordCount: 60000,
    tags: ['non-fiction', 'factual', 'research'],
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'world-building',
    name: 'World Building',
    description: 'Create detailed fictional worlds with cultures, histories, and geographies',
    icon: Globe,
    genre: 'Fantasy',
    targetWordCount: 40000,
    tags: ['world-building', 'fantasy', 'lore'],
    color: 'from-teal-500 to-cyan-600',
  },
];

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    tags: [],
    genre: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [targetWordCount, setTargetWordCount] = useState<number | ''>('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'template' | 'details'>('template');

  const { createProject } = useProjects();

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      genre: template.genre || '',
      tags: [...template.tags],
    }));
    setTargetWordCount(template.targetWordCount || '');
    setStep('details');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCustomTags(prev => prev.filter(tag => tag !== tagToRemove));
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    setIsLoading(true);

    try {
      const allTags = [
        ...formData.tags,
        ...customTags,
        ...(selectedTemplate ? [selectedTemplate.id] : []),
      ];

      const projectData: CreateProjectData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        tags: Array.from(new Set(allTags)), // Remove duplicates
      };

      await createProject(projectData);
      
      toast.success('Project created successfully!');
      handleClose();
    } catch (error) {
      toast.error('Failed to create project. Please try again.');
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', tags: [], genre: '' });
    setSelectedTemplate(null);
    setTargetWordCount('');
    setCustomTags([]);
    setNewTag('');
    setStep('template');
    setIsLoading(false);
    onClose();
  };

  const renderTemplateStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Choose a Template</h3>
        <p className="text-muted-foreground">
          Start with a template or create a custom project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECT_TEMPLATES.map((template) => {
          const IconComponent = template.icon;
          return (
            <Card
              key={template.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-cosmic-500"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      {template.targetWordCount && (
                        <p className="text-xs text-muted-foreground">
                          ~{template.targetWordCount.toLocaleString()} words
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Custom Project Option */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-cosmic-500 border-dashed"
          onClick={() => setStep('details')}
        >
          <CardContent className="p-4">
            <div className="space-y-3 text-center">
              <div className="p-2 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 text-white mx-auto w-fit">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Custom Project</h4>
                <p className="text-sm text-muted-foreground">
                  Start from scratch with your own settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Project Details</h3>
        {selectedTemplate && (
          <div className="flex items-center justify-center gap-2">
            <selectedTemplate.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Based on {selectedTemplate.name} template
            </span>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Title *
          </label>
          <Input
            type="text"
            placeholder="Enter your project title..."
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground resize-none"
            rows={3}
            placeholder="Describe your project..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Genre
            </label>
            <select
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              value={formData.genre}
              onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
            >
              <option value="">Select a genre...</option>
              {WRITING_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target Word Count
            </label>
            <Input
              type="number"
              placeholder="e.g., 80000"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Tags
        </label>
        
        {/* Template Tags */}
        {selectedTemplate && selectedTemplate.tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Template tags:</p>
            <div className="flex flex-wrap gap-1">
              {selectedTemplate.tags.map((tag) => (
                <Badge key={tag} variant="cosmic" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Custom Tags */}
        {customTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Custom tags:</p>
            <div className="flex flex-wrap gap-1">
              {customTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add New Tag */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('template')}
        >
          Back
        </Button>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            className="bg-gradient-to-r from-cosmic-500 to-cosmic-600 hover:from-cosmic-600 hover:to-cosmic-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      size="lg"
      className="max-w-4xl"
    >
      {step === 'template' ? renderTemplateStep() : renderDetailsStep()}
    </Modal>
  );
}