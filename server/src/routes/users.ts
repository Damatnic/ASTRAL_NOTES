import express, { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, UserProfile, UserStats } from '../types/api.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().url().optional(),
});

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  editorFontSize: z.number().min(8).max(32).optional(),
  editorFontFamily: z.string().optional(),
  autoSave: z.boolean().optional(),
  autoSaveInterval: z.number().min(5).max(300).optional(),
  showWordCount: z.boolean().optional(),
  showCharacterCount: z.boolean().optional(),
  distrationFreeMode: z.boolean().optional(),
  keyboardShortcuts: z.record(z.string()).optional(),
});

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<UserProfile>>) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      preferences: true,
      _count: {
        select: {
          projects: true,
          generalNotes: true,
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        createdAt: user.createdAt,
        preferences: user.preferences,
        stats: {
          projectCount: user._count.projects,
          generalNotesCount: user._count.generalNotes,
        }
      }
    }
  });
}));

// Update user profile
router.patch('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = updateProfileSchema.parse(req.body);

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: validatedData,
    include: {
      preferences: true
    }
  });

  res.json({
    success: true,
    data: {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        preferences: updatedUser.preferences
      }
    }
  });
}));

// Update user preferences
router.patch('/preferences', asyncHandler(async (req: AuthRequest, res) => {
  const validatedData = updatePreferencesSchema.parse(req.body);

  const updatedPreferences = await prisma.userPreferences.upsert({
    where: { userId: req.user!.id },
    update: validatedData,
    create: {
      userId: req.user!.id,
      ...validatedData
    }
  });

  res.json({
    success: true,
    data: { preferences: updatedPreferences }
  });
}));

// Get user statistics
router.get('/stats', asyncHandler(async (req: AuthRequest, res) => {
  const stats = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      _count: {
        select: {
          projects: true,
          generalNotes: true,
        }
      },
      projects: {
        select: {
          _count: {
            select: {
              stories: true,
            }
          },
          stories: {
            select: {
              _count: {
                select: {
                  scenes: true,
                }
              },
              wordCount: true,
            }
          }
        }
      }
    }
  });

  if (!stats) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  const totalStories = stats.projects.reduce((sum, project) => sum + project._count.stories, 0);
  const totalScenes = stats.projects.reduce((sum, project) => 
    sum + project.stories.reduce((storySum, story) => storySum + story._count.scenes, 0), 0
  );
  const totalWords = stats.projects.reduce((sum, project) => 
    sum + project.stories.reduce((storySum, story) => storySum + story.wordCount, 0), 0
  );

  res.json({
    success: true,
    data: {
      stats: {
        projectCount: stats._count.projects,
        storyCount: totalStories,
        sceneCount: totalScenes,
        generalNotesCount: stats._count.generalNotes,
        totalWordCount: totalWords,
      }
    }
  });
}));

export default router;
