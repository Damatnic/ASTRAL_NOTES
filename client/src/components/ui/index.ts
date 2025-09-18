/**
 * Enhanced UI Component Library - Index
 * Astral Notes Design System
 */

// Core Components
export { Button, buttonVariants, type ButtonProps } from './Button';
export { Input, type InputProps } from './Input';
export { Textarea, type TextareaProps } from './Textarea';
export { Switch, type SwitchProps } from './Switch';
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
export { Badge, type BadgeProps } from './Badge';
export { Progress, type ProgressProps } from './Progress';
export { Avatar } from './Avatar';
export { Slider } from './Slider';

// Advanced Components
export { Modal, ConfirmModal } from './Modal';
export { Dropdown, type DropdownOption } from './Dropdown';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
export { Tabs, SimpleTabs, SimpleTab, ShadcnTabs, TabsList, TabsTrigger, TabsContent, type TabItem } from './Tabs';
export { TextEditor } from './TextEditor';
export { ToastProvider, useToast, toast, type Toast, type ToastAction } from './Toast';

// Component Categories for Design System Documentation
export const ComponentCategories = {
  core: ['Button', 'Input', 'Card'],
  navigation: ['Tabs'],
  overlays: ['Modal', 'Toast'],
  forms: ['Dropdown', 'Input'],
  editors: ['TextEditor'],
  feedback: ['Toast'],
} as const;

// Theme Variants Available Across Components
export const ThemeVariants = {
  default: 'Clean, minimal design with subtle borders',
  cosmic: 'Vibrant gradients with violet and indigo colors',
  astral: 'Dark cosmic theme with purple accents and deep backgrounds',
} as const;

// Size Options Available Across Components
export const SizeOptions = {
  xs: 'Extra small - compact for dense layouts',
  sm: 'Small - reduced padding and text size',
  md: 'Medium - default balanced size',
  lg: 'Large - increased padding and prominence',
  xl: 'Extra large - maximum visual impact',
} as const;