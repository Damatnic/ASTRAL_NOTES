/**
 * Workspace Layout Service Tests
 * Comprehensive tests for multi-panel workspace functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workspaceLayoutService, type LayoutConfig, type PanelConfig } from '../../services/workspaceLayoutService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('WorkspaceLayoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Layout Management', () => {
    it('should initialize with default layouts', () => {
      const layouts = workspaceLayoutService.getLayouts();
      
      expect(layouts.length).toBeGreaterThan(0);
      expect(layouts.some(l => l.id === 'writer-focused')).toBe(true);
      expect(layouts.some(l => l.id === 'scene-builder')).toBe(true);
      expect(layouts.some(l => l.id === 'distraction-free')).toBe(true);
    });

    it('should get layout by ID', () => {
      const layout = workspaceLayoutService.getLayout('writer-focused');
      
      expect(layout).toBeTruthy();
      expect(layout?.id).toBe('writer-focused');
      expect(layout?.name).toBe('Writer Focused');
    });

    it('should return null for non-existent layout', () => {
      const layout = workspaceLayoutService.getLayout('non-existent');
      expect(layout).toBeNull();
    });

    it('should set active layout', () => {
      const result = workspaceLayoutService.setActiveLayout('scene-builder');
      
      expect(result).toBe(true);
      
      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('scene-builder');
    });

    it('should fail to set non-existent layout', () => {
      const result = workspaceLayoutService.setActiveLayout('non-existent');
      expect(result).toBe(false);
    });

    it('should create new layout', () => {
      const newLayout = workspaceLayoutService.createLayout({
        name: 'Custom Layout',
        description: 'My custom layout',
        layout: 'horizontal',
        panels: [
          {
            id: 'custom-panel',
            type: 'editor',
            title: 'Custom Editor',
            defaultWidth: 100,
            isResizable: true,
            isClosable: false,
          },
        ],
      });

      expect(newLayout.id).toBeDefined();
      expect(newLayout.name).toBe('Custom Layout');
      expect(newLayout.savedAt).toBeInstanceOf(Date);

      const layouts = workspaceLayoutService.getLayouts();
      expect(layouts).toContain(newLayout);
    });

    it('should update existing layout', () => {
      const originalLayout = workspaceLayoutService.getLayout('writer-focused')!;
      const updated = workspaceLayoutService.updateLayout('writer-focused', {
        description: 'Updated description',
      });

      expect(updated).toBe(true);
      
      const updatedLayout = workspaceLayoutService.getLayout('writer-focused')!;
      expect(updatedLayout.description).toBe('Updated description');
      expect(updatedLayout.savedAt.getTime()).toBeGreaterThan(originalLayout.savedAt.getTime());
    });

    it('should delete non-default layout', () => {
      const customLayout = workspaceLayoutService.createLayout({
        name: 'To Delete',
        description: 'Will be deleted',
        layout: 'horizontal',
        panels: [],
      });

      const deleted = workspaceLayoutService.deleteLayout(customLayout.id);
      expect(deleted).toBe(true);

      const layout = workspaceLayoutService.getLayout(customLayout.id);
      expect(layout).toBeNull();
    });

    it('should not delete default layout', () => {
      const deleted = workspaceLayoutService.deleteLayout('writer-focused');
      expect(deleted).toBe(false);

      const layout = workspaceLayoutService.getLayout('writer-focused');
      expect(layout).toBeTruthy();
    });

    it('should duplicate layout', () => {
      const duplicated = workspaceLayoutService.duplicateLayout('writer-focused', 'My Writer Layout');
      
      expect(duplicated).toBeTruthy();
      expect(duplicated?.name).toBe('My Writer Layout');
      expect(duplicated?.isDefault).toBe(false);
      expect(duplicated?.id).not.toBe('writer-focused');

      const originalLayout = workspaceLayoutService.getLayout('writer-focused')!;
      expect(duplicated?.panels).toEqual(originalLayout.panels);
    });
  });

  describe('Panel State Management', () => {
    beforeEach(() => {
      workspaceLayoutService.setActiveLayout('scene-builder');
    });

    it('should get panel state', () => {
      const state = workspaceLayoutService.getPanelState('main-editor');
      
      expect(state).toBeTruthy();
      expect(state?.isOpen).toBe(true);
      expect(typeof state?.width).toBe('number');
    });

    it('should set panel state', () => {
      workspaceLayoutService.setPanelState('main-editor', {
        width: 60,
        height: 80,
      });

      const state = workspaceLayoutService.getPanelState('main-editor');
      expect(state?.width).toBe(60);
      expect(state?.height).toBe(80);
    });

    it('should toggle panel', () => {
      const initialState = workspaceLayoutService.getPanelState('beats-panel');
      const initialOpen = initialState?.isOpen;

      workspaceLayoutService.togglePanel('beats-panel');

      const newState = workspaceLayoutService.getPanelState('beats-panel');
      expect(newState?.isOpen).toBe(!initialOpen);
    });

    it('should resize panel with bounds', () => {
      workspaceLayoutService.resizePanel('main-editor', 95); // Should be clamped to 90
      
      const state = workspaceLayoutService.getPanelState('main-editor');
      expect(state?.width).toBe(90);

      workspaceLayoutService.resizePanel('main-editor', 5); // Should be clamped to 10
      
      const state2 = workspaceLayoutService.getPanelState('main-editor');
      expect(state2?.width).toBe(10);
    });
  });

  describe('Floating Panels', () => {
    it('should float panel', () => {
      const position = { x: 100, y: 200 };
      workspaceLayoutService.floatPanel('beats-panel', position);

      expect(workspaceLayoutService.isFloating('beats-panel')).toBe(true);
      
      const state = workspaceLayoutService.getPanelState('beats-panel');
      expect(state?.position).toEqual(position);
      expect(state?.zIndex).toBeGreaterThan(0);
    });

    it('should dock floating panel', () => {
      workspaceLayoutService.floatPanel('beats-panel', { x: 100, y: 200 });
      expect(workspaceLayoutService.isFloating('beats-panel')).toBe(true);

      workspaceLayoutService.dockPanel('beats-panel');
      expect(workspaceLayoutService.isFloating('beats-panel')).toBe(false);

      const state = workspaceLayoutService.getPanelState('beats-panel');
      expect(state?.position).toBeUndefined();
      expect(state?.zIndex).toBe(0);
    });

    it('should manage z-index for multiple floating panels', () => {
      workspaceLayoutService.floatPanel('beats-panel', { x: 100, y: 100 });
      workspaceLayoutService.floatPanel('characters-panel', { x: 200, y: 200 });

      const state1 = workspaceLayoutService.getPanelState('beats-panel');
      const state2 = workspaceLayoutService.getPanelState('characters-panel');

      expect(state2?.zIndex).toBeGreaterThan(state1?.zIndex || 0);
    });
  });

  describe('Split Ratios', () => {
    it('should get and set split ratios', () => {
      const newRatios = [0.6, 0.4];
      workspaceLayoutService.setSplitRatios(newRatios);

      const ratios = workspaceLayoutService.getSplitRatios();
      expect(ratios).toEqual(newRatios);
    });
  });

  describe('Panel Content Sharing', () => {
    it('should emit content sharing event', () => {
      const mockListener = vi.fn();
      workspaceLayoutService.on('panel-content-shared', mockListener);

      const content = { text: 'Shared content' };
      workspaceLayoutService.sharePanelContent('from-panel', 'to-panel', content);

      expect(mockListener).toHaveBeenCalledWith({
        fromPanelId: 'from-panel',
        toPanelId: 'to-panel',
        content,
      });
    });
  });

  describe('Workspace Presets', () => {
    it('should apply minimal preset', () => {
      workspaceLayoutService.applyPreset('minimal');
      
      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('distraction-free');
    });

    it('should apply writer preset', () => {
      workspaceLayoutService.applyPreset('writer');
      
      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('writer-focused');
    });

    it('should apply planner preset', () => {
      workspaceLayoutService.applyPreset('planner');
      
      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('planning-overview');
    });

    it('should apply researcher preset', () => {
      workspaceLayoutService.applyPreset('researcher');
      
      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('research-mode');
    });
  });

  describe('Mobile Layout', () => {
    it('should generate mobile-optimized layout', () => {
      workspaceLayoutService.setActiveLayout('scene-builder');
      const mobileLayout = workspaceLayoutService.getMobileLayout();

      expect(mobileLayout.layout).toBe('vertical');
      expect(mobileLayout.panels.every(p => p.defaultWidth === 100)).toBe(true);
      expect(mobileLayout.panels.every(p => p.isResizable === false)).toBe(true);
    });
  });

  describe('State Persistence', () => {
    it('should save state to localStorage', () => {
      workspaceLayoutService.setActiveLayout('scene-builder');
      workspaceLayoutService.setPanelState('main-editor', { width: 75 });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'astral-workspace-state',
        expect.stringContaining('scene-builder')
      );
    });

    it('should load state from localStorage', () => {
      const savedState = {
        activeLayout: 'research-mode',
        panelStates: {
          'main-editor': { isOpen: true, width: 55, height: 100 },
        },
        splitRatios: [0.8, 0.2],
        floatingPanels: ['beats-panel'],
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      // Create new service instance to trigger loading
      const newService = new (workspaceLayoutService.constructor as any)();
      
      expect(newService.getCurrentLayout()?.id).toBe('research-mode');
      expect(newService.getSplitRatios()).toEqual([0.8, 0.2]);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      // Should not throw and should use defaults
      const newService = new (workspaceLayoutService.constructor as any)();
      expect(newService.getCurrentLayout()?.id).toBe('writer-focused');
    });

    it('should reset to defaults', () => {
      workspaceLayoutService.setActiveLayout('scene-builder');
      workspaceLayoutService.setPanelState('main-editor', { width: 75 });

      workspaceLayoutService.resetLayout();

      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('writer-focused');

      const ratios = workspaceLayoutService.getSplitRatios();
      expect(ratios).toEqual([0.7, 0.3]);
    });
  });

  describe('Export/Import', () => {
    it('should export layout', () => {
      const exported = workspaceLayoutService.exportLayout('writer-focused');
      
      expect(exported).toBeTruthy();
      
      const data = JSON.parse(exported!);
      expect(data.layout.id).toBe('writer-focused');
      expect(data.version).toBe('1.0.0');
      expect(data.exportedAt).toBeDefined();
    });

    it('should return null for non-existent layout export', () => {
      const exported = workspaceLayoutService.exportLayout('non-existent');
      expect(exported).toBeNull();
    });

    it('should import layout', () => {
      const layoutData = {
        layout: {
          id: 'imported-layout',
          name: 'Imported Layout',
          description: 'Test import',
          layout: 'horizontal',
          panels: [
            {
              id: 'test-panel',
              type: 'editor',
              title: 'Test Panel',
              defaultWidth: 100,
              isResizable: true,
              isClosable: false,
            },
          ],
          savedAt: new Date(),
          isPublic: false,
        },
        version: '1.0.0',
        exportedAt: new Date(),
      };

      const imported = workspaceLayoutService.importLayout(JSON.stringify(layoutData));
      
      expect(imported).toBeTruthy();
      expect(imported?.name).toBe('Imported Layout (Imported)');
      expect(imported?.isDefault).toBe(false);

      const layouts = workspaceLayoutService.getLayouts();
      expect(layouts).toContain(imported);
    });

    it('should handle invalid import data', () => {
      const imported1 = workspaceLayoutService.importLayout('invalid json');
      expect(imported1).toBeNull();

      const imported2 = workspaceLayoutService.importLayout('{"invalid": "data"}');
      expect(imported2).toBeNull();
    });
  });

  describe('Event System', () => {
    it('should emit layout events', () => {
      const layoutChangedListener = vi.fn();
      const layoutCreatedListener = vi.fn();

      workspaceLayoutService.on('layout-changed', layoutChangedListener);
      workspaceLayoutService.on('layout-created', layoutCreatedListener);

      workspaceLayoutService.setActiveLayout('scene-builder');
      expect(layoutChangedListener).toHaveBeenCalled();

      const newLayout = workspaceLayoutService.createLayout({
        name: 'Test Layout',
        description: 'Test',
        layout: 'horizontal',
        panels: [],
      });
      expect(layoutCreatedListener).toHaveBeenCalledWith(newLayout);
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();
      
      workspaceLayoutService.on('layout-changed', listener);
      workspaceLayoutService.setActiveLayout('scene-builder');
      expect(listener).toHaveBeenCalledTimes(1);

      workspaceLayoutService.off('layout-changed', listener);
      workspaceLayoutService.setActiveLayout('writer-focused');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});