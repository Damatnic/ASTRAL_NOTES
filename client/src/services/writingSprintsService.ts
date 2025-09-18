/**
 * Writing Sprints Service
 * Timed writing sessions with goals and achievements
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export interface WritingSprint {
  id: string;
  projectId?: string;
  documentId?: string;
  goal: SprintGoal;
  duration: number; // in seconds
  startTime: number;
  endTime?: number;
  pausedTime?: number;
  totalPausedDuration: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  startWordCount: number;
  currentWordCount: number;
  endWordCount?: number;
  wordsWritten: number;
  wpm: number; // words per minute
  achievements: Achievement[];
  distractions: number;
  focusScore: number; // 0-100
  notes?: string;
}

export interface SprintGoal {
  type: 'words' | 'time' | 'both';
  wordTarget?: number;
  timeTarget?: number; // in seconds
  description?: string;
}

export interface Achievement {
  id: string;
  type: 
    | 'goal_reached' 
    | 'streak' 
    | 'focus' 
    | 'speed' 
    | 'consistency'
    | 'milestone'
    | 'challenge';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: number;
}

export interface SprintTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  goal: SprintGoal;
  warmupPrompt?: string;
  focusMusic?: string;
  breakReminders: boolean;
  strictMode: boolean; // Prevents tab switching
}

export interface SprintStats {
  totalSprints: number;
  completedSprints: number;
  totalWordsWritten: number;
  totalTimeWriting: number; // in seconds
  averageWPM: number;
  averageFocusScore: number;
  longestStreak: number;
  currentStreak: number;
  favoriteTime: string;
  achievements: Achievement[];
  personalBests: {
    mostWords: number;
    longestSprint: number;
    highestWPM: number;
    bestFocusScore: number;
  };
}

export interface SprintChallenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  requirements: {
    sprints?: number;
    words?: number;
    time?: number;
    streak?: number;
    focusScore?: number;
  };
  reward: {
    achievement?: Achievement;
    badge?: string;
    title?: string;
  };
  startDate: number;
  endDate: number;
  progress: number; // 0-100
  completed: boolean;
}

class WritingSprintsService extends BrowserEventEmitter {
  private currentSprint: WritingSprint | null = null;
  private sprintHistory: WritingSprint[] = [];
  private templates: SprintTemplate[] = [];
  private achievements: Achievement[] = [];
  private challenges: SprintChallenge[] = [];
  private timer: NodeJS.Timeout | null = null;
  private focusCheckInterval: NodeJS.Timeout | null = null;
  private storageKey = 'astral_notes_sprints';
  private lastActivityTime: number = Date.now();
  private distractionCount: number = 0;

  constructor() {
    super();
    this.initializeTemplates();
    this.initializeAchievements();
    this.loadData();
    this.setupFocusTracking();
  }

  // Sprint Management
  startSprint(
    duration: number,
    goal: SprintGoal,
    options: {
      projectId?: string;
      documentId?: string;
      wordCount?: number;
    } = {}
  ): WritingSprint {
    if (this.currentSprint?.status === 'active') {
      this.endSprint('cancelled');
    }

    const sprint: WritingSprint = {
      id: this.generateId(),
      projectId: options.projectId,
      documentId: options.documentId,
      goal,
      duration,
      startTime: Date.now(),
      totalPausedDuration: 0,
      status: 'active',
      startWordCount: options.wordCount || 0,
      currentWordCount: options.wordCount || 0,
      wordsWritten: 0,
      wpm: 0,
      achievements: [],
      distractions: 0,
      focusScore: 100
    };

    this.currentSprint = sprint;
    this.distractionCount = 0;
    this.lastActivityTime = Date.now();

    // Start timer
    this.startTimer();

    this.emit('sprintStarted', sprint);
    this.playSound('start');
    
    return sprint;
  }

  pauseSprint(): boolean {
    if (!this.currentSprint || this.currentSprint.status !== 'active') {
      return false;
    }

    this.currentSprint.status = 'paused';
    this.currentSprint.pausedTime = Date.now();
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.emit('sprintPaused', this.currentSprint);
    return true;
  }

  resumeSprint(): boolean {
    if (!this.currentSprint || this.currentSprint.status !== 'paused') {
      return false;
    }

    const pauseDuration = Date.now() - (this.currentSprint.pausedTime || Date.now());
    this.currentSprint.totalPausedDuration += pauseDuration;
    this.currentSprint.status = 'active';
    this.currentSprint.pausedTime = undefined;

    this.startTimer();
    this.emit('sprintResumed', this.currentSprint);
    
    return true;
  }

  endSprint(reason: 'completed' | 'cancelled' = 'completed'): WritingSprint | null {
    if (!this.currentSprint) return null;

    const sprint = this.currentSprint;
    sprint.endTime = Date.now();
    sprint.status = reason === 'completed' ? 'completed' : 'cancelled';
    sprint.endWordCount = sprint.currentWordCount;

    // Calculate final stats
    const actualDuration = (sprint.endTime - sprint.startTime - sprint.totalPausedDuration) / 1000;
    sprint.wpm = actualDuration > 0 ? Math.round((sprint.wordsWritten / actualDuration) * 60) : 0;

    // Check achievements
    if (reason === 'completed') {
      sprint.achievements = this.checkAchievements(sprint);
      this.updateStats(sprint);
      this.checkChallengeProgress(sprint);
    }

    // Clear timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.sprintHistory.push(sprint);
    this.currentSprint = null;
    
    this.saveData();
    this.emit('sprintEnded', { sprint, reason });
    
    if (reason === 'completed') {
      this.playSound('complete');
    }

    return sprint;
  }

  updateWordCount(wordCount: number): void {
    if (!this.currentSprint || this.currentSprint.status !== 'active') return;

    const previousCount = this.currentSprint.currentWordCount;
    this.currentSprint.currentWordCount = wordCount;
    this.currentSprint.wordsWritten = wordCount - this.currentSprint.startWordCount;
    
    // Update WPM
    const elapsedTime = (Date.now() - this.currentSprint.startTime - this.currentSprint.totalPausedDuration) / 1000 / 60;
    if (elapsedTime > 0) {
      this.currentSprint.wpm = Math.round(this.currentSprint.wordsWritten / elapsedTime);
    }

    // Check if goal reached
    if (this.currentSprint.goal.type === 'words' || this.currentSprint.goal.type === 'both') {
      if (this.currentSprint.goal.wordTarget && 
          this.currentSprint.wordsWritten >= this.currentSprint.goal.wordTarget) {
        this.emit('goalReached', { type: 'words', sprint: this.currentSprint });
        
        // Auto-complete if only word goal
        if (this.currentSprint.goal.type === 'words') {
          this.endSprint('completed');
        }
      }
    }

    // Update activity for focus tracking
    if (wordCount > previousCount) {
      this.lastActivityTime = Date.now();
    }

    this.emit('wordCountUpdated', {
      sprint: this.currentSprint,
      wordCount,
      wordsWritten: this.currentSprint.wordsWritten
    });
  }

  // Timer Management
  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      if (!this.currentSprint || this.currentSprint.status !== 'active') {
        return;
      }

      const elapsed = (Date.now() - this.currentSprint.startTime - this.currentSprint.totalPausedDuration) / 1000;
      const remaining = this.currentSprint.duration - elapsed;

      if (remaining <= 0) {
        // Time's up!
        this.endSprint('completed');
      } else {
        // Update progress
        this.emit('timerTick', {
          sprint: this.currentSprint,
          elapsed,
          remaining,
          progress: (elapsed / this.currentSprint.duration) * 100
        });

        // Check for break reminders
        if (elapsed > 0 && elapsed % 900 === 0) { // Every 15 minutes
          this.emit('breakReminder', this.currentSprint);
        }
      }
    }, 1000);
  }

  // Focus Tracking
  private setupFocusTracking(): void {
    if (typeof window === 'undefined') return;

    // Track tab visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentSprint?.status === 'active') {
        this.distractionCount++;
        this.currentSprint.distractions++;
        this.updateFocusScore();
        this.emit('distraction', { type: 'tab_switch', sprint: this.currentSprint });
      }
    });

    // Track window blur
    window.addEventListener('blur', () => {
      if (this.currentSprint?.status === 'active') {
        this.distractionCount++;
        this.currentSprint.distractions++;
        this.updateFocusScore();
        this.emit('distraction', { type: 'window_blur', sprint: this.currentSprint });
      }
    });

    // Periodic focus check
    this.focusCheckInterval = setInterval(() => {
      if (this.currentSprint?.status === 'active') {
        const inactiveTime = Date.now() - this.lastActivityTime;
        if (inactiveTime > 60000) { // 1 minute of inactivity
          this.updateFocusScore();
        }
      }
    }, 10000); // Check every 10 seconds
  }

  private updateFocusScore(): void {
    if (!this.currentSprint) return;

    const baseScore = 100;
    const distractionPenalty = this.currentSprint.distractions * 5;
    const inactivityPenalty = Math.min(30, Math.floor((Date.now() - this.lastActivityTime) / 60000) * 5);
    
    this.currentSprint.focusScore = Math.max(0, baseScore - distractionPenalty - inactivityPenalty);
  }

  // Templates
  getTemplates(): SprintTemplate[] {
    return [...this.templates];
  }

  applyTemplate(templateId: string, options?: any): WritingSprint | null {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    return this.startSprint(template.duration, template.goal, options);
  }

  createTemplate(template: Omit<SprintTemplate, 'id'>): SprintTemplate {
    const newTemplate: SprintTemplate = {
      ...template,
      id: this.generateId()
    };

    this.templates.push(newTemplate);
    this.saveData();
    this.emit('templateCreated', newTemplate);
    
    return newTemplate;
  }

  // Statistics
  getStats(): SprintStats {
    const completedSprints = this.sprintHistory.filter(s => s.status === 'completed');
    
    const totalWords = completedSprints.reduce((sum, s) => sum + s.wordsWritten, 0);
    const totalTime = completedSprints.reduce((sum, s) => 
      sum + ((s.endTime || 0) - s.startTime - s.totalPausedDuration), 0
    ) / 1000; // Convert to seconds

    const averageWPM = completedSprints.length > 0
      ? Math.round(completedSprints.reduce((sum, s) => sum + s.wpm, 0) / completedSprints.length)
      : 0;

    const averageFocusScore = completedSprints.length > 0
      ? Math.round(completedSprints.reduce((sum, s) => sum + s.focusScore, 0) / completedSprints.length)
      : 0;

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks();

    // Find personal bests
    const personalBests = {
      mostWords: Math.max(0, ...completedSprints.map(s => s.wordsWritten)),
      longestSprint: Math.max(0, ...completedSprints.map(s => s.duration)),
      highestWPM: Math.max(0, ...completedSprints.map(s => s.wpm)),
      bestFocusScore: Math.max(0, ...completedSprints.map(s => s.focusScore))
    };

    return {
      totalSprints: this.sprintHistory.length,
      completedSprints: completedSprints.length,
      totalWordsWritten: totalWords,
      totalTimeWriting: totalTime,
      averageWPM,
      averageFocusScore,
      longestStreak,
      currentStreak,
      favoriteTime: this.calculateFavoriteTime(),
      achievements: this.achievements,
      personalBests
    };
  }

  // Challenges
  getChallenges(): SprintChallenge[] {
    // Update challenge progress
    this.challenges.forEach(challenge => {
      if (!challenge.completed) {
        this.updateChallengeProgress(challenge);
      }
    });

    return [...this.challenges];
  }

  private checkChallengeProgress(sprint: WritingSprint): void {
    this.challenges.forEach(challenge => {
      if (challenge.completed || Date.now() > challenge.endDate) return;

      let progress = 0;
      const completed = this.sprintHistory.filter(s => s.status === 'completed');

      if (challenge.requirements.sprints) {
        const sprintsInPeriod = completed.filter(s => 
          s.startTime >= challenge.startDate && s.startTime <= challenge.endDate
        ).length;
        progress += (sprintsInPeriod / challenge.requirements.sprints) * 33.33;
      }

      if (challenge.requirements.words) {
        const wordsInPeriod = completed
          .filter(s => s.startTime >= challenge.startDate && s.startTime <= challenge.endDate)
          .reduce((sum, s) => sum + s.wordsWritten, 0);
        progress += (wordsInPeriod / challenge.requirements.words) * 33.33;
      }

      if (challenge.requirements.time) {
        const timeInPeriod = completed
          .filter(s => s.startTime >= challenge.startDate && s.startTime <= challenge.endDate)
          .reduce((sum, s) => sum + s.duration, 0);
        progress += (timeInPeriod / challenge.requirements.time) * 33.33;
      }

      challenge.progress = Math.min(100, progress);

      if (challenge.progress >= 100) {
        challenge.completed = true;
        this.emit('challengeCompleted', challenge);
        
        if (challenge.reward.achievement) {
          this.achievements.push(challenge.reward.achievement);
        }
      }
    });

    this.saveData();
  }

  private updateChallengeProgress(challenge: SprintChallenge): void {
    // This would be called periodically to update challenge progress
    // Implementation similar to checkChallengeProgress but without sprint parameter
  }

  // Achievements
  private checkAchievements(sprint: WritingSprint): Achievement[] {
    const newAchievements: Achievement[] = [];

    // Word count achievements
    if (sprint.wordsWritten >= 100 && !this.hasAchievement('first_100')) {
      newAchievements.push(this.createAchievement('first_100', 'Century', 'Write 100 words in a sprint', '💯', 'common'));
    }

    if (sprint.wordsWritten >= 500 && !this.hasAchievement('first_500')) {
      newAchievements.push(this.createAchievement('first_500', 'Half K', 'Write 500 words in a sprint', '🔥', 'rare'));
    }

    if (sprint.wordsWritten >= 1000 && !this.hasAchievement('first_1000')) {
      newAchievements.push(this.createAchievement('first_1000', 'Thousand Words', 'Write 1000 words in a sprint', '🚀', 'epic'));
    }

    // Speed achievements
    if (sprint.wpm >= 50 && !this.hasAchievement('speed_demon')) {
      newAchievements.push(this.createAchievement('speed_demon', 'Speed Demon', 'Reach 50 WPM', '⚡', 'rare'));
    }

    // Focus achievements
    if (sprint.focusScore >= 95 && !this.hasAchievement('laser_focus')) {
      newAchievements.push(this.createAchievement('laser_focus', 'Laser Focus', 'Complete sprint with 95+ focus score', '🎯', 'rare'));
    }

    // Add new achievements
    newAchievements.forEach(achievement => {
      this.achievements.push(achievement);
    });

    return newAchievements;
  }

  private hasAchievement(id: string): boolean {
    return this.achievements.some(a => a.id === id);
  }

  private createAchievement(
    id: string,
    name: string,
    description: string,
    icon: string,
    rarity: Achievement['rarity']
  ): Achievement {
    return {
      id,
      type: 'milestone',
      name,
      description,
      icon,
      rarity,
      unlockedAt: Date.now()
    };
  }

  // Helper Methods
  private calculateStreaks(): { currentStreak: number; longestStreak: number } {
    const sortedSprints = [...this.sprintHistory]
      .filter(s => s.status === 'completed')
      .sort((a, b) => a.startTime - b.startTime);

    if (sortedSprints.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedSprints.length; i++) {
      const prevDate = new Date(sortedSprints[i - 1].startTime).toDateString();
      const currDate = new Date(sortedSprints[i].startTime).toDateString();
      
      if (prevDate === currDate) {
        // Same day, continue streak
        continue;
      }
      
      const dayDiff = Math.floor(
        (sortedSprints[i].startTime - sortedSprints[i - 1].startTime) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if current streak is still active (last sprint was today or yesterday)
    const lastSprint = sortedSprints[sortedSprints.length - 1];
    const daysSinceLastSprint = Math.floor(
      (Date.now() - lastSprint.startTime) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSprint > 1) {
      currentStreak = 0;
    } else {
      currentStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  }

  private calculateFavoriteTime(): string {
    const hourCounts: Record<number, number> = {};
    
    this.sprintHistory
      .filter(s => s.status === 'completed')
      .forEach(sprint => {
        const hour = new Date(sprint.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

    const favoriteHour = Object.entries(hourCounts).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 }
    ).hour;

    if (favoriteHour < 6) return 'Night Owl (12am-6am)';
    if (favoriteHour < 12) return 'Early Bird (6am-12pm)';
    if (favoriteHour < 18) return 'Afternoon Writer (12pm-6pm)';
    return 'Evening Writer (6pm-12am)';
  }

  private updateStats(sprint: WritingSprint): void {
    // This would update long-term statistics
    // Implementation depends on specific stat tracking needs
  }

  private playSound(type: 'start' | 'complete' | 'break'): void {
    // This would play audio feedback
    // Implementation depends on audio system
    this.emit('soundPlayed', type);
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'pomodoro',
        name: 'Pomodoro Sprint',
        description: '25 minutes of focused writing',
        duration: 1500,
        goal: { type: 'time', timeTarget: 1500 },
        breakReminders: true,
        strictMode: false
      },
      {
        id: 'quick',
        name: 'Quick Sprint',
        description: '10 minute burst of creativity',
        duration: 600,
        goal: { type: 'time', timeTarget: 600 },
        breakReminders: false,
        strictMode: false
      },
      {
        id: 'marathon',
        name: 'Writing Marathon',
        description: '1 hour writing session',
        duration: 3600,
        goal: { type: 'both', timeTarget: 3600, wordTarget: 1000 },
        breakReminders: true,
        strictMode: true
      },
      {
        id: 'word-race',
        name: 'Word Race',
        description: 'Race to 500 words',
        duration: 1800,
        goal: { type: 'words', wordTarget: 500 },
        breakReminders: false,
        strictMode: false
      }
    ];
  }

  private initializeAchievements(): void {
    // Initialize with some basic achievements
    // More would be loaded from storage
  }

  private generateId(): string {
    return `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveData(): void {
    try {
      const data = {
        history: this.sprintHistory,
        templates: this.templates,
        achievements: this.achievements,
        challenges: this.challenges
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save sprint data:', error);
    }
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      this.sprintHistory = data.history || [];
      this.templates = [...this.templates, ...(data.templates || [])];
      this.achievements = data.achievements || [];
      this.challenges = data.challenges || [];
    } catch (error) {
      console.error('Failed to load sprint data:', error);
    }
  }
}

export const writingSprintsService = new WritingSprintsService();
export default writingSprintsService;