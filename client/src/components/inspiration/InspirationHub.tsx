/**
 * InspirationHub Component
 * Revolutionary creative visual reference and mood board system
 * AI-powered inspiration management with story integration
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import MoodBoardCanvas from './MoodBoardCanvas';
import VisualStyleGenerator from './VisualStyleGenerator';
import ColorPaletteExtractor from './ColorPaletteExtractor';
import type { Project, Character, Location, Scene } from '@/types/story';
import {
  Palette,
  Image,
  Sparkles,
  Upload,
  Download,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Heart,
  Share,
  Plus,
  X,
  RotateCcw,
  Shuffle,
  Wand2,
  Camera,
  Layers,
  Bookmark,
  Tag,
  Globe,
  Users,
  MapPin,
  Crown,
  Swords,
  Home,
  Trees,
  Mountain,
  Waves,
  Sun,
  Moon,
  Star,
  Fire,
  Snowflake
} from 'lucide-react';

export interface VisualReference {
  id: string;
  type: 'image' | 'color' | 'texture' | 'style' | 'mood';
  url?: string;
  data: string | object;
  title: string;
  description?: string;
  tags: string[];
  category: 'character' | 'location' | 'mood' | 'object' | 'scene' | 'general';
  appliedTo: string[]; // Element IDs using this reference
  metadata: {
    mood: string[];
    intensity: number;
    dominantColors: string[];
    style: string[];
    keywords: string[];
    aiGenerated: boolean;
    source?: string;
    license?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MoodBoard {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  references: string[]; // VisualReference IDs
  layout: 'grid' | 'freeform' | 'collage' | 'timeline';
  canvas: {
    width: number;
    height: number;
    elements: MoodBoardElement[];
  };
  tags: string[];
  isPublic: boolean;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MoodBoardElement {
  id: string;
  referenceId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  zIndex: number;
  effects: VisualEffect[];
}

export interface VisualEffect {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'sepia' | 'grayscale';
  value: number;
}

export interface AIPrompt {
  type: 'character' | 'location' | 'object' | 'scene' | 'mood';
  prompt: string;
  style: string;
  mood: string[];
  colors: string[];
  keywords: string[];
  negativePrompt?: string;
  seed?: number;
  guidance: number;
  steps: number;
}

interface InspirationHubProps {
  project: Project;
  characters: Character[];
  locations: Location[];
  scenes: Scene[];
  categories: ('characters' | 'locations' | 'moods' | 'objects' | 'scenes' | 'general')[];
  integrationMode: 'reference' | 'generation' | 'analysis' | 'collaborative';
  onReferenceApply?: (referenceId: string, elementId: string, elementType: string) => void;
  onReferenceCreate?: (reference: Omit<VisualReference, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onMoodBoardCreate?: (moodBoard: Omit<MoodBoard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  className?: string;
}

const INSPIRATION_CATEGORIES = {
  characters: { icon: Users, color: '#10b981', keywords: ['person', 'face', 'portrait', 'character', 'hero', 'villain'] },
  locations: { icon: MapPin, color: '#3b82f6', keywords: ['landscape', 'building', 'room', 'city', 'nature', 'environment'] },
  moods: { icon: Palette, color: '#8b5cf6', keywords: ['atmosphere', 'emotion', 'feeling', 'vibe', 'tone', 'ambiance'] },
  objects: { icon: Crown, color: '#f59e0b', keywords: ['item', 'weapon', 'tool', 'artifact', 'prop', 'symbol'] },
  scenes: { icon: Camera, color: '#ef4444', keywords: ['scene', 'moment', 'action', 'event', 'composition', 'drama'] },
  general: { icon: Sparkles, color: '#6b7280', keywords: ['inspiration', 'reference', 'style', 'aesthetic', 'concept'] }
};

const MOOD_PRESETS = [
  { name: 'Epic Fantasy', colors: ['#8B4513', '#FFD700', '#2F4F4F', '#8A2BE2'], keywords: ['epic', 'fantasy', 'medieval', 'magic'] },
  { name: 'Cyberpunk', colors: ['#FF00FF', '#00FFFF', '#1A1A1A', '#FF6600'], keywords: ['cyberpunk', 'neon', 'futuristic', 'tech'] },
  { name: 'Gothic Horror', colors: ['#2F0F2F', '#8B0000', '#2F2F2F', '#C0C0C0'], keywords: ['gothic', 'dark', 'horror', 'mysterious'] },
  { name: 'Pastoral Romance', colors: ['#F0E68C', '#FFB6C1', '#98FB98', '#87CEEB'], keywords: ['romantic', 'soft', 'nature', 'peaceful'] },
  { name: 'Space Opera', colors: ['#191970', '#4169E1', '#C0C0C0', '#FFD700'], keywords: ['space', 'cosmic', 'stars', 'futuristic'] },
  { name: 'Noir Mystery', colors: ['#2F2F2F', '#F5F5DC', '#8B0000', '#C0C0C0'], keywords: ['noir', 'mystery', 'shadows', 'dramatic'] }
];

const AI_STYLE_PRESETS = [
  'Photorealistic', 'Digital Art', 'Oil Painting', 'Watercolor', 'Pencil Sketch',
  'Concept Art', 'Anime', 'Renaissance', 'Impressionist', 'Abstract',
  'Minimalist', 'Baroque', 'Art Nouveau', 'Pop Art', 'Surrealist'
];

export function InspirationHub({
  project,
  characters,
  locations,
  scenes,
  categories,
  integrationMode,
  onReferenceApply,
  onReferenceCreate,
  onMoodBoardCreate,
  className
}: InspirationHubProps) {
  const [references, setReferences] = useState<VisualReference[]>([]);
  const [moodBoards, setMoodBoards] = useState<MoodBoard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'general');
  const [selectedReferences, setSelectedReferences] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'moodboard'>('grid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<AIPrompt>({
    type: 'character',
    prompt: '',
    style: 'Digital Art',
    mood: [],
    colors: [],
    keywords: [],
    guidance: 7.5,
    steps: 30
  });
  const [showGenerator, setShowGenerator] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter references based on category, search, and tags
  const filteredReferences = references.filter(ref => {
    const categoryMatch = selectedCategory === 'all' || ref.category === selectedCategory;
    const searchMatch = searchQuery === '' || 
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const tagMatch = selectedTags.size === 0 || 
      Array.from(selectedTags).every(tag => ref.tags.includes(tag));
    
    return categoryMatch && searchMatch && tagMatch;
  });

  // Get all unique tags from references
  const allTags = Array.from(new Set(references.flatMap(ref => ref.tags))).sort();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        
        // Extract colors and analyze image (placeholder for actual AI analysis)
        const newReference: Omit<VisualReference, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'image',
          url,
          data: url,
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: `Uploaded image: ${file.name}`,
          tags: [selectedCategory],
          category: selectedCategory as any,
          appliedTo: [],
          metadata: {
            mood: [],
            intensity: 50,
            dominantColors: ['#cccccc'], // Would be extracted by ColorThief
            style: ['photograph'],
            keywords: [],
            aiGenerated: false,
            source: 'upload',
            license: 'user-owned'
          }
        };

        onReferenceCreate?.(newReference);
        setReferences(prev => [...prev, {
          ...newReference,
          id: `ref-${Date.now()}-${Math.random()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]);
      }
    }
  };

  const handleAIGeneration = async () => {
    setIsGenerating(true);
    
    try {
      // Placeholder for actual AI API call
      const response = await generateAIImage(aiPrompt);
      
      const newReference: Omit<VisualReference, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'image',
        url: response.url,
        data: response.data,
        title: `AI Generated: ${aiPrompt.prompt.slice(0, 30)}...`,
        description: aiPrompt.prompt,
        tags: [...aiPrompt.keywords, aiPrompt.style.toLowerCase(), 'ai-generated'],
        category: aiPrompt.type as any,
        appliedTo: [],
        metadata: {
          mood: aiPrompt.mood,
          intensity: 80,
          dominantColors: aiPrompt.colors,
          style: [aiPrompt.style],
          keywords: aiPrompt.keywords,
          aiGenerated: true,
          source: 'ai-generation'
        }
      };

      onReferenceCreate?.(newReference);
      setReferences(prev => [...prev, {
        ...newReference,
        id: `ref-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToElement = (referenceId: string, elementId: string, elementType: string) => {
    onReferenceApply?.(referenceId, elementId, elementType);
    
    // Update reference to track application
    setReferences(prev => prev.map(ref => 
      ref.id === referenceId 
        ? { ...ref, appliedTo: [...ref.appliedTo, elementId] }
        : ref
    ));
  };

  const handleCreateMoodBoard = () => {
    if (selectedReferences.size === 0) return;

    const newMoodBoard: Omit<MoodBoard, 'id' | 'createdAt' | 'updatedAt'> = {
      projectId: project.id,
      title: `Mood Board ${moodBoards.length + 1}`,
      references: Array.from(selectedReferences),
      layout: 'grid',
      canvas: {
        width: 1200,
        height: 800,
        elements: []
      },
      tags: [selectedCategory],
      isPublic: false,
      collaborators: []
    };

    onMoodBoardCreate?.(newMoodBoard);
    setMoodBoards(prev => [...prev, {
      ...newMoodBoard,
      id: `board-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]);
    
    setSelectedReferences(new Set());
  };

  const renderReferenceCard = (reference: VisualReference) => (
    <Card
      key={reference.id}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        selectedReferences.has(reference.id) && "ring-2 ring-cosmic-500"
      )}
      onClick={() => {
        const newSelected = new Set(selectedReferences);
        if (newSelected.has(reference.id)) {
          newSelected.delete(reference.id);
        } else {
          newSelected.add(reference.id);
        }
        setSelectedReferences(newSelected);
      }}
    >
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        {reference.type === 'image' && reference.url ? (
          <img
            src={reference.url}
            alt={reference.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(45deg, ${reference.metadata.dominantColors.join(', ')})` 
            }}
          >
            <Palette className="h-8 w-8 text-white/80" />
          </div>
        )}
        
        {reference.metadata.aiGenerated && (
          <Badge className="absolute top-2 right-2 bg-purple-500">
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3">
        <h4 className="font-medium text-sm truncate">{reference.title}</h4>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {reference.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {reference.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {reference.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{reference.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {reference.metadata.dominantColors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="p-1">
              <Heart className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1">
              <Share className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Placeholder for AI image generation
  const generateAIImage = async (prompt: AIPrompt): Promise<{ url: string; data: any }> => {
    // This would integrate with actual AI services like DALL-E, Midjourney, or Stable Diffusion
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
    return {
      url: 'https://via.placeholder.com/512x512/4f46e5/ffffff?text=AI+Generated',
      data: {}
    };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn("inspiration-hub", className)}>
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Inspiration Hub
                <Badge variant="outline" className="ml-2">
                  {filteredReferences.length} references
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowGenerator(true)}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Generate
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCreateMoodBoard}
                  disabled={selectedReferences.size === 0}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Create Board ({selectedReferences.size})
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search references..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                {Object.entries(INSPIRATION_CATEGORIES).map(([key, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <Button
                      key={key}
                      size="sm"
                      variant={selectedCategory === key ? 'default' : 'ghost'}
                      onClick={() => setSelectedCategory(key)}
                      className="flex items-center gap-1"
                    >
                      <IconComponent className="h-3 w-3" />
                      {key}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'moodboard' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('moodboard')}
                  className="rounded-l-none"
                >
                  <Layers className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {allTags.slice(0, 10).map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={selectedTags.has(tag) ? 'default' : 'outline'}
                    onClick={() => {
                      const newTags = new Set(selectedTags);
                      if (newTags.has(tag)) {
                        newTags.delete(tag);
                      } else {
                        newTags.add(tag);
                      }
                      setSelectedTags(newTags);
                    }}
                    className="text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
                {selectedTags.size > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedTags(new Set())}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsContent value="grid">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredReferences.map(renderReferenceCard)}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-2">
              {filteredReferences.map(reference => (
                <Card key={reference.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      {reference.url ? (
                        <img
                          src={reference.url}
                          alt={reference.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ 
                            background: `linear-gradient(45deg, ${reference.metadata.dominantColors.join(', ')})` 
                          }}
                        >
                          <Palette className="h-4 w-4 text-white/80" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{reference.title}</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        {reference.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {reference.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">Apply</Button>
                      <Button size="sm" variant="ghost">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="moodboard">
            <MoodBoardCanvas
              references={filteredReferences}
              selectedReferences={selectedReferences}
              onReferenceSelect={setSelectedReferences}
              onMoodBoardSave={handleCreateMoodBoard}
            />
          </TabsContent>
        </Tabs>

        {/* AI Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI Reference Generator</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowGenerator(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Prompt</label>
                  <textarea
                    value={aiPrompt.prompt}
                    onChange={(e) => setAiPrompt(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Describe what you want to generate..."
                    className="w-full mt-1 p-3 border rounded-md resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={aiPrompt.type}
                      onChange={(e) => setAiPrompt(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                    >
                      <option value="character">Character</option>
                      <option value="location">Location</option>
                      <option value="object">Object</option>
                      <option value="scene">Scene</option>
                      <option value="mood">Mood</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Style</label>
                    <select
                      value={aiPrompt.style}
                      onChange={(e) => setAiPrompt(prev => ({ ...prev, style: e.target.value }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                    >
                      {AI_STYLE_PRESETS.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Mood Presets</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {MOOD_PRESETS.map(preset => (
                      <Button
                        key={preset.name}
                        size="sm"
                        variant="outline"
                        onClick={() => setAiPrompt(prev => ({
                          ...prev,
                          mood: preset.keywords,
                          colors: preset.colors,
                          keywords: [...prev.keywords, ...preset.keywords]
                        }))}
                        className="justify-start"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {preset.colors.slice(0, 3).map((color, i) => (
                              <div
                                key={i}
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {preset.name}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Advanced settings: Guidance {aiPrompt.guidance}, Steps {aiPrompt.steps}
                  </div>
                  
                  <Button
                    onClick={handleAIGeneration}
                    disabled={!aiPrompt.prompt || isGenerating}
                    className="min-w-[120px]"
                  >
                    {isGenerating ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>
    </DndProvider>
  );
}

export default InspirationHub;
