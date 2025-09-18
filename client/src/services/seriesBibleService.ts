/**
 * Series Bible Service
 * Comprehensive continuity and reference system for multi-book projects
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export interface SeriesBible {
  id: string;
  seriesName: string;
  genre: string[];
  targetAudience: string;
  overarchingTheme: string;
  worldRules: WorldRules;
  timeline: SeriesTimeline;
  characterProfiles: CharacterProfile[];
  locationRegistry: LocationEntry[];
  magicSystem?: MagicSystem;
  technology?: TechnologyLevel;
  languages: Language[];
  cultures: Culture[];
  plotThreads: PlotThread[];
  prophecies: Prophecy[];
  artifacts: Artifact[];
  continuityNotes: ContinuityNote[];
  bookPlans: BookPlan[];
  createdAt: number;
  updatedAt: number;
}

export interface WorldRules {
  physics: string[];
  magic: string[];
  social: string[];
  economic: string[];
  political: string[];
  religious: string[];
  taboos: string[];
  customs: string[];
}

export interface SeriesTimeline {
  events: TimelineEvent[];
  eras: Era[];
  currentDate: string;
  calendarSystem: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  bookReference?: { bookNumber: number; chapter?: number };
  impact: 'minor' | 'moderate' | 'major' | 'world-changing';
  characters: string[];
  locations: string[];
}

export interface Era {
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
  characteristics: string[];
}

export interface CharacterProfile {
  id: string;
  name: string;
  aliases: string[];
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  firstAppearance: { book: number; chapter: number };
  biography: {
    birthDate?: string;
    deathDate?: string;
    birthPlace: string;
    family: FamilyMember[];
    education: string;
    occupation: string[];
  };
  physical: {
    age: string;
    height: string;
    build: string;
    hairColor: string;
    eyeColor: string;
    distinguishingFeatures: string[];
    typicalClothing: string;
  };
  personality: {
    traits: string[];
    strengths: string[];
    weaknesses: string[];
    fears: string[];
    desires: string[];
    quirks: string[];
    speechPatterns: string[];
  };
  relationships: CharacterRelationship[];
  arc: CharacterArc[];
  abilities: string[];
  possessions: string[];
  secrets: Secret[];
  quotes: Quote[];
  notes: string;
}

export interface FamilyMember {
  name: string;
  relation: string;
  status: 'alive' | 'deceased' | 'unknown';
  notes?: string;
}

export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  type: string;
  description: string;
  evolution: { book: number; change: string }[];
}

export interface CharacterArc {
  bookNumber: number;
  startState: string;
  endState: string;
  keyMoments: string[];
  growth: string;
}

export interface Secret {
  content: string;
  knownBy: string[];
  revealedIn?: { book: number; chapter: number };
}

export interface Quote {
  text: string;
  context: string;
  bookReference: { book: number; chapter: number };
}

export interface LocationEntry {
  id: string;
  name: string;
  type: 'city' | 'town' | 'village' | 'landmark' | 'region' | 'country' | 'continent' | 'world';
  parent?: string; // Parent location
  description: string;
  firstAppearance?: { book: number; chapter: number };
  geography: {
    climate: string;
    terrain: string;
    naturalResources: string[];
    landmarks: string[];
  };
  demographics: {
    population?: number;
    species?: string[];
    languages: string[];
    governmentType?: string;
    economy?: string;
  };
  history: string[];
  significance: string[];
  mapCoordinates?: { x: number; y: number };
  images?: string[];
}

export interface MagicSystem {
  name: string;
  source: string;
  rules: string[];
  limitations: string[];
  costs: string[];
  users: {
    type: string;
    requirements: string[];
    abilities: string[];
  }[];
  spells?: Spell[];
  artifacts?: string[];
}

export interface Spell {
  name: string;
  level: number;
  type: string;
  effect: string;
  requirements: string[];
  limitations: string[];
}

export interface TechnologyLevel {
  era: string;
  availableTech: string[];
  unavailableTech: string[];
  uniqueInventions: string[];
  powerSources: string[];
  transportation: string[];
  communication: string[];
  weapons: string[];
}

export interface Language {
  name: string;
  speakers: string[];
  origin: string;
  script: string;
  commonPhrases: { phrase: string; translation: string }[];
  notes: string;
}

export interface Culture {
  name: string;
  practitioners: string[];
  values: string[];
  traditions: string[];
  holidays: string[];
  taboos: string[];
  cuisine: string[];
  arts: string[];
  religion?: string;
  socialStructure: string;
}

export interface PlotThread {
  id: string;
  name: string;
  type: 'main' | 'subplot' | 'background';
  description: string;
  introducedIn: { book: number; chapter?: number };
  resolvedIn?: { book: number; chapter?: number };
  status: 'setup' | 'developing' | 'climax' | 'resolved' | 'abandoned';
  connectedThreads: string[];
  foreshadowing: { book: number; chapter: number; hint: string }[];
  payoffs: { book: number; chapter: number; revelation: string }[];
}

export interface Prophecy {
  id: string;
  text: string;
  source: string;
  interpretation: string;
  introducedIn: { book: number; chapter: number };
  fulfilledIn?: { book: number; chapter: number };
  status: 'unfulfilled' | 'partially-fulfilled' | 'fulfilled' | 'false';
  relatedCharacters: string[];
  clues: string[];
}

export interface Artifact {
  id: string;
  name: string;
  type: string;
  description: string;
  powers: string[];
  history: string;
  currentOwner?: string;
  previousOwners: string[];
  location?: string;
  firstAppearance?: { book: number; chapter: number };
  significance: string;
}

export interface ContinuityNote {
  id: string;
  category: 'inconsistency' | 'retcon' | 'clarification' | 'reminder';
  bookReference: { book: number; chapter?: number; page?: number };
  issue: string;
  resolution?: string;
  priority: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface BookPlan {
  bookNumber: number;
  title: string;
  subtitle?: string;
  targetWordCount: number;
  currentWordCount: number;
  status: 'planning' | 'drafting' | 'revising' | 'complete' | 'published';
  synopsis: string;
  themes: string[];
  protagonists: string[];
  antagonists: string[];
  majorPlotPoints: PlotPoint[];
  subplots: string[];
  startDate?: string;
  targetEndDate?: string;
  publishDate?: string;
  notes: string;
}

export interface PlotPoint {
  type: 'inciting-incident' | 'rising-action' | 'climax' | 'falling-action' | 'resolution';
  description: string;
  chapter?: number;
  characters: string[];
}

class SeriesBibleService extends BrowserEventEmitter {
  private bibles: Map<string, SeriesBible> = new Map();
  private activeBibleId: string | null = null;
  private storageKey = 'astral_notes_series_bible';

  constructor() {
    super();
    this.loadData();
  }

  // Bible Management
  createBible(seriesName: string, data?: Partial<SeriesBible>): SeriesBible {
    const bible: SeriesBible = {
      id: this.generateId(),
      seriesName,
      genre: data?.genre || [],
      targetAudience: data?.targetAudience || '',
      overarchingTheme: data?.overarchingTheme || '',
      worldRules: data?.worldRules || {
        physics: [],
        magic: [],
        social: [],
        economic: [],
        political: [],
        religious: [],
        taboos: [],
        customs: []
      },
      timeline: data?.timeline || {
        events: [],
        eras: [],
        currentDate: '',
        calendarSystem: 'standard'
      },
      characterProfiles: data?.characterProfiles || [],
      locationRegistry: data?.locationRegistry || [],
      languages: data?.languages || [],
      cultures: data?.cultures || [],
      plotThreads: data?.plotThreads || [],
      prophecies: data?.prophecies || [],
      artifacts: data?.artifacts || [],
      continuityNotes: data?.continuityNotes || [],
      bookPlans: data?.bookPlans || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data
    };

    this.bibles.set(bible.id, bible);
    this.saveData();
    this.emit('bibleCreated', bible);
    
    return bible;
  }

  updateBible(bibleId: string, updates: Partial<SeriesBible>): SeriesBible | null {
    const bible = this.bibles.get(bibleId);
    if (!bible) return null;

    const updatedBible = {
      ...bible,
      ...updates,
      updatedAt: Date.now()
    };

    this.bibles.set(bibleId, updatedBible);
    this.saveData();
    this.emit('bibleUpdated', updatedBible);
    
    return updatedBible;
  }

  // Character Management
  addCharacter(bibleId: string, character: CharacterProfile): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    bible.characterProfiles.push(character);
    bible.updatedAt = Date.now();
    
    this.saveData();
    this.emit('characterAdded', { bibleId, character });
    
    return true;
  }

  updateCharacter(bibleId: string, characterId: string, updates: Partial<CharacterProfile>): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    const charIndex = bible.characterProfiles.findIndex(c => c.id === characterId);
    if (charIndex === -1) return false;

    bible.characterProfiles[charIndex] = {
      ...bible.characterProfiles[charIndex],
      ...updates
    };
    
    bible.updatedAt = Date.now();
    this.saveData();
    this.emit('characterUpdated', { bibleId, characterId, updates });
    
    return true;
  }

  // Location Management
  addLocation(bibleId: string, location: LocationEntry): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    bible.locationRegistry.push(location);
    bible.updatedAt = Date.now();
    
    this.saveData();
    this.emit('locationAdded', { bibleId, location });
    
    return true;
  }

  // Timeline Management
  addTimelineEvent(bibleId: string, event: TimelineEvent): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    bible.timeline.events.push(event);
    bible.timeline.events.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    bible.updatedAt = Date.now();
    this.saveData();
    this.emit('timelineEventAdded', { bibleId, event });
    
    return true;
  }

  // Plot Thread Management
  addPlotThread(bibleId: string, thread: PlotThread): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    bible.plotThreads.push(thread);
    bible.updatedAt = Date.now();
    
    this.saveData();
    this.emit('plotThreadAdded', { bibleId, thread });
    
    return true;
  }

  updatePlotThread(bibleId: string, threadId: string, updates: Partial<PlotThread>): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    const threadIndex = bible.plotThreads.findIndex(t => t.id === threadId);
    if (threadIndex === -1) return false;

    bible.plotThreads[threadIndex] = {
      ...bible.plotThreads[threadIndex],
      ...updates
    };
    
    bible.updatedAt = Date.now();
    this.saveData();
    this.emit('plotThreadUpdated', { bibleId, threadId, updates });
    
    return true;
  }

  // Continuity Checking
  checkContinuity(bibleId: string): ContinuityNote[] {
    const bible = this.bibles.get(bibleId);
    if (!bible) return [];

    const issues: ContinuityNote[] = [];

    // Check character death consistency
    bible.characterProfiles.forEach(char => {
      if (char.biography.deathDate) {
        // Check if character appears after death
        bible.timeline.events.forEach(event => {
          if (event.characters.includes(char.name) && 
              new Date(event.date) > new Date(char.biography.deathDate!)) {
            issues.push({
              id: this.generateId(),
              category: 'inconsistency',
              bookReference: event.bookReference || { book: 0 },
              issue: `${char.name} appears in event after death date`,
              priority: 'high',
              resolved: false
            });
          }
        });
      }
    });

    // Check timeline consistency
    bible.plotThreads.forEach(thread => {
      if (thread.resolvedIn && thread.introducedIn.book > thread.resolvedIn.book) {
        issues.push({
          id: this.generateId(),
          category: 'inconsistency',
          bookReference: { book: thread.resolvedIn.book },
          issue: `Plot thread "${thread.name}" resolved before introduction`,
          priority: 'high',
          resolved: false
        });
      }
    });

    return issues;
  }

  // Search and Query
  searchBible(bibleId: string, query: string): {
    characters: CharacterProfile[];
    locations: LocationEntry[];
    events: TimelineEvent[];
    plotThreads: PlotThread[];
  } {
    const bible = this.bibles.get(bibleId);
    if (!bible) return { characters: [], locations: [], events: [], plotThreads: [] };

    const searchTerm = query.toLowerCase();

    return {
      characters: bible.characterProfiles.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.aliases.some(a => a.toLowerCase().includes(searchTerm))
      ),
      locations: bible.locationRegistry.filter(l => 
        l.name.toLowerCase().includes(searchTerm) ||
        l.description.toLowerCase().includes(searchTerm)
      ),
      events: bible.timeline.events.filter(e => 
        e.title.toLowerCase().includes(searchTerm) ||
        e.description.toLowerCase().includes(searchTerm)
      ),
      plotThreads: bible.plotThreads.filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm)
      )
    };
  }

  // Character Relationship Map
  getCharacterRelationships(bibleId: string, characterId: string): {
    character: CharacterProfile;
    relationships: {
      target: CharacterProfile;
      type: string;
      description: string;
    }[];
  } | null {
    const bible = this.bibles.get(bibleId);
    if (!bible) return null;

    const character = bible.characterProfiles.find(c => c.id === characterId);
    if (!character) return null;

    const relationships = character.relationships.map(rel => {
      const target = bible.characterProfiles.find(c => c.id === rel.characterId);
      return target ? {
        target,
        type: rel.type,
        description: rel.description
      } : null;
    }).filter(Boolean) as any;

    return { character, relationships };
  }

  // Book Planning
  addBookPlan(bibleId: string, plan: BookPlan): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    bible.bookPlans.push(plan);
    bible.bookPlans.sort((a, b) => a.bookNumber - b.bookNumber);
    bible.updatedAt = Date.now();
    
    this.saveData();
    this.emit('bookPlanAdded', { bibleId, plan });
    
    return true;
  }

  updateBookPlan(bibleId: string, bookNumber: number, updates: Partial<BookPlan>): boolean {
    const bible = this.bibles.get(bibleId);
    if (!bible) return false;

    const planIndex = bible.bookPlans.findIndex(p => p.bookNumber === bookNumber);
    if (planIndex === -1) return false;

    bible.bookPlans[planIndex] = {
      ...bible.bookPlans[planIndex],
      ...updates
    };
    
    bible.updatedAt = Date.now();
    this.saveData();
    this.emit('bookPlanUpdated', { bibleId, bookNumber, updates });
    
    return true;
  }

  // Export
  exportBible(bibleId: string, format: 'json' | 'markdown' = 'json'): string {
    const bible = this.bibles.get(bibleId);
    if (!bible) return '';

    if (format === 'json') {
      return JSON.stringify(bible, null, 2);
    }

    // Markdown export
    let markdown = `# ${bible.seriesName} - Series Bible\n\n`;
    markdown += `**Genre:** ${bible.genre.join(', ')}\n`;
    markdown += `**Target Audience:** ${bible.targetAudience}\n`;
    markdown += `**Theme:** ${bible.overarchingTheme}\n\n`;

    markdown += `## Books (${bible.bookPlans.length})\n\n`;
    bible.bookPlans.forEach(book => {
      markdown += `### Book ${book.bookNumber}: ${book.title}\n`;
      markdown += `**Status:** ${book.status}\n`;
      markdown += `**Synopsis:** ${book.synopsis}\n\n`;
    });

    markdown += `## Characters (${bible.characterProfiles.length})\n\n`;
    bible.characterProfiles.forEach(char => {
      markdown += `### ${char.name}\n`;
      markdown += `**Role:** ${char.role}\n`;
      markdown += `**First Appearance:** Book ${char.firstAppearance.book}, Chapter ${char.firstAppearance.chapter}\n\n`;
    });

    return markdown;
  }

  // Getters
  getBible(bibleId: string): SeriesBible | null {
    return this.bibles.get(bibleId) || null;
  }

  getAllBibles(): SeriesBible[] {
    return Array.from(this.bibles.values());
  }

  setActiveBible(bibleId: string): boolean {
    if (!this.bibles.has(bibleId)) return false;
    
    this.activeBibleId = bibleId;
    this.emit('activeBibleChanged', this.bibles.get(bibleId));
    
    return true;
  }

  getActiveBible(): SeriesBible | null {
    return this.activeBibleId ? this.bibles.get(this.activeBibleId) || null : null;
  }

  // Helper Methods
  private generateId(): string {
    return `sb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveData(): void {
    try {
      const data = Array.from(this.bibles.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save series bible data:', error);
    }
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      this.bibles = new Map(data);
    } catch (error) {
      console.error('Failed to load series bible data:', error);
    }
  }
}

export const seriesBibleService = new SeriesBibleService();
export default seriesBibleService;