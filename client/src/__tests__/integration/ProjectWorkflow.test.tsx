// Integration Tests for Project Workflow
// Tests complete user workflows from project creation to editing

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import { store } from '../../store/store';
import { App } from '../../App';
import { resetAllMocks, createMockProject, createMockStory } from '../testSetup';
import { projectService } from '../../services/projectService';
import { collaborationService } from '../../services/collaborationService';

// Mock services
vi.mock('../../services/projectService');
vi.mock('../../services/offlineService');
vi.mock('../../services/collaborationService');

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  );
};

describe('Project Workflow Integration', () => {
  beforeEach(() => {
    resetAllMocks();
    // Reset Redux store
    store.dispatch({ type: 'RESET_STATE' });
  });

  describe('Complete Project Creation Flow', () => {
    it('creates a new project and navigates to dashboard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      // Should start at dashboard
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Click create new project
      const createButton = screen.getByText('Create New Project');
      await user.click(createButton);

      // Fill out project form
      const titleInput = screen.getByLabelText('Project Title');
      const descriptionTextarea = screen.getByLabelText('Description');
      
      await user.type(titleInput, 'My Epic Novel');
      await user.type(descriptionTextarea, 'A story about heroes and dragons');

      // Select template
      const templateSelect = screen.getByLabelText('Template');
      await user.selectOptions(templateSelect, 'novel');

      // Set word target
      const wordTargetInput = screen.getByLabelText('Word Target');
      await user.clear(wordTargetInput);
      await user.type(wordTargetInput, '80000');

      // Submit form
      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      // Should navigate to project dashboard
      await waitFor(() => {
        expect(screen.getByText('My Epic Novel')).toBeInTheDocument();
        expect(screen.getByText('Project Dashboard')).toBeInTheDocument();
      });

      // Should show project statistics
      expect(screen.getByText('0 / 80,000 words')).toBeInTheDocument();
      expect(screen.getByText('0 stories')).toBeInTheDocument();
      expect(screen.getByText('0 characters')).toBeInTheDocument();
    });

    it('creates project with characters and locations from template', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      // Navigate to create project
      await user.click(screen.getByText('Create New Project'));

      // Fill basic info
      await user.type(screen.getByLabelText('Project Title'), 'Fantasy Adventure');
      await user.selectOptions(screen.getByLabelText('Template'), 'fantasy');

      // Submit
      await user.click(screen.getByText('Create Project'));

      // Wait for project to be created
      await waitFor(() => {
        expect(screen.getByText('Fantasy Adventure')).toBeInTheDocument();
      });

      // Check that template characters were created
      const charactersTab = screen.getByText('Characters');
      await user.click(charactersTab);

      await waitFor(() => {
        expect(screen.getByText('Hero Protagonist')).toBeInTheDocument();
        expect(screen.getByText('Wise Mentor')).toBeInTheDocument();
        expect(screen.getByText('Dark Antagonist')).toBeInTheDocument();
      });

      // Check that template locations were created
      const locationsTab = screen.getByText('Locations');
      await user.click(locationsTab);

      await waitFor(() => {
        expect(screen.getByText('Fantasy Kingdom')).toBeInTheDocument();
        expect(screen.getByText('Dark Forest')).toBeInTheDocument();
        expect(screen.getByText('Ancient Castle')).toBeInTheDocument();
      });
    });
  });

  describe('Story Creation and Editing Flow', () => {
    it('creates a story and adds scenes', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();
      
      // Mock project service to return our project
      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProjects).mockResolvedValue([mockProject]);
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);

      renderWithProviders(<App />);

      // Navigate to project
      await waitFor(() => {
        expect(screen.getByText(mockProject.title)).toBeInTheDocument();
      });
      
      await user.click(screen.getByText(mockProject.title));

      // Create new story
      const createStoryButton = screen.getByText('Create New Story');
      await user.click(createStoryButton);

      // Fill story form
      await user.type(screen.getByLabelText('Story Title'), 'Chapter One');
      await user.type(screen.getByLabelText('Description'), 'The beginning of the adventure');

      // Submit story form
      await user.click(screen.getByText('Create Story'));

      // Should navigate to story view
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
        expect(screen.getByText('Story Overview')).toBeInTheDocument();
      });

      // Add first scene
      const addSceneButton = screen.getByText('Add Scene');
      await user.click(addSceneButton);

      // Fill scene form
      await user.type(screen.getByLabelText('Scene Title'), 'Opening Scene');
      await user.selectOptions(screen.getByLabelText('Location'), 'fantasy-kingdom');
      
      // Select characters
      const characterCheckbox = screen.getByLabelText('Hero Protagonist');
      await user.click(characterCheckbox);

      // Submit scene form
      await user.click(screen.getByText('Create Scene'));

      // Should show scene in story outline
      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
        expect(screen.getByText('Hero Protagonist')).toBeInTheDocument();
      });
    });

    it('edits scene content with rich text editor', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();
      const mockStory = createMockStory();
      mockProject.stories = [mockStory];

      // Mock services
      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);

      renderWithProviders(<App />);

      // Navigate to story and scene
      await user.click(screen.getByText(mockStory.title));
      await user.click(screen.getByText('Opening Scene'));

      // Should open scene editor
      await waitFor(() => {
        expect(screen.getByText('Scene Editor')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });

      // Edit scene content
      const editor = screen.getByTestId('rich-text-editor');
      await user.click(editor);
      await user.type(editor, 'The hero stands at the edge of the kingdom...');

      // Format text
      const boldButton = screen.getByLabelText('Bold');
      await user.click(boldButton);
      await user.type(editor, 'This text should be bold.');

      // Save scene
      await user.keyboard('{Control>}s{/Control}');

      // Should show save indicator
      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });
  });

  describe('Character Management Flow', () => {
    it('creates and edits character profiles', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();

      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);

      renderWithProviders(<App />);

      // Navigate to characters section
      await user.click(screen.getByText('Characters'));

      // Create new character
      const createCharacterButton = screen.getByText('Create Character');
      await user.click(createCharacterButton);

      // Fill character form
      await user.type(screen.getByLabelText('Character Name'), 'Elara Moonwhisper');
      await user.type(screen.getByLabelText('Age'), '25');
      await user.selectOptions(screen.getByLabelText('Gender'), 'female');
      await user.type(screen.getByLabelText('Occupation'), 'Forest Ranger');

      // Add personality traits
      await user.type(screen.getByLabelText('Personality'), 'Brave, compassionate, quick-witted');
      await user.type(screen.getByLabelText('Backstory'), 'Grew up in the enchanted forest...');

      // Add relationships
      const addRelationshipButton = screen.getByText('Add Relationship');
      await user.click(addRelationshipButton);
      
      await user.selectOptions(screen.getByLabelText('Related Character'), 'hero-protagonist');
      await user.selectOptions(screen.getByLabelText('Relationship Type'), 'ally');
      await user.type(screen.getByLabelText('Description'), 'Childhood friend and trusted companion');

      // Submit character form
      await user.click(screen.getByText('Create Character'));

      // Should show character in list
      await waitFor(() => {
        expect(screen.getByText('Elara Moonwhisper')).toBeInTheDocument();
        expect(screen.getByText('Forest Ranger')).toBeInTheDocument();
      });

      // Click to view character details
      await user.click(screen.getByText('Elara Moonwhisper'));

      // Should show full character profile
      expect(screen.getByText('Character Profile')).toBeInTheDocument();
      expect(screen.getByText('25 years old')).toBeInTheDocument();
      expect(screen.getByText('Brave, compassionate, quick-witted')).toBeInTheDocument();
    });
  });

  describe('Search and Navigation Flow', () => {
    it('searches across project content', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();
      const mockStory = createMockStory();
      mockStory.title = 'The Dragon\'s Quest';
      mockProject.stories = [mockStory];

      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.search).mockResolvedValue([
        { type: 'story', item: mockStory, score: 0.8 },
      ]);

      renderWithProviders(<App />);

      // Open search
      await user.keyboard('{Control>}k{/Control}');

      // Should show search modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search your project...')).toBeInTheDocument();
      });

      // Search for dragon
      const searchInput = screen.getByPlaceholderText('Search your project...');
      await user.type(searchInput, 'dragon');

      // Should show search results
      await waitFor(() => {
        expect(screen.getByText('The Dragon\'s Quest')).toBeInTheDocument();
        expect(screen.getByText('Story')).toBeInTheDocument();
      });

      // Click search result
      await user.click(screen.getByText('The Dragon\'s Quest'));

      // Should navigate to story
      await waitFor(() => {
        expect(screen.getByText('Story Overview')).toBeInTheDocument();
      });
    });

    it('navigates using keyboard shortcuts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      // Go to projects with Ctrl+P
      await user.keyboard('{Control>}p{/Control}');
      await waitFor(() => {
        expect(screen.getByText('All Projects')).toBeInTheDocument();
      });

      // Go to dashboard with Ctrl+D
      await user.keyboard('{Control>}d{/Control}');
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Open search with Ctrl+K
      await user.keyboard('{Control>}k{/Control}');
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search your project...')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Plotboard Flow', () => {
    it('creates and organizes plot elements on plotboard', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();

      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);

      renderWithProviders(<App />);

      // Navigate to plotboard
      await user.click(screen.getByText('Plotboard'));

      // Should show visual plotboard
      await waitFor(() => {
        expect(screen.getByText('Visual Plotboard')).toBeInTheDocument();
        expect(screen.getByText('Main Plot')).toBeInTheDocument();
      });

      // Add subplot
      const addSubplotButton = screen.getByText('Add Subplot');
      await user.click(addSubplotButton);

      await user.type(screen.getByLabelText('Subplot Title'), 'Romance Arc');
      await user.selectOptions(screen.getByLabelText('Color'), 'pink');
      await user.click(screen.getByText('Create Subplot'));

      // Should show new subplot lane
      await waitFor(() => {
        expect(screen.getByText('Romance Arc')).toBeInTheDocument();
      });

      // Add scene to subplot
      const romanceArcLane = screen.getByTestId('subplot-romance-arc');
      const addSceneButton = within(romanceArcLane).getByText('Add Scene');
      await user.click(addSceneButton);

      await user.type(screen.getByLabelText('Scene Title'), 'First Meeting');
      await user.type(screen.getByLabelText('Description'), 'Heroes meet for the first time');
      await user.click(screen.getByText('Add Scene'));

      // Should show scene in romance arc
      await waitFor(() => {
        const sceneCard = screen.getByText('First Meeting');
        expect(sceneCard).toBeInTheDocument();
        expect(sceneCard.closest('[data-testid="subplot-romance-arc"]')).toBeInTheDocument();
      });
    });

    it('connects scenes with plot threads', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByText('Plotboard'));

      // Select connection mode
      const connectionModeButton = screen.getByText('Connect Scenes');
      await user.click(connectionModeButton);

      // Click first scene
      const scene1 = screen.getByTestId('scene-opening');
      await user.click(scene1);

      // Click second scene
      const scene2 = screen.getByTestId('scene-conflict');
      await user.click(scene2);

      // Should show connection dialog
      await waitFor(() => {
        expect(screen.getByText('Create Connection')).toBeInTheDocument();
      });

      // Select connection type
      await user.selectOptions(screen.getByLabelText('Connection Type'), 'cause-effect');
      await user.type(screen.getByLabelText('Description'), 'The opening event leads to the main conflict');

      await user.click(screen.getByText('Create Connection'));

      // Should show visual connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-line')).toBeInTheDocument();
      });
    });
  });

  describe('Collaboration Flow', () => {
    it('shares project and shows collaborator presence', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();

      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);

      const collaborationService = await import('../../services/collaborationService');
      vi.mocked(collaborationService.shareProject).mockResolvedValue({
        shareId: 'share-123',
        url: 'https://astral.notes/shared/share-123',
        permissions: 'edit',
      });

      renderWithProviders(<App />);

      // Open project settings
      await user.click(screen.getByLabelText('Project Settings'));
      await user.click(screen.getByText('Collaboration'));

      // Share project
      const shareButton = screen.getByText('Share Project');
      await user.click(shareButton);

      // Set permissions
      await user.selectOptions(screen.getByLabelText('Permissions'), 'edit');
      await user.click(screen.getByText('Generate Share Link'));

      // Should show share link
      await waitFor(() => {
        expect(screen.getByDisplayValue('https://astral.notes/shared/share-123')).toBeInTheDocument();
      });

      // Copy link
      const copyButton = screen.getByText('Copy Link');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://astral.notes/shared/share-123'
      );
    });
  });

  describe('Export and Backup Flow', () => {
    it('exports project in multiple formats', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();

      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);

      renderWithProviders(<App />);

      // Open export dialog
      await user.click(screen.getByText('Export'));

      // Should show export options
      await waitFor(() => {
        expect(screen.getByText('Export Project')).toBeInTheDocument();
      });

      // Select format
      await user.selectOptions(screen.getByLabelText('Export Format'), 'docx');

      // Configure options
      await user.click(screen.getByLabelText('Include Character Profiles'));
      await user.click(screen.getByLabelText('Include Plot Outline'));

      // Export
      await user.click(screen.getByText('Export Project'));

      // Should trigger download
      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });
    });

    it('creates automatic backup', async () => {
      const user = userEvent.setup();
      const mockProject = createMockProject();

      const offlineService = await import('../../services/offlineService');
      vi.mocked(offlineService.default.createBackup).mockResolvedValue('backup-123');

      renderWithProviders(<App />);

      // Trigger auto-backup by making changes
      await user.type(screen.getByTestId('rich-text-editor'), 'Some new content');

      // Wait for auto-save
      await waitFor(() => {
        expect(screen.getByText('Auto-saved')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check backup was created
      expect(offlineService.default.createBackup).toHaveBeenCalledWith('auto');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts interface for mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Mock matchMedia for mobile queries
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn((query: string) => ({
          matches: query.includes('max-width: 768px') && window.innerWidth <= 768,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const user = userEvent.setup();
      renderWithProviders(<App />);

      // Should show mobile navigation
      await waitFor(() => {
        expect(screen.getByTestId('mobile-nav-button')).toBeInTheDocument();
      });

      // Open mobile menu
      await user.click(screen.getByTestId('mobile-nav-button'));

      // Should show mobile navigation drawer
      await waitFor(() => {
        expect(screen.getByTestId('mobile-nav-drawer')).toBeInTheDocument();
      });

      // Should stack elements vertically on mobile
      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveStyle('flex-direction: column');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProjects).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<App />);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Unable to load projects')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Retry should work
      vi.mocked(projectService.getProjects).mockResolvedValue([]);
      
      await user.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('No projects yet')).toBeInTheDocument();
      });
    });

    it('recovers from corrupt data', async () => {
      const user = userEvent.setup();
      
      // Mock corrupt data
      const projectService = await import('../../services/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(null);

      renderWithProviders(<App />);

      // Navigate to non-existent project
      window.history.pushState({}, '', '/projects/invalid-id');

      // Should show not found page
      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument();
        expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      });

      // Should be able to recover
      await user.click(screen.getByText('Go to Dashboard'));

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });
});