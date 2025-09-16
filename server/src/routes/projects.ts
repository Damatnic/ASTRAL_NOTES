import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

const inviteCollaboratorSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});

// Get all projects for current user
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: req.user!.id },
        {
          collaborators: {
            some: {
              userId: req.user!.id
            }
          }
        }
      ]
    },
    include: {
      _count: {
        select: {
          stories: true,
          notes: true,
          characters: true,
          locations: true,
        }
      },
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
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  res.json({
    success: true,
    data: { projects }
  });
}));

// Get single project
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { ownerId: req.user!.id },
        {
          collaborators: {
            some: {
              userId: req.user!.id
            }
          }
        }
      ]
    },
    include: {
      stories: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: {
              scenes: true,
              notes: true,
            }
          }
        }
      },
      notes: {
        orderBy: { updatedAt: 'desc' },
        take: 10, // Limit initial load
      },
      characters: {
        orderBy: { name: 'asc' },
        take: 20,
      },
      locations: {
        orderBy: { name: 'asc' },
        take: 20,
      },
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
      _count: {
        select: {
          stories: true,
          notes: true,
          characters: true,
          locations: true,
          items: true,
          plotThreads: true,
          themes: true,
        }
      }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  res.json({
    success: true,
    data: { project }
  });
}));

// Create new project
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = createProjectSchema.parse(req.body);

  const project = await prisma.project.create({
    data: {
      ...validatedData,
      ownerId: req.user!.id,
    },
    include: {
      _count: {
        select: {
          stories: true,
          notes: true,
          characters: true,
          locations: true,
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: { project }
  });
}));

// Update project
router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = updateProjectSchema.parse(req.body);

  // Check if user owns the project or has editor access
  const existingProject = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { ownerId: req.user!.id },
        {
          collaborators: {
            some: {
              userId: req.user!.id,
              role: 'editor'
            }
          }
        }
      ]
    }
  });

  if (!existingProject) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: validatedData,
    include: {
      _count: {
        select: {
          stories: true,
          notes: true,
          characters: true,
          locations: true,
        }
      }
    }
  });

  res.json({
    success: true,
    data: { project }
  });
}));

// Delete project
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id // Only owner can delete
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  await prisma.project.delete({
    where: { id: req.params.id }
  });

  res.json({
    success: true,
    data: { message: 'Project deleted successfully' }
  });
}));

// Invite collaborator
router.post('/:id/collaborators', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = inviteCollaboratorSchema.parse(req.body);

  // Check if user owns the project
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  // Find user to invite
  const userToInvite = await prisma.user.findUnique({
    where: { email: validatedData.email },
    select: { id: true, username: true, firstName: true, lastName: true, avatar: true }
  });

  if (!userToInvite) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  // Check if already a collaborator
  const existingCollaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_userId: {
        projectId: req.params.id,
        userId: userToInvite.id
      }
    }
  });

  if (existingCollaborator) {
    return res.status(409).json({
      success: false,
      error: { message: 'User is already a collaborator' }
    });
  }

  const collaborator = await prisma.projectCollaborator.create({
    data: {
      projectId: req.params.id,
      userId: userToInvite.id,
      role: validatedData.role,
    },
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
  });

  res.status(201).json({
    success: true,
    data: { collaborator }
  });
}));

// Update collaborator role
router.patch('/:id/collaborators/:userId', asyncHandler(async (req: AuthRequest, res) => {
  const { role } = z.object({
    role: z.enum(['editor', 'viewer'])
  }).parse(req.body);

  // Check if user owns the project
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  const collaborator = await prisma.projectCollaborator.update({
    where: {
      projectId_userId: {
        projectId: req.params.id,
        userId: req.params.userId
      }
    },
    data: { role },
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
  });

  res.json({
    success: true,
    data: { collaborator }
  });
}));

// Remove collaborator
router.delete('/:id/collaborators/:userId', asyncHandler(async (req: AuthRequest, res) => {
  // Check if user owns the project
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found or insufficient permissions' }
    });
  }

  await prisma.projectCollaborator.delete({
    where: {
      projectId_userId: {
        projectId: req.params.id,
        userId: req.params.userId
      }
    }
  });

  res.json({
    success: true,
    data: { message: 'Collaborator removed successfully' }
  });
}));

export default router;
