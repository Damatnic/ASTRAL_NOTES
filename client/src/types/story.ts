/**
 * Comprehensive Story Management Type Definitions
 * Supporting hierarchical structure: Projects -> Stories -> Scenes
 * With comprehensive note types, linking, and metadata
 */

// Enhanced Note Types with Templates
export type NoteType = 
  | 'note'           // General notes
  | 'character'      // Character profiles
  | 'location'       // Setting/location details
  | 'item'           // Items/artifacts/objects
  | 'plotthread'     // Plot threads and storylines
  | 'theme'          // Themes and motifs
  | 'research'       // Research notes
  | 'dialogue'       // Dialogue snippets
  | 'worldrule'      // World-building rules
  | 'chapter'        // Chapter outlines
  | 'scene'          // Scene content
  | 'outline'        // Story outlines
  | 'timeline'       // Timeline events
  | 'relationship'   // Character relationships
  | 'conflict'       // Conflicts and tensions
  | 'arc'            // Character/plot arcs
  | 'setting'        // General setting notes
  | 'backstory'      // Background information
  | 'reference';     // Reference materials

// Wiki-style linking support
export interface WikiLink {
  id: string;
  sourceId: string;
  sourceType: 'note' | 'scene' | 'character' | 'location' | 'item' | 'plotthread';
  targetId: string;
  targetType: 'note' | 'scene' | 'character' | 'location' | 'item' | 'plotthread';
  linkText: string;
  context?: string; // Surrounding text for context
  createdAt: string;
}

export interface Backlink {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: NoteType;
  linkText: string;
  context?: string;
}

// Enhanced Project with hierarchical support
export interface Project {
  id: string;
  title: string;
  description?: string;
  userId: string;
  status: 'planning' | 'writing' | 'editing' | 'complete' | 'archived' | 'deleted';
  isPublic: boolean;
  tags: string[];
  genre?: string;
  
  // Story management
  stories: Story[];
  
  // Project-level notes and content
  projectNotes: Note[];
  plotboard: Plotboard;
  
  // Metadata
  wordCount: number;
  targetWordCount?: number;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Settings
  settings: ProjectSettings;
  
  // Collaboration
  collaborators: Collaborator[];
  isCollaborative: boolean;
}

export interface ProjectSettings {
  defaultPOV?: string;
  defaultLocation?: string;
  timeFormat: '12h' | '24h' | 'relative';
  dateFormat: 'MDY' | 'DMY' | 'YMD';
  autoSave: boolean;
  versionHistory: boolean;
  linkPreview: boolean;
  wordCountTarget?: number;
  dailyGoal?: number;
  theme?: 'light' | 'dark' | 'sepia' | 'custom';
  distractionFree: boolean;
}

export interface Collaborator {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  permissions: string[];
  joinedAt: string;
  lastActiveAt: string;
}

// Story within a project
export interface Story {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'planning' | 'writing' | 'editing' | 'complete' | 'archived';
  order: number; // Order within the project
  
  // Story content
  scenes: Scene[];
  storyNotes: Note[];
  timeline: Timeline;
  
  // Metadata
  wordCount: number;
  targetWordCount?: number;
  estimatedReadTime: number; // in minutes
  
  // Story structure
  acts: Act[];
  chapters: Chapter[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Act structure for story organization
export interface Act {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  order: number;
  chapters: string[]; // Chapter IDs
  scenes: string[]; // Scene IDs
  targetWordCount?: number;
  purpose?: string; // Act's narrative purpose
}

// Chapter structure
export interface Chapter {
  id: string;
  storyId: string;
  actId?: string;
  title: string;
  description?: string;
  order: number;
  scenes: string[]; // Scene IDs in order
  wordCount: number;
  targetWordCount?: number;
  status: 'planned' | 'writing' | 'draft' | 'revised' | 'complete';
  createdAt: string;
  updatedAt: string;
}

// Scene - atomic narrative unit
export interface Scene {
  id: string;
  storyId: string;
  chapterId?: string;
  actId?: string;
  
  // Content
  title: string;
  content: string; // Rich text content
  summary?: string;
  
  // Metadata
  povCharacter?: string; // Character ID
  location?: string; // Location ID
  timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'late night';
  duration?: number; // Scene duration in minutes
  
  // Characters and elements
  characters: string[]; // Character IDs present in scene
  locations: string[]; // Location IDs used in scene
  items: string[]; // Item IDs mentioned/used
  plotThreads: string[]; // Plot thread IDs advanced
  
  // Scene structure
  order: number;
  dependencies: string[]; // Scene IDs this scene depends on
  conflicts: SceneConflict[];
  
  // Status and notes
  status: 'planned' | 'outline' | 'draft' | 'revised' | 'complete';
  notes?: string;
  tags: string[];
  
  // Analytics
  wordCount: number;
  estimatedReadTime: number;
  
  // Visual representation
  color?: string; // For plotboard visualization
  position?: { x: number; y: number }; // Plotboard position
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface SceneConflict {
  type: 'internal' | 'interpersonal' | 'societal' | 'natural' | 'supernatural';
  description: string;
  characters: string[]; // Character IDs involved
  resolution?: 'resolved' | 'escalated' | 'ongoing';
}

// Enhanced Character with comprehensive details
export interface Character {
  id: string;
  projectId: string;
  
  // Basic info
  name: string;
  fullName?: string;
  nicknames: string[];
  age?: number;
  birthday?: string;
  
  // Physical description
  appearance: {
    height?: string;
    weight?: string;
    eyeColor?: string;
    hairColor?: string;
    physicalTraits: string[];
    distinguishingMarks?: string[];
  };
  
  // Personality and psychology
  personality: {
    traits: string[];
    strengths: string[];
    weaknesses: string[];
    fears: string[];
    desires: string[];
    motivations: string[];
    flaws: string[];
  };
  
  // Background
  backstory?: string;
  occupation?: string;
  education?: string;
  family: Relationship[];
  
  // Story role
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'background';
  importance: 1 | 2 | 3 | 4 | 5; // 5 being most important
  
  // Character arc
  arc: CharacterArc;
  
  // Relationships with other characters
  relationships: Relationship[];
  
  // Voice and dialogue
  speechPatterns: string[];
  vocabulary?: 'formal' | 'casual' | 'vernacular' | 'professional' | 'technical';
  accent?: string;
  catchphrases: string[];
  
  // Visual references
  images: string[]; // Image URLs
  
  // Notes and development
  notes?: string;
  tags: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  characterId: string;
  relationshipType: 'family' | 'romantic' | 'friend' | 'enemy' | 'colleague' | 'acquaintance' | 'mentor' | 'other';
  description: string;
  intensity: 1 | 2 | 3 | 4 | 5; // Relationship strength
  status: 'current' | 'past' | 'complicated';
  notes?: string;
}

export interface CharacterArc {
  startingPoint: string;
  endingPoint: string;
  transformation: string;
  keyMoments: string[]; // Scene IDs where character develops
  internalConflict?: string;
  externalConflict?: string;
  growth?: string;
  decline?: string;
}

// Location/Setting management
export interface Location {
  id: string;
  projectId: string;
  
  // Basic info
  name: string;
  type: 'city' | 'building' | 'room' | 'natural' | 'fictional' | 'other';
  description: string;
  
  // Geographic info
  geography?: {
    climate?: string;
    terrain?: string;
    size?: string;
    population?: number;
    coordinates?: { lat: number; lng: number };
  };
  
  // Atmosphere and mood
  atmosphere: string[];
  mood?: 'mysterious' | 'welcoming' | 'hostile' | 'neutral' | 'foreboding' | 'cheerful';
  
  // Connected locations
  connections: LocationConnection[];
  
  // Story usage
  scenes: string[]; // Scene IDs that use this location
  importance: 1 | 2 | 3 | 4 | 5;
  
  // Visual references
  images: string[];
  maps: string[];
  
  // Notes
  notes?: string;
  tags: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface LocationConnection {
  locationId: string;
  connectionType: 'adjacent' | 'contains' | 'part_of' | 'visible_from' | 'route_to';
  description?: string;
  travelTime?: number; // in minutes
  travelMethod?: string;
}

// Item/Artifact management
export interface Item {
  id: string;
  projectId: string;
  
  // Basic info
  name: string;
  type: 'weapon' | 'tool' | 'jewelry' | 'document' | 'vehicle' | 'magical' | 'technology' | 'other';
  description: string;
  
  // Properties
  properties: {
    physical: {
      size?: string;
      weight?: string;
      material?: string;
      color?: string;
      condition?: 'new' | 'good' | 'worn' | 'damaged' | 'broken';
    };
    functional: {
      purpose?: string;
      abilities?: string[];
      limitations?: string[];
      power?: string;
    };
  };
  
  // Story significance
  significance: 'minor' | 'important' | 'crucial' | 'legendary';
  symbolism?: string;
  
  // Ownership and location
  currentOwner?: string; // Character ID
  currentLocation?: string; // Location ID
  ownershipHistory: OwnershipRecord[];
  
  // Story usage
  scenes: string[]; // Scene IDs where item appears
  plotThreads: string[]; // Plot threads involving this item
  
  // Visual references
  images: string[];
  
  // Notes
  notes?: string;
  tags: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface OwnershipRecord {
  characterId?: string;
  characterName: string;
  startDate?: string;
  endDate?: string;
  howAcquired?: string;
  howLost?: string;
}

// Plot Thread management
export interface PlotThread {
  id: string;
  projectId: string;
  storyId?: string; // If specific to one story
  
  // Basic info
  name: string;
  type: 'main' | 'subplot' | 'character_arc' | 'mystery' | 'romance' | 'theme' | 'other';
  description: string;
  
  // Structure
  introduction?: string; // Scene ID where introduced
  development: PlotPoint[];
  climax?: string; // Scene ID of climax
  resolution?: string; // Scene ID of resolution
  
  // Status
  status: 'planned' | 'active' | 'resolved' | 'abandoned';
  priority: 'high' | 'medium' | 'low';
  
  // Connected elements
  characters: string[]; // Character IDs involved
  locations: string[]; // Location IDs involved
  items: string[]; // Item IDs involved
  scenes: string[]; // Scene IDs that advance this thread
  
  // Dependencies
  dependsOn: string[]; // Other plot thread IDs
  blocks: string[]; // Plot thread IDs this blocks
  
  // Visual representation
  color?: string; // For plotboard visualization
  
  // Notes
  notes?: string;
  tags: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface PlotPoint {
  id: string;
  sceneId?: string;
  description: string;
  type: 'setup' | 'conflict' | 'development' | 'revelation' | 'climax' | 'resolution';
  order: number;
  completed: boolean;
}

// Timeline system
export interface Timeline {
  id: string;
  storyId: string;
  name: string;
  type: 'story' | 'narrative' | 'character' | 'world';
  
  events: TimelineEvent[];
  
  // Timeline settings
  scale: 'years' | 'months' | 'days' | 'hours' | 'scenes';
  startDate?: string;
  endDate?: string;
  
  // Visual settings
  color?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  timelineId: string;
  
  // Event info
  title: string;
  description?: string;
  type: 'scene' | 'background' | 'character' | 'world' | 'plot';
  
  // Timing
  date?: string;
  time?: string;
  duration?: number; // in minutes
  order: number;
  
  // Connected elements
  sceneId?: string;
  characterIds: string[];
  locationId?: string;
  plotThreadIds: string[];
  
  // Importance and status
  importance: 'low' | 'medium' | 'high' | 'crucial';
  status: 'planned' | 'draft' | 'complete';
  
  // Dependencies
  dependsOn: string[]; // Other event IDs
  conflicts: string[]; // Conflicting event IDs
  
  // Visual
  color?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Plotboard for visual story organization
export interface Plotboard {
  id: string;
  projectId: string;
  
  // Layout settings
  layout: 'timeline' | 'grid' | 'freeform';
  zoom: number;
  viewportX: number;
  viewportY: number;
  
  // Swim lanes for subplots
  swimLanes: SwimLane[];
  
  // Visual elements
  connections: PlotConnection[];
  groups: SceneGroup[];
  
  // Filters
  filters: PlotboardFilter[];
  
  // Settings
  settings: PlotboardSettings;
  
  createdAt: string;
  updatedAt: string;
}

export interface SwimLane {
  id: string;
  name: string;
  type: 'character' | 'plotthread' | 'location' | 'act' | 'custom';
  color: string;
  order: number;
  visible: boolean;
  collapsed: boolean;
  relatedId?: string; // Character ID, Plot Thread ID, etc.
}

export interface PlotConnection {
  id: string;
  sourceSceneId: string;
  targetSceneId: string;
  type: 'dependency' | 'causality' | 'parallel' | 'reference';
  description?: string;
  color?: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface SceneGroup {
  id: string;
  name: string;
  sceneIds: string[];
  type: 'chapter' | 'act' | 'timeline' | 'custom';
  color?: string;
  collapsed: boolean;
}

export interface PlotboardFilter {
  id: string;
  name: string;
  type: 'character' | 'location' | 'plotthread' | 'tag' | 'status' | 'custom';
  criteria: Record<string, unknown>;
  active: boolean;
}

export interface PlotboardSettings {
  showConnections: boolean;
  showWordCounts: boolean;
  showTimestamps: boolean;
  cardSize: 'small' | 'medium' | 'large';
  colorScheme: 'status' | 'character' | 'plotthread' | 'custom';
  autoLayout: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// Enhanced Note with comprehensive linking
export interface Note {
  id: string;
  projectId: string;
  storyId?: string; // If specific to one story
  
  // Basic info
  title: string;
  content: string; // Rich text with wiki links
  type: NoteType;
  
  // Organization
  tags: string[];
  folder?: string;
  position: number;
  
  // Linking
  wikiLinks: WikiLink[];
  backlinks: Backlink[];
  linkedElements: LinkedElement[];
  
  // Template data based on type
  templateData?: Record<string, unknown>;
  
  // Metadata
  wordCount: number;
  readTime: number; // estimated read time in minutes
  
  // Status and workflow
  status: 'draft' | 'review' | 'complete' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Collaboration
  comments: Comment[];
  lastEditedBy?: string;
  
  // Version control
  version: number;
  versionHistory: NoteVersion[];
  
  // AI assistance
  aiSuggestions: AISuggestion[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface LinkedElement {
  id: string;
  type: 'character' | 'location' | 'item' | 'plotthread' | 'scene' | 'timeline';
  name: string;
  context?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  resolved: boolean;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteVersion {
  id: string;
  version: number;
  content: string;
  title: string;
  changes: string; // Description of changes
  userId: string;
  userName: string;
  createdAt: string;
}

export interface AISuggestion {
  id: string;
  type: 'consistency' | 'character' | 'plot' | 'dialogue' | 'pacing' | 'style';
  suggestion: string;
  context: string;
  confidence: number; // 0-1
  applied: boolean;
  dismissed: boolean;
  createdAt: string;
}

// Search and discovery
export interface SearchResult {
  id: string;
  type: 'note' | 'scene' | 'character' | 'location' | 'item' | 'plotthread';
  title: string;
  content?: string;
  matches: SearchMatch[];
  relevance: number; // 0-1
  projectId: string;
  projectTitle: string;
  storyId?: string;
  storyTitle?: string;
}

export interface SearchMatch {
  field: string;
  snippet: string;
  highlightStart: number;
  highlightEnd: number;
}

// Writing analytics and insights
export interface WritingSession {
  id: string;
  userId: string;
  projectId: string;
  storyId?: string;
  
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  
  wordsWritten: number;
  wordsDeleted: number;
  netWords: number;
  
  elementsModified: {
    scenes: string[];
    notes: string[];
    characters: string[];
    locations: string[];
    items: string[];
    plotThreads: string[];
  };
  
  mood?: 'productive' | 'struggling' | 'inspired' | 'blocked';
  notes?: string;
  
  createdAt: string;
}

export interface WritingAnalytics {
  projectId: string;
  timeframe: 'day' | 'week' | 'month' | 'year' | 'all';
  
  wordCount: {
    total: number;
    target?: number;
    daily: { date: string; words: number }[];
    byStory: { storyId: string; words: number }[];
  };
  
  sessions: {
    count: number;
    totalTime: number;
    averageTime: number;
    productivity: number; // words per hour
  };
  
  pacing: {
    wordsPerChapter: number[];
    wordsPerScene: number[];
    readabilityScore?: number;
  };
  
  consistency: {
    characterMentions: { characterId: string; count: number }[];
    locationUsage: { locationId: string; count: number }[];
    plotThreadProgress: { threadId: string; completion: number }[];
  };
  
  insights: WritingInsight[];
}

export interface WritingInsight {
  type: 'achievement' | 'suggestion' | 'warning' | 'milestone';
  title: string;
  description: string;
  actionable?: string;
  relatedElements: string[];
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

// Export and sharing
export interface ExportOptions {
  format: 'pdf' | 'epub' | 'docx' | 'markdown' | 'html' | 'txt' | 'json';
  scope: 'project' | 'story' | 'selection';
  includeNotes: boolean;
  includeComments: boolean;
  includePlotboard: boolean;
  includeTimeline: boolean;
  includeCharacters: boolean;
  includeLocations: boolean;
  includeItems: boolean;
  
  // Formatting options
  formatting: {
    fontSize?: number;
    fontFamily?: string;
    lineSpacing?: number;
    pageSize?: 'A4' | 'Letter' | 'Legal';
    margins?: { top: number; right: number; bottom: number; left: number };
    includeTitle: boolean;
    includeTOC: boolean;
    includePageNumbers: boolean;
  };
  
  // Content options
  contentOptions: {
    sceneBreaks: string;
    chapterBreaks: string;
    includeSceneTitles: boolean;
    includeWordCounts: boolean;
    includeMetadata: boolean;
  };
}

export interface ShareSettings {
  isPublic: boolean;
  shareUrl?: string;
  permissions: {
    allowComments: boolean;
    allowDownload: boolean;
    passwordProtected: boolean;
    password?: string;
    expiresAt?: string;
  };
  analytics: {
    views: number;
    downloads: number;
    comments: number;
    lastViewed?: string;
  };
}