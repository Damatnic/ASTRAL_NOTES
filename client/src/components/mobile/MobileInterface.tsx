/**
 * MobileInterface Component
 * Touch-optimized interface for mobile writing and story development
 * Designed for one-handed use, gesture navigation, and mobile-first workflows
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import MobileEditor from './MobileEditor';
import MobileNavigation from './MobileNavigation';
import MobileFAB from './MobileFAB';
import MobileQuickActions from './MobileQuickActions';
import SwipeableCard from './SwipeableCard';
import TouchOptimizedInput from './TouchOptimizedInput';
import type { Project, Scene, Character } from '@/types/story';
import {
  Edit3,
  Mic,
  Camera,
  Search,
  Menu,
  X,
  Plus,
  ArrowLeft,
  MoreVertical,
  Heart,
  Bookmark,
  Share2,
  FileText,
  Users,
  MapPin,
  Layers,
  Settings,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  Signal
} from 'lucide-react';

export interface MobileView {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  icon: React.ComponentType<any>;
  swipeDirection?: 'left' | 'right' | 'up' | 'down';
  gestureShortcut?: string;
}

export interface GestureConfig {
  swipeThreshold: number;
  tapTimeout: number;
  longPressTimeout: number;
  pinchSensitivity: number;
  enableHaptics: boolean;
}

export interface MobileInterfaceProps {
  project: Project;
  scenes: Scene[];
  characters: Character[];
  currentView: string;
  isOnline: boolean;
  batteryLevel?: number;
  onViewChange?: (viewId: string) => void;
  onSceneCreate?: () => void;
  onSceneSelect?: (sceneId: string) => void;
  onVoiceToggle?: () => void;
  className?: string;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isLongPress: boolean;
  gestureType: 'tap' | 'longpress' | 'swipe' | 'pinch' | null;
}

const MOBILE_VIEWS: MobileView[] = [
  { id: 'scenes', name: 'Scenes', component: () => null, icon: FileText, swipeDirection: 'left' },
  { id: 'characters', name: 'Characters', component: () => null, icon: Users, swipeDirection: 'left' },
  { id: 'locations', name: 'Locations', component: () => null, icon: MapPin, swipeDirection: 'left' },
  { id: 'timeline', name: 'Timeline', component: () => null, icon: Layers, swipeDirection: 'up' },
  { id: 'write', name: 'Write', component: () => null, icon: Edit3, swipeDirection: 'down' }
];

const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  swipeThreshold: 50,
  tapTimeout: 200,
  longPressTimeout: 500,
  pinchSensitivity: 0.1,
  enableHaptics: true
};

export const MobileInterface: React.FC<MobileInterfaceProps> = ({
  project,
  scenes,
  characters,
  currentView,
  isOnline,
  batteryLevel,
  onViewChange,
  onSceneCreate,
  onSceneSelect,
  onVoiceToggle,
  className
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [gestureConfig, setGestureConfig] = useState<GestureConfig>(DEFAULT_GESTURE_CONFIG);
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout>();
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Motion values for gesture handling
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const scale = useMotionValue(1);
  
  // Transform values for visual feedback
  const backgroundOpacity = useTransform(dragX, [-100, 0, 100], [0.1, 0, 0.1]);
  const cardRotation = useTransform(dragX, [-100, 100], [-5, 5]);

  // Haptic feedback function
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!gestureConfig.enableHaptics) return;
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [gestureConfig.enableHaptics]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const newTouchState: TouchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isLongPress: false,
      gestureType: null
    };
    
    setTouchState(newTouchState);
    
    // Setup long press detection
    longPressTimeoutRef.current = setTimeout(() => {
      hapticFeedback('medium');
      setTouchState(prev => prev ? { ...prev, isLongPress: true, gestureType: 'longpress' } : null);
      setShowQuickActions(true);
    }, gestureConfig.longPressTimeout);
    
  }, [gestureConfig.longPressTimeout, hapticFeedback]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Clear long press if moved too much
    if (distance > 10 && longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    // Detect swipe
    if (distance > gestureConfig.swipeThreshold) {
      setTouchState(prev => prev ? { ...prev, gestureType: 'swipe' } : null);
    }
    
    // Update drag values for visual feedback
    dragX.set(deltaX);
    dragY.set(deltaY);
    
  }, [touchState, gestureConfig.swipeThreshold, dragX, dragY]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState) return;
    
    // Clear timeouts
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - touchState.startTime;
    
    // Determine gesture type
    if (touchState.isLongPress) {
      // Long press already handled
    } else if (distance < 10 && duration < gestureConfig.tapTimeout) {
      // Tap
      hapticFeedback('light');
      handleTap(touch.clientX, touch.clientY);
    } else if (distance > gestureConfig.swipeThreshold) {
      // Swipe
      handleSwipe(deltaX, deltaY);
    }
    
    // Reset motion values
    dragX.set(0);
    dragY.set(0);
    scale.set(1);
    
    setTouchState(null);
  }, [touchState, gestureConfig, hapticFeedback, dragX, dragY, scale]);

  const handleTap = useCallback((x: number, y: number) => {
    // Handle single tap actions
    console.log('Tap at:', x, y);
  }, []);

  const handleSwipe = useCallback((deltaX: number, deltaY: number) => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right - go back or show menu
        if (currentView !== 'scenes') {
          onViewChange?.('scenes');
        } else {
          setIsMenuOpen(true);
        }
      } else {
        // Swipe left - navigate forward
        const currentIndex = MOBILE_VIEWS.findIndex(v => v.id === currentView);
        const nextView = MOBILE_VIEWS[(currentIndex + 1) % MOBILE_VIEWS.length];
        onViewChange?.(nextView.id);
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        // Swipe down - show quick actions or refresh
        setShowQuickActions(true);
      } else {
        // Swipe up - hide quick actions or show search
        setShowQuickActions(false);
      }
    }
    
    hapticFeedback('medium');
  }, [currentView, onViewChange, hapticFeedback]);

  // Pinch to zoom handling
  const handlePinch = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Update scale based on pinch
      scale.set(Math.max(0.5, Math.min(2, distance / 200)));
    }
  }, [scale]);

  const renderStatusBar = () => (
    <div className="flex items-center justify-between p-2 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{project.title}</span>
        {!isOnline && <WifiOff className="h-4 w-4 text-red-500" />}
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        {batteryLevel !== undefined && (
          <div className="flex items-center gap-1">
            <Battery className="h-4 w-4" />
            <span>{batteryLevel}%</span>
          </div>
        )}
        <Signal className="h-4 w-4" />
      </div>
    </div>
  );

  const renderFAB = () => (
    <MobileFAB
      onMainAction={onSceneCreate}
      onVoiceToggle={() => {
        setIsVoiceActive(!isVoiceActive);
        onVoiceToggle?.();
      }}
      isVoiceActive={isVoiceActive}
      quickActions={[
        { icon: Plus, label: 'New Scene', action: onSceneCreate },
        { icon: Camera, label: 'Add Image', action: () => {} },
        { icon: Search, label: 'Search', action: () => {} }
      ]}
    />
  );

  const renderSceneCard = (scene: Scene) => (
    <SwipeableCard
      key={scene.id}
      onSwipeLeft={() => {
        // Mark as favorite
        hapticFeedback('light');
      }}
      onSwipeRight={() => {
        // Quick edit
        setSelectedScene(scene.id);
        onSceneSelect?.(scene.id);
      }}
      onLongPress={() => {
        setShowQuickActions(true);
        setSelectedScene(scene.id);
      }}
      leftAction={{
        icon: Heart,
        color: 'text-red-500',
        background: 'bg-red-50'
      }}
      rightAction={{
        icon: Edit3,
        color: 'text-blue-500',
        background: 'bg-blue-50'
      }}
    >
      <Card className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{scene.title}</h3>
          <Badge variant="outline" className="ml-2">
            #{scene.order}
          </Badge>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
          {scene.summary || 'No summary available'}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{scene.characters.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{scene.wordCount} words</span>
            </div>
          </div>
          
          <Button size="sm" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </SwipeableCard>
  );

  const renderMainContent = () => {
    switch (currentView) {
      case 'scenes':
        return (
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Scenes</h2>
              <Badge variant="outline">{scenes.length} scenes</Badge>
            </div>
            
            <div className="space-y-3">
              {scenes.map(renderSceneCard)}
            </div>
          </div>
        );
        
      case 'write':
        return (
          <MobileEditor
            sceneId={selectedScene || ''}
            isVoiceMode={isVoiceActive}
            onVoiceToggle={() => setIsVoiceActive(!isVoiceActive)}
          />
        );
        
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                {MOBILE_VIEWS.find(v => v.id === currentView)?.name}
              </h2>
              <p className="text-muted-foreground">
                Coming soon...
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "mobile-interface h-screen flex flex-col bg-background text-foreground",
        isDarkMode && "dark",
        isFullscreen && "fullscreen",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Status Bar */}
      {renderStatusBar()}
      
      {/* Navigation */}
      <MobileNavigation
        views={MOBILE_VIEWS}
        currentView={currentView}
        onViewChange={onViewChange}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
      />
      
      {/* Main Content */}
      <motion.div 
        className="flex-1 overflow-hidden"
        style={{
          x: dragX,
          y: dragY,
          scale: scale,
          rotateY: cardRotation
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full overflow-y-auto"
          >
            {renderMainContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && (
          <MobileQuickActions
            scene={selectedScene ? scenes.find(s => s.id === selectedScene) : undefined}
            onClose={() => setShowQuickActions(false)}
            onAction={(action) => {
              console.log('Quick action:', action);
              setShowQuickActions(false);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Floating Action Button */}
      {currentView !== 'write' && renderFAB()}
      
      {/* Gesture hint overlay */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundColor: `rgba(0,0,0,${backgroundOpacity.get()})` }}
      />
      
      {/* Voice indicator */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed top-20 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg"
          >
            <Volume2 className="h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileInterface;