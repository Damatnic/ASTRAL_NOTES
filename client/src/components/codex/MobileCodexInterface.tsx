/**
 * Mobile Codex Interface - Phase 1C Feature
 * Comprehensive mobile-responsive UI for the advanced Codex system
 * Optimized for touch interactions and small screens
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Users,
  MapPin,
  Zap,
  Building,
  BookOpen,
  Layers,
  Network,
  Settings,
  Share,
  Eye,
  Edit3,
  MoreVertical,
  Heart,
  MessageCircle,
  ArrowLeft,
  Grid,
  List,
  Shuffle,
  Star
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import { advancedCodexService } from '@/services/advancedCodexService';
import { advancedCodexSearchService } from '@/services/advancedCodexSearchService';
import { codexCollaborationService } from '@/services/codexCollaborationService';
import { intelligentAutoLinkingService } from '@/services/intelligentAutoLinkingService';

import type {
  AdvancedCodexEntity,
  AdvancedEntityType,
  SearchResult,
  EntityLink,
  CodexCollaborator
} from '@/types/codex';

// Mobile-specific interfaces
export interface MobileViewState {
  currentView: 'overview' | 'search' | 'entity_detail' | 'create_entity' | 'relationship_map' | 'timeline';
  selectedEntity?: AdvancedCodexEntity;
  searchQuery: string;
  showFilters: boolean;
  showMenu: boolean;
  swipeDirection?: 'left' | 'right';
}

export interface TouchGesture {
  type: 'tap' | 'long_press' | 'swipe' | 'pinch';
  target: string;
  data?: any;
}

export interface MobileCodexSettings {
  defaultView: 'grid' | 'list' | 'cards';
  enableSwipeNavigation: boolean;
  enableHapticFeedback: boolean;
  showEntityPreviews: boolean;
  autoRefresh: boolean;
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'auto' | 'light' | 'dark';
}

interface MobileCodexInterfaceProps {
  projectId: string;
  universeId?: string;
  initialView?: MobileViewState['currentView'];
  onEntitySelect?: (entity: AdvancedCodexEntity) => void;
  onCreateEntity?: (type: AdvancedEntityType) => void;
  enableCollaboration?: boolean;
  enableOfflineMode?: boolean;
  className?: string;
}

const ENTITY_TYPE_CONFIG = {
  character: { icon: Users, color: 'bg-red-500', label: 'Characters' },
  location: { icon: MapPin, color: 'bg-blue-500', label: 'Locations' },
  object: { icon: Zap, color: 'bg-green-500', label: 'Objects' },
  organization: { icon: Building, color: 'bg-purple-500', label: 'Organizations' },
  lore: { icon: BookOpen, color: 'bg-indigo-500', label: 'Lore' },
  theme: { icon: Layers, color: 'bg-pink-500', label: 'Themes' },
  subplot: { icon: Network, color: 'bg-yellow-500', label: 'Subplots' }
};

const MOBILE_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024
};

export default function MobileCodexInterface({
  projectId,
  universeId,
  initialView = 'overview',
  onEntitySelect,
  onCreateEntity,
  enableCollaboration = true,
  enableOfflineMode = false,
  className = ''
}: MobileCodexInterfaceProps) {
  // State management
  const [viewState, setViewState] = useState<MobileViewState>({
    currentView: initialView,
    searchQuery: '',
    showFilters: false,
    showMenu: false
  });

  const [entities, setEntities] = useState<AdvancedCodexEntity[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<CodexCollaborator[]>([]);
  const [settings, setSettings] = useState<MobileCodexSettings>(getDefaultSettings());

  // Screen size detection
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isPortrait, setIsPortrait] = useState(true);

  // Touch and gesture handling
  const [lastTap, setLastTap] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

  // Effects
  useEffect(() => {
    loadInitialData();
    setupScreenSizeListener();
    setupCollaboration();
    
    return () => {
      cleanup();
    };
  }, [projectId]);

  useEffect(() => {
    if (viewState.searchQuery) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [viewState.searchQuery]);

  // Data loading
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const entitiesResponse = await advancedCodexService.searchEntities({
        projectId,
        universeId
      });
      setEntities(entitiesResponse.results.map(r => r.entity));
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, universeId]);

  const performSearch = useCallback(async () => {
    if (!viewState.searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await advancedCodexSearchService.smartSearch({
        query: viewState.searchQuery,
        context: { currentProject: projectId, currentUniverse: universeId },
        options: {
          enableAI: true,
          enableSemanticSearch: true,
          maxResults: 20,
          responseStyle: 'quick' // Optimized for mobile
        }
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [viewState.searchQuery, projectId, universeId]);

  // Collaboration setup
  const setupCollaboration = useCallback(async () => {
    if (!enableCollaboration) return;
    
    try {
      await codexCollaborationService.joinCollaboration(projectId);
      
      // Listen for collaborator updates
      codexCollaborationService.addEventListener('collaborator_joined', (collaborator) => {
        setCollaborators(prev => [...prev, collaborator]);
      });
      
      codexCollaborationService.addEventListener('collaborator_left', (data) => {
        setCollaborators(prev => prev.filter(c => c.userId !== data.userId));
      });
      
      // Get initial collaborators
      const activeCollaborators = await advancedCodexService.getActiveCollaborators(projectId);
      setCollaborators(activeCollaborators);
    } catch (error) {
      console.error('Failed to setup collaboration:', error);
    }
  }, [projectId, enableCollaboration]);

  // Screen size detection
  const setupScreenSizeListener = useCallback(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsPortrait(height > width);
      
      if (width < MOBILE_BREAKPOINTS.sm) {
        setScreenSize('sm');
      } else if (width < MOBILE_BREAKPOINTS.md) {
        setScreenSize('md');
      } else {
        setScreenSize('lg');
      }
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', updateScreenSize);
    
    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);

  // Navigation handlers
  const navigateToView = useCallback((view: MobileViewState['currentView'], data?: any) => {
    setViewState(prev => ({
      ...prev,
      currentView: view,
      selectedEntity: data?.entity || prev.selectedEntity,
      showMenu: false
    }));
    
    // Haptic feedback
    if (settings.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [settings.enableHapticFeedback]);

  const handleBackNavigation = useCallback(() => {
    switch (viewState.currentView) {
      case 'entity_detail':
      case 'create_entity':
      case 'relationship_map':
      case 'timeline':
        navigateToView('overview');
        break;
      case 'search':
        setViewState(prev => ({ ...prev, searchQuery: '', currentView: 'overview' }));
        break;
      default:
        // Close the interface or go to parent view
        break;
    }
  }, [viewState.currentView, navigateToView]);

  // Touch and gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, action?: () => void) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Tap detection
    if (distance < 10) {
      const now = Date.now();
      const timeDiff = now - lastTap;
      
      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap
        handleDoubleTap(action);
      } else {
        // Single tap
        action?.();
      }
      
      setLastTap(now);
    }
    
    // Swipe detection
    if (settings.enableSwipeNavigation && distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          handleSwipeRight();
        } else {
          handleSwipeLeft();
        }
      }
    }
  }, [touchStart, lastTap, settings.enableSwipeNavigation]);

  const handleDoubleTap = useCallback((action?: () => void) => {
    // Double tap to expand/collapse or perform quick action
    if (settings.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    action?.();
  }, [settings.enableHapticFeedback]);

  const handleSwipeLeft = useCallback(() => {
    // Swipe left to go forward/open menu
    if (viewState.currentView === 'overview') {
      setViewState(prev => ({ ...prev, showMenu: true }));
    }
  }, [viewState.currentView]);

  const handleSwipeRight = useCallback(() => {
    // Swipe right to go back/close menu
    if (viewState.showMenu) {
      setViewState(prev => ({ ...prev, showMenu: false }));
    } else {
      handleBackNavigation();
    }
  }, [viewState.showMenu, handleBackNavigation]);

  const handleLongPress = useCallback((entity: AdvancedCodexEntity) => {
    // Long press for context menu
    if (settings.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
    
    // Show context menu for entity
    // Implementation would show a context menu with options
  }, [settings.enableHapticFeedback]);

  // Entity actions
  const handleEntityTap = useCallback((entity: AdvancedCodexEntity) => {
    if (screenSize === 'sm') {
      // On small screens, navigate to detail view
      navigateToView('entity_detail', { entity });
    } else {
      // On larger screens, show inline preview
      setViewState(prev => ({ ...prev, selectedEntity: entity }));
    }
    
    onEntitySelect?.(entity);
  }, [screenSize, navigateToView, onEntitySelect]);

  const handleCreateEntity = useCallback((type: AdvancedEntityType) => {
    navigateToView('create_entity', { entityType: type });
    onCreateEntity?.(type);
  }, [navigateToView, onCreateEntity]);

  // Computed values
  const groupedEntities = useMemo(() => {
    const groups: Record<AdvancedEntityType, AdvancedCodexEntity[]> = {
      character: [],
      location: [],
      object: [],
      organization: [],
      lore: [],
      theme: [],
      subplot: []
    };
    
    entities.forEach(entity => {
      if (groups[entity.type]) {
        groups[entity.type].push(entity);
      }
    });
    
    return groups;
  }, [entities]);

  const displayResults = useMemo(() => {
    return viewState.searchQuery ? searchResults.map(r => r.entity) : entities;
  }, [viewState.searchQuery, searchResults, entities]);

  // Render methods
  const renderHeader = () => (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {viewState.currentView !== 'overview' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackNavigation}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <h1 className="text-lg font-semibold">
            {getViewTitle(viewState.currentView)}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {enableCollaboration && collaborators.length > 0 && (
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map(collaborator => (
                <div
                  key={collaborator.userId}
                  className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs text-white font-medium">
                    {collaborator.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    +{collaborators.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewState(prev => ({ ...prev, showMenu: !prev.showMenu }))}
            className="p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSearchBar = () => (
    <div className="px-4 py-3 bg-gray-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search entities..."
          value={viewState.searchQuery}
          onChange={(e) => setViewState(prev => ({ ...prev, searchQuery: e.target.value }))}
          className="pl-10 pr-10"
        />
        {viewState.searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewState(prev => ({ ...prev, searchQuery: '' }))}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {viewState.searchQuery && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">
            {searchResults.length} results
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>
      )}
    </div>
  );

  const renderEntityGrid = () => (
    <div className="p-4">
      {settings.defaultView === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {displayResults.map(entity => (
            <EntityCard
              key={entity.id}
              entity={entity}
              onTap={handleEntityTap}
              onLongPress={handleLongPress}
              compact={settings.compactMode}
              fontSize={settings.fontSize}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayResults.map(entity => (
            <EntityListItem
              key={entity.id}
              entity={entity}
              onTap={handleEntityTap}
              onLongPress={handleLongPress}
              compact={settings.compactMode}
              fontSize={settings.fontSize}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderEntityDetail = () => {
    if (!viewState.selectedEntity) return null;
    
    return (
      <EntityDetailView
        entity={viewState.selectedEntity}
        projectId={projectId}
        onEdit={() => {/* Navigate to edit view */}}
        onRelationships={() => navigateToView('relationship_map')}
        onTimeline={() => navigateToView('timeline')}
        enableCollaboration={enableCollaboration}
        mobileOptimized={true}
      />
    );
  };

  const renderCreateEntity = () => (
    <CreateEntityForm
      projectId={projectId}
      entityType={viewState.selectedEntity?.type}
      onCancel={() => navigateToView('overview')}
      onComplete={(entity) => {
        setEntities(prev => [...prev, entity]);
        navigateToView('entity_detail', { entity });
      }}
      mobileOptimized={true}
    />
  );

  const renderSideMenu = () => (
    <AnimatePresence>
      {viewState.showMenu && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setViewState(prev => ({ ...prev, showMenu: false }))}
          />
          
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-xl"
          >
            <SideMenu
              entities={entities}
              groupedEntities={groupedEntities}
              settings={settings}
              onNavigate={navigateToView}
              onCreateEntity={handleCreateEntity}
              onSettingsChange={setSettings}
              onClose={() => setViewState(prev => ({ ...prev, showMenu: false }))}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderCurrentView = () => {
    switch (viewState.currentView) {
      case 'overview':
        return (
          <>
            {renderSearchBar()}
            {renderEntityGrid()}
          </>
        );
      case 'search':
        return (
          <>
            {renderSearchBar()}
            {renderEntityGrid()}
          </>
        );
      case 'entity_detail':
        return renderEntityDetail();
      case 'create_entity':
        return renderCreateEntity();
      case 'relationship_map':
        return (
          <RelationshipMapView
            entity={viewState.selectedEntity}
            projectId={projectId}
            mobileOptimized={true}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            entity={viewState.selectedEntity}
            projectId={projectId}
            mobileOptimized={true}
          />
        );
      default:
        return renderEntityGrid();
    }
  };

  // Main render
  return (
    <div 
      className={`h-full flex flex-col bg-white ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => handleTouchEnd(e)}
    >
      {renderHeader()}
      
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={viewState.currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full overflow-y-auto"
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            renderCurrentView()
          )}
        </motion.div>
      </div>
      
      {renderSideMenu()}
      
      {/* Quick Action Button */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center z-30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigateToView('create_entity')}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}

// Sub-components for mobile interface

interface EntityCardProps {
  entity: AdvancedCodexEntity;
  onTap: (entity: AdvancedCodexEntity) => void;
  onLongPress: (entity: AdvancedCodexEntity) => void;
  compact?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

function EntityCard({ entity, onTap, onLongPress, compact = false, fontSize = 'medium' }: EntityCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const config = ENTITY_TYPE_CONFIG[entity.type];
  const IconComponent = config.icon;
  
  const handleTouchStart = () => {
    setIsPressed(true);
    const timer = setTimeout(() => {
      onLongPress(entity);
      setIsPressed(false);
    }, 500);
    setPressTimer(timer);
  };
  
  const handleTouchEnd = () => {
    setIsPressed(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      onTap(entity);
    }
  };
  
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }[fontSize];
  
  return (
    <motion.div
      className={`relative bg-white rounded-lg border border-gray-200 shadow-sm ${
        isPressed ? 'bg-gray-50' : ''
      } ${compact ? 'p-3' : 'p-4'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start space-x-3">
        <div className={`${config.color} rounded-lg p-2 ${compact ? 'w-8 h-8' : 'w-10 h-10'} flex items-center justify-center`}>
          <IconComponent className={`text-white ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 truncate ${fontSizeClass}`}>
            {entity.name}
          </h3>
          
          {!compact && entity.summary && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {entity.summary}
            </p>
          )}
          
          <div className="flex items-center mt-2 space-x-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < entity.importance ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {entity.tags.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {entity.tags[0]}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface EntityListItemProps {
  entity: AdvancedCodexEntity;
  onTap: (entity: AdvancedCodexEntity) => void;
  onLongPress: (entity: AdvancedCodexEntity) => void;
  compact?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

function EntityListItem({ entity, onTap, onLongPress, compact = false, fontSize = 'medium' }: EntityListItemProps) {
  const config = ENTITY_TYPE_CONFIG[entity.type];
  const IconComponent = config.icon;
  
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }[fontSize];
  
  return (
    <motion.div
      className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200"
      onTouchStart={() => {}}
      onTouchEnd={() => onTap(entity)}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`${config.color} rounded-lg p-2 w-8 h-8 flex items-center justify-center`}>
        <IconComponent className="text-white w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-gray-900 truncate ${fontSizeClass}`}>
          {entity.name}
        </h3>
        {!compact && (
          <p className="text-sm text-gray-600 truncate">
            {entity.summary || 'No description'}
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex">
          {[...Array(entity.importance)].map((_, i) => (
            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
          ))}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </motion.div>
  );
}

// Additional mobile-optimized sub-components would be implemented here:
// - EntityDetailView
// - CreateEntityForm  
// - SideMenu
// - RelationshipMapView
// - TimelineView
// - LoadingSpinner

// Utility functions
function getViewTitle(view: MobileViewState['currentView']): string {
  switch (view) {
    case 'overview': return 'Codex';
    case 'search': return 'Search';
    case 'entity_detail': return 'Entity Details';
    case 'create_entity': return 'Create Entity';
    case 'relationship_map': return 'Relationships';
    case 'timeline': return 'Timeline';
    default: return 'Codex';
  }
}

function getDefaultSettings(): MobileCodexSettings {
  return {
    defaultView: 'grid',
    enableSwipeNavigation: true,
    enableHapticFeedback: true,
    showEntityPreviews: true,
    autoRefresh: true,
    compactMode: false,
    fontSize: 'medium',
    colorScheme: 'auto'
  };
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Placeholder components for the referenced sub-components
function EntityDetailView(props: any) { return <div>Entity Detail View</div>; }
function CreateEntityForm(props: any) { return <div>Create Entity Form</div>; }
function SideMenu(props: any) { return <div>Side Menu</div>; }
function RelationshipMapView(props: any) { return <div>Relationship Map View</div>; }
function TimelineView(props: any) { return <div>Timeline View</div>; }

// Cleanup function
function cleanup() {
  // Clean up any mobile-specific resources
}