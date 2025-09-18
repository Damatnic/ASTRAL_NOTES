import express, { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse } from '../types/api.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['planning', 'drafting', 'revising', 'completed']).default('planning'),
  targetWords: z.number().min(0).optional(),
  projectId: z.string().cuid(),
});

const updateStorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'drafting', 'revising', 'completed']).optional(),
  targetWords: z.number().min(0).optional(),
  order: z.number().min(0).optional(),
});

const reorderStoriesSchema = z.object({
  storyOrders: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().min(0)
  }))
});

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string, requireEdit = false) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: {
              userId: userId,
              ...(requireEdit ? { role: 'editor' } : {})
            }
          }
        }
      ]
    }
  });
  return project;
}

// Get stories for a project
router.get('/project/:projectId', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const projectId = req.params.projectId;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Project ID is required' }
    });
  }
  
  const project = await checkProjectAccess(projectId, req.user!.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const stories = await prisma.story.findMany({
    where: { projectId: projectId },
    include: {
      _count: {
        select: {
          scenes: true,
          notes: true,
          chapters: true,
        }
      }
    },
    orderBy: { order: 'asc' }
  });

  res.json({
    success: true,
    data: { stories }
  });
}));

// Get single story
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Story ID is required' }
    });
  }
  
  const story = await prisma.story.findUnique({
    where: { id: id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          collaborators: {
            where: { userId: req.user!.id },
            select: { role: true }
          }
        }
      },
      scenes: {
        orderBy: { order: 'asc' },
        include: {
          characters: {
            include: {
              character: {
                select: { id: true, name: true, avatar: true }
              }
            }
          }
        }
      },
      notes: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
      chapters: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { scenes: true }
          }
        }
      },
      acts: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { scenes: true }
          }
        }
      },
      _count: {
        select: {
          scenes: true,
          notes: true,
        }
      }
    }
  });

  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found' }
    });
  }

  // Check if user has access to the project
  const hasAccess = story.project.ownerId === req.user!.id || 
                   story.project.collaborators.length > 0;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  res.json({
    success: true,
    data: { story }
  });
}));

// Create new story
router.post('/', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const validatedData = createStorySchema.parse(req.body);

  const project = await checkProjectAccess(validatedData.projectId, req.user!.id, true);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  // Get the next order number
  const lastStory = await prisma.story.findFirst({
    where: { projectId: validatedData.projectId },
    orderBy: { order: 'desc' }
  });

  const story = await prisma.story.create({
    data: {
      ...validatedData,
      order: (lastStory?.order ?? -1) + 1,
    },
    include: {
      _count: {
        select: {
          scenes: true,
          notes: true,
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { story }
  });
}));

// Update story
router.patch('/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Story ID is required' }
    });
  }
  
  const validatedData = updateStorySchema.parse(req.body);

  const existingStory = await prisma.story.findUnique({
    where: { id: id },
    include: {
      project: {
        select: {
          id: true,
          ownerId: true,
          collaborators: {
            where: { userId: req.user!.id },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!existingStory) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found' }
    });
  }

  // Check permissions
  const hasEditAccess = existingStory.project.ownerId === req.user!.id ||
                       existingStory.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const story = await prisma.story.update({
    where: { id: req.params.id },
    data: validatedData,
    include: {
      _count: {
        select: {
          scenes: true,
          notes: true,
        }
      }
    }
  });

  res.json({
    success: true,
    data: { story }
  });
}));

// Reorder stories
router.patch('/project/:projectId/reorder', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const projectId = req.params.projectId;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Project ID is required' }
    });
  }
  
  const validatedData = reorderStoriesSchema.parse(req.body);

  const project = await checkProjectAccess(projectId, req.user!.id, true);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  // Update story orders in a transaction
  await prisma.$transaction(
    validatedData.storyOrders.map(({ id, order }) =>
      prisma.story.update({
        where: { id },
        data: { order }
      })
    )
  );

  const stories = await prisma.story.findMany({
    where: { projectId: projectId },
    include: {
      _count: {
        select: {
          scenes: true,
          notes: true,
        }
      }
    },
    orderBy: { order: 'asc' }
  });

  res.json({
    success: true,
    data: { stories }
  });
}));

// Delete story
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Story ID is required' }
    });
  }
  
  const story = await prisma.story.findUnique({
    where: { id: id },
    include: {
      project: {
        select: {
          id: true,
          ownerId: true,
          collaborators: {
            where: { userId: req.user!.id },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found' }
    });
  }

  // Check permissions (only owner or editor can delete)
  const hasDeleteAccess = story.project.ownerId === req.user!.id ||
                         story.project.collaborators.some(c => c.role === 'editor');

  if (!hasDeleteAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  await prisma.story.delete({
    where: { id: req.params.id }
  });

  res.json({
    success: true,
    data: { message: 'Story deleted successfully' }
  });
}));

// Get story statistics
router.get('/:id/stats', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Story ID is required' }
    });
  }
  
  const story = await prisma.story.findUnique({
    where: { id: id },
    include: {
      project: {
        select: {
          ownerId: true,
          collaborators: {
            where: { userId: req.user!.id }
          }
        }
      },
      scenes: {
        select: {
          wordCount: true,
          status: true,
          createdAt: true,
        }
      }
    }
  });

  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found' }
    });
  }

  // Check access
  const hasAccess = story.project.ownerId === req.user!.id || 
                   story.project.collaborators.length > 0;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const stats = {
    totalScenes: story.scenes.length,
    totalWords: story.scenes.reduce((sum, scene) => sum + scene.wordCount, 0),
    scenesByStatus: story.scenes.reduce((acc, scene) => {
      acc[scene.status] = (acc[scene.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    progress: story.targetWords ? 
      Math.min(100, (story.wordCount / story.targetWords) * 100) : 0,
    recentActivity: story.scenes
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(scene => ({
        date: scene.createdAt,
        wordCount: scene.wordCount,
        status: scene.status
      }))
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

export default router;
