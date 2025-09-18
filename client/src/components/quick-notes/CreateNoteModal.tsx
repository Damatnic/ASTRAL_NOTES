/**
 * Create Note Modal Component
 * Modal for creating new quick notes
 */

import React, { useState } from 'react';
import { X, Plus, Tag, FolderOpen } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextEditor } from '@/components/ui/TextEditor';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { CreateQuickNoteData } from '@/services/quickNotesService';
import { NoteType } from '@/types/global';
import { cn } from '@/utils/cn';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuickNoteData) => void;
  availableProjects: Array<{ id: string; title: string }>;
  availableTags: string[];
}

const NOTE_TYPES: Array<{ value: NoteType; label: string; description: string }> = [
  { value: 'note', label: 'General Note', description: 'General purpose note' },
  { value: 'research', label: 'Research', description: 'Research and references' },
  { value: 'dialogue', label: 'Dialogue', description: 'Dialogue snippets' },
  { value: 'character', label: 'Character', description: 'Character notes' },
  { value: 'location', label: 'Location', description: 'Location details' },
  { value: 'item', label: 'Item', description: 'Item descriptions' },
  { value: 'plotthread', label: 'Plot Thread', description: 'Plot development' },
  { value: 'theme', label: 'Theme', description: 'Themes and motifs' },
  { value: 'worldrule', label: 'World Rule', description: 'World-building rules' },
  { value: 'reference', label: 'Reference', description: 'Reference materials' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
] as const;

export function CreateNoteModal({
  isOpen,
  onClose,
  onSubmit,
  availableProjects,
  availableTags,
}: CreateNoteModalProps) {
  const [formData, setFormData] = useState<CreateQuickNoteData & { priority?: 'low' | 'medium' | 'high' | 'urgent' }>({
    title: '',
    content: '',
    type: 'note',
    tags: [],
    projectId: null,
    priority: 'medium',
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        title: formData.title.trim(),
        content: formData.content?.trim(),
        type: formData.type,
        tags: formData.tags,
        projectId: formData.projectId,
      });
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        type: 'note',
        tags: [],
        projectId: null,
        priority: 'medium',
      });
      setNewTag('');
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleAddExistingTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
    }
  };

  const selectedProject = availableProjects.find(p => p.id === formData.projectId);
  const selectedNoteType = NOTE_TYPES.find(t => t.value === formData.type);
  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === formData.priority);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Create Quick Note</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title..."
              autoFocus
              required
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type
              </label>
              <Dropdown
                trigger={
                  <Button variant="outline" className="w-full justify-between">
                    <span>{selectedNoteType?.label || 'Select type'}</span>
                  </Button>
                }
              >
                <div className="p-1 space-y-1 max-h-64 overflow-y-auto">
                  {NOTE_TYPES.map(type => (
                    <Button
                      key={type.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={cn(
                        'w-full justify-start',
                        formData.type === type.value && 'bg-accent'
                      )}
                    >
                      <div className="text-left">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </Dropdown>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <Dropdown
                trigger={
                  <Button variant="outline" className="w-full justify-between">
                    <span className={selectedPriority?.color}>
                      {selectedPriority?.label || 'Select priority'}
                    </span>
                  </Button>
                }
              >
                <div className="p-1 space-y-1">
                  {PRIORITY_OPTIONS.map(priority => (
                    <Button
                      key={priority.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                      className={cn(
                        'w-full justify-start',
                        formData.priority === priority.value && 'bg-accent'
                      )}
                    >
                      <span className={priority.color}>{priority.label}</span>
                    </Button>
                  ))}
                </div>
              </Dropdown>
            </div>
          </div>

          {/* Project Assignment */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project (Optional)
            </label>
            <Dropdown
              trigger={
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    <span>{selectedProject?.title || 'No project selected'}</span>
                  </div>
                </Button>
              }
            >
              <div className="p-1 space-y-1 max-h-64 overflow-y-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, projectId: null }))}
                  className={cn(
                    'w-full justify-start',
                    !formData.projectId && 'bg-accent'
                  )}
                >
                  No project
                </Button>
                {availableProjects.map(project => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, projectId: project.id }))}
                    className={cn(
                      'w-full justify-start',
                      formData.projectId === project.id && 'bg-accent'
                    )}
                  >
                    {project.title}
                  </Button>
                ))}
              </div>
            </Dropdown>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            
            {/* Add new tag */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {/* Existing tags dropdown */}
            {availableTags.length > 0 && (
              <div className="mb-3">
                <Dropdown
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Tag className="h-4 w-4" />
                      Choose from existing tags
                    </Button>
                  }
                >
                  <div className="p-1 space-y-1 max-h-48 overflow-y-auto">
                    {availableTags
                      .filter(tag => !formData.tags?.includes(tag))
                      .map(tag => (
                        <Button
                          key={tag}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddExistingTag(tag)}
                          className="w-full justify-start"
                        >
                          {tag}
                        </Button>
                      ))}
                  </div>
                </Dropdown>
              </div>
            )}

            {/* Selected tags */}
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
              Content
            </label>
            <div className="min-h-[200px]">
              <TextEditor
                content={formData.content || ''}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Write your note content..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Note
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}