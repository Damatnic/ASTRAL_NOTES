import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { renderWithProviders as render, screen, waitFor } from '../../utils/render';
import userEvent from '@testing-library/user-event';

vi.mock('../../../../services/offlineService', () => ({
  default: { on: vi.fn(), off: vi.fn(), getSyncQueueSize: vi.fn(() => 0), getBackups: vi.fn(async () => []), createBackup: vi.fn()}
}));
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
vi.mock('@/services/projectService', () => ({
  projectService: {
    getOverallStats: vi.fn(() => ({ totalProjects: 1, activeProjects: 1, totalNotes: 5, totalWords: 1000 })),
    getRecentProjects: vi.fn(() => [{ id: 'proj-1', title: 'Test Project', status: 'writing', wordCount: 1234, lastEditedAt: new Date().toISOString(), tags: ['tag1','tag2']}]),
    getAllProjects: vi.fn(() => [{ id: 'proj-1', title: 'Test Project', status: 'writing', wordCount: 1234, lastEditedAt: new Date().toISOString(), tags: ['x']}]),
    getProjectById: vi.fn(async (id: string) => ({ id, title: `Project ${id}` })),
    getProject: vi.fn((id: string) => ({ id, title: `Project ${id}` })),
  }
}));
vi.mock('../../../../services/noteService', () => ({ noteService: { getProjectNotes: vi.fn(async () => []) } }));
vi.mock('@/services/noteService', () => ({ noteService: { getProjectNotes: vi.fn(async () => []) } }));
vi.mock('../../../../services/quickNotesService', () => ({
  quickNotesService: { getAllTags: vi.fn(() => ['inbox']), getAllQuickNotes: vi.fn(() => []), createQuickNote: vi.fn(async () => ({ id: 'note-1' })) }
}));
vi.mock('@/services/quickNotesService', () => ({
  quickNotesService: { getAllTags: vi.fn(() => ['inbox']), getAllQuickNotes: vi.fn(() => []), createQuickNote: vi.fn(async () => ({ id: 'note-1' })) }
}));
vi.mock('@/services/exportService', () => ({
  exportService: {
    downloadProjectAsMarkdown: vi.fn(),
    downloadDataAsJson: vi.fn(),
    importFromFile: vi.fn(async () => ({ success: true, stats: { projectsImported: 0, notesImported: 0 } })),
  }
}));

// Light-weight UI mocks
vi.mock('@/components/ui/TextEditor', () => ({
  TextEditor: ({ content, onChange }: any) => (
    <textarea aria-label="Mock Editor" value={content} onChange={(e) => onChange?.(e.target.value)} />
  )
}));

// Mock AI services used by AIWritingPanel to avoid side effects
vi.mock('@/services/aiWritingCompanion', () => ({ default: {} }));
vi.mock('@/services/creativityBooster', () => ({ default: {} }));
vi.mock('@/services/voiceInteraction', () => ({ default: {} }));
vi.mock('@/services/storyAssistant', () => ({ default: {} }));
vi.mock('@/services/voiceStyleCoach', () => ({ default: {} }));
vi.mock('@/services/predictiveWritingAssistant', () => ({ default: {} }));

// Mock search service methods used by Search/AdvancedSearch
vi.mock('@/services/searchService', () => ({
  searchService: {
    getSearchStats: vi.fn(() => ({ totalItems: 0, totalWords: 0, itemsByType: {}, lastIndexed: new Date().toISOString() })),
    buildSearchIndex: vi.fn(),
    getSuggestions: vi.fn(() => []),
    getPopularSearches: vi.fn(() => []),
    search: vi.fn(async () => [])
  }
}));

import { AppContent } from '@/App';

describe('UI Interactions (lite)', () => {
  test('Navigate from Projects card to Project Dashboard', async () => {
    render(<AppContent />, ['/projects']);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());
    // Click first project card link by accessible name
    const link = await screen.findByRole('link', { name: /Test Project/i });
    await userEvent.click(link);
    await waitFor(() => expect(screen.getByTestId('project-dashboard')).toBeInTheDocument());
  });

  test('Quick Notes shows Attach Selected disabled when none selected', async () => {
    render(<AppContent />, ['/quick-notes']);
    await waitFor(() => expect(screen.getByTestId('quick-notes')).toBeInTheDocument());
    const attachBtn = screen.getByRole('button', { name: /Attach Selected/i });
    expect(attachBtn).toHaveAttribute('disabled');
  });

  test('Projects: toggle filter panel and sort direction', async () => {
    render(<AppContent />, ['/projects']);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());
    // Filter panel toggles "Status" label visibility
    const filterBtn = screen.getByRole('button', { name: /Filter/i });
    await userEvent.click(filterBtn);
    expect(await screen.findByText(/Status/i)).toBeInTheDocument();
    await userEvent.click(filterBtn);
    await waitFor(() => expect(screen.queryByText(/Status/i)).not.toBeInTheDocument());
    // Sort button title toggles between ascending/descending
    const sortBtn = screen.getByTitle(/Sort/i);
    const initialTitle = sortBtn.getAttribute('title');
    await userEvent.click(sortBtn);
    const toggledTitle = sortBtn.getAttribute('title');
    expect(initialTitle).not.toBeNull();
    expect(toggledTitle).not.toBeNull();
    expect(initialTitle).not.toEqual(toggledTitle);
  });

  test('Quick Notes: select a tag via Tags dropdown', async () => {
    render(<AppContent />, ['/quick-notes']);
    await waitFor(() => expect(screen.getByTestId('quick-notes')).toBeInTheDocument());
    const tagsTrigger = screen.getByRole('button', { name: /Tags/i });
    await userEvent.click(tagsTrigger);
    const inboxCheckbox = await screen.findByLabelText('inbox');
    await userEvent.click(inboxCheckbox);
    expect((inboxCheckbox as HTMLInputElement).checked).toBe(true);
  });

  test('AI Writing: header actions render (Preferences, New Session)', async () => {
    render(<AppContent />, ['/ai-writing']);
    await waitFor(() => expect(screen.getByTestId('ai-writing')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Preferences/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Session/i })).toBeInTheDocument();
  });

  test('Search: quick searches panel renders', async () => {
    render(<AppContent />, ['/search']);
    await waitFor(() => expect(screen.getByTestId('search')).toBeInTheDocument());
    expect(screen.getByText(/Quick Searches/i)).toBeInTheDocument();
  });

  test('Settings: change theme to Dark applies document class', async () => {
    render(<AppContent />, ['/settings']);
    await waitFor(() => expect(screen.getByTestId('settings')).toBeInTheDocument());
    const darkBtn = screen.getByRole('button', { name: /^Dark$/i });
    await userEvent.click(darkBtn);
    // ThemeProvider applies class on documentElement
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('Dashboard quick actions navigate to target pages', async () => {
    const first = render(<AppContent />, ['/dashboard']);
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());

    // Quick Note -> Quick Notes page (exact link text)
    const quickNoteLink = screen.getAllByRole('link', { name: (n) => n.trim() === 'Quick Note' })[0];
    await userEvent.click(quickNoteLink);
    await waitFor(() => expect(screen.getByTestId('quick-notes')).toBeInTheDocument());

    // Back to Dashboard then AI Writing Help -> AI Writing
    first.unmount();
    const second = render(<AppContent />, ['/dashboard']);
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
    const aiHelpLink = screen.getAllByRole('link', { name: (n) => n.trim() === 'AI Writing Help' })[0];
    await userEvent.click(aiHelpLink);
    await waitFor(() => expect(screen.getByTestId('ai-writing')).toBeInTheDocument());

    // Back to Dashboard then My Projects -> Projects
    second.unmount();
    const third = render(<AppContent />, ['/dashboard']);
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
    const myProjectsLink = screen.getAllByRole('link', { name: (n) => n.trim() === 'My Projects' })[0];
    await userEvent.click(myProjectsLink);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());

    // Back to Dashboard then Search Writing -> Search
    third.unmount();
    render(<AppContent />, ['/dashboard']);
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
    const searchWritingLink = screen.getAllByRole('link', { name: (n) => n.trim() === 'Search Writing' })[0];
    await userEvent.click(searchWritingLink);
    await waitFor(() => expect(screen.getByTestId('search')).toBeInTheDocument());
  });

  test('Projects: clicking New Project opens Create Project modal', async () => {
    render(<AppContent />, ['/projects']);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /New Project/i }));
    expect(await screen.findByText(/Create New Project/i)).toBeInTheDocument();
  });

  test('Quick Notes: clicking New Note opens Create Quick Note modal', async () => {
    render(<AppContent />, ['/quick-notes']);
    await waitFor(() => expect(screen.getByTestId('quick-notes')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /New Note/i }));
    expect(await screen.findByText(/Create Quick Note/i)).toBeInTheDocument();
  });

  test('Projects: selecting a project shows bulk actions banner', async () => {
    render(<AppContent />, ['/projects']);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    expect(await screen.findByText(/project(s)? selected/i)).toBeInTheDocument();
  });

  test('Quick Notes: Tools button opens Import & Export modal', async () => {
    render(<AppContent />, ['/quick-notes']);
    await waitFor(() => expect(screen.getByTestId('quick-notes')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Tools/i }));
    expect(await screen.findByText(/Import & Export/i)).toBeInTheDocument();
  });

  test('Projects: actions dropdown Export triggers exportService', async () => {
    const { exportService } = await import('@/services/exportService');
    render(<AppContent />, ['/projects']);
    await waitFor(() => expect(screen.getByTestId('projects-overview')).toBeInTheDocument());
    // Open the actions dropdown (first trigger with aria-haspopup=listbox)
    const triggers = screen.getAllByRole('button');
    const listboxTriggers = triggers.filter((b: HTMLElement) => b.getAttribute('aria-haspopup') === 'listbox');
    const dropdownTrigger = listboxTriggers[listboxTriggers.length - 1];
    expect(dropdownTrigger).toBeTruthy();
    await userEvent.click(dropdownTrigger!);
    // Click Export option
    const exportOption = await screen.findByRole('option', { name: /Export/i });
    await userEvent.click(exportOption);
    expect(exportService.downloadProjectAsMarkdown).toHaveBeenCalled();
  });
});
