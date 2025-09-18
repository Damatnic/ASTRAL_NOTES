/**
 * Content Analysis Service - Intelligent text analysis and consistency checking
 * Provides AI-powered analysis, character detection, style analysis, and quality assessment
 */

import { aiProviderService, AIRequest } from './aiProviderService';

export interface ContentAnalysis {
  id: string;
  text: string;
  timestamp: number;
  wordCount: number;
  characterCount: number;
  readabilityScore: number;
  sentimentScore: number;
  findings: AnalysisFinding[];
  suggestions: AnalysisSuggestion[];
  detectedEntities: DetectedEntity[];
  styleMetrics: StyleMetrics;
  qualityScore: number;
}

export interface AnalysisFinding {
  id: string;
  type: FindingType;
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  position?: TextPosition;
  suggestion?: string;
  confidence: number;
}

export interface AnalysisSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  example?: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionable: boolean;
}

export interface DetectedEntity {
  id: string;
  type: EntityType;
  name: string;
  mentions: EntityMention[];
  attributes: Record<string, any>;
  confidence: number;
  needsReview: boolean;
}

export interface EntityMention {
  text: string;
  position: TextPosition;
  context: string;
  variant?: string; // Different spelling/name variation
}

export interface TextPosition {
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface StyleMetrics {
  averageSentenceLength: number;
  averageWordsPerParagraph: number;
  lexicalDiversity: number;
  readingLevel: string;
  tone: string;
  pacing: 'slow' | 'moderate' | 'fast';
  complexity: 'simple' | 'moderate' | 'complex';
  voiceConsistency: number;
}

export interface ConsistencyCheck {
  id: string;
  projectId: string;
  timestamp: number;
  textSections: TextSection[];
  findings: ConsistencyFinding[];
  characterConsistency: CharacterConsistency[];
  worldBuildingConsistency: WorldBuildingConsistency[];
  overallScore: number;
}

export interface TextSection {
  id: string;
  title: string;
  content: string;
  type: 'scene' | 'chapter' | 'note' | 'outline';
  metadata?: Record<string, any>;
}

export interface ConsistencyFinding {
  id: string;
  type: 'character' | 'worldbuilding' | 'timeline' | 'style' | 'factual';
  severity: 'minor' | 'moderate' | 'major';
  title: string;
  description: string;
  affectedSections: string[];
  suggestions: string[];
  confidence: number;
}

export interface CharacterConsistency {
  characterId: string;
  characterName: string;
  issues: CharacterIssue[];
  consistencyScore: number;
}

export interface CharacterIssue {
  type: 'appearance' | 'personality' | 'speech' | 'behavior' | 'knowledge';
  description: string;
  examples: string[];
  severity: 'minor' | 'moderate' | 'major';
}

export interface WorldBuildingConsistency {
  element: string;
  type: 'location' | 'rule' | 'technology' | 'culture' | 'history';
  issues: string[];
  consistencyScore: number;
}

export interface AIismDetection {
  id: string;
  text: string;
  timestamp: number;
  detectedPatterns: AIismPattern[];
  overallScore: number;
  humanLikelihood: number;
  suggestions: string[];
}

export interface AIismPattern {
  type: AIismType;
  pattern: string;
  examples: string[];
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  replacement?: string;
}

export type FindingType = 
  | 'grammar'
  | 'spelling'
  | 'punctuation'
  | 'style'
  | 'clarity'
  | 'consistency'
  | 'structure'
  | 'character'
  | 'plot'
  | 'pacing'
  | 'dialogue'
  | 'description';

export type SuggestionType =
  | 'improvement'
  | 'enhancement'
  | 'alternative'
  | 'expansion'
  | 'reduction'
  | 'restructure'
  | 'character_development'
  | 'world_building'
  | 'plot_development';

export type EntityType =
  | 'character'
  | 'location'
  | 'organization'
  | 'object'
  | 'concept'
  | 'event'
  | 'time'
  | 'technology'
  | 'creature'
  | 'weapon';

export type AIismType =
  | 'repetitive_phrases'
  | 'generic_language'
  | 'overuse_adjectives'
  | 'artificial_dialogue'
  | 'formulaic_structure'
  | 'lack_specificity'
  | 'awkward_transitions'
  | 'inconsistent_voice';

class ContentAnalysisService {
  private analysisHistory: ContentAnalysis[] = [];
  private consistencyHistory: ConsistencyCheck[] = [];
  private aiismDetectionHistory: AIismDetection[] = [];

  /**
   * Analyze text content for quality, style, and issues
   */
  async analyzeContent(
    text: string,
    options: {
      includeEntities?: boolean;
      includeStyle?: boolean;
      includeSuggestions?: boolean;
      analysisDepth?: 'basic' | 'standard' | 'detailed';
    } = {}
  ): Promise<ContentAnalysis> {
    const {
      includeEntities = true,
      includeStyle = true,
      includeSuggestions = true,
      analysisDepth = 'standard'
    } = options;

    const analysis: ContentAnalysis = {
      id: this.generateId(),
      text,
      timestamp: Date.now(),
      wordCount: this.countWords(text),
      characterCount: text.length,
      readabilityScore: this.calculateReadability(text),
      sentimentScore: 0,
      findings: [],
      suggestions: [],
      detectedEntities: [],
      styleMetrics: this.calculateStyleMetrics(text),
      qualityScore: 0
    };

    try {
      // Basic analysis using AI
      const basicAnalysisPrompt = this.buildAnalysisPrompt(text, analysisDepth);
      const basicResponse = await aiProviderService.generateCompletion({
        prompt: basicAnalysisPrompt,
        systemPrompt: 'You are an expert writing analyst. Provide detailed, constructive feedback on writing quality, style, and areas for improvement.',
        options: {
          temperature: 0.3,
          maxTokens: analysisDepth === 'detailed' ? 1500 : 1000
        }
      });

      // Parse AI analysis response
      const aiAnalysis = this.parseAIAnalysis(basicResponse.content);
      analysis.findings.push(...aiAnalysis.findings);
      analysis.qualityScore = aiAnalysis.qualityScore;

      // Entity detection
      if (includeEntities) {
        analysis.detectedEntities = await this.detectEntities(text);
      }

      // Generate suggestions
      if (includeSuggestions) {
        analysis.suggestions = await this.generateSuggestions(text, analysis.findings);
      }

      // Style analysis enhancement
      if (includeStyle && analysisDepth !== 'basic') {
        const styleAnalysis = await this.analyzeStyle(text);
        analysis.styleMetrics = { ...analysis.styleMetrics, ...styleAnalysis };
      }

      // Sentiment analysis
      analysis.sentimentScore = await this.analyzeSentiment(text);

    } catch (error) {
      console.error('Error during content analysis:', error);
      
      // Add error finding
      analysis.findings.push({
        id: this.generateId(),
        type: 'grammar',
        severity: 'error',
        title: 'Analysis Error',
        description: 'Unable to complete full analysis. Please try again.',
        confidence: 1.0
      });
    }

    this.analysisHistory.push(analysis);
    this.saveAnalysisHistory();

    return analysis;
  }

  /**
   * Check consistency across multiple text sections
   */
  async checkConsistency(
    sections: TextSection[],
    projectId: string,
    options: {
      checkCharacters?: boolean;
      checkWorldBuilding?: boolean;
      checkTimeline?: boolean;
      checkStyle?: boolean;
    } = {}
  ): Promise<ConsistencyCheck> {
    const {
      checkCharacters = true,
      checkWorldBuilding = true,
      checkTimeline = true,
      checkStyle = true
    } = options;

    const consistencyCheck: ConsistencyCheck = {
      id: this.generateId(),
      projectId,
      timestamp: Date.now(),
      textSections: sections,
      findings: [],
      characterConsistency: [],
      worldBuildingConsistency: [],
      overallScore: 0
    };

    try {
      // Combine all text for analysis
      const combinedText = sections.map(s => s.content).join('\n\n');
      
      // Character consistency check
      if (checkCharacters) {
        const characterIssues = await this.checkCharacterConsistency(sections);
        consistencyCheck.characterConsistency = characterIssues;
      }

      // World building consistency
      if (checkWorldBuilding) {
        const worldBuildingIssues = await this.checkWorldBuildingConsistency(sections);
        consistencyCheck.worldBuildingConsistency = worldBuildingIssues;
      }

      // Overall consistency analysis
      const consistencyPrompt = `Analyze the following text sections for consistency issues:

${sections.map((section, index) => `Section ${index + 1} (${section.title}):\n${section.content}\n`).join('\n')}

Look for:
- Contradictions in facts, descriptions, or events
- Timeline inconsistencies
- Character behavior inconsistencies
- World-building contradictions
- Style and tone variations

Provide specific examples and suggestions for improvement.`;

      const consistencyResponse = await aiProviderService.generateCompletion({
        prompt: consistencyPrompt,
        systemPrompt: 'You are an expert editor specializing in consistency analysis. Identify specific inconsistencies and provide actionable suggestions.',
        options: {
          temperature: 0.2,
          maxTokens: 1200
        }
      });

      // Parse consistency findings
      const consistencyFindings = this.parseConsistencyFindings(consistencyResponse.content);
      consistencyCheck.findings = consistencyFindings;

      // Calculate overall score
      consistencyCheck.overallScore = this.calculateConsistencyScore(consistencyCheck);

    } catch (error) {
      console.error('Error during consistency check:', error);
    }

    this.consistencyHistory.push(consistencyCheck);
    this.saveConsistencyHistory();

    return consistencyCheck;
  }

  /**
   * Detect AI-generated text patterns
   */
  async detectAIisms(text: string): Promise<AIismDetection> {
    const detection: AIismDetection = {
      id: this.generateId(),
      text,
      timestamp: Date.now(),
      detectedPatterns: [],
      overallScore: 0,
      humanLikelihood: 0,
      suggestions: []
    };

    try {
      // Pattern-based detection
      const patterns = this.detectAIPatterns(text);
      detection.detectedPatterns = patterns;

      // AI-based analysis
      const aiismPrompt = `Analyze this text for characteristics that suggest it was written by AI rather than a human:

"${text}"

Look for:
- Repetitive phrases or sentence structures
- Generic or clichéd language
- Overuse of adjectives or adverbs
- Artificial-sounding dialogue
- Formulaic narrative structure
- Lack of specific, concrete details
- Awkward transitions between ideas
- Inconsistent voice or perspective

Rate the likelihood that this is human-written (0-100%) and provide specific examples of any AI-like patterns found.`;

      const aiismResponse = await aiProviderService.generateCompletion({
        prompt: aiismPrompt,
        systemPrompt: 'You are an expert at detecting AI-generated text. Be specific and provide concrete examples.',
        options: {
          temperature: 0.2,
          maxTokens: 800
        }
      });

      // Parse AI detection response
      const aiAnalysis = this.parseAIismAnalysis(aiismResponse.content);
      detection.humanLikelihood = aiAnalysis.humanLikelihood;
      detection.suggestions = aiAnalysis.suggestions;
      detection.detectedPatterns.push(...aiAnalysis.patterns);

      // Calculate overall score
      detection.overallScore = this.calculateAIismScore(detection.detectedPatterns);

    } catch (error) {
      console.error('Error during AI-ism detection:', error);
      detection.suggestions.push('Unable to complete AI detection analysis. Please try again.');
    }

    this.aiismDetectionHistory.push(detection);
    this.saveAIismHistory();

    return detection;
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(limit: number = 10): ContentAnalysis[] {
    return this.analysisHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get consistency check history
   */
  getConsistencyHistory(projectId?: string, limit: number = 10): ConsistencyCheck[] {
    let history = this.consistencyHistory;
    
    if (projectId) {
      history = history.filter(check => check.projectId === projectId);
    }
    
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get AI-ism detection history
   */
  getAIismHistory(limit: number = 10): AIismDetection[] {
    return this.aiismDetectionHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Private methods

  private buildAnalysisPrompt(text: string, depth: string): string {
    const basePrompt = `Analyze this text for writing quality and provide feedback:

"${text}"

Provide analysis in the following areas:
- Grammar and spelling
- Sentence structure and clarity
- Style and tone
- Character development (if applicable)
- Dialogue quality (if applicable)
- Pacing and flow
- Areas for improvement

Rate overall quality (1-10) and provide specific, actionable suggestions.`;

    if (depth === 'detailed') {
      return basePrompt + `

Additional detailed analysis:
- Analyze word choice and vocabulary
- Examine narrative voice consistency
- Identify strengths to build upon
- Suggest specific techniques for improvement
- Comment on emotional impact and engagement`;
    }

    return basePrompt;
  }

  private parseAIAnalysis(response: string): { findings: AnalysisFinding[]; qualityScore: number } {
    // Parse AI response and extract structured data
    // This is a simplified implementation - could be enhanced with more sophisticated parsing
    
    const findings: AnalysisFinding[] = [];
    let qualityScore = 7; // Default score

    // Extract quality score
    const scoreMatch = response.match(/(?:quality|score|rating).*?(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      qualityScore = parseFloat(scoreMatch[1]);
    }

    // Extract issues and suggestions
    const lines = response.split('\n').map(line => line.trim()).filter(Boolean);
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('grammar') || line.toLowerCase().includes('spelling')) {
        findings.push({
          id: this.generateId(),
          type: 'grammar',
          severity: 'warning',
          title: 'Grammar/Spelling Issue',
          description: line,
          confidence: 0.8
        });
      } else if (line.toLowerCase().includes('style') || line.toLowerCase().includes('tone')) {
        findings.push({
          id: this.generateId(),
          type: 'style',
          severity: 'info',
          title: 'Style Observation',
          description: line,
          confidence: 0.7
        });
      } else if (line.toLowerCase().includes('dialogue')) {
        findings.push({
          id: this.generateId(),
          type: 'dialogue',
          severity: 'info',
          title: 'Dialogue Feedback',
          description: line,
          confidence: 0.75
        });
      }
    });

    return { findings, qualityScore };
  }

  private async detectEntities(text: string): Promise<DetectedEntity[]> {
    try {
      const entityPrompt = `Extract and categorize entities from this text:

"${text}"

Identify:
- Characters (people, beings)
- Locations (places, settings)
- Objects (items, weapons, tools)
- Organizations (groups, institutions)
- Concepts (ideas, beliefs, systems)
- Events (actions, occurrences)

For each entity, provide:
- Name
- Type (character/location/object/organization/concept/event)
- Brief description
- All mentions in the text

Format as JSON array.`;

      const entityResponse = await aiProviderService.generateCompletion({
        prompt: entityPrompt,
        systemPrompt: 'You are an expert at extracting and categorizing entities from text. Be thorough and accurate.',
        options: {
          temperature: 0.2,
          maxTokens: 800
        }
      });

      // Parse entity response
      try {
        const entities = JSON.parse(entityResponse.content);
        return entities.map((entity: any) => ({
          id: this.generateId(),
          type: entity.type || 'concept',
          name: entity.name || 'Unknown',
          mentions: entity.mentions || [],
          attributes: entity.attributes || {},
          confidence: entity.confidence || 0.7,
          needsReview: false
        }));
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error detecting entities:', error);
      return [];
    }
  }

  private async generateSuggestions(text: string, findings: AnalysisFinding[]): Promise<AnalysisSuggestion[]> {
    try {
      const suggestionPrompt = `Based on this text and analysis findings, provide specific improvement suggestions:

Text: "${text}"

Findings: ${findings.map(f => f.description).join('; ')}

Provide actionable suggestions for:
- Improving clarity and flow
- Enhancing character development
- Strengthening dialogue
- Improving descriptions
- Better pacing
- Style enhancements

Make suggestions specific and practical.`;

      const suggestionResponse = await aiProviderService.generateCompletion({
        prompt: suggestionPrompt,
        systemPrompt: 'You are an expert writing coach. Provide specific, actionable advice that writers can implement immediately.',
        options: {
          temperature: 0.4,
          maxTokens: 600
        }
      });

      // Parse suggestions
      const suggestions: AnalysisSuggestion[] = [];
      const lines = suggestionResponse.content.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        if (line.length > 20) {
          suggestions.push({
            id: this.generateId(),
            type: 'improvement',
            title: `Suggestion ${index + 1}`,
            description: line.trim(),
            impact: 'medium',
            confidence: 0.8,
            actionable: true
          });
        }
      });

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  private async analyzeStyle(text: string): Promise<Partial<StyleMetrics>> {
    try {
      const stylePrompt = `Analyze the writing style of this text:

"${text}"

Assess:
- Tone (formal/informal, serious/playful, etc.)
- Voice consistency
- Reading level
- Complexity
- Pacing

Provide specific observations about the author's style.`;

      const styleResponse = await aiProviderService.generateCompletion({
        prompt: stylePrompt,
        systemPrompt: 'You are a literary style analyst. Provide detailed observations about writing style and voice.',
        options: {
          temperature: 0.3,
          maxTokens: 400
        }
      });

      // Parse style analysis
      const style: Partial<StyleMetrics> = {};
      
      if (styleResponse.content.toLowerCase().includes('formal')) {
        style.tone = 'formal';
      } else if (styleResponse.content.toLowerCase().includes('informal')) {
        style.tone = 'informal';
      }

      if (styleResponse.content.toLowerCase().includes('complex')) {
        style.complexity = 'complex';
      } else if (styleResponse.content.toLowerCase().includes('simple')) {
        style.complexity = 'simple';
      } else {
        style.complexity = 'moderate';
      }

      return style;
    } catch (error) {
      console.error('Error analyzing style:', error);
      return {};
    }
  }

  private async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis - could be enhanced with dedicated sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'beautiful', 'love', 'joy', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'fear', 'dark'];
    
    const words = text.toLowerCase().split(/\s+/);
    let sentiment = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) sentiment += 1;
      if (negativeWords.includes(word)) sentiment -= 1;
    });
    
    // Normalize to -1 to 1 scale
    return Math.max(-1, Math.min(1, sentiment / words.length * 10));
  }

  private calculateStyleMetrics(text: string): StyleMetrics {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    // Calculate lexical diversity (unique words / total words)
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
    const lexicalDiversity = uniqueWords.size / words.length;
    
    return {
      averageSentenceLength: words.length / sentences.length || 0,
      averageWordsPerParagraph: words.length / paragraphs.length || 0,
      lexicalDiversity,
      readingLevel: lexicalDiversity > 0.6 ? 'Advanced' : lexicalDiversity > 0.4 ? 'Intermediate' : 'Basic',
      tone: 'neutral', // Will be enhanced by AI analysis
      pacing: sentences.length > words.length * 0.15 ? 'fast' : sentences.length < words.length * 0.08 ? 'slow' : 'moderate',
      complexity: 'moderate', // Will be enhanced by AI analysis
      voiceConsistency: 0.8 // Placeholder - would need more sophisticated analysis
    };
  }

  private calculateReadability(text: string): number {
    // Simple Flesch Reading Ease approximation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    return Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord));
  }

  private countSyllables(word: string): number {
    // Simple syllable counting
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;
    
    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2) count++;
    
    return Math.max(1, count);
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private async checkCharacterConsistency(sections: TextSection[]): Promise<CharacterConsistency[]> {
    // Placeholder for character consistency checking
    // Would implement detailed character tracking and analysis
    return [];
  }

  private async checkWorldBuildingConsistency(sections: TextSection[]): Promise<WorldBuildingConsistency[]> {
    // Placeholder for world building consistency checking
    return [];
  }

  private parseConsistencyFindings(response: string): ConsistencyFinding[] {
    // Parse consistency analysis response
    const findings: ConsistencyFinding[] = [];
    
    // This would be more sophisticated in a real implementation
    const lines = response.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('inconsistent') || line.toLowerCase().includes('contradiction')) {
        findings.push({
          id: this.generateId(),
          type: 'character',
          severity: 'moderate',
          title: 'Consistency Issue',
          description: line,
          affectedSections: [],
          suggestions: [],
          confidence: 0.7
        });
      }
    });
    
    return findings;
  }

  private calculateConsistencyScore(check: ConsistencyCheck): number {
    const totalFindings = check.findings.length;
    const majorIssues = check.findings.filter(f => f.severity === 'major').length;
    const minorIssues = check.findings.filter(f => f.severity === 'minor').length;
    
    // Score from 0-100 based on issues found
    const score = Math.max(0, 100 - majorIssues * 20 - minorIssues * 5);
    return score;
  }

  private detectAIPatterns(text: string): AIismPattern[] {
    const patterns: AIismPattern[] = [];
    
    // Check for repetitive phrases
    const words = text.toLowerCase().split(/\s+/);
    const phrases = new Map<string, number>();
    
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
    
    phrases.forEach((count, phrase) => {
      if (count > 2) {
        patterns.push({
          type: 'repetitive_phrases',
          pattern: phrase,
          examples: [phrase],
          confidence: Math.min(0.9, count * 0.2),
          severity: count > 4 ? 'high' : 'medium'
        });
      }
    });
    
    // Check for overuse of adjectives
    const adjectives = text.match(/\b(very|quite|extremely|incredibly|amazing|wonderful|beautiful|perfect|absolutely)\b/gi);
    if (adjectives && adjectives.length > text.split(/\s+/).length * 0.05) {
      patterns.push({
        type: 'overuse_adjectives',
        pattern: 'Excessive use of qualifying adjectives',
        examples: adjectives.slice(0, 5),
        confidence: 0.8,
        severity: 'medium'
      });
    }
    
    return patterns;
  }

  private parseAIismAnalysis(response: string): {
    humanLikelihood: number;
    suggestions: string[];
    patterns: AIismPattern[];
  } {
    let humanLikelihood = 75; // Default
    const suggestions: string[] = [];
    const patterns: AIismPattern[] = [];
    
    // Extract human likelihood score
    const scoreMatch = response.match(/(\d+)%.*human/i);
    if (scoreMatch) {
      humanLikelihood = parseInt(scoreMatch[1]);
    }
    
    // Extract suggestions
    const lines = response.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (line.toLowerCase().includes('suggest') || line.toLowerCase().includes('improve')) {
        suggestions.push(line.trim());
      }
    });
    
    return { humanLikelihood, suggestions, patterns };
  }

  private calculateAIismScore(patterns: AIismPattern[]): number {
    if (patterns.length === 0) return 0;
    
    const totalConfidence = patterns.reduce((sum, pattern) => sum + pattern.confidence, 0);
    return Math.min(100, (totalConfidence / patterns.length) * 100);
  }

  private loadAnalysisHistory(): void {
    try {
      const data = localStorage.getItem('content_analysis_history');
      if (data) {
        this.analysisHistory = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  }

  private saveAnalysisHistory(): void {
    try {
      // Keep only last 50 analyses
      const recent = this.analysisHistory.slice(-50);
      localStorage.setItem('content_analysis_history', JSON.stringify(recent));
    } catch (error) {
      console.error('Error saving analysis history:', error);
    }
  }

  private loadConsistencyHistory(): void {
    try {
      const data = localStorage.getItem('consistency_check_history');
      if (data) {
        this.consistencyHistory = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading consistency history:', error);
    }
  }

  private saveConsistencyHistory(): void {
    try {
      // Keep only last 20 checks
      const recent = this.consistencyHistory.slice(-20);
      localStorage.setItem('consistency_check_history', JSON.stringify(recent));
    } catch (error) {
      console.error('Error saving consistency history:', error);
    }
  }

  private loadAIismHistory(): void {
    try {
      const data = localStorage.getItem('aiism_detection_history');
      if (data) {
        this.aiismDetectionHistory = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading AI-ism history:', error);
    }
  }

  private saveAIismHistory(): void {
    try {
      // Keep only last 30 detections
      const recent = this.aiismDetectionHistory.slice(-30);
      localStorage.setItem('aiism_detection_history', JSON.stringify(recent));
    } catch (error) {
      console.error('Error saving AI-ism history:', error);
    }
  }

  private generateId(): string {
    return 'ca_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const contentAnalysisService = new ContentAnalysisService();