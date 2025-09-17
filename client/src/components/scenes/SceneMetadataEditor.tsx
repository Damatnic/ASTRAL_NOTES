/**
 * Scene Metadata Editor Component
 * Comprehensive editor for all scene metadata fields
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Save,
  X,
  Clock,
  MapPin,
  User,
  Users,
  Eye,
  Target,
  Zap,
  FileText,
  Hash,
  Star,
  Calendar,
  Activity,
  AlertTriangle,
  Plus,
  Minus,
  ChevronDown
} from 'lucide-react';
import type { Scene, Character, Location, CreateSceneData } from '@/types/story';

interface SceneMetadataEditorProps {
  scene?: Scene;
  characters?: Character[];
  locations?: Location[];
  onSave: (data: CreateSceneData | Partial<Scene>) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  className?: string;
}

const TIME_OF_DAY_OPTIONS = [
  'dawn',
  'morning',
  'midday',
  'afternoon',
  'evening',
  'dusk',
  'night',
  'midnight',
  'late-night'
];

const POV_OPTIONS = [
  { value: 'first-person', label: 'First Person (I/we)' },
  { value: 'third-person-limited', label: 'Third Person Limited' },
  { value: 'third-person-omniscient', label: 'Third Person Omniscient' },
  { value: 'second-person', label: 'Second Person (You)' }
];

const MOOD_OPTIONS = [
  'tense',
  'peaceful',
  'mysterious',
  'romantic',
  'action',
  'dramatic',
  'comedic',
  'melancholy'
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'outlined', label: 'Outlined' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'revised', label: 'Revised' },
  { value: 'completed', label: 'Completed' }
];

export function SceneMetadataEditor({
  scene,
  characters = [],
  locations = [],
  onSave,
  onCancel,
  isEditMode = false,
  className
}: SceneMetadataEditorProps) {
  const [formData, setFormData] = useState<Partial<Scene>>({
    title: '',
    summary: '',
    purpose: '',
    conflict: '',
    notes: '',
    locationId: '',
    timeOfDay: 'morning',
    specificTime: '',
    pointOfView: 'third-person-limited',
    povCharacterId: '',
    characters: [],
    mood: 'peaceful',
    tags: [],
    importance: 1,
    status: 'planned',
    estimatedWordCount: 0,
    ...scene
  });

  const [newTag, setNewTag] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(
    new Set(scene?.characters || [])
  );

  useEffect(() => {
    if (scene) {
      setFormData({
        ...scene
      });
      setSelectedCharacters(new Set(scene.characters || []));
    }
  }, [scene]);

  const handleInputChange = (field: keyof Scene, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      const updatedTags = [...(formData.tags || []), newTag.trim()];
      handleInputChange('tags', updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = formData.tags?.filter(tag => tag !== tagToRemove) || [];
    handleInputChange('tags', updatedTags);
  };

  const handleCharacterToggle = (characterId: string) => {
    const newSelected = new Set(selectedCharacters);
    if (newSelected.has(characterId)) {
      newSelected.delete(characterId);
    } else {
      newSelected.add(characterId);
    }
    setSelectedCharacters(newSelected);
    handleInputChange('characters', Array.from(newSelected));
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      characters: Array.from(selectedCharacters),
      tags: formData.tags || []
    };

    if (isEditMode) {
      onSave(dataToSave);
    } else {
      onSave(dataToSave as CreateSceneData);
    }
  };

  const isFormValid = () => {
    return formData.title?.trim().length > 0;
  };

  return (
    <Card className={cn("scene-metadata-editor", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isEditMode ? 'Edit Scene' : 'Create New Scene'}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isFormValid()}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Scene Title *
            </label>
            <Input
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter scene title..."
              className="w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Summary
            </label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="Brief summary of what happens in this scene..."
              rows={3}
              className="w-full px-3 py-2 border rounded-md bg-background resize-none"
            />
          </div>
        </div>

        {/* Timing & Location */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing & Location
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Time of Day
              </label>
              <select
                value={formData.timeOfDay || 'morning'}
                onChange={(e) => handleInputChange('timeOfDay', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {TIME_OF_DAY_OPTIONS.map(time => (
                  <option key={time} value={time}>
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Specific Time
              </label>
              <Input
                type="time"
                value={formData.specificTime || ''}
                onChange={(e) => handleInputChange('specificTime', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Location
              </label>
              <select
                value={formData.locationId || ''}
                onChange={(e) => handleInputChange('locationId', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select location...</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Point of View */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Point of View
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                POV Type
              </label>
              <select
                value={formData.pointOfView || 'third-person-limited'}
                onChange={(e) => handleInputChange('pointOfView', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {POV_OPTIONS.map(pov => (
                  <option key={pov.value} value={pov.value}>
                    {pov.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.pointOfView?.includes('limited') && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  POV Character
                </label>
                <select
                  value={formData.povCharacterId || ''}
                  onChange={(e) => handleInputChange('povCharacterId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select POV character...</option>
                  {characters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Characters */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Characters in Scene
          </h3>
          
          <div className="max-h-48 overflow-y-auto border rounded-md p-3">
            {characters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No characters available</p>
            ) : (
              <div className="space-y-2">
                {characters.map(character => (
                  <label
                    key={character.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCharacters.has(character.id)}
                      onChange={() => handleCharacterToggle(character.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{character.name}</div>
                      {character.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {character.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scene Purpose & Conflict */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Purpose & Conflict
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Scene Purpose
              </label>
              <textarea
                value={formData.purpose || ''}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                placeholder="What is this scene trying to accomplish?"
                rows={2}
                className="w-full px-3 py-2 border rounded-md bg-background resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Conflict/Tension
              </label>
              <textarea
                value={formData.conflict || ''}
                onChange={(e) => handleInputChange('conflict', e.target.value)}
                placeholder="What conflict or tension drives this scene?"
                rows={2}
                className="w-full px-3 py-2 border rounded-md bg-background resize-none"
              />
            </div>
          </div>
        </div>

        {/* Mood & Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Mood & Tags
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Mood/Tone
              </label>
              <select
                value={formData.mood || 'peaceful'}
                onChange={(e) => handleInputChange('mood', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {MOOD_OPTIONS.map(mood => (
                  <option key={mood} value={mood}>
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Add Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Display Tags */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Scene Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5" />
            Scene Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={formData.status || 'planned'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Importance (1-5)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => handleInputChange('importance', level)}
                    className={cn(
                      "p-1 rounded",
                      (formData.importance || 1) >= level
                        ? "text-yellow-500"
                        : "text-gray-300"
                    )}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Estimated Word Count
              </label>
              <Input
                type="number"
                value={formData.estimatedWordCount || 0}
                onChange={(e) => handleInputChange('estimatedWordCount', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Notes
          </h3>
          
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional notes about this scene..."
            rows={4}
            className="w-full px-3 py-2 border rounded-md bg-background resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default SceneMetadataEditor;