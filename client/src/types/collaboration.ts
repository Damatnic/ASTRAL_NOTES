/**
 * Advanced Collaboration Types for Phase 2C
 * Supporting Writing Groups, Beta Reading, Editorial Workflows, Communication, and more
 */

export interface WritingGroup {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'invite-only';
  category: 'fiction' | 'non-fiction' | 'poetry' | 'screenwriting' | 'academic' | 'mixed';
  tags: string[];
  coverImage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  projectCount: number;
  isVerified: boolean;
  settings: GroupSettings;
  statistics: GroupStatistics;
}

export interface GroupSettings {
  // Permissions
  canMembersInvite: boolean;
  canMembersCreateProjects: boolean;
  canMembersStartSessions: boolean;
  requireApprovalForPosts: boolean;
  allowGuestReaders: boolean;
  
  // Moderation
  autoModeration: boolean;
  wordFilter: string[];
  maxProjectsPerMember: number;
  maxMembersCount: number;
  
  // Communication
  allowVideoChat: boolean;
  allowVoiceNotes: boolean;
  enableNotifications: boolean;
  quietHours: { start: string; end: string };
  
  // Content
  allowedFileTypes: string[];
  maxFileSize: number;
  requireContentWarnings: boolean;
  ageRestriction?: number;
}

export interface GroupStatistics {
  totalWords: number;
  totalProjects: number;
  totalSessions: number;
  averageSessionLength: number;
  mostActiveHour: number;
  weeklyActivity: number[];
  topGenres: string[];
  collaborationScore: number;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  username: string;
  displayName: string;
  avatar?: string;
  email?: string;
  role: GroupRole;
  permissions: GroupPermissions;
  joinedAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  contributions: MemberContributions;
  badges: GroupBadge[];
  specialties: string[];
  bio?: string;
  timezone: string;
  preferences: MemberPreferences;
}

export type GroupRole = 
  | 'admin' 
  | 'moderator' 
  | 'member' 
  | 'beta-reader' 
  | 'editor' 
  | 'guest';

export interface GroupPermissions {
  canEditGroup: boolean;
  canManageMembers: boolean;
  canModerateContent: boolean;
  canCreateProjects: boolean;
  canInviteMembers: boolean;
  canStartSessions: boolean;
  canAccessAnalytics: boolean;
  canManageEvents: boolean;
  canUseAdvancedFeatures: boolean;
}

export interface MemberContributions {
  wordsContributed: number;
  projectsCreated: number;
  projectsContributed: number;
  feedbackGiven: number;
  feedbackReceived: number;
  sessionsHosted: number;
  sessionsAttended: number;
  helpfulVotes: number;
  mentorshipHours: number;
}

export interface GroupBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  level?: number;
}

export interface MemberPreferences {
  notificationTypes: NotificationType[];
  availableHours: TimeSlot[];
  preferredGenres: string[];
  readingSpeed: 'slow' | 'normal' | 'fast';
  feedbackStyle: 'gentle' | 'balanced' | 'direct';
  expertiseAreas: string[];
  mentorshipOffered: boolean;
  mentorshipSought: boolean;
}

export type NotificationType = 
  | 'new-projects'
  | 'project-updates'
  | 'feedback-requests'
  | 'session-invites'
  | 'direct-messages'
  | 'group-announcements'
  | 'deadlines'
  | 'milestones';

export interface TimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  timezone: string;
}

// Group Projects
export interface GroupProject {
  id: string;
  groupId: string;
  title: string;
  description: string;
  type: 'anthology' | 'collaborative-novel' | 'critique-circle' | 'writing-challenge' | 'workshop';
  genre: string[];
  tags: string[];
  status: 'planning' | 'active' | 'review' | 'completed' | 'archived';
  visibility: 'group-only' | 'members-only' | 'public';
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  targetWordCount?: number;
  currentWordCount: number;
  
  contributors: ProjectContributor[];
  betaReaders: string[];
  editors: string[];
  
  settings: ProjectSettings;
  workflow: EditorialWorkflow;
  analytics: ProjectAnalytics;
  
  // Content organization
  chapters: GroupChapter[];
  resources: ProjectResource[];
  discussions: ProjectDiscussion[];
  milestones: ProjectMilestone[];
}

export interface ProjectContributor {
  userId: string;
  username: string;
  role: 'lead-author' | 'co-author' | 'contributor' | 'beta-reader' | 'editor';
  permissions: ContributorPermissions;
  assignedSections: string[];
  wordCount: number;
  lastContribution: Date;
  contributionHistory: ContributionEvent[];
}

export interface ContributorPermissions {
  canEdit: boolean;
  canComment: boolean;
  canSuggestChanges: boolean;
  canApproveChanges: boolean;
  canInviteReaders: boolean;
  canManageWorkflow: boolean;
  canViewAnalytics: boolean;
}

export interface ContributionEvent {
  id: string;
  type: 'text-added' | 'text-edited' | 'comment-added' | 'feedback-given' | 'milestone-reached';
  timestamp: Date;
  description: string;
  wordCount?: number;
  section?: string;
}

export interface ProjectSettings {
  allowPublicReading: boolean;
  requireBetaAgreement: boolean;
  trackVersions: boolean;
  enableComments: boolean;
  enableSuggestions: boolean;
  autoSave: boolean;
  conflictResolution: 'manual' | 'automatic' | 'vote';
  deadlineReminders: boolean;
  progressSharing: 'private' | 'group' | 'public';
}

// Beta Reader Management
export interface BetaReader {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  email: string;
  
  profile: BetaReaderProfile;
  statistics: BetaReaderStats;
  preferences: BetaReaderPreferences;
  availability: BetaReaderAvailability;
  agreements: BetaAgreement[];
  assignments: BetaAssignment[];
  ratings: BetaReaderRating[];
}

export interface BetaReaderProfile {
  bio: string;
  specialties: string[];
  genres: string[];
  experience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  readingSpeed: number; // words per hour
  feedbackStyle: 'developmental' | 'line-editing' | 'copy-editing' | 'proofreading' | 'general';
  languageSkills: LanguageSkill[];
  credentials: string[];
  portfolio: PortfolioItem[];
}

export interface LanguageSkill {
  language: string;
  proficiency: 'native' | 'fluent' | 'intermediate' | 'basic';
  isPreferred: boolean;
}

export interface PortfolioItem {
  title: string;
  description: string;
  type: 'sample-feedback' | 'testimonial' | 'published-work' | 'certification';
  url?: string;
  file?: string;
  addedAt: Date;
}

export interface BetaReaderStats {
  projectsCompleted: number;
  averageRating: number;
  averageTurnaroundDays: number;
  wordsRead: number;
  feedbackPoints: number;
  onTimeCompletions: number;
  authorSatisfactionScore: number;
  responseRate: number;
}

export interface BetaReaderPreferences {
  maxSimultaneousProjects: number;
  preferredProjectLength: 'short' | 'medium' | 'long' | 'any';
  preferredGenres: string[];
  contentRestrictions: string[];
  communicationStyle: 'minimal' | 'moderate' | 'detailed';
  feedbackFormat: 'comments' | 'document' | 'audio' | 'video' | 'mixed';
  availableHours: TimeSlot[];
  reminders: boolean;
}

export interface BetaReaderAvailability {
  isAvailable: boolean;
  currentLoad: number;
  maxLoad: number;
  timeSlots: TimeSlot[];
  blackoutDates: DateRange[];
  responseTime: number; // hours
  timezone: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  reason: string;
}

export interface BetaAgreement {
  id: string;
  projectId: string;
  betaReaderId: string;
  authorId: string;
  terms: AgreementTerms;
  signedAt: Date;
  status: 'pending' | 'signed' | 'completed' | 'cancelled';
  deliverables: Deliverable[];
  compensation?: CompensationTerms;
}

export interface AgreementTerms {
  scope: string;
  deadline: Date;
  feedbackType: string[];
  confidentialityRequired: boolean;
  attributionAllowed: boolean;
  revisionRights: boolean;
  cancellationTerms: string;
  qualityStandards: string;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  submittedAt?: Date;
  files: string[];
  notes?: string;
}

export interface CompensationTerms {
  type: 'free' | 'reciprocal' | 'paid' | 'credit';
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentSchedule?: string;
  reciprocalTerms?: string;
}

export interface BetaAssignment {
  id: string;
  projectId: string;
  betaReaderId: string;
  authorId: string;
  sections: AssignedSection[];
  status: 'assigned' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: AssignmentProgress;
  feedback: BetaFeedback[];
  ratings: AssignmentRating;
}

export interface AssignedSection {
  id: string;
  title: string;
  wordCount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  estimatedReadTime: number;
  specialInstructions?: string;
}

export interface AssignmentProgress {
  sectionsCompleted: number;
  totalSections: number;
  wordsRead: number;
  totalWords: number;
  timeSpent: number; // minutes
  lastActivity: Date;
  completionEstimate: Date;
}

export interface BetaFeedback {
  id: string;
  sectionId?: string;
  type: 'general' | 'chapter' | 'paragraph' | 'sentence' | 'word';
  category: 'plot' | 'character' | 'pacing' | 'dialogue' | 'style' | 'grammar' | 'structure';
  severity: 'suggestion' | 'minor' | 'major' | 'critical';
  position?: TextPosition;
  content: string;
  suggestions?: string[];
  isPublic: boolean;
  timestamp: Date;
  replies: FeedbackReply[];
  tags: string[];
  attachments: string[];
}

export interface TextPosition {
  chapter: number;
  paragraph: number;
  sentence?: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
}

export interface FeedbackReply {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
  type: 'clarification' | 'agreement' | 'disagreement' | 'implementation';
}

export interface AssignmentRating {
  qualityScore: number; // 1-5
  timelinessScore: number; // 1-5
  communicationScore: number; // 1-5
  helpfulnessScore: number; // 1-5
  overallScore: number; // 1-5
  authorFeedback?: string;
  betaReaderFeedback?: string;
  ratedAt?: Date;
}

export interface BetaReaderRating {
  projectId: string;
  authorId: string;
  rating: AssignmentRating;
  publicFeedback?: string;
  privateFeedback?: string;
  wouldRecommend: boolean;
  wouldWorkAgain: boolean;
  ratedAt: Date;
}

// Editorial Workflow System
export interface EditorialWorkflow {
  id: string;
  projectId: string;
  name: string;
  description: string;
  stages: EditorialStage[];
  currentStage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  settings: WorkflowSettings;
  analytics: WorkflowAnalytics;
}

export interface EditorialStage {
  id: string;
  name: string;
  description: string;
  type: 'draft' | 'review' | 'edit' | 'proofread' | 'approve' | 'publish';
  order: number;
  assignedTo: string[];
  requiredRoles: GroupRole[];
  deadline?: Date;
  estimatedDuration: number; // hours
  
  status: 'pending' | 'in-progress' | 'review' | 'approved' | 'rejected' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  
  requirements: StageRequirement[];
  deliverables: StageDeliverable[];
  approvals: StageApproval[];
  feedback: StageFeedback[];
  
  // Branching support
  parentStage?: string;
  childStages: string[];
  isParallel: boolean;
  
  settings: StageSettings;
}

export interface StageRequirement {
  id: string;
  description: string;
  type: 'checklist' | 'approval' | 'file' | 'wordcount' | 'quality';
  isRequired: boolean;
  status: 'pending' | 'met' | 'not-applicable';
  verifiedBy?: string;
  verifiedAt?: Date;
  evidence?: string[];
}

export interface StageDeliverable {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'feedback' | 'approval' | 'report';
  isRequired: boolean;
  submittedBy?: string;
  submittedAt?: Date;
  files: string[];
  notes?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
}

export interface StageApproval {
  id: string;
  requiredFrom: string;
  approverRole?: GroupRole;
  status: 'pending' | 'approved' | 'rejected' | 'not-required';
  approvedBy?: string;
  approvedAt?: Date;
  comments?: string;
  conditions?: string[];
}

export interface StageFeedback {
  id: string;
  providedBy: string;
  type: 'general' | 'specific' | 'blocking' | 'suggestion';
  content: string;
  attachments: string[];
  isPublic: boolean;
  timestamp: Date;
  addressed: boolean;
  response?: string;
}

export interface StageSettings {
  allowParallelEditing: boolean;
  autoAdvanceOnApproval: boolean;
  notifyOnStatusChange: boolean;
  requireAllApprovals: boolean;
  allowRollback: boolean;
  trackChanges: boolean;
  versionControl: boolean;
}

export interface WorkflowSettings {
  autoAssignment: boolean;
  deadlineReminders: boolean;
  escalationRules: EscalationRule[];
  qualityGates: QualityGate[];
  integrations: WorkflowIntegration[];
  notifications: WorkflowNotificationSettings;
}

export interface EscalationRule {
  id: string;
  trigger: 'overdue' | 'blocked' | 'quality-issue' | 'approval-pending';
  condition: string;
  action: 'notify' | 'reassign' | 'skip' | 'escalate';
  targetRole?: GroupRole;
  targetUser?: string;
  delayHours: number;
}

export interface QualityGate {
  id: string;
  stageName: string;
  criteria: QualityCriterion[];
  threshold: number;
  action: 'block' | 'warn' | 'approve';
}

export interface QualityCriterion {
  metric: 'word-count' | 'readability' | 'grammar-score' | 'completion' | 'feedback-rating';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  weight: number;
}

export interface WorkflowIntegration {
  id: string;
  type: 'grammar-check' | 'readability' | 'plagiarism' | 'ai-review' | 'style-guide';
  isEnabled: boolean;
  settings: Record<string, any>;
  apiKey?: string;
}

export interface WorkflowNotificationSettings {
  stageStart: boolean;
  stageComplete: boolean;
  approvalRequired: boolean;
  deadlineApproaching: boolean;
  workflowComplete: boolean;
  escalations: boolean;
  customRules: NotificationRule[];
}

export interface NotificationRule {
  id: string;
  trigger: string;
  condition: string;
  recipients: string[];
  template: string;
  isEnabled: boolean;
}

export interface WorkflowAnalytics {
  totalDuration: number;
  averageStageTime: number;
  bottleneckStages: string[];
  approvalTimes: Record<string, number>;
  reworkCycles: number;
  qualityScores: Record<string, number>;
  participantContributions: Record<string, number>;
  deadlineAdherence: number;
}

// Track Changes System
export interface ChangeTracking {
  id: string;
  documentId: string;
  documentType: string;
  isEnabled: boolean;
  changes: TrackedChange[];
  versions: DocumentVersion[];
  branches: DocumentBranch[];
  mergeHistory: MergeRecord[];
  settings: ChangeTrackingSettings;
}

export interface TrackedChange {
  id: string;
  type: 'insert' | 'delete' | 'format' | 'comment' | 'suggestion';
  authorId: string;
  authorName: string;
  timestamp: Date;
  position: TextPosition;
  originalText?: string;
  newText?: string;
  formatting?: FormatChange;
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
  reviewedBy?: string;
  reviewedAt?: Date;
  comments: ChangeComment[];
  tags: string[];
}

export interface FormatChange {
  property: string;
  oldValue: any;
  newValue: any;
}

export interface ChangeComment {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
  type: 'question' | 'suggestion' | 'approval' | 'rejection';
}

export interface DocumentVersion {
  id: string;
  versionNumber: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  isMajor: boolean;
  branchName?: string;
  parentVersion?: string;
  wordCount: number;
  changeCount: number;
  collaborators: string[];
  tags: string[];
  content: string;
  metadata: VersionMetadata;
}

export interface VersionMetadata {
  author: string;
  lastModified: Date;
  status: string;
  readabilityScore?: number;
  grammarScore?: number;
  styleScore?: number;
  comments: number;
  suggestions: number;
  approvals: number;
}

export interface DocumentBranch {
  id: string;
  name: string;
  description: string;
  parentBranch?: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  isMerged: boolean;
  mergedAt?: Date;
  versions: string[];
  collaborators: string[];
  purpose: 'feature' | 'experiment' | 'backup' | 'alternative';
}

export interface MergeRecord {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  mergedBy: string;
  mergedAt: Date;
  strategy: 'auto' | 'manual' | 'theirs' | 'ours';
  conflicts: MergeConflict[];
  resolution: string;
  success: boolean;
}

export interface MergeConflict {
  id: string;
  position: TextPosition;
  sourceText: string;
  targetText: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface ChangeTrackingSettings {
  autoAcceptFromOwners: boolean;
  requireApprovalForMajorChanges: boolean;
  maxChangesPerDocument: number;
  enableSuggestionMode: boolean;
  showChangeHistory: boolean;
  notifyOnChanges: boolean;
  retentionDays: number;
}

// Advanced Communication
export interface CommunicationChannel {
  id: string;
  groupId?: string;
  projectId?: string;
  name: string;
  description: string;
  type: 'text' | 'voice' | 'video' | 'mixed';
  participants: string[];
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  messages: ChannelMessage[];
  settings: ChannelSettings;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'text' | 'voice' | 'video' | 'file' | 'code' | 'quote';
  timestamp: Date;
  editedAt?: Date;
  parentMessageId?: string;
  mentions: string[];
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  isSystemMessage: boolean;
  metadata?: MessageMetadata;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video
  transcription?: string; // for audio messages
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  timestamp: Date;
}

export interface MessageMetadata {
  voiceNoteDuration?: number;
  videoCallDuration?: number;
  filePreview?: string;
  linkPreview?: LinkPreview;
  quotedText?: string;
  editHistory?: EditRecord[];
}

export interface LinkPreview {
  title: string;
  description: string;
  image?: string;
  url: string;
  domain: string;
}

export interface EditRecord {
  timestamp: Date;
  content: string;
  reason?: string;
}

export interface ChannelSettings {
  allowFileSharing: boolean;
  allowVoiceMessages: boolean;
  allowVideoMessages: boolean;
  maxFileSize: number;
  retentionDays: number;
  moderationEnabled: boolean;
  slowModeSeconds: number;
  pinnedMessages: string[];
  permissions: ChannelPermissions;
}

export interface ChannelPermissions {
  canWrite: GroupRole[];
  canRead: GroupRole[];
  canManageMessages: GroupRole[];
  canInviteUsers: GroupRole[];
  canStartVideoCall: GroupRole[];
  canShareFiles: GroupRole[];
}

// Video Conferencing
export interface VideoSession {
  id: string;
  channelId?: string;
  title: string;
  description?: string;
  hostId: string;
  participants: VideoParticipant[];
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  actualEndTime?: Date;
  settings: VideoSessionSettings;
  recording?: SessionRecording;
  features: SessionFeature[];
  analytics: SessionAnalytics;
}

export interface VideoParticipant {
  userId: string;
  username: string;
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHost: boolean;
  isModerator: boolean;
  role: 'presenter' | 'participant' | 'observer';
  status: 'connected' | 'disconnected' | 'reconnecting';
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface VideoSessionSettings {
  maxParticipants: number;
  requireApproval: boolean;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  enableBreakoutRooms: boolean;
  enableWhiteboard: boolean;
  enableFileSharing: boolean;
  muteParticipantsOnJoin: boolean;
  disableVideoOnJoin: boolean;
}

export interface SessionRecording {
  id: string;
  url: string;
  duration: number;
  size: number;
  quality: string;
  transcription?: string;
  chapters: RecordingChapter[];
  isPublic: boolean;
  downloadUrl?: string;
}

export interface RecordingChapter {
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  speaker?: string;
}

export interface SessionFeature {
  type: 'whiteboard' | 'screen-share' | 'breakout-room' | 'polling' | 'q-and-a';
  isEnabled: boolean;
  data?: any;
}

export interface SessionAnalytics {
  totalDuration: number;
  averageParticipants: number;
  peakParticipants: number;
  joinTimeDistribution: number[];
  participantEngagement: Record<string, number>;
  techIssues: TechIssue[];
  qualityMetrics: QualityMetrics;
}

export interface TechIssue {
  type: 'audio' | 'video' | 'connection' | 'other';
  userId: string;
  timestamp: Date;
  description: string;
  resolved: boolean;
}

export interface QualityMetrics {
  averageAudioQuality: number;
  averageVideoQuality: number;
  averageLatency: number;
  dropoutRate: number;
  reconnectionCount: number;
}

// Collaborative World-Building
export interface SharedUniverse {
  id: string;
  name: string;
  description: string;
  genre: string[];
  tags: string[];
  coverImage?: string;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  collaborators: UniverseCollaborator[];
  projects: string[]; // project IDs using this universe
  
  worldBible: WorldBible;
  timeline: UniverseTimeline;
  locations: WorldLocation[];
  characters: SharedCharacter[];
  cultures: Culture[];
  technologies: Technology[];
  magicSystems: MagicSystem[];
  
  canonManagement: CanonManagement;
  conflictResolution: UniverseConflictResolution;
  versionControl: UniverseVersionControl;
  
  settings: UniverseSettings;
  analytics: UniverseAnalytics;
}

export interface UniverseCollaborator {
  userId: string;
  username: string;
  role: 'creator' | 'co-creator' | 'contributor' | 'approved-user' | 'reader';
  permissions: UniversePermissions;
  specializations: string[];
  contributions: UniverseContribution[];
  joinedAt: Date;
  lastActive: Date;
}

export interface UniversePermissions {
  canEditCanon: boolean;
  canCreateLocations: boolean;
  canCreateCharacters: boolean;
  canEditTimeline: boolean;
  canApprovePending: boolean;
  canResolveConflicts: boolean;
  canInviteUsers: boolean;
  canManageSettings: boolean;
}

export interface UniverseContribution {
  type: 'location' | 'character' | 'event' | 'culture' | 'technology' | 'edit';
  itemId: string;
  description: string;
  timestamp: Date;
  wordCount?: number;
  rating?: number;
}

export interface WorldBible {
  id: string;
  sections: BibleSection[];
  lastUpdated: Date;
  version: string;
  contributors: string[];
  approvalStatus: 'draft' | 'review' | 'approved' | 'published';
}

export interface BibleSection {
  id: string;
  title: string;
  content: string;
  type: 'overview' | 'history' | 'geography' | 'culture' | 'technology' | 'magic' | 'other';
  order: number;
  lastEdited: Date;
  editedBy: string;
  isCanon: boolean;
  pendingChanges: PendingChange[];
  references: CrossReference[];
}

export interface PendingChange {
  id: string;
  type: 'addition' | 'modification' | 'deletion';
  proposedBy: string;
  proposedAt: Date;
  content: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  votes: ChangeVote[];
  discussion: ChangeDiscussion[];
}

export interface ChangeVote {
  userId: string;
  vote: 'approve' | 'reject' | 'neutral';
  timestamp: Date;
  reasoning?: string;
}

export interface ChangeDiscussion {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  parentId?: string;
  reactions: MessageReaction[];
}

export interface CrossReference {
  type: 'character' | 'location' | 'event' | 'culture' | 'technology';
  id: string;
  context: string;
  isVerified: boolean;
}

export interface UniverseTimeline {
  id: string;
  name: string;
  events: TimelineEvent[];
  periods: TimePeriod[];
  branches: TimelineBranch[];
  synchronization: TimelineSync[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: UniverseDate;
  duration?: number; // days
  type: 'political' | 'cultural' | 'technological' | 'magical' | 'natural' | 'personal';
  importance: 'minor' | 'major' | 'critical' | 'legendary';
  
  participants: string[]; // character IDs
  locations: string[]; // location IDs
  consequences: Consequence[];
  
  isCanon: boolean;
  projectSources: string[]; // which projects reference this
  createdBy: string;
  createdAt: Date;
  
  conflicts: EventConflict[];
  variations: EventVariation[];
}

export interface UniverseDate {
  era: string;
  year: number;
  month?: number;
  day?: number;
  precision: 'exact' | 'approximate' | 'unknown';
  displayFormat: string;
  realWorldEquivalent?: Date;
}

export interface Consequence {
  description: string;
  type: 'immediate' | 'short-term' | 'long-term' | 'permanent';
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  affectedElements: string[];
}

export interface TimePeriod {
  id: string;
  name: string;
  startDate: UniverseDate;
  endDate: UniverseDate;
  description: string;
  characteristics: string[];
  majorEvents: string[];
  culturalNotes: string;
}

export interface TimelineBranch {
  id: string;
  name: string;
  description: string;
  divergencePoint: string; // event ID where it diverges
  alternateEvents: string[];
  isActiveCanon: boolean;
  projectsUsing: string[];
}

export interface TimelineSync {
  projectId: string;
  lastSyncedAt: Date;
  syncedEvents: string[];
  conflicts: SyncConflict[];
  autoSyncEnabled: boolean;
}

export interface SyncConflict {
  eventId: string;
  type: 'date-mismatch' | 'content-conflict' | 'dependency-issue';
  description: string;
  resolution: 'manual' | 'auto-universe' | 'auto-project';
  resolvedAt?: Date;
}

export interface EventConflict {
  id: string;
  conflictingEventId: string;
  type: 'chronological' | 'logical' | 'canonical';
  description: string;
  severity: 'minor' | 'major' | 'critical';
  reportedBy: string;
  reportedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'deferred';
  resolution?: ConflictResolution;
}

export interface EventVariation {
  id: string;
  name: string;
  description: string;
  differences: string[];
  projectsUsing: string[];
  isAlternativeCanon: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

export interface WorldLocation {
  id: string;
  name: string;
  type: 'continent' | 'country' | 'city' | 'landmark' | 'building' | 'region' | 'other';
  description: string;
  coordinates?: WorldCoordinates;
  parentLocation?: string;
  childLocations: string[];
  
  geography: Geography;
  climate: Climate;
  population?: Population;
  culture?: string[]; // culture IDs
  history: LocationHistory[];
  
  images: string[];
  maps: LocationMap[];
  references: string[]; // project IDs that reference this
  
  isCanon: boolean;
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
  
  pendingChanges: PendingChange[];
  conflicts: LocationConflict[];
}

export interface WorldCoordinates {
  x: number;
  y: number;
  z?: number;
  coordinateSystem: string;
  precision: 'exact' | 'approximate' | 'relative';
}

export interface Geography {
  terrain: string[];
  elevation: number;
  area?: number;
  naturalResources: string[];
  waterBodies: string[];
  vegetation: string[];
  wildlife: string[];
}

export interface Climate {
  type: string;
  temperature: TemperatureRange;
  precipitation: string;
  seasons: Season[];
  weatherPatterns: string[];
  naturalDisasters: string[];
}

export interface TemperatureRange {
  min: number;
  max: number;
  average: number;
  unit: 'celsius' | 'fahrenheit' | 'custom';
}

export interface Season {
  name: string;
  duration: number; // days
  characteristics: string[];
  averageTemperature: number;
}

export interface Population {
  total: number;
  species: SpeciesPopulation[];
  demographics: Demographic[];
  socialStructure: string;
  language: string[];
  religion: string[];
}

export interface SpeciesPopulation {
  speciesName: string;
  count: number;
  percentage: number;
  status: 'native' | 'immigrant' | 'visitor' | 'refugee';
}

export interface Demographic {
  category: string;
  breakdown: Record<string, number>;
}

export interface LocationHistory {
  period: string;
  events: string[];
  rulers: string[];
  significantChanges: string[];
  description: string;
}

export interface LocationMap {
  id: string;
  name: string;
  type: 'political' | 'geographical' | 'cultural' | 'historical' | 'thematic';
  url: string;
  scale: string;
  createdBy: string;
  createdAt: Date;
  isCanonical: boolean;
}

export interface LocationConflict {
  id: string;
  type: 'geographical' | 'historical' | 'cultural' | 'reference';
  description: string;
  conflictingProjects: string[];
  severity: 'minor' | 'moderate' | 'major';
  reportedBy: string;
  reportedAt: Date;
  status: 'open' | 'resolving' | 'resolved';
}

export interface SharedCharacter {
  id: string;
  name: string;
  aliases: string[];
  species: string;
  gender: string;
  age?: CharacterAge;
  
  appearance: CharacterAppearance;
  personality: CharacterPersonality;
  background: CharacterBackground;
  relationships: CharacterRelationship[];
  abilities: CharacterAbility[];
  
  timeline: CharacterTimelineEntry[];
  locations: string[]; // location IDs where character has been
  
  canonStatus: 'canon' | 'semi-canon' | 'non-canon' | 'disputed';
  ownership: CharacterOwnership;
  usageRights: UsageRights;
  
  appearances: CharacterAppearanceInProject[];
  variations: CharacterVariation[];
  conflicts: CharacterConflict[];
  
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface CharacterAge {
  current: number;
  atDeath?: number;
  unit: 'years' | 'centuries' | 'millennia' | 'eons' | 'custom';
  lifespan?: number;
  agingRate?: number; // relative to humans
}

export interface CharacterAppearance {
  height: string;
  weight: string;
  eyeColor: string;
  hairColor: string;
  skinTone: string;
  distinctiveFeatures: string[];
  clothing: string;
  accessories: string[];
  images: string[];
}

export interface CharacterPersonality {
  traits: PersonalityTrait[];
  motivations: string[];
  fears: string[];
  beliefs: string[];
  habits: string[];
  speechPatterns: string[];
  morality: string;
  intelligence: string;
  emotionalState: string;
}

export interface PersonalityTrait {
  name: string;
  strength: 'weak' | 'moderate' | 'strong' | 'dominant';
  manifestation: string;
  context: string[];
}

export interface CharacterBackground {
  birthplace: string;
  family: FamilyMember[];
  education: string[];
  occupation: string[];
  socialStatus: string;
  wealth: string;
  significantEvents: string[];
  secrets: string[];
  goals: CharacterGoal[];
}

export interface FamilyMember {
  characterId?: string;
  name: string;
  relationship: string;
  status: 'alive' | 'dead' | 'missing' | 'unknown';
  description: string;
}

export interface CharacterGoal {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  deadline?: UniverseDate;
  obstacles: string[];
}

export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  relationship: string;
  status: 'current' | 'past' | 'complicated' | 'unknown';
  intimacy: 'stranger' | 'acquaintance' | 'friend' | 'close' | 'family' | 'romantic';
  description: string;
  history: string[];
  dynamicType: 'static' | 'evolving' | 'deteriorating' | 'improving';
}

export interface CharacterAbility {
  name: string;
  type: 'physical' | 'mental' | 'magical' | 'technological' | 'social' | 'supernatural';
  level: 'novice' | 'competent' | 'expert' | 'master' | 'legendary';
  description: string;
  limitations: string[];
  prerequisites: string[];
  learned: boolean;
  innate: boolean;
  manifestations: string[];
}

export interface CharacterTimelineEntry {
  eventId?: string;
  date: UniverseDate;
  description: string;
  type: 'birth' | 'education' | 'achievement' | 'tragedy' | 'relationship' | 'transformation' | 'death';
  significance: 'minor' | 'moderate' | 'major' | 'life-changing';
  witnesses: string[];
  consequences: string[];
}

export interface CharacterOwnership {
  originalCreator: string;
  contributors: string[];
  inheritanceRules: string;
  disputeResolution: string;
  collaborationTerms: string;
}

export interface UsageRights {
  canBeKilled: boolean;
  canBeDramaticallyChanged: boolean;
  canBeRomanticallyInvolved: boolean;
  canBeUsedInAdultContent: boolean;
  requiresPermissionFor: string[];
  restrictions: string[];
  attribution: string;
}

export interface CharacterAppearanceInProject {
  projectId: string;
  projectTitle: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'cameo';
  firstAppearance: UniverseDate;
  lastAppearance?: UniverseDate;
  characterDevelopment: string[];
  variations: string[];
}

export interface CharacterVariation {
  id: string;
  name: string;
  description: string;
  differences: string[];
  context: string;
  projectsUsing: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isAlternativeCanon: boolean;
}

export interface CharacterConflict {
  id: string;
  type: 'characterization' | 'timeline' | 'relationship' | 'abilities' | 'usage';
  description: string;
  conflictingElements: string[];
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedProjects: string[];
  reportedBy: string;
  reportedAt: Date;
  status: 'open' | 'investigating' | 'mediation' | 'resolved';
  resolution?: string;
}

export interface Culture {
  id: string;
  name: string;
  description: string;
  type: 'ethnic' | 'religious' | 'professional' | 'social' | 'regional' | 'temporal';
  
  values: CulturalValue[];
  traditions: CulturalTradition[];
  language: LanguageInfo;
  arts: ArtForm[];
  technology: string[];
  religion: ReligiousSystem[];
  
  socialStructure: SocialStructure;
  economy: EconomicSystem;
  politics: PoliticalSystem;
  education: EducationSystem;
  
  history: CulturalHistory[];
  influences: CulturalInfluence[];
  conflicts: CulturalConflict[];
  
  locations: string[];
  characters: string[];
  projects: string[];
  
  isCanon: boolean;
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface CulturalValue {
  name: string;
  description: string;
  importance: 'core' | 'important' | 'common' | 'emerging';
  manifestations: string[];
  conflicts: string[];
}

export interface CulturalTradition {
  name: string;
  type: 'ceremony' | 'festival' | 'ritual' | 'custom' | 'practice';
  description: string;
  frequency: string;
  participants: string[];
  significance: string;
  variations: string[];
  origins: string;
}

export interface LanguageInfo {
  name: string;
  type: 'primary' | 'secondary' | 'ceremonial' | 'trade' | 'ancient';
  speakers: number;
  writingSystem: string;
  phonetics: string[];
  grammar: string[];
  vocabulary: VocabularyEntry[];
  dialects: LanguageDialect[];
}

export interface VocabularyEntry {
  word: string;
  meaning: string;
  partOfSpeech: string;
  usage: string[];
  etymology?: string;
  culturalSignificance?: string;
}

export interface LanguageDialect {
  name: string;
  region: string;
  differences: string[];
  speakers: number;
  status: 'thriving' | 'declining' | 'extinct' | 'reviving';
}

export interface ArtForm {
  type: 'visual' | 'musical' | 'literary' | 'performance' | 'craft' | 'culinary';
  name: string;
  description: string;
  techniques: string[];
  materials: string[];
  purposes: string[];
  examples: string[];
  masters: string[];
}

export interface ReligiousSystem {
  name: string;
  type: 'monotheistic' | 'polytheistic' | 'pantheistic' | 'animistic' | 'philosophical' | 'other';
  description: string;
  deities: Deity[];
  beliefs: string[];
  practices: ReligiousPractice[];
  hierarchy: string[];
  texts: string[];
  followers: number;
}

export interface Deity {
  name: string;
  domain: string[];
  description: string;
  manifestations: string[];
  symbols: string[];
  relationships: string[];
}

export interface ReligiousPractice {
  name: string;
  type: 'worship' | 'ceremony' | 'pilgrimage' | 'meditation' | 'sacrifice' | 'blessing';
  description: string;
  frequency: string;
  participants: string[];
  requirements: string[];
}

export interface SocialStructure {
  hierarchy: SocialClass[];
  mobility: 'rigid' | 'limited' | 'moderate' | 'high';
  determinants: string[];
  institutions: string[];
  roles: SocialRole[];
}

export interface SocialClass {
  name: string;
  percentage: number;
  description: string;
  privileges: string[];
  responsibilities: string[];
  markers: string[];
}

export interface SocialRole {
  name: string;
  description: string;
  expectations: string[];
  restrictions: string[];
  transitions: string[];
}

export interface EconomicSystem {
  type: 'barter' | 'currency' | 'gift' | 'command' | 'market' | 'mixed';
  description: string;
  currency: Currency[];
  resources: string[];
  industries: Industry[];
  trade: TradeRelation[];
}

export interface Currency {
  name: string;
  type: 'physical' | 'digital' | 'commodity' | 'representative';
  denominations: Denomination[];
  exchangeRates: ExchangeRate[];
  acceptance: string[];
}

export interface Denomination {
  name: string;
  value: number;
  material?: string;
  description: string;
}

export interface ExchangeRate {
  currency: string;
  rate: number;
  stability: 'stable' | 'fluctuating' | 'volatile';
}

export interface Industry {
  name: string;
  type: 'agriculture' | 'manufacturing' | 'services' | 'technology' | 'extraction';
  importance: 'dominant' | 'major' | 'moderate' | 'minor';
  workers: number;
  output: string[];
  challenges: string[];
}

export interface TradeRelation {
  partner: string;
  type: 'export' | 'import' | 'bilateral';
  goods: string[];
  volume: string;
  relationship: 'friendly' | 'neutral' | 'tense' | 'hostile';
}

export interface PoliticalSystem {
  type: 'monarchy' | 'democracy' | 'autocracy' | 'oligarchy' | 'theocracy' | 'anarchy' | 'other';
  description: string;
  structure: GovernmentLevel[];
  positions: PoliticalPosition[];
  laws: LegalSystem;
  relations: PoliticalRelation[];
}

export interface GovernmentLevel {
  name: string;
  scope: 'local' | 'regional' | 'national' | 'international';
  authority: string[];
  representatives: number;
  selection: string;
}

export interface PoliticalPosition {
  title: string;
  level: string;
  authority: string[];
  term: string;
  selection: string;
  currentHolder?: string;
}

export interface LegalSystem {
  type: 'common' | 'civil' | 'religious' | 'customary' | 'mixed';
  codes: LegalCode[];
  enforcement: string[];
  punishments: string[];
  courts: string[];
}

export interface LegalCode {
  name: string;
  scope: string[];
  principles: string[];
  penalties: string[];
  exceptions: string[];
}

export interface PoliticalRelation {
  entity: string;
  type: 'alliance' | 'neutral' | 'rival' | 'enemy' | 'subject' | 'overlord';
  description: string;
  treaties: string[];
  disputes: string[];
}

export interface EducationSystem {
  type: 'formal' | 'apprenticeship' | 'religious' | 'private' | 'mixed';
  levels: EducationLevel[];
  accessibility: string;
  funding: string;
  curriculum: string[];
  institutions: string[];
}

export interface EducationLevel {
  name: string;
  ageRange: string;
  duration: string;
  subjects: string[];
  completion: string;
  advancement: string;
}

export interface CulturalHistory {
  period: string;
  events: string[];
  influences: string[];
  changes: string[];
  documentation: string[];
}

export interface CulturalInfluence {
  source: string;
  type: 'adoption' | 'adaptation' | 'resistance' | 'synthesis';
  elements: string[];
  timeframe: string;
  result: string;
}

export interface CulturalConflict {
  id: string;
  type: 'internal' | 'external' | 'generational' | 'class' | 'religious';
  description: string;
  parties: string[];
  causes: string[];
  status: 'ongoing' | 'resolved' | 'dormant' | 'escalating';
  impact: string[];
}

export interface Technology {
  id: string;
  name: string;
  category: 'transportation' | 'communication' | 'warfare' | 'agriculture' | 'medicine' | 'energy' | 'manufacturing' | 'other';
  description: string;
  
  developmentLevel: 'primitive' | 'basic' | 'advanced' | 'futuristic' | 'magical' | 'hybrid';
  complexity: 'simple' | 'moderate' | 'complex' | 'highly-complex';
  
  requirements: TechRequirement[];
  capabilities: string[];
  limitations: string[];
  sideEffects: string[];
  
  developers: string[];
  users: string[];
  locations: string[];
  cultures: string[];
  
  history: TechHistory[];
  variations: TechVariation[];
  dependencies: string[];
  
  isCanon: boolean;
  availability: 'common' | 'uncommon' | 'rare' | 'unique' | 'secret';
  createdBy: string;
  createdAt: Date;
}

export interface TechRequirement {
  type: 'material' | 'knowledge' | 'skill' | 'energy' | 'infrastructure' | 'magical';
  name: string;
  quantity?: number;
  quality?: string;
  availability: string;
}

export interface TechHistory {
  event: string;
  date: UniverseDate;
  type: 'invention' | 'improvement' | 'adoption' | 'abandonment' | 'rediscovery';
  impact: string;
  participants: string[];
}

export interface TechVariation {
  name: string;
  differences: string[];
  users: string[];
  advantages: string[];
  disadvantages: string[];
}

export interface MagicSystem {
  id: string;
  name: string;
  description: string;
  type: 'arcane' | 'divine' | 'primal' | 'psionic' | 'technological' | 'hybrid';
  
  source: MagicSource;
  mechanics: MagicMechanics;
  limitations: MagicLimitation[];
  costs: MagicCost[];
  
  practitioners: PractitionerInfo[];
  schools: MagicSchool[];
  spells: Spell[];
  artifacts: MagicArtifact[];
  
  culturalIntegration: CulturalIntegration;
  conflicts: MagicConflict[];
  variations: MagicVariation[];
  
  isCanon: boolean;
  availability: 'common' | 'uncommon' | 'rare' | 'unique' | 'extinct';
  createdBy: string;
  createdAt: Date;
}

export interface MagicSource {
  origin: string;
  nature: 'internal' | 'external' | 'environmental' | 'divine' | 'technological';
  accessibility: 'universal' | 'selective' | 'inherited' | 'learned' | 'granted';
  sustainability: 'renewable' | 'limited' | 'consumable' | 'eternal';
  detectability: string;
}

export interface MagicMechanics {
  activation: string[];
  requirements: string[];
  duration: string;
  range: string;
  targeting: string;
  interference: string[];
  amplification: string[];
}

export interface MagicLimitation {
  type: 'physical' | 'mental' | 'spiritual' | 'environmental' | 'cultural' | 'technological';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'absolute';
  circumvention: string[];
}

export interface MagicCost {
  type: 'energy' | 'material' | 'time' | 'risk' | 'social' | 'spiritual';
  description: string;
  severity: 'minimal' | 'moderate' | 'significant' | 'extreme';
  recovery: string;
}

export interface PractitionerInfo {
  type: 'wizard' | 'sorcerer' | 'cleric' | 'druid' | 'warlock' | 'other';
  training: string;
  abilities: string[];
  limitations: string[];
  socialStatus: string;
  organization?: string;
}

export interface MagicSchool {
  name: string;
  philosophy: string;
  focus: string[];
  techniques: string[];
  practitioners: string[];
  rivals: string[];
  secrets: string[];
}

export interface Spell {
  name: string;
  school: string;
  level: number;
  description: string;
  components: string[];
  castingTime: string;
  duration: string;
  range: string;
  effects: string[];
  limitations: string[];
  variants: string[];
}

export interface MagicArtifact {
  name: string;
  type: 'weapon' | 'armor' | 'tool' | 'accessory' | 'consumable' | 'location';
  description: string;
  powers: string[];
  limitations: string[];
  history: string;
  currentLocation?: string;
  owner?: string;
}

export interface CulturalIntegration {
  acceptance: 'revered' | 'accepted' | 'tolerated' | 'feared' | 'forbidden';
  regulation: string[];
  institutions: string[];
  impact: string[];
  adaptations: string[];
}

export interface MagicConflict {
  type: 'philosophical' | 'territorial' | 'resource' | 'ideological' | 'succession';
  participants: string[];
  description: string;
  status: 'active' | 'resolved' | 'dormant' | 'escalating';
  consequences: string[];
}

export interface MagicVariation {
  name: string;
  differences: string[];
  regions: string[];
  practitioners: string[];
  status: 'mainstream' | 'alternative' | 'underground' | 'experimental';
}

// Canon Management
export interface CanonManagement {
  id: string;
  universeId: string;
  levels: CanonLevel[];
  conflicts: CanonConflict[];
  resolutions: CanonResolution[];
  voting: CanonVoting;
  approval: CanonApproval;
  versioning: CanonVersioning;
}

export interface CanonLevel {
  name: string;
  description: string;
  authority: number; // 0-100
  elements: CanonElement[];
  maintainers: string[];
  rules: CanonRule[];
}

export interface CanonElement {
  id: string;
  type: 'event' | 'character' | 'location' | 'culture' | 'technology' | 'magic';
  referenceId: string;
  canonLevel: string;
  conflictStatus: 'clean' | 'conflicted' | 'disputed';
  lastVerified: Date;
  verifiedBy: string;
  sources: string[];
  challenges: CanonChallenge[];
}

export interface CanonRule {
  id: string;
  description: string;
  priority: number;
  applicableTo: string[];
  exceptions: string[];
  enforcement: 'strict' | 'moderate' | 'flexible';
}

export interface CanonChallenge {
  id: string;
  challengerId: string;
  reason: string;
  evidence: string[];
  status: 'pending' | 'under-review' | 'accepted' | 'rejected';
  reviewers: string[];
  resolution?: string;
  resolvedAt?: Date;
}

export interface CanonConflict {
  id: string;
  type: 'contradiction' | 'inconsistency' | 'retcon' | 'interpretation';
  elements: string[];
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  discoveredBy: string;
  discoveredAt: Date;
  status: 'open' | 'investigating' | 'voting' | 'resolved';
  affectedProjects: string[];
}

export interface CanonResolution {
  conflictId: string;
  strategy: 'override' | 'merge' | 'alternative' | 'deprecate' | 'branch';
  decision: string;
  reasoning: string;
  decidedBy: string;
  decidedAt: Date;
  implementation: ResolutionImplementation;
  appeals: ResolutionAppeal[];
}

export interface ResolutionImplementation {
  actions: string[];
  timeline: string;
  responsibleParties: string[];
  status: 'planned' | 'in-progress' | 'completed' | 'stalled';
  completedActions: string[];
  blockers: string[];
}

export interface ResolutionAppeal {
  appealerId: string;
  reason: string;
  submittedAt: Date;
  status: 'pending' | 'reviewing' | 'granted' | 'denied';
  reviewedBy?: string;
  reviewedAt?: Date;
  decision?: string;
}

export interface CanonVoting {
  activeVotes: CanonVote[];
  eligibilityRules: VotingEligibility;
  procedures: VotingProcedure[];
  history: VoteHistory[];
}

export interface CanonVote {
  id: string;
  issue: string;
  options: VoteOption[];
  eligibleVoters: string[];
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  results?: VoteResults;
  quorum: number;
  majority: number;
}

export interface VoteOption {
  id: string;
  description: string;
  details: string;
  proposedBy: string;
  supporters: string[];
}

export interface VotingEligibility {
  requirementSets: EligibilityRequirement[][];
  exclusions: string[];
  appeals: boolean;
}

export interface EligibilityRequirement {
  type: 'role' | 'contribution' | 'tenure' | 'expertise' | 'project-involvement';
  criteria: string;
  value: any;
}

export interface VotingProcedure {
  name: string;
  applicableTo: string[];
  steps: ProcedureStep[];
  timeframes: Record<string, number>;
  requirements: string[];
}

export interface ProcedureStep {
  name: string;
  description: string;
  requiredRoles: string[];
  timeLimit?: number;
  prerequisites: string[];
  outcomes: string[];
}

export interface VoteResults {
  options: Record<string, number>;
  totalVotes: number;
  abstentions: number;
  winner?: string;
  margin: number;
  details: VoteDetail[];
}

export interface VoteDetail {
  voterId: string;
  option: string;
  timestamp: Date;
  weight: number;
  reasoning?: string;
}

export interface VoteHistory {
  voteId: string;
  issue: string;
  date: Date;
  results: VoteResults;
  implementation: string;
  outcome: string;
}

export interface CanonApproval {
  workflows: ApprovalWorkflow[];
  authorities: ApprovalAuthority[];
  delegations: ApprovalDelegation[];
  appeals: ApprovalAppeal[];
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  applicableTo: string[];
  stages: ApprovalStage[];
  bypassConditions: string[];
  escalationRules: string[];
}

export interface ApprovalStage {
  name: string;
  requiredApprovers: number;
  eligibleApprovers: string[];
  timeLimit?: number;
  canDelegate: boolean;
  autoApproval?: string;
  requirements: string[];
}

export interface ApprovalAuthority {
  userId: string;
  scope: string[];
  level: number;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  limitations: string[];
}

export interface ApprovalDelegation {
  delegatorId: string;
  delegateeId: string;
  scope: string[];
  startDate: Date;
  endDate: Date;
  conditions: string[];
  isActive: boolean;
}

export interface ApprovalAppeal {
  id: string;
  originalDecision: string;
  appealerId: string;
  reason: string;
  submittedAt: Date;
  status: 'pending' | 'reviewing' | 'granted' | 'denied';
  reviewers: string[];
  decision?: string;
  decidedAt?: Date;
}

export interface CanonVersioning {
  versions: CanonVersion[];
  branches: CanonBranch[];
  merges: CanonMerge[];
  snapshots: CanonSnapshot[];
}

export interface CanonVersion {
  id: string;
  versionNumber: string;
  description: string;
  changes: CanonChange[];
  createdBy: string;
  createdAt: Date;
  approvedBy: string[];
  approvedAt: Date;
  isActive: boolean;
  parentVersion?: string;
}

export interface CanonChange {
  type: 'addition' | 'modification' | 'removal' | 'clarification';
  elementType: string;
  elementId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  reasoning: string;
  impact: string[];
}

export interface CanonBranch {
  id: string;
  name: string;
  description: string;
  purpose: 'experimental' | 'alternative' | 'project-specific' | 'backup';
  parentVersion: string;
  versions: string[];
  isActive: boolean;
  maintainers: string[];
  mergePolicy: 'manual' | 'automatic' | 'never';
}

export interface CanonMerge {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  strategy: 'fast-forward' | 'merge-commit' | 'rebase' | 'squash';
  conflicts: MergeConflict[];
  resolution: string;
  mergedBy: string;
  mergedAt: Date;
  success: boolean;
}

export interface CanonSnapshot {
  id: string;
  name: string;
  description: string;
  capturedAt: Date;
  capturedBy: string;
  elements: string[];
  purpose: 'backup' | 'milestone' | 'release' | 'experiment';
  isRestoreable: boolean;
}

// Conflict Resolution System
export interface UniverseConflictResolution {
  id: string;
  universeId: string;
  policies: ConflictPolicy[];
  mediators: ConflictMediator[];
  processes: ConflictProcess[];
  escalationMatrix: EscalationMatrix;
  resolutionHistory: ConflictResolutionRecord[];
}

export interface ConflictPolicy {
  id: string;
  name: string;
  applicableTo: string[];
  description: string;
  principles: string[];
  procedures: string[];
  outcomes: string[];
  exceptions: string[];
}

export interface ConflictMediator {
  userId: string;
  specialties: string[];
  experience: number;
  successRate: number;
  availability: boolean;
  caseload: number;
  maxCaseload: number;
  bias?: string[];
  recusals: string[];
}

export interface ConflictProcess {
  name: string;
  stages: string[];
  timeframes: Record<string, number>;
  participants: string[];
  requirements: string[];
  outcomes: string[];
  appealRights: boolean;
}

export interface EscalationMatrix {
  levels: EscalationLevel[];
  triggers: EscalationTrigger[];
  authorities: Record<string, string[]>;
  procedures: Record<string, string>;
}

export interface EscalationLevel {
  level: number;
  name: string;
  authority: string[];
  timeLimit: number;
  requirements: string[];
  outcomes: string[];
}

export interface EscalationTrigger {
  condition: string;
  targetLevel: number;
  automatic: boolean;
  requirements: string[];
}

export interface ConflictResolutionRecord {
  conflictId: string;
  type: string;
  participants: string[];
  mediator?: string;
  process: string;
  duration: number;
  outcome: string;
  satisfaction: Record<string, number>;
  lessons: string[];
  precedents: string[];
  appeals?: string[];
}

// Universe Version Control
export interface UniverseVersionControl {
  id: string;
  universeId: string;
  repositories: UniverseRepository[];
  branches: UniverseBranch[];
  commits: UniverseCommit[];
  merges: UniverseMerge[];
  tags: UniverseTag[];
  releases: UniverseRelease[];
}

export interface UniverseRepository {
  id: string;
  name: string;
  description: string;
  isMain: boolean;
  owner: string;
  collaborators: string[];
  access: 'public' | 'private' | 'restricted';
  defaultBranch: string;
  settings: RepositorySettings;
}

export interface RepositorySettings {
  allowForking: boolean;
  requireReviews: boolean;
  autoMerge: boolean;
  protectedBranches: string[];
  webhooks: string[];
  integrations: string[];
}

export interface UniverseBranch {
  id: string;
  repositoryId: string;
  name: string;
  description: string;
  createdFrom: string;
  createdBy: string;
  createdAt: Date;
  lastCommit: string;
  isProtected: boolean;
  isDefault: boolean;
  mergePolicy: 'merge' | 'rebase' | 'squash';
}

export interface UniverseCommit {
  id: string;
  repositoryId: string;
  branchId: string;
  authorId: string;
  message: string;
  description?: string;
  timestamp: Date;
  parentCommits: string[];
  changes: UniverseFileChange[];
  tags: string[];
  verified: boolean;
}

export interface UniverseFileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed' | 'moved';
  oldPath?: string;
  additions: number;
  deletions: number;
  diff: string;
  binary: boolean;
}

export interface UniverseMerge {
  id: string;
  repositoryId: string;
  sourceBranch: string;
  targetBranch: string;
  strategy: 'merge' | 'rebase' | 'squash';
  authorId: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'merged' | 'closed';
  createdAt: Date;
  mergedAt?: Date;
  commits: string[];
  conflicts: UniverseMergeConflict[];
  reviewers: MergeReviewer[];
  approvals: string[];
  checks: MergeCheck[];
}

export interface UniverseMergeConflict {
  path: string;
  type: 'content' | 'rename' | 'delete' | 'binary';
  sourceContent: string;
  targetContent: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface MergeReviewer {
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed';
  comments: string[];
  reviewedAt?: Date;
  isRequired: boolean;
}

export interface MergeCheck {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'cancelled';
  description: string;
  detailsUrl?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface UniverseTag {
  id: string;
  repositoryId: string;
  name: string;
  description: string;
  commitId: string;
  createdBy: string;
  createdAt: Date;
  isRelease: boolean;
}

export interface UniverseRelease {
  id: string;
  repositoryId: string;
  tagId: string;
  name: string;
  description: string;
  version: string;
  isPrerelease: boolean;
  isDraft: boolean;
  createdBy: string;
  createdAt: Date;
  publishedAt?: Date;
  assets: ReleaseAsset[];
  changelog: string;
}

export interface ReleaseAsset {
  name: string;
  type: string;
  size: number;
  downloadUrl: string;
  downloadCount: number;
  uploadedAt: Date;
}

// Universe Analytics
export interface UniverseAnalytics {
  id: string;
  universeId: string;
  overview: UniverseOverview;
  activity: ActivityMetrics;
  collaboration: CollaborationMetrics;
  quality: QualityMetrics;
  growth: GrowthMetrics;
  engagement: EngagementMetrics;
}

export interface UniverseOverview {
  totalElements: number;
  canonElements: number;
  disputedElements: number;
  activeProjects: number;
  totalCollaborators: number;
  activeCollaborators: number;
  lastActivity: Date;
  healthScore: number;
}

export interface ActivityMetrics {
  daily: DailyActivity[];
  weekly: WeeklyActivity[];
  monthly: MonthlyActivity[];
  byElementType: Record<string, number>;
  byCollaborator: Record<string, number>;
  peakHours: number[];
  trends: ActivityTrend[];
}

export interface DailyActivity {
  date: Date;
  additions: number;
  modifications: number;
  deletions: number;
  discussions: number;
  conflicts: number;
  resolutions: number;
}

export interface WeeklyActivity {
  week: string;
  totalChanges: number;
  uniqueContributors: number;
  newElements: number;
  resolvedConflicts: number;
}

export interface MonthlyActivity {
  month: string;
  totalChanges: number;
  uniqueContributors: number;
  newElements: number;
  qualityScore: number;
}

export interface ActivityTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  timeframe: string;
  significance: 'low' | 'medium' | 'high';
}

export interface CollaborationMetrics {
  networkAnalysis: CollaborationNetwork;
  communicationPatterns: CommunicationPattern[];
  conflictAnalysis: ConflictAnalysis;
  contributionDistribution: ContributionDistribution;
  teamDynamics: TeamDynamics;
}

export interface CollaborationNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  clusters: NetworkCluster[];
  centralityScores: Record<string, number>;
  density: number;
}

export interface NetworkNode {
  id: string;
  type: 'user' | 'project' | 'element';
  weight: number;
  attributes: Record<string, any>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
  attributes: Record<string, any>;
}

export interface NetworkCluster {
  id: string;
  members: string[];
  cohesion: number;
  purpose: string;
}

export interface CommunicationPattern {
  type: 'discussion' | 'feedback' | 'conflict' | 'collaboration';
  frequency: number;
  participants: number;
  averageLength: number;
  sentiment: number;
  topics: string[];
}

export interface ConflictAnalysis {
  totalConflicts: number;
  resolvedConflicts: number;
  averageResolutionTime: number;
  commonCauses: string[];
  hotspots: string[];
  resolution: {
    patterns: ResolutionPattern[];
    success: {
      rate: number;
      factors: string[];
    };
  };
}

export interface ResolutionPattern {
  strategy: string;
  frequency: number;
  successRate: number;
  averageTime: number;
  applicableScenarios: string[];
}

export interface ContributionDistribution {
  byUser: Record<string, number>;
  byType: Record<string, number>;
  byTime: Record<string, number>;
  inequality: GiniCoefficient;
  patterns: ContributionPattern[];
}

export interface GiniCoefficient {
  value: number;
  interpretation: string;
  trend: string;
}

export interface ContributionPattern {
  type: string;
  description: string;
  contributors: string[];
  impact: number;
  sustainability: number;
}

export interface TeamDynamics {
  cohesion: number;
  productivity: number;
  satisfaction: number;
  turnover: number;
  leadership: LeadershipMetrics;
  mentorship: MentorshipMetrics;
}

export interface LeadershipMetrics {
  identifiedLeaders: string[];
  leadershipStyles: Record<string, string>;
  effectiveness: Record<string, number>;
  succession: SuccessionPlan[];
}

export interface SuccessionPlan {
  role: string;
  current: string;
  candidates: string[];
  readiness: Record<string, number>;
  timeline: string;
}

export interface MentorshipMetrics {
  activePairs: number;
  successRate: number;
  averageDuration: number;
  skillsTransferred: string[];
  outcomes: MentorshipOutcome[];
}

export interface MentorshipOutcome {
  menteeId: string;
  skillsGained: string[];
  contributionIncrease: number;
  satisfactionScore: number;
  duration: number;
}

// Project Analytics
export interface ProjectAnalytics {
  overview: ProjectOverview;
  progress: ProgressMetrics;
  collaboration: ProjectCollaborationMetrics;
  quality: ProjectQualityMetrics;
  timeline: TimelineMetrics;
  predictions: ProjectPredictions;
}

export interface ProjectOverview {
  status: string;
  completion: number;
  wordsWritten: number;
  targetWords: number;
  contributors: number;
  activeSprint?: string;
  nextMilestone?: ProjectMilestone;
  healthScore: number;
}

export interface ProgressMetrics {
  daily: DailyProgress[];
  weekly: WeeklyProgress[];
  velocity: Velocity;
  milestones: MilestoneProgress[];
  bottlenecks: Bottleneck[];
}

export interface DailyProgress {
  date: Date;
  wordsAdded: number;
  wordsEdited: number;
  wordsDeleted: number;
  contributors: string[];
  sessions: number;
  commits: number;
}

export interface WeeklyProgress {
  week: string;
  netWords: number;
  contributors: number;
  completedTasks: number;
  milestoneProgress: number;
}

export interface Velocity {
  current: number;
  average: number;
  trend: string;
  predictedCompletion: Date;
  confidence: number;
}

export interface MilestoneProgress {
  milestoneId: string;
  name: string;
  completion: number;
  deadline: Date;
  onTrack: boolean;
  remainingTasks: number;
  blockers: string[];
}

export interface Bottleneck {
  type: 'resource' | 'dependency' | 'approval' | 'technical' | 'creative';
  description: string;
  impact: number;
  duration: number;
  affectedTasks: string[];
  solutions: string[];
}

export interface ProjectCollaborationMetrics {
  teamSize: number;
  activeContributors: number;
  contributionBalance: number;
  communicationScore: number;
  conflictRate: number;
  satisfactionScore: number;
}

export interface ProjectQualityMetrics {
  overallScore: number;
  readabilityScore: number;
  consistencyScore: number;
  completenessScore: number;
  feedbackScore: number;
  improvementTrend: string;
}

export interface TimelineMetrics {
  plannedDuration: number;
  actualDuration?: number;
  estimatedCompletion: Date;
  bufferTime: number;
  riskFactors: RiskFactor[];
  contingencies: Contingency[];
}

export interface RiskFactor {
  type: string;
  probability: number;
  impact: number;
  mitigation: string[];
  status: 'monitoring' | 'active' | 'mitigated';
}

export interface Contingency {
  scenario: string;
  probability: number;
  response: string;
  resources: string[];
  timeline: string;
}

export interface ProjectPredictions {
  completion: CompletionPrediction;
  quality: QualityPrediction;
  resources: ResourcePrediction;
  risks: RiskPrediction[];
}

export interface CompletionPrediction {
  mostLikely: Date;
  best: {
    case: Date;
    probability: number;
  };
  worst: {
    case: Date;
    probability: number;
  };
  confidence: number;
  factors: string[];
}

export interface QualityPrediction {
  finalScore: number;
  confidence: number;
  improvementAreas: string[];
  requiredInterventions: string[];
}

export interface ResourcePrediction {
  additionalHours: number;
  additionalContributors: number;
  skillGaps: string[];
  trainingNeeds: string[];
}

export interface RiskPrediction {
  risk: string;
  probability: number;
  impact: number;
  timeframe: string;
  earlyWarnings: string[];
}

// Group Chapter
export interface GroupChapter {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  order: number;
  wordCount: number;
  targetWordCount?: number;
  
  status: 'planning' | 'drafting' | 'reviewing' | 'editing' | 'completed';
  assignedTo: string[];
  reviewers: string[];
  editors: string[];
  
  content: string;
  outline?: string;
  notes?: string;
  
  versions: ChapterVersion[];
  comments: ChapterComment[];
  approvals: ChapterApproval[];
  
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  settings: ChapterSettings;
  analytics: ChapterAnalytics;
}

export interface ChapterVersion {
  id: string;
  versionNumber: string;
  content: string;
  changes: string;
  createdBy: string;
  createdAt: Date;
  wordCount: number;
  isPublished: boolean;
  feedbackCount: number;
}

export interface ChapterComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  position?: TextPosition;
  type: 'general' | 'suggestion' | 'question' | 'praise' | 'concern';
  status: 'open' | 'addressed' | 'resolved';
  timestamp: Date;
  replies: CommentReply[];
  tags: string[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  type: 'clarification' | 'agreement' | 'disagreement' | 'implementation';
}

export interface ChapterApproval {
  approverId: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected' | 'conditional';
  timestamp: Date;
  comments?: string;
  conditions?: string[];
}

export interface ChapterSettings {
  allowPublicReading: boolean;
  requireApproval: boolean;
  enableComments: boolean;
  enableSuggestions: boolean;
  trackVersions: boolean;
  notifyOnChanges: boolean;
}

export interface ChapterAnalytics {
  readingTime: number;
  readabilityScore: number;
  engagement: EngagementScore;
  feedback: FeedbackAnalytics;
  versions: number;
  lastActivity: Date;
}

export interface EngagementScore {
  views: number;
  uniqueReaders: number;
  averageReadTime: number;
  completionRate: number;
  bookmarkRate: number;
}

export interface FeedbackAnalytics {
  totalComments: number;
  averageRating: number;
  sentimentScore: number;
  topIssues: string[];
  improvementSuggestions: string[];
}

// Project Resource
export interface ProjectResource {
  id: string;
  projectId: string;
  name: string;
  type: 'reference' | 'template' | 'image' | 'audio' | 'video' | 'document' | 'link' | 'note';
  description?: string;
  tags: string[];
  
  content?: string;
  url?: string;
  file?: ProjectFile;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  access: ResourceAccess;
  usage: ResourceUsage;
  versions: ResourceVersion[];
}

export interface ProjectFile {
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  quality?: string;
  checksum: string;
}

export interface ResourceAccess {
  visibility: 'private' | 'group' | 'public';
  allowedRoles: GroupRole[];
  allowedUsers: string[];
  downloadable: boolean;
  editable: boolean;
}

export interface ResourceUsage {
  viewCount: number;
  downloadCount: number;
  lastAccessed: Date;
  referencedIn: string[];
  popularity: number;
}

export interface ResourceVersion {
  id: string;
  versionNumber: string;
  changes: string;
  createdBy: string;
  createdAt: Date;
  file?: ProjectFile;
  isCurrent: boolean;
}

// Project Discussion
export interface ProjectDiscussion {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  category: 'general' | 'chapter' | 'character' | 'plot' | 'feedback' | 'announcement';
  tags: string[];
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  status: 'open' | 'closed' | 'locked' | 'pinned';
  posts: DiscussionPost[];
  participants: string[];
  
  settings: DiscussionSettings;
  moderation: DiscussionModeration;
}

export interface DiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  editedAt?: Date;
  
  parentPostId?: string;
  replies: string[];
  
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  mentions: string[];
  
  isDeleted: boolean;
  deleteReason?: string;
  moderation?: PostModeration;
}

export interface DiscussionSettings {
  allowReplies: boolean;
  allowAttachments: boolean;
  allowReactions: boolean;
  requireApproval: boolean;
  allowAnonymous: boolean;
  notifyParticipants: boolean;
}

export interface DiscussionModeration {
  isModerated: boolean;
  moderators: string[];
  rules: string[];
  violations: ModerationViolation[];
  autoModeration: boolean;
}

export interface PostModeration {
  action: 'none' | 'flag' | 'hide' | 'edit' | 'delete';
  reason: string;
  moderator: string;
  timestamp: Date;
  appealable: boolean;
}

export interface ModerationViolation {
  postId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'severe';
  action: string;
  moderator: string;
  timestamp: Date;
}

// Project Milestone
export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: 'deadline' | 'target' | 'checkpoint' | 'release' | 'event';
  
  dueDate: Date;
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  criteria: MilestoneCriteria[];
  dependencies: string[];
  tasks: MilestoneTask[];
  
  assignedTo: string[];
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  
  notifications: MilestoneNotification[];
  analytics: MilestoneAnalytics;
}

export interface MilestoneCriteria {
  id: string;
  description: string;
  type: 'wordcount' | 'completion' | 'approval' | 'quality' | 'custom';
  target: any;
  current: any;
  isRequired: boolean;
  status: 'pending' | 'met' | 'not-applicable';
}

export interface MilestoneTask {
  id: string;
  name: string;
  description?: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  actualHours?: number;
  dependencies: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface MilestoneNotification {
  type: 'reminder' | 'overdue' | 'completed' | 'updated';
  recipients: string[];
  message: string;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
}

export interface MilestoneAnalytics {
  progress: number;
  onTrack: boolean;
  estimatedCompletion: Date;
  riskLevel: 'low' | 'medium' | 'high';
  blockers: string[];
  contributors: number;
  effort: number; // hours
}

// Event Management
export interface GroupEvent {
  id: string;
  groupId: string;
  title: string;
  description: string;
  type: 'workshop' | 'sprint' | 'critique' | 'meeting' | 'social' | 'deadline' | 'celebration';
  
  startTime: Date;
  endTime: Date;
  timezone: string;
  isRecurring: boolean;
  recurrence?: RecurrencePattern;
  
  location?: EventLocation;
  capacity?: number;
  attendees: EventAttendee[];
  waitlist: string[];
  
  organizer: string;
  facilitators: string[];
  requirements: EventRequirement[];
  
  status: 'planned' | 'open' | 'full' | 'in-progress' | 'completed' | 'cancelled';
  visibility: 'public' | 'group' | 'private';
  
  agenda: AgendaItem[];
  resources: string[];
  recording?: EventRecording;
  
  feedback: EventFeedback[];
  analytics: EventAnalytics;
  
  settings: EventSettings;
  integrations: EventIntegration[];
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
  exceptions: Date[];
}

export interface EventLocation {
  type: 'virtual' | 'physical' | 'hybrid';
  name?: string;
  address?: string;
  virtualUrl?: string;
  accessInstructions?: string;
  timezone?: string;
}

export interface EventAttendee {
  userId: string;
  username: string;
  status: 'invited' | 'accepted' | 'declined' | 'maybe' | 'attended' | 'no-show';
  role: 'participant' | 'presenter' | 'facilitator' | 'observer';
  registeredAt: Date;
  checkedIn?: boolean;
  checkedInAt?: Date;
  feedback?: string;
  notes?: string;
}

export interface EventRequirement {
  type: 'skill' | 'material' | 'preparation' | 'technology' | 'role';
  description: string;
  isRequired: boolean;
  alternatives?: string[];
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  duration: number; // minutes
  type: 'presentation' | 'discussion' | 'workshop' | 'break' | 'feedback' | 'networking';
  presenter?: string;
  participants?: string[];
  materials?: string[];
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'skipped';
}

export interface EventRecording {
  id: string;
  title: string;
  url: string;
  duration: number;
  quality: string;
  availability: 'attendees' | 'group' | 'public' | 'private';
  transcription?: string;
  chapters: RecordingChapter[];
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface EventFeedback {
  attendeeId: string;
  overallRating: number;
  contentRating: number;
  facilitatorRating: number;
  organizationRating: number;
  comments: string;
  suggestions: string;
  wouldRecommend: boolean;
  wouldAttendAgain: boolean;
  submittedAt: Date;
}

export interface EventAnalytics {
  registrations: number;
  attendance: number;
  completionRate: number;
  averageRating: number;
  engagementScore: number;
  feedbackCount: number;
  noShowRate: number;
  repeatAttendees: number;
  conversionRate: number; // from group members
  impact: EventImpact;
}

export interface EventImpact {
  skillsGained: string[];
  connectionsMode: number;
  projectsStarted: number;
  collaborationsFormed: number;
  followUpActions: number;
  longTermEngagement: number;
}

export interface EventSettings {
  requiresRegistration: boolean;
  allowWaitlist: boolean;
  sendReminders: boolean;
  enableChat: boolean;
  enableRecording: boolean;
  enableBreakoutRooms: boolean;
  enableScreenShare: boolean;
  enableWhiteboard: boolean;
  moderationEnabled: boolean;
  maxAttendees?: number;
}

export interface EventIntegration {
  type: 'calendar' | 'email' | 'chat' | 'video' | 'survey' | 'document';
  service: string;
  isEnabled: boolean;
  settings: Record<string, any>;
  webhooks?: string[];
}

// Smart Matching System
export interface SmartMatching {
  betaReaderMatching: BetaReaderMatching;
  collaboratorMatching: CollaboratorMatching;
  mentorMatching: MentorMatching;
  projectMatching: ProjectMatching;
}

export interface BetaReaderMatching {
  algorithm: 'compatibility' | 'expertise' | 'availability' | 'hybrid';
  criteria: MatchingCriteria[];
  weights: Record<string, number>;
  matches: BetaReaderMatch[];
  feedback: MatchingFeedback[];
}

export interface MatchingCriteria {
  factor: string;
  importance: number;
  type: 'requirement' | 'preference' | 'bonus';
  weight: number;
}

export interface BetaReaderMatch {
  authorId: string;
  betaReaderId: string;
  score: number;
  confidence: number;
  factors: MatchFactor[];
  recommendation: 'strong' | 'good' | 'moderate' | 'weak';
  reasoning: string[];
  potentialIssues: string[];
}

export interface MatchFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  evidence: string[];
}

export interface MatchingFeedback {
  matchId: string;
  accuracy: number;
  satisfaction: number;
  improvements: string[];
  actualOutcome: string;
  submittedBy: string;
  submittedAt: Date;
}

export interface CollaboratorMatching {
  projectId: string;
  requiredSkills: string[];
  preferredSkills: string[];
  timeCommitment: string;
  workingStyle: string[];
  candidates: CollaboratorCandidate[];
  recommendations: CollaboratorRecommendation[];
}

export interface CollaboratorCandidate {
  userId: string;
  skillMatch: number;
  availabilityMatch: number;
  styleMatch: number;
  experienceMatch: number;
  overallScore: number;
  strengths: string[];
  concerns: string[];
}

export interface CollaboratorRecommendation {
  userId: string;
  role: string;
  confidence: number;
  reasoning: string[];
  onboardingPlan: string[];
  successFactors: string[];
}

export interface MentorMatching {
  menteeId: string;
  goals: string[];
  experience: string;
  preferences: MentorPreferences;
  matches: MentorMatch[];
  program: MentorshipProgram;
}

export interface MentorPreferences {
  communicationStyle: string[];
  meetingFrequency: string;
  focusAreas: string[];
  timeCommitment: string;
  mentorExperience: string;
}

export interface MentorMatch {
  mentorId: string;
  compatibilityScore: number;
  expertiseMatch: number;
  styleMatch: number;
  availabilityMatch: number;
  trackRecord: MentorTrackRecord;
  recommendation: string;
}

export interface MentorTrackRecord {
  menteesHelped: number;
  averageRating: number;
  successStories: string[];
  specializations: string[];
  preferredMenteeLevel: string[];
}

export interface MentorshipProgram {
  id: string;
  name: string;
  description: string;
  duration: string;
  structure: ProgramStructure;
  goals: string[];
  requirements: string[];
  benefits: string[];
}

export interface ProgramStructure {
  phases: ProgramPhase[];
  milestones: ProgramMilestone[];
  assessments: ProgramAssessment[];
  resources: string[];
}

export interface ProgramPhase {
  name: string;
  duration: string;
  objectives: string[];
  activities: string[];
  deliverables: string[];
}

export interface ProgramMilestone {
  name: string;
  description: string;
  criteria: string[];
  timeline: string;
  celebration: string;
}

export interface ProgramAssessment {
  type: 'self' | 'peer' | 'mentor' | 'project';
  frequency: string;
  criteria: string[];
  format: string;
}

export interface ProjectMatching {
  userId: string;
  interests: string[];
  skills: string[];
  availability: string;
  experience: string;
  matches: ProjectMatch[];
  recommendations: ProjectRecommendation[];
}

export interface ProjectMatch {
  projectId: string;
  title: string;
  description: string;
  matchScore: number;
  roleOptions: string[];
  timeCommitment: string;
  skillRequirements: string[];
  benefits: string[];
  challenges: string[];
}

export interface ProjectRecommendation {
  projectId: string;
  recommendedRole: string;
  onboardingPath: string[];
  successFactors: string[];
  potentialContributions: string[];
  learningOpportunities: string[];
}

// Notification System
export interface NotificationSystem {
  channels: NotificationChannel[];
  preferences: NotificationPreferences;
  templates: NotificationTemplate[];
  rules: NotificationRule[];
  delivery: NotificationDelivery;
  analytics: NotificationAnalytics;
}

export interface NotificationChannel {
  id: string;
  type: 'in-app' | 'email' | 'push' | 'sms' | 'webhook' | 'discord' | 'slack';
  name: string;
  isEnabled: boolean;
  settings: ChannelSettings;
  reliability: number;
  latency: number;
}

export interface NotificationPreferences {
  userId: string;
  channels: UserChannelPreferences[];
  frequency: NotificationFrequency;
  quietHours: QuietHours;
  categories: CategoryPreferences[];
  keywords: KeywordPreferences;
}

export interface UserChannelPreferences {
  channelType: string;
  isEnabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  allowedTypes: NotificationType[];
  settings: Record<string, any>;
}

export interface NotificationFrequency {
  immediate: NotificationType[];
  hourly: NotificationType[];
  daily: NotificationType[];
  weekly: NotificationType[];
  never: NotificationType[];
}

export interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
  exceptions: NotificationType[];
  weekends: boolean;
}

export interface CategoryPreferences {
  category: string;
  enabled: boolean;
  channels: string[];
  frequency: string;
  keywords: string[];
}

export interface KeywordPreferences {
  mentions: boolean;
  projectNames: boolean;
  deadlines: boolean;
  conflicts: boolean;
  customKeywords: string[];
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: string;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  formatting: TemplateFormatting;
  localization: TemplateLocalization[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: string;
}

export interface TemplateFormatting {
  markdown: boolean;
  html: boolean;
  plainText: boolean;
  richText: boolean;
  maxLength?: number;
  truncation?: string;
}

export interface TemplateLocalization {
  language: string;
  subject: string;
  content: string;
  variables: Record<string, string>;
}

export interface NotificationDelivery {
  queues: DeliveryQueue[];
  retry: RetryPolicy;
  failover: FailoverPolicy;
  tracking: DeliveryTracking;
}

export interface DeliveryQueue {
  name: string;
  priority: number;
  maxRetries: number;
  timeout: number;
  concurrency: number;
  backoff: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'constant';
  backoffMultiplier: number;
  maxBackoff: number;
  retryableErrors: string[];
}

export interface FailoverPolicy {
  enabled: boolean;
  fallbackChannels: string[];
  conditions: FailoverCondition[];
  escalation: EscalationPolicy;
}

export interface FailoverCondition {
  type: 'error' | 'timeout' | 'overload' | 'maintenance';
  threshold: number;
  duration: number;
  action: 'failover' | 'delay' | 'drop';
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeouts: number[];
  channels: string[][];
  finalAction: 'log' | 'alert' | 'manual';
}

export interface DeliveryTracking {
  trackOpens: boolean;
  trackClicks: boolean;
  trackBounces: boolean;
  trackUnsubscribes: boolean;
  retentionDays: number;
  analytics: boolean;
}

export interface NotificationAnalytics {
  delivery: DeliveryMetrics;
  engagement: EngagementMetrics;
  performance: PerformanceMetrics;
  trends: AnalyticsTrend[];
}

export interface DeliveryMetrics {
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  retries: number;
  successRate: number;
  averageLatency: number;
}

export interface EngagementMetrics {
  opened: number;
  clicked: number;
  unsubscribed: number;
  reported: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

export interface PerformanceMetrics {
  throughput: number;
  errorRate: number;
  averageProcessingTime: number;
  queueLength: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  bandwidth: number;
  storage: number;
  requests: number;
}

export interface AnalyticsTrend {
  metric: string;
  period: string;
  values: number[];
  trend: 'up' | 'down' | 'stable';
  significance: number;
}

// Advanced Communication Types
export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'video';
  groupId: string;
  participantIds: string[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  settings: ChannelSettings;
  metadata: ChannelMetadata;
}

export interface ChannelSettings {
  allowFileSharing: boolean;
  allowVoiceNotes: boolean;
  allowVideoCall: boolean;
  translationEnabled: boolean;
  notificationsEnabled: boolean;
  moderationLevel: 'relaxed' | 'standard' | 'strict';
}

export interface ChannelMetadata {
  messageCount: number;
  pinnedMessages: string[];
  tags: string[];
}

export interface VideoConference {
  id: string;
  title: string;
  channelId: string;
  hostId: string;
  participantIds: string[];
  status: 'scheduled' | 'active' | 'ended';
  startTime: Date;
  endTime: Date;
  settings: ConferenceSettings;
  recording?: ConferenceRecording;
  metrics: ConferenceMetrics;
}

export interface ConferenceSettings {
  maxParticipants: number;
  allowScreenSharing: boolean;
  allowRecording: boolean;
  requireApproval: boolean;
  autoTranscription: boolean;
  backgroundBlur: boolean;
}

export interface ConferenceRecording {
  isRecording: boolean;
  recordingId: string;
  startTime: Date;
  size: number;
  transcriptionEnabled: boolean;
}

export interface ConferenceMetrics {
  duration: number;
  peakParticipants: number;
  totalParticipants: number;
  messagesCount: number;
  screenShareTime: number;
  participantEngagement: number;
}

export interface VoiceNote {
  id: string;
  channelId: string;
  senderId: string;
  duration: number;
  fileSize: number;
  transcription: string;
  timestamp: Date;
  isTranscribed: boolean;
  waveformData: number[];
  metadata: VoiceNoteMetadata;
}

export interface VoiceNoteMetadata {
  quality: 'low' | 'medium' | 'high';
  format: string;
  sampleRate: number;
  language: string;
}

export interface ScreenShare {
  id: string;
  conferenceId: string;
  presenterId: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  settings: ScreenShareSettings;
  metrics: ScreenShareMetrics;
  annotations: ScreenAnnotation[];
}

export interface ScreenShareSettings {
  allowAnnotations: boolean;
  allowRemoteControl: boolean;
  quality: 'low' | 'medium' | 'high';
  includeAudio: boolean;
  shareType: 'screen' | 'window' | 'application';
}

export interface ScreenShareMetrics {
  duration: number;
  viewerCount: number;
  annotationsCount: number;
  recordingSize: number;
}

export interface ScreenAnnotation {
  id: string;
  authorId: string;
  x: number;
  y: number;
  text: string;
  timestamp: Date;
  type: 'comment' | 'highlight' | 'arrow' | 'shape';
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'file' | 'system';
  isEdited: boolean;
  reactions: MessageReaction[];
  replyTo?: string;
  voiceNoteId?: string;
  metadata: MessageMetadata;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface MessageMetadata {
  language: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  wordCount: number;
}

export interface NotificationData {
  id: string;
  userId: string;
  type: 'message' | 'conference' | 'mention' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  channelId?: string;
  conferenceId?: string;
  senderId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
}

export interface TranslationRequest {
  messageId: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface CommunicationMetrics {
  totalMessages: number;
  totalVoiceNotes: number;
  totalConferences: number;
  activeUsers: number;
  averageResponseTime: number;
  peakActivityHour: number;
  engagementScore: number;
  translationUsage: number;
  mostActiveChannel: string;
  timeRange: '24h' | '7d' | '30d' | '90d';
  periodStats: PeriodStats;
}

export interface PeriodStats {
  messagesPerDay: number;
  voiceNotesPerDay: number;
  averageConferenceLength: number;
  participationRate: number;
}

// Data transfer objects for service methods
export interface CreateChannelData {
  name: string;
  type: 'text' | 'voice' | 'video';
  groupId: string;
  participantIds?: string[];
  settings?: Partial<ChannelSettings>;
  tags?: string[];
}

export interface CreateConferenceData {
  title: string;
  channelId: string;
  hostId: string;
  startTime: Date;
  endTime: Date;
  settings?: Partial<ConferenceSettings>;
}

export interface SendMessageData {
  channelId: string;
  senderId: string;
  content: string;
  type?: 'text' | 'voice' | 'file' | 'system';
  replyTo?: string;
  voiceNoteId?: string;
}

export interface VoiceNoteData {
  channelId: string;
  senderId: string;
  duration: number;
  fileSize: number;
  transcription?: string;
  waveformData?: number[];
  metadata?: Partial<VoiceNoteMetadata>;
}

export interface ScreenShareData {
  conferenceId: string;
  presenterId: string;
  title?: string;
  settings?: Partial<ScreenShareSettings>;
}

// Export main collaboration types
export {
  type CollaborationUser,
  type CollaborationSession,
  type DocumentChange,
  type Comment,
  type ConflictResolution
} from '../services/collaborationService';