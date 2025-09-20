/**
 * Genre-Specific AI Assistants Service
 * Provides specialized writing assistance for different literary genres
 */

import { openaiService } from './openaiService';
import { env } from '@/config/env';

export interface GenreContext {
  genre: 'literary-fiction' | 'fantasy-scifi' | 'mystery-thriller' | 'romance' | 'non-fiction' | 'screenplay';
  text: string;
  characters?: CharacterProfile[];
  worldElements?: WorldElement[];
  plotPoints?: PlotPoint[];
  themes?: string[];
  targetAudience?: string;
  writingStage?: 'outline' | 'first-draft' | 'revision' | 'polish';
}

export interface CharacterProfile {
  name: string;
  role: string;
  traits: string[];
  arc: string;
  relationships: Record<string, string>;
  voice: string;
  knowledge: string[];
}

export interface WorldElement {
  type: 'location' | 'magic-system' | 'technology' | 'culture' | 'rule';
  name: string;
  description: string;
  rules: string[];
  consistency: boolean;
}

export interface PlotPoint {
  type: 'inciting-incident' | 'plot-twist' | 'climax' | 'resolution' | 'clue' | 'red-herring';
  description: string;
  chapter: number;
  foreshadowing: string[];
  consequences: string[];
}

export interface GenreAnalysis {
  genre: string;
  confidence: number;
  strengths: string[];
  suggestions: GenreSuggestion[];
  consistencyIssues: ConsistencyIssue[];
  genreElements: GenreElement[];
}

export interface GenreSuggestion {
  id: string;
  category: 'plot' | 'character' | 'world' | 'style' | 'pacing' | 'tension' | 'dialogue';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  examples: string[];
  confidence: number;
}

export interface ConsistencyIssue {
  id: string;
  type: 'timeline' | 'character' | 'world' | 'plot' | 'fact';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  locations: Array<{ chapter: number; position: number }>;
  suggestedFix: string;
}

export interface GenreElement {
  type: string;
  presence: number;
  quality: number;
  suggestions: string[];
}

class GenreSpecificAssistants {
  private initialized = false;

  /**
   * Analyze text with genre-specific intelligence
   */
  async analyzeWithGenre(context: GenreContext): Promise<GenreAnalysis> {
    switch (context.genre) {
      case 'literary-fiction':
        return this.analyzeLiteraryFiction(context);
      case 'fantasy-scifi':
        return this.analyzeFantasySciFi(context);
      case 'mystery-thriller':
        return this.analyzeMysteryThriller(context);
      case 'romance':
        return this.analyzeRomance(context);
      case 'non-fiction':
        return this.analyzeNonFiction(context);
      case 'screenplay':
        return this.analyzeScreenplay(context);
      default:
        return this.analyzeGeneral(context);
    }
  }

  /**
   * Literary Fiction AI Assistant
   */
  private async analyzeLiteraryFiction(context: GenreContext): Promise<GenreAnalysis> {
    const suggestions: GenreSuggestion[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];
    
    // Analyze symbolic depth
    const symbolismAnalysis = this.analyzeSymbolism(context.text);
    if (symbolismAnalysis.score < 0.6) {
      suggestions.push({
        id: `literary-symbolism-${Date.now()}`,
        category: 'style',
        title: 'Enhance Symbolic Depth',
        description: 'Literary fiction benefits from layered meaning and symbolism',
        priority: 'medium',
        impact: 'Adds depth and literary merit to the narrative',
        examples: [
          'Weather as emotional metaphor',
          'Objects representing character states',
          'Settings reflecting internal conflict'
        ],
        confidence: 0.8
      });
    }

    // Analyze character psychology
    const psychologyDepth = this.analyzeCharacterPsychology(context.text, context.characters);
    if (psychologyDepth.score < 0.7) {
      suggestions.push({
        id: `literary-psychology-${Date.now()}`,
        category: 'character',
        title: 'Deepen Character Psychology',
        description: 'Explore the internal motivations and conflicts of characters',
        priority: 'high',
        impact: 'Creates more compelling and realistic character development',
        examples: [
          'Internal monologue revealing subconscious desires',
          'Behavioral contradictions showing complexity',
          'Past trauma influencing present decisions'
        ],
        confidence: 0.85
      });
    }

    // Analyze thematic consistency
    if (context.themes) {
      const themeAnalysis = this.analyzeThematicConsistency(context.text, context.themes);
      consistencyIssues.push(...themeAnalysis.issues);
    }

    return {
      genre: 'Literary Fiction',
      confidence: 0.9,
      strengths: ['Character depth', 'Prose quality', 'Thematic resonance'],
      suggestions,
      consistencyIssues,
      genreElements: [
        { type: 'Literary Style', presence: 0.8, quality: 0.7, suggestions: ['Vary sentence structure', 'Use more literary devices'] },
        { type: 'Character Development', presence: 0.9, quality: 0.8, suggestions: ['Explore internal conflicts'] },
        { type: 'Thematic Depth', presence: 0.7, quality: 0.6, suggestions: ['Strengthen symbolic elements'] }
      ]
    };
  }

  /**
   * Fantasy/Sci-Fi AI Assistant
   */
  private async analyzeFantasySciFi(context: GenreContext): Promise<GenreAnalysis> {
    const suggestions: GenreSuggestion[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];

    // World-building consistency check
    if (context.worldElements) {
      const worldConsistency = this.analyzeWorldConsistency(context.text, context.worldElements);
      consistencyIssues.push(...worldConsistency.issues);
      
      if (worldConsistency.magicSystemCoherence < 0.7) {
        suggestions.push({
          id: `fantasy-magic-${Date.now()}`,
          category: 'world',
          title: 'Strengthen Magic System Rules',
          description: 'Magic systems need consistent rules and limitations',
          priority: 'high',
          impact: 'Prevents plot holes and maintains reader immersion',
          examples: [
            'Define energy source and cost for magic use',
            'Establish clear limitations and consequences',
            'Show how magic affects society and daily life'
          ],
          confidence: 0.9
        });
      }
    }

    // Technology plausibility check (for sci-fi)
    const techPlausibility = this.analyzeTechnologyPlausibility(context.text);
    if (techPlausibility.score < 0.6) {
      suggestions.push({
        id: `scifi-tech-${Date.now()}`,
        category: 'world',
        title: 'Improve Technology Plausibility',
        description: 'Ground fantastical technology in scientific principles',
        priority: 'medium',
        impact: 'Maintains suspension of disbelief for readers',
        examples: [
          'Explain energy requirements for advanced tech',
          'Show technological evolution and development',
          'Consider social implications of new technology'
        ],
        confidence: 0.75
      });
    }

    // World-building immersion
    const immersionScore = this.analyzeWorldImmersion(context.text);
    if (immersionScore < 0.7) {
      suggestions.push({
        id: `fantasy-immersion-${Date.now()}`,
        category: 'world',
        title: 'Enhance World Immersion',
        description: 'Add sensory details and cultural specifics to build immersion',
        priority: 'medium',
        impact: 'Creates a more vivid and believable fictional world',
        examples: [
          'Describe unique sounds, smells, and textures',
          'Show cultural traditions and social customs',
          'Include world-specific language and terminology'
        ],
        confidence: 0.8
      });
    }

    return {
      genre: 'Fantasy/Sci-Fi',
      confidence: 0.85,
      strengths: ['World-building', 'Creative concepts', 'Imaginative elements'],
      suggestions,
      consistencyIssues,
      genreElements: [
        { type: 'World Consistency', presence: 0.9, quality: 0.7, suggestions: ['Strengthen magic system rules'] },
        { type: 'Technology Plausibility', presence: 0.8, quality: 0.6, suggestions: ['Ground in scientific principles'] },
        { type: 'Cultural Depth', presence: 0.6, quality: 0.7, suggestions: ['Add more cultural details'] }
      ]
    };
  }

  /**
   * Mystery/Thriller AI Assistant
   */
  private async analyzeMysteryThriller(context: GenreContext): Promise<GenreAnalysis> {
    const suggestions: GenreSuggestion[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];

    // Clue tracking and validation
    if (context.plotPoints) {
      const clueAnalysis = this.analyzeClueConsistency(context.text, context.plotPoints);
      consistencyIssues.push(...clueAnalysis.issues);
    }

    // Tension pacing analysis
    const tensionAnalysis = this.analyzeTensionPacing(context.text);
    if (tensionAnalysis.score < 0.7) {
      suggestions.push({
        id: `thriller-tension-${Date.now()}`,
        category: 'pacing',
        title: 'Improve Tension Pacing',
        description: 'Vary tension levels to maintain reader engagement',
        priority: 'high',
        impact: 'Keeps readers on edge and prevents pacing issues',
        examples: [
          'Alternate high-tension scenes with quieter moments',
          'Use cliffhangers at chapter ends',
          'Build suspense through delayed revelation'
        ],
        confidence: 0.85
      });
    }

    // Plot hole detection
    const plotHoles = this.detectPlotHoles(context.text, context.plotPoints);
    consistencyIssues.push(...plotHoles);

    // Red herring effectiveness
    const redHerringAnalysis = this.analyzeRedHerrings(context.text, context.plotPoints);
    if (redHerringAnalysis.effectiveness < 0.6) {
      suggestions.push({
        id: `mystery-herrings-${Date.now()}`,
        category: 'plot',
        title: 'Strengthen Red Herrings',
        description: 'Create more convincing false leads to misdirect readers',
        priority: 'medium',
        impact: 'Enhances mystery and makes resolution more satisfying',
        examples: [
          'Plant believable but false evidence',
          'Create suspicious characters with alibis',
          'Use reader assumptions against them'
        ],
        confidence: 0.8
      });
    }

    return {
      genre: 'Mystery/Thriller',
      confidence: 0.9,
      strengths: ['Plot complexity', 'Suspense building', 'Character motives'],
      suggestions,
      consistencyIssues,
      genreElements: [
        { type: 'Clue Placement', presence: 0.8, quality: 0.7, suggestions: ['Ensure fair play rules'] },
        { type: 'Tension Building', presence: 0.7, quality: 0.6, suggestions: ['Vary pacing more effectively'] },
        { type: 'Red Herrings', presence: 0.6, quality: 0.5, suggestions: ['Make false leads more convincing'] }
      ]
    };
  }

  /**
   * Romance AI Assistant
   */
  private async analyzeRomance(context: GenreContext): Promise<GenreAnalysis> {
    const suggestions: GenreSuggestion[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];

    // Relationship arc analysis
    const relationshipArc = this.analyzeRelationshipArc(context.text, context.characters);
    if (relationshipArc.development < 0.7) {
      suggestions.push({
        id: `romance-arc-${Date.now()}`,
        category: 'character',
        title: 'Strengthen Relationship Development',
        description: 'Show gradual emotional growth and connection between characters',
        priority: 'high',
        impact: 'Creates more believable and satisfying romantic progression',
        examples: [
          'Show small moments of growing attraction',
          'Include internal conflict about feelings',
          'Demonstrate compatibility through shared experiences'
        ],
        confidence: 0.9
      });
    }

    // Chemistry analysis
    const chemistryScore = this.analyzeChemistry(context.text, context.characters);
    if (chemistryScore < 0.6) {
      suggestions.push({
        id: `romance-chemistry-${Date.now()}`,
        category: 'dialogue',
        title: 'Enhance Character Chemistry',
        description: 'Improve dialogue and interactions to show natural chemistry',
        priority: 'high',
        impact: 'Makes the romantic connection feel authentic and compelling',
        examples: [
          'Add witty banter and verbal sparring',
          'Show physical awareness and attraction',
          'Include moments of vulnerability and understanding'
        ],
        confidence: 0.85
      });
    }

    // Emotional beats tracking
    const emotionalBeats = this.analyzeEmotionalBeats(context.text);
    if (emotionalBeats.satisfaction < 0.7) {
      suggestions.push({
        id: `romance-beats-${Date.now()}`,
        category: 'plot',
        title: 'Improve Emotional Beat Progression',
        description: 'Include key romantic milestones and emotional moments',
        priority: 'medium',
        impact: 'Ensures satisfying romantic progression for readers',
        examples: [
          'First meeting with spark or conflict',
          'Moment of realization of feelings',
          'Conflict that tests the relationship',
          'Resolution and commitment'
        ],
        confidence: 0.8
      });
    }

    return {
      genre: 'Romance',
      confidence: 0.85,
      strengths: ['Emotional depth', 'Character chemistry', 'Relationship dynamics'],
      suggestions,
      consistencyIssues,
      genreElements: [
        { type: 'Relationship Arc', presence: 0.9, quality: 0.7, suggestions: ['Show more gradual development'] },
        { type: 'Character Chemistry', presence: 0.8, quality: 0.6, suggestions: ['Enhance dialogue and interactions'] },
        { type: 'Emotional Beats', presence: 0.7, quality: 0.7, suggestions: ['Include key romantic milestones'] }
      ]
    };
  }

  /**
   * Non-Fiction AI Assistant
   */
  private async analyzeNonFiction(context: GenreContext): Promise<GenreAnalysis> {
    const suggestions: GenreSuggestion[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];

    // Fact-checking and source validation
    const factCheck = this.analyzeFactualAccuracy(context.text);
    if (factCheck.confidence < 0.8) {
      suggestions.push({
        id: `nonfiction-facts-${Date.now()}`,
        category: 'style',
        title: 'Verify Factual Claims',
        description: 'Ensure all factual statements are accurate and properly sourced',
        priority: 'high',
        impact: 'Maintains credibility and reader trust',
        examples: [
          'Cite primary sources for statistics',
          'Verify dates and historical facts',
          'Include expert opinions and research'
        ],
        confidence: 0.9
      });
    }

    // Argument structure analysis
    const argumentStructure = this.analyzeArgumentStructure(context.text);
    if (argumentStructure.logical_flow < 0.7) {
      suggestions.push({
        id: `nonfiction-argument-${Date.now()}`,
        category: 'style',
        title: 'Strengthen Argument Structure',
        description: 'Improve logical flow and evidence presentation',
        priority: 'high',
        impact: 'Makes arguments more persuasive and easier to follow',
        examples: [
          'Use clear topic sentences',
          'Provide evidence before conclusions',
          'Address counterarguments effectively'
        ],
        confidence: 0.85
      });
    }

    // Clarity for target audience
    const clarityScore = this.analyzeAudienceClarity(context.text, context.targetAudience);
    if (clarityScore < 0.7) {
      suggestions.push({
        id: `nonfiction-clarity-${Date.now()}`,
        category: 'style',
        title: 'Improve Audience Clarity',
        description: 'Adjust language and complexity for target audience',
        priority: 'medium',
        impact: 'Ensures content is accessible to intended readers',
        examples: [
          'Define technical terms for general audience',
          'Use analogies for complex concepts',
          'Break down complicated ideas into steps'
        ],
        confidence: 0.8
      });
    }

    return {
      genre: 'Non-Fiction',
      confidence: 0.8,
      strengths: ['Factual accuracy', 'Clear structure', 'Expert knowledge'],
      suggestions,
      consistencyIssues,
      genreElements: [
        { type: 'Factual Accuracy', presence: 0.9, quality: 0.8, suggestions: ['Verify all claims'] },
        { type: 'Argument Structure', presence: 0.8, quality: 0.7, suggestions: ['Improve logical flow'] },
        { type: 'Audience Clarity', presence: 0.7, quality: 0.6, suggestions: ['Adjust for target audience'] }
      ]
    };
  }

  /**
   * Screenplay AI Assistant
   */
  private async analyzeScreenplay(context: GenreContext): Promise<GenreAnalysis> {
    const suggestions: GenreSuggestion[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];

    // Format compliance check
    const formatCompliance = this.analyzeScreenplayFormat(context.text);
    if (formatCompliance.compliance < 0.9) {
      suggestions.push({
        id: `screenplay-format-${Date.now()}`,
        category: 'style',
        title: 'Fix Format Issues',
        description: 'Ensure proper screenplay formatting for industry standards',
        priority: 'high',
        impact: 'Professional presentation essential for consideration',
        examples: [
          'Proper scene headings (INT./EXT.)',
          'Correct character name formatting',
          'Appropriate action line structure'
        ],
        confidence: 0.95
      });
    }

    // Dialogue effectiveness
    const dialogueAnalysis = this.analyzeScreenplayDialogue(context.text);
    if (dialogueAnalysis.naturalness < 0.7) {
      suggestions.push({
        id: `screenplay-dialogue-${Date.now()}`,
        category: 'dialogue',
        title: 'Improve Dialogue Naturalism',
        description: 'Make dialogue sound more natural and character-specific',
        priority: 'high',
        impact: 'Essential for believable character portrayal',
        examples: [
          'Use contractions and casual speech',
          'Give each character unique speech patterns',
          'Avoid exposition-heavy dialogue'
        ],
        confidence: 0.85
      });
    }

    // Scene dynamics and pacing
    const sceneAnalysis = this.analyzeSceneDynamics(context.text);
    if (sceneAnalysis.pacing < 0.7) {
      suggestions.push({
        id: `screenplay-pacing-${Date.now()}`,
        category: 'pacing',
        title: 'Improve Scene Pacing',
        description: 'Optimize scene length and dramatic beats',
        priority: 'medium',
        impact: 'Maintains audience engagement and story momentum',
        examples: [
          'Start scenes as late as possible',
          'End with hooks or conflict',
          'Vary scene lengths for rhythm'
        ],
        confidence: 0.8
      });
    }

    return {
      genre: 'Screenplay',
      confidence: 0.9,
      strengths: ['Visual storytelling', 'Dialogue-driven', 'Scene structure'],
      suggestions,
      consistencyIssues,
      genreElements: [
        { type: 'Format Compliance', presence: 0.9, quality: 0.8, suggestions: ['Fix formatting issues'] },
        { type: 'Dialogue Quality', presence: 0.8, quality: 0.7, suggestions: ['Enhance naturalism'] },
        { type: 'Scene Dynamics', presence: 0.7, quality: 0.6, suggestions: ['Improve pacing'] }
      ]
    };
  }

  /**
   * General analysis fallback
   */
  private async analyzeGeneral(context: GenreContext): Promise<GenreAnalysis> {
    return {
      genre: 'General',
      confidence: 0.5,
      strengths: ['Basic writing structure'],
      suggestions: [{
        id: `general-${Date.now()}`,
        category: 'style',
        title: 'Consider Genre Specialization',
        description: 'Focusing on a specific genre can help improve targeted writing techniques',
        priority: 'low',
        impact: 'Enables more specific and helpful writing assistance',
        examples: ['Choose primary genre', 'Study genre conventions', 'Apply genre-specific techniques'],
        confidence: 0.6
      }],
      consistencyIssues: [],
      genreElements: []
    };
  }

  // Analysis helper methods (simplified implementations)
  private analyzeSymbolism(text: string): { score: number; symbols: string[] } {
    // Simplified symbolism detection
    const symbolicWords = ['mirror', 'shadow', 'light', 'darkness', 'rain', 'storm', 'bridge', 'door', 'window'];
    const words = text.toLowerCase().split(/\s+/);
    const symbols = symbolicWords.filter(symbol => words.includes(symbol));
    const score = Math.min(1, symbols.length / 10);
    return { score, symbols };
  }

  private analyzeCharacterPsychology(text: string, characters?: CharacterProfile[]): { score: number; depth: number } {
    // Simplified psychological depth analysis
    const psychologyIndicators = ['thought', 'felt', 'remembered', 'feared', 'hoped', 'wondered', 'realized'];
    const words = text.toLowerCase().split(/\s+/);
    const indicators = psychologyIndicators.filter(indicator => words.includes(indicator));
    const score = Math.min(1, indicators.length / 15);
    return { score, depth: score };
  }

  private analyzeThematicConsistency(text: string, themes: string[]): { issues: ConsistencyIssue[] } {
    // Simplified thematic consistency check
    return { issues: [] };
  }

  private analyzeWorldConsistency(text: string, worldElements: WorldElement[]): { issues: ConsistencyIssue[]; magicSystemCoherence: number } {
    // Simplified world consistency analysis
    return { issues: [], magicSystemCoherence: 0.7 };
  }

  private analyzeTechnologyPlausibility(text: string): { score: number } {
    // Simplified technology plausibility check
    return { score: 0.6 };
  }

  private analyzeWorldImmersion(text: string): number {
    // Simplified immersion analysis
    const sensoryWords = ['saw', 'heard', 'felt', 'smelled', 'tasted', 'touched'];
    const words = text.toLowerCase().split(/\s+/);
    const sensoryCount = sensoryWords.filter(word => words.includes(word)).length;
    return Math.min(1, sensoryCount / 10);
  }

  private analyzeClueConsistency(text: string, plotPoints: PlotPoint[]): { issues: ConsistencyIssue[] } {
    // Simplified clue consistency analysis
    return { issues: [] };
  }

  private analyzeTensionPacing(text: string): { score: number } {
    // Simplified tension analysis
    const tensionWords = ['suddenly', 'quickly', 'danger', 'fear', 'threat', 'urgent'];
    const words = text.toLowerCase().split(/\s+/);
    const tensionCount = tensionWords.filter(word => words.includes(word)).length;
    return { score: Math.min(1, tensionCount / 8) };
  }

  private detectPlotHoles(text: string, plotPoints?: PlotPoint[]): ConsistencyIssue[] {
    // Simplified plot hole detection
    return [];
  }

  private analyzeRedHerrings(text: string, plotPoints?: PlotPoint[]): { effectiveness: number } {
    // Simplified red herring analysis
    return { effectiveness: 0.6 };
  }

  private analyzeRelationshipArc(text: string, characters?: CharacterProfile[]): { development: number } {
    // Simplified relationship analysis
    const relationshipWords = ['love', 'attracted', 'feelings', 'chemistry', 'connection'];
    const words = text.toLowerCase().split(/\s+/);
    const relationshipCount = relationshipWords.filter(word => words.includes(word)).length;
    return { development: Math.min(1, relationshipCount / 5) };
  }

  private analyzeChemistry(text: string, characters?: CharacterProfile[]): number {
    // Simplified chemistry analysis
    const chemistryIndicators = ['banter', 'teasing', 'flirting', 'tension', 'spark'];
    const words = text.toLowerCase().split(/\s+/);
    const chemistryCount = chemistryIndicators.filter(indicator => words.includes(indicator)).length;
    return Math.min(1, chemistryCount / 3);
  }

  private analyzeEmotionalBeats(text: string): { satisfaction: number } {
    // Simplified emotional beats analysis
    return { satisfaction: 0.7 };
  }

  private analyzeFactualAccuracy(text: string): { confidence: number } {
    // Simplified fact-checking (would integrate with real fact-checking APIs)
    return { confidence: 0.8 };
  }

  private analyzeArgumentStructure(text: string): { logical_flow: number } {
    // Simplified argument structure analysis
    const structureWords = ['therefore', 'because', 'however', 'furthermore', 'consequently'];
    const words = text.toLowerCase().split(/\s+/);
    const structureCount = structureWords.filter(word => words.includes(word)).length;
    return { logical_flow: Math.min(1, structureCount / 8) };
  }

  private analyzeAudienceClarity(text: string, audience?: string): number {
    // Simplified clarity analysis
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    return Math.max(0, 1 - (avgWordLength - 5) / 10);
  }

  private analyzeScreenplayFormat(text: string): { compliance: number } {
    // Simplified format compliance check
    const hasSceneHeadings = /^(INT\.|EXT\.)/m.test(text);
    const hasCharacterNames = /^[A-Z][A-Z\s]+$/m.test(text);
    return { compliance: (hasSceneHeadings && hasCharacterNames) ? 0.9 : 0.5 };
  }

  private analyzeScreenplayDialogue(text: string): { naturalness: number } {
    // Simplified dialogue analysis
    const contractionCount = (text.match(/\w+'\w+/g) || []).length;
    const wordCount = text.split(/\s+/).length;
    return { naturalness: Math.min(1, contractionCount / (wordCount / 50)) };
  }

  private analyzeSceneDynamics(text: string): { pacing: number } {
    // Simplified scene dynamics analysis
    return { pacing: 0.7 };
  }

  /**
   * Get genre-specific writing prompts
   */
  getGenrePrompts(genre: GenreContext['genre']): string[] {
    const prompts: Record<GenreContext['genre'], string[]> = {
      'literary-fiction': [
        'Explore the internal conflict between desire and duty',
        'Use weather as a metaphor for emotional state',
        'Show character growth through small, meaningful actions'
      ],
      'fantasy-scifi': [
        'Establish the rules and costs of your magic system',
        'Show how technology affects daily life and relationships',
        'Create cultural conflicts between different societies'
      ],
      'mystery-thriller': [
        'Plant a clue that seems innocent but gains significance later',
        'Create a red herring that genuinely misleads without lying',
        'Build tension through what characters don\'t know'
      ],
      'romance': [
        'Show attraction through body language and subtext',
        'Create obstacles that test the relationship\'s strength',
        'Include moments of vulnerability that deepen connection'
      ],
      'non-fiction': [
        'Support claims with credible sources and evidence',
        'Use analogies to explain complex concepts',
        'Address potential counterarguments to strengthen your position'
      ],
      'screenplay': [
        'Start scenes as late as possible in the action',
        'Show character emotion through action, not dialogue',
        'Use visual storytelling to convey information'
      ]
    };

    return prompts[genre] || [];
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.initialized;
  }
}

export const genreSpecificAssistants = new GenreSpecificAssistants();