/**
 * Focus Mode Component
 * Distraction-free writing with typewriter scrolling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toSafeInnerHtml } from '@/utils/sanitizeHtml';
import { 
  X, 
  Settings, 
  Type, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX,
  Monitor,
  Maximize2,
  Eye,
  EyeOff,
  AlignCenter,
  AlignLeft,
  Hash
} from 'lucide-react';
import { Button } from '../ui/Button';
import { writingSprintsService } from '@/services/writingSprintsService';

interface FocusModeProps {
  content: string;
  onChange: (content: string) => void;
  onClose: () => void;
  projectName?: string;
  chapterName?: string;
  wordGoal?: number;
}

interface FocusSettings {
  typewriterMode: boolean;
  typewriterOffset: 'center' | 'top-third' | 'top-quarter';
  theme: 'light' | 'dark' | 'sepia' | 'midnight';
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  paragraphSpacing: number;
  textWidth: 'narrow' | 'medium' | 'wide' | 'full';
  soundEnabled: boolean;
  ambientSound: 'none' | 'rain' | 'forest' | 'cafe' | 'fireplace';
  showWordCount: boolean;
  showTimer: boolean;
  showProgress: boolean;
  autoSave: boolean;
  zenMode: boolean; // Hides everything except text
  highlightCurrentLine: boolean;
  fadeInactiveParagraphs: boolean;
}

export function FocusMode({
  content,
  onChange,
  onClose,
  projectName,
  chapterName,
  wordGoal = 1000
}: FocusModeProps) {
  const [settings, setSettings] = useState<FocusSettings>({
    typewriterMode: true,
    typewriterOffset: 'center',
    theme: 'dark',
    fontSize: 18,
    lineHeight: 1.8,
    fontFamily: 'Georgia, serif',
    paragraphSpacing: 1.5,
    textWidth: 'medium',
    soundEnabled: false,
    ambientSound: 'none',
    showWordCount: true,
    showTimer: true,
    showProgress: true,
    autoSave: true,
    zenMode: false,
    highlightCurrentLine: true,
    fadeInactiveParagraphs: true
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [sessionWords, setSessionWords] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startWordCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    startWordCountRef.current = words;

    // Start session timer
    timerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    // Handle fullscreen
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Load saved settings
    const saved = localStorage.getItem('focusMode_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [content]);

  useEffect(() => {
    // Save settings
    localStorage.setItem('focusMode_settings', JSON.stringify(settings));

    // Handle ambient sound
    if (settings.soundEnabled && settings.ambientSound !== 'none') {
      // In production, you would load actual ambient sounds
      // For now, we'll just log
      console.log('Playing ambient sound:', settings.ambientSound);
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [settings]);

  useEffect(() => {
    // Update word count and session words
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    setSessionWords(words - startWordCountRef.current);
  }, [content]);

  const handleTypewriterScroll = useCallback(() => {
    if (!settings.typewriterMode || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    let targetOffset = 0;
    switch (settings.typewriterOffset) {
      case 'center':
        targetOffset = editorRect.height / 2;
        break;
      case 'top-third':
        targetOffset = editorRect.height / 3;
        break;
      case 'top-quarter':
        targetOffset = editorRect.height / 4;
        break;
    }

    const scrollTop = editorRef.current.scrollTop;
    const cursorY = rect.top - editorRect.top + scrollTop;
    const targetScrollTop = cursorY - targetOffset;

    editorRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [settings.typewriterMode, settings.typewriterOffset]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerText;
    onChange(newContent);
    handleTypewriterScroll();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape key exits focus mode
    if (e.key === 'Escape' && !settings.zenMode) {
      onClose();
    }
    
    // Cmd/Ctrl + S saves
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      // Trigger save
      console.log('Saving...');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeColors = () => {
    switch (settings.theme) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          text: 'text-gray-100',
          muted: 'text-gray-500',
          border: 'border-gray-700'
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          muted: 'text-amber-600',
          border: 'border-amber-200'
        };
      case 'midnight':
        return {
          bg: 'bg-slate-950',
          text: 'text-slate-200',
          muted: 'text-slate-600',
          border: 'border-slate-800'
        };
      default:
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          muted: 'text-gray-500',
          border: 'border-gray-300'
        };
    }
  };

  const getTextWidth = () => {
    switch (settings.textWidth) {
      case 'narrow': return 'max-w-xl';
      case 'medium': return 'max-w-2xl';
      case 'wide': return 'max-w-4xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-2xl';
    }
  };

  const theme = getThemeColors();
  const textWidth = getTextWidth();

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 ${theme.bg} ${theme.text} overflow-hidden`}
      onKeyDown={handleKeyDown}
    >
      {/* Header - Hidden in zen mode */}
      {!settings.zenMode && (
        <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center ${theme.bg} bg-opacity-90 backdrop-blur-sm z-10`}>
          <div className="flex items-center gap-4">
            {projectName && (
              <span className={`text-sm ${theme.muted}`}>{projectName}</span>
            )}
            {chapterName && (
              <>
                <span className={theme.muted}>/</span>
                <span className={`text-sm ${theme.muted}`}>{chapterName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {settings.showTimer && (
              <div className={`text-sm ${theme.muted}`}>
                {formatTime(sessionTime)}
              </div>
            )}

            {settings.showWordCount && (
              <div className="text-sm">
                <span className={theme.muted}>Words:</span>{' '}
                <span className="font-medium">{wordCount}</span>
                {sessionWords !== 0 && (
                  <span className={`ml-2 ${sessionWords > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {sessionWords > 0 ? '+' : ''}{sessionWords}
                  </span>
                )}
              </div>
            )}

            {settings.showProgress && wordGoal && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${Math.min((wordCount / wordGoal) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs">
                  {Math.round((wordCount / wordGoal) * 100)}%
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        className={`h-full overflow-y-auto ${settings.zenMode ? 'pt-20' : 'pt-20'} pb-20`}
        style={{
          scrollBehavior: settings.typewriterMode ? 'smooth' : 'auto'
        }}
      >
        <div className={`mx-auto px-8 ${textWidth}`}>
          <div
            contentEditable
            className={`outline-none min-h-screen ${
              settings.fadeInactiveParagraphs ? 'focus-paragraphs' : ''
            }`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              fontFamily: settings.fontFamily,
              caretColor: 'currentColor'
            }}
            onInput={handleContentChange}
            dangerouslySetInnerHTML={toSafeInnerHtml(content)}
          />
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className={`absolute top-16 right-4 w-80 ${theme.bg} ${theme.border} border rounded-lg shadow-2xl p-4 z-20`}>
          <h3 className="font-semibold mb-4">Focus Settings</h3>

          {/* Theme */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark', 'sepia', 'midnight'] as const).map(t => (
                <Button
                  key={t}
                  variant={settings.theme === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings({ ...settings, theme: t })}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="14"
              max="24"
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Line Height: {settings.lineHeight}
            </label>
            <input
              type="range"
              min="1.2"
              max="2.5"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Typewriter Mode */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.typewriterMode}
                onChange={(e) => setSettings({ ...settings, typewriterMode: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Typewriter Mode</span>
            </label>
            {settings.typewriterMode && (
              <select
                value={settings.typewriterOffset}
                onChange={(e) => setSettings({ ...settings, typewriterOffset: e.target.value as any })}
                className="mt-2 w-full px-2 py-1 text-sm border rounded"
              >
                <option value="center">Center</option>
                <option value="top-third">Top Third</option>
                <option value="top-quarter">Top Quarter</option>
              </select>
            )}
          </div>

          {/* Text Width */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Text Width</label>
            <select
              value={settings.textWidth}
              onChange={(e) => setSettings({ ...settings, textWidth: e.target.value as any })}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="narrow">Narrow</option>
              <option value="medium">Medium</option>
              <option value="wide">Wide</option>
              <option value="full">Full</option>
            </select>
          </div>

          {/* Display Options */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.highlightCurrentLine}
                onChange={(e) => setSettings({ ...settings, highlightCurrentLine: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Highlight Current Line</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.fadeInactiveParagraphs}
                onChange={(e) => setSettings({ ...settings, fadeInactiveParagraphs: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Fade Inactive Paragraphs</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.zenMode}
                onChange={(e) => setSettings({ ...settings, zenMode: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Zen Mode (Hide UI)</span>
            </label>
          </div>

          {/* Ambient Sound */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Ambient Sound</label>
            <select
              value={settings.ambientSound}
              onChange={(e) => setSettings({ ...settings, ambientSound: e.target.value as any })}
              className="w-full px-2 py-1 text-sm border rounded"
              disabled={!settings.soundEnabled}
            >
              <option value="none">None</option>
              <option value="rain">Rain</option>
              <option value="forest">Forest</option>
              <option value="cafe">Cafe</option>
              <option value="fireplace">Fireplace</option>
            </select>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Enable Sound</span>
            </label>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsSettingsOpen(false)}
          >
            Close Settings
          </Button>
        </div>
      )}

      <style jsx>{`
        .focus-paragraphs p:not(:focus-within) {
          opacity: 0.4;
          transition: opacity 0.3s ease;
        }
        
        .focus-paragraphs p:focus-within {
          opacity: 1;
        }
        
        .focus-paragraphs p:focus-within + p,
        .focus-paragraphs p:has(+ p:focus-within) {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

export default FocusMode;
