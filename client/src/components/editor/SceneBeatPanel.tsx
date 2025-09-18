/**
 * Scene Beat Panel Component
 * Provides interface for creating, managing, and expanding scene beats
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { 
  Plus,
  Wand2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Move,
  Edit3,
  Lightbulb,
  Play,
  Copy,
  MoreHorizontal,
  Zap,
  MessageSquare,
  Drama,
  Navigation,
  Heart,
  Swords,
  Settings,
  Sparkles
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { 
  sceneBeatService, 
  type SceneBeat, 
  type BeatExpansionOptions,
  type BeatTemplate
} from '@/services/sceneBeatService';

interface SceneBeatPanelProps {
  editor: Editor | null;
  sceneId: string;
  onBeatInsert?: (content: string) => void;
  className?: string;
}

const BEAT_TYPE_ICONS = {
  action: <Swords className="h-4 w-4" />,
  dialogue: <MessageSquare className="h-4 w-4" />,
  description: <Edit3 className="h-4 w-4" />,
  transition: <Navigation className="h-4 w-4" />,
  emotion: <Heart className="h-4 w-4" />,
  conflict: <Drama className="h-4 w-4" />,
};

const BEAT_TYPE_COLORS = {
  action: 'bg-red-100 text-red-800 border-red-200',
  dialogue: 'bg-blue-100 text-blue-800 border-blue-200',
  description: 'bg-green-100 text-green-800 border-green-200',
  transition: 'bg-purple-100 text-purple-800 border-purple-200',
  emotion: 'bg-pink-100 text-pink-800 border-pink-200',
  conflict: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function SceneBeatPanel({ 
  editor, 
  sceneId, 
  onBeatInsert,
  className 
}: SceneBeatPanelProps) {
  const [beats, setBeats] = useState<SceneBeat[]>([]);
  const [templates, setTemplates] = useState<BeatTemplate[]>([]);
  const [newBeatContent, setNewBeatContent] = useState('');
  const [newBeatType, setNewBeatType] = useState<SceneBeat['type']>('description');
  const [expandingBeat, setExpandingBeat] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSlashHelp, setShowSlashHelp] = useState(false);
  const [expansionOptions, setExpansionOptions] = useState<BeatExpansionOptions>({
    tone: 'dramatic',
    style: 'detailed',
    perspective: 'third-limited',
    targetLength: 'medium',
    includeDialogue: true,
    includeSensoryDetails: true,
  });

  const toast = useToast();

  // Load beats and templates
  useEffect(() => {
    setBeats(sceneBeatService.getSceneBeats(sceneId));
    setTemplates(sceneBeatService.getTemplates());
  }, [sceneId]);

  // Beat type options
  const beatTypeOptions: DropdownOption[] = [
    { value: 'action', label: 'Action', icon: BEAT_TYPE_ICONS.action },
    { value: 'dialogue', label: 'Dialogue', icon: BEAT_TYPE_ICONS.dialogue },
    { value: 'description', label: 'Description', icon: BEAT_TYPE_ICONS.description },
    { value: 'transition', label: 'Transition', icon: BEAT_TYPE_ICONS.transition },
    { value: 'emotion', label: 'Emotion', icon: BEAT_TYPE_ICONS.emotion },
    { value: 'conflict', label: 'Conflict', icon: BEAT_TYPE_ICONS.conflict },
  ];

  // Create new beat
  const handleCreateBeat = useCallback(async () => {
    if (!newBeatContent.trim()) return;

    try {
      const beat = sceneBeatService.createBeat(sceneId, newBeatContent, newBeatType);
      setBeats(sceneBeatService.getSceneBeats(sceneId));
      setNewBeatContent('');
      toast.success('Beat created successfully');
    } catch (error) {
      toast.error('Failed to create beat');
    }
  }, [sceneId, newBeatContent, newBeatType, toast]);

  // Expand beat to prose
  const handleExpandBeat = useCallback(async (beatId: string) => {
    setExpandingBeat(beatId);
    
    try {
      const expandedContent = await sceneBeatService.expandBeat(beatId, sceneId, expansionOptions);
      setBeats(sceneBeatService.getSceneBeats(sceneId));
      
      // Insert into editor if callback provided
      if (onBeatInsert) {
        onBeatInsert(expandedContent);
      }
      
      toast.success('Beat expanded successfully');
    } catch (error) {
      toast.error('Failed to expand beat');
    } finally {
      setExpandingBeat(null);
    }
  }, [sceneId, expansionOptions, onBeatInsert, toast]);

  // Delete beat
  const handleDeleteBeat = useCallback((beatId: string) => {
    if (sceneBeatService.deleteBeat(sceneId, beatId)) {
      setBeats(sceneBeatService.getSceneBeats(sceneId));
      toast.success('Beat deleted');
    }
  }, [sceneId, toast]);

  // Apply template
  const handleApplyTemplate = useCallback((templateId: string) => {
    try {
      const newBeats = sceneBeatService.applyTemplate(sceneId, templateId);
      setBeats(sceneBeatService.getSceneBeats(sceneId));
      setShowTemplates(false);
      toast.success(`Applied ${newBeats.length} beats from template`);
    } catch (error) {
      toast.error('Failed to apply template');
    }
  }, [sceneId, toast]);

  // Generate suggestions
  const handleGetSuggestions = useCallback(async () => {
    try {
      const currentContent = editor?.getText() || '';
      const position = editor?.state.selection.from || 0;
      const suggestions = await sceneBeatService.getBeatSuggestions(sceneId, currentContent, position);
      
      // For now, just show the first suggestion as a toast
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        toast.info(`Suggestion: ${suggestion.type} - ${suggestion.content}`);
      }
    } catch (error) {
      toast.error('Failed to get beat suggestions');
    }
  }, [editor, sceneId, toast]);

  // Insert beat content into editor
  const handleInsertBeat = useCallback((content: string) => {
    if (editor && onBeatInsert) {
      onBeatInsert(content);
    }
  }, [editor, onBeatInsert]);

  // Process slash commands in editor
  const handleProcessSlashCommands = useCallback(async () => {
    if (!editor) return;

    try {
      const content = editor.getText();
      const newBeats = await sceneBeatService.processSlashCommands(sceneId, content);
      
      if (newBeats.length > 0) {
        setBeats(sceneBeatService.getSceneBeats(sceneId));
        toast.success(`Created ${newBeats.length} beats from slash commands`);
      } else {
        toast.info('No slash commands found');
      }
    } catch (error) {
      toast.error('Failed to process slash commands');
    }
  }, [editor, sceneId, toast]);

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cosmic-600" />
            Scene Beats
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSlashHelp(!showSlashHelp)}
              title="Slash commands help"
            >
              <span className="text-xs font-mono">/</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGetSuggestions}
              title="Get AI suggestions"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              title="Beat templates"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Slash Commands Help */}
        {showSlashHelp && (
          <div className="mt-3 p-3 bg-muted rounded-lg text-xs space-y-2">
            <p className="font-medium">Slash Commands:</p>
            <div className="grid grid-cols-2 gap-2">
              <div><code>/action</code> - Action beat</div>
              <div><code>/dialogue</code> - Dialogue beat</div>
              <div><code>/desc</code> - Description beat</div>
              <div><code>/emotion</code> - Emotion beat</div>
              <div><code>/conflict</code> - Conflict beat</div>
              <div><code>/transition</code> - Transition beat</div>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={handleProcessSlashCommands}
              className="mt-2"
            >
              <Zap className="h-3 w-3 mr-1" />
              Process Commands
            </Button>
          </div>
        )}

        {/* Templates */}
        {showTemplates && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium">Beat Templates:</p>
            <div className="grid gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="xs"
                  onClick={() => handleApplyTemplate(template.id)}
                  className="justify-start text-xs"
                >
                  <span className="font-medium">{template.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {template.beats.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-3 space-y-4">
        {/* Create New Beat */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Dropdown
              options={beatTypeOptions}
              value={newBeatType}
              onChange={(type) => setNewBeatType(type as SceneBeat['type'])}
              placeholder="Type"
              className="w-32"
            />
            <Input
              value={newBeatContent}
              onChange={(e) => setNewBeatContent(e.target.value)}
              placeholder="Describe the beat..."
              className="flex-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateBeat();
                }
              }}
            />
            <Button
              onClick={handleCreateBeat}
              disabled={!newBeatContent.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expansion Options */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Expansion Options:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={expansionOptions.tone}
              onChange={(e) => setExpansionOptions(prev => ({ 
                ...prev, 
                tone: e.target.value as any 
              }))}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="dramatic">Dramatic</option>
              <option value="humorous">Humorous</option>
              <option value="suspenseful">Suspenseful</option>
              <option value="romantic">Romantic</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
            <select
              value={expansionOptions.targetLength}
              onChange={(e) => setExpansionOptions(prev => ({ 
                ...prev, 
                targetLength: e.target.value as any 
              }))}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>

        {/* Beat List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {beats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scene beats yet</p>
              <p className="text-xs">Create beats to structure your scene</p>
            </div>
          ) : (
            beats.map((beat, index) => (
              <Card key={beat.id} className="p-3 space-y-2">
                {/* Beat Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", BEAT_TYPE_COLORS[beat.type])}
                    >
                      {BEAT_TYPE_ICONS[beat.type]}
                      <span className="ml-1 capitalize">{beat.type}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!beat.isExpanded && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleExpandBeat(beat.id)}
                        disabled={expandingBeat === beat.id}
                        title="Expand to prose"
                      >
                        {expandingBeat === beat.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    {beat.isExpanded && beat.expandedContent && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleInsertBeat(beat.expandedContent!)}
                        title="Insert into editor"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDeleteBeat(beat.id)}
                      title="Delete beat"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Beat Content */}
                <div className="text-sm">
                  <p className="text-foreground">{beat.content}</p>
                  
                  {beat.isExpanded && beat.expandedContent && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <p className="font-medium text-muted-foreground mb-1">Expanded:</p>
                      <p className="leading-relaxed">{beat.expandedContent}</p>
                    </div>
                  )}
                </div>

                {/* Beat Metadata */}
                {beat.metadata && (
                  <div className="flex flex-wrap gap-1">
                    {beat.metadata.characters?.map((char) => (
                      <Badge key={char} variant="secondary" className="text-xs">
                        {char}
                      </Badge>
                    ))}
                    {beat.metadata.location && (
                      <Badge variant="secondary" className="text-xs">
                        📍 {beat.metadata.location}
                      </Badge>
                    )}
                    {beat.metadata.mood && (
                      <Badge variant="secondary" className="text-xs">
                        🎭 {beat.metadata.mood}
                      </Badge>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        {beats.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const prose = await sceneBeatService.generateSceneProse(sceneId, expansionOptions);
                  if (onBeatInsert) {
                    onBeatInsert(prose);
                  }
                  toast.success('Scene prose generated');
                } catch (error) {
                  toast.error('Failed to generate prose');
                }
              }}
              className="w-full text-xs"
            >
              <Play className="h-3 w-3 mr-2" />
              Generate Full Scene
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}