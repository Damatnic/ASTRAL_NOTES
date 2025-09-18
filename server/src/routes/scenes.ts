import express, { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse } from '../types/api.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createSceneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().default(''),
  summary: z.string().optional(),
  status: z.enum(['outline', 'draft', 'revision', 'complete']).default('draft'),
  povCharacter: z.string().optional(),
  location: z.string().optional(),
  timeOfDay: z.string().optional(),
  date: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  storyId: z.string().cuid(),
  chapterId: z.string().cuid().optional(),
  actId: z.string().cuid().optional(),
});

const updateSceneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  status: z.enum(['outline', 'draft', 'revision', 'complete']).optional(),
  povCharacter: z.string().optional(),
  location: z.string().optional(),
  timeOfDay: z.string().optional(),
  date: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  order: z.number().min(0).optional(),
  chapterId: z.string().cuid().optional(),
  actId: z.string().cuid().optional(),
});

const reorderScenesSchema = z.object({
  sceneOrders: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().min(0)
  }))
});

const addCharacterSchema = z.object({
  characterId: z.string().cuid(),
  role: z.enum(['present', 'mentioned', 'pov']).default('present')
});

const addDependencySchema = z.object({
  dependentSceneId: z.string().cuid(),
  type: z.enum(['follows', 'requires', 'blocks']).default('follows'),
  description: z.string().optional()
});

// Helper function to calculate word count
function calculateWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to check story access
async function checkStoryAccess(storyId: string, userId: string, requireEdit = false) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      project: {
        select: {
          ownerId: true,
          collaborators: {
            where: { userId },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!story) return null;

  const hasAccess = story.project.ownerId === userId ||
                   story.project.collaborators.length > 0;
  
  const hasEditAccess = story.project.ownerId === userId ||
                       story.project.collaborators.some(c => c.role === 'editor');

  if (!hasAccess || (requireEdit && !hasEditAccess)) return null;

  return story;
}

// Get scenes for a story
router.get('/story/:storyId', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const storyId = req.params.storyId;
  if (!storyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Story ID is required' }
    });
  }
  
  const story = await checkStoryAccess(storyId, req.user!.id);
  
  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found or insufficient permissions' }
    });
  }

  const scenes = await prisma.scene.findMany({
    where: { storyId: storyId },
    include: {
      characters: {
        include: {
          character: {
            select: { id: true, name: true, avatar: true }
          }
        }
      },
      chapter: {
        select: { id: true, title: true, order: true }
      },
      act: {
        select: { id: true, title: true, order: true }
      },
      dependencies: {
        include: {
          dependentScene: {
            select: { id: true, title: true }
          }
        }
      },
      dependents: {
        include: {
          scene: {
            select: { id: true, title: true }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  });

  res.json({
    success: true,
    data: { scenes }
  });
}));

// Get single scene
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene ID is required' }
    });
  }
  
  const scene = await prisma.scene.findUnique({
    where: { id: id },
    include: {
      story: {
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
      },
      characters: {
        include: {
          character: {
            select: { id: true, name: true, avatar: true, traits: true }
          }
        }
      },
      chapter: {
        select: { id: true, title: true, order: true }
      },
      act: {
        select: { id: true, title: true, order: true }
      },
      dependencies: {
        include: {
          dependentScene: {
            select: { id: true, title: true, summary: true }
          }
        }
      },
      dependents: {
        include: {
          scene: {
            select: { id: true, title: true, summary: true }
          }
        }
      },
      timelineEntries: {
        include: {
          timeline: {
            select: { id: true, name: true }
          }
        }
      },
      comments: {
        include: {
          user: {
            select: { id: true, username: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // Check access
  const hasAccess = scene.story.project.ownerId === req.user!.id ||
                   scene.story.project.collaborators.length > 0;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  res.json({
    success: true,
    data: { scene }
  });
}));

// Create new scene
router.post('/', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const validatedData = createSceneSchema.parse(req.body);

  const story = await checkStoryAccess(validatedData.storyId, req.user!.id, true);
  
  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found or insufficient permissions' }
    });
  }

  // Get the next order number
  const lastScene = await prisma.scene.findFirst({
    where: { storyId: validatedData.storyId },
    orderBy: { order: 'desc' }
  });

  const wordCount = calculateWordCount(validatedData.content);

  const scene = await prisma.scene.create({
    data: {
      ...validatedData,
      tags: JSON.stringify(validatedData.tags || []),
      date: validatedData.date ? new Date(validatedData.date) : undefined,
      wordCount,
      order: (lastScene?.order ?? -1) + 1,
    },
    include: {
      characters: {
        include: {
          character: {
            select: { id: true, name: true, avatar: true }
          }
        }
      },
      chapter: {
        select: { id: true, title: true, order: true }
      },
      act: {
        select: { id: true, title: true, order: true }
      }
    }
  });

  // Update story word count
  await prisma.story.update({
    where: { id: validatedData.storyId },
    data: {
      wordCount: {
        increment: wordCount
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { scene }
  });
}));

// Update scene
router.patch('/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene ID is required' }
    });
  }
  
  const validatedData = updateSceneSchema.parse(req.body);

  const existingScene = await prisma.scene.findUnique({
    where: { id: id },
    include: {
      story: {
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
      }
    }
  });

  if (!existingScene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // Check permissions
  const hasEditAccess = existingScene.story.project.ownerId === req.user!.id ||
                       existingScene.story.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const updateData: any = { ...validatedData };
  
  if (validatedData.tags) {
    updateData.tags = JSON.stringify(validatedData.tags);
  }
  
  // Calculate new word count if content is being updated
  if (validatedData.content !== undefined) {
    const newWordCount = calculateWordCount(validatedData.content);
    const wordCountDiff = newWordCount - existingScene.wordCount;
    
    updateData.wordCount = newWordCount;
    
    // Update story word count
    await prisma.story.update({
      where: { id: existingScene.storyId },
      data: {
        wordCount: {
          increment: wordCountDiff
        }
      }
    });
  }

  if (validatedData.date) {
    updateData.date = new Date(validatedData.date);
  }

  const scene = await prisma.scene.update({
    where: { id: id },
    data: updateData,
    include: {
      characters: {
        include: {
          character: {
            select: { id: true, name: true, avatar: true }
          }
        }
      },
      chapter: {
        select: { id: true, title: true, order: true }
      },
      act: {
        select: { id: true, title: true, order: true }
      }
    }
  });

  res.json({
    success: true,
    data: { scene }
  });
}));

// Reorder scenes
router.patch('/story/:storyId/reorder', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const storyId = req.params.storyId;
  if (!storyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Story ID is required' }
    });
  }
  
  const validatedData = reorderScenesSchema.parse(req.body);

  const story = await checkStoryAccess(storyId, req.user!.id, true);
  
  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found or insufficient permissions' }
    });
  }

  // Update scene orders in a transaction
  await prisma.$transaction(
    validatedData.sceneOrders.map(({ id, order }) =>
      prisma.scene.update({
        where: { id },
        data: { order }
      })
    )
  );

  const scenes = await prisma.scene.findMany({
    where: { storyId: storyId },
    include: {
      characters: {
        include: {
          character: {
            select: { id: true, name: true, avatar: true }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  });

  res.json({
    success: true,
    data: { scenes }
  });
}));

// Add character to scene
router.post('/:id/characters', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene ID is required' }
    });
  }
  
  const validatedData = addCharacterSchema.parse(req.body);

  const scene = await prisma.scene.findUnique({
    where: { id: id },
    include: {
      story: {
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
      }
    }
  });

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // Check permissions
  const hasEditAccess = scene.story.project.ownerId === req.user!.id ||
                       scene.story.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const sceneCharacter = await prisma.sceneCharacter.create({
    data: {
      sceneId: id,
      characterId: validatedData.characterId,
      role: validatedData.role,
    },
    include: {
      character: {
        select: { id: true, name: true, avatar: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { sceneCharacter }
  });
}));

// Remove character from scene
router.delete('/:id/characters/:characterId', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  const characterId = req.params.characterId;
  if (!id || !characterId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene ID and Character ID are required' }
    });
  }
  
  const scene = await prisma.scene.findUnique({
    where: { id: id },
    include: {
      story: {
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
      }
    }
  });

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // Check permissions
  const hasEditAccess = scene.story.project.ownerId === req.user!.id ||
                       scene.story.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  await prisma.sceneCharacter.delete({
    where: {
      sceneId_characterId: {
        sceneId: id,
        characterId: characterId
      }
    }
  });

  res.json({
    success: true,
    data: { message: 'Character removed from scene' }
  });
}));

// Add scene dependency
router.post('/:id/dependencies', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene ID is required' }
    });
  }
  
  const validatedData = addDependencySchema.parse(req.body);

  const scene = await prisma.scene.findUnique({
    where: { id: id },
    include: {
      story: {
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
      }
    }
  });

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // Check permissions
  const hasEditAccess = scene.story.project.ownerId === req.user!.id ||
                       scene.story.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const dependency = await prisma.sceneDependency.create({
    data: {
      sceneId: id,
      dependentSceneId: validatedData.dependentSceneId,
      type: validatedData.type,
      description: validatedData.description,
    },
    include: {
      dependentScene: {
        select: { id: true, title: true, summary: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { dependency }
  });
}));

// Delete scene
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene ID is required' }
    });
  }
  
  const scene = await prisma.scene.findUnique({
    where: { id: id },
    include: {
      story: {
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
      }
    }
  });

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // Check permissions
  const hasEditAccess = scene.story.project.ownerId === req.user!.id ||
                       scene.story.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  // Update story word count
  await prisma.story.update({
    where: { id: scene.storyId },
    data: {
      wordCount: {
        decrement: scene.wordCount
      }
    }
  });

  await prisma.scene.delete({
    where: { id: id }
  });

  res.json({
    success: true,
    data: { message: 'Scene deleted successfully' }
  });
}));

export default router;
