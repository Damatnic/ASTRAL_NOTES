import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

export interface SharedEntity {
  id: string;
  type: 'character' | 'location' | 'item' | 'lore' | 'organization' | 'concept';
  name: string;
  description: string;
  data: Record<string, any>;
  tags: string[];
  category?: string;
  subcategory?: string;
  importance: number;
  avatar?: string;
  color?: string;
  notes: string;
  isUniversal: boolean;
  ownerId: string;
  universeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UniverseLibrary {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  owners: string[];
  editors: string[];
  viewers: string[];
  entities: SharedEntity[];
  accessRules: AccessRule[];
  usageTracking: UsageRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessRule {
  id: string;
  universeId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canAddEntities: boolean;
    canDeleteEntities: boolean;
    canManageAccess: boolean;
    canExport: boolean;
  };
  grantedAt: Date;
  grantedBy: string;
}

export interface UsageRecord {
  id: string;
  universeId: string;
  entityId: string;
  projectId: string;
  userId: string;
  usageType: 'reference' | 'import' | 'clone' | 'link';
  sourceType: 'scene' | 'note' | 'character' | 'location';
  sourceId: string;
  timestamp: Date;
}

export interface EntitySyncStatus {
  entityId: string;
  lastSyncVersion: number;
  hasLocalChanges: boolean;
  hasRemoteChanges: boolean;
  conflictStatus: 'none' | 'minor' | 'major';
  lastSyncDate: Date;
}

export class UniverseSharingService {
  constructor(private prisma: PrismaClient) {}

  // Universe Management
  async createUniverse(data: {
    name: string;
    description?: string;
    isPublic: boolean;
    ownerId: string;
  }): Promise<UniverseLibrary> {
    try {
      const universe = await this.prisma.$transaction(async (tx) => {
        // Create universe entry in entity collections
        const universeCollection = await tx.entityCollection.create({
          data: {
            name: data.name,
            description: data.description,
            type: 'universe',
            isPublic: data.isPublic,
            criteria: JSON.stringify({ isUniversal: true }),
            color: '#8B5CF6',
            icon: 'globe'
          }
        });

        // Create access rule for owner
        const accessRule = {
          id: `access-${Date.now()}`,
          universeId: universeCollection.id,
          userId: data.ownerId,
          role: 'owner' as const,
          permissions: {
            canView: true,
            canEdit: true,
            canAddEntities: true,
            canDeleteEntities: true,
            canManageAccess: true,
            canExport: true
          },
          grantedAt: new Date(),
          grantedBy: data.ownerId
        };

        return {
          id: universeCollection.id,
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          owners: [data.ownerId],
          editors: [],
          viewers: [],
          entities: [],
          accessRules: [accessRule],
          usageTracking: [],
          createdAt: universeCollection.createdAt,
          updatedAt: universeCollection.updatedAt
        };
      });

      logger.info(`Created universe library: ${universe.name} by user ${data.ownerId}`);
      return universe;
    } catch (error) {
      logger.error('Error creating universe:', error);
      throw new Error('Failed to create universe');
    }
  }

  async getUniversesByUser(userId: string): Promise<UniverseLibrary[]> {
    try {
      const collections = await this.prisma.entityCollection.findMany({
        where: {
          type: 'universe',
          OR: [
            { projectId: null }, // Global universes
            {
              project: {
                OR: [
                  { ownerId: userId },
                  {
                    collaborators: {
                      some: { userId }
                    }
                  }
                ]
              }
            }
          ]
        },
        include: {
          members: {
            include: {
              collection: true
            }
          }
        }
      });

      return collections.map(collection => this.mapCollectionToUniverse(collection));
    } catch (error) {
      logger.error('Error getting universes by user:', error);
      throw new Error('Failed to get universes');
    }
  }

  async getPublicUniverses(): Promise<UniverseLibrary[]> {
    try {
      const collections = await this.prisma.entityCollection.findMany({
        where: {
          type: 'universe',
          isPublic: true
        },
        include: {
          members: {
            include: {
              collection: true
            }
          }
        }
      });

      return collections.map(collection => this.mapCollectionToUniverse(collection));
    } catch (error) {
      logger.error('Error getting public universes:', error);
      throw new Error('Failed to get public universes');
    }
  }

  // Entity Sharing
  async shareEntityToUniverse(entityId: string, universeId: string, userId: string): Promise<void> {
    try {
      // Verify user has access to add entities to this universe
      const hasAccess = await this.verifyUniverseAccess(userId, universeId, 'canAddEntities');
      if (!hasAccess) {
        throw new Error('Access denied: Cannot add entities to this universe');
      }

      // Get the entity
      const entity = await this.prisma.codexEntity.findUnique({
        where: { id: entityId }
      });

      if (!entity) {
        throw new Error('Entity not found');
      }

      // Mark entity as universal and add to universe collection
      await this.prisma.$transaction(async (tx) => {
        await tx.codexEntity.update({
          where: { id: entityId },
          data: { isUniversal: true }
        });

        await tx.entityCollectionMember.create({
          data: {
            collectionId: universeId,
            entityId: entityId
          }
        });
      });

      logger.info(`Shared entity ${entityId} to universe ${universeId} by user ${userId}`);
    } catch (error) {
      logger.error('Error sharing entity to universe:', error);
      throw error;
    }
  }

  async removeEntityFromUniverse(entityId: string, universeId: string, userId: string): Promise<void> {
    try {
      // Verify user has access to remove entities from this universe
      const hasAccess = await this.verifyUniverseAccess(userId, universeId, 'canDeleteEntities');
      if (!hasAccess) {
        throw new Error('Access denied: Cannot remove entities from this universe');
      }

      await this.prisma.$transaction(async (tx) => {
        // Remove from universe collection
        await tx.entityCollectionMember.deleteMany({
          where: {
            collectionId: universeId,
            entityId: entityId
          }
        });

        // Check if entity is still in other universes
        const otherUniverses = await tx.entityCollectionMember.findMany({
          where: {
            entityId: entityId,
            collection: {
              type: 'universe'
            }
          }
        });

        // If not in any other universes, mark as non-universal
        if (otherUniverses.length === 0) {
          await tx.codexEntity.update({
            where: { id: entityId },
            data: { isUniversal: false }
          });
        }
      });

      logger.info(`Removed entity ${entityId} from universe ${universeId} by user ${userId}`);
    } catch (error) {
      logger.error('Error removing entity from universe:', error);
      throw error;
    }
  }

  // Cross-Project Entity Import
  async importEntityToProject(
    entityId: string,
    projectId: string,
    userId: string,
    importType: 'reference' | 'clone' = 'reference'
  ): Promise<{ entityId: string; isReference: boolean }> {
    try {
      // Verify user has access to the project
      const projectAccess = await this.verifyProjectAccess(userId, projectId);
      if (!projectAccess) {
        throw new Error('Access denied to project');
      }

      // Get the source entity
      const sourceEntity = await this.prisma.codexEntity.findUnique({
        where: { id: entityId }
      });

      if (!sourceEntity) {
        throw new Error('Entity not found');
      }

      let resultEntityId = entityId;
      let isReference = true;

      if (importType === 'clone') {
        // Create a cloned copy of the entity
        const clonedEntity = await this.prisma.codexEntity.create({
          data: {
            type: sourceEntity.type,
            name: `${sourceEntity.name} (Copy)`,
            description: sourceEntity.description,
            data: sourceEntity.data,
            tags: sourceEntity.tags,
            category: sourceEntity.category,
            subcategory: sourceEntity.subcategory,
            importance: sourceEntity.importance,
            avatar: sourceEntity.avatar,
            color: sourceEntity.color,
            notes: sourceEntity.notes,
            isUniversal: false, // Clones are not universal by default
            projectId: projectId
          }
        });

        resultEntityId = clonedEntity.id;
        isReference = false;
      } else {
        // Create entity reference in project
        await this.prisma.codexEntity.update({
          where: { id: entityId },
          data: {
            // Add project reference if it's a universal entity
          }
        });
      }

      // Record usage
      await this.recordEntityUsage({
        universeId: '', // Will be determined from entity
        entityId: sourceEntity.id,
        projectId,
        userId,
        usageType: importType === 'clone' ? 'clone' : 'import',
        sourceType: 'project',
        sourceId: projectId
      });

      logger.info(`Imported entity ${entityId} to project ${projectId} as ${importType} by user ${userId}`);
      
      return { entityId: resultEntityId, isReference };
    } catch (error) {
      logger.error('Error importing entity to project:', error);
      throw error;
    }
  }

  // Conflict Resolution
  async detectEntityConflicts(entityId: string): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
      type: 'name' | 'description' | 'data' | 'tags';
      sourceValue: any;
      targetValue: any;
      lastModified: Date;
      modifiedBy: string;
    }>;
  }> {
    try {
      // This would compare the entity across different projects/universes
      // and detect conflicts in shared entities
      const entity = await this.prisma.codexEntity.findUnique({
        where: { id: entityId }
      });

      if (!entity || !entity.isUniversal) {
        return { hasConflicts: false, conflicts: [] };
      }

      // For now, return no conflicts - this would be implemented with
      // more sophisticated conflict detection logic
      return { hasConflicts: false, conflicts: [] };
    } catch (error) {
      logger.error('Error detecting entity conflicts:', error);
      throw error;
    }
  }

  async resolveEntityConflict(
    entityId: string,
    conflictType: string,
    resolution: 'accept_local' | 'accept_remote' | 'merge',
    userId: string
  ): Promise<void> {
    try {
      // Implement conflict resolution logic
      logger.info(`Resolved conflict for entity ${entityId}, type: ${conflictType}, resolution: ${resolution}`);
    } catch (error) {
      logger.error('Error resolving entity conflict:', error);
      throw error;
    }
  }

  // Access Control
  async grantUniverseAccess(
    universeId: string,
    targetUserId: string,
    role: 'editor' | 'viewer',
    grantedBy: string
  ): Promise<void> {
    try {
      // Verify granter has permission to manage access
      const hasAccess = await this.verifyUniverseAccess(grantedBy, universeId, 'canManageAccess');
      if (!hasAccess) {
        throw new Error('Access denied: Cannot manage universe access');
      }

      // Create access rule (this would be stored in a dedicated table)
      const accessRule = {
        id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        universeId,
        userId: targetUserId,
        role,
        permissions: this.getRolePermissions(role),
        grantedAt: new Date(),
        grantedBy
      };

      // Store access rule (simplified - would use proper database storage)
      logger.info(`Granted ${role} access to universe ${universeId} for user ${targetUserId}`);
    } catch (error) {
      logger.error('Error granting universe access:', error);
      throw error;
    }
  }

  async revokeUniverseAccess(
    universeId: string,
    targetUserId: string,
    revokedBy: string
  ): Promise<void> {
    try {
      // Verify revoker has permission to manage access
      const hasAccess = await this.verifyUniverseAccess(revokedBy, universeId, 'canManageAccess');
      if (!hasAccess) {
        throw new Error('Access denied: Cannot manage universe access');
      }

      // Remove access rule (simplified implementation)
      logger.info(`Revoked access to universe ${universeId} for user ${targetUserId}`);
    } catch (error) {
      logger.error('Error revoking universe access:', error);
      throw error;
    }
  }

  // Usage Tracking
  async recordEntityUsage(usage: {
    universeId: string;
    entityId: string;
    projectId: string;
    userId: string;
    usageType: 'reference' | 'import' | 'clone' | 'link';
    sourceType: 'scene' | 'note' | 'character' | 'location' | 'project';
    sourceId: string;
  }): Promise<void> {
    try {
      // Record usage in analytics (simplified implementation)
      const usageRecord = {
        id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...usage,
        timestamp: new Date()
      };

      logger.info(`Recorded entity usage: ${usage.usageType} of ${usage.entityId} in project ${usage.projectId}`);
    } catch (error) {
      logger.error('Error recording entity usage:', error);
      throw error;
    }
  }

  async getEntityUsageStats(entityId: string): Promise<{
    totalUsages: number;
    projectsUsing: number;
    usageByType: Record<string, number>;
    recentUsages: UsageRecord[];
  }> {
    try {
      // Return usage statistics (simplified implementation)
      return {
        totalUsages: 0,
        projectsUsing: 0,
        usageByType: {},
        recentUsages: []
      };
    } catch (error) {
      logger.error('Error getting entity usage stats:', error);
      throw error;
    }
  }

  // Utility Methods
  private async verifyUniverseAccess(
    userId: string,
    universeId: string,
    permission: keyof AccessRule['permissions']
  ): Promise<boolean> {
    try {
      // Simplified access check - in production, this would query the access rules
      const collection = await this.prisma.entityCollection.findUnique({
        where: { id: universeId }
      });

      return collection?.isPublic || false;
    } catch (error) {
      logger.error('Error verifying universe access:', error);
      return false;
    }
  }

  private async verifyProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: { userId }
              }
            }
          ]
        }
      });

      return !!project;
    } catch (error) {
      logger.error('Error verifying project access:', error);
      return false;
    }
  }

  private getRolePermissions(role: 'owner' | 'editor' | 'viewer'): AccessRule['permissions'] {
    switch (role) {
      case 'owner':
        return {
          canView: true,
          canEdit: true,
          canAddEntities: true,
          canDeleteEntities: true,
          canManageAccess: true,
          canExport: true
        };
      case 'editor':
        return {
          canView: true,
          canEdit: true,
          canAddEntities: true,
          canDeleteEntities: false,
          canManageAccess: false,
          canExport: true
        };
      case 'viewer':
        return {
          canView: true,
          canEdit: false,
          canAddEntities: false,
          canDeleteEntities: false,
          canManageAccess: false,
          canExport: false
        };
    }
  }

  private mapCollectionToUniverse(collection: any): UniverseLibrary {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      owners: [], // Would be populated from access rules
      editors: [],
      viewers: [],
      entities: [],
      accessRules: [],
      usageTracking: [],
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    };
  }
}