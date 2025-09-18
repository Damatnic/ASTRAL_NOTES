/**
 * Workspace Layout Service
 * Manages multi-panel workspace layouts, panel states, and persistence
 */

export interface PanelConfig {
  id: string;
  type: 'editor' | 'notes' | 'beats' | 'characters' | 'codex' | 'research' | 'timeline' | 'outline';
  title: string;
  icon?: string;
  component?: string;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  isResizable?: boolean;
  isClosable?: boolean;
  isFloating?: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  data?: any;
}

export interface LayoutConfig {
  id: string;
  name: string;
  description?: string;
  panels: PanelConfig[];
  layout: 'horizontal' | 'vertical' | 'grid' | 'custom';
  mainPanel?: string; // ID of the main panel
  savedAt: Date;
  isDefault?: boolean;
}

export interface WorkspaceState {
  activeLayout: string;
  panelStates: Map<string, {
    isOpen: boolean;
    width: number;
    height: number;
    position?: { x: number; y: number };
    zIndex?: number;
  }>;
  splitRatios: number[];
  floatingPanels: string[];
}

class WorkspaceLayoutService {
  private layouts: Map<string, LayoutConfig> = new Map();
  private currentState: WorkspaceState;
  private listeners: Map<string, Set<Function>> = new Map();
  private storageKey = 'astral-workspace-state';

  constructor() {
    this.currentState = this.getDefaultState();
    this.loadState();
    this.initializeDefaultLayouts();
  }

  // Get default workspace state
  private getDefaultState(): WorkspaceState {
    return {
      activeLayout: 'writer-focused',
      panelStates: new Map(),
      splitRatios: [0.7, 0.3], // 70% main content, 30% sidebar
      floatingPanels: [],
    };
  }

  // Initialize default layouts
  private initializeDefaultLayouts(): void {
    const layouts: LayoutConfig[] = [
      {
        id: 'writer-focused',
        name: 'Writer Focused',
        description: 'Primary editor with minimal distractions',
        layout: 'horizontal',
        mainPanel: 'main-editor',
        panels: [
          {
            id: 'main-editor',
            type: 'editor',
            title: 'Editor',
            defaultWidth: 70,
            isResizable: true,
            isClosable: false,
          },
          {
            id: 'notes-panel',
            type: 'notes',
            title: 'Quick Notes',
            defaultWidth: 30,
            isResizable: true,
            isClosable: true,
          },
        ],
        savedAt: new Date(),
        isDefault: true,
      },
      {
        id: 'scene-builder',
        name: 'Scene Builder',
        description: 'Editor with scene beats and character notes',
        layout: 'horizontal',
        mainPanel: 'main-editor',
        panels: [
          {
            id: 'main-editor',
            type: 'editor',
            title: 'Editor',
            defaultWidth: 50,
            isResizable: true,
            isClosable: false,
          },
          {
            id: 'beats-panel',
            type: 'beats',
            title: 'Scene Beats',
            defaultWidth: 25,
            isResizable: true,
            isClosable: true,
          },
          {
            id: 'characters-panel',
            type: 'characters',
            title: 'Characters',
            defaultWidth: 25,
            isResizable: true,
            isClosable: true,
          },
        ],
        savedAt: new Date(),
      },
      {
        id: 'research-mode',
        name: 'Research Mode',
        description: 'Editor with research panels and codex',
        layout: 'horizontal',
        mainPanel: 'main-editor',
        panels: [
          {
            id: 'main-editor',
            type: 'editor',
            title: 'Editor',
            defaultWidth: 60,
            isResizable: true,
            isClosable: false,
          },
          {
            id: 'research-panel',
            type: 'research',
            title: 'Research',
            defaultWidth: 20,
            isResizable: true,
            isClosable: true,
          },
          {
            id: 'codex-panel',
            type: 'codex',
            title: 'Codex',
            defaultWidth: 20,
            isResizable: true,
            isClosable: true,
          },
        ],
        savedAt: new Date(),
      },
      {
        id: 'planning-overview',
        name: 'Planning Overview',
        description: 'Timeline, outline, and editor for story planning',
        layout: 'grid',
        mainPanel: 'main-editor',
        panels: [
          {
            id: 'timeline-panel',
            type: 'timeline',
            title: 'Timeline',
            defaultWidth: 50,
            isResizable: true,
            isClosable: true,
          },
          {
            id: 'outline-panel',
            type: 'outline',
            title: 'Outline',
            defaultWidth: 50,
            isResizable: true,
            isClosable: true,
          },
          {
            id: 'main-editor',
            type: 'editor',
            title: 'Editor',
            defaultWidth: 100,
            isResizable: true,
            isClosable: false,
          },
        ],
        savedAt: new Date(),
      },
      {
        id: 'distraction-free',
        name: 'Distraction Free',
        description: 'Just the editor, nothing else',
        layout: 'horizontal',
        mainPanel: 'main-editor',
        panels: [
          {
            id: 'main-editor',
            type: 'editor',
            title: 'Editor',
            defaultWidth: 100,
            isResizable: false,
            isClosable: false,
          },
        ],
        savedAt: new Date(),
      },
    ];

    layouts.forEach(layout => {
      this.layouts.set(layout.id, layout);
    });
  }

  // Layout management
  getLayouts(): LayoutConfig[] {
    return Array.from(this.layouts.values());
  }

  getLayout(layoutId: string): LayoutConfig | null {
    return this.layouts.get(layoutId) || null;
  }

  getCurrentLayout(): LayoutConfig | null {
    return this.getLayout(this.currentState.activeLayout);
  }

  setActiveLayout(layoutId: string): boolean {
    const layout = this.getLayout(layoutId);
    if (!layout) return false;

    this.currentState.activeLayout = layoutId;
    this.initializePanelStates(layout);
    this.saveState();
    this.emit('layout-changed', { layoutId, layout });
    return true;
  }

  createLayout(layout: Omit<LayoutConfig, 'id' | 'savedAt'>): LayoutConfig {
    const newLayout: LayoutConfig = {
      ...layout,
      id: `layout-${Date.now()}`,
      savedAt: new Date(),
    };

    this.layouts.set(newLayout.id, newLayout);
    this.emit('layout-created', newLayout);
    return newLayout;
  }

  updateLayout(layoutId: string, updates: Partial<LayoutConfig>): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const updatedLayout = {
      ...layout,
      ...updates,
      savedAt: new Date(),
    };

    this.layouts.set(layoutId, updatedLayout);
    this.emit('layout-updated', updatedLayout);
    return true;
  }

  deleteLayout(layoutId: string): boolean {
    if (this.layouts.get(layoutId)?.isDefault) return false;
    
    const deleted = this.layouts.delete(layoutId);
    if (deleted) {
      // Switch to default if we deleted the active layout
      if (this.currentState.activeLayout === layoutId) {
        this.setActiveLayout('writer-focused');
      }
      this.emit('layout-deleted', { layoutId });
    }
    return deleted;
  }

  duplicateLayout(layoutId: string, newName: string): LayoutConfig | null {
    const layout = this.getLayout(layoutId);
    if (!layout) return null;

    return this.createLayout({
      ...layout,
      name: newName,
      isDefault: false,
    });
  }

  // Panel management
  private initializePanelStates(layout: LayoutConfig): void {
    const newPanelStates = new Map();
    
    layout.panels.forEach(panel => {
      const existingState = this.currentState.panelStates.get(panel.id);
      newPanelStates.set(panel.id, {
        isOpen: existingState?.isOpen ?? true,
        width: existingState?.width ?? panel.defaultWidth ?? 50,
        height: existingState?.height ?? 100,
        position: panel.position || existingState?.position,
        zIndex: existingState?.zIndex ?? 0,
      });
    });

    this.currentState.panelStates = newPanelStates;
  }

  getPanelState(panelId: string) {
    return this.currentState.panelStates.get(panelId);
  }

  setPanelState(panelId: string, state: Partial<{
    isOpen: boolean;
    width: number;
    height: number;
    position: { x: number; y: number };
    zIndex: number;
  }>): void {
    const currentState = this.getPanelState(panelId) || {
      isOpen: true,
      width: 50,
      height: 100,
      zIndex: 0,
    };

    this.currentState.panelStates.set(panelId, {
      ...currentState,
      ...state,
    });

    this.saveState();
    this.emit('panel-state-changed', { panelId, state });
  }

  togglePanel(panelId: string): void {
    const state = this.getPanelState(panelId);
    if (state) {
      this.setPanelState(panelId, { isOpen: !state.isOpen });
    }
  }

  resizePanel(panelId: string, width: number, height?: number): void {
    this.setPanelState(panelId, { 
      width: Math.max(10, Math.min(90, width)),
      height: height ? Math.max(10, Math.min(100, height)) : undefined,
    });
  }

  // Floating panels
  floatPanel(panelId: string, position: { x: number; y: number }): void {
    if (!this.currentState.floatingPanels.includes(panelId)) {
      this.currentState.floatingPanels.push(panelId);
    }
    
    this.setPanelState(panelId, { 
      position,
      zIndex: this.getNextZIndex(),
    });
  }

  dockPanel(panelId: string): void {
    this.currentState.floatingPanels = this.currentState.floatingPanels.filter(id => id !== panelId);
    this.setPanelState(panelId, { 
      position: undefined,
      zIndex: 0,
    });
  }

  isFloating(panelId: string): boolean {
    return this.currentState.floatingPanels.includes(panelId);
  }

  private getNextZIndex(): number {
    let maxZ = 0;
    this.currentState.panelStates.forEach(state => {
      if (state.zIndex && state.zIndex > maxZ) {
        maxZ = state.zIndex;
      }
    });
    return maxZ + 1;
  }

  // Split ratios for horizontal/vertical layouts
  getSplitRatios(): number[] {
    return this.currentState.splitRatios;
  }

  setSplitRatios(ratios: number[]): void {
    this.currentState.splitRatios = ratios;
    this.saveState();
    this.emit('split-ratios-changed', ratios);
  }

  // Panel content sharing
  sharePanelContent(fromPanelId: string, toPanelId: string, content: any): void {
    this.emit('panel-content-shared', {
      fromPanelId,
      toPanelId,
      content,
    });
  }

  // Workspace presets
  applyPreset(preset: 'minimal' | 'writer' | 'planner' | 'researcher'): void {
    const presetLayouts = {
      minimal: 'distraction-free',
      writer: 'writer-focused',
      planner: 'planning-overview',
      researcher: 'research-mode',
    };

    this.setActiveLayout(presetLayouts[preset]);
  }

  // Mobile responsive adjustments
  getMobileLayout(): LayoutConfig {
    const currentLayout = this.getCurrentLayout();
    if (!currentLayout) return this.layouts.get('writer-focused')!;

    // Create mobile-optimized version
    return {
      ...currentLayout,
      layout: 'vertical',
      panels: currentLayout.panels.map(panel => ({
        ...panel,
        defaultWidth: 100,
        isResizable: false,
      })),
    };
  }

  // State persistence
  private saveState(): void {
    try {
      const stateToSave = {
        activeLayout: this.currentState.activeLayout,
        panelStates: Object.fromEntries(this.currentState.panelStates),
        splitRatios: this.currentState.splitRatios,
        floatingPanels: this.currentState.floatingPanels,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save workspace state:', error);
    }
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        this.currentState = {
          activeLayout: state.activeLayout || 'writer-focused',
          panelStates: new Map(Object.entries(state.panelStates || {})),
          splitRatios: state.splitRatios || [0.7, 0.3],
          floatingPanels: state.floatingPanels || [],
        };
      }
    } catch (error) {
      console.error('Failed to load workspace state:', error);
      this.currentState = this.getDefaultState();
    }
  }

  // Reset to defaults
  resetLayout(): void {
    this.currentState = this.getDefaultState();
    this.setActiveLayout('writer-focused');
    this.saveState();
    this.emit('layout-reset');
  }

  exportLayout(layoutId: string): string | null {
    const layout = this.getLayout(layoutId);
    if (!layout) return null;

    return JSON.stringify({
      layout,
      version: '1.0.0',
      exportedAt: new Date(),
    }, null, 2);
  }

  importLayout(jsonData: string): LayoutConfig | null {
    try {
      const data = JSON.parse(jsonData);
      if (data.layout && data.layout.panels) {
        return this.createLayout({
          ...data.layout,
          name: `${data.layout.name} (Imported)`,
          isDefault: false,
        });
      }
    } catch (error) {
      console.error('Failed to import layout:', error);
    }
    return null;
  }

  // Event system
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
  }
}

export const workspaceLayoutService = new WorkspaceLayoutService();