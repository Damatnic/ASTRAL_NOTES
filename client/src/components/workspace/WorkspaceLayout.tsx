/**
 * Multi-Panel Workspace Layout Component
 * Provides resizable, draggable panels with state persistence
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { 
  Layout,
  Maximize2,
  Minimize2,
  X,
  GripVertical,
  MoreHorizontal,
  Settings,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  PanelLeftClose,
  PanelRightClose,
  Layers
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { 
  workspaceLayoutService, 
  type LayoutConfig, 
  type PanelConfig 
} from '@/services/workspaceLayoutService';

// Panel content components
import { SceneBeatPanel } from '@/components/editor/SceneBeatPanel';
import { WritingAssistance } from '@/components/editor/WritingAssistance';
import { CollaborationPanel } from '@/components/editor/CollaborationPanel';
import { VersionHistory } from '@/components/editor/VersionHistory';

interface WorkspaceLayoutProps {
  children: React.ReactNode; // Main editor content
  className?: string;
  editorRef?: React.RefObject<any>;
  sceneId?: string;
  noteId?: string;
  projectId?: string;
}

const PANEL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  beats: SceneBeatPanel,
  writing: WritingAssistance,
  collaboration: CollaborationPanel,
  versions: VersionHistory,
  // Add more panel components as they're created
};

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

function ResizeHandle({ direction, onResize, className }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      onResize(delta);
      startPos.current = currentPos;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, onResize]);

  return (
    <div
      className={cn(
        "bg-border hover:bg-border/80 transition-colors cursor-resize select-none",
        direction === 'horizontal' ? "w-1 h-full cursor-col-resize" : "h-1 w-full cursor-row-resize",
        isDragging && "bg-cosmic-500",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      <div className={cn(
        "flex items-center justify-center h-full w-full opacity-0 hover:opacity-100 transition-opacity",
        direction === 'horizontal' ? "rotate-90" : ""
      )}>
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
}

export function WorkspaceLayout({ 
  children, 
  className,
  editorRef,
  sceneId,
  noteId,
  projectId
}: WorkspaceLayoutProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig | null>(null);
  const [layouts, setLayouts] = useState<LayoutConfig[]>([]);
  const [panelStates, setPanelStates] = useState<Map<string, any>>(new Map());
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [splitRatios, setSplitRatios] = useState<number[]>([0.7, 0.3]);
  const [floatingPanels, setFloatingPanels] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const toast = useToast();
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Load initial state
  useEffect(() => {
    const handleLayoutChange = (data: any) => {
      setCurrentLayout(data.layout);
    };

    const handlePanelStateChange = () => {
      // Reload panel states
      if (currentLayout) {
        const newStates = new Map();
        currentLayout.panels.forEach(panel => {
          const state = workspaceLayoutService.getPanelState(panel.id);
          if (state) {
            newStates.set(panel.id, state);
          }
        });
        setPanelStates(newStates);
      }
    };

    const handleSplitRatiosChange = (ratios: number[]) => {
      setSplitRatios(ratios);
    };

    workspaceLayoutService.on('layout-changed', handleLayoutChange);
    workspaceLayoutService.on('panel-state-changed', handlePanelStateChange);
    workspaceLayoutService.on('split-ratios-changed', handleSplitRatiosChange);

    // Initial load
    setLayouts(workspaceLayoutService.getLayouts());
    setCurrentLayout(workspaceLayoutService.getCurrentLayout());
    setSplitRatios(workspaceLayoutService.getSplitRatios());
    handlePanelStateChange();

    return () => {
      workspaceLayoutService.off('layout-changed', handleLayoutChange);
      workspaceLayoutService.off('panel-state-changed', handlePanelStateChange);
      workspaceLayoutService.off('split-ratios-changed', handleSplitRatiosChange);
    };
  }, [currentLayout]);

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Layout options for dropdown
  const layoutOptions: DropdownOption[] = layouts.map(layout => ({
    value: layout.id,
    label: layout.name,
    description: layout.description,
    icon: <Layout className="h-4 w-4" />,
  }));

  // Handle layout change
  const handleLayoutChange = useCallback((layoutId: string) => {
    workspaceLayoutService.setActiveLayout(layoutId);
    setIsLayoutMenuOpen(false);
  }, []);

  // Handle panel resize
  const handlePanelResize = useCallback((panelId: string, delta: number) => {
    const state = panelStates.get(panelId);
    if (state && workspaceRef.current) {
      const containerWidth = workspaceRef.current.offsetWidth;
      const deltaPercent = (delta / containerWidth) * 100;
      const newWidth = Math.max(10, Math.min(90, state.width + deltaPercent));
      workspaceLayoutService.resizePanel(panelId, newWidth);
    }
  }, [panelStates]);

  // Handle panel toggle
  const handlePanelToggle = useCallback((panelId: string) => {
    workspaceLayoutService.togglePanel(panelId);
  }, []);

  // Handle panel float
  const handlePanelFloat = useCallback((panelId: string) => {
    if (workspaceLayoutService.isFloating(panelId)) {
      workspaceLayoutService.dockPanel(panelId);
    } else {
      workspaceLayoutService.floatPanel(panelId, { x: 100, y: 100 });
    }
  }, []);

  // Render panel content
  const renderPanelContent = useCallback((panel: PanelConfig) => {
    const PanelComponent = PANEL_COMPONENTS[panel.type];
    
    if (!PanelComponent) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Panel type "{panel.type}" not implemented</p>
        </div>
      );
    }

    const commonProps = {
      editor: editorRef?.current,
      sceneId,
      noteId,
      projectId,
      onContentShare: (content: any) => {
        // Handle content sharing between panels
        workspaceLayoutService.sharePanelContent(panel.id, 'main-editor', content);
      },
    };

    return <PanelComponent {...commonProps} />;
  }, [editorRef, sceneId, noteId, projectId]);

  // Render floating panel
  const renderFloatingPanel = useCallback((panel: PanelConfig) => {
    const state = panelStates.get(panel.id);
    if (!state?.isOpen) return null;

    return (
      <Rnd
        key={panel.id}
        size={{ 
          width: state.width ? `${state.width}%` : 300, 
          height: state.height ? `${state.height}%` : 400 
        }}
        position={state.position || { x: 100, y: 100 }}
        onDragStop={(e, d) => {
          workspaceLayoutService.setPanelState(panel.id, {
            position: { x: d.x, y: d.y }
          });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          if (workspaceRef.current) {
            const containerWidth = workspaceRef.current.offsetWidth;
            const containerHeight = workspaceRef.current.offsetHeight;
            const widthPercent = (ref.offsetWidth / containerWidth) * 100;
            const heightPercent = (ref.offsetHeight / containerHeight) * 100;
            
            workspaceLayoutService.setPanelState(panel.id, {
              width: widthPercent,
              height: heightPercent,
              position,
            });
          }
        }}
        minWidth={250}
        minHeight={200}
        bounds="parent"
        dragHandleClassName="drag-handle"
        className="z-50"
      >
        <Card className="h-full flex flex-col shadow-lg border-2">
          <div className="flex items-center justify-between p-2 border-b bg-muted/50 drag-handle cursor-move">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cosmic-500" />
              <span className="text-sm font-medium">{panel.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handlePanelFloat(panel.id)}
                title="Dock panel"
              >
                <PanelLeftClose className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handlePanelToggle(panel.id)}
                title="Close panel"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {renderPanelContent(panel)}
          </div>
        </Card>
      </Rnd>
    );
  }, [panelStates, handlePanelFloat, handlePanelToggle, renderPanelContent]);

  // Render docked panels
  const renderDockedPanels = useCallback(() => {
    if (!currentLayout) return null;

    const dockedPanels = currentLayout.panels.filter(panel => 
      !workspaceLayoutService.isFloating(panel.id)
    );

    if (dockedPanels.length === 0) return null;

    const visiblePanels = dockedPanels.filter(panel => {
      const state = panelStates.get(panel.id);
      return state?.isOpen !== false;
    });

    if (visiblePanels.length === 0) return null;

    if (isMobile) {
      // Mobile: stack panels vertically
      return (
        <div className="space-y-2">
          {visiblePanels.map((panel, index) => (
            <Card key={panel.id} className="h-64">
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium">{panel.title}</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handlePanelToggle(panel.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="h-52 overflow-auto">
                {renderPanelContent(panel)}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Desktop: side-by-side layout
    return (
      <div className="flex h-full">
        {visiblePanels.map((panel, index) => {
          const state = panelStates.get(panel.id);
          const width = state?.width || panel.defaultWidth || 30;
          
          return (
            <React.Fragment key={panel.id}>
              {index > 0 && (
                <ResizeHandle
                  direction="horizontal"
                  onResize={(delta) => handlePanelResize(visiblePanels[index - 1].id, -delta)}
                />
              )}
              <div 
                className="h-full flex flex-col"
                style={{ width: `${width}%` }}
              >
                <Card className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <span className="text-sm font-medium">{panel.title}</span>
                    <div className="flex items-center gap-1">
                      {panel.isFloating !== false && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handlePanelFloat(panel.id)}
                          title="Float panel"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                      )}
                      {panel.isClosable !== false && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handlePanelToggle(panel.id)}
                          title="Close panel"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {renderPanelContent(panel)}
                  </div>
                </Card>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }, [currentLayout, panelStates, isMobile, handlePanelToggle, handlePanelFloat, handlePanelResize, renderPanelContent]);

  if (!currentLayout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const mainPanel = currentLayout.panels.find(p => p.id === currentLayout.mainPanel);
  const sidePanels = currentLayout.panels.filter(p => p.id !== currentLayout.mainPanel);
  const hasVisibleSidePanels = sidePanels.some(panel => {
    const state = panelStates.get(panel.id);
    return state?.isOpen !== false && !workspaceLayoutService.isFloating(panel.id);
  });

  return (
    <div 
      ref={workspaceRef}
      className={cn("h-full flex flex-col relative", className)}
    >
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Dropdown
            options={layoutOptions}
            value={currentLayout.id}
            onChange={handleLayoutChange}
            placeholder="Layout"
            className="w-48"
          />
          <span className="text-xs text-muted-foreground">
            {currentLayout.description}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Device Presets */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => workspaceLayoutService.applyPreset('minimal')}
            title="Minimal mode"
          >
            <Smartphone className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => workspaceLayoutService.applyPreset('writer')}
            title="Writer mode"
          >
            <Tablet className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => workspaceLayoutService.applyPreset('planner')}
            title="Planner mode"
          >
            <Monitor className="h-3 w-3" />
          </Button>

          {/* Layout Actions */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              const exported = workspaceLayoutService.exportLayout(currentLayout.id);
              if (exported) {
                navigator.clipboard.writeText(exported);
                toast.success('Layout copied to clipboard');
              }
            }}
            title="Export layout"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="xs"
            onClick={() => workspaceLayoutService.resetLayout()}
            title="Reset layout"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Panel */}
        <div 
          className={cn(
            "flex flex-col transition-all duration-200",
            hasVisibleSidePanels ? (isMobile ? "w-full" : `w-[${splitRatios[0] * 100}%]`) : "w-full"
          )}
        >
          {children}
        </div>

        {/* Resize Handle */}
        {hasVisibleSidePanels && !isMobile && (
          <ResizeHandle
            direction="horizontal"
            onResize={(delta) => {
              if (workspaceRef.current) {
                const containerWidth = workspaceRef.current.offsetWidth;
                const deltaPercent = delta / containerWidth;
                const newRatios = [
                  Math.max(0.3, Math.min(0.8, splitRatios[0] + deltaPercent)),
                  Math.max(0.2, Math.min(0.7, splitRatios[1] - deltaPercent))
                ];
                workspaceLayoutService.setSplitRatios(newRatios);
              }
            }}
          />
        )}

        {/* Side Panels */}
        {hasVisibleSidePanels && (
          <div 
            className={cn(
              "flex-shrink-0 transition-all duration-200",
              isMobile ? "w-full mt-2" : `w-[${splitRatios[1] * 100}%]`
            )}
          >
            {renderDockedPanels()}
          </div>
        )}
      </div>

      {/* Floating Panels */}
      {currentLayout.panels
        .filter(panel => workspaceLayoutService.isFloating(panel.id))
        .map(panel => renderFloatingPanel(panel))}

      {/* Panel Toggle Buttons (for closed panels) */}
      <div className="absolute top-16 right-4 space-y-1">
        {currentLayout.panels
          .filter(panel => {
            const state = panelStates.get(panel.id);
            return state?.isOpen === false;
          })
          .map(panel => (
            <Button
              key={panel.id}
              variant="outline"
              size="xs"
              onClick={() => handlePanelToggle(panel.id)}
              className="shadow-lg"
              title={`Open ${panel.title}`}
            >
              <span className="text-xs">{panel.title}</span>
            </Button>
          ))}
      </div>
    </div>
  );
}