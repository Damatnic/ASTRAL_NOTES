/**
 * Automated Consistency Checking System
 * Validates timeline, character, world-building, and plot consistency
 */

import { openaiService } from './openaiService';
import { env } from '@/config/env';

export interface ConsistencyCheck {
  id: string;
  type: 'timeline' | 'character' | 'world' | 'plot' | 'fact';
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  
  // Issue Details
  title: string;
  description: string;
  explanation: string;
  
  // Location Information
  locations: ConsistencyLocation[];
  affectedElements: string[];
  
  // Resolution
  suggestedFix: string;
  alternativeFixes: string[];
  autoFixable: boolean;
  
  // Context
  context: ConsistencyContext;
  confidence: number;
  
  // Metadata
  detectedAt: Date;
  status: 'open' | 'resolved' | 'ignored' | 'false-positive';
  userNotes?: string;
}

export interface ConsistencyLocation {
  documentId: string;
  chapter?: number;
  scene?: string;
  paragraph?: number;
  position: { start: number; end: number };
  excerpt: string;
  context: string;
}

export interface ConsistencyContext {
  relatedCharacters: string[];
  relatedLocations: string[];
  relatedEvents: string[];
  relatedFacts: string[];
  timeframe: string;
  dependencies: string[];
}

export interface TimelineEntry {
  id: string;
  eventName: string;
  description: string;
  timestamp: TimelineTimestamp;
  duration?: number;
  location?: string;
  participants: string[];
  consequences: string[];
  references: DocumentReference[];
  type: 'scene' | 'background-event' | 'character-action' | 'world-event';
}

export interface TimelineTimestamp {
  type: 'absolute' | 'relative' | 'approximate';
  value: string | number;
  unit?: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  relativeTo?: string;
  precision: 'exact' | 'approximate' | 'vague';
  textualReference: string;
}

export interface DocumentReference {
  documentId: string;
  chapter?: number;
  scene?: string;
  position: number;
  excerpt: string;
}

export interface CharacterState {
  characterId: string;
  timestamp: string;
  location: string;
  physicalState: PhysicalState;
  emotionalState: EmotionalState;
  knowledge: KnowledgeState;
  relationships: RelationshipState[];
  possessions: string[];
  abilities: string[];
  status: 'alive' | 'dead' | 'missing' | 'unknown';
}

export interface PhysicalState {
  health: number;
  injuries: Injury[];
  fatigue: number;
  appearance: AppearanceState;
  age?: number;
}

export interface Injury {
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  location: string;
  healingTime?: number;
  impact: string[];
  acquiredAt: string;
}

export interface AppearanceState {
  clothing: string[];
  accessories: string[];
  physicalChanges: string[];
  distinctiveFeatures: string[];
}

export interface EmotionalState {
  primaryEmotion: string;
  intensity: number;
  triggers: string[];
  manifestations: string[];
  stability: number;
}

export interface KnowledgeState {
  knownFacts: Fact[];
  secrets: Secret[];
  suspicions: Suspicion[];
  memories: Memory[];
  skills: Skill[];
}

export interface Fact {
  id: string;
  content: string;
  source: string;
  confidence: number;
  category: string;
  learntAt: string;
}

export interface Secret {
  id: string;
  content: string;
  importance: number;
  revealConditions: string[];
  knownBy: string[];
}

export interface Suspicion {
  id: string;
  content: string;
  confidence: number;
  evidence: string[];
  target: string;
}

export interface Memory {
  id: string;
  content: string;
  clarity: number;
  emotional_weight: number;
  triggers: string[];
  timeframe: string;
}

export interface Skill {
  name: string;
  level: number;
  experience: string[];
  limitations: string[];
}

export interface RelationshipState {
  targetCharacter: string;
  relationship: string;
  trust: number;
  affection: number;
  respect: number;
  knowledge: number;
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  event: string;
  impact: number;
  timestamp: string;
  consequences: string[];
}

export interface WorldState {
  timestamp: string;
  locations: LocationState[];
  systems: SystemState[];
  politics: PoliticalState[];
  economics: EconomicState[];
  culture: CulturalState[];
  technology: TechnologyState[];
  magic?: MagicSystemState;
}

export interface LocationState {
  id: string;
  name: string;
  description: string;
  features: string[];
  inhabitants: string[];
  events: string[];
  accessibility: string[];
  resources: string[];
  threats: string[];
  changes: LocationChange[];
}

export interface LocationChange {
  timestamp: string;
  type: 'construction' | 'destruction' | 'modification' | 'population' | 'governance';
  description: string;
  impact: string[];
  duration?: string;
}

export interface SystemState {
  id: string;
  type: 'magic' | 'technology' | 'political' | 'economic' | 'social';
  name: string;
  rules: Rule[];
  limitations: string[];
  exceptions: Exception[];
  evolution: SystemEvolution[];
}

export interface Rule {
  id: string;
  description: string;
  scope: string;
  exceptions: string[];
  consequences: string[];
  examples: string[];
}

export interface Exception {
  condition: string;
  effect: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'unique';
  requirements: string[];
}

export interface SystemEvolution {
  timestamp: string;
  change: string;
  reason: string;
  impact: string[];
}

export interface PlotThread {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'subplot' | 'character-arc' | 'mystery' | 'romance';
  status: 'setup' | 'developing' | 'climax' | 'resolution' | 'concluded';
  
  // Structure
  elements: PlotElement[];
  dependencies: string[];
  conflicts: PlotConflict[];
  
  // Progress
  milestones: PlotMilestone[];
  currentStage: string;
  completionPercentage: number;
  
  // Consistency
  plantedElements: PlantedElement[];
  payoffs: Payoff[];
  foreshadowing: ForeshadowingElement[];
}

export interface PlotElement {
  id: string;
  type: 'setup' | 'catalyst' | 'development' | 'climax' | 'resolution';
  description: string;
  importance: number;
  dependencies: string[];
  location: DocumentReference;
}

export interface PlotConflict {
  id: string;
  type: 'internal' | 'interpersonal' | 'societal' | 'environmental' | 'supernatural';
  description: string;
  participants: string[];
  stakes: string;
  escalation: ConflictEscalation[];
  resolution?: ConflictResolution;
}

export interface ConflictEscalation {
  stage: number;
  description: string;
  triggers: string[];
  consequences: string[];
  location: DocumentReference;
}

export interface ConflictResolution {
  type: 'victory' | 'defeat' | 'compromise' | 'transformation' | 'stalemate';
  description: string;
  consequences: string[];
  satisfaction: number;
}

export interface PlotMilestone {
  id: string;
  name: string;
  description: string;
  targetChapter?: number;
  actualChapter?: number;
  status: 'pending' | 'completed' | 'delayed' | 'modified';
  importance: number;
}

export interface PlantedElement {
  id: string;
  type: 'clue' | 'foreshadowing' | 'setup' | 'character-trait' | 'world-rule';
  description: string;
  plantedAt: DocumentReference;
  payoffTarget: string;
  subtlety: number;
  resolved: boolean;
}

export interface Payoff {
  id: string;
  description: string;
  setupElements: string[];
  location: DocumentReference;
  satisfaction: number;
  completeness: number;
}

export interface ForeshadowingElement {
  id: string;
  description: string;
  targetEvent: string;
  subtlety: number;
  location: DocumentReference;
  effectiveness: number;
}

export interface ConsistencyReport {
  summary: ConsistencyScore;
  issues: ConsistencyCheck[];
  timeline: TimelineAnalysis;
  characters: CharacterAnalysis[];
  world: WorldAnalysis;
  plot: PlotAnalysis;
  recommendations: Recommendation[];
  generatedAt: Date;
}

export interface ConsistencyScore {
  overall: number;
  timeline: number;
  character: number;
  world: number;
  plot: number;
  factual: number;
}

export interface TimelineAnalysis {
  coherence: number;
  gaps: TimelineGap[];
  conflicts: TimelineConflict[];
  implausibilities: TimelineImplausibility[];
}

export interface TimelineGap {
  start: string;
  end: string;
  duration: string;
  affectedCharacters: string[];
  missingEvents: string[];
}

export interface TimelineConflict {
  events: string[];
  description: string;
  severity: 'minor' | 'major' | 'critical';
  suggestedResolution: string;
}

export interface TimelineImplausibility {
  event: string;
  reason: string;
  likelihood: number;
  alternativeExplanations: string[];
}

export interface CharacterAnalysis {
  characterId: string;
  consistencyScore: number;
  issues: CharacterIssue[];
  development: CharacterDevelopmentAnalysis;
  relationships: RelationshipAnalysis[];
}

export interface CharacterIssue {
  type: 'trait-inconsistency' | 'knowledge-error' | 'ability-inconsistency' | 'appearance-change' | 'relationship-error';
  description: string;
  evidence: DocumentReference[];
  impact: 'minor' | 'moderate' | 'major';
}

export interface CharacterDevelopmentAnalysis {
  arcCompletion: number;
  growth: GrowthMetric[];
  regressions: string[];
  unresolvedTraumas: string[];
}

export interface GrowthMetric {
  aspect: string;
  startState: number;
  currentState: number;
  targetState: number;
  progression: 'on-track' | 'ahead' | 'behind' | 'stalled';
}

export interface RelationshipAnalysis {
  characters: [string, string];
  consistency: number;
  development: 'improving' | 'declining' | 'stable' | 'fluctuating';
  unrealistic_changes: string[];
}

export interface WorldAnalysis {
  coherence: number;
  ruleViolations: RuleViolation[];
  systemInconsistencies: SystemInconsistency[];
  geographyIssues: GeographyIssue[];
}

export interface RuleViolation {
  rule: string;
  violation: string;
  location: DocumentReference;
  severity: 'minor' | 'moderate' | 'severe';
  explanation?: string;
}

export interface SystemInconsistency {
  system: string;
  inconsistency: string;
  locations: DocumentReference[];
  impact: string;
}

export interface GeographyIssue {
  type: 'distance' | 'travel-time' | 'accessibility' | 'description';
  description: string;
  locations: string[];
  evidence: DocumentReference[];
}

export interface PlotAnalysis {
  structure: PlotStructureAnalysis;
  threads: PlotThreadAnalysis[];
  pacing: PacingAnalysis;
  satisfaction: SatisfactionAnalysis;
}

export interface PlotStructureAnalysis {
  adherence: number;
  missingElements: string[];
  weakPoints: PlotWeakPoint[];
  strengths: string[];
}

export interface PlotWeakPoint {
  element: string;
  issue: string;
  impact: string;
  suggestions: string[];
}

export interface PlotThreadAnalysis {
  threadId: string;
  completion: number;
  consistency: number;
  satisfaction: number;
  unresolved_elements: string[];
}

export interface PacingAnalysis {
  overall: number;
  acts: ActPacing[];
  issues: PacingIssue[];
}

export interface ActPacing {
  act: number;
  pacing: 'too-slow' | 'good' | 'too-fast';
  events: number;
  tension: number;
}

export interface PacingIssue {
  location: string;
  type: 'rushed' | 'dragging' | 'uneven';
  description: string;
  suggestion: string;
}

export interface SatisfactionAnalysis {
  setup_payoff: number;
  character_arcs: number;
  plot_resolution: number;
  thematic_coherence: number;
}

export interface Recommendation {
  type: 'fix' | 'improvement' | 'suggestion';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  impact: string;
}

class ConsistencyChecker {
  private initialized = false;
  private timeline: TimelineEntry[] = [];
  private characterStates: Map<string, CharacterState[]> = new Map();
  private worldStates: WorldState[] = [];
  private plotThreads: PlotThread[] = [];
  private consistencyCache: Map<string, ConsistencyCheck[]> = new Map();

  /**
   * Perform comprehensive consistency check
   */
  async performConsistencyCheck(
    documents: Document[],
    characters: Character[],
    worldElements: WorldElement[],
    plotThreads: PlotThread[]
  ): Promise<ConsistencyReport> {
    const issues: ConsistencyCheck[] = [];

    // Timeline consistency
    const timelineIssues = await this.checkTimelineConsistency(documents);
    issues.push(...timelineIssues);

    // Character consistency
    const characterIssues = await this.checkCharacterConsistency(documents, characters);
    issues.push(...characterIssues);

    // World consistency
    const worldIssues = await this.checkWorldConsistency(documents, worldElements);
    issues.push(...worldIssues);

    // Plot consistency
    const plotIssues = await this.checkPlotConsistency(documents, plotThreads);
    issues.push(...plotIssues);

    // Generate analysis
    const timeline = this.analyzeTimelineIssues(timelineIssues);
    const characterAnalysis = this.analyzeCharacterIssues(characterIssues, characters);
    const worldAnalysis = this.analyzeWorldIssues(worldIssues);
    const plotAnalysis = this.analyzePlotIssues(plotIssues, plotThreads);

    const score = this.calculateConsistencyScore(issues);
    const recommendations = this.generateRecommendations(issues, score);

    return {
      summary: score,
      issues,
      timeline,
      characters: characterAnalysis,
      world: worldAnalysis,
      plot: plotAnalysis,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Check timeline consistency
   */
  private async checkTimelineConsistency(documents: Document[]): Promise<ConsistencyCheck[]> {
    const issues: ConsistencyCheck[] = [];

    // Extract timeline events from documents
    const timelineEvents = this.extractTimelineEvents(documents);
    
    // Check for temporal conflicts
    const temporalConflicts = this.detectTemporalConflicts(timelineEvents);
    issues.push(...temporalConflicts);

    // Check travel time feasibility
    const travelTimeIssues = this.checkTravelTimes(timelineEvents);
    issues.push(...travelTimeIssues);

    // Check age progression
    const ageProgressionIssues = this.checkAgeProgression(timelineEvents);
    issues.push(...ageProgressionIssues);

    // Check seasonal consistency
    const seasonalIssues = this.checkSeasonalConsistency(timelineEvents);
    issues.push(...seasonalIssues);

    return issues;
  }

  /**
   * Check character consistency
   */
  private async checkCharacterConsistency(documents: Document[], characters: Character[]): Promise<ConsistencyCheck[]> {
    const issues: ConsistencyCheck[] = [];

    for (const character of characters) {
      // Track character states throughout the story
      const characterStates = this.trackCharacterStates(character, documents);
      
      // Check trait consistency
      const traitIssues = this.checkTraitConsistency(character, characterStates);
      issues.push(...traitIssues);

      // Check knowledge consistency
      const knowledgeIssues = this.checkKnowledgeConsistency(character, characterStates);
      issues.push(...knowledgeIssues);

      // Check ability consistency
      const abilityIssues = this.checkAbilityConsistency(character, characterStates);
      issues.push(...abilityIssues);

      // Check appearance consistency
      const appearanceIssues = this.checkAppearanceConsistency(character, characterStates);
      issues.push(...appearanceIssues);

      // Check relationship consistency
      const relationshipIssues = this.checkRelationshipConsistency(character, characterStates, characters);
      issues.push(...relationshipIssues);

      // Check dialogue voice consistency
      const voiceIssues = this.checkDialogueVoiceConsistency(character, documents);
      issues.push(...voiceIssues);
    }

    return issues;
  }

  /**
   * Check world consistency
   */
  private async checkWorldConsistency(documents: Document[], worldElements: WorldElement[]): Promise<ConsistencyCheck[]> {
    const issues: ConsistencyCheck[] = [];

    // Check magic system consistency
    const magicIssues = this.checkMagicSystemConsistency(documents, worldElements);
    issues.push(...magicIssues);

    // Check technology consistency
    const techIssues = this.checkTechnologyConsistency(documents, worldElements);
    issues.push(...techIssues);

    // Check geography consistency
    const geoIssues = this.checkGeographyConsistency(documents, worldElements);
    issues.push(...geoIssues);

    // Check political system consistency
    const politicalIssues = this.checkPoliticalConsistency(documents, worldElements);
    issues.push(...politicalIssues);

    // Check cultural consistency
    const culturalIssues = this.checkCulturalConsistency(documents, worldElements);
    issues.push(...culturalIssues);

    // Check economic system consistency
    const economicIssues = this.checkEconomicConsistency(documents, worldElements);
    issues.push(...economicIssues);

    return issues;
  }

  /**
   * Check plot consistency
   */
  private async checkPlotConsistency(documents: Document[], plotThreads: PlotThread[]): Promise<ConsistencyCheck[]> {
    const issues: ConsistencyCheck[] = [];

    for (const thread of plotThreads) {
      // Check setup and payoff consistency
      const setupPayoffIssues = this.checkSetupPayoffConsistency(thread, documents);
      issues.push(...setupPayoffIssues);

      // Check foreshadowing consistency
      const foreshadowingIssues = this.checkForeshadowingConsistency(thread, documents);
      issues.push(...foreshadowingIssues);

      // Check conflict escalation
      const conflictIssues = this.checkConflictEscalation(thread, documents);
      issues.push(...conflictIssues);

      // Check plot hole detection
      const plotHoles = this.detectPlotHoles(thread, documents);
      issues.push(...plotHoles);

      // Check character motivation consistency
      const motivationIssues = this.checkCharacterMotivationConsistency(thread, documents);
      issues.push(...motivationIssues);
    }

    return issues;
  }

  /**
   * Real-time consistency monitoring
   */
  async monitorRealTimeConsistency(
    newText: string,
    context: WritingContext
  ): Promise<ConsistencyAlert[]> {
    const alerts: ConsistencyAlert[] = [];

    // Quick character consistency check
    const characterAlerts = this.quickCharacterCheck(newText, context);
    alerts.push(...characterAlerts);

    // Quick timeline check
    const timelineAlerts = this.quickTimelineCheck(newText, context);
    alerts.push(...timelineAlerts);

    // Quick world rules check
    const worldAlerts = this.quickWorldCheck(newText, context);
    alerts.push(...worldAlerts);

    return alerts;
  }

  /**
   * Auto-fix suggestions
   */
  async generateAutoFix(issue: ConsistencyCheck): Promise<AutoFixSuggestion | null> {
    if (!issue.autoFixable) return null;

    switch (issue.type) {
      case 'timeline':
        return this.generateTimelineAutoFix(issue);
      case 'character':
        return this.generateCharacterAutoFix(issue);
      case 'world':
        return this.generateWorldAutoFix(issue);
      case 'plot':
        return this.generatePlotAutoFix(issue);
      default:
        return null;
    }
  }

  // Helper methods for consistency checking

  private extractTimelineEvents(documents: Document[]): TimelineEntry[] {
    const events: TimelineEntry[] = [];
    
    // Extract temporal markers and events from text
    documents.forEach(doc => {
      const temporalMarkers = this.findTemporalMarkers(doc.content);
      const extractedEvents = this.parseTemporalEvents(temporalMarkers, doc);
      events.push(...extractedEvents);
    });

    return this.sortTimelineEvents(events);
  }

  private findTemporalMarkers(text: string): TemporalMarker[] {
    const markers: TemporalMarker[] = [];
    
    // Time indicators
    const timePatterns = [
      /\b(\d{1,2}:\d{2})\b/g, // Clock times
      /\b(morning|afternoon|evening|night|dawn|dusk|midnight|noon)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
      /\b(\d{1,2})\s+(days?|weeks?|months?|years?)\s+(ago|later|before|after)\b/gi,
      /\b(yesterday|today|tomorrow)\b/gi,
      /\b(next|last)\s+(week|month|year|day)\b/gi
    ];

    timePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        markers.push({
          text: match[0],
          position: match.index,
          type: this.classifyTemporalMarker(match[0]),
          confidence: this.calculateMarkerConfidence(match[0], text, match.index)
        });
      }
    });

    return markers;
  }

  private detectTemporalConflicts(events: TimelineEntry[]): ConsistencyCheck[] {
    const conflicts: ConsistencyCheck[] = [];
    
    for (let i = 0; i < events.length - 1; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const conflict = this.checkEventConflict(events[i], events[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  private checkTravelTimes(events: TimelineEntry[]): ConsistencyCheck[] {
    const issues: ConsistencyCheck[] = [];
    
    // Group events by character
    const characterEvents = this.groupEventsByCharacter(events);
    
    Object.entries(characterEvents).forEach(([characterId, charEvents]) => {
      for (let i = 0; i < charEvents.length - 1; i++) {
        const current = charEvents[i];
        const next = charEvents[i + 1];
        
        if (current.location && next.location && current.location !== next.location) {
          const travelTime = this.calculateRequiredTravelTime(current.location, next.location);
          const actualTime = this.calculateTimeDifference(current.timestamp, next.timestamp);
          
          if (travelTime > actualTime) {
            issues.push(this.createTravelTimeIssue(current, next, travelTime, actualTime));
          }
        }
      }
    });

    return issues;
  }

  private trackCharacterStates(character: Character, documents: Document[]): CharacterState[] {
    const states: CharacterState[] = [];
    
    // Extract character mentions and contexts
    documents.forEach(doc => {
      const mentions = this.findCharacterMentions(character, doc);
      mentions.forEach(mention => {
        const state = this.extractCharacterState(character, mention, doc);
        if (state) {
          states.push(state);
        }
      });
    });

    return this.sortCharacterStatesByTime(states);
  }

  private checkTraitConsistency(character: Character, states: CharacterState[]): ConsistencyCheck[] {
    const issues: ConsistencyCheck[] = [];
    
    // Check for trait contradictions
    states.forEach((state, index) => {
      if (index > 0) {
        const previousState = states[index - 1];
        const contradictions = this.findTraitContradictions(character, previousState, state);
        issues.push(...contradictions);
      }
    });

    return issues;
  }

  private checkMagicSystemConsistency(documents: Document[], worldElements: WorldElement[]): ConsistencyCheck[] {
    const issues: ConsistencyCheck[] = [];
    
    const magicSystems = worldElements.filter(el => el.type === 'magic-system');
    
    magicSystems.forEach(system => {
      // Check rule violations
      const violations = this.findMagicRuleViolations(system, documents);
      issues.push(...violations);
      
      // Check power level consistency
      const powerIssues = this.checkMagicPowerConsistency(system, documents);
      issues.push(...powerIssues);
      
      // Check cost consistency
      const costIssues = this.checkMagicCostConsistency(system, documents);
      issues.push(...costIssues);
    });

    return issues;
  }

  private checkSetupPayoffConsistency(thread: PlotThread, documents: Document[]): ConsistencyCheck[] {
    const issues: ConsistencyCheck[] = [];
    
    thread.plantedElements.forEach(element => {
      if (!element.resolved) {
        // Check if the planted element has been referenced or paid off
        const payoff = thread.payoffs.find(p => p.setupElements.includes(element.id));
        if (!payoff && this.shouldBePayedOff(element, thread)) {
          issues.push(this.createUnresolvedSetupIssue(element, thread));
        }
      }
    });

    thread.payoffs.forEach(payoff => {
      // Check if payoff has proper setup
      const hasProperSetup = payoff.setupElements.every(setupId => 
        thread.plantedElements.some(el => el.id === setupId)
      );
      
      if (!hasProperSetup) {
        issues.push(this.createInsufficientSetupIssue(payoff, thread));
      }
    });

    return issues;
  }

  // Calculation and analysis helper methods

  private calculateConsistencyScore(issues: ConsistencyCheck[]): ConsistencyScore {
    const severityWeights = {
      'critical': 1.0,
      'major': 0.7,
      'minor': 0.3,
      'suggestion': 0.1
    };

    const typeCategories = {
      'timeline': issues.filter(i => i.type === 'timeline'),
      'character': issues.filter(i => i.type === 'character'),
      'world': issues.filter(i => i.type === 'world'),
      'plot': issues.filter(i => i.type === 'plot'),
      'fact': issues.filter(i => i.type === 'fact')
    };

    const scores: any = {};
    
    Object.entries(typeCategories).forEach(([type, typeIssues]) => {
      const totalImpact = typeIssues.reduce((sum, issue) => 
        sum + severityWeights[issue.severity], 0
      );
      
      // Score decreases with more issues
      scores[type] = Math.max(0, 1 - (totalImpact / 10));
    });

    scores.overall = Object.values(scores).reduce((sum: number, score: number) => sum + score, 0) / 5;

    return scores as ConsistencyScore;
  }

  private generateRecommendations(issues: ConsistencyCheck[], score: ConsistencyScore): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Critical issues first
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        type: 'fix',
        priority: 'high',
        category: 'Critical Issues',
        title: 'Address Critical Consistency Issues',
        description: `${criticalIssues.length} critical consistency issues found that may confuse readers`,
        actionItems: criticalIssues.map(i => i.suggestedFix),
        estimatedEffort: 'high',
        impact: 'Prevents reader confusion and plot holes'
      });
    }

    // Timeline improvements
    if (score.timeline < 0.7) {
      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        category: 'Timeline',
        title: 'Improve Timeline Consistency',
        description: 'Timeline has some inconsistencies that should be addressed',
        actionItems: ['Review temporal markers', 'Verify travel times', 'Check character ages'],
        estimatedEffort: 'medium',
        impact: 'Improves story believability'
      });
    }

    // Character consistency
    if (score.character < 0.6) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        category: 'Characters',
        title: 'Strengthen Character Consistency',
        description: 'Characters show inconsistent traits or knowledge',
        actionItems: ['Review character development', 'Check dialogue voice', 'Verify character knowledge'],
        estimatedEffort: 'medium',
        impact: 'Creates more believable characters'
      });
    }

    return recommendations;
  }

  // Simplified implementations for demonstration
  private classifyTemporalMarker(text: string): string {
    if (/\d{1,2}:\d{2}/.test(text)) return 'clock-time';
    if (/morning|afternoon|evening|night/.test(text)) return 'time-of-day';
    if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(text)) return 'day-of-week';
    return 'relative-time';
  }

  private calculateMarkerConfidence(marker: string, text: string, position: number): number {
    // Simplified confidence calculation
    return 0.8;
  }

  private checkEventConflict(event1: TimelineEntry, event2: TimelineEntry): ConsistencyCheck | null {
    // Simplified conflict detection
    return null;
  }

  private groupEventsByCharacter(events: TimelineEntry[]): Record<string, TimelineEntry[]> {
    const grouped: Record<string, TimelineEntry[]> = {};
    
    events.forEach(event => {
      event.participants.forEach(participant => {
        if (!grouped[participant]) {
          grouped[participant] = [];
        }
        grouped[participant].push(event);
      });
    });

    return grouped;
  }

  private calculateRequiredTravelTime(from: string, to: string): number {
    // Simplified travel time calculation
    return 60; // 1 hour default
  }

  private calculateTimeDifference(from: TimelineTimestamp, to: TimelineTimestamp): number {
    // Simplified time difference calculation
    return 120; // 2 hours default
  }

  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  isConfigured(): boolean {
    return this.initialized;
  }
}

// Additional interfaces
interface Document {
  id: string;
  content: string;
  chapter?: number;
  scene?: string;
  metadata: any;
}

interface Character {
  id: string;
  name: string;
  traits: string[];
  // ... other character properties
}

interface WorldElement {
  id: string;
  type: string;
  name: string;
  rules: string[];
  // ... other world element properties
}

interface TemporalMarker {
  text: string;
  position: number;
  type: string;
  confidence: number;
}

interface WritingContext {
  currentCharacter?: string;
  currentLocation?: string;
  currentTime?: string;
  recentEvents: string[];
}

interface ConsistencyAlert {
  type: 'warning' | 'error' | 'suggestion';
  message: string;
  confidence: number;
  autoFixable: boolean;
}

interface AutoFixSuggestion {
  description: string;
  changes: TextChange[];
  confidence: number;
  previewText: string;
}

interface TextChange {
  position: { start: number; end: number };
  oldText: string;
  newText: string;
  reasoning: string;
}

export const consistencyChecker = new ConsistencyChecker();