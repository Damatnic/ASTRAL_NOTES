// Theme Service for ASTRAL_NOTES
// Handles theme management, customization, and dark/light mode

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

interface ThemeShadow {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

interface ThemeConfig {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadow: ThemeShadow;
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  customProperties?: Record<string, string>;
}

interface UserPreferences {
  theme: string;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  reducedMotion: boolean;
  highContrast: boolean;
  compactMode: boolean;
  editorTheme: string;
  codeTheme: string;
  sidebarPosition: 'left' | 'right';
  customCSS?: string;
}

interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  action: string;
  category: 'navigation' | 'editing' | 'view' | 'project' | 'custom';
  enabled: boolean;
  customizable: boolean;
}

export class ThemeService {
  private static instance: ThemeService;
  private themes: Map<string, ThemeConfig> = new Map();
  private currentTheme: ThemeConfig | null = null;
  private userPreferences: UserPreferences;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private listeners: Set<(theme: ThemeConfig) => void> = new Set();
  private preferenceListeners: Set<(prefs: UserPreferences) => void> = new Set();
  private mediaQuery: MediaQueryList | null = null;

  private constructor() {
    this.userPreferences = this.getDefaultPreferences();
    this.initialize();
  }

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private initialize(): void {
    // Initialize built-in themes
    this.initializeThemes();
    
    // Load user preferences
    this.loadUserPreferences();
    
    // Initialize keyboard shortcuts
    this.initializeKeyboardShortcuts();
    
    // Set up media query for auto theme switching
    this.setupMediaQuery();
    
    // Apply initial theme
    this.applyTheme();
    
    // Load custom CSS if any
    this.loadCustomCSS();
  }

  private initializeThemes(): void {
    // Cosmic Dark Theme (Default)
    this.themes.set('cosmic-dark', {
      id: 'cosmic-dark',
      name: 'Cosmic Dark',
      mode: 'dark',
      colors: {
        primary: '#8B5CF6',
        primaryDark: '#7C3AED',
        primaryLight: '#A78BFA',
        secondary: '#06B6D4',
        accent: '#F59E0B',
        background: '#0F0C1F',
        backgroundSecondary: '#1E1B2E',
        backgroundTertiary: '#2D2A3D',
        surface: '#3C3A4D',
        surfaceSecondary: '#4B495C',
        text: '#F8FAFC',
        textSecondary: '#CBD5E1',
        textMuted: '#94A3B8',
        border: '#475569',
        borderLight: '#64748B',
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6'
      },
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      borderRadius: this.getDefaultBorderRadius(),
      shadow: this.getDarkShadows(),
      animations: this.getDefaultAnimations()
    });

    // Cosmic Light Theme
    this.themes.set('cosmic-light', {
      id: 'cosmic-light',
      name: 'Cosmic Light',
      mode: 'light',
      colors: {
        primary: '#8B5CF6',
        primaryDark: '#7C3AED',
        primaryLight: '#A78BFA',
        secondary: '#06B6D4',
        accent: '#F59E0B',
        background: '#FFFFFF',
        backgroundSecondary: '#F8FAFC',
        backgroundTertiary: '#F1F5F9',
        surface: '#FFFFFF',
        surfaceSecondary: '#F8FAFC',
        text: '#0F172A',
        textSecondary: '#334155',
        textMuted: '#64748B',
        border: '#E2E8F0',
        borderLight: '#CBD5E1',
        error: '#DC2626',
        warning: '#D97706',
        success: '#059669',
        info: '#2563EB'
      },
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      borderRadius: this.getDefaultBorderRadius(),
      shadow: this.getLightShadows(),
      animations: this.getDefaultAnimations()
    });

    // Midnight Blue Theme
    this.themes.set('midnight-blue', {
      id: 'midnight-blue',
      name: 'Midnight Blue',
      mode: 'dark',
      colors: {
        primary: '#3B82F6',
        primaryDark: '#1D4ED8',
        primaryLight: '#60A5FA',
        secondary: '#06B6D4',
        accent: '#10B981',
        background: '#0C1426',
        backgroundSecondary: '#1E293B',
        backgroundTertiary: '#334155',
        surface: '#475569',
        surfaceSecondary: '#64748B',
        text: '#F1F5F9',
        textSecondary: '#CBD5E1',
        textMuted: '#94A3B8',
        border: '#475569',
        borderLight: '#64748B',
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6'
      },
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      borderRadius: this.getDefaultBorderRadius(),
      shadow: this.getDarkShadows(),
      animations: this.getDefaultAnimations()
    });

    // Forest Green Theme
    this.themes.set('forest-green', {
      id: 'forest-green',
      name: 'Forest Green',
      mode: 'dark',
      colors: {
        primary: '#10B981',
        primaryDark: '#059669',
        primaryLight: '#34D399',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#0F1C14',
        backgroundSecondary: '#1F2F24',
        backgroundTertiary: '#2F4234',
        surface: '#3F5544',
        surfaceSecondary: '#4F6854',
        text: '#F0FDF4',
        textSecondary: '#DCFCE7',
        textMuted: '#BBF7D0',
        border: '#4ADE80',
        borderLight: '#86EFAC',
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6'
      },
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      borderRadius: this.getDefaultBorderRadius(),
      shadow: this.getDarkShadows(),
      animations: this.getDefaultAnimations()
    });

    // Rose Gold Theme
    this.themes.set('rose-gold', {
      id: 'rose-gold',
      name: 'Rose Gold',
      mode: 'light',
      colors: {
        primary: '#F43F5E',
        primaryDark: '#E11D48',
        primaryLight: '#FB7185',
        secondary: '#F59E0B',
        accent: '#8B5CF6',
        background: '#FFF7ED',
        backgroundSecondary: '#FED7AA',
        backgroundTertiary: '#FDBA74',
        surface: '#FFFFFF',
        surfaceSecondary: '#FEF3C7',
        text: '#92400E',
        textSecondary: '#B45309',
        textMuted: '#D97706',
        border: '#FED7AA',
        borderLight: '#FDE68A',
        error: '#DC2626',
        warning: '#D97706',
        success: '#059669',
        info: '#2563EB'
      },
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      borderRadius: this.getDefaultBorderRadius(),
      shadow: this.getLightShadows(),
      animations: this.getDefaultAnimations()
    });

    // High Contrast Dark
    this.themes.set('high-contrast-dark', {
      id: 'high-contrast-dark',
      name: 'High Contrast Dark',
      mode: 'dark',
      colors: {
        primary: '#FFFFFF',
        primaryDark: '#E5E5E5',
        primaryLight: '#FFFFFF',
        secondary: '#FFFF00',
        accent: '#00FF00',
        background: '#000000',
        backgroundSecondary: '#1A1A1A',
        backgroundTertiary: '#333333',
        surface: '#4D4D4D',
        surfaceSecondary: '#666666',
        text: '#FFFFFF',
        textSecondary: '#E5E5E5',
        textMuted: '#CCCCCC',
        border: '#FFFFFF',
        borderLight: '#CCCCCC',
        error: '#FF0000',
        warning: '#FFFF00',
        success: '#00FF00',
        info: '#00FFFF'
      },
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      borderRadius: this.getDefaultBorderRadius(),
      shadow: this.getDarkShadows(),
      animations: this.getDefaultAnimations()
    });
  }

  private getDefaultTypography(): ThemeTypography {
    return {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em'
      }
    };
  }

  private getDefaultSpacing(): ThemeSpacing {
    return {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      '4xl': '6rem',
      '5xl': '8rem'
    };
  }

  private getDefaultBorderRadius(): ThemeBorderRadius {
    return {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    };
  }

  private getDarkShadows(): ThemeShadow {
    return {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
      none: 'none'
    };
  }

  private getLightShadows(): ThemeShadow {
    return {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none'
    };
  }

  private getDefaultAnimations() {
    return {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms'
      },
      easing: {
        linear: 'linear',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'cosmic-dark',
      fontSize: 'medium',
      fontFamily: 'Inter',
      reducedMotion: false,
      highContrast: false,
      compactMode: false,
      editorTheme: 'vs-dark',
      codeTheme: 'tomorrow-night',
      sidebarPosition: 'left'
    };
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem('astral-user-preferences');
    if (saved) {
      try {
        this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    }
  }

  private saveUserPreferences(): void {
    localStorage.setItem('astral-user-preferences', JSON.stringify(this.userPreferences));
    this.notifyPreferenceListeners();
  }

  private setupMediaQuery(): void {
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleMediaQueryChange.bind(this));
    }
  }

  private handleMediaQueryChange(): void {
    if (this.userPreferences.theme === 'auto' || 
        (this.currentTheme && this.currentTheme.mode === 'auto')) {
      this.applyTheme();
    }
  }

  private initializeKeyboardShortcuts(): void {
    const defaultShortcuts: KeyboardShortcut[] = [
      // Navigation
      { id: 'goto-dashboard', name: 'Go to Dashboard', description: 'Navigate to dashboard', keys: ['ctrl', 'd'], action: 'navigate:/dashboard', category: 'navigation', enabled: true, customizable: true },
      { id: 'goto-projects', name: 'Go to Projects', description: 'Navigate to projects', keys: ['ctrl', 'p'], action: 'navigate:/projects', category: 'navigation', enabled: true, customizable: true },
      { id: 'goto-search', name: 'Go to Search', description: 'Navigate to search', keys: ['ctrl', 'shift', 'f'], action: 'navigate:/search', category: 'navigation', enabled: true, customizable: true },
      { id: 'toggle-sidebar', name: 'Toggle Sidebar', description: 'Show/hide sidebar', keys: ['ctrl', 'b'], action: 'toggle-sidebar', category: 'view', enabled: true, customizable: true },
      
      // Editing
      { id: 'save-note', name: 'Save Note', description: 'Save current note', keys: ['ctrl', 's'], action: 'save-note', category: 'editing', enabled: true, customizable: false },
      { id: 'new-note', name: 'New Note', description: 'Create new note', keys: ['ctrl', 'n'], action: 'new-note', category: 'editing', enabled: true, customizable: true },
      { id: 'delete-note', name: 'Delete Note', description: 'Delete current note', keys: ['ctrl', 'shift', 'delete'], action: 'delete-note', category: 'editing', enabled: true, customizable: true },
      { id: 'focus-editor', name: 'Focus Editor', description: 'Focus on editor', keys: ['ctrl', 'e'], action: 'focus-editor', category: 'editing', enabled: true, customizable: true },
      
      // Project
      { id: 'new-project', name: 'New Project', description: 'Create new project', keys: ['ctrl', 'shift', 'n'], action: 'new-project', category: 'project', enabled: true, customizable: true },
      { id: 'open-plotboard', name: 'Open Plotboard', description: 'Open visual plotboard', keys: ['ctrl', 'shift', 'p'], action: 'open-plotboard', category: 'project', enabled: true, customizable: true },
      { id: 'open-timeline', name: 'Open Timeline', description: 'Open timeline view', keys: ['ctrl', 't'], action: 'open-timeline', category: 'project', enabled: true, customizable: true },
      
      // View
      { id: 'toggle-theme', name: 'Toggle Theme', description: 'Switch between light/dark', keys: ['ctrl', 'shift', 't'], action: 'toggle-theme', category: 'view', enabled: true, customizable: true },
      { id: 'zoom-in', name: 'Zoom In', description: 'Increase font size', keys: ['ctrl', '+'], action: 'zoom-in', category: 'view', enabled: true, customizable: true },
      { id: 'zoom-out', name: 'Zoom Out', description: 'Decrease font size', keys: ['ctrl', '-'], action: 'zoom-out', category: 'view', enabled: true, customizable: true },
      { id: 'toggle-focus-mode', name: 'Focus Mode', description: 'Enter distraction-free mode', keys: ['f11'], action: 'toggle-focus-mode', category: 'view', enabled: true, customizable: true }
    ];

    defaultShortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.id, shortcut);
    });

    // Load custom shortcuts
    this.loadKeyboardShortcuts();
    
    // Set up keyboard event listeners
    this.setupKeyboardListeners();
  }

  private loadKeyboardShortcuts(): void {
    const saved = localStorage.getItem('astral-keyboard-shortcuts');
    if (saved) {
      try {
        const customShortcuts = JSON.parse(saved);
        Object.entries(customShortcuts).forEach(([id, shortcut]) => {
          if (this.shortcuts.has(id)) {
            this.shortcuts.set(id, { ...this.shortcuts.get(id)!, ...shortcut });
          }
        });
      } catch (error) {
        console.error('Failed to load keyboard shortcuts:', error);
      }
    }
  }

  private saveKeyboardShortcuts(): void {
    const shortcuts: Record<string, Partial<KeyboardShortcut>> = {};
    this.shortcuts.forEach((shortcut, id) => {
      if (shortcut.customizable) {
        shortcuts[id] = {
          keys: shortcut.keys,
          enabled: shortcut.enabled
        };
      }
    });
    localStorage.setItem('astral-keyboard-shortcuts', JSON.stringify(shortcuts));
  }

  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.userPreferences.reducedMotion && event.key === 'Tab') {
      // Enhanced keyboard navigation for reduced motion users
      this.handleTabNavigation(event);
      return;
    }

    const pressedKeys = [];
    if (event.ctrlKey) pressedKeys.push('ctrl');
    if (event.shiftKey) pressedKeys.push('shift');
    if (event.altKey) pressedKeys.push('alt');
    if (event.metaKey) pressedKeys.push('meta');
    
    // Add the main key
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
      pressedKeys.push(event.key.toLowerCase());
    }

    // Find matching shortcut
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.enabled && this.keysMatch(pressedKeys, shortcut.keys)) {
        event.preventDefault();
        this.executeShortcut(shortcut);
        break;
      }
    }
  }

  private keysMatch(pressed: string[], expected: string[]): boolean {
    if (pressed.length !== expected.length) return false;
    return expected.every(key => pressed.includes(key));
  }

  private executeShortcut(shortcut: KeyboardShortcut): void {
    if (shortcut.action.startsWith('navigate:')) {
      const path = shortcut.action.substring(9);
      window.location.href = path;
    } else {
      // Emit custom event for action
      window.dispatchEvent(new CustomEvent('astral-shortcut', {
        detail: { action: shortcut.action, shortcut }
      }));
    }
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    // Enhanced tab navigation for accessibility
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  }

  // Public Theme Methods
  public setTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.userPreferences.theme = themeId;
      this.currentTheme = theme;
      this.applyTheme();
      this.saveUserPreferences();
    }
  }

  public getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme;
  }

  public getThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  public addCustomTheme(theme: ThemeConfig): void {
    this.themes.set(theme.id, theme);
  }

  public removeCustomTheme(themeId: string): void {
    if (this.themes.get(themeId) && themeId !== this.userPreferences.theme) {
      this.themes.delete(themeId);
    }
  }

  private applyTheme(): void {
    let theme = this.themes.get(this.userPreferences.theme);
    
    if (!theme) {
      theme = this.themes.get('cosmic-dark')!;
    }

    // Handle auto theme
    if (theme.mode === 'auto' && this.mediaQuery) {
      const prefersDark = this.mediaQuery.matches;
      const autoThemeId = prefersDark ? 'cosmic-dark' : 'cosmic-light';
      theme = this.themes.get(autoThemeId) || theme;
    }

    this.currentTheme = theme;

    // Apply CSS custom properties
    const root = document.documentElement;
    
    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${this.kebabCase(key)}`, value);
    });

    // Typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value.toString());
    });

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Shadows
    Object.entries(theme.shadow).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Animations
    Object.entries(theme.animations.duration).forEach(([key, value]) => {
      root.style.setProperty(`--duration-${key}`, value);
    });
    Object.entries(theme.animations.easing).forEach(([key, value]) => {
      root.style.setProperty(`--easing-${this.kebabCase(key)}`, value);
    });

    // Custom properties
    if (theme.customProperties) {
      Object.entries(theme.customProperties).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    // Apply user preferences
    this.applyUserPreferences();

    // Update theme-color meta tag
    this.updateThemeColorMeta();

    // Notify listeners
    this.notifyThemeListeners(theme);
  }

  private applyUserPreferences(): void {
    const root = document.documentElement;
    
    // Font size scaling
    const fontSizeMultipliers = {
      small: 0.875,
      medium: 1,
      large: 1.125
    };
    const multiplier = fontSizeMultipliers[this.userPreferences.fontSize];
    root.style.setProperty('--font-size-multiplier', multiplier.toString());

    // Font family override
    if (this.userPreferences.fontFamily !== 'Inter') {
      root.style.setProperty('--font-family-override', this.userPreferences.fontFamily);
    }

    // Reduced motion
    if (this.userPreferences.reducedMotion) {
      root.style.setProperty('--duration-fast', '0ms');
      root.style.setProperty('--duration-normal', '0ms');
      root.style.setProperty('--duration-slow', '0ms');
    }

    // High contrast
    if (this.userPreferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Compact mode
    if (this.userPreferences.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Sidebar position
    root.classList.toggle('sidebar-right', this.userPreferences.sidebarPosition === 'right');
  }

  private updateThemeColorMeta(): void {
    if (!this.currentTheme) return;
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', this.currentTheme.colors.primary);
  }

  private loadCustomCSS(): void {
    if (this.userPreferences.customCSS) {
      const existingStyle = document.getElementById('astral-custom-css');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = 'astral-custom-css';
      style.textContent = this.userPreferences.customCSS;
      document.head.appendChild(style);
    }
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // Public Preference Methods
  public updatePreferences(prefs: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...prefs };
    this.applyTheme();
    this.saveUserPreferences();
  }

  public getPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }

  public setCustomCSS(css: string): void {
    this.userPreferences.customCSS = css;
    this.loadCustomCSS();
    this.saveUserPreferences();
  }

  // Keyboard Shortcuts
  public getKeyboardShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  public updateKeyboardShortcut(id: string, keys: string[], enabled?: boolean): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut && shortcut.customizable) {
      shortcut.keys = keys;
      if (enabled !== undefined) {
        shortcut.enabled = enabled;
      }
      this.saveKeyboardShortcuts();
    }
  }

  public resetKeyboardShortcuts(): void {
    localStorage.removeItem('astral-keyboard-shortcuts');
    this.initializeKeyboardShortcuts();
  }

  // Event Listeners
  public onThemeChange(callback: (theme: ThemeConfig) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public onPreferencesChange(callback: (prefs: UserPreferences) => void): () => void {
    this.preferenceListeners.add(callback);
    return () => this.preferenceListeners.delete(callback);
  }

  private notifyThemeListeners(theme: ThemeConfig): void {
    this.listeners.forEach(callback => callback(theme));
  }

  private notifyPreferenceListeners(): void {
    this.preferenceListeners.forEach(callback => callback(this.userPreferences));
  }

  // Utility Methods
  public toggleTheme(): void {
    const currentMode = this.currentTheme?.mode;
    if (currentMode === 'dark') {
      this.setTheme('cosmic-light');
    } else {
      this.setTheme('cosmic-dark');
    }
  }

  public exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId);
    return theme ? JSON.stringify(theme, null, 2) : null;
  }

  public importTheme(themeData: string): boolean {
    try {
      const theme = JSON.parse(themeData) as ThemeConfig;
      if (this.validateTheme(theme)) {
        this.addCustomTheme(theme);
        return true;
      }
    } catch (error) {
      console.error('Failed to import theme:', error);
    }
    return false;
  }

  private validateTheme(theme: any): theme is ThemeConfig {
    return (
      typeof theme === 'object' &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.colors === 'object' &&
      typeof theme.typography === 'object'
    );
  }

  public getSystemPreferences(): {
    prefersDarkMode: boolean;
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
  } {
    return {
      prefersDarkMode: this.mediaQuery?.matches || false,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches
    };
  }

  public applySystemPreferences(): void {
    const system = this.getSystemPreferences();
    
    this.updatePreferences({
      reducedMotion: system.prefersReducedMotion,
      highContrast: system.prefersHighContrast
    });

    if (this.userPreferences.theme === 'auto') {
      this.setTheme(system.prefersDarkMode ? 'cosmic-dark' : 'cosmic-light');
    }
  }

  // Cleanup
  public destroy(): void {
    this.mediaQuery?.removeEventListener('change', this.handleMediaQueryChange.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.listeners.clear();
    this.preferenceListeners.clear();
  }
}

export default ThemeService.getInstance();