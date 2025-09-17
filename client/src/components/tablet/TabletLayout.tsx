/**
 * TabletLayout Component
 * Adaptive layout system optimized for tablet devices and larger touch screens
 * Features dual-pane layouts, touch-friendly controls, and landscape/portrait adaptations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/Resizable';
import TabletSidebar from './TabletSidebar';
import TabletMainContent from './TabletMainContent';
import TabletToolbar from './TabletToolbar';
import SplitViewManager from './SplitViewManager';
import type { Project, Scene, Character } from '@/types/story';
import {
  Sidebar,
  SidebarOff,
  LayoutGrid,
  Columns2,
  RotateCcw,
  Maximize2,
  Minimize2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

export interface TabletLayoutProps {
  project: Project;
  scenes: Scene[];
  characters: Character[];
  currentView: string;
  orientation: 'portrait' | 'landscape';
  onViewChange?: (viewId: string) => void;
  onSceneSelect?: (sceneId: string) => void;
  onSceneCreate?: () => void;
  className?: string;
}

interface LayoutConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  panels: {
    sidebar: { width: number; collapsible: boolean };
    main: { flexible: boolean };
    secondary?: { width: number; collapsible: boolean };
  };
  orientation: 'portrait' | 'landscape' | 'both';
}

interface PanelState {
  sidebar: { isOpen: boolean; width: number };
  main: { width: number };
  secondary: { isOpen: boolean; width: number };
}

const TABLET_LAYOUTS: LayoutConfig[] = [
  {
    id: 'single',
    name: 'Single Pane',
    icon: Maximize2,
    description: 'Focus mode with single content area',
    panels: {
      sidebar: { width: 0, collapsible: true },
      main: { flexible: true }
    },
    orientation: 'both'
  },
  {
    id: 'sidebar-main',
    name: 'Sidebar + Main',
    icon: Sidebar,
    description: 'Traditional sidebar layout',
    panels: {
      sidebar: { width: 280, collapsible: true },
      main: { flexible: true }
    },
    orientation: 'both'
  },
  {
    id: 'split-view',
    name: 'Split View',
    icon: Columns2,
    description: 'Dual pane for reference and writing',
    panels: {
      sidebar: { width: 260, collapsible: true },
      main: { flexible: true },
      secondary: { width: 300, collapsible: true }
    },
    orientation: 'landscape'
  },
  {
    id: 'grid-view',
    name: 'Grid Layout',
    icon: LayoutGrid,
    description: 'Multi-panel grid for complex workflows',
    panels: {
      sidebar: { width: 240, collapsible: false },
      main: { flexible: true },
      secondary: { width: 280, collapsible: false }
    },
    orientation: 'landscape'
  }
];

export const TabletLayout: React.FC<TabletLayoutProps> = ({
  project,
  scenes,
  characters,
  currentView,
  orientation,
  onViewChange,
  onSceneSelect,
  onSceneCreate,
  className
}) => {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(TABLET_LAYOUTS[1]);
  const [panelState, setPanelState] = useState<PanelState>({
    sidebar: { isOpen: true, width: 280 },
    main: { width: 0 },
    secondary: { isOpen: false, width: 300 }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [secondaryContent, setSecondaryContent] = useState<'preview' | 'reference' | 'outline' | null>(null);

  // Adapt layout based on orientation
  useEffect(() => {
    const availableLayouts = TABLET_LAYOUTS.filter(
      layout => layout.orientation === 'both' || layout.orientation === orientation
    );
    
    if (!availableLayouts.some(layout => layout.id === currentLayout.id)) {
      setCurrentLayout(availableLayouts[0]);
    }
  }, [orientation, currentLayout]);

  // Handle layout changes
  const handleLayoutChange = useCallback((layout: LayoutConfig) => {
    setCurrentLayout(layout);
    
    // Update panel state based on new layout
    setPanelState(prev => ({
      sidebar: {
        isOpen: layout.panels.sidebar.width > 0,
        width: layout.panels.sidebar.width
      },
      main: {
        width: prev.main.width
      },
      secondary: {
        isOpen: layout.panels.secondary ? layout.panels.secondary.width > 0 : false,
        width: layout.panels.secondary?.width || 300
      }
    }));
    
    setShowLayoutSelector(false);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  }, []);

  // Toggle panel visibility
  const togglePanel = useCallback((panel: 'sidebar' | 'secondary') => {
    setPanelState(prev => ({
      ...prev,
      [panel]: {
        ...prev[panel],
        isOpen: !prev[panel].isOpen
      }
    }));
  }, []);

  // Handle scene selection
  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedScene(sceneId);
    onSceneSelect?.(sceneId);
    
    // Auto-open secondary panel in landscape mode for preview
    if (orientation === 'landscape' && currentLayout.panels.secondary) {
      setSecondaryContent('preview');
      setPanelState(prev => ({
        ...prev,
        secondary: { ...prev.secondary, isOpen: true }
      }));
    }
  }, [orientation, currentLayout, onSceneSelect]);

  // Render layout selector
  const renderLayoutSelector = () => (
    <AnimatePresence>
      {showLayoutSelector && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowLayoutSelector(false)}
        >
          <motion.div
            className="bg-background rounded-lg p-6 m-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Choose Layout</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLayoutSelector(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TABLET_LAYOUTS
                .filter(layout => layout.orientation === 'both' || layout.orientation === orientation)
                .map(layout => {
                  const IconComponent = layout.icon;
                  const isActive = layout.id === currentLayout.id;
                  
                  return (
                    <motion.button
                      key={layout.id}
                      onClick={() => handleLayoutChange(layout)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-colors",
                        isActive 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="h-5 w-5" />
                        <span className="font-medium">{layout.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {layout.description}
                      </p>
                    </motion.button>
                  );
                })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render main layout
  const renderLayout = () => {
    const showSidebar = panelState.sidebar.isOpen && currentLayout.panels.sidebar.width > 0;
    const showSecondary = panelState.secondary.isOpen && currentLayout.panels.secondary;

    if (currentLayout.id === 'single') {
      return (
        <div className="flex-1 overflow-hidden">
          <TabletMainContent
            project={project}
            scenes={scenes}
            characters={characters}
            currentView={currentView}
            selectedScene={selectedScene}
            orientation={orientation}
            onViewChange={onViewChange}
            onSceneSelect={handleSceneSelect}
            onSceneCreate={onSceneCreate}
          />
        </div>
      );
    }

    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
      >
        {/* Sidebar Panel */}
        {showSidebar && (
          <>
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={35}
              className="min-w-[240px]"
            >
              <TabletSidebar
                project={project}
                scenes={scenes}
                characters={characters}
                currentView={currentView}
                onViewChange={onViewChange}
                onSceneSelect={handleSceneSelect}
                onClose={() => togglePanel('sidebar')}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Content Panel */}
        <ResizablePanel defaultSize={showSecondary ? 50 : 80} minSize={30}>
          <TabletMainContent
            project={project}
            scenes={scenes}
            characters={characters}
            currentView={currentView}
            selectedScene={selectedScene}
            orientation={orientation}
            onViewChange={onViewChange}
            onSceneSelect={handleSceneSelect}
            onSceneCreate={onSceneCreate}
          />
        </ResizablePanel>

        {/* Secondary Panel */}
        {showSecondary && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={30}
              minSize={20}
              maxSize={40}
              className="min-w-[280px]"
            >
              <SplitViewManager
                content={secondaryContent}
                selectedScene={selectedScene}
                scenes={scenes}
                characters={characters}
                onContentChange={setSecondaryContent}
                onClose={() => togglePanel('secondary')}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    );
  };

  return (
    <div className={cn("tablet-layout h-screen flex flex-col bg-background", className)}>
      {/* Toolbar */}
      <TabletToolbar
        currentLayout={currentLayout}
        orientation={orientation}
        isFullscreen={isFullscreen}
        showSidebar={panelState.sidebar.isOpen}
        showSecondary={panelState.secondary.isOpen}
        onLayoutChange={() => setShowLayoutSelector(true)}
        onToggleSidebar={() => togglePanel('sidebar')}
        onToggleSecondary={() => togglePanel('secondary')}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        project={project}
      />

      {/* Main Layout */}
      <div className={cn("flex-1 flex overflow-hidden", isFullscreen && "absolute inset-0 z-40")}>
        {renderLayout()}
      </div>

      {/* Layout Selector Modal */}
      {renderLayoutSelector()}
      
      {/* Orientation indicator */}
      <motion.div
        className="fixed bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="h-3 w-3" />
          <span className="capitalize">{orientation}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default TabletLayout;