/**
 * Pacing Dashboard Component
 * Visualizes story pacing, tension arcs, and writing goals
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { pacingAnalysisService, type PacingReport, type WritingGoal, type ProductivityAnalytics } from '@/services/pacingAnalysisService';
import type { Project, Story, Scene } from '@/types/story';
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  Calendar,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle,
  Award,
  Flame,
  BookOpen,
  Edit3,
  PlayCircle,
  PauseCircle,
  Plus,
  Settings,
  Info,
  Download,
  RefreshCw
} from 'lucide-react';

interface PacingDashboardProps {
  project: Project;
  stories: Story[];
  scenes: Scene[];
  onSceneSelect?: (sceneId: string) => void;
  className?: string;
}

interface GoalFormData {
  type: WritingGoal['type'];
  target: number;
  unit: WritingGoal['unit'];
  endDate?: string;
}

export function PacingDashboard({
  project,
  stories,
  scenes,
  onSceneSelect,
  className
}: PacingDashboardProps) {
  const [pacingReport, setPacingReport] = useState<PacingReport | null>(null);
  const [writingGoals, setWritingGoals] = useState<WritingGoal[]>([]);
  const [productivity, setProductivity] = useState<ProductivityAnalytics | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pacing' | 'tension' | 'goals' | 'productivity'>('pacing');
  const [goalForm, setGoalForm] = useState<GoalFormData>({
    type: 'daily',
    target: 500,
    unit: 'words'
  });

  useEffect(() => {
    analyzePacing();
    loadGoals();
    loadProductivity();
  }, [project, stories, scenes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const analyzePacing = () => {
    const report = pacingAnalysisService.analyzePacing(
      project,
      stories,
      scenes,
      stories.flatMap(s => s.chapters || [])
    );
    setPacingReport(report);
  };

  const loadGoals = () => {
    // Load goals from service
    // This would need a getGoals method in the service
    setWritingGoals([]);
  };

  const loadProductivity = () => {
    const analytics = pacingAnalysisService.getProductivityAnalytics(project.id);
    setProductivity(analytics);
  };

  const handleStartSession = () => {
    pacingAnalysisService.startWritingSession(project.id);
    setIsSessionActive(true);
    setSessionTime(0);
  };

  const handleEndSession = () => {
    const session = pacingAnalysisService.endWritingSession();
    setIsSessionActive(false);
    setSessionTime(0);
    loadProductivity();
    
    if (session) {
      // Show session summary
      console.log('Session ended:', session);
    }
  };

  const handleCreateGoal = () => {
    const goal = pacingAnalysisService.createGoal({
      type: goalForm.type,
      target: goalForm.target,
      unit: goalForm.unit,
      startDate: new Date(),
      endDate: goalForm.endDate ? new Date(goalForm.endDate) : undefined
    });
    
    setWritingGoals([...writingGoals, goal]);
    setShowGoalForm(false);
    setGoalForm({ type: 'daily', target: 500, unit: 'words' });
  };

  const formatSessionTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const renderPacingTab = () => {
    if (!pacingReport) return null;
    
    return (
      <div className="space-y-4">
        {/* Overall Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pacing Score</p>
                <p className="text-2xl font-bold">{pacingReport.overall.pacingScore}</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg",
                pacingReport.overall.pacingScore >= 70 ? "bg-green-100" : 
                pacingReport.overall.pacingScore >= 50 ? "bg-yellow-100" : "bg-red-100"
              )}>
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scene Pace</p>
                <p className="text-2xl font-bold capitalize">{pacingReport.overall.scenePace}</p>
              </div>
              <Badge variant={
                pacingReport.overall.scenePace === 'steady' ? 'default' :
                pacingReport.overall.scenePace === 'fast' ? 'destructive' : 'secondary'
              }>
                {pacingReport.overall.averageSceneLength} words avg
              </Badge>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shortest Scene</p>
                <p className="text-lg font-semibold truncate">{pacingReport.overall.shortestScene.title}</p>
                <p className="text-sm text-muted-foreground">{pacingReport.overall.shortestScene.wordCount} words</p>
              </div>
              <TrendingDown className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Longest Scene</p>
                <p className="text-lg font-semibold truncate">{pacingReport.overall.longestScene.title}</p>
                <p className="text-sm text-muted-foreground">{pacingReport.overall.longestScene.wordCount} words</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        {pacingReport.overall.recommendations.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pacing Recommendations
            </h3>
            <ul className="space-y-2">
              {pacingReport.overall.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-cosmic-500 mt-1">•</span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Act Pacing */}
        {pacingReport.actPacing.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Act Pacing</h3>
            <div className="space-y-2">
              {pacingReport.actPacing.map(act => (
                <div key={act.actNumber} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-4">
                    <Badge>Act {act.actNumber}</Badge>
                    <span className="text-sm">{act.scenes} scenes</span>
                    <span className="text-sm text-muted-foreground">{act.wordCount.toLocaleString()} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      act.pacing === 'steady' ? 'default' :
                      act.pacing === 'fast' ? 'destructive' : 'secondary'
                    }>
                      {act.pacing}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm">{act.tensionPeak}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Genre Expectations */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Genre Analysis</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-green-600 mb-2">Matches Expectations</h4>
              <ul className="space-y-1">
                {pacingReport.genreExpectations.matches.map((match, i) => (
                  <li key={i} className="text-xs flex items-start gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                    <span>{match}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-yellow-600 mb-2">Deviations</h4>
              <ul className="space-y-1">
                {pacingReport.genreExpectations.deviations.map((dev, i) => (
                  <li key={i} className="text-xs flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5" />
                    <span>{dev}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-blue-600 mb-2">Suggestions</h4>
              <ul className="space-y-1">
                {pacingReport.genreExpectations.suggestions.map((sug, i) => (
                  <li key={i} className="text-xs flex items-start gap-1">
                    <Info className="h-3 w-3 text-blue-500 mt-0.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderTensionTab = () => {
    if (!pacingReport) return null;
    
    return (
      <div className="space-y-4">
        {/* Tension Chart */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Tension Arc</h3>
          <div className="h-64 relative">
            <svg className="w-full h-full">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line
                  key={y}
                  x1="0"
                  y1={`${100 - y}%`}
                  x2="100%"
                  y2={`${100 - y}%`}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                />
              ))}
              
              {/* Tension line */}
              <polyline
                points={pacingReport.tensionArcs.map((arc, i) => {
                  const x = (i / (pacingReport.tensionArcs.length - 1)) * 100;
                  const y = 100 - arc.tensionLevel;
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke="url(#tensionGradient)"
                strokeWidth="2"
              />
              
              {/* Emotional intensity overlay */}
              <polyline
                points={pacingReport.tensionArcs.map((arc, i) => {
                  const x = (i / (pacingReport.tensionArcs.length - 1)) * 100;
                  const y = 100 - arc.emotionalIntensity;
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke="url(#emotionGradient)"
                strokeWidth="2"
                opacity="0.5"
              />
              
              {/* Data points */}
              {pacingReport.tensionArcs.map((arc, i) => {
                const x = (i / (pacingReport.tensionArcs.length - 1)) * 100;
                const y = 100 - arc.tensionLevel;
                
                return (
                  <g key={arc.sceneId}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill={arc.tensionLevel > 70 ? '#ef4444' : arc.tensionLevel > 40 ? '#f59e0b' : '#10b981'}
                      className="cursor-pointer hover:r-6"
                      onClick={() => onSceneSelect?.(arc.sceneId)}
                    />
                    <title>{`${arc.sceneTitle}: ${arc.tensionLevel}% tension`}</title>
                  </g>
                );
              })}
              
              <defs>
                <linearGradient id="tensionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
              <span className="text-xs">Tension Level</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 opacity-50" />
              <span className="text-xs">Emotional Intensity</span>
            </div>
          </div>
        </Card>

        {/* Scene Analysis */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Scene Tension Analysis</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pacingReport.tensionArcs.map(arc => (
              <div
                key={arc.sceneId}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                onClick={() => onSceneSelect?.(arc.sceneId)}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{arc.sceneTitle}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{arc.tensionLevel}% tension</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{arc.actionLevel}% action</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Edit3 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{Math.round(arc.dialogueRatio * 100)}% dialogue</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {arc.tensionLevel > 70 && (
                    <Badge variant="destructive" className="text-xs">High Tension</Badge>
                  )}
                  {arc.emotionalIntensity > 70 && (
                    <Badge variant="default" className="text-xs">Emotional</Badge>
                  )}
                  {arc.actionLevel > 70 && (
                    <Badge variant="secondary" className="text-xs">Action</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderGoalsTab = () => (
    <div className="space-y-4">
      {/* Writing Session */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Writing Session</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isSessionActive ? 'Session in progress' : 'Start a new writing session'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isSessionActive && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-lg">{formatSessionTime(sessionTime)}</span>
              </div>
            )}
            
            <Button
              onClick={isSessionActive ? handleEndSession : handleStartSession}
              variant={isSessionActive ? 'destructive' : 'default'}
            >
              {isSessionActive ? (
                <>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  End Session
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Active Goals */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Writing Goals</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGoalForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Goal
          </Button>
        </div>
        
        {writingGoals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No goals set yet</p>
            <p className="text-sm">Create a goal to track your progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {writingGoals.map(goal => (
              <div key={goal.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={goal.completed ? 'default' : 'outline'}>
                      {goal.type}
                    </Badge>
                    <span className="font-medium">
                      {goal.target} {goal.unit}
                    </span>
                  </div>
                  
                  {goal.streak && goal.streak > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">{goal.streak} day streak</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{goal.current} / {goal.target}</span>
                    <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        goal.completed ? "bg-green-500" : "bg-cosmic-500"
                      )}
                      style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                    />
                  </div>
                </div>
                
                {goal.endDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Due: {new Date(goal.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Goal Form */}
      {showGoalForm && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Create New Goal</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={goalForm.type}
                  onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded bg-background"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="project">Project</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Unit</label>
                <select
                  value={goalForm.unit}
                  onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded bg-background"
                >
                  <option value="words">Words</option>
                  <option value="scenes">Scenes</option>
                  <option value="chapters">Chapters</option>
                  <option value="pages">Pages</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Target</label>
                <input
                  type="number"
                  value={goalForm.target}
                  onChange={(e) => setGoalForm({ ...goalForm, target: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded bg-background"
                  min="1"
                />
              </div>
              
              {goalForm.type === 'deadline' && (
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={goalForm.endDate || ''}
                    onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-background"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateGoal}>Create Goal</Button>
              <Button variant="outline" onClick={() => setShowGoalForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderProductivityTab = () => {
    if (!productivity) return null;
    
    return (
      <div className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-2xl font-bold">{productivity.totalWords.toLocaleString()}</p>
              </div>
              <BookOpen className="h-5 w-5 text-cosmic-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{productivity.averageWordsPerDay}</p>
              </div>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{productivity.writingStreak}</p>
                <p className="text-xs text-muted-foreground">Best: {productivity.longestStreak}</p>
              </div>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Goals Completed</p>
                <p className="text-2xl font-bold">{productivity.goalsCompleted}</p>
                <p className="text-xs text-muted-foreground">In progress: {productivity.goalsInProgress}</p>
              </div>
              <Award className="h-5 w-5 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Writing Patterns */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Writing Patterns</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Most Productive Time</p>
              <p className="text-lg font-medium">{productivity.mostProductiveTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Most Productive Day</p>
              <p className="text-lg font-medium">{productivity.mostProductiveDay}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average per Session</p>
              <p className="text-lg font-medium">{productivity.averageWordsPerSession} words</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Scenes</p>
              <p className="text-lg font-medium">{productivity.totalScenes}</p>
            </div>
          </div>
        </Card>

        {/* Estimated Completion */}
        {productivity.estimatedCompletionDate && (
          <Card className="p-4 bg-cosmic-50 dark:bg-cosmic-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Estimated Project Completion</h3>
                <p className="text-2xl font-bold mt-2">
                  {productivity.estimatedCompletionDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on current average of {productivity.averageWordsPerDay} words per day
                </p>
              </div>
              <Target className="h-8 w-8 text-cosmic-500" />
            </div>
          </Card>
        )}

        {/* Recommendations */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Productivity Tips</h3>
          <ul className="space-y-2">
            {productivity.averageWordsPerDay < 250 && (
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <span className="text-sm">Try setting a small daily goal to build consistency</span>
              </li>
            )}
            {productivity.writingStreak < 3 && (
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <span className="text-sm">Focus on building a daily writing habit, even if just 100 words</span>
              </li>
            )}
            {productivity.mostProductiveTime && (
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-sm">Schedule writing sessions around {productivity.mostProductiveTime} for best results</span>
              </li>
            )}
            {productivity.goalsInProgress > 3 && (
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span className="text-sm">Consider focusing on fewer goals for better completion rate</span>
              </li>
            )}
          </ul>
        </Card>
      </div>
    );
  };

  return (
    <Card className={cn("pacing-dashboard", className)}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pacing & Goals Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Analyze story pacing and track writing progress
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={analyzePacing}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex items-center gap-1 p-1">
          <Button
            size="sm"
            variant={selectedTab === 'pacing' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('pacing')}
            className="flex-1"
          >
            <Activity className="h-4 w-4 mr-2" />
            Pacing
          </Button>
          <Button
            size="sm"
            variant={selectedTab === 'tension' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('tension')}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            Tension
          </Button>
          <Button
            size="sm"
            variant={selectedTab === 'goals' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('goals')}
            className="flex-1"
          >
            <Target className="h-4 w-4 mr-2" />
            Goals
          </Button>
          <Button
            size="sm"
            variant={selectedTab === 'productivity' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('productivity')}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Productivity
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {selectedTab === 'pacing' && renderPacingTab()}
        {selectedTab === 'tension' && renderTensionTab()}
        {selectedTab === 'goals' && renderGoalsTab()}
        {selectedTab === 'productivity' && renderProductivityTab()}
      </div>
    </Card>
  );
}

export default PacingDashboard;