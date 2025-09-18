/**
 * AI Workshop Panel - Advanced AI chat interface with context awareness
 * Supports multi-turn conversations, extract-to-codex, and intelligent suggestions
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Settings, 
  Download, 
  Trash2,
  Plus,
  Archive,
  BookOpen,
  Target,
  Lightbulb,
  ArrowRight,
  Copy,
  Check,
  X,
  Wand2,
  Brain,
  Clock,
  Star,
  Bookmark,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

import { workshopChatService, WorkshopSession, ChatMessage, ExtractedSuggestion } from '@/services/workshopChatService';
import { aiProviderService } from '@/services/aiProviderService';

interface AIWorkshopPanelProps {
  projectId?: string;
  storyId?: string;
  sceneId?: string;
  initialText?: string;
}

export function AIWorkshopPanel({ 
  projectId, 
  storyId, 
  sceneId, 
  initialText 
}: AIWorkshopPanelProps) {
  const [activeSession, setActiveSession] = useState<WorkshopSession | null>(null);
  const [sessions, setSessions] = useState<WorkshopSession[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTab, setSelectedTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
    if (initialText) {
      setCurrentMessage(initialText);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const loadSessions = () => {
    const allSessions = workshopChatService.getAllSessions();
    setSessions(allSessions);
    
    if (allSessions.length > 0 && !activeSession) {
      setActiveSession(allSessions[0]);
      workshopChatService.setActiveSession(allSessions[0].id);
    }
  };

  const createNewSession = () => {
    const title = `Workshop Session ${sessions.length + 1}`;
    const newSession = workshopChatService.createSession(title, projectId);
    setSessions([newSession, ...sessions]);
    setActiveSession(newSession);
  };

  const selectSession = (sessionId: string) => {
    const session = workshopChatService.getSession(sessionId);
    if (session) {
      setActiveSession(session);
      workshopChatService.setActiveSession(sessionId);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeSession || isLoading) return;

    setIsLoading(true);
    try {
      const response = await workshopChatService.sendMessage(currentMessage, activeSession.id);
      
      // Update active session
      const updatedSession = workshopChatService.getSession(activeSession.id);
      if (updatedSession) {
        setActiveSession(updatedSession);
      }
      
      setCurrentMessage('');
      
      // Focus back to textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const extractSuggestion = async (suggestion: ExtractedSuggestion) => {
    if (!activeSession?.context.projectId) return;

    try {
      await workshopChatService.extractToCodex([suggestion], activeSession.id);
      
      // Update session to reflect extraction
      const updatedSession = workshopChatService.getSession(activeSession.id);
      if (updatedSession) {
        setActiveSession(updatedSession);
      }
    } catch (error) {
      console.error('Error extracting suggestion:', error);
    }
  };

  const exportConversation = () => {
    if (!activeSession) return;

    const markdown = workshopChatService.exportConversation(activeSession.id, 'markdown');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const archiveSession = () => {
    if (!activeSession) return;

    workshopChatService.archiveSession(activeSession.id);
    loadSessions();
    
    if (sessions.length > 1) {
      const nextSession = sessions.find(s => s.id !== activeSession.id);
      if (nextSession) {
        setActiveSession(nextSession);
      }
    } else {
      setActiveSession(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <Bot className="h-4 w-4" />
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-muted'
          }`}>
            <div className="text-sm">{message.content}</div>
            
            {message.metadata?.suggestions && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium opacity-80">
                  Extractable Suggestions:
                </div>
                {message.metadata.suggestions
                  .filter(s => s.extractable)
                  .map(suggestion => (
                    <div key={suggestion.id} className="bg-background/10 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.type}
                          </Badge>
                          <span className="text-xs font-medium">{suggestion.title}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => extractSuggestion(suggestion)}
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Extract
                        </Button>
                      </div>
                      <div className="text-xs opacity-80">{suggestion.description}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          <div className={`text-xs text-muted-foreground mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            {formatTimestamp(message.timestamp)}
            {message.metadata?.provider && (
              <span className="ml-2">via {message.metadata.provider}</span>
            )}
          </div>
        </div>
        
        {isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <User className="h-4 w-4" />
          </Avatar>
        )}
      </div>
    );
  };

  const renderSessionList = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Workshop Sessions</h3>
        <Button size="sm" onClick={createNewSession}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>
      
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {sessions.map(session => (
          <Card 
            key={session.id} 
            className={`cursor-pointer transition-colors p-3 ${
              activeSession?.id === session.id ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
            onClick={() => selectSession(session.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{session.title}</div>
                <div className="text-xs text-muted-foreground">
                  {session.messages.length} messages • {formatTimestamp(session.updatedAt)}
                </div>
              </div>
              {session.id === activeSession?.id && (
                <Badge variant="secondary" className="ml-2">Active</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">AI Provider</label>
        <Select 
          value={activeSession?.settings.aiProvider || 'openai'}
          onValueChange={(value) => {
            if (activeSession) {
              workshopChatService.updateSessionSettings(activeSession.id, {
                aiProvider: value
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aiProviderService.getProviders().map(provider => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Model</label>
        <Select 
          value={activeSession?.settings.aiModel || 'gpt-3.5-turbo'}
          onValueChange={(value) => {
            if (activeSession) {
              workshopChatService.updateSessionSettings(activeSession.id, {
                aiModel: value
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Temperature: {activeSession?.settings.temperature || 0.7}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={activeSession?.settings.temperature || 0.7}
          onChange={(e) => {
            if (activeSession) {
              workshopChatService.updateSessionSettings(activeSession.id, {
                temperature: parseFloat(e.target.value)
              });
            }
          }}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Auto-extract entities</label>
          <Switch
            checked={activeSession?.settings.autoExtract || false}
            onCheckedChange={(checked) => {
              if (activeSession) {
                workshopChatService.updateSessionSettings(activeSession.id, {
                  autoExtract: checked
                });
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Context awareness</label>
          <Switch
            checked={activeSession?.settings.contextAwareness || false}
            onCheckedChange={(checked) => {
              if (activeSession) {
                workshopChatService.updateSessionSettings(activeSession.id, {
                  contextAwareness: checked
                });
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Entity detection</label>
          <Switch
            checked={activeSession?.settings.entityDetection || false}
            onCheckedChange={(checked) => {
              if (activeSession) {
                workshopChatService.updateSessionSettings(activeSession.id, {
                  entityDetection: checked
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  if (!activeSession) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">AI Workshop</h3>
          <p className="text-muted-foreground mb-4">
            Start a conversation with your AI writing assistant
          </p>
          <Button onClick={createNewSession}>
            <Plus className="h-4 w-4 mr-2" />
            Start New Session
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Workshop</h2>
          <p className="text-muted-foreground">
            Collaborate with AI to develop your story
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportConversation}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={archiveSession}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{activeSession.title}</CardTitle>
                  <CardDescription>
                    {activeSession.messages.length} messages • {activeSession.settings.aiProvider}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {activeSession.settings.autoExtract && (
                    <Badge variant="secondary">Auto-extract</Badge>
                  )}
                  {activeSession.settings.contextAwareness && (
                    <Badge variant="secondary">Context-aware</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeSession.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>Start your conversation with the AI assistant</p>
                    <p className="text-sm mt-1">Ask questions, brainstorm ideas, or get writing advice</p>
                  </div>
                ) : (
                  activeSession.messages.map((message, index) => 
                    renderMessage(message, index)
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Ask your AI assistant anything about writing, characters, plot, world-building..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[80px] resize-none"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="self-end"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </CardContent>
          </Card>

          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Session Settings</CardTitle>
                <CardDescription>
                  Configure AI behavior and features for this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSettings()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Workshop Sessions</CardTitle>
              <CardDescription>
                Manage your AI conversation sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSessionList()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context">
          <Card>
            <CardHeader>
              <CardTitle>Context Information</CardTitle>
              <CardDescription>
                Project context that helps AI provide better assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <div className="text-sm text-muted-foreground">
                    {activeSession.context.projectId || 'No project selected'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Characters</label>
                  <div className="text-sm text-muted-foreground">
                    {activeSession.context.characters.length} characters loaded
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Locations</label>
                  <div className="text-sm text-muted-foreground">
                    {activeSession.context.locations.length} locations loaded
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Goals</label>
                  <div className="space-y-1">
                    {activeSession.context.goals.map((goal, index) => (
                      <div key={index} className="text-sm bg-muted p-2 rounded">
                        {goal}
                      </div>
                    ))}
                    {activeSession.context.goals.length === 0 && (
                      <div className="text-sm text-muted-foreground">No goals set</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}