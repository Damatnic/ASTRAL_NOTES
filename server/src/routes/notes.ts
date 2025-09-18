import express, { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse } from '../types/api.js';
import { GeneralNoteWhereClause, validateQueryParams } from '../types/database.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createGeneralNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().default(''),
  type: z.enum(['general', 'research', 'idea', 'reference']).default('general'),
  tags: z.array(z.string()).default([]),
});

const createProjectNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().default(''),
  type: z.enum(['general', 'worldbuilding', 'series_bible', 'research']).default('general'),
  tags: z.array(z.string()).default([]),
  projectId: z.string().cuid(),
});

const createStoryNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().default(''),
  type: z.enum(['general', 'plot', 'character', 'research']).default('general'),
  tags: z.array(z.string()).default([]),
  storyId: z.string().cuid(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  type: z.string().optional(),
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

// Get general notes for current user
router.get('/general', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const { type, tag, search } = req.query;
  const { limit, offset } = validateQueryParams(req.query);

  const where: any = { userId: req.user!.id };
  
  if (type && typeof type === 'string') {
    where.type = type;
  }
  
  if (tag && typeof tag === 'string') {
    where.tags = { contains: tag, mode: 'insensitive' };
  }
  
  if (search && typeof search === 'string') {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  const notes = await prisma.generalNote.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.generalNote.count({ where });

  res.json({
    success: true,
    data: { 
      notes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + notes.length
      }
    }
  });
}));

// Get project notes
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

  const { type, tag, search, limit = '50', offset = '0' } = req.query;

  const where: any = { projectId: projectId };
  
  if (type) where.type = type;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { content: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const notes = await prisma.projectNote.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.projectNote.count({ where });

  res.json({
    success: true,
    data: { 
      notes,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + notes.length
      }
    }
  });
}));

// Get story notes
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

  const { type, tag, search, limit = '50', offset = '0' } = req.query;

  const where: any = { storyId: storyId };
  
  if (type) where.type = type;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { content: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const notes = await prisma.storyNote.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.storyNote.count({ where });

  res.json({
    success: true,
    data: { 
      notes,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + notes.length
      }
    }
  });
}));

// Get single note (any type)
router.get('/:type/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const { type, id } = req.params;
  
  if (!type || !id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Type and ID are required' }
    });
  }

  let note;
  let hasAccess = false;

  switch (type) {
    case 'general':
      note = await prisma.generalNote.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, username: true }
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
      hasAccess = note?.userId === req.user!.id;
      break;

    case 'project':
      note = await prisma.projectNote.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              ownerId: true,
              collaborators: {
                where: { userId: req.user!.id }
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
      hasAccess = note?.project.ownerId === req.user!.id ||
                 (note?.project.collaborators.length ?? 0) > 0;
      break;

    case 'story':
      note = await prisma.storyNote.findUnique({
        where: { id },
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
      hasAccess = note?.story.project.ownerId === req.user!.id ||
                 (note?.story.project.collaborators.length ?? 0) > 0;
      break;

    default:
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid note type' }
      });
  }

  if (!note || !hasAccess) {
    return res.status(404).json({
      success: false,
      error: { message: 'Note not found or insufficient permissions' }
    });
  }

  res.json({
    success: true,
    data: { note }
  });
}));

// Create general note
router.post('/general', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const validatedData = createGeneralNoteSchema.parse(req.body);

  const note = await prisma.generalNote.create({
    data: {
      ...validatedData,
      tags: JSON.stringify(validatedData.tags || []),
      userId: req.user!.id,
    }
  });

  res.status(201).json({
    success: true,
    data: { note }
  });
}));

// Create project note
router.post('/project', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const validatedData = createProjectNoteSchema.parse(req.body);

  const project = await checkProjectAccess(validatedData.projectId, req.user!.id, true);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const note = await prisma.projectNote.create({
    data: {
      ...validatedData,
      tags: JSON.stringify(validatedData.tags || [])
    }
  });

  res.status(201).json({
    success: true,
    data: { note }
  });
}));

// Create story note
router.post('/story', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const validatedData = createStoryNoteSchema.parse(req.body);

  const story = await checkStoryAccess(validatedData.storyId, req.user!.id, true);
  
  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found or insufficient permissions' }
    });
  }

  const note = await prisma.storyNote.create({
    data: {
      ...validatedData,
      tags: JSON.stringify(validatedData.tags || [])
    }
  });

  res.status(201).json({
    success: true,
    data: { note }
  });
}));

// Update note (any type)
router.patch('/:type/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const { type, id } = req.params;
  
  if (!type || !id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Type and ID are required' }
    });
  }
  const validatedData = updateNoteSchema.parse(req.body);

  let updatedNote;
  let hasEditAccess = false;

  switch (type) {
    case 'general':
      const generalNote = await prisma.generalNote.findUnique({
        where: { id }
      });
      hasEditAccess = generalNote?.userId === req.user!.id;
      
      if (hasEditAccess) {
        const updateData: any = { ...validatedData };
        if (validatedData.tags) {
          updateData.tags = JSON.stringify(validatedData.tags);
        }
        updatedNote = await prisma.generalNote.update({
          where: { id },
          data: updateData
        });
      }
      break;

    case 'project':
      const projectNote = await prisma.projectNote.findUnique({
        where: { id },
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
      hasEditAccess = projectNote?.project.ownerId === req.user!.id ||
                     projectNote?.project.collaborators.some(c => c.role === 'editor') || false;
      
      if (hasEditAccess) {
        const updateData: any = { ...validatedData };
        if (validatedData.tags) {
          updateData.tags = JSON.stringify(validatedData.tags);
        }
        updatedNote = await prisma.projectNote.update({
          where: { id },
          data: updateData
        });
      }
      break;

    case 'story':
      const storyNote = await prisma.storyNote.findUnique({
        where: { id },
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
      hasEditAccess = storyNote?.story.project.ownerId === req.user!.id ||
                     storyNote?.story.project.collaborators.some(c => c.role === 'editor') || false;
      
      if (hasEditAccess) {
        const updateData: any = { ...validatedData };
        if (validatedData.tags) {
          updateData.tags = JSON.stringify(validatedData.tags);
        }
        updatedNote = await prisma.storyNote.update({
          where: { id },
          data: updateData
        });
      }
      break;

    default:
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid note type' }
      });
  }

  if (!hasEditAccess) {
    return res.status(404).json({
      success: false,
      error: { message: 'Note not found or insufficient permissions' }
    });
  }

  res.json({
    success: true,
    data: { note: updatedNote }
  });
}));

// Delete note (any type)
router.delete('/:type/:id', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const { type, id } = req.params;
  
  if (!type || !id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Type and ID are required' }
    });
  }

  let hasDeleteAccess = false;

  switch (type) {
    case 'general':
      const generalNote = await prisma.generalNote.findUnique({
        where: { id }
      });
      hasDeleteAccess = generalNote?.userId === req.user!.id;
      
      if (hasDeleteAccess) {
        await prisma.generalNote.delete({ where: { id } });
      }
      break;

    case 'project':
      const projectNote = await prisma.projectNote.findUnique({
        where: { id },
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
      hasDeleteAccess = projectNote?.project.ownerId === req.user!.id ||
                       projectNote?.project.collaborators.some(c => c.role === 'editor') || false;
      
      if (hasDeleteAccess) {
        await prisma.projectNote.delete({ where: { id } });
      }
      break;

    case 'story':
      const storyNote = await prisma.storyNote.findUnique({
        where: { id },
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
      hasDeleteAccess = storyNote?.story.project.ownerId === req.user!.id ||
                       storyNote?.story.project.collaborators.some(c => c.role === 'editor') || false;
      
      if (hasDeleteAccess) {
        await prisma.storyNote.delete({ where: { id } });
      }
      break;

    default:
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid note type' }
      });
  }

  if (!hasDeleteAccess) {
    return res.status(404).json({
      success: false,
      error: { message: 'Note not found or insufficient permissions' }
    });
  }

  res.json({
    success: true,
    data: { message: 'Note deleted successfully' }
  });
}));

export default router;
