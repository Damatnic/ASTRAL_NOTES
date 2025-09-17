/**
 * useDeviceOrientation Hook
 * Detects and manages device orientation changes for responsive layouts
 */

import { useState, useEffect } from 'react';

export interface DeviceOrientation {
  orientation: 'portrait' | 'landscape';
  angle: number;
  width: number;
  height: number;
  aspectRatio: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const useDeviceOrientation = (): DeviceOrientation => {
  const [orientation, setOrientation] = useState<DeviceOrientation>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      orientation: width > height ? 'landscape' : 'portrait',
      angle: screen.orientation?.angle || 0,
      width,
      height,
      aspectRatio: width / height,
      deviceType: getDeviceType(width, height)
    };
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const angle = screen.orientation?.angle || 0;
      
      setOrientation({
        orientation: width > height ? 'landscape' : 'portrait',
        angle,
        width,
        height,
        aspectRatio: width / height,
        deviceType: getDeviceType(width, height)
      });
    };

    const handleResize = () => {
      // Debounce resize events
      setTimeout(handleOrientationChange, 100);
    };

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    // Listen for screen orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  return orientation;
};

function getDeviceType(width: number, height: number): 'mobile' | 'tablet' | 'desktop' {
  const maxDimension = Math.max(width, height);
  const minDimension = Math.min(width, height);
  
  // Mobile: typically < 768px width
  if (maxDimension < 768) {
    return 'mobile';
  }
  
  // Tablet: 768px - 1024px or specific aspect ratios
  if (maxDimension <= 1024 || (minDimension >= 768 && maxDimension <= 1366)) {
    return 'tablet';
  }
  
  // Desktop: anything larger
  return 'desktop';
}

export default useDeviceOrientation;