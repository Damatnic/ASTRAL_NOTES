/**
 * Advanced Animation Engine
 * Physics-based animations for drag-and-drop with 60fps performance
 */

import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { 
  motion, 
  useSpring, 
  useMotionValue, 
  useTransform, 
  useAnimation, 
  AnimationControls,
  MotionValue,
  Variants,
  Transition
} from 'framer-motion';

// Physics configurations for different interaction types
export const PHYSICS_PRESETS = {
  // Smooth drag feedback
  dragFeedback: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
    mass: 0.8
  },
  
  // Snap back animation
  snapBack: {
    type: "spring" as const,
    stiffness: 600,
    damping: 30,
    mass: 1
  },
  
  // Drop zone activation
  dropZone: {
    type: "spring" as const,
    stiffness: 500,
    damping: 20,
    mass: 0.5
  },
  
  // Scene card interactions
  cardHover: {
    type: "spring" as const,
    stiffness: 800,
    damping: 35,
    mass: 0.3
  },
  
  // Layout transitions
  layout: {
    type: "spring" as const,
    stiffness: 300,
    damping: 35,
    mass: 1.2
  },
  
  // Batch selection
  batchSelect: {
    type: "spring" as const,
    stiffness: 700,
    damping: 25,
    mass: 0.4
  }
};

// Gesture configurations
export const GESTURE_PRESETS = {
  // Standard drag
  drag: {
    dragElastic: 0.1,
    dragMomentum: false,
    dragTransition: { 
      bounceStiffness: 400, 
      bounceDamping: 20 
    }
  },
  
  // Multi-touch drag
  multiTouch: {
    dragElastic: 0.05,
    dragMomentum: true,
    dragTransition: { 
      bounceStiffness: 300, 
      bounceDamping: 30 
    }
  },
  
  // Long press
  longPress: {
    dragElastic: 0.2,
    dragMomentum: false,
    dragTransition: { 
      bounceStiffness: 600, 
      bounceDamping: 15 
    }
  }
};

// Animation variants for common patterns
export const ANIMATION_VARIANTS: Record<string, Variants> = {
  // Scene card states
  sceneCard: {
    idle: {
      scale: 1,
      rotateZ: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: PHYSICS_PRESETS.cardHover
    },
    hover: {
      scale: 1.02,
      rotateZ: 0.5,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      transition: PHYSICS_PRESETS.cardHover
    },
    dragging: {
      scale: 1.05,
      rotateZ: 2,
      boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      transition: PHYSICS_PRESETS.dragFeedback
    },
    selected: {
      scale: 1.02,
      rotateZ: 0,
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5), 0 4px 20px rgba(0,0,0,0.15)",
      transition: PHYSICS_PRESETS.batchSelect
    }
  },

  // Drop zone states
  dropZone: {
    inactive: {
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "rgba(0,0,0,0)",
      scale: 1,
      transition: PHYSICS_PRESETS.dropZone
    },
    active: {
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      scale: 1.02,
      transition: PHYSICS_PRESETS.dropZone
    },
    invalid: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderColor: "rgba(239, 68, 68, 0.3)",
      scale: 0.98,
      transition: PHYSICS_PRESETS.dropZone
    }
  },

  // Lane animations
  lane: {
    collapsed: {
      height: "auto",
      opacity: 1,
      transition: PHYSICS_PRESETS.layout
    },
    expanded: {
      height: "auto",
      opacity: 1,
      transition: PHYSICS_PRESETS.layout
    }
  },

  // Batch selection
  batchIndicator: {
    hidden: {
      scale: 0,
      opacity: 0,
      transition: PHYSICS_PRESETS.batchSelect
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: PHYSICS_PRESETS.batchSelect
    }
  }
};

// Performance monitoring
interface PerformanceMetrics {
  frameTime: number;
  droppedFrames: number;
  animationCount: number;
  averageFrameTime: number;
}

interface AnimationNode {
  id: string;
  element: HTMLElement;
  controls: AnimationControls;
  motionValues: {
    x: MotionValue<number>;
    y: MotionValue<number>;
    scale: MotionValue<number>;
    rotate: MotionValue<number>;
  };
  lastFrameTime: number;
  isAnimating: boolean;
}

interface AnimationEngineState {
  nodes: Map<string, AnimationNode>;
  performanceMetrics: PerformanceMetrics;
  isPerformanceMonitoringEnabled: boolean;
  frameCounter: number;
  lastFrameTimestamp: number;
}

interface AnimationEngineContextValue {
  registerNode: (id: string, element: HTMLElement) => AnimationNode;
  unregisterNode: (id: string) => void;
  getNode: (id: string) => AnimationNode | undefined;
  animateNode: (id: string, animation: any, transition?: Transition) => Promise<void>;
  animateBatch: (nodeIds: string[], animation: any, transition?: Transition) => Promise<void>;
  createPhysicsSpring: (stiffness: number, damping: number, mass?: number) => Transition;
  createGestureConfig: (type: 'drag' | 'multiTouch' | 'longPress') => any;
  getPerformanceMetrics: () => PerformanceMetrics;
  enablePerformanceMonitoring: (enabled: boolean) => void;
}

const AnimationEngineContext = createContext<AnimationEngineContextValue | null>(null);

export function useAnimationEngine() {
  const context = useContext(AnimationEngineContext);
  if (!context) {
    throw new Error('useAnimationEngine must be used within an AnimationEngineProvider');
  }
  return context;
}

interface AnimationEngineProviderProps {
  children: React.ReactNode;
  enablePerformanceMonitoring?: boolean;
  targetFps?: number;
}

export function AnimationEngineProvider({ 
  children, 
  enablePerformanceMonitoring = true,
  targetFps = 60 
}: AnimationEngineProviderProps) {
  const stateRef = useRef<AnimationEngineState>({
    nodes: new Map(),
    performanceMetrics: {
      frameTime: 0,
      droppedFrames: 0,
      animationCount: 0,
      averageFrameTime: 16.67 // Target 60fps
    },
    isPerformanceMonitoringEnabled: enablePerformanceMonitoring,
    frameCounter: 0,
    lastFrameTimestamp: 0
  });

  const animationFrameRef = useRef<number>();

  // Performance monitoring loop
  const performanceMonitoringLoop = useCallback(() => {
    const now = performance.now();
    const state = stateRef.current;
    
    if (state.lastFrameTimestamp > 0) {
      const frameTime = now - state.lastFrameTimestamp;
      const targetFrameTime = 1000 / targetFps;
      
      // Update metrics
      state.performanceMetrics.frameTime = frameTime;
      state.performanceMetrics.averageFrameTime = 
        (state.performanceMetrics.averageFrameTime * 0.9) + (frameTime * 0.1);
      
      if (frameTime > targetFrameTime * 1.5) {
        state.performanceMetrics.droppedFrames++;
      }
      
      // Log performance warnings
      if (enablePerformanceMonitoring && frameTime > targetFrameTime * 2) {
        console.warn(`[AnimationEngine] Frame took ${frameTime.toFixed(2)}ms (target: ${targetFrameTime.toFixed(2)}ms)`);
      }
    }
    
    state.lastFrameTimestamp = now;
    state.frameCounter++;
    
    if (state.isPerformanceMonitoringEnabled) {
      animationFrameRef.current = requestAnimationFrame(performanceMonitoringLoop);
    }
  }, [targetFps, enablePerformanceMonitoring]);

  // Start performance monitoring
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      animationFrameRef.current = requestAnimationFrame(performanceMonitoringLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enablePerformanceMonitoring, performanceMonitoringLoop]);

  const registerNode = useCallback((id: string, element: HTMLElement): AnimationNode => {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useMotionValue(1);
    const rotate = useMotionValue(0);

    const node: AnimationNode = {
      id,
      element,
      controls,
      motionValues: { x, y, scale, rotate },
      lastFrameTime: 0,
      isAnimating: false
    };

    stateRef.current.nodes.set(id, node);
    return node;
  }, []);

  const unregisterNode = useCallback((id: string) => {
    stateRef.current.nodes.delete(id);
  }, []);

  const getNode = useCallback((id: string) => {
    return stateRef.current.nodes.get(id);
  }, []);

  const animateNode = useCallback(async (id: string, animation: any, transition?: Transition) => {
    const node = stateRef.current.nodes.get(id);
    if (!node) return;

    node.isAnimating = true;
    stateRef.current.performanceMetrics.animationCount++;

    try {
      await node.controls.start({
        ...animation,
        transition: transition || PHYSICS_PRESETS.dragFeedback
      });
    } finally {
      node.isAnimating = false;
    }
  }, []);

  const animateBatch = useCallback(async (nodeIds: string[], animation: any, transition?: Transition) => {
    const promises = nodeIds.map(id => animateNode(id, animation, transition));
    await Promise.all(promises);
  }, [animateNode]);

  const createPhysicsSpring = useCallback((stiffness: number, damping: number, mass = 1): Transition => ({
    type: "spring" as const,
    stiffness,
    damping,
    mass
  }), []);

  const createGestureConfig = useCallback((type: 'drag' | 'multiTouch' | 'longPress') => {
    return GESTURE_PRESETS[type];
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return { ...stateRef.current.performanceMetrics };
  }, []);

  const enablePerformanceMonitoringCallback = useCallback((enabled: boolean) => {
    stateRef.current.isPerformanceMonitoringEnabled = enabled;
    
    if (enabled && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(performanceMonitoringLoop);
    } else if (!enabled && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, [performanceMonitoringLoop]);

  const contextValue: AnimationEngineContextValue = {
    registerNode,
    unregisterNode,
    getNode,
    animateNode,
    animateBatch,
    createPhysicsSpring,
    createGestureConfig,
    getPerformanceMetrics,
    enablePerformanceMonitoring: enablePerformanceMonitoringCallback
  };

  return (
    <AnimationEngineContext.Provider value={contextValue}>
      {children}
      
      {/* Performance Monitor (Development only) */}
      {process.env.NODE_ENV === 'development' && enablePerformanceMonitoring && (
        <PerformanceMonitor />
      )}
    </AnimationEngineContext.Provider>
  );
}

// Performance monitoring component for development
function PerformanceMonitor() {
  const { getPerformanceMetrics } = useAnimationEngine();
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    frameTime: 0,
    droppedFrames: 0,
    animationCount: 0,
    averageFrameTime: 16.67
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [getPerformanceMetrics]);

  const fps = Math.round(1000 / metrics.averageFrameTime);
  const isPerformanceGood = fps >= 55;

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="space-y-1">
        <div className={`flex items-center gap-2 ${isPerformanceGood ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isPerformanceGood ? 'bg-green-400' : 'bg-red-400'}`} />
          {fps} FPS
        </div>
        <div>Frame: {metrics.frameTime.toFixed(1)}ms</div>
        <div>Dropped: {metrics.droppedFrames}</div>
        <div>Animations: {metrics.animationCount}</div>
      </div>
    </motion.div>
  );
}

// Hook for easy access to common animation patterns
export function useSceneCardAnimations(id: string) {
  const { animateNode, createPhysicsSpring } = useAnimationEngine();

  const animateToIdle = useCallback(() => {
    return animateNode(id, ANIMATION_VARIANTS.sceneCard.idle);
  }, [id, animateNode]);

  const animateToHover = useCallback(() => {
    return animateNode(id, ANIMATION_VARIANTS.sceneCard.hover);
  }, [id, animateNode]);

  const animateToDragging = useCallback(() => {
    return animateNode(id, ANIMATION_VARIANTS.sceneCard.dragging);
  }, [id, animateNode]);

  const animateToSelected = useCallback(() => {
    return animateNode(id, ANIMATION_VARIANTS.sceneCard.selected);
  }, [id, animateNode]);

  return {
    animateToIdle,
    animateToHover,
    animateToDragging,
    animateToSelected
  };
}

// Hook for drop zone animations
export function useDropZoneAnimations(id: string) {
  const { animateNode } = useAnimationEngine();

  const animateToInactive = useCallback(() => {
    return animateNode(id, ANIMATION_VARIANTS.dropZone.inactive);
  }, [id, animateNode]);

  const animateToActive = useCallback(() => {
    return animateNode(id, ANIMATION_VARIANTS.dropZone.active);
  }, [id, animateNode]);

  const animateToInvalid = useCallback(() => {
    return animateNode(id, ANIMATION_VARIANTS.dropZone.invalid);
  }, [id, animateNode]);

  return {
    animateToInactive,
    animateToActive,
    animateToInvalid
  };
}

export default AnimationEngineProvider;