// Mobile Navigation Component
// Responsive navigation with gesture support and touch-friendly design

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BookOpenIcon,
  SearchIcon,
  FolderIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
  PlusIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  CloudIcon,
  WifiOffIcon,
  DownloadIcon,
  HelpCircleIcon,
  LogOutIcon
} from 'lucide-react';
import mobileService from '../../services/mobileService';
import offlineService from '../../services/offlineService';

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  currentProject?: any;
  recentProjects?: any[];
  user?: any;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
  action?: string;
  badge?: string | number;
  children?: NavItem[];
  disabled?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onToggle,
  onClose,
  currentProject,
  recentProjects = [],
  user
}) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, syncing: false });
  const [viewport, setViewport] = useState(mobileService.getViewport());
  const [dragProgress, setDragProgress] = useState(0);

  useEffect(() => {
    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync status
    const updateSyncStatus = () => {
      setSyncStatus({
        pending: offlineService.getSyncQueueSize(),
        syncing: false // You'd get this from a sync event
      });
    };

    offlineService.on('sync-queue-updated', updateSyncStatus);
    offlineService.on('sync-started', () => setSyncStatus(prev => ({ ...prev, syncing: true })));
    offlineService.on('sync-completed', () => setSyncStatus(prev => ({ ...prev, syncing: false })));

    // Viewport changes
    const unsubscribeViewport = mobileService.onViewportChange(setViewport);

    // Gesture handling
    const unsubscribeSwipe = mobileService.onGesture('swipe', (gesture) => {
      if (gesture.direction === 'left' && isOpen) {
        onClose();
      } else if (gesture.direction === 'right' && !isOpen && gesture.startPoint.x < 20) {
        onToggle();
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      offlineService.off('sync-queue-updated', updateSyncStatus);
      offlineService.off('sync-started', () => {});
      offlineService.off('sync-completed', () => {});
      unsubscribeViewport();
      unsubscribeSwipe();
    };
  }, [isOpen, onClose, onToggle]);

  const handleDrag = (event: any, info: PanInfo) => {
    const progress = Math.max(0, Math.min(1, info.offset.x / -200));
    setDragProgress(progress);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -100 || info.velocity.x < -500) {
      onClose();
    }
    setDragProgress(0);
  };

  const mainNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      href: '/dashboard'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderIcon,
      href: '/projects',
      badge: recentProjects.length
    },
    {
      id: 'search',
      label: 'Search',
      icon: SearchIcon,
      href: '/search'
    },
    {
      id: 'new',
      label: 'Create',
      icon: PlusIcon,
      children: [
        {
          id: 'new-project',
          label: 'New Project',
          icon: FolderIcon,
          action: 'create-project'
        },
        {
          id: 'new-story',
          label: 'New Story',
          icon: BookOpenIcon,
          action: 'create-story',
          disabled: !currentProject
        }
      ]
    }
  ];

  const accountNavItems: NavItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      href: '/profile'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      href: '/settings'
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircleIcon,
      href: '/help'
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: LogOutIcon,
      action: 'logout'
    }
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.action) {
      handleAction(item.action);
    }
    
    if (item.children) {
      setActiveSection(activeSection === item.id ? null : item.id);
    } else {
      onClose();
    }

    // Haptic feedback
    mobileService.vibrate([10]);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'create-project':
        window.dispatchEvent(new CustomEvent('astral-action', { detail: { type: 'create-project' } }));
        break;
      case 'create-story':
        window.dispatchEvent(new CustomEvent('astral-action', { detail: { type: 'create-story' } }));
        break;
      case 'logout':
        window.dispatchEvent(new CustomEvent('astral-action', { detail: { type: 'logout' } }));
        break;
    }
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isActive = item.href ? isActiveRoute(item.href) : false;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = activeSection === item.id;

    return (
      <div key={item.id}>
        {item.href ? (
          <Link
            to={item.href}
            onClick={() => handleItemClick(item)}
            className={`
              flex items-center justify-between p-4 transition-colors
              ${level > 0 ? 'pl-12 py-3' : ''}
              ${isActive 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
              }
              ${item.disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${level > 0 ? 'w-4 h-4' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </div>
            {hasChildren && (
              <ChevronRightIcon 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            )}
          </Link>
        ) : (
          <button
            onClick={() => handleItemClick(item)}
            className={`
              w-full flex items-center justify-between p-4 transition-colors text-left
              ${level > 0 ? 'pl-12 py-3' : ''}
              ${isActive 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
              }
              ${item.disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${level > 0 ? 'w-4 h-4' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </div>
            {hasChildren && (
              <ChevronRightIcon 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            )}
          </button>
        )}

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-gray-800"
            >
              {item.children!.map(child => renderNavItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {(isOpen || viewport.breakpoint !== 'mobile') && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            drag={viewport.breakpoint === 'mobile' ? 'x' : false}
            dragConstraints={{ left: -400, right: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className={`
              fixed top-0 left-0 h-full w-80 bg-gray-900 z-50 flex flex-col
              ${viewport.breakpoint !== 'mobile' ? 'relative w-64' : ''}
              shadow-xl border-r border-gray-700
            `}
            style={{
              transform: dragProgress > 0 ? `translateX(${-dragProgress * 100}%)` : undefined
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">ASTRAL_NOTES</h2>
                    <p className="text-purple-200 text-sm">
                      {user?.name || 'Creative Writer'}
                    </p>
                  </div>
                </div>
                
                {viewport.breakpoint === 'mobile' && (
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white p-2"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Connection Status */}
              <div className="mt-3 flex items-center gap-2">
                {isOnline ? (
                  <CloudIcon className="w-4 h-4 text-green-300" />
                ) : (
                  <WifiOffIcon className="w-4 h-4 text-orange-300" />
                )}
                <span className="text-sm text-purple-200">
                  {isOnline ? 'Online' : 'Offline'}
                  {syncStatus.pending > 0 && ` • ${syncStatus.pending} pending`}
                </span>
                {syncStatus.syncing && (
                  <div className="w-3 h-3 border border-purple-300 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Current Project */}
            {currentProject && (
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 font-medium truncate">
                      {currentProject.title}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {currentProject.stories?.length || 0} stories
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Main Navigation */}
              <div className="py-2">
                {mainNavItems.map(item => renderNavItem(item))}
              </div>

              {/* Recent Projects */}
              {recentProjects.length > 0 && (
                <div className="border-t border-gray-700">
                  <div className="p-4 pb-2">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                      Recent Projects
                    </h3>
                  </div>
                  <div className="pb-2">
                    {recentProjects.slice(0, 3).map(project => (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-4 py-3 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
                      >
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{project.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account Section */}
            <div className="border-t border-gray-700 bg-gray-800">
              {accountNavItems.map(item => renderNavItem(item))}
            </div>

            {/* Version & PWA Install */}
            <div className="p-4 border-t border-gray-700 bg-gray-900">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>v1.0.0</span>
                {mobileService.isPWAInstallable() && (
                  <button
                    onClick={() => mobileService.installPWA()}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                  >
                    <DownloadIcon className="w-3 h-3" />
                    Install App
                  </button>
                )}
              </div>
            </div>

            {/* Drag Handle for Mobile */}
            {viewport.breakpoint === 'mobile' && (
              <div className="absolute top-1/2 -right-3 w-6 h-12 bg-gray-700 rounded-r-lg flex items-center justify-center">
                <div className="w-1 h-6 bg-gray-500 rounded" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Button */}
      {viewport.breakpoint === 'mobile' && !isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={onToggle}
          className="fixed top-4 left-4 z-30 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg flex items-center justify-center"
        >
          <MenuIcon className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </>
  );
};