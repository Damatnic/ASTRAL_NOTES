/**
 * Editor Toolbar Component
 * Rich formatting toolbar for the advanced editor
 */

import React, { useState } from 'react';
import { Editor } from '@tiptap/core';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { 
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Settings,
  Save,
  Undo,
  Redo,
  Moon,
  Sun,
  Focus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  FileText,
  ChevronDown,
  Highlighter,
  Code2,
  Link2,
  Image,
  TableProperties,
  MoreHorizontal
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  onDistractionFreeToggle?: () => void;
  onFullscreenToggle?: () => void;
  onDarkModeToggle?: () => void;
  onSave?: () => void;
  isDistractionFree?: boolean;
  isFullscreen?: boolean;
  isDarkMode?: boolean;
  className?: string;
}

interface FormatGroup {
  label: string;
  items: ToolbarItem[];
}

interface ToolbarItem {
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
  isActive?: () => boolean;
  isDisabled?: () => boolean;
}

export function EditorToolbar({
  editor,
  onDistractionFreeToggle,
  onFullscreenToggle,
  onDarkModeToggle,
  onSave,
  isDistractionFree = false,
  isFullscreen = false,
  isDarkMode = false,
  className
}: EditorToolbarProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Text formatting tools
  const textFormatting: ToolbarItem[] = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
      isDisabled: () => !editor.can().chain().focus().toggleBold().run()
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
      isDisabled: () => !editor.can().chain().focus().toggleItalic().run()
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
      isDisabled: () => !editor.can().chain().focus().toggleUnderline().run()
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
      isDisabled: () => !editor.can().chain().focus().toggleStrike().run()
    },
    {
      icon: Code,
      label: 'Code',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
      isDisabled: () => !editor.can().chain().focus().toggleCode().run()
    },
    {
      icon: Highlighter,
      label: 'Highlight',
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: () => editor.isActive('highlight'),
      isDisabled: () => !editor.can().chain().focus().toggleHighlight().run()
    }
  ];

  // Paragraph formatting
  const paragraphFormatting: ToolbarItem[] = [
    {
      icon: AlignLeft,
      label: 'Align Left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: () => editor.isActive({ textAlign: 'left' })
    },
    {
      icon: AlignCenter,
      label: 'Align Center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: () => editor.isActive({ textAlign: 'center' })
    },
    {
      icon: AlignRight,
      label: 'Align Right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: () => editor.isActive({ textAlign: 'right' })
    },
    {
      icon: AlignJustify,
      label: 'Justify',
      action: () => editor.chain().focus().setTextAlign('justify').run(),
      isActive: () => editor.isActive({ textAlign: 'justify' })
    }
  ];

  // List formatting
  const listFormatting: ToolbarItem[] = [
    {
      icon: List,
      label: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList')
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList')
    },
    {
      icon: CheckSquare,
      label: 'Task List',
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: () => editor.isActive('taskList')
    }
  ];

  // Block formatting
  const blockFormatting: ToolbarItem[] = [
    {
      icon: Quote,
      label: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote')
    },
    {
      icon: Code2,
      label: 'Code Block',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock')
    },
    {
      icon: Minus,
      label: 'Horizontal Rule',
      action: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: () => false
    }
  ];

  // History controls
  const historyControls: ToolbarItem[] = [
    {
      icon: Undo,
      label: 'Undo',
      action: () => editor.chain().focus().undo().run(),
      isDisabled: () => !editor.can().chain().focus().undo().run()
    },
    {
      icon: Redo,
      label: 'Redo',
      action: () => editor.chain().focus().redo().run(),
      isDisabled: () => !editor.can().chain().focus().redo().run()
    }
  ];

  const handleHeadingSelect = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: level as any }).run();
    }
    setShowHeadingMenu(false);
  };

  const handleLinkAdd = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const handleLinkRemove = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkDialog(false);
  };

  const handleImageAdd = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleTableInsert = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const ToolbarButton: React.FC<{
    item: ToolbarItem;
    size?: 'sm' | 'md';
  }> = ({ item, size = 'sm' }) => {
    const Icon = item.icon;
    const isActive = item.isActive?.() || false;
    const isDisabled = item.isDisabled?.() || false;

    return (
      <Button
        size={size}
        variant={isActive ? 'default' : 'ghost'}
        onClick={item.action}
        disabled={isDisabled}
        className={cn(
          "p-2",
          isActive && "bg-cosmic-100 text-cosmic-700 dark:bg-cosmic-900 dark:text-cosmic-300"
        )}
        title={item.label}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  };

  return (
    <div className={cn("editor-toolbar sticky top-0 z-40 bg-background border-b", className)}>
      <div className="flex items-center justify-between p-2">
        {/* Left side - Formatting tools */}
        <div className="flex items-center gap-4">
          {/* History */}
          <div className="flex items-center gap-1">
            {historyControls.map((item, index) => (
              <ToolbarButton key={index} item={item} />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Headings Dropdown */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHeadingMenu(!showHeadingMenu)}
              className="flex items-center gap-1 px-3"
            >
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
            
            {showHeadingMenu && (
              <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-50">
                <button
                  onClick={() => handleHeadingSelect(0)}
                  className="block w-full px-4 py-2 text-left hover:bg-muted"
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Paragraph
                </button>
                <button
                  onClick={() => handleHeadingSelect(1)}
                  className="block w-full px-4 py-2 text-left hover:bg-muted"
                >
                  <Heading1 className="h-4 w-4 inline mr-2" />
                  Heading 1
                </button>
                <button
                  onClick={() => handleHeadingSelect(2)}
                  className="block w-full px-4 py-2 text-left hover:bg-muted"
                >
                  <Heading2 className="h-4 w-4 inline mr-2" />
                  Heading 2
                </button>
                <button
                  onClick={() => handleHeadingSelect(3)}
                  className="block w-full px-4 py-2 text-left hover:bg-muted"
                >
                  <Heading3 className="h-4 w-4 inline mr-2" />
                  Heading 3
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            {textFormatting.map((item, index) => (
              <ToolbarButton key={index} item={item} />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            {listFormatting.map((item, index) => (
              <ToolbarButton key={index} item={item} />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            {paragraphFormatting.map((item, index) => (
              <ToolbarButton key={index} item={item} />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Blocks */}
          <div className="flex items-center gap-1">
            {blockFormatting.map((item, index) => (
              <ToolbarButton key={index} item={item} />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Media & Links */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLinkDialog(true)}
              className={cn(
                "p-2",
                editor.isActive('link') && "bg-cosmic-100 text-cosmic-700"
              )}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleImageAdd}
              className="p-2"
              title="Add Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTableInsert}
              className="p-2"
              title="Insert Table"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right side - View controls */}
        <div className="flex items-center gap-2">
          {onSave && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          )}

          <div className="w-px h-6 bg-border" />

          {onDistractionFreeToggle && (
            <Button
              size="sm"
              variant={isDistractionFree ? 'default' : 'ghost'}
              onClick={onDistractionFreeToggle}
              title="Distraction-free Mode"
            >
              {isDistractionFree ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          )}

          {onFullscreenToggle && (
            <Button
              size="sm"
              variant={isFullscreen ? 'default' : 'ghost'}
              onClick={onFullscreenToggle}
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          )}

          {onDarkModeToggle && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDarkModeToggle}
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-4 bg-background border rounded-lg shadow-lg z-50">
          <div className="space-y-3">
            <h3 className="font-semibold">Add Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="w-full px-3 py-2 border rounded bg-background"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleLinkAdd}>
                Add Link
              </Button>
              <Button size="sm" variant="outline" onClick={handleLinkRemove}>
                Remove Link
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLinkDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorToolbar;