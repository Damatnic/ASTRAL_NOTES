/**
 * Advanced Note Editor with Sophisticated Writing Tools
 * Enhanced with professional-grade features and AI assistance
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Settings, 
  BookOpen, 
  Target, 
  Clock, 
  BarChart3,
  FileText,
  Lightbulb,
  Focus,
  Eye,
  EyeOff,
  Split,
  Maximize2,
  Minimize2,
  PenTool,
  Type,
  Palette,
  MessageSquare,
  History,
  Download,
  Users,
  Sliders,
  Brain,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { noteService } from '@/services/noteService';
import { projectService } from '@/services/projectService';
import { AIWritingAssistant } from '@/components/ai/AIWritingAssistant';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/utils/cn';

// Enhanced Editor Components
import { useEditor, type EditorPreferences } from '@/hooks/useEditor';
import { AdvancedEditor } from '@/components/editor/AdvancedEditor';
import { ImportExportPanel } from '@/components/editor/ImportExportPanel';
import { WritingAssistance } from '@/components/editor/WritingAssistance';
import { CollaborationPanel } from '@/components/editor/CollaborationPanel';
import { VersionHistory } from '@/components/editor/VersionHistory';
import { AutoSaveIndicator } from '@/components/editor/AutoSaveIndicator';
import { EditorCustomization } from '@/components/editor/EditorCustomization';
import type { Note, Project } from '@/types/global';

type WritingMode = 'focused' | 'distraction-free' | 'split' | 'preview';
type EditorTheme = 'default' | 'minimal' | 'dark-focus' | 'warm';
type PanelType = 'none' | 'writing' | 'collaboration' | 'versions' | 'import-export' | 'customization';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen?: Date;
}

export function NoteEditor() {
  const { projectId, noteId } = useParams<{ projectId: string; noteId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [note, setNote] = useState<Note | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Editor preferences
  const [writingMode, setWritingMode] = useState<WritingMode>('focused');
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('default');
  const [showWordCount, setShowWordCount] = useState(true);
  const [showReadingTime, setShowReadingTime] = useState(true);
  const [targetWordCount, setTargetWordCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Advanced Features
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Writing analytics
  const [sessionStartTime] = useState(new Date());
  const [sessionWordCount, setSessionWordCount] = useState(0);
  const [initialWordCount, setInitialWordCount] = useState(0);
  
  // Current user (in a real app, this would come from auth context)
  const currentUser: User = {
    id: 'current-user',
    name: 'Current User',
    email: 'user@example.com',
    role: 'owner',
    isOnline: true,
  };
  
  // Editor preferences
  const [editorPreferences, setEditorPreferences] = useState<EditorPreferences>({
    theme: 'light',
    colorScheme: 'default',
    fontSize: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
    lineHeight: 1.6,
    letterSpacing: 0,
    wordSpacing: 0,
    maxWidth: 800,
    padding: 24,
    showLineNumbers: false,
    showRuler: false,
    wrapText: true,
    isDistractionFree: false,
    isFullscreen: false,
    isZenMode: false,
    showMinimap: false,
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    enableSounds: true,
    typingSounds: false,
    saveSound: true,
    cursorBlinking: true,
    smoothScrolling: true,
    autoIndent: true,
    tabSize: 4,
  });
  
  // Enhanced editor hook
  const {
    editor,
    stats,
    preferences,
    isTyping,
    isDirty,
    updatePreferences,
    saveContent,
    exportContent,
    importContent,
    createVersion,
    getVersionHistory,
    restoreVersion,
  } = useEditor({
    content: note?.content || '',
    onChange: handleContentChange,
    onSave: handleSave,
    preferences: editorPreferences,
  });

  // Load note and project data
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        
        // Load project
        const projectData = await projectService.getProjectById(projectId);
        if (!projectData) {
          toast.error('Project not found');
          navigate('/projects');
          return;
        }
        setProject(projectData);

        // Load or create note
        if (noteId) {
          const noteData = await noteService.getNoteById(noteId);
          if (!noteData) {
            toast.error('Note not found');
            navigate(`/projects/${projectId}`);
            return;
          }
          setNote(noteData);
          setInitialWordCount(noteData.wordCount);
          setSessionWordCount(noteData.wordCount);
        } else {
          // Create new note
          const newNote = await noteService.createNote({
            title: 'Untitled Note',
            content: '',
            projectId,
            type: 'note',
            tags: [],
            position: 0,
          });
          setNote(newNote);
          setInitialWordCount(0);
          setSessionWordCount(0);
        }
      } catch (error) {
        toast.error('Failed to load note');
        navigate('/projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, noteId, navigate, toast]);

  // Online status detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus('idle');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save functionality
  const saveNote = useCallback(async (noteData: Note) => {
    if (!noteData?.id) return false;
    
    try {
      setSaveStatus('saving');
      setIsSaving(true);
      await noteService.updateNote(noteData.id, noteData);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      toast.error('Failed to save note');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Update note content
  const handleContentChange = useCallback((content: string) => {
    if (!note) return;
    
    try {
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const updatedNote = { ...note, content, wordCount };
      
      setNote(updatedNote);
      setSessionWordCount(wordCount);
      setHasUnsavedChanges(true);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Content change error:', error);
      toast.error('Failed to update content');
    }
  }, [note, toast]);

  // Update note title
  const handleTitleChange = useCallback((title: string) => {
    if (!note) return;
    
    try {
      const updatedNote = { ...note, title };
      setNote(updatedNote);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Title change error:', error);
      toast.error('Failed to update title');
    }
  }, [note, toast]);

  // Manual save
  const handleSave = useCallback(async () => {
    if (!note) return;
    
    try {
      const success = await saveNote(note);
      if (success && editorPreferences.saveSound && editorPreferences.enableSounds) {
        // Play save sound (would be implemented with actual audio)
        console.log('🔊 Save sound');
      }
    } catch (error) {
      console.error('Manual save error:', error);
      toast.error('Failed to save note manually');
    }
  }, [note, saveNote, toast, editorPreferences]);
  
  // Handle import
  const handleImport = useCallback((content: string, format: 'html' | 'md' | 'txt') => {
    if (!note) return;
    
    // Process content based on format
    let processedContent = content;
    if (format === 'md') {
      // Convert markdown to HTML (basic implementation)
      processedContent = content
        .replace(/^(#{1,6})\s+(.*$)/gm, (_, hashes, text) => `<h${hashes.length}>${text}</h${hashes.length}>`)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
    } else if (format === 'txt') {
      processedContent = `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }
    
    const updatedNote = { ...note, content: processedContent };
    setNote(updatedNote);
    setHasUnsavedChanges(true);
    toast.success('Content imported successfully');
  }, [note, toast]);
  
  // Handle version operations
  const handleVersionCreate = useCallback((label?: string) => {
    createVersion(label);
  }, [createVersion]);
  
  const handleVersionRestore = useCallback((version: any) => {
    if (!note) return;
    
    const updatedNote = { ...note, content: version.content };
    setNote(updatedNote);
    setHasUnsavedChanges(true);
  }, [note]);
  
  // Handle collaboration
  const handleShare = useCallback((shareSettings: any) => {
    // Implement sharing logic
    console.log('Share settings:', shareSettings);
    toast.success('Share settings updated');
  }, [toast]);
  
  const handleCommentAdd = useCallback((comment: any) => {
    // Implement comment logic
    console.log('Comment added:', comment);
  }, []);
  
  const handleAnnotationAdd = useCallback((annotation: any) => {
    // Implement annotation logic
    console.log('Annotation added:', annotation);
  }, []);
  
  // Toggle panel
  const togglePanel = useCallback((panelType: PanelType) => {
    setActivePanel(current => current === panelType ? 'none' : panelType);
  }, []);
  
  // Update editor preferences
  const handlePreferencesChange = useCallback((newPreferences: Partial<EditorPreferences>) => {
    setEditorPreferences(prev => ({ ...prev, ...newPreferences }));
    updatePreferences(newPreferences);
  }, [updatePreferences]);

  // Writing session analytics
  const sessionStats = useMemo(() => {
    const sessionTime = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60); // minutes
    const wordsWritten = Math.max(0, sessionWordCount - initialWordCount);
    const wordsPerMinute = sessionTime > 0 ? Math.round(wordsWritten / sessionTime) : 0;
    const readingTime = Math.ceil(sessionWordCount / 200); // Average reading speed
    
    return {
      sessionTime,
      wordsWritten,
      wordsPerMinute,
      readingTime,
      progress: targetWordCount > 0 ? Math.min(100, (sessionWordCount / targetWordCount) * 100) : 0,
    };
  }, [sessionStartTime, sessionWordCount, initialWordCount, targetWordCount]);

  // Editor mode options
  const writingModeOptions: DropdownOption[] = [
    { value: 'focused', label: 'Focused Mode', icon: <Focus className="h-4 w-4" />, description: 'Minimal distractions' },
    { value: 'distraction-free', label: 'Distraction Free', icon: <EyeOff className="h-4 w-4" />, description: 'Hide all UI elements' },
    { value: 'split', label: 'Split View', icon: <Split className="h-4 w-4" />, description: 'Editor and preview side by side' },
    { value: 'preview', label: 'Preview Mode', icon: <Eye className="h-4 w-4" />, description: 'Read-only preview' },
  ];

  const editorThemeOptions: DropdownOption[] = [
    { value: 'default', label: 'Default', icon: <Palette className="h-4 w-4" /> },
    { value: 'minimal', label: 'Minimal', icon: <Type className="h-4 w-4" /> },
    { value: 'dark-focus', label: 'Dark Focus', icon: <PenTool className="h-4 w-4" /> },
    { value: 'warm', label: 'Warm', icon: <Lightbulb className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Note not found</h2>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const tabs: TabItem[] = [
    {
      id: 'editor',
      label: 'Editor',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Note Title */}
          <div>
            <Input
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note title..."
              className="text-2xl font-bold border-none shadow-none p-0 focus:ring-0"
              variant="cosmic"
            />
          </div>

          {/* Advanced Editor */}
          <ErrorBoundary fallback={
            <div className="p-8 text-center border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-destructive font-medium mb-2">Editor Error</p>
              <p className="text-sm text-muted-foreground">
                The text editor encountered an error. Please refresh the page to continue.
              </p>
            </div>
          }>
            <div className="relative">
              <AdvancedEditor
                content={note.content}
                onChange={handleContentChange}
                onSave={handleSave}
                placeholder="Start writing your thoughts..."
                isDistracted={writingMode === 'distraction-free'}
                showStats={showWordCount}
                showToolbar={writingMode !== 'distraction-free'}
                className={cn(
                  "transition-all duration-300",
                  isFullscreen && "min-h-screen"
                )}
              />
              
              {/* Auto-save indicator */}
              <div className="absolute top-4 right-4 z-10">
                <AutoSaveIndicator
                  saveStatus={saveStatus}
                  lastSaved={lastSaved}
                  hasUnsavedChanges={hasUnsavedChanges}
                  isOnline={isOnline}
                  autoSaveEnabled={true}
                  onManualSave={handleSave}
                  onRecoverDraft={() => toast.info('Draft recovery not implemented yet')}
                  onResolveConflict={() => toast.info('Conflict resolution not implemented yet')}
                />
              </div>
            </div>
          </ErrorBoundary>
        </div>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600" />
                  Word Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionWordCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{sessionStats.wordsWritten} this session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  Session Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats.sessionTime}m</div>
                <p className="text-xs text-muted-foreground">
                  {sessionStats.wordsPerMinute} words/min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  Reading Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats.readingTime}m</div>
                <p className="text-xs text-muted-foreground">
                  Estimated reading time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(sessionStats.progress)}%</div>
                <p className="text-xs text-muted-foreground">
                  {targetWordCount > 0 ? `of ${targetWordCount} words` : 'No target set'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {targetWordCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Word Count Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{sessionWordCount} words</span>
                    <span>{targetWordCount} target</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(sessionStats.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Set Target */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Word Count Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={targetWordCount || ''}
                  onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                  placeholder="Set word count target..."
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTargetWordCount(0)}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''
    } ${
      writingMode === 'distraction-free' ? 'bg-slate-50 dark:bg-slate-950' : 'bg-background'
    }`}>
      {/* Header */}
      {writingMode !== 'distraction-free' && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(`/projects/${projectId}`)}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <div>
                <h1 className="font-semibold">{project.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dropdown
                options={writingModeOptions}
                value={writingMode}
                onChange={(mode) => setWritingMode(mode as WritingMode)}
                placeholder="Writing Mode"
              />
              
              <Dropdown
                options={editorThemeOptions}
                value={editorTheme}
                onChange={(theme) => setEditorTheme(theme as EditorTheme)}
                placeholder="Theme"
              />

              {/* Panel Toggle Buttons */}
              <Button
                variant={activePanel === 'writing' ? 'default' : 'outline'}
                size="icon"
                onClick={() => togglePanel('writing')}
                title="Writing Assistant"
              >
                <Brain className="h-4 w-4" />
              </Button>
              
              <Button
                variant={activePanel === 'collaboration' ? 'default' : 'outline'}
                size="icon"
                onClick={() => togglePanel('collaboration')}
                title="Collaboration"
              >
                <Users className="h-4 w-4" />
              </Button>
              
              <Button
                variant={activePanel === 'versions' ? 'default' : 'outline'}
                size="icon"
                onClick={() => togglePanel('versions')}
                title="Version History"
              >
                <History className="h-4 w-4" />
              </Button>
              
              <Button
                variant={activePanel === 'import-export' ? 'default' : 'outline'}
                size="icon"
                onClick={() => togglePanel('import-export')}
                title="Import/Export"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant={activePanel === 'customization' ? 'default' : 'outline'}
                size="icon"
                onClick={() => togglePanel('customization')}
                title="Customization"
              >
                <Sliders className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                title="Toggle AI Writing Assistant"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <Button
                variant="cosmic"
                onClick={handleSave}
                loading={isSaving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex transition-all duration-300",
        writingMode !== 'distraction-free' ? 'p-6' : 'p-8'
      )}>
        {/* Main Editor Area */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          activePanel !== 'none' && "mr-6"
        )}>
          {writingMode === 'distraction-free' ? (
            <div className="max-w-4xl mx-auto">
              <Input
                value={note.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title..."
                className="text-3xl font-bold border-none shadow-none p-0 focus:ring-0 mb-8 bg-transparent"
              />
              <ErrorBoundary fallback={
                <div className="p-8 text-center border border-destructive/20 rounded-lg bg-destructive/5">
                  <p className="text-destructive font-medium mb-2">Editor Error</p>
                  <p className="text-sm text-muted-foreground">
                    The text editor encountered an error. Please refresh the page to continue.
                  </p>
                </div>
              }>
                <AdvancedEditor
                  content={note.content}
                  onChange={handleContentChange}
                  onSave={handleSave}
                  placeholder="Write without distractions..."
                  isDistracted={true}
                  showStats={false}
                  showToolbar={false}
                />
              </ErrorBoundary>
            </div>
          ) : (
            <Tabs tabs={tabs} variant="cosmic" />
          )}
        </div>
        
        {/* Side Panels */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          activePanel === 'none' ? 'w-0 overflow-hidden' : 'w-80 min-w-80'
        )}>
          {activePanel === 'writing' && (
            <WritingAssistance
              editor={editor}
              content={note.content}
              onContentChange={handleContentChange}
              isVisible={true}
              onToggle={() => setActivePanel('none')}
            />
          )}
          
          {activePanel === 'collaboration' && note && (
            <CollaborationPanel
              editor={editor}
              content={note.content}
              noteId={note.id}
              currentUser={currentUser}
              onShare={handleShare}
              onCommentAdd={handleCommentAdd}
              onAnnotationAdd={handleAnnotationAdd}
            />
          )}
          
          {activePanel === 'versions' && note && (
            <VersionHistory
              editor={editor}
              content={note.content}
              noteId={note.id}
              onVersionRestore={handleVersionRestore}
              onVersionCreate={handleVersionCreate}
            />
          )}
          
          {activePanel === 'import-export' && note && (
            <ImportExportPanel
              content={note.content}
              title={note.title}
              onImport={handleImport}
              onExport={(format) => {
                const exported = exportContent(format as any);
                console.log(`Exported as ${format}:`, exported);
              }}
            />
          )}
          
          {activePanel === 'customization' && (
            <EditorCustomization
              preferences={editorPreferences}
              onPreferencesChange={handlePreferencesChange}
              onExportPreferences={() => {
                const dataStr = JSON.stringify(editorPreferences, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'editor-preferences.json';
                link.click();
                URL.revokeObjectURL(url);
              }}
            />
          )}
        </div>
      </div>

      {/* Floating Controls for Distraction-Free Mode */}
      {writingMode === 'distraction-free' && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2">
          <Button
            variant="cosmic"
            size="sm"
            onClick={() => setWritingMode('focused')}
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Exit Focus
          </Button>
          <Button
            variant="cosmic"
            onClick={handleSave}
            loading={isSaving}
            size="icon"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* AI Writing Assistant */}
      <ErrorBoundary fallback={
        <div className="fixed bottom-4 right-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">AI Assistant Error</p>
        </div>
      }>
        <AIWritingAssistant
          content={note?.content || ''}
          onContentChange={handleContentChange}
          isVisible={showAIAssistant && activePanel === 'none'}
          onToggle={() => setShowAIAssistant(!showAIAssistant)}
        />
      </ErrorBoundary>
      
      {/* Keyboard Shortcuts Help */}
      {editorPreferences.keyboardNavigation && (
        <div className="fixed bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur p-2 rounded border opacity-50 hover:opacity-100 transition-opacity">
          <div className="space-y-1">
            <div><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+S</kbd> Save</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Shift+D</kbd> Focus Mode</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">F11</kbd> Fullscreen</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+F</kbd> Find</div>
          </div>
        </div>
      )}
    </div>
  );
}