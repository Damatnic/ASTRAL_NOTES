/**
 * Enhanced Distraction-Free Mode Component
 * Provides true distraction-free writing experience with customizable minimal UI
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { 
  Eye,
  EyeOff,
  Settings,
  Save,
  Minimize2,
  Maximize2,
  Sun,
  Moon,
  Type,
  Focus,
  Timer,
  Target,
  Volume2,
  VolumeX,
  Palette,
  Coffee,
  Waves,
  TreePine,
  Snowflake,
  Zap,
  Heart,
  Brain,
  Feather
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface DistractionFreeModeProps {
  editor: Editor | null;
  isActive: boolean;
  onToggle: () => void;
  onSave?: () => void;
  className?: string;
}

interface DistractionFreeSettings {
  theme: 'light' | 'dark' | 'sepia' | 'forest' | 'ocean' | 'purple';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  maxWidth: number;
  showProgress: boolean;
  showCursor: boolean;
  showStats: boolean;
  enableSounds: boolean;
  enableFocusMode: boolean;
  ambientBackground: 'none' | 'rain' | 'forest' | 'ocean' | 'coffee' | 'fireplace';
  autoHideUI: boolean;
  hideUIDelay: number; // seconds
  showMotivationalQuotes: boolean;
  breathingAssistant: boolean;
  wordTarget: number;
  sessionTimer: boolean;
}

interface WritingStats {
  wordsWritten: number;
  charactersTyped: number;
  timeElapsed: number;
  wordsPerMinute: number;
  targetProgress: number;
}

const THEME_CONFIGS = {
  light: {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-blue-600',
    name: 'Light',
  },
  dark: {
    bg: 'bg-gray-900',
    text: 'text-gray-100',
    accent: 'text-blue-400',
    name: 'Dark',
  },
  sepia: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    accent: 'text-amber-700',
    name: 'Sepia',
  },
  forest: {
    bg: 'bg-green-50',
    text: 'text-green-900',
    accent: 'text-green-700',
    name: 'Forest',
  },
  ocean: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    accent: 'text-blue-700',
    name: 'Ocean',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    accent: 'text-purple-700',
    name: 'Purple',
  },
};

const AMBIENT_SOUNDS = {
  none: { name: 'None', icon: <VolumeX className="h-4 w-4" /> },
  rain: { name: 'Rain', icon: <Waves className="h-4 w-4" /> },
  forest: { name: 'Forest', icon: <TreePine className="h-4 w-4" /> },
  ocean: { name: 'Ocean', icon: <Waves className="h-4 w-4" /> },
  coffee: { name: 'Coffee Shop', icon: <Coffee className="h-4 w-4" /> },
  fireplace: { name: 'Fireplace', icon: <Snowflake className="h-4 w-4" /> },
};

const MOTIVATIONAL_QUOTES = [
  "The first draft of anything is shit. - Ernest Hemingway",
  "You can't use up creativity. The more you use, the more you have. - Maya Angelou",
  "Start writing, no matter what. The water does not flow until the faucet is turned on. - Louis L'Amour",
  "The scariest moment is always just before you start. - Stephen King",
  "If you want to be a writer, you must do two things above all others: read a lot and write a lot. - Stephen King",
  "Writing is thinking on paper. - William Zinsser",
  "The first rule of writing is to have something to say. - Oscar Wilde",
  "Write drunk, edit sober. - Ernest Hemingway",
];

export function DistractionFreeMode({
  editor,
  isActive,
  onToggle,
  onSave,
  className
}: DistractionFreeModeProps) {
  const [settings, setSettings] = useState<DistractionFreeSettings>({
    theme: 'light',
    fontSize: 18,
    fontFamily: 'Georgia, serif',
    lineHeight: 1.8,
    maxWidth: 750,
    showProgress: true,
    showCursor: true,
    showStats: false,
    enableSounds: false,
    enableFocusMode: false,
    ambientBackground: 'none',
    autoHideUI: true,
    hideUIDelay: 3,
    showMotivationalQuotes: false,
    breathingAssistant: false,
    wordTarget: 0,
    sessionTimer: false,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<WritingStats>({
    wordsWritten: 0,
    charactersTyped: 0,
    timeElapsed: 0,
    wordsPerMinute: 0,
    targetProgress: 0,
  });
  const [currentQuote, setCurrentQuote] = useState('');
  const [showBreathing, setShowBreathing] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [initialWordCount, setInitialWordCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout>();
  const breathingTimeoutRef = useRef<NodeJS.Timeout>();
  const quoteTimeoutRef = useRef<NodeJS.Timeout>();

  const toast = useToast();

  // Initialize word count
  useEffect(() => {
    if (editor && isActive) {
      setInitialWordCount(editor.storage.characterCount?.words() || 0);
    }
  }, [editor, isActive]);

  // Update stats
  useEffect(() => {
    if (!editor || !isActive) return;

    const updateStats = () => {
      const currentWords = editor.storage.characterCount?.words() || 0;
      const currentChars = editor.storage.characterCount?.characters() || 0;
      const timeElapsed = Math.floor((Date.now() - sessionStartTime) / 1000 / 60); // minutes
      const wordsWritten = Math.max(0, currentWords - initialWordCount);
      const wpm = timeElapsed > 0 ? Math.round(wordsWritten / timeElapsed) : 0;
      const targetProgress = settings.wordTarget > 0 ? (currentWords / settings.wordTarget) * 100 : 0;

      setStats({
        wordsWritten,
        charactersTyped: currentChars,
        timeElapsed,
        wordsPerMinute: wpm,
        targetProgress: Math.min(100, targetProgress),
      });
    };

    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [editor, isActive, sessionStartTime, initialWordCount, settings.wordTarget]);

  // Handle mouse movement for auto-hide UI
  useEffect(() => {
    if (!isActive || !settings.autoHideUI) return;

    const handleMouseMove = () => {
      setIsUIVisible(true);
      
      if (uiTimeoutRef.current) {
        clearTimeout(uiTimeoutRef.current);
      }
      
      uiTimeoutRef.current = setTimeout(() => {
        setIsUIVisible(false);
      }, settings.hideUIDelay * 1000);
    };

    const handleMouseLeave = () => {
      setIsUIVisible(false);
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (uiTimeoutRef.current) {
        clearTimeout(uiTimeoutRef.current);
      }
    };
  }, [isActive, settings.autoHideUI, settings.hideUIDelay]);

  // Motivational quotes
  useEffect(() => {
    if (!isActive || !settings.showMotivationalQuotes) return;

    const showRandomQuote = () => {
      const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setCurrentQuote(quote);
      toast.info(quote, { duration: 5000 });
    };

    // Show quote every 10 minutes
    const interval = setInterval(showRandomQuote, 10 * 60 * 1000);
    
    // Show initial quote after 2 minutes
    quoteTimeoutRef.current = setTimeout(showRandomQuote, 2 * 60 * 1000);

    return () => {
      clearInterval(interval);
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current);
      }
    };
  }, [isActive, settings.showMotivationalQuotes, toast]);

  // Breathing assistant
  useEffect(() => {
    if (!isActive || !settings.breathingAssistant) return;

    const startBreathingSession = () => {
      setShowBreathing(true);
      setTimeout(() => setShowBreathing(false), 60000); // 1 minute session
    };

    // Start breathing session every 30 minutes
    const interval = setInterval(startBreathingSession, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isActive, settings.breathingAssistant]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle settings with Ctrl/Cmd + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(!showSettings);
      }

      // Save with Ctrl/Cmd + S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }

      // Exit with Escape
      if (e.key === 'Escape') {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, showSettings, onSave, onToggle]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<DistractionFreeSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Format time
  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  if (!isActive) return null;

  const themeConfig = THEME_CONFIGS[settings.theme];

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 transition-all duration-500",
        themeConfig.bg,
        themeConfig.text,
        className
      )}
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
      }}
    >
      {/* Main Content */}
      <div className="h-full flex items-center justify-center p-8">
        <div 
          className="w-full max-w-none transition-all duration-300"
          style={{ maxWidth: `${settings.maxWidth}px` }}
        >
          {/* Editor Content Area */}
          <div className="min-h-[80vh] relative">
            {editor && (
              <div className="prose prose-lg max-w-none focus:outline-none">
                {/* This is where the editor content would be rendered */}
                {/* In actual implementation, you'd render the TipTap editor here */}
                <div className="min-h-[500px] p-8 focus:outline-none">
                  {/* Placeholder - in real implementation, render editor */}
                  <p className={cn("text-2xl leading-relaxed", themeConfig.text)}>
                    Your writing appears here in distraction-free mode...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating UI Controls */}
      <div className={cn(
        "fixed top-4 right-4 transition-opacity duration-300",
        isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="bg-black/10 backdrop-blur-sm hover:bg-black/20"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className="bg-black/10 backdrop-blur-sm hover:bg-black/20"
          >
            <Save className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="bg-black/10 backdrop-blur-sm hover:bg-black/20"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {settings.showProgress && settings.wordTarget > 0 && (
        <div className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300",
          isUIVisible ? "opacity-100" : "opacity-20"
        )}>
          <div className="bg-black/10 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="flex items-center gap-3 text-sm">
              <Target className="h-4 w-4" />
              <span>{Math.round(stats.targetProgress)}%</span>
              <div className="w-32 h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-300", themeConfig.accent.replace('text-', 'bg-'))}
                  style={{ width: `${stats.targetProgress}%` }}
                />
              </div>
              <span>{editor?.storage.characterCount?.words() || 0} / {settings.wordTarget}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Display */}
      {settings.showStats && (
        <div className={cn(
          "fixed bottom-4 left-4 transition-opacity duration-300",
          isUIVisible ? "opacity-100" : "opacity-20"
        )}>
          <div className="bg-black/10 backdrop-blur-sm rounded-lg p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span>{stats.wordsWritten} words written</span>
            </div>
            {settings.sessionTimer && (
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>{formatTime(stats.timeElapsed)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>{stats.wordsPerMinute} WPM</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-center h-full p-8">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Distraction-Free Settings</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSettings(false)}
                  >
                    ×
                  </Button>
                </div>

                {/* Theme Settings */}
                <div className="space-y-3">
                  <h3 className="font-medium">Appearance</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(THEME_CONFIGS).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={settings.theme === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSettings({ theme: key as any })}
                        className={cn("justify-start", config.bg, config.text)}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        {config.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-3">
                  <h3 className="font-medium">Typography</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Font Size</label>
                      <input
                        type="range"
                        min="14"
                        max="28"
                        value={settings.fontSize}
                        onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.fontSize}px</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Line Height</label>
                      <input
                        type="range"
                        min="1.2"
                        max="2.4"
                        step="0.1"
                        value={settings.lineHeight}
                        onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.lineHeight}</span>
                    </div>
                  </div>
                </div>

                {/* Writing Goals */}
                <div className="space-y-3">
                  <h3 className="font-medium">Writing Goals</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Word Target</label>
                      <input
                        type="number"
                        value={settings.wordTarget}
                        onChange={(e) => updateSettings({ wordTarget: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1 border rounded"
                        placeholder="0 = no target"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-3">
                  <h3 className="font-medium">Features</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'showProgress', label: 'Progress Bar', icon: <Target className="h-4 w-4" /> },
                      { key: 'showStats', label: 'Writing Stats', icon: <BarChart3 className="h-4 w-4" /> },
                      { key: 'sessionTimer', label: 'Session Timer', icon: <Timer className="h-4 w-4" /> },
                      { key: 'autoHideUI', label: 'Auto-hide UI', icon: <EyeOff className="h-4 w-4" /> },
                      { key: 'showMotivationalQuotes', label: 'Motivational Quotes', icon: <Heart className="h-4 w-4" /> },
                      { key: 'breathingAssistant', label: 'Breathing Assistant', icon: <Brain className="h-4 w-4" /> },
                    ].map(({ key, label, icon }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[key as keyof DistractionFreeSettings] as boolean}
                          onChange={(e) => updateSettings({ [key]: e.target.checked })}
                          className="rounded"
                        />
                        {icon}
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Breathing Assistant */}
      {showBreathing && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center mb-4 animate-pulse">
              <Feather className="h-8 w-8 text-white" />
            </div>
            <p className="text-white text-lg mb-2">Take a moment to breathe</p>
            <p className="text-white/70 text-sm">Inhale... hold... exhale...</p>
            <Button
              variant="ghost"
              className="mt-4 text-white hover:bg-white/10"
              onClick={() => setShowBreathing(false)}
            >
              Continue Writing
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className={cn(
        "fixed bottom-4 right-4 transition-opacity duration-300 text-xs",
        isUIVisible ? "opacity-50" : "opacity-0"
      )}>
        <div className="bg-black/10 backdrop-blur-sm rounded p-2 space-y-1">
          <div><kbd className="px-1 bg-black/20 rounded">Esc</kbd> Exit</div>
          <div><kbd className="px-1 bg-black/20 rounded">⌘,</kbd> Settings</div>
          <div><kbd className="px-1 bg-black/20 rounded">⌘S</kbd> Save</div>
        </div>
      </div>
    </div>
  );
}