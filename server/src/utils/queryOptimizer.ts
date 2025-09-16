import { PrismaClient } from '@prisma/client';

/**
 * Database query optimization utilities
 */

export interface ProjectStatsOptimized {
  storyCount: number;
  sceneCount: number;
  noteCount: number;
  characterCount: number;
  locationCount: number;
  wordCount: number;
}

/**
 * Optimized project statistics aggregation
 * Replaces N+1 queries with efficient aggregations
 */
export const getProjectStats = async (
  prisma: PrismaClient,
  projectId: string
): Promise<ProjectStatsOptimized> => {
  // Single aggregation query instead of multiple includes
  const [
    storyStats,
    sceneStats,
    noteStats,
    characterStats,
    locationStats
  ] = await Promise.all([
    // Story count
    prisma.story.count({ where: { projectId } }),
    
    // Scene count aggregated from all stories
    prisma.scene.count({
      where: { story: { projectId } }
    }),
    
    // Note count  
    prisma.projectNote.count({ where: { projectId } }),
    
    // Character count
    prisma.character.count({ where: { projectId } }),
    
    // Location count
    prisma.location.count({ where: { projectId } })
  ]);

  // Word count aggregation (optimized)
  const wordCountResult = await prisma.scene.aggregate({
    where: { story: { projectId } },
    _sum: { wordCount: true }
  });

  return {
    storyCount: storyStats,
    sceneCount: sceneStats,
    noteCount: noteStats,
    characterCount: characterStats,
    locationCount: locationStats,
    wordCount: wordCountResult._sum.wordCount || 0
  };
};

/**
 * Batch fetch project data with optimized queries
 */
export const getProjectWithOptimizedStats = async (
  prisma: PrismaClient,
  projectId: string,
  userId: string
) => {
  // First verify access
  const hasAccess = await prisma.project.findFirst({
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
    },
    select: { id: true }
  });

  if (!hasAccess) {
    return null;
  }

  // Parallel queries for better performance
  const [project, stats] = await Promise.all([
    // Basic project data with limited includes
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            }
          }
        },
        // Only fetch recent items, not everything
        stories: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        },
        notes: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            type: true,
            updatedAt: true
          }
        }
      }
    }),
    
    // Separate optimized stats query
    getProjectStats(prisma, projectId)
  ]);

  if (!project) {
    return null;
  }

  return {
    ...project,
    stats
  };
};

/**
 * Batch query for multiple projects (for list views)
 */
export const getProjectsWithStats = async (
  prisma: PrismaClient,
  userId: string,
  limit = 20,
  offset = 0
) => {
  // Get project IDs first (lightweight query)
  const projectIds = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: { userId }
          }
        }
      ]
    },
    select: { id: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset
  });

  const ids = projectIds.map(p => p.id);

  // Batch fetch all project data
  const [projects, allStats] = await Promise.all([
    // Basic project data
    prisma.project.findMany({
      where: { id: { in: ids } },
      include: {
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    }),

    // Batch stats for all projects
    Promise.all(ids.map(id => getProjectStats(prisma, id)))
  ]);

  // Combine projects with their stats
  return projects.map((project, index) => ({
    ...project,
    stats: allStats[index]
  }));
};