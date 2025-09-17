// Theme Settings Component
// Comprehensive theme and customization panel

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaletteIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  TypeIcon,
  ZapIcon,
  EyeIcon,
  KeyboardIcon,
  DownloadIcon,
  UploadIcon,
  RotateCcwIcon,
  CheckIcon,
  XIcon,
  SlidersIcon,
  ContrastIcon,
  AccessibilityIcon,
  CodeIcon,
  SidebarIcon
} from 'lucide-react';
import themeService from '../../services/themeService';

interface ThemeSettingsProps {
  onClose?: () => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [themes, setThemes] = useState(themeService.getThemes());
  const [currentTheme, setCurrentTheme] = useState(themeService.getCurrentTheme());
  const [preferences, setPreferences] = useState(themeService.getPreferences());
  const [shortcuts, setShortcuts] = useState(themeService.getKeyboardShortcuts());
  const [customCSS, setCustomCSS] = useState(preferences.customCSS || '');
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [systemPrefs, setSystemPrefs] = useState(themeService.getSystemPreferences());

  useEffect(() => {
    const unsubscribeTheme = themeService.onThemeChange((theme) => {
      setCurrentTheme(theme);
    });

    const unsubscribePrefs = themeService.onPreferencesChange((prefs) => {
      setPreferences(prefs);
    });

    return () => {
      unsubscribeTheme();
      unsubscribePrefs();
    };
  }, []);

  const handleThemeChange = (themeId: string) => {
    themeService.setTheme(themeId);
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    themeService.updatePreferences({ [key]: value });
  };

  const handleCustomCSSChange = (css: string) => {
    setCustomCSS(css);
    themeService.setCustomCSS(css);
  };

  const handleShortcutEdit = (shortcutId: string, keys: string[]) => {
    themeService.updateKeyboardShortcut(shortcutId, keys);
    setShortcuts(themeService.getKeyboardShortcuts());
    setEditingShortcut(null);
  };

  const resetShortcuts = () => {
    themeService.resetKeyboardShortcuts();
    setShortcuts(themeService.getKeyboardShortcuts());
  };

  const exportTheme = () => {
    if (!currentTheme) return;
    
    const themeData = themeService.exportTheme(currentTheme.id);
    if (themeData) {
      const blob = new Blob([themeData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (themeService.importTheme(content)) {
          setThemes(themeService.getThemes());
        }
      };
      reader.readAsText(file);
    }
  };

  const applySystemPreferences = () => {
    themeService.applySystemPreferences();
    setPreferences(themeService.getPreferences());
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
    { id: 'typography', label: 'Typography', icon: TypeIcon },
    { id: 'accessibility', label: 'Accessibility', icon: AccessibilityIcon },
    { id: 'shortcuts', label: 'Shortcuts', icon: KeyboardIcon },
    { id: 'advanced', label: 'Advanced', icon: SlidersIcon }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const fontFamilyOptions = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Source Sans Pro',
    'Georgia',
    'Times New Roman',
    'JetBrains Mono',
    'Fira Code'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PaletteIcon className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Theme & Customization</h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                    ${activeTab === tab.id 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* System Preferences */}
            <div className="mt-8 p-3 bg-gray-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">System</h4>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Dark mode:</span>
                  <span>{systemPrefs.prefersDarkMode ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reduced motion:</span>
                  <span>{systemPrefs.prefersReducedMotion ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>High contrast:</span>
                  <span>{systemPrefs.prefersHighContrast ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <button
                onClick={applySystemPreferences}
                className="w-full mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Apply System Settings
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Themes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {themes.map(theme => (
                        <motion.button
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          className={`
                            relative p-4 rounded-lg border-2 transition-all
                            ${currentTheme?.id === theme.id
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                            }
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Theme Preview */}
                          <div className="mb-3">
                            <div 
                              className="w-full h-16 rounded-md mb-2"
                              style={{ backgroundColor: theme.colors.background }}
                            >
                              <div className="flex h-full">
                                <div 
                                  className="w-1/3 h-full rounded-l-md"
                                  style={{ backgroundColor: theme.colors.surface }}
                                />
                                <div 
                                  className="flex-1 p-2"
                                  style={{ backgroundColor: theme.colors.background }}
                                >
                                  <div 
                                    className="w-full h-2 rounded mb-1"
                                    style={{ backgroundColor: theme.colors.primary }}
                                  />
                                  <div 
                                    className="w-2/3 h-1 rounded"
                                    style={{ backgroundColor: theme.colors.text }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="font-medium text-gray-200">{theme.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{theme.mode}</p>
                          </div>
                          
                          {currentTheme?.id === theme.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                            >
                              <CheckIcon className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Theme Mode */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Theme Mode</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'light', icon: SunIcon, label: 'Light' },
                          { id: 'dark', icon: MoonIcon, label: 'Dark' },
                          { id: 'auto', icon: MonitorIcon, label: 'Auto' }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => {
                              const themeId = mode.id === 'light' ? 'cosmic-light' : 
                                            mode.id === 'dark' ? 'cosmic-dark' : 'auto';
                              handleThemeChange(themeId);
                            }}
                            className={`
                              flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors
                              ${currentTheme?.mode === mode.id || 
                                (mode.id === 'auto' && preferences.theme === 'auto')
                                ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                                : 'border-gray-600 hover:border-gray-500 text-gray-400'
                              }
                            `}
                          >
                            <mode.icon className="w-5 h-5" />
                            <span className="text-xs">{mode.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout Options */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Layout</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-gray-400">Compact Mode</span>
                          <input
                            type="checkbox"
                            checked={preferences.compactMode}
                            onChange={(e) => handlePreferenceChange('compactMode', e.target.checked)}
                            className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-400">Sidebar Position</span>
                          <select
                            value={preferences.sidebarPosition}
                            onChange={(e) => handlePreferenceChange('sidebarPosition', e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                          >
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Import/Export */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Theme Management</h4>
                    <div className="flex gap-3">
                      <button
                        onClick={exportTheme}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Export Theme
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer">
                        <UploadIcon className="w-4 h-4" />
                        Import Theme
                        <input
                          type="file"
                          accept=".json"
                          onChange={importTheme}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'typography' && (
                <motion.div
                  key="typography"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Typography Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Font Size */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Font Size</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {fontSizeOptions.map(size => (
                            <button
                              key={size.value}
                              onClick={() => handlePreferenceChange('fontSize', size.value)}
                              className={`
                                p-3 rounded-lg border transition-colors text-center
                                ${preferences.fontSize === size.value
                                  ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                                  : 'border-gray-600 hover:border-gray-500 text-gray-400'
                                }
                              `}
                            >
                              <div className={`
                                font-semibold mb-1
                                ${size.value === 'small' ? 'text-sm' : 
                                  size.value === 'large' ? 'text-lg' : 'text-base'}
                              `}>
                                Aa
                              </div>
                              <div className="text-xs">{size.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Family */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Font Family</h4>
                        <select
                          value={preferences.fontFamily}
                          onChange={(e) => handlePreferenceChange('fontFamily', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200"
                        >
                          {fontFamilyOptions.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-6 p-6 bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Preview</h4>
                      <div 
                        className="text-gray-200"
                        style={{ 
                          fontFamily: preferences.fontFamily,
                          fontSize: preferences.fontSize === 'small' ? '0.875rem' :
                                   preferences.fontSize === 'large' ? '1.125rem' : '1rem'
                        }}
                      >
                        <h5 className="font-bold mb-2">Chapter 1: The Beginning</h5>
                        <p className="mb-4">
                          The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and demonstrates how your chosen typography settings will appear in the editor.
                        </p>
                        <p className="text-sm text-gray-400">
                          Secondary text appears in a lighter shade, while maintaining excellent readability across all font combinations.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'accessibility' && (
                <motion.div
                  key="accessibility"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Accessibility Options</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <ZapIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-gray-200 font-medium">Reduced Motion</div>
                            <div className="text-gray-400 text-sm">Minimize animations and transitions</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.reducedMotion}
                          onChange={(e) => handlePreferenceChange('reducedMotion', e.target.checked)}
                          className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <ContrastIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-gray-200 font-medium">High Contrast</div>
                            <div className="text-gray-400 text-sm">Enhance contrast for better visibility</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.highContrast}
                          onChange={(e) => handlePreferenceChange('highContrast', e.target.checked)}
                          className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>

                      {/* High Contrast Theme Option */}
                      {preferences.highContrast && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="ml-8 p-3 bg-gray-700 rounded-lg"
                        >
                          <button
                            onClick={() => handleThemeChange('high-contrast-dark')}
                            className="text-sm text-purple-400 hover:text-purple-300"
                          >
                            Switch to High Contrast Theme
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Screen Reader Info */}
                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <h4 className="text-blue-300 font-medium mb-2">Screen Reader Support</h4>
                      <p className="text-blue-200 text-sm">
                        ASTRAL_NOTES is designed with full screen reader compatibility. All interactive elements include proper ARIA labels and keyboard navigation is supported throughout the application.
                      </p>
                    </div>

                    {/* Keyboard Navigation Help */}
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <h4 className="text-green-300 font-medium mb-2">Keyboard Navigation</h4>
                      <div className="text-green-200 text-sm space-y-1">
                        <p>• Tab: Navigate forward between interactive elements</p>
                        <p>• Shift + Tab: Navigate backward</p>
                        <p>• Enter/Space: Activate buttons and links</p>
                        <p>• Arrow keys: Navigate within menus and lists</p>
                        <p>• Escape: Close modals and dropdowns</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Other tabs would continue here... */}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};