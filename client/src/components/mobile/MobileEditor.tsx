/**
 * MobileEditor Component
 * Touch-optimized writing interface with voice integration and gesture controls
 * Designed for comfortable mobile writing experiences
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import TouchOptimizedInput from './TouchOptimizedInput';
import VoiceWritingAssistant from './VoiceWritingAssistant';
import {
  Mic,
  MicOff,
  Type,
  Eye,
  EyeOff,
  MoreHorizontal,
  Undo2,
  Redo2,
  Save,
  Share2,
  Settings,
  Zap,
  BookOpen,
  Clock,
  Target
} from 'lucide-react';

export interface MobileEditorProps {
  sceneId: string;
  content?: string;
  isVoiceMode?: boolean;
  wordCount?: number;
  onContentChange?: (content: string) => void;
  onVoiceToggle?: () => void;
  onSave?: () => void;
  className?: string;
}

interface WritingStats {
  wordCount: number;
  charCount: number;
  sessionWords: number;
  writingTime: number;
  wordsPerMinute: number;
}

interface WritingMode {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  settings: {
    fontSize: number;
    lineHeight: number;
    wordWrap: boolean;
    showStats: boolean;
    focusMode: boolean;
  };
}

const WRITING_MODES: WritingMode[] = [
  {
    id: 'comfortable',
    name: 'Comfortable',
    icon: BookOpen,
    description: 'Balanced writing experience',
    settings: {
      fontSize: 16,
      lineHeight: 1.6,
      wordWrap: true,
      showStats: true,
      focusMode: false
    }
  },
  {
    id: 'focus',
    name: 'Focus',
    icon: Target,
    description: 'Distraction-free writing',
    settings: {
      fontSize: 18,
      lineHeight: 1.8,
      wordWrap: true,
      showStats: false,
      focusMode: true
    }
  },
  {
    id: 'speed',
    name: 'Speed',
    icon: Zap,
    description: 'Fast-paced writing',
    settings: {
      fontSize: 14,
      lineHeight: 1.4,
      wordWrap: true,
      showStats: true,
      focusMode: false
    }
  }
];

export const MobileEditor: React.FC<MobileEditorProps> = ({
  sceneId,
  content = '',
  isVoiceMode = false,
  wordCount = 0,
  onContentChange,
  onVoiceToggle,
  onSave,
  className
}) => {
  const [currentContent, setCurrentContent] = useState(content);
  const [writingMode, setWritingMode] = useState<WritingMode>(WRITING_MODES[0]);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [writingStats, setWritingStats] = useState<WritingStats>({
    wordCount: 0,
    charCount: 0,
    sessionWords: 0,
    writingTime: 0,
    wordsPerMinute: 0
  });
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const sessionStartRef = useRef(Date.now());
  const lastWordCountRef = useRef(0);
  
  // Motion values for gesture handling
  const toolbarY = useMotionValue(0);
  const editorScale = useMotionValue(1);
  
  // Transform values
  const toolbarOpacity = useTransform(toolbarY, [0, -50], [1, 0]);

  // Update writing stats
  const updateStats = useCallback((text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    const sessionTime = (Date.now() - sessionStartRef.current) / 1000 / 60; // minutes
    const sessionWords = Math.max(0, wordCount - lastWordCountRef.current);
    const wordsPerMinute = sessionTime > 0 ? sessionWords / sessionTime : 0;
    
    setWritingStats({
      wordCount,
      charCount,
      sessionWords,
      writingTime: sessionTime,
      wordsPerMinute: Math.round(wordsPerMinute)
    });
  }, []);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    // Add to undo stack
    if (currentContent !== newContent) {
      setUndoStack(prev => [...prev.slice(-19), currentContent]);
      setRedoStack([]);
    }
    
    setCurrentContent(newContent);
    updateStats(newContent);
    onContentChange?.(newContent);
  }, [currentContent, updateStats, onContentChange]);

  // Handle voice transcription
  const handleVoiceInput = useCallback((transcript: string) => {
    const newContent = currentContent + (currentContent ? ' ' : '') + transcript;
    handleContentChange(newContent);
  }, [currentContent, handleContentChange]);

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack(prev => [currentContent, ...prev]);
      setUndoStack(prev => prev.slice(0, -1));
      setCurrentContent(previousContent);
      updateStats(previousContent);
    }
  }, [undoStack, currentContent, updateStats]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[0];
      setUndoStack(prev => [...prev, currentContent]);
      setRedoStack(prev => prev.slice(1));
      setCurrentContent(nextContent);
      updateStats(nextContent);
    }
  }, [redoStack, currentContent, updateStats]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (currentContent !== content) {
        onSave?.();
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [currentContent, content, onSave]);

  // Handle toolbar gestures
  const handleToolbarSwipe = useCallback((deltaY: number) => {
    if (deltaY < -30) {
      setShowToolbar(false);
      toolbarY.set(-50);
    } else if (deltaY > 30) {
      setShowToolbar(true);
      toolbarY.set(0);
    }
  }, [toolbarY]);

  const renderToolbar = () => (
    <motion.div
      className="flex items-center justify-between p-3 bg-background/95 backdrop-blur-sm border-b"
      style={{ y: toolbarY, opacity: toolbarOpacity }}
      initial={{ y: 0 }}
      animate={{ y: showToolbar ? 0 : -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isVoiceMode ? 'default' : 'ghost'}
          onClick={onVoiceToggle}
          className="p-2"
        >
          {isVoiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="p-2"
        >
          {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        
        <div className="h-4 w-px bg-border mx-1" />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="p-2"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-2"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={writingMode.id}
          onChange={(e) => {
            const mode = WRITING_MODES.find(m => m.id === e.target.value);
            if (mode) setWritingMode(mode);
          }}
          className="text-sm bg-transparent border-none focus:outline-none"
        >
          {WRITING_MODES.map(mode => (
            <option key={mode.id} value={mode.id}>
              {mode.name}
            </option>
          ))}
        </select>
        
        <Button size="sm" variant="ghost" onClick={onSave} className="p-2">
          <Save className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="ghost" className="p-2">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStats = () => (
    <motion.div
      className="flex items-center justify-between p-2 bg-muted/50 text-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: showStats && writingMode.settings.showStats ? 1 : 0, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Type className="h-3 w-3" />
          <span>{writingStats.wordCount} words</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{Math.round(writingStats.writingTime)}m</span>
        </div>
        
        {writingStats.wordsPerMinute > 0 && (
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{writingStats.wordsPerMinute} wpm</span>
          </div>
        )}
      </div>
      
      <Badge variant="outline" className="text-xs">
        +{writingStats.sessionWords} today
      </Badge>
    </motion.div>
  );

  const renderEditor = () => {
    if (isVoiceMode) {
      return (
        <VoiceWritingAssistant
          onTranscriptUpdate={handleVoiceInput}
          onToggle={onVoiceToggle}
          className="flex-1"
        />
      );
    }

    return (
      <motion.div
        className="flex-1 relative"
        style={{ scale: editorScale }}
      >
        {isPreviewMode ? (
          <div 
            className="p-4 prose prose-sm max-w-none h-full overflow-y-auto"
            style={{
              fontSize: writingMode.settings.fontSize,
              lineHeight: writingMode.settings.lineHeight
            }}
          >
            {currentContent.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph || '\u00A0'}
              </p>
            ))}
          </div>
        ) : (
          <TouchOptimizedInput
            ref={editorRef}
            value={currentContent}
            onChange={handleContentChange}
            placeholder="Start writing your scene..."
            className="w-full h-full p-4 border-none resize-none focus:outline-none bg-transparent"
            style={{
              fontSize: writingMode.settings.fontSize,
              lineHeight: writingMode.settings.lineHeight,
              wordWrap: writingMode.settings.wordWrap ? 'break-word' : 'normal'
            }}
            multiline
            autoFocus
            spellCheck
            autoComplete="off"
            onSwipe={handleToolbarSwipe}
          />
        )}
        
        {/* Focus mode overlay */}
        {writingMode.settings.focusMode && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn("mobile-editor h-full flex flex-col bg-background", className)}>
      {/* Toolbar */}
      {renderToolbar()}
      
      {/* Stats Bar */}
      {renderStats()}
      
      {/* Editor Content */}
      {renderEditor()}
      
      {/* Quick Access Bar (appears on swipe up) */}
      <motion.div
        className="flex items-center justify-center p-2 bg-muted/30"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
      </motion.div>
    </div>
  );
};

export default MobileEditor;