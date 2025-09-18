import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timelineManagementService } from '../../services/timelineManagementService';
import type { 
  Timeline, 
  TimelineEvent, 
  TimelineTemplate,
  TimelineSearchCriteria,
  TimelineExport
} from '../../services/timelineManagementService';

const mockLocalStorage = {
  data: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.data.get(key) || null),
  setItem: vi.fn((key: string, value: string) => mockLocalStorage.data.set(key, value)),
  removeItem: vi.fn((key: string) => mockLocalStorage.data.delete(key)),
  clear: vi.fn(() => mockLocalStorage.data.clear())
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('TimelineManagementService', () => {
  const testUserId = 'test-user-1';

  beforeEach(async () => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Properly reset the service state
    (timelineManagementService as any).timelines = new Map();
    (timelineManagementService as any).events = new Map();
    (timelineManagementService as any).templates = new Map();
    (timelineManagementService as any).suggestions = new Map();
    (timelineManagementService as any).removeAllListeners();
    
    (timelineManagementService as any).initializeTemplates();
    
    // Add small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe('Timeline Management', () => {
    it('should create a new timeline', () => {
      const timelineData = {
        name: 'My Story Timeline',
        description: 'Main timeline for my novel',
        type: 'main' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const timeline = timelineManagementService.createTimeline(timelineData);
      
      expect(timeline.id).toMatch(/^timeline-\d+$/);
      expect(timeline.name).toBe(timelineData.name);
      expect(timeline.type).toBe(timelineData.type);
      expect(timeline.startDate).toEqual(timelineData.startDate);
      expect(timeline.endDate).toEqual(timelineData.endDate);
      expect(timeline.events).toEqual([]);
      expect(timeline.visibility).toBe('private');
      expect(timeline.createdAt).toBeInstanceOf(Date);
    });

    it('should update timeline', () => {
      const timeline = timelineManagementService.createTimeline({
        name: 'Original Timeline'
      });

      const updated = timelineManagementService.updateTimeline(timeline.id, {
        name: 'Updated Timeline',
        description: 'New description'
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Timeline');
      expect(updated?.description).toBe('New description');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete timeline and its events', () => {
      const timeline = timelineManagementService.createTimeline({
        name: 'Timeline to Delete'
      });

      const event = timelineManagementService.createEvent(timeline.id, {
        title: 'Event in Timeline'
      });

      expect(event).toBeDefined();

      const deleted = timelineManagementService.deleteTimeline(timeline.id);
      expect(deleted).toBe(true);

      const retrieved = timelineManagementService.getTimelineById(timeline.id);
      expect(retrieved).toBeNull();
    });

    it('should get all timelines sorted by update date', () => {
      const timeline1 = timelineManagementService.createTimeline({ name: 'Timeline 1' });
      const timeline2 = timelineManagementService.createTimeline({ name: 'Timeline 2' });

      const timelines = timelineManagementService.getTimelines();
      expect(timelines).toHaveLength(2);
      expect(timelines[0].updatedAt.getTime()).toBeGreaterThanOrEqual(timelines[1].updatedAt.getTime());
    });

    it('should get timeline by ID', () => {
      const timeline = timelineManagementService.createTimeline({
        name: 'Test Timeline'
      });

      const retrieved = timelineManagementService.getTimelineById(timeline.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Timeline');
    });

    it('should return null for non-existent timeline', () => {
      const retrieved = timelineManagementService.getTimelineById('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('Event Management', () => {
    let timeline: Timeline;

    beforeEach(() => {
      timeline = timelineManagementService.createTimeline({
        name: 'Test Timeline'
      });
    });

    it('should create event in timeline', () => {
      const eventData = {
        title: 'Important Plot Point',
        description: 'A critical moment in the story',
        date: new Date('2024-06-15'),
        type: 'plot' as const,
        category: 'climax',
        importance: 'critical' as const,
        characters: ['protagonist', 'antagonist'],
        locations: ['castle'],
        tags: ['action', 'revelation']
      };

      const event = timelineManagementService.createEvent(timeline.id, eventData);
      
      expect(event).toBeDefined();
      expect(event?.id).toMatch(/^event-\d+$/);
      expect(event?.title).toBe(eventData.title);
      expect(event?.type).toBe(eventData.type);
      expect(event?.importance).toBe(eventData.importance);
      expect(event?.characters).toEqual(eventData.characters);
      expect(event?.status).toBe('planned');

      const updatedTimeline = timelineManagementService.getTimelineById(timeline.id);
      expect(updatedTimeline?.events).toContain(event?.id);
    });

    it('should update event', () => {
      const event = timelineManagementService.createEvent(timeline.id, {
        title: 'Original Event'
      });

      const updated = timelineManagementService.updateEvent(event!.id, {
        title: 'Updated Event',
        importance: 'major',
        status: 'complete'
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated Event');
      expect(updated?.importance).toBe('major');
      expect(updated?.status).toBe('complete');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete event from timeline', () => {
      const event = timelineManagementService.createEvent(timeline.id, {
        title: 'Event to Delete'
      });

      expect(event).toBeDefined();

      const deleted = timelineManagementService.deleteEvent(event!.id);
      expect(deleted).toBe(true);

      const updatedTimeline = timelineManagementService.getTimelineById(timeline.id);
      expect(updatedTimeline?.events).not.toContain(event?.id);
    });

    it('should get timeline events sorted by date', () => {
      const event1 = timelineManagementService.createEvent(timeline.id, {
        title: 'Event 1',
        date: new Date('2024-01-15')
      });

      const event2 = timelineManagementService.createEvent(timeline.id, {
        title: 'Event 2',
        date: new Date('2024-01-10')
      });

      const events = timelineManagementService.getTimelineEvents(timeline.id);
      expect(events).toHaveLength(2);
      expect(events[0].date.getTime()).toBeLessThanOrEqual(events[1].date.getTime());
      
      const sortedTitles = events.map(e => e.title);
      expect(sortedTitles).toContain('Event 1');
      expect(sortedTitles).toContain('Event 2');
    });

    it('should return empty array for non-existent timeline events', () => {
      const events = timelineManagementService.getTimelineEvents('non-existent');
      expect(events).toEqual([]);
    });
  });

  describe('Event Search', () => {
    let timeline: Timeline;
    let events: (TimelineEvent | null)[];

    beforeEach(() => {
      timeline = timelineManagementService.createTimeline({
        name: 'Search Test Timeline'
      });

      events = [
        timelineManagementService.createEvent(timeline.id, {
          title: 'Dragon Attack',
          description: 'The dragon attacks the village',
          type: 'plot',
          characters: ['hero', 'dragon'],
          importance: 'critical',
          date: new Date('2024-01-15')
        }),
        timelineManagementService.createEvent(timeline.id, {
          title: 'Hero Training',
          description: 'Hero learns sword fighting',
          type: 'character',
          characters: ['hero'],
          importance: 'major',
          date: new Date('2024-01-10')
        }),
        timelineManagementService.createEvent(timeline.id, {
          title: 'Village Festival',
          description: 'Annual celebration in the village',
          type: 'world',
          characters: ['villagers'],
          importance: 'minor',
          date: new Date('2024-01-20')
        })
      ];
    });

    it('should search events by query', () => {
      const results = timelineManagementService.searchEvents({
        query: 'dragon'
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Dragon Attack');
    });

    it('should search events by date range', () => {
      const results = timelineManagementService.searchEvents({
        dateRange: {
          start: new Date('2024-01-12'),
          end: new Date('2024-01-18')
        }
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Dragon Attack');
    });

    it('should search events by type', () => {
      const results = timelineManagementService.searchEvents({
        types: ['character', 'world']
      });

      expect(results).toHaveLength(2);
      expect(results.map(e => e.type)).toEqual(['character', 'world']);
    });

    it('should search events by characters', () => {
      const results = timelineManagementService.searchEvents({
        characters: ['hero']
      });

      expect(results).toHaveLength(2);
      expect(results.every(e => e.characters.includes('hero'))).toBe(true);
    });

    it('should search events by importance', () => {
      const results = timelineManagementService.searchEvents({
        importance: ['critical', 'major']
      });

      expect(results).toHaveLength(2);
      expect(results.map(e => e.importance)).toEqual(['major', 'critical']);
    });

    it('should combine multiple search criteria', () => {
      const results = timelineManagementService.searchEvents({
        characters: ['hero'],
        importance: ['critical']
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Dragon Attack');
    });
  });

  describe('Timeline Analysis', () => {
    let timeline: Timeline;

    beforeEach(() => {
      timeline = timelineManagementService.createTimeline({
        name: 'Analysis Timeline'
      });

      timelineManagementService.createEvent(timeline.id, {
        title: 'Event 1',
        type: 'plot',
        importance: 'critical',
        characters: ['hero'],
        date: new Date('2024-01-01')
      });

      timelineManagementService.createEvent(timeline.id, {
        title: 'Event 2',
        type: 'character',
        importance: 'major',
        characters: ['hero', 'mentor'],
        date: new Date('2024-01-05')
      });

      timelineManagementService.createEvent(timeline.id, {
        title: 'Event 3',
        type: 'plot',
        importance: 'minor',
        characters: ['villain'],
        date: new Date('2024-01-10')
      });
    });

    it('should analyze timeline', () => {
      const analysis = timelineManagementService.analyzeTimeline(timeline.id);
      
      expect(analysis).toBeDefined();
      expect(analysis?.totalEvents).toBe(3);
      expect(analysis?.timeSpan.duration).toBe(9);
      expect(analysis?.eventDistribution.byType.plot).toBe(2);
      expect(analysis?.eventDistribution.byType.character).toBe(1);
      expect(analysis?.eventDistribution.byImportance.critical).toBe(1);
      expect(analysis?.eventDistribution.byCharacter.hero).toBe(2);
    });

    it('should return empty analysis for timeline without events', () => {
      const emptyTimeline = timelineManagementService.createTimeline({
        name: 'Empty Timeline'
      });

      const analysis = timelineManagementService.analyzeTimeline(emptyTimeline.id);
      
      expect(analysis).toBeDefined();
      expect(analysis?.totalEvents).toBe(0);
      expect(analysis?.suggestions).toContain('Add events to begin timeline analysis');
    });

    it('should detect character activity patterns', () => {
      const analysis = timelineManagementService.analyzeTimeline(timeline.id);
      
      expect(analysis?.characterActivity).toHaveLength(3);
      
      const heroActivity = analysis?.characterActivity.find(ca => ca.characterId === 'hero');
      expect(heroActivity).toBeDefined();
      expect(heroActivity?.eventCount).toBe(2);
      expect(heroActivity?.firstAppearance).toEqual(new Date('2024-01-01'));
      expect(heroActivity?.lastAppearance).toEqual(new Date('2024-01-05'));
    });

    it('should detect conflicts in overlapping events', () => {
      timelineManagementService.createEvent(timeline.id, {
        title: 'Overlapping Event',
        characters: ['hero'],
        date: new Date('2024-01-01'),
        endDate: new Date('2024-01-05')
      });

      const analysis = timelineManagementService.analyzeTimeline(timeline.id);
      
      expect(analysis?.conflicts.length).toBeGreaterThan(0);
      expect(analysis?.conflicts[0].type).toBe('overlap');
      expect(analysis?.conflicts[0].severity).toBe('warning');
    });

    it('should detect gaps between events', () => {
      timelineManagementService.createEvent(timeline.id, {
        title: 'Far Event',
        characters: ['hero'],
        date: new Date('2024-02-01')
      });

      const analysis = timelineManagementService.analyzeTimeline(timeline.id);
      
      expect(analysis?.gaps.length).toBeGreaterThan(0);
      expect(analysis?.gaps[0].duration).toBeGreaterThan(7);
    });

    it('should return null for non-existent timeline analysis', () => {
      const analysis = timelineManagementService.analyzeTimeline('non-existent');
      expect(analysis).toBeNull();
    });
  });

  describe('Templates', () => {
    it('should get all templates', () => {
      const templates = timelineManagementService.getTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].metadata.rating).toBeGreaterThanOrEqual(templates[templates.length - 1].metadata.rating);
    });

    it('should get template by ID', () => {
      const template = timelineManagementService.getTemplateById('three-act-structure');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Three-Act Structure');
      expect(template?.isOfficial).toBe(true);
    });

    it('should return null for non-existent template', () => {
      const template = timelineManagementService.getTemplateById('non-existent');
      expect(template).toBeNull();
    });

    it('should create timeline from template', () => {
      const timeline = timelineManagementService.createTimelineFromTemplate('three-act-structure', {
        name: 'My Three-Act Story',
        startDate: new Date('2024-01-01')
      });

      expect(timeline).toBeDefined();
      expect(timeline?.name).toBe('My Three-Act Story');
      expect(timeline?.type).toBe('narrative');

      const events = timelineManagementService.getTimelineEvents(timeline!.id);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should return null when creating from non-existent template', () => {
      const timeline = timelineManagementService.createTimelineFromTemplate('non-existent', {
        name: 'Failed Timeline'
      });

      expect(timeline).toBeNull();
    });

    it('should increment template usage count', () => {
      const templateBefore = timelineManagementService.getTemplateById('three-act-structure');
      const initialUsage = templateBefore?.metadata.usageCount || 0;

      timelineManagementService.createTimelineFromTemplate('three-act-structure', {
        name: 'Usage Test'
      });

      const templateAfter = timelineManagementService.getTemplateById('three-act-structure');
      expect(templateAfter?.metadata.usageCount).toBe(initialUsage + 1);
    });
  });

  describe('Export Functionality', () => {
    let timeline: Timeline;

    beforeEach(() => {
      timeline = timelineManagementService.createTimeline({
        name: 'Export Timeline'
      });

      timelineManagementService.createEvent(timeline.id, {
        title: 'Export Event 1',
        description: 'First event for export',
        type: 'plot',
        importance: 'critical',
        characters: ['hero'],
        date: new Date('2024-01-01')
      });

      timelineManagementService.createEvent(timeline.id, {
        title: 'Export Event 2',
        description: 'Second event for export',
        type: 'character',
        importance: 'major',
        characters: ['villain'],
        date: new Date('2024-01-15')
      });
    });

    it('should export timeline as JSON', () => {
      const exportConfig: TimelineExport = {
        format: 'json',
        options: {
          includeMetadata: true,
          includeRelationships: false,
          sortBy: 'date'
        }
      };

      const exported = timelineManagementService.exportTimeline(timeline.id, exportConfig);
      
      expect(exported).toBeDefined();
      expect(exported).toContain('"timeline"');
      expect(exported).toContain('"events"');
      expect(exported).toContain('Export Event 1');

      const parsed = JSON.parse(exported!);
      expect(parsed.timeline.id).toBe(timeline.id);
      expect(parsed.events).toHaveLength(2);
    });

    it('should export timeline as CSV', () => {
      const exportConfig: TimelineExport = {
        format: 'csv',
        options: {
          includeMetadata: true,
          includeRelationships: false,
          sortBy: 'date'
        }
      };

      const exported = timelineManagementService.exportTimeline(timeline.id, exportConfig);
      
      expect(exported).toBeDefined();
      expect(exported).toContain('Title,Date,Type,Category,Importance,Description');
      expect(exported).toContain('Export Event 1');
      expect(exported).toContain('Export Event 2');
    });

    it('should export timeline as outline', () => {
      const exportConfig: TimelineExport = {
        format: 'outline',
        options: {
          includeMetadata: false,
          includeRelationships: false,
          sortBy: 'date'
        }
      };

      const exported = timelineManagementService.exportTimeline(timeline.id, exportConfig);
      
      expect(exported).toBeDefined();
      expect(exported).toContain('# Export Timeline');
      expect(exported).toContain('### Export Event 1');
      expect(exported).toContain('### Export Event 2');
    });

    it('should filter events by date range in export', () => {
      const exportConfig: TimelineExport = {
        format: 'json',
        options: {
          includeMetadata: false,
          includeRelationships: false,
          dateRange: {
            start: new Date('2024-01-10'),
            end: new Date('2024-01-20')
          },
          sortBy: 'date'
        }
      };

      const exported = timelineManagementService.exportTimeline(timeline.id, exportConfig);
      const parsed = JSON.parse(exported!);
      
      expect(parsed.events).toHaveLength(1);
      expect(parsed.events[0].title).toBe('Export Event 2');
    });

    it('should filter events by type in export', () => {
      const exportConfig: TimelineExport = {
        format: 'json',
        options: {
          includeMetadata: false,
          includeRelationships: false,
          filterBy: {
            types: ['character']
          },
          sortBy: 'date'
        }
      };

      const exported = timelineManagementService.exportTimeline(timeline.id, exportConfig);
      const parsed = JSON.parse(exported!);
      
      expect(parsed.events).toHaveLength(1);
      expect(parsed.events[0].type).toBe('character');
    });

    it('should return null for non-existent timeline export', () => {
      const exportConfig: TimelineExport = {
        format: 'json',
        options: {
          includeMetadata: false,
          includeRelationships: false,
          sortBy: 'date'
        }
      };

      const exported = timelineManagementService.exportTimeline('non-existent', exportConfig);
      expect(exported).toBeNull();
    });
  });

  describe('Analytics', () => {
    it('should provide comprehensive analytics', () => {
      const timeline1 = timelineManagementService.createTimeline({
        name: 'Timeline 1',
        type: 'main'
      });

      const timeline2 = timelineManagementService.createTimeline({
        name: 'Timeline 2',
        type: 'character'
      });

      timelineManagementService.createEvent(timeline1.id, {
        title: 'Plot Event',
        type: 'plot'
      });

      timelineManagementService.createEvent(timeline1.id, {
        title: 'Character Event',
        type: 'character'
      });

      timelineManagementService.createEvent(timeline2.id, {
        title: 'World Event',
        type: 'world'
      });

      const analytics = timelineManagementService.getAnalytics();
      
      expect(analytics.timelines.total).toBe(2);
      expect(analytics.timelines.byType.main).toBe(1);
      expect(analytics.timelines.byType.character).toBe(1);
      expect(analytics.events.total).toBe(3);
      expect(analytics.events.byType.plot).toBe(1);
      expect(analytics.events.byType.character).toBe(1);
      expect(analytics.events.byType.world).toBe(1);
      expect(analytics.events.averagePerTimeline).toBe(1.5);
      expect(analytics.templates.total).toBeGreaterThan(0);
      expect(analytics.templates.official).toBeGreaterThan(0);
    });

    it('should handle zero timelines gracefully', () => {
      const analytics = timelineManagementService.getAnalytics();
      
      expect(analytics.timelines.total).toBe(0);
      expect(analytics.events.total).toBe(0);
      expect(analytics.events.averagePerTimeline).toBe(0);
    });
  });

  describe('Data Persistence', () => {
    it('should persist timelines to localStorage', () => {
      const timeline = timelineManagementService.createTimeline({
        name: 'Persistent Timeline'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'timelineManagement_timelines',
        expect.any(String)
      );
    });

    it('should persist events to localStorage', () => {
      const timeline = timelineManagementService.createTimeline({
        name: 'Test Timeline'
      });

      timelineManagementService.createEvent(timeline.id, {
        title: 'Persistent Event'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'timelineManagement_events',
        expect.any(String)
      );
    });

    it('should handle corrupted localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        (timelineManagementService as any).loadUserData();
      }).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should emit timelineCreated event', () => {
      const listener = vi.fn();
      timelineManagementService.on('timelineCreated', listener);

      const timeline = timelineManagementService.createTimeline({
        name: 'Event Test Timeline'
      });

      expect(listener).toHaveBeenCalledWith(timeline);
    });

    it('should emit eventCreated event', () => {
      const listener = vi.fn();
      timelineManagementService.on('eventCreated', listener);

      const timeline = timelineManagementService.createTimeline({
        name: 'Test Timeline'
      });

      const event = timelineManagementService.createEvent(timeline.id, {
        title: 'Event Test'
      });

      expect(listener).toHaveBeenCalledWith({
        timelineId: timeline.id,
        event
      });
    });

    it('should emit timelineUpdated event', () => {
      const listener = vi.fn();
      timelineManagementService.on('timelineUpdated', listener);

      const timeline = timelineManagementService.createTimeline({
        name: 'Original Timeline'
      });

      const updated = timelineManagementService.updateTimeline(timeline.id, {
        name: 'Updated Timeline'
      });

      expect(listener).toHaveBeenCalledWith(updated);
    });

    it('should emit timelineDeleted event', () => {
      const listener = vi.fn();
      timelineManagementService.on('timelineDeleted', listener);

      const timeline = timelineManagementService.createTimeline({
        name: 'Timeline to Delete'
      });

      timelineManagementService.deleteTimeline(timeline.id);

      expect(listener).toHaveBeenCalledWith({
        id: timeline.id,
        timeline
      });
    });

    it('should emit timelineCreatedFromTemplate event', () => {
      const listener = vi.fn();
      timelineManagementService.on('timelineCreatedFromTemplate', listener);

      const timeline = timelineManagementService.createTimelineFromTemplate('three-act-structure', {
        name: 'Template Test'
      });

      expect(listener).toHaveBeenCalledWith({
        timeline,
        templateId: 'three-act-structure'
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return null when updating non-existent timeline', () => {
      const updated = timelineManagementService.updateTimeline('non-existent', {
        name: 'Updated'
      });

      expect(updated).toBeNull();
    });

    it('should return false when deleting non-existent timeline', () => {
      const deleted = timelineManagementService.deleteTimeline('non-existent');
      expect(deleted).toBe(false);
    });

    it('should return null when creating event in non-existent timeline', () => {
      const event = timelineManagementService.createEvent('non-existent', {
        title: 'Failed Event'
      });

      expect(event).toBeNull();
    });

    it('should return null when updating non-existent event', () => {
      const updated = timelineManagementService.updateEvent('non-existent', {
        title: 'Updated'
      });

      expect(updated).toBeNull();
    });

    it('should return false when deleting non-existent event', () => {
      const deleted = timelineManagementService.deleteEvent('non-existent');
      expect(deleted).toBe(false);
    });

    it('should handle empty search results', () => {
      const results = timelineManagementService.searchEvents({
        query: 'nonexistent-term-xyz'
      });

      expect(results).toEqual([]);
    });

    it('should handle analysis of timeline with single event', () => {
      const timeline = timelineManagementService.createTimeline({
        name: 'Single Event Timeline'
      });

      timelineManagementService.createEvent(timeline.id, {
        title: 'Only Event',
        date: new Date('2024-01-01')
      });

      const analysis = timelineManagementService.analyzeTimeline(timeline.id);
      
      expect(analysis).toBeDefined();
      expect(analysis?.totalEvents).toBe(1);
      expect(analysis?.timeSpan.duration).toBe(0);
    });

    it('should handle export with unsupported format gracefully', () => {
      const timeline = timelineManagementService.createTimeline({
        name: 'Export Timeline'
      });

      const exported = timelineManagementService.exportTimeline(timeline.id, {
        format: 'unsupported' as any,
        options: {
          includeMetadata: false,
          includeRelationships: false,
          sortBy: 'date'
        }
      });

      expect(exported).toBeNull();
    });
  });
});