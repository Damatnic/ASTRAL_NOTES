import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().default(''),
  type: z.enum(['place', 'region', 'building', 'room']).default('place'),
  parent: z.string().cuid().optional(),
  coordinates: z.record(z.any()).optional(),
  significance: z.string().default(''),
  atmosphere: z.string().default(''),
  tags: z.array(z.string()).default([]),
  projectId: z.string().cuid(),
});

const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['place', 'region', 'building', 'room']).optional(),
  parent: z.string().cuid().optional(),
  coordinates: z.record(z.any()).optional(),
  significance: z.string().optional(),
  atmosphere: z.string().optional(),
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

// Get locations for a project
router.get('/project/:projectId', asyncHandler(async (req: AuthRequest, res) => {
  const project = await checkProjectAccess(req.params.projectId, req.user!.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const { search, type, tag, parent, limit = '50', offset = '0' } = req.query;

  const where: any = { projectId: req.params.projectId };
  
  if (type) where.type = type;
  if (tag) where.tags = { has: tag };
  if (parent) where.parent = parent;
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const locations = await prisma.location.findMany({
    where,
    include: {
      _count: {
        select: {
          timelineEntries: true,
        }
      }
    },
    orderBy: { name: 'asc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  // Get child locations count for each location
  const locationsWithChildren = await Promise.all(
    locations.map(async (location) => {
      const childrenCount = await prisma.location.count({
        where: { parent: location.id }
      });
      return {
        ...location,
        childrenCount
      };
    })
  );

  const total = await prisma.location.count({ where });

  res.json({
    success: true,
    data: { 
      locations: locationsWithChildren,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + locations.length
      }
    }
  });
}));

// Get location hierarchy for a project
router.get('/project/:projectId/hierarchy', asyncHandler(async (req: AuthRequest, res) => {
  const project = await checkProjectAccess(req.params.projectId, req.user!.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  // Get all locations for the project
  const locations = await prisma.location.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { name: 'asc' }
  });

  // Build hierarchy
  const buildHierarchy = (parentId: string | null): any[] => {
    return locations
      .filter(loc => loc.parent === parentId)
      .map(location => ({
        ...location,
        children: buildHierarchy(location.id)
      }));
  };

  const hierarchy = buildHierarchy(null);

  res.json({
    success: true,
    data: { hierarchy }
  });
}));

// Get single location
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const location = await prisma.location.findUnique({
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
      }
    }
  });

  if (!location) {
    return res.status(404).json({
      success: false,
      error: { message: 'Location not found' }
    });
  }

  // Check access
  const hasAccess = location.project.ownerId === req.user!.id ||
                   location.project.collaborators.length > 0;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  // Get parent location if exists
  let parentLocation = null;
  if (location.parent) {
    parentLocation = await prisma.location.findUnique({
      where: { id: location.parent },
      select: { id: true, name: true, type: true }
    });
  }

  // Get child locations
  const childLocations = await prisma.location.findMany({
    where: { parent: location.id },
    select: { id: true, name: true, type: true, description: true },
    orderBy: { name: 'asc' }
  });

  // Get scenes that take place at this location
  const scenes = await prisma.scene.findMany({
    where: { location: location.id },
    select: {
      id: true,
      title: true,
      summary: true,
      order: true,
      story: {
        select: { id: true, title: true }
      }
    },
    orderBy: { order: 'asc' }
  });

  res.json({
    success: true,
    data: { 
      location: {
        ...location,
        parent: parentLocation,
        children: childLocations,
        scenes
      }
    }
  });
}));

// Create new location
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = createLocationSchema.parse(req.body);

  const project = await checkProjectAccess(validatedData.projectId, req.user!.id, true);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  // Validate parent location if provided
  if (validatedData.parent) {
    const parentLocation = await prisma.location.findFirst({
      where: {
        id: validatedData.parent,
        projectId: validatedData.projectId
      }
    });

    if (!parentLocation) {
      return res.status(400).json({
        success: false,
        error: { message: 'Parent location not found in this project' }
      });
    }
  }

  const location = await prisma.location.create({
    data: validatedData,
    include: {
      _count: {
        select: {
          timelineEntries: true,
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { location }
  });
}));

// Update location
router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = updateLocationSchema.parse(req.body);

  const existingLocation = await prisma.location.findUnique({
    where: { id: req.params.id },
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

  if (!existingLocation) {
    return res.status(404).json({
      success: false,
      error: { message: 'Location not found' }
    });
  }

  // Check permissions
  const hasEditAccess = existingLocation.project.ownerId === req.user!.id ||
                       existingLocation.project.collaborators.some(c => c.role === 'editor');

  if (!hasEditAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  // Validate parent location if being updated
  if (validatedData.parent) {
    // Prevent circular references
    if (validatedData.parent === req.params.id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Location cannot be its own parent' }
      });
    }

    const parentLocation = await prisma.location.findFirst({
      where: {
        id: validatedData.parent,
        projectId: existingLocation.project.id
      }
    });

    if (!parentLocation) {
      return res.status(400).json({
        success: false,
        error: { message: 'Parent location not found in this project' }
      });
    }

    // Check for circular reference in the hierarchy
    let currentParent = parentLocation;
    while (currentParent.parent) {
      if (currentParent.parent === req.params.id) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot create circular reference in location hierarchy' }
        });
      }
      const nextParent = await prisma.location.findUnique({
        where: { id: currentParent.parent }
      });
      if (!nextParent) break;
      currentParent = nextParent;
    }
  }

  const location = await prisma.location.update({
    where: { id: req.params.id },
    data: validatedData,
    include: {
      _count: {
        select: {
          timelineEntries: true,
        }
      }
    }
  });

  res.json({
    success: true,
    data: { location }
  });
}));

// Delete location
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const location = await prisma.location.findUnique({
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

  if (!location) {
    return res.status(404).json({
      success: false,
      error: { message: 'Location not found' }
    });
  }

  // Check permissions
  const hasDeleteAccess = location.project.ownerId === req.user!.id ||
                         location.project.collaborators.some(c => c.role === 'editor');

  if (!hasDeleteAccess) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }

  // Check if location has children
  const childrenCount = await prisma.location.count({
    where: { parent: req.params.id }
  });

  if (childrenCount > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot delete location with child locations. Please reassign or delete children first.' }
    });
  }

  await prisma.location.delete({
    where: { id: req.params.id }
  });

  res.json({
    success: true,
    data: { message: 'Location deleted successfully' }
  });
}));

export default router;
