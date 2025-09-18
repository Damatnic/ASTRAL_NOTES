/**
 * Writing Heatmap Component
 * GitHub-style activity heatmap for writing sessions
 */

import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Calendar, Activity, TrendingUp } from 'lucide-react';
import type { WritingSession } from '@/services/analyticsService';

interface WritingHeatmapProps {
  sessions: WritingSession[];
  timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  className?: string;
}

interface DayData {
  date: Date;
  words: number;
  sessions: number;
  intensity: number; // 0-4 scale
  dateString: string;
}

export function WritingHeatmap({
  sessions,
  timeRange,
  className
}: WritingHeatmapProps) {
  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    // Determine start date based on time range
    const startDate = new Date(today);
    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 29);
        break;
      case 'quarter':
        startDate.setDate(startDate.getDate() - 89);
        break;
      case 'year':
        startDate.setDate(startDate.getDate() - 364);
        break;
      default:
        startDate.setDate(startDate.getDate() - 364); // Default to year
    }
    startDate.setHours(0, 0, 0, 0);

    // Generate array of all days in range
    const days: DayData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Find sessions for this day
      const daySessions = sessions.filter(session => {
        const sessionDate = session.startTime.toISOString().split('T')[0];
        return sessionDate === dateString;
      });

      const dayWords = daySessions.reduce((sum, session) => sum + session.netWordsWritten, 0);
      
      days.push({
        date: new Date(currentDate),
        words: dayWords,
        sessions: daySessions.length,
        intensity: 0, // Will be calculated after all days are processed
        dateString
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate intensity levels (0-4 scale)
    const maxWords = Math.max(...days.map(d => d.words));
    if (maxWords > 0) {
      days.forEach(day => {
        if (day.words === 0) {
          day.intensity = 0;
        } else if (day.words < maxWords * 0.25) {
          day.intensity = 1;
        } else if (day.words < maxWords * 0.5) {
          day.intensity = 2;
        } else if (day.words < maxWords * 0.75) {
          day.intensity = 3;
        } else {
          day.intensity = 4;
        }
      });
    }

    return days;
  }, [sessions, timeRange]);

  // Group days into weeks for display
  const weekData = useMemo(() => {
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    heatmapData.forEach((day, index) => {
      if (index === 0) {
        // Fill in empty days at the start of the first week
        const dayOfWeek = day.date.getDay();
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({
            date: new Date(0),
            words: 0,
            sessions: 0,
            intensity: 0,
            dateString: ''
          });
        }
      }

      currentWeek.push(day);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Handle remaining days
    if (currentWeek.length > 0) {
      // Fill in empty days at the end
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(0),
          words: 0,
          sessions: 0,
          intensity: 0,
          dateString: ''
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatmapData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeDays = heatmapData.filter(day => day.words > 0).length;
    const totalWords = heatmapData.reduce((sum, day) => sum + day.words, 0);
    const totalSessions = heatmapData.reduce((sum, day) => sum + day.sessions, 0);
    const averageWords = activeDays > 0 ? Math.round(totalWords / activeDays) : 0;
    const bestDay = heatmapData.reduce((best, day) => 
      day.words > best.words ? day : best, heatmapData[0] || { words: 0, date: new Date() }
    );

    // Calculate current streak
    let currentStreak = 0;
    for (let i = heatmapData.length - 1; i >= 0; i--) {
      if (heatmapData[i].words > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      activeDays,
      totalWords,
      totalSessions,
      averageWords,
      bestDay,
      currentStreak,
      totalDays: heatmapData.length
    };
  }, [heatmapData]);

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-gray-100 dark:bg-gray-800';
      case 1:
        return 'bg-cosmic-200 dark:bg-cosmic-900';
      case 2:
        return 'bg-cosmic-300 dark:bg-cosmic-700';
      case 3:
        return 'bg-cosmic-400 dark:bg-cosmic-600';
      case 4:
        return 'bg-cosmic-500 dark:bg-cosmic-500';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getDayLabel = (day: DayData) => {
    if (!day.dateString) return '';
    
    const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
    const date = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (day.words === 0) {
      return `${dayName}, ${date}: No writing`;
    }
    
    return `${dayName}, ${date}: ${day.words.toLocaleString()} words, ${day.sessions} session${day.sessions !== 1 ? 's' : ''}`;
  };

  return (
    <div className={cn("writing-heatmap space-y-4", className)}>
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.activeDays}</div>
          <div className="text-muted-foreground">Active Days</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.currentStreak}</div>
          <div className="text-muted-foreground">Current Streak</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.averageWords.toLocaleString()}</div>
          <div className="text-muted-foreground">Avg/Active Day</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.bestDay.words.toLocaleString()}</div>
          <div className="text-muted-foreground">Best Day</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-2">
        {/* Month labels */}
        <div className="flex text-xs text-muted-foreground mb-1">
          <div className="w-8"></div> {/* Space for day labels */}
          <div className="flex-1 flex justify-between">
            {timeRange === 'year' && (
              <>
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
              </>
            )}
            {timeRange === 'quarter' && (
              <>
                <span>3 months ago</span>
                <span>2 months ago</span>
                <span>1 month ago</span>
                <span>Now</span>
              </>
            )}
            {timeRange === 'month' && (
              <>
                <span>4 weeks ago</span>
                <span>2 weeks ago</span>
                <span>Now</span>
              </>
            )}
          </div>
        </div>

        {/* Day labels and heatmap grid */}
        <div className="flex">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 flex-1">
            {weekData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={cn(
                      "w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-cosmic-400",
                      getIntensityColor(day.intensity),
                      !day.dateString && "opacity-0"
                    )}
                    title={getDayLabel(day)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(intensity => (
                <div
                  key={intensity}
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    getIntensityColor(intensity)
                  )}
                />
              ))}
            </div>
            <span>More</span>
          </div>
          
          <div className="text-right">
            <div>{stats.activeDays} of {stats.totalDays} days active</div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="text-sm space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Activity Summary:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Total Words:</span>
            <span className="font-medium ml-1">{stats.totalWords.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Sessions:</span>
            <span className="font-medium ml-1">{stats.totalSessions}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Consistency:</span>
            <span className="font-medium ml-1">
              {Math.round((stats.activeDays / stats.totalDays) * 100)}%
            </span>
          </div>
        </div>

        {stats.bestDay.words > 0 && (
          <div className="text-xs text-muted-foreground">
            Best day: {stats.bestDay.date.toLocaleDateString()} with {stats.bestDay.words.toLocaleString()} words
          </div>
        )}
      </div>
    </div>
  );
}

export default WritingHeatmap;