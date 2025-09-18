import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: 'plot' | 'character' | 'world' | 'historical' | 'personal';
  category: string;
  importance: 'critical' | 'major' | 'minor' | 'background';
  characters: string[];
  locations: string[];
  tags: string[];
  color: string;
  metadata: {
    chapter?: number;
    scene?: number;
    wordCount?: number;
    duration?: number;
    conflicts?: string[];
    consequences?: string[];
  };
  relationships: {
    parentId?: string;
    childrenIds: string[];
    prerequisites: string[];
    consequences: string[];
  };
  status: 'planned' | 'draft' | 'complete' | 'published';
  createdAt: Date;
  updatedAt: Date;
  authorNotes: string;
}

export interface Timeline {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'character' | 'subplot' | 'historical' | 'world';
  startDate: Date;
  endDate: Date;
  events: string[];
  settings: TimelineSettings;
  visibility: 'private' | 'shared' | 'public';
  metadata: {
    storyId?: string;
    characterId?: string;
    theme?: string;
    genre?: string;
    perspective?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  collaborators: string[];
}

export interface TimelineSettings {
  dateFormat: 'absolute' | 'relative' | 'narrative';
  timeScale: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years' | 'decades';
  autoSort: boolean;
  showConflicts: boolean;
  groupByCategory: boolean;
  defaultView: 'chronological' | 'categorical' | 'character' | 'importance';
  colorScheme: 'default' | 'character' | 'type' | 'importance';
  displayOptions: {
    showDuration: boolean;
    showCharacters: boolean;
    showLocations: boolean;
    showTags: boolean;
    showRelationships: boolean;
    compactMode: boolean;
  };
}

export interface TimelineAnalysis {
  totalEvents: number;
  timeSpan: {
    start: Date;
    end: Date;
    duration: number;
    unit: string;
  };
  eventDistribution: {
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byImportance: Record<string, number>;
    byCharacter: Record<string, number>;
    byLocation: Record<string, number>;
  };
  conflicts: TimelineConflict[];
  gaps: TimelineGap[];
  density: {
    eventsPerDay: number;
    busiestPeriod: { start: Date; end: Date; eventCount: number };
    quietestPeriod: { start: Date; end: Date; eventCount: number };
  };
  characterActivity: {
    characterId: string;
    name: string;
    eventCount: number;
    firstAppearance: Date;
    lastAppearance: Date;
    activityPeriods: { start: Date; end: Date; intensity: number }[];
  }[];
  suggestions: string[];
}

export interface TimelineConflict {
  id: string;
  type: 'overlap' | 'contradiction' | 'impossible' | 'inconsistent';
  severity: 'error' | 'warning' | 'suggestion';
  description: string;
  events: string[];
  suggestion: string;
  autoFixAvailable: boolean;
}

export interface TimelineGap {
  id: string;
  start: Date;
  end: Date;
  duration: number;
  characters: string[];
  description: string;
  suggestions: string[];
}

export interface TimelineTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  genre: string;
  structure: TimelineStructure;
  events: Partial<TimelineEvent>[];
  settings: Partial<TimelineSettings>;
  metadata: {
    author: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    popularity: number;
    rating: number;
    usageCount: number;
  };
  isOfficial: boolean;
  createdAt: Date;
}

export interface TimelineStructure {
  acts: {
    name: string;
    description: string;
    startPercent: number;
    endPercent: number;
    keyEvents: string[];
    themes: string[];
  }[];
  milestones: {
    name: string;
    description: string;
    position: number;
    type: 'inciting-incident' | 'plot-point' | 'midpoint' | 'climax' | 'resolution';
    importance: 'critical' | 'major' | 'minor';
  }[];
  archetypes: {
    character: string;
    arc: string;
    keyMoments: string[];
  }[];
}

export interface TimelineExport {
  format: 'json' | 'csv' | 'pdf' | 'gantt' | 'calendar' | 'outline';
  options: {
    includeMetadata: boolean;
    includeRelationships: boolean;
    dateRange?: { start: Date; end: Date };
    filterBy?: {
      types?: string[];
      characters?: string[];
      importance?: string[];
    };
    sortBy: 'date' | 'importance' | 'character' | 'type';
    groupBy?: 'none' | 'character' | 'type' | 'chapter';
  };
}

export interface TimelineSearchCriteria {
  query?: string;
  dateRange?: { start: Date; end: Date };
  types?: string[];
  categories?: string[];
  characters?: string[];
  locations?: string[];
  tags?: string[];
  importance?: string[];
  status?: string[];
}

export interface TimelineSuggestion {
  id: string;
  type: 'add-event' | 'modify-event' | 'resolve-conflict' | 'fill-gap' | 'enhance-detail';
  description: string;
  targetEvent?: string;
  suggestedEvent?: Partial<TimelineEvent>;
  reasoning: string;
  confidence: number;
  source: 'template' | 'pattern' | 'conflict-resolution' | 'gap-analysis';
}

class TimelineManagementService extends BrowserEventEmitter {
  private timelines: Map<string, Timeline>;
  private events: Map<string, TimelineEvent>;
  private templates: Map<string, TimelineTemplate>;
  private suggestions: Map<string, TimelineSuggestion>;
  private defaultSettings: TimelineSettings;

  constructor() {
    super();
    this.timelines = new Map();
    this.events = new Map();
    this.templates = new Map();
    this.suggestions = new Map();
    
    this.defaultSettings = this.createDefaultSettings();
    this.initializeTemplates();
    this.loadUserData();
  }

  private createDefaultSettings(): TimelineSettings {
    return {
      dateFormat: 'absolute',
      timeScale: 'days',
      autoSort: true,
      showConflicts: true,
      groupByCategory: false,
      defaultView: 'chronological',
      colorScheme: 'type',
      displayOptions: {
        showDuration: true,
        showCharacters: true,
        showLocations: false,
        showTags: true,
        showRelationships: false,
        compactMode: false
      }
    };
  }

  private initializeTemplates(): void {
    const templates: TimelineTemplate[] = [
      {
        id: 'three-act-structure',
        name: 'Three-Act Structure',
        description: 'Classic three-act narrative structure for novels and screenplays',
        type: 'narrative',
        genre: 'general',
        structure: {
          acts: [
            {
              name: 'Setup',
              description: 'Introduction of characters, world, and central conflict',
              startPercent: 0,
              endPercent: 25,
              keyEvents: ['opening', 'inciting-incident', 'first-plot-point'],
              themes: ['establishment', 'introduction', 'promise']
            },
            {
              name: 'Confrontation',
              description: 'Development of conflict and character growth',
              startPercent: 25,
              endPercent: 75,
              keyEvents: ['midpoint', 'complications', 'crisis'],
              themes: ['development', 'obstacles', 'change']
            },
            {
              name: 'Resolution',
              description: 'Climax and resolution of the central conflict',
              startPercent: 75,
              endPercent: 100,
              keyEvents: ['climax', 'falling-action', 'resolution'],
              themes: ['conclusion', 'transformation', 'new-normal']
            }
          ],
          milestones: [
            {
              name: 'Inciting Incident',
              description: 'The event that sets the story in motion',
              position: 10,
              type: 'inciting-incident',
              importance: 'critical'
            },
            {
              name: 'First Plot Point',
              description: 'The moment that launches the main story',
              position: 25,
              type: 'plot-point',
              importance: 'critical'
            },
            {
              name: 'Midpoint',
              description: 'Major revelation or turning point',
              position: 50,
              type: 'midpoint',
              importance: 'critical'
            },
            {
              name: 'Climax',
              description: 'The story\'s most intense moment',
              position: 85,
              type: 'climax',
              importance: 'critical'
            }
          ],
          archetypes: [
            {
              character: 'protagonist',
              arc: 'hero-journey',
              keyMoments: ['call-to-adventure', 'refusal', 'mentor', 'threshold', 'tests', 'revelation', 'transformation', 'return']
            }
          ]
        },
        events: [
          {
            title: 'Opening Scene',
            description: 'Introduction to protagonist and normal world',
            type: 'plot',
            category: 'opening',
            importance: 'critical'
          },
          {
            title: 'Inciting Incident',
            description: 'The event that disrupts the normal world',
            type: 'plot',
            category: 'catalyst',
            importance: 'critical'
          },
          {
            title: 'Midpoint Twist',
            description: 'Major revelation that changes everything',
            type: 'plot',
            category: 'revelation',
            importance: 'critical'
          },
          {
            title: 'Climax',
            description: 'Final confrontation and resolution',
            type: 'plot',
            category: 'climax',
            importance: 'critical'
          }
        ],
        settings: {
          defaultView: 'chronological',
          colorScheme: 'importance'
        },
        metadata: {
          author: 'System',
          difficulty: 'beginner',
          popularity: 95,
          rating: 4.8,
          usageCount: 0
        },
        isOfficial: true,
        createdAt: new Date()
      },
      {
        id: 'character-arc-template',
        name: 'Character Development Arc',
        description: 'Template for tracking character growth and transformation',
        type: 'character',
        genre: 'general',
        structure: {
          acts: [
            {
              name: 'Character Introduction',
              description: 'Establishing character traits and motivations',
              startPercent: 0,
              endPercent: 20,
              keyEvents: ['introduction', 'establishing-traits', 'initial-motivation'],
              themes: ['identity', 'status-quo', 'desires']
            },
            {
              name: 'Character Challenge',
              description: 'Testing and developing the character',
              startPercent: 20,
              endPercent: 80,
              keyEvents: ['first-challenge', 'growth-moments', 'setbacks', 'revelations'],
              themes: ['struggle', 'learning', 'adaptation']
            },
            {
              name: 'Character Transformation',
              description: 'Character reaches their final state',
              startPercent: 80,
              endPercent: 100,
              keyEvents: ['final-test', 'transformation', 'new-identity'],
              themes: ['change', 'resolution', 'growth']
            }
          ],
          milestones: [
            {
              name: 'Character Introduction',
              description: 'First appearance and establishment',
              position: 5,
              type: 'inciting-incident',
              importance: 'major'
            },
            {
              name: 'Character Growth Moment',
              description: 'Key moment of character development',
              position: 50,
              type: 'midpoint',
              importance: 'critical'
            },
            {
              name: 'Character Transformation',
              description: 'Final character state achieved',
              position: 90,
              type: 'resolution',
              importance: 'critical'
            }
          ],
          archetypes: []
        },
        events: [
          {
            title: 'Character Introduction',
            description: 'First appearance of the character',
            type: 'character',
            category: 'introduction',
            importance: 'major'
          },
          {
            title: 'Defining Moment',
            description: 'Event that defines character motivation',
            type: 'character',
            category: 'development',
            importance: 'critical'
          },
          {
            title: 'Growth Challenge',
            description: 'Challenge that forces character growth',
            type: 'character',
            category: 'challenge',
            importance: 'major'
          },
          {
            title: 'Transformation',
            description: 'Character achieves final transformed state',
            type: 'character',
            category: 'resolution',
            importance: 'critical'
          }
        ],
        settings: {
          defaultView: 'character',
          colorScheme: 'character'
        },
        metadata: {
          author: 'System',
          difficulty: 'intermediate',
          popularity: 78,
          rating: 4.6,
          usageCount: 0
        },
        isOfficial: true,
        createdAt: new Date()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private loadUserData(): void {
    try {
      const savedTimelines = localStorage.getItem('timelineManagement_timelines');
      if (savedTimelines) {
        const timelines = JSON.parse(savedTimelines);
        timelines.forEach((timeline: any) => {
          this.timelines.set(timeline.id, {
            ...timeline,
            startDate: new Date(timeline.startDate),
            endDate: new Date(timeline.endDate),
            createdAt: new Date(timeline.createdAt),
            updatedAt: new Date(timeline.updatedAt)
          });
        });
      }

      const savedEvents = localStorage.getItem('timelineManagement_events');
      if (savedEvents) {
        const events = JSON.parse(savedEvents);
        events.forEach((event: any) => {
          this.events.set(event.id, {
            ...event,
            date: new Date(event.date),
            endDate: event.endDate ? new Date(event.endDate) : undefined,
            createdAt: new Date(event.createdAt),
            updatedAt: new Date(event.updatedAt)
          });
        });
      }

      const savedTemplates = localStorage.getItem('timelineManagement_customTemplates');
      if (savedTemplates) {
        const templates = JSON.parse(savedTemplates);
        templates.forEach((template: any) => {
          this.templates.set(template.id, {
            ...template,
            createdAt: new Date(template.createdAt)
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load timeline management data:', error);
    }
  }

  private saveUserData(): void {
    try {
      // Ensure Maps are properly initialized before accessing
      if (!this.timelines || typeof this.timelines.values !== 'function') {
        this.timelines = new Map();
      }
      if (!this.events || typeof this.events.values !== 'function') {
        this.events = new Map();
      }
      if (!this.templates || typeof this.templates.values !== 'function') {
        this.templates = new Map();
      }

      const timelines = Array.from(this.timelines.values());
      localStorage.setItem('timelineManagement_timelines', JSON.stringify(timelines));

      const events = Array.from(this.events.values());
      localStorage.setItem('timelineManagement_events', JSON.stringify(events));

      const customTemplates = Array.from(this.templates.values()).filter(template => !template.isOfficial);
      localStorage.setItem('timelineManagement_customTemplates', JSON.stringify(customTemplates));
    } catch (error) {
      console.warn('Failed to save timeline management data:', error);
    }
  }

  public createTimeline(timelineData: Partial<Timeline>): Timeline {
    const timeline: Timeline = {
      id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: timelineData.name || 'New Timeline',
      description: timelineData.description || '',
      type: timelineData.type || 'main',
      startDate: timelineData.startDate || new Date(),
      endDate: timelineData.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      events: timelineData.events || [],
      settings: { ...this.defaultSettings, ...timelineData.settings },
      visibility: timelineData.visibility || 'private',
      metadata: timelineData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: timelineData.collaborators || []
    };

    this.timelines.set(timeline.id, timeline);
    this.saveUserData();
    this.emit('timelineCreated', timeline);
    return timeline;
  }

  public updateTimeline(id: string, updates: Partial<Timeline>): Timeline | null {
    const timeline = this.timelines.get(id);
    if (!timeline) {
      return null;
    }

    const updatedTimeline = {
      ...timeline,
      ...updates,
      updatedAt: new Date()
    };

    this.timelines.set(id, updatedTimeline);
    this.saveUserData();
    this.emit('timelineUpdated', updatedTimeline);
    return updatedTimeline;
  }

  public deleteTimeline(id: string): boolean {
    const timeline = this.timelines.get(id);
    if (!timeline) {
      return false;
    }

    timeline.events.forEach(eventId => {
      this.events.delete(eventId);
    });

    this.timelines.delete(id);
    this.saveUserData();
    this.emit('timelineDeleted', { id, timeline });
    return true;
  }

  public getTimelines(): Timeline[] {
    return Array.from(this.timelines.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  public getTimelineById(id: string): Timeline | null {
    return this.timelines.get(id) || null;
  }

  public createEvent(timelineId: string, eventData: Partial<TimelineEvent>): TimelineEvent | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      return null;
    }

    const event: TimelineEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: eventData.title || 'New Event',
      description: eventData.description || '',
      date: eventData.date || new Date(),
      endDate: eventData.endDate,
      type: eventData.type || 'plot',
      category: eventData.category || 'general',
      importance: eventData.importance || 'minor',
      characters: eventData.characters || [],
      locations: eventData.locations || [],
      tags: eventData.tags || [],
      color: eventData.color || this.getDefaultColor(eventData.type || 'plot'),
      metadata: eventData.metadata || {},
      relationships: {
        parentId: eventData.relationships?.parentId,
        childrenIds: eventData.relationships?.childrenIds || [],
        prerequisites: eventData.relationships?.prerequisites || [],
        consequences: eventData.relationships?.consequences || []
      },
      status: eventData.status || 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
      authorNotes: eventData.authorNotes || ''
    };

    this.events.set(event.id, event);
    timeline.events.push(event.id);
    timeline.updatedAt = new Date();

    this.timelines.set(timelineId, timeline);
    this.saveUserData();
    this.emit('eventCreated', { timelineId, event });
    return event;
  }

  public updateEvent(id: string, updates: Partial<TimelineEvent>): TimelineEvent | null {
    const event = this.events.get(id);
    if (!event) {
      return null;
    }

    const updatedEvent = {
      ...event,
      ...updates,
      updatedAt: new Date()
    };

    this.events.set(id, updatedEvent);
    this.saveUserData();
    this.emit('eventUpdated', updatedEvent);
    return updatedEvent;
  }

  public deleteEvent(id: string): boolean {
    const event = this.events.get(id);
    if (!event) {
      return false;
    }

    this.timelines.forEach(timeline => {
      const index = timeline.events.indexOf(id);
      if (index > -1) {
        timeline.events.splice(index, 1);
        timeline.updatedAt = new Date();
      }
    });

    this.events.delete(id);
    this.saveUserData();
    this.emit('eventDeleted', { id, event });
    return true;
  }

  public getTimelineEvents(timelineId: string): TimelineEvent[] {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      return [];
    }

    const events = timeline.events
      .map(eventId => this.events.get(eventId))
      .filter(event => event !== undefined) as TimelineEvent[];

    return timeline.settings.autoSort 
      ? events.sort((a, b) => a.date.getTime() - b.date.getTime())
      : events;
  }

  public searchEvents(criteria: TimelineSearchCriteria): TimelineEvent[] {
    let results = Array.from(this.events.values());

    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (criteria.dateRange) {
      results = results.filter(event =>
        event.date >= criteria.dateRange!.start && event.date <= criteria.dateRange!.end
      );
    }

    if (criteria.types && criteria.types.length > 0) {
      results = results.filter(event => criteria.types!.includes(event.type));
    }

    if (criteria.characters && criteria.characters.length > 0) {
      results = results.filter(event =>
        event.characters.some(char => criteria.characters!.includes(char))
      );
    }

    if (criteria.importance && criteria.importance.length > 0) {
      results = results.filter(event => criteria.importance!.includes(event.importance));
    }

    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  public analyzeTimeline(timelineId: string): TimelineAnalysis | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      return null;
    }

    const events = this.getTimelineEvents(timelineId);
    if (events.length === 0) {
      return this.createEmptyAnalysis();
    }

    const startDate = events[0].date;
    const endDate = events[events.length - 1].date;
    const duration = endDate.getTime() - startDate.getTime();

    const analysis: TimelineAnalysis = {
      totalEvents: events.length,
      timeSpan: {
        start: startDate,
        end: endDate,
        duration: Math.floor(duration / (1000 * 60 * 60 * 24)),
        unit: 'days'
      },
      eventDistribution: this.calculateEventDistribution(events),
      conflicts: this.detectConflicts(events),
      gaps: this.detectGaps(events),
      density: this.calculateDensity(events),
      characterActivity: this.analyzeCharacterActivity(events),
      suggestions: this.generateSuggestions(events, timeline)
    };

    return analysis;
  }

  private createEmptyAnalysis(): TimelineAnalysis {
    return {
      totalEvents: 0,
      timeSpan: {
        start: new Date(),
        end: new Date(),
        duration: 0,
        unit: 'days'
      },
      eventDistribution: {
        byType: {},
        byCategory: {},
        byImportance: {},
        byCharacter: {},
        byLocation: {}
      },
      conflicts: [],
      gaps: [],
      density: {
        eventsPerDay: 0,
        busiestPeriod: { start: new Date(), end: new Date(), eventCount: 0 },
        quietestPeriod: { start: new Date(), end: new Date(), eventCount: 0 }
      },
      characterActivity: [],
      suggestions: ['Add events to begin timeline analysis']
    };
  }

  private calculateEventDistribution(events: TimelineEvent[]): TimelineAnalysis['eventDistribution'] {
    const distribution = {
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byImportance: {} as Record<string, number>,
      byCharacter: {} as Record<string, number>,
      byLocation: {} as Record<string, number>
    };

    events.forEach(event => {
      distribution.byType[event.type] = (distribution.byType[event.type] || 0) + 1;
      distribution.byCategory[event.category] = (distribution.byCategory[event.category] || 0) + 1;
      distribution.byImportance[event.importance] = (distribution.byImportance[event.importance] || 0) + 1;

      event.characters.forEach(char => {
        distribution.byCharacter[char] = (distribution.byCharacter[char] || 0) + 1;
      });

      event.locations.forEach(loc => {
        distribution.byLocation[loc] = (distribution.byLocation[loc] || 0) + 1;
      });
    });

    return distribution;
  }

  private detectConflicts(events: TimelineEvent[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        if (this.eventsOverlap(event1, event2)) {
          const hasSharedCharacter = event1.characters.some(char => 
            event2.characters.includes(char)
          );

          if (hasSharedCharacter) {
            conflicts.push({
              id: `conflict-${Date.now()}-${i}-${j}`,
              type: 'overlap',
              severity: 'warning',
              description: `Character appears in overlapping events: "${event1.title}" and "${event2.title}"`,
              events: [event1.id, event2.id],
              suggestion: 'Adjust event timing or remove character overlap',
              autoFixAvailable: false
            });
          }
        }
      }
    }

    return conflicts;
  }

  private eventsOverlap(event1: TimelineEvent, event2: TimelineEvent): boolean {
    const start1 = event1.date;
    const end1 = event1.endDate || event1.date;
    const start2 = event2.date;
    const end2 = event2.endDate || event2.date;

    return start1 <= end2 && start2 <= end1;
  }

  private detectGaps(events: TimelineEvent[]): TimelineGap[] {
    const gaps: TimelineGap[] = [];
    
    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];
      
      const currentEnd = currentEvent.endDate || currentEvent.date;
      const gap = nextEvent.date.getTime() - currentEnd.getTime();
      const gapDays = gap / (1000 * 60 * 60 * 24);

      if (gapDays > 7) {
        gaps.push({
          id: `gap-${Date.now()}-${i}`,
          start: currentEnd,
          end: nextEvent.date,
          duration: gapDays,
          characters: [...new Set([...currentEvent.characters, ...nextEvent.characters])],
          description: `${gapDays.toFixed(1)} day gap between "${currentEvent.title}" and "${nextEvent.title}"`,
          suggestions: [
            'Add transitional events',
            'Consider character development during this period',
            'Add world-building events'
          ]
        });
      }
    }

    return gaps;
  }

  private calculateDensity(events: TimelineEvent[]): TimelineAnalysis['density'] {
    if (events.length < 2) {
      return {
        eventsPerDay: 0,
        busiestPeriod: { start: new Date(), end: new Date(), eventCount: 0 },
        quietestPeriod: { start: new Date(), end: new Date(), eventCount: 0 }
      };
    }

    const totalDays = (events[events.length - 1].date.getTime() - events[0].date.getTime()) / (1000 * 60 * 60 * 24);
    const eventsPerDay = events.length / totalDays;

    const weeklyBuckets = this.groupEventsByWeek(events);
    const busiestWeek = weeklyBuckets.reduce((max, week) => 
      week.eventCount > max.eventCount ? week : max
    );
    const quietestWeek = weeklyBuckets.reduce((min, week) => 
      week.eventCount < min.eventCount ? week : min
    );

    return {
      eventsPerDay,
      busiestPeriod: busiestWeek,
      quietestPeriod: quietestWeek
    };
  }

  private groupEventsByWeek(events: TimelineEvent[]): { start: Date; end: Date; eventCount: number }[] {
    const weeks: { start: Date; end: Date; eventCount: number }[] = [];
    
    if (events.length === 0) return weeks;

    const startDate = new Date(events[0].date);
    const endDate = new Date(events[events.length - 1].date);
    
    const currentWeekStart = new Date(startDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    while (currentWeekStart <= endDate) {
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

      const eventsInWeek = events.filter(event => 
        event.date >= currentWeekStart && event.date <= currentWeekEnd
      ).length;

      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(currentWeekEnd),
        eventCount: eventsInWeek
      });

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
  }

  private analyzeCharacterActivity(events: TimelineEvent[]): TimelineAnalysis['characterActivity'] {
    const characterMap = new Map<string, {
      eventCount: number;
      firstAppearance: Date;
      lastAppearance: Date;
      events: TimelineEvent[];
    }>();

    events.forEach(event => {
      event.characters.forEach(characterId => {
        if (!characterMap.has(characterId)) {
          characterMap.set(characterId, {
            eventCount: 0,
            firstAppearance: event.date,
            lastAppearance: event.date,
            events: []
          });
        }

        const charData = characterMap.get(characterId)!;
        charData.eventCount++;
        charData.events.push(event);
        
        if (event.date < charData.firstAppearance) {
          charData.firstAppearance = event.date;
        }
        if (event.date > charData.lastAppearance) {
          charData.lastAppearance = event.date;
        }
      });
    });

    return Array.from(characterMap.entries()).map(([characterId, data]) => ({
      characterId,
      name: characterId,
      eventCount: data.eventCount,
      firstAppearance: data.firstAppearance,
      lastAppearance: data.lastAppearance,
      activityPeriods: this.calculateActivityPeriods(data.events)
    }));
  }

  private calculateActivityPeriods(events: TimelineEvent[]): { start: Date; end: Date; intensity: number }[] {
    const sortedEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime());
    const periods: { start: Date; end: Date; intensity: number }[] = [];

    let currentPeriodStart = sortedEvents[0]?.date;
    let currentPeriodEvents = 1;
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const timeDiff = sortedEvents[i].date.getTime() - sortedEvents[i - 1].date.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        periods.push({
          start: currentPeriodStart,
          end: sortedEvents[i - 1].date,
          intensity: currentPeriodEvents
        });
        currentPeriodStart = sortedEvents[i].date;
        currentPeriodEvents = 1;
      } else {
        currentPeriodEvents++;
      }
    }

    if (sortedEvents.length > 0) {
      periods.push({
        start: currentPeriodStart,
        end: sortedEvents[sortedEvents.length - 1].date,
        intensity: currentPeriodEvents
      });
    }

    return periods;
  }

  private generateSuggestions(events: TimelineEvent[], timeline: Timeline): string[] {
    const suggestions: string[] = [];

    if (events.length < 5) {
      suggestions.push('Consider adding more events to create a richer timeline');
    }

    const criticalEvents = events.filter(e => e.importance === 'critical');
    if (criticalEvents.length === 0) {
      suggestions.push('Add critical plot points to strengthen your story structure');
    }

    const characterEvents = events.filter(e => e.type === 'character');
    if (characterEvents.length < events.length * 0.3) {
      suggestions.push('Add more character development events to enhance character arcs');
    }

    return suggestions;
  }

  private getDefaultColor(type: string): string {
    const colors = {
      plot: '#3B82F6',
      character: '#10B981',
      world: '#8B5CF6',
      historical: '#F59E0B',
      personal: '#EF4444'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  }

  public getTemplates(): TimelineTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => b.metadata.rating - a.metadata.rating);
  }

  public getTemplateById(id: string): TimelineTemplate | null {
    return this.templates.get(id) || null;
  }

  public createTimelineFromTemplate(templateId: string, customData: Partial<Timeline>): Timeline | null {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const timeline = this.createTimeline({
      ...customData,
      name: customData.name || template.name,
      description: customData.description || template.description,
      type: customData.type || template.type as Timeline['type'],
      settings: { ...this.defaultSettings, ...template.settings, ...customData.settings }
    });

    template.events.forEach(eventTemplate => {
      this.createEvent(timeline.id, {
        ...eventTemplate,
        date: customData.startDate || new Date()
      });
    });

    template.metadata.usageCount++;
    this.saveUserData();
    this.emit('timelineCreatedFromTemplate', { timeline, templateId });
    
    return timeline;
  }

  public exportTimeline(timelineId: string, exportConfig: TimelineExport): string | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      return null;
    }

    const events = this.getTimelineEvents(timelineId);
    let filteredEvents = events;

    if (exportConfig.options.dateRange) {
      filteredEvents = events.filter(event =>
        event.date >= exportConfig.options.dateRange!.start &&
        event.date <= exportConfig.options.dateRange!.end
      );
    }

    if (exportConfig.options.filterBy) {
      const filter = exportConfig.options.filterBy;
      
      if (filter.types) {
        filteredEvents = filteredEvents.filter(event => filter.types!.includes(event.type));
      }
      
      if (filter.characters) {
        filteredEvents = filteredEvents.filter(event =>
          event.characters.some(char => filter.characters!.includes(char))
        );
      }
      
      if (filter.importance) {
        filteredEvents = filteredEvents.filter(event => filter.importance!.includes(event.importance));
      }
    }

    switch (exportConfig.format) {
      case 'json':
        return JSON.stringify({
          timeline,
          events: filteredEvents,
          exportedAt: new Date(),
          exportConfig
        }, null, 2);

      case 'csv':
        return this.exportToCSV(filteredEvents, exportConfig.options);

      case 'outline':
        return this.exportToOutline(filteredEvents, timeline, exportConfig.options);

      default:
        return null;
    }
  }

  private exportToCSV(events: TimelineEvent[], options: TimelineExport['options']): string {
    const headers = ['Title', 'Date', 'Type', 'Category', 'Importance', 'Description'];
    
    if (options.includeMetadata) {
      headers.push('Characters', 'Locations', 'Tags');
    }

    const rows = [headers.join(',')];
    
    events.forEach(event => {
      const row = [
        `"${event.title}"`,
        event.date.toISOString().split('T')[0],
        event.type,
        event.category,
        event.importance,
        `"${event.description.replace(/"/g, '""')}"`
      ];

      if (options.includeMetadata) {
        row.push(
          `"${event.characters.join('; ')}"`,
          `"${event.locations.join('; ')}"`,
          `"${event.tags.join('; ')}"`
        );
      }

      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  private exportToOutline(events: TimelineEvent[], timeline: Timeline, options: TimelineExport['options']): string {
    const outline = [`# ${timeline.name}`, '', timeline.description, ''];

    if (options.groupBy === 'character') {
      const characterGroups = this.groupEventsByCharacter(events);
      Object.entries(characterGroups).forEach(([character, characterEvents]) => {
        outline.push(`## ${character}`, '');
        characterEvents.forEach(event => {
          outline.push(`- **${event.title}** (${event.date.toDateString()})`);
          outline.push(`  ${event.description}`);
          outline.push('');
        });
      });
    } else {
      outline.push('## Timeline Events', '');
      events.forEach(event => {
        outline.push(`### ${event.title}`);
        outline.push(`**Date:** ${event.date.toDateString()}`);
        outline.push(`**Type:** ${event.type} | **Category:** ${event.category} | **Importance:** ${event.importance}`);
        outline.push('');
        outline.push(event.description);
        outline.push('');
      });
    }

    return outline.join('\n');
  }

  private groupEventsByCharacter(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
    const groups: Record<string, TimelineEvent[]> = {};
    
    events.forEach(event => {
      if (event.characters.length === 0) {
        if (!groups['Unassigned']) groups['Unassigned'] = [];
        groups['Unassigned'].push(event);
      } else {
        event.characters.forEach(character => {
          if (!groups[character]) groups[character] = [];
          groups[character].push(event);
        });
      }
    });

    return groups;
  }

  public getAnalytics(): any {
    const totalTimelines = this.timelines.size;
    const totalEvents = this.events.size;
    
    const timelinesByType = Array.from(this.timelines.values()).reduce((acc, timeline) => {
      acc[timeline.type] = (acc[timeline.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByType = Array.from(this.events.values()).reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const templateUsage = Array.from(this.templates.values())
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 5);

    return {
      timelines: {
        total: totalTimelines,
        byType: timelinesByType
      },
      events: {
        total: totalEvents,
        byType: eventsByType,
        averagePerTimeline: totalTimelines > 0 ? totalEvents / totalTimelines : 0
      },
      templates: {
        total: this.templates.size,
        official: Array.from(this.templates.values()).filter(t => t.isOfficial).length,
        custom: Array.from(this.templates.values()).filter(t => !t.isOfficial).length,
        popular: templateUsage
      }
    };
  }

  /** 
   * Reset service state for testing purposes
   * @internal - For testing only
   */
  public resetForTesting(): void {
    this.timelines = new Map();
    this.events = new Map();
    this.templates = new Map();
    this.suggestions = new Map();
    this.initializeTemplates();
  }
}

export const timelineManagementService = new TimelineManagementService();