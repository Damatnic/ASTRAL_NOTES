/**
 * Slider Component
 * A range input component for numeric values
 */

import React, { useCallback } from 'react';
import { cn } from '@/utils/cn';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className
}: SliderProps) {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    onValueChange([newValue]);
  }, [onValueChange]);

  const percentage = ((value[0] - min) / (max - min)) * 100;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:ring-opacity-50",
            disabled && "opacity-50 cursor-not-allowed",
            // Custom thumb styles
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cosmic-600",
            "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md",
            "[&::-webkit-slider-thumb]:hover:bg-cosmic-700 [&::-webkit-slider-thumb]:transition-colors",
            // Firefox styles
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-cosmic-600 [&::-moz-range-thumb]:cursor-pointer",
            "[&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-md",
            "[&::-moz-range-track]:bg-gray-200 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:h-2"
          )}
        />
        {/* Progress fill */}
        <div
          className="absolute top-0 h-2 bg-cosmic-600 rounded-lg pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default Slider;