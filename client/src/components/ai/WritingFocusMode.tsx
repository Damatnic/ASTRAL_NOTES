/**
 * Writing Focus Mode Component
 * Provides distraction-free writing environment with intelligent assistance
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Focus, 
  Target, 
  Clock, 
  Pause, 
  Play, 
  RotateCcw,
  CheckCircle,
  TrendingUp,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

interface WritingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  targetWords: number;
  wordsWritten: number;
  timeSpent: number; // in minutes
  completed: boolean;
}

interface WritingFocusModeProps {
  content: string;
  onContentChange: (content: string) => void;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export function WritingFocusMode({ 
  content, 
  onContentChange, 
  isActive, 
  onToggle,
  className 
}: WritingFocusModeProps) {
  const [currentSession, setCurrentSession] = useState<WritingSession | null>(null);
  const [targetWords, setTargetWords] = useState(500);
  const [targetTime, setTargetTime] = useState(25); // minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [initialWordCount, setInitialWordCount] = useState(0);
  const [wordsPerMinute, setWordsPerMinute] = useState(0);

  // Update word count when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
  }, [content]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && currentSession) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          
          // Calculate words per minute
          const minutesElapsed = newTime / 60;
          const wordsWritten = wordCount - initialWordCount;
          if (minutesElapsed > 0) {
            setWordsPerMinute(Math.round(wordsWritten / minutesElapsed));
          }
          
          // Check if time target is reached
          if (newTime >= targetTime * 60) {
            completeSession();
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentSession, targetTime, wordCount, initialWordCount]);

  // Start a new writing session
  const startSession = useCallback(() => {
    const session: WritingSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      targetWords,
      wordsWritten: 0,
      timeSpent: 0,
      completed: false
    };
    
    setCurrentSession(session);
    setInitialWordCount(wordCount);
    setTimeElapsed(0);
    setWordsPerMinute(0);
    setIsTimerRunning(true);
  }, [targetWords, wordCount]);

  // Complete the current session
  const completeSession = useCallback(() => {
    if (!currentSession) return;
    
    const completedSession: WritingSession = {
      ...currentSession,
      endTime: new Date(),
      wordsWritten: wordCount - initialWordCount,
      timeSpent: Math.round(timeElapsed / 60),
      completed: true
    };
    
    setCurrentSession(completedSession);
    setIsTimerRunning(false);
    
    // Save session to localStorage
    const sessions = JSON.parse(localStorage.getItem('writing-sessions') || '[]');
    sessions.push(completedSession);
    localStorage.setItem('writing-sessions', JSON.stringify(sessions));
  }, [currentSession, wordCount, initialWordCount, timeElapsed]);

  // Pause/resume timer
  const toggleTimer = useCallback(() => {
    setIsTimerRunning(prev => !prev);
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    setCurrentSession(null);
    setIsTimerRunning(false);
    setTimeElapsed(0);
    setWordsPerMinute(0);
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentages
  const timeProgress = Math.min(100, (timeElapsed / (targetTime * 60)) * 100);
  const wordProgress = currentSession ? 
    Math.min(100, ((wordCount - initialWordCount) / targetWords) * 100) : 0;

  // Get session status
  const getSessionStatus = () => {
    if (!currentSession) return 'ready';
    if (currentSession.completed) return 'completed';
    if (isTimerRunning) return 'active';
    return 'paused';
  };

  const sessionStatus = getSessionStatus();

  if (!isActive) {
    return (
      <Button
        variant="cosmic"
        size="sm"
        onClick={onToggle}
        leftIcon={<Focus className="h-4 w-4" />}
        className={className}
      >
        Focus Mode
      </Button>
    );
  }

  return (
    <Card className={`${className} border-violet-200 dark:border-violet-800`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Focus className="h-5 w-5 text-violet-600" />
            Writing Focus Mode
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProgress(!showProgress)}
              leftIcon={showProgress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            >
              {showProgress ? 'Hide' : 'Show'} Progress
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              Exit
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Session Setup */}
        {sessionStatus === 'ready' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Words</label>
                <Input
                  type="number"
                  value={targetWords}
                  onChange={(e) => setTargetWords(parseInt(e.target.value) || 500)}
                  min={100}
                  max={5000}
                  step={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Time (minutes)</label>
                <Input
                  type="number"
                  value={targetTime}
                  onChange={(e) => setTargetTime(parseInt(e.target.value) || 25)}
                  min={5}
                  max={120}
                  step={5}
                />
              </div>
            </div>
            
            <Button
              variant="cosmic"
              onClick={startSession}
              leftIcon={<Play className="h-4 w-4" />}
              className="w-full"
            >
              Start Focus Session
            </Button>
          </div>
        )}

        {/* Active Session */}
        {currentSession && sessionStatus !== 'ready' && (
          <div className="space-y-4">
            {/* Timer and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-mono font-bold">
                  {formatTime(timeElapsed)}
                </div>
                <Badge 
                  variant={sessionStatus === 'active' ? 'success' : 
                          sessionStatus === 'completed' ? 'cosmic' : 'secondary'}
                >
                  {sessionStatus}
                </Badge>
              </div>
              
              {sessionStatus !== 'completed' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTimer}
                    leftIcon={isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  >
                    {isTimerRunning ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetSession}
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>

            {/* Progress Indicators */}
            {showProgress && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(timeProgress)}%
                    </span>
                  </div>
                  <Progress value={timeProgress} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Word Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {wordCount - initialWordCount} / {targetWords} words
                    </span>
                  </div>
                  <Progress value={wordProgress} className="h-2" />
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {wordCount - initialWordCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Words Written</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {wordsPerMinute}
                  </div>
                  <div className="text-xs text-muted-foreground">Words/Min</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(timeElapsed / 60)}m
                  </div>
                  <div className="text-xs text-muted-foreground">Time Spent</div>
                </CardContent>
              </Card>
            </div>

            {/* Completion Status */}
            {sessionStatus === 'completed' && (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Session Completed!
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You wrote {wordCount - initialWordCount} words in {Math.round(timeElapsed / 60)} minutes.
                  Great work!
                </p>
              </div>
            )}

            {/* Quick Actions */}
            {sessionStatus !== 'completed' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={completeSession}
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                >
                  Complete Session
                </Button>
                
                {(wordCount - initialWordCount) >= targetWords && (
                  <Badge variant="success" className="animate-pulse">
                    Target Reached! 🎉
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Writing Tips */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            Focus Tips
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Turn off notifications and close other apps</li>
            <li>• Write freely without editing or correcting</li>
            <li>• If stuck, write about being stuck</li>
            <li>• Focus on progress, not perfection</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}