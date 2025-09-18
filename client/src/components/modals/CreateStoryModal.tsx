/**
 * Create Story Modal
 * Modal for creating new stories within projects
 */

import React, { useState } from 'react';
import { BookOpen, Users, Target, Tag, Calendar, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/utils/cn';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storyData: StoryFormData) => void;
  projectId?: string;
}

export interface StoryFormData {
  title: string;
  genre: string;
  synopsis: string;
  theme: string;
  setting: string;
  targetWordCount: number;
  tags: string[];
  estimatedChapters: number;
  writingGoal: 'daily' | 'weekly' | 'flexible';
  dailyWordTarget: number;
}

const genres = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 
  'Horror', 'Adventure', 'Drama', 'Comedy', 'Historical Fiction',
  'Contemporary Fiction', 'Young Adult', 'Literary Fiction', 'Crime',
  'Western', 'Dystopian', 'Magical Realism', 'Other'
];

const wordCountTargets = [
  { label: 'Short Story (1,000 - 7,500 words)', value: 5000 },
  { label: 'Novelette (7,500 - 20,000 words)', value: 15000 },
  { label: 'Novella (20,000 - 50,000 words)', value: 35000 },
  { label: 'Novel (50,000 - 100,000 words)', value: 75000 },
  { label: 'Epic Novel (100,000+ words)', value: 120000 },
  { label: 'Custom', value: 0 }
];

export function CreateStoryModal({ isOpen, onClose, onSubmit, projectId }: CreateStoryModalProps) {
  const [formData, setFormData] = useState<StoryFormData>({
    title: '',
    genre: '',
    synopsis: '',
    theme: '',
    setting: '',
    targetWordCount: 75000,
    tags: [],
    estimatedChapters: 20,
    writingGoal: 'daily',
    dailyWordTarget: 500,
  });
  
  const [customWordCount, setCustomWordCount] = useState('');
  const [newTag, setNewTag] = useState('');
  const [step, setStep] = useState<'basic' | 'details' | 'goals'>('basic');

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    
    const finalData = {
      ...formData,
      targetWordCount: formData.targetWordCount === 0 ? parseInt(customWordCount) || 75000 : formData.targetWordCount,
    };
    
    onSubmit(finalData);
    
    // Reset form
    setFormData({
      title: '',
      genre: '',
      synopsis: '',
      theme: '',
      setting: '',
      targetWordCount: 75000,
      tags: [],
      estimatedChapters: 20,
      writingGoal: 'daily',
      dailyWordTarget: 500,
    });
    setStep('basic');
    setCustomWordCount('');
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const canProceed = () => {
    switch (step) {
      case 'basic':
        return formData.title.trim() && formData.genre;
      case 'details':
        return formData.synopsis.trim();
      case 'goals':
        return true;
      default:
        return false;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Story"
      size="lg"
      className="create-story-modal"
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          {['basic', 'details', 'goals'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step === stepName 
                  ? 'bg-primary text-primary-foreground' 
                  : index < ['basic', 'details', 'goals'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
              )}>
                {index + 1}
              </div>
              {index < 2 && (
                <div className={cn(
                  'w-12 h-0.5 mx-2 transition-colors',
                  index < ['basic', 'details', 'goals'].indexOf(step) ? 'bg-green-500' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 'basic' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <BookOpen className="h-12 w-12 mx-auto text-primary mb-2" />
              <h3 className="text-lg font-semibold">Story Basics</h3>
              <p className="text-muted-foreground">Let's start with the fundamentals of your story</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Story Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter your story title..."
                className="text-lg"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Genre *</label>
              <Dropdown
                trigger={
                  <Button variant="outline" className="w-full justify-between">
                    {formData.genre || 'Select a genre...'}
                    <BookOpen className="h-4 w-4" />
                  </Button>
                }
                options={genres.map(genre => ({ label: genre, value: genre }))}
                onSelect={(genre) => setFormData({ ...formData, genre })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Length</label>
              <Dropdown
                trigger={
                  <Button variant="outline" className="w-full justify-between">
                    {wordCountTargets.find(t => t.value === formData.targetWordCount)?.label || 'Custom'}
                    <Target className="h-4 w-4" />
                  </Button>
                }
                options={wordCountTargets.map(target => ({ 
                  label: target.label, 
                  value: target.value.toString() 
                }))}
                onSelect={(value) => setFormData({ 
                  ...formData, 
                  targetWordCount: parseInt(value) 
                })}
              />
              
              {formData.targetWordCount === 0 && (
                <div className="mt-2">
                  <Input
                    type="number"
                    value={customWordCount}
                    onChange={(e) => setCustomWordCount(e.target.value)}
                    placeholder="Enter custom word count..."
                    min="1000"
                    max="1000000"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <PenTool className="h-12 w-12 mx-auto text-primary mb-2" />
              <h3 className="text-lg font-semibold">Story Details</h3>
              <p className="text-muted-foreground">Tell us more about your story world and themes</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Synopsis *</label>
              <textarea
                className="w-full p-3 border border-input rounded-md bg-background min-h-[120px] resize-none"
                value={formData.synopsis}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                placeholder="Write a brief synopsis of your story (2-3 sentences)..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.synopsis.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <Input
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  placeholder="e.g., Love conquers all, Coming of age..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Setting</label>
                <Input
                  value={formData.setting}
                  onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
                  placeholder="e.g., Medieval England, Future Mars..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tags (e.g., magic, romance, adventure)..."
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} variant="outline" size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full cursor-pointer hover:bg-primary/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'goals' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Target className="h-12 w-12 mx-auto text-primary mb-2" />
              <h3 className="text-lg font-semibold">Writing Goals</h3>
              <p className="text-muted-foreground">Set up your writing schedule and targets</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Chapters</label>
                <Input
                  type="number"
                  value={formData.estimatedChapters}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    estimatedChapters: parseInt(e.target.value) || 20 
                  })}
                  min="1"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Writing Schedule</label>
                <Dropdown
                  trigger={
                    <Button variant="outline" className="w-full justify-between">
                      {formData.writingGoal === 'daily' ? 'Daily' : 
                       formData.writingGoal === 'weekly' ? 'Weekly' : 'Flexible'}
                      <Calendar className="h-4 w-4" />
                    </Button>
                  }
                  options={[
                    { label: 'Daily Writing', value: 'daily' },
                    { label: 'Weekly Goals', value: 'weekly' },
                    { label: 'Flexible Schedule', value: 'flexible' },
                  ]}
                  onSelect={(goal) => setFormData({ 
                    ...formData, 
                    writingGoal: goal as any 
                  })}
                />
              </div>
            </div>

            {formData.writingGoal === 'daily' && (
              <div>
                <label className="block text-sm font-medium mb-2">Daily Word Target</label>
                <Input
                  type="number"
                  value={formData.dailyWordTarget}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dailyWordTarget: parseInt(e.target.value) || 500 
                  })}
                  min="100"
                  max="5000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  At {formData.dailyWordTarget} words per day, you'll finish in approximately{' '}
                  {Math.ceil(formData.targetWordCount / formData.dailyWordTarget)} days
                </p>
              </div>
            )}

            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Story Summary</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Title:</strong> {formData.title}</p>
                <p><strong>Genre:</strong> {formData.genre}</p>
                <p><strong>Target:</strong> {formData.targetWordCount.toLocaleString()} words</p>
                <p><strong>Chapters:</strong> ~{formData.estimatedChapters}</p>
                {formData.tags.length > 0 && (
                  <p><strong>Tags:</strong> {formData.tags.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step !== 'basic' && (
              <Button
                variant="ghost"
                onClick={() => {
                  const steps = ['basic', 'details', 'goals'];
                  const currentIndex = steps.indexOf(step);
                  setStep(steps[currentIndex - 1] as any);
                }}
              >
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {step === 'goals' ? (
              <Button onClick={handleSubmit} disabled={!canProceed()}>
                Create Story
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const steps = ['basic', 'details', 'goals'];
                  const currentIndex = steps.indexOf(step);
                  setStep(steps[currentIndex + 1] as any);
                }}
                disabled={!canProceed()}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
