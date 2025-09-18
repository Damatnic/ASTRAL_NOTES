/**
 * Auto-Detection Service
 * Intelligent text analysis and entity recognition for the Codex system
 * Provides real-time reference detection and suggestion generation
 */

import { api } from './api';
import { codexService, type CodexEntity, type EntityType, type TextReference, type MentionSuggestion } from './codexService';

// Configuration for detection algorithms
export interface DetectionConfig {
  enabledTypes: EntityType[];
  minimumConfidence: number; // 0.0-1.0
  contextWindow: number; // Characters before/after to capture
  fuzzyMatching: boolean;
  caseSensitive: boolean;
  includePartialMatches: boolean;
  excludeCommonWords: boolean;
}

export interface TextAnalysisResult {
  references: DetectedReference[];
  suggestions: DetectedSuggestion[];
  statistics: AnalysisStatistics;
}

export interface DetectedReference {
  entityId: string;
  entity: CodexEntity;
  text: string;
  startPos: number;
  endPos: number;
  confidence: number;
  contextBefore: string;
  contextAfter: string;
  matchType: 'exact' | 'fuzzy' | 'alias' | 'partial';
}

export interface DetectedSuggestion {
  text: string;
  startPos: number;
  endPos: number;
  confidence: number;
  suggestedType: EntityType;
  context: string;
  frequency: number;
  reason: string; // Why this was suggested as an entity
}

export interface AnalysisStatistics {
  totalWords: number;
  totalEntities: number;
  entitiesByType: Record<EntityType, number>;
  averageConfidence: number;
  processingTime: number;
  suggestionsCount: number;
}

export interface EntityPattern {
  type: EntityType;
  pattern: RegExp;
  confidence: number;
  description: string;
}

class AutoDetectionService {
  private config: DetectionConfig = {
    enabledTypes: ['character', 'location', 'object', 'organization', 'event'],
    minimumConfidence: 0.6,
    contextWindow: 50,
    fuzzyMatching: true,
    caseSensitive: false,
    includePartialMatches: true,
    excludeCommonWords: true,
  };

  private commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'he', 'she', 'it', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'them', 'us',
    'his', 'hers', 'its', 'their', 'our', 'your', 'my', 'mine', 'yours', 'theirs', 'ours',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who'
  ]);

  // Common patterns that suggest different entity types
  private entityPatterns: EntityPattern[] = [
    {
      type: 'character',
      pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Proper names (First Last)
      confidence: 0.8,
      description: 'Proper name format'
    },
    {
      type: 'location',
      pattern: /\b(?:the\s+)?[A-Z][a-z]*\s+(?:City|Town|Village|Castle|Kingdom|Empire|Mountains?|Forest|Desert|Ocean|Sea|River|Lake)\b/gi,
      confidence: 0.9,
      description: 'Location descriptors'
    },
    {
      type: 'location',
      pattern: /\b(?:north|south|east|west|northern|southern|eastern|western)\s+[A-Z][a-z]+\b/gi,
      confidence: 0.7,
      description: 'Directional locations'
    },
    {
      type: 'organization',
      pattern: /\b(?:the\s+)?[A-Z][a-z]*\s+(?:Guild|Order|Brotherhood|Society|Council|Alliance|Federation|Empire|Kingdom|Republic|Company|Corporation)\b/gi,
      confidence: 0.8,
      description: 'Organization names'
    },
    {
      type: 'object',
      pattern: /\b(?:the\s+)?[A-Z][a-z]*\s+(?:Sword|Blade|Ring|Crown|Orb|Staff|Wand|Tome|Book|Scroll|Amulet|Gem|Crystal)\b/gi,
      confidence: 0.8,
      description: 'Artifact names'
    },
    {
      type: 'event',
      pattern: /\b(?:the\s+)?(?:Battle|War|Siege|Treaty|Peace|Alliance|Wedding|Coronation|Festival|Ceremony)\s+(?:of|at)?\s+[A-Z][a-z]+\b/gi,
      confidence: 0.8,
      description: 'Historical events'
    }
  ];

  // CONFIGURATION METHODS
  updateConfig(newConfig: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  resetConfig(): void {
    this.config = {
      enabledTypes: ['character', 'location', 'object', 'organization', 'event'],
      minimumConfidence: 0.6,
      contextWindow: 50,
      fuzzyMatching: true,
      caseSensitive: false,
      includePartialMatches: true,
      excludeCommonWords: true,
    };
  }

  // MAIN ANALYSIS METHODS
  async analyzeText(
    text: string, 
    sourceType: string, 
    sourceId: string, 
    projectId?: string
  ): Promise<TextAnalysisResult> {
    const startTime = Date.now();
    
    // Get existing entities for this project
    const entities = projectId 
      ? await codexService.getEntitiesByProject(projectId)
      : await codexService.getUniversalEntities();

    // Detect references to existing entities
    const references = this.detectReferences(text, entities);
    
    // Generate suggestions for new entities
    const suggestions = this.generateSuggestions(text, entities);
    
    const processingTime = Date.now() - startTime;
    
    // Calculate statistics
    const statistics = this.calculateStatistics(text, references, suggestions, processingTime);
    
    return {
      references,
      suggestions,
      statistics
    };
  }

  async analyzeDocument(
    sourceType: string, 
    sourceId: string, 
    projectId?: string
  ): Promise<TextAnalysisResult> {
    // Get document content based on type
    const text = await this.getDocumentContent(sourceType, sourceId);
    return this.analyzeText(text, sourceType, sourceId, projectId);
  }

  async saveDetectedReferences(
    references: DetectedReference[], 
    sourceType: string, 
    sourceId: string
  ): Promise<TextReference[]> {
    const savedReferences: TextReference[] = [];
    
    for (const ref of references) {
      if (ref.confidence >= this.config.minimumConfidence) {
        try {
          const textRef = await codexService.createTextReference({
            entityId: ref.entityId,
            sourceType,
            sourceId,
            text: ref.text,
            startPos: ref.startPos,
            endPos: ref.endPos,
            contextBefore: ref.contextBefore,
            contextAfter: ref.contextAfter,
            confidence: ref.confidence,
            isConfirmed: false,
            isIgnored: false
          });
          savedReferences.push(textRef);
        } catch (error) {
          console.warn('Failed to save text reference:', error);
        }
      }
    }
    
    return savedReferences;
  }

  async saveSuggestions(
    suggestions: DetectedSuggestion[], 
    sourceType: string, 
    sourceId: string
  ): Promise<MentionSuggestion[]> {
    // Send suggestions to backend for processing and deduplication
    const response = await api.post('/api/codex/suggestions/batch', {
      suggestions: suggestions.map(s => ({
        text: s.text,
        sourceType,
        sourceId,
        context: s.context,
        frequency: s.frequency,
        suggestedType: s.suggestedType,
        confidence: s.confidence
      }))
    });
    
    return response;
  }

  // REFERENCE DETECTION
  private detectReferences(text: string, entities: CodexEntity[]): DetectedReference[] {
    const references: DetectedReference[] = [];
    
    for (const entity of entities) {
      if (!this.config.enabledTypes.includes(entity.type)) continue;
      
      // Check for exact matches
      const exactMatches = this.findExactMatches(text, entity);
      references.push(...exactMatches);
      
      // Check for fuzzy matches if enabled
      if (this.config.fuzzyMatching) {
        const fuzzyMatches = this.findFuzzyMatches(text, entity);
        references.push(...fuzzyMatches);
      }
      
      // Check for alias matches
      const aliasMatches = this.findAliasMatches(text, entity);
      references.push(...aliasMatches);
    }
    
    // Remove overlapping references (keep highest confidence)
    return this.removeOverlappingReferences(references);
  }

  private findExactMatches(text: string, entity: CodexEntity): DetectedReference[] {
    const matches: DetectedReference[] = [];
    const searchText = this.config.caseSensitive ? text : text.toLowerCase();
    const entityName = this.config.caseSensitive ? entity.name : entity.name.toLowerCase();
    
    let index = 0;
    while ((index = searchText.indexOf(entityName, index)) !== -1) {
      const endPos = index + entityName.length;
      
      // Check word boundaries
      if (this.isWordBoundary(text, index, endPos)) {
        const context = this.extractContext(text, index, endPos);
        
        matches.push({
          entityId: entity.id,
          entity,
          text: text.substring(index, endPos),
          startPos: index,
          endPos,
          confidence: 1.0,
          contextBefore: context.before,
          contextAfter: context.after,
          matchType: 'exact'
        });
      }
      
      index = endPos;
    }
    
    return matches;
  }

  private findFuzzyMatches(text: string, entity: CodexEntity): DetectedReference[] {
    const matches: DetectedReference[] = [];
    const words = text.split(/\s+/);
    const entityWords = entity.name.split(/\s+/);
    
    // Look for partial matches or variations
    for (let i = 0; i <= words.length - entityWords.length; i++) {
      const segment = words.slice(i, i + entityWords.length).join(' ');
      const similarity = this.calculateSimilarity(segment, entity.name);
      
      if (similarity >= 0.8) { // 80% similarity threshold
        const startPos = text.indexOf(segment);
        if (startPos !== -1) {
          const endPos = startPos + segment.length;
          const context = this.extractContext(text, startPos, endPos);
          
          matches.push({
            entityId: entity.id,
            entity,
            text: segment,
            startPos,
            endPos,
            confidence: similarity * 0.9, // Reduce confidence for fuzzy matches
            contextBefore: context.before,
            contextAfter: context.after,
            matchType: 'fuzzy'
          });
        }
      }
    }
    
    return matches;
  }

  private findAliasMatches(text: string, entity: CodexEntity): DetectedReference[] {
    const matches: DetectedReference[] = [];
    
    // Check entity data for aliases
    const data = entity.data as any;
    const aliases = data.aliases || data.nicknames || data.alternateNames || [];
    
    for (const alias of aliases) {
      if (typeof alias === 'string' && alias.length > 2) {
        const aliasMatches = this.findExactMatches(text, { ...entity, name: alias });
        matches.push(...aliasMatches.map(match => ({
          ...match,
          confidence: match.confidence * 0.85, // Slightly lower confidence for aliases
          matchType: 'alias' as const
        })));
      }
    }
    
    return matches;
  }

  // SUGGESTION GENERATION
  private generateSuggestions(text: string, existingEntities: CodexEntity[]): DetectedSuggestion[] {
    const suggestions: DetectedSuggestion[] = [];
    const existingNames = new Set(existingEntities.map(e => e.name.toLowerCase()));
    
    // Pattern-based suggestions
    for (const pattern of this.entityPatterns) {
      if (!this.config.enabledTypes.includes(pattern.type)) continue;
      
      const matches = Array.from(text.matchAll(pattern.pattern));
      for (const match of matches) {
        const matchText = match[0].trim();
        const startPos = match.index!;
        const endPos = startPos + matchText.length;
        
        // Skip if this entity already exists
        if (existingNames.has(matchText.toLowerCase())) continue;
        
        // Skip common words
        if (this.config.excludeCommonWords && this.isCommonPhrase(matchText)) continue;
        
        const context = this.extractContext(text, startPos, endPos);
        
        suggestions.push({
          text: matchText,
          startPos,
          endPos,
          confidence: pattern.confidence,
          suggestedType: pattern.type,
          context: `${context.before}${matchText}${context.after}`,
          frequency: 1,
          reason: pattern.description
        });
      }
    }
    
    // Capitalized word suggestions (potential proper nouns)
    const capitalizedWords = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    const wordFrequency = this.calculateWordFrequency(capitalizedWords);
    
    for (const [word, frequency] of wordFrequency.entries()) {
      if (frequency >= 2 && !existingNames.has(word.toLowerCase()) && !this.commonWords.has(word.toLowerCase())) {
        const firstOccurrence = text.indexOf(word);
        const context = this.extractContext(text, firstOccurrence, firstOccurrence + word.length);
        
        suggestions.push({
          text: word,
          startPos: firstOccurrence,
          endPos: firstOccurrence + word.length,
          confidence: Math.min(0.5 + (frequency * 0.1), 0.9),
          suggestedType: this.inferEntityType(word, context.before + word + context.after),
          context: `${context.before}${word}${context.after}`,
          frequency,
          reason: `Appears ${frequency} times as proper noun`
        });
      }
    }
    
    // Consolidate and deduplicate suggestions
    return this.consolidateSuggestions(suggestions);
  }

  // UTILITY METHODS
  private isWordBoundary(text: string, startPos: number, endPos: number): boolean {
    const beforeChar = startPos > 0 ? text[startPos - 1] : ' ';
    const afterChar = endPos < text.length ? text[endPos] : ' ';
    
    return /\W/.test(beforeChar) && /\W/.test(afterChar);
  }

  private extractContext(text: string, startPos: number, endPos: number): { before: string; after: string } {
    const beforeStart = Math.max(0, startPos - this.config.contextWindow);
    const afterEnd = Math.min(text.length, endPos + this.config.contextWindow);
    
    return {
      before: text.substring(beforeStart, startPos),
      after: text.substring(endPos, afterEnd)
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const a = str1.toLowerCase();
    const b = str2.toLowerCase();
    
    if (a === b) return 1.0;
    
    // Levenshtein distance similarity
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    const maxLength = Math.max(a.length, b.length);
    return (maxLength - matrix[b.length][a.length]) / maxLength;
  }

  private isCommonPhrase(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    return words.every(word => this.commonWords.has(word));
  }

  private calculateWordFrequency(words: string[]): Map<string, number> {
    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
    return frequency;
  }

  private inferEntityType(word: string, context: string): EntityType {
    const contextLower = context.toLowerCase();
    
    // Location indicators
    if (/\b(?:in|at|to|from|near|by)\s+\w*$/i.test(context) || 
        /\b(?:city|town|village|castle|kingdom|mountain|forest|desert|ocean|sea|river|lake)\b/i.test(contextLower)) {
      return 'location';
    }
    
    // Character indicators
    if (/\b(?:said|spoke|replied|asked|told|whispered|shouted)\s*$/i.test(context) ||
        /\b(?:he|she|his|her|him|them|they)\b/i.test(contextLower)) {
      return 'character';
    }
    
    // Object indicators
    if (/\b(?:held|wielded|carried|wore|used|took|grabbed|sword|ring|crown|staff|blade)\b/i.test(contextLower)) {
      return 'object';
    }
    
    // Organization indicators
    if (/\b(?:guild|order|brotherhood|society|council|alliance|company|group)\b/i.test(contextLower)) {
      return 'organization';
    }
    
    // Event indicators
    if (/\b(?:battle|war|siege|treaty|wedding|ceremony|festival|celebration)\b/i.test(contextLower)) {
      return 'event';
    }
    
    // Default to character for proper nouns
    return 'character';
  }

  private removeOverlappingReferences(references: DetectedReference[]): DetectedReference[] {
    // Sort by position
    references.sort((a, b) => a.startPos - b.startPos);
    
    const filtered: DetectedReference[] = [];
    let lastEndPos = -1;
    
    for (const ref of references) {
      if (ref.startPos >= lastEndPos) {
        filtered.push(ref);
        lastEndPos = ref.endPos;
      } else {
        // Keep the one with higher confidence
        const lastRef = filtered[filtered.length - 1];
        if (ref.confidence > lastRef.confidence) {
          filtered[filtered.length - 1] = ref;
          lastEndPos = ref.endPos;
        }
      }
    }
    
    return filtered;
  }

  private consolidateSuggestions(suggestions: DetectedSuggestion[]): DetectedSuggestion[] {
    const consolidated = new Map<string, DetectedSuggestion>();
    
    for (const suggestion of suggestions) {
      const key = suggestion.text.toLowerCase();
      const existing = consolidated.get(key);
      
      if (existing) {
        // Merge suggestions for the same text
        existing.frequency += suggestion.frequency;
        existing.confidence = Math.max(existing.confidence, suggestion.confidence);
        if (existing.reason !== suggestion.reason) {
          existing.reason += `, ${suggestion.reason}`;
        }
      } else {
        consolidated.set(key, { ...suggestion });
      }
    }
    
    return Array.from(consolidated.values())
      .filter(s => s.confidence >= this.config.minimumConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private calculateStatistics(
    text: string, 
    references: DetectedReference[], 
    suggestions: DetectedSuggestion[], 
    processingTime: number
  ): AnalysisStatistics {
    const words = text.split(/\s+/).length;
    const entitiesByType: Record<EntityType, number> = {
      character: 0,
      location: 0,
      object: 0,
      lore: 0,
      subplot: 0,
      organization: 0,
      event: 0,
      concept: 0,
      custom: 0
    };
    
    for (const ref of references) {
      entitiesByType[ref.entity.type]++;
    }
    
    const avgConfidence = references.length > 0 
      ? references.reduce((sum, ref) => sum + ref.confidence, 0) / references.length 
      : 0;
    
    return {
      totalWords: words,
      totalEntities: references.length,
      entitiesByType,
      averageConfidence: avgConfidence,
      processingTime,
      suggestionsCount: suggestions.length
    };
  }

  private async getDocumentContent(sourceType: string, sourceId: string): Promise<string> {
    // This would be implemented based on your document types
    switch (sourceType) {
      case 'scene':
        const scene = await api.get(`/api/scenes/${sourceId}`);
        return scene.content || '';
      case 'note':
        const note = await api.get(`/api/notes/${sourceId}`);
        return note.content || '';
      case 'story':
        const story = await api.get(`/api/stories/${sourceId}`);
        return story.description || '';
      default:
        return '';
    }
  }

  // BATCH PROCESSING
  async analyzeProject(projectId: string): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    totalReferences: number;
    totalSuggestions: number;
    errors: string[];
  }> {
    const response = await api.post(`/api/codex/analyze-project/${projectId}`);
    return response;
  }

  async getAnalysisProgress(projectId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    eta?: number;
  }> {
    const response = await api.get(`/api/codex/analysis-progress/${projectId}`);
    return response;
  }
}

// Export singleton instance
export const autoDetectionService = new AutoDetectionService();
export default autoDetectionService;