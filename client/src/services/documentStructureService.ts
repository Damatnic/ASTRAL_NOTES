/**
 * Document Structure Service
 * Handles section markers, alternative versions, and document navigation
 */

export interface SectionMarker {
  id: string;
  type: 'chapter' | 'scene' | 'section' | 'note' | 'bookmark' | 'revision';
  title: string;
  description?: string;
  position: number; // Character position in document
  length?: number; // Length of the section
  level: number; // Hierarchy level (1-6)
  color?: string;
  icon?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    wordCount?: number;
    characterCount?: number;
    estimatedReadingTime?: number;
    status?: 'draft' | 'review' | 'final';
    priority?: 'low' | 'medium' | 'high';
    author?: string;
    notes?: string;
  };
}

export interface AlternativeVersion {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  changeDescription?: string;
  wordCount: number;
  metadata?: {
    tone?: string;
    style?: string;
    purpose?: string;
    feedback?: string[];
    rating?: number;
  };
}

export interface DocumentStructure {
  sections: SectionMarker[];
  alternatives: Map<string, AlternativeVersion[]>;
  documentLength: number;
  lastUpdated: Date;
}

export interface NavigationItem {
  id: string;
  title: string;
  level: number;
  position: number;
  type: SectionMarker['type'];
  hasAlternatives: boolean;
  children?: NavigationItem[];
}

class DocumentStructureService {
  private structures: Map<string, DocumentStructure> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private markerCounter = 0;
  private versionCounter = 0;

  // Section Marker Management
  createMarker(
    documentId: string, 
    type: SectionMarker['type'], 
    title: string, 
    position: number, 
    options: Partial<SectionMarker> = {}
  ): SectionMarker {
    const marker: SectionMarker = {
      id: `marker-${++this.markerCounter}`,
      type,
      title,
      position,
      level: options.level || 1,
      color: options.color || this.getDefaultColor(type),
      icon: options.icon || this.getDefaultIcon(type),
      tags: options.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options,
    };

    this.addMarkerToDocument(documentId, marker);
    return marker;
  }

  private addMarkerToDocument(documentId: string, marker: SectionMarker): void {
    const structure = this.getOrCreateStructure(documentId);
    structure.sections.push(marker);
    structure.sections.sort((a, b) => a.position - b.position);
    structure.lastUpdated = new Date();
    
    this.emit('marker-created', { documentId, marker });
  }

  updateMarker(documentId: string, markerId: string, updates: Partial<SectionMarker>): boolean {
    const structure = this.structures.get(documentId);
    if (!structure) return false;

    const markerIndex = structure.sections.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return false;

    const marker = structure.sections[markerIndex];
    Object.assign(marker, updates, { updatedAt: new Date() });
    
    // Re-sort if position changed
    if (updates.position !== undefined) {
      structure.sections.sort((a, b) => a.position - b.position);
    }

    structure.lastUpdated = new Date();
    this.emit('marker-updated', { documentId, marker });
    return true;
  }

  deleteMarker(documentId: string, markerId: string): boolean {
    const structure = this.structures.get(documentId);
    if (!structure) return false;

    const markerIndex = structure.sections.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return false;

    const marker = structure.sections[markerIndex];
    structure.sections.splice(markerIndex, 1);
    
    // Delete associated alternatives
    structure.alternatives.delete(markerId);
    
    structure.lastUpdated = new Date();
    this.emit('marker-deleted', { documentId, markerId, marker });
    return true;
  }

  getMarker(documentId: string, markerId: string): SectionMarker | null {
    const structure = this.structures.get(documentId);
    if (!structure) return null;

    return structure.sections.find(m => m.id === markerId) || null;
  }

  getMarkers(documentId: string, type?: SectionMarker['type']): SectionMarker[] {
    const structure = this.structures.get(documentId);
    if (!structure) return [];

    return type 
      ? structure.sections.filter(m => m.type === type)
      : structure.sections;
  }

  // Auto-detect sections from content
  autoDetectSections(documentId: string, content: string): SectionMarker[] {
    const detectedMarkers: SectionMarker[] = [];
    
    // Detect headings (# ## ### etc.)
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const position = match.index;
      
      const marker = this.createMarker(documentId, 'section', title, position, {
        level,
        length: match[0].length,
      });
      
      detectedMarkers.push(marker);
    }

    // Detect scene breaks (*** or ---)
    const sceneBreakRegex = /^(\*{3,}|---+)$/gm;
    let sceneMatch;
    
    while ((sceneMatch = sceneBreakRegex.exec(content)) !== null) {
      const marker = this.createMarker(
        documentId, 
        'scene', 
        'Scene Break', 
        sceneMatch.index,
        {
          level: 2,
          length: sceneMatch[0].length,
        }
      );
      
      detectedMarkers.push(marker);
    }

    // Detect chapter markers
    const chapterRegex = /^(chapter\s+\d+|ch\.\s*\d+)/gim;
    let chapterMatch;
    
    while ((chapterMatch = chapterRegex.exec(content)) !== null) {
      const marker = this.createMarker(
        documentId,
        'chapter',
        chapterMatch[0],
        chapterMatch.index,
        {
          level: 1,
          length: chapterMatch[0].length,
        }
      );
      
      detectedMarkers.push(marker);
    }

    return detectedMarkers;
  }

  // Find marker at position
  getMarkerAtPosition(documentId: string, position: number): SectionMarker | null {
    const structure = this.structures.get(documentId);
    if (!structure) return null;

    // Find the marker that contains this position
    return structure.sections.find(marker => {
      const endPos = marker.position + (marker.length || 0);
      return marker.position <= position && position <= endPos;
    }) || null;
  }

  // Get markers in range
  getMarkersInRange(documentId: string, start: number, end: number): SectionMarker[] {
    const structure = this.structures.get(documentId);
    if (!structure) return [];

    return structure.sections.filter(marker => {
      const markerEnd = marker.position + (marker.length || 0);
      return !(markerEnd < start || marker.position > end);
    });
  }

  // Alternative Versions Management
  createAlternative(
    documentId: string,
    sectionId: string,
    title: string,
    content: string,
    options: Partial<AlternativeVersion> = {}
  ): AlternativeVersion {
    const structure = this.getOrCreateStructure(documentId);
    
    const existing = structure.alternatives.get(sectionId) || [];
    const version = existing.length + 1;

    const alternative: AlternativeVersion = {
      id: `alt-${++this.versionCounter}`,
      sectionId,
      title,
      content,
      version,
      isActive: existing.length === 0, // First alternative is active by default
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: this.countWords(content),
      ...options,
    };

    existing.push(alternative);
    structure.alternatives.set(sectionId, existing);
    structure.lastUpdated = new Date();

    this.emit('alternative-created', { documentId, sectionId, alternative });
    return alternative;
  }

  updateAlternative(
    documentId: string,
    sectionId: string,
    alternativeId: string,
    updates: Partial<AlternativeVersion>
  ): boolean {
    const structure = this.structures.get(documentId);
    if (!structure) return false;

    const alternatives = structure.alternatives.get(sectionId);
    if (!alternatives) return false;

    const altIndex = alternatives.findIndex(alt => alt.id === alternativeId);
    if (altIndex === -1) return false;

    const alternative = alternatives[altIndex];
    Object.assign(alternative, updates, { 
      updatedAt: new Date(),
      wordCount: updates.content ? this.countWords(updates.content) : alternative.wordCount,
    });

    structure.lastUpdated = new Date();
    this.emit('alternative-updated', { documentId, sectionId, alternative });
    return true;
  }

  deleteAlternative(documentId: string, sectionId: string, alternativeId: string): boolean {
    const structure = this.structures.get(documentId);
    if (!structure) return false;

    const alternatives = structure.alternatives.get(sectionId);
    if (!alternatives) return false;

    const altIndex = alternatives.findIndex(alt => alt.id === alternativeId);
    if (altIndex === -1) return false;

    const alternative = alternatives[altIndex];
    alternatives.splice(altIndex, 1);

    // If we deleted the active alternative, make the first one active
    if (alternative.isActive && alternatives.length > 0) {
      alternatives[0].isActive = true;
    }

    structure.lastUpdated = new Date();
    this.emit('alternative-deleted', { documentId, sectionId, alternativeId });
    return true;
  }

  setActiveAlternative(documentId: string, sectionId: string, alternativeId: string): boolean {
    const structure = this.structures.get(documentId);
    if (!structure) return false;

    const alternatives = structure.alternatives.get(sectionId);
    if (!alternatives) return false;

    // Deactivate all alternatives
    alternatives.forEach(alt => alt.isActive = false);

    // Activate the selected one
    const alternative = alternatives.find(alt => alt.id === alternativeId);
    if (!alternative) return false;

    alternative.isActive = true;
    structure.lastUpdated = new Date();

    this.emit('alternative-activated', { documentId, sectionId, alternative });
    return true;
  }

  getAlternatives(documentId: string, sectionId: string): AlternativeVersion[] {
    const structure = this.structures.get(documentId);
    if (!structure) return [];

    return structure.alternatives.get(sectionId) || [];
  }

  getActiveAlternative(documentId: string, sectionId: string): AlternativeVersion | null {
    const alternatives = this.getAlternatives(documentId, sectionId);
    return alternatives.find(alt => alt.isActive) || null;
  }

  // Navigation
  generateNavigation(documentId: string): NavigationItem[] {
    const structure = this.structures.get(documentId);
    if (!structure) return [];

    const items: NavigationItem[] = [];
    const stack: NavigationItem[] = [];

    structure.sections.forEach(marker => {
      const hasAlternatives = structure.alternatives.has(marker.id);
      
      const item: NavigationItem = {
        id: marker.id,
        title: marker.title,
        level: marker.level,
        position: marker.position,
        type: marker.type,
        hasAlternatives,
        children: [],
      };

      // Build hierarchy
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        items.push(item);
      } else {
        stack[stack.length - 1].children!.push(item);
      }

      stack.push(item);
    });

    return items;
  }

  // Document comparison
  compareAlternatives(
    documentId: string,
    sectionId: string,
    alt1Id: string,
    alt2Id: string
  ): {
    differences: Array<{ type: 'add' | 'remove' | 'change'; position: number; text: string }>;
    similarity: number;
  } {
    const alternatives = this.getAlternatives(documentId, sectionId);
    const alt1 = alternatives.find(a => a.id === alt1Id);
    const alt2 = alternatives.find(a => a.id === alt2Id);

    if (!alt1 || !alt2) {
      return { differences: [], similarity: 0 };
    }

    // Simple diff implementation
    const words1 = alt1.content.split(/\s+/);
    const words2 = alt2.content.split(/\s+/);
    
    const differences: Array<{ type: 'add' | 'remove' | 'change'; position: number; text: string }> = [];
    const maxLength = Math.max(words1.length, words2.length);
    let similarWords = 0;

    for (let i = 0; i < maxLength; i++) {
      if (i >= words1.length) {
        differences.push({ type: 'add', position: i, text: words2[i] });
      } else if (i >= words2.length) {
        differences.push({ type: 'remove', position: i, text: words1[i] });
      } else if (words1[i] !== words2[i]) {
        differences.push({ type: 'change', position: i, text: `${words1[i]} → ${words2[i]}` });
      } else {
        similarWords++;
      }
    }

    const similarity = maxLength > 0 ? similarWords / maxLength : 1;

    return { differences, similarity };
  }

  // Utility methods
  private getOrCreateStructure(documentId: string): DocumentStructure {
    if (!this.structures.has(documentId)) {
      this.structures.set(documentId, {
        sections: [],
        alternatives: new Map(),
        documentLength: 0,
        lastUpdated: new Date(),
      });
    }
    return this.structures.get(documentId)!;
  }

  private getDefaultColor(type: SectionMarker['type']): string {
    const colors = {
      chapter: '#3b82f6',
      scene: '#10b981',
      section: '#8b5cf6',
      note: '#f59e0b',
      bookmark: '#ef4444',
      revision: '#6b7280',
    };
    return colors[type];
  }

  private getDefaultIcon(type: SectionMarker['type']): string {
    const icons = {
      chapter: '📖',
      scene: '🎬',
      section: '📝',
      note: '📌',
      bookmark: '🔖',
      revision: '✏️',
    };
    return icons[type];
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Export/Import
  exportStructure(documentId: string): string | null {
    const structure = this.structures.get(documentId);
    if (!structure) return null;

    const exportData = {
      documentId,
      structure: {
        sections: structure.sections,
        alternatives: Array.from(structure.alternatives.entries()),
        documentLength: structure.documentLength,
        lastUpdated: structure.lastUpdated,
      },
      version: '1.0.0',
      exportedAt: new Date(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  importStructure(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.structure && data.documentId) {
        const structure: DocumentStructure = {
          sections: data.structure.sections,
          alternatives: new Map(data.structure.alternatives),
          documentLength: data.structure.documentLength,
          lastUpdated: new Date(data.structure.lastUpdated),
        };
        
        this.structures.set(data.documentId, structure);
        this.emit('structure-imported', { documentId: data.documentId });
        return true;
      }
    } catch (error) {
      console.error('Failed to import structure:', error);
    }
    return false;
  }

  // Statistics
  getDocumentStats(documentId: string): {
    totalSections: number;
    sectionsByType: Record<string, number>;
    totalAlternatives: number;
    avgAlternativesPerSection: number;
    lastUpdated: Date;
  } {
    const structure = this.structures.get(documentId);
    if (!structure) {
      return {
        totalSections: 0,
        sectionsByType: {},
        totalAlternatives: 0,
        avgAlternativesPerSection: 0,
        lastUpdated: new Date(),
      };
    }

    const sectionsByType: Record<string, number> = {};
    structure.sections.forEach(section => {
      sectionsByType[section.type] = (sectionsByType[section.type] || 0) + 1;
    });

    const totalAlternatives = Array.from(structure.alternatives.values())
      .reduce((sum, alts) => sum + alts.length, 0);

    return {
      totalSections: structure.sections.length,
      sectionsByType,
      totalAlternatives,
      avgAlternativesPerSection: structure.sections.length > 0 
        ? totalAlternatives / structure.sections.length 
        : 0,
      lastUpdated: structure.lastUpdated,
    };
  }

  // Event system
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Cleanup
  clearDocument(documentId: string): void {
    this.structures.delete(documentId);
    this.emit('structure-cleared', { documentId });
  }

  destroy(): void {
    this.structures.clear();
    this.listeners.clear();
  }
}

export const documentStructureService = new DocumentStructureService();