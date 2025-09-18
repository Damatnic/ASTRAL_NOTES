/**
 * Entity Editor - Comprehensive CRUD interface for Codex entities
 * Supports all entity types with dynamic field rendering
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Save, X, Upload, Trash2, Copy, ExternalLink, Tag, Hash, Star, Users, Calendar, MapPin, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { codexService, type CodexEntity, type EntityType } from '@/services/codexService';
import { entityRelationshipService, type EntityRelationship } from '@/services/entityRelationshipService';
import { autoDetectionService } from '@/services/autoDetectionService';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';

// Entity type specific field definitions
interface EntityFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean' | 'tags' | 'color' | 'image';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
  description?: string;
}

const ENTITY_TYPE_FIELDS: Record<EntityType, EntityFieldDefinition[]> = {
  character: [
    { key: 'age', label: 'Age', type: 'number', placeholder: 'Character age' },
    { key: 'gender', label: 'Gender', type: 'text', placeholder: 'Character gender' },
    { key: 'occupation', label: 'Occupation', type: 'text', placeholder: 'What they do for work' },
    { key: 'personality', label: 'Personality', type: 'textarea', placeholder: 'Key personality traits' },
    { key: 'background', label: 'Background', type: 'textarea', placeholder: 'Character history and background' },
    { key: 'goals', label: 'Goals & Motivations', type: 'textarea', placeholder: 'What drives this character' },
    { key: 'fears', label: 'Fears & Conflicts', type: 'textarea', placeholder: 'Internal and external conflicts' },
    { key: 'appearance', label: 'Physical Appearance', type: 'textarea', placeholder: 'How they look' },
    { key: 'relationships', label: 'Key Relationships', type: 'textarea', placeholder: 'Important relationships' },
    { key: 'arc', label: 'Character Arc', type: 'textarea', placeholder: 'How they change/grow' },
    { key: 'voice', label: 'Voice & Speech', type: 'textarea', placeholder: 'How they speak, accent, etc.' },
    { key: 'secrets', label: 'Secrets', type: 'textarea', placeholder: 'Hidden information about character' }
  ],
  location: [
    { key: 'type', label: 'Location Type', type: 'select', options: [
      { value: 'city', label: 'City' },
      { value: 'town', label: 'Town' },
      { value: 'village', label: 'Village' },
      { value: 'building', label: 'Building' },
      { value: 'room', label: 'Room' },
      { value: 'natural', label: 'Natural Feature' },
      { value: 'realm', label: 'Realm/Dimension' }
    ]},
    { key: 'climate', label: 'Climate', type: 'text', placeholder: 'Weather and climate' },
    { key: 'population', label: 'Population', type: 'number', placeholder: 'Number of inhabitants' },
    { key: 'government', label: 'Government', type: 'text', placeholder: 'How it\'s governed' },
    { key: 'economy', label: 'Economy', type: 'text', placeholder: 'Economic system' },
    { key: 'culture', label: 'Culture', type: 'textarea', placeholder: 'Cultural aspects' },
    { key: 'history', label: 'History', type: 'textarea', placeholder: 'Historical background' },
    { key: 'geography', label: 'Geography', type: 'textarea', placeholder: 'Physical features' },
    { key: 'landmarks', label: 'Notable Landmarks', type: 'textarea', placeholder: 'Important places within' },
    { key: 'atmosphere', label: 'Atmosphere', type: 'textarea', placeholder: 'How it feels to be there' },
    { key: 'threats', label: 'Dangers/Threats', type: 'textarea', placeholder: 'What makes it dangerous' }
  ],
  object: [
    { key: 'type', label: 'Object Type', type: 'select', options: [
      { value: 'weapon', label: 'Weapon' },
      { value: 'armor', label: 'Armor' },
      { value: 'tool', label: 'Tool' },
      { value: 'artifact', label: 'Artifact' },
      { value: 'document', label: 'Document' },
      { value: 'vehicle', label: 'Vehicle' },
      { value: 'technology', label: 'Technology' }
    ]},
    { key: 'materials', label: 'Materials', type: 'text', placeholder: 'What it\'s made of' },
    { key: 'size', label: 'Size', type: 'text', placeholder: 'Physical dimensions' },
    { key: 'weight', label: 'Weight', type: 'text', placeholder: 'How heavy it is' },
    { key: 'origin', label: 'Origin', type: 'textarea', placeholder: 'Where it came from' },
    { key: 'powers', label: 'Powers/Abilities', type: 'textarea', placeholder: 'Special properties' },
    { key: 'history', label: 'History', type: 'textarea', placeholder: 'Its past and journey' },
    { key: 'currentLocation', label: 'Current Location', type: 'text', placeholder: 'Where it is now' },
    { key: 'condition', label: 'Condition', type: 'text', placeholder: 'Physical state' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Monetary or symbolic worth' },
    { key: 'restrictions', label: 'Restrictions', type: 'textarea', placeholder: 'Usage limitations' }
  ],
  organization: [
    { key: 'type', label: 'Organization Type', type: 'select', options: [
      { value: 'guild', label: 'Guild' },
      { value: 'government', label: 'Government' },
      { value: 'military', label: 'Military' },
      { value: 'religious', label: 'Religious' },
      { value: 'criminal', label: 'Criminal' },
      { value: 'academic', label: 'Academic' },
      { value: 'commercial', label: 'Commercial' }
    ]},
    { key: 'founded', label: 'Founded', type: 'date', placeholder: 'When it was established' },
    { key: 'headquarters', label: 'Headquarters', type: 'text', placeholder: 'Main location' },
    { key: 'leadership', label: 'Leadership', type: 'textarea', placeholder: 'Who leads it' },
    { key: 'structure', label: 'Structure', type: 'textarea', placeholder: 'How it\'s organized' },
    { key: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'Goals and mission' },
    { key: 'membership', label: 'Membership', type: 'textarea', placeholder: 'Who can join and how' },
    { key: 'resources', label: 'Resources', type: 'textarea', placeholder: 'Available resources' },
    { key: 'influence', label: 'Influence', type: 'textarea', placeholder: 'Political/social power' },
    { key: 'allies', label: 'Allies', type: 'textarea', placeholder: 'Allied organizations' },
    { key: 'enemies', label: 'Enemies', type: 'textarea', placeholder: 'Opposing forces' }
  ],
  event: [
    { key: 'type', label: 'Event Type', type: 'select', options: [
      { value: 'battle', label: 'Battle' },
      { value: 'political', label: 'Political' },
      { value: 'natural', label: 'Natural Disaster' },
      { value: 'cultural', label: 'Cultural' },
      { value: 'personal', label: 'Personal' },
      { value: 'supernatural', label: 'Supernatural' }
    ]},
    { key: 'date', label: 'Date/Time', type: 'date', placeholder: 'When it occurred' },
    { key: 'duration', label: 'Duration', type: 'text', placeholder: 'How long it lasted' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Where it happened' },
    { key: 'participants', label: 'Participants', type: 'textarea', placeholder: 'Who was involved' },
    { key: 'causes', label: 'Causes', type: 'textarea', placeholder: 'What led to this event' },
    { key: 'consequences', label: 'Consequences', type: 'textarea', placeholder: 'What happened as a result' },
    { key: 'significance', label: 'Significance', type: 'textarea', placeholder: 'Why it matters' },
    { key: 'details', label: 'Key Details', type: 'textarea', placeholder: 'Important specifics' }
  ],
  lore: [
    { key: 'type', label: 'Lore Type', type: 'select', options: [
      { value: 'mythology', label: 'Mythology' },
      { value: 'religion', label: 'Religion' },
      { value: 'magic', label: 'Magic System' },
      { value: 'history', label: 'Historical' },
      { value: 'prophecy', label: 'Prophecy' },
      { value: 'legend', label: 'Legend' }
    ]},
    { key: 'origin', label: 'Origin', type: 'textarea', placeholder: 'Where this knowledge comes from' },
    { key: 'rules', label: 'Rules/Laws', type: 'textarea', placeholder: 'How it works' },
    { key: 'practitioners', label: 'Practitioners', type: 'textarea', placeholder: 'Who knows/uses this' },
    { key: 'restrictions', label: 'Restrictions', type: 'textarea', placeholder: 'Limitations or taboos' },
    { key: 'manifestations', label: 'Manifestations', type: 'textarea', placeholder: 'How it appears in the world' },
    { key: 'conflicts', label: 'Conflicts', type: 'textarea', placeholder: 'Opposing beliefs or systems' }
  ],
  subplot: [
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'planned', label: 'Planned' },
      { value: 'active', label: 'Active' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'abandoned', label: 'Abandoned' }
    ]},
    { key: 'priority', label: 'Priority', type: 'select', options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }
    ]},
    { key: 'characters', label: 'Characters Involved', type: 'textarea', placeholder: 'Who is part of this subplot' },
    { key: 'conflict', label: 'Central Conflict', type: 'textarea', placeholder: 'The main tension or problem' },
    { key: 'stakes', label: 'Stakes', type: 'textarea', placeholder: 'What\'s at risk' },
    { key: 'progression', label: 'Progression', type: 'textarea', placeholder: 'How it develops' },
    { key: 'resolution', label: 'Resolution', type: 'textarea', placeholder: 'How it ends (if resolved)' },
    { key: 'connections', label: 'Main Plot Connections', type: 'textarea', placeholder: 'How it ties to the main story' }
  ],
  concept: [
    { key: 'category', label: 'Concept Category', type: 'text', placeholder: 'Type of concept' },
    { key: 'definition', label: 'Definition', type: 'textarea', placeholder: 'What it means' },
    { key: 'examples', label: 'Examples', type: 'textarea', placeholder: 'Specific instances' },
    { key: 'implications', label: 'Implications', type: 'textarea', placeholder: 'What it means for the story' },
    { key: 'relationships', label: 'Related Concepts', type: 'textarea', placeholder: 'Connected ideas' }
  ],
  custom: [
    { key: 'customField1', label: 'Custom Field 1', type: 'text' },
    { key: 'customField2', label: 'Custom Field 2', type: 'textarea' },
    { key: 'customField3', label: 'Custom Field 3', type: 'text' }
  ]
};

interface EntityEditorProps {
  entityId?: string;
  entityType?: EntityType;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: CodexEntity) => void;
  onDelete?: (entityId: string) => void;
  mode?: 'create' | 'edit' | 'view';
}

export default function EntityEditor({
  entityId,
  entityType = 'character',
  projectId,
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode = 'create'
}: EntityEditorProps) {
  const [entity, setEntity] = useState<Partial<CodexEntity>>({
    type: entityType,
    name: '',
    description: '',
    data: {},
    tags: [],
    importance: 3,
    isUniversal: false,
    notes: '',
    projectId
  });

  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [tagInput, setTagInput] = useState('');

  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isNewEntity = !entityId;

  // Load entity data if editing
  useEffect(() => {
    if (entityId && isOpen) {
      loadEntity();
    } else if (isOpen && !entityId) {
      // Reset for new entity
      setEntity({
        type: entityType,
        name: '',
        description: '',
        data: {},
        tags: [],
        importance: 3,
        isUniversal: false,
        notes: '',
        projectId
      });
    }
  }, [entityId, isOpen, entityType, projectId]);

  const loadEntity = async () => {
    if (!entityId) return;
    
    setIsLoading(true);
    try {
      const [entityData, entityRelationships] = await Promise.all([
        codexService.getEntity(entityId),
        codexService.getEntityRelationships(entityId)
      ]);
      
      setEntity(entityData);
      setRelationships(entityRelationships);
    } catch (error) {
      console.error('Failed to load entity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEntity = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!entity.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!entity.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Validate type-specific required fields
    const typeFields = ENTITY_TYPE_FIELDS[entity.type as EntityType] || [];
    typeFields.forEach(field => {
      if (field.required && !entity.data?.[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
      
      if (field.validation && entity.data?.[field.key]) {
        const validationError = field.validation(entity.data[field.key]);
        if (validationError) {
          newErrors[field.key] = validationError;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateEntity()) return;
    
    setSaving(true);
    try {
      let savedEntity: CodexEntity;
      
      if (isNewEntity) {
        savedEntity = await codexService.createEntity(entity as Omit<CodexEntity, 'id' | 'createdAt' | 'updatedAt'>);
      } else {
        savedEntity = await codexService.updateEntity(entityId!, entity);
      }
      
      onSave(savedEntity);
      onClose();
    } catch (error) {
      console.error('Failed to save entity:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      try {
        await codexService.deleteEntity(entityId);
        onDelete(entityId);
        onClose();
      } catch (error) {
        console.error('Failed to delete entity:', error);
      }
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    if (key === 'tags') {
      setEntity(prev => ({ ...prev, [key]: value }));
    } else if (key in entity) {
      setEntity(prev => ({ ...prev, [key]: value }));
    } else {
      setEntity(prev => ({
        ...prev,
        data: { ...prev.data, [key]: value }
      }));
    }
    
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !entity.tags?.includes(tagInput.trim())) {
      handleFieldChange('tags', [...(entity.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleFieldChange('tags', entity.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const renderField = (field: EntityFieldDefinition) => {
    const value = field.key in entity ? entity[field.key as keyof CodexEntity] : entity.data?.[field.key];
    const hasError = !!errors[field.key];
    
    const baseProps = {
      disabled: isViewMode,
      'aria-invalid': hasError,
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            {...baseProps}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            rows={4}
          />
        );
        
      case 'select':
        return (
          <Select
            {...baseProps}
            value={value || ''}
            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
        
      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value) || 0)}
          />
        );
        
      case 'date':
        return (
          <Input
            {...baseProps}
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        
      case 'boolean':
        return (
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
            disabled={isViewMode}
          />
        );
        
      case 'color':
        return (
          <Input
            {...baseProps}
            type="color"
            value={value || '#3B82F6'}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        
      default:
        return (
          <Input
            {...baseProps}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
    }
  };

  const typeFields = ENTITY_TYPE_FIELDS[entity.type as EntityType] || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isNewEntity ? `Create ${entity.type}` : `Edit ${entity.name}`}
            </h2>
            <p className="text-sm text-gray-500">
              {isNewEntity ? `Add a new ${entity.type} to your codex` : 'Modify entity details'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isNewEntity && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading entity...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* Entity Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type
                  </label>
                  <Select
                    value={entity.type}
                    onValueChange={(value) => handleFieldChange('type', value)}
                    disabled={!isNewEntity || isViewMode}
                  >
                    <option value="character">Character</option>
                    <option value="location">Location</option>
                    <option value="object">Object</option>
                    <option value="organization">Organization</option>
                    <option value="event">Event</option>
                    <option value="lore">Lore</option>
                    <option value="subplot">Subplot</option>
                    <option value="concept">Concept</option>
                    <option value="custom">Custom</option>
                  </Select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <Input
                    placeholder="Enter entity name"
                    value={entity.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={isViewMode}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <Textarea
                    placeholder="Describe this entity"
                    value={entity.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    disabled={isViewMode}
                    rows={4}
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Importance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importance ({entity.importance}/5)
                  </label>
                  <Slider
                    value={[entity.importance || 3]}
                    onValueChange={([value]) => handleFieldChange('importance', value)}
                    min={1}
                    max={5}
                    step={1}
                    disabled={isViewMode}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Minor</span>
                    <span>Critical</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {entity.tags?.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        {!isViewMode && (
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {!isViewMode && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button onClick={handleAddTag} variant="outline">
                        <Tag className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <Input
                    type="color"
                    value={entity.color || '#3B82F6'}
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                    disabled={isViewMode}
                    className="w-20 h-10"
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                {typeFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                    {field.description && (
                      <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                    )}
                    {errors[field.key] && (
                      <p className="mt-1 text-sm text-red-600">{errors[field.key]}</p>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="relationships" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Entity Relationships</h3>
                  {relationships.length > 0 ? (
                    <div className="space-y-3">
                      {relationships.map(rel => (
                        <Card key={rel.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {rel.fromEntity?.name} → {rel.toEntity?.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {rel.type} (Strength: {rel.strength}/10)
                              </p>
                              {rel.description && (
                                <p className="text-sm text-gray-600 mt-1">{rel.description}</p>
                              )}
                            </div>
                            {!isViewMode && (
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No relationships defined yet.</p>
                  )}
                  
                  {!isViewMode && (
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Relationship
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <Textarea
                    placeholder="Any additional notes or thoughts"
                    value={entity.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    disabled={isViewMode}
                    rows={6}
                  />
                </div>

                {/* Universal Entity */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={entity.isUniversal || false}
                    onCheckedChange={(checked) => handleFieldChange('isUniversal', checked)}
                    disabled={isViewMode}
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Universal Entity
                    </label>
                    <p className="text-xs text-gray-500">
                      Available across all projects in your universe
                    </p>
                  </div>
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar/Image
                  </label>
                  {entity.avatar ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={entity.avatar}
                        alt={entity.name}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      {!isViewMode && (
                        <Button
                          variant="outline"
                          onClick={() => handleFieldChange('avatar', '')}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ) : !isViewMode && (
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        {!isViewMode && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isNewEntity ? 'Create Entity' : 'Save Changes'}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
