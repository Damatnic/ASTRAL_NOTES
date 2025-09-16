/**
 * Advanced Note Editor with Sophisticated Writing Tools
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
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextEditor } from '@/components/ui/TextEditor';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { noteService } from '@/services/noteService';
import { projectService } from '@/services/projectService';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AIWritingAssistant } from '@/components/ai/AIWritingAssistant';
import type { Note, Project } from '@/types/global';

type WritingMode = 'focused' | 'distraction-free' | 'split' | 'preview';
type EditorTheme = 'default' | 'minimal' | 'dark-focus' | 'warm';

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
  
  // Writing analytics
  const [sessionStartTime] = useState(new Date());
  const [sessionWordCount, setSessionWordCount] = useState(0);
  const [initialWordCount, setInitialWordCount] = useState(0);
  
  // AI Writing Assistant
  const [showAIAssistant, setShowAIAssistant] = useState(false);

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

  // Auto-save functionality
  const saveNote = useCallback(async (noteData: Note) => {
    if (!noteData.id) return;
    
    try {
      setIsSaving(true);
      await noteService.updateNote(noteData.id, noteData);
      setHasUnsavedChanges(false);
      toast.success('Note saved', { duration: 1000 });
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  useAutoSave(note, saveNote, 3000);

  // Update note content
  const handleContentChange = useCallback((content: string) => {
    if (!note) return;
    
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const updatedNote = { ...note, content, wordCount };
    
    setNote(updatedNote);
    setSessionWordCount(wordCount);
    setHasUnsavedChanges(true);
  }, [note]);

  // Update note title
  const handleTitleChange = useCallback((title: string) => {
    if (!note) return;
    
    const updatedNote = { ...note, title };
    setNote(updatedNote);
    setHasUnsavedChanges(true);
  }, [note]);

  // Manual save
  const handleSave = useCallback(async () => {
    if (!note) return;
    await saveNote(note);
  }, [note, saveNote]);

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

          {/* Text Editor */}
          <TextEditor
            content={note.content}
            onChange={handleContentChange}
            placeholder="Start writing your thoughts..."
            autoSave={true}
            autoSaveDelay={3000}
            showWordCount={showWordCount}
            showToolbar={writingMode !== 'distraction-free'}
            variant={editorTheme === 'default' ? 'default' : editorTheme === 'minimal' ? 'cosmic' : 'astral'}
            maxHeight="calc(100vh - 300px)"
            onAutoSave={() => {}}
          />
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
      <div className={`${writingMode !== 'distraction-free' ? 'p-6' : 'p-8'} max-w-none`}>
        {writingMode === 'distraction-free' ? (
          <div className="max-w-4xl mx-auto">
            <Input
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note title..."
              className="text-3xl font-bold border-none shadow-none p-0 focus:ring-0 mb-8 bg-transparent"
            />
            <TextEditor
              content={note.content}
              onChange={handleContentChange}
              placeholder="Write without distractions..."
              autoSave={true}
              showWordCount={false}
              showToolbar={false}
              variant="default"
              maxHeight="calc(100vh - 200px)"
            />
          </div>
        ) : (
          <Tabs tabs={tabs} variant="cosmic" />
        )}
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
      <AIWritingAssistant
        content={note?.content || ''}
        onContentChange={handleContentChange}
        isVisible={showAIAssistant}
        onToggle={() => setShowAIAssistant(!showAIAssistant)}
      />
    </div>
  );
}