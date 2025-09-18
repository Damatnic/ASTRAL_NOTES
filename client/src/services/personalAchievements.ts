import { EventEmitter } from 'events';

export interface Achievement {
  id: string;
  type: 'milestone' | 'streak' | 'challenge' | 'breakthrough' | 'mastery' | 'special';
  category: 'productivity' | 'creativity' | 'quality' | 'consistency' | 'growth' | 'legacy';
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  points: number;
  badge?: {
    image: string;
    color: string;
    animation?: string;
  };
  celebration?: {
    message: string;
    sound?: string;
    animation?: string;
    confettiStyle?: string;
  };
  requirements: AchievementRequirement[];
  rewards?: AchievementReward[];
  metadata?: Record<string, any>;
}

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'quality' | 'time' | 'custom';
  metric: string;
  value: number;
  currentValue?: number;
  description: string;
}

export interface AchievementReward {
  type: 'badge' | 'title' | 'theme' | 'feature' | 'boost';
  value: string;
  description: string;
  unlocked?: boolean;
}

export interface Milestone {
  id: string;
  type: 'wordCount' | 'stories' | 'chapters' | 'time' | 'streak' | 'anniversary';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  targetDate?: Date;
  completedDate?: Date;
  celebration?: CelebrationConfig;
  memory?: MilestoneMemory;
  significance: 'personal' | 'professional' | 'creative' | 'transformative';
  emotion?: string;
  reflection?: string;
}

export interface CelebrationConfig {
  type: 'notification' | 'modal' | 'fullscreen' | 'subtle';
  duration: number;
  effects: CelebrationEffect[];
  message: string;
  shareOptions?: ShareOption[];
  customization?: {
    theme: string;
    music?: string;
    animation?: string;
  };
}

export interface CelebrationEffect {
  type: 'confetti' | 'fireworks' | 'sparkles' | 'glow' | 'pulse';
  intensity: 'low' | 'medium' | 'high';
  duration: number;
  colors?: string[];
}

export interface ShareOption {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'email' | 'internal';
  template: string;
  hashtags?: string[];
  enabled: boolean;
}

export interface MilestoneMemory {
  id: string;
  milestoneId: string;
  type: 'screenshot' | 'quote' | 'reflection' | 'stats';
  content: string;
  createdAt: Date;
  tags?: string[];
  emotion?: string;
  significance?: number;
}

export interface AchievementCollection {
  id: string;
  name: string;
  description: string;
  achievements: Achievement[];
  completionBonus?: AchievementReward;
  theme?: string;
  order?: number;
}

export interface PersonalJourney {
  id: string;
  userId: string;
  startDate: Date;
  totalPoints: number;
  level: number;
  title?: string;
  achievements: Achievement[];
  milestones: Milestone[];
  memories: MilestoneMemory[];
  stats: JourneyStats;
  recentCelebrations: CelebrationEvent[];
}

export interface JourneyStats {
  totalWords: number;
  totalStories: number;
  totalDays: number;
  longestStreak: number;
  favoriteTime?: string;
  favoriteGenre?: string;
  uniqueAchievements: number;
  legendaryAchievements: number;
  completionRate: number;
}

export interface CelebrationEvent {
  id: string;
  type: 'achievement' | 'milestone' | 'anniversary' | 'special';
  title: string;
  description: string;
  celebratedAt: Date;
  celebration: CelebrationConfig;
  shared?: boolean;
  memory?: MilestoneMemory;
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  lastUpdated: Date;
  estimatedCompletion?: Date;
  momentum?: number;
}

export interface CelebrationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  visualEffects: boolean;
  autoShare: boolean;
  preferredPlatforms: string[];
  celebrationIntensity: 'minimal' | 'moderate' | 'maximum';
  milestoneReminders: boolean;
  achievementNotifications: boolean;
}

class PersonalAchievementsService extends EventEmitter {
  private achievements: Map<string, Achievement> = new Map();
  private milestones: Map<string, Milestone> = new Map();
  private memories: Map<string, MilestoneMemory> = new Map();
  private collections: Map<string, AchievementCollection> = new Map();
  private journey: PersonalJourney | null = null;
  private celebrations: CelebrationEvent[] = [];
  private settings: CelebrationSettings = {
    enabled: true,
    soundEnabled: true,
    visualEffects: true,
    autoShare: false,
    preferredPlatforms: [],
    celebrationIntensity: 'moderate',
    milestoneReminders: true,
    achievementNotifications: true
  };

  constructor() {
    super();
    this.initializeAchievements();
    this.loadData();
  }

  private initializeAchievements(): void {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first-words',
        type: 'milestone',
        category: 'productivity',
        title: 'First Words',
        description: 'Write your first 100 words',
        icon: '✍️',
        rarity: 'common',
        progress: 0,
        maxProgress: 100,
        points: 10,
        requirements: [{
          type: 'count',
          metric: 'words',
          value: 100,
          description: 'Write 100 words'
        }],
        celebration: {
          message: 'Your journey begins! Every great story starts with a single word.',
          animation: 'fadeIn'
        }
      },
      {
        id: 'week-warrior',
        type: 'streak',
        category: 'consistency',
        title: 'Week Warrior',
        description: 'Write for 7 consecutive days',
        icon: '🔥',
        rarity: 'uncommon',
        progress: 0,
        maxProgress: 7,
        points: 50,
        requirements: [{
          type: 'streak',
          metric: 'days',
          value: 7,
          description: 'Maintain a 7-day streak'
        }],
        celebration: {
          message: 'One week strong! Consistency is building your writing muscle.',
          animation: 'bounce',
          confettiStyle: 'fire'
        }
      },
      {
        id: 'novel-navigator',
        type: 'milestone',
        category: 'productivity',
        title: 'Novel Navigator',
        description: 'Reach 50,000 words total',
        icon: '📚',
        rarity: 'epic',
        progress: 0,
        maxProgress: 50000,
        points: 500,
        requirements: [{
          type: 'count',
          metric: 'totalWords',
          value: 50000,
          description: 'Write 50,000 words total'
        }],
        rewards: [{
          type: 'title',
          value: 'Novelist',
          description: 'Earned the Novelist title'
        }],
        celebration: {
          message: 'You\'ve written a novel\'s worth of words! Your dedication is inspiring.',
          animation: 'fireworks',
          sound: 'epic-achievement'
        }
      },
      {
        id: 'creative-explorer',
        type: 'challenge',
        category: 'creativity',
        title: 'Creative Explorer',
        description: 'Try 5 different writing genres',
        icon: '🎨',
        rarity: 'rare',
        progress: 0,
        maxProgress: 5,
        points: 100,
        requirements: [{
          type: 'custom',
          metric: 'genres',
          value: 5,
          description: 'Write in 5 different genres'
        }],
        celebration: {
          message: 'Your creative range is expanding! Versatility makes you stronger.',
          animation: 'rainbow'
        }
      },
      {
        id: 'midnight-oil',
        type: 'special',
        category: 'growth',
        title: 'Midnight Oil',
        description: 'Write after midnight',
        icon: '🌙',
        rarity: 'uncommon',
        progress: 0,
        maxProgress: 1,
        points: 25,
        requirements: [{
          type: 'time',
          metric: 'session',
          value: 1,
          description: 'Complete a writing session after midnight'
        }],
        celebration: {
          message: 'When inspiration calls, you answer! Late night creativity unlocked.',
          animation: 'twinkle'
        }
      },
      {
        id: 'writing-master',
        type: 'mastery',
        category: 'legacy',
        title: 'Writing Master',
        description: 'Achieve mastery in all writing skills',
        icon: '👑',
        rarity: 'legendary',
        progress: 0,
        maxProgress: 10,
        points: 1000,
        requirements: [{
          type: 'custom',
          metric: 'mastery',
          value: 10,
          description: 'Master 10 writing skills'
        }],
        rewards: [
          {
            type: 'badge',
            value: 'master-badge',
            description: 'Legendary Master Badge'
          },
          {
            type: 'title',
            value: 'Master Wordsmith',
            description: 'The prestigious Master Wordsmith title'
          }
        ],
        celebration: {
          message: 'You have achieved true mastery! Your journey inspires others.',
          animation: 'legendary',
          sound: 'legendary-achievement'
        }
      }
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private loadData(): void {
    const savedAchievements = localStorage.getItem('personalAchievements');
    if (savedAchievements) {
      const parsed = JSON.parse(savedAchievements);
      Object.entries(parsed).forEach(([id, achievement]) => {
        this.achievements.set(id, achievement as Achievement);
      });
    }

    const savedMilestones = localStorage.getItem('personalMilestones');
    if (savedMilestones) {
      const parsed = JSON.parse(savedMilestones);
      Object.entries(parsed).forEach(([id, milestone]) => {
        this.milestones.set(id, milestone as Milestone);
      });
    }

    const savedMemories = localStorage.getItem('milestoneMemories');
    if (savedMemories) {
      const parsed = JSON.parse(savedMemories);
      Object.entries(parsed).forEach(([id, memory]) => {
        this.memories.set(id, memory as MilestoneMemory);
      });
    }

    const savedJourney = localStorage.getItem('personalJourney');
    if (savedJourney) {
      this.journey = JSON.parse(savedJourney);
    }

    const savedCelebrations = localStorage.getItem('celebrationEvents');
    if (savedCelebrations) {
      this.celebrations = JSON.parse(savedCelebrations);
    }

    const savedSettings = localStorage.getItem('celebrationSettings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  }

  private saveData(): void {
    localStorage.setItem('personalAchievements', 
      JSON.stringify(Object.fromEntries(this.achievements))
    );
    localStorage.setItem('personalMilestones', 
      JSON.stringify(Object.fromEntries(this.milestones))
    );
    localStorage.setItem('milestoneMemories', 
      JSON.stringify(Object.fromEntries(this.memories))
    );
    if (this.journey) {
      localStorage.setItem('personalJourney', JSON.stringify(this.journey));
    }
    localStorage.setItem('celebrationEvents', JSON.stringify(this.celebrations));
    localStorage.setItem('celebrationSettings', JSON.stringify(this.settings));
  }

  public checkAchievementProgress(metrics: Record<string, number>): Achievement[] {
    const unlocked: Achievement[] = [];

    this.achievements.forEach(achievement => {
      if (achievement.unlockedAt) return;

      let allRequirementsMet = true;
      let totalProgress = 0;

      achievement.requirements.forEach(req => {
        const currentValue = metrics[req.metric] || 0;
        
        if (currentValue < req.value) {
          allRequirementsMet = false;
        }
        
        totalProgress += Math.min(currentValue / req.value, 1);
      });

      achievement.progress = Math.floor(
        (totalProgress / achievement.requirements.length) * achievement.maxProgress
      );

      if (allRequirementsMet && !achievement.unlockedAt) {
        achievement.unlockedAt = new Date();
        unlocked.push(achievement);
        this.celebrateAchievement(achievement);
      }
    });

    if (unlocked.length > 0) {
      this.updateJourneyStats();
      this.saveData();
      this.emit('achievementsUnlocked', unlocked);
    }

    return unlocked;
  }

  private celebrateAchievement(achievement: Achievement): void {
    if (!this.settings.enabled) return;

    const celebration: CelebrationEvent = {
      id: `cel-${Date.now()}`,
      type: 'achievement',
      title: achievement.title,
      description: achievement.description,
      celebratedAt: new Date(),
      celebration: {
        type: this.getCelebrationType(achievement.rarity),
        duration: this.getCelebrationDuration(achievement.rarity),
        effects: this.getCelebrationEffects(achievement.rarity),
        message: achievement.celebration?.message || `Congratulations! You've unlocked ${achievement.title}!`
      }
    };

    this.celebrations.push(celebration);
    this.emit('celebrate', celebration);

    if (this.settings.achievementNotifications) {
      this.emit('notification', {
        type: 'achievement',
        title: `Achievement Unlocked: ${achievement.title}`,
        message: achievement.description,
        icon: achievement.icon
      });
    }
  }

  private getCelebrationType(rarity: string): 'notification' | 'modal' | 'fullscreen' | 'subtle' {
    switch (rarity) {
      case 'legendary': return 'fullscreen';
      case 'epic': return 'modal';
      case 'rare': return 'modal';
      default: return 'notification';
    }
  }

  private getCelebrationDuration(rarity: string): number {
    switch (rarity) {
      case 'legendary': return 5000;
      case 'epic': return 4000;
      case 'rare': return 3000;
      default: return 2000;
    }
  }

  private getCelebrationEffects(rarity: string): CelebrationEffect[] {
    switch (rarity) {
      case 'legendary':
        return [
          { type: 'fireworks', intensity: 'high', duration: 5000 },
          { type: 'sparkles', intensity: 'high', duration: 5000, colors: ['gold', 'silver'] }
        ];
      case 'epic':
        return [
          { type: 'confetti', intensity: 'high', duration: 4000 },
          { type: 'glow', intensity: 'medium', duration: 4000 }
        ];
      case 'rare':
        return [
          { type: 'confetti', intensity: 'medium', duration: 3000 },
          { type: 'pulse', intensity: 'medium', duration: 3000 }
        ];
      default:
        return [
          { type: 'sparkles', intensity: 'low', duration: 2000 }
        ];
    }
  }

  public createMilestone(milestone: Omit<Milestone, 'id'>): Milestone {
    const newMilestone: Milestone = {
      ...milestone,
      id: `milestone-${Date.now()}`
    };

    this.milestones.set(newMilestone.id, newMilestone);
    this.saveData();
    this.emit('milestoneCreated', newMilestone);

    if (this.settings.milestoneReminders) {
      this.scheduleMilestoneReminders(newMilestone);
    }

    return newMilestone;
  }

  private scheduleMilestoneReminders(milestone: Milestone): void {
    if (!milestone.targetDate) return;

    const now = new Date();
    const target = new Date(milestone.targetDate);
    const timeUntilTarget = target.getTime() - now.getTime();

    const reminderPoints = [0.5, 0.75, 0.9];
    reminderPoints.forEach(point => {
      const reminderTime = now.getTime() + (timeUntilTarget * point);
      
      setTimeout(() => {
        this.emit('milestoneReminder', {
          milestone,
          progress: (milestone.currentValue / milestone.targetValue) * 100,
          daysRemaining: Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        });
      }, reminderTime - now.getTime());
    });
  }

  public updateMilestoneProgress(milestoneId: string, value: number): void {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return;

    milestone.currentValue = value;

    if (value >= milestone.targetValue && !milestone.completedDate) {
      milestone.completedDate = new Date();
      this.celebrateMilestone(milestone);
    }

    this.saveData();
    this.emit('milestoneProgress', milestone);
  }

  private celebrateMilestone(milestone: Milestone): void {
    if (!this.settings.enabled) return;

    const defaultCelebration: CelebrationConfig = {
      type: 'modal',
      duration: 4000,
      effects: [
        { type: 'confetti', intensity: 'high', duration: 4000 },
        { type: 'glow', intensity: 'medium', duration: 4000 }
      ],
      message: `Incredible! You've reached ${milestone.title}!`,
      shareOptions: [
        {
          platform: 'twitter',
          template: `Just reached a major milestone: ${milestone.title}! #WritingJourney #AmWriting`,
          enabled: true
        }
      ]
    };

    const celebration: CelebrationEvent = {
      id: `cel-${Date.now()}`,
      type: 'milestone',
      title: milestone.title,
      description: milestone.description,
      celebratedAt: new Date(),
      celebration: milestone.celebration || defaultCelebration
    };

    this.celebrations.push(celebration);
    this.emit('celebrate', celebration);

    this.promptForMemory(milestone);
  }

  private promptForMemory(milestone: Milestone): void {
    this.emit('memoryPrompt', {
      milestone,
      suggestions: [
        'How do you feel about reaching this milestone?',
        'What helped you get here?',
        'What\'s next on your journey?',
        'Any advice for your future self?'
      ]
    });
  }

  public createMemory(
    milestoneId: string,
    type: MilestoneMemory['type'],
    content: string,
    metadata?: Partial<MilestoneMemory>
  ): MilestoneMemory {
    const memory: MilestoneMemory = {
      id: `memory-${Date.now()}`,
      milestoneId,
      type,
      content,
      createdAt: new Date(),
      ...metadata
    };

    this.memories.set(memory.id, memory);
    
    const milestone = this.milestones.get(milestoneId);
    if (milestone) {
      milestone.memory = memory;
    }

    this.saveData();
    this.emit('memoryCreated', memory);

    return memory;
  }

  public getAchievementProgress(): AchievementProgress[] {
    return Array.from(this.achievements.values()).map(achievement => ({
      achievementId: achievement.id,
      progress: achievement.progress,
      lastUpdated: new Date(),
      momentum: this.calculateMomentum(achievement),
      estimatedCompletion: this.estimateCompletion(achievement)
    }));
  }

  private calculateMomentum(achievement: Achievement): number {
    const recentProgress = this.getRecentProgress(achievement.id);
    if (recentProgress.length < 2) return 0;

    const deltas = [];
    for (let i = 1; i < recentProgress.length; i++) {
      deltas.push(recentProgress[i] - recentProgress[i - 1]);
    }

    return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  }

  private getRecentProgress(achievementId: string): number[] {
    return [];
  }

  private estimateCompletion(achievement: Achievement): Date | undefined {
    if (achievement.unlockedAt) return undefined;
    
    const momentum = this.calculateMomentum(achievement);
    if (momentum <= 0) return undefined;

    const remaining = achievement.maxProgress - achievement.progress;
    const daysToCompletion = remaining / momentum;

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + Math.ceil(daysToCompletion));
    
    return estimatedDate;
  }

  private updateJourneyStats(): void {
    if (!this.journey) {
      this.journey = {
        id: `journey-${Date.now()}`,
        userId: 'current-user',
        startDate: new Date(),
        totalPoints: 0,
        level: 1,
        achievements: [],
        milestones: [],
        memories: [],
        stats: {
          totalWords: 0,
          totalStories: 0,
          totalDays: 0,
          longestStreak: 0,
          uniqueAchievements: 0,
          legendaryAchievements: 0,
          completionRate: 0
        },
        recentCelebrations: []
      };
    }

    const unlockedAchievements = Array.from(this.achievements.values())
      .filter(a => a.unlockedAt);

    this.journey.achievements = unlockedAchievements;
    this.journey.totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
    this.journey.level = Math.floor(this.journey.totalPoints / 100) + 1;
    
    this.journey.stats.uniqueAchievements = unlockedAchievements.length;
    this.journey.stats.legendaryAchievements = unlockedAchievements
      .filter(a => a.rarity === 'legendary').length;
    
    this.journey.stats.completionRate = 
      (unlockedAchievements.length / this.achievements.size) * 100;

    this.journey.milestones = Array.from(this.milestones.values());
    this.journey.memories = Array.from(this.memories.values());
    this.journey.recentCelebrations = this.celebrations.slice(-10);
  }

  public getJourney(): PersonalJourney | null {
    return this.journey;
  }

  public getUpcomingMilestones(): Milestone[] {
    return Array.from(this.milestones.values())
      .filter(m => !m.completedDate)
      .sort((a, b) => {
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      });
  }

  public getRecentCelebrations(limit: number = 10): CelebrationEvent[] {
    return this.celebrations
      .sort((a, b) => new Date(b.celebratedAt).getTime() - new Date(a.celebratedAt).getTime())
      .slice(0, limit);
  }

  public updateSettings(settings: Partial<CelebrationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveData();
    this.emit('settingsUpdated', this.settings);
  }

  public getAchievementCollections(): AchievementCollection[] {
    return Array.from(this.collections.values());
  }

  public shareAchievement(achievementId: string, platform: string): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;

    const shareData = {
      title: `Achievement Unlocked: ${achievement.title}`,
      text: achievement.description,
      url: window.location.href,
      hashtags: ['WritingJourney', 'Achievement', 'AmWriting']
    };

    this.emit('share', { achievement, platform, shareData });
  }

  public exportJourney(): string {
    const exportData = {
      journey: this.journey,
      achievements: Array.from(this.achievements.values()),
      milestones: Array.from(this.milestones.values()),
      memories: Array.from(this.memories.values()),
      celebrations: this.celebrations,
      exportDate: new Date()
    };

    return JSON.stringify(exportData, null, 2);
  }

  public getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return Array.from(this.achievements.values())
      .filter(a => a.category === category);
  }

  public getAchievementsByRarity(rarity: Achievement['rarity']): Achievement[] {
    return Array.from(this.achievements.values())
      .filter(a => a.rarity === rarity);
  }

  public calculateCompletionPercentage(): number {
    const total = this.achievements.size;
    const unlocked = Array.from(this.achievements.values())
      .filter(a => a.unlockedAt).length;
    
    return (unlocked / total) * 100;
  }

  public getNextAchievements(limit: number = 3): Achievement[] {
    return Array.from(this.achievements.values())
      .filter(a => !a.unlockedAt)
      .sort((a, b) => {
        const aCompletion = a.progress / a.maxProgress;
        const bCompletion = b.progress / b.maxProgress;
        return bCompletion - aCompletion;
      })
      .slice(0, limit);
  }

  public celebrateSpecialOccasion(
    title: string,
    description: string,
    celebrationConfig?: Partial<CelebrationConfig>
  ): void {
    const defaultConfig: CelebrationConfig = {
      type: 'fullscreen',
      duration: 5000,
      effects: [
        { type: 'fireworks', intensity: 'high', duration: 5000 },
        { type: 'confetti', intensity: 'high', duration: 5000 }
      ],
      message: description
    };

    const celebration: CelebrationEvent = {
      id: `cel-${Date.now()}`,
      type: 'special',
      title,
      description,
      celebratedAt: new Date(),
      celebration: { ...defaultConfig, ...celebrationConfig }
    };

    this.celebrations.push(celebration);
    this.emit('celebrate', celebration);
    this.saveData();
  }
}

export const personalAchievementsService = new PersonalAchievementsService();
export default personalAchievementsService;