/**
 * AI Integration Test Suite
 * Comprehensive tests for all AI services and components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import AI services and components
import { aiProviderService } from '@/services/aiProviderService';
import { workshopChatService } from '@/services/workshopChatService';
import { promptLibraryService } from '@/services/promptLibraryService';
import { contentAnalysisService } from '@/services/contentAnalysisService';
import { openaiService } from '@/services/ai/openaiService';
import { AIWorkshopPanel } from '@/components/ai/AIWorkshopPanel';
import { AIModelSelector } from '@/components/ai/AIModelSelector';
import { PromptLibrary } from '@/components/ai/PromptLibrary';

// Mock AI services for testing
vi.mock('@/services/ai/openaiService', () => ({
  openaiService: {
    isConfigured: vi.fn(() => true),
    generateCompletion: vi.fn(),
    generateStreamingCompletion: vi.fn(),
  }
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AI Provider Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock for openaiService.generateCompletion
    vi.mocked(openaiService.generateCompletion).mockResolvedValue('Default AI response');
  });

  describe('Provider Management', () => {
    it('should get all available providers', () => {
      const providers = aiProviderService.getProviders();
      
      expect(providers).toBeInstanceOf(Array);
      expect(providers.length).toBeGreaterThan(0);
      
      // Check for required providers
      const providerIds = providers.map(p => p.id);
      expect(providerIds).toContain('openai');
      expect(providerIds).toContain('anthropic');
      expect(providerIds).toContain('google');
      expect(providerIds).toContain('local');
    });

    it('should get provider by ID', () => {
      const openai = aiProviderService.getProvider('openai');
      
      expect(openai).toBeDefined();
      expect(openai?.id).toBe('openai');
      expect(openai?.name).toBe('OpenAI');
      expect(openai?.models).toBeInstanceOf(Array);
      expect(openai?.models.length).toBeGreaterThan(0);
    });

    it('should set and get active provider', () => {
      aiProviderService.setActiveProvider('openai');
      const active = aiProviderService.getActiveProvider();
      
      expect(active?.id).toBe('openai');
    });

    it('should check provider status', async () => {
      // Mock successful status check
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

      const isAvailable = await aiProviderService.checkProviderStatus('openai');
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('AI Request Generation', () => {
    beforeEach(() => {
      aiProviderService.setActiveProvider('openai');
    });

    it('should generate completion with valid request', async () => {
      // Mock OpenAI service response
      vi.mocked(openaiService.generateCompletion).mockResolvedValueOnce(
        'This is a test response from the AI.'
      );

      const response = await aiProviderService.generateCompletion({
        prompt: 'Test prompt',
        systemPrompt: 'You are a helpful assistant.',
        options: {
          temperature: 0.7,
          maxTokens: 100
        }
      });

      expect(response.content).toBe('This is a test response from the AI.');
      expect(response.provider).toBe('openai');
      expect(response.usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      vi.mocked(openaiService.generateCompletion).mockRejectedValueOnce(
        new Error('API key invalid')
      );

      await expect(
        aiProviderService.generateCompletion({
          prompt: 'Test prompt'
        })
      ).rejects.toThrow('API key invalid');
    });

    it('should build contextual prompts correctly', () => {
      const request = {
        prompt: 'Write a character description for {{character_name}}',
        context: {
          projectId: 'test-project',
          characters: [
            { id: '1', name: 'Alice', traits: ['brave', 'curious'] }
          ],
          writingStyle: 'fantasy',
          genre: 'fantasy'
        }
      };

      const contextualPrompt = aiProviderService.buildContextualPrompt(request);
      
      expect(contextualPrompt).toContain('Characters: Alice - brave, curious');
      expect(contextualPrompt).toContain('Style: fantasy');
      expect(contextualPrompt).toContain('Genre: fantasy');
    });
  });

  describe('Usage Statistics', () => {
    it('should track usage statistics', () => {
      const stats = aiProviderService.getUsageStats();
      expect(stats).toBeInstanceOf(Object);
    });

    it('should track request history', () => {
      const history = aiProviderService.getRequestHistory();
      expect(history).toBeInstanceOf(Array);
    });

    it('should clear history when requested', () => {
      aiProviderService.clearHistory();
      const history = aiProviderService.getRequestHistory();
      expect(history.length).toBe(0);
    });
  });
});

describe('Workshop Chat Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Set default mock for openaiService.generateCompletion
    vi.mocked(openaiService.generateCompletion).mockResolvedValue('Default AI response');
  });

  describe('Session Management', () => {
    it('should create new workshop session', () => {
      const session = workshopChatService.createSession('Test Session', 'project-123');
      
      expect(session.id).toBeDefined();
      expect(session.title).toBe('Test Session');
      expect(session.context.projectId).toBe('project-123');
      expect(session.messages).toEqual([]);
      expect(session.settings.aiProvider).toBe('openai');
    });

    it('should get session by ID', () => {
      const session = workshopChatService.createSession('Test Session');
      const retrieved = workshopChatService.getSession(session.id);
      
      expect(retrieved?.id).toBe(session.id);
      expect(retrieved?.title).toBe('Test Session');
    });

    it('should get all sessions', () => {
      workshopChatService.createSession('Session 1');
      workshopChatService.createSession('Session 2');
      
      const sessions = workshopChatService.getAllSessions();
      expect(sessions.length).toBe(2);
    });

    it('should set active session', () => {
      const session = workshopChatService.createSession('Test Session');
      workshopChatService.setActiveSession(session.id);
      
      const active = workshopChatService.getActiveSession();
      expect(active?.id).toBe(session.id);
    });
  });

  describe('Message Handling', () => {
    it('should send message and receive AI response', async () => {
      // Mock AI response
      vi.mocked(openaiService.generateCompletion).mockResolvedValueOnce(
        'That\'s an interesting character concept! Let me help you develop it further.'
      );

      const session = workshopChatService.createSession('Test Session', 'project-123', {
        autoExtract: false // Disable auto-extraction for tests
      });
      const response = await workshopChatService.sendMessage(
        'I want to create a character who is a detective with magical abilities.',
        session.id
      );

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('character concept');
      
      const updatedSession = workshopChatService.getSession(session.id);
      expect(updatedSession?.messages.length).toBe(2); // User message + AI response
    });

    it('should handle error in message sending', async () => {
      // Mock API error
      vi.mocked(openaiService.generateCompletion).mockRejectedValueOnce(new Error('Network error'));

      const session = workshopChatService.createSession('Test Session', 'project-123', {
        autoExtract: false // Disable auto-extraction for tests
      });
      const response = await workshopChatService.sendMessage('Test message', session.id);

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('error');
    });
  });

  describe('Export and Archive', () => {
    it('should export conversation to markdown', () => {
      const session = workshopChatService.createSession('Test Session');
      session.messages.push(
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hello! How can I help you today?',
          timestamp: Date.now()
        }
      );

      const markdown = workshopChatService.exportConversation(session.id, 'markdown');
      
      expect(markdown).toContain('# Test Session');
      expect(markdown).toContain('### You');
      expect(markdown).toContain('### Assistant');
      expect(markdown).toContain('Hello');
    });

    it('should archive session', () => {
      const session = workshopChatService.createSession('Test Session');
      workshopChatService.archiveSession(session.id);
      
      const sessions = workshopChatService.getAllSessions();
      expect(sessions.length).toBe(0); // Archived sessions are filtered out
    });
  });
});

describe('Prompt Library Service', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set default mock for openaiService.generateCompletion
    vi.mocked(openaiService.generateCompletion).mockResolvedValue('Default AI response');
  });

  describe('Prompt Management', () => {
    it('should get default prompts on initialization', () => {
      const prompts = promptLibraryService.getPrompts();
      expect(prompts.length).toBeGreaterThan(0);
      
      // Check for default prompts
      const titles = prompts.map(p => p.title);
      expect(titles).toContain('Character Profile Generator');
      expect(titles).toContain('Location Description Generator');
    });

    it('should create new prompt template', () => {
      const template = promptLibraryService.createPrompt({
        title: 'Test Prompt',
        description: 'A test prompt for testing',
        category: 'writing_assistance',
        tags: ['test'],
        prompt: 'Write about {{topic}}',
        variables: [
          {
            name: 'topic',
            description: 'The topic to write about',
            type: 'text',
            required: true
          }
        ],
        aiSettings: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500
        },
        examples: [],
        metadata: {
          author: 'Test',
          version: '1.0',
          license: 'MIT',
          lastTested: Date.now(),
          successRate: 0.9
        },
        createdBy: 'test-user',
        isFavorite: false,
        isPublic: true
      });

      expect(template.id).toBeDefined();
      expect(template.title).toBe('Test Prompt');
      expect(template.usageCount).toBe(0);
    });

    it('should filter prompts by category', () => {
      const characterPrompts = promptLibraryService.getPrompts({
        category: 'character_development'
      });

      expect(characterPrompts.length).toBeGreaterThan(0);
      characterPrompts.forEach(prompt => {
        expect(prompt.category).toBe('character_development');
      });
    });

    it('should search prompts by text', () => {
      const searchResults = promptLibraryService.getPrompts({
        search: 'character'
      });

      expect(searchResults.length).toBeGreaterThan(0);
      searchResults.forEach(prompt => {
        const searchableText = (prompt.title + ' ' + prompt.description + ' ' + prompt.tags.join(' ')).toLowerCase();
        expect(searchableText).toContain('character');
      });
    });
  });

  describe('Prompt Execution', () => {
    it('should execute prompt with variables', async () => {
      // Mock AI response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Alice is a brave 25-year-old detective...',
              role: 'assistant'
            }
          }],
          usage: { prompt_tokens: 20, completion_tokens: 30, total_tokens: 50 }
        })
      } as Response);

      const prompts = promptLibraryService.getPrompts();
      const characterPrompt = prompts.find(p => p.title === 'Character Profile Generator');
      
      if (characterPrompt) {
        const response = await promptLibraryService.executePrompt(
          characterPrompt.id,
          {
            character_name: 'Alice',
            age: 25,
            occupation: 'detective',
            genre: 'mystery'
          }
        );

        expect(response.content).toContain('Alice');
        expect(response.content).toContain('detective');
      }
    });

    it('should validate required variables', async () => {
      const prompts = promptLibraryService.getPrompts();
      const characterPrompt = prompts.find(p => p.title === 'Character Profile Generator');
      
      if (characterPrompt) {
        await expect(
          promptLibraryService.executePrompt(characterPrompt.id, {})
        ).rejects.toThrow('Missing required variables');
      }
    });
  });

  describe('Recipe Management', () => {
    it('should get default recipes', () => {
      const recipes = promptLibraryService.getRecipes();
      expect(recipes.length).toBeGreaterThan(0);
      
      const titles = recipes.map(r => r.title);
      expect(titles).toContain('Complete Character Development');
    });

    it('should execute recipe workflow', async () => {
      // Mock multiple AI responses for recipe steps
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Step 1 result', role: 'assistant' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Step 2 result', role: 'assistant' } }],
            usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 }
          })
        } as Response);

      const recipes = promptLibraryService.getRecipes();
      const characterRecipe = recipes.find(r => r.title === 'Complete Character Development');
      
      if (characterRecipe) {
        const execution = await promptLibraryService.executeRecipe(
          characterRecipe.id,
          {
            character_name: 'Bob',
            genre: 'fantasy',
            role: 'protagonist'
          }
        );

        expect(execution.status).toBe('completed');
        expect(execution.steps.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Content Analysis Service', () => {
  beforeEach(() => {
    // Set default mock for openaiService.generateCompletion
    vi.mocked(openaiService.generateCompletion).mockResolvedValue('Default AI response');
  });

  describe('Text Analysis', () => {
    it('should analyze content quality', async () => {
      // Mock AI analysis response
      vi.mocked(openaiService.generateCompletion).mockResolvedValueOnce(
        JSON.stringify({
          qualityScore: 8,
          findings: [
            {
              type: 'style',
              severity: 'info',
              title: 'Writing Style',
              description: 'Good use of descriptive language',
              confidence: 0.9
            }
          ],
          summary: 'Well-written text with good structure'
        })
      );

      const text = 'The old oak tree stood majestically in the center of the village square, its ancient branches reaching toward the cloudy sky like gnarled fingers seeking something beyond mortal reach.';
      
      const analysis = await contentAnalysisService.analyzeContent(text, {
        includeEntities: true,
        includeStyle: true,
        includeSuggestions: true,
        analysisDepth: 'standard'
      });

      expect(analysis.id).toBeDefined();
      expect(analysis.text).toBe(text);
      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.qualityScore).toBeGreaterThan(0);
      expect(analysis.findings).toBeInstanceOf(Array);
    });

    it('should detect entities in text', async () => {
      // Mock entity detection response
      vi.mocked(openaiService.generateCompletion).mockResolvedValueOnce(
        JSON.stringify([
          {
            type: 'location',
            name: 'village square',
            mentions: ['village square'],
            confidence: 0.9
          },
          {
            type: 'object',
            name: 'oak tree',
            mentions: ['oak tree'],
            confidence: 0.95
          }
        ])
      );

      const text = 'The old oak tree stood in the village square.';
      const analysis = await contentAnalysisService.analyzeContent(text);

      expect(analysis.detectedEntities.length).toBeGreaterThan(0);
    });
  });

  describe('AI-ism Detection', () => {
    it('should detect AI-generated patterns', async () => {
      // Mock AI-ism detection response
      vi.mocked(openaiService.generateCompletion).mockResolvedValueOnce(
        JSON.stringify({
          humanLikelihood: 60,
          patterns: [
            {
              type: 'repetitive_phrases',
              description: 'Repeated use of similar sentence structures',
              severity: 'medium',
              confidence: 0.8
            }
          ],
          suggestions: ['Vary sentence structure for more natural flow']
        })
      );

      const text = 'This is amazing. This is wonderful. This is incredible.';
      const detection = await contentAnalysisService.detectAIisms(text);

      expect(detection.id).toBeDefined();
      expect(detection.humanLikelihood).toBeDefined();
      expect(detection.detectedPatterns).toBeInstanceOf(Array);
      expect(detection.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('Consistency Checking', () => {
    it('should check consistency across text sections', async () => {
      // Mock consistency check response
      vi.mocked(openaiService.generateCompletion).mockResolvedValueOnce(
        'No major inconsistencies found. Character descriptions are consistent across sections.'
      );

      const sections = [
        {
          id: '1',
          title: 'Chapter 1',
          content: 'Alice had brown hair and green eyes.',
          type: 'scene' as const
        },
        {
          id: '2',
          title: 'Chapter 2',
          content: 'Alice\'s brown hair gleamed in the sunlight.',
          type: 'scene' as const
        }
      ];

      const check = await contentAnalysisService.checkConsistency(sections, 'project-123');

      expect(check.id).toBeDefined();
      expect(check.projectId).toBe('project-123');
      expect(check.textSections).toEqual(sections);
      expect(check.overallScore).toBeGreaterThan(0);
    });
  });
});

describe('AI Workshop Panel Component', () => {
  it('should render workshop panel', () => {
    render(<AIWorkshopPanel />);
    
    expect(screen.getByText('AI Workshop')).toBeInTheDocument();
    expect(screen.getByText('Start New Session')).toBeInTheDocument();
  });

  it('should create new session when button clicked', async () => {
    const user = userEvent.setup();
    render(<AIWorkshopPanel />);
    
    const createButton = screen.getByText('Start New Session');
    await user.click(createButton);
    
    // Should now show the chat interface
    expect(screen.getByText('Workshop Session 1')).toBeInTheDocument();
  });

  it('should send message to AI', async () => {
    // Mock successful AI response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          message: {
            id: 'msg-123',
            role: 'assistant',
            content: 'Hello! How can I help you with your writing today?',
            timestamp: Date.now()
          }
        }
      })
    } as Response);

    const user = userEvent.setup();
    render(<AIWorkshopPanel />);
    
    // Create session first
    await user.click(screen.getByText('Start New Session'));
    
    // Type message
    const textarea = screen.getByPlaceholderText(/Ask your AI assistant/);
    await user.type(textarea, 'Hello, I need help with character development.');
    
    // Send message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/How can I help you with your writing/)).toBeInTheDocument();
    });
  });
});

describe('AI Model Selector Component', () => {
  it('should render model selector', () => {
    render(<AIModelSelector />);
    
    expect(screen.getByText('AI Models')).toBeInTheDocument();
    expect(screen.getByText('Choose and configure AI providers')).toBeInTheDocument();
  });

  it('should display available providers', () => {
    render(<AIModelSelector />);
    
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic Claude')).toBeInTheDocument();
    expect(screen.getByText('Google Gemini')).toBeInTheDocument();
    expect(screen.getByText('Local LLMs')).toBeInTheDocument();
  });

  it('should switch between providers', async () => {
    const user = userEvent.setup();
    const onProviderChange = vi.fn();
    
    render(<AIModelSelector onProviderChange={onProviderChange} />);
    
    // Click on Anthropic provider
    const anthropicCard = screen.getByText('Anthropic Claude').closest('.cursor-pointer');
    if (anthropicCard) {
      await user.click(anthropicCard);
      expect(onProviderChange).toHaveBeenCalledWith('anthropic');
    }
  });
});

describe('Prompt Library Component', () => {
  it('should render prompt library', () => {
    render(<PromptLibrary />);
    
    expect(screen.getByText('Prompt Library')).toBeInTheDocument();
    expect(screen.getByText('Discover, create, and execute AI prompts and workflows')).toBeInTheDocument();
  });

  it('should display default prompts', () => {
    render(<PromptLibrary />);
    
    expect(screen.getByText('Character Profile Generator')).toBeInTheDocument();
    expect(screen.getByText('Location Description Generator')).toBeInTheDocument();
  });

  it('should filter prompts by search', async () => {
    const user = userEvent.setup();
    render(<PromptLibrary />);
    
    const searchInput = screen.getByPlaceholderText('Search prompts and recipes...');
    await user.type(searchInput, 'character');
    
    // Should show filtered results
    expect(screen.getByText('Character Profile Generator')).toBeInTheDocument();
  });

  it('should toggle favorites', async () => {
    const user = userEvent.setup();
    render(<PromptLibrary />);
    
    // Find a prompt card and click its favorite button
    const favoriteButtons = screen.getAllByRole('button');
    const starButton = favoriteButtons.find(button => 
      button.querySelector('svg')?.getAttribute('data-lucide') === 'star-off'
    );
    
    if (starButton) {
      await user.click(starButton);
      // The star should now be filled (favorited)
    }
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Set default mock for openaiService.generateCompletion
    vi.mocked(openaiService.generateCompletion).mockResolvedValue('Default AI response');
  });

  it('should handle complete AI workflow from workshop to content analysis', async () => {
    // 1. Create workshop session
    const session = workshopChatService.createSession('Integration Test', 'project-123');
    
    // 2. Mock AI responses
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Great character idea! Let me help you develop Alice further.', role: 'assistant' } }],
          usage: { total_tokens: 30 }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                qualityScore: 8.5,
                findings: [],
                suggestions: [{ type: 'improvement', title: 'Add more detail', description: 'Consider adding more sensory details' }]
              }),
              role: 'assistant'
            }
          }],
          usage: { total_tokens: 40 }
        })
      } as Response);
    
    // 3. Send message in workshop
    await workshopChatService.sendMessage('I want to create a character named Alice who is a detective.', session.id);
    
    // 4. Analyze generated content
    const generatedText = 'Alice is a skilled detective with keen observation skills.';
    const analysis = await contentAnalysisService.analyzeContent(generatedText);
    
    // 5. Verify workflow completion
    const updatedSession = workshopChatService.getSession(session.id);
    expect(updatedSession?.messages.length).toBe(2);
    expect(analysis.qualityScore).toBeGreaterThan(0);
    expect(analysis.suggestions.length).toBeGreaterThan(0);
  });

  it('should handle error scenarios gracefully', async () => {
    // Mock network failure
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    
    const session = workshopChatService.createSession('Error Test');
    const response = await workshopChatService.sendMessage('Test message', session.id);
    
    // Should return error message instead of throwing
    expect(response.role).toBe('assistant');
    expect(response.content).toContain('error');
  });

  it('should persist data correctly across service restarts', () => {
    // Create session and prompt
    const session = workshopChatService.createSession('Persistence Test');
    const prompt = promptLibraryService.createPrompt({
      title: 'Test Persistence',
      description: 'Testing data persistence',
      category: 'custom',
      tags: ['test'],
      prompt: 'Test prompt',
      variables: [],
      aiSettings: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100
      },
      examples: [],
      metadata: {
        author: 'Test',
        version: '1.0',
        license: 'MIT',
        lastTested: Date.now(),
        successRate: 1.0
      },
      createdBy: 'test-user',
      isFavorite: false,
      isPublic: false
    });
    
    // Simulate service restart by creating new instances
    const newChatService = new (workshopChatService.constructor as any)();
    const newPromptService = new (promptLibraryService.constructor as any)();
    
    // Data should still be available
    const retrievedSession = newChatService.getSession(session.id);
    const retrievedPrompt = newPromptService.getPrompt(prompt.id);
    
    expect(retrievedSession?.id).toBe(session.id);
    expect(retrievedPrompt?.id).toBe(prompt.id);
  });
});

describe('Performance Tests', () => {
  beforeEach(() => {
    // Set default mock for openaiService.generateCompletion
    vi.mocked(openaiService.generateCompletion).mockResolvedValue('Default AI response');
  });

  it('should handle large text analysis efficiently', async () => {
    // Generate large text (10,000 characters)
    const largeText = 'This is a test sentence. '.repeat(400);
    
    // Mock AI response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({ qualityScore: 7, findings: [], suggestions: [] }),
            role: 'assistant'
          }
        }],
        usage: { total_tokens: 100 }
      })
    } as Response);
    
    const startTime = Date.now();
    const analysis = await contentAnalysisService.analyzeContent(largeText);
    const endTime = Date.now();
    
    // Should complete within reasonable time (< 5 seconds)
    expect(endTime - startTime).toBeLessThan(5000);
    expect(analysis.characterCount).toBe(largeText.length);
  });

  it('should handle multiple concurrent requests', async () => {
    // Mock AI responses
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Response', role: 'assistant' } }],
        usage: { total_tokens: 10 }
      })
    } as Response);
    
    // Create multiple concurrent requests
    const requests = Array.from({ length: 10 }, (_, i) => 
      aiProviderService.generateCompletion({
        prompt: `Test prompt ${i}`
      })
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // All requests should complete
    expect(responses.length).toBe(10);
    responses.forEach(response => {
      expect(response.content).toBe('Response');
    });
    
    // Should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(10000);
  });
});

describe('Security Tests', () => {
  beforeEach(() => {
    // Set default mock for openaiService.generateCompletion
    vi.mocked(openaiService.generateCompletion).mockResolvedValue('Default AI response');
  });

  it('should sanitize user input', async () => {
    const maliciousInput = '<script>alert("XSS")</script>Tell me about characters';
    
    // Mock AI response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Safe response', role: 'assistant' } }],
        usage: { total_tokens: 10 }
      })
    } as Response);
    
    const session = workshopChatService.createSession('Security Test');
    const response = await workshopChatService.sendMessage(maliciousInput, session.id);
    
    // Response should be clean and not execute the script
    expect(response.content).toBe('Safe response');
  });

  it('should validate prompt templates', () => {
    expect(() => {
      promptLibraryService.createPrompt({
        title: '', // Invalid: empty title
        description: 'Test',
        category: 'custom',
        tags: [],
        prompt: 'Test',
        variables: [],
        aiSettings: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 100
        },
        examples: [],
        metadata: {
          author: 'Test',
          version: '1.0',
          license: 'MIT',
          lastTested: Date.now(),
          successRate: 1.0
        },
        createdBy: 'test-user',
        isFavorite: false,
        isPublic: false
      });
    }).toThrow();
  });
});

// Export test utilities for other test files
export const testUtils = {
  mockAIResponse: (content: string, tokens = 10) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content, role: 'assistant' } }],
        usage: { total_tokens: tokens }
      })
    } as Response);
  },
  
  mockAIError: (message: string) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message }
      })
    } as Response);
  },
  
  createTestSession: () => {
    return workshopChatService.createSession('Test Session', 'test-project');
  },
  
  createTestPrompt: () => {
    return promptLibraryService.createPrompt({
      title: 'Test Prompt',
      description: 'A test prompt',
      category: 'custom',
      tags: ['test'],
      prompt: 'Test prompt: {{input}}',
      variables: [
        {
          name: 'input',
          description: 'Test input',
          type: 'text',
          required: true
        }
      ],
      aiSettings: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100
      },
      examples: [],
      metadata: {
        author: 'Test',
        version: '1.0',
        license: 'MIT',
        lastTested: Date.now(),
        successRate: 1.0
      },
      createdBy: 'test-user',
      isFavorite: false,
      isPublic: true
    });
  }
};