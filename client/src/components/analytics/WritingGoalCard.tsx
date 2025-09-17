/**
 * Writing Goal Card Component
 * Displays individual writing goals with progress tracking
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Target,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  BookOpen,
  Hash,
  Timer
} from 'lucide-react';
import type { WritingGoal } from '@/services/analyticsService';

interface WritingGoalCardProps {
  goal: WritingGoal;
  progress: number;
  current: number;
  onEdit?: (goal: WritingGoal) => void;
  onDelete?: (goalId: string) => void;
  onToggleActive?: (goalId: string) => void;
  className?: string;
}

const GOAL_TYPE_ICONS = {
  daily: Calendar,
  weekly: Calendar,
  monthly: Calendar,
  project: BookOpen,
  custom: Target
};

const GOAL_TYPE_COLORS = {
  daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  weekly: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  monthly: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  project: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
};

const TARGET_TYPE_ICONS = {
  words: BookOpen,
  scenes: Hash,
  chapters: BookOpen,
  hours: Timer
};

export function WritingGoalCard({
  goal,
  progress,
  current,
  onEdit,
  onDelete,
  onToggleActive,
  className
}: WritingGoalCardProps) {
  const IconComponent = GOAL_TYPE_ICONS[goal.type];
  const TargetIcon = TARGET_TYPE_ICONS[goal.targetType];
  const isCompleted = progress >= 100;
  const isOverdue = goal.endDate && new Date() > goal.endDate && !isCompleted;

  // Calculate remaining amount and time
  const remaining = Math.max(0, goal.target - current);
  const daysRemaining = goal.endDate 
    ? Math.ceil((goal.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Format the target display
  const formatTarget = (value: number, type: string) => {
    switch (type) {
      case 'words':
        return `${value.toLocaleString()} words`;
      case 'scenes':
        return `${value} scene${value !== 1 ? 's' : ''}`;
      case 'chapters':
        return `${value} chapter${value !== 1 ? 's' : ''}`;
      case 'hours':
        return `${value} hour${value !== 1 ? 's' : ''}`;
      default:
        return value.toString();
    }
  };

  // Calculate daily pace needed
  const getDailyPaceNeeded = () => {
    if (!daysRemaining || daysRemaining <= 0 || remaining <= 0) return null;
    
    const dailyPace = Math.ceil(remaining / daysRemaining);
    return formatTarget(dailyPace, goal.targetType);
  };

  const dailyPaceNeeded = getDailyPaceNeeded();

  return (
    <Card className={cn(
      "writing-goal-card transition-all duration-200",
      isCompleted && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950",
      isOverdue && "ring-2 ring-red-500 bg-red-50 dark:bg-red-950",
      !goal.isActive && "opacity-60",
      className
    )}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              <div>
                <h4 className="font-semibold text-sm">{goal.title}</h4>
                {goal.description && (
                  <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Badge 
                className={cn(
                  "text-xs",
                  GOAL_TYPE_COLORS[goal.type]
                )}
              >
                {goal.type}
              </Badge>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <TargetIcon className="h-3 w-3" />
                {formatTarget(current, goal.targetType)} of {formatTarget(goal.target, goal.targetType)}
              </span>
              <span className={cn(
                "font-medium",
                isCompleted ? "text-green-600" : "text-muted-foreground"
              )}>
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  isCompleted ? "bg-green-500" : "bg-cosmic-500",
                  isOverdue && !isCompleted && "bg-red-500"
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Remaining */}
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-medium">{formatTarget(remaining, goal.targetType)}</span>
            </div>

            {/* Time info */}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {daysRemaining !== null ? (
                  daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'
                ) : 'No deadline'}
              </span>
            </div>
          </div>

          {/* Daily pace needed */}
          {dailyPaceNeeded && daysRemaining && daysRemaining > 0 && (
            <div className="p-2 bg-muted/50 rounded text-xs">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-orange-500" />
                <span className="text-muted-foreground">Daily pace needed:</span>
                <span className="font-medium text-orange-600">{dailyPaceNeeded}</span>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isCompleted && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900 p-2 rounded">
              <CheckCircle className="h-3 w-3" />
              <span className="font-medium">Goal completed! 🎉</span>
            </div>
          )}

          {isOverdue && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-100 dark:bg-red-900 p-2 rounded">
              <Clock className="h-3 w-3" />
              <span className="font-medium">This goal is overdue</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {goal.startDate.toLocaleDateString()} 
              {goal.endDate && ` - ${goal.endDate.toLocaleDateString()}`}
            </div>

            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(goal)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              
              {onToggleActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleActive(goal.id)}
                  className="h-6 w-6 p-0"
                >
                  {goal.isActive ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Target className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              )}

              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(goal.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WritingGoalCard;