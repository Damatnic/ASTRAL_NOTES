/**
 * Phase 1C Advanced Codex System Type Definitions
 * Comprehensive entity management surpassing NovelCrafter's Codex
 * Supporting 7 core entity types with advanced relationships and AI-powered features
 */

// Core entity types for the advanced Codex system
export type AdvancedEntityType = 
  | 'character'       // Comprehensive character profiles with relationships and arcs
  | 'location'        // Detailed world-building with maps, cultures, histories  
  | 'object'          // Magical artifacts, technology, important props
  | 'lore'            // Magic systems, religions, species, customs
  | 'theme'           // Abstract concepts, symbolism, meaning tracking
  | 'subplot'         // Secondary storylines with their own structure
  | 'organization';   // Governments, guilds, companies, factions

// Enhanced base entity interface
export interface AdvancedCodexEntity {
  id: string;
  projectId: string;
  universeId?: string; // For series/universe management
  type: AdvancedEntityType;
  
  // Core identification
  name: string;
  aliases: string[]; // For auto-linking
  summary: string;
  description: string;
  
  // Visual and organization
  color?: string;
  icon?: string;
  tags: string[];
  category?: string;
  subcategory?: string;
  
  // Importance and relevance
  importance: 1 | 2 | 3 | 4 | 5; // 5 being most important
  status: 'active' | 'archived' | 'hidden' | 'template';
  
  // Cross-references and auto-linking
  mentionedIn: EntityMention[];
  linkedEntities: EntityLink[];
  
  // AI-powered features
  aiSuggestions: AISuggestion[];
  consistencyFlags: ConsistencyFlag[];
  
  // Collaboration and versioning
  version: number;
  lastEditedBy?: string;
  isCanonical: boolean;
  alternateVersions?: string[];
  collaborativeNotes: CollaborativeNote[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  accessCount: number;
}

// Character entity with comprehensive details
export interface CharacterEntity extends AdvancedCodexEntity {
  type: 'character';
  data: {
    // Basic information
    fullName?: string;
    title?: string;
    age?: number;
    birthday?: string;
    birthplace?: string;
    
    // Physical characteristics
    appearance: {
      height?: string;
      weight?: string;
      eyeColor?: string;
      hairColor?: string;
      skinTone?: string;
      build?: 'slim' | 'athletic' | 'average' | 'heavy' | 'muscular';
      distinguishingMarks?: string[];
      style?: string;
    };
    
    // Personality and psychology
    personality: {
      traits: string[];
      strengths: string[];
      weaknesses: string[];
      fears: string[];
      motivations: string[];
      goals: CharacterGoal[];
      flaws: string[];
      mentalHealth?: string;
      moralAlignment?: MoralAlignment;
    };
    
    // Background and history
    background: {
      occupation?: string;
      education?: string;
      socialClass?: SocialClass;
      family: FamilyMember[];
      culturalBackground?: string;
      religion?: string;
      politicalViews?: string;
      backstory?: string;
    };
    
    // Abilities and skills
    abilities: {
      skills: CharacterSkill[];
      talents: string[];
      languages: string[];
      magicalAbilities?: MagicalAbility[];
      specialPowers?: string[];
    };
    
    // Story role and development
    storyRole: {
      role: CharacterRole;
      importance: 1 | 2 | 3 | 4 | 5;
      screenTime: 'major' | 'recurring' | 'guest' | 'cameo';
      arc: CharacterArc;
      conflicts: CharacterConflict[];
    };
    
    // Voice and dialogue
    voice: {
      speechPatterns: string[];
      vocabulary?: VocabularyStyle;
      accent?: string;
      catchphrases: string[];
      speechQuirks: string[];
      tone: string[];
    };
    
    // Relationships
    relationships: CharacterRelationship[];
    
    // Timeline
    timeline: CharacterTimelineEvent[];
    
    // References
    images: string[];
    voiceReferences?: string[];
    inspirations?: string[];
  };
}

// Location entity with comprehensive world-building
export interface LocationEntity extends AdvancedCodexEntity {
  type: 'location';
  data: {
    // Basic classification
    locationType: LocationType;
    subtype?: string;
    scale: LocationScale;
    
    // Geographic information
    geography: {
      climate?: ClimateType;
      terrain?: TerrainType;
      size?: string;
      area?: number;
      elevation?: number;
      coordinates?: { lat: number; lng: number };
      naturalResources?: string[];
      flora?: string[];
      fauna?: string[];
    };
    
    // Political and social structure
    governance: {
      type?: GovernmentType;
      ruler?: string; // Character ID
      laws?: string[];
      socialStructure?: string;
    };
    
    // Cultural aspects
    culture: {
      primaryLanguage?: string;
      languages?: string[];
      religions?: string[];
      customs?: string[];
      values?: string[];
      festivals?: CulturalEvent[];
      architecture?: string;
    };
    
    // Economic information
    economy: {
      type?: EconomyType;
      currency?: string;
      majorIndustries?: string[];
      tradingPartners?: string[];
      economicStatus?: EconomicStatus;
    };
    
    // Physical details
    physical: {
      layout?: string;
      landmarks?: Landmark[];
      districts?: LocationDistrict[];
      entrances?: LocationEntrance[];
      secretAreas?: SecretArea[];
    };
    
    // Atmosphere and mood
    atmosphere: {
      mood: string[];
      ambiance: string;
      sounds: string[];
      smells: string[];
      lighting?: LightingType;
      temperature?: TemperatureType;
    };
    
    // Inhabitants and presence
    population: {
      residents?: string[]; // Character IDs
      organizations?: string[]; // Organization IDs
      creatures?: string[];
      capacity?: number;
      demographics?: Demographics;
    };
    
    // Historical information
    history: LocationHistoryEvent[];
    
    // Connections and access
    connections: LocationConnection[];
    accessibility: AccessibilityInfo;
    
    // Dangers and safety
    dangers: LocationDanger[];
    safetyLevel: SafetyLevel;
    
    // Magical properties
    magicalProperties?: MagicalProperty[];
    magicalAura?: MagicalAuraStrength;
    
    // References
    images: string[];
    maps: string[];
    floorPlans?: string[];
    conceptArt?: string[];
  };
}

// Object entity for items, artifacts, and props
export interface ObjectEntity extends AdvancedCodexEntity {
  type: 'object';
  data: {
    // Classification
    objectType: ObjectType;
    subtype?: string;
    rarity: RarityLevel;
    
    // Physical properties
    physical: {
      size: SizeCategory;
      dimensions?: Dimensions;
      weight?: Weight;
      materials: string[];
      color: string[];
      shape?: string;
      condition: ConditionLevel;
      durability: DurabilityLevel;
    };
    
    // Functional aspects
    function: {
      primaryPurpose: string;
      abilities: ObjectAbility[];
      limitations: string[];
      requirements: string[];
      instructions?: string;
    };
    
    // Value and significance
    value: {
      monetary?: MonetaryValue;
      practical: ValueLevel;
      sentimental: ValueLevel;
      historical: ValueLevel;
      strategic: ValueLevel;
    };
    
    // Magical properties
    magical?: {
      isMagical: boolean;
      enchantments: MagicalEnchantment[];
      magicSource?: string;
      magicStrength: MagicalStrength;
      cursed?: boolean;
      sentient?: boolean;
      personality?: string;
    };
    
    // Ownership and location
    ownership: {
      currentOwner?: string; // Character ID
      ownershipType: OwnershipType;
      location?: string; // Location ID
      accessibility: AccessibilityLevel;
      ownershipHistory: OwnershipRecord[];
    };
    
    // History and origin
    history: {
      origin: string;
      creator?: string;
      creationDate?: string;
      purpose?: string;
      historicalEvents: ObjectHistoryEvent[];
      legends?: string[];
    };
    
    // Story significance
    storyRole: {
      role: ObjectRole;
      plotRelevance: string;
      symbolism?: string;
      themes: string[];
    };
    
    // Interactions and effects
    interactions: ObjectInteraction[];
    effects: ObjectEffect[];
    
    // Variants and related items
    variants?: ObjectVariant[];
    relatedObjects?: string[]; // Object IDs
    
    // References
    images: string[];
    blueprints?: string[];
    inspiredBy?: string[];
  };
}

// Lore entity for world-building elements
export interface LoreEntity extends AdvancedCodexEntity {
  type: 'lore';
  data: {
    // Classification
    loreType: LoreType;
    scope: LoreScope;
    
    // Core information
    origin: string;
    principles: string[];
    rules: string[];
    exceptions?: string[];
    
    // Practitioners and believers
    practitioners: string[]; // Character IDs
    believers?: string[]; // Character IDs
    organizations?: string[]; // Organization IDs
    
    // Geographic and cultural spread
    regions: string[]; // Location IDs
    cultures: string[];
    prevalence: PrevalenceLevel;
    
    // Historical development
    history: LoreHistoryEvent[];
    evolution: string;
    keyFigures: string[]; // Character IDs
    
    // Manifestations and expressions
    manifestations: LoreManifestation[];
    artifacts?: string[]; // Object IDs
    locations?: string[]; // Location IDs
    rituals?: Ritual[];
    
    // Conflicts and relationships
    opposingLore?: string[]; // Other lore IDs
    alliedLore?: string[]; // Other lore IDs
    derivedFrom?: string[]; // Other lore IDs
    
    // Game mechanics (if applicable)
    mechanics?: LoreMechanics;
    
    // Sources and references
    sources: string[];
    inspirations?: string[];
    realWorldBasis?: string[];
  };
}

// Theme entity for abstract concepts and symbolism
export interface ThemeEntity extends AdvancedCodexEntity {
  type: 'theme';
  data: {
    // Core concept
    concept: string;
    definition: string;
    variations: string[];
    
    // Manifestations in story
    symbolism: ThemeSymbolism[];
    motifs: ThemeMotif[];
    archetypes: string[];
    
    // Story integration
    plotIntegration: string;
    characterReflection: ThemeCharacterReflection[];
    settingReflection: string[];
    conflictTypes: string[];
    
    // Development throughout story
    development: ThemeDevelopment[];
    resolution?: string;
    
    // Cross-references
    relatedThemes: string[]; // Theme IDs
    opposingThemes: string[]; // Theme IDs
    supportingElements: ThemeSupportingElement[];
    
    // Analysis
    literaryDevices: string[];
    culturalContext?: string;
    universality: UniversalityLevel;
    
    // References
    inspirations?: string[];
    literaryExamples?: string[];
    realWorldConnections?: string[];
  };
}

// Subplot entity for secondary storylines
export interface SubplotEntity extends AdvancedCodexEntity {
  type: 'subplot';
  data: {
    // Classification
    subplotType: SubplotType;
    genre?: string;
    tone?: string;
    
    // Structure
    structure: {
      incitingIncident?: string;
      risingAction: string[];
      climax?: string;
      fallingAction?: string[];
      resolution?: string;
    };
    
    // Characters and focus
    protagonists: string[]; // Character IDs
    antagonists?: string[]; // Character IDs
    supportingCharacters: string[]; // Character IDs
    
    // Plot elements
    centralConflict: string;
    stakes: string;
    obstacles: SubplotObstacle[];
    themes: string[]; // Theme IDs
    
    // Timeline and pacing
    timeline: SubplotTimelineEvent[];
    pacing: PacingInfo;
    
    // Relationship to main plot
    mainPlotConnection: MainPlotConnection;
    influence: SubplotInfluence;
    
    // Scenes and progression
    scenes: string[]; // Scene IDs
    keyMoments: SubplotMoment[];
    
    // Status and completion
    status: SubplotStatus;
    completionPercentage: number;
    
    // Notes and development
    plotNotes: string;
    characterDevelopment: string[];
    foreshadowing?: string[];
  };
}

// Organization entity for groups, factions, institutions
export interface OrganizationEntity extends AdvancedCodexEntity {
  type: 'organization';
  data: {
    // Basic classification
    organizationType: OrganizationType;
    subtype?: string;
    scope: OrganizationScope;
    
    // Structure and hierarchy
    structure: {
      leadership: OrganizationLeader[];
      hierarchy: HierarchyLevel[];
      departments?: OrganizationDepartment[];
      totalMembers?: number;
      memberTypes?: MemberType[];
    };
    
    // Purpose and goals
    purpose: {
      primaryGoal: string;
      secondaryGoals: string[];
      mission?: string;
      values: string[];
      methods: string[];
    };
    
    // Membership and recruitment
    membership: {
      members: string[]; // Character IDs
      formerMembers?: string[]; // Character IDs
      recruitmentProcess?: string;
      membershipRequirements?: string[];
      loyaltyLevel: LoyaltyLevel;
    };
    
    // Resources and capabilities
    resources: {
      financial?: FinancialResources;
      military?: MilitaryCapabilities;
      political?: PoliticalInfluence;
      informational?: InformationNetwork;
      magical?: MagicalResources;
      technological?: TechnologicalResources;
    };
    
    // Operations and activities
    operations: {
      primaryActivities: string[];
      secretActivities?: string[];
      territories?: string[]; // Location IDs
      assets?: string[]; // Object IDs
      facilities?: string[]; // Location IDs
    };
    
    // Relationships with other entities
    relationships: {
      allies?: string[]; // Organization IDs
      enemies?: string[]; // Organization IDs
      rivals?: string[]; // Organization IDs
      subsidiaries?: string[]; // Organization IDs
      parentOrganization?: string; // Organization ID
    };
    
    // History and development
    history: OrganizationHistoryEvent[];
    foundingPrinciples: string[];
    evolution: string;
    
    // Reputation and public perception
    reputation: {
      publicReputation: ReputationLevel;
      secretReputation?: ReputationLevel;
      propagandaEfforts?: string[];
      publicImage: string;
    };
    
    // Symbols and culture
    culture: {
      symbols?: string[];
      colors?: string[];
      motto?: string;
      traditions?: string[];
      ceremonies?: string[];
      internalCulture: string;
    };
    
    // Legal and political status
    legalStatus: LegalStatus;
    politicalInfluence?: PoliticalInfluence;
    
    // References
    logos?: string[];
    documents?: string[];
    realWorldInspiration?: string[];
  };
}

// Supporting type definitions

export type MoralAlignment = 
  | 'lawful good' | 'neutral good' | 'chaotic good'
  | 'lawful neutral' | 'true neutral' | 'chaotic neutral'
  | 'lawful evil' | 'neutral evil' | 'chaotic evil';

export type SocialClass = 'lower' | 'working' | 'middle' | 'upper' | 'nobility' | 'royalty';

export type CharacterRole = 
  | 'protagonist' | 'deuteragonist' | 'tritagonist' | 'antagonist' 
  | 'antihero' | 'supporting' | 'minor' | 'background' | 'foil' 
  | 'mentor' | 'love_interest';

export type VocabularyStyle = 
  | 'formal' | 'casual' | 'vernacular' | 'professional' 
  | 'technical' | 'archaic' | 'street';

export type LocationType = 
  | 'continent' | 'country' | 'region' | 'city' | 'town' | 'village'
  | 'neighborhood' | 'building' | 'room' | 'natural' | 'landmark'
  | 'fictional' | 'dimensional' | 'other';

export type LocationScale = 'cosmic' | 'planetary' | 'continental' | 'national' | 'regional' | 'local' | 'intimate';

export type ClimateType = 'tropical' | 'temperate' | 'arctic' | 'desert' | 'mediterranean' | 'continental' | 'oceanic';
export type TerrainType = 'mountain' | 'hill' | 'plain' | 'valley' | 'forest' | 'desert' | 'coast' | 'island' | 'urban';
export type GovernmentType = 'monarchy' | 'democracy' | 'republic' | 'theocracy' | 'anarchy' | 'tribal' | 'corporate';
export type EconomyType = 'agricultural' | 'industrial' | 'commercial' | 'mining' | 'fishing' | 'trading' | 'magical' | 'mixed';
export type EconomicStatus = 'thriving' | 'stable' | 'struggling' | 'collapsed';
export type LightingType = 'bright' | 'dim' | 'dark' | 'natural' | 'artificial' | 'magical' | 'varies';
export type TemperatureType = 'hot' | 'warm' | 'cool' | 'cold' | 'freezing' | 'varies';
export type SafetyLevel = 'very safe' | 'safe' | 'moderate' | 'dangerous' | 'very dangerous';
export type MagicalAuraStrength = 'none' | 'weak' | 'moderate' | 'strong' | 'overwhelming';

export type ObjectType = 
  | 'weapon' | 'armor' | 'tool' | 'jewelry' | 'clothing' | 'document'
  | 'book' | 'vehicle' | 'container' | 'magical' | 'technology'
  | 'art' | 'currency' | 'food' | 'medicine' | 'key' | 'other';

export type RarityLevel = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact' | 'unique';
export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'colossal';
export type ConditionLevel = 'pristine' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | 'broken' | 'ruined';
export type DurabilityLevel = 'fragile' | 'delicate' | 'normal' | 'sturdy' | 'very durable' | 'indestructible';
export type ValueLevel = 'worthless' | 'low' | 'moderate' | 'high' | 'invaluable';
export type MagicalStrength = 'weak' | 'moderate' | 'strong' | 'very strong' | 'overwhelming';
export type OwnershipType = 'owned' | 'borrowed' | 'stolen' | 'found' | 'inherited' | 'temporary' | 'lost';
export type AccessibilityLevel = 'public' | 'private' | 'restricted' | 'hidden' | 'lost' | 'destroyed';
export type ObjectRole = 'prop' | 'tool' | 'weapon' | 'key_item' | 'macguffin' | 'symbol' | 'inheritance' | 'reward' | 'curse';

export type LoreType = 
  | 'magic_system' | 'religion' | 'mythology' | 'philosophy' | 'science'
  | 'history' | 'culture' | 'language' | 'species' | 'technology' | 'other';

export type LoreScope = 'universal' | 'global' | 'regional' | 'local' | 'personal' | 'secret';
export type PrevalenceLevel = 'ubiquitous' | 'widespread' | 'common' | 'uncommon' | 'rare' | 'extinct';

export type SubplotType = 
  | 'romance' | 'mystery' | 'character_development' | 'political'
  | 'personal_growth' | 'revenge' | 'redemption' | 'discovery' | 'other';

export type SubplotStatus = 'planned' | 'active' | 'paused' | 'resolved' | 'abandoned';

export type OrganizationType = 
  | 'government' | 'military' | 'religious' | 'academic' | 'commercial'
  | 'criminal' | 'secret' | 'social' | 'political' | 'magical' | 'other';

export type OrganizationScope = 'international' | 'national' | 'regional' | 'local' | 'specialized';
export type LoyaltyLevel = 'fanatical' | 'devoted' | 'loyal' | 'moderate' | 'questionable' | 'disloyal';
export type ReputationLevel = 'revered' | 'respected' | 'neutral' | 'disliked' | 'despised' | 'unknown';
export type LegalStatus = 'legal' | 'regulated' | 'restricted' | 'illegal' | 'secret' | 'unknown';
export type UniversalityLevel = 'universal' | 'widespread' | 'cultural' | 'niche' | 'unique';

// Additional complex interfaces

export interface EntityMention {
  sourceType: 'scene' | 'note' | 'character' | 'location' | 'object';
  sourceId: string;
  text: string;
  context: string;
  confidence: number;
  verified: boolean;
}

export interface EntityLink {
  targetEntityId: string;
  linkType: EntityLinkType;
  strength: number;
  description?: string;
  isDirectional: boolean;
}

export type EntityLinkType = 
  | 'related' | 'contains' | 'part_of' | 'creates' | 'destroys'
  | 'loves' | 'hates' | 'fears' | 'respects' | 'opposes'
  | 'member_of' | 'leads' | 'follows' | 'teaches' | 'learns_from';

export interface AISuggestion {
  id: string;
  type: 'relationship' | 'attribute' | 'conflict' | 'development' | 'consistency';
  suggestion: string;
  confidence: number;
  reasoning: string;
  accepted: boolean;
  dismissed: boolean;
  createdAt: string;
}

export interface ConsistencyFlag {
  id: string;
  type: 'contradiction' | 'missing_info' | 'timeline_issue' | 'relationship_conflict';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedEntities: string[];
  suggestions: string[];
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
}

export interface CollaborativeNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'comment' | 'suggestion' | 'question' | 'approval';
  resolved: boolean;
  replies: CollaborativeNote[];
  createdAt: string;
}

// Universe and series management
export interface Universe {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  
  // Series and books
  series: Series[];
  standaloneBooks: string[]; // Project IDs
  
  // Shared entities
  sharedEntities: string[]; // Entity IDs that are shared across the universe
  
  // Timeline
  universalTimeline?: Timeline;
  
  // Collaboration
  collaborators: UniverseCollaborator[];
  isPublic: boolean;
  
  // Settings
  consistencyRules: ConsistencyRule[];
  
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  id: string;
  universeId: string;
  name: string;
  description: string;
  books: string[]; // Project IDs in order
  status: 'planning' | 'writing' | 'complete' | 'hiatus';
  
  // Series-specific entities
  seriesEntities: string[]; // Entity IDs specific to this series
  
  createdAt: string;
  updatedAt: string;
}

export interface UniverseCollaborator {
  userId: string;
  name: string;
  role: 'creator' | 'co-author' | 'editor' | 'contributor' | 'viewer';
  permissions: UniversePermission[];
  joinedAt: string;
}

export type UniversePermission = 
  | 'create_entities' | 'edit_entities' | 'delete_entities'
  | 'create_series' | 'edit_series' | 'manage_collaborators'
  | 'export_data' | 'manage_timeline';

export interface ConsistencyRule {
  id: string;
  name: string;
  description: string;
  entityTypes: AdvancedEntityType[];
  rule: string; // JSON schema or rule definition
  severity: 'warning' | 'error';
  active: boolean;
}

// Search and filtering interfaces
export interface AdvancedSearchFilters {
  types?: AdvancedEntityType[];
  importance?: number[];
  tags?: string[];
  universeId?: string;
  seriesId?: string;
  projectId?: string;
  hasRelationships?: boolean;
  hasAIFlags?: boolean;
  lastModified?: { start?: string; end?: string };
  createdBy?: string;
  mentionedIn?: string[];
  linkedTo?: string[];
  customFilters?: Record<string, any>;
}

export interface SearchResult {
  entity: AdvancedCodexEntity;
  relevance: number;
  matchedFields: string[];
  snippet: string;
  highlightedText?: string;
}

// Real-time collaboration interfaces
export interface CodexCollaborationEvent {
  type: 'entity_created' | 'entity_updated' | 'entity_deleted' | 'relationship_created' | 'relationship_deleted';
  entityId: string;
  userId: string;
  userName: string;
  timestamp: string;
  changes?: any;
}

export interface CodexPresence {
  userId: string;
  userName: string;
  currentEntity?: string;
  lastActivity: string;
  cursor?: { x: number; y: number };
}

// Timeline integration
export interface Timeline {
  id: string;
  name: string;
  type: 'story' | 'character' | 'world' | 'series' | 'universe';
  events: TimelineEvent[];
  scale: 'years' | 'months' | 'days' | 'hours' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface TimelineEvent {
  id: string;
  timelineId: string;
  title: string;
  description: string;
  date?: string;
  duration?: number;
  entityIds: string[]; // Entities involved in this event
  importance: 1 | 2 | 3 | 4 | 5;
  type: 'birth' | 'death' | 'battle' | 'founding' | 'discovery' | 'political' | 'personal' | 'other';
  consequences?: string[];
}

// Export and sharing interfaces
export interface CodexExportOptions {
  format: 'json' | 'markdown' | 'pdf' | 'csv';
  scope: 'all' | 'universe' | 'series' | 'project';
  entityTypes?: AdvancedEntityType[];
  includeRelationships: boolean;
  includeImages: boolean;
  includeTimeline: boolean;
  includeNotes: boolean;
}

export interface CodexShareSettings {
  isPublic: boolean;
  shareUrl?: string;
  permissions: {
    view: boolean;
    comment: boolean;
    suggest: boolean;
    edit: boolean;
  };
  expiresAt?: string;
  password?: string;
}

// Analytics and insights
export interface CodexAnalytics {
  entityCounts: Record<AdvancedEntityType, number>;
  relationshipCounts: Record<EntityLinkType, number>;
  mostConnectedEntities: AdvancedCodexEntity[];
  recentActivity: CodexActivity[];
  consistencyScore: number;
  completenessScore: number;
  collaborationMetrics: CollaborationMetrics;
}

export interface CodexActivity {
  type: 'create' | 'update' | 'delete' | 'link';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface CollaborationMetrics {
  totalCollaborators: number;
  activeCollaborators: number;
  contributionsByUser: Record<string, number>;
  averageResponseTime: number;
  conflictResolutionTime: number;
}

// Basic supporting interfaces that would be defined elsewhere but are referenced

export interface CharacterGoal {
  id: string;
  description: string;
  type: 'primary' | 'secondary' | 'hidden';
  status: 'active' | 'achieved' | 'failed' | 'abandoned';
  priority: 'high' | 'medium' | 'low';
}

export interface CharacterSkill {
  name: string;
  level: 'novice' | 'apprentice' | 'competent' | 'expert' | 'master';
  category: 'combat' | 'social' | 'intellectual' | 'artistic' | 'technical' | 'magical';
}

export interface MagicalAbility {
  name: string;
  type: string;
  description: string;
  power: 1 | 2 | 3 | 4 | 5;
  limitations: string[];
}

export interface CharacterArc {
  startingPoint: string;
  endingPoint: string;
  transformation: string;
  keyMoments: string[];
  type: 'growth' | 'decline' | 'change' | 'realization';
}

export interface CharacterConflict {
  id: string;
  type: 'internal' | 'external';
  description: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  status: 'brewing' | 'active' | 'escalating' | 'resolving' | 'resolved';
}

export interface CharacterRelationship {
  characterId: string;
  type: 'family' | 'romantic' | 'friendship' | 'professional' | 'antagonistic';
  strength: number;
  description: string;
  status: 'current' | 'past' | 'complicated';
}

export interface CharacterTimelineEvent {
  id: string;
  date?: string;
  age?: number;
  event: string;
  type: 'birth' | 'childhood' | 'education' | 'career' | 'relationship' | 'trauma' | 'achievement';
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface FamilyMember {
  characterId?: string;
  name: string;
  relationship: 'parent' | 'sibling' | 'child' | 'spouse' | 'grandparent' | 'uncle' | 'aunt' | 'cousin' | 'other';
  status: 'alive' | 'dead' | 'unknown' | 'missing';
  description?: string;
}

// Additional interfaces for other entity types would be defined similarly...
// This represents a comprehensive foundation for the Phase 1C Advanced Codex System