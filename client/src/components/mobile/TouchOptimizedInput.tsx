/**
 * TouchOptimizedInput Component
 * Enhanced input field designed for mobile touch interfaces
 * Features gesture recognition, haptic feedback, and adaptive sizing
 */

import React, { 
  forwardRef, 
  useState, 
  useRef, 
  useImperativeHandle, 
  useCallback, 
  useEffect 
} from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface TouchOptimizedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  spellCheck?: boolean;
  autoComplete?: string;
  className?: string;
  style?: React.CSSProperties;
  onSwipe?: (deltaY: number) => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}

export interface TouchOptimizedInputRef {
  focus: () => void;
  blur: () => void;
  getSelectionStart: () => number;
  getSelectionEnd: () => number;
  setSelection: (start: number, end: number) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  lastTapTime: number;
  tapCount: number;
}

const TouchOptimizedInput = forwardRef<TouchOptimizedInputRef, TouchOptimizedInputProps>(
  ({
    value,
    onChange,
    placeholder = '',
    multiline = false,
    autoFocus = false,
    spellCheck = true,
    autoComplete = 'off',
    className,
    style,
    onSwipe,
    onLongPress,
    onDoubleTap
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [touchState, setTouchState] = useState<TouchState | null>(null);
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);
    
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
    const longPressTimeoutRef = useRef<NodeJS.Timeout>();

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      getSelectionStart: () => inputRef.current?.selectionStart || 0,
      getSelectionEnd: () => inputRef.current?.selectionEnd || 0,
      setSelection: (start: number, end: number) => {
        if (inputRef.current) {
          inputRef.current.selectionStart = start;
          inputRef.current.selectionEnd = end;
        }
      }
    }), []);

    // Haptic feedback
    const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [50],
          heavy: [100]
        };
        navigator.vibrate(patterns[type]);
      }
    }, []);

    // Handle touch start
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0];
      const now = Date.now();
      
      const newTouchState: TouchState = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: now,
        lastTapTime: touchState?.lastTapTime || 0,
        tapCount: (touchState && now - touchState.lastTapTime < 500) ? touchState.tapCount + 1 : 1
      };
      
      setTouchState(newTouchState);
      
      // Setup long press detection
      longPressTimeoutRef.current = setTimeout(() => {
        hapticFeedback('medium');
        onLongPress?.();
      }, 500);
      
    }, [touchState, hapticFeedback, onLongPress]);

    // Handle touch move
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
      
    }, [touchState]);

    // Handle touch end
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      if (!touchState) return;
      
      // Clear long press timeout
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = Date.now() - touchState.startTime;
      
      // Detect swipe
      if (distance > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
        onSwipe?.(deltaY);
        hapticFeedback('light');
      }
      // Detect double tap
      else if (touchState.tapCount === 2 && distance < 10 && duration < 300) {
        onDoubleTap?.();
        hapticFeedback('medium');
      }
      // Single tap
      else if (distance < 10 && duration < 300) {
        hapticFeedback('light');
      }
      
      setTouchState(null);
    }, [touchState, onSwipe, onDoubleTap, hapticFeedback]);

    // Handle input changes
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      
      // Update selection state
      setSelectionStart(e.target.selectionStart || 0);
      setSelectionEnd(e.target.selectionEnd || 0);
    }, [onChange]);

    // Handle focus/blur
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      hapticFeedback('light');
    }, [hapticFeedback]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    // Auto-focus effect
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    // Handle key presses for mobile
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      // Add haptic feedback for certain keys
      if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
        hapticFeedback('light');
      }
    }, [hapticFeedback]);

    const commonProps = {
      ref: inputRef as any,
      value,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      placeholder,
      spellCheck,
      autoComplete,
      className: cn(
        'touch-optimized-input',
        'w-full bg-transparent border-none outline-none resize-none',
        'selection:bg-blue-200 selection:text-blue-900',
        isFocused && 'focus-visible',
        className
      ),
      style: {
        ...style,
        touchAction: 'manipulation', // Optimize for touch
        userSelect: 'text',
        WebkitUserSelect: 'text',
        WebkitTouchCallout: 'none'
      }
    };

    return (
      <motion.div
        className="relative w-full"
        whileTap={{ scale: 0.998 }}
        transition={{ duration: 0.1 }}
      >
        {multiline ? (
          <textarea
            {...commonProps}
            rows={10}
          />
        ) : (
          <input
            {...commonProps}
            type="text"
          />
        )}
        
        {/* Focus indicator */}
        {isFocused && (
          <motion.div
            className="absolute -inset-1 bg-blue-500/10 rounded-md pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
        
        {/* Selection helper (for mobile) */}
        {isFocused && selectionStart !== selectionEnd && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-background border rounded-md shadow-lg z-50">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  // Copy selected text
                  const selectedText = value.substring(selectionStart, selectionEnd);
                  navigator.clipboard?.writeText(selectedText);
                  hapticFeedback('medium');
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  // Cut selected text
                  const selectedText = value.substring(selectionStart, selectionEnd);
                  navigator.clipboard?.writeText(selectedText);
                  const newValue = value.substring(0, selectionStart) + value.substring(selectionEnd);
                  onChange(newValue);
                  hapticFeedback('medium');
                }}
                className="px-2 py-1 bg-orange-500 text-white rounded text-xs"
              >
                Cut
              </button>
              <button
                onClick={() => {
                  // Paste from clipboard
                  navigator.clipboard?.readText().then(text => {
                    const newValue = value.substring(0, selectionStart) + text + value.substring(selectionEnd);
                    onChange(newValue);
                    hapticFeedback('medium');
                  });
                }}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs"
              >
                Paste
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

TouchOptimizedInput.displayName = 'TouchOptimizedInput';

export default TouchOptimizedInput;