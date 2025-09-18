/**
 * Personalized Writing Environment Component
 * AI-optimized writing workspace that adapts to individual preferences and habits
 * Creates the perfect writing environment for maximum creativity and productivity
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import personalAICoach from '@/services/personalAICoach';
import intelligentContentSuggestions from '@/services/intelligentContentSuggestions';
import storyAssistant from '@/services/storyAssistant';
import {
  Palette,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Brain,
  Lightbulb,
  Coffee,
  Moon,
  Sun,
  Zap,
  Settings,
  Target,
  Timer,
  Music,
  Nature,
  Waves,
  CloudRain,
  Wind,
  Mountain,
  Flame,
  Sparkles,
  Focus,
  PenTool,
  BookOpen,
  BarChart3
} from 'lucide-react';

export interface PersonalizedWritingEnvironmentProps {
  projectId: string;
  sceneId?: string;
  currentContent: string;
  onContentChange?: (content: string) => void;
  onEnvironmentChange?: (environment: WritingEnvironment) => void;
  className?: string;
}

interface WritingEnvironment {
  id: string;
  name: string;
  theme: {
    background: string;
    foreground: string;
    accent: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    textWidth: number;
  };
  ambiance: {
    soundscape: string | null;
    volume: number;
    visualEffects: boolean;
    backgroundAnimation: boolean;
  };
  productivity: {
    focusMode: boolean;
    wordGoal: number;
    timeGoal: number; // minutes
    breakReminders: boolean;
    distractionBlocking: boolean;
  };
  aiAssistance: {
    suggestionsEnabled: boolean;
    suggestionsFrequency: 'minimal' | 'moderate' | 'frequent';
    autoComplete: boolean;
    grammarCheck: boolean;
    styleAnalysis: boolean;
    storyGuidance: boolean;
  };
  personalization: {
    adaptToMood: boolean;
    adaptToTimeOfDay: boolean;
    adaptToProductivity: boolean;
    learnFromUsage: boolean;
  };
}

interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  environment: Partial<WritingEnvironment>;
  conditions: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    mood?: string;
    genre?: string;
    goal?: 'productivity' | 'creativity' | 'focus' | 'flow';
  };
}

const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: 'morning_burst',
    name: 'Morning Burst',
    description: 'Energetic start to productive writing',
    icon: Sun,
    environment: {
      theme: {
        background: '#FFF7ED',
        foreground: '#1F2937',
        accent: '#F59E0B',
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 1.6,
        textWidth: 65
      },
      ambiance: {
        soundscape: 'birds',
        volume: 30,
        visualEffects: true,
        backgroundAnimation: false
      },
      productivity: {
        focusMode: false,
        wordGoal: 500,
        timeGoal: 25,
        breakReminders: true,
        distractionBlocking: false
      }
    },
    conditions: { timeOfDay: 'morning', goal: 'productivity' }
  },
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    description: 'Distraction-free zone for serious writing',
    icon: Focus,
    environment: {
      theme: {
        background: '#1F2937',
        foreground: '#F9FAFB',
        accent: '#3B82F6',
        fontFamily: 'Crimson Text',
        fontSize: 18,
        lineHeight: 1.8,
        textWidth: 55
      },
      ambiance: {
        soundscape: 'rain',
        volume: 40,
        visualEffects: false,
        backgroundAnimation: false
      },
      productivity: {
        focusMode: true,
        wordGoal: 1000,
        timeGoal: 60,
        breakReminders: false,
        distractionBlocking: true
      }
    },
    conditions: { goal: 'focus' }
  },
  {
    id: 'creative_flow',
    name: 'Creative Flow',
    description: 'Inspiring atmosphere for imaginative writing',
    icon: Sparkles,
    environment: {
      theme: {
        background: '#F3E8FF',
        foreground: '#4C1D95',
        accent: '#8B5CF6',
        fontFamily: 'Merriweather',
        fontSize: 17,
        lineHeight: 1.7,
        textWidth: 60
      },
      ambiance: {
        soundscape: 'forest',
        volume: 25,
        visualEffects: true,
        backgroundAnimation: true
      },
      productivity: {
        focusMode: false,
        wordGoal: 750,
        timeGoal: 45,
        breakReminders: true,
        distractionBlocking: false
      }
    },
    conditions: { goal: 'creativity' }
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Calm environment for late-night writing',
    icon: Moon,
    environment: {
      theme: {
        background: '#0F172A',
        foreground: '#CBD5E1',
        accent: '#06B6D4',
        fontFamily: 'Source Serif Pro',
        fontSize: 16,
        lineHeight: 1.75,
        textWidth: 58
      },
      ambiance: {
        soundscape: 'waves',
        volume: 35,
        visualEffects: true,
        backgroundAnimation: false
      },
      productivity: {
        focusMode: false,
        wordGoal: 400,
        timeGoal: 30,
        breakReminders: false,
        distractionBlocking: false
      }
    },
    conditions: { timeOfDay: 'night' }
  },
  {
    id: 'cozy_cafe',
    name: 'Cozy Café',
    description: 'Warm coffee shop atmosphere',
    icon: Coffee,
    environment: {
      theme: {
        background: '#FEF3C7',
        foreground: '#92400E',
        accent: '#D97706',
        fontFamily: 'Lora',
        fontSize: 16,
        lineHeight: 1.65,
        textWidth: 62
      },
      ambiance: {
        soundscape: 'cafe',
        volume: 45,
        visualEffects: false,
        backgroundAnimation: false
      },
      productivity: {
        focusMode: false,
        wordGoal: 600,
        timeGoal: 40,
        breakReminders: true,
        distractionBlocking: false
      }
    },
    conditions: { mood: 'casual' }
  }
];

const SOUNDSCAPES = {
  none: { name: 'Silence', icon: VolumeX, description: 'Pure quiet for concentration' },
  rain: { name: 'Rain', icon: CloudRain, description: 'Gentle rainfall sounds' },
  forest: { name: 'Forest', icon: Nature, description: 'Birds and rustling leaves' },
  waves: { name: 'Ocean', icon: Waves, description: 'Calm ocean waves' },
  cafe: { name: 'Café', icon: Coffee, description: 'Coffee shop ambiance' },
  fireplace: { name: 'Fireplace', icon: Flame, description: 'Crackling fire sounds' },
  wind: { name: 'Wind', icon: Wind, description: 'Gentle wind through trees' },
  birds: { name: 'Birds', icon: Sun, description: 'Morning bird songs' }
};

export const PersonalizedWritingEnvironment: React.FC<PersonalizedWritingEnvironmentProps> = ({
  projectId,
  sceneId,
  currentContent,
  onContentChange,
  onEnvironmentChange,
  className
}) => {
  const [currentEnvironment, setCurrentEnvironment] = useState<WritingEnvironment>(createDefaultEnvironment());
  const [showSettings, setShowSettings] = useState(false);
  const [isAdaptive, setIsAdaptive] = useState(true);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [adaptationSuggestions, setAdaptationSuggestions] = useState<string[]>([]);
  const [environmentMetrics, setEnvironmentMetrics] = useState({
    productivity: 0,
    satisfaction: 0,
    focusScore: 0,
    wordsPerMinute: 0
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStartRef = useRef<Date>(new Date());
  const wordsAtStartRef = useRef(0);

  // Initialize environment based on AI analysis
  useEffect(() => {
    if (isAdaptive) {
      adaptEnvironmentToContext();
    }
  }, [projectId, isAdaptive]);

  // Track environment effectiveness
  useEffect(() => {
    const interval = setInterval(() => {
      updateEnvironmentMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentContent]);

  // Adapt environment based on AI insights
  const adaptEnvironmentToContext = useCallback(async () => {
    const timeOfDay = getCurrentTimeOfDay();
    const analytics = personalAICoach.getPersonalAnalytics('week');
    const storyContext = storyAssistant.getStoryContext(projectId);
    
    // Determine optimal environment
    const recommendations = await getEnvironmentRecommendations({
      timeOfDay,
      productivity: analytics.productivityTrend,
      peakHours: analytics.peakProductivityHours,
      mood: getCurrentMood(),
      genre: storyContext?.genre,
      currentFocus: 'writing'
    });

    if (recommendations.length > 0) {
      setAdaptationSuggestions(recommendations);
      
      // Auto-apply if user has enabled learning
      if (currentEnvironment.personalization.learnFromUsage) {
        const bestPreset = findBestPreset(recommendations);
        if (bestPreset) {
          applyEnvironmentPreset(bestPreset);
        }
      }
    }
  }, [projectId, currentEnvironment]);

  // Apply environment preset
  const applyEnvironmentPreset = useCallback((preset: EnvironmentPreset) => {
    const newEnvironment = {
      ...currentEnvironment,
      ...preset.environment,
      id: preset.id,
      name: preset.name
    } as WritingEnvironment;

    setCurrentEnvironment(newEnvironment);
    onEnvironmentChange?.(newEnvironment);

    // Update soundscape
    if (preset.environment.ambiance?.soundscape) {
      playAmbientSound(preset.environment.ambiance.soundscape, preset.environment.ambiance.volume || 30);
    }

    // Track application for learning
    personalAICoach.learnFromText(`Applied environment: ${preset.name}`, {
      project: projectId,
      scene: sceneId
    });
  }, [currentEnvironment, onEnvironmentChange, projectId, sceneId]);

  // Play ambient soundscape
  const playAmbientSound = useCallback((soundscape: string, volume: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (soundscape !== 'none') {
        audioRef.current.src = `/sounds/${soundscape}.mp3`;
        audioRef.current.volume = volume / 100;
        audioRef.current.loop = true;
        audioRef.current.play().catch(console.error);
      }
    }
  }, []);

  // Update environment metrics
  const updateEnvironmentMetrics = useCallback(() => {
    const currentWords = countWords(currentContent);
    const sessionDuration = (Date.now() - sessionStartRef.current.getTime()) / 1000 / 60; // minutes
    const wordsAdded = currentWords - wordsAtStartRef.current;
    const wpm = sessionDuration > 0 ? wordsAdded / sessionDuration : 0;

    // Calculate focus score based on writing consistency
    const focusScore = calculateFocusScore(wordsAdded, sessionDuration);

    setEnvironmentMetrics({
      productivity: Math.min(100, (wordsAdded / currentEnvironment.productivity.wordGoal) * 100),
      satisfaction: 75, // Would be based on user feedback
      focusScore,
      wordsPerMinute: wpm
    });
  }, [currentContent, currentEnvironment]);

  // Start writing session
  const startWritingSession = useCallback(() => {
    const sessionId = personalAICoach.startWritingSession(getCurrentMood());
    setCurrentSession(sessionId);
    sessionStartRef.current = new Date();
    wordsAtStartRef.current = countWords(currentContent);
  }, [currentContent]);

  // End writing session
  const endWritingSession = useCallback(() => {
    if (currentSession) {
      const finalWordCount = countWords(currentContent);
      personalAICoach.endWritingSession(currentSession, finalWordCount, 8); // Default quality rating
      setCurrentSession(null);

      // Learn from session for environment optimization
      learnFromSession();
    }
  }, [currentSession, currentContent]);

  // Learn from writing session
  const learnFromSession = useCallback(() => {
    const sessionData = {
      environment: currentEnvironment.name,
      productivity: environmentMetrics.productivity,
      satisfaction: environmentMetrics.satisfaction,
      wordsPerMinute: environmentMetrics.wordsPerMinute
    };

    // This would feed into the AI learning system
    intelligentContentSuggestions.learnFromText(
      `Session with ${currentEnvironment.name}: ${environmentMetrics.wordsPerMinute} wpm`,
      { project: projectId }
    );
  }, [currentEnvironment, environmentMetrics, projectId]);

  // Render environment settings
  const renderEnvironmentSettings = () => (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            className="bg-background rounded-lg p-6 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Writing Environment</h2>
              <Button variant="ghost" onClick={() => setShowSettings(false)}>
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Environment Presets */}
              <Card>
                <CardHeader>
                  <CardTitle>Environment Presets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ENVIRONMENT_PRESETS.map(preset => {
                    const IconComponent = preset.icon;
                    const isActive = currentEnvironment.id === preset.id;
                    
                    return (
                      <div
                        key={preset.id}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-colors",
                          isActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        )}
                        onClick={() => applyEnvironmentPreset(preset)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="h-5 w-5" />
                          <span className="font-semibold">{preset.name}</span>
                          {isActive && <Badge>Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{preset.description}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Customization */}
              <Card>
                <CardHeader>
                  <CardTitle>Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Settings */}
                  <div>
                    <h4 className="font-medium mb-3">Theme</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Font Size</label>
                        <Slider
                          value={[currentEnvironment.theme.fontSize]}
                          onValueChange={(value) => updateEnvironmentTheme({ fontSize: value[0] })}
                          min={12}
                          max={24}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Text Width (%)</label>
                        <Slider
                          value={[currentEnvironment.theme.textWidth]}
                          onValueChange={(value) => updateEnvironmentTheme({ textWidth: value[0] })}
                          min={40}
                          max={100}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ambiance Settings */}
                  <div>
                    <h4 className="font-medium mb-3">Ambiance</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Soundscape</label>
                        <select
                          value={currentEnvironment.ambiance.soundscape || 'none'}
                          onChange={(e) => updateEnvironmentAmbiance({ soundscape: e.target.value === 'none' ? null : e.target.value })}
                          className="w-full mt-1 p-2 border rounded-md bg-background"
                        >
                          {Object.entries(SOUNDSCAPES).map(([key, sound]) => (
                            <option key={key} value={key}>{sound.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Volume</label>
                        <Slider
                          value={[currentEnvironment.ambiance.volume]}
                          onValueChange={(value) => updateEnvironmentAmbiance({ volume: value[0] })}
                          min={0}
                          max={100}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Visual Effects</label>
                        <Switch
                          checked={currentEnvironment.ambiance.visualEffects}
                          onCheckedChange={(checked) => updateEnvironmentAmbiance({ visualEffects: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Assistance */}
                  <div>
                    <h4 className="font-medium mb-3">AI Assistance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Suggestions</label>
                        <Switch
                          checked={currentEnvironment.aiAssistance.suggestionsEnabled}
                          onCheckedChange={(checked) => updateEnvironmentAI({ suggestionsEnabled: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Auto-complete</label>
                        <Switch
                          checked={currentEnvironment.aiAssistance.autoComplete}
                          onCheckedChange={(checked) => updateEnvironmentAI({ autoComplete: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Story Guidance</label>
                        <Switch
                          checked={currentEnvironment.aiAssistance.storyGuidance}
                          onCheckedChange={(checked) => updateEnvironmentAI({ storyGuidance: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Adaptive Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Adaptive Environment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Enable Adaptive Environment</p>
                    <p className="text-sm text-muted-foreground">Let AI optimize your environment based on your habits</p>
                  </div>
                  <Switch
                    checked={isAdaptive}
                    onCheckedChange={setIsAdaptive}
                  />
                </div>

                {adaptationSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">AI Recommendations:</p>
                    {adaptationSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Helper functions
  const updateEnvironmentTheme = (updates: Partial<WritingEnvironment['theme']>) => {
    setCurrentEnvironment(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates }
    }));
  };

  const updateEnvironmentAmbiance = (updates: Partial<WritingEnvironment['ambiance']>) => {
    const newEnvironment = {
      ...currentEnvironment,
      ambiance: { ...currentEnvironment.ambiance, ...updates }
    };
    setCurrentEnvironment(newEnvironment);
    
    if (updates.soundscape !== undefined) {
      playAmbientSound(updates.soundscape || 'none', updates.volume || currentEnvironment.ambiance.volume);
    }
  };

  const updateEnvironmentAI = (updates: Partial<WritingEnvironment['aiAssistance']>) => {
    setCurrentEnvironment(prev => ({
      ...prev,
      aiAssistance: { ...prev.aiAssistance, ...updates }
    }));
  };

  return (
    <div 
      className={cn("personalized-writing-environment h-full relative", className)}
      style={{
        backgroundColor: currentEnvironment.theme.background,
        color: currentEnvironment.theme.foreground,
        fontFamily: currentEnvironment.theme.fontFamily,
        fontSize: `${currentEnvironment.theme.fontSize}px`,
        lineHeight: currentEnvironment.theme.lineHeight
      }}
    >
      {/* Environment Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          {currentEnvironment.name}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSettings(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Environment Metrics */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{Math.round(environmentMetrics.productivity)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>{Math.round(environmentMetrics.wordsPerMinute)} wpm</span>
              </div>
              <div className="flex items-center gap-1">
                <Focus className="h-3 w-3" />
                <span>{Math.round(environmentMetrics.focusScore)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        {!currentSession ? (
          <Button onClick={startWritingSession} className="bg-primary/90 backdrop-blur-sm">
            <Timer className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        ) : (
          <Button onClick={endWritingSession} variant="outline" className="bg-background/80 backdrop-blur-sm">
            <Square className="h-4 w-4 mr-2" />
            End Session
          </Button>
        )}
      </div>

      {/* Background Effects */}
      {currentEnvironment.ambiance.visualEffects && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full opacity-10">
            {currentEnvironment.ambiance.backgroundAnimation && (
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 25% 25%, ${currentEnvironment.theme.accent}20 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, ${currentEnvironment.theme.accent}15 0%, transparent 50%)`
                }}
                animate={{
                  background: [
                    `radial-gradient(circle at 25% 25%, ${currentEnvironment.theme.accent}20 0%, transparent 50%),
                     radial-gradient(circle at 75% 75%, ${currentEnvironment.theme.accent}15 0%, transparent 50%)`,
                    `radial-gradient(circle at 75% 25%, ${currentEnvironment.theme.accent}15 0%, transparent 50%),
                     radial-gradient(circle at 25% 75%, ${currentEnvironment.theme.accent}20 0%, transparent 50%)`
                  ]
                }}
                transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Audio Element */}
      <audio ref={audioRef} />

      {/* Settings Modal */}
      {renderEnvironmentSettings()}
    </div>
  );
};

// Helper functions
function createDefaultEnvironment(): WritingEnvironment {
  return {
    id: 'default',
    name: 'Default',
    theme: {
      background: '#FFFFFF',
      foreground: '#1F2937',
      accent: '#3B82F6',
      fontFamily: 'Inter',
      fontSize: 16,
      lineHeight: 1.6,
      textWidth: 65
    },
    ambiance: {
      soundscape: null,
      volume: 30,
      visualEffects: false,
      backgroundAnimation: false
    },
    productivity: {
      focusMode: false,
      wordGoal: 500,
      timeGoal: 30,
      breakReminders: true,
      distractionBlocking: false
    },
    aiAssistance: {
      suggestionsEnabled: true,
      suggestionsFrequency: 'moderate',
      autoComplete: true,
      grammarCheck: true,
      styleAnalysis: true,
      storyGuidance: true
    },
    personalization: {
      adaptToMood: true,
      adaptToTimeOfDay: true,
      adaptToProductivity: true,
      learnFromUsage: true
    }
  };
}

function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

function getCurrentMood(): string {
  // This would be more sophisticated in practice
  const hour = new Date().getHours();
  if (hour < 9) return 'energetic';
  if (hour < 14) return 'focused';
  if (hour < 18) return 'creative';
  return 'relaxed';
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function calculateFocusScore(wordsAdded: number, sessionDuration: number): number {
  if (sessionDuration === 0) return 0;
  
  // Simple focus score based on consistent writing
  const idealWordsPerMinute = 30;
  const actualWPM = wordsAdded / sessionDuration;
  return Math.min(100, (actualWPM / idealWordsPerMinute) * 100);
}

async function getEnvironmentRecommendations(context: {
  timeOfDay: string;
  productivity: number;
  peakHours: string[];
  mood: string;
  genre?: string;
  currentFocus: string;
}): Promise<string[]> {
  const recommendations: string[] = [];
  
  // Time-based recommendations
  if (context.timeOfDay === 'morning') {
    recommendations.push('Morning Burst environment for energetic start');
  }
  
  if (context.timeOfDay === 'night') {
    recommendations.push('Night Owl environment for calm late-night writing');
  }
  
  // Productivity-based recommendations
  if (context.productivity < 0.5) {
    recommendations.push('Deep Focus environment to improve concentration');
  }
  
  return recommendations;
}

function findBestPreset(recommendations: string[]): EnvironmentPreset | null {
  for (const recommendation of recommendations) {
    const preset = ENVIRONMENT_PRESETS.find(p => 
      recommendation.toLowerCase().includes(p.name.toLowerCase())
    );
    if (preset) return preset;
  }
  return null;
}

export default PersonalizedWritingEnvironment;