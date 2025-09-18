/**
 * AI Writing Integration Panel - Unified interface for all AI writing features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { 
  PenTool, 
  Brain, 
  Sparkles, 
  Mic, 
  Target, 
  Lightbulb,
  MessageSquare,
  Users,
  Book,
  Zap,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  X,
  ArrowRight,
  Wand2,
  FileText,
  Star,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

// Import AI services
import aiWritingCompanionService from '@/services/aiWritingCompanion';
import creativityBoosterService from '@/services/creativityBooster';
import voiceInteractionService from '@/services/voiceInteraction';
import storyAssistantService from '@/services/storyAssistant';
import voiceStyleCoachService from '@/services/voiceStyleCoach';
import predictiveWritingAssistantService from '@/services/predictiveWritingAssistant';

interface WritingAssistant {
  id: string;
  name: string;
  personality: 'mentor' | 'critic' | 'cheerleader' | 'analyst' | 'creative';
  description: string;
  avatar: string;
  specialties: string[];
  isActive: boolean;
}

interface WritingSuggestion {
  id: string;
  type: 'continuation' | 'improvement' | 'alternative' | 'expansion' | 'correction';
  suggestion: string;
  reasoning: string;
  confidence: number;
  source: string;
  original?: string;
  position?: { start: number; end: number };
}

interface WritingSession {
  id: string;
  title: string;
  startTime: number;
  wordCount: number;
  goalWords: number;
  activeAssistants: string[];
  mood: 'creative' | 'focused' | 'exploratory' | 'editing';
  suggestions: WritingSuggestion[];
}

export function AIWritingPanel() {
  const [activeSession, setActiveSession] = useState<WritingSession | null>(null);
  const [assistants, setAssistants] = useState<WritingAssistant[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string>('mentor');
  const [writingMode, setWritingMode] = useState<'draft' | 'edit' | 'brainstorm'>('draft');
  const [activeTab, setActiveTab] = useState('assistants');
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  useEffect(() => {
    loadWritingAssistants();
    initializeSession();
  }, []);

  const loadWritingAssistants = () => {
    const assistantsList: WritingAssistant[] = [
      {
        id: 'mentor',
        name: 'The Mentor',
        personality: 'mentor',
        description: 'Wise and encouraging, provides structural guidance and development insights',
        avatar: '🧙‍♂️',
        specialties: ['Plot development', 'Character arcs', 'Story structure', 'Pacing'],
        isActive: true
      },
      {
        id: 'critic',
        name: 'The Critic',
        personality: 'critic',
        description: 'Sharp-eyed and analytical, focuses on quality and refinement',
        avatar: '🎭',
        specialties: ['Grammar', 'Style', 'Consistency', 'Logic'],
        isActive: false
      },
      {
        id: 'cheerleader',
        name: 'The Cheerleader',
        personality: 'cheerleader',
        description: 'Enthusiastic and motivating, keeps you inspired and confident',
        avatar: '🌟',
        specialties: ['Motivation', 'Encouragement', 'Momentum', 'Confidence'],
        isActive: false
      },
      {
        id: 'analyst',
        name: 'The Analyst',
        personality: 'analyst',
        description: 'Data-driven and thorough, provides detailed feedback and metrics',
        avatar: '📊',
        specialties: ['Analytics', 'Metrics', 'Patterns', 'Optimization'],
        isActive: false
      },
      {
        id: 'creative',
        name: 'The Creative',
        personality: 'creative',
        description: 'Imaginative and inspiring, sparks new ideas and creative solutions',
        avatar: '🎨',
        specialties: ['Ideation', 'Creativity', 'Innovation', 'Inspiration'],
        isActive: false
      }
    ];

    setAssistants(assistantsList);
  };

  const initializeSession = () => {
    const session: WritingSession = {
      id: 'session-' + Date.now(),
      title: 'Writing Session',
      startTime: Date.now(),
      wordCount: 0,
      goalWords: 500,
      activeAssistants: ['mentor'],
      mood: 'creative',
      suggestions: []
    };

    setActiveSession(session);
  };

  const generateSuggestions = async (text: string) => {
    if (!text.trim()) return;

    setIsGenerating(true);
    try {
      // Mock AI suggestions based on selected assistant
      const mockSuggestions: WritingSuggestion[] = [
        {
          id: '1',
          type: 'continuation',
          suggestion: 'The shadows seemed to whisper secrets of forgotten memories, leading her deeper into the mysterious grove.',
          reasoning: 'Continue the atmospheric tone while advancing the plot',
          confidence: 0.92,
          source: selectedAssistant,
          position: { start: text.length, end: text.length }
        },
        {
          id: '2',
          type: 'improvement',
          suggestion: 'Consider replacing "walked slowly" with a more descriptive action like "crept cautiously" or "drifted silently"',
          reasoning: 'Stronger verbs create more vivid imagery',
          confidence: 0.85,
          source: selectedAssistant,
          original: 'walked slowly'
        },
        {
          id: '3',
          type: 'expansion',
          suggestion: 'Develop the character\'s emotional state: What is she feeling as she approaches this mysterious place? Fear? Curiosity? Determination?',
          reasoning: 'Adding internal conflict enriches character development',
          confidence: 0.78,
          source: selectedAssistant
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = (suggestion: WritingSuggestion) => {
    if (suggestion.type === 'continuation') {
      setCurrentText(prev => prev + ' ' + suggestion.suggestion);
    } else if (suggestion.type === 'improvement' && suggestion.original) {
      setCurrentText(prev => prev.replace(suggestion.original, suggestion.suggestion));
    }
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const toggleAssistant = (assistantId: string) => {
    setAssistants(prev => prev.map(assistant => 
      assistant.id === assistantId 
        ? { ...assistant, isActive: !assistant.isActive }
        : assistant
    ));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.8) return 'bg-blue-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'continuation': return <ArrowRight className="h-4 w-4" />;
      case 'improvement': return <Wand2 className="h-4 w-4" />;
      case 'alternative': return <RotateCcw className="h-4 w-4" />;
      case 'expansion': return <Sparkles className="h-4 w-4" />;
      case 'correction': return <Check className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const renderAssistants = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assistants.map((assistant) => (
          <Card key={assistant.id} className={`cursor-pointer transition-all ${
            assistant.isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{assistant.avatar}</div>
                  <div>
                    <CardTitle className="text-lg">{assistant.name}</CardTitle>
                    <CardDescription>{assistant.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={assistant.isActive}
                  onCheckedChange={() => toggleAssistant(assistant.id)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {assistant.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {assistant.isActive && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedAssistant(assistant.id)}
                  >
                    Select for Active Writing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderWritingInterface = () => (
    <div className="space-y-6">
      {/* Writing Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Writing Session</CardTitle>
              <CardDescription>
                {activeSession?.wordCount || 0} words • Goal: {activeSession?.goalWords || 0} words
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={voiceMode ? "default" : "outline"}
                size="sm"
                onClick={() => setVoiceMode(!voiceMode)}
              >
                <Mic className="h-4 w-4 mr-1" />
                Voice
              </Button>
              <Select value={writingMode} onValueChange={setWritingMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="brainstorm">Brainstorm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(((activeSession?.wordCount || 0) / (activeSession?.goalWords || 1)) * 100)}%</span>
              </div>
              <Progress value={((activeSession?.wordCount || 0) / (activeSession?.goalWords || 1)) * 100} />
            </div>

            <Textarea
              placeholder="Start writing... Your AI assistants will provide suggestions as you type."
              value={currentText}
              onChange={(e) => {
                setCurrentText(e.target.value);
                const wordCount = e.target.value.split(/\s+/).filter(Boolean).length;
                if (activeSession) {
                  setActiveSession({ ...activeSession, wordCount });
                }
              }}
              className="min-h-[300px] resize-none"
              onBlur={() => generateSuggestions(currentText)}
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Selected: {assistants.find(a => a.id === selectedAssistant)?.name}</span>
                <span>Mode: {writingMode}</span>
                {voiceMode && <Badge variant="secondary">Voice Active</Badge>}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => generateSuggestions(currentText)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Get Suggestions
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Suggestions ({suggestions.length})
            </CardTitle>
            <CardDescription>
              Smart suggestions from your active AI assistants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getSuggestionIcon(suggestion.type)}
                      <Badge variant="outline" className="capitalize">
                        {suggestion.type}
                      </Badge>
                      <Badge className={`text-white text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => applySuggestion(suggestion)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Apply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium">{suggestion.suggestion}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                    {suggestion.original && (
                      <p className="text-xs text-muted-foreground">
                        Original: "{suggestion.original}"
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      From: {assistants.find(a => a.id === suggestion.source)?.name || suggestion.source}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSession ? Math.round((Date.now() - activeSession.startTime) / 60000) : 0}m
            </div>
            <p className="text-xs text-muted-foreground">Current session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Writing Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSession ? Math.round(activeSession.wordCount / Math.max((Date.now() - activeSession.startTime) / 60000, 1)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">words per minute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Assists</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suggestions.length}</div>
            <p className="text-xs text-muted-foreground">suggestions available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.7</div>
            <p className="text-xs text-muted-foreground">AI quality assessment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Writing Insights</CardTitle>
          <CardDescription>AI-powered analysis of your writing session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-medium text-blue-900">Pacing Analysis</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your writing pace is steady and consistent. Consider varying sentence length for better flow.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-medium text-green-900">Strength Identified</h4>
              <p className="text-sm text-green-700 mt-1">
                Excellent use of descriptive language and atmospheric details. Keep up the vivid imagery!
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-medium text-yellow-900">Suggestion</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Consider adding more dialogue to break up narrative passages and increase engagement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Writing Assistant</h1>
          <p className="text-muted-foreground">
            Your personal AI writing team - get instant feedback, suggestions, and creative support
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assistants">AI Assistants</TabsTrigger>
          <TabsTrigger value="writing">Writing Interface</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="assistants" className="space-y-4">
          {renderAssistants()}
        </TabsContent>

        <TabsContent value="writing" className="space-y-4">
          {renderWritingInterface()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {renderInsights()}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Writing History</CardTitle>
              <CardDescription>Previous sessions and AI interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Writing history and session analytics coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}