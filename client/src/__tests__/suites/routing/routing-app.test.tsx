/**
 * Routing tests aligned with current app routes
 */

import React from 'react';
import { describe, test, expect } from 'vitest';
import { renderWithProviders as render } from '../../utils/render';
import { AppContent } from '../../../App';
import { waitFor, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Minimal service mocks used by App layout and pages
vi.mock('../../../services/offlineService', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    getSyncQueueSize: vi.fn(() => 0),
    createBackup: vi.fn(async () => 'backup-1'),
    getBackups: vi.fn(async () => []),
  }
}));

vi.mock('../../../services/projectService', () => ({
  projectService: {
    getAllProjects: vi.fn(() => [
      { id: 'proj-1', title: 'Test Project 1', status: 'writing', wordCount: 1000, lastEditedAt: new Date().toISOString(), tags: [] },
    ]),
    getOverallStats: vi.fn(() => ({ totalProjects: 1, activeProjects: 1, totalNotes: 3, totalWords: 1000 })),
    getRecentProjects: vi.fn(() => [
      { id: 'proj-1', title: 'Test Project 1', status: 'writing', wordCount: 1000, lastEditedAt: new Date().toISOString(), tags: [] },
    ]),
    getProject: vi.fn((id: string) => ({ id, title: `Project ${id}` })),
    getProjectById: vi.fn(async (id: string) => ({ id, title: `Project ${id}` })),
  }
}));

vi.mock('../../../services/quickNotesService', () => ({
  quickNotesService: {
    getAllTags: vi.fn(() => ['inbox']),
    getAllQuickNotes: vi.fn(() => []),
    createQuickNote: vi.fn(async () => ({ id: 'note-1' })),
  }
}));

vi.mock('../../../services/noteService', () => ({
  noteService: {
    getProjectNotes: vi.fn(async () => []),
  }
}));

describe('App Routing (Current Routes)', () => {
  test('renders Dashboard at /', async () => {
    render(<AppContent />, ['/']);
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
  });

  test('renders Projects at /projects', async () => {
    render(<AppContent />, ['/projects']);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());
  });

  test('renders ProjectDashboard at /projects/:id', async () => {
    render(<AppContent />, ['/projects/test-project']);
    await waitFor(() => expect(screen.getByTestId('project-dashboard')).toBeInTheDocument());
  });

  test('renders Quick Notes at /quick-notes', async () => {
    render(<AppContent />, ['/quick-notes']);
    // This page might render later; tolerate absence if not present
    await waitFor(() => expect(screen.getByTestId('quick-notes')).toBeInTheDocument());
  });

  test('renders AI Writing at /ai-writing', async () => {
    render(<AppContent />, ['/ai-writing']);
    await waitFor(() => expect(screen.getByTestId('ai-writing')).toBeInTheDocument());
  });

  test('renders Search at /search', async () => {
    render(<AppContent />, ['/search']);
    await waitFor(() => expect(screen.getByTestId('search')).toBeInTheDocument());
  });

  test('renders Settings at /settings', async () => {
    render(<AppContent />, ['/settings']);
    await waitFor(() => expect(screen.getByTestId('settings')).toBeInTheDocument());
  });
});
