/**
 * Smart Content Generator Component
 * Provides AI-powered content suggestions and writer's block assistance
 */

import React, { useState, useCallback } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Plus, 
  ArrowRight,
  BookOpen,
  Target,
  Lightbulb,
  Zap,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface ContentSuggestion {
  id: string;
  type: 'opening' | 'continuation' | 'conclusion' | 'transition' | 'detail' | 'example';
  title: string;
  content: string;
  context: string;
  confidence: number;
}

interface SmartContentGeneratorProps {
  currentContent: string;
  onContentInsert: (content: string) => void;
  projectType?: string;
  className?: string;
}

export function SmartContentGenerator({ 
  currentContent, 
  onContentInsert, 
  projectType = 'general',
  className 
}: SmartContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<ContentSuggestion['type']>('continuation');
  const [contextWords, setContextWords] = useState(50);
  const toast = useToast();

  const contentTypes: DropdownOption[] = [
    { 
      value: 'opening', 
      label: 'Opening', 
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Start a new section or chapter'
    },
    { 
      value: 'continuation', 
      label: 'Continuation', 
      icon: <ArrowRight className="h-4 w-4" />,
      description: 'Continue the current thought'
    },
    { 
      value: 'conclusion', 
      label: 'Conclusion', 
      icon: <Target className="h-4 w-4" />,
      description: 'Wrap up or summarize'
    },
    { 
      value: 'transition', 
      label: 'Transition', 
      icon: <Zap className="h-4 w-4" />,
      description: 'Connect ideas smoothly'
    },
    { 
      value: 'detail', 
      label: 'Add Details', 
      icon: <Plus className="h-4 w-4" />,
      description: 'Expand with more information'
    },
    { 
      value: 'example', 
      label: 'Example', 
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'Provide concrete examples'
    },
  ];

  // Generate content suggestions based on current context
  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Get the last N words for context
      const words = currentContent.trim().split(/\s+/);
      const context = words.slice(-contextWords).join(' ');
      
      // Simulate AI content generation with realistic suggestions
      const mockSuggestions: ContentSuggestion[] = await new Promise(resolve => {
        setTimeout(() => {
          const suggestions = generateMockSuggestions(selectedType, context, projectType);
          resolve(suggestions);
        }, 1500); // Simulate API delay
      });

      setSuggestions(mockSuggestions);
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  }, [currentContent, selectedType, contextWords, projectType, toast]);

  // Generate suggestions with custom prompt
  const generateWithPrompt = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate AI generation with custom prompt
      const mockSuggestions: ContentSuggestion[] = await new Promise(resolve => {
        setTimeout(() => {
          const suggestions = generatePromptBasedSuggestions(prompt, currentContent);
          resolve(suggestions);
        }, 2000);
      });

      setSuggestions(mockSuggestions);
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, currentContent, toast]);

  // Insert suggestion into content
  const insertSuggestion = useCallback((suggestion: ContentSuggestion) => {
    onContentInsert(suggestion.content);
    toast.success('Content inserted!');
  }, [onContentInsert, toast]);

  // Copy suggestion to clipboard
  const copySuggestion = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [toast]);

  const getSuggestionIcon = (type: ContentSuggestion['type']) => {
    const typeMap = {
      opening: <BookOpen className="h-4 w-4 text-blue-500" />,
      continuation: <ArrowRight className="h-4 w-4 text-green-500" />,
      conclusion: <Target className="h-4 w-4 text-purple-500" />,
      transition: <Zap className="h-4 w-4 text-yellow-500" />,
      detail: <Plus className="h-4 w-4 text-indigo-500" />,
      example: <Lightbulb className="h-4 w-4 text-orange-500" />,
    };
    return typeMap[type];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-600" />
          Smart Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Content Type</label>
              <Dropdown
                options={contentTypes}
                value={selectedType}
                onChange={(type) => setSelectedType(type as ContentSuggestion['type'])}
                placeholder="Select content type"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Context Words</label>
              <Input
                type="number"
                value={contextWords}
                onChange={(e) => setContextWords(parseInt(e.target.value) || 50)}
                min={10}
                max={200}
                placeholder="Number of words for context"
              />
            </div>
          </div>

          <Button
            variant="cosmic"
            onClick={generateSuggestions}
            loading={isGenerating}
            disabled={!currentContent.trim()}
            leftIcon={<Sparkles className="h-4 w-4" />}
            className="w-full"
          >
            Generate Suggestions
          </Button>
        </div>

        {/* Custom Prompt */}
        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">Custom Prompt</label>
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to write about..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={generateWithPrompt}
              loading={isGenerating}
              disabled={!prompt.trim()}
            >
              Generate
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating content...</p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !isGenerating && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Content Suggestions
            </h4>
            
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-l-4 border-l-indigo-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="font-medium text-sm capitalize">{suggestion.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}% match
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copySuggestion(suggestion.content)}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="cosmic"
                        onClick={() => insertSuggestion(suggestion)}
                      >
                        Insert
                      </Button>
                    </div>
                  </div>
                  
                  <h5 className="font-medium mb-2">{suggestion.title}</h5>
                  <p className="text-sm leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded">
                    {suggestion.content}
                  </p>
                  
                  {suggestion.context && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Context: {suggestion.context}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {suggestions.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">Ready to help</h3>
            <p className="text-sm text-muted-foreground">
              Generate content suggestions based on your writing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock content generation functions (in a real app, these would call an AI service)
function generateMockSuggestions(
  type: ContentSuggestion['type'], 
  context: string, 
  projectType: string
): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  
  switch (type) {
    case 'opening':
      suggestions.push(
        {
          id: 'open-1',
          type: 'opening',
          title: 'Engaging Hook',
          content: 'What if everything you thought you knew about this topic was wrong? Let me share a different perspective that might change how you see things.',
          context: 'Based on your writing style',
          confidence: 0.85
        },
        {
          id: 'open-2',
          type: 'opening',
          title: 'Question Opener',
          content: 'Have you ever wondered why this particular issue keeps coming up in discussions? There\'s more to it than meets the eye.',
          context: 'Matches conversational tone',
          confidence: 0.78
        }
      );
      break;
      
    case 'continuation':
      suggestions.push(
        {
          id: 'cont-1',
          type: 'continuation',
          title: 'Natural Flow',
          content: 'Building on this idea, we can see how the implications extend far beyond what we initially considered. The ripple effects touch multiple areas of our understanding.',
          context: `Following: "${context.slice(-50)}..."`,
          confidence: 0.82
        },
        {
          id: 'cont-2',
          type: 'continuation',
          title: 'Deeper Exploration',
          content: 'This point deserves deeper examination. When we look beneath the surface, we discover layers of complexity that reveal the true nature of the situation.',
          context: `Continuing from: "${context.slice(-50)}..."`,
          confidence: 0.75
        }
      );
      break;
      
    case 'example':
      suggestions.push(
        {
          id: 'ex-1',
          type: 'example',
          title: 'Concrete Example',
          content: 'For instance, consider how this plays out in everyday situations. Imagine a scenario where these principles are put to the test - the results can be quite revealing.',
          context: 'Supporting your main points',
          confidence: 0.80
        }
      );
      break;
      
    default:
      suggestions.push(
        {
          id: 'gen-1',
          type: type,
          title: 'Thoughtful Addition',
          content: 'This aspect of the topic opens up new avenues for exploration. By considering different angles, we can develop a more comprehensive understanding.',
          context: 'General content suggestion',
          confidence: 0.70
        }
      );
  }
  
  return suggestions;
}

function generatePromptBasedSuggestions(prompt: string, currentContent: string): ContentSuggestion[] {
  return [
    {
      id: 'prompt-1',
      type: 'continuation',
      title: `Content for: "${prompt}"`,
      content: `Based on your prompt about "${prompt}", here's a thoughtful exploration of the topic. This approach considers multiple perspectives and provides actionable insights that can enhance your understanding and application of these concepts.`,
      context: `Generated from prompt: ${prompt}`,
      confidence: 0.88
    },
    {
      id: 'prompt-2',
      type: 'detail',
      title: 'Detailed Expansion',
      content: `Let me elaborate on the key aspects of ${prompt}. The interconnected nature of these elements creates a framework that can be applied in various contexts, each offering unique benefits and considerations.`,
      context: `Expanded from: ${prompt}`,
      confidence: 0.83
    }
  ];
}