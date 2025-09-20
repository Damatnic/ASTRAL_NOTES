/**
 * Enhanced Plot Board Page
 * Enterprise-grade visual plot board system
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { Alert } from '@mui/material';
import { AlertCircle, Loader2 } from 'lucide-react';

import { EnhancedPlotBoard } from '@/components/plotboard/EnhancedPlotBoard';
import { useProjects } from '@/hooks/useProjects';
import { useStories } from '@/hooks/useStories';

import type { 
  Scene, 
  Character, 
  Location, 
  PlotThread, 
  Story, 
  Project,
  Act,
  Chapter 
} from '@/types/story';

export function PlotBoard() {
  const { projectId, storyId } = useParams<{ projectId: string; storyId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data for demonstration - replace with actual data fetching
  const [project, setProject] = useState<Project | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Load data on mount
  useEffect(() => {
    loadPlotBoardData();
  }, [projectId, storyId]);

  const loadPlotBoardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data generation for demonstration
      const mockProject: Project = {
        id: projectId || 'demo-project',
        title: 'The Chronicles of Astral',
        description: 'An epic fantasy adventure',
        userId: 'demo-user',
        status: 'writing',
        isPublic: false,
        tags: ['fantasy', 'adventure'],
        genre: 'Fantasy',
        stories: [],
        projectNotes: [],
        plotboard: {
          id: 'demo-plotboard',
          projectId: projectId || 'demo-project',
          layout: 'grid',
          zoom: 1,
          viewportX: 0,
          viewportY: 0,
          swimLanes: [],
          connections: [],
          groups: [],
          filters: [],
          settings: {
            showConnections: true,
            showWordCounts: true,
            showTimestamps: false,
            cardSize: 'medium',
            colorScheme: 'status',
            autoLayout: false,
            snapToGrid: true,
            gridSize: 20
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        wordCount: 0,
        targetWordCount: 80000,
        lastEditedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          defaultPOV: 'third-person-limited',
          timeFormat: '12h',
          dateFormat: 'MDY',
          autoSave: true,
          versionHistory: true,
          linkPreview: true,
          wordCountTarget: 80000,
          dailyGoal: 1000,
          theme: 'light',
          distractionFree: false
        },
        collaborators: [],
        isCollaborative: false
      };

      const mockStory: Story = {
        id: storyId || 'demo-story',
        projectId: projectId || 'demo-project',
        title: 'Book One: The Awakening',
        description: 'The first book in the Chronicles of Astral series',
        status: 'writing',
        order: 1,
        scenes: [],
        storyNotes: [],
        timeline: {
          id: 'demo-timeline',
          storyId: storyId || 'demo-story',
          name: 'Main Timeline',
          type: 'story',
          events: [],
          scale: 'scenes',
          color: '#3B82F6',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        wordCount: 15000,
        targetWordCount: 80000,
        estimatedReadTime: 60,
        acts: [],
        chapters: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Generate mock scenes
      const mockScenes: Scene[] = Array.from({ length: 12 }, (_, i) => ({
        id: `scene-${i + 1}`,
        storyId: storyId || 'demo-story',
        chapterId: `chapter-${Math.floor(i / 4) + 1}`,
        actId: `act-${Math.floor(i / 6) + 1}`,
        title: `Scene ${i + 1}: ${['The Journey Begins', 'First Encounter', 'Hidden Secrets', 'The Revelation', 'Confrontation', 'Alliance Forms', 'The Trial', 'Betrayal', 'Dark Discovery', 'Final Preparation', 'The Battle', 'New Dawn'][i]}`,
        content: `This is the content for scene ${i + 1}...`,
        summary: `A brief summary of what happens in scene ${i + 1}.`,
        povCharacterId: `character-${(i % 3) + 1}`,
        locationId: `location-${(i % 4) + 1}`,
        timeOfDay: ['morning', 'afternoon', 'evening', 'night'][i % 4] as any,
        duration: 30 + (i * 5),
        characters: [`character-${(i % 3) + 1}`, `character-${((i + 1) % 3) + 1}`],
        locations: [`location-${(i % 4) + 1}`],
        items: [],
        plotThreads: [`plotthread-${(i % 2) + 1}`],
        order: i + 1,
        dependencies: i > 0 ? [`scene-${i}`] : [],
        conflicts: [],
        status: ['planned', 'draft', 'revised', 'complete'][i % 4] as any,
        notes: `Notes for scene ${i + 1}`,
        tags: ['action', 'drama', 'mystery', 'romance'][i % 4] ? [['action', 'drama', 'mystery', 'romance'][i % 4]] : [],
        wordCount: 500 + (i * 200),
        estimatedReadTime: 2 + Math.floor(i / 2),
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 4],
        position: { x: (i % 4) * 250, y: Math.floor(i / 4) * 200 },
        createdAt: new Date(Date.now() - (12 - i) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - (12 - i) * 12 * 60 * 60 * 1000).toISOString()
      }));

      // Generate mock characters
      const mockCharacters: Character[] = [
        {
          id: 'character-1',
          projectId: projectId || 'demo-project',
          name: 'Aria Starweaver',
          fullName: 'Aria Celeste Starweaver',
          nicknames: ['Aria'],
          age: 22,
          appearance: {
            height: '5\'6"',
            eyeColor: 'Silver',
            hairColor: 'Midnight Blue',
            physicalTraits: ['Graceful', 'Athletic build'],
            distinguishingMarks: ['Star-shaped birthmark on left wrist']
          },
          personality: {
            traits: ['Determined', 'Compassionate', 'Quick-witted'],
            strengths: ['Natural leader', 'Magical aptitude'],
            weaknesses: ['Impulsive', 'Self-doubting'],
            fears: ['Losing loved ones', 'Failing her destiny'],
            desires: ['To master her powers', 'To protect her world'],
            motivations: ['Save her homeland', 'Discover her true heritage'],
            flaws: ['Overconfident in magic', 'Trusts too easily']
          },
          role: 'protagonist',
          importance: 5,
          arc: {
            startingPoint: 'Untrained magic user',
            endingPoint: 'Master of astral magic',
            transformation: 'From self-doubt to confidence',
            keyMoments: ['scene-1', 'scene-4', 'scene-8', 'scene-12'],
            internalConflict: 'Struggling with the weight of destiny',
            externalConflict: 'Fighting against the Shadow Legion',
            growth: 'Learning to trust herself and others'
          },
          relationships: [],
          speechPatterns: ['Uses archaic words when excited', 'Speaks softly when concentrating'],
          vocabulary: 'formal',
          catchphrases: ['By the stars above', 'The light will guide us'],
          images: [],
          notes: 'The main protagonist with a mysterious magical heritage',
          tags: ['protagonist', 'magic-user', 'leader'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'character-2',
          projectId: projectId || 'demo-project',
          name: 'Kael Shadowbane',
          fullName: 'Kael Theron Shadowbane',
          nicknames: ['Shadow', 'Kael'],
          age: 25,
          appearance: {
            height: '6\'2"',
            eyeColor: 'Dark Green',
            hairColor: 'Black',
            physicalTraits: ['Tall', 'Muscular', 'Battle-scarred'],
            distinguishingMarks: ['Scar across left cheek']
          },
          personality: {
            traits: ['Loyal', 'Protective', 'Stoic'],
            strengths: ['Master swordsman', 'Tactical mind'],
            weaknesses: ['Haunted by past', 'Difficulty trusting'],
            fears: ['Repeating past mistakes', 'Losing another friend'],
            desires: ['Redemption', 'Peace'],
            motivations: ['Protect Aria', 'Atone for past failures'],
            flaws: ['Overly self-critical', 'Reckless when protecting others']
          },
          role: 'supporting',
          importance: 4,
          arc: {
            startingPoint: 'Guilt-ridden warrior',
            endingPoint: 'Redeemed protector',
            transformation: 'Learning to forgive himself',
            keyMoments: ['scene-2', 'scene-6', 'scene-9', 'scene-11'],
            internalConflict: 'Dealing with guilt from past failures',
            externalConflict: 'Facing former allies turned enemies',
            growth: 'Finding peace with his past'
          },
          relationships: [],
          speechPatterns: ['Brief, clipped sentences when emotional', 'Military terminology'],
          vocabulary: 'casual',
          catchphrases: ['Stay sharp', 'Trust the blade'],
          images: [],
          notes: 'A skilled warrior seeking redemption',
          tags: ['warrior', 'mentor', 'redemption-arc'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'character-3',
          projectId: projectId || 'demo-project',
          name: 'Zara Moonwhisper',
          fullName: 'Zara Elaine Moonwhisper',
          nicknames: ['Moon', 'Whisper'],
          age: 19,
          appearance: {
            height: '5\'4"',
            eyeColor: 'Violet',
            hairColor: 'Silver-white',
            physicalTraits: ['Petite', 'Ethereal beauty'],
            distinguishingMarks: ['Glowing runes appear on arms when using magic']
          },
          personality: {
            traits: ['Wise beyond years', 'Mysterious', 'Gentle'],
            strengths: ['Ancient knowledge', 'Healing magic'],
            weaknesses: ['Physically frail', 'Sees too much of the future'],
            fears: ['Dark visions coming true', 'Being unable to help'],
            desires: ['To guide her friends safely', 'To understand her visions'],
            motivations: ['Prevent prophesied disaster', 'Protect those she cares about'],
            flaws: ['Cryptic communication', 'Burden of foresight']
          },
          role: 'supporting',
          importance: 4,
          arc: {
            startingPoint: 'Mysterious oracle',
            endingPoint: 'Trusted guide and friend',
            transformation: 'Learning to balance prophecy with friendship',
            keyMoments: ['scene-3', 'scene-5', 'scene-7', 'scene-10'],
            internalConflict: 'Burden of knowing the future',
            externalConflict: 'Cryptic nature causes misunderstandings',
            growth: 'Learning to communicate clearly while maintaining wisdom'
          },
          relationships: [],
          speechPatterns: ['Speaks in riddles when discussing the future', 'Soft, melodic voice'],
          vocabulary: 'formal',
          catchphrases: ['The moon reveals all truths', 'In shadow and light, balance'],
          images: [],
          notes: 'A young oracle with the burden of foresight',
          tags: ['oracle', 'magic-user', 'wise'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Generate mock locations
      const mockLocations: Location[] = [
        {
          id: 'location-1',
          projectId: projectId || 'demo-project',
          name: 'Starfall Academy',
          type: 'building',
          description: 'A magnificent academy where young mages learn to harness astral magic',
          geography: {
            climate: 'Temperate',
            terrain: 'Rolling hills',
            size: 'Large campus',
            population: 500
          },
          atmosphere: ['Magical', 'Academic', 'Inspiring'],
          mood: 'welcoming',
          connections: [],
          scenes: ['scene-1', 'scene-3', 'scene-7'],
          importance: 5,
          images: [],
          maps: [],
          notes: 'The primary setting where our heroes train and learn',
          tags: ['academy', 'magic', 'training'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'location-2',
          projectId: projectId || 'demo-project',
          name: 'Shadowmere Forest',
          type: 'natural',
          description: 'A dark and mysterious forest where shadows seem to move on their own',
          geography: {
            climate: 'Cool and misty',
            terrain: 'Dense forest',
            size: 'Vast wilderness'
          },
          atmosphere: ['Dark', 'Mysterious', 'Dangerous'],
          mood: 'foreboding',
          connections: [],
          scenes: ['scene-2', 'scene-6', 'scene-9'],
          importance: 4,
          images: [],
          maps: [],
          notes: 'A dangerous area where dark creatures lurk',
          tags: ['forest', 'danger', 'mystery'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'location-3',
          projectId: projectId || 'demo-project',
          name: 'Crystal Caverns',
          type: 'natural',
          description: 'Underground caverns filled with magical crystals that amplify astral energy',
          geography: {
            climate: 'Cool underground',
            terrain: 'Crystal caves',
            size: 'Extensive cave system'
          },
          atmosphere: ['Magical', 'Beautiful', 'Resonant'],
          mood: 'mysterious',
          connections: [],
          scenes: ['scene-4', 'scene-8'],
          importance: 4,
          images: [],
          maps: [],
          notes: 'A place of power where magic is strongest',
          tags: ['caves', 'crystals', 'magic'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'location-4',
          projectId: projectId || 'demo-project',
          name: 'Astral City',
          type: 'city',
          description: 'The grand capital city floating among the clouds, powered by astral magic',
          geography: {
            climate: 'Temperate, always sunny',
            terrain: 'Floating city',
            size: 'Metropolis',
            population: 100000
          },
          atmosphere: ['Majestic', 'Bustling', 'Advanced'],
          mood: 'welcoming',
          connections: [],
          scenes: ['scene-5', 'scene-10', 'scene-11', 'scene-12'],
          importance: 5,
          images: [],
          maps: [],
          notes: 'The seat of power and center of civilization',
          tags: ['city', 'capital', 'floating', 'advanced'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Generate mock plot threads
      const mockPlotThreads: PlotThread[] = [
        {
          id: 'plotthread-1',
          projectId: projectId || 'demo-project',
          storyId: storyId || 'demo-story',
          name: 'The Awakening',
          type: 'main',
          description: 'Aria discovers her true magical heritage and learns to control her powers',
          introduction: 'scene-1',
          development: [
            {
              id: 'plot-point-1',
              sceneId: 'scene-1',
              description: 'Aria\'s magic manifests unexpectedly',
              type: 'setup',
              order: 1,
              completed: true
            },
            {
              id: 'plot-point-2',
              sceneId: 'scene-4',
              description: 'Discovery of the Crystal Caverns',
              type: 'development',
              order: 2,
              completed: true
            },
            {
              id: 'plot-point-3',
              sceneId: 'scene-8',
              description: 'Aria learns about her bloodline',
              type: 'revelation',
              order: 3,
              completed: false
            }
          ],
          climax: 'scene-11',
          resolution: 'scene-12',
          status: 'active',
          priority: 'high',
          characters: ['character-1', 'character-2', 'character-3'],
          locations: ['location-1', 'location-3', 'location-4'],
          items: [],
          scenes: ['scene-1', 'scene-4', 'scene-8', 'scene-11', 'scene-12'],
          dependsOn: [],
          blocks: [],
          color: '#3B82F6',
          notes: 'The main character development arc for Aria',
          tags: ['main-plot', 'character-growth', 'magic'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'plotthread-2',
          projectId: projectId || 'demo-project',
          storyId: storyId || 'demo-story',
          name: 'Shadow Legion Threat',
          type: 'subplot',
          description: 'The growing threat of the Shadow Legion and their plans to invade the astral realm',
          introduction: 'scene-2',
          development: [
            {
              id: 'plot-point-4',
              sceneId: 'scene-2',
              description: 'First encounter with shadow creatures',
              type: 'setup',
              order: 1,
              completed: true
            },
            {
              id: 'plot-point-5',
              sceneId: 'scene-6',
              description: 'Discovery of invasion plans',
              type: 'development',
              order: 2,
              completed: true
            },
            {
              id: 'plot-point-6',
              sceneId: 'scene-9',
              description: 'Betrayal within the academy',
              type: 'conflict',
              order: 3,
              completed: false
            }
          ],
          climax: 'scene-11',
          resolution: 'scene-12',
          status: 'active',
          priority: 'high',
          characters: ['character-2', 'character-1'],
          locations: ['location-2', 'location-1', 'location-4'],
          items: [],
          scenes: ['scene-2', 'scene-6', 'scene-9', 'scene-11', 'scene-12'],
          dependsOn: [],
          blocks: [],
          color: '#8B5CF6',
          notes: 'The external conflict driving the main plot',
          tags: ['subplot', 'conflict', 'threat'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Set all the data
      setProject(mockProject);
      setStory(mockStory);
      setScenes(mockScenes);
      setCharacters(mockCharacters);
      setLocations(mockLocations);
      setPlotThreads(mockPlotThreads);
      
      // Calculate total word count for project
      mockProject.wordCount = mockScenes.reduce((sum, scene) => sum + scene.wordCount, 0);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plot board data');
      console.error('Error loading plot board data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSceneUpdate = async (sceneId: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(scene => 
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ));
  };

  const handleSceneMove = async (
    sceneId: string, 
    fromLane: string, 
    toLane: string, 
    newIndex: number
  ) => {
    console.log(`Moving scene ${sceneId} from ${fromLane} to ${toLane} at position ${newIndex}`);
    // Implement scene move logic here
  };

  const handleSceneCreate = async (laneId: string, templateType?: string) => {
    console.log(`Creating new scene in lane ${laneId} with template ${templateType}`);
    // Implement scene creation logic here
  };

  const handleSceneEdit = async (sceneId: string) => {
    console.log(`Editing scene ${sceneId}`);
    // Navigate to scene editor or open edit modal
  };

  const handleSceneDelete = async (sceneId: string) => {
    setScenes(prev => prev.filter(scene => scene.id !== sceneId));
  };

  const handleBatchOperation = async (operation: string, sceneIds: string[]) => {
    console.log(`Performing batch operation ${operation} on scenes:`, sceneIds);
    // Implement batch operations
  };

  const handleExport = async (format: string, options: any) => {
    console.log(`Exporting to ${format} with options:`, options);
    // Implement export functionality
  };

  const handleImport = async (data: any, format: string) => {
    console.log(`Importing from ${format}:`, data);
    // Implement import functionality
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="plot-board-loading">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading Plot Board...</p>
          <p className="text-sm text-muted-foreground">
            Initializing advanced visualization system
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" data-testid="plot-board-error">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={loadPlotBoardData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!project || !story) {
    return (
      <div className="p-6" data-testid="plot-board-no-data">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Project or Story Found</h2>
            <p className="text-muted-foreground mb-4">
              Please select a project and story to view the plot board.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full" data-testid="plot-board">
      <EnhancedPlotBoard
        project={project}
        story={story}
        scenes={scenes}
        characters={characters}
        locations={locations}
        plotThreads={plotThreads}
        acts={acts}
        chapters={chapters}
        isCollaborative={project.isCollaborative}
        onSceneUpdate={handleSceneUpdate}
        onSceneMove={handleSceneMove}
        onSceneCreate={handleSceneCreate}
        onSceneEdit={handleSceneEdit}
        onSceneDelete={handleSceneDelete}
        onBatchOperation={handleBatchOperation}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
}