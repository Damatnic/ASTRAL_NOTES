/**
 * Writing Challenges and Goals Service
 * Gamification system for motivation and progress tracking
 */

import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project' | 'custom';
  title: string;
  description: string;
  targetType: 'words' | 'pages' | 'chapters' | 'time' | 'scenes';
  targetValue: number;
  currentValue: number;
  deadline: Date;
  createdAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'failed' | 'paused';
  reward?: GoalReward;
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM format
}

export interface WritingChallenge {
  id: string;
  name: string;
  description: string;
  category: 'speed' | 'consistency' | 'quality' | 'creativity' | 'endurance';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  timeLimit?: number; // in days
  startDate?: Date;
  endDate?: Date;
  participants?: string[]; // for community challenges
  leaderboard?: LeaderboardEntry[];
  status: 'available' | 'active' | 'completed' | 'expired';
  progress: number; // 0-100
}

export interface ChallengeRequirement {
  type: 'word_count' | 'streak' | 'speed' | 'genre' | 'prompt' | 'revision';
  value: number | string;
  description: string;
  completed: boolean;
}

export interface ChallengeReward {
  type: 'badge' | 'title' | 'theme' | 'template' | 'points';
  value: string | number;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GoalReward {
  type: 'badge' | 'milestone' | 'unlock';
  name: string;
  description: string;
  icon?: string;
}

export interface WritingStreak {
  currentStreak: number;
  bestStreak: number;
  lastWritingDate: Date;
  streakHistory: StreakEntry[];
  milestones: StreakMilestone[];
}

export interface StreakEntry {
  date: Date;
  wordCount: number;
  minutesWritten: number;
  goalsCompleted: string[];
}

export interface StreakMilestone {
  days: number;
  title: string;
  achieved: boolean;
  achievedDate?: Date;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  achievements: string[];
}

export interface WritingStats {
  totalWords: number;
  totalTime: number; // minutes
  averageWPM: number;
  bestWPM: number;
  totalGoalsCompleted: number;
  totalChallengesCompleted: number;
  currentLevel: number;
  experiencePoints: number;
  nextLevelXP: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

// Predefined challenges
const PRESET_CHALLENGES: Partial<WritingChallenge>[] = [
  {
    name: 'NaNoWriMo Sprint',
    description: 'Write 50,000 words in 30 days',
    category: 'endurance',
    difficulty: 'extreme',
    requirements: [
      { type: 'word_count', value: 50000, description: 'Write 50,000 words', completed: false },
      { type: 'streak', value: 30, description: 'Write every day for 30 days', completed: false }
    ]
  },
  {
    name: 'Morning Pages',
    description: 'Write 750 words every morning for a week',
    category: 'consistency',
    difficulty: 'easy',
    requirements: [
      { type: 'word_count', value: 750, description: 'Write 750 words daily', completed: false },
      { type: 'streak', value: 7, description: 'Complete 7 days in a row', completed: false }
    ]
  },
  {
    name: 'Flash Fiction Friday',
    description: 'Write a complete story in under 1000 words',
    category: 'creativity',
    difficulty: 'medium',
    requirements: [
      { type: 'word_count', value: 1000, description: 'Max 1000 words', completed: false },
      { type: 'prompt', value: 'complete', description: 'Complete story arc', completed: false }
    ]
  },
  {
    name: 'Speed Demon',
    description: 'Write 1000 words in 30 minutes',
    category: 'speed',
    difficulty: 'hard',
    requirements: [
      { type: 'word_count', value: 1000, description: 'Write 1000 words', completed: false },
      { type: 'speed', value: 30, description: 'Complete in 30 minutes', completed: false }
    ]
  },
  {
    name: 'Revision Marathon',
    description: 'Edit 10 chapters in a week',
    category: 'quality',
    difficulty: 'medium',
    requirements: [
      { type: 'revision', value: 10, description: 'Revise 10 chapters', completed: false },
      { type: 'streak', value: 7, description: 'Work for 7 consecutive days', completed: false }
    ]
  }
];

class WritingChallengesService {
  private static instance: WritingChallengesService;
  private eventEmitter: BrowserEventEmitter;
  
  private goals: Map<string, WritingGoal> = new Map();
  private challenges: Map<string, WritingChallenge> = new Map();
  private streak: WritingStreak;
  private stats: WritingStats;
  private activeGoalTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.eventEmitter = BrowserEventEmitter.getInstance();
    this.streak = this.initializeStreak();
    this.stats = this.initializeStats();
    this.loadData();
    this.initializePresetChallenges();
    this.setupDailyCheck();
    this.setupEventListeners();
  }

  static getInstance(): WritingChallengesService {
    if (!WritingChallengesService.instance) {
      WritingChallengesService.instance = new WritingChallengesService();
    }
    return WritingChallengesService.instance;
  }

  private initializeStreak(): WritingStreak {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastWritingDate: new Date(),
      streakHistory: [],
      milestones: [
        { days: 7, title: 'Week Warrior', achieved: false },
        { days: 30, title: 'Monthly Master', achieved: false },
        { days: 100, title: 'Century Writer', achieved: false },
        { days: 365, title: 'Year-long Dedication', achieved: false }
      ]
    };
  }

  private initializeStats(): WritingStats {
    return {
      totalWords: 0,
      totalTime: 0,
      averageWPM: 0,
      bestWPM: 0,
      totalGoalsCompleted: 0,
      totalChallengesCompleted: 0,
      currentLevel: 1,
      experiencePoints: 0,
      nextLevelXP: 1000,
      badges: []
    };
  }

  private initializePresetChallenges(): void {
    PRESET_CHALLENGES.forEach(preset => {
      const challenge: WritingChallenge = {
        id: this.generateId(),
        name: preset.name!,
        description: preset.description!,
        category: preset.category!,
        difficulty: preset.difficulty!,
        requirements: preset.requirements!,
        rewards: this.generateRewards(preset.difficulty!),
        status: 'available',
        progress: 0
      };
      this.challenges.set(challenge.id, challenge);
    });
  }

  private generateRewards(difficulty: string): ChallengeReward[] {
    const rewards: ChallengeReward[] = [];
    
    switch (difficulty) {
      case 'easy':
        rewards.push(
          { type: 'points', value: 100, rarity: 'common' },
          { type: 'badge', value: 'Starter', icon: '🌱', rarity: 'common' }
        );
        break;
      case 'medium':
        rewards.push(
          { type: 'points', value: 250, rarity: 'rare' },
          { type: 'badge', value: 'Achiever', icon: '⭐', rarity: 'rare' }
        );
        break;
      case 'hard':
        rewards.push(
          { type: 'points', value: 500, rarity: 'epic' },
          { type: 'badge', value: 'Expert', icon: '🏆', rarity: 'epic' },
          { type: 'theme', value: 'Exclusive Dark Theme', rarity: 'epic' }
        );
        break;
      case 'extreme':
        rewards.push(
          { type: 'points', value: 1000, rarity: 'legendary' },
          { type: 'badge', value: 'Legend', icon: '👑', rarity: 'legendary' },
          { type: 'title', value: 'Writing Champion', rarity: 'legendary' }
        );
        break;
    }
    
    return rewards;
  }

  // Goal Management
  createGoal(goal: Omit<WritingGoal, 'id' | 'createdAt' | 'currentValue' | 'status'>): WritingGoal {
    const newGoal: WritingGoal = {
      ...goal,
      id: this.generateId(),
      createdAt: new Date(),
      currentValue: 0,
      status: 'active'
    };

    this.goals.set(newGoal.id, newGoal);
    
    if (newGoal.reminderEnabled && newGoal.reminderTime) {
      this.setupGoalReminder(newGoal);
    }

    this.saveData();
    this.eventEmitter.emit('goal:created', newGoal);
    
    return newGoal;
  }

  updateGoalProgress(goalId: string, progress: number): void {
    const goal = this.goals.get(goalId);
    if (!goal || goal.status !== 'active') return;

    goal.currentValue = Math.min(progress, goal.targetValue);
    
    if (goal.currentValue >= goal.targetValue) {
      this.completeGoal(goalId);
    } else {
      this.saveData();
      this.eventEmitter.emit('goal:progress', { goal, progress: (goal.currentValue / goal.targetValue) * 100 });
    }
  }

  private completeGoal(goalId: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.status = 'completed';
    goal.completedAt = new Date();
    
    // Award XP and check for level up
    this.addExperience(100 * (goal.type === 'monthly' ? 3 : goal.type === 'weekly' ? 2 : 1));
    this.stats.totalGoalsCompleted++;
    
    // Award badge if applicable
    if (goal.reward) {
      this.unlockBadge({
        id: this.generateId(),
        name: goal.reward.name,
        description: goal.reward.description,
        icon: goal.reward.icon || '🎯',
        category: 'goals',
        rarity: 'rare',
        unlockedAt: new Date()
      });
    }

    this.saveData();
    this.eventEmitter.emit('goal:completed', goal);
  }

  // Challenge Management
  startChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== 'available') return;

    challenge.status = 'active';
    challenge.startDate = new Date();
    
    if (challenge.timeLimit) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + challenge.timeLimit);
      challenge.endDate = endDate;
    }

    this.saveData();
    this.eventEmitter.emit('challenge:started', challenge);
  }

  updateChallengeProgress(challengeId: string, requirementIndex: number): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== 'active') return;

    challenge.requirements[requirementIndex].completed = true;
    
    const completedCount = challenge.requirements.filter(r => r.completed).length;
    challenge.progress = (completedCount / challenge.requirements.length) * 100;
    
    if (challenge.progress >= 100) {
      this.completeChallenge(challengeId);
    } else {
      this.saveData();
      this.eventEmitter.emit('challenge:progress', challenge);
    }
  }

  private completeChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return;

    challenge.status = 'completed';
    this.stats.totalChallengesCompleted++;
    
    // Award rewards
    challenge.rewards.forEach(reward => {
      if (reward.type === 'points') {
        this.addExperience(reward.value as number);
      } else if (reward.type === 'badge') {
        this.unlockBadge({
          id: this.generateId(),
          name: reward.value as string,
          description: challenge.description,
          icon: reward.icon || '🏅',
          category: 'challenges',
          rarity: reward.rarity,
          unlockedAt: new Date()
        });
      }
    });

    this.saveData();
    this.eventEmitter.emit('challenge:completed', challenge);
  }

  // Streak Management
  recordWritingSession(wordCount: number, minutesWritten: number): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWrite = new Date(this.streak.lastWritingDate);
    lastWrite.setHours(0, 0, 0, 0);
    
    const daysSinceLastWrite = Math.floor((today.getTime() - lastWrite.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastWrite === 0) {
      // Same day - update existing entry
      const todayEntry = this.streak.streakHistory.find(e => {
        const entryDate = new Date(e.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
      
      if (todayEntry) {
        todayEntry.wordCount += wordCount;
        todayEntry.minutesWritten += minutesWritten;
      }
    } else if (daysSinceLastWrite === 1) {
      // Next day - continue streak
      this.streak.currentStreak++;
      this.streak.bestStreak = Math.max(this.streak.bestStreak, this.streak.currentStreak);
      this.addStreakEntry(wordCount, minutesWritten);
      this.checkStreakMilestones();
    } else {
      // Streak broken
      this.streak.currentStreak = 1;
      this.addStreakEntry(wordCount, minutesWritten);
    }
    
    this.streak.lastWritingDate = today;
    this.updateStats(wordCount, minutesWritten);
    this.saveData();
  }

  private addStreakEntry(wordCount: number, minutesWritten: number): void {
    this.streak.streakHistory.push({
      date: new Date(),
      wordCount,
      minutesWritten,
      goalsCompleted: []
    });
    
    // Keep only last 365 days
    if (this.streak.streakHistory.length > 365) {
      this.streak.streakHistory.shift();
    }
  }

  private checkStreakMilestones(): void {
    this.streak.milestones.forEach(milestone => {
      if (!milestone.achieved && this.streak.currentStreak >= milestone.days) {
        milestone.achieved = true;
        milestone.achievedDate = new Date();
        
        this.unlockBadge({
          id: this.generateId(),
          name: milestone.title,
          description: `Achieved ${milestone.days} day writing streak`,
          icon: '🔥',
          category: 'streaks',
          rarity: milestone.days >= 100 ? 'legendary' : milestone.days >= 30 ? 'epic' : 'rare',
          unlockedAt: new Date()
        });
      }
    });
  }

  // Stats and Progression
  private updateStats(wordCount: number, minutesWritten: number): void {
    this.stats.totalWords += wordCount;
    this.stats.totalTime += minutesWritten;
    
    const wpm = minutesWritten > 0 ? Math.round(wordCount / minutesWritten) : 0;
    this.stats.bestWPM = Math.max(this.stats.bestWPM, wpm);
    
    if (this.stats.totalTime > 0) {
      this.stats.averageWPM = Math.round(this.stats.totalWords / this.stats.totalTime);
    }
  }

  private addExperience(xp: number): void {
    this.stats.experiencePoints += xp;
    
    while (this.stats.experiencePoints >= this.stats.nextLevelXP) {
      this.stats.experiencePoints -= this.stats.nextLevelXP;
      this.stats.currentLevel++;
      this.stats.nextLevelXP = Math.floor(this.stats.nextLevelXP * 1.5);
      
      this.eventEmitter.emit('level:up', {
        newLevel: this.stats.currentLevel,
        nextLevelXP: this.stats.nextLevelXP
      });
    }
  }

  private unlockBadge(badge: Badge): void {
    if (!this.stats.badges.find(b => b.name === badge.name)) {
      this.stats.badges.push(badge);
      this.eventEmitter.emit('badge:unlocked', badge);
    }
  }

  // Reminders and Notifications
  private setupGoalReminder(goal: WritingGoal): void {
    if (!goal.reminderTime) return;
    
    const [hours, minutes] = goal.reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const msUntilReminder = reminderTime.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      this.eventEmitter.emit('goal:reminder', goal);
      // Reschedule for next day
      this.setupGoalReminder(goal);
    }, msUntilReminder);
    
    this.activeGoalTimers.set(goal.id, timer);
  }

  private setupDailyCheck(): void {
    // Check daily at midnight for streak maintenance
    const now = new Date();
    const midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      this.checkDailyGoals();
      this.checkExpiredChallenges();
      // Reschedule for next day
      setInterval(() => {
        this.checkDailyGoals();
        this.checkExpiredChallenges();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  private checkDailyGoals(): void {
    const now = new Date();
    
    this.goals.forEach(goal => {
      if (goal.status === 'active' && goal.deadline < now) {
        goal.status = 'failed';
        this.eventEmitter.emit('goal:failed', goal);
      }
    });
    
    this.saveData();
  }

  private checkExpiredChallenges(): void {
    const now = new Date();
    
    this.challenges.forEach(challenge => {
      if (challenge.status === 'active' && challenge.endDate && challenge.endDate < now) {
        challenge.status = 'expired';
        this.eventEmitter.emit('challenge:expired', challenge);
      }
    });
    
    this.saveData();
  }

  // Data Persistence
  private saveData(): void {
    const data = {
      goals: Array.from(this.goals.entries()),
      challenges: Array.from(this.challenges.entries()),
      streak: this.streak,
      stats: this.stats
    };
    localStorage.setItem('writingChallenges', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('writingChallenges');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.goals) {
          this.goals = new Map(data.goals);
        }
        if (data.challenges) {
          this.challenges = new Map(data.challenges);
        }
        if (data.streak) {
          this.streak = data.streak;
        }
        if (data.stats) {
          this.stats = data.stats;
        }
      } catch (error) {
        console.error('Failed to load writing challenges data:', error);
      }
    }
  }

  private setupEventListeners(): void {
    // Listen for word count updates from editor
    this.eventEmitter.on('editor:wordcount', ({ count, duration }) => {
      this.recordWritingSession(count, Math.floor(duration / 60));
    });
  }

  // Utility
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Public API
  getGoals(): WritingGoal[] {
    return Array.from(this.goals.values());
  }

  getActiveGoals(): WritingGoal[] {
    return Array.from(this.goals.values()).filter(g => g.status === 'active');
  }

  getChallenges(): WritingChallenge[] {
    return Array.from(this.challenges.values());
  }

  getAvailableChallenges(): WritingChallenge[] {
    return Array.from(this.challenges.values()).filter(c => c.status === 'available');
  }

  getActiveChallenges(): WritingChallenge[] {
    return Array.from(this.challenges.values()).filter(c => c.status === 'active');
  }

  getStreak(): WritingStreak {
    return this.streak;
  }

  getStats(): WritingStats {
    return this.stats;
  }

  getBadges(): Badge[] {
    return this.stats.badges;
  }

  getLeaderboard(challengeId: string): LeaderboardEntry[] {
    const challenge = this.challenges.get(challengeId);
    return challenge?.leaderboard || [];
  }

  cleanup(): void {
    // Clear all timers
    this.activeGoalTimers.forEach(timer => clearTimeout(timer));
    this.activeGoalTimers.clear();
  }
}

export default new WritingChallengesService();

export const writingChallengesService = WritingChallengesService.getInstance();