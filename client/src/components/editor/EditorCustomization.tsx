/**
 * Editor Customization Panel
 * Handles themes, fonts, layout preferences, and personalization
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Palette, 
  Type, 
  Settings, 
  Layout, 
  Monitor, 
  Moon, 
  Sun,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  AlignLeft,
  AlignCenter,
  Contrast,
  Zap,
  Volume2,
  VolumeX,
  MousePointer,
  Keyboard,
  Accessibility,
  RotateCcw,
  Save,
  Download,
  Upload,
  Sliders,
  Grid,
  Focus,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Slider } from '@/components/ui/Slider';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';

interface EditorCustomizationProps {
  preferences: EditorPreferences;
  onPreferencesChange: (preferences: Partial<EditorPreferences>) => void;
  onExportPreferences?: () => void;
  onImportPreferences?: (preferences: EditorPreferences) => void;
  className?: string;
}

interface EditorPreferences {
  // Theme settings
  theme: 'light' | 'dark' | 'auto' | 'sepia' | 'high-contrast';
  colorScheme: 'default' | 'cosmic' | 'astral' | 'warm' | 'cool' | 'nature';
  
  // Typography
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  
  // Layout
  maxWidth: number;
  padding: number;
  showLineNumbers: boolean;
  showRuler: boolean;
  wrapText: boolean;
  
  // Writing modes
  isDistractionFree: boolean;
  isFullscreen: boolean;
  isZenMode: boolean;
  showMinimap: boolean;
  
  // Accessibility
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  
  // Sound
  enableSounds: boolean;
  typingSounds: boolean;
  saveSound: boolean;
  
  // Advanced
  cursorBlinking: boolean;
  smoothScrolling: boolean;
  autoIndent: boolean;
  tabSize: number;
  
  // Custom CSS
  customCSS?: string;
}

const FONT_FAMILIES = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter (Default)' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Crimson Text, serif', label: 'Crimson Text' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Fira Code, monospace', label: 'Fira Code (Mono)' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono' },
];

const COLOR_SCHEMES = [
  { value: 'default', label: 'Default', primary: '#6366f1', secondary: '#e5e7eb' },
  { value: 'cosmic', label: 'Cosmic', primary: '#8b5cf6', secondary: '#ddd6fe' },
  { value: 'astral', label: 'Astral', primary: '#06b6d4', secondary: '#cffafe' },
  { value: 'warm', label: 'Warm', primary: '#f59e0b', secondary: '#fef3c7' },
  { value: 'cool', label: 'Cool', primary: '#3b82f6', secondary: '#dbeafe' },
  { value: 'nature', label: 'Nature', primary: '#10b981', secondary: '#d1fae5' },
];

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Monitor },
  { value: 'sepia', label: 'Sepia', icon: Eye },
  { value: 'high-contrast', label: 'High Contrast', icon: Contrast },
];

export function EditorCustomization({
  preferences,
  onPreferencesChange,
  onExportPreferences,
  onImportPreferences,
  className
}: EditorCustomizationProps) {
  const toast = useToast();
  const [previewText, setPreviewText] = useState(
    'The quick brown fox jumps over the lazy dog. This preview shows how your text will look with the current settings.'
  );

  // Apply preferences to preview
  const previewStyle = {
    fontSize: `${preferences.fontSize}px`,
    fontFamily: preferences.fontFamily,
    lineHeight: preferences.lineHeight,
    letterSpacing: `${preferences.letterSpacing}px`,
    wordSpacing: `${preferences.wordSpacing}px`,
    maxWidth: `${preferences.maxWidth}px`,
    padding: `${preferences.padding}px`,
  };

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaults: EditorPreferences = {
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
    };
    
    onPreferencesChange(defaults);
    toast.success('Preferences reset to defaults');
  }, [onPreferencesChange, toast]);

  // Export preferences
  const exportPreferences = useCallback(() => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `editor-preferences-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    onExportPreferences?.();
    toast.success('Preferences exported');
  }, [preferences, onExportPreferences, toast]);

  // Import preferences
  const importPreferences = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        onImportPreferences?.(imported);
        onPreferencesChange(imported);
        toast.success('Preferences imported');
      } catch (error) {
        toast.error('Failed to import preferences');
      }
    };
    reader.readAsText(file);
  }, [onImportPreferences, onPreferencesChange, toast]);

  const tabs: TabItem[] = [
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Palette className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => {
                const Icon = theme.icon;
                return (
                  <Button
                    key={theme.value}
                    variant={preferences.theme === theme.value ? 'default' : 'outline'}
                    onClick={() => onPreferencesChange({ theme: theme.value as any })}
                    className="flex items-center gap-2 h-auto p-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{theme.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Color Scheme</label>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_SCHEMES.map((scheme) => (
                <Button
                  key={scheme.value}
                  variant={preferences.colorScheme === scheme.value ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ colorScheme: scheme.value as any })}
                  className="flex items-center gap-2 h-auto p-3"
                >
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: scheme.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: scheme.secondary }}
                    />
                  </div>
                  <span className="text-sm">{scheme.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Preview</label>
            <Card className="p-4">
              <div style={previewStyle} className={cn(
                "text-foreground transition-all duration-200",
                preferences.theme === 'dark' && "dark",
                preferences.highContrast && "contrast-more",
                preferences.largeText && "text-lg"
              )}>
                {previewText}
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'typography',
      label: 'Typography',
      icon: <Type className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Font Family */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Font Family</label>
            <select
              value={preferences.fontFamily}
              onChange={(e) => onPreferencesChange({ fontFamily: e.target.value })}
              className="w-full p-2 border rounded text-sm"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Font Size</label>
              <span className="text-sm text-muted-foreground">{preferences.fontSize}px</span>
            </div>
            <Slider
              value={[preferences.fontSize]}
              onValueChange={([value]) => onPreferencesChange({ fontSize: value })}
              min={12}
              max={32}
              step={1}
            />
          </div>

          {/* Line Height */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Line Height</label>
              <span className="text-sm text-muted-foreground">{preferences.lineHeight}</span>
            </div>
            <Slider
              value={[preferences.lineHeight]}
              onValueChange={([value]) => onPreferencesChange({ lineHeight: value })}
              min={1.0}
              max={3.0}
              step={0.1}
            />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Letter Spacing</label>
              <span className="text-sm text-muted-foreground">{preferences.letterSpacing}px</span>
            </div>
            <Slider
              value={[preferences.letterSpacing]}
              onValueChange={([value]) => onPreferencesChange({ letterSpacing: value })}
              min={-2}
              max={4}
              step={0.1}
            />
          </div>

          {/* Word Spacing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Word Spacing</label>
              <span className="text-sm text-muted-foreground">{preferences.wordSpacing}px</span>
            </div>
            <Slider
              value={[preferences.wordSpacing]}
              onValueChange={([value]) => onPreferencesChange({ wordSpacing: value })}
              min={-2}
              max={8}
              step={0.1}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: <Layout className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Max Width */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Max Width</label>
              <span className="text-sm text-muted-foreground">{preferences.maxWidth}px</span>
            </div>
            <Slider
              value={[preferences.maxWidth]}
              onValueChange={([value]) => onPreferencesChange({ maxWidth: value })}
              min={400}
              max={1200}
              step={20}
            />
          </div>

          {/* Padding */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Padding</label>
              <span className="text-sm text-muted-foreground">{preferences.padding}px</span>
            </div>
            <Slider
              value={[preferences.padding]}
              onValueChange={([value]) => onPreferencesChange({ padding: value })}
              min={8}
              max={64}
              step={4}
            />
          </div>

          {/* Layout Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Options</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show line numbers</span>
                <Button
                  size="sm"
                  variant={preferences.showLineNumbers ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ showLineNumbers: !preferences.showLineNumbers })}
                >
                  {preferences.showLineNumbers ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Show ruler</span>
                <Button
                  size="sm"
                  variant={preferences.showRuler ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ showRuler: !preferences.showRuler })}
                >
                  {preferences.showRuler ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Wrap text</span>
                <Button
                  size="sm"
                  variant={preferences.wrapText ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ wrapText: !preferences.wrapText })}
                >
                  {preferences.wrapText ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Show minimap</span>
                <Button
                  size="sm"
                  variant={preferences.showMinimap ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ showMinimap: !preferences.showMinimap })}
                >
                  {preferences.showMinimap ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      icon: <Accessibility className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Visual Accessibility */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Visual</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">High contrast mode</span>
                <Button
                  size="sm"
                  variant={preferences.highContrast ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ highContrast: !preferences.highContrast })}
                >
                  {preferences.highContrast ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Large text</span>
                <Button
                  size="sm"
                  variant={preferences.largeText ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ largeText: !preferences.largeText })}
                >
                  {preferences.largeText ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Reduce motion</span>
                <Button
                  size="sm"
                  variant={preferences.reduceMotion ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ reduceMotion: !preferences.reduceMotion })}
                >
                  {preferences.reduceMotion ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Navigation</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Screen reader mode</span>
                <Button
                  size="sm"
                  variant={preferences.screenReaderMode ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ screenReaderMode: !preferences.screenReaderMode })}
                >
                  {preferences.screenReaderMode ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Keyboard navigation</span>
                <Button
                  size="sm"
                  variant={preferences.keyboardNavigation ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ keyboardNavigation: !preferences.keyboardNavigation })}
                >
                  {preferences.keyboardNavigation ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sound */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Sound</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable sounds</span>
                <Button
                  size="sm"
                  variant={preferences.enableSounds ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ enableSounds: !preferences.enableSounds })}
                >
                  {preferences.enableSounds ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Typing sounds</span>
                <Button
                  size="sm"
                  variant={preferences.typingSounds ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ typingSounds: !preferences.typingSounds })}
                  disabled={!preferences.enableSounds}
                >
                  {preferences.typingSounds ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Save sound</span>
                <Button
                  size="sm"
                  variant={preferences.saveSound ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ saveSound: !preferences.saveSound })}
                  disabled={!preferences.enableSounds}
                >
                  {preferences.saveSound ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Editor Behavior */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Editor Behavior</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Cursor blinking</span>
                <Button
                  size="sm"
                  variant={preferences.cursorBlinking ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ cursorBlinking: !preferences.cursorBlinking })}
                >
                  {preferences.cursorBlinking ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Smooth scrolling</span>
                <Button
                  size="sm"
                  variant={preferences.smoothScrolling ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ smoothScrolling: !preferences.smoothScrolling })}
                >
                  {preferences.smoothScrolling ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto indent</span>
                <Button
                  size="sm"
                  variant={preferences.autoIndent ? 'default' : 'outline'}
                  onClick={() => onPreferencesChange({ autoIndent: !preferences.autoIndent })}
                >
                  {preferences.autoIndent ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tab Size</label>
              <span className="text-sm text-muted-foreground">{preferences.tabSize} spaces</span>
            </div>
            <Slider
              value={[preferences.tabSize]}
              onValueChange={([value]) => onPreferencesChange({ tabSize: value })}
              min={2}
              max={8}
              step={1}
            />
          </div>

          {/* Import/Export */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Preferences</label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportPreferences}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
              
              <label className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importPreferences}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 pointer-events-none"
                >
                  <Upload className="h-3 w-3" />
                  Import
                </Button>
              </label>
              
              <Button
                size="sm"
                variant="outline"
                onClick={resetToDefaults}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          </div>

          {/* Custom CSS */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Custom CSS</label>
            <textarea
              value={preferences.customCSS || ''}
              onChange={(e) => onPreferencesChange({ customCSS: e.target.value })}
              placeholder="/* Add your custom CSS here */\n.editor {\n  /* Your styles */\n}"
              className="w-full h-32 p-3 border rounded text-sm font-mono resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add custom CSS to personalize your editor further. Changes apply in real-time.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card className={cn("editor-customization w-80", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sliders className="h-4 w-4" />
          Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs tabs={tabs} variant="underline" />
      </CardContent>
    </Card>
  );
}

export default EditorCustomization;