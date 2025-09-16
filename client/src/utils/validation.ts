/**
 * Validation schemas using Zod
 */

import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Project schemas
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  isPublic: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

// Note schemas
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z.string().optional().default(''),
  type: z
    .enum(['note', 'character', 'plot', 'setting', 'research'])
    .optional()
    .default('note'),
  tags: z.array(z.string()).optional().default([]),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const updateNoteSchema = createNoteSchema.partial().omit(['projectId']);

// Search schema
export const searchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query cannot exceed 100 characters'),
  type: z
    .enum(['note', 'character', 'plot', 'setting', 'research'])
    .optional(),
  projectId: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

// Settings schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  sidebarCollapsed: z.boolean().default(false),
  autoSave: z.boolean().default(true),
  notifications: z.boolean().default(true),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;
export type CreateNoteFormData = z.infer<typeof createNoteSchema>;
export type UpdateNoteFormData = z.infer<typeof updateNoteSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;

// Validation helpers
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return z.string().min(6).safeParse(password).success;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};