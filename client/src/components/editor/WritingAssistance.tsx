/**
 * Writing Assistance Component
 * Provides AI-powered writing suggestions, grammar checking, and productivity features
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Target, 
  Clock,
  TrendingUp,
  Zap,
  Brain,
  MessageSquare,
  Sparkles,
  Search,
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
  Volume2,
  VolumeX,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import type { Editor } from '@tiptap/core';

interface WritingAssistanceProps {
  editor: Editor | null;
  content: string;
  onContentChange?: (content: string) => void;
  onSuggestionApply?: (suggestion: WritingSuggestion) => void;
  isVisible?: boolean;
  onToggle?: () => void;
  className?: string;
}

interface WritingSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'clarity' | 'engagement' | 'structure';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
  position?: { from: number; to: number };
  replacement?: string;
  category: string;
}

interface WritingGoal {
  id: string;
  type: 'word_count' | 'time_based' | 'readability' | 'engagement';
  target: number;
  current: number;
  unit: string;
  description: string;
}

interface VocabularyEnhancement {
  word: string;
  alternatives: string[];
  context: string;
  difficulty: 'easy' | 'medium' | 'advanced';
}

export function WritingAssistance({
  editor,
  content,
  onContentChange,
  onSuggestionApply,
  isVisible = true,
  onToggle,
  className
}: WritingAssistanceProps) {
  const toast = useToast();
  
  // State
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [writingGoals, setWritingGoals] = useState<WritingGoal[]>([]);
  const [vocabularyEnhancements, setVocabularyEnhancements] = useState<VocabularyEnhancement[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [readAloudEnabled, setReadAloudEnabled] = useState(false);

  // Writing statistics
  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Calculate readability score (simplified Flesch Reading Ease)
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgSyllablesPerWord = words.reduce((acc, word) => {
      return acc + estimateSyllables(word);
    }, 0) / Math.max(words.length, 1);
    
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return {
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      characters: content.length,
      readingTime: Math.ceil(words.length / 200), // Average reading speed
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      avgWordsPerSentence,
      avgSyllablesPerWord,
    };
  }, [content]);

  // Analyze content for suggestions
  const analyzeContent = useCallback(async () => {
    if (!content.trim() || !editor) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis - in production, this would call an AI service
      const newSuggestions: WritingSuggestion[] = [];
      
      // Grammar suggestions
      const grammarIssues = findGrammarIssues(content);
      newSuggestions.push(...grammarIssues);
      
      // Style suggestions
      const styleIssues = findStyleIssues(content);
      newSuggestions.push(...styleIssues);
      
      // Clarity suggestions
      const clarityIssues = findClarityIssues(content);
      newSuggestions.push(...clarityIssues);
      
      // Engagement suggestions
      const engagementIssues = findEngagementIssues(content);
      newSuggestions.push(...engagementIssues);
      
      setSuggestions(newSuggestions);
      
      // Generate vocabulary enhancements
      const vocabSuggestions = generateVocabularyEnhancements(content);
      setVocabularyEnhancements(vocabSuggestions);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, editor, toast]);

  // Auto-analyze content when it changes
  useEffect(() => {
    if (autoAnalyze && content.trim()) {
      const timer = setTimeout(analyzeContent, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, autoAnalyze, analyzeContent]);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: WritingSuggestion) => {
    if (!editor || !suggestion.replacement) return;
    
    if (suggestion.position) {
      const { from, to } = suggestion.position;
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent(suggestion.replacement)
        .run();
      
      // Remove applied suggestion
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      
      onSuggestionApply?.(suggestion);
      toast.success('Suggestion applied');
    }
  }, [editor, onSuggestionApply, toast]);

  // Dismiss suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  // Read content aloud
  const readAloud = useCallback(() => {
    if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      if (readAloudEnabled) {
        window.speechSynthesis.cancel();
        setReadAloudEnabled(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(content.replace(/<[^>]*>/g, ''));
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onend = () => setReadAloudEnabled(false);
        utterance.onerror = () => setReadAloudEnabled(false);
        
        window.speechSynthesis.speak(utterance);
        setReadAloudEnabled(true);
      }
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  }, [content, readAloudEnabled, toast]);

  // Helper functions for content analysis
  function estimateSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    const vowels = 'aeiouy';
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    return Math.max(count, 1);
  }

  function findGrammarIssues(text: string): WritingSuggestion[] {
    const issues: WritingSuggestion[] = [];
    
    // Simple grammar checks
    if (text.includes(' i ')) {
      issues.push({
        id: 'grammar-1',
        type: 'grammar',
        severity: 'high',
        message: 'Capitalize "I" when used as a pronoun',
        suggestion: 'Replace lowercase "i" with uppercase "I"',
        category: 'Capitalization',
        replacement: text.replace(/ i /g, ' I '),
      });
    }
    
    // Double spaces
    if (text.includes('  ')) {
      issues.push({
        id: 'grammar-2',
        type: 'grammar',
        severity: 'low',
        message: 'Remove extra spaces',
        suggestion: 'Use single spaces between words',
        category: 'Spacing',
        replacement: text.replace(/  +/g, ' '),
      });
    }
    
    return issues;
  }

  function findStyleIssues(text: string): WritingSuggestion[] {
    const issues: WritingSuggestion[] = [];
    
    // Passive voice detection (simplified)
    const passivePatterns = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
    const passiveMatches = text.match(passivePatterns);
    
    if (passiveMatches && passiveMatches.length > 2) {
      issues.push({
        id: 'style-1',
        type: 'style',
        severity: 'medium',
        message: 'Consider using active voice',
        suggestion: 'Active voice makes your writing more engaging and direct',
        category: 'Voice',
      });
    }
    
    // Repetitive words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      if (word.length > 4) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    Object.entries(wordCount).forEach(([word, count]) => {
      if (count > 3) {
        issues.push({
          id: `style-repetition-${word}`,
          type: 'style',
          severity: 'low',
          message: `The word "${word}" is used ${count} times`,
          suggestion: 'Consider using synonyms to avoid repetition',
          category: 'Word Choice',
        });
      }
    });
    
    return issues;
  }

  function findClarityIssues(text: string): WritingSuggestion[] {
    const issues: WritingSuggestion[] = [];
    
    // Long sentences
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 25) {
        issues.push({
          id: `clarity-long-sentence-${index}`,
          type: 'clarity',
          severity: 'medium',
          message: `Sentence ${index + 1} is very long (${words.length} words)`,
          suggestion: 'Consider breaking this into shorter sentences for better readability',
          category: 'Sentence Length',
        });
      }
    });
    
    return issues;
  }

  function findEngagementIssues(text: string): WritingSuggestion[] {
    const issues: WritingSuggestion[] = [];
    
    // Lack of variety in sentence starters
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const starters = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
    const starterCount: { [key: string]: number } = {};
    
    starters.forEach(starter => {
      starterCount[starter] = (starterCount[starter] || 0) + 1;
    });
    
    const repetitiveStarters = Object.entries(starterCount).filter(([_, count]) => count > 2);
    
    if (repetitiveStarters.length > 0) {
      issues.push({
        id: 'engagement-1',
        type: 'engagement',
        severity: 'low',
        message: 'Vary your sentence starters',
        suggestion: 'Using different sentence beginnings creates more engaging rhythm',
        category: 'Sentence Variety',
      });
    }
    
    return issues;
  }

  function generateVocabularyEnhancements(text: string): VocabularyEnhancement[] {
    const commonWords = ['good', 'bad', 'nice', 'big', 'small', 'very', 'really'];
    const enhancements: VocabularyEnhancement[] = [];
    
    commonWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        const alternatives = getWordAlternatives(word);
        if (alternatives.length > 0) {
          enhancements.push({
            word,
            alternatives,
            context: 'Consider using more specific alternatives',
            difficulty: 'easy',
          });
        }
      }
    });
    
    return enhancements.slice(0, 5); // Limit to 5 suggestions
  }

  function getWordAlternatives(word: string): string[] {
    const alternatives: { [key: string]: string[] } = {
      good: ['excellent', 'outstanding', 'remarkable', 'impressive', 'superb'],
      bad: ['poor', 'inadequate', 'disappointing', 'substandard', 'inferior'],
      nice: ['pleasant', 'delightful', 'charming', 'appealing', 'enjoyable'],
      big: ['large', 'enormous', 'massive', 'substantial', 'significant'],
      small: ['tiny', 'compact', 'minimal', 'modest', 'diminutive'],
      very: ['extremely', 'remarkably', 'exceptionally', 'particularly', 'notably'],
      really: ['genuinely', 'truly', 'absolutely', 'certainly', 'definitely'],
    };
    
    return alternatives[word] || [];
  }

  const getSeverityColor = (severity: WritingSuggestion['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950';
      case 'low': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950';
      default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950';
    }
  };

  const getTypeIcon = (type: WritingSuggestion['type']) => {
    switch (type) {
      case 'grammar': return CheckCircle;
      case 'style': return Sparkles;
      case 'clarity': return Eye;
      case 'engagement': return TrendingUp;
      case 'structure': return BookOpen;
      default: return Lightbulb;
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'suggestions',
      label: 'Suggestions',
      icon: <Lightbulb className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={analyzeContent}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
              <Badge variant="outline">
                {suggestions.length} suggestions
              </Badge>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAutoAnalyze(!autoAnalyze)}
              className={cn(autoAnalyze && "bg-cosmic-100 text-cosmic-700")}
            >
              Auto-analyze
            </Button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                <p>No suggestions found</p>
                <p className="text-sm">Your writing looks great!</p>
              </div>
            ) : (
              suggestions.map((suggestion) => {
                const Icon = getTypeIcon(suggestion.type);
                return (
                  <Card key={suggestion.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getSeverityColor(suggestion.severity))}
                          >
                            {suggestion.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {suggestion.category}
                          </span>
                        </div>
                        <p className="font-medium text-sm mb-1">{suggestion.message}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {suggestion.suggestion}
                        </p>
                        <div className="flex items-center gap-2">
                          {suggestion.replacement && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applySuggestion(suggestion)}
                              className="h-6 px-2 text-xs"
                            >
                              Apply
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissSuggestion(suggestion.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'vocabulary',
      label: 'Vocabulary',
      icon: <Brain className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Word Enhancements</h3>
            <Badge variant="outline">
              {vocabularyEnhancements.length} suggestions
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {vocabularyEnhancements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-2" />
                <p>No vocabulary suggestions</p>
                <p className="text-sm">Try writing more to get suggestions</p>
              </div>
            ) : (
              vocabularyEnhancements.map((enhancement, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">"{enhancement.word}"</span>
                      <Badge variant="outline" className="text-xs">
                        {enhancement.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {enhancement.context}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {enhancement.alternatives.map((alt, altIndex) => (
                        <Button
                          key={altIndex}
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            // Replace word in content
                            const newContent = content.replace(
                              new RegExp(`\\b${enhancement.word}\\b`, 'gi'),
                              alt
                            );
                            onContentChange?.(newContent);
                            toast.success(`Replaced "${enhancement.word}" with "${alt}"`);
                          }}
                        >
                          {alt}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'readability',
      label: 'Readability',
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-cosmic-600">
                  {Math.round(stats.readabilityScore)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Readability Score
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.readingTime}m
                </div>
                <div className="text-xs text-muted-foreground">
                  Reading Time
                </div>
              </div>
            </Card>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Average words per sentence:</span>
              <span className="font-medium">{Math.round(stats.avgWordsPerSentence)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Average syllables per word:</span>
              <span className="font-medium">{stats.avgSyllablesPerWord.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Sentences:</span>
              <span className="font-medium">{stats.sentences}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Paragraphs:</span>
              <span className="font-medium">{stats.paragraphs}</span>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={readAloud}
              className="w-full flex items-center gap-2"
              disabled={!content.trim()}
            >
              {readAloudEnabled ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {readAloudEnabled ? 'Stop Reading' : 'Read Aloud'}
            </Button>
          </div>
        </div>
      ),
    },
  ];

  if (!isVisible) return null;

  return (
    <Card className={cn("writing-assistance fixed right-4 top-20 w-80 z-40", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            Writing Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            {onToggle && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs tabs={tabs} variant="underline" />
        </CardContent>
      )}
    </Card>
  );
}

export default WritingAssistance;