import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Award,
  Star,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { 
  advancedAICompanion, 
  type AISuggestion, 
  type WritingGoal, 
  type WritingSession,
  type WritingAnalytics,
  type PersonalizedPrompt
} from '../../services/advancedAICompanion';

interface AdvancedAIPanelProps {
  className?: string;
}

export function AdvancedAIPanel({ className }: AdvancedAIPanelProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'goals' | 'session' | 'analytics' | 'prompts'>('suggestions');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [currentSession, setCurrentSession] = useState<WritingSession | null>(null);
  const [analytics, setAnalytics] = useState<WritingAnalytics | null>(null);
  const [prompts, setPrompts] = useState<PersonalizedPrompt[]>([]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load initial data
    refreshData();

    // Set up event listeners
    const handleSuggestionsGenerated = (newSuggestions: AISuggestion[]) => {
      setSuggestions(prev => [...prev, ...newSuggestions]);
    };

    const handleGoalCreated = (goal: WritingGoal) => {
      setGoals(prev => [...prev, goal]);
    };

    const handleSessionStarted = (session: WritingSession) => {
      setCurrentSession(session);
    };

    const handleSessionEnded = () => {
      setCurrentSession(null);
      refreshAnalytics();
    };

    advancedAICompanion.on('suggestionsGenerated', handleSuggestionsGenerated);
    advancedAICompanion.on('goalCreated', handleGoalCreated);
    advancedAICompanion.on('sessionStarted', handleSessionStarted);
    advancedAICompanion.on('sessionEnded', handleSessionEnded);

    return () => {
      advancedAICompanion.off('suggestionsGenerated', handleSuggestionsGenerated);
      advancedAICompanion.off('goalCreated', handleGoalCreated);
      advancedAICompanion.off('sessionStarted', handleSessionStarted);
      advancedAICompanion.off('sessionEnded', handleSessionEnded);
    };
  }, []);

  const refreshData = () => {
    setSuggestions(advancedAICompanion.getSuggestions());
    setGoals(advancedAICompanion.getWritingGoals());
    setCurrentSession(advancedAICompanion.getCurrentSession());
    setPrompts(advancedAICompanion.getPersonalizedPrompts());
    refreshAnalytics();
  };

  const refreshAnalytics = () => {
    setAnalytics(advancedAICompanion.getWritingAnalytics());
  };

  const handleApplySuggestion = (suggestionId: string) => {
    if (advancedAICompanion.applySuggestion(suggestionId)) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    if (advancedAICompanion.dismissSuggestion(suggestionId)) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }
  };

  const toggleSuggestionExpanded = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const handleStartSession = () => {
    advancedAICompanion.startWritingSession();
  };

  const handleEndSession = () => {
    advancedAICompanion.endWritingSession();
  };

  const handleCreateGoal = () => {
    const wordGoal = advancedAICompanion.createWritingGoal({
      type: 'word-count',
      target: 1000,
      description: 'Daily writing goal',
      priority: 'high'
    });
    setGoals(prev => [...prev, wordGoal]);
  };

  const handleUsePrompt = (promptId: string) => {
    advancedAICompanion.usePrompt(promptId);
  };

  const tabs = [
    { id: 'suggestions', label: 'AI Suggestions', icon: Lightbulb, count: suggestions.length },
    { id: 'goals', label: 'Writing Goals', icon: Target, count: goals.filter(g => !g.isCompleted).length },
    { id: 'session', label: 'Writing Session', icon: currentSession ? PauseCircle : PlayCircle },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare, count: prompts.length }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'plot': return '📖';
      case 'character': return '👤';
      case 'dialogue': return '💬';
      case 'description': return '🖼️';
      case 'pacing': return '⚡';
      case 'style': return '✨';
      case 'structure': return '🏗️';
      default: return '💡';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Writing Companion</h2>
            <p className="text-sm text-gray-600">Intelligent assistance for better writing</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <Badge variant="secondary" className="ml-1">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Suggestions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
              >
                Refresh
              </Button>
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No suggestions available. Start writing to get AI recommendations!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                          <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="w-3 h-3" />
                            {Math.round(suggestion.confidence * 100)}%
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                        
                        <button
                          onClick={() => toggleSuggestionExpanded(suggestion.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {expandedSuggestions.has(suggestion.id) ? (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-3 h-3" />
                              Show details
                            </>
                          )}
                        </button>

                        {expandedSuggestions.has(suggestion.id) && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <div className="mb-2">
                              <strong>Suggestion:</strong>
                              <p className="mt-1">{suggestion.suggestion}</p>
                            </div>
                            <div className="mb-2">
                              <strong>Reasoning:</strong>
                              <p className="mt-1">{suggestion.reasoning}</p>
                            </div>
                            <div>
                              <strong>Implementation:</strong>
                              <p className="mt-1">{suggestion.implementation}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismissSuggestion(suggestion.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Writing Goals</h3>
              <Button
                onClick={handleCreateGoal}
                size="sm"
              >
                Add Goal
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No writing goals set. Create goals to track your progress!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <Card key={goal.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {goal.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Target className="w-5 h-5 text-blue-600" />
                        )}
                        <h4 className="font-medium">{goal.description}</h4>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {goal.current} / {goal.target}
                      </div>
                    </div>
                    
                    <Progress value={goal.progress} className="mb-2" />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(goal.progress)}% complete</span>
                      {goal.deadline && (
                        <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'session' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Writing Session</h3>
              {currentSession ? (
                <Button
                  onClick={handleEndSession}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <PauseCircle className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              ) : (
                <Button
                  onClick={handleStartSession}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              )}
            </div>

            {currentSession ? (
              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.floor((Date.now() - currentSession.startTime.getTime()) / (1000 * 60))} min
                  </div>
                  <p className="text-gray-600">Session duration</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xl font-semibold text-blue-600">
                      {currentSession.wordsWritten}
                    </div>
                    <div className="text-sm text-gray-600">Words written</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xl font-semibold text-green-600">
                      {currentSession.mood}
                    </div>
                    <div className="text-sm text-gray-600">Current mood</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Session Goals</label>
                    <div className="text-sm text-gray-600">
                      {currentSession.goals.length === 0 ? 'No specific goals set' : currentSession.goals.join(', ')}
                    </div>
                  </div>
                  
                  {currentSession.achievements.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Achievements</label>
                      <div className="flex flex-wrap gap-1">
                        {currentSession.achievements.map((achievement, index) => (
                          <Badge key={index} variant="secondary">{achievement}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No active writing session. Start a session to track your progress!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Writing Analytics</h3>

            {analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.totalWords}</div>
                    <div className="text-sm text-gray-600">Total Words</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.totalSessions}</div>
                    <div className="text-sm text-gray-600">Sessions</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.writingStreak}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.goalsCompleted}</div>
                    <div className="text-sm text-gray-600">Goals Done</div>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Strengths
                    </h4>
                    <div className="space-y-2">
                      {analytics.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Improvement Areas
                    </h4>
                    <div className="space-y-2">
                      {analytics.improvementAreas.map((area, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">{area}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Productivity Insights</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Most productive time:</span>
                      <div className="font-medium">{analytics.mostProductiveTime}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg session length:</span>
                      <div className="font-medium">{Math.round(analytics.averageSessionLength)} min</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg words per session:</span>
                      <div className="font-medium">{Math.round(analytics.averageWordsPerSession)}</div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No analytics data available. Start writing to see your progress!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personalized Writing Prompts</h3>

            {prompts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No personalized prompts available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prompts.map((prompt) => (
                  <Card key={prompt.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{prompt.title}</h4>
                          <Badge variant="outline">{prompt.category}</Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="w-3 h-3" />
                            {Math.round(prompt.effectivenessScore * 100)}%
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{prompt.prompt}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Used {prompt.timesUsed} times</span>
                          {prompt.lastUsed && (
                            <span>Last used: {new Date(prompt.lastUsed).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleUsePrompt(prompt.id)}
                        className="ml-4"
                      >
                        Use Prompt
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}