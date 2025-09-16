import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createTimelineSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  type: z.enum(['story', 'character', 'world', 'narrative']).default('story'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  scale: z.enum(['minutes', 'hours', 'days', 'months', 'years']).default('days'),
  projectId: z.string().cuid().optional(),
  storyId: z.string().cuid().optional(),
});

const updateTimelineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['story', 'character', 'world', 'narrative']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  scale: z.enum(['minutes', 'hours', 'days', 'months', 'years']).optional(),
});

const createTimelineEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['event', 'scene', 'milestone', 'deadline']).default('event'),
  importance: z.number().min(1).max(5).default(1),
  tags: z.array(z.string()).default([]),
  timelineId: z.string().cuid(),
  // Optional entity connections
  sceneId: z.string().cuid().optional(),
  characterId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  itemId: z.string().cuid().optional(),
  plotThreadId: z.string().cuid().optional(),
});

const updateTimelineEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['event', 'scene', 'milestone', 'deadline']).optional(),
  importance: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  sceneId: z.string().cuid().optional(),
  characterId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  itemId: z.string().cuid().optional(),
  plotThreadId: z.string().cuid().optional(),
});

// Helper functions for access control
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

async function checkTimelineAccess(timelineId: string, userId: string, requireEdit = false) {
  const timeline = await prisma.timeline.findUnique({
    where: { id: timelineId },
    include: {
      project: {
        select: {
          ownerId: true,
          collaborators: {
            where: { userId },
            select: { role: true }
          }
        }
      },
      story: {
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
      }
    }
  });

  if (!timeline) return null;

  const project = timeline.project || timeline.story?.project;
  if (!project) return null;

  const hasAccess = project.ownerId === userId ||
                   project.collaborators.length > 0;
  
  const hasEditAccess = project.ownerId === userId ||
                       project.collaborators.some(c => c.role === 'editor');

  if (!hasAccess || (requireEdit && !hasEditAccess)) return null;

  return timeline;
}

// Get timelines for a project
router.get('/project/:projectId', asyncHandler(async (req: AuthRequest, res) => {
  const project = await checkProjectAccess(req.params.projectId, req.user!.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const { type } = req.query;

  const where: any = { projectId: req.params.projectId };
  if (type) where.type = type;

  const timelines = await prisma.timeline.findMany({
    where,
    include: {
      _count: {
        select: {
          entries: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { timelines }
  });
}));

// Get timelines for a story
router.get('/story/:storyId', asyncHandler(async (req: AuthRequest, res) => {
  const story = await checkStoryAccess(req.params.storyId, req.user!.id);
  
  if (!story) {
    return res.status(404).json({
      success: false,
      error: { message: 'Story not found or insufficient permissions' }
    });
  }

  const { type } = req.query;

  const where: any = { 
    OR: [
      { storyId: req.params.storyId },
      { projectId: story.projectId }
    ]
  };
  if (type) where.type = type;

  const timelines = await prisma.timeline.findMany({
    where,
    include: {
      _count: {
        select: {
          entries: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { timelines }
  });
}));

// Get single timeline with entries
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const timeline = await checkTimelineAccess(req.params.id, req.user!.id);
  
  if (!timeline) {
    return res.status(404).json({
      success: false,
      error: { message: 'Timeline not found or insufficient permissions' }
    });
  }

  const timelineWithEntries = await prisma.timeline.findUnique({
    where: { id: req.params.id },
    include: {
      entries: {
        include: {
          scene: {
            select: { id: true, title: true, summary: true }
          },
          character: {
            select: { id: true, name: true, avatar: true }
          },
          location: {
            select: { id: true, name: true, type: true }
          },
          item: {
            select: { id: true, name: true, type: true }
          },
          plotThread: {
            select: { id: true, name: true, status: true }
          }
        },
        orderBy: { date: 'asc' }
      }
    }
  });

  res.json({
    success: true,
    data: { timeline: timelineWithEntries }
  });
}));

// Create new timeline
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = createTimelineSchema.parse(req.body);

  // Validate that either projectId or storyId is provided
  if (!validatedData.projectId && !validatedData.storyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Either projectId or storyId must be provided' }
    });
  }

  // Check access
  if (validatedData.projectId) {
    const project = await checkProjectAccess(validatedData.projectId, req.user!.id, true);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found or insufficient permissions' }
      });
    }
  }

  if (validatedData.storyId) {
    const story = await checkStoryAccess(validatedData.storyId, req.user!.id, true);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: { message: 'Story not found or insufficient permissions' }
      });
    }
  }

  const timeline = await prisma.timeline.create({
    data: {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    },
    include: {
      _count: {
        select: {
          entries: true,
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { timeline }
  });
}));

// Update timeline
router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = updateTimelineSchema.parse(req.body);

  const timeline = await checkTimelineAccess(req.params.id, req.user!.id, true);
  
  if (!timeline) {
    return res.status(404).json({
      success: false,
      error: { message: 'Timeline not found or insufficient permissions' }
    });
  }

  const updatedTimeline = await prisma.timeline.update({
    where: { id: req.params.id },
    data: {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    },
    include: {
      _count: {
        select: {
          entries: true,
        }
      }
    }
  });

  res.json({
    success: true,
    data: { timeline: updatedTimeline }
  });
}));

// Delete timeline
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const timeline = await checkTimelineAccess(req.params.id, req.user!.id, true);
  
  if (!timeline) {
    return res.status(404).json({
      success: false,
      error: { message: 'Timeline not found or insufficient permissions' }
    });
  }

  await prisma.timeline.delete({
    where: { id: req.params.id }
  });

  res.json({
    success: true,
    data: { message: 'Timeline deleted successfully' }
  });
}));

// Create timeline entry
router.post('/:id/entries', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = createTimelineEntrySchema.parse(req.body);

  const timeline = await checkTimelineAccess(req.params.id, req.user!.id, true);
  
  if (!timeline) {
    return res.status(404).json({
      success: false,
      error: { message: 'Timeline not found or insufficient permissions' }
    });
  }

  const entry = await prisma.timelineEntry.create({
    data: {
      ...validatedData,
      date: new Date(validatedData.date),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    },
    include: {
      scene: {
        select: { id: true, title: true, summary: true }
      },
      character: {
        select: { id: true, name: true, avatar: true }
      },
      location: {
        select: { id: true, name: true, type: true }
      },
      item: {
        select: { id: true, name: true, type: true }
      },
      plotThread: {
        select: { id: true, name: true, status: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { entry }
  });
}));

// Update timeline entry
router.patch('/entries/:entryId', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = updateTimelineEntrySchema.parse(req.body);

  const entry = await prisma.timelineEntry.findUnique({
    where: { id: req.params.entryId },
    include: {
      timeline: true
    }
  });

  if (!entry) {
    return res.status(404).json({
      success: false,
      error: { message: 'Timeline entry not found' }
    });
  }

  // Check timeline access
  const timeline = await checkTimelineAccess(entry.timelineId, req.user!.id, true);
  
  if (!timeline) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  const updatedEntry = await prisma.timelineEntry.update({
    where: { id: req.params.entryId },
    data: {
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    },
    include: {
      scene: {
        select: { id: true, title: true, summary: true }
      },
      character: {
        select: { id: true, name: true, avatar: true }
      },
      location: {
        select: { id: true, name: true, type: true }
      },
      item: {
        select: { id: true, name: true, type: true }
      },
      plotThread: {
        select: { id: true, name: true, status: true }
      }
    }
  });

  res.json({
    success: true,
    data: { entry: updatedEntry }
  });
}));

// Delete timeline entry
router.delete('/entries/:entryId', asyncHandler(async (req: AuthRequest, res) => {
  const entry = await prisma.timelineEntry.findUnique({
    where: { id: req.params.entryId },
    include: {
      timeline: true
    }
  });

  if (!entry) {
    return res.status(404).json({
      success: false,
      error: { message: 'Timeline entry not found' }
    });
  }

  // Check timeline access
  const timeline = await checkTimelineAccess(entry.timelineId, req.user!.id, true);
  
  if (!timeline) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  await prisma.timelineEntry.delete({
    where: { id: req.params.entryId }
  });

  res.json({
    success: true,
    data: { message: 'Timeline entry deleted successfully' }
  });
}));

// Get timeline conflicts (overlapping events)
router.get('/:id/conflicts', asyncHandler(async (req: AuthRequest, res) => {
  const timeline = await checkTimelineAccess(req.params.id, req.user!.id);
  
  if (!timeline) {
    return res.status(404).json({
      success: false,
      error: { message: 'Timeline not found or insufficient permissions' }
    });
  }

  // Find entries with overlapping dates
  const entries = await prisma.timelineEntry.findMany({
    where: { timelineId: req.params.id },
    orderBy: { date: 'asc' }
  });

  const conflicts = [];
  for (let i = 0; i < entries.length - 1; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entry1 = entries[i];
      const entry2 = entries[j];
      
      const end1 = entry1.endDate || entry1.date;
      const start2 = entry2.date;
      
      // Check if they overlap
      if (entry1.date <= start2 && end1 >= start2) {
        conflicts.push({
          entry1: { id: entry1.id, title: entry1.title, date: entry1.date, endDate: entry1.endDate },
          entry2: { id: entry2.id, title: entry2.title, date: entry2.date, endDate: entry2.endDate },
          type: 'overlap'
        });
      }
    }
  }

  res.json({
    success: true,
    data: { conflicts }
  });
}));

export default router;
