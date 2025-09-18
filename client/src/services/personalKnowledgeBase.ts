import { EventEmitter } from 'events';

export interface KnowledgeEntry {
  id: string;
  type: 'insight' | 'lesson' | 'technique' | 'wisdom' | 'observation' | 'principle' | 'discovery' | 'reflection';
  category: 'writing_craft' | 'creative_process' | 'personal_growth' | 'life_experience' | 'professional' | 'relationships' | 'philosophy' | 'skills';
  title: string;
  content: string;
  summary: string;
  context: KnowledgeContext;
  metadata: KnowledgeMetadata;
  connections: KnowledgeConnection[];
  evidence: Evidence[];
  applications: Application[];
  evolution: EvolutionRecord[];
  impact: KnowledgeImpact;
  accessibility: AccessibilityInfo;
  preservation: PreservationStrategy;
  sharing: SharingPreferences;
  validation: ValidationInfo;
  futureValue: FutureValueAssessment;
}

export interface KnowledgeContext {
  source: 'experience' | 'observation' | 'study' | 'mentorship' | 'experiment' | 'reflection' | 'failure' | 'success';
  trigger: string;
  situation: string;
  timeframe: string;
  participants: string[];
  environment: string;
  preconditions: string[];
  background: string;
  relevantEvents: string[];
  catalysts: string[];
}

export interface KnowledgeMetadata {
  createdDate: Date;
  lastModified: Date;
  confidence: number; // 0-1
  reliability: number; // 0-1
  universality: number; // 0-1 (how universal vs personal)
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  maturity: 'emerging' | 'developing' | 'established' | 'mature' | 'fundamental';
  frequency: 'rare' | 'occasional' | 'regular' | 'frequent' | 'constant';
  importance: 'minor' | 'moderate' | 'significant' | 'critical' | 'transformative';
  urgency: 'when_needed' | 'soon' | 'immediate' | 'ongoing';
  scope: 'personal' | 'project' | 'domain' | 'universal';
}

export interface KnowledgeConnection {
  id: string;
  targetEntryId: string;
  type: 'builds_on' | 'contradicts' | 'supports' | 'elaborates' | 'applies' | 'inspired_by' | 'leads_to' | 'requires';
  strength: number; // 0-1
  direction: 'bidirectional' | 'forward' | 'backward';
  description: string;
  context: string;
  discoveredDate: Date;
  verified: boolean;
  examples: string[];
}

export interface Evidence {
  id: string;
  type: 'experience' | 'observation' | 'result' | 'feedback' | 'measurement' | 'testimonial' | 'reference' | 'experiment';
  description: string;
  source: string;
  date: Date;
  credibility: number; // 0-1
  relevance: number; // 0-1
  reproducibility: 'not_applicable' | 'difficult' | 'moderate' | 'easy' | 'automatic';
  details: string;
  context: string;
  limitations: string[];
  corroboration: string[];
}

export interface Application {
  id: string;
  context: string;
  description: string;
  dateApplied: Date;
  success: number; // 0-1
  outcome: string;
  learnings: string[];
  adaptations: string[];
  effectiveness: number; // 0-1
  conditions: string[];
  prerequisites: string[];
  limitations: string[];
  nextSteps: string[];
}

export interface EvolutionRecord {
  date: Date;
  type: 'refinement' | 'extension' | 'correction' | 'integration' | 'breakthrough' | 'validation' | 'contradiction';
  description: string;
  trigger: string;
  previousState: string;
  newState: string;
  impact: string;
  confidence: number;
  evidence: string[];
}

export interface KnowledgeImpact {
  personal: {
    behavior: string[];
    decisions: string[];
    perspective: string[];
    skills: string[];
    relationships: string[];
  };
  professional: {
    productivity: number; // 0-1
    quality: number; // 0-1
    efficiency: number; // 0-1
    innovation: number; // 0-1
    leadership: number; // 0-1
  };
  creative: {
    inspiration: string[];
    techniques: string[];
    breakthroughs: string[];
    style: string[];
    voice: string[];
  };
  social: {
    shared: number;
    taught: number;
    influenced: string[];
    feedback: string[];
  };
  legacy: {
    documentation: string[];
    preservation: string[];
    transmission: string[];
    influence: string[];
  };
}

export interface AccessibilityInfo {
  retrievalTriggers: string[];
  keywords: string[];
  mentalModels: string[];
  analogies: string[];
  examples: string[];
  mnemonics: string[];
  visualizations: string[];
  stories: string[];
  contextCues: string[];
}

export interface PreservationStrategy {
  backup: 'essential' | 'important' | 'nice_to_have' | 'archived';
  formats: string[];
  locations: string[];
  redundancy: number;
  verification: {
    lastChecked: Date;
    integrity: 'verified' | 'concerns' | 'corrupted';
    method: string;
  };
  migration: {
    plan: string;
    schedule: string;
    triggers: string[];
  };
  legacy: {
    importance: 'personal' | 'family' | 'community' | 'public';
    instructions: string[];
    recipients: string[];
  };
}

export interface SharingPreferences {
  visibility: 'private' | 'selective' | 'community' | 'public';
  audience: string[];
  conditions: string[];
  format: 'original' | 'adapted' | 'anonymized' | 'abstracted';
  timing: 'immediate' | 'delayed' | 'conditional' | 'posthumous';
  platforms: string[];
  restrictions: string[];
  attribution: boolean;
}

export interface ValidationInfo {
  selfValidated: boolean;
  peerValidated: boolean;
  expertValidated: boolean;
  timeValidated: boolean;
  validationHistory: ValidationEvent[];
  reliabilitySources: string[];
  contradictions: string[];
  uncertainties: string[];
  assumptions: string[];
}

export interface ValidationEvent {
  date: Date;
  type: 'self' | 'peer' | 'expert' | 'time' | 'experiment' | 'observation';
  result: 'confirmed' | 'refined' | 'questioned' | 'contradicted' | 'expanded';
  details: string;
  validator: string;
  evidence: string[];
  impact: string;
}

export interface FutureValueAssessment {
  personalValue: number; // 0-1
  professionalValue: number; // 0-1
  socialValue: number; // 0-1
  timelessness: number; // 0-1
  transferability: number; // 0-1
  buildingPotential: number; // 0-1
  teachingValue: number; // 0-1
  innovationPotential: number; // 0-1
  predictions: string[];
  risks: string[];
  opportunities: string[];
}

export interface WisdomPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  examples: string[];
  relatedEntries: string[];
  strength: number; // 0-1
  generalizability: number; // 0-1
  predictivePower: number; // 0-1
  actionability: number; // 0-1
  discovered: Date;
  verified: Date;
  applications: PatternApplication[];
  evolution: string[];
  futureImplications: string[];
}

export interface PatternApplication {
  date: Date;
  context: string;
  prediction: string;
  outcome: string;
  accuracy: number; // 0-1
  learning: string;
  refinement: string;
}

export interface KnowledgeMap {
  id: string;
  name: string;
  description: string;
  entries: string[];
  connections: MapConnection[];
  clusters: KnowledgeCluster[];
  pathways: LearningPathway[];
  insights: MapInsight[];
  visualization: MapVisualization;
  metadata: {
    created: Date;
    lastUpdated: Date;
    version: number;
    scope: string;
    purpose: string;
  };
}

export interface MapConnection {
  from: string;
  to: string;
  type: string;
  strength: number;
  description: string;
  verified: boolean;
}

export interface KnowledgeCluster {
  id: string;
  name: string;
  description: string;
  entries: string[];
  coherence: number; // 0-1
  completeness: number; // 0-1
  maturity: string;
  gaps: string[];
  opportunities: string[];
}

export interface LearningPathway {
  id: string;
  name: string;
  description: string;
  startEntry: string;
  endEntry: string;
  steps: PathwayStep[];
  difficulty: string;
  estimatedTime: string;
  prerequisites: string[];
  outcomes: string[];
}

export interface PathwayStep {
  entryId: string;
  order: number;
  rationale: string;
  activities: string[];
  checkpoints: string[];
  resources: string[];
}

export interface MapInsight {
  type: 'gap' | 'redundancy' | 'connection' | 'pattern' | 'opportunity' | 'weakness';
  description: string;
  entries: string[];
  significance: number; // 0-1
  actionable: boolean;
  recommendations: string[];
}

export interface MapVisualization {
  layout: 'hierarchical' | 'network' | 'timeline' | 'conceptual' | 'spatial';
  style: 'minimal' | 'detailed' | 'artistic' | 'technical';
  focus: string[];
  filters: Record<string, any>;
  annotations: Annotation[];
  views: ViewConfiguration[];
}

export interface Annotation {
  id: string;
  entryId: string;
  type: 'note' | 'insight' | 'question' | 'connection' | 'warning';
  content: string;
  position: { x: number; y: number };
  author: string;
  date: Date;
  visibility: boolean;
}

export interface ViewConfiguration {
  name: string;
  description: string;
  filters: Record<string, any>;
  focus: string[];
  layout: string;
  saved: Date;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  type: 'knowledge' | 'skill' | 'understanding' | 'wisdom' | 'application';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeline: {
    start: Date;
    target: Date;
    milestones: GoalMilestone[];
  };
  progress: {
    current: number; // 0-1
    milestones: MilestoneProgress[];
    setbacks: Setback[];
    breakthroughs: Breakthrough[];
  };
  strategy: {
    approach: string[];
    resources: string[];
    methods: string[];
    checkpoints: string[];
  };
  success: {
    criteria: string[];
    metrics: string[];
    evidence: string[];
    validation: string[];
  };
  relatedEntries: string[];
  outcomes: GoalOutcome[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  criteria: string[];
  progress: number; // 0-1
  completed: boolean;
  completedDate?: Date;
  evidence: string[];
  reflections: string[];
}

export interface MilestoneProgress {
  milestoneId: string;
  date: Date;
  progress: number;
  notes: string;
  evidence: string[];
  nextSteps: string[];
}

export interface Setback {
  date: Date;
  description: string;
  impact: number; // 0-1
  causes: string[];
  lessons: string[];
  recovery: string[];
  prevention: string[];
}

export interface Breakthrough {
  date: Date;
  description: string;
  impact: number; // 0-1
  triggers: string[];
  insights: string[];
  applications: string[];
  implications: string[];
}

export interface GoalOutcome {
  date: Date;
  type: 'success' | 'partial' | 'failure' | 'transformation' | 'redirection';
  description: string;
  metrics: Record<string, number>;
  evidence: string[];
  learnings: string[];
  nextGoals: string[];
  impact: string[];
}

export interface KnowledgeAnalytics {
  overview: {
    totalEntries: number;
    totalConnections: number;
    averageConnections: number;
    knowledgeDensity: number;
    maturityDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  };
  quality: {
    averageConfidence: number;
    averageReliability: number;
    validationRate: number;
    evidenceRate: number;
    applicationRate: number;
  };
  growth: {
    entriesPerMonth: number;
    connectionsPerMonth: number;
    maturityProgression: number;
    learningVelocity: number;
    knowledgeRetention: number;
  };
  patterns: {
    identifiedPatterns: number;
    patternStrength: number;
    patternApplication: number;
    emergingPatterns: string[];
    strongestPatterns: string[];
  };
  impact: {
    personalImpact: number;
    professionalImpact: number;
    creativeImpact: number;
    socialImpact: number;
    legacyPotential: number;
  };
  gaps: {
    knowledgeGaps: KnowledgeGap[];
    connectionGaps: string[];
    validationGaps: string[];
    applicationGaps: string[];
  };
  recommendations: KnowledgeRecommendation[];
}

export interface KnowledgeGap {
  area: string;
  description: string;
  impact: number; // 0-1
  urgency: number; // 0-1
  difficulty: string;
  resources: string[];
  timeEstimate: string;
  priority: number;
}

export interface KnowledgeRecommendation {
  type: 'creation' | 'connection' | 'validation' | 'application' | 'preservation' | 'sharing';
  title: string;
  description: string;
  rationale: string;
  impact: number; // 0-1
  effort: number; // 0-1
  timeline: string;
  steps: string[];
  resources: string[];
  relatedEntries: string[];
}

class PersonalKnowledgeBaseService extends EventEmitter {
  private knowledgeEntries: Map<string, KnowledgeEntry> = new Map();
  private wisdomPatterns: Map<string, WisdomPattern> = new Map();
  private knowledgeMaps: Map<string, KnowledgeMap> = new Map();
  private learningGoals: Map<string, LearningGoal> = new Map();
  private analytics: KnowledgeAnalytics | null = null;

  constructor() {
    super();
    this.loadDataFromStorage();
    this.initializeAnalytics();
    this.schedulePeriodicAnalysis();
  }

  async createKnowledgeEntry(entryData: Omit<KnowledgeEntry, 'id' | 'connections' | 'evidence' | 'applications' | 'evolution' | 'impact' | 'accessibility' | 'preservation' | 'sharing' | 'validation' | 'futureValue'>): Promise<KnowledgeEntry> {
    const entry: KnowledgeEntry = {
      ...entryData,
      id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connections: [],
      evidence: [],
      applications: [],
      evolution: [],
      impact: this.initializeKnowledgeImpact(),
      accessibility: this.initializeAccessibilityInfo(entryData),
      preservation: this.initializePreservationStrategy(entryData),
      sharing: this.initializeSharingPreferences(),
      validation: this.initializeValidationInfo(),
      futureValue: this.initializeFutureValueAssessment(entryData)
    };

    this.knowledgeEntries.set(entry.id, entry);
    
    // Auto-detect potential connections
    await this.detectConnections(entry);
    
    // Extract and create accessibility aids
    await this.generateAccessibilityAids(entry);
    
    // Update analytics
    await this.updateAnalytics();

    await this.saveDataToStorage();
    this.emit('knowledgeEntryCreated', entry);

    return entry;
  }

  private initializeKnowledgeImpact(): KnowledgeImpact {
    return {
      personal: {
        behavior: [],
        decisions: [],
        perspective: [],
        skills: [],
        relationships: []
      },
      professional: {
        productivity: 0,
        quality: 0,
        efficiency: 0,
        innovation: 0,
        leadership: 0
      },
      creative: {
        inspiration: [],
        techniques: [],
        breakthroughs: [],
        style: [],
        voice: []
      },
      social: {
        shared: 0,
        taught: 0,
        influenced: [],
        feedback: []
      },
      legacy: {
        documentation: [],
        preservation: [],
        transmission: [],
        influence: []
      }
    };
  }

  private initializeAccessibilityInfo(entryData: Partial<KnowledgeEntry>): AccessibilityInfo {
    const keywords = this.extractKeywords(entryData.content || '', entryData.title || '');
    
    return {
      retrievalTriggers: [entryData.context?.trigger || '', entryData.context?.situation || ''].filter(Boolean),
      keywords,
      mentalModels: [],
      analogies: [],
      examples: [],
      mnemonics: [],
      visualizations: [],
      stories: [],
      contextCues: entryData.context?.preconditions || []
    };
  }

  private extractKeywords(content: string, title: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const words = text.split(/\W+/).filter(word => word.length > 3);
    
    // Simple keyword extraction - in a real system, this would be more sophisticated
    const keywordCounts: Record<string, number> = {};
    words.forEach(word => {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    });

    return Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private initializePreservationStrategy(entryData: Partial<KnowledgeEntry>): PreservationStrategy {
    const importance = entryData.metadata?.importance || 'moderate';
    const backup = importance === 'transformative' || importance === 'critical' ? 'essential' :
                  importance === 'significant' ? 'important' : 'nice_to_have';

    return {
      backup,
      formats: ['text', 'markdown'],
      locations: ['local', 'cloud'],
      redundancy: backup === 'essential' ? 3 : backup === 'important' ? 2 : 1,
      verification: {
        lastChecked: new Date(),
        integrity: 'verified',
        method: 'checksum'
      },
      migration: {
        plan: 'Standard format migration',
        schedule: 'Annual review',
        triggers: ['Format obsolescence', 'Technology change']
      },
      legacy: {
        importance: backup === 'essential' ? 'public' : 
                   backup === 'important' ? 'community' : 'personal',
        instructions: ['Preserve core insight', 'Maintain context'],
        recipients: ['family', 'mentees', 'community']
      }
    };
  }

  private initializeSharingPreferences(): SharingPreferences {
    return {
      visibility: 'private',
      audience: [],
      conditions: [],
      format: 'original',
      timing: 'conditional',
      platforms: [],
      restrictions: [],
      attribution: true
    };
  }

  private initializeValidationInfo(): ValidationInfo {
    return {
      selfValidated: false,
      peerValidated: false,
      expertValidated: false,
      timeValidated: false,
      validationHistory: [],
      reliabilitySources: [],
      contradictions: [],
      uncertainties: [],
      assumptions: []
    };
  }

  private initializeFutureValueAssessment(entryData: Partial<KnowledgeEntry>): FutureValueAssessment {
    const universality = entryData.metadata?.universality || 0.5;
    const importance = entryData.metadata?.importance || 'moderate';
    
    const importanceScore = {
      'minor': 0.2,
      'moderate': 0.4,
      'significant': 0.6,
      'critical': 0.8,
      'transformative': 1.0
    }[importance];

    return {
      personalValue: importanceScore,
      professionalValue: universality * 0.7,
      socialValue: universality * 0.6,
      timelessness: universality * 0.8,
      transferability: universality,
      buildingPotential: 0.5,
      teachingValue: universality * 0.7,
      innovationPotential: entryData.type === 'discovery' ? 0.8 : 0.4,
      predictions: [],
      risks: ['Knowledge becomes obsolete', 'Context changes'],
      opportunities: ['Teaching others', 'Building upon', 'Applying to new contexts']
    };
  }

  private async detectConnections(entry: KnowledgeEntry): Promise<void> {
    const existingEntries = Array.from(this.knowledgeEntries.values());
    
    for (const existingEntry of existingEntries) {
      if (existingEntry.id === entry.id) continue;
      
      const connectionStrength = this.calculateConnectionStrength(entry, existingEntry);
      
      if (connectionStrength > 0.3) {
        const connectionType = this.determineConnectionType(entry, existingEntry);
        
        const connection: KnowledgeConnection = {
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          targetEntryId: existingEntry.id,
          type: connectionType,
          strength: connectionStrength,
          direction: 'bidirectional',
          description: this.generateConnectionDescription(entry, existingEntry, connectionType),
          context: entry.context.situation,
          discoveredDate: new Date(),
          verified: false,
          examples: []
        };

        entry.connections.push(connection);
        
        // Add reciprocal connection
        const reciprocalConnection: KnowledgeConnection = {
          ...connection,
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          targetEntryId: entry.id
        };
        
        existingEntry.connections.push(reciprocalConnection);
      }
    }
  }

  private calculateConnectionStrength(entry1: KnowledgeEntry, entry2: KnowledgeEntry): number {
    let strength = 0;
    
    // Category similarity
    if (entry1.category === entry2.category) strength += 0.3;
    
    // Type similarity
    if (entry1.type === entry2.type) strength += 0.2;
    
    // Content similarity (simplified keyword matching)
    const keywords1 = entry1.accessibility.keywords;
    const keywords2 = entry2.accessibility.keywords;
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    strength += (commonKeywords.length / Math.max(keywords1.length, keywords2.length)) * 0.3;
    
    // Context similarity
    if (entry1.context.source === entry2.context.source) strength += 0.1;
    if (entry1.context.environment === entry2.context.environment) strength += 0.1;
    
    return Math.min(1, strength);
  }

  private determineConnectionType(entry1: KnowledgeEntry, entry2: KnowledgeEntry): KnowledgeConnection['type'] {
    // Simplified connection type determination
    if (entry1.metadata.createdDate > entry2.metadata.createdDate) {
      if (entry1.category === entry2.category) return 'builds_on';
      return 'inspired_by';
    } else {
      if (entry1.category === entry2.category) return 'supports';
      return 'elaborates';
    }
  }

  private generateConnectionDescription(entry1: KnowledgeEntry, entry2: KnowledgeEntry, type: string): string {
    const descriptions = {
      builds_on: `This insight builds upon the foundation of "${entry2.title}"`,
      supports: `This knowledge supports and reinforces "${entry2.title}"`,
      elaborates: `This entry elaborates on concepts from "${entry2.title}"`,
      inspired_by: `This insight was inspired by "${entry2.title}"`,
      applies: `This knowledge applies principles from "${entry2.title}"`,
      contradicts: `This entry presents a different perspective from "${entry2.title}"`,
      leads_to: `This understanding leads to the insights in "${entry2.title}"`,
      requires: `This knowledge requires understanding of "${entry2.title}"`
    };

    return descriptions[type as keyof typeof descriptions] || `Related to "${entry2.title}"`;
  }

  private async generateAccessibilityAids(entry: KnowledgeEntry): Promise<void> {
    // Generate analogies
    entry.accessibility.analogies = this.generateAnalogies(entry);
    
    // Generate examples
    entry.accessibility.examples = this.generateExamples(entry);
    
    // Generate mnemonics
    entry.accessibility.mnemonics = this.generateMnemonics(entry);
    
    // Generate stories
    entry.accessibility.stories = this.generateStories(entry);
  }

  private generateAnalogies(entry: KnowledgeEntry): string[] {
    // Simplified analogy generation based on category and type
    const analogyTemplates = {
      writing_craft: [
        'Like a craftsperson shaping material',
        'Similar to building architectural foundations',
        'Resembles tending a garden'
      ],
      creative_process: [
        'Like a river finding its path',
        'Similar to cooking - combining ingredients',
        'Resembles solving a puzzle'
      ],
      personal_growth: [
        'Like climbing a mountain',
        'Similar to metamorphosis',
        'Resembles learning to ride a bicycle'
      ]
    };

    return analogyTemplates[entry.category as keyof typeof analogyTemplates]?.slice(0, 2) || [];
  }

  private generateExamples(entry: KnowledgeEntry): string[] {
    // Extract examples from content or generate based on context
    const content = entry.content.toLowerCase();
    const examples: string[] = [];
    
    // Look for phrases that indicate examples
    const exampleMarkers = ['for example', 'such as', 'like when', 'instance'];
    exampleMarkers.forEach(marker => {
      const index = content.indexOf(marker);
      if (index !== -1) {
        const exampleText = content.substring(index, index + 100).trim();
        examples.push(exampleText);
      }
    });

    return examples.slice(0, 3);
  }

  private generateMnemonics(entry: KnowledgeEntry): string[] {
    // Simple mnemonic generation using acronyms or key phrases
    const mnemonics: string[] = [];
    
    // Create acronym from title
    const titleWords = entry.title.split(' ').filter(word => word.length > 2);
    if (titleWords.length >= 2 && titleWords.length <= 5) {
      const acronym = titleWords.map(word => word[0].toUpperCase()).join('');
      mnemonics.push(`Remember: ${acronym} - ${titleWords.join(', ')}`);
    }
    
    // Create phrase-based mnemonic
    const keyPhrases = entry.summary.split('.').slice(0, 2);
    keyPhrases.forEach(phrase => {
      if (phrase.trim().length > 10 && phrase.trim().length < 50) {
        mnemonics.push(`Key phrase: "${phrase.trim()}"`);
      }
    });

    return mnemonics.slice(0, 2);
  }

  private generateStories(entry: KnowledgeEntry): string[] {
    const stories: string[] = [];
    
    // Create story from context
    if (entry.context.situation && entry.context.trigger) {
      const story = `In ${entry.context.situation}, when ${entry.context.trigger} happened, this led to the insight: ${entry.summary}`;
      stories.push(story);
    }
    
    // Create application story from evidence
    if (entry.evidence.length > 0) {
      const evidence = entry.evidence[0];
      const story = `This was demonstrated when ${evidence.description}, showing that ${entry.title.toLowerCase()}`;
      stories.push(story);
    }

    return stories.slice(0, 2);
  }

  async addEvidence(entryId: string, evidenceData: Omit<Evidence, 'id' | 'date'>): Promise<void> {
    const entry = this.knowledgeEntries.get(entryId);
    if (!entry) throw new Error('Knowledge entry not found');

    const evidence: Evidence = {
      ...evidenceData,
      id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date()
    };

    entry.evidence.push(evidence);
    entry.metadata.lastModified = new Date();
    
    // Update confidence based on evidence quality
    this.updateConfidenceFromEvidence(entry);

    await this.saveDataToStorage();
    this.emit('evidenceAdded', { entryId, evidence });
  }

  private updateConfidenceFromEvidence(entry: KnowledgeEntry): void {
    if (entry.evidence.length === 0) return;

    const totalCredibility = entry.evidence.reduce((sum, ev) => sum + ev.credibility, 0);
    const averageCredibility = totalCredibility / entry.evidence.length;
    
    const evidenceBonus = Math.min(0.3, entry.evidence.length * 0.05);
    entry.metadata.confidence = Math.min(1, averageCredibility + evidenceBonus);
  }

  async recordApplication(entryId: string, applicationData: Omit<Application, 'id' | 'dateApplied'>): Promise<void> {
    const entry = this.knowledgeEntries.get(entryId);
    if (!entry) throw new Error('Knowledge entry not found');

    const application: Application = {
      ...applicationData,
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateApplied: new Date()
    };

    entry.applications.push(application);
    entry.metadata.lastModified = new Date();

    // Update impact metrics
    this.updateImpactFromApplication(entry, application);

    await this.saveDataToStorage();
    this.emit('applicationRecorded', { entryId, application });
  }

  private updateImpactFromApplication(entry: KnowledgeEntry, application: Application): void {
    // Update professional impact
    entry.impact.professional.productivity = Math.min(1, 
      entry.impact.professional.productivity + (application.effectiveness * 0.1)
    );
    
    // Add to social impact if shared
    if (application.context.includes('shared') || application.context.includes('taught')) {
      entry.impact.social.shared++;
    }

    // Update personal impact
    if (application.success > 0.7) {
      entry.impact.personal.decisions.push(`Applied in ${application.context}`);
    }
  }

  async evolveKnowledge(entryId: string, evolutionData: Omit<EvolutionRecord, 'date'>): Promise<void> {
    const entry = this.knowledgeEntries.get(entryId);
    if (!entry) throw new Error('Knowledge entry not found');

    const evolution: EvolutionRecord = {
      ...evolutionData,
      date: new Date()
    };

    entry.evolution.push(evolution);
    entry.metadata.lastModified = new Date();

    // Update content based on evolution
    if (evolutionData.type === 'refinement' || evolutionData.type === 'correction') {
      // In a real system, this might update the content
      entry.summary = `${entry.summary} [Evolved: ${evolutionData.description}]`;
    }

    // Update maturity
    this.updateMaturityFromEvolution(entry, evolution);

    await this.saveDataToStorage();
    this.emit('knowledgeEvolved', { entryId, evolution });
  }

  private updateMaturityFromEvolution(entry: KnowledgeEntry, evolution: EvolutionRecord): void {
    const maturityProgression = ['emerging', 'developing', 'established', 'mature', 'fundamental'];
    const currentIndex = maturityProgression.indexOf(entry.metadata.maturity);
    
    if (evolution.type === 'validation' || evolution.type === 'integration') {
      const nextIndex = Math.min(maturityProgression.length - 1, currentIndex + 1);
      entry.metadata.maturity = maturityProgression[nextIndex] as any;
    }
  }

  async createWisdomPattern(patternData: Omit<WisdomPattern, 'id' | 'discovered' | 'verified' | 'applications'>): Promise<WisdomPattern> {
    const pattern: WisdomPattern = {
      ...patternData,
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      discovered: new Date(),
      verified: new Date(),
      applications: []
    };

    this.wisdomPatterns.set(pattern.id, pattern);
    
    // Link to related entries
    pattern.relatedEntries.forEach(entryId => {
      const entry = this.knowledgeEntries.get(entryId);
      if (entry) {
        // Add pattern reference to entry metadata
        entry.accessibility.retrievalTriggers.push(`Pattern: ${pattern.name}`);
      }
    });

    await this.saveDataToStorage();
    this.emit('wisdomPatternCreated', pattern);

    return pattern;
  }

  async applyWisdomPattern(patternId: string, applicationData: Omit<PatternApplication, 'date'>): Promise<void> {
    const pattern = this.wisdomPatterns.get(patternId);
    if (!pattern) throw new Error('Wisdom pattern not found');

    const application: PatternApplication = {
      ...applicationData,
      date: new Date()
    };

    pattern.applications.push(application);
    
    // Update pattern strength based on application success
    const averageAccuracy = pattern.applications.reduce((sum, app) => sum + app.accuracy, 0) / pattern.applications.length;
    pattern.predictivePower = averageAccuracy;

    await this.saveDataToStorage();
    this.emit('patternApplied', { patternId, application });
  }

  async createKnowledgeMap(mapData: Omit<KnowledgeMap, 'id' | 'connections' | 'clusters' | 'pathways' | 'insights' | 'metadata'>): Promise<KnowledgeMap> {
    const map: KnowledgeMap = {
      ...mapData,
      id: `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connections: this.generateMapConnections(mapData.entries),
      clusters: this.identifyKnowledgeClusters(mapData.entries),
      pathways: this.generateLearningPathways(mapData.entries),
      insights: this.generateMapInsights(mapData.entries),
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        version: 1,
        scope: mapData.description,
        purpose: 'Knowledge organization and navigation'
      }
    };

    this.knowledgeMaps.set(map.id, map);
    await this.saveDataToStorage();
    
    this.emit('knowledgeMapCreated', map);
    return map;
  }

  private generateMapConnections(entryIds: string[]): MapConnection[] {
    const connections: MapConnection[] = [];
    
    entryIds.forEach(fromId => {
      const fromEntry = this.knowledgeEntries.get(fromId);
      if (!fromEntry) return;
      
      fromEntry.connections.forEach(conn => {
        if (entryIds.includes(conn.targetEntryId)) {
          connections.push({
            from: fromId,
            to: conn.targetEntryId,
            type: conn.type,
            strength: conn.strength,
            description: conn.description,
            verified: conn.verified
          });
        }
      });
    });

    return connections;
  }

  private identifyKnowledgeClusters(entryIds: string[]): KnowledgeCluster[] {
    const clusters: KnowledgeCluster[] = [];
    const entries = entryIds.map(id => this.knowledgeEntries.get(id)).filter(Boolean) as KnowledgeEntry[];
    
    // Group by category
    const categoryGroups: Record<string, KnowledgeEntry[]> = {};
    entries.forEach(entry => {
      if (!categoryGroups[entry.category]) {
        categoryGroups[entry.category] = [];
      }
      categoryGroups[entry.category].push(entry);
    });

    Object.entries(categoryGroups).forEach(([category, categoryEntries]) => {
      if (categoryEntries.length >= 2) {
        const coherence = this.calculateClusterCoherence(categoryEntries);
        const completeness = this.calculateClusterCompleteness(categoryEntries);
        
        clusters.push({
          id: `cluster_${category}_${Date.now()}`,
          name: `${category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Cluster`,
          description: `Knowledge cluster focused on ${category}`,
          entries: categoryEntries.map(e => e.id),
          coherence,
          completeness,
          maturity: this.determineClusterMaturity(categoryEntries),
          gaps: this.identifyClusterGaps(categoryEntries),
          opportunities: this.identifyClusterOpportunities(categoryEntries)
        });
      }
    });

    return clusters;
  }

  private calculateClusterCoherence(entries: KnowledgeEntry[]): number {
    if (entries.length < 2) return 1;

    let totalConnections = 0;
    let possibleConnections = 0;

    entries.forEach((entry, i) => {
      entries.slice(i + 1).forEach(otherEntry => {
        possibleConnections++;
        const hasConnection = entry.connections.some(conn => conn.targetEntryId === otherEntry.id);
        if (hasConnection) totalConnections++;
      });
    });

    return possibleConnections > 0 ? totalConnections / possibleConnections : 0;
  }

  private calculateClusterCompleteness(entries: KnowledgeEntry[]): number {
    // Assess how complete the knowledge cluster is
    const maturityLevels = entries.map(e => e.metadata.maturity);
    const matureCount = maturityLevels.filter(m => m === 'mature' || m === 'fundamental').length;
    
    const evidenceRate = entries.filter(e => e.evidence.length > 0).length / entries.length;
    const applicationRate = entries.filter(e => e.applications.length > 0).length / entries.length;
    
    return (matureCount / entries.length) * 0.4 + evidenceRate * 0.3 + applicationRate * 0.3;
  }

  private determineClusterMaturity(entries: KnowledgeEntry[]): string {
    const maturityScores = {
      emerging: 1,
      developing: 2,
      established: 3,
      mature: 4,
      fundamental: 5
    };

    const avgScore = entries.reduce((sum, entry) => {
      return sum + maturityScores[entry.metadata.maturity as keyof typeof maturityScores];
    }, 0) / entries.length;

    if (avgScore >= 4.5) return 'fundamental';
    if (avgScore >= 3.5) return 'mature';
    if (avgScore >= 2.5) return 'established';
    if (avgScore >= 1.5) return 'developing';
    return 'emerging';
  }

  private identifyClusterGaps(entries: KnowledgeEntry[]): string[] {
    const gaps: string[] = [];
    
    // Check for missing evidence
    const unevidencedCount = entries.filter(e => e.evidence.length === 0).length;
    if (unevidencedCount > entries.length * 0.3) {
      gaps.push('Insufficient evidence for many entries');
    }
    
    // Check for missing applications
    const unappliedCount = entries.filter(e => e.applications.length === 0).length;
    if (unappliedCount > entries.length * 0.4) {
      gaps.push('Limited practical application experience');
    }
    
    // Check for validation gaps
    const unvalidatedCount = entries.filter(e => !e.validation.selfValidated).length;
    if (unvalidatedCount > entries.length * 0.2) {
      gaps.push('Many entries lack validation');
    }

    return gaps;
  }

  private identifyClusterOpportunities(entries: KnowledgeEntry[]): string[] {
    const opportunities: string[] = [];
    
    // High-value entries that could be developed further
    const highValueEntries = entries.filter(e => 
      e.futureValue.buildingPotential > 0.7 || e.futureValue.teachingValue > 0.7
    );
    
    if (highValueEntries.length > 0) {
      opportunities.push(`Develop ${highValueEntries.length} high-potential entries further`);
    }
    
    // Entries that could be connected better
    const isolatedEntries = entries.filter(e => e.connections.length < 2);
    if (isolatedEntries.length > 0) {
      opportunities.push(`Create more connections for ${isolatedEntries.length} isolated entries`);
    }
    
    // Sharing opportunities
    const sharableEntries = entries.filter(e => 
      e.futureValue.socialValue > 0.6 && e.sharing.visibility === 'private'
    );
    
    if (sharableEntries.length > 0) {
      opportunities.push(`Consider sharing ${sharableEntries.length} valuable entries`);
    }

    return opportunities;
  }

  private generateLearningPathways(entryIds: string[]): LearningPathway[] {
    const pathways: LearningPathway[] = [];
    const entries = entryIds.map(id => this.knowledgeEntries.get(id)).filter(Boolean) as KnowledgeEntry[];
    
    // Create pathways for each category
    const categoryGroups: Record<string, KnowledgeEntry[]> = {};
    entries.forEach(entry => {
      if (!categoryGroups[entry.category]) {
        categoryGroups[entry.category] = [];
      }
      categoryGroups[entry.category].push(entry);
    });

    Object.entries(categoryGroups).forEach(([category, categoryEntries]) => {
      if (categoryEntries.length >= 3) {
        const sortedEntries = this.sortEntriesForLearning(categoryEntries);
        
        const pathway: LearningPathway = {
          id: `pathway_${category}_${Date.now()}`,
          name: `${category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Learning Path`,
          description: `Progressive learning pathway for ${category}`,
          startEntry: sortedEntries[0].id,
          endEntry: sortedEntries[sortedEntries.length - 1].id,
          steps: sortedEntries.map((entry, index) => ({
            entryId: entry.id,
            order: index + 1,
            rationale: this.generateStepRationale(entry, index, sortedEntries.length),
            activities: this.generateStepActivities(entry),
            checkpoints: this.generateStepCheckpoints(entry),
            resources: this.generateStepResources(entry)
          })),
          difficulty: this.calculatePathwayDifficulty(sortedEntries),
          estimatedTime: this.estimatePathwayTime(sortedEntries),
          prerequisites: this.identifyPathwayPrerequisites(sortedEntries),
          outcomes: this.definePathwayOutcomes(sortedEntries)
        };

        pathways.push(pathway);
      }
    });

    return pathways;
  }

  private sortEntriesForLearning(entries: KnowledgeEntry[]): KnowledgeEntry[] {
    // Sort by complexity and dependency
    return entries.sort((a, b) => {
      const complexityOrder = { simple: 1, moderate: 2, complex: 3, advanced: 4 };
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
      
      const aScore = complexityOrder[a.metadata.complexity] + difficultyOrder[a.metadata.difficulty];
      const bScore = complexityOrder[b.metadata.complexity] + difficultyOrder[b.metadata.difficulty];
      
      return aScore - bScore;
    });
  }

  private generateStepRationale(entry: KnowledgeEntry, index: number, total: number): string {
    if (index === 0) {
      return `Starting with ${entry.title} provides foundational understanding`;
    } else if (index === total - 1) {
      return `${entry.title} represents advanced application of previous concepts`;
    } else {
      return `${entry.title} builds upon previous knowledge and prepares for advanced concepts`;
    }
  }

  private generateStepActivities(entry: KnowledgeEntry): string[] {
    const activities = [`Study: ${entry.title}`];
    
    if (entry.evidence.length > 0) {
      activities.push('Review evidence and examples');
    }
    
    if (entry.applications.length > 0) {
      activities.push('Explore practical applications');
    }
    
    activities.push('Reflect on personal connections');
    activities.push('Create personal examples');
    
    return activities;
  }

  private generateStepCheckpoints(entry: KnowledgeEntry): string[] {
    return [
      `Can explain ${entry.title} in own words`,
      'Understands the context and importance',
      'Can identify when to apply this knowledge',
      'Can connect to other related concepts'
    ];
  }

  private generateStepResources(entry: KnowledgeEntry): string[] {
    const resources = [entry.content];
    
    if (entry.accessibility.analogies.length > 0) {
      resources.push('Study provided analogies');
    }
    
    if (entry.accessibility.examples.length > 0) {
      resources.push('Review practical examples');
    }
    
    return resources;
  }

  private calculatePathwayDifficulty(entries: KnowledgeEntry[]): string {
    const difficulties = entries.map(e => e.metadata.difficulty);
    const hasExpert = difficulties.includes('expert');
    const hasAdvanced = difficulties.includes('advanced');
    
    if (hasExpert) return 'expert';
    if (hasAdvanced) return 'advanced';
    if (difficulties.includes('intermediate')) return 'intermediate';
    return 'beginner';
  }

  private estimatePathwayTime(entries: KnowledgeEntry[]): string {
    const baseTime = entries.length * 30; // 30 minutes per entry
    const complexityMultiplier = entries.reduce((mult, entry) => {
      const complexityValues = { simple: 1, moderate: 1.2, complex: 1.5, advanced: 2 };
      return mult * complexityValues[entry.metadata.complexity];
    }, 1);
    
    const totalMinutes = baseTime * complexityMultiplier;
    const hours = Math.round(totalMinutes / 60 * 10) / 10;
    
    return `${hours} hours`;
  }

  private identifyPathwayPrerequisites(entries: KnowledgeEntry[]): string[] {
    const prerequisites: string[] = [];
    const firstEntry = entries[0];
    
    // Look at connections that might be prerequisites
    firstEntry.connections.forEach(conn => {
      if (conn.type === 'requires' || conn.type === 'builds_on') {
        const targetEntry = this.knowledgeEntries.get(conn.targetEntryId);
        if (targetEntry) {
          prerequisites.push(targetEntry.title);
        }
      }
    });
    
    return prerequisites;
  }

  private definePathwayOutcomes(entries: KnowledgeEntry[]): string[] {
    const outcomes: string[] = [];
    const lastEntry = entries[entries.length - 1];
    
    outcomes.push(`Master ${lastEntry.category.replace('_', ' ')}`);
    outcomes.push(`Apply ${entries.length} key concepts`);
    outcomes.push('Develop integrated understanding');
    outcomes.push('Build practical competency');
    
    return outcomes;
  }

  private generateMapInsights(entryIds: string[]): MapInsight[] {
    const insights: MapInsight[] = [];
    const entries = entryIds.map(id => this.knowledgeEntries.get(id)).filter(Boolean) as KnowledgeEntry[];
    
    // Identify gaps
    const categories = [...new Set(entries.map(e => e.category))];
    categories.forEach(category => {
      const categoryEntries = entries.filter(e => e.category === category);
      if (categoryEntries.length < 3) {
        insights.push({
          type: 'gap',
          description: `Limited knowledge in ${category.replace('_', ' ')}`,
          entries: categoryEntries.map(e => e.id),
          significance: 0.7,
          actionable: true,
          recommendations: [`Develop more knowledge in ${category}`, 'Explore fundamental concepts']
        });
      }
    });
    
    // Identify isolated entries
    const isolatedEntries = entries.filter(e => e.connections.length === 0);
    if (isolatedEntries.length > 0) {
      insights.push({
        type: 'connection',
        description: `${isolatedEntries.length} entries lack connections`,
        entries: isolatedEntries.map(e => e.id),
        significance: 0.6,
        actionable: true,
        recommendations: ['Find related concepts', 'Create explicit connections', 'Review for patterns']
      });
    }
    
    // Identify high-value opportunities
    const highValueEntries = entries.filter(e => 
      e.futureValue.buildingPotential > 0.8 && e.applications.length === 0
    );
    
    if (highValueEntries.length > 0) {
      insights.push({
        type: 'opportunity',
        description: `${highValueEntries.length} high-potential entries await application`,
        entries: highValueEntries.map(e => e.id),
        significance: 0.8,
        actionable: true,
        recommendations: ['Plan practical applications', 'Create experiments', 'Seek application opportunities']
      });
    }

    return insights;
  }

  async updateAnalytics(): Promise<KnowledgeAnalytics> {
    const entries = Array.from(this.knowledgeEntries.values());
    const patterns = Array.from(this.wisdomPatterns.values());
    
    const analytics: KnowledgeAnalytics = {
      overview: this.calculateOverviewAnalytics(entries),
      quality: this.calculateQualityAnalytics(entries),
      growth: this.calculateGrowthAnalytics(entries),
      patterns: this.calculatePatternAnalytics(patterns),
      impact: this.calculateImpactAnalytics(entries),
      gaps: this.identifyKnowledgeGaps(entries),
      recommendations: this.generateKnowledgeRecommendations(entries)
    };

    this.analytics = analytics;
    this.emit('analyticsUpdated', analytics);
    
    return analytics;
  }

  private calculateOverviewAnalytics(entries: KnowledgeEntry[]): KnowledgeAnalytics['overview'] {
    const totalConnections = entries.reduce((sum, entry) => sum + entry.connections.length, 0);
    const averageConnections = entries.length > 0 ? totalConnections / entries.length : 0;
    
    // Calculate knowledge density (connections per entry ratio)
    const knowledgeDensity = averageConnections / Math.max(1, entries.length);
    
    const maturityDistribution: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};
    
    entries.forEach(entry => {
      maturityDistribution[entry.metadata.maturity] = (maturityDistribution[entry.metadata.maturity] || 0) + 1;
      categoryDistribution[entry.category] = (categoryDistribution[entry.category] || 0) + 1;
    });

    return {
      totalEntries: entries.length,
      totalConnections,
      averageConnections,
      knowledgeDensity,
      maturityDistribution,
      categoryDistribution
    };
  }

  private calculateQualityAnalytics(entries: KnowledgeEntry[]): KnowledgeAnalytics['quality'] {
    if (entries.length === 0) {
      return {
        averageConfidence: 0,
        averageReliability: 0,
        validationRate: 0,
        evidenceRate: 0,
        applicationRate: 0
      };
    }

    const totalConfidence = entries.reduce((sum, entry) => sum + entry.metadata.confidence, 0);
    const totalReliability = entries.reduce((sum, entry) => sum + entry.metadata.reliability, 0);
    
    const validatedEntries = entries.filter(entry => 
      entry.validation.selfValidated || entry.validation.peerValidated || entry.validation.expertValidated
    ).length;
    
    const evidencedEntries = entries.filter(entry => entry.evidence.length > 0).length;
    const appliedEntries = entries.filter(entry => entry.applications.length > 0).length;

    return {
      averageConfidence: totalConfidence / entries.length,
      averageReliability: totalReliability / entries.length,
      validationRate: validatedEntries / entries.length,
      evidenceRate: evidencedEntries / entries.length,
      applicationRate: appliedEntries / entries.length
    };
  }

  private calculateGrowthAnalytics(entries: KnowledgeEntry[]): KnowledgeAnalytics['growth'] {
    if (entries.length === 0) {
      return {
        entriesPerMonth: 0,
        connectionsPerMonth: 0,
        maturityProgression: 0,
        learningVelocity: 0,
        knowledgeRetention: 0
      };
    }

    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentEntries = entries.filter(entry => entry.metadata.createdDate > monthAgo);
    const recentConnections = entries.reduce((sum, entry) => {
      return sum + entry.connections.filter(conn => conn.discoveredDate > monthAgo).length;
    }, 0);

    // Calculate maturity progression
    const maturityScores = { emerging: 1, developing: 2, established: 3, mature: 4, fundamental: 5 };
    const averageMaturity = entries.reduce((sum, entry) => {
      return sum + maturityScores[entry.metadata.maturity as keyof typeof maturityScores];
    }, 0) / entries.length;

    // Learning velocity based on evolution records
    const totalEvolutions = entries.reduce((sum, entry) => sum + entry.evolution.length, 0);
    const recentEvolutions = entries.reduce((sum, entry) => {
      return sum + entry.evolution.filter(ev => ev.date > monthAgo).length;
    }, 0);

    // Knowledge retention based on recent access patterns
    const retentionRate = 0.8; // Simplified - would track actual retrieval success

    return {
      entriesPerMonth: recentEntries.length,
      connectionsPerMonth: recentConnections,
      maturityProgression: averageMaturity,
      learningVelocity: recentEvolutions,
      knowledgeRetention: retentionRate
    };
  }

  private calculatePatternAnalytics(patterns: WisdomPattern[]): KnowledgeAnalytics['patterns'] {
    const totalApplications = patterns.reduce((sum, pattern) => sum + pattern.applications.length, 0);
    const averageAccuracy = patterns.length > 0 ? 
      patterns.reduce((sum, pattern) => sum + pattern.predictivePower, 0) / patterns.length : 0;

    // Identify emerging patterns (low application count but high potential)
    const emergingPatterns = patterns
      .filter(p => p.applications.length < 3 && p.generalizability > 0.7)
      .map(p => p.name);

    // Identify strongest patterns
    const strongestPatterns = patterns
      .filter(p => p.strength > 0.8 && p.applications.length > 2)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map(p => p.name);

    return {
      identifiedPatterns: patterns.length,
      patternStrength: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length : 0,
      patternApplication: averageAccuracy,
      emergingPatterns,
      strongestPatterns
    };
  }

  private calculateImpactAnalytics(entries: KnowledgeEntry[]): KnowledgeAnalytics['impact'] {
    if (entries.length === 0) {
      return {
        personalImpact: 0,
        professionalImpact: 0,
        creativeImpact: 0,
        socialImpact: 0,
        legacyPotential: 0
      };
    }

    const personalImpact = entries.reduce((sum, entry) => {
      return sum + entry.impact.personal.behavior.length + 
             entry.impact.personal.decisions.length + 
             entry.impact.personal.skills.length;
    }, 0) / entries.length;

    const professionalImpact = entries.reduce((sum, entry) => {
      return sum + (entry.impact.professional.productivity + 
                   entry.impact.professional.quality + 
                   entry.impact.professional.efficiency) / 3;
    }, 0) / entries.length;

    const creativeImpact = entries.reduce((sum, entry) => {
      return sum + entry.impact.creative.breakthroughs.length + 
             entry.impact.creative.techniques.length;
    }, 0) / entries.length;

    const socialImpact = entries.reduce((sum, entry) => {
      return sum + entry.impact.social.shared + entry.impact.social.taught;
    }, 0) / entries.length;

    const legacyPotential = entries.reduce((sum, entry) => {
      return sum + (entry.futureValue.timelessness + 
                   entry.futureValue.transferability + 
                   entry.futureValue.teachingValue) / 3;
    }, 0) / entries.length;

    return {
      personalImpact,
      professionalImpact,
      creativeImpact,
      socialImpact,
      legacyPotential
    };
  }

  private identifyKnowledgeGaps(entries: KnowledgeEntry[]): KnowledgeAnalytics['gaps'] {
    const knowledgeGaps: KnowledgeGap[] = [];
    const connectionGaps: string[] = [];
    const validationGaps: string[] = [];
    const applicationGaps: string[] = [];

    // Identify category gaps
    const categoryCount: Record<string, number> = {};
    entries.forEach(entry => {
      categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
    });

    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count < 3) {
        knowledgeGaps.push({
          area: category,
          description: `Limited knowledge in ${category.replace('_', ' ')}`,
          impact: 0.7,
          urgency: 0.5,
          difficulty: 'moderate',
          resources: ['Research', 'Study', 'Practice'],
          timeEstimate: '1-2 months',
          priority: 6
        });
      }
    });

    // Identify connection gaps
    const isolatedEntries = entries.filter(entry => entry.connections.length === 0);
    isolatedEntries.forEach(entry => {
      connectionGaps.push(`${entry.title} lacks connections to other knowledge`);
    });

    // Identify validation gaps
    const unvalidatedEntries = entries.filter(entry => !entry.validation.selfValidated);
    unvalidatedEntries.forEach(entry => {
      validationGaps.push(`${entry.title} needs validation`);
    });

    // Identify application gaps
    const unappliedEntries = entries.filter(entry => entry.applications.length === 0);
    unappliedEntries.forEach(entry => {
      applicationGaps.push(`${entry.title} needs practical application`);
    });

    return {
      knowledgeGaps,
      connectionGaps,
      validationGaps,
      applicationGaps
    };
  }

  private generateKnowledgeRecommendations(entries: KnowledgeEntry[]): KnowledgeRecommendation[] {
    const recommendations: KnowledgeRecommendation[] = [];

    // Recommend creating missing connections
    const isolatedEntries = entries.filter(entry => entry.connections.length === 0);
    if (isolatedEntries.length > 0) {
      recommendations.push({
        type: 'connection',
        title: 'Connect Isolated Knowledge',
        description: `${isolatedEntries.length} entries lack connections to other knowledge`,
        rationale: 'Connected knowledge is more retrievable and useful',
        impact: 0.7,
        effort: 0.3,
        timeline: '1-2 weeks',
        steps: [
          'Review isolated entries',
          'Identify potential connections',
          'Create explicit links',
          'Verify connections'
        ],
        resources: ['Knowledge map', 'Entry review process'],
        relatedEntries: isolatedEntries.map(e => e.id)
      });
    }

    // Recommend validating high-value entries
    const highValueUnvalidated = entries.filter(entry => 
      entry.futureValue.personalValue > 0.7 && !entry.validation.selfValidated
    );
    
    if (highValueUnvalidated.length > 0) {
      recommendations.push({
        type: 'validation',
        title: 'Validate High-Value Knowledge',
        description: `${highValueUnvalidated.length} valuable entries need validation`,
        rationale: 'Validation increases confidence and reliability',
        impact: 0.8,
        effort: 0.4,
        timeline: '2-3 weeks',
        steps: [
          'Identify validation methods',
          'Gather supporting evidence',
          'Seek peer input where appropriate',
          'Document validation results'
        ],
        resources: ['Validation criteria', 'Evidence collection tools'],
        relatedEntries: highValueUnvalidated.map(e => e.id)
      });
    }

    // Recommend applying theoretical knowledge
    const theoreticalEntries = entries.filter(entry => 
      entry.applications.length === 0 && entry.futureValue.buildingPotential > 0.6
    );
    
    if (theoreticalEntries.length > 0) {
      recommendations.push({
        type: 'application',
        title: 'Apply Theoretical Knowledge',
        description: `${theoreticalEntries.length} entries need practical application`,
        rationale: 'Application deepens understanding and proves value',
        impact: 0.9,
        effort: 0.6,
        timeline: '1-2 months',
        steps: [
          'Identify application opportunities',
          'Plan experiments or trials',
          'Execute applications',
          'Document results and learnings'
        ],
        resources: ['Application planning template', 'Experiment design guide'],
        relatedEntries: theoreticalEntries.map(e => e.id)
      });
    }

    return recommendations.sort((a, b) => (b.impact / b.effort) - (a.impact / a.effort));
  }

  private initializeAnalytics(): void {
    this.updateAnalytics();
  }

  private schedulePeriodicAnalysis(): void {
    // Update analytics weekly
    setInterval(() => {
      this.updateAnalytics();
    }, 7 * 24 * 60 * 60 * 1000);

    // Identify new patterns monthly
    setInterval(() => {
      this.identifyNewPatterns();
    }, 30 * 24 * 60 * 60 * 1000);
  }

  private async identifyNewPatterns(): Promise<void> {
    const entries = Array.from(this.knowledgeEntries.values());
    
    // Simple pattern identification based on frequently connected concepts
    const connectionCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
      entry.connections.forEach(conn => {
        const key = `${entry.category}-${this.knowledgeEntries.get(conn.targetEntryId)?.category}`;
        connectionCounts[key] = (connectionCounts[key] || 0) + 1;
      });
    });

    Object.entries(connectionCounts).forEach(([pattern, count]) => {
      if (count >= 3) {
        const patternName = `${pattern.replace('-', ' and ')} Connection Pattern`;
        
        // Check if pattern already exists
        const existingPattern = Array.from(this.wisdomPatterns.values())
          .find(p => p.name === patternName);
        
        if (!existingPattern) {
          this.createWisdomPattern({
            name: patternName,
            description: `Frequent connections between ${pattern.replace('-', ' and ')}`,
            pattern: `When working with ${pattern.split('-')[0]}, consider ${pattern.split('-')[1]}`,
            examples: [`Observed ${count} times in knowledge base`],
            relatedEntries: [],
            strength: Math.min(1, count / 10),
            generalizability: 0.6,
            predictivePower: 0.5,
            actionability: 0.7,
            evolution: ['Automatically identified from connection patterns'],
            futureImplications: ['May indicate fundamental relationship', 'Could guide learning priorities']
          });
        }
      }
    });
  }

  // Storage methods
  private async loadDataFromStorage(): Promise<void> {
    try {
      const storedEntries = localStorage.getItem('knowledge_entries');
      if (storedEntries) {
        const entriesArray = JSON.parse(storedEntries);
        entriesArray.forEach((entry: any) => {
          entry.metadata.createdDate = new Date(entry.metadata.createdDate);
          entry.metadata.lastModified = new Date(entry.metadata.lastModified);
          entry.connections.forEach((conn: any) => {
            conn.discoveredDate = new Date(conn.discoveredDate);
          });
          entry.evidence.forEach((ev: any) => {
            ev.date = new Date(ev.date);
          });
          entry.applications.forEach((app: any) => {
            app.dateApplied = new Date(app.dateApplied);
          });
          entry.evolution.forEach((evo: any) => {
            evo.date = new Date(evo.date);
          });
          entry.preservation.verification.lastChecked = new Date(entry.preservation.verification.lastChecked);
          entry.validation.validationHistory.forEach((val: any) => {
            val.date = new Date(val.date);
          });
          this.knowledgeEntries.set(entry.id, entry);
        });
      }

      const storedPatterns = localStorage.getItem('wisdom_patterns');
      if (storedPatterns) {
        const patternsArray = JSON.parse(storedPatterns);
        patternsArray.forEach((pattern: any) => {
          pattern.discovered = new Date(pattern.discovered);
          pattern.verified = new Date(pattern.verified);
          pattern.applications.forEach((app: any) => {
            app.date = new Date(app.date);
          });
          this.wisdomPatterns.set(pattern.id, pattern);
        });
      }

      const storedMaps = localStorage.getItem('knowledge_maps');
      if (storedMaps) {
        const mapsArray = JSON.parse(storedMaps);
        mapsArray.forEach((map: any) => {
          map.metadata.created = new Date(map.metadata.created);
          map.metadata.lastUpdated = new Date(map.metadata.lastUpdated);
          map.visualization.annotations.forEach((ann: any) => {
            ann.date = new Date(ann.date);
          });
          map.visualization.views.forEach((view: any) => {
            view.saved = new Date(view.saved);
          });
          this.knowledgeMaps.set(map.id, map);
        });
      }

      const storedGoals = localStorage.getItem('learning_goals');
      if (storedGoals) {
        const goalsArray = JSON.parse(storedGoals);
        goalsArray.forEach((goal: any) => {
          goal.timeline.start = new Date(goal.timeline.start);
          goal.timeline.target = new Date(goal.timeline.target);
          goal.timeline.milestones.forEach((milestone: any) => {
            milestone.targetDate = new Date(milestone.targetDate);
            if (milestone.completedDate) milestone.completedDate = new Date(milestone.completedDate);
          });
          goal.progress.milestones.forEach((progress: any) => {
            progress.date = new Date(progress.date);
          });
          goal.progress.setbacks.forEach((setback: any) => {
            setback.date = new Date(setback.date);
          });
          goal.progress.breakthroughs.forEach((breakthrough: any) => {
            breakthrough.date = new Date(breakthrough.date);
          });
          goal.outcomes.forEach((outcome: any) => {
            outcome.date = new Date(outcome.date);
          });
          this.learningGoals.set(goal.id, goal);
        });
      }
    } catch (error) {
      console.error('Error loading knowledge base data from storage:', error);
    }
  }

  private async saveDataToStorage(): Promise<void> {
    try {
      // Save knowledge entries
      const entriesArray = Array.from(this.knowledgeEntries.values());
      localStorage.setItem('knowledge_entries', JSON.stringify(entriesArray));

      // Save wisdom patterns
      const patternsArray = Array.from(this.wisdomPatterns.values());
      localStorage.setItem('wisdom_patterns', JSON.stringify(patternsArray));

      // Save knowledge maps
      const mapsArray = Array.from(this.knowledgeMaps.values());
      localStorage.setItem('knowledge_maps', JSON.stringify(mapsArray));

      // Save learning goals
      const goalsArray = Array.from(this.learningGoals.values());
      localStorage.setItem('learning_goals', JSON.stringify(goalsArray));
    } catch (error) {
      console.error('Error saving knowledge base data to storage:', error);
    }
  }

  // Public getter methods
  getKnowledgeEntries(filter?: { category?: string; type?: string; maturity?: string }): KnowledgeEntry[] {
    let entries = Array.from(this.knowledgeEntries.values());
    
    if (filter?.category) {
      entries = entries.filter(entry => entry.category === filter.category);
    }
    
    if (filter?.type) {
      entries = entries.filter(entry => entry.type === filter.type);
    }
    
    if (filter?.maturity) {
      entries = entries.filter(entry => entry.metadata.maturity === filter.maturity);
    }
    
    return entries.sort((a, b) => b.metadata.lastModified.getTime() - a.metadata.lastModified.getTime());
  }

  getKnowledgeEntry(entryId: string): KnowledgeEntry | undefined {
    return this.knowledgeEntries.get(entryId);
  }

  getWisdomPatterns(): WisdomPattern[] {
    return Array.from(this.wisdomPatterns.values())
      .sort((a, b) => b.strength - a.strength);
  }

  getKnowledgeMaps(): KnowledgeMap[] {
    return Array.from(this.knowledgeMaps.values())
      .sort((a, b) => b.metadata.lastUpdated.getTime() - a.metadata.lastUpdated.getTime());
  }

  getLearningGoals(): LearningGoal[] {
    return Array.from(this.learningGoals.values())
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  getKnowledgeAnalytics(): KnowledgeAnalytics | null {
    return this.analytics;
  }

  async searchKnowledge(query: string): Promise<KnowledgeEntry[]> {
    const entries = Array.from(this.knowledgeEntries.values());
    const queryLower = query.toLowerCase();
    
    return entries.filter(entry => {
      return entry.title.toLowerCase().includes(queryLower) ||
             entry.content.toLowerCase().includes(queryLower) ||
             entry.summary.toLowerCase().includes(queryLower) ||
             entry.accessibility.keywords.some(keyword => keyword.includes(queryLower)) ||
             entry.tags?.some(tag => tag.toLowerCase().includes(queryLower));
    }).sort((a, b) => {
      // Sort by relevance (simplified scoring)
      const aScore = this.calculateRelevanceScore(a, queryLower);
      const bScore = this.calculateRelevanceScore(b, queryLower);
      return bScore - aScore;
    });
  }

  private calculateRelevanceScore(entry: KnowledgeEntry, query: string): number {
    let score = 0;
    
    if (entry.title.toLowerCase().includes(query)) score += 3;
    if (entry.summary.toLowerCase().includes(query)) score += 2;
    if (entry.content.toLowerCase().includes(query)) score += 1;
    
    entry.accessibility.keywords.forEach(keyword => {
      if (keyword.includes(query)) score += 1;
    });
    
    return score;
  }

  async deleteKnowledgeEntry(entryId: string): Promise<void> {
    const entry = this.knowledgeEntries.get(entryId);
    if (!entry) return;

    // Remove connections to this entry from other entries
    this.knowledgeEntries.forEach(otherEntry => {
      otherEntry.connections = otherEntry.connections.filter(conn => conn.targetEntryId !== entryId);
    });

    // Remove from wisdom patterns
    this.wisdomPatterns.forEach(pattern => {
      pattern.relatedEntries = pattern.relatedEntries.filter(id => id !== entryId);
    });

    // Remove from knowledge maps
    this.knowledgeMaps.forEach(map => {
      map.entries = map.entries.filter(id => id !== entryId);
      map.connections = map.connections.filter(conn => conn.from !== entryId && conn.to !== entryId);
    });

    this.knowledgeEntries.delete(entryId);
    await this.updateAnalytics();
    await this.saveDataToStorage();
    
    this.emit('knowledgeEntryDeleted', entryId);
  }
}

export const personalKnowledgeBaseService = new PersonalKnowledgeBaseService();
export default personalKnowledgeBaseService;