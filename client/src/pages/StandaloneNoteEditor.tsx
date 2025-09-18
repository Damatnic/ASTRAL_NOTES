/**
 * Standalone Note Editor Page
 * Edit individual notes outside of project context
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { quickNotesService } from '@/services/quickNotesService';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import type { QuickNote } from '@/types';

export function StandaloneNoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [note, setNote] = useState<QuickNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[]
  });

  useEffect(() => {
    if (!id) {
      navigate('/quick-notes');
      return;
    }

    try {
      const noteData = quickNotesService.getNote(id);
      if (!noteData) {
        showToast('Note not found', 'error');
        navigate('/quick-notes');
        return;
      }

      setNote(noteData);
      setFormData({
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags || []
      });
    } catch (error) {
      console.error('Error loading note:', error);
      showToast('Error loading note', 'error');
      navigate('/quick-notes');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  const handleSave = async () => {
    if (!note || !id) return;

    setSaving(true);
    try {
      const updatedNote: QuickNote = {
        ...note,
        title: formData.title.trim(),
        content: formData.content,
        tags: formData.tags,
        updatedAt: new Date().toISOString()
      };

      quickNotesService.updateNote(id, updatedNote);
      setNote(updatedNote);
      showToast('Note updated successfully', 'success');
    } catch (error) {
      console.error('Error updating note:', error);
      showToast('Error updating note', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !id) return;

    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      quickNotesService.deleteNote(id);
      showToast('Note deleted successfully', 'success');
      navigate('/quick-notes');
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Error deleting note', 'error');
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
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground mb-2">Note not found</h1>
          <p className="text-muted-foreground mb-4">The note you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/quick-notes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quick Notes
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
          onClick={() => navigate('/quick-notes')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quick Notes
        </Button>
        <h1 className="text-3xl font-bold">Edit Note</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter note title"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                Content
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter note content"
                rows={12}
                className="w-full font-mono"
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
                placeholder="idea, inspiration, draft"
                className="w-full"
              />
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
            Delete Note
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