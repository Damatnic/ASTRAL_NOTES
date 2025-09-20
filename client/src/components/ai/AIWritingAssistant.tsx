/**
 * AI Writing Assistant Component
 * Provides intelligent writing suggestions and improvements
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lightbulb, 
  Wand2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Sparkles,
  AlertCircle,
  TrendingUp,
  Eye,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { 
  aiWritingService, 
  type WritingSuggestion, 
  type WritingAnalysis,
  type AIPromptTemplate,
  type ComprehensiveAnalysisResult,
  type ComprehensiveRecommendation
} from '@/services/aiWritingService';
import { type GenreContext } from '@/services/ai/genreSpecificAssistants';
import { type WritingDNAProfile } from '@/services/ai/personalizedStyleAnalysis';

// Import Phase 3A AI Writing Coach
import { AIWritingCoach } from './AIWritingCoach';

interface AIWritingAssistantProps {
  content: string;
  onContentChange: (content: string) => void;
  onSuggestionApply?: (suggestion: WritingSuggestion) => void;
  isVisible: boolean;
  onToggle: () => void;
  
  // Phase 2A Context
  genre?: GenreContext['genre'];
  authorId?: string;
  characters?: any[];
  worldElements?: any[];
  plotThreads?: any[];
  manuscript?: any;
  writingDNAProfile?: WritingDNAProfile;
}

export function AIWritingAssistant({ 
  content, 
  onContentChange, 
  onSuggestionApply,
  isVisible,
  onToggle,
  
  // Phase 2A props
  genre,
  authorId,
  characters,
  worldElements,
  plotThreads,
  manuscript,
  writingDNAProfile
}: AIWritingAssistantProps) {
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<WritingSuggestion | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<AIPromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AIPromptTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  // Phase 2A State
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<ComprehensiveAnalysisResult | null>(null);
  const [isPhase2AEnabled, setIsPhase2AEnabled] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<GenreContext['genre'] | undefined>(genre);
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'basic' | 'comprehensive'>('basic');
  
  // Phase 3A: AI Writing Coach integration
  const [showAICoach, setShowAICoach] = useState(false);
  const [phase3AEnabled, setPhase3AEnabled] = useState(true); // Enable Phase 3A by default

  // Analyze content when it changes
  useEffect(() => {
    if (content.trim().length > 10) {
      analyzeContent();
    }
  }, [content]);

  // Load prompt templates and check Phase 2A availability
  useEffect(() => {
    setPromptTemplates(aiWritingService.getPromptTemplates());
    setIsPhase2AEnabled(aiWritingService.isPhase2AEnabled());
  }, []);

  // Update comprehensive analysis when context changes
  useEffect(() => {
    if (isPhase2AEnabled && activeAnalysisMode === 'comprehensive' && content.trim().length > 50) {
      performComprehensiveAnalysis();
    }
  }, [content, selectedGenre, authorId, characters, worldElements, plotThreads, manuscript, writingDNAProfile, isPhase2AEnabled, activeAnalysisMode]);

  const analyzeContent = useCallback(async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await aiWritingService.analyzeText(content);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [content]);

  const applySuggestion = useCallback((suggestion: WritingSuggestion) => {
    const beforeText = content.substring(0, suggestion.position.start);
    const afterText = content.substring(suggestion.position.end);
    const newContent = beforeText + suggestion.suggestedText + afterText;
    
    onContentChange(newContent);
    onSuggestionApply?.(suggestion);
    
    // Remove applied suggestion from analysis
    if (analysis) {
      const updatedSuggestions = analysis.suggestions.filter(s => s.id !== suggestion.id);
      setAnalysis({ ...analysis, suggestions: updatedSuggestions });
    }
  }, [content, onContentChange, onSuggestionApply, analysis]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    if (analysis) {
      const updatedSuggestions = analysis.suggestions.filter(s => s.id !== suggestionId);
      setAnalysis({ ...analysis, suggestions: updatedSuggestions });
    }
  }, [analysis]);

  // Phase 2A: Comprehensive Analysis
  const performComprehensiveAnalysis = useCallback(async () => {
    if (!content.trim() || !isPhase2AEnabled) return;
    
    setIsAnalyzing(true);
    try {
      const result = await aiWritingService.performComprehensiveAnalysis(content, {
        genre: selectedGenre,
        authorId,
        characters,
        worldElements,
        plotThreads,
        manuscript,
        writingDNAProfile
      });
      setComprehensiveAnalysis(result);
    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, selectedGenre, authorId, characters, worldElements, plotThreads, manuscript, writingDNAProfile, isPhase2AEnabled]);

  const toggleAnalysisMode = useCallback(() => {
    const newMode = activeAnalysisMode === 'basic' ? 'comprehensive' : 'basic';
    setActiveAnalysisMode(newMode);
    
    if (newMode === 'comprehensive' && isPhase2AEnabled) {
      performComprehensiveAnalysis();
    }
  }, [activeAnalysisMode, isPhase2AEnabled, performComprehensiveAnalysis]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuggestionIcon = (type: WritingSuggestion['type']) => {
    switch (type) {
      case 'grammar': return <CheckCircle className="h-4 w-4 text-red-500" />;
      case 'style': return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'clarity': return <Eye className="h-4 w-4 text-green-500" />;
      case 'tone': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'expansion': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'structure': return <AlertCircle className="h-4 w-4 text-indigo-500" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'suggestions',
      label: 'Suggestions',
      icon: <Wand2 className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          {isAnalyzing && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-muted-foreground">Analyzing...</span>
            </div>
          )}
          
          {analysis && analysis.suggestions.length > 0 ? (
            <div className="space-y-3">
              {analysis.suggestions.slice(0, 10).map((suggestion) => (
                <Card key={suggestion.id} className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                            <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          <div className="space-y-2">
                            <div className="bg-red-50 dark:bg-red-950 p-2 rounded text-sm">
                              <span className="font-medium text-red-800 dark:text-red-200">Original: </span>
                              <span className="text-red-700 dark:text-red-300">{suggestion.originalText}</span>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-sm">
                              <span className="font-medium text-green-800 dark:text-green-200">Suggested: </span>
                              <span className="text-green-700 dark:text-green-300">{suggestion.suggestedText}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {suggestion.reasoning}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="cosmic"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissSuggestion(suggestion.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analysis && !isAnalyzing ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium mb-1">Great writing!</h3>
              <p className="text-sm text-muted-foreground">No suggestions at this time.</p>
            </div>
          ) : !isAnalyzing && (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">Start writing</h3>
              <p className="text-sm text-muted-foreground">Add some content to get AI suggestions.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {analysis ? (
            <>
              {/* Writing Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Readability</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {analysis.readabilityScore}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Flesch Score
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Avg Sentence</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {analysis.avgSentenceLength}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Words
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tone Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tone Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analysis.toneAnalysis).map(([tone, score]) => (
                      <div key={tone} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{tone}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Issues */}
              {analysis.topIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Areas to Focus On</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.topIssues.map((issue) => (
                        <Badge key={issue} variant="outline" className="capitalize">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">No analysis yet</h3>
              <p className="text-sm text-muted-foreground">Start writing to see detailed analysis.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'prompts',
      label: 'Prompts',
      icon: <Sparkles className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {promptTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedTemplate && (
            <Card className="border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="text-sm">{selectedTemplate.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded">
                    {selectedTemplate.prompt}
                  </p>
                  {selectedTemplate.variables.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Fill in variables:</span>
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable}>
                          <label className="text-xs text-muted-foreground capitalize">
                            {variable}:
                          </label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                            value={templateVariables[variable] || ''}
                            onChange={(e) => setTemplateVariables(prev => ({
                              ...prev,
                              [variable]: e.target.value
                            }))}
                            placeholder={`Enter ${variable}...`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="cosmic"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      try {
                        const processedPrompt = aiWritingService.processPrompt(
                          selectedTemplate.id, 
                          templateVariables
                        );
                        // In a real implementation, this would call an AI service
                        console.log('Generated prompt:', processedPrompt);
                      } catch (error) {
                        console.error('Failed to process prompt:', error);
                      }
                    }}
                  >
                    Use This Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
  ];

  // Add Phase 3A AI Coach tab if enabled
  if (phase3AEnabled) {
    tabs.push({
      id: 'ai-coach',
      label: 'AI Coach',
      icon: <Sparkles className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2">AI Writing Coach</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your personal AI mentor with expert guidance, skill assessment, and adaptive learning paths.
            </p>
            <Button
              variant="cosmic"
              onClick={() => setShowAICoach(true)}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Launch AI Coach
            </Button>
          </div>
          
          <div className="space-y-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-1">📚 Skill Assessment</h4>
                <p className="text-xs text-muted-foreground">
                  50+ writing metrics with personalized feedback
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-1">🎯 Learning Paths</h4>
                <p className="text-xs text-muted-foreground">
                  Adaptive curriculum tailored to your goals
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-1">👨‍🏫 Expert Mentors</h4>
                <p className="text-xs text-muted-foreground">
                  Learn from Hemingway, Austen, Tolkien & more
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-1">🔮 Predictive Assistance</h4>
                <p className="text-xs text-muted-foreground">
                  AI that anticipates your story needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    });
  }

  // Add Phase 2A tabs if enabled
  if (isPhase2AEnabled) {
    tabs.push(
      {
        id: 'comprehensive',
        label: 'Comprehensive',
        icon: <Sparkles className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">AI-Powered Analysis</span>
              </div>
              <Button
                size="sm"
                variant={activeAnalysisMode === 'comprehensive' ? 'cosmic' : 'outline'}
                onClick={toggleAnalysisMode}
              >
                {activeAnalysisMode === 'comprehensive' ? 'Comprehensive' : 'Switch to Comprehensive'}
              </Button>
            </div>

            {selectedGenre && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="outline">{selectedGenre}</Badge>
                    Genre Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Specialized analysis for {selectedGenre} writing conventions and reader expectations.
                  </p>
                </CardContent>
              </Card>
            )}

            {comprehensiveAnalysis ? (
              <div className="space-y-4">
                {/* Comprehensive Recommendations */}
                {comprehensiveAnalysis.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Priority Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {comprehensiveAnalysis.recommendations.slice(0, 5).map((rec, index) => (
                          <div key={index} className="border-l-4 border-l-purple-500 pl-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {rec.priority}
                              </Badge>
                              <span className="text-sm font-medium">{rec.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                            <div className="space-y-1">
                              {rec.suggestions.slice(0, 3).map((suggestion, idx) => (
                                <div key={idx} className="text-xs bg-purple-50 dark:bg-purple-950 p-2 rounded">
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Voice Consistency */}
                {comprehensiveAnalysis.voiceConsistency && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Voice Consistency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-2xl font-bold">
                          {Math.round(comprehensiveAnalysis.voiceConsistency.overallConsistency * 100)}%
                        </div>
                        <span className="text-sm text-muted-foreground">Overall Consistency</span>
                      </div>
                      {comprehensiveAnalysis.voiceConsistency.characterVoices.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-medium">Character Voices:</span>
                          {comprehensiveAnalysis.voiceConsistency.characterVoices.map((char, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span>{char.characterName}</span>
                              <Badge variant="outline">
                                {Math.round(char.consistencyScore * 100)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Consistency Issues */}
                {comprehensiveAnalysis.consistencyReport && comprehensiveAnalysis.consistencyReport.issues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Consistency Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {comprehensiveAnalysis.consistencyReport.issues.slice(0, 5).map((issue, idx) => (
                          <div key={idx} className="text-xs border rounded p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={issue.severity === 'critical' ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {issue.type}
                              </Badge>
                              <span className="font-medium">{issue.title}</span>
                            </div>
                            <p className="text-muted-foreground mb-1">{issue.description}</p>
                            <div className="bg-green-50 dark:bg-green-950 p-1 rounded">
                              <span className="font-medium">Fix: </span>
                              {issue.suggestedFix}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-muted-foreground">Performing comprehensive analysis...</span>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                <h3 className="font-medium mb-1">Comprehensive Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get advanced AI insights including genre-specific analysis, voice consistency, and plot development.
                </p>
                <Button
                  variant="cosmic"
                  onClick={() => setActiveAnalysisMode('comprehensive')}
                >
                  Start Comprehensive Analysis
                </Button>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'genre-assistant',
        label: 'Genre',
        icon: <TrendingUp className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium">Genre:</label>
              <select
                value={selectedGenre || ''}
                onChange={(e) => setSelectedGenre(e.target.value as GenreContext['genre'])}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="">Select Genre</option>
                <option value="literary-fiction">Literary Fiction</option>
                <option value="fantasy-scifi">Fantasy/Sci-Fi</option>
                <option value="mystery-thriller">Mystery/Thriller</option>
                <option value="romance">Romance</option>
                <option value="non-fiction">Non-Fiction</option>
                <option value="screenplay">Screenplay</option>
              </select>
            </div>

            {selectedGenre && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Genre-Specific Prompts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aiWritingService.getGenrePrompts(selectedGenre).map((prompt, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-xs">
                        {prompt}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {comprehensiveAnalysis?.genreAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Genre Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Alignment Score:</span>
                      <Badge variant="outline">
                        {Math.round((comprehensiveAnalysis.genreAnalysis.confidence || 0) * 100)}%
                      </Badge>
                    </div>
                    
                    {comprehensiveAnalysis.genreAnalysis.strengths && (
                      <div>
                        <span className="text-xs font-medium text-green-600">Strengths:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comprehensiveAnalysis.genreAnalysis.strengths.map((strength, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {comprehensiveAnalysis.genreAnalysis.suggestions && (
                      <div>
                        <span className="text-xs font-medium">Suggestions:</span>
                        <div className="space-y-1 mt-1">
                          {comprehensiveAnalysis.genreAnalysis.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <div key={idx} className="text-xs p-2 bg-blue-50 dark:bg-blue-950 rounded">
                              {suggestion.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ),
      }
    );
  }

  if (!isVisible) {
    return (
      <Button
        variant="cosmic"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
        onClick={onToggle}
        leftIcon={<Wand2 className="h-4 w-4" />}
      >
        AI Assistant {isPhase2AEnabled && <Sparkles className="h-3 w-3 ml-1" />}
      </Button>
    );
  }

  return (
    <div className="fixed right-4 top-20 bottom-4 w-96 bg-background border border-border rounded-lg shadow-lg z-40 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">AI Writing Assistant</h3>
          {isPhase2AEnabled && (
            <Badge variant="outline" className="text-xs">
              Phase 2A
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Tabs tabs={tabs} variant="cosmic" />
      </div>
      
      {/* Phase 3A: AI Writing Coach Integration */}
      {phase3AEnabled && (
        <AIWritingCoach
          authorId={authorId || 'default-user'}
          currentText={content}
          isVisible={showAICoach}
          onToggle={() => setShowAICoach(!showAICoach)}
          onContentUpdate={onContentChange}
        />
      )}
    </div>
  );
}