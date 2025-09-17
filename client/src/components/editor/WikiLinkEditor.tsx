/**
 * Wiki Link Editor Component
 * Provides wiki-style linking with [[syntax]] and auto-completion
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Link2, 
  Search, 
  AlertTriangle, 
  Plus, 
  Hash,
  User,
  MapPin,
  Package,
  Zap,
  BookOpen,
  MessageSquare,
  Scale
} from 'lucide-react';
import {
  parseWikiLinks,
  autoCompleteWikiLink,
  insertWikiLink,
  completeWikiLink,
  findBrokenLinks,
  createLinkSuggestions,
  renderWikiLinks,
  type LinkTarget,
  type ParsedWikiLink
} from '@/utils/wikiLinking';

interface WikiLinkEditorProps {
  content: string;
  onChange: (content: string) => void;
  availableTargets: LinkTarget[];
  onCreateTarget?: (title: string, type: string) => void;
  className?: string;
  placeholder?: string;
  readonly?: boolean;
}

const TYPE_ICONS = {
  note: BookOpen,
  character: User,
  location: MapPin,
  item: Package,
  plotthread: Zap,
  scene: MessageSquare,
  worldrule: Scale
};

const TYPE_COLORS = {
  note: 'bg-gray-100 text-gray-700',
  character: 'bg-blue-100 text-blue-700',
  location: 'bg-green-100 text-green-700',
  item: 'bg-red-100 text-red-700',
  plotthread: 'bg-purple-100 text-purple-700',
  scene: 'bg-yellow-100 text-yellow-700',
  worldrule: 'bg-indigo-100 text-indigo-700'
};

export function WikiLinkEditor({
  content,
  onChange,
  availableTargets,
  onCreateTarget,
  className,
  placeholder = "Start typing... Use [[text]] for wiki links",
  readonly = false
}: WikiLinkEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkTarget[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [linkContext, setLinkContext] = useState<{
    isInLink: boolean;
    linkStart: number;
    linkEnd: number;
    query: string;
  } | null>(null);
  const [showLinkInfo, setShowLinkInfo] = useState(false);

  // Parse current links and check for broken ones
  const currentLinks = parseWikiLinks(content);
  const brokenLinks = findBrokenLinks(content, availableTargets);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newContent);
    
    // Check for wiki link auto-completion
    const autoComplete = autoCompleteWikiLink(newContent, cursorPosition, availableTargets);
    
    if (autoComplete) {
      setLinkContext(autoComplete);
      setSuggestions(autoComplete.suggestions);
      setSelectedSuggestion(0);
      setShowSuggestions(autoComplete.suggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setLinkContext(null);
    }
  }, [onChange, availableTargets]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          selectSuggestion(suggestions[selectedSuggestion]);
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    }

    // Handle wiki link shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        insertWikiLinkAtCursor();
      }
    }
  }, [showSuggestions, suggestions, selectedSuggestion]);

  const selectSuggestion = useCallback((target: LinkTarget) => {
    if (!linkContext || !textareaRef.current) return;
    
    const newContent = completeWikiLink(
      content,
      linkContext.linkStart,
      linkContext.linkEnd,
      target
    );
    
    onChange(newContent);
    setShowSuggestions(false);
    setLinkContext(null);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [content, linkContext, onChange]);

  const insertWikiLinkAtCursor = useCallback(() => {
    if (!textareaRef.current) return;
    
    const cursorPosition = textareaRef.current.selectionStart;
    const selectedText = textareaRef.current.value.slice(
      textareaRef.current.selectionStart,
      textareaRef.current.selectionEnd
    );
    
    let linkText = '[[]]';
    let newCursorPosition = cursorPosition + 2;
    
    if (selectedText) {
      linkText = `[[${selectedText}]]`;
      newCursorPosition = cursorPosition + linkText.length;
    }
    
    const newContent = content.slice(0, cursorPosition) + linkText + content.slice(cursorPosition);
    onChange(newContent);
    
    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
  }, [content, onChange]);

  const createNewTarget = useCallback((title: string, type: string) => {
    if (onCreateTarget) {
      onCreateTarget(title, type);
      setShowSuggestions(false);
    }
  }, [onCreateTarget]);

  // Render preview with highlighted links
  const renderPreview = useCallback(() => {
    return renderWikiLinks(content, (targetTitle) => {
      return availableTargets.find(t => 
        t.title.toLowerCase() === targetTitle.toLowerCase()
      ) || null;
    }, {
      className: 'wiki-link-preview',
      highlightBroken: true
    });
  }, [content, availableTargets]);

  const getTypeIcon = (type: string) => {
    const IconComponent = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || BookOpen;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className={cn("wiki-link-editor", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg border-b">
        <Button
          size="sm"
          variant="ghost"
          onClick={insertWikiLinkAtCursor}
          disabled={readonly}
          title="Insert Wiki Link (Ctrl+K)"
        >
          <Link2 className="h-4 w-4 mr-1" />
          Link
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowLinkInfo(!showLinkInfo)}
          title="Show Link Information"
        >
          <Hash className="h-4 w-4 mr-1" />
          Links ({currentLinks.length})
        </Button>
        
        {brokenLinks.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {brokenLinks.length} broken
          </Badge>
        )}
      </div>

      {/* Link Information Panel */}
      {showLinkInfo && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Current Links</h4>
            
            {currentLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No links in this content</p>
            ) : (
              <div className="space-y-2">
                {currentLinks.map((link, index) => {
                  const target = availableTargets.find(t => 
                    t.title.toLowerCase() === link.targetTitle.toLowerCase()
                  );
                  const isBroken = !target;
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded",
                        isBroken ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"
                      )}
                    >
                      {target ? (
                        <>
                          {getTypeIcon(target.type)}
                          <span className="font-medium">{link.displayText}</span>
                          <Badge className={TYPE_COLORS[target.type as keyof typeof TYPE_COLORS]}>
                            {target.type}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-700 dark:text-red-300">
                            {link.displayText}
                          </span>
                          <Badge variant="destructive">broken</Badge>
                          {onCreateTarget && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => createNewTarget(link.targetTitle, 'note')}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Create
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full min-h-[200px] p-4 border rounded-b-lg resize-y",
            "focus:outline-none focus:ring-2 focus:ring-cosmic-500",
            "font-mono text-sm leading-relaxed",
            "bg-background text-foreground",
            readonly && "bg-gray-50 cursor-not-allowed"
          )}
          readOnly={readonly}
        />

        {/* Auto-completion Suggestions */}
        {showSuggestions && suggestions.length > 0 && linkContext && (
          <Card className="absolute z-50 mt-1 w-80 max-h-60 overflow-y-auto shadow-lg">
            <CardContent className="p-0">
              <div className="p-2 border-b bg-muted">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  Suggestions for "{linkContext.query}"
                </div>
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {suggestions.map((target, index) => (
                  <button
                    key={target.id}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted flex items-center gap-3",
                      index === selectedSuggestion && "bg-cosmic-50 dark:bg-cosmic-950"
                    )}
                    onClick={() => selectSuggestion(target)}
                  >
                    {getTypeIcon(target.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{target.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {target.type} • {target.projectId}
                      </div>
                    </div>
                    <Badge className={TYPE_COLORS[target.type as keyof typeof TYPE_COLORS]}>
                      {target.type}
                    </Badge>
                  </button>
                ))}
              </div>

              {/* Create new option */}
              {onCreateTarget && linkContext.query.trim() && (
                <div className="border-t p-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNewTarget(linkContext.query, 'note')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create "{linkContext.query}"
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground mt-2 px-2">
        Use [[Target]] for links, [[Target|Alias]] for custom text, Ctrl+K to insert link
      </div>

      {/* CSS for wiki link styling */}
      <style jsx>{`
        :global(.wiki-link-preview .wiki-link-valid) {
          color: #3B82F6;
          text-decoration: underline;
          cursor: pointer;
        }
        
        :global(.wiki-link-preview .wiki-link-broken) {
          color: #EF4444;
          background-color: #FEF2F2;
          padding: 1px 3px;
          border-radius: 3px;
          text-decoration: line-through;
        }
        
        :global(.dark .wiki-link-preview .wiki-link-broken) {
          background-color: #450A0A;
        }
      `}</style>
    </div>
  );
}

export default WikiLinkEditor;