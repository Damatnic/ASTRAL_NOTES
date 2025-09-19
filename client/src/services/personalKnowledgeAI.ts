/**
 * Personal Knowledge AI Service
 * Manages personal knowledge base and provides AI-powered insights
 */

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: 'fact' | 'idea' | 'quote' | 'reference' | 'insight';
  source?: string;
  createdAt: string;
  lastAccessed: string;
  connections: string[]; // IDs of related entries
}

export interface KnowledgeInsight {
  id: string;
  type: 'connection' | 'pattern' | 'gap' | 'opportunity';
  title: string;
  description: string;
  relatedEntries: string[];
  confidence: number;
}

export class PersonalKnowledgeAIService {
  private knowledgeBase: Map<string, KnowledgeEntry> = new Map();
  private insights: KnowledgeInsight[] = [];
  private searchIndex: Map<string, Set<string>> = new Map();

  /**
   * Add knowledge entry
   */
  public addKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'lastAccessed' | 'connections'>): KnowledgeEntry {
    const newEntry: KnowledgeEntry = {
      ...entry,
      id: `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      connections: []
    };

    this.knowledgeBase.set(newEntry.id, newEntry);
    this.updateSearchIndex(newEntry);
    this.generateConnections(newEntry);

    return newEntry;
  }

  /**
   * Add knowledge item (alias for addKnowledge for API compatibility)
   */
  public addKnowledgeItem(item: {
    title: string;
    content: string;
    tags?: string[];
    category?: KnowledgeEntry['category'];
    source?: string;
  }): KnowledgeEntry {
    return this.addKnowledge({
      title: item.title,
      content: item.content,
      tags: item.tags || [],
      category: item.category || 'fact'
    });
  }

  /**
   * Search knowledge base
   */
  public searchKnowledge(query: string, filters?: {
    category?: KnowledgeEntry['category'];
    tags?: string[];
    limit?: number;
  }): KnowledgeEntry[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const matchingIds = new Set<string>();

    // Search in index
    queryWords.forEach(word => {
      const entries = this.searchIndex.get(word) || new Set();
      entries.forEach(id => matchingIds.add(id));
    });

    let results = Array.from(matchingIds)
      .map(id => this.knowledgeBase.get(id)!)
      .filter(Boolean);

    // Apply filters
    if (filters) {
      if (filters.category) {
        results = results.filter(entry => entry.category === filters.category);
      }
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(entry => 
          filters.tags!.some(tag => entry.tags.includes(tag))
        );
      }
    }

    // Sort by relevance (simplified)
    results.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());

    return results.slice(0, filters?.limit || 10);
  }

  /**
   * Get AI insights about knowledge base
   */
  public generateInsights(): KnowledgeInsight[] {
    this.insights = [];
    
    // Find connection patterns
    this.insights.push(...this.findConnectionPatterns());
    
    // Identify knowledge gaps
    this.insights.push(...this.identifyKnowledgeGaps());
    
    // Find learning opportunities
    this.insights.push(...this.findLearningOpportunities());

    return this.insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get related knowledge for writing context
   */
  public getContextualKnowledge(text: string, limit: number = 5): KnowledgeEntry[] {
    const keywords = this.extractKeywords(text);
    const relatedEntries = new Map<string, number>();

    keywords.forEach(keyword => {
      const results = this.searchKnowledge(keyword, { limit: 3 });
      results.forEach(entry => {
        relatedEntries.set(entry.id, (relatedEntries.get(entry.id) || 0) + 1);
      });
    });

    return Array.from(relatedEntries.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([id]) => this.knowledgeBase.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get knowledge statistics
   */
  public getStatistics(): {
    totalEntries: number;
    categoryCounts: Record<string, number>;
    topTags: { tag: string; count: number }[];
    recentActivity: number;
  } {
    const entries = Array.from(this.knowledgeBase.values());
    const categoryCounts: Record<string, number> = {};
    const tagCounts: Map<string, number> = new Map();

    entries.forEach(entry => {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
      entry.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const recentActivity = entries.filter(entry => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(entry.lastAccessed) > dayAgo;
    }).length;

    return {
      totalEntries: entries.length,
      categoryCounts,
      topTags,
      recentActivity
    };
  }

  /**
   * Semantic search in knowledge base
   */
  public semanticSearch(query: string, options?: {
    limit?: number;
    similarityThreshold?: number;
    categories?: KnowledgeEntry['category'][];
  }): {
    results: KnowledgeEntry[];
    similarity: number[];
    totalFound: number;
  } {
    const results = this.searchKnowledge(query, {
      limit: options?.limit || 10,
      category: options?.categories?.[0]
    });
    
    // Simplified semantic similarity (would use embeddings in real implementation)
    const similarity = results.map(() => Math.random() * 0.5 + 0.5);
    
    return {
      results,
      similarity,
      totalFound: results.length
    };
  }

  // Private helper methods
  private updateSearchIndex(entry: KnowledgeEntry): void {
    const words = [entry.title, entry.content, ...entry.tags]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2);

    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(entry.id);
    });
  }

  private generateConnections(newEntry: KnowledgeEntry): void {
    const entries = Array.from(this.knowledgeBase.values());
    
    entries.forEach(entry => {
      if (entry.id === newEntry.id) return;
      
      const similarity = this.calculateSimilarity(newEntry, entry);
      if (similarity > 0.3) {
        newEntry.connections.push(entry.id);
        entry.connections.push(newEntry.id);
      }
    });
  }

  private calculateSimilarity(entry1: KnowledgeEntry, entry2: KnowledgeEntry): number {
    const tags1 = new Set(entry1.tags);
    const tags2 = new Set(entry2.tags);
    const commonTags = new Set([...tags1].filter(tag => tags2.has(tag)));
    
    const tagSimilarity = commonTags.size / Math.max(tags1.size, tags2.size);
    const categorySimilarity = entry1.category === entry2.category ? 0.2 : 0;
    
    return tagSimilarity + categorySimilarity;
  }

  private findConnectionPatterns(): KnowledgeInsight[] {
    const insights: KnowledgeInsight[] = [];
    const connectionCounts = new Map<string, number>();

    this.knowledgeBase.forEach(entry => {
      entry.connections.forEach(connectionId => {
        const key = [entry.id, connectionId].sort().join('-');
        connectionCounts.set(key, (connectionCounts.get(key) || 0) + 1);
      });
    });

    if (connectionCounts.size > 0) {
      insights.push({
        id: 'pattern-connections',
        type: 'pattern',
        title: 'Strong Knowledge Connections',
        description: `Found ${connectionCounts.size} interconnected knowledge clusters`,
        relatedEntries: [],
        confidence: 0.8
      });
    }

    return insights;
  }

  private identifyKnowledgeGaps(): KnowledgeInsight[] {
    const insights: KnowledgeInsight[] = [];
    const categories = new Set(Array.from(this.knowledgeBase.values()).map(e => e.category));
    
    if (categories.size < 3) {
      insights.push({
        id: 'gap-categories',
        type: 'gap',
        title: 'Limited Knowledge Categories',
        description: 'Consider adding more diverse types of knowledge entries',
        relatedEntries: [],
        confidence: 0.7
      });
    }

    return insights;
  }

  private findLearningOpportunities(): KnowledgeInsight[] {
    const insights: KnowledgeInsight[] = [];
    const tagCounts = new Map<string, number>();

    this.knowledgeBase.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topTags.length > 0) {
      insights.push({
        id: 'opportunity-expand',
        type: 'opportunity',
        title: 'Expand Popular Topics',
        description: `Consider deepening knowledge in: ${topTags.map(([tag]) => tag).join(', ')}`,
        relatedEntries: [],
        confidence: 0.6
      });
    }

    return insights;
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
  }
}

// Export singleton instance
export const personalKnowledgeAI = new PersonalKnowledgeAIService();
