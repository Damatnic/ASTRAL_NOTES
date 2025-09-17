/**
 * Scene Manager Component
 * Main component for managing scenes with all CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Plus,
  Grid,
  List,
  Calendar,
  Columns
} from 'lucide-react';
import { SceneList } from './SceneList';
import { SceneMetadataEditor } from './SceneMetadataEditor';
import { storyService } from '@/services/storyService';
import { noteService } from '@/services/noteService';
import type { Scene, Character, Location, Story, CreateSceneData } from '@/types/story';

interface SceneManagerProps {
  storyId: string;
  projectId: string;
  className?: string;
}

type ViewMode = 'card' | 'list' | 'board' | 'timeline';

export function SceneManager({
  storyId,
  projectId,
  className
}: SceneManagerProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [story, setStory] = useState<Story | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showMetadata, setShowMetadata] = useState(true);

  // Load data
  useEffect(() => {
    loadStoryData();
  }, [storyId, projectId]);

  const loadStoryData = async () => {
    try {
      // Load story
      const storyData = storyService.getStory(storyId);
      if (storyData) {
        setStory(storyData);
        setScenes(storyData.scenes || []);
      }

      // Load characters
      const characterNotes = noteService.getNotesByProject(projectId)
        .filter(note => note.type === 'character');
      
      const characterData: Character[] = characterNotes.map(note => ({
        id: note.id,
        name: note.title,
        description: note.content.substring(0, 200),
        // Add other character fields as needed
        role: 'main', // Default value
        importance: 1,
        tags: note.tags || [],
        projectId: note.projectId,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }));
      setCharacters(characterData);

      // Load locations
      const locationNotes = noteService.getNotesByProject(projectId)
        .filter(note => note.type === 'location');
      
      const locationData: Location[] = locationNotes.map(note => ({
        id: note.id,
        name: note.title,
        description: note.content.substring(0, 200),
        // Add other location fields as needed
        type: 'setting', // Default value
        tags: note.tags || [],
        projectId: note.projectId,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }));
      setLocations(locationData);

    } catch (error) {
      console.error('Error loading story data:', error);
    }
  };

  const handleSceneCreate = () => {
    setIsCreating(true);
    setEditingSceneId(null);
    setSelectedSceneId(null);
  };

  const handleSceneEdit = (sceneId: string) => {
    setEditingSceneId(sceneId);
    setIsCreating(false);
    setSelectedSceneId(sceneId);
  };

  const handleSceneSelect = (sceneId: string) => {
    setSelectedSceneId(selectedSceneId === sceneId ? null : sceneId);
    setEditingSceneId(null);
    setIsCreating(false);
  };

  const handleSceneView = (sceneId: string) => {
    // Navigate to scene view/editor
    // This could open a dedicated scene writing interface
    console.log('View scene:', sceneId);
  };

  const handleToggleExpanded = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  const handleSaveScene = async (data: CreateSceneData | Partial<Scene>) => {
    try {
      if (isCreating) {
        // Create new scene
        const sceneData = data as CreateSceneData;
        const newScene = storyService.createScene(storyId, {
          ...sceneData,
          order: scenes.length + 1
        });
        
        setScenes(prev => [...prev, newScene]);
        setIsCreating(false);
      } else if (editingSceneId) {
        // Update existing scene
        const updatedScene = storyService.updateScene(editingSceneId, data as Partial<Scene>);
        if (updatedScene) {
          setScenes(prev => prev.map(scene => 
            scene.id === editingSceneId ? updatedScene : scene
          ));
        }
        setEditingSceneId(null);
      }
      
      // Reload story to get updated data
      await loadStoryData();
    } catch (error) {
      console.error('Error saving scene:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingSceneId(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleSceneReorder = async (sceneId: string, newOrder: number, newStatus?: string) => {
    try {
      const updateData: Partial<Scene> = { order: newOrder };
      if (newStatus) {
        updateData.status = newStatus as Scene['status'];
      }

      const updatedScene = storyService.updateScene(sceneId, updateData);
      if (updatedScene) {
        setScenes(prev => prev.map(scene => 
          scene.id === sceneId ? updatedScene : scene
        ));
        
        // Reload story to get updated data
        await loadStoryData();
      }
    } catch (error) {
      console.error('Error reordering scene:', error);
    }
  };

  const selectedScene = editingSceneId ? scenes.find(s => s.id === editingSceneId) : null;

  return (
    <div className={cn("scene-manager", className)}>
      {/* Scene Editor */}
      {(isCreating || editingSceneId) && (
        <div className="mb-6">
          <SceneMetadataEditor
            scene={selectedScene}
            characters={characters}
            locations={locations}
            onSave={handleSaveScene}
            onCancel={handleCancelEdit}
            isEditMode={!!editingSceneId}
          />
        </div>
      )}

      {/* Scene List */}
      {!isCreating && !editingSceneId && (
        <SceneList
          scenes={scenes}
          characters={characters}
          locations={locations}
          story={story || undefined}
          viewMode={viewMode}
          selectedSceneId={selectedSceneId || undefined}
          expandedScenes={expandedScenes}
          onSceneSelect={handleSceneSelect}
          onSceneEdit={handleSceneEdit}
          onSceneCreate={handleSceneCreate}
          onSceneView={handleSceneView}
          onViewModeChange={handleViewModeChange}
          onToggleExpanded={handleToggleExpanded}
          onSceneReorder={handleSceneReorder}
          showMetadata={showMetadata}
        />
      )}

      {/* Floating Action Button for Quick Access */}
      {!isCreating && !editingSceneId && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={handleSceneCreate}
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Scene
          </Button>
        </div>
      )}

      {/* View Mode Quick Switcher */}
      {!isCreating && !editingSceneId && scenes.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50">
          <Card className="p-2">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                onClick={() => handleViewModeChange('card')}
                className="p-2"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => handleViewModeChange('list')}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                onClick={() => handleViewModeChange('board')}
                className="p-2"
              >
                <Columns className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                onClick={() => handleViewModeChange('timeline')}
                className="p-2"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default SceneManager;