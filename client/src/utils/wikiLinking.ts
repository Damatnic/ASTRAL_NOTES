/**
 * Wiki-Style Linking System
 * Handles [[syntax]] linking with automatic backlink tracking
 */

import type { WikiLink, Backlink, Note, Character, Location, Item, PlotThread } from '@/types/story';

// Regular expressions for wiki link patterns
export const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;
export const WIKI_LINK_WITH_ALIAS_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface ParsedWikiLink {
  originalText: string;
  targetTitle: string;
  displayText: string;
  startIndex: number;
  endIndex: number;
}

export interface LinkTarget {
  id: string;
  title: string;
  type: 'note' | 'character' | 'location' | 'item' | 'plotthread' | 'scene';
  projectId: string;
  storyId?: string;
}

export interface LinkResolution {
  link: ParsedWikiLink;
  target?: LinkTarget;
  isValid: boolean;
  suggestions: LinkTarget[];
}

/**
 * Parse wiki links from text content
 */
export function parseWikiLinks(content: string): ParsedWikiLink[] {
  const links: ParsedWikiLink[] = [];
  let match;

  // Reset regex state
  WIKI_LINK_WITH_ALIAS_REGEX.lastIndex = 0;

  while ((match = WIKI_LINK_WITH_ALIAS_REGEX.exec(content)) !== null) {
    const [originalText, targetTitle, aliasText] = match;
    const displayText = aliasText || targetTitle;
    
    links.push({
      originalText,
      targetTitle: targetTitle.trim(),
      displayText: displayText.trim(),
      startIndex: match.index,
      endIndex: match.index + originalText.length
    });
  }

  return links;
}

/**
 * Extract all unique link targets from content
 */
export function extractLinkTargets(content: string): string[] {
  const links = parseWikiLinks(content);
  const targets = new Set(links.map(link => link.targetTitle.toLowerCase()));
  return Array.from(targets);
}

/**
 * Replace wiki links with HTML links
 */
export function renderWikiLinks(
  content: string, 
  linkResolver: (targetTitle: string) => LinkTarget | null,
  options: {
    className?: string;
    onLinkClick?: (target: LinkTarget) => void;
    highlightBroken?: boolean;
  } = {}
): string {
  const { className = 'wiki-link', highlightBroken = true } = options;
  
  return content.replace(WIKI_LINK_WITH_ALIAS_REGEX, (match, targetTitle, aliasText) => {
    const displayText = aliasText || targetTitle;
    const target = linkResolver(targetTitle.trim());
    
    if (target) {
      return `<a href="#" 
                class="${className} wiki-link-valid" 
                data-target-id="${target.id}" 
                data-target-type="${target.type}"
                data-target-title="${target.title}"
                title="Go to ${target.type}: ${target.title}">
                ${displayText}
              </a>`;
    } else {
      const brokenClass = highlightBroken ? ' wiki-link-broken' : '';
      return `<span class="${className}${brokenClass}" 
                     data-target-title="${targetTitle}"
                     title="Link target not found: ${targetTitle}">
                ${displayText}
              </span>`;
    }
  });
}

/**
 * Create link suggestions based on partial input
 */
export function createLinkSuggestions(
  query: string,
  availableTargets: LinkTarget[],
  limit: number = 10
): LinkTarget[] {
  const lowerQuery = query.toLowerCase();
  
  // Score each target based on relevance
  const scoredTargets = availableTargets.map(target => {
    const title = target.title.toLowerCase();
    let score = 0;
    
    // Exact match gets highest score
    if (title === lowerQuery) {
      score = 1000;
    }
    // Starts with query gets high score
    else if (title.startsWith(lowerQuery)) {
      score = 100 - query.length; // Shorter queries rank higher
    }
    // Contains query gets medium score
    else if (title.includes(lowerQuery)) {
      score = 50 - query.length;
    }
    // Fuzzy match gets low score
    else if (fuzzyMatch(title, lowerQuery)) {
      score = 10;
    }
    
    return { target, score };
  });
  
  // Filter and sort by score
  return scoredTargets
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.target);
}

/**
 * Simple fuzzy matching
 */
function fuzzyMatch(text: string, query: string): boolean {
  const textChars = text.split('');
  const queryChars = query.split('');
  let queryIndex = 0;
  
  for (const char of textChars) {
    if (queryIndex < queryChars.length && char === queryChars[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryChars.length;
}

/**
 * Resolve wiki links in content and return resolution info
 */
export function resolveWikiLinks(
  content: string,
  availableTargets: LinkTarget[]
): LinkResolution[] {
  const links = parseWikiLinks(content);
  const targetMap = new Map(
    availableTargets.map(target => [target.title.toLowerCase(), target])
  );
  
  return links.map(link => {
    const target = targetMap.get(link.targetTitle.toLowerCase());
    const suggestions = target ? [] : createLinkSuggestions(link.targetTitle, availableTargets, 5);
    
    return {
      link,
      target,
      isValid: !!target,
      suggestions
    };
  });
}

/**
 * Generate backlinks for a target
 */
export function generateBacklinks(
  targetId: string,
  targetTitle: string,
  allNotes: Note[]
): Backlink[] {
  const backlinks: Backlink[] = [];
  
  allNotes.forEach(note => {
    const links = parseWikiLinks(note.content);
    const matchingLinks = links.filter(link => 
      link.targetTitle.toLowerCase() === targetTitle.toLowerCase()
    );
    
    matchingLinks.forEach(link => {
      // Extract context around the link
      const contextStart = Math.max(0, link.startIndex - 50);
      const contextEnd = Math.min(note.content.length, link.endIndex + 50);
      const context = note.content.slice(contextStart, contextEnd).trim();
      
      backlinks.push({
        id: `${note.id}-${link.startIndex}`,
        sourceId: note.id,
        sourceTitle: note.title,
        sourceType: note.type,
        linkText: link.displayText,
        context
      });
    });
  });
  
  return backlinks;
}

/**
 * Update backlinks when content changes
 */
export function updateBacklinks(
  note: Note,
  oldContent: string,
  newContent: string,
  allTargets: LinkTarget[]
): {
  addedLinks: WikiLink[];
  removedLinks: WikiLink[];
  updatedNote: Note;
} {
  const oldLinks = parseWikiLinks(oldContent);
  const newLinks = parseWikiLinks(newContent);
  
  // Find added and removed links
  const oldLinkTitles = new Set(oldLinks.map(l => l.targetTitle.toLowerCase()));
  const newLinkTitles = new Set(newLinks.map(l => l.targetTitle.toLowerCase()));
  
  const addedLinkTitles = newLinks.filter(l => !oldLinkTitles.has(l.targetTitle.toLowerCase()));
  const removedLinkTitles = oldLinks.filter(l => !newLinkTitles.has(l.targetTitle.toLowerCase()));
  
  // Convert to WikiLink objects
  const targetMap = new Map(allTargets.map(t => [t.title.toLowerCase(), t]));
  
  const addedLinks: WikiLink[] = addedLinkTitles.map((link, index) => {
    const target = targetMap.get(link.targetTitle.toLowerCase());
    return {
      id: `${note.id}-${Date.now()}-${index}`,
      sourceId: note.id,
      sourceType: note.type as any,
      targetId: target?.id || '',
      targetType: target?.type as any || 'note',
      linkText: link.displayText,
      context: extractLinkContext(newContent, link),
      createdAt: new Date().toISOString()
    };
  });
  
  const removedLinks: WikiLink[] = removedLinkTitles.map((link, index) => {
    const target = targetMap.get(link.targetTitle.toLowerCase());
    return {
      id: `${note.id}-removed-${index}`,
      sourceId: note.id,
      sourceType: note.type as any,
      targetId: target?.id || '',
      targetType: target?.type as any || 'note',
      linkText: link.displayText,
      context: extractLinkContext(oldContent, link),
      createdAt: new Date().toISOString()
    };
  });
  
  // Update note's wiki links
  const updatedNote: Note = {
    ...note,
    content: newContent,
    wikiLinks: [...note.wikiLinks.filter(wl => 
      !removedLinks.some(rl => rl.targetId === wl.targetId)
    ), ...addedLinks],
    updatedAt: new Date().toISOString()
  };
  
  return {
    addedLinks,
    removedLinks,
    updatedNote
  };
}

/**
 * Extract context around a link
 */
function extractLinkContext(content: string, link: ParsedWikiLink, contextLength: number = 100): string {
  const start = Math.max(0, link.startIndex - contextLength);
  const end = Math.min(content.length, link.endIndex + contextLength);
  return content.slice(start, end).trim();
}

/**
 * Auto-complete wiki links as user types
 */
export function autoCompleteWikiLink(
  content: string,
  cursorPosition: number,
  availableTargets: LinkTarget[]
): {
  isInLink: boolean;
  linkStart: number;
  linkEnd: number;
  query: string;
  suggestions: LinkTarget[];
} | null {
  // Find if cursor is within [[ ]] brackets
  const beforeCursor = content.slice(0, cursorPosition);
  const afterCursor = content.slice(cursorPosition);
  
  const lastOpenBracket = beforeCursor.lastIndexOf('[[');
  const lastCloseBracket = beforeCursor.lastIndexOf(']]');
  
  // Check if we're inside wiki link brackets
  if (lastOpenBracket === -1 || (lastCloseBracket > lastOpenBracket)) {
    return null;
  }
  
  const nextCloseBracket = afterCursor.indexOf(']]');
  if (nextCloseBracket === -1) {
    return null;
  }
  
  const linkStart = lastOpenBracket;
  const linkEnd = cursorPosition + nextCloseBracket + 2;
  const linkContent = content.slice(lastOpenBracket + 2, cursorPosition);
  
  // Handle alias syntax [[target|alias]]
  const pipeIndex = linkContent.indexOf('|');
  const query = pipeIndex === -1 ? linkContent : linkContent.slice(0, pipeIndex);
  
  const suggestions = createLinkSuggestions(query, availableTargets);
  
  return {
    isInLink: true,
    linkStart,
    linkEnd,
    query: query.trim(),
    suggestions
  };
}

/**
 * Insert a wiki link at cursor position
 */
export function insertWikiLink(
  content: string,
  cursorPosition: number,
  target: LinkTarget,
  alias?: string
): {
  newContent: string;
  newCursorPosition: number;
} {
  const linkText = alias 
    ? `[[${target.title}|${alias}]]`
    : `[[${target.title}]]`;
  
  const before = content.slice(0, cursorPosition);
  const after = content.slice(cursorPosition);
  
  const newContent = before + linkText + after;
  const newCursorPosition = cursorPosition + linkText.length;
  
  return {
    newContent,
    newCursorPosition
  };
}

/**
 * Replace a partial wiki link with a complete one
 */
export function completeWikiLink(
  content: string,
  linkStart: number,
  linkEnd: number,
  target: LinkTarget,
  alias?: string
): string {
  const linkText = alias 
    ? `[[${target.title}|${alias}]]`
    : `[[${target.title}]]`;
  
  const before = content.slice(0, linkStart);
  const after = content.slice(linkEnd);
  
  return before + linkText + after;
}

/**
 * Find all broken links in content
 */
export function findBrokenLinks(
  content: string,
  availableTargets: LinkTarget[]
): ParsedWikiLink[] {
  const links = parseWikiLinks(content);
  const targetTitles = new Set(availableTargets.map(t => t.title.toLowerCase()));
  
  return links.filter(link => !targetTitles.has(link.targetTitle.toLowerCase()));
}

/**
 * Get link statistics for content
 */
export function getLinkStatistics(content: string): {
  totalLinks: number;
  uniqueTargets: number;
  linkDensity: number; // links per 100 words
} {
  const links = parseWikiLinks(content);
  const uniqueTargets = new Set(links.map(l => l.targetTitle.toLowerCase())).size;
  const wordCount = content.split(/\s+/).length;
  const linkDensity = wordCount > 0 ? (links.length / wordCount) * 100 : 0;
  
  return {
    totalLinks: links.length,
    uniqueTargets,
    linkDensity
  };
}

/**
 * Validate wiki link syntax
 */
export function validateWikiLinkSyntax(linkText: string): {
  isValid: boolean;
  error?: string;
  target?: string;
  alias?: string;
} {
  const match = linkText.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid wiki link syntax. Use [[Target]] or [[Target|Alias]]'
    };
  }
  
  const [, target, alias] = match;
  
  if (!target.trim()) {
    return {
      isValid: false,
      error: 'Link target cannot be empty'
    };
  }
  
  return {
    isValid: true,
    target: target.trim(),
    alias: alias?.trim()
  };
}