import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createCharacterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().default(''),
  avatar: z.string().url().optional(),
  traits: z.record(z.any()).default({}),
  arc: z.record(z.any()).default({}),
  relationships: z.record(z.any()).default({}),
  backstory: z.string().default(''),
  motivation: z.string().default(''),
  conflict: z.string().default(''),
  tags: z.array(z.string()).default([]),
  projectId: z.string().cuid(),
});

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  avatar: z.string().url().optional(),
  traits: z.record(z.any()).optional(),
  arc: z.record(z.any()).optional(),
  relationships: z.record(z.any()).optional(),
  backstory: z.string().optional(),
  motivation: z.string().optional(),
  conflict: z.string().optional(),
  tags: z.array(z.string()).optional(),
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

// Get characters for a project
router.get('/project/:projectId', asyncHandler(async (req: AuthRequest, res) => {
  const project = await checkProjectAccess(req.params.projectId, req.user!.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const { search, tag, limit = '50', offset = '0' } = req.query;

  const where: any = { projectId: req.params.projectId };
  
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const characters = await prisma.character.findMany({
    where,
    include: {
      _count: {
        select: {
          scenes: true,
          timelineEntries: true,
        }
      }
    },
    orderBy: { name: 'asc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.character.count({ where });

  res.json({
    success: true,
    data: { 
      characters,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + characters.length
      }
    }
  });
}));

// Get single character
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id },
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
        include: {
          scene: {
            select: {
              id: true,
              title: true,
              summary: true,
              order: true,
              story: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          scene: {
            order: 'asc'
          }
        }
      },
      timelineEntries: {
        include: {
          timeline: {
            select: { id: true, name: true }
          }
        },
        orderBy: { date: 'asc' }
      },
      comments: {
        include: {
          user: {
            select: { id: true, username: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          scenes: true,
          timelineEntries: true,
        }
      }
    }
  });

  if (!character) {
    return res.status(404).json({
      success: false,
      error: { message: 'Character not found' }
    });
  }

  // Check access
  const hasAccess = character.project.ownerId === req.user!.id ||
                   character.project.collaborators.length > 0;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  res.json({
    success: true,
    data: { character }
  });
}));

// Create new character
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = createCharacterSchema.parse(req.body);

  const project = await checkProjectAccess(validatedData.projectId, req.user!.id, true);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const character = await prisma.character.create({
    data: validatedData,
    include: {
      _count: {
        select: {
          scenes: true,
          timelineEntries: true,
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { character }
  });
}));

// Update character
router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = updateCharacterSchema.parse(req.body);

  const existingCharacter = await prisma.character.findUnique({
    where: { id: req.params.id },
    include: {
      project: {
        select: {
          ownerId: true,
          collaborators: {
            where: { userId: req.user!.id },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!existingCharacter) {
    return res.status(404).json({
      success: false,
      error: { message: 'Character not found' }
    });
  }

  // Check permissions
  const hasEditAccess = existingCharacter.project.ownerId === req.user!.id ||
                       existingCharacter.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const character = await prisma.character.update({
    where: { id: req.params.id },
    data: validatedData,
    include: {
      _count: {
        select: {
          scenes: true,
          timelineEntries: true,
        }
      }
    }
  });

  res.json({
    success: true,
    data: { character }
  });
}));

// Delete character
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id },
    include: {
      project: {
        select: {
          ownerId: true,
          collaborators: {
            where: { userId: req.user!.id },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!character) {
    return res.status(404).json({
      success: false,
      error: { message: 'Character not found' }
    });
  }

  // Check permissions
  const hasDeleteAccess = character.project.ownerId === req.user!.id ||
                         character.project.collaborators.some(c => c.role === 'editor');

  if (!hasDeleteAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  await prisma.character.delete({
    where: { id: req.params.id }
  });

  res.json({
    success: true,
    data: { message: 'Character deleted successfully' }
  });
}));

// Get character appearances in scenes
router.get('/:id/appearances', asyncHandler(async (req: AuthRequest, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id },
    include: {
      project: {
        select: {
          ownerId: true,
          collaborators: {
            where: { userId: req.user!.id }
          }
        }
      }
    }
  });

  if (!character) {
    return res.status(404).json({
      success: false,
      error: { message: 'Character not found' }
    });
  }

  // Check access
  const hasAccess = character.project.ownerId === req.user!.id ||
                   character.project.collaborators.length > 0;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const appearances = await prisma.sceneCharacter.findMany({
    where: { characterId: req.params.id },
    include: {
      scene: {
        select: {
          id: true,
          title: true,
          summary: true,
          order: true,
          wordCount: true,
          status: true,
          story: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }
    },
    orderBy: {
      scene: {
        order: 'asc'
      }
    }
  });

  // Group by story and calculate stats
  const appearancesByStory = appearances.reduce((acc, appearance) => {
    const storyId = appearance.scene.story.id;
    if (!acc[storyId]) {
      acc[storyId] = {
        story: appearance.scene.story,
        scenes: [],
        totalWords: 0,
        roleBreakdown: { present: 0, mentioned: 0, pov: 0 }
      };
    }
    acc[storyId].scenes.push({
      ...appearance.scene,
      role: appearance.role
    });
    acc[storyId].totalWords += appearance.scene.wordCount;
    acc[storyId].roleBreakdown[appearance.role as keyof typeof acc[storyId]['roleBreakdown']]++;
    return acc;
  }, {} as any);

  res.json({
    success: true,
    data: { 
      appearances: Object.values(appearancesByStory),
      totalAppearances: appearances.length,
      totalWords: appearances.reduce((sum, app) => sum + app.scene.wordCount, 0)
    }
  });
}));

export default router;
