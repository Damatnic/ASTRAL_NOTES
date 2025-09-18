/**
 * Attachment Components Index
 * Central export for all attachment-related components
 */

export { ProjectSelectorModal } from './ProjectSelectorModal';
export { BulkOrganizationModal } from './BulkOrganizationModal';
export { AttachmentRulesModal } from './AttachmentRulesModal';
export { AttachmentAnalytics } from './AttachmentAnalytics';

// Re-export types from the service for convenience
export type {
  AttachmentRelationship,
  AttachmentSuggestion,
  AttachmentRule,
  AttachmentCondition,
  AttachmentAction,
  BulkAttachmentOperation,
  MigrationConfig,
  AttachmentAnalytics as AttachmentAnalyticsType
} from '@/services/projectAttachmentService';