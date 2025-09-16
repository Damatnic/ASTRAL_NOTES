import { Prisma } from '@prisma/client';

// Type-safe where clause builders
export interface GeneralNoteWhereClause {
  userId: string;
  type?: string;
  tags?: { has: string };
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
  }>;
}

export interface ProjectNoteWhereClause {
  projectId: string;
  type?: string;
  tags?: { has: string };
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
  }>;
}

export interface StoryNoteWhereClause {
  storyId: string;
  type?: string;
  tags?: { has: string };
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
  }>;
}

// Query parameter validation
export const validateQueryParams = (params: Record<string, unknown>) => {
  const limit = parseInt(String(params.limit || '50'));
  const offset = parseInt(String(params.offset || '0'));
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new Error('Invalid limit parameter');
  }
  
  if (isNaN(offset) || offset < 0) {
    throw new Error('Invalid offset parameter');
  }
  
  return { limit, offset };
};