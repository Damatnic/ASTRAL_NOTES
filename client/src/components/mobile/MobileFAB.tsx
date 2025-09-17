/**
 * MobileFAB Component
 * Floating Action Button with expandable quick actions for mobile interfaces
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Plus, Mic, MicOff, X } from 'lucide-react';

export interface QuickAction {
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
  color?: string;
}

export interface MobileFABProps {
  onMainAction?: () => void;
  onVoiceToggle?: () => void;
  isVoiceActive?: boolean;
  quickActions?: QuickAction[];
  className?: string;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
  onMainAction,
  onVoiceToggle,
  isVoiceActive = false,
  quickActions = [],
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = () => {
    if (quickActions.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      onMainAction?.();
    }
  };

  const handleActionClick = (action: QuickAction) => {
    action.action();
    setIsExpanded(false);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Quick Actions */}
      <AnimatePresence>
        {isExpanded && quickActions.length > 0 && (
          <motion.div
            className="absolute bottom-16 right-0 space-y-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="bg-background/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg text-sm font-medium">
                    {action.label}
                  </div>
                  <Button
                    size="lg"
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg",
                      action.color || "bg-secondary hover:bg-secondary/90"
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Button */}
      {onVoiceToggle && (
        <motion.div
          className="absolute -top-16 right-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            size="lg"
            onClick={onVoiceToggle}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg",
              isVoiceActive 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            )}
          >
            {isVoiceActive ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        </motion.div>
      )}

      {/* Main FAB */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <Button
          size="lg"
          onClick={handleMainClick}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
};

export default MobileFAB;