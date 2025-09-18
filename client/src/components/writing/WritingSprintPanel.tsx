/**
 * Writing Sprint Panel Component
 * Timed writing sessions with live stats and achievements
 */

import React, { useState, useEffect, useRef } from 'react';
import { writingSprintsService, WritingSprint, SprintTemplate, SprintStats, Achievement } from '@/services/writingSprintsService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { 
  Play, 
  Pause, 
  Square, 
  Target, 
  Clock, 
  Trophy,
  Zap,
  TrendingUp,
  Award,
  Timer,
  Coffee,
  Volume2,
  VolumeX,
  ChevronRight,
  Flame
} from 'lucide-react';

interface WritingSprintPanelProps {
  projectId?: string;
  documentId?: string;
  wordCount?: number;
  onWordCountChange?: (count: number) => void;
  className?: string;
}

export function WritingSprintPanel({ 
  projectId, 
  documentId, 
  wordCount = 0,
  onWordCountChange,
  className 
}: WritingSprintPanelProps) {
  const [currentSprint, setCurrentSprint] = useState<WritingSprint | null>(null);
  const [templates, setTemplates] = useState<SprintTemplate[]>([]);
  const [stats, setStats] = useState<SprintStats | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SprintTemplate | null>(null);
  const [customGoal, setCustomGoal] = useState({ words: 500, minutes: 25 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  
  const wordCountRef = useRef(wordCount);

  useEffect(() => {
    wordCountRef.current = wordCount;
  }, [wordCount]);

  useEffect(() => {
    loadData();

    const handleSprintStarted = (sprint: WritingSprint) => {
      setCurrentSprint(sprint);
      setIsSetupModalOpen(false);
    };

    const handleSprintEnded = ({ sprint }: { sprint: WritingSprint }) => {
      setCurrentSprint(null);
      setNewAchievements(sprint.achievements);
      loadStats();
    };

    const handleTimerTick = ({ elapsed, remaining, progress }: any) => {
      setTimeRemaining(Math.ceil(remaining));
      setProgress(progress);
    };

    const handleGoalReached = () => {
      if (soundEnabled) {
        // Play achievement sound
      }
    };

    writingSprintsService.on('sprintStarted', handleSprintStarted);
    writingSprintsService.on('sprintEnded', handleSprintEnded);
    writingSprintsService.on('timerTick', handleTimerTick);
    writingSprintsService.on('goalReached', handleGoalReached);

    return () => {
      writingSprintsService.off('sprintStarted', handleSprintStarted);
      writingSprintsService.off('sprintEnded', handleSprintEnded);
      writingSprintsService.off('timerTick', handleTimerTick);
      writingSprintsService.off('goalReached', handleGoalReached);
    };
  }, [soundEnabled]);

  useEffect(() => {
    // Update word count in sprint
    if (currentSprint?.status === 'active') {
      writingSprintsService.updateWordCount(wordCount);
    }
  }, [wordCount, currentSprint]);

  const loadData = () => {
    setTemplates(writingSprintsService.getTemplates());
    setStats(writingSprintsService.getStats());
  };

  const loadStats = () => {
    setStats(writingSprintsService.getStats());
  };

  const startSprint = () => {
    if (selectedTemplate) {
      writingSprintsService.applyTemplate(selectedTemplate.id, {
        projectId,
        documentId,
        wordCount: wordCountRef.current
      });
    } else {
      writingSprintsService.startSprint(
        customGoal.minutes * 60,
        { 
          type: 'both', 
          wordTarget: customGoal.words, 
          timeTarget: customGoal.minutes * 60 
        },
        {
          projectId,
          documentId,
          wordCount: wordCountRef.current
        }
      );
    }
  };

  const pauseSprint = () => {
    writingSprintsService.pauseSprint();
    setCurrentSprint(prev => prev ? { ...prev, status: 'paused' } : null);
  };

  const resumeSprint = () => {
    writingSprintsService.resumeSprint();
    setCurrentSprint(prev => prev ? { ...prev, status: 'active' } : null);
  };

  const endSprint = () => {
    if (confirm('End the current sprint?')) {
      writingSprintsService.endSprint('cancelled');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500';
      case 'epic': return 'text-purple-500';
      case 'rare': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (currentSprint) {
    // Active Sprint View
    return (
      <div className={`${className}`}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-5xl font-bold font-mono text-gray-900">
                {formatTime(timeRemaining)}
              </div>
              <Progress value={progress} className="mt-4" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600">
                  {currentSprint.wordsWritten}
                </div>
                <div className="text-sm text-gray-600">Words Written</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {currentSprint.wpm}
                </div>
                <div className="text-sm text-gray-600">WPM</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentSprint.focusScore}%
                </div>
                <div className="text-sm text-gray-600">Focus Score</div>
              </div>
            </div>

            {/* Goal Progress */}
            {currentSprint.goal.wordTarget && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Word Goal</span>
                  <span>{currentSprint.wordsWritten} / {currentSprint.goal.wordTarget}</span>
                </div>
                <Progress 
                  value={(currentSprint.wordsWritten / currentSprint.goal.wordTarget) * 100}
                  className="h-2"
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-2">
              {currentSprint.status === 'active' ? (
                <>
                  <Button onClick={pauseSprint} variant="outline">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={endSprint} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    End Sprint
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={resumeSprint}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={endSprint} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    End Sprint
                  </Button>
                </>
              )}
            </div>

            {/* Sound Toggle */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 mr-2" />
                ) : (
                  <VolumeX className="w-4 h-4 mr-2" />
                )}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Achievement Notification */}
        {newAchievements.length > 0 && (
          <div className="fixed bottom-4 right-4 space-y-2">
            {newAchievements.map(achievement => (
              <div
                key={achievement.id}
                className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-in"
              >
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <div className="font-semibold">Achievement Unlocked!</div>
                  <div className={`text-sm ${getRarityColor(achievement.rarity)}`}>
                    {achievement.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Sprint Setup View
  return (
    <div className={`${className}`}>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Writing Sprint
            </h3>
            <p className="text-sm text-gray-600">
              Boost your productivity with timed writing sessions
            </p>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                  <div className="font-semibold">{stats.currentStreak} days</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-sm text-gray-600">Avg WPM</div>
                  <div className="font-semibold">{stats.averageWPM}</div>
                </div>
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Quick Start Templates
            </div>
            <div className="grid grid-cols-2 gap-2">
              {templates.slice(0, 4).map(template => (
                <Button
                  key={template.id}
                  variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setSelectedTemplate(template);
                    startSprint();
                  }}
                >
                  <Timer className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs opacity-70">
                      {Math.floor(template.duration / 60)} min
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={() => setIsSetupModalOpen(true)}
            >
              <Target className="w-4 h-4 mr-2" />
              Custom Sprint
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsStatsModalOpen(true)}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Stats
            </Button>
          </div>
        </div>
      </Card>

      {/* Custom Sprint Modal */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        title="Start Custom Sprint"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={customGoal.minutes}
              onChange={(e) => setCustomGoal({ ...customGoal, minutes: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Word Goal
            </label>
            <input
              type="number"
              value={customGoal.words}
              onChange={(e) => setCustomGoal({ ...customGoal, words: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              step="50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsSetupModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setSelectedTemplate(null);
              startSprint();
            }}>
              Start Sprint
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        title="Sprint Statistics"
        className="max-w-2xl"
      >
        {stats && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600">
                  {stats.completedSprints}
                </div>
                <div className="text-sm text-gray-600">Sprints</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {stats.totalWordsWritten.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.floor(stats.totalTimeWriting / 3600)}h
                </div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.longestStreak}
                </div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>

            {/* Personal Bests */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Personal Bests</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Most Words</span>
                  <Badge>{stats.personalBests.mostWords} words</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Highest WPM</span>
                  <Badge>{stats.personalBests.highestWPM} WPM</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Best Focus</span>
                  <Badge>{stats.personalBests.bestFocusScore}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Longest Sprint</span>
                  <Badge>{Math.floor(stats.personalBests.longestSprint / 60)} min</Badge>
                </div>
              </div>
            </div>

            {/* Achievements */}
            {stats.achievements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Achievements ({stats.achievements.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {stats.achievements.slice(0, 6).map(achievement => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-xl">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${getRarityColor(achievement.rarity)}`}>
                          {achievement.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writing Pattern */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-violet-600" />
                <span className="font-medium text-gray-900">Writing Pattern</span>
              </div>
              <p className="text-sm text-gray-600">
                You're most productive during <strong>{stats.favoriteTime}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Average focus score: <strong>{stats.averageFocusScore}%</strong>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default WritingSprintPanel;