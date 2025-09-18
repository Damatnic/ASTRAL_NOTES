import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { renderWithProviders as render, screen, waitFor } from '../../utils/render';

// Shared mocks sufficient for smoke rendering (declare before importing App)
vi.mock('../../../../services/offlineService', () => ({
  default: { on: vi.fn(), off: vi.fn(), getSyncQueueSize: vi.fn(() => 0), getBackups: vi.fn(async () => []), createBackup: vi.fn()}
}));
// Also mock via path alias used in app code
vi.mock('@/services/offlineService', () => ({
  default: { on: vi.fn(), off: vi.fn(), getSyncQueueSize: vi.fn(() => 0), getBackups: vi.fn(async () => []), createBackup: vi.fn()}
}));
vi.mock('../../../../services/projectService', () => ({
  projectService: {
    getOverallStats: vi.fn(() => ({ totalProjects: 1, activeProjects: 1, totalNotes: 5, totalWords: 1000 })),
    getRecentProjects: vi.fn(() => [{ id: 'proj-1', title: 'Test Project', status: 'writing', wordCount: 1234, lastEditedAt: new Date().toISOString(), tags: ['tag1','tag2']}]),
    getAllProjects: vi.fn(() => [{ id: 'proj-1', title: 'Test Project', status: 'writing', wordCount: 1234, lastEditedAt: new Date().toISOString(), tags: ['x']}]),
    getProjectById: vi.fn(async (id: string) => ({ id, title: `Project ${id}` })),
    getProject: vi.fn((id: string) => ({ id, title: `Project ${id}` })),
  }
}));

import { AppContent } from '@/App';
vi.mock('../../../../services/noteService', () => ({ noteService: { getProjectNotes: vi.fn(async () => []) } }));
vi.mock('../../../../services/quickNotesService', () => ({
  quickNotesService: { getAllTags: vi.fn(() => ['inbox']), getAllQuickNotes: vi.fn(() => []), createQuickNote: vi.fn(async () => ({ id: 'note-1' })) }
}));

describe('UI Smoke - Key Pages', () => {
  test('Dashboard shows quick actions', async () => {
    render(<AppContent />, ['/dashboard']);
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
    expect(screen.getAllByText(/Quick Note/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/AI Writing Help/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/My Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Writing/i)).toBeInTheDocument();
  });

  test('Projects shows card and no crashes', async () => {
    render(<AppContent />, ['/projects']);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());
  });

  test('Settings renders', async () => {
    render(<AppContent />, ['/settings']);
    await waitFor(() => expect(screen.getByTestId('settings')).toBeInTheDocument());
  });
});
