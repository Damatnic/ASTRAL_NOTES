/**
 * Progress Chart Component
 * Interactive chart displaying writing progress over time
 */

import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { 
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';

interface ProgressChartProps {
  data: { date: string; words: number }[];
  timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  metricType: 'words' | 'time' | 'sessions' | 'goals';
  className?: string;
}

export function ProgressChart({
  data,
  timeRange,
  metricType,
  className
}: ProgressChartProps) {
  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate additional metrics
    const maxValue = Math.max(...sortedData.map(d => d.words));
    const minValue = Math.min(...sortedData.map(d => d.words));
    const totalWords = sortedData.reduce((sum, d) => sum + d.words, 0);
    const averageWords = totalWords / sortedData.length;

    return sortedData.map((item, index) => ({
      ...item,
      percentage: maxValue > 0 ? (item.words / maxValue) * 100 : 0,
      isAboveAverage: item.words > averageWords,
      index,
      formatted: {
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        words: item.words.toLocaleString()
      }
    }));
  }, [data]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'neutral', percentage: 0 };

    const recent = chartData.slice(-7); // Last 7 days
    const earlier = chartData.slice(-14, -7); // Previous 7 days

    if (earlier.length === 0) return { direction: 'neutral', percentage: 0 };

    const recentAvg = recent.reduce((sum, d) => sum + d.words, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, d) => sum + d.words, 0) / earlier.length;

    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(change))
    };
  }, [chartData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData.length) return { total: 0, average: 0, peak: 0, streak: 0 };

    const total = chartData.reduce((sum, d) => sum + d.words, 0);
    const average = Math.round(total / chartData.length);
    const peak = Math.max(...chartData.map(d => d.words));
    
    // Calculate current streak of non-zero days
    let streak = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].words > 0) {
        streak++;
      } else {
        break;
      }
    }

    return { total, average, peak, streak };
  }, [chartData]);

  if (!chartData.length) {
    return (
      <div className={cn("progress-chart", className)}>
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data available</p>
          <p className="text-sm">Start writing to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("progress-chart space-y-4", className)}>
      {/* Chart Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.total.toLocaleString()}</div>
          <div className="text-muted-foreground">Total Words</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.average.toLocaleString()}</div>
          <div className="text-muted-foreground">Daily Average</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.peak.toLocaleString()}</div>
          <div className="text-muted-foreground">Peak Day</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg">{stats.streak}</div>
          <div className="text-muted-foreground">Current Streak</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full",
          trend.direction === 'up' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
          trend.direction === 'down' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
          trend.direction === 'neutral' && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        )}>
          <TrendingUp className={cn(
            "h-3 w-3",
            trend.direction === 'down' && "rotate-180"
          )} />
          <span>
            {trend.direction === 'up' && `↑ ${trend.percentage}%`}
            {trend.direction === 'down' && `↓ ${trend.percentage}%`}
            {trend.direction === 'neutral' && 'Steady'}
          </span>
        </div>
        <span className="text-muted-foreground">vs last week</span>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Chart Container */}
        <div className="h-48 flex items-end justify-between gap-1 p-4 bg-muted/20 rounded-lg">
          {chartData.map((item, index) => (
            <div
              key={item.date}
              className="group relative flex-1 flex flex-col justify-end cursor-pointer"
              style={{ minWidth: '8px' }}
            >
              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-200 hover:opacity-80",
                  item.words === 0 
                    ? "bg-gray-200 dark:bg-gray-700" 
                    : item.isAboveAverage 
                      ? "bg-cosmic-500" 
                      : "bg-cosmic-300"
                )}
                style={{ 
                  height: `${Math.max(item.percentage, 2)}%`,
                  minHeight: '2px'
                }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  <div className="font-medium">{item.formatted.words} words</div>
                  <div className="text-gray-300">{item.formatted.date}</div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-4">
          {chartData.length > 0 && (
            <>
              <span>{chartData[0].formatted.date}</span>
              {chartData.length > 2 && (
                <span>{chartData[Math.floor(chartData.length / 2)].formatted.date}</span>
              )}
              <span>{chartData[chartData.length - 1].formatted.date}</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-cosmic-500 rounded"></div>
          <span>Above Average</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-cosmic-300 rounded"></div>
          <span>Below Average</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <span>No Writing</span>
        </div>
      </div>

      {/* Daily Breakdown (for recent data) */}
      {timeRange === 'week' && chartData.length <= 7 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Breakdown
          </h4>
          <div className="space-y-2">
            {chartData.slice(-7).map((item) => (
              <div key={item.date} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.formatted.date}</span>
                <span className={cn(
                  "font-medium",
                  item.words === 0 ? "text-muted-foreground" : "text-foreground"
                )}>
                  {item.formatted.words} words
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressChart;