/**
 * Scene Cards View Component
 * Visual scene management with drag-and-drop reordering
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Clock,
  Target,
  Users,
  MapPin,
  Tag,
  FileText,
  Plus,
  Grid,
  List,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Circle,
  BookOpen
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

export interface SceneCard {
  id: string;
  chapterId?: string;
  title: string;
  summary: string;
  content?: string;
  status: 'outline' | 'draft' | 'revision' | 'complete';
  type: 'action' | 'dialogue' | 'description' | 'transition' | 'flashback' | 'dream';
  mood?: string;
  tension: number; // 1-10
  wordCount: number;
  targetWordCount?: number;
  characters: string[];
  locations: string[];
  tags: string[];
  plotPoints?: string[];
  notes?: string;
  color?: string;
  isVisible: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  scenes: SceneCard[];
  isExpanded: boolean;
  targetWordCount?: number;
}

interface SceneCardsViewProps {
  scenes: SceneCard[];
  chapters?: Chapter[];
  onScenesChange: (scenes: SceneCard[]) => void;
  onSceneSelect?: (scene: SceneCard) => void;
  viewMode?: 'cards' | 'list' | 'timeline';
  className?: string;
}

function SortableSceneCard({ 
  scene, 
  isOverlay,
  onEdit,
  onDelete,
  onToggleVisibility,
  onSelect
}: { 
  scene: SceneCard;
  isOverlay?: boolean;
  onEdit: (scene: SceneCard) => void;
  onDelete: (scene: SceneCard) => void;
  onToggleVisibility: (scene: SceneCard) => void;
  onSelect: (scene: SceneCard) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: scene.id,
    disabled: isOverlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusIcon = () => {
    switch (scene.status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'revision': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'draft': return <Circle className="w-4 h-4 text-blue-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = () => {
    switch (scene.type) {
      case 'action': return 'bg-red-100 text-red-700';
      case 'dialogue': return 'bg-blue-100 text-blue-700';
      case 'description': return 'bg-green-100 text-green-700';
      case 'transition': return 'bg-purple-100 text-purple-700';
      case 'flashback': return 'bg-yellow-100 text-yellow-700';
      case 'dream': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tensionColor = scene.tension > 7 ? 'text-red-500' : 
                       scene.tension > 4 ? 'text-yellow-500' : 
                       'text-green-500';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isOverlay ? 'shadow-2xl' : ''}`}
    >
      <Card 
        className={`
          p-4 cursor-pointer hover:shadow-lg transition-all
          ${!scene.isVisible ? 'opacity-50' : ''}
          ${scene.color ? '' : 'bg-white'}
        `}
        style={scene.color ? { backgroundColor: `${scene.color}20` } : {}}
        onClick={() => onSelect(scene)}
      >
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        <div className="ml-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon()}
                <h3 className="font-semibold text-gray-900">{scene.title}</h3>
              </div>
              <Badge className={getTypeColor()} variant="secondary">
                {scene.type}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(scene);
                }}
              >
                {scene.isVisible ? 
                  <Eye className="w-3 h-3" /> : 
                  <EyeOff className="w-3 h-3" />
                }
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(scene);
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(scene);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {scene.summary}
          </p>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-gray-400" />
              <span>{scene.wordCount} words</span>
              {scene.targetWordCount && (
                <span className="text-gray-400">/ {scene.targetWordCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Target className={`w-3 h-3 ${tensionColor}`} />
              <span>Tension: {scene.tension}/10</span>
            </div>
          </div>

          {/* Characters & Locations */}
          <div className="flex flex-wrap gap-2 mb-2">
            {scene.characters.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">
                  {scene.characters.slice(0, 2).join(', ')}
                  {scene.characters.length > 2 && ` +${scene.characters.length - 2}`}
                </span>
              </div>
            )}
            {scene.locations.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">
                  {scene.locations[0]}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {scene.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {scene.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {scene.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{scene.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function SceneCardsView({
  scenes: initialScenes,
  chapters = [],
  onScenesChange,
  onSceneSelect,
  viewMode = 'cards',
  className
}: SceneCardsViewProps) {
  const [scenes, setScenes] = useState<SceneCard[]>(initialScenes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<SceneCard | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setScenes(initialScenes);
  }, [initialScenes]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = scenes.findIndex((s) => s.id === active.id);
      const newIndex = scenes.findIndex((s) => s.id === over?.id);
      
      const newScenes = arrayMove(scenes, oldIndex, newIndex);
      // Update order property
      const updatedScenes = newScenes.map((scene, index) => ({
        ...scene,
        order: index
      }));
      
      setScenes(updatedScenes);
      onScenesChange(updatedScenes);
    }
    
    setActiveId(null);
  };

  const handleEditScene = (scene: SceneCard) => {
    setEditingScene(scene);
    setIsCreateModalOpen(true);
  };

  const handleDeleteScene = (scene: SceneCard) => {
    if (confirm(`Delete scene "${scene.title}"?`)) {
      const newScenes = scenes.filter(s => s.id !== scene.id);
      setScenes(newScenes);
      onScenesChange(newScenes);
    }
  };

  const handleToggleVisibility = (scene: SceneCard) => {
    const newScenes = scenes.map(s => 
      s.id === scene.id ? { ...s, isVisible: !s.isVisible } : s
    );
    setScenes(newScenes);
    onScenesChange(newScenes);
  };

  const handleCreateScene = (sceneData: Partial<SceneCard>) => {
    const newScene: SceneCard = {
      id: `scene-${Date.now()}`,
      title: sceneData.title || 'New Scene',
      summary: sceneData.summary || '',
      status: sceneData.status || 'outline',
      type: sceneData.type || 'action',
      tension: sceneData.tension || 5,
      wordCount: 0,
      characters: sceneData.characters || [],
      locations: sceneData.locations || [],
      tags: sceneData.tags || [],
      isVisible: true,
      order: scenes.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...sceneData
    };

    const newScenes = [...scenes, newScene];
    setScenes(newScenes);
    onScenesChange(newScenes);
    setIsCreateModalOpen(false);
  };

  const handleUpdateScene = (sceneData: Partial<SceneCard>) => {
    if (!editingScene) return;

    const newScenes = scenes.map(s => 
      s.id === editingScene.id ? { ...s, ...sceneData, updatedAt: Date.now() } : s
    );
    setScenes(newScenes);
    onScenesChange(newScenes);
    setIsCreateModalOpen(false);
    setEditingScene(null);
  };

  const filteredScenes = scenes.filter(scene => {
    if (searchQuery && !scene.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !scene.summary.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && scene.status !== filterStatus) {
      return false;
    }
    if (filterType !== 'all' && scene.type !== filterType) {
      return false;
    }
    return true;
  });

  const activeScene = activeId ? scenes.find(s => s.id === activeId) : null;

  const stats = {
    totalWords: scenes.reduce((sum, s) => sum + s.wordCount, 0),
    totalScenes: scenes.length,
    completeScenes: scenes.filter(s => s.status === 'complete').length,
    averageTension: scenes.length > 0 
      ? (scenes.reduce((sum, s) => sum + s.tension, 0) / scenes.length).toFixed(1)
      : 0
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Scene Cards</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="secondary">{stats.totalScenes} scenes</Badge>
            <Badge variant="secondary">{stats.totalWords.toLocaleString()} words</Badge>
            <Badge variant="secondary">{stats.completeScenes} complete</Badge>
            <Badge variant="secondary">Avg tension: {stats.averageTension}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => {
            setEditingScene(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Scene
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
        <Input
          placeholder="Search scenes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="max-w-xs"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="outline">Outline</option>
          <option value="draft">Draft</option>
          <option value="revision">Revision</option>
          <option value="complete">Complete</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">All Types</option>
          <option value="action">Action</option>
          <option value="dialogue">Dialogue</option>
          <option value="description">Description</option>
          <option value="transition">Transition</option>
          <option value="flashback">Flashback</option>
          <option value="dream">Dream</option>
        </select>
      </div>

      {/* Scene Cards */}
      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredScenes.map(s => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredScenes.map((scene) => (
                <SortableSceneCard
                  key={scene.id}
                  scene={scene}
                  onEdit={handleEditScene}
                  onDelete={handleDeleteScene}
                  onToggleVisibility={handleToggleVisibility}
                  onSelect={() => onSceneSelect?.(scene)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}
          >
            {activeId && activeScene ? (
              <SortableSceneCard
                scene={activeScene}
                isOverlay
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleVisibility={() => {}}
                onSelect={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingScene(null);
        }}
        title={editingScene ? 'Edit Scene' : 'Create New Scene'}
      >
        <SceneForm
          scene={editingScene}
          onSubmit={editingScene ? handleUpdateScene : handleCreateScene}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingScene(null);
          }}
        />
      </Modal>
    </div>
  );
}

// Scene Form Component
function SceneForm({
  scene,
  onSubmit,
  onCancel
}: {
  scene?: SceneCard | null;
  onSubmit: (data: Partial<SceneCard>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<SceneCard>>({
    title: scene?.title || '',
    summary: scene?.summary || '',
    status: scene?.status || 'outline',
    type: scene?.type || 'action',
    tension: scene?.tension || 5,
    targetWordCount: scene?.targetWordCount,
    characters: scene?.characters || [],
    locations: scene?.locations || [],
    tags: scene?.tags || [],
    notes: scene?.notes || ''
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Scene title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Summary
        </label>
        <textarea
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          placeholder="Brief scene summary..."
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="outline">Outline</option>
            <option value="draft">Draft</option>
            <option value="revision">Revision</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="action">Action</option>
            <option value="dialogue">Dialogue</option>
            <option value="description">Description</option>
            <option value="transition">Transition</option>
            <option value="flashback">Flashback</option>
            <option value="dream">Dream</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tension Level: {formData.tension}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.tension}
          onChange={(e) => setFormData({ ...formData, tension: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Word Count (optional)
        </label>
        <Input
          type="number"
          value={formData.targetWordCount || ''}
          onChange={(e) => setFormData({ ...formData, targetWordCount: parseInt(e.target.value) || undefined })}
          placeholder="e.g., 1500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {scene ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}

export default SceneCardsView;