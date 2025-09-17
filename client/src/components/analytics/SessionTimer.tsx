/**
 * Session Timer Component
 * Real-time writing session timer with controls
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Play,
  Pause,
  Square,
  Timer,
  PenTool,
  Clock,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';
import type { WritingSession } from '@/services/analyticsService';

interface SessionTimerProps {
  currentSession: WritingSession | null;
  onStart: () => void;
  onEnd: () => void;
  onPause: () => void;
  className?: string;
}

export function SessionTimer({
  currentSession,
  onStart,
  onEnd,
  onPause,
  className
}: SessionTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate session duration
  const getSessionDuration = () => {
    if (!currentSession?.startTime) return 0;
    return Math.floor((currentTime.getTime() - currentSession.startTime.getTime()) / 1000);
  };

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate words per minute
  const getWordsPerMinute = () => {
    if (!currentSession) return 0;
    const durationMinutes = getSessionDuration() / 60;
    if (durationMinutes === 0) return 0;
    return Math.round(currentSession.netWordsWritten / durationMinutes);
  };

  const sessionDuration = getSessionDuration();
  const wordsPerMinute = getWordsPerMinute();

  const handlePause = () => {
    setIsPaused(!isPaused);
    onPause();
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'writing':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'editing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'planning':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'research':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className={cn("session-timer", className)}>
      {currentSession ? (
        // Active Session Display
        <div className="space-y-4">
          {/* Session Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isPaused ? "bg-yellow-500" : "bg-green-500"
              )} />
              <div>
                <h3 className="font-semibold">Active Session</h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={cn(
                      "text-xs capitalize",
                      getSessionTypeColor(currentSession.sessionType)
                    )}
                  >
                    {currentSession.sessionType}
                  </Badge>
                  {isPaused && (
                    <Badge variant="outline" className="text-xs">
                      Paused
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Session Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                className="flex items-center gap-1"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={onEnd}
                className="flex items-center gap-1"
              >
                <Square className="h-4 w-4" />
                End Session
              </Button>
            </div>
          </div>

          {/* Session Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Duration */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Timer className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono">
                {formatDuration(sessionDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>

            {/* Words Written */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <PenTool className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold">
                {currentSession.netWordsWritten.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Words</div>
            </div>

            {/* Words per Minute */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">
                {wordsPerMinute}
              </div>
              <div className="text-sm text-muted-foreground">WPM</div>
            </div>

            {/* Session Target */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">
                {Math.round((sessionDuration / 60) || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
          </div>

          {/* Session Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Session Progress</span>
              <span className="text-muted-foreground">
                Started at {currentSession.startTime.toLocaleTimeString()}
              </span>
            </div>
            
            {/* Visual progress indicator */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Words: {currentSession.netWordsWritten}</span>
                  <span>•</span>
                  <span>Time: {formatDuration(sessionDuration)}</span>
                  {wordsPerMinute > 0 && (
                    <>
                      <span>•</span>
                      <span>Pace: {wordsPerMinute} WPM</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Session Stats */}
          {currentSession.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span>Pauses: {currentSession.metadata.pauseCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span>Peak: {currentSession.metadata.peakWPM || 0} WPM</span>
              </div>
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <span>Focus: {Math.round((currentSession.metadata.focusTime || 0) / 60)}m</span>
              </div>
              <div className="flex items-center gap-1">
                <PenTool className="h-3 w-3 text-muted-foreground" />
                <span>Keystrokes: {currentSession.keystrokeCount || 0}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Start Session Display
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 bg-cosmic-100 dark:bg-cosmic-900 rounded-full mx-auto">
            <Timer className="h-8 w-8 text-cosmic-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Ready to Write?</h3>
            <p className="text-muted-foreground mb-4">
              Start a writing session to track your progress and build momentum.
            </p>
          </div>

          {/* Session Type Selector */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Button
              onClick={onStart}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Writing Session
            </Button>
          </div>

          {/* Quick tips */}
          <div className="text-xs text-muted-foreground">
            <p>Tip: Regular writing sessions help build consistency and track your progress over time.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionTimer;