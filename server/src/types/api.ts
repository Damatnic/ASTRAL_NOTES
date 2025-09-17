// Shared API types for route handlers

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: any };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Auth types
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  token: string;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: any;
  projectCount: number;
  generalNotesCount: number;
}

export interface UserStats {
  projectCount: number;
  storyCount: number;
  sceneCount: number;
  generalNotesCount: number;
  totalWordCount: number;
}

// Project types
export interface ProjectSummary {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  storyCount: number;
  sceneCount: number;
  characterCount: number;
  locationCount: number;
}

// Story types
export interface StorySummary {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  sceneCount: number;
  wordCount: number;
}

// Character types
export interface CharacterSummary {
  id: string;
  name: string;
  description?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Location types
export interface LocationSummary {
  id: string;
  name: string;
  description?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

// Timeline types
export interface TimelineSummary {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  entryCount: number;
}

// Note types
export interface NoteSummary {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  validation?: ValidationError[];
}


