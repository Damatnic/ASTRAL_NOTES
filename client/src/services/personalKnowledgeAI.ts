/**
 * Personal Knowledge AI Service
 * Advanced AI system that builds a comprehensive knowledge base from user's writing
 * Provides intelligent search, insights, and connections across all content
 */

import { EventEmitter } from 'events';

export interface KnowledgeNode {
  id: string;
  type: 'concept' | 'character' | 'location' | 'theme' | 'fact' | 'quote' | 'reference' | 'idea';
  title: string;
  description: string;
  content: string;
  metadata: {
    source_documents: string[];
    confidence: number;
    importance: number;
    frequency: number;
    last_referenced: number;
    created_at: number;
    tags: string[];
    category: string;
  };
  connections: KnowledgeConnection[];
  embeddings?: number[];
  insights: KnowledgeInsight[];
}

export interface KnowledgeConnection {
  target_node_id: string;
  relationship_type: 'related' | 'similar' | 'opposite' | 'causes' | 'part_of' | 'contains' | 'influences' | 'derived_from';
  strength: number; // 0-1
  description: string;
  evidence: ConnectionEvidence[];
  bidirectional: boolean;
  created_at: number;
}

export interface ConnectionEvidence {
  source_document: string;
  context: string;
  confidence: number;
  page_location?: number;
  excerpt: string;
}

export interface KnowledgeInsight {
  type: 'pattern' | 'trend' | 'gap' | 'evolution' | 'contradiction' | 'opportunity';
  title: string;
  description: string;
  supporting_evidence: string[];
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
  created_at: number;
}

export interface KnowledgeGraph {
  id: string;
  name: string;
  description: string;
  nodes: Map<string, KnowledgeNode>;
  central_concepts: string[];
  clusters: KnowledgeCluster[];
  statistics: GraphStatistics;
  last_updated: number;
  version: number;
}

export interface KnowledgeCluster {
  id: string;
  name: string;
  description: string;
  node_ids: string[];
  central_node_id: string;
  cohesion_score: number;
  topic_keywords: string[];
  created_at: number;
}

export interface GraphStatistics {
  total_nodes: number;
  total_connections: number;
  average_connections_per_node: number;
  most_connected_nodes: string[];
  density: number;
  modularity: number;
  growth_rate: number;
}

export interface SemanticSearch {
  query: string;
  results: SearchResult[];
  search_type: 'semantic' | 'keyword' | 'conceptual' | 'contextual';
  filters?: SearchFilters;
  total_results: number;
  execution_time: number;
  suggestions: string[];
}

export interface SearchResult {
  node_id: string;
  relevance_score: number;
  match_type: 'exact' | 'semantic' | 'conceptual' | 'contextual';
  matched_content: string[];
  context: string;
  highlights: string[];
  related_nodes: string[];
}

export interface SearchFilters {
  node_types?: string[];
  date_range?: { start: number; end: number };
  sources?: string[];
  tags?: string[];
  minimum_confidence?: number;
  minimum_importance?: number;
}

export interface KnowledgeQuery {
  id: string;
  query_text: string;
  query_type: 'question' | 'exploration' | 'analysis' | 'synthesis' | 'comparison';
  response: QueryResponse;
  context: QueryContext;
  timestamp: number;
  user_rating?: number;
  follow_up_queries?: string[];
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  supporting_nodes: string[];
  reasoning: string;
  limitations: string[];
  sources: ResponseSource[];
  suggested_actions?: string[];
}

export interface ResponseSource {
  node_id: string;
  document_id: string;
  excerpt: string;
  relevance: number;
  page_reference?: number;
}

export interface QueryContext {
  current_document?: string;
  user_intent: string;
  conversation_history: string[];
  user_expertise_level: 'novice' | 'intermediate' | 'advanced';
  preferred_response_style: 'brief' | 'detailed' | 'analytical' | 'creative';
}

export interface AutoAnalysis {
  id: string;
  analysis_type: 'writing_evolution' | 'theme_analysis' | 'character_development' | 'world_building' | 'style_analysis';
  title: string;
  description: string;
  findings: AnalysisFinding[];
  visualizations: AnalysisVisualization[];
  created_at: number;
  confidence: number;
  actionable_insights: string[];
}

export interface AnalysisFinding {
  category: string;
  observation: string;
  evidence: string[];
  significance: 'low' | 'medium' | 'high';
  trend_direction?: 'improving' | 'stable' | 'declining';
  implications: string[];
}

export interface AnalysisVisualization {
  type: 'timeline' | 'network' | 'hierarchy' | 'distribution' | 'correlation';
  title: string;
  data: any;
  description: string;
  interactive: boolean;
}

export interface PersonalizedRecommendation {
  id: string;
  type: 'writing_direction' | 'skill_development' | 'research_topic' | 'creative_exercise' | 'knowledge_gap';
  title: string;
  description: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_effort: string;
  expected_benefit: string;
  resources: RecommendationResource[];
  success_metrics: string[];
  created_at: number;
  status: 'pending' | 'accepted' | 'dismissed' | 'completed';
}

export interface RecommendationResource {
  type: 'internal' | 'external' | 'exercise' | 'template' | 'reference';
  title: string;
  description: string;
  url?: string;
  content?: string;
}

export interface KnowledgeMetrics {
  total_nodes: number;
  total_connections: number;
  knowledge_density: number;
  growth_velocity: number; // nodes per week
  query_accuracy: number;
  user_satisfaction: number;
  most_accessed_concepts: string[];
  knowledge_gaps_identified: number;
  insights_generated: number;
  recommendations_accepted: number;
}

class PersonalKnowledgeAIService extends EventEmitter {
  private knowledgeGraph: KnowledgeGraph;
  private queries: Map<string, KnowledgeQuery> = new Map();
  private analyses: Map<string, AutoAnalysis> = new Map();
  private recommendations: Map<string, PersonalizedRecommendation> = new Map();
  private processingQueue: string[] = [];
  private isInitialized = false;
  private learningEnabled = true;
  private autoAnalysisEnabled = true;
  private userProfile: {
    expertise_level: 'novice' | 'intermediate' | 'advanced';
    interests: string[];
    writing_goals: string[];
    preferred_communication_style: 'concise' | 'detailed' | 'conversational';
  };

  constructor() {
    super();
    
    this.userProfile = {
      expertise_level: 'intermediate',
      interests: [],
      writing_goals: [],
      preferred_communication_style: 'detailed'
    };

    this.knowledgeGraph = {
      id: 'main_graph',
      name: 'Personal Writing Knowledge',
      description: 'Comprehensive knowledge graph built from user\'s writing',
      nodes: new Map(),
      central_concepts: [],
      clusters: [],
      statistics: {
        total_nodes: 0,
        total_connections: 0,
        average_connections_per_node: 0,
        most_connected_nodes: [],
        density: 0,
        modularity: 0,
        growth_rate: 0
      },
      last_updated: Date.now(),
      version: 1
    };

    this.loadDataFromStorage();
    this.initializeProcessingEngine();
    this.startContinuousLearning();
  }

  private loadDataFromStorage(): void {
    try {
      // Load knowledge graph
      const graph = localStorage.getItem('astral_knowledge_graph');
      if (graph) {
        const graphData = JSON.parse(graph);
        this.knowledgeGraph = {
          ...graphData,
          nodes: new Map(Object.entries(graphData.nodes || {}))
        };
      }

      // Load queries
      const queries = localStorage.getItem('astral_knowledge_queries');
      if (queries) {
        const queryData = JSON.parse(queries);
        Object.entries(queryData).forEach(([id, query]) => {
          this.queries.set(id, query as KnowledgeQuery);
        });
      }

      // Load analyses
      const analyses = localStorage.getItem('astral_auto_analyses');
      if (analyses) {
        const analysisData = JSON.parse(analyses);
        Object.entries(analysisData).forEach(([id, analysis]) => {
          this.analyses.set(id, analysis as AutoAnalysis);
        });
      }

      // Load recommendations
      const recommendations = localStorage.getItem('astral_knowledge_recommendations');
      if (recommendations) {
        const recData = JSON.parse(recommendations);
        Object.entries(recData).forEach(([id, rec]) => {
          this.recommendations.set(id, rec as PersonalizedRecommendation);
        });
      }

      // Load user profile
      const profile = localStorage.getItem('astral_user_profile');
      if (profile) {
        this.userProfile = { ...this.userProfile, ...JSON.parse(profile) };
      }

      // Load settings
      const settings = localStorage.getItem('astral_knowledge_settings');
      if (settings) {
        const settingsData = JSON.parse(settings);
        this.learningEnabled = settingsData.learningEnabled ?? true;
        this.autoAnalysisEnabled = settingsData.autoAnalysisEnabled ?? true;
      }

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to load knowledge AI data:', error);
    }
  }

  private saveDataToStorage(): void {
    try {
      // Save knowledge graph
      const graphData = {
        ...this.knowledgeGraph,
        nodes: Object.fromEntries(this.knowledgeGraph.nodes)
      };
      localStorage.setItem('astral_knowledge_graph', JSON.stringify(graphData));

      // Save queries
      const queries = Object.fromEntries(this.queries);
      localStorage.setItem('astral_knowledge_queries', JSON.stringify(queries));

      // Save analyses
      const analyses = Object.fromEntries(this.analyses);
      localStorage.setItem('astral_auto_analyses', JSON.stringify(analyses));

      // Save recommendations
      const recommendations = Object.fromEntries(this.recommendations);
      localStorage.setItem('astral_knowledge_recommendations', JSON.stringify(recommendations));

      // Save user profile
      localStorage.setItem('astral_user_profile', JSON.stringify(this.userProfile));

      // Save settings
      const settings = {
        learningEnabled: this.learningEnabled,
        autoAnalysisEnabled: this.autoAnalysisEnabled
      };
      localStorage.setItem('astral_knowledge_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save knowledge AI data:', error);
    }
  }

  private initializeProcessingEngine(): void {
    // Process documents in queue
    setInterval(() => {
      if (this.processingQueue.length > 0 && this.learningEnabled) {
        const documentId = this.processingQueue.shift();
        if (documentId) {
          this.processDocument(documentId);
        }
      }
    }, 5000); // Every 5 seconds

    // Update knowledge graph statistics
    setInterval(() => {
      this.updateGraphStatistics();
    }, 300000); // Every 5 minutes

    // Generate automatic analyses
    setInterval(() => {
      if (this.autoAnalysisEnabled) {
        this.generateAutomaticAnalyses();
      }
    }, 3600000); // Every hour
  }

  private startContinuousLearning(): void {
    // Continuous learning from user interactions
    setInterval(() => {
      if (this.learningEnabled) {
        this.refineConcepts();
        this.strengthenConnections();
        this.identifyKnowledgeGaps();
        this.generatePersonalizedRecommendations();
      }
    }, 1800000); // Every 30 minutes
  }

  public async processDocumentContent(documentId: string, content: string, metadata: any = {}): Promise<void> {
    if (!this.learningEnabled) return;

    this.processingQueue.push(documentId);
    
    // Immediate processing for small documents
    if (content.length < 5000) {
      this.processDocument(documentId);
    }

    this.emit('documentQueued', { documentId, contentLength: content.length });
  }

  private async processDocument(documentId: string): Promise<void> {
    try {
      // Load document content
      const content = await this.loadDocumentContent(documentId);
      if (!content) return;

      // Extract concepts, entities, and ideas
      const extractedConcepts = await this.extractConcepts(content, documentId);
      
      // Process each concept
      for (const concept of extractedConcepts) {
        await this.processKnowledgeNode(concept);
      }

      // Identify connections between concepts
      await this.identifyConnections(extractedConcepts, documentId);

      // Update graph structure
      this.updateGraphClusters();
      this.updateCentralConcepts();

      this.knowledgeGraph.last_updated = Date.now();
      this.saveDataToStorage();
      
      this.emit('documentProcessed', { documentId, conceptsExtracted: extractedConcepts.length });
    } catch (error) {
      this.emit('processingError', { documentId, error });
    }
  }

  private async loadDocumentContent(documentId: string): Promise<string | null> {
    try {
      // Load from localStorage
      const storyData = localStorage.getItem(`astral_story_${documentId}`);
      if (storyData) {
        const story = JSON.parse(storyData);
        return story.content || '';
      }
      return null;
    } catch (error) {
      console.error('Failed to load document content:', error);
      return null;
    }
  }

  private async extractConcepts(content: string, sourceDocumentId: string): Promise<Partial<KnowledgeNode>[]> {
    const concepts: Partial<KnowledgeNode>[] = [];

    // Extract different types of concepts
    const characters = this.extractCharacters(content, sourceDocumentId);
    const locations = this.extractLocations(content, sourceDocumentId);
    const themes = this.extractThemes(content, sourceDocumentId);
    const ideas = this.extractIdeas(content, sourceDocumentId);
    const facts = this.extractFacts(content, sourceDocumentId);
    const quotes = this.extractQuotes(content, sourceDocumentId);

    concepts.push(...characters, ...locations, ...themes, ...ideas, ...facts, ...quotes);

    return concepts;
  }

  private extractCharacters(content: string, sourceDocumentId: string): Partial<KnowledgeNode>[] {
    const characters: Partial<KnowledgeNode>[] = [];
    
    // Simple character extraction based on patterns
    // In a real implementation, this would use NLP/ML
    const characterPatterns = [
      /([A-Z][a-z]+)\s+(said|replied|thought|felt|walked|ran|smiled)/g,
      /(?:Character|protagonist|hero|villain|person)\s+named\s+([A-Z][a-z]+)/gi
    ];

    const foundCharacters = new Set<string>();

    characterPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        if (name && name.length > 2 && !foundCharacters.has(name)) {
          foundCharacters.add(name);
          
          characters.push({
            type: 'character',
            title: name,
            description: `Character identified in ${sourceDocumentId}`,
            content: this.extractCharacterContext(content, name),
            metadata: {
              source_documents: [sourceDocumentId],
              confidence: 0.7,
              importance: 0.6,
              frequency: (content.match(new RegExp(name, 'gi')) || []).length,
              last_referenced: Date.now(),
              created_at: Date.now(),
              tags: ['character', 'person'],
              category: 'narrative'
            },
            connections: [],
            insights: []
          });
        }
      }
    });

    return characters;
  }

  private extractCharacterContext(content: string, characterName: string): string {
    // Extract sentences containing the character name
    const sentences = content.split(/[.!?]+/);
    const characterSentences = sentences
      .filter(sentence => sentence.toLowerCase().includes(characterName.toLowerCase()))
      .slice(0, 3); // Take first 3 mentions
    
    return characterSentences.join('. ').trim();
  }

  private extractLocations(content: string, sourceDocumentId: string): Partial<KnowledgeNode>[] {
    const locations: Partial<KnowledgeNode>[] = [];
    
    // Location extraction patterns
    const locationPatterns = [
      /(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:,|\.|\s)/g,
      /(?:city|town|village|place|location)\s+(?:of\s+|called\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi
    ];

    const commonLocations = ['New York', 'London', 'Paris', 'Tokyo', 'Berlin', 'Sydney', 'Rome'];
    const foundLocations = new Set<string>();

    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const location = match[1]?.trim();
        if (location && location.length > 2 && !foundLocations.has(location)) {
          foundLocations.add(location);
          
          const isCommonLocation = commonLocations.some(common => 
            location.toLowerCase().includes(common.toLowerCase())
          );

          locations.push({
            type: 'location',
            title: location,
            description: `Location referenced in ${sourceDocumentId}`,
            content: this.extractLocationContext(content, location),
            metadata: {
              source_documents: [sourceDocumentId],
              confidence: isCommonLocation ? 0.8 : 0.6,
              importance: 0.5,
              frequency: (content.match(new RegExp(location, 'gi')) || []).length,
              last_referenced: Date.now(),
              created_at: Date.now(),
              tags: ['location', 'setting'],
              category: 'world_building'
            },
            connections: [],
            insights: []
          });
        }
      }
    });

    return locations;
  }

  private extractLocationContext(content: string, location: string): string {
    const sentences = content.split(/[.!?]+/);
    const locationSentences = sentences
      .filter(sentence => sentence.toLowerCase().includes(location.toLowerCase()))
      .slice(0, 2);
    
    return locationSentences.join('. ').trim();
  }

  private extractThemes(content: string, sourceDocumentId: string): Partial<KnowledgeNode>[] {
    const themes: Partial<KnowledgeNode>[] = [];
    
    // Theme keywords and their associated concepts
    const themeKeywords = {
      'love': ['love', 'romance', 'affection', 'heart', 'beloved', 'relationship'],
      'betrayal': ['betrayal', 'betray', 'deceive', 'deception', 'trust', 'loyalty'],
      'redemption': ['redemption', 'forgiveness', 'second chance', 'atonement', 'salvation'],
      'power': ['power', 'authority', 'control', 'dominance', 'influence', 'leadership'],
      'identity': ['identity', 'self', 'who am i', 'purpose', 'belonging', 'self-discovery'],
      'freedom': ['freedom', 'liberty', 'independence', 'escape', 'chains', 'prison'],
      'sacrifice': ['sacrifice', 'give up', 'loss', 'selfless', 'noble', 'duty']
    };

    Object.entries(themeKeywords).forEach(([themeName, keywords]) => {
      const themeScore = this.calculateThemePresence(content, keywords);
      
      if (themeScore > 0.3) {
        themes.push({
          type: 'theme',
          title: themeName.charAt(0).toUpperCase() + themeName.slice(1),
          description: `Theme of ${themeName} identified in ${sourceDocumentId}`,
          content: this.extractThemeContext(content, keywords),
          metadata: {
            source_documents: [sourceDocumentId],
            confidence: themeScore,
            importance: themeScore,
            frequency: keywords.reduce((sum, keyword) => 
              sum + (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length, 0
            ),
            last_referenced: Date.now(),
            created_at: Date.now(),
            tags: ['theme', 'concept', themeName],
            category: 'literary_analysis'
          },
          connections: [],
          insights: []
        });
      }
    });

    return themes;
  }

  private calculateThemePresence(content: string, keywords: string[]): number {
    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;
    
    let totalMatches = 0;
    keywords.forEach(keyword => {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      totalMatches += matches;
    });

    return Math.min(1.0, (totalMatches / wordCount) * 100);
  }

  private extractThemeContext(content: string, keywords: string[]): string {
    const sentences = content.split(/[.!?]+/);
    const themeSentences = sentences
      .filter(sentence => 
        keywords.some(keyword => sentence.toLowerCase().includes(keyword))
      )
      .slice(0, 3);
    
    return themeSentences.join('. ').trim();
  }

  private extractIdeas(content: string, sourceDocumentId: string): Partial<KnowledgeNode>[] {
    const ideas: Partial<KnowledgeNode>[] = [];
    
    // Extract sentences that seem to contain ideas or insights
    const ideaPatterns = [
      /(?:I think|I believe|It seems|Perhaps|What if|Consider that|The idea is)\s+([^.!?]+)/gi,
      /(?:This suggests|This implies|This means)\s+([^.!?]+)/gi
    ];

    ideaPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const ideaText = match[1]?.trim();
        if (ideaText && ideaText.length > 10) {
          ideas.push({
            type: 'idea',
            title: this.generateIdeaTitle(ideaText),
            description: `Idea extracted from ${sourceDocumentId}`,
            content: ideaText,
            metadata: {
              source_documents: [sourceDocumentId],
              confidence: 0.6,
              importance: 0.7,
              frequency: 1,
              last_referenced: Date.now(),
              created_at: Date.now(),
              tags: ['idea', 'insight', 'thought'],
              category: 'creativity'
            },
            connections: [],
            insights: []
          });
        }
      }
    });

    return ideas;
  }

  private generateIdeaTitle(ideaText: string): string {
    // Generate a title from the idea text
    const words = ideaText.split(/\s+/).slice(0, 5);
    return words.join(' ') + (ideaText.split(/\s+/).length > 5 ? '...' : '');
  }

  private extractFacts(content: string, sourceDocumentId: string): Partial<KnowledgeNode>[] {
    const facts: Partial<KnowledgeNode>[] = [];
    
    // Extract factual statements
    const factPatterns = [
      /([A-Z][^.!?]*(?:is|was|are|were|has|have|had|will|would|can|could|should)\s+[^.!?]+)/g,
      /(?:The fact is|It is true that|Research shows|Studies indicate)\s+([^.!?]+)/gi
    ];

    factPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const factText = match[1]?.trim();
        if (factText && factText.length > 15 && factText.length < 200) {
          facts.push({
            type: 'fact',
            title: this.generateFactTitle(factText),
            description: `Fact extracted from ${sourceDocumentId}`,
            content: factText,
            metadata: {
              source_documents: [sourceDocumentId],
              confidence: 0.8,
              importance: 0.5,
              frequency: 1,
              last_referenced: Date.now(),
              created_at: Date.now(),
              tags: ['fact', 'information', 'data'],
              category: 'knowledge'
            },
            connections: [],
            insights: []
          });
        }
      }
    });

    return facts;
  }

  private generateFactTitle(factText: string): string {
    const words = factText.split(/\s+/).slice(0, 6);
    return words.join(' ') + (factText.split(/\s+/).length > 6 ? '...' : '');
  }

  private extractQuotes(content: string, sourceDocumentId: string): Partial<KnowledgeNode>[] {
    const quotes: Partial<KnowledgeNode>[] = [];
    
    // Extract quoted text
    const quotePattern = /"([^"]{10,200})"/g;
    
    let match;
    while ((match = quotePattern.exec(content)) !== null) {
      const quoteText = match[1]?.trim();
      if (quoteText) {
        quotes.push({
          type: 'quote',
          title: this.generateQuoteTitle(quoteText),
          description: `Quote from ${sourceDocumentId}`,
          content: quoteText,
          metadata: {
            source_documents: [sourceDocumentId],
            confidence: 0.9,
            importance: 0.6,
            frequency: 1,
            last_referenced: Date.now(),
            created_at: Date.now(),
            tags: ['quote', 'dialogue', 'speech'],
            category: 'dialogue'
          },
          connections: [],
          insights: []
        });
      }
    }

    return quotes;
  }

  private generateQuoteTitle(quoteText: string): string {
    const words = quoteText.split(/\s+/).slice(0, 4);
    return `"${words.join(' ')}${quoteText.split(/\s+/).length > 4 ? '..."' : '"'}`;
  }

  private async processKnowledgeNode(concept: Partial<KnowledgeNode>): Promise<void> {
    if (!concept.title || !concept.type) return;

    const nodeId = this.generateNodeId(concept.title, concept.type);
    
    // Check if node already exists
    const existingNode = this.knowledgeGraph.nodes.get(nodeId);
    
    if (existingNode) {
      // Update existing node
      this.updateExistingNode(existingNode, concept);
    } else {
      // Create new node
      const newNode: KnowledgeNode = {
        id: nodeId,
        type: concept.type!,
        title: concept.title!,
        description: concept.description || '',
        content: concept.content || '',
        metadata: concept.metadata || {
          source_documents: [],
          confidence: 0.5,
          importance: 0.5,
          frequency: 1,
          last_referenced: Date.now(),
          created_at: Date.now(),
          tags: [],
          category: 'general'
        },
        connections: [],
        insights: []
      };
      
      this.knowledgeGraph.nodes.set(nodeId, newNode);
    }
  }

  private generateNodeId(title: string, type: string): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${type}_${cleanTitle}_${Date.now().toString(36)}`;
  }

  private updateExistingNode(existingNode: KnowledgeNode, newConcept: Partial<KnowledgeNode>): void {
    // Merge source documents
    if (newConcept.metadata?.source_documents) {
      newConcept.metadata.source_documents.forEach(doc => {
        if (!existingNode.metadata.source_documents.includes(doc)) {
          existingNode.metadata.source_documents.push(doc);
        }
      });
    }

    // Update frequency and importance
    existingNode.metadata.frequency += 1;
    existingNode.metadata.importance = Math.min(1.0, existingNode.metadata.importance + 0.1);
    existingNode.metadata.last_referenced = Date.now();

    // Merge content if new content is longer
    if (newConcept.content && newConcept.content.length > existingNode.content.length) {
      existingNode.content = newConcept.content;
    }

    // Merge tags
    if (newConcept.metadata?.tags) {
      newConcept.metadata.tags.forEach(tag => {
        if (!existingNode.metadata.tags.includes(tag)) {
          existingNode.metadata.tags.push(tag);
        }
      });
    }
  }

  private async identifyConnections(concepts: Partial<KnowledgeNode>[], sourceDocumentId: string): Promise<void> {
    // Create connections between concepts that appear in the same document
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const concept1 = concepts[i];
        const concept2 = concepts[j];
        
        if (concept1.title && concept2.title) {
          await this.createConnection(concept1.title, concept2.title, 'related', sourceDocumentId);
        }
      }
    }
  }

  private async createConnection(title1: string, title2: string, relationshipType: KnowledgeConnection['relationship_type'], sourceDocument: string): Promise<void> {
    const node1Id = this.findNodeIdByTitle(title1);
    const node2Id = this.findNodeIdByTitle(title2);
    
    if (!node1Id || !node2Id) return;

    const node1 = this.knowledgeGraph.nodes.get(node1Id);
    const node2 = this.knowledgeGraph.nodes.get(node2Id);
    
    if (!node1 || !node2) return;

    // Check if connection already exists
    const existingConnection = node1.connections.find(conn => conn.target_node_id === node2Id);
    
    if (existingConnection) {
      // Strengthen existing connection
      existingConnection.strength = Math.min(1.0, existingConnection.strength + 0.1);
      existingConnection.evidence.push({
        source_document: sourceDocument,
        context: `Co-occurrence in ${sourceDocument}`,
        confidence: 0.7,
        excerpt: `${title1} and ${title2} appear together`
      });
    } else {
      // Create new connection
      const connection: KnowledgeConnection = {
        target_node_id: node2Id,
        relationship_type: relationshipType,
        strength: 0.5,
        description: `${title1} is ${relationshipType} to ${title2}`,
        evidence: [{
          source_document: sourceDocument,
          context: `Co-occurrence in ${sourceDocument}`,
          confidence: 0.7,
          excerpt: `${title1} and ${title2} appear together`
        }],
        bidirectional: true,
        created_at: Date.now()
      };
      
      node1.connections.push(connection);
      
      // Add reverse connection if bidirectional
      if (connection.bidirectional) {
        const reverseConnection: KnowledgeConnection = {
          ...connection,
          target_node_id: node1Id,
          description: `${title2} is ${relationshipType} to ${title1}`
        };
        node2.connections.push(reverseConnection);
      }
    }
  }

  private findNodeIdByTitle(title: string): string | null {
    for (const [nodeId, node] of this.knowledgeGraph.nodes) {
      if (node.title.toLowerCase() === title.toLowerCase()) {
        return nodeId;
      }
    }
    return null;
  }

  private updateGraphClusters(): void {
    // Simple clustering based on connection strength
    const clusters = new Map<string, Set<string>>();
    const visited = new Set<string>();
    
    this.knowledgeGraph.nodes.forEach((node, nodeId) => {
      if (!visited.has(nodeId)) {
        const cluster = this.findConnectedCluster(nodeId, visited);
        if (cluster.size > 2) { // Only create clusters with 3+ nodes
          const clusterId = this.generateId('cluster');
          clusters.set(clusterId, cluster);
        }
      }
    });

    // Update graph clusters
    this.knowledgeGraph.clusters = Array.from(clusters.entries()).map(([clusterId, nodeIds]) => {
      const nodeIdsArray = Array.from(nodeIds);
      const centralNode = this.findCentralNodeInCluster(nodeIdsArray);
      const keywords = this.extractClusterKeywords(nodeIdsArray);
      
      return {
        id: clusterId,
        name: keywords.slice(0, 3).join(', '),
        description: `Cluster of ${nodeIdsArray.length} related concepts`,
        node_ids: nodeIdsArray,
        central_node_id: centralNode,
        cohesion_score: this.calculateCohesionScore(nodeIdsArray),
        topic_keywords: keywords,
        created_at: Date.now()
      };
    });
  }

  private findConnectedCluster(startNodeId: string, visited: Set<string>): Set<string> {
    const cluster = new Set<string>();
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      cluster.add(nodeId);
      
      const node = this.knowledgeGraph.nodes.get(nodeId);
      if (node) {
        node.connections.forEach(conn => {
          if (conn.strength > 0.6 && !visited.has(conn.target_node_id)) {
            queue.push(conn.target_node_id);
          }
        });
      }
    }
    
    return cluster;
  }

  private findCentralNodeInCluster(nodeIds: string[]): string {
    let maxConnections = 0;
    let centralNode = nodeIds[0];
    
    nodeIds.forEach(nodeId => {
      const node = this.knowledgeGraph.nodes.get(nodeId);
      if (node) {
        const connectionCount = node.connections.length;
        if (connectionCount > maxConnections) {
          maxConnections = connectionCount;
          centralNode = nodeId;
        }
      }
    });
    
    return centralNode;
  }

  private extractClusterKeywords(nodeIds: string[]): string[] {
    const keywords = new Set<string>();
    
    nodeIds.forEach(nodeId => {
      const node = this.knowledgeGraph.nodes.get(nodeId);
      if (node) {
        node.metadata.tags.forEach(tag => keywords.add(tag));
        keywords.add(node.type);
      }
    });
    
    return Array.from(keywords);
  }

  private calculateCohesionScore(nodeIds: string[]): number {
    let totalConnections = 0;
    let internalConnections = 0;
    
    nodeIds.forEach(nodeId => {
      const node = this.knowledgeGraph.nodes.get(nodeId);
      if (node) {
        totalConnections += node.connections.length;
        internalConnections += node.connections.filter(conn => 
          nodeIds.includes(conn.target_node_id)
        ).length;
      }
    });
    
    return totalConnections > 0 ? internalConnections / totalConnections : 0;
  }

  private updateCentralConcepts(): void {
    // Identify most connected and important nodes
    const nodeScores = new Map<string, number>();
    
    this.knowledgeGraph.nodes.forEach((node, nodeId) => {
      const connectionsScore = node.connections.length * 0.3;
      const importanceScore = node.metadata.importance * 0.4;
      const frequencyScore = Math.min(node.metadata.frequency / 10, 1) * 0.3;
      
      const totalScore = connectionsScore + importanceScore + frequencyScore;
      nodeScores.set(nodeId, totalScore);
    });
    
    // Sort by score and take top 10
    this.knowledgeGraph.central_concepts = Array.from(nodeScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([nodeId]) => nodeId);
  }

  private updateGraphStatistics(): void {
    const stats = this.knowledgeGraph.statistics;
    
    stats.total_nodes = this.knowledgeGraph.nodes.size;
    stats.total_connections = Array.from(this.knowledgeGraph.nodes.values())
      .reduce((sum, node) => sum + node.connections.length, 0);
    
    stats.average_connections_per_node = stats.total_nodes > 0 
      ? stats.total_connections / stats.total_nodes 
      : 0;
    
    // Calculate density (actual connections / possible connections)
    const maxPossibleConnections = stats.total_nodes * (stats.total_nodes - 1);
    stats.density = maxPossibleConnections > 0 
      ? stats.total_connections / maxPossibleConnections 
      : 0;
    
    // Update most connected nodes
    const connectionCounts = Array.from(this.knowledgeGraph.nodes.entries())
      .map(([nodeId, node]) => ({ nodeId, count: node.connections.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    stats.most_connected_nodes = connectionCounts.map(item => item.nodeId);
    
    // Calculate growth rate (nodes added in last week)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentNodes = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.metadata.created_at > oneWeekAgo);
    
    stats.growth_rate = recentNodes.length;
  }

  public async askQuestion(question: string, context?: QueryContext): Promise<KnowledgeQuery> {
    const queryId = this.generateId('query');
    
    const query: KnowledgeQuery = {
      id: queryId,
      query_text: question,
      query_type: this.classifyQueryType(question),
      response: await this.generateResponse(question, context),
      context: context || {
        user_intent: 'information_seeking',
        conversation_history: [],
        user_expertise_level: this.userProfile.expertise_level,
        preferred_response_style: this.userProfile.preferred_communication_style
      },
      timestamp: Date.now()
    };
    
    this.queries.set(queryId, query);
    this.saveDataToStorage();
    this.emit('questionAnswered', query);
    
    return query;
  }

  private classifyQueryType(question: string): KnowledgeQuery['query_type'] {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('compare') || questionLower.includes('difference') || questionLower.includes('versus')) {
      return 'comparison';
    }
    
    if (questionLower.includes('analyze') || questionLower.includes('examine') || questionLower.includes('study')) {
      return 'analysis';
    }
    
    if (questionLower.includes('combine') || questionLower.includes('synthesize') || questionLower.includes('merge')) {
      return 'synthesis';
    }
    
    if (questionLower.includes('explore') || questionLower.includes('investigate') || questionLower.includes('discover')) {
      return 'exploration';
    }
    
    return 'question';
  }

  private async generateResponse(question: string, context?: QueryContext): Promise<QueryResponse> {
    // Simple response generation - in a real implementation, this would use advanced NLP
    const relevantNodes = await this.findRelevantNodes(question);
    
    const answer = this.constructAnswer(question, relevantNodes);
    const confidence = this.calculateResponseConfidence(question, relevantNodes);
    
    return {
      answer,
      confidence,
      supporting_nodes: relevantNodes.map(node => node.id),
      reasoning: this.generateReasoning(question, relevantNodes),
      limitations: this.identifyLimitations(question, relevantNodes),
      sources: this.generateSources(relevantNodes),
      suggested_actions: this.generateSuggestedActions(question, relevantNodes)
    };
  }

  private async findRelevantNodes(question: string): Promise<KnowledgeNode[]> {
    const questionWords = question.toLowerCase().split(/\s+/);
    const relevantNodes: { node: KnowledgeNode; score: number }[] = [];
    
    this.knowledgeGraph.nodes.forEach(node => {
      let score = 0;
      
      // Check title match
      questionWords.forEach(word => {
        if (node.title.toLowerCase().includes(word)) {
          score += 2;
        }
        if (node.content.toLowerCase().includes(word)) {
          score += 1;
        }
        if (node.metadata.tags.some(tag => tag.toLowerCase().includes(word))) {
          score += 1.5;
        }
      });
      
      // Boost score for important nodes
      score *= (1 + node.metadata.importance);
      
      if (score > 0) {
        relevantNodes.push({ node, score });
      }
    });
    
    return relevantNodes
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.node);
  }

  private constructAnswer(question: string, relevantNodes: KnowledgeNode[]): string {
    if (relevantNodes.length === 0) {
      return "I don't have enough information in your knowledge base to answer this question accurately.";
    }
    
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('who') || questionLower.includes('character')) {
      const characters = relevantNodes.filter(node => node.type === 'character');
      if (characters.length > 0) {
        const char = characters[0];
        return `Based on your writing, ${char.title} ${char.content}`;
      }
    }
    
    if (questionLower.includes('where') || questionLower.includes('location')) {
      const locations = relevantNodes.filter(node => node.type === 'location');
      if (locations.length > 0) {
        const loc = locations[0];
        return `The location ${loc.title} appears in your writing: ${loc.content}`;
      }
    }
    
    if (questionLower.includes('theme') || questionLower.includes('meaning')) {
      const themes = relevantNodes.filter(node => node.type === 'theme');
      if (themes.length > 0) {
        const theme = themes[0];
        return `The theme of ${theme.title} is present in your work: ${theme.content}`;
      }
    }
    
    // General answer
    const topNode = relevantNodes[0];
    return `Based on your writing, here's what I found about ${topNode.title}: ${topNode.content}`;
  }

  private calculateResponseConfidence(question: string, relevantNodes: KnowledgeNode[]): number {
    if (relevantNodes.length === 0) return 0.1;
    
    const avgNodeConfidence = relevantNodes.reduce((sum, node) => sum + node.metadata.confidence, 0) / relevantNodes.length;
    const relevanceScore = Math.min(relevantNodes.length / 5, 1); // More relevant nodes = higher confidence
    
    return (avgNodeConfidence + relevanceScore) / 2;
  }

  private generateReasoning(question: string, relevantNodes: KnowledgeNode[]): string {
    return `I found this information by searching through ${relevantNodes.length} relevant concepts in your knowledge base, with a focus on ${relevantNodes.slice(0, 3).map(n => n.type).join(', ')} types.`;
  }

  private identifyLimitations(question: string, relevantNodes: KnowledgeNode[]): string[] {
    const limitations = [];
    
    if (relevantNodes.length < 3) {
      limitations.push('Limited information available on this topic in your knowledge base');
    }
    
    const avgConfidence = relevantNodes.reduce((sum, node) => sum + node.metadata.confidence, 0) / relevantNodes.length;
    if (avgConfidence < 0.7) {
      limitations.push('The confidence level of available information is moderate');
    }
    
    if (relevantNodes.every(node => node.metadata.source_documents.length === 1)) {
      limitations.push('Information is based on limited source documents');
    }
    
    return limitations;
  }

  private generateSources(relevantNodes: KnowledgeNode[]): ResponseSource[] {
    return relevantNodes.slice(0, 5).map(node => ({
      node_id: node.id,
      document_id: node.metadata.source_documents[0] || 'unknown',
      excerpt: node.content.substring(0, 100) + '...',
      relevance: node.metadata.confidence
    }));
  }

  private generateSuggestedActions(question: string, relevantNodes: KnowledgeNode[]): string[] {
    const actions = [];
    
    if (relevantNodes.length < 3) {
      actions.push('Consider writing more content related to this topic');
    }
    
    const connectedNodes = relevantNodes.filter(node => node.connections.length > 0);
    if (connectedNodes.length > 0) {
      actions.push('Explore related concepts in your knowledge base');
    }
    
    if (relevantNodes.some(node => node.type === 'character')) {
      actions.push('Develop character relationships and interactions further');
    }
    
    return actions;
  }

  public async performSemanticSearch(query: string, filters?: SearchFilters): Promise<SemanticSearch> {
    const startTime = Date.now();
    
    const results = await this.findRelevantNodes(query);
    const searchResults: SearchResult[] = results.map((node, index) => ({
      node_id: node.id,
      relevance_score: (results.length - index) / results.length,
      match_type: 'semantic',
      matched_content: [node.content],
      context: node.description,
      highlights: this.generateHighlights(query, node.content),
      related_nodes: node.connections.slice(0, 3).map(conn => conn.target_node_id)
    }));

    const executionTime = Date.now() - startTime;

    return {
      query,
      results: searchResults,
      search_type: 'semantic',
      filters,
      total_results: searchResults.length,
      execution_time: executionTime,
      suggestions: this.generateSearchSuggestions(query, searchResults)
    };
  }

  private generateHighlights(query: string, content: string): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const highlights = [];
    
    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        highlights.push(...matches);
      }
    });
    
    return [...new Set(highlights)]; // Remove duplicates
  }

  private generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
    const suggestions = [];
    
    // Suggest related concepts
    results.slice(0, 3).forEach(result => {
      result.related_nodes.forEach(nodeId => {
        const node = this.knowledgeGraph.nodes.get(nodeId);
        if (node) {
          suggestions.push(`Search for "${node.title}"`);
        }
      });
    });
    
    // Suggest broader/narrower searches
    suggestions.push(`Broader search: "${query.split(' ').slice(0, -1).join(' ')}"`);
    suggestions.push(`More specific: "${query} details"`);
    
    return suggestions.slice(0, 5);
  }

  private generateAutomaticAnalyses(): void {
    const analyses: AutoAnalysis[] = [];
    
    // Writing evolution analysis
    if (this.shouldPerformAnalysis('writing_evolution')) {
      analyses.push(this.analyzeWritingEvolution());
    }
    
    // Theme analysis
    if (this.shouldPerformAnalysis('theme_analysis')) {
      analyses.push(this.analyzeThemes());
    }
    
    // Character development analysis
    if (this.shouldPerformAnalysis('character_development')) {
      analyses.push(this.analyzeCharacterDevelopment());
    }
    
    analyses.forEach(analysis => {
      this.analyses.set(analysis.id, analysis);
    });
    
    if (analyses.length > 0) {
      this.emit('analysesGenerated', analyses);
      this.saveDataToStorage();
    }
  }

  private shouldPerformAnalysis(analysisType: string): boolean {
    // Check if enough time has passed since last analysis
    const lastAnalysis = Array.from(this.analyses.values())
      .filter(a => a.analysis_type === analysisType)
      .sort((a, b) => b.created_at - a.created_at)[0];
    
    if (!lastAnalysis) return true;
    
    const daysSinceLastAnalysis = (Date.now() - lastAnalysis.created_at) / (24 * 60 * 60 * 1000);
    return daysSinceLastAnalysis > 7; // Weekly analyses
  }

  private analyzeWritingEvolution(): AutoAnalysis {
    const characters = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'character');
    
    const themes = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'theme');
    
    return {
      id: this.generateId('analysis'),
      analysis_type: 'writing_evolution',
      title: 'Writing Evolution Analysis',
      description: 'Analysis of how your writing style and themes have evolved over time',
      findings: [
        {
          category: 'Character Development',
          observation: `You have developed ${characters.length} distinct characters`,
          evidence: characters.slice(0, 3).map(c => c.title),
          significance: 'medium',
          implications: ['Shows strong character creation skills', 'Indicates narrative complexity']
        },
        {
          category: 'Thematic Depth',
          observation: `${themes.length} recurring themes identified`,
          evidence: themes.slice(0, 3).map(t => t.title),
          significance: 'high',
          trend_direction: 'improving',
          implications: ['Demonstrates thematic consistency', 'Shows deep thinking about subject matter']
        }
      ],
      visualizations: [],
      created_at: Date.now(),
      confidence: 0.8,
      actionable_insights: [
        'Continue developing character relationships',
        'Explore contrasting themes for narrative tension'
      ]
    };
  }

  private analyzeThemes(): AutoAnalysis {
    const themes = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'theme')
      .sort((a, b) => b.metadata.frequency - a.metadata.frequency);
    
    return {
      id: this.generateId('analysis'),
      analysis_type: 'theme_analysis',
      title: 'Thematic Analysis',
      description: 'Deep dive into the themes present in your writing',
      findings: [
        {
          category: 'Dominant Themes',
          observation: `Your most prominent theme is ${themes[0]?.title || 'undefined'}`,
          evidence: themes.slice(0, 3).map(t => `${t.title} (${t.metadata.frequency} occurrences)`),
          significance: 'high',
          implications: ['Reflects your core interests', 'Provides thematic consistency']
        }
      ],
      visualizations: [{
        type: 'distribution',
        title: 'Theme Frequency Distribution',
        data: themes.slice(0, 10).map(t => ({ name: t.title, value: t.metadata.frequency })),
        description: 'Distribution of themes across your writing',
        interactive: true
      }],
      created_at: Date.now(),
      confidence: 0.85,
      actionable_insights: [
        'Develop underrepresented themes',
        'Create thematic contrasts for depth'
      ]
    };
  }

  private analyzeCharacterDevelopment(): AutoAnalysis {
    const characters = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'character');
    
    return {
      id: this.generateId('analysis'),
      analysis_type: 'character_development',
      title: 'Character Development Analysis',
      description: 'Analysis of character creation and development patterns',
      findings: [
        {
          category: 'Character Count',
          observation: `You have created ${characters.length} characters`,
          evidence: characters.slice(0, 5).map(c => c.title),
          significance: 'medium',
          implications: ['Shows narrative scope', 'Indicates storytelling ambition']
        }
      ],
      visualizations: [{
        type: 'network',
        title: 'Character Relationship Network',
        data: this.generateCharacterNetwork(characters),
        description: 'Connections between characters in your stories',
        interactive: true
      }],
      created_at: Date.now(),
      confidence: 0.75,
      actionable_insights: [
        'Develop character backstories',
        'Create more complex character relationships'
      ]
    };
  }

  private generateCharacterNetwork(characters: KnowledgeNode[]): any {
    return {
      nodes: characters.map(char => ({
        id: char.id,
        name: char.title,
        connections: char.connections.length
      })),
      links: characters.flatMap(char =>
        char.connections
          .filter(conn => characters.some(c => c.id === conn.target_node_id))
          .map(conn => ({
            source: char.id,
            target: conn.target_node_id,
            strength: conn.strength
          }))
      )
    };
  }

  private refineConcepts(): void {
    // Refine concept accuracy and connections based on usage patterns
    this.knowledgeGraph.nodes.forEach(node => {
      // Increase confidence for frequently accessed nodes
      if (node.metadata.frequency > 5) {
        node.metadata.confidence = Math.min(1.0, node.metadata.confidence + 0.05);
      }
      
      // Refine connections based on co-occurrence
      node.connections.forEach(connection => {
        const targetNode = this.knowledgeGraph.nodes.get(connection.target_node_id);
        if (targetNode) {
          const commonSources = node.metadata.source_documents.filter(doc =>
            targetNode.metadata.source_documents.includes(doc)
          );
          
          if (commonSources.length > 1) {
            connection.strength = Math.min(1.0, connection.strength + 0.1);
          }
        }
      });
    });
  }

  private strengthenConnections(): void {
    // Strengthen connections based on recent evidence
    const recentThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 1 week
    
    this.knowledgeGraph.nodes.forEach(node => {
      node.connections.forEach(connection => {
        const recentEvidence = connection.evidence.filter(ev =>
          ev.source_document && this.isDocumentRecent(ev.source_document, recentThreshold)
        );
        
        if (recentEvidence.length > 0) {
          connection.strength = Math.min(1.0, connection.strength + 0.05);
        }
      });
    });
  }

  private isDocumentRecent(documentId: string, threshold: number): boolean {
    // Check if document was modified recently
    try {
      const storyData = localStorage.getItem(`astral_story_${documentId}`);
      if (storyData) {
        const story = JSON.parse(storyData);
        return (story.updatedAt || story.createdAt || 0) > threshold;
      }
    } catch (error) {
      console.error('Error checking document recency:', error);
    }
    return false;
  }

  private identifyKnowledgeGaps(): void {
    // Identify areas where more information could be beneficial
    const gaps: string[] = [];
    
    // Look for concepts with few connections
    this.knowledgeGraph.nodes.forEach(node => {
      if (node.connections.length < 2 && node.metadata.importance > 0.6) {
        gaps.push(`More connections needed for ${node.title}`);
      }
    });
    
    // Look for themes with low development
    const themes = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'theme');
    
    if (themes.length < 3) {
      gaps.push('Limited thematic diversity detected');
    }
    
    if (gaps.length > 0) {
      this.emit('knowledgeGapsIdentified', gaps);
    }
  }

  private generatePersonalizedRecommendations(): void {
    const recommendations: PersonalizedRecommendation[] = [];
    
    // Character development recommendations
    const characters = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'character');
    
    if (characters.length > 0) {
      const underdevelopedCharacters = characters.filter(char => 
        char.content.length < 100 || char.connections.length < 2
      );
      
      if (underdevelopedCharacters.length > 0) {
        recommendations.push({
          id: this.generateId('recommendation'),
          type: 'character_development',
          title: 'Develop Underdeveloped Characters',
          description: `${underdevelopedCharacters.length} characters could benefit from more development`,
          rationale: 'Characters with richer backgrounds and relationships create more engaging stories',
          priority: 'medium',
          estimated_effort: '2-3 hours per character',
          expected_benefit: 'Enhanced narrative depth and reader engagement',
          resources: [
            {
              type: 'exercise',
              title: 'Character Biography Exercise',
              description: 'Write a detailed background for each underdeveloped character'
            }
          ],
          success_metrics: ['Character description length', 'Number of character relationships'],
          created_at: Date.now(),
          status: 'pending'
        });
      }
    }
    
    // Theme exploration recommendations
    const themes = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'theme');
    
    if (themes.length < 5) {
      recommendations.push({
        id: this.generateId('recommendation'),
        type: 'writing_direction',
        title: 'Explore Additional Themes',
        description: 'Your writing could benefit from exploring more diverse themes',
        rationale: 'Thematic variety adds complexity and interest to your writing',
        priority: 'low',
        estimated_effort: '1-2 writing sessions',
        expected_benefit: 'Increased thematic richness and reader interest',
        resources: [
          {
            type: 'reference',
            title: 'Common Literary Themes',
            description: 'List of themes to consider exploring'
          }
        ],
        success_metrics: ['Number of themes identified', 'Thematic diversity score'],
        created_at: Date.now(),
        status: 'pending'
      });
    }
    
    recommendations.forEach(rec => {
      this.recommendations.set(rec.id, rec);
    });
    
    if (recommendations.length > 0) {
      this.emit('recommendationsGenerated', recommendations);
      this.saveDataToStorage();
    }
  }

  public getKnowledgeMetrics(): KnowledgeMetrics {
    const recentQueries = Array.from(this.queries.values())
      .filter(q => q.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000));
    
    const avgQueryAccuracy = recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + q.response.confidence, 0) / recentQueries.length
      : 0;
    
    const ratedQueries = recentQueries.filter(q => q.user_rating);
    const avgUserSatisfaction = ratedQueries.length > 0
      ? ratedQueries.reduce((sum, q) => sum + (q.user_rating || 0), 0) / ratedQueries.length
      : 0;
    
    const conceptsByType = Array.from(this.knowledgeGraph.nodes.values())
      .reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const mostAccessed = Array.from(this.knowledgeGraph.nodes.values())
      .sort((a, b) => b.metadata.frequency - a.metadata.frequency)
      .slice(0, 5)
      .map(node => node.title);
    
    const acceptedRecommendations = Array.from(this.recommendations.values())
      .filter(rec => rec.status === 'accepted').length;

    return {
      total_nodes: this.knowledgeGraph.nodes.size,
      total_connections: this.knowledgeGraph.statistics.total_connections,
      knowledge_density: this.knowledgeGraph.statistics.density,
      growth_velocity: this.knowledgeGraph.statistics.growth_rate / 7, // per week
      query_accuracy: avgQueryAccuracy,
      user_satisfaction: avgUserSatisfaction,
      most_accessed_concepts: mostAccessed,
      knowledge_gaps_identified: this.identifyCurrentGaps().length,
      insights_generated: this.analyses.size,
      recommendations_accepted: acceptedRecommendations
    };
  }

  private identifyCurrentGaps(): string[] {
    const gaps = [];
    
    // Basic gap identification
    const themes = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'theme');
    if (themes.length < 3) gaps.push('thematic_diversity');
    
    const characters = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'character');
    if (characters.length < 2) gaps.push('character_development');
    
    return gaps;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getKnowledgeGraph(): KnowledgeGraph {
    return {
      ...this.knowledgeGraph,
      nodes: new Map(this.knowledgeGraph.nodes) // Return a copy
    };
  }

  public getNode(nodeId: string): KnowledgeNode | null {
    return this.knowledgeGraph.nodes.get(nodeId) || null;
  }

  public getConnectedNodes(nodeId: string): KnowledgeNode[] {
    const node = this.knowledgeGraph.nodes.get(nodeId);
    if (!node) return [];
    
    return node.connections
      .map(conn => this.knowledgeGraph.nodes.get(conn.target_node_id))
      .filter(Boolean) as KnowledgeNode[];
  }

  public getCentralConcepts(): KnowledgeNode[] {
    return this.knowledgeGraph.central_concepts
      .map(nodeId => this.knowledgeGraph.nodes.get(nodeId))
      .filter(Boolean) as KnowledgeNode[];
  }

  public getRecentQueries(): KnowledgeQuery[] {
    return Array.from(this.queries.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }

  public getAnalyses(): AutoAnalysis[] {
    return Array.from(this.analyses.values())
      .sort((a, b) => b.created_at - a.created_at);
  }

  public getRecommendations(): PersonalizedRecommendation[] {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  public acceptRecommendation(recommendationId: string): void {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.status = 'accepted';
      this.saveDataToStorage();
      this.emit('recommendationAccepted', rec);
    }
  }

  public dismissRecommendation(recommendationId: string): void {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.status = 'dismissed';
      this.saveDataToStorage();
      this.emit('recommendationDismissed', rec);
    }
  }

  public enableLearning(): void {
    this.learningEnabled = true;
    this.saveDataToStorage();
    this.emit('learningEnabled');
  }

  public disableLearning(): void {
    this.learningEnabled = false;
    this.saveDataToStorage();
    this.emit('learningDisabled');
  }

  public enableAutoAnalysis(): void {
    this.autoAnalysisEnabled = true;
    this.saveDataToStorage();
    this.emit('autoAnalysisEnabled');
  }

  public disableAutoAnalysis(): void {
    this.autoAnalysisEnabled = false;
    this.saveDataToStorage();
    this.emit('autoAnalysisDisabled');
  }

  public updateUserProfile(updates: Partial<typeof this.userProfile>): void {
    this.userProfile = { ...this.userProfile, ...updates };
    this.saveDataToStorage();
    this.emit('userProfileUpdated', this.userProfile);
  }

  public getUserProfile() {
    return { ...this.userProfile };
  }
}

export default new PersonalKnowledgeAIService();