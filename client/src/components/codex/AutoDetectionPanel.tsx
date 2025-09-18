/**
 * Auto-Detection Panel - Real-time entity reference highlighting and suggestions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, Check, X, Eye, EyeOff, Settings, AlertCircle, Lightbulb, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { autoDetectionService, type DetectedReference, type DetectedSuggestion, type DetectionConfig } from '@/services/autoDetectionService';
import { codexService, type CodexEntity, type MentionSuggestion } from '@/services/codexService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface AutoDetectionPanelProps {
  text: string;
  sourceType: string;
  sourceId: string;
  projectId?: string;
  onReferenceClick?: (reference: DetectedReference) => void;
  onSuggestionAccept?: (suggestion: DetectedSuggestion) => void;
  onSuggestionReject?: (suggestion: DetectedSuggestion) => void;
  onTextHighlight?: (ranges: Array<{ start: number; end: number; entityId?: string; type: 'reference' | 'suggestion' }>) => void;
  enabled?: boolean;
  realTime?: boolean;
  className?: string;
}

interface AnalysisState {
  references: DetectedReference[];
  suggestions: DetectedSuggestion[];
  isAnalyzing: boolean;
  lastAnalyzed: Date | null;
  error: string | null;
  statistics: {
    totalWords: number;
    entitiesFound: number;
    suggestionsGenerated: number;
    averageConfidence: number;
  };
}

export default function AutoDetectionPanel({
  text,
  sourceType,
  sourceId,
  projectId,
  onReferenceClick,
  onSuggestionAccept,
  onSuggestionReject,
  onTextHighlight,
  enabled = true,
  realTime = false,
  className = ''
}: AutoDetectionPanelProps) {
  const [state, setState] = useState<AnalysisState>({
    references: [],
    suggestions: [],
    isAnalyzing: false,
    lastAnalyzed: null,
    error: null,
    statistics: {
      totalWords: 0,
      entitiesFound: 0,
      suggestionsGenerated: 0,
      averageConfidence: 0
    }
  });

  const [config, setConfig] = useState<DetectionConfig>(autoDetectionService.getConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [pendingSuggestions, setPendingSuggestions] = useState<MentionSuggestion[]>([]);

  // Debounced analysis for real-time mode
  const analyzeText = useCallback(
    debounce(async (textToAnalyze: string) => {
      if (!enabled || !textToAnalyze.trim()) return;

      setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

      try {
        const result = await autoDetectionService.analyzeText(
          textToAnalyze,
          sourceType,
          sourceId,
          projectId
        );

        setState(prev => ({
          ...prev,
          references: result.references,
          suggestions: result.suggestions,
          isAnalyzing: false,
          lastAnalyzed: new Date(),
          statistics: {
            totalWords: result.statistics.totalWords,
            entitiesFound: result.references.length,
            suggestionsGenerated: result.suggestions.length,
            averageConfidence: result.statistics.averageConfidence
          }
        }));

        // Update text highlighting
        if (onTextHighlight) {
          const ranges = [
            ...result.references.map(ref => ({
              start: ref.startPos,
              end: ref.endPos,
              entityId: ref.entityId,
              type: 'reference' as const
            })),
            ...result.suggestions.map(sug => ({
              start: sug.startPos,
              end: sug.endPos,
              type: 'suggestion' as const
            }))
          ];
          onTextHighlight(ranges);
        }

      } catch (error) {
        console.error('Auto-detection failed:', error);
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : 'Analysis failed'
        }));
      }
    }, 1000),
    [enabled, sourceType, sourceId, projectId, onTextHighlight]
  );

  // Load pending suggestions
  useEffect(() => {
    if (projectId) {
      loadPendingSuggestions();
    }
  }, [projectId]);

  // Auto-analyze when text changes (if real-time enabled)
  useEffect(() => {
    if (realTime && text) {
      analyzeText(text);
    }
  }, [text, realTime, analyzeText]);

  // Update config when changed
  useEffect(() => {
    autoDetectionService.updateConfig(config);
  }, [config]);

  const loadPendingSuggestions = async () => {
    try {
      const suggestions = await codexService.getMentionSuggestions(projectId, 'pending');
      setPendingSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load pending suggestions:', error);
    }
  };

  const handleManualAnalyze = () => {
    if (text) {
      analyzeText(text);
    }
  };

  const handleReferenceConfirm = async (reference: DetectedReference) => {
    try {
      await autoDetectionService.saveDetectedReferences([reference], sourceType, sourceId);
      setState(prev => ({
        ...prev,
        references: prev.references.map(ref =>
          ref === reference ? { ...ref, isConfirmed: true } : ref
        )
      }));
    } catch (error) {
      console.error('Failed to confirm reference:', error);
    }
  };

  const handleReferenceIgnore = (reference: DetectedReference) => {
    setState(prev => ({
      ...prev,
      references: prev.references.filter(ref => ref !== reference)
    }));
  };

  const handleSuggestionAccept = async (suggestion: DetectedSuggestion) => {
    try {
      onSuggestionAccept?.(suggestion);
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(sug => sug !== suggestion)
      }));
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    }
  };

  const handleSuggestionReject = async (suggestion: DetectedSuggestion) => {
    try {
      onSuggestionReject?.(suggestion);
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(sug => sug !== suggestion)
      }));
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    }
  };

  const handlePendingSuggestionAction = async (suggestion: MentionSuggestion, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await codexService.acceptMentionSuggestion(suggestion.id, {
          name: suggestion.text,
          type: suggestion.suggestedType || 'character',
          description: `Auto-generated from: ${suggestion.context}`,
          projectId
        });
      } else {
        await codexService.rejectMentionSuggestion(suggestion.id);
      }
      
      await loadPendingSuggestions();
    } catch (error) {
      console.error(`Failed to ${action} suggestion:`, error);
    }
  };

  // Memoized components
  const referenceItems = useMemo(() =>
    state.references.map((reference, index) => (
      <ReferenceItem
        key={`${reference.entityId}-${reference.startPos}`}
        reference={reference}
        onClick={() => onReferenceClick?.(reference)}
        onConfirm={() => handleReferenceConfirm(reference)}
        onIgnore={() => handleReferenceIgnore(reference)}
      />
    )),
    [state.references, onReferenceClick]
  );

  const suggestionItems = useMemo(() =>
    state.suggestions.map((suggestion, index) => (
      <SuggestionItem
        key={`${suggestion.text}-${suggestion.startPos}`}
        suggestion={suggestion}
        onAccept={() => handleSuggestionAccept(suggestion)}
        onReject={() => handleSuggestionReject(suggestion)}
      />
    )),
    [state.suggestions]
  );

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">Auto-Detection</h3>
          {state.isAnalyzing && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHighlightEnabled(!highlightEnabled)}
            title={highlightEnabled ? 'Hide highlights' : 'Show highlights'}
          >
            {highlightEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>

          {!realTime && (
            <Button
              size="sm"
              onClick={handleManualAnalyze}
              disabled={state.isAnalyzing || !text.trim()}
            >
              <Search className="w-4 h-4 mr-1" />
              Analyze
            </Button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Confidence ({config.minimumConfidence})
                  </label>
                  <Slider
                    value={[config.minimumConfidence]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, minimumConfidence: value }))}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Context Window ({config.contextWindow} chars)
                  </label>
                  <Slider
                    value={[config.contextWindow]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, contextWindow: value }))}
                    min={20}
                    max={200}
                    step={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Fuzzy Matching</label>
                  <Switch
                    checked={config.fuzzyMatching}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, fuzzyMatching: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Exclude Common Words</label>
                  <Switch
                    checked={config.excludeCommonWords}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, excludeCommonWords: checked }))}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      {state.error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center text-red-700">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{state.error}</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      {state.lastAnalyzed && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Words:</span>
              <span className="ml-1 font-medium">{state.statistics.totalWords}</span>
            </div>
            <div>
              <span className="text-gray-500">Entities:</span>
              <span className="ml-1 font-medium">{state.statistics.entitiesFound}</span>
            </div>
            <div>
              <span className="text-gray-500">Suggestions:</span>
              <span className="ml-1 font-medium">{state.statistics.suggestionsGenerated}</span>
            </div>
            <div>
              <span className="text-gray-500">Confidence:</span>
              <span className="ml-1 font-medium">{(state.statistics.averageConfidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="references" className="h-full">
          <TabsList className="w-full justify-start p-4 pb-0">
            <TabsTrigger value="references">
              References ({state.references.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions ({state.suggestions.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingSuggestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="references" className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {referenceItems.length > 0 ? (
              referenceItems
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2" />
                <p>No entity references detected</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {suggestionItems.length > 0 ? (
              suggestionItems
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-8 h-8 mx-auto mb-2" />
                <p>No new entity suggestions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {pendingSuggestions.length > 0 ? (
              pendingSuggestions.map(suggestion => (
                <PendingSuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={() => handlePendingSuggestionAction(suggestion, 'accept')}
                  onReject={() => handlePendingSuggestionAction(suggestion, 'reject')}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Check className="w-8 h-8 mx-auto mb-2" />
                <p>No pending suggestions</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Reference item component
function ReferenceItem({
  reference,
  onClick,
  onConfirm,
  onIgnore
}: {
  reference: DetectedReference;
  onClick?: () => void;
  onConfirm?: () => void;
  onIgnore?: () => void;
}) {
  return (
    <Card className="p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{reference.entity.name}</span>
            <Badge variant="outline" className="text-xs">
              {reference.entity.type}
            </Badge>
            <Badge
              variant={reference.confidence > 0.8 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {(reference.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            "{reference.text}" in context
          </p>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onConfirm}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onIgnore}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Suggestion item component
function SuggestionItem({
  suggestion,
  onAccept,
  onReject
}: {
  suggestion: DetectedSuggestion;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">"{suggestion.text}"</span>
            <Badge variant="outline" className="text-xs">
              {suggestion.suggestedType}
            </Badge>
            <Badge
              variant={suggestion.confidence > 0.7 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {(suggestion.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
          {suggestion.frequency > 1 && (
            <p className="text-xs text-gray-500">Appears {suggestion.frequency} times</p>
          )}
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAccept}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Pending suggestion item component
function PendingSuggestionItem({
  suggestion,
  onAccept,
  onReject
}: {
  suggestion: MentionSuggestion;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">"{suggestion.text}"</span>
            {suggestion.suggestedType && (
              <Badge variant="outline" className="text-xs">
                {suggestion.suggestedType}
              </Badge>
            )}
            <Badge
              variant={suggestion.confidence > 0.7 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {(suggestion.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate">{suggestion.context}</p>
          <p className="text-xs text-gray-500">Found {suggestion.frequency} times</p>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAccept}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}