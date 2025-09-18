/**
 * Workshop Chat Service - Interactive AI conversations with context awareness
 * Manages multi-turn conversations, context extraction, and codex integration
 */

import { aiProviderService, AIRequest, AIResponse } from './aiProviderService';
import { codexService } from './codexService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  suggestions?: ExtractedSuggestion[];
  entities?: ExtractedEntity[];
  actions?: ChatAction[];
  provider?: string;
  model?: string;
  tokens?: number;
  cost?: number;
}

export interface ExtractedSuggestion {
  id: string;
  type: 'character' | 'location' | 'plot' | 'worldbuilding' | 'timeline';
  title: string;
  description: string;
  content: string;
  confidence: number;
  extractable: boolean;
}

export interface ExtractedEntity {
  id: string;
  type: 'character' | 'location' | 'object' | 'concept' | 'event';
  name: string;
  description: string;
  attributes: Record<string, any>;
  mentions: Array<{ messageId: string; context: string }>;
}

export interface ChatAction {
  id: string;
  type: 'extract_to_codex' | 'save_prompt' | 'create_recipe' | 'export_conversation';
  title: string;
  description: string;
  payload: Record<string, any>;
}

export interface WorkshopSession {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  storyId?: string;
  sceneId?: string;
  messages: ChatMessage[];
  context: WorkshopContext;
  settings: WorkshopSettings;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
}

export interface WorkshopContext {
  projectId?: string;
  storyId?: string;
  sceneId?: string;
  characters: Array<{ id: string; name: string; traits: string[] }>;
  locations: Array<{ id: string; name: string; description: string }>;
  plotPoints: Array<{ id: string; title: string; description: string }>;
  worldbuilding: Array<{ id: string; name: string; description: string }>;
  writingStyle?: string;
  genre?: string;
  tone?: string;
  currentText?: string;
  goals: string[];
}

export interface WorkshopSettings {
  aiProvider: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  autoExtract: boolean;
  contextAwareness: boolean;
  suggestionsEnabled: boolean;
  entityDetection: boolean;
}

export interface ConversationSummary {
  sessionId: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: string[];
  extractedEntities: ExtractedEntity[];
  nextSteps: string[];
}

class WorkshopChatService {
  private sessions: Map<string, WorkshopSession> = new Map();
  private activeSessionId: string | null = null;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    this.loadSessions();
  }

  /**
   * Create a new workshop session
   */
  createSession(
    title: string,
    projectId?: string,
    options: Partial<WorkshopSettings> = {}
  ): WorkshopSession {
    const sessionId = this.generateSessionId();
    
    const session: WorkshopSession = {
      id: sessionId,
      title,
      projectId,
      messages: [],
      context: {
        projectId,
        characters: [],
        locations: [],
        plotPoints: [],
        worldbuilding: [],
        goals: []
      },
      settings: {
        aiProvider: 'openai',
        aiModel: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        autoExtract: true,
        contextAwareness: true,
        suggestionsEnabled: true,
        entityDetection: true,
        ...options
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false
    };

    // Load project context if available
    if (projectId) {
      this.loadProjectContext(session);
    }

    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    this.saveSession(session);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): WorkshopSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get active session
   */
  getActiveSession(): WorkshopSession | undefined {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) : undefined;
  }

  /**
   * Set active session
   */
  setActiveSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
    }
  }

  /**
   * Get all sessions
   */
  getAllSessions(): WorkshopSession[] {
    return Array.from(this.sessions.values())
      .filter(session => !session.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Send message to AI workshop
   */
  async sendMessage(
    content: string,
    sessionId?: string
  ): Promise<ChatMessage> {
    const session = sessionId ? this.getSession(sessionId) : this.getActiveSession();
    if (!session) {
      throw new Error('No active workshop session');
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    session.messages.push(userMessage);

    try {
      // Prepare AI request with context
      const aiRequest: AIRequest = {
        prompt: content,
        systemPrompt: this.buildSystemPrompt(session),
        context: {
          projectId: session.context.projectId,
          storyId: session.context.storyId,
          sceneId: session.context.sceneId,
          characters: session.context.characters,
          worldbuilding: session.context.worldbuilding,
          previousText: this.getConversationContext(session),
          writingStyle: session.context.writingStyle,
          genre: session.context.genre
        },
        options: {
          model: session.settings.aiModel,
          temperature: session.settings.temperature,
          maxTokens: session.settings.maxTokens
        }
      };

      // Generate AI response
      const aiResponse = await aiProviderService.generateCompletion(aiRequest);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: Date.now(),
        metadata: {
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokens: aiResponse.usage.totalTokens,
          cost: aiResponse.usage.cost
        }
      };

      // Process message for extractions and suggestions
      if (session.settings.autoExtract) {
        await this.processMessageForExtractions(assistantMessage, session);
      }

      session.messages.push(assistantMessage);
      session.updatedAt = Date.now();
      this.saveSession(session);

      return assistantMessage;

    } catch (error) {
      console.error('Error sending workshop message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      session.messages.push(errorMessage);
      session.updatedAt = Date.now();
      this.saveSession(session);

      return errorMessage;
    }
  }

  /**
   * Extract suggestions to codex
   */
  async extractToCodex(
    suggestions: ExtractedSuggestion[],
    sessionId?: string
  ): Promise<void> {
    const session = sessionId ? this.getSession(sessionId) : this.getActiveSession();
    if (!session || !session.context.projectId) {
      throw new Error('No project context available for extraction');
    }

    for (const suggestion of suggestions) {
      try {
        switch (suggestion.type) {
          case 'character':
            await this.extractCharacter(suggestion, session.context.projectId);
            break;
          case 'location':
            await this.extractLocation(suggestion, session.context.projectId);
            break;
          case 'plot':
            await this.extractPlotPoint(suggestion, session.context.projectId);
            break;
          case 'worldbuilding':
            await this.extractWorldbuilding(suggestion, session.context.projectId);
            break;
          case 'timeline':
            await this.extractTimelineEvent(suggestion, session.context.projectId);
            break;
        }
      } catch (error) {
        console.error(`Failed to extract ${suggestion.type}:`, error);
      }
    }

    // Update session context with new entities
    await this.loadProjectContext(session);
    this.saveSession(session);
  }

  /**
   * Generate conversation summary
   */
  async generateSummary(sessionId?: string): Promise<ConversationSummary> {
    const session = sessionId ? this.getSession(sessionId) : this.getActiveSession();
    if (!session) {
      throw new Error('No session available for summary');
    }

    const conversationText = session.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const summaryRequest: AIRequest = {
      prompt: `Please analyze this conversation and provide a structured summary with:
1. Key points discussed
2. Decisions made
3. Action items identified
4. Any extracted entities (characters, locations, etc.)
5. Next steps or follow-up items

Conversation:
${conversationText}

Provide the summary in JSON format.`,
      systemPrompt: 'You are a helpful assistant that creates structured summaries of creative writing conversations.',
      options: {
        temperature: 0.3,
        maxTokens: 1000
      }
    };

    try {
      const response = await aiProviderService.generateCompletion(summaryRequest);
      const summaryData = JSON.parse(response.content);

      return {
        sessionId: session.id,
        keyPoints: summaryData.keyPoints || [],
        decisions: summaryData.decisions || [],
        actionItems: summaryData.actionItems || [],
        extractedEntities: summaryData.extractedEntities || [],
        nextSteps: summaryData.nextSteps || []
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      
      // Return basic summary
      return {
        sessionId: session.id,
        keyPoints: ['Conversation analysis failed'],
        decisions: [],
        actionItems: [],
        extractedEntities: [],
        nextSteps: ['Review conversation manually']
      };
    }
  }

  /**
   * Archive session
   */
  archiveSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.archived = true;
      session.updatedAt = Date.now();
      this.saveSession(session);
    }
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    localStorage.removeItem(`workshop_session_${sessionId}`);
    
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
  }

  /**
   * Update session settings
   */
  updateSessionSettings(
    sessionId: string,
    settings: Partial<WorkshopSettings>
  ): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.settings = { ...session.settings, ...settings };
      session.updatedAt = Date.now();
      this.saveSession(session);
    }
  }

  /**
   * Export conversation
   */
  exportConversation(
    sessionId: string,
    format: 'json' | 'markdown' | 'txt' = 'markdown'
  ): string {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    switch (format) {
      case 'json':
        return JSON.stringify(session, null, 2);
      
      case 'markdown':
        return this.exportToMarkdown(session);
      
      case 'txt':
        return this.exportToText(session);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private methods

  private buildSystemPrompt(session: WorkshopSession): string {
    let systemPrompt = `You are an expert writing assistant helping with creative writing and storytelling. You provide thoughtful, creative, and practical advice.`;

    if (session.context.genre) {
      systemPrompt += ` You are currently working on a ${session.context.genre} story.`;
    }

    if (session.context.characters.length > 0) {
      systemPrompt += ` The story includes these characters: ${session.context.characters.map(c => c.name).join(', ')}.`;
    }

    if (session.context.goals.length > 0) {
      systemPrompt += ` Current goals: ${session.context.goals.join(', ')}.`;
    }

    systemPrompt += ` Be encouraging, specific, and helpful. If you suggest creating or developing story elements, make your suggestions detailed enough to be actionable.`;

    return systemPrompt;
  }

  private getConversationContext(session: WorkshopSession): string {
    const recentMessages = session.messages.slice(-6); // Last 6 messages for context
    return recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  private async processMessageForExtractions(
    message: ChatMessage,
    session: WorkshopSession
  ): Promise<void> {
    if (!session.settings.autoExtract) return;

    // Extract entities and suggestions from the message
    const extractionRequest: AIRequest = {
      prompt: `Analyze this writing advice response and identify any specific story elements that could be extracted to a writer's codex:

"${message.content}"

Look for:
- Character suggestions (names, traits, roles)
- Location descriptions
- Plot points or story beats
- Worldbuilding elements
- Timeline events

Return a JSON array of extractions with this format:
{
  "extractions": [
    {
      "type": "character|location|plot|worldbuilding|timeline",
      "title": "Brief title",
      "description": "Short description", 
      "content": "Detailed content",
      "confidence": 0.0-1.0
    }
  ]
}`,
      systemPrompt: 'You are a helpful assistant that identifies extractable story elements from writing advice.',
      options: {
        temperature: 0.3,
        maxTokens: 500
      }
    };

    try {
      const response = await aiProviderService.generateCompletion(extractionRequest);
      const extractionData = JSON.parse(response.content);
      
      const suggestions: ExtractedSuggestion[] = extractionData.extractions?.map((ext: any) => ({
        id: this.generateId(),
        type: ext.type,
        title: ext.title,
        description: ext.description,
        content: ext.content,
        confidence: ext.confidence || 0.5,
        extractable: ext.confidence > 0.7
      })) || [];

      if (suggestions.length > 0) {
        message.metadata = {
          ...message.metadata,
          suggestions
        };
      }
    } catch (error) {
      console.error('Error processing extractions:', error);
    }
  }

  private async loadProjectContext(session: WorkshopSession): Promise<void> {
    if (!session.context.projectId) return;

    try {
      // This would integrate with the actual codex service
      // For now, we'll use placeholder data
      session.context.characters = [];
      session.context.locations = [];
      session.context.worldbuilding = [];
      session.context.plotPoints = [];
    } catch (error) {
      console.error('Error loading project context:', error);
    }
  }

  private async extractCharacter(suggestion: ExtractedSuggestion, projectId: string): Promise<void> {
    // Integration with codex service to create character
    console.log('Extracting character:', suggestion.title);
  }

  private async extractLocation(suggestion: ExtractedSuggestion, projectId: string): Promise<void> {
    // Integration with codex service to create location
    console.log('Extracting location:', suggestion.title);
  }

  private async extractPlotPoint(suggestion: ExtractedSuggestion, projectId: string): Promise<void> {
    // Integration with codex service to create plot point
    console.log('Extracting plot point:', suggestion.title);
  }

  private async extractWorldbuilding(suggestion: ExtractedSuggestion, projectId: string): Promise<void> {
    // Integration with codex service to create worldbuilding element
    console.log('Extracting worldbuilding:', suggestion.title);
  }

  private async extractTimelineEvent(suggestion: ExtractedSuggestion, projectId: string): Promise<void> {
    // Integration with codex service to create timeline event
    console.log('Extracting timeline event:', suggestion.title);
  }

  private exportToMarkdown(session: WorkshopSession): string {
    let markdown = `# ${session.title}\n\n`;
    markdown += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n`;
    markdown += `**Updated:** ${new Date(session.updatedAt).toLocaleString()}\n\n`;

    if (session.description) {
      markdown += `${session.description}\n\n`;
    }

    markdown += `## Conversation\n\n`;

    for (const message of session.messages) {
      const roleLabel = message.role === 'user' ? 'You' : 'Assistant';
      markdown += `### ${roleLabel}\n\n${message.content}\n\n`;
    }

    return markdown;
  }

  private exportToText(session: WorkshopSession): string {
    let text = `${session.title}\n${'='.repeat(session.title.length)}\n\n`;
    text += `Created: ${new Date(session.createdAt).toLocaleString()}\n`;
    text += `Updated: ${new Date(session.updatedAt).toLocaleString()}\n\n`;

    if (session.description) {
      text += `${session.description}\n\n`;
    }

    for (const message of session.messages) {
      const roleLabel = message.role === 'user' ? 'You' : 'Assistant';
      text += `${roleLabel}: ${message.content}\n\n`;
    }

    return text;
  }

  private loadSessions(): void {
    // Load sessions from localStorage
    const sessionKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('workshop_session_')
    );

    for (const key of sessionKeys) {
      try {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          const session: WorkshopSession = JSON.parse(sessionData);
          this.sessions.set(session.id, session);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
    }
  }

  private saveSession(session: WorkshopSession): void {
    localStorage.setItem(
      `workshop_session_${session.id}`,
      JSON.stringify(session)
    );
  }

  private generateSessionId(): string {
    return 'ws_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateId(): string {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const workshopChatService = new WorkshopChatService();