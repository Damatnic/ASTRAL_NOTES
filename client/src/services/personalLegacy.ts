import { EventEmitter } from 'events';

export interface LegacyItem {
  id: string;
  type: 'story' | 'poem' | 'article' | 'essay' | 'novel' | 'screenplay' | 'journal' | 'reflection' | 'achievement' | 'milestone';
  category: 'creative_work' | 'personal_growth' | 'skill_development' | 'life_event' | 'wisdom' | 'collaboration';
  title: string;
  description: string;
  content?: string;
  createdDate: Date;
  lastModified: Date;
  significance: 'personal' | 'meaningful' | 'important' | 'landmark' | 'transformative';
  status: 'draft' | 'completed' | 'published' | 'shared' | 'archived' | 'featured';
  tags: string[];
  metadata: LegacyMetadata;
  portfolio: PortfolioEntry;
  preservation: PreservationInfo;
  sharing: SharingSettings;
  impact: ImpactMetrics;
  personalNotes: string;
  futureValue: string;
}

export interface LegacyMetadata {
  wordCount?: number;
  timeSpent: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  genre?: string[];
  audience?: string;
  purpose: string;
  inspiration: string[];
  tools: string[];
  collaborators?: string[];
  location: string;
  mood: string;
  context: string;
  version: number;
  originalDate?: Date;
}

export interface PortfolioEntry {
  featured: boolean;
  displayOrder: number;
  presentation: {
    thumbnail?: string;
    excerpt: string;
    highlights: string[];
    showcase: boolean;
  };
  categories: string[];
  skills: string[];
  achievements: string[];
  testimonials: Testimonial[];
  metrics: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    downloads?: number;
  };
}

export interface Testimonial {
  id: string;
  source: string;
  sourceType: 'self' | 'peer' | 'mentor' | 'reader' | 'professional' | 'family';
  content: string;
  date: Date;
  context: string;
  verified: boolean;
  public: boolean;
}

export interface PreservationInfo {
  backupLevel: 'basic' | 'enhanced' | 'comprehensive' | 'archival';
  formats: string[];
  locations: string[];
  lastBackup: Date;
  integrity: {
    checksum?: string;
    verified: Date;
    status: 'intact' | 'corrupted' | 'missing' | 'unknown';
  };
  accessibility: {
    format: string;
    compatibility: string[];
    futureProofing: number; // 0-1 score
  };
  metadata: {
    originalFormat: string;
    creationTool: string;
    systemInfo: string;
    dependencies: string[];
  };
}

export interface SharingSettings {
  visibility: 'private' | 'family' | 'friends' | 'community' | 'public';
  permissions: {
    view: boolean;
    comment: boolean;
    share: boolean;
    download: boolean;
    modify: boolean;
  };
  platforms: string[];
  sharedWith: SharedContact[];
  shareHistory: ShareEvent[];
  embargo?: {
    releaseDate: Date;
    reason: string;
  };
}

export interface SharedContact {
  id: string;
  name: string;
  relationship: string;
  permissions: string[];
  sharedDate: Date;
  lastAccess?: Date;
  feedback?: string;
}

export interface ShareEvent {
  date: Date;
  platform: string;
  audience: string;
  response: string;
  metrics: Record<string, number>;
  notes: string;
}

export interface ImpactMetrics {
  personal: {
    growth: string[];
    insights: string[];
    satisfaction: number;
    pride: number;
    transformation: string;
  };
  social: {
    feedback: string[];
    influence: string[];
    connections: string[];
    recognition: string[];
  };
  professional: {
    skills: string[];
    opportunities: string[];
    portfolio: string[];
    credibility: string[];
  };
  creative: {
    breakthroughs: string[];
    innovations: string[];
    style: string[];
    voice: string[];
  };
  legacy: {
    timesCitedByOthers: number;
    influence: string[];
    preservation: string[];
    futureValue: string[];
  };
}

export interface LegacyCollection {
  id: string;
  name: string;
  description: string;
  type: 'chronological' | 'thematic' | 'genre' | 'skill' | 'project' | 'achievement' | 'custom';
  items: string[]; // LegacyItem IDs
  metadata: {
    created: Date;
    lastUpdated: Date;
    totalItems: number;
    totalWords: number;
    timeSpan: { start: Date; end: Date };
    themes: string[];
    evolution: string[];
  };
  presentation: {
    coverImage?: string;
    introduction: string;
    narrative: string;
    highlights: string[];
    milestones: string[];
  };
  sharing: SharingSettings;
  significance: string;
  futureGoals: string[];
}

export interface WritingTimeline {
  id: string;
  title: string;
  description: string;
  timespan: { start: Date; end: Date };
  events: TimelineEvent[];
  milestones: TimelineMilestone[];
  themes: string[];
  growth: GrowthIndicator[];
  visualization: {
    style: 'linear' | 'spiral' | 'branching' | 'circular';
    highlights: string[];
    annotations: TimelineAnnotation[];
  };
  narrative: string;
  insights: string[];
  futureProjections: string[];
}

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'creation' | 'achievement' | 'breakthrough' | 'challenge' | 'collaboration' | 'recognition' | 'learning';
  title: string;
  description: string;
  significance: number; // 1-10
  relatedItems: string[];
  tags: string[];
  mood: string;
  impact: string;
  context: string;
  lessons: string[];
}

export interface TimelineMilestone {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'personal' | 'creative' | 'professional' | 'skill' | 'recognition' | 'breakthrough';
  significance: 'minor' | 'moderate' | 'major' | 'transformative';
  requirements: string[];
  achievements: string[];
  celebration: string;
  impact: string[];
  nextGoals: string[];
  commemoration: CommemorationRecord;
}

export interface CommemorationRecord {
  date: Date;
  type: 'reflection' | 'celebration' | 'documentation' | 'sharing' | 'gratitude';
  content: string;
  participants: string[];
  memories: string[];
  artifacts: string[];
  emotions: string[];
  significance: string;
}

export interface GrowthIndicator {
  date: Date;
  area: string;
  before: string;
  after: string;
  catalyst: string;
  evidence: string[];
  measurement: number; // growth score
  sustainability: string;
  impact: string[];
}

export interface TimelineAnnotation {
  id: string;
  date: Date;
  position: { x: number; y: number };
  type: 'note' | 'insight' | 'connection' | 'reflection' | 'future_self';
  content: string;
  author: 'current_self' | 'past_self' | 'future_self' | 'external';
  visibility: boolean;
  connections: string[]; // IDs of connected events/milestones
}

export interface LegacyAnalytics {
  overview: {
    totalItems: number;
    totalWords: number;
    totalHours: number;
    timespan: number; // days
    averageItemsPerMonth: number;
    productivityTrend: 'increasing' | 'stable' | 'decreasing';
  };
  categories: {
    distribution: Record<string, number>;
    trends: Record<string, 'growing' | 'stable' | 'declining'>;
    evolution: CategoryEvolution[];
  };
  quality: {
    averageSignificance: number;
    featuredItems: number;
    completionRate: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
  impact: {
    personalGrowth: number;
    socialInfluence: number;
    professionalDevelopment: number;
    creativeBreakthroughs: number;
    overallLegacyScore: number;
  };
  patterns: {
    peakProductivityPeriods: PeakPeriod[];
    creativePhases: CreativePhase[];
    thematicEvolution: ThemeEvolution[];
    skillProgression: SkillProgression[];
  };
  predictions: {
    nextMilestone: PredictedMilestone;
    futureThemes: string[];
    legacyProjection: LegacyProjection;
    recommendations: string[];
  };
}

export interface CategoryEvolution {
  category: string;
  timeline: { date: Date; count: number; quality: number }[];
  growth: number;
  significance: number;
  futureProjection: string;
}

export interface PeakPeriod {
  start: Date;
  end: Date;
  type: 'productivity' | 'creativity' | 'quality' | 'breakthrough';
  metrics: Record<string, number>;
  factors: string[];
  items: string[];
  insights: string[];
}

export interface CreativePhase {
  id: string;
  name: string;
  start: Date;
  end?: Date;
  characteristics: string[];
  themes: string[];
  style: string[];
  influences: string[];
  output: { type: string; count: number }[];
  evolution: string;
  significance: string;
}

export interface ThemeEvolution {
  theme: string;
  appearances: { date: Date; context: string; significance: number }[];
  evolution: string;
  currentState: string;
  futureDirection: string;
}

export interface SkillProgression {
  skill: string;
  progression: { date: Date; level: number; evidence: string[] }[];
  trend: 'accelerating' | 'steady' | 'plateauing' | 'declining';
  currentLevel: number;
  projection: string;
}

export interface PredictedMilestone {
  title: string;
  estimatedDate: Date;
  confidence: number;
  requirements: string[];
  preparation: string[];
  significance: string;
}

export interface LegacyProjection {
  timeframe: '1_year' | '5_years' | '10_years' | 'lifetime';
  estimatedItems: number;
  expectedThemes: string[];
  skillMastery: string[];
  impactPotential: number;
  legacyStatements: string[];
  continuationPlan: string[];
}

export interface LegacyWill {
  id: string;
  createdDate: Date;
  lastUpdated: Date;
  instructions: WillInstruction[];
  preservation: PreservationPlan;
  distribution: DistributionPlan;
  continuity: ContinuityPlan;
  personalMessages: PersonalMessage[];
  digitalAssets: DigitalAsset[];
  physicalArtifacts: PhysicalArtifact[];
  wishes: LegacyWish[];
}

export interface WillInstruction {
  id: string;
  category: 'preservation' | 'sharing' | 'destruction' | 'continuation' | 'memorial';
  priority: 'critical' | 'important' | 'preferred' | 'optional';
  instruction: string;
  conditions: string[];
  timeline: string;
  responsible: string[];
  verification: string;
}

export interface PreservationPlan {
  methods: string[];
  locations: string[];
  formats: string[];
  redundancy: number;
  accessInstructions: string;
  maintenanceSchedule: string;
  futureProofing: string[];
}

export interface DistributionPlan {
  recipients: LegacyRecipient[];
  publicReleases: PublicRelease[];
  archives: ArchiveDeposit[];
  restrictions: string[];
  timeline: string;
}

export interface LegacyRecipient {
  id: string;
  name: string;
  relationship: string;
  items: string[];
  message: string;
  conditions: string[];
  contact: string;
}

export interface PublicRelease {
  id: string;
  items: string[];
  platform: string;
  timing: string;
  purpose: string;
  audience: string;
  presentation: string;
}

export interface ArchiveDeposit {
  id: string;
  institution: string;
  items: string[];
  terms: string[];
  access: string;
  purpose: string;
}

export interface ContinuityPlan {
  unfinishedWorks: UnfinishedWork[];
  futureProjects: FutureProject[];
  collaborators: ContinuityCollaborator[];
  inspiration: InspirationResource[];
  guidelines: string[];
}

export interface UnfinishedWork {
  id: string;
  title: string;
  progress: number;
  materials: string[];
  notes: string;
  vision: string;
  continuation: string;
  collaborator?: string;
}

export interface FutureProject {
  id: string;
  concept: string;
  inspiration: string;
  approach: string;
  materials: string[];
  timeline: string;
  significance: string;
}

export interface ContinuityCollaborator {
  name: string;
  role: string;
  expertise: string[];
  relationship: string;
  instructions: string;
  projects: string[];
}

export interface InspirationResource {
  type: string;
  source: string;
  description: string;
  relevance: string;
  access: string;
  notes: string;
}

export interface PersonalMessage {
  id: string;
  recipient: string;
  relationship: string;
  message: string;
  context: string;
  delivery: string;
  timing: string;
}

export interface DigitalAsset {
  id: string;
  type: string;
  location: string;
  access: string;
  value: string;
  instructions: string;
  backup: string;
}

export interface PhysicalArtifact {
  id: string;
  type: string;
  description: string;
  location: string;
  significance: string;
  care: string;
  distribution: string;
}

export interface LegacyWish {
  id: string;
  category: 'memorial' | 'celebration' | 'continuation' | 'inspiration' | 'remembrance';
  wish: string;
  importance: number;
  feasibility: string;
  responsibility: string;
  timeline: string;
}

class PersonalLegacyService extends EventEmitter {
  private legacyItems: Map<string, LegacyItem> = new Map();
  private legacyCollections: Map<string, LegacyCollection> = new Map();
  private writingTimeline: WritingTimeline | null = null;
  private legacyAnalytics: LegacyAnalytics | null = null;
  private legacyWill: LegacyWill | null = null;

  constructor() {
    super();
    this.loadDataFromStorage();
    this.initializeTimeline();
    this.scheduleAnalyticsUpdate();
  }

  async createLegacyItem(itemData: Omit<LegacyItem, 'id' | 'createdDate' | 'lastModified' | 'impact' | 'portfolio' | 'preservation' | 'sharing'>): Promise<LegacyItem> {
    const item: LegacyItem = {
      ...itemData,
      id: `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdDate: new Date(),
      lastModified: new Date(),
      impact: this.initializeImpactMetrics(),
      portfolio: this.initializePortfolioEntry(),
      preservation: this.initializePreservationInfo(),
      sharing: this.initializeSharingSettings()
    };

    this.legacyItems.set(item.id, item);
    
    // Add to timeline if timeline exists
    if (this.writingTimeline) {
      await this.addTimelineEvent(item);
    }

    // Update analytics
    await this.updateAnalytics();

    await this.saveDataToStorage();
    this.emit('legacyItemCreated', item);

    return item;
  }

  private initializeImpactMetrics(): ImpactMetrics {
    return {
      personal: {
        growth: [],
        insights: [],
        satisfaction: 5,
        pride: 5,
        transformation: ''
      },
      social: {
        feedback: [],
        influence: [],
        connections: [],
        recognition: []
      },
      professional: {
        skills: [],
        opportunities: [],
        portfolio: [],
        credibility: []
      },
      creative: {
        breakthroughs: [],
        innovations: [],
        style: [],
        voice: []
      },
      legacy: {
        timesCitedByOthers: 0,
        influence: [],
        preservation: [],
        futureValue: []
      }
    };
  }

  private initializePortfolioEntry(): PortfolioEntry {
    return {
      featured: false,
      displayOrder: 0,
      presentation: {
        excerpt: '',
        highlights: [],
        showcase: false
      },
      categories: [],
      skills: [],
      achievements: [],
      testimonials: [],
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        downloads: 0
      }
    };
  }

  private initializePreservationInfo(): PreservationInfo {
    return {
      backupLevel: 'basic',
      formats: ['text'],
      locations: ['local'],
      lastBackup: new Date(),
      integrity: {
        verified: new Date(),
        status: 'intact'
      },
      accessibility: {
        format: 'text',
        compatibility: ['utf-8'],
        futureProofing: 0.8
      },
      metadata: {
        originalFormat: 'text',
        creationTool: 'ASTRAL_NOTES',
        systemInfo: navigator.userAgent,
        dependencies: []
      }
    };
  }

  private initializeSharingSettings(): SharingSettings {
    return {
      visibility: 'private',
      permissions: {
        view: false,
        comment: false,
        share: false,
        download: false,
        modify: false
      },
      platforms: [],
      sharedWith: [],
      shareHistory: []
    };
  }

  async createLegacyCollection(collectionData: Omit<LegacyCollection, 'id' | 'metadata'>): Promise<LegacyCollection> {
    const items = collectionData.items.map(itemId => this.legacyItems.get(itemId)).filter(Boolean) as LegacyItem[];
    
    const collection: LegacyCollection = {
      ...collectionData,
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        totalItems: items.length,
        totalWords: items.reduce((sum, item) => sum + (item.metadata.wordCount || 0), 0),
        timeSpan: this.calculateTimeSpan(items),
        themes: this.extractThemes(items),
        evolution: this.analyzeEvolution(items)
      }
    };

    this.legacyCollections.set(collection.id, collection);
    await this.saveDataToStorage();
    
    this.emit('collectionCreated', collection);
    return collection;
  }

  private calculateTimeSpan(items: LegacyItem[]): { start: Date; end: Date } {
    if (items.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    const dates = items.map(item => item.createdDate);
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private extractThemes(items: LegacyItem[]): string[] {
    const themeCount: Record<string, number> = {};
    
    items.forEach(item => {
      item.tags.forEach(tag => {
        themeCount[tag] = (themeCount[tag] || 0) + 1;
      });
    });

    return Object.entries(themeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme]) => theme);
  }

  private analyzeEvolution(items: LegacyItem[]): string[] {
    const sortedItems = items.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
    const evolution: string[] = [];

    // Analyze progression in types
    const typeProgression = this.analyzeTypeProgression(sortedItems);
    if (typeProgression) evolution.push(typeProgression);

    // Analyze significance growth
    const significanceGrowth = this.analyzeSignificanceGrowth(sortedItems);
    if (significanceGrowth) evolution.push(significanceGrowth);

    // Analyze thematic development
    const thematicDevelopment = this.analyzeThematicDevelopment(sortedItems);
    if (thematicDevelopment) evolution.push(thematicDevelopment);

    return evolution;
  }

  private analyzeTypeProgression(items: LegacyItem[]): string | null {
    if (items.length < 3) return null;

    const typeFrequency: Record<string, number[]> = {};
    
    items.forEach((item, index) => {
      if (!typeFrequency[item.type]) {
        typeFrequency[item.type] = [];
      }
      typeFrequency[item.type].push(index);
    });

    // Find dominant type progression
    const progressions = Object.entries(typeFrequency)
      .filter(([_, indices]) => indices.length >= 2)
      .map(([type, indices]) => {
        const span = indices[indices.length - 1] - indices[0];
        const density = indices.length / span;
        return { type, density, count: indices.length };
      })
      .sort((a, b) => b.density - a.density);

    if (progressions.length > 0) {
      const dominant = progressions[0];
      return `Strong progression in ${dominant.type} writing (${dominant.count} works)`;
    }

    return null;
  }

  private analyzeSignificanceGrowth(items: LegacyItem[]): string | null {
    if (items.length < 5) return null;

    const significanceValues = {
      personal: 1,
      meaningful: 2,
      important: 3,
      landmark: 4,
      transformative: 5
    };

    const significanceProgression = items.map(item => significanceValues[item.significance]);
    
    const firstHalf = significanceProgression.slice(0, Math.floor(items.length / 2));
    const secondHalf = significanceProgression.slice(Math.floor(items.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const growth = secondAvg - firstAvg;

    if (growth > 0.5) {
      return `Notable increase in work significance over time (${growth.toFixed(1)} point improvement)`;
    } else if (growth < -0.5) {
      return `Shift towards more personal, intimate works over time`;
    }

    return null;
  }

  private analyzeThematicDevelopment(items: LegacyItem[]): string | null {
    if (items.length < 4) return null;

    const timeSegments = this.divideIntoTimeSegments(items, 3);
    const themeEvolution = timeSegments.map(segment => {
      const themes = this.extractThemes(segment);
      return themes.slice(0, 3);
    });

    const earlyThemes = themeEvolution[0];
    const laterThemes = themeEvolution[themeEvolution.length - 1];

    const sharedThemes = earlyThemes.filter(theme => laterThemes.includes(theme));
    const newThemes = laterThemes.filter(theme => !earlyThemes.includes(theme));

    if (newThemes.length > 0) {
      return `Thematic evolution: new focus on ${newThemes.slice(0, 2).join(', ')}`;
    } else if (sharedThemes.length > 0) {
      return `Consistent thematic focus on ${sharedThemes.slice(0, 2).join(', ')}`;
    }

    return null;
  }

  private divideIntoTimeSegments(items: LegacyItem[], segments: number): LegacyItem[][] {
    const sortedItems = items.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
    const segmentSize = Math.ceil(sortedItems.length / segments);
    const result: LegacyItem[][] = [];

    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, sortedItems.length);
      result.push(sortedItems.slice(start, end));
    }

    return result.filter(segment => segment.length > 0);
  }

  private async addTimelineEvent(item: LegacyItem): Promise<void> {
    if (!this.writingTimeline) return;

    const event: TimelineEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: item.createdDate,
      type: this.determineEventType(item),
      title: item.title,
      description: item.description,
      significance: this.calculateEventSignificance(item),
      relatedItems: [item.id],
      tags: item.tags,
      mood: item.metadata.mood,
      impact: this.generateImpactDescription(item),
      context: item.metadata.context,
      lessons: this.extractLessons(item)
    };

    this.writingTimeline.events.push(event);
    this.writingTimeline.events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Update timeline metadata
    const timespan = this.calculateTimeSpan(Array.from(this.legacyItems.values()));
    this.writingTimeline.timespan = timespan;
    this.writingTimeline.themes = this.extractThemes(Array.from(this.legacyItems.values()));
  }

  private determineEventType(item: LegacyItem): TimelineEvent['type'] {
    if (item.significance === 'transformative' || item.significance === 'landmark') {
      return 'breakthrough';
    } else if (item.type === 'achievement' || item.category === 'skill_development') {
      return 'achievement';
    } else if (item.metadata.collaborators && item.metadata.collaborators.length > 0) {
      return 'collaboration';
    } else {
      return 'creation';
    }
  }

  private calculateEventSignificance(item: LegacyItem): number {
    const significanceValues = {
      personal: 2,
      meaningful: 4,
      important: 6,
      landmark: 8,
      transformative: 10
    };

    return significanceValues[item.significance];
  }

  private generateImpactDescription(item: LegacyItem): string {
    const impacts: string[] = [];
    
    if (item.impact.personal.growth.length > 0) {
      impacts.push(`Personal growth: ${item.impact.personal.growth[0]}`);
    }
    
    if (item.impact.creative.breakthroughs.length > 0) {
      impacts.push(`Creative breakthrough: ${item.impact.creative.breakthroughs[0]}`);
    }
    
    if (item.impact.professional.skills.length > 0) {
      impacts.push(`Skill development: ${item.impact.professional.skills[0]}`);
    }

    return impacts.join('; ') || 'Contributed to writing development';
  }

  private extractLessons(item: LegacyItem): string[] {
    const lessons: string[] = [];
    
    // Extract from personal notes
    if (item.personalNotes) {
      const lessonKeywords = ['learned', 'discovered', 'realized', 'insight', 'lesson'];
      lessonKeywords.forEach(keyword => {
        if (item.personalNotes.toLowerCase().includes(keyword)) {
          lessons.push(`Extracted from notes: ${keyword} mentioned`);
        }
      });
    }

    // Extract from impact metrics
    item.impact.personal.insights.forEach(insight => {
      lessons.push(`Insight: ${insight}`);
    });

    return lessons.slice(0, 3); // Limit to 3 lessons
  }

  async addTimelineMilestone(milestoneData: Omit<TimelineMilestone, 'id' | 'commemoration'>): Promise<TimelineMilestone> {
    if (!this.writingTimeline) {
      throw new Error('Timeline not initialized');
    }

    const milestone: TimelineMilestone = {
      ...milestoneData,
      id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      commemoration: {
        date: new Date(),
        type: 'documentation',
        content: `Milestone achieved: ${milestoneData.title}`,
        participants: ['self'],
        memories: [],
        artifacts: [],
        emotions: ['pride', 'satisfaction'],
        significance: milestoneData.description
      }
    };

    this.writingTimeline.milestones.push(milestone);
    this.writingTimeline.milestones.sort((a, b) => a.date.getTime() - b.date.getTime());

    await this.saveDataToStorage();
    this.emit('milestoneAdded', milestone);

    return milestone;
  }

  async updateLegacyItem(itemId: string, updates: Partial<LegacyItem>): Promise<LegacyItem> {
    const item = this.legacyItems.get(itemId);
    if (!item) throw new Error('Legacy item not found');

    const updatedItem = { ...item, ...updates, lastModified: new Date() };
    this.legacyItems.set(itemId, updatedItem);

    // Update analytics
    await this.updateAnalytics();

    await this.saveDataToStorage();
    this.emit('legacyItemUpdated', updatedItem);

    return updatedItem;
  }

  async updatePortfolioEntry(itemId: string, portfolioUpdates: Partial<PortfolioEntry>): Promise<void> {
    const item = this.legacyItems.get(itemId);
    if (!item) throw new Error('Legacy item not found');

    item.portfolio = { ...item.portfolio, ...portfolioUpdates };
    item.lastModified = new Date();

    await this.saveDataToStorage();
    this.emit('portfolioUpdated', { itemId, portfolio: item.portfolio });
  }

  async addTestimonial(itemId: string, testimonial: Omit<Testimonial, 'id' | 'date'>): Promise<void> {
    const item = this.legacyItems.get(itemId);
    if (!item) throw new Error('Legacy item not found');

    const newTestimonial: Testimonial = {
      ...testimonial,
      id: `testimonial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date()
    };

    item.portfolio.testimonials.push(newTestimonial);
    item.lastModified = new Date();

    await this.saveDataToStorage();
    this.emit('testimonialAdded', { itemId, testimonial: newTestimonial });
  }

  async updateSharingSettings(itemId: string, sharingUpdates: Partial<SharingSettings>): Promise<void> {
    const item = this.legacyItems.get(itemId);
    if (!item) throw new Error('Legacy item not found');

    item.sharing = { ...item.sharing, ...sharingUpdates };
    item.lastModified = new Date();

    // Log share event if sharing status changed
    if (sharingUpdates.visibility && sharingUpdates.visibility !== 'private') {
      const shareEvent: ShareEvent = {
        date: new Date(),
        platform: 'direct',
        audience: sharingUpdates.visibility,
        response: 'pending',
        metrics: {},
        notes: 'Sharing settings updated'
      };
      item.sharing.shareHistory.push(shareEvent);
    }

    await this.saveDataToStorage();
    this.emit('sharingUpdated', { itemId, sharing: item.sharing });
  }

  async updateAnalytics(): Promise<LegacyAnalytics> {
    const allItems = Array.from(this.legacyItems.values());
    
    const analytics: LegacyAnalytics = {
      overview: this.calculateOverviewAnalytics(allItems),
      categories: this.calculateCategoryAnalytics(allItems),
      quality: this.calculateQualityAnalytics(allItems),
      impact: this.calculateImpactAnalytics(allItems),
      patterns: this.calculatePatternAnalytics(allItems),
      predictions: this.calculatePredictions(allItems)
    };

    this.legacyAnalytics = analytics;
    this.emit('analyticsUpdated', analytics);
    
    return analytics;
  }

  private calculateOverviewAnalytics(items: LegacyItem[]): LegacyAnalytics['overview'] {
    const totalWords = items.reduce((sum, item) => sum + (item.metadata.wordCount || 0), 0);
    const totalHours = items.reduce((sum, item) => sum + item.metadata.timeSpent, 0) / 60;
    
    let timespan = 0;
    if (items.length > 0) {
      const dates = items.map(item => item.createdDate.getTime());
      timespan = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
    }

    const averageItemsPerMonth = timespan > 0 ? (items.length / timespan) * 30 : 0;

    // Calculate productivity trend
    let productivityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (items.length >= 6) {
      const sortedItems = items.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
      const midpoint = Math.floor(sortedItems.length / 2);
      const firstHalf = sortedItems.slice(0, midpoint);
      const secondHalf = sortedItems.slice(midpoint);
      
      const firstHalfTimespan = this.calculateTimespanDays(firstHalf);
      const secondHalfTimespan = this.calculateTimespanDays(secondHalf);
      
      const firstRate = firstHalfTimespan > 0 ? firstHalf.length / firstHalfTimespan : 0;
      const secondRate = secondHalfTimespan > 0 ? secondHalf.length / secondHalfTimespan : 0;
      
      if (secondRate > firstRate * 1.2) productivityTrend = 'increasing';
      else if (secondRate < firstRate * 0.8) productivityTrend = 'decreasing';
    }

    return {
      totalItems: items.length,
      totalWords,
      totalHours,
      timespan,
      averageItemsPerMonth,
      productivityTrend
    };
  }

  private calculateTimespanDays(items: LegacyItem[]): number {
    if (items.length < 2) return 0;
    const dates = items.map(item => item.createdDate.getTime());
    return (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
  }

  private calculateCategoryAnalytics(items: LegacyItem[]): LegacyAnalytics['categories'] {
    const distribution: Record<string, number> = {};
    const categoryItems: Record<string, LegacyItem[]> = {};

    items.forEach(item => {
      distribution[item.category] = (distribution[item.category] || 0) + 1;
      if (!categoryItems[item.category]) categoryItems[item.category] = [];
      categoryItems[item.category].push(item);
    });

    const trends: Record<string, 'growing' | 'stable' | 'declining'> = {};
    const evolution: CategoryEvolution[] = [];

    Object.entries(categoryItems).forEach(([category, categoryItemList]) => {
      if (categoryItemList.length >= 3) {
        const sortedItems = categoryItemList.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
        const midpoint = Math.floor(sortedItems.length / 2);
        
        const recentCount = sortedItems.slice(midpoint).length;
        const olderCount = sortedItems.slice(0, midpoint).length;
        
        if (recentCount > olderCount * 1.5) trends[category] = 'growing';
        else if (recentCount < olderCount * 0.5) trends[category] = 'declining';
        else trends[category] = 'stable';

        // Calculate evolution timeline
        const timeline = this.calculateCategoryTimeline(sortedItems);
        evolution.push({
          category,
          timeline,
          growth: recentCount - olderCount,
          significance: this.calculateCategorySignificance(sortedItems),
          futureProjection: this.projectCategoryFuture(category, trends[category])
        });
      } else {
        trends[category] = 'stable';
      }
    });

    return {
      distribution,
      trends,
      evolution
    };
  }

  private calculateCategoryTimeline(items: LegacyItem[]): { date: Date; count: number; quality: number }[] {
    const timeline: { date: Date; count: number; quality: number }[] = [];
    const sortedItems = items.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
    
    let currentCount = 0;
    sortedItems.forEach(item => {
      currentCount++;
      const quality = this.itemToQualityScore(item);
      timeline.push({
        date: item.createdDate,
        count: currentCount,
        quality
      });
    });

    return timeline;
  }

  private itemToQualityScore(item: LegacyItem): number {
    const significanceScores = {
      personal: 1,
      meaningful: 2,
      important: 3,
      landmark: 4,
      transformative: 5
    };

    const baseScore = significanceScores[item.significance];
    const portfolioBonus = item.portfolio.featured ? 1 : 0;
    const testimonialBonus = item.portfolio.testimonials.length > 0 ? 0.5 : 0;
    
    return Math.min(5, baseScore + portfolioBonus + testimonialBonus);
  }

  private calculateCategorySignificance(items: LegacyItem[]): number {
    const totalSignificance = items.reduce((sum, item) => sum + this.itemToQualityScore(item), 0);
    return items.length > 0 ? totalSignificance / items.length : 0;
  }

  private projectCategoryFuture(category: string, trend: 'growing' | 'stable' | 'declining'): string {
    const projections = {
      creative_work: {
        growing: 'Expanding creative output with increasing sophistication',
        stable: 'Consistent creative practice with steady quality',
        declining: 'Shift focus to other areas, maintaining core creative skills'
      },
      personal_growth: {
        growing: 'Accelerating personal development and self-discovery',
        stable: 'Steady personal growth with consistent insights',
        declining: 'Consolidation phase, integrating previous learnings'
      },
      skill_development: {
        growing: 'Rapid skill acquisition across multiple areas',
        stable: 'Consistent skill refinement and mastery',
        declining: 'Focus shift to applying existing skills'
      }
    };

    return projections[category as keyof typeof projections]?.[trend] || `${trend} trajectory in ${category}`;
  }

  private calculateQualityAnalytics(items: LegacyItem[]): LegacyAnalytics['quality'] {
    const significanceScores = items.map(item => this.itemToQualityScore(item));
    const averageSignificance = significanceScores.length > 0 ? 
      significanceScores.reduce((sum, score) => sum + score, 0) / significanceScores.length : 0;

    const featuredItems = items.filter(item => item.portfolio.featured).length;
    const completedItems = items.filter(item => item.status === 'completed' || item.status === 'published').length;
    const completionRate = items.length > 0 ? completedItems / items.length : 0;

    // Calculate improvement trend
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (items.length >= 4) {
      const sortedItems = items.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
      const midpoint = Math.floor(sortedItems.length / 2);
      
      const earlyItems = sortedItems.slice(0, midpoint);
      const laterItems = sortedItems.slice(midpoint);
      
      const earlyAvg = earlyItems.reduce((sum, item) => sum + this.itemToQualityScore(item), 0) / earlyItems.length;
      const laterAvg = laterItems.reduce((sum, item) => sum + this.itemToQualityScore(item), 0) / laterItems.length;
      
      if (laterAvg > earlyAvg * 1.2) improvementTrend = 'improving';
      else if (laterAvg < earlyAvg * 0.8) improvementTrend = 'declining';
    }

    return {
      averageSignificance,
      featuredItems,
      completionRate,
      improvementTrend
    };
  }

  private calculateImpactAnalytics(items: LegacyItem[]): LegacyAnalytics['impact'] {
    let personalGrowth = 0;
    let socialInfluence = 0;
    let professionalDevelopment = 0;
    let creativeBreakthroughs = 0;

    items.forEach(item => {
      personalGrowth += item.impact.personal.growth.length * 0.5 + item.impact.personal.satisfaction * 0.1;
      socialInfluence += item.impact.social.feedback.length * 0.3 + item.impact.social.connections.length * 0.2;
      professionalDevelopment += item.impact.professional.skills.length * 0.4 + item.impact.professional.opportunities.length * 0.6;
      creativeBreakthroughs += item.impact.creative.breakthroughs.length * 1.0 + item.impact.creative.innovations.length * 0.8;
    });

    const overallLegacyScore = (personalGrowth + socialInfluence + professionalDevelopment + creativeBreakthroughs) / 4;

    return {
      personalGrowth: Math.round(personalGrowth * 10) / 10,
      socialInfluence: Math.round(socialInfluence * 10) / 10,
      professionalDevelopment: Math.round(professionalDevelopment * 10) / 10,
      creativeBreakthroughs: Math.round(creativeBreakthroughs * 10) / 10,
      overallLegacyScore: Math.round(overallLegacyScore * 10) / 10
    };
  }

  private calculatePatternAnalytics(items: LegacyItem[]): LegacyAnalytics['patterns'] {
    return {
      peakProductivityPeriods: this.identifyPeakPeriods(items),
      creativePhases: this.identifyCreativePhases(items),
      thematicEvolution: this.calculateThematicEvolution(items),
      skillProgression: this.calculateSkillProgression(items)
    };
  }

  private identifyPeakPeriods(items: LegacyItem[]): PeakPeriod[] {
    // This is a simplified implementation
    const periods: PeakPeriod[] = [];
    
    if (items.length < 5) return periods;

    const sortedItems = items.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
    
    // Find periods of high productivity (simplified)
    for (let i = 0; i < sortedItems.length - 2; i++) {
      const period = sortedItems.slice(i, i + 3);
      const timespan = this.calculateTimespanDays(period);
      
      if (timespan < 30 && timespan > 0) { // 3 items in less than 30 days
        periods.push({
          start: period[0].createdDate,
          end: period[period.length - 1].createdDate,
          type: 'productivity',
          metrics: {
            itemsPerDay: period.length / timespan,
            averageQuality: period.reduce((sum, item) => sum + this.itemToQualityScore(item), 0) / period.length
          },
          factors: ['focused_period', 'high_motivation'],
          items: period.map(item => item.id),
          insights: [`High productivity period with ${period.length} items in ${Math.round(timespan)} days`]
        });
      }
    }

    return periods.slice(0, 5); // Return top 5 periods
  }

  private identifyCreativePhases(items: LegacyItem[]): CreativePhase[] {
    // Simplified creative phase identification
    const phases: CreativePhase[] = [];
    
    if (items.length < 3) return phases;

    const sortedItems = items.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
    
    // Group items by themes and identify phases
    const themeGroups = this.groupItemsByTheme(sortedItems);
    
    Object.entries(themeGroups).forEach(([theme, themeItems], index) => {
      if (themeItems.length >= 2) {
        const timespan = this.calculateTimeSpan(themeItems);
        phases.push({
          id: `phase_${index}`,
          name: `${theme} Phase`,
          start: timespan.start,
          end: timespan.end,
          characteristics: [`Focus on ${theme}`, 'Thematic consistency'],
          themes: [theme],
          style: this.extractStyleCharacteristics(themeItems),
          influences: this.extractInfluences(themeItems),
          output: this.categorizeOutput(themeItems),
          evolution: `Development through ${theme} exploration`,
          significance: `Important phase for ${theme} development`
        });
      }
    });

    return phases.slice(0, 5);
  }

  private groupItemsByTheme(items: LegacyItem[]): Record<string, LegacyItem[]> {
    const groups: Record<string, LegacyItem[]> = {};
    
    items.forEach(item => {
      item.tags.forEach(tag => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(item);
      });
    });

    return groups;
  }

  private extractStyleCharacteristics(items: LegacyItem[]): string[] {
    const characteristics: string[] = [];
    
    // Analyze common patterns
    const difficulties = items.map(item => item.metadata.difficulty);
    const mostCommonDifficulty = this.findMostCommon(difficulties);
    characteristics.push(`Primarily ${mostCommonDifficulty} level work`);

    const moods = items.map(item => item.metadata.mood);
    const mostCommonMood = this.findMostCommon(moods);
    characteristics.push(`${mostCommonMood} emotional tone`);

    return characteristics;
  }

  private extractInfluences(items: LegacyItem[]): string[] {
    const influences: string[] = [];
    
    items.forEach(item => {
      item.metadata.inspiration.forEach(inspiration => {
        if (!influences.includes(inspiration)) {
          influences.push(inspiration);
        }
      });
    });

    return influences.slice(0, 5);
  }

  private categorizeOutput(items: LegacyItem[]): { type: string; count: number }[] {
    const typeCounts: Record<string, number> = {};
    
    items.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
  }

  private findMostCommon<T>(array: T[]): T {
    const counts: Record<string, number> = {};
    array.forEach(item => {
      const key = String(item);
      counts[key] = (counts[key] || 0) + 1;
    });

    const mostCommonKey = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    return array.find(item => String(item) === mostCommonKey) || array[0];
  }

  private calculateThematicEvolution(items: LegacyItem[]): ThemeEvolution[] {
    const evolution: ThemeEvolution[] = [];
    const allThemes = this.extractThemes(items);

    allThemes.slice(0, 5).forEach(theme => {
      const themeItems = items.filter(item => item.tags.includes(theme));
      const appearances = themeItems.map(item => ({
        date: item.createdDate,
        context: item.description,
        significance: this.itemToQualityScore(item)
      }));

      evolution.push({
        theme,
        appearances,
        evolution: this.analyzeThemeEvolution(appearances),
        currentState: this.assessCurrentThemeState(appearances),
        futureDirection: this.predictThemeFuture(theme, appearances)
      });
    });

    return evolution;
  }

  private analyzeThemeEvolution(appearances: { date: Date; context: string; significance: number }[]): string {
    if (appearances.length < 2) return 'Single appearance';
    
    const sortedAppearances = appearances.sort((a, b) => a.date.getTime() - b.date.getTime());
    const significanceProgression = sortedAppearances.map(app => app.significance);
    
    const firstHalf = significanceProgression.slice(0, Math.floor(significanceProgression.length / 2));
    const secondHalf = significanceProgression.slice(Math.floor(significanceProgression.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.2) return 'Growing in significance and depth';
    if (secondAvg < firstAvg * 0.8) return 'Decreasing emphasis, possibly explored fully';
    return 'Consistent presence and development';
  }

  private assessCurrentThemeState(appearances: { date: Date; context: string; significance: number }[]): string {
    if (appearances.length === 0) return 'Inactive';
    
    const latest = appearances[appearances.length - 1];
    const daysSinceLatest = (Date.now() - latest.date.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLatest < 30) return 'Currently active';
    if (daysSinceLatest < 90) return 'Recently active';
    return 'Dormant, may resurface';
  }

  private predictThemeFuture(theme: string, appearances: { date: Date; context: string; significance: number }[]): string {
    const futureProjections = {
      'character_development': 'Likely to evolve into more complex psychological exploration',
      'world_building': 'Potential for expansion into larger narrative universes',
      'dialogue': 'May develop into distinctive voice and conversational style',
      'plot_structure': 'Could lead to mastery of complex narrative architectures',
      'personal_growth': 'Expected to deepen with life experience and reflection'
    };

    return futureProjections[theme as keyof typeof futureProjections] || 
           `Potential for continued development and sophistication in ${theme}`;
  }

  private calculateSkillProgression(items: LegacyItem[]): SkillProgression[] {
    const skillProgressions: SkillProgression[] = [];
    
    // Extract skills from portfolio entries
    const allSkills = new Set<string>();
    items.forEach(item => {
      item.portfolio.skills.forEach(skill => allSkills.add(skill));
    });

    Array.from(allSkills).slice(0, 5).forEach(skill => {
      const skillItems = items.filter(item => item.portfolio.skills.includes(skill));
      const progression = skillItems.map(item => ({
        date: item.createdDate,
        level: this.itemToQualityScore(item),
        evidence: [`Work: ${item.title}`, `Significance: ${item.significance}`]
      }));

      const trend = this.calculateSkillTrend(progression);
      const currentLevel = progression.length > 0 ? 
        progression[progression.length - 1].level : 0;

      skillProgressions.push({
        skill,
        progression,
        trend,
        currentLevel,
        projection: this.projectSkillFuture(skill, trend, currentLevel)
      });
    });

    return skillProgressions;
  }

  private calculateSkillTrend(progression: { date: Date; level: number; evidence: string[] }[]): 'accelerating' | 'steady' | 'plateauing' | 'declining' {
    if (progression.length < 3) return 'steady';

    const levels = progression.map(p => p.level);
    const recent = levels.slice(-3);
    const earlier = levels.slice(0, -3);

    const recentAvg = recent.reduce((sum, level) => sum + level, 0) / recent.length;
    const earlierAvg = earlier.length > 0 ? 
      earlier.reduce((sum, level) => sum + level, 0) / earlier.length : recentAvg;

    const improvement = recentAvg - earlierAvg;
    const rate = improvement / Math.max(1, earlier.length);

    if (rate > 0.5) return 'accelerating';
    if (rate < -0.3) return 'declining';
    if (Math.abs(rate) < 0.1) return 'plateauing';
    return 'steady';
  }

  private projectSkillFuture(skill: string, trend: string, currentLevel: number): string {
    const projections = {
      accelerating: `Rapid advancement expected, potentially reaching mastery level`,
      steady: `Consistent improvement, steady progression toward advanced proficiency`,
      plateauing: `Consolidation phase, focus on refinement and application`,
      declining: `May benefit from renewed focus or different approach`
    };

    const baseProjection = projections[trend as keyof typeof projections];
    const levelContext = currentLevel > 4 ? ' (already at high level)' : 
                        currentLevel > 2 ? ' (solid foundation established)' : 
                        ' (building fundamentals)';

    return baseProjection + levelContext;
  }

  private calculatePredictions(items: LegacyItem[]): LegacyAnalytics['predictions'] {
    const nextMilestone = this.predictNextMilestone(items);
    const futureThemes = this.predictFutureThemes(items);
    const legacyProjection = this.calculateLegacyProjection(items);
    const recommendations = this.generateRecommendations(items);

    return {
      nextMilestone,
      futureThemes,
      legacyProjection,
      recommendations
    };
  }

  private predictNextMilestone(items: LegacyItem[]): PredictedMilestone {
    // Simple prediction based on current patterns
    const recentProductivity = this.calculateRecentProductivity(items);
    const averageSignificance = this.calculateAverageSignificance(items);

    let title = 'Next Creative Milestone';
    let requirements: string[] = ['Continue consistent writing practice'];
    let confidence = 0.6;

    if (items.length >= 10) {
      title = 'Portfolio Milestone: 10+ Quality Works';
      requirements = ['Curate best 10 works for portfolio', 'Add testimonials and showcasing'];
      confidence = 0.8;
    } else if (averageSignificance > 3) {
      title = 'Mastery Recognition';
      requirements = ['Demonstrate advanced skills', 'Create signature work', 'Seek external validation'];
      confidence = 0.7;
    } else {
      title = 'Skill Development Milestone';
      requirements = ['Focus on specific skill areas', 'Complete challenging projects', 'Track progress'];
      confidence = 0.6;
    }

    const estimatedDate = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now

    return {
      title,
      estimatedDate,
      confidence,
      requirements,
      preparation: ['Review current strengths', 'Identify growth areas', 'Set specific targets'],
      significance: 'Important step in writing development journey'
    };
  }

  private calculateRecentProductivity(items: LegacyItem[]): number {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentItems = items.filter(item => item.createdDate > thirtyDaysAgo);
    return recentItems.length;
  }

  private calculateAverageSignificance(items: LegacyItem[]): number {
    if (items.length === 0) return 0;
    const totalSignificance = items.reduce((sum, item) => sum + this.itemToQualityScore(item), 0);
    return totalSignificance / items.length;
  }

  private predictFutureThemes(items: LegacyItem[]): string[] {
    const currentThemes = this.extractThemes(items);
    const emergingThemes: string[] = [];

    // Predict themes based on current trends
    if (currentThemes.includes('character_development')) {
      emergingThemes.push('psychological_depth', 'character_relationships');
    }
    if (currentThemes.includes('world_building')) {
      emergingThemes.push('cultural_exploration', 'environmental_storytelling');
    }
    if (currentThemes.includes('personal_growth')) {
      emergingThemes.push('wisdom_sharing', 'life_philosophy');
    }

    // Add some universal themes
    emergingThemes.push('voice_refinement', 'style_evolution', 'genre_expansion');

    return [...new Set(emergingThemes)].slice(0, 5);
  }

  private calculateLegacyProjection(items: LegacyItem[]): LegacyProjection {
    const currentProductivity = this.calculateRecentProductivity(items);
    const monthlyRate = currentProductivity > 0 ? currentProductivity / 1 : 2; // Default 2 per month

    return {
      timeframe: '5_years',
      estimatedItems: Math.round(monthlyRate * 12 * 5),
      expectedThemes: this.predictFutureThemes(items),
      skillMastery: ['Advanced character development', 'Distinctive voice', 'Genre proficiency'],
      impactPotential: Math.min(10, Math.round(items.length * 0.2 + this.calculateAverageSignificance(items))),
      legacyStatements: [
        'A body of work reflecting personal growth and creative evolution',
        'Evidence of consistent creative practice and development',
        'Unique voice and perspective captured across multiple works'
      ],
      continuationPlan: [
        'Maintain consistent writing practice',
        'Document learning and growth',
        'Build portfolio of significant works',
        'Share insights with writing community'
      ]
    };
  }

  private generateRecommendations(items: LegacyItem[]): string[] {
    const recommendations: string[] = [];

    // Portfolio recommendations
    const featuredCount = items.filter(item => item.portfolio.featured).length;
    if (featuredCount < Math.min(5, items.length * 0.3)) {
      recommendations.push('Feature more of your best works in your portfolio');
    }

    // Sharing recommendations
    const sharedCount = items.filter(item => item.sharing.visibility !== 'private').length;
    if (sharedCount < items.length * 0.2) {
      recommendations.push('Consider sharing more works to build audience and get feedback');
    }

    // Quality recommendations
    const averageQuality = this.calculateAverageSignificance(items);
    if (averageQuality < 3) {
      recommendations.push('Focus on creating fewer but higher quality pieces');
    }

    // Preservation recommendations
    const wellPreservedCount = items.filter(item => 
      item.preservation.backupLevel !== 'basic'
    ).length;
    if (wellPreservedCount < items.length * 0.5) {
      recommendations.push('Improve preservation methods for important works');
    }

    // Theme diversity recommendations
    const themes = this.extractThemes(items);
    if (themes.length < 3) {
      recommendations.push('Explore more diverse themes and topics in your writing');
    }

    return recommendations.slice(0, 5);
  }

  private initializeTimeline(): void {
    if (!this.writingTimeline) {
      this.writingTimeline = {
        id: `timeline_${Date.now()}`,
        title: 'Personal Writing Journey',
        description: 'A comprehensive timeline of writing development and achievements',
        timespan: { start: new Date(), end: new Date() },
        events: [],
        milestones: [],
        themes: [],
        growth: [],
        visualization: {
          style: 'linear',
          highlights: [],
          annotations: []
        },
        narrative: 'This timeline captures the evolution of writing skills, creative breakthroughs, and personal growth through the written word.',
        insights: [],
        futureProjections: []
      };
    }
  }

  private scheduleAnalyticsUpdate(): void {
    // Update analytics weekly
    setInterval(() => {
      this.updateAnalytics();
    }, 7 * 24 * 60 * 60 * 1000); // Every 7 days
  }

  // Storage methods
  private async loadDataFromStorage(): Promise<void> {
    try {
      const storedItems = localStorage.getItem('legacy_items');
      if (storedItems) {
        const itemsArray = JSON.parse(storedItems);
        itemsArray.forEach((item: any) => {
          item.createdDate = new Date(item.createdDate);
          item.lastModified = new Date(item.lastModified);
          if (item.metadata.originalDate) {
            item.metadata.originalDate = new Date(item.metadata.originalDate);
          }
          item.preservation.lastBackup = new Date(item.preservation.lastBackup);
          item.preservation.integrity.verified = new Date(item.preservation.integrity.verified);
          item.portfolio.testimonials.forEach((testimonial: any) => {
            testimonial.date = new Date(testimonial.date);
          });
          item.sharing.sharedWith.forEach((contact: any) => {
            contact.sharedDate = new Date(contact.sharedDate);
            if (contact.lastAccess) contact.lastAccess = new Date(contact.lastAccess);
          });
          item.sharing.shareHistory.forEach((event: any) => {
            event.date = new Date(event.date);
          });
          if (item.sharing.embargo) {
            item.sharing.embargo.releaseDate = new Date(item.sharing.embargo.releaseDate);
          }
          this.legacyItems.set(item.id, item);
        });
      }

      const storedCollections = localStorage.getItem('legacy_collections');
      if (storedCollections) {
        const collectionsArray = JSON.parse(storedCollections);
        collectionsArray.forEach((collection: any) => {
          collection.metadata.created = new Date(collection.metadata.created);
          collection.metadata.lastUpdated = new Date(collection.metadata.lastUpdated);
          collection.metadata.timeSpan.start = new Date(collection.metadata.timeSpan.start);
          collection.metadata.timeSpan.end = new Date(collection.metadata.timeSpan.end);
          this.legacyCollections.set(collection.id, collection);
        });
      }

      const storedTimeline = localStorage.getItem('writing_timeline');
      if (storedTimeline) {
        this.writingTimeline = JSON.parse(storedTimeline);
        if (this.writingTimeline) {
          this.writingTimeline.timespan.start = new Date(this.writingTimeline.timespan.start);
          this.writingTimeline.timespan.end = new Date(this.writingTimeline.timespan.end);
          this.writingTimeline.events.forEach(event => {
            event.date = new Date(event.date);
          });
          this.writingTimeline.milestones.forEach(milestone => {
            milestone.date = new Date(milestone.date);
            milestone.commemoration.date = new Date(milestone.commemoration.date);
          });
          this.writingTimeline.growth.forEach(growth => {
            growth.date = new Date(growth.date);
          });
          this.writingTimeline.visualization.annotations.forEach(annotation => {
            annotation.date = new Date(annotation.date);
          });
        }
      }

      const storedAnalytics = localStorage.getItem('legacy_analytics');
      if (storedAnalytics) {
        this.legacyAnalytics = JSON.parse(storedAnalytics);
        if (this.legacyAnalytics) {
          this.legacyAnalytics.categories.evolution.forEach(evolution => {
            evolution.timeline.forEach(point => {
              point.date = new Date(point.date);
            });
          });
          this.legacyAnalytics.patterns.peakProductivityPeriods.forEach(period => {
            period.start = new Date(period.start);
            period.end = new Date(period.end);
          });
          this.legacyAnalytics.patterns.creativePhases.forEach(phase => {
            phase.start = new Date(phase.start);
            if (phase.end) phase.end = new Date(phase.end);
          });
          this.legacyAnalytics.predictions.nextMilestone.estimatedDate = 
            new Date(this.legacyAnalytics.predictions.nextMilestone.estimatedDate);
        }
      }
    } catch (error) {
      console.error('Error loading legacy data from storage:', error);
    }
  }

  private async saveDataToStorage(): Promise<void> {
    try {
      // Save legacy items
      const itemsArray = Array.from(this.legacyItems.values());
      localStorage.setItem('legacy_items', JSON.stringify(itemsArray));

      // Save collections
      const collectionsArray = Array.from(this.legacyCollections.values());
      localStorage.setItem('legacy_collections', JSON.stringify(collectionsArray));

      // Save timeline
      if (this.writingTimeline) {
        localStorage.setItem('writing_timeline', JSON.stringify(this.writingTimeline));
      }

      // Save analytics
      if (this.legacyAnalytics) {
        localStorage.setItem('legacy_analytics', JSON.stringify(this.legacyAnalytics));
      }
    } catch (error) {
      console.error('Error saving legacy data to storage:', error);
    }
  }

  // Public getter methods
  getLegacyItems(filter?: { category?: string; type?: string; significance?: string }): LegacyItem[] {
    let items = Array.from(this.legacyItems.values());
    
    if (filter?.category) {
      items = items.filter(item => item.category === filter.category);
    }
    
    if (filter?.type) {
      items = items.filter(item => item.type === filter.type);
    }
    
    if (filter?.significance) {
      items = items.filter(item => item.significance === filter.significance);
    }
    
    return items.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
  }

  getLegacyItem(itemId: string): LegacyItem | undefined {
    return this.legacyItems.get(itemId);
  }

  getLegacyCollections(): LegacyCollection[] {
    return Array.from(this.legacyCollections.values())
      .sort((a, b) => b.metadata.lastUpdated.getTime() - a.metadata.lastUpdated.getTime());
  }

  getWritingTimeline(): WritingTimeline | null {
    return this.writingTimeline;
  }

  getLegacyAnalytics(): LegacyAnalytics | null {
    return this.legacyAnalytics;
  }

  getFeaturedItems(): LegacyItem[] {
    return Array.from(this.legacyItems.values())
      .filter(item => item.portfolio.featured)
      .sort((a, b) => a.portfolio.displayOrder - b.portfolio.displayOrder);
  }

  getPortfolio(): LegacyItem[] {
    return Array.from(this.legacyItems.values())
      .filter(item => item.portfolio.showcase || item.portfolio.featured)
      .sort((a, b) => {
        if (a.portfolio.featured && !b.portfolio.featured) return -1;
        if (!a.portfolio.featured && b.portfolio.featured) return 1;
        return a.portfolio.displayOrder - b.portfolio.displayOrder;
      });
  }

  async deleteLegacyItem(itemId: string): Promise<void> {
    this.legacyItems.delete(itemId);
    
    // Remove from collections
    this.legacyCollections.forEach(collection => {
      const index = collection.items.indexOf(itemId);
      if (index > -1) {
        collection.items.splice(index, 1);
        collection.metadata.lastUpdated = new Date();
      }
    });
    
    // Remove from timeline
    if (this.writingTimeline) {
      this.writingTimeline.events = this.writingTimeline.events.filter(event => 
        !event.relatedItems.includes(itemId)
      );
    }

    await this.updateAnalytics();
    await this.saveDataToStorage();
    
    this.emit('legacyItemDeleted', itemId);
  }
}

export const personalLegacyService = new PersonalLegacyService();
export default personalLegacyService;