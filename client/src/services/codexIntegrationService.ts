/**
 * Codex Integration Service - Phase 1C Feature
 * Seamlessly integrates the advanced Codex system with existing plot board and timeline systems
 */

import { advancedCodexService } from './advancedCodexService';
import { universeManagementService } from './universeManagementService';
import type {
  AdvancedCodexEntity,
  AdvancedEntityType,
  EntityLink,
  Timeline,
  TimelineEvent
} from '@/types/codex';

// Integration-specific interfaces
export interface PlotBoardIntegration {
  sceneId: string;
  sceneName: string;
  entityMentions: SceneEntityMention[];
  suggestedEntities: EntitySuggestion[];
  consistencyWarnings: PlotConsistencyWarning[];
  characterArcs: CharacterArcProgress[];
  thematicElements: ThematicElement[];
}

export interface SceneEntityMention {
  entityId: string;
  entityName: string;
  entityType: AdvancedEntityType;
  mentionType: 'present' | 'mentioned' | 'referenced' | 'implied';
  importance: 'primary' | 'secondary' | 'background';
  confidence: number;
  textPosition?: { start: number; end: number };
  context: string;
  isVerified: boolean;
}

export interface EntitySuggestion {
  suggestedName: string;
  suggestedType: AdvancedEntityType;
  confidence: number;
  reasoning: string;
  textEvidence: string[];
  relatedEntities: string[];
  shouldCreate: boolean;
}

export interface PlotConsistencyWarning {
  type: 'character_location' | 'timeline_conflict' | 'relationship_inconsistency' | 'attribute_mismatch';
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  affectedEntities: string[];
  suggestedFix: string;
  relatedScenes: string[];
}

export interface CharacterArcProgress {
  characterId: string;
  characterName: string;
  arcStage: 'introduction' | 'development' | 'conflict' | 'climax' | 'resolution';
  progress: number; // 0-100%
  keyMoments: ArcMoment[];
  nextSuggestedDevelopment: string;
}

export interface ArcMoment {
  sceneId: string;
  sceneName: string;
  momentType: 'goal_established' | 'obstacle_encountered' | 'growth_moment' | 'setback' | 'revelation' | 'transformation';
  description: string;
  impact: 'minor' | 'moderate' | 'major' | 'pivotal';
}

export interface ThematicElement {
  theme: string;
  manifestations: ThemeManifestation[];
  development: 'emerging' | 'developing' | 'prominent' | 'resolving';
  relatedEntities: string[];
}

export interface ThemeManifestation {
  sceneId: string;
  type: 'symbol' | 'dialogue' | 'action' | 'setting' | 'conflict';
  description: string;
  strength: number; // 0-1
}

export interface TimelineIntegration {
  timelineId: string;
  timelineName: string;
  entityEvents: EntityTimelineEvent[];
  conflicts: TimelineConflict[];
  gaps: TimelineGap[];
  suggestions: TimelineSuggestion[];
}

export interface EntityTimelineEvent {
  eventId: string;
  entityId: string;
  entityName: string;
  eventType: 'birth' | 'death' | 'creation' | 'destruction' | 'first_appearance' | 'last_appearance' | 'transformation' | 'milestone';
  date?: string;
  relativePosition: number; // Position in story timeline
  description: string;
  importance: number; // 1-5
  sceneReferences: string[];
  consequences: string[];
}

export interface TimelineConflict {
  type: 'impossible_timing' | 'character_age' | 'travel_time' | 'causality_violation' | 'simultaneous_events';
  description: string;
  conflictingEvents: string[];
  affectedEntities: string[];
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  suggestedResolution: string;
}

export interface TimelineGap {
  startEvent?: string;
  endEvent?: string;
  duration: string;
  affectedEntities: string[];
  type: 'missing_events' | 'unexplained_gap' | 'development_leap';
  suggestions: string[];
}

export interface TimelineSuggestion {
  type: 'add_event' | 'clarify_timing' | 'bridge_gap' | 'parallel_timeline';
  description: string;
  entityIds: string[];
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface ProjectIntegrationState {
  projectId: string;
  plotBoardSync: {
    lastSyncAt: string;
    sceneCount: number;
    entityMentionCount: number;
    pendingUpdates: number;
  };
  timelineSync: {
    lastSyncAt: string;
    eventCount: number;
    conflictCount: number;
    pendingEvents: number;
  };
  consistencyScore: number;
  integrationHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface AutoSyncSettings {
  enableAutoSync: boolean;
  syncFrequency: 'real_time' | 'every_minute' | 'every_5_minutes' | 'manual';
  enableEntityDetection: boolean;
  enableTimelineValidation: boolean;
  enableConsistencyChecking: boolean;
  autoCreateEntities: boolean;
  autoLinkEntities: boolean;
  notifyOnConflicts: boolean;
}

class CodexIntegrationService {
  private integrationStates: Map<string, ProjectIntegrationState> = new Map();
  private autoSyncSettings: AutoSyncSettings;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private pendingUpdates: Map<string, any[]> = new Map();

  constructor() {
    this.autoSyncSettings = this.getDefaultAutoSyncSettings();
    this.loadSettings();
  }

  // PLOT BOARD INTEGRATION

  async analyzeSceneForEntities(sceneId: string, sceneContent: string, projectId: string): Promise<PlotBoardIntegration> {
    try {
      const startTime = Date.now();
      
      // Get existing project entities for reference
      const projectEntities = await advancedCodexService.searchEntities({ projectId });
      const entityMap = new Map(projectEntities.results.map(r => [r.entity.id, r.entity]));
      
      // Detect entity mentions in scene content
      const entityMentions = await this.detectEntityMentionsInScene(sceneContent, entityMap);
      
      // Suggest new entities based on content
      const suggestedEntities = await this.suggestEntitiesFromContent(sceneContent, projectEntities.results.map(r => r.entity));
      
      // Check for consistency warnings
      const consistencyWarnings = await this.checkSceneConsistency(sceneId, entityMentions, projectId);
      
      // Analyze character arc progress
      const characterArcs = await this.analyzeCharacterArcs(sceneId, entityMentions, projectId);
      
      // Identify thematic elements
      const thematicElements = await this.identifyThematicElements(sceneContent, entityMentions);
      
      const integration: PlotBoardIntegration = {
        sceneId,
        sceneName: `Scene ${sceneId}`, // Would get actual scene name
        entityMentions,
        suggestedEntities,
        consistencyWarnings,
        characterArcs,
        thematicElements
      };
      
      // Update integration state
      this.updateIntegrationState(projectId, 'plot_board', {
        lastSyncAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });
      
      return integration;
      
    } catch (error) {
      console.error('Scene analysis failed:', error);
      throw new Error(`Failed to analyze scene: ${error.message}`);
    }
  }

  async syncSceneWithCodex(sceneId: string, sceneContent: string, projectId: string): Promise<{
    entitiesLinked: number;
    entitiesCreated: number;
    warnings: string[];
  }> {
    try {
      const analysis = await this.analyzeSceneForEntities(sceneId, sceneContent, projectId);
      let entitiesLinked = 0;
      let entitiesCreated = 0;
      const warnings: string[] = [];
      
      // Auto-create suggested entities if enabled
      if (this.autoSyncSettings.autoCreateEntities) {
        for (const suggestion of analysis.suggestedEntities) {
          if (suggestion.shouldCreate && suggestion.confidence > 0.8) {
            try {
              const newEntity = await advancedCodexService.createEntity(
                projectId,
                suggestion.suggestedType,
                {
                  name: suggestion.suggestedName,
                  summary: `Auto-created from scene ${sceneId}`,
                  description: suggestion.reasoning,
                  tags: ['auto-created'],
                  importance: 3
                }
              );
              entitiesCreated++;
              
              // Link to scene
              await this.linkEntityToScene(newEntity.id, sceneId, 'auto-detected');
              entitiesLinked++;
            } catch (error) {
              warnings.push(`Failed to create entity "${suggestion.suggestedName}": ${error.message}`);
            }
          }
        }
      }
      
      // Auto-link existing entities if enabled
      if (this.autoSyncSettings.autoLinkEntities) {
        for (const mention of analysis.entityMentions) {
          if (!mention.isVerified && mention.confidence > 0.7) {
            try {
              await this.linkEntityToScene(mention.entityId, sceneId, mention.mentionType);
              entitiesLinked++;
            } catch (error) {
              warnings.push(`Failed to link entity "${mention.entityName}" to scene: ${error.message}`);
            }
          }
        }
      }
      
      // Report consistency warnings
      for (const warning of analysis.consistencyWarnings) {
        if (warning.severity === 'error' || warning.severity === 'critical') {
          warnings.push(warning.description);
        }
      }
      
      return { entitiesLinked, entitiesCreated, warnings };
      
    } catch (error) {
      console.error('Scene sync failed:', error);
      throw error;
    }
  }

  async getSceneEntitySummary(sceneId: string, projectId: string): Promise<{
    characters: AdvancedCodexEntity[];
    locations: AdvancedCodexEntity[];
    objects: AdvancedCodexEntity[];
    themes: string[];
    conflicts: string[];
  }> {
    try {
      // Get all entities linked to this scene
      const linkedEntities = await this.getEntitiesLinkedToScene(sceneId, projectId);
      
      // Categorize entities
      const characters = linkedEntities.filter(e => e.type === 'character');
      const locations = linkedEntities.filter(e => e.type === 'location');
      const objects = linkedEntities.filter(e => e.type === 'object');
      
      // Extract themes and conflicts from linked entities
      const themes = [...new Set(linkedEntities.flatMap(e => e.tags.filter(tag => tag.includes('theme'))))];
      const conflicts = [...new Set(linkedEntities.flatMap(e => e.tags.filter(tag => tag.includes('conflict'))))];
      
      return { characters, locations, objects, themes, conflicts };
      
    } catch (error) {
      console.error('Failed to get scene entity summary:', error);
      throw error;
    }
  }

  // TIMELINE INTEGRATION

  async integrateWithTimeline(timelineId: string, projectId: string): Promise<TimelineIntegration> {
    try {
      // Get timeline data
      const timeline = await universeManagementService.getUniverseTimeline(projectId);
      if (!timeline) {
        throw new Error('Timeline not found');
      }
      
      // Get project entities
      const projectEntities = await advancedCodexService.searchEntities({ projectId });
      
      // Create entity timeline events
      const entityEvents = await this.generateEntityTimelineEvents(projectEntities.results.map(r => r.entity), timeline);
      
      // Detect timeline conflicts
      const conflicts = await this.detectTimelineConflicts(entityEvents, timeline);
      
      // Identify timeline gaps
      const gaps = await this.identifyTimelineGaps(entityEvents, timeline);
      
      // Generate suggestions
      const suggestions = await this.generateTimelineSuggestions(entityEvents, conflicts, gaps);
      
      return {
        timelineId: timeline.id,
        timelineName: timeline.name,
        entityEvents,
        conflicts,
        gaps,
        suggestions
      };
      
    } catch (error) {
      console.error('Timeline integration failed:', error);
      throw error;
    }
  }

  async syncEntityWithTimeline(entityId: string, timelineId: string): Promise<{
    eventsAdded: number;
    conflictsDetected: number;
    suggestions: string[];
  }> {
    try {
      const entity = await advancedCodexService.getEntity(entityId);
      const timeline = await universeManagementService.getUniverseTimeline(entity.projectId);
      
      if (!timeline) {
        throw new Error('Timeline not found');
      }
      
      let eventsAdded = 0;
      let conflictsDetected = 0;
      const suggestions: string[] = [];
      
      // Generate timeline events for this entity
      const entityEvents = await this.generateEntitySpecificEvents(entity, timeline);
      
      // Add events to timeline
      for (const event of entityEvents) {
        try {
          await universeManagementService.addEntityToTimeline(timelineId, entityId, event);
          eventsAdded++;
        } catch (error) {
          console.warn(`Failed to add event to timeline:`, error);
          conflictsDetected++;
        }
      }
      
      // Generate suggestions for timeline integration
      if (entity.type === 'character') {
        suggestions.push('Consider adding character birth/death events if applicable');
        suggestions.push('Track major character development milestones');
      } else if (entity.type === 'location') {
        suggestions.push('Add founding/destruction dates for locations');
        suggestions.push('Track significant events at this location');
      } else if (entity.type === 'organization') {
        suggestions.push('Include formation and dissolution dates');
        suggestions.push('Track leadership changes and major decisions');
      }
      
      return { eventsAdded, conflictsDetected, suggestions };
      
    } catch (error) {
      console.error('Entity timeline sync failed:', error);
      throw error;
    }
  }

  async validateTimelineConsistency(projectId: string): Promise<{
    overallScore: number;
    conflicts: TimelineConflict[];
    gaps: TimelineGap[];
    recommendations: string[];
  }> {
    try {
      const integration = await this.integrateWithTimeline('main', projectId);
      
      // Calculate overall consistency score
      const conflictPenalty = integration.conflicts.length * 10;
      const gapPenalty = integration.gaps.length * 5;
      const overallScore = Math.max(0, 100 - conflictPenalty - gapPenalty);
      
      // Generate recommendations
      const recommendations: string[] = [];
      
      if (integration.conflicts.length > 0) {
        recommendations.push(`Resolve ${integration.conflicts.length} timeline conflicts`);
      }
      
      if (integration.gaps.length > 0) {
        recommendations.push(`Address ${integration.gaps.length} timeline gaps`);
      }
      
      const criticalConflicts = integration.conflicts.filter(c => c.severity === 'critical');
      if (criticalConflicts.length > 0) {
        recommendations.push(`Immediately address ${criticalConflicts.length} critical timeline issues`);
      }
      
      return {
        overallScore,
        conflicts: integration.conflicts,
        gaps: integration.gaps,
        recommendations
      };
      
    } catch (error) {
      console.error('Timeline validation failed:', error);
      throw error;
    }
  }

  // AUTO-SYNC FUNCTIONALITY

  async enableAutoSync(projectId: string, settings?: Partial<AutoSyncSettings>): Promise<void> {
    if (settings) {
      this.autoSyncSettings = { ...this.autoSyncSettings, ...settings };
      this.saveSettings();
    }
    
    if (!this.autoSyncSettings.enableAutoSync) return;
    
    // Clear existing interval
    const existingInterval = this.syncIntervals.get(projectId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    // Set up new sync interval
    let intervalMs: number;
    switch (this.autoSyncSettings.syncFrequency) {
      case 'real_time': intervalMs = 5000; break; // 5 seconds
      case 'every_minute': intervalMs = 60000; break;
      case 'every_5_minutes': intervalMs = 300000; break;
      default: return; // Manual sync
    }
    
    const interval = setInterval(async () => {
      try {
        await this.performAutoSync(projectId);
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, intervalMs);
    
    this.syncIntervals.set(projectId, interval);
  }

  async disableAutoSync(projectId: string): Promise<void> {
    const interval = this.syncIntervals.get(projectId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(projectId);
    }
  }

  private async performAutoSync(projectId: string): Promise<void> {
    try {
      // Get pending updates
      const pendingUpdates = this.pendingUpdates.get(projectId) || [];
      if (pendingUpdates.length === 0) return;
      
      // Process each pending update
      for (const update of pendingUpdates) {
        switch (update.type) {
          case 'scene_updated':
            if (this.autoSyncSettings.enableEntityDetection) {
              await this.syncSceneWithCodex(update.sceneId, update.content, projectId);
            }
            break;
          case 'entity_updated':
            if (this.autoSyncSettings.enableTimelineValidation) {
              await this.validateEntityTimeline(update.entityId, projectId);
            }
            break;
          case 'timeline_updated':
            if (this.autoSyncSettings.enableConsistencyChecking) {
              await this.validateTimelineConsistency(projectId);
            }
            break;
        }
      }
      
      // Clear processed updates
      this.pendingUpdates.delete(projectId);
      
      // Update integration state
      this.updateIntegrationState(projectId, 'auto_sync', {
        lastSyncAt: new Date().toISOString(),
        processedUpdates: pendingUpdates.length
      });
      
    } catch (error) {
      console.error('Auto-sync processing failed:', error);
    }
  }

  // ENTITY DETECTION AND ANALYSIS

  private async detectEntityMentionsInScene(
    sceneContent: string,
    entityMap: Map<string, AdvancedCodexEntity>
  ): Promise<SceneEntityMention[]> {
    const mentions: SceneEntityMention[] = [];
    
    for (const [entityId, entity] of entityMap) {
      // Check for entity name and aliases
      const searchTerms = [entity.name, ...entity.aliases];
      
      for (const term of searchTerms) {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(sceneContent)) !== null) {
          const contextStart = Math.max(0, match.index - 50);
          const contextEnd = Math.min(sceneContent.length, match.index + term.length + 50);
          const context = sceneContent.slice(contextStart, contextEnd);
          
          mentions.push({
            entityId,
            entityName: entity.name,
            entityType: entity.type,
            mentionType: this.determineMentionType(match[0], context),
            importance: this.determineImportance(entity, context),
            confidence: this.calculateMentionConfidence(term, match[0], context),
            textPosition: { start: match.index, end: match.index + match[0].length },
            context,
            isVerified: false
          });
        }
      }
    }
    
    return mentions.sort((a, b) => b.confidence - a.confidence);
  }

  private async suggestEntitiesFromContent(
    content: string,
    existingEntities: AdvancedCodexEntity[]
  ): Promise<EntitySuggestion[]> {
    const suggestions: EntitySuggestion[] = [];
    
    // Use NLP techniques to identify potential entities
    // This is a simplified implementation - would use actual NLP in production
    
    // Look for proper nouns that aren't existing entities
    const existingNames = new Set(existingEntities.flatMap(e => [e.name, ...e.aliases]));
    const properNouns = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    
    for (const noun of properNouns) {
      if (!existingNames.has(noun) && noun.length > 2) {
        const entityType = this.guessEntityType(noun, content);
        const confidence = this.calculateSuggestionConfidence(noun, content);
        
        if (confidence > 0.6) {
          suggestions.push({
            suggestedName: noun,
            suggestedType: entityType,
            confidence,
            reasoning: `Detected proper noun "${noun}" in content`,
            textEvidence: this.findTextEvidence(noun, content),
            relatedEntities: this.findRelatedEntities(noun, existingEntities),
            shouldCreate: confidence > 0.8
          });
        }
      }
    }
    
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Limit suggestions
  }

  private async checkSceneConsistency(
    sceneId: string,
    entityMentions: SceneEntityMention[],
    projectId: string
  ): Promise<PlotConsistencyWarning[]> {
    const warnings: PlotConsistencyWarning[] = [];
    
    // Check for character location consistency
    const characterMentions = entityMentions.filter(m => m.entityType === 'character');
    const locationMentions = entityMentions.filter(m => m.entityType === 'location');
    
    for (const character of characterMentions) {
      // Check if character's known location conflicts with scene location
      // This would require more detailed entity data about character locations
      // For now, this is a placeholder for the logic
    }
    
    // Check for timeline conflicts
    // This would check if events in the scene conflict with established timeline
    
    // Check for relationship inconsistencies
    // This would validate that character interactions match established relationships
    
    return warnings;
  }

  private async analyzeCharacterArcs(
    sceneId: string,
    entityMentions: SceneEntityMention[],
    projectId: string
  ): Promise<CharacterArcProgress[]> {
    const characterArcs: CharacterArcProgress[] = [];
    
    const characters = entityMentions.filter(m => m.entityType === 'character');
    
    for (const character of characters) {
      // Analyze character's arc progress
      // This would require tracking character development across scenes
      const progress: CharacterArcProgress = {
        characterId: character.entityId,
        characterName: character.entityName,
        arcStage: 'development', // Would be calculated based on story position
        progress: 65, // Would be calculated based on character development
        keyMoments: [], // Would track significant character moments
        nextSuggestedDevelopment: 'Consider exploring character\'s internal conflict'
      };
      
      characterArcs.push(progress);
    }
    
    return characterArcs;
  }

  private async identifyThematicElements(
    sceneContent: string,
    entityMentions: SceneEntityMention[]
  ): Promise<ThematicElement[]> {
    const themes: ThematicElement[] = [];
    
    // Identify common themes through keyword analysis
    const themeKeywords = {
      'redemption': ['forgive', 'redeem', 'atone', 'second chance'],
      'sacrifice': ['sacrifice', 'give up', 'loss', 'selfless'],
      'power': ['power', 'control', 'authority', 'dominance'],
      'love': ['love', 'heart', 'devotion', 'affection'],
      'betrayal': ['betray', 'deceive', 'backstab', 'trust']
    };
    
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const manifestations: ThemeManifestation[] = [];
      
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = sceneContent.match(regex);
        
        if (matches) {
          manifestations.push({
            sceneId: 'current', // Would be actual scene ID
            type: 'dialogue', // Would be determined from context
            description: `Theme manifested through keyword: ${keyword}`,
            strength: matches.length / 10 // Simplified strength calculation
          });
        }
      }
      
      if (manifestations.length > 0) {
        themes.push({
          theme,
          manifestations,
          development: 'developing',
          relatedEntities: entityMentions.map(m => m.entityId)
        });
      }
    }
    
    return themes;
  }

  // TIMELINE METHODS

  private async generateEntityTimelineEvents(
    entities: AdvancedCodexEntity[],
    timeline: Timeline
  ): Promise<EntityTimelineEvent[]> {
    const events: EntityTimelineEvent[] = [];
    
    for (const entity of entities) {
      // Generate events based on entity type and data
      switch (entity.type) {
        case 'character':
          // Add birth, death, first appearance events
          if (entity.data?.background?.birthday) {
            events.push({
              eventId: `birth-${entity.id}`,
              entityId: entity.id,
              entityName: entity.name,
              eventType: 'birth',
              date: entity.data.background.birthday,
              relativePosition: 0,
              description: `Birth of ${entity.name}`,
              importance: 3,
              sceneReferences: [],
              consequences: []
            });
          }
          break;
          
        case 'location':
          // Add founding, destruction events
          if (entity.data?.history?.founded) {
            events.push({
              eventId: `founded-${entity.id}`,
              entityId: entity.id,
              entityName: entity.name,
              eventType: 'creation',
              date: entity.data.history.founded,
              relativePosition: 0,
              description: `Founding of ${entity.name}`,
              importance: 4,
              sceneReferences: [],
              consequences: []
            });
          }
          break;
          
        case 'organization':
          // Add formation, major events
          if (entity.data?.history?.formed) {
            events.push({
              eventId: `formed-${entity.id}`,
              entityId: entity.id,
              entityName: entity.name,
              eventType: 'creation',
              date: entity.data.history.formed,
              relativePosition: 0,
              description: `Formation of ${entity.name}`,
              importance: 4,
              sceneReferences: [],
              consequences: []
            });
          }
          break;
      }
    }
    
    return events.sort((a, b) => a.relativePosition - b.relativePosition);
  }

  private async generateEntitySpecificEvents(
    entity: AdvancedCodexEntity,
    timeline: Timeline
  ): Promise<Partial<TimelineEvent>[]> {
    const events: Partial<TimelineEvent>[] = [];
    
    // Generate events specific to this entity
    events.push({
      title: `First appearance of ${entity.name}`,
      description: `${entity.name} is introduced in the story`,
      type: 'character',
      entityIds: [entity.id],
      importance: Math.min(5, entity.importance + 1)
    });
    
    // Add type-specific events
    if (entity.type === 'character' && entity.data?.timeline) {
      for (const timelineEvent of entity.data.timeline) {
        events.push({
          title: timelineEvent.event,
          description: timelineEvent.event,
          type: timelineEvent.type,
          entityIds: [entity.id],
          importance: timelineEvent.importance,
          date: timelineEvent.date
        });
      }
    }
    
    return events;
  }

  private async detectTimelineConflicts(
    entityEvents: EntityTimelineEvent[],
    timeline: Timeline
  ): Promise<TimelineConflict[]> {
    const conflicts: TimelineConflict[] = [];
    
    // Check for impossible timing
    for (let i = 0; i < entityEvents.length; i++) {
      for (let j = i + 1; j < entityEvents.length; j++) {
        const event1 = entityEvents[i];
        const event2 = entityEvents[j];
        
        // Check if same character dies before being born
        if (event1.entityId === event2.entityId) {
          if (event1.eventType === 'death' && event2.eventType === 'birth' && 
              event1.relativePosition < event2.relativePosition) {
            conflicts.push({
              type: 'impossible_timing',
              description: `${event1.entityName} dies before being born`,
              conflictingEvents: [event1.eventId, event2.eventId],
              affectedEntities: [event1.entityId],
              severity: 'critical',
              suggestedResolution: 'Adjust event timing or remove conflicting events'
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  private async identifyTimelineGaps(
    entityEvents: EntityTimelineEvent[],
    timeline: Timeline
  ): Promise<TimelineGap[]> {
    const gaps: TimelineGap[] = [];
    
    // Look for large gaps between events for the same entity
    const eventsByEntity = new Map<string, EntityTimelineEvent[]>();
    
    for (const event of entityEvents) {
      if (!eventsByEntity.has(event.entityId)) {
        eventsByEntity.set(event.entityId, []);
      }
      eventsByEntity.get(event.entityId)!.push(event);
    }
    
    for (const [entityId, events] of eventsByEntity) {
      events.sort((a, b) => a.relativePosition - b.relativePosition);
      
      for (let i = 0; i < events.length - 1; i++) {
        const gap = events[i + 1].relativePosition - events[i].relativePosition;
        
        if (gap > 10) { // Arbitrary threshold for "large gap"
          gaps.push({
            startEvent: events[i].eventId,
            endEvent: events[i + 1].eventId,
            duration: `${gap} story units`,
            affectedEntities: [entityId],
            type: 'unexplained_gap',
            suggestions: [
              'Add intermediate events to bridge the gap',
              'Explain what happened during this period',
              'Consider if this gap affects character development'
            ]
          });
        }
      }
    }
    
    return gaps;
  }

  private async generateTimelineSuggestions(
    entityEvents: EntityTimelineEvent[],
    conflicts: TimelineConflict[],
    gaps: TimelineGap[]
  ): Promise<TimelineSuggestion[]> {
    const suggestions: TimelineSuggestion[] = [];
    
    // Suggest fixes for conflicts
    for (const conflict of conflicts) {
      suggestions.push({
        type: 'clarify_timing',
        description: `Resolve timing conflict: ${conflict.description}`,
        entityIds: conflict.affectedEntities,
        priority: conflict.severity === 'critical' ? 'high' : 'medium',
        reasoning: conflict.suggestedResolution
      });
    }
    
    // Suggest filling gaps
    for (const gap of gaps) {
      suggestions.push({
        type: 'bridge_gap',
        description: `Consider adding events to bridge timeline gap`,
        entityIds: gap.affectedEntities,
        priority: 'low',
        reasoning: gap.suggestions.join('; ')
      });
    }
    
    return suggestions;
  }

  // UTILITY METHODS

  private determineMentionType(matchedText: string, context: string): SceneEntityMention['mentionType'] {
    // Analyze context to determine how entity is mentioned
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('said') || lowerContext.includes('replied') || lowerContext.includes('spoke')) {
      return 'present';
    } else if (lowerContext.includes('remembered') || lowerContext.includes('thought of')) {
      return 'referenced';
    } else {
      return 'mentioned';
    }
  }

  private determineImportance(entity: AdvancedCodexEntity, context: string): SceneEntityMention['importance'] {
    // Determine importance based on entity data and context
    if (entity.importance >= 4) return 'primary';
    if (entity.importance >= 3) return 'secondary';
    return 'background';
  }

  private calculateMentionConfidence(searchTerm: string, matchedText: string, context: string): number {
    let confidence = 0.5;
    
    // Exact match increases confidence
    if (searchTerm.toLowerCase() === matchedText.toLowerCase()) {
      confidence += 0.3;
    }
    
    // Context clues increase confidence
    if (context.toLowerCase().includes('character') || context.toLowerCase().includes('person')) {
      confidence += 0.1;
    }
    
    // Proper capitalization increases confidence
    if (matchedText[0] === matchedText[0].toUpperCase()) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  private guessEntityType(name: string, content: string): AdvancedEntityType {
    const lowerContent = content.toLowerCase();
    const lowerName = name.toLowerCase();
    
    // Simple heuristics for entity type detection
    if (lowerContent.includes(lowerName) && (
      lowerContent.includes('said') || 
      lowerContent.includes('walked') || 
      lowerContent.includes('thought')
    )) {
      return 'character';
    }
    
    if (lowerName.includes('castle') || lowerName.includes('city') || lowerName.includes('town')) {
      return 'location';
    }
    
    if (lowerName.includes('sword') || lowerName.includes('ring') || lowerName.includes('crown')) {
      return 'object';
    }
    
    if (lowerName.includes('guild') || lowerName.includes('order') || lowerName.includes('council')) {
      return 'organization';
    }
    
    // Default to character for proper nouns
    return 'character';
  }

  private calculateSuggestionConfidence(name: string, content: string): number {
    let confidence = 0.3; // Base confidence
    
    const occurrences = (content.match(new RegExp(name, 'g')) || []).length;
    confidence += Math.min(0.4, occurrences * 0.1);
    
    // Context indicators
    const contextIndicators = ['said', 'walked', 'looked', 'thought', 'went to', 'from'];
    for (const indicator of contextIndicators) {
      if (content.toLowerCase().includes(name.toLowerCase() + ' ' + indicator)) {
        confidence += 0.2;
        break;
      }
    }
    
    return Math.min(1.0, confidence);
  }

  private findTextEvidence(name: string, content: string): string[] {
    const evidence: string[] = [];
    const sentences = content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(name.toLowerCase())) {
        evidence.push(sentence.trim());
      }
    }
    
    return evidence.slice(0, 3); // Limit evidence
  }

  private findRelatedEntities(name: string, existingEntities: AdvancedCodexEntity[]): string[] {
    // Simple relation detection based on co-occurrence
    // In practice, this would be more sophisticated
    return existingEntities
      .filter(entity => entity.name !== name)
      .slice(0, 3)
      .map(entity => entity.id);
  }

  private async linkEntityToScene(entityId: string, sceneId: string, linkType: string): Promise<void> {
    try {
      // This would create a link between entity and scene in the database
      await advancedCodexService.linkToPlotBoard?.(entityId, sceneId);
    } catch (error) {
      console.error('Failed to link entity to scene:', error);
      throw error;
    }
  }

  private async getEntitiesLinkedToScene(sceneId: string, projectId: string): Promise<AdvancedCodexEntity[]> {
    try {
      // This would retrieve all entities linked to a specific scene
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Failed to get entities linked to scene:', error);
      return [];
    }
  }

  private async validateEntityTimeline(entityId: string, projectId: string): Promise<void> {
    try {
      // Validate that entity's timeline events are consistent
      const entity = await advancedCodexService.getEntity(entityId);
      const timeline = await universeManagementService.getUniverseTimeline(projectId);
      
      if (timeline && entity.data?.timeline) {
        // Check for conflicts between entity timeline and project timeline
        // Implementation would depend on specific timeline structure
      }
    } catch (error) {
      console.error('Entity timeline validation failed:', error);
    }
  }

  // STATE MANAGEMENT

  private updateIntegrationState(
    projectId: string,
    component: 'plot_board' | 'timeline' | 'auto_sync',
    data: any
  ): void {
    const state = this.integrationStates.get(projectId) || this.createDefaultState(projectId);
    
    switch (component) {
      case 'plot_board':
        state.plotBoardSync = { ...state.plotBoardSync, ...data };
        break;
      case 'timeline':
        state.timelineSync = { ...state.timelineSync, ...data };
        break;
    }
    
    // Update overall health score
    state.integrationHealth = this.calculateIntegrationHealth(state);
    
    this.integrationStates.set(projectId, state);
  }

  private createDefaultState(projectId: string): ProjectIntegrationState {
    return {
      projectId,
      plotBoardSync: {
        lastSyncAt: new Date().toISOString(),
        sceneCount: 0,
        entityMentionCount: 0,
        pendingUpdates: 0
      },
      timelineSync: {
        lastSyncAt: new Date().toISOString(),
        eventCount: 0,
        conflictCount: 0,
        pendingEvents: 0
      },
      consistencyScore: 100,
      integrationHealth: 'excellent'
    };
  }

  private calculateIntegrationHealth(state: ProjectIntegrationState): ProjectIntegrationState['integrationHealth'] {
    let score = 100;
    
    // Deduct for pending updates
    score -= state.plotBoardSync.pendingUpdates * 2;
    score -= state.timelineSync.pendingEvents * 3;
    score -= state.timelineSync.conflictCount * 5;
    
    // Consider consistency score
    score = (score + state.consistencyScore) / 2;
    
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  // SETTINGS MANAGEMENT

  private getDefaultAutoSyncSettings(): AutoSyncSettings {
    return {
      enableAutoSync: true,
      syncFrequency: 'every_5_minutes',
      enableEntityDetection: true,
      enableTimelineValidation: true,
      enableConsistencyChecking: true,
      autoCreateEntities: false,
      autoLinkEntities: true,
      notifyOnConflicts: true
    };
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('codex_integration_settings');
      if (stored) {
        this.autoSyncSettings = { ...this.autoSyncSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load integration settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('codex_integration_settings', JSON.stringify(this.autoSyncSettings));
    } catch (error) {
      console.warn('Failed to save integration settings:', error);
    }
  }

  // PUBLIC API

  getIntegrationState(projectId: string): ProjectIntegrationState | null {
    return this.integrationStates.get(projectId) || null;
  }

  updateAutoSyncSettings(settings: Partial<AutoSyncSettings>): void {
    this.autoSyncSettings = { ...this.autoSyncSettings, ...settings };
    this.saveSettings();
  }

  getAutoSyncSettings(): AutoSyncSettings {
    return { ...this.autoSyncSettings };
  }

  queueUpdate(projectId: string, update: any): void {
    if (!this.pendingUpdates.has(projectId)) {
      this.pendingUpdates.set(projectId, []);
    }
    this.pendingUpdates.get(projectId)!.push(update);
  }

  // CLEANUP

  dispose(): void {
    // Clear all intervals
    for (const interval of this.syncIntervals.values()) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();
    
    // Clear state
    this.integrationStates.clear();
    this.pendingUpdates.clear();
  }
}

// Export singleton instance
export const codexIntegrationService = new CodexIntegrationService();
export default codexIntegrationService;