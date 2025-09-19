/**
 * Advanced Story Editor for Novels and Long-Form Writing
 * Features: Chapter management, character tracking, plot development, timeline, and more
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Map, 
  Clock, 
  Target, 
  Layers,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Split,
  Maximize2,
  Settings,
  FileText,
  Bookmark,
  Tag,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Brain,
  Lightbulb,
  PenTool,
  Quote,
  Calendar,
  MapPin,
  Heart,
  Sword,
  Crown,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { cn } from '@/utils/cn';

// Types for story structure
interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  traits: string[];
  backstory: string;
  goals: string;
  relationships: { characterId: string; relationship: string }[];
  appearance: string;
  notes: string;
  color: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  wordCount: number;
  position: number;
  status: 'draft' | 'review' | 'complete';
  tags: string[];
  notes: string;
  scenes: Scene[];
  createdAt: string;
  updatedAt: string;
}

interface Scene {
  id: string;
  title: string;
  content: string;
  summary: string;
  wordCount: number;
  position: number;
  location: string;
  characters: string[];
  timeOfDay: string;
  mood: string;
  purpose: string;
  notes: string;
}

interface PlotPoint {
  id: string;
  title: string;
  description: string;
  type: 'inciting_incident' | 'plot_point_1' | 'midpoint' | 'plot_point_2' | 'climax' | 'resolution' | 'custom';
  chapter?: string;
  position: number;
  completed: boolean;
}

interface Story {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  theme: string;
  setting: string;
  targetWordCount: number;
  currentWordCount: number;
  chapters: Chapter[];
  characters: Character[];
  plotPoints: PlotPoint[];
  timeline: string;
  notes: string;
  tags: string[];
  status: 'planning' | 'drafting' | 'revising' | 'complete';
  createdAt: string;
  updatedAt: string;
}

export function StoryEditor() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Main state
  const [story, setStory] = useState<Story | null>(null);
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'plot' | 'timeline' | 'notes'>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  // Drag & drop state for chapter reordering
  const [draggingChapterId, setDraggingChapterId] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI state
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editorMode, setEditorMode] = useState<'write' | 'outline' | 'distraction-free'>('write');

  // Handle chapter drag & drop reordering
  const onChapterDragStart = useCallback((chapterId: string) => {
    setDraggingChapterId(chapterId);
  }, []);

  const onChapterDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onChapterDrop = useCallback((targetChapterId: string) => {
    if (!story || !draggingChapterId || draggingChapterId === targetChapterId) return;

    const chapters = [...story.chapters];
    const fromIndex = chapters.findIndex(ch => ch.id === draggingChapterId);
    const toIndex = chapters.findIndex(ch => ch.id === targetChapterId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = chapters.splice(fromIndex, 1);
    chapters.splice(toIndex, 0, moved);

    // Reassign positions sequentially after reorder
    const reIndexed = chapters.map((ch, idx) => ({ ...ch, position: idx }));

    setStory({ ...story, chapters: reIndexed });
    // Keep the selection on the moved chapter
    if (selectedChapter?.id === moved.id) {
      setSelectedChapter({ ...moved, position: reIndexed.find(c => c.id === moved.id)!.position });
    }

    setDraggingChapterId(null);
  }, [story, draggingChapterId, selectedChapter]);

  // Load story data
  useEffect(() => {
    const loadStory = async () => {
      if (!storyId || storyId === '') {
        setStory({ error: 'Story Not Found' } as any);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // In a real app, this would fetch from your API
        const mockStory: Story = {
          id: storyId,
          title: 'The Chronicles of Aethermoor',
          genre: 'Fantasy',
          synopsis: 'A young mage discovers an ancient prophecy that could save or destroy the realm.',
          theme: 'Coming of age, power and responsibility',
          setting: 'Medieval fantasy world of Aethermoor',
          targetWordCount: 80000,
          currentWordCount: 12500,
          status: 'drafting',
          chapters: [
            {
              id: '1',
              title: 'The Awakening',
              content: '<p>The morning mist clung to the cobblestones of Elderbrook like a shroud...</p>',
              summary: 'Kira discovers her magical abilities when the village is attacked.',
              wordCount: 2500,
              position: 1,
              status: 'complete',
              tags: ['action', 'discovery'],
              notes: 'Introduce Kira, establish the world, inciting incident',
              scenes: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              title: 'The Mentor',
              content: '<p>Master Theron\'s tower stood against the twilight sky...</p>',
              summary: 'Kira meets her mentor and learns about the prophecy.',
              wordCount: 3200,
              position: 2,
              status: 'draft',
              tags: ['mentor', 'prophecy'],
              notes: 'Introduce Theron, explain magic system, reveal prophecy',
              scenes: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          characters: [
            {
              id: '1',
              name: 'Kira Shadowheart',
              role: 'protagonist',
              description: 'A 17-year-old village girl with latent magical powers',
              traits: ['brave', 'impulsive', 'compassionate', 'stubborn'],
              backstory: 'Orphaned at age 5, raised by her grandmother in Elderbrook',
              goals: 'Master her powers and protect her loved ones',
              relationships: [],
              appearance: 'Auburn hair, green eyes, average height, calloused hands from farm work',
              notes: 'Character arc: from scared girl to confident mage',
              color: '#8B5CF6',
            },
            {
              id: '2',
              name: 'Master Theron',
              role: 'supporting',
              description: 'Ancient wizard and Kira\'s mentor',
              traits: ['wise', 'patient', 'mysterious', 'protective'],
              backstory: 'Former court wizard who went into exile after a great war',
              goals: 'Train Kira to fulfill the prophecy',
              relationships: [],
              appearance: 'Tall, silver beard, piercing blue eyes, worn robes',
              notes: 'Holds secrets about Kira\'s true heritage',
              color: '#3B82F6',
            },
          ],
          plotPoints: [
            {
              id: '1',
              title: 'Inciting Incident',
              description: 'Village attack reveals Kira\'s powers',
              type: 'inciting_incident',
              chapter: '1',
              position: 1,
              completed: true,
            },
            {
              id: '2',
              title: 'Meeting the Mentor',
              description: 'Kira finds Master Theron',
              type: 'plot_point_1',
              chapter: '2',
              position: 2,
              completed: false,
            },
          ],
          timeline: 'Story takes place over 6 months, starting in early spring',
          notes: 'Research medieval farming practices, create detailed map of Aethermoor',
          tags: ['fantasy', 'coming-of-age', 'magic'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setStory(mockStory);
        if (mockStory.chapters.length > 0) {
          setSelectedChapter(mockStory.chapters[0]);
        }
      } catch (error) {
        toast.error('Failed to load story');
        navigate('/projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, navigate, toast]);

  const handleSaveChapter = useCallback(async (chapterContent: string) => {
    if (!selectedChapter || !story) return;

    setIsSaving(true);
    try {
      const updatedChapter = {
        ...selectedChapter,
        content: chapterContent,
        wordCount: chapterContent.replace(/<[^>]*>/g, '').split(/\s+/).length,
        updatedAt: new Date().toISOString(),
      };

      const updatedStory = {
        ...story,
        chapters: story.chapters.map(ch => ch.id === selectedChapter.id ? updatedChapter : ch),
        currentWordCount: story.chapters.reduce((total, ch) => 
          total + (ch.id === selectedChapter.id ? updatedChapter.wordCount : ch.wordCount), 0),
        updatedAt: new Date().toISOString(),
      };

      setStory(updatedStory);
      setSelectedChapter(updatedChapter);
      toast.success('Chapter saved successfully');
    } catch (error) {
      toast.error('Failed to save chapter');
    } finally {
      setIsSaving(false);
    }
  }, [selectedChapter, story, toast]);

  const createNewChapter = useCallback(() => {
    if (!story) return;

    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Chapter ${story.chapters.length + 1}`,
      content: '',
      summary: '',
      wordCount: 0,
      position: story.chapters.length + 1,
      status: 'draft',
      tags: [],
      notes: '',
      scenes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedStory = {
      ...story,
      chapters: [...story.chapters, newChapter],
      updatedAt: new Date().toISOString(),
    };

    setStory(updatedStory);
    setSelectedChapter(newChapter);
    toast.success('New chapter created');
  }, [story, toast]);

  const createNewCharacter = useCallback(() => {
    if (!story) return;

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: 'New Character',
      role: 'supporting',
      description: '',
      traits: [],
      backstory: '',
      goals: '',
      relationships: [],
      appearance: '',
      notes: '',
      color: '#6B7280',
    };

    const updatedStory = {
      ...story,
      characters: [...story.characters, newCharacter],
      updatedAt: new Date().toISOString(),
    };

    setStory(updatedStory);
    setSelectedCharacter(newCharacter);
    setShowCharacterModal(true);
  }, [story]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="text-lg font-medium">Loading your story...</p>
        </div>
      </div>
    );
  }

  if (!story || (story as any).error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">{(story as any)?.error || 'Story not found'}</p>
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="story-editor">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{story.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {story.currentWordCount.toLocaleString()} / {story.targetWordCount.toLocaleString()} words
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min((story.currentWordCount / story.targetWordCount) * 100, 100)}%` }}
              />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronUp /> : <ChevronDown />}
            </Button>

            <Button
              variant="outline"
              leftIcon={isSaving ? <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /> : <Save className="h-4 w-4" />}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="px-4 pb-2">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="chapters" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Chapters
              </TabsTrigger>
              <TabsTrigger value="characters" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Characters
              </TabsTrigger>
              <TabsTrigger value="plot" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Plot
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div className="w-80 border-r border-border/50 bg-card/30 flex flex-col">
            {activeTab === 'chapters' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Chapters</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={createNewChapter}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Chapter
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {story.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      role="listitem"
                      draggable
                      onDragStart={() => onChapterDragStart(chapter.id)}
                      onDragOver={onChapterDragOver}
                      onDrop={() => onChapterDrop(chapter.id)}
                      className={cn(
                        'p-4 border-b border-border/30 cursor-pointer hover:bg-accent/50 transition-colors',
                        selectedChapter?.id === chapter.id && 'bg-primary/10 border-l-4 border-l-primary',
                        draggingChapterId === chapter.id && 'opacity-70'
                      )}
                      onClick={() => setSelectedChapter(chapter)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
                            <h3 className="font-medium truncate">{chapter.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {chapter.summary || 'No summary'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{chapter.wordCount.toLocaleString()} words</span>
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs',
                              chapter.status === 'complete' && 'bg-green-100 text-green-700',
                              chapter.status === 'review' && 'bg-yellow-100 text-yellow-700',
                              chapter.status === 'draft' && 'bg-gray-100 text-gray-700'
                            )}>
                              {chapter.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">#{chapter.position + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'characters' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Characters</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={createNewCharacter}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Character
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {story.characters.map((character) => (
                    <div
                      key={character.id}
                      className="p-4 border-b border-border/30 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedCharacter(character);
                        setShowCharacterModal(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: character.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{character.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{character.role}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {character.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'plot' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Plot Structure</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Plot Point
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    {story.plotPoints.map((plotPoint) => (
                      <Card key={plotPoint.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{plotPoint.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {plotPoint.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                {plotPoint.type.replace('_', ' ')}
                              </span>
                              {plotPoint.chapter && (
                                <span className="text-xs text-muted-foreground">
                                  Chapter {plotPoint.chapter}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={cn(
                            'w-3 h-3 rounded-full',
                            plotPoint.completed ? 'bg-green-500' : 'bg-gray-300'
                          )} />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main editor */}
        <div className="flex-1 flex flex-col">
          {selectedChapter ? (
            <div className="flex-1 flex flex-col">
              {/* Chapter header */}
              <div className="p-4 border-b border-border/50 bg-card/30">
                <div className="text-sm text-muted-foreground mb-2">Story Tools</div>
                <div className="flex items-center justify-between">
                  <div>
                    <Input
                      value={selectedChapter.title}
                      onChange={(e) => {
                        const updatedChapter = { ...selectedChapter, title: e.target.value };
                        setSelectedChapter(updatedChapter);
                        if (story) {
                          setStory({
                            ...story,
                            chapters: story.chapters.map(ch => 
                              ch.id === selectedChapter.id ? updatedChapter : ch
                            )
                          });
                        }
                      }}
                      className="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 h-auto"
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedChapter.wordCount.toLocaleString()} words
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <span className={cn(
                            'w-2 h-2 rounded-full mr-2',
                            selectedChapter.status === 'complete' && 'bg-green-500',
                            selectedChapter.status === 'review' && 'bg-yellow-500',
                            selectedChapter.status === 'draft' && 'bg-gray-500'
                          )} />
                          {selectedChapter.status}
                        </Button>
                      }
                      options={[
                        { label: 'Draft', value: 'draft' },
                        { label: 'Review', value: 'review' },
                        { label: 'Complete', value: 'complete' },
                      ]}
                      onSelect={(status) => {
                        const updatedChapter = { ...selectedChapter, status: status as any };
                        setSelectedChapter(updatedChapter);
                        if (story) {
                          setStory({
                            ...story,
                            chapters: story.chapters.map(ch => 
                              ch.id === selectedChapter.id ? updatedChapter : ch
                            )
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1">
                <RichTextEditor
                  content={selectedChapter.content}
                  onChange={(content) => {
                    const updatedChapter = { 
                      ...selectedChapter, 
                      content,
                      wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
                    };
                    setSelectedChapter(updatedChapter);
                  }}
                  onSave={handleSaveChapter}
                  placeholder="Begin writing your chapter..."
                  showToolbar={true}
                  showStats={true}
                  autoFocus={true}
                  className="h-full"
                  data-testid="rich-text-editor"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">Select a chapter to start writing</h3>
                  <p className="text-muted-foreground">
                    Choose a chapter from the sidebar or create a new one
                  </p>
                </div>
                <Button onClick={createNewChapter} leftIcon={<Plus className="h-4 w-4" />}>
                  Create First Chapter
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Character Modal */}
      <Modal
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        title={selectedCharacter ? `Edit ${selectedCharacter.name}` : 'New Character'}
        size="lg"
      >
        {selectedCharacter && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={selectedCharacter.name}
                  onChange={(e) => setSelectedCharacter({
                    ...selectedCharacter,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <Dropdown
                  trigger={
                    <Button variant="outline" className="w-full justify-between">
                      {selectedCharacter.role}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  }
                  options={[
                    { label: 'Protagonist', value: 'protagonist' },
                    { label: 'Antagonist', value: 'antagonist' },
                    { label: 'Supporting', value: 'supporting' },
                    { label: 'Minor', value: 'minor' },
                  ]}
                  onSelect={(role) => setSelectedCharacter({
                    ...selectedCharacter,
                    role: role as any
                  })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full p-3 border border-input rounded-md bg-background min-h-[100px]"
                value={selectedCharacter.description}
                onChange={(e) => setSelectedCharacter({
                  ...selectedCharacter,
                  description: e.target.value
                })}
                placeholder="Brief character description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goals</label>
                <textarea
                  className="w-full p-3 border border-input rounded-md bg-background"
                  value={selectedCharacter.goals}
                  onChange={(e) => setSelectedCharacter({
                    ...selectedCharacter,
                    goals: e.target.value
                  })}
                  placeholder="What does this character want?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Backstory</label>
                <textarea
                  className="w-full p-3 border border-input rounded-md bg-background"
                  value={selectedCharacter.backstory}
                  onChange={(e) => setSelectedCharacter({
                    ...selectedCharacter,
                    backstory: e.target.value
                  })}
                  placeholder="Character's history and background..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCharacterModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (story && selectedCharacter) {
                    setStory({
                      ...story,
                      characters: story.characters.map(ch => 
                        ch.id === selectedCharacter.id ? selectedCharacter : ch
                      )
                    });
                  }
                  setShowCharacterModal(false);
                  toast.success('Character updated');
                }}
              >
                Save Character
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
