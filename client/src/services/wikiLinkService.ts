/**
 * Wiki Link Service
 * Manages wiki links, backlinks, and link resolution across the application
 */

import type { WikiLink, Backlink, Note, Character, Location, Item, PlotThread, Scene } from '@/types/story';
import type { LinkTarget } from '@/utils/wikiLinking';
import { 
  parseWikiLinks, 
  generateBacklinks, 
  updateBacklinks,
  findBrokenLinks,
  createLinkSuggestions 
} from '@/utils/wikiLinking';
import { storageService } from './storageService';

class WikiLinkService {
  private static instance: WikiLinkService;

  public static getInstance(): WikiLinkService {
    if (!WikiLinkService.instance) {
      WikiLinkService.instance = new WikiLinkService();
    }
    return WikiLinkService.instance;
  }

  /**
   * Get all available link targets for a project
   */
  public getAvailableLinkTargets(projectId: string): LinkTarget[] {
    const targets: LinkTarget[] = [];
    
    // Get all notes
    const notes = storageService.getProjectNotes(projectId);
    notes.forEach(note => {
      targets.push({
        id: note.id,
        title: note.title,
        type: 'note',
        projectId: note.projectId,
        storyId: note.storyId
      });
    });

    // Get characters (from storage or mock data for now)
    const characters = this.getProjectCharacters(projectId);
    characters.forEach(character => {
      targets.push({
        id: character.id,
        title: character.name,
        type: 'character',
        projectId: character.projectId
      });
    });

    // Get locations
    const locations = this.getProjectLocations(projectId);
    locations.forEach(location => {
      targets.push({
        id: location.id,
        title: location.name,
        type: 'location',
        projectId: location.projectId
      });
    });

    // Get items
    const items = this.getProjectItems(projectId);
    items.forEach(item => {
      targets.push({
        id: item.id,
        title: item.name,
        type: 'item',
        projectId: item.projectId
      });
    });

    // Get plot threads
    const plotThreads = this.getProjectPlotThreads(projectId);
    plotThreads.forEach(thread => {
      targets.push({
        id: thread.id,
        title: thread.name,
        type: 'plotthread',
        projectId: thread.projectId
      });
    });

    return targets.sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Update wiki links when note content changes
   */
  public updateNoteLinks(
    note: Note, 
    oldContent: string, 
    newContent: string
  ): Note {
    const availableTargets = this.getAvailableLinkTargets(note.projectId);
    const { updatedNote } = updateBacklinks(note, oldContent, newContent, availableTargets);
    
    // Save updated note
    const allNotes = storageService.getProjectNotes(note.projectId);
    const noteIndex = allNotes.findIndex(n => n.id === note.id);
    if (noteIndex !== -1) {
      allNotes[noteIndex] = updatedNote;
      storageService.saveProjectNotes(note.projectId, allNotes);
    }

    return updatedNote;
  }

  /**
   * Get backlinks for a target
   */
  public getBacklinks(targetId: string, targetTitle: string, projectId: string): Backlink[] {
    const allNotes = storageService.getProjectNotes(projectId);
    return generateBacklinks(targetId, targetTitle, allNotes);
  }

  /**
   * Get all broken links in a project
   */
  public getBrokenLinks(projectId: string): Array<{
    noteId: string;
    noteTitle: string;
    brokenLinks: Array<{ targetTitle: string; linkText: string; context?: string }>;
  }> {
    const allNotes = storageService.getProjectNotes(projectId);
    const availableTargets = this.getAvailableLinkTargets(projectId);
    const result: Array<{
      noteId: string;
      noteTitle: string;
      brokenLinks: Array<{ targetTitle: string; linkText: string; context?: string }>;
    }> = [];

    allNotes.forEach(note => {
      const brokenLinks = findBrokenLinks(note.content, availableTargets);
      if (brokenLinks.length > 0) {
        result.push({
          noteId: note.id,
          noteTitle: note.title,
          brokenLinks: brokenLinks.map(link => ({
            targetTitle: link.targetTitle,
            linkText: link.displayText,
            context: this.extractContext(note.content, link.startIndex, link.endIndex)
          }))
        });
      }
    });

    return result;
  }

  /**
   * Search for link targets
   */
  public searchLinkTargets(query: string, projectId: string, limit: number = 20): LinkTarget[] {
    const availableTargets = this.getAvailableLinkTargets(projectId);
    return createLinkSuggestions(query, availableTargets, limit);
  }

  /**
   * Get link statistics for a project
   */
  public getProjectLinkStatistics(projectId: string): {
    totalLinks: number;
    uniqueTargets: number;
    brokenLinks: number;
    mostLinkedTargets: Array<{ title: string; count: number; type: string }>;
    linksByType: Record<string, number>;
  } {
    const allNotes = storageService.getProjectNotes(projectId);
    const availableTargets = this.getAvailableLinkTargets(projectId);
    const targetMap = new Map(availableTargets.map(t => [t.title.toLowerCase(), t]));
    
    let totalLinks = 0;
    const targetCounts = new Map<string, number>();
    const linksByType = new Map<string, number>();
    let brokenLinksCount = 0;

    allNotes.forEach(note => {
      const links = parseWikiLinks(note.content);
      totalLinks += links.length;

      links.forEach(link => {
        const target = targetMap.get(link.targetTitle.toLowerCase());
        if (target) {
          // Count links by target
          const currentCount = targetCounts.get(target.title) || 0;
          targetCounts.set(target.title, currentCount + 1);

          // Count links by type
          const typeCount = linksByType.get(target.type) || 0;
          linksByType.set(target.type, typeCount + 1);
        } else {
          brokenLinksCount++;
        }
      });
    });

    // Get most linked targets
    const mostLinkedTargets = Array.from(targetCounts.entries())
      .map(([title, count]) => {
        const target = targetMap.get(title.toLowerCase());
        return {
          title,
          count,
          type: target?.type || 'unknown'
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLinks,
      uniqueTargets: targetCounts.size,
      brokenLinks: brokenLinksCount,
      mostLinkedTargets,
      linksByType: Object.fromEntries(linksByType)
    };
  }

  /**
   * Create a new target from a broken link
   */
  public createTargetFromBrokenLink(
    title: string,
    type: 'note' | 'character' | 'location' | 'item' | 'plotthread',
    projectId: string,
    storyId?: string
  ): LinkTarget {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case 'note':
        const newNote: Note = {
          id,
          projectId,
          storyId,
          title,
          content: '',
          type: 'note',
          tags: [],
          folder: undefined,
          position: 0,
          wikiLinks: [],
          backlinks: [],
          linkedElements: [],
          wordCount: 0,
          readTime: 0,
          status: 'draft',
          priority: 'medium',
          comments: [],
          version: 1,
          versionHistory: [],
          aiSuggestions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save note
        const notes = storageService.getProjectNotes(projectId);
        notes.push(newNote);
        storageService.saveProjectNotes(projectId, notes);
        break;

      case 'character':
        const newCharacter: Character = {
          id,
          projectId,
          name: title,
          fullName: title,
          nicknames: [],
          appearance: {
            physicalTraits: [],
            distinguishingMarks: []
          },
          personality: {
            traits: [],
            strengths: [],
            weaknesses: [],
            fears: [],
            desires: [],
            motivations: [],
            flaws: []
          },
          family: [],
          role: 'supporting',
          importance: 3,
          arc: {
            startingPoint: '',
            endingPoint: '',
            transformation: '',
            keyMoments: []
          },
          relationships: [],
          speechPatterns: [],
          catchphrases: [],
          images: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save character (mock implementation)
        this.saveCharacter(newCharacter);
        break;

      // Similar implementations for location, item, plotthread...
    }

    return {
      id,
      title,
      type,
      projectId,
      storyId
    };
  }

  /**
   * Get link graph data for visualization
   */
  public getLinkGraph(projectId: string): {
    nodes: Array<{ id: string; title: string; type: string; linkCount: number }>;
    edges: Array<{ source: string; target: string; weight: number }>;
  } {
    const allNotes = storageService.getProjectNotes(projectId);
    const availableTargets = this.getAvailableLinkTargets(projectId);
    const targetMap = new Map(availableTargets.map(t => [t.title.toLowerCase(), t]));
    
    const nodes = new Map<string, { id: string; title: string; type: string; linkCount: number }>();
    const edges = new Map<string, number>();

    // Initialize nodes
    availableTargets.forEach(target => {
      nodes.set(target.id, {
        id: target.id,
        title: target.title,
        type: target.type,
        linkCount: 0
      });
    });

    // Process links
    allNotes.forEach(note => {
      const links = parseWikiLinks(note.content);
      
      links.forEach(link => {
        const target = targetMap.get(link.targetTitle.toLowerCase());
        if (target) {
          // Update link count
          const node = nodes.get(target.id);
          if (node) {
            node.linkCount++;
          }

          // Create edge
          const edgeKey = `${note.id}->${target.id}`;
          const currentWeight = edges.get(edgeKey) || 0;
          edges.set(edgeKey, currentWeight + 1);
        }
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.entries()).map(([key, weight]) => {
        const [source, target] = key.split('->');
        return { source, target, weight };
      })
    };
  }

  // Helper methods for data access (mock implementations for now)
  private getProjectCharacters(projectId: string): Character[] {
    // In a real implementation, this would fetch from storage
    return JSON.parse(localStorage.getItem(`characters_${projectId}`) || '[]');
  }

  private getProjectLocations(projectId: string): Location[] {
    return JSON.parse(localStorage.getItem(`locations_${projectId}`) || '[]');
  }

  private getProjectItems(projectId: string): Item[] {
    return JSON.parse(localStorage.getItem(`items_${projectId}`) || '[]');
  }

  private getProjectPlotThreads(projectId: string): PlotThread[] {
    return JSON.parse(localStorage.getItem(`plotthreads_${projectId}`) || '[]');
  }

  private saveCharacter(character: Character): void {
    const characters = this.getProjectCharacters(character.projectId);
    characters.push(character);
    localStorage.setItem(`characters_${character.projectId}`, JSON.stringify(characters));
  }

  private extractContext(content: string, startIndex: number, endIndex: number, contextLength: number = 50): string {
    const start = Math.max(0, startIndex - contextLength);
    const end = Math.min(content.length, endIndex + contextLength);
    return content.slice(start, end).trim();
  }
}

export const wikiLinkService = WikiLinkService.getInstance();