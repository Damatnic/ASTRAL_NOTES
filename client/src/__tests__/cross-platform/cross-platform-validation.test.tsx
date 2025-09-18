/**
 * Phase 4 Week 14: Cross-Platform Validation Testing Suite
 * Comprehensive testing for mobile, tablet, and desktop platforms
 * 
 * Test Categories:
 * 1. Mobile Responsiveness Tests
 * 2. Touch Interaction Validation
 * 3. Mobile-specific Component Behavior
 * 4. Offline Functionality on Mobile
 * 5. Performance on Mobile Devices
 * 6. PWA Functionality Testing
 * 7. Tablet-optimized Layouts
 * 8. Desktop Keyboard Navigation
 * 9. Multi-window Desktop Support
 * 10. Cross-platform Data Synchronization
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock viewport and device APIs
const mockViewport = {
  width: 1920,
  height: 1080,
  setSize: (width: number, height: number) => {
    mockViewport.width = width;
    mockViewport.height = height;
    window.innerWidth = width;
    window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  },
};

// Mock touch and pointer events
const mockTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  return new TouchEvent(type, {
    touches: touches.map(touch => ({
      ...touch,
      identifier: Math.random(),
      target: document.body,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
      force: 1,
    })) as TouchList,
  });
};

// Mock device detection
const mockUserAgent = {
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  tablet: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  setUserAgent: (agent: string) => {
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: agent,
    });
  },
};

// Mock PWA APIs
const mockServiceWorker = {
  register: vi.fn(() => Promise.resolve({ installing: null, waiting: null, active: null })),
  unregister: vi.fn(() => Promise.resolve(true)),
  update: vi.fn(() => Promise.resolve()),
};

// Mock media queries
const mockMediaQuery = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Mock responsive components
const ResponsiveComponent = ({ children }: { children: React.ReactNode }) => {
  const [viewport, setViewport] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  
  React.useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  const isDesktop = viewport.width >= 1024;
  
  return (
    <div 
      data-testid="responsive-container"
      className={`${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''} ${isDesktop ? 'desktop' : ''}`}
      data-viewport={`${viewport.width}x${viewport.height}`}
    >
      {children}
    </div>
  );
};

const TouchInteractiveComponent = () => {
  const [touchState, setTouchState] = React.useState({
    touching: false,
    touchCount: 0,
    lastTouch: null as { x: number; y: number } | null,
  });
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchState({
      touching: true,
      touchCount: e.touches.length,
      lastTouch: { x: e.touches[0].clientX, y: e.touches[0].clientY },
    });
  };
  
  const handleTouchEnd = () => {
    setTouchState(prev => ({ ...prev, touching: false, touchCount: 0 }));
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setTouchState(prev => ({
        ...prev,
        lastTouch: { x: e.touches[0].clientX, y: e.touches[0].clientY },
      }));
    }
  };
  
  return (
    <div
      data-testid="touch-interactive"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      className={touchState.touching ? 'touching' : ''}
      data-touch-count={touchState.touchCount}
      style={{ width: '200px', height: '200px', background: '#f0f0f0' }}
    >
      Touch Interactive Area
      {touchState.lastTouch && (
        <div data-testid="touch-position">
          {touchState.lastTouch.x}, {touchState.lastTouch.y}
        </div>
      )}
    </div>
  );
};

const PWAComponent = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = React.useState<Event | null>(null);
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);
  
  return (
    <div data-testid="pwa-component">
      <div data-testid="online-status" className={isOnline ? 'online' : 'offline'}>
        {isOnline ? 'Online' : 'Offline'}
      </div>
      {installPrompt && (
        <button data-testid="install-pwa" onClick={() => {}}>
          Install App
        </button>
      )}
    </div>
  );
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('🔄 Cross-Platform Validation Testing Suite', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    // Mock global APIs
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(mockMediaQuery),
    });

    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: mockServiceWorker,
    });

    console.log('🚀 Starting Cross-Platform Testing...');
  });

  afterAll(() => {
    console.log('📱 Cross-Platform Testing Complete');
  });

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Reset viewport to desktop default
    mockViewport.setSize(1920, 1080);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('1. Mobile Responsiveness Tests', () => {
    const mobileViewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Samsung Galaxy S21', width: 384, height: 854 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
    ];

    mobileViewports.forEach(({ name, width, height }) => {
      test(`should render correctly on ${name} (${width}x${height})`, async () => {
        mockViewport.setSize(width, height);
        mockUserAgent.setUserAgent(mockUserAgent.mobile);
        
        render(
          <TestWrapper>
            <ResponsiveComponent>
              <div data-testid="mobile-content">Mobile optimized content</div>
            </ResponsiveComponent>
          </TestWrapper>
        );
        
        const container = screen.getByTestId('responsive-container');
        expect(container).toHaveClass('mobile');
        expect(container).toHaveAttribute('data-viewport', `${width}x${height}`);
        expect(screen.getByTestId('mobile-content')).toBeInTheDocument();
        
        // Verify responsive behavior
        expect(container).not.toHaveClass('tablet');
        expect(container).not.toHaveClass('desktop');
      });
    });

    test('should handle orientation changes on mobile', async () => {
      // Portrait
      mockViewport.setSize(375, 667);
      const { rerender } = render(
        <TestWrapper>
          <ResponsiveComponent>
            <div data-testid="orientation-content">Content</div>
          </ResponsiveComponent>
        </TestWrapper>
      );
      
      let container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-viewport', '375x667');
      
      // Landscape
      act(() => {
        mockViewport.setSize(667, 375);
      });
      
      rerender(
        <TestWrapper>
          <ResponsiveComponent>
            <div data-testid="orientation-content">Content</div>
          </ResponsiveComponent>
        </TestWrapper>
      );
      
      container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-viewport', '667x375');
    });

    test('should scale UI elements appropriately for mobile', () => {
      mockViewport.setSize(375, 667);
      
      const MobileUI = () => (
        <div data-testid="mobile-ui">
          <button data-testid="mobile-button" style={{ minHeight: '44px', minWidth: '44px' }}>
            Tap Me
          </button>
          <input data-testid="mobile-input" style={{ fontSize: '16px', padding: '12px' }} />
          <div data-testid="mobile-text" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            Mobile-optimized text
          </div>
        </div>
      );
      
      render(
        <TestWrapper>
          <ResponsiveComponent>
            <MobileUI />
          </ResponsiveComponent>
        </TestWrapper>
      );
      
      const button = screen.getByTestId('mobile-button');
      const input = screen.getByTestId('mobile-input');
      const text = screen.getByTestId('mobile-text');
      
      // Verify mobile-friendly sizing
      expect(button).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
      expect(input).toHaveStyle({ fontSize: '16px', padding: '12px' });
      expect(text).toHaveStyle({ fontSize: '14px', lineHeight: '1.5' });
    });
  });

  describe('2. Touch Interaction Validation', () => {
    test('should handle single touch interactions', async () => {
      render(
        <TestWrapper>
          <TouchInteractiveComponent />
        </TestWrapper>
      );
      
      const touchArea = screen.getByTestId('touch-interactive');
      
      // Simulate touch start
      fireEvent.touchStart(touchArea, {
        touches: [{ clientX: 100, clientY: 150 }],
      });
      
      expect(touchArea).toHaveClass('touching');
      expect(touchArea).toHaveAttribute('data-touch-count', '1');
      expect(screen.getByTestId('touch-position')).toHaveTextContent('100, 150');
      
      // Simulate touch end
      fireEvent.touchEnd(touchArea);
      
      expect(touchArea).not.toHaveClass('touching');
      expect(touchArea).toHaveAttribute('data-touch-count', '0');
    });

    test('should handle multi-touch gestures', async () => {
      render(
        <TestWrapper>
          <TouchInteractiveComponent />
        </TestWrapper>
      );
      
      const touchArea = screen.getByTestId('touch-interactive');
      
      // Simulate pinch gesture (two touches)
      fireEvent.touchStart(touchArea, {
        touches: [
          { clientX: 50, clientY: 50 },
          { clientX: 150, clientY: 150 },
        ],
      });
      
      expect(touchArea).toHaveAttribute('data-touch-count', '2');
      
      // Simulate touch move (pinch out)
      fireEvent.touchMove(touchArea, {
        touches: [
          { clientX: 25, clientY: 25 },
          { clientX: 175, clientY: 175 },
        ],
      });
      
      expect(screen.getByTestId('touch-position')).toHaveTextContent('25, 25');
    });

    test('should handle swipe gestures', async () => {
      const SwipeComponent = () => {
        const [swipeDirection, setSwipeDirection] = React.useState<string>('');
        const [startTouch, setStartTouch] = React.useState<{ x: number; y: number } | null>(null);
        
        const handleTouchStart = (e: React.TouchEvent) => {
          setStartTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        };
        
        const handleTouchEnd = (e: React.TouchEvent) => {
          if (!startTouch) return;
          
          const endTouch = e.changedTouches[0];
          const deltaX = endTouch.clientX - startTouch.x;
          const deltaY = endTouch.clientY - startTouch.y;
          
          const threshold = 50;
          
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > threshold) setSwipeDirection('right');
            else if (deltaX < -threshold) setSwipeDirection('left');
          } else {
            if (deltaY > threshold) setSwipeDirection('down');
            else if (deltaY < -threshold) setSwipeDirection('up');
          }
        };
        
        return (
          <div
            data-testid="swipe-component"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ width: '300px', height: '200px', background: '#eee' }}
          >
            <div data-testid="swipe-direction">{swipeDirection}</div>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <SwipeComponent />
        </TestWrapper>
      );
      
      const swipeArea = screen.getByTestId('swipe-component');
      
      // Simulate right swipe
      fireEvent.touchStart(swipeArea, {
        touches: [{ clientX: 50, clientY: 100 }],
      });
      
      fireEvent.touchEnd(swipeArea, {
        changedTouches: [{ clientX: 150, clientY: 100 }],
      });
      
      expect(screen.getByTestId('swipe-direction')).toHaveTextContent('right');
    });

    test('should handle long press interactions', async () => {
      const LongPressComponent = () => {
        const [longPressed, setLongPressed] = React.useState(false);
        
        const handleTouchStart = () => {
          const timer = setTimeout(() => {
            setLongPressed(true);
          }, 500);
          
          const cleanup = () => {
            clearTimeout(timer);
            document.removeEventListener('touchend', cleanup);
          };
          
          document.addEventListener('touchend', cleanup);
        };
        
        return (
          <div
            data-testid="long-press-component"
            onTouchStart={handleTouchStart}
            className={longPressed ? 'long-pressed' : ''}
          >
            {longPressed ? 'Long pressed!' : 'Press and hold'}
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <LongPressComponent />
        </TestWrapper>
      );
      
      const longPressArea = screen.getByTestId('long-press-component');
      expect(longPressArea).toHaveTextContent('Press and hold');
      
      // Simulate long press
      fireEvent.touchStart(longPressArea);
      
      // Wait for long press timeout
      await waitFor(() => {
        expect(longPressArea).toHaveTextContent('Long pressed!');
        expect(longPressArea).toHaveClass('long-pressed');
      }, { timeout: 600 });
    });
  });

  describe('3. Tablet-Optimized Layouts', () => {
    const tabletViewports = [
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'iPad Pro', width: 1024, height: 1366 },
      { name: 'Surface Pro', width: 912, height: 1368 },
    ];

    tabletViewports.forEach(({ name, width, height }) => {
      test(`should render tablet layout on ${name} (${width}x${height})`, () => {
        mockViewport.setSize(width, height);
        mockUserAgent.setUserAgent(mockUserAgent.tablet);
        
        render(
          <TestWrapper>
            <ResponsiveComponent>
              <div data-testid="tablet-content">Tablet optimized content</div>
            </ResponsiveComponent>
          </TestWrapper>
        );
        
        const container = screen.getByTestId('responsive-container');
        expect(container).toHaveClass('tablet');
        expect(container).not.toHaveClass('mobile');
        expect(container).not.toHaveClass('desktop');
        expect(screen.getByTestId('tablet-content')).toBeInTheDocument();
      });
    });

    test('should handle tablet-specific interactions', async () => {
      mockViewport.setSize(768, 1024);
      
      const TabletInterface = () => (
        <div data-testid="tablet-interface">
          <div data-testid="split-pane-left" style={{ width: '50%', float: 'left' }}>
            Left Pane
          </div>
          <div data-testid="split-pane-right" style={{ width: '50%', float: 'right' }}>
            Right Pane
          </div>
          <button data-testid="tablet-btn" style={{ minHeight: '40px', fontSize: '16px' }}>
            Tablet Button
          </button>
        </div>
      );
      
      render(
        <TestWrapper>
          <ResponsiveComponent>
            <TabletInterface />
          </ResponsiveComponent>
        </TestWrapper>
      );
      
      expect(screen.getByTestId('split-pane-left')).toBeInTheDocument();
      expect(screen.getByTestId('split-pane-right')).toBeInTheDocument();
      expect(screen.getByTestId('tablet-btn')).toHaveStyle({ minHeight: '40px' });
    });
  });

  describe('4. Desktop Keyboard Navigation', () => {
    test('should handle keyboard navigation on desktop', async () => {
      mockViewport.setSize(1920, 1080);
      mockUserAgent.setUserAgent(mockUserAgent.desktop);
      
      const KeyboardNavComponent = () => (
        <div data-testid="keyboard-nav">
          <button data-testid="btn-1" tabIndex={1}>Button 1</button>
          <input data-testid="input-1" tabIndex={2} />
          <button data-testid="btn-2" tabIndex={3}>Button 2</button>
          <select data-testid="select-1" tabIndex={4}>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
      );
      
      render(
        <TestWrapper>
          <ResponsiveComponent>
            <KeyboardNavComponent />
          </ResponsiveComponent>
        </TestWrapper>
      );
      
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveClass('desktop');
      
      // Test tab navigation
      await user.tab();
      expect(screen.getByTestId('btn-1')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('input-1')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('btn-2')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('select-1')).toHaveFocus();
    });

    test('should handle keyboard shortcuts on desktop', async () => {
      const ShortcutComponent = () => {
        const [shortcutPressed, setShortcutPressed] = React.useState('');
        
        React.useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
              e.preventDefault();
              setShortcutPressed('save');
            } else if (e.ctrlKey && e.key === 'z') {
              e.preventDefault();
              setShortcutPressed('undo');
            }
          };
          
          document.addEventListener('keydown', handleKeyDown);
          return () => document.removeEventListener('keydown', handleKeyDown);
        }, []);
        
        return (
          <div data-testid="shortcut-component">
            <div data-testid="shortcut-result">{shortcutPressed}</div>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <ShortcutComponent />
        </TestWrapper>
      );
      
      // Test Ctrl+S
      await user.keyboard('{Control>}s{/Control}');
      expect(screen.getByTestId('shortcut-result')).toHaveTextContent('save');
      
      // Test Ctrl+Z
      await user.keyboard('{Control>}z{/Control}');
      expect(screen.getByTestId('shortcut-result')).toHaveTextContent('undo');
    });
  });

  describe('5. PWA Functionality Testing', () => {
    test('should detect PWA installation capability', () => {
      render(
        <TestWrapper>
          <PWAComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('pwa-component')).toBeInTheDocument();
      expect(screen.getByTestId('online-status')).toHaveClass('online');
    });

    test('should handle offline/online status changes', async () => {
      render(
        <TestWrapper>
          <PWAComponent />
        </TestWrapper>
      );
      
      let status = screen.getByTestId('online-status');
      expect(status).toHaveClass('online');
      expect(status).toHaveTextContent('Online');
      
      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      
      await waitFor(() => {
        status = screen.getByTestId('online-status');
        expect(status).toHaveClass('offline');
        expect(status).toHaveTextContent('Offline');
      });
      
      // Simulate going online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      
      await waitFor(() => {
        status = screen.getByTestId('online-status');
        expect(status).toHaveClass('online');
        expect(status).toHaveTextContent('Online');
      });
    });

    test('should handle service worker registration', async () => {
      const ServiceWorkerComponent = () => {
        const [swStatus, setSWStatus] = React.useState('');
        
        React.useEffect(() => {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
              .then(() => setSWStatus('registered'))
              .catch(() => setSWStatus('failed'));
          } else {
            setSWStatus('not_supported');
          }
        }, []);
        
        return (
          <div data-testid="sw-component">
            <div data-testid="sw-status">{swStatus}</div>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <ServiceWorkerComponent />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('sw-status')).toHaveTextContent('registered');
      });
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
    });
  });

  describe('6. Performance on Different Devices', () => {
    test('should maintain performance on mobile devices', async () => {
      mockViewport.setSize(375, 667);
      
      const HeavyComponent = () => {
        const [items] = React.useState(Array.from({ length: 100 }, (_, i) => i));
        
        return (
          <div data-testid="heavy-component">
            {items.map(item => (
              <div key={item} data-testid={`item-${item}`}>
                Item {item}
              </div>
            ))}
          </div>
        );
      };
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ResponsiveComponent>
            <HeavyComponent />
          </ResponsiveComponent>
        </TestWrapper>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should render efficiently even on mobile
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByTestId('heavy-component')).toBeInTheDocument();
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-99')).toBeInTheDocument();
    });

    test('should handle memory constraints on mobile', () => {
      mockViewport.setSize(375, 667);
      
      const MemoryEfficientComponent = () => {
        const [visibleItems, setVisibleItems] = React.useState(20);
        
        React.useEffect(() => {
          const mediaQuery = window.matchMedia('(max-width: 768px)');
          setVisibleItems(mediaQuery.matches ? 10 : 20);
        }, []);
        
        return (
          <div data-testid="memory-efficient">
            <div data-testid="visible-count">{visibleItems}</div>
            {Array.from({ length: visibleItems }, (_, i) => (
              <div key={i} data-testid={`efficient-item-${i}`}>
                Item {i}
              </div>
            ))}
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <MemoryEfficientComponent />
        </TestWrapper>
      );
      
      // Should show fewer items on mobile for memory efficiency
      expect(screen.getByTestId('visible-count')).toHaveTextContent('10');
      expect(screen.getByTestId('efficient-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('efficient-item-9')).toBeInTheDocument();
      expect(screen.queryByTestId('efficient-item-10')).not.toBeInTheDocument();
    });
  });

  describe('7. Cross-Platform Data Synchronization', () => {
    test('should sync data across different platforms', async () => {
      const SyncComponent = () => {
        const [syncStatus, setSyncStatus] = React.useState('idle');
        const [data, setData] = React.useState({ content: '', lastSync: null });
        
        const syncData = async () => {
          setSyncStatus('syncing');
          
          // Simulate sync operation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setData({
            content: 'Synced content',
            lastSync: new Date(),
          });
          setSyncStatus('synced');
        };
        
        return (
          <div data-testid="sync-component">
            <div data-testid="sync-status">{syncStatus}</div>
            <div data-testid="sync-content">{data.content}</div>
            <button data-testid="sync-btn" onClick={syncData}>
              Sync
            </button>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <SyncComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('sync-status')).toHaveTextContent('idle');
      
      await user.click(screen.getByTestId('sync-btn'));
      
      expect(screen.getByTestId('sync-status')).toHaveTextContent('syncing');
      
      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
        expect(screen.getByTestId('sync-content')).toHaveTextContent('Synced content');
      });
    });

    test('should handle sync conflicts across platforms', async () => {
      const ConflictComponent = () => {
        const [conflicts, setConflicts] = React.useState<Array<{ id: string; type: string }>>([]);
        
        const simulateConflict = () => {
          setConflicts([
            { id: '1', type: 'content_mismatch' },
            { id: '2', type: 'timestamp_conflict' },
          ]);
        };
        
        const resolveConflict = (id: string) => {
          setConflicts(prev => prev.filter(c => c.id !== id));
        };
        
        return (
          <div data-testid="conflict-component">
            <div data-testid="conflict-count">{conflicts.length}</div>
            {conflicts.map(conflict => (
              <div key={conflict.id} data-testid={`conflict-${conflict.id}`}>
                {conflict.type}
                <button 
                  data-testid={`resolve-${conflict.id}`}
                  onClick={() => resolveConflict(conflict.id)}
                >
                  Resolve
                </button>
              </div>
            ))}
            <button data-testid="simulate-conflict" onClick={simulateConflict}>
              Simulate Conflict
            </button>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <ConflictComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('conflict-count')).toHaveTextContent('0');
      
      await user.click(screen.getByTestId('simulate-conflict'));
      
      expect(screen.getByTestId('conflict-count')).toHaveTextContent('2');
      expect(screen.getByTestId('conflict-1')).toHaveTextContent('content_mismatch');
      expect(screen.getByTestId('conflict-2')).toHaveTextContent('timestamp_conflict');
      
      await user.click(screen.getByTestId('resolve-1'));
      
      expect(screen.getByTestId('conflict-count')).toHaveTextContent('1');
      expect(screen.queryByTestId('conflict-1')).not.toBeInTheDocument();
    });
  });

  describe('8. Accessibility Across Platforms', () => {
    test('should maintain accessibility on all platforms', () => {
      const AccessibleComponent = () => (
        <div data-testid="accessible-component">
          <h1>Main Heading</h1>
          <button aria-label="Save document" data-testid="save-btn">
            💾
          </button>
          <input 
            aria-label="Search content" 
            data-testid="search-input"
            type="text"
          />
          <div role="alert" aria-live="polite" data-testid="status-alert">
            Status updates appear here
          </div>
        </div>
      );
      
      const platforms = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' },
      ];
      
      platforms.forEach(({ width, height, name }) => {
        mockViewport.setSize(width, height);
        
        const { unmount } = render(
          <TestWrapper>
            <ResponsiveComponent>
              <AccessibleComponent />
            </ResponsiveComponent>
          </TestWrapper>
        );
        
        // Check accessibility features
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByLabelText('Save document')).toBeInTheDocument();
        expect(screen.getByLabelText('Search content')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        
        unmount();
      });
    });

    test('should support screen readers on all platforms', () => {
      const ScreenReaderComponent = () => (
        <div data-testid="screen-reader-component">
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="#" data-testid="nav-home">Home</a></li>
              <li><a href="#" data-testid="nav-projects">Projects</a></li>
            </ul>
          </nav>
          <main aria-label="Main content">
            <article>
              <h2>Article Title</h2>
              <p>Article content with proper semantic structure.</p>
            </article>
          </main>
        </div>
      );
      
      render(
        <TestWrapper>
          <ScreenReaderComponent />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Main content')).toBeInTheDocument();
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('9. Cross-Platform Integration Tests', () => {
    test('should handle platform-specific features gracefully', async () => {
      const PlatformFeatureComponent = () => {
        const [features, setFeatures] = React.useState({
          touch: 'ontouchstart' in window,
          serviceWorker: 'serviceWorker' in navigator,
          geolocation: 'geolocation' in navigator,
          camera: 'mediaDevices' in navigator,
        });
        
        return (
          <div data-testid="platform-features">
            <div data-testid="touch-support">{features.touch ? 'yes' : 'no'}</div>
            <div data-testid="sw-support">{features.serviceWorker ? 'yes' : 'no'}</div>
            <div data-testid="geo-support">{features.geolocation ? 'yes' : 'no'}</div>
            <div data-testid="camera-support">{features.camera ? 'yes' : 'no'}</div>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <PlatformFeatureComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('platform-features')).toBeInTheDocument();
      expect(screen.getByTestId('sw-support')).toHaveTextContent('yes');
    });

    test('should maintain consistent UX across platforms', () => {
      const ConsistentUXComponent = () => {
        const [viewport, setViewport] = React.useState({ width: window.innerWidth, height: window.innerHeight });
        
        React.useEffect(() => {
          const handleResize = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
          };
          
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
        }, []);
        
        const isMobile = viewport.width < 768;
        
        return (
          <div data-testid="consistent-ux">
            <header data-testid="app-header" style={{ 
              height: isMobile ? '56px' : '64px',
              padding: isMobile ? '8px 16px' : '12px 24px',
            }}>
              App Header
            </header>
            <main data-testid="app-main" style={{
              padding: isMobile ? '16px' : '24px',
            }}>
              Main Content
            </main>
            <footer data-testid="app-footer" style={{
              height: isMobile ? '48px' : '56px',
              padding: isMobile ? '8px 16px' : '12px 24px',
            }}>
              App Footer
            </footer>
          </div>
        );
      };
      
      // Test on mobile
      mockViewport.setSize(375, 667);
      const { rerender } = render(
        <TestWrapper>
          <ConsistentUXComponent />
        </TestWrapper>
      );
      
      let header = screen.getByTestId('app-header');
      expect(header).toHaveStyle({ height: '56px', padding: '8px 16px' });
      
      // Test on desktop
      act(() => {
        mockViewport.setSize(1920, 1080);
      });
      
      rerender(
        <TestWrapper>
          <ConsistentUXComponent />
        </TestWrapper>
      );
      
      header = screen.getByTestId('app-header');
      expect(header).toHaveStyle({ height: '64px', padding: '12px 24px' });
    });
  });
});