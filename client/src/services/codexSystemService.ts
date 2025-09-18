/**
 * Codex System Service
 * Comprehensive world-building element management inspired by NovelCrafter
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export type CodexElementType = 
  | 'character' 
  | 'location' 
  | 'item' 
  | 'magic_system'
  | 'technology'
  | 'organization'
  | 'event'
  | 'language'
  | 'culture'
  | 'creature'
  | 'concept'
  | 'custom';

export interface CodexElement {
  id: string;
  projectId: string;
  type: CodexElementType;
  name: string;
  aliases: string[];
  summary: string;
  description: string;
  attributes: Record<string, any>;
  relationships: CodexRelationship[];
  mentions: CodexMention[];
  images: string[];
  tags: string[];
  color: string;
  icon?: string;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

export interface CodexRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string; // 'parent', 'child', 'sibling', 'enemy', 'ally', 'owns', 'location', etc.
  description?: string;
  strength: number; // 0-100
  bidirectional: boolean;
}

export interface CodexMention {
  elementId: string;
  documentId: string;
  sceneId?: string;
  position: number;
  context: string;
  automatic: boolean;
}

export interface CodexCategory {
  id: string;
  name: string;
  type: CodexElementType;
  icon: string;
  color: string;
  template: CodexTemplate;
  count: number;
}

export interface CodexTemplate {
  type: CodexElementType;
  name: string;
  defaultAttributes: Record<string, any>;
  requiredFields: string[];
  suggestedFields: string[];
  relationshipTypes: string[];
}

export interface CodexSearchResult {
  element: CodexElement;
  relevance: number;
  matchedFields: string[];
  snippet: string;
}

export interface CodexStats {
  totalElements: number;
  elementsByType: Record<CodexElementType, number>;
  recentlyAccessed: CodexElement[];
  mostMentioned: CodexElement[];
  orphanedElements: CodexElement[];
  relationshipCount: number;
  averageRelationshipsPerElement: number;
}

class CodexSystemService extends BrowserEventEmitter {
  private elements: Map<string, CodexElement> = new Map();
  private relationships: Map<string, CodexRelationship> = new Map();
  private mentions: Map<string, CodexMention[]> = new Map();
  private categories: Map<string, CodexCategory> = new Map();
  private activeProjectId: string | null = null;
  private storageKey = 'astral_notes_codex';

  constructor() {
    super();
    this.initializeCategories();
    this.loadData();
  }

  // Element Management
  createElement(
    projectId: string,
    type: CodexElementType,
    name: string,
    data: Partial<CodexElement> = {}
  ): CodexElement {
    const element: CodexElement = {
      id: this.generateId(),
      projectId,
      type,
      name,
      aliases: data.aliases || [],
      summary: data.summary || '',
      description: data.description || '',
      attributes: data.attributes || this.getDefaultAttributes(type),
      relationships: [],
      mentions: [],
      images: data.images || [],
      tags: data.tags || [],
      color: data.color || this.getDefaultColor(type),
      icon: data.icon,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      ...data
    };

    this.elements.set(element.id, element);
    this.updateCategory(type);
    this.saveData();
    this.emit('elementCreated', element);
    
    // Auto-detect mentions in existing documents
    this.scanForMentions(element);
    
    return element;
  }

  updateElement(elementId: string, updates: Partial<CodexElement>): CodexElement | null {
    const element = this.elements.get(elementId);
    if (!element) return null;

    const updatedElement = {
      ...element,
      ...updates,
      updatedAt: Date.now()
    };

    this.elements.set(elementId, updatedElement);
    this.saveData();
    this.emit('elementUpdated', updatedElement);
    
    // Re-scan for mentions if name or aliases changed
    if (updates.name || updates.aliases) {
      this.scanForMentions(updatedElement);
    }
    
    return updatedElement;
  }

  deleteElement(elementId: string): boolean {
    const element = this.elements.get(elementId);
    if (!element) return false;

    // Remove all relationships
    this.relationships.forEach((rel, id) => {
      if (rel.sourceId === elementId || rel.targetId === elementId) {
        this.relationships.delete(id);
      }
    });

    // Remove mentions
    this.mentions.delete(elementId);

    this.elements.delete(elementId);
    this.updateCategory(element.type);
    this.saveData();
    this.emit('elementDeleted', element);
    
    return true;
  }

  archiveElement(elementId: string): boolean {
    const element = this.elements.get(elementId);
    if (!element) return false;

    element.isArchived = true;
    element.updatedAt = Date.now();
    
    this.saveData();
    this.emit('elementArchived', element);
    
    return true;
  }

  // Relationship Management
  createRelationship(
    sourceId: string,
    targetId: string,
    type: string,
    options: Partial<CodexRelationship> = {}
  ): CodexRelationship | null {
    const source = this.elements.get(sourceId);
    const target = this.elements.get(targetId);
    
    if (!source || !target) return null;

    const relationship: CodexRelationship = {
      id: this.generateId(),
      sourceId,
      targetId,
      type,
      description: options.description,
      strength: options.strength || 50,
      bidirectional: options.bidirectional || false
    };

    this.relationships.set(relationship.id, relationship);
    
    // Add to source element
    source.relationships.push(relationship);
    
    // Add reverse relationship if bidirectional
    if (relationship.bidirectional) {
      target.relationships.push({
        ...relationship,
        sourceId: targetId,
        targetId: sourceId
      });
    }
    
    this.saveData();
    this.emit('relationshipCreated', relationship);
    
    return relationship;
  }

  // Search and Discovery
  searchElements(query: string, filters?: {
    types?: CodexElementType[];
    tags?: string[];
    projectId?: string;
    includeArchived?: boolean;
  }): CodexSearchResult[] {
    const results: CodexSearchResult[] = [];
    const searchTerm = query.toLowerCase();

    this.elements.forEach(element => {
      if (filters?.projectId && element.projectId !== filters.projectId) return;
      if (!filters?.includeArchived && element.isArchived) return;
      if (filters?.types && !filters.types.includes(element.type)) return;
      if (filters?.tags && !filters.tags.some(tag => element.tags.includes(tag))) return;

      const matchedFields: string[] = [];
      let relevance = 0;

      // Check name
      if (element.name.toLowerCase().includes(searchTerm)) {
        matchedFields.push('name');
        relevance += element.name.toLowerCase() === searchTerm ? 100 : 80;
      }

      // Check aliases
      if (element.aliases.some(alias => alias.toLowerCase().includes(searchTerm))) {
        matchedFields.push('aliases');
        relevance += 60;
      }

      // Check summary
      if (element.summary.toLowerCase().includes(searchTerm)) {
        matchedFields.push('summary');
        relevance += 40;
      }

      // Check description
      if (element.description.toLowerCase().includes(searchTerm)) {
        matchedFields.push('description');
        relevance += 30;
      }

      // Check tags
      if (element.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
        matchedFields.push('tags');
        relevance += 20;
      }

      if (matchedFields.length > 0) {
        results.push({
          element,
          relevance,
          matchedFields,
          snippet: this.generateSnippet(element, searchTerm)
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // Auto-linking and Mention Detection
  scanForMentions(element: CodexElement): void {
    // This would integrate with the document service to find mentions
    // For now, we'll simulate it
    const mentions: CodexMention[] = [];
    
    // Check all elements for references
    const searchTerms = [element.name, ...element.aliases];
    
    // In a real implementation, this would scan actual documents
    // For demonstration, we'll create some sample mentions
    if (Math.random() > 0.5) {
      mentions.push({
        elementId: element.id,
        documentId: 'doc-sample',
        position: Math.floor(Math.random() * 1000),
        context: `...mentioned ${element.name} in the context...`,
        automatic: true
      });
    }

    this.mentions.set(element.id, mentions);
    element.mentions = mentions;
  }

  autoLinkDocument(documentId: string, content: string): CodexMention[] {
    const mentions: CodexMention[] = [];
    
    this.elements.forEach(element => {
      if (element.isArchived) return;
      
      const searchTerms = [element.name, ...element.aliases];
      searchTerms.forEach(term => {
        const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          mentions.push({
            elementId: element.id,
            documentId,
            position: match.index,
            context: this.extractContext(content, match.index, term.length),
            automatic: true
          });
        }
      });
    });
    
    return mentions;
  }

  // Relationship Graph
  getRelationshipGraph(elementId?: string, depth: number = 2): {
    nodes: CodexElement[];
    edges: CodexRelationship[];
  } {
    const nodes = new Map<string, CodexElement>();
    const edges: CodexRelationship[] = [];
    
    if (elementId) {
      // Build graph from specific element
      this.collectRelatedElements(elementId, nodes, edges, depth);
    } else {
      // Return full graph
      this.elements.forEach(element => {
        if (!element.isArchived) {
          nodes.set(element.id, element);
        }
      });
      
      this.relationships.forEach(rel => {
        if (nodes.has(rel.sourceId) && nodes.has(rel.targetId)) {
          edges.push(rel);
        }
      });
    }
    
    return {
      nodes: Array.from(nodes.values()),
      edges
    };
  }

  private collectRelatedElements(
    elementId: string,
    nodes: Map<string, CodexElement>,
    edges: CodexRelationship[],
    depth: number,
    currentDepth: number = 0
  ): void {
    if (currentDepth >= depth) return;
    
    const element = this.elements.get(elementId);
    if (!element || element.isArchived) return;
    
    nodes.set(elementId, element);
    
    this.relationships.forEach(rel => {
      if (rel.sourceId === elementId) {
        edges.push(rel);
        if (!nodes.has(rel.targetId)) {
          this.collectRelatedElements(rel.targetId, nodes, edges, depth, currentDepth + 1);
        }
      } else if (rel.targetId === elementId && rel.bidirectional) {
        edges.push(rel);
        if (!nodes.has(rel.sourceId)) {
          this.collectRelatedElements(rel.sourceId, nodes, edges, depth, currentDepth + 1);
        }
      }
    });
  }

  // Statistics and Analytics
  getStats(projectId?: string): CodexStats {
    const filteredElements = Array.from(this.elements.values()).filter(
      el => !projectId || el.projectId === projectId
    );

    const elementsByType: Record<CodexElementType, number> = {} as any;
    const types: CodexElementType[] = [
      'character', 'location', 'item', 'magic_system', 'technology',
      'organization', 'event', 'language', 'culture', 'creature', 'concept', 'custom'
    ];
    
    types.forEach(type => {
      elementsByType[type] = filteredElements.filter(el => el.type === type).length;
    });

    const recentlyAccessed = [...filteredElements]
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 10);

    const mostMentioned = [...filteredElements]
      .sort((a, b) => b.mentions.length - a.mentions.length)
      .slice(0, 10);

    const orphanedElements = filteredElements.filter(
      el => el.relationships.length === 0 && el.mentions.length === 0
    );

    const totalRelationships = Array.from(this.relationships.values()).filter(
      rel => {
        const source = this.elements.get(rel.sourceId);
        return source && (!projectId || source.projectId === projectId);
      }
    ).length;

    return {
      totalElements: filteredElements.length,
      elementsByType,
      recentlyAccessed,
      mostMentioned,
      orphanedElements,
      relationshipCount: totalRelationships,
      averageRelationshipsPerElement: 
        filteredElements.length > 0 ? totalRelationships / filteredElements.length : 0
    };
  }

  // Export and Import
  exportCodex(projectId?: string): string {
    const data = {
      elements: Array.from(this.elements.values()).filter(
        el => !projectId || el.projectId === projectId
      ),
      relationships: Array.from(this.relationships.values()).filter(
        rel => {
          const source = this.elements.get(rel.sourceId);
          return source && (!projectId || source.projectId === projectId);
        }
      ),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  importCodex(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Import elements
      data.elements?.forEach((element: CodexElement) => {
        this.elements.set(element.id, element);
      });
      
      // Import relationships
      data.relationships?.forEach((rel: CodexRelationship) => {
        this.relationships.set(rel.id, rel);
      });
      
      this.saveData();
      this.emit('codexImported', { elementCount: data.elements?.length || 0 });
      
      return true;
    } catch (error) {
      console.error('Failed to import codex:', error);
      return false;
    }
  }

  // Helper Methods
  private initializeCategories(): void {
    const defaultCategories: CodexCategory[] = [
      {
        id: 'characters',
        name: 'Characters',
        type: 'character',
        icon: '👤',
        color: '#8B5CF6',
        template: this.getTemplate('character'),
        count: 0
      },
      {
        id: 'locations',
        name: 'Locations',
        type: 'location',
        icon: '📍',
        color: '#10B981',
        template: this.getTemplate('location'),
        count: 0
      },
      {
        id: 'items',
        name: 'Items',
        type: 'item',
        icon: '⚔️',
        color: '#F59E0B',
        template: this.getTemplate('item'),
        count: 0
      },
      {
        id: 'organizations',
        name: 'Organizations',
        type: 'organization',
        icon: '🏛️',
        color: '#3B82F6',
        template: this.getTemplate('organization'),
        count: 0
      }
    ];

    defaultCategories.forEach(cat => {
      this.categories.set(cat.id, cat);
    });
  }

  private getTemplate(type: CodexElementType): CodexTemplate {
    const templates: Record<CodexElementType, CodexTemplate> = {
      character: {
        type: 'character',
        name: 'Character',
        defaultAttributes: {
          age: '',
          gender: '',
          occupation: '',
          appearance: '',
          personality: '',
          backstory: '',
          goals: '',
          conflicts: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['age', 'occupation', 'personality'],
        relationshipTypes: ['family', 'friend', 'enemy', 'romantic', 'mentor', 'rival']
      },
      location: {
        type: 'location',
        name: 'Location',
        defaultAttributes: {
          type: '',
          climate: '',
          population: '',
          government: '',
          economy: '',
          culture: '',
          history: '',
          landmarks: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['type', 'population'],
        relationshipTypes: ['contains', 'near', 'connected_to', 'ruled_by']
      },
      item: {
        type: 'item',
        name: 'Item',
        defaultAttributes: {
          type: '',
          material: '',
          origin: '',
          powers: '',
          value: '',
          owner: '',
          history: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['type', 'owner'],
        relationshipTypes: ['owned_by', 'created_by', 'stored_at', 'used_by']
      },
      magic_system: {
        type: 'magic_system',
        name: 'Magic System',
        defaultAttributes: {
          source: '',
          rules: '',
          limitations: '',
          costs: '',
          practitioners: '',
          schools: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['source', 'rules', 'limitations'],
        relationshipTypes: ['practiced_by', 'originates_from', 'opposes']
      },
      technology: {
        type: 'technology',
        name: 'Technology',
        defaultAttributes: {
          level: '',
          inventor: '',
          principles: '',
          applications: '',
          limitations: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['level', 'applications'],
        relationshipTypes: ['invented_by', 'used_by', 'based_on']
      },
      organization: {
        type: 'organization',
        name: 'Organization',
        defaultAttributes: {
          type: '',
          leader: '',
          members: '',
          goals: '',
          structure: '',
          resources: '',
          history: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['type', 'leader', 'goals'],
        relationshipTypes: ['led_by', 'member_of', 'allied_with', 'opposes', 'based_at']
      },
      event: {
        type: 'event',
        name: 'Event',
        defaultAttributes: {
          date: '',
          participants: '',
          causes: '',
          consequences: '',
          significance: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['date', 'significance'],
        relationshipTypes: ['caused_by', 'participated_in', 'resulted_in', 'occurred_at']
      },
      language: {
        type: 'language',
        name: 'Language',
        defaultAttributes: {
          speakers: '',
          region: '',
          script: '',
          related_languages: '',
          phrases: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['speakers', 'region'],
        relationshipTypes: ['spoken_by', 'derived_from', 'written_in']
      },
      culture: {
        type: 'culture',
        name: 'Culture',
        defaultAttributes: {
          values: '',
          traditions: '',
          beliefs: '',
          customs: '',
          arts: '',
          cuisine: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['values', 'traditions'],
        relationshipTypes: ['practiced_by', 'originated_from', 'influenced_by']
      },
      creature: {
        type: 'creature',
        name: 'Creature',
        defaultAttributes: {
          species: '',
          habitat: '',
          diet: '',
          behavior: '',
          abilities: '',
          lifecycle: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['species', 'habitat'],
        relationshipTypes: ['inhabits', 'preys_on', 'domesticated_by', 'evolved_from']
      },
      concept: {
        type: 'concept',
        name: 'Concept',
        defaultAttributes: {
          definition: '',
          origin: '',
          applications: '',
          implications: ''
        },
        requiredFields: ['name', 'summary'],
        suggestedFields: ['definition'],
        relationshipTypes: ['related_to', 'opposes', 'derives_from']
      },
      custom: {
        type: 'custom',
        name: 'Custom',
        defaultAttributes: {},
        requiredFields: ['name', 'summary'],
        suggestedFields: [],
        relationshipTypes: ['related_to']
      }
    };

    return templates[type] || templates.custom;
  }

  private getDefaultAttributes(type: CodexElementType): Record<string, any> {
    return this.getTemplate(type).defaultAttributes;
  }

  private getDefaultColor(type: CodexElementType): string {
    const colors: Record<CodexElementType, string> = {
      character: '#8B5CF6',
      location: '#10B981',
      item: '#F59E0B',
      magic_system: '#EC4899',
      technology: '#3B82F6',
      organization: '#6366F1',
      event: '#EF4444',
      language: '#14B8A6',
      culture: '#F97316',
      creature: '#84CC16',
      concept: '#A855F7',
      custom: '#6B7280'
    };

    return colors[type] || '#6B7280';
  }

  private updateCategory(type: CodexElementType): void {
    const category = Array.from(this.categories.values()).find(cat => cat.type === type);
    if (category) {
      category.count = Array.from(this.elements.values()).filter(
        el => el.type === type && !el.isArchived
      ).length;
    }
  }

  private generateSnippet(element: CodexElement, searchTerm: string): string {
    const text = element.description || element.summary;
    const index = text.toLowerCase().indexOf(searchTerm);
    
    if (index === -1) return text.substring(0, 150) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + searchTerm.length + 50);
    
    return '...' + text.substring(start, end) + '...';
  }

  private extractContext(content: string, position: number, length: number): string {
    const start = Math.max(0, position - 30);
    const end = Math.min(content.length, position + length + 30);
    return '...' + content.substring(start, end) + '...';
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private generateId(): string {
    return `codex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveData(): void {
    try {
      const data = {
        elements: Array.from(this.elements.entries()),
        relationships: Array.from(this.relationships.entries()),
        mentions: Array.from(this.mentions.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save codex data:', error);
    }
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      if (data.elements) {
        this.elements = new Map(data.elements);
      }
      
      if (data.relationships) {
        this.relationships = new Map(data.relationships);
      }
      
      if (data.mentions) {
        this.mentions = new Map(data.mentions);
      }

      // Update category counts
      this.categories.forEach(cat => {
        this.updateCategory(cat.type);
      });
    } catch (error) {
      console.error('Failed to load codex data:', error);
    }
  }
}

export const codexSystemService = new CodexSystemService();
export default codexSystemService;