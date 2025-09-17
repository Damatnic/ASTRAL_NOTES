/**
 * Analytics Components Index
 * Centralized exports for all analytics-related components
 */

export { WritingDashboard } from './WritingDashboard';
export { WritingGoalCard } from './WritingGoalCard';
export { SessionTimer } from './SessionTimer';
export { ProgressChart } from './ProgressChart';
export { WritingHeatmap } from './WritingHeatmap';

export type {
  WritingSession,
  WritingGoal,
  WritingStreak,
  ProjectStatistics,
  StoryStatistics
} from '@/services/analyticsService';