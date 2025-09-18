/**
 * Entity Extraction Service
 * Advanced NLP-based entity recognition and codex creation from imported documents
 */

import { ExtractedEntity, EntityMention, DocumentNode } from './documentParserService';

export interface EntityExtractionOptions {
  enabledTypes: EntityType[];
  confidenceThreshold: number;
  contextWindow: number;
  useAdvancedNLP: boolean;
  customPatterns?: EntityPattern[];
  excludeCommonWords: boolean;
  groupSimilarEntities: boolean;
  extractRelationships: boolean;
}

export interface EntityPattern {
  type: EntityType;
  patterns: RegExp[];
  contextClues: string[];
  priority: number;
}

export interface EntityRelationship {
  from: string;
  to: string;
  type: RelationshipType;
  confidence: number;
  context: string;
}

export interface CodexEntry {
  id: string;
  type: EntityType;
  name: string;
  aliases: string[];
  description: string;
  category?: string;
  tags: string[];
  relationships: EntityRelationship[];
  mentions: EntityMention[];
  properties: Record<string, any>;
  confidence: number;
  verified: boolean;
  notes?: string;
}

export type EntityType = 
  | 'character' 
  | 'location' 
  | 'organization' 
  | 'item' 
  | 'concept' 
  | 'event' 
  | 'timeline' 
  | 'theme'
  | 'setting'
  | 'creature'
  | 'technology'
  | 'magic'
  | 'culture';

export type RelationshipType = 
  | 'knows' 
  | 'related_to' 
  | 'located_in' 
  | 'member_of' 
  | 'owns' 
  | 'created' 
  | 'enemy_of' 
  | 'friend_of'
  | 'parent_of'
  | 'child_of'
  | 'married_to'
  | 'works_for'
  | 'rules'
  | 'part_of'
  | 'caused'
  | 'happened_at'
  | 'happened_before'
  | 'happened_after';

export interface EntityExtractionResult {
  entities: CodexEntry[];
  relationships: EntityRelationship[];
  suggestions: EntitySuggestion[];
  statistics: ExtractionStatistics;
}

export interface EntitySuggestion {
  type: 'merge' | 'split' | 'categorize' | 'relate';
  entities: string[];
  confidence: number;
  reason: string;
  suggestedAction: string;
}

export interface ExtractionStatistics {
  totalEntities: number;
  entitiesByType: Record<EntityType, number>;
  averageConfidence: number;
  totalMentions: number;
  relationshipsFound: number;
  processingTime: number;
}

class EntityExtractionService {
  private static instance: EntityExtractionService;
  
  // Advanced pattern recognition for different entity types
  private readonly entityPatterns: Record<EntityType, EntityPattern[]> = {
    character: [
      {
        type: 'character',
        patterns: [
          /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Jr|Sr|III?|IV))?\.?\b/g,
          /(?:Mr|Mrs|Ms|Miss|Dr|Professor|Sir|Lady|Lord|Dame|Captain|Major|Colonel|General|Admiral)\s+[A-Z][a-z]+/g,
          /\b[A-Z][a-z]+(?:'s|'s)\s+(?:said|thought|felt|walked|ran|smiled|frowned|whispered|shouted)/g
        ],
        contextClues: ['said', 'thought', 'walked', 'character', 'person', 'he', 'she', 'they', 'protagonist', 'antagonist'],
        priority: 1
      }
    ],
    location: [
      {
        type: 'location',
        patterns: [
          /\b(?:in|at|from|to|near|by|inside|outside|within|towards?)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:City|Town|Village|Kingdom|Empire|Forest|Mountain|River|Lake|Castle|Palace|Tower|Temple|Cathedral|University|School|Hospital|Restaurant|Hotel|Bar|Tavern|Inn|Market|Square|Street|Road|Avenue|Boulevard|Park|Garden|Beach|Desert|Island)\b/g,
          /\bthe\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:of|in|at|near)\b/g
        ],
        contextClues: ['place', 'location', 'where', 'city', 'town', 'country', 'building', 'room', 'area'],
        priority: 1
      }
    ],
    organization: [
      {
        type: 'organization',
        patterns: [
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Corporation|Corp|Company|Co|Inc|LLC|Ltd|Organization|Org|Association|Society|Guild|Union|Club|Group|Team|Department|Agency|Bureau|Foundation|Institute|University|College|School|Hospital|Government|Army|Navy|Police|Force)\b/g,
          /\bthe\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Guild|Order|Society|Brotherhood|Sisterhood|Alliance|Coalition|Federation|Empire|Kingdom|Republic|Nation|Tribe|Clan|Family|House)\b/g
        ],
        contextClues: ['organization', 'company', 'group', 'guild', 'order', 'society', 'government', 'army'],
        priority: 1
      }
    ],
    item: [
      {
        type: 'item',
        patterns: [
          /\bthe\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Sword|Blade|Dagger|Axe|Hammer|Staff|Wand|Ring|Amulet|Necklace|Crown|Helmet|Armor|Shield|Bow|Arrow|Spear|Lance|Orb|Crystal|Gem|Stone|Book|Scroll|Map|Key|Treasure|Artifact|Relic)\b/g,
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:of\s+(?:Power|Strength|Wisdom|Magic|Light|Darkness|Fire|Ice|Earth|Air|Water|Death|Life|Healing|Protection|Destruction))\b/g,
          /\b(?:his|her|their)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
        ],
        contextClues: ['weapon', 'tool', 'artifact', 'object', 'item', 'treasure', 'equipment', 'magical'],
        priority: 1
      }
    ],
    concept: [
      {
        type: 'concept',
        patterns: [
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Magic|Spell|Enchantment|Curse|Blessing|Power|Ability|Skill|Art|Science|Philosophy|Religion|Belief|Tradition|Custom|Law|Rule|Principle|Theory|Concept)\b/g,
          /\bthe\s+(?:concept|idea|notion|principle|law|rule)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
        ],
        contextClues: ['magic', 'power', 'ability', 'concept', 'idea', 'principle', 'philosophy', 'belief'],
        priority: 2
      }
    ],
    event: [
      {
        type: 'event',
        patterns: [
          /\bthe\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:War|Battle|Conflict|Revolution|Rebellion|Uprising|Siege|Invasion|Attack|Defense|Victory|Defeat|Treaty|Agreement|Alliance|Festival|Celebration|Ceremony|Ritual|Wedding|Funeral|Birth|Death|Coronation|Trial|Meeting|Conference|Summit)\b/g,
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Day|Night|Week|Month|Year|Era|Age|Period|Time|Season|Festival|Holiday|Celebration)\b/g
        ],
        contextClues: ['event', 'battle', 'war', 'ceremony', 'festival', 'celebration', 'meeting', 'happened', 'occurred'],
        priority: 2
      }
    ],
    timeline: [
      {
        type: 'timeline',
        patterns: [
          /\b(?:in|during|before|after)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Age|Era|Period|Dynasty|Reign|War|Time|Years?)\b/g,
          /\b(\d+(?:st|nd|rd|th)?\s+(?:century|millennium|year|age))\b/gi,
          /\b(Ancient|Modern|Medieval|Renaissance|Industrial|Digital|Future|Past|Present)\s+(?:times?|era|age|period)\b/gi
        ],
        contextClues: ['time', 'period', 'age', 'era', 'when', 'during', 'before', 'after', 'timeline'],
        priority: 2
      }
    ],
    theme: [
      {
        type: 'theme',
        patterns: [
          /\b(?:themes?\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:and|vs\.?|versus|against)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
          /\b(?:the\s+)?(?:theme|concept|idea)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
        ],
        contextClues: ['theme', 'moral', 'message', 'meaning', 'symbolism', 'represents', 'significance'],
        priority: 3
      }
    ],
    setting: [
      {
        type: 'setting',
        patterns: [
          /\b(?:set|takes place|occurs|happens)\s+in\s+(?:a|an|the)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:world|universe|realm|dimension|plane|reality)\b/g
        ],
        contextClues: ['setting', 'world', 'universe', 'realm', 'environment', 'background', 'context'],
        priority: 2
      }
    ],
    creature: [
      {
        type: 'creature',
        patterns: [
          /\b(?:a|an|the)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:dragon|beast|monster|creature|animal|spirit|demon|angel|god|goddess|deity|fairy|elf|dwarf|orc|goblin|troll|giant|werewolf|vampire|zombie|ghost|phantom|specter)\b/g,
          /\b([A-Z][a-z]+)\s+(?:roared|growled|hissed|flew|breathed fire|attacked|stalked|hunted)\b/g
        ],
        contextClues: ['creature', 'beast', 'monster', 'animal', 'species', 'magical being', 'mythical'],
        priority: 2
      }
    ],
    technology: [
      {
        type: 'technology',
        patterns: [
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Engine|System|Device|Machine|Computer|Robot|AI|Technology|Network|Platform|Software|Hardware|Algorithm|Protocol|Interface)\b/g,
          /\b(?:using|with|via)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:technology|system|device|platform|network)\b/g
        ],
        contextClues: ['technology', 'system', 'device', 'machine', 'computer', 'artificial', 'automated'],
        priority: 2
      }
    ],
    magic: [
      {
        type: 'magic',
        patterns: [
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Magic|Spell|Incantation|Charm|Hex|Curse|Blessing|Enchantment|Ritual|Ceremony|Summoning|Divination|Alchemy|Sorcery|Wizardry|Witchcraft)\b/g,
          /\bcast(?:ing)?\s+(?:a|an|the)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:spell|charm|hex|curse)\b/g
        ],
        contextClues: ['magic', 'magical', 'spell', 'enchanted', 'mystical', 'supernatural', 'arcane'],
        priority: 2
      }
    ],
    culture: [
      {
        type: 'culture',
        patterns: [
          /\b(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Culture|Civilization|Society|People|Tribe|Clan|Race|Species|Folk|Nation|Customs|Traditions|Beliefs|Values|Practices)\b/g,
          /\b(?:among|within)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:people|culture|society|tribe|clan|race)\b/g
        ],
        contextClues: ['culture', 'society', 'people', 'customs', 'traditions', 'beliefs', 'values', 'practices'],
        priority: 2
      }
    ]
  };

  // Common words to exclude from entity extraction
  private readonly commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'this', 'that', 'these', 'those', 'he', 'she', 'it', 'they', 'we', 'you', 'i',
    'his', 'her', 'its', 'their', 'our', 'your', 'my', 'me', 'him', 'them', 'us',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'not', 'no', 'yes', 'all', 'any', 'some', 'many', 'much', 'few', 'little', 'more', 'most',
    'good', 'bad', 'big', 'small', 'old', 'new', 'long', 'short', 'high', 'low', 'right', 'wrong',
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'first', 'second', 'third', 'last', 'next', 'previous', 'same', 'other', 'another',
    'up', 'down', 'left', 'right', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who',
    'very', 'too', 'so', 'just', 'only', 'even', 'still', 'also', 'again', 'back', 'way', 'well'
  ]);

  // Relationship indicators
  private readonly relationshipPatterns: Record<RelationshipType, RegExp[]> = {
    knows: [
      /(\w+)\s+(?:knows|knew|met|encountered|familiar with)\s+(\w+)/gi,
      /(\w+)\s+(?:and|&)\s+(\w+)\s+(?:are|were)\s+(?:friends|acquaintances|allies)/gi
    ],
    related_to: [
      /(\w+)\s+(?:is|was)\s+(?:related to|connected to|associated with)\s+(\w+)/gi,
      /(\w+)\s+(?:and|&)\s+(\w+)\s+(?:are|were)\s+(?:related|connected|associated)/gi
    ],
    located_in: [
      /(\w+)\s+(?:is|was|lives?|lived|resides?|resided|stays?|stayed)\s+(?:in|at|within|inside)\s+(\w+)/gi,
      /(?:in|at|within|inside)\s+(\w+)[\s,]+(\w+)\s+(?:can be found|is located|exists|stands)/gi
    ],
    member_of: [
      /(\w+)\s+(?:is|was)\s+(?:a member of|part of|belongs to|works for)\s+(\w+)/gi,
      /(\w+)\s+(?:joined|serves|works for|belongs to)\s+(?:the\s+)?(\w+)/gi
    ],
    owns: [
      /(\w+)\s+(?:owns|owned|possesses|possessed|has|had)\s+(?:a|an|the)?\s*(\w+)/gi,
      /(?:the|a|an)?\s*(\w+)\s+(?:belongs to|is owned by|is possessed by)\s+(\w+)/gi
    ],
    created: [
      /(\w+)\s+(?:created|made|built|constructed|designed|invented|forged|crafted)\s+(?:the|a|an)?\s*(\w+)/gi,
      /(?:the|a|an)?\s*(\w+)\s+(?:was|is)\s+(?:created|made|built|designed|invented|forged|crafted)\s+by\s+(\w+)/gi
    ],
    enemy_of: [
      /(\w+)\s+(?:is|was)\s+(?:an enemy of|enemies with|opposed to|against)\s+(\w+)/gi,
      /(\w+)\s+(?:and|&)\s+(\w+)\s+(?:are|were)\s+(?:enemies|rivals|opponents|adversaries)/gi
    ],
    friend_of: [
      /(\w+)\s+(?:is|was)\s+(?:a friend of|friends with|allied with)\s+(\w+)/gi,
      /(\w+)\s+(?:and|&)\s+(\w+)\s+(?:are|were)\s+(?:friends|allies|companions)/gi
    ],
    parent_of: [
      /(\w+)\s+(?:is|was)\s+(?:the parent of|the father of|the mother of|parent to)\s+(\w+)/gi,
      /(\w+)(?:'s|'s)\s+(?:parent|father|mother|dad|mom)\s+(?:is|was)\s+(\w+)/gi
    ],
    child_of: [
      /(\w+)\s+(?:is|was)\s+(?:the child of|the son of|the daughter of|child to)\s+(\w+)/gi,
      /(\w+)(?:'s|'s)\s+(?:child|son|daughter|kid)\s+(?:is|was)\s+(\w+)/gi
    ],
    married_to: [
      /(\w+)\s+(?:is|was)\s+(?:married to|wed to|the spouse of)\s+(\w+)/gi,
      /(\w+)\s+(?:and|&)\s+(\w+)\s+(?:are|were)\s+(?:married|wed|spouses|husband and wife)/gi
    ],
    works_for: [
      /(\w+)\s+(?:works for|works at|is employed by|serves)\s+(?:the\s+)?(\w+)/gi,
      /(\w+)\s+(?:employs|hired|recruited)\s+(\w+)/gi
    ],
    rules: [
      /(\w+)\s+(?:rules|ruled|governs|governed|leads|led|commands|commanded)\s+(?:the\s+)?(\w+)/gi,
      /(?:the\s+)?(\w+)\s+(?:is|was)\s+(?:ruled|governed|led|commanded)\s+by\s+(\w+)/gi
    ],
    part_of: [
      /(\w+)\s+(?:is|was)\s+(?:part of|a component of|an element of)\s+(?:the\s+)?(\w+)/gi,
      /(?:the\s+)?(\w+)\s+(?:contains|includes|comprises)\s+(\w+)/gi
    ],
    caused: [
      /(\w+)\s+(?:caused|triggered|led to|resulted in)\s+(?:the\s+)?(\w+)/gi,
      /(?:the\s+)?(\w+)\s+(?:was caused by|resulted from|was triggered by)\s+(\w+)/gi
    ],
    happened_at: [
      /(?:the\s+)?(\w+)\s+(?:happened|occurred|took place)\s+(?:at|in)\s+(?:the\s+)?(\w+)/gi,
      /(?:at|in)\s+(?:the\s+)?(\w+)[\s,]+(?:the\s+)?(\w+)\s+(?:happened|occurred|took place)/gi
    ],
    happened_before: [
      /(?:the\s+)?(\w+)\s+(?:happened|occurred)\s+before\s+(?:the\s+)?(\w+)/gi,
      /before\s+(?:the\s+)?(\w+)[\s,]+(?:the\s+)?(\w+)\s+(?:happened|occurred)/gi
    ],
    happened_after: [
      /(?:the\s+)?(\w+)\s+(?:happened|occurred)\s+after\s+(?:the\s+)?(\w+)/gi,
      /after\s+(?:the\s+)?(\w+)[\s,]+(?:the\s+)?(\w+)\s+(?:happened|occurred)/gi
    ]
  };

  private constructor() {}

  public static getInstance(): EntityExtractionService {
    if (!EntityExtractionService.instance) {
      EntityExtractionService.instance = new EntityExtractionService();
    }
    return EntityExtractionService.instance;
  }

  /**
   * Extract entities from document nodes and create codex entries
   */
  public async extractEntities(
    nodes: DocumentNode[],
    options: EntityExtractionOptions = this.getDefaultOptions()
  ): Promise<EntityExtractionResult> {
    const startTime = Date.now();
    
    // Combine all text content
    const fullText = nodes.map(node => node.content).join('\n\n');
    
    // Extract entities by type
    const extractedEntities: ExtractedEntity[] = [];
    const relationships: EntityRelationship[] = [];
    
    for (const entityType of options.enabledTypes) {
      const typeEntities = await this.extractEntitiesByType(
        fullText, 
        nodes, 
        entityType, 
        options
      );
      extractedEntities.push(...typeEntities);
    }

    // Extract relationships if enabled
    if (options.extractRelationships) {
      const extractedRelationships = this.extractRelationships(fullText, extractedEntities);
      relationships.push(...extractedRelationships);
    }

    // Group similar entities if enabled
    let finalEntities = extractedEntities;
    if (options.groupSimilarEntities) {
      finalEntities = this.groupSimilarEntities(extractedEntities);
    }

    // Filter by confidence threshold
    finalEntities = finalEntities.filter(entity => entity.confidence >= options.confidenceThreshold);

    // Convert to codex entries
    const codexEntries = this.convertToCodexEntries(finalEntities, relationships);

    // Generate suggestions
    const suggestions = this.generateSuggestions(codexEntries, relationships);

    // Calculate statistics
    const statistics = this.calculateStatistics(codexEntries, relationships, Date.now() - startTime);

    return {
      entities: codexEntries,
      relationships,
      suggestions,
      statistics
    };
  }

  /**
   * Extract entities of a specific type
   */
  private async extractEntitiesByType(
    text: string,
    nodes: DocumentNode[],
    type: EntityType,
    options: EntityExtractionOptions
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const patterns = this.entityPatterns[type] || [];
    
    for (const pattern of patterns) {
      for (const regex of pattern.patterns) {
        let match;
        while ((match = regex.exec(text)) !== null) {
          const entityText = match[1] || match[0];
          
          // Skip if it's a common word and exclusion is enabled
          if (options.excludeCommonWords && this.commonWords.has(entityText.toLowerCase())) {
            continue;
          }

          // Calculate confidence based on context and patterns
          const confidence = this.calculateEntityConfidence(
            entityText,
            text,
            match.index,
            pattern,
            options
          );

          if (confidence >= options.confidenceThreshold) {
            const mentions = this.findEntityMentions(entityText, text, nodes, options.contextWindow);
            const description = this.generateEntityDescription(entityText, type, mentions);
            
            entities.push({
              type,
              name: entityText,
              aliases: [],
              description,
              mentions,
              confidence
            });
          }
        }
      }
    }

    return this.deduplicateEntities(entities);
  }

  /**
   * Calculate entity confidence based on context and patterns
   */
  private calculateEntityConfidence(
    entityText: string,
    fullText: string,
    position: number,
    pattern: EntityPattern,
    options: EntityExtractionOptions
  ): number {
    let confidence = 0.5; // Base confidence

    // Pattern priority weight
    confidence += (pattern.priority / 10);

    // Context clues weight
    const contextStart = Math.max(0, position - options.contextWindow);
    const contextEnd = Math.min(fullText.length, position + entityText.length + options.contextWindow);
    const context = fullText.substring(contextStart, contextEnd).toLowerCase();
    
    const contextClueCount = pattern.contextClues.filter(clue => 
      context.includes(clue.toLowerCase())
    ).length;
    
    confidence += (contextClueCount * 0.1);

    // Capitalization weight (proper nouns are more likely to be entities)
    if (/^[A-Z][a-z]+/.test(entityText)) {
      confidence += 0.2;
    }

    // Length weight (longer names are often more specific entities)
    if (entityText.split(' ').length > 1) {
      confidence += 0.1;
    }

    // Frequency weight (mentioned multiple times)
    const mentions = (fullText.match(new RegExp(`\\b${entityText}\\b`, 'gi')) || []).length;
    if (mentions > 1) {
      confidence += Math.min(mentions * 0.05, 0.3);
    }

    // Title case weight
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(entityText)) {
      confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Find all mentions of an entity in the text
   */
  private findEntityMentions(
    entityName: string,
    text: string,
    nodes: DocumentNode[],
    contextWindow: number
  ): EntityMention[] {
    const mentions: EntityMention[] = [];
    const regex = new RegExp(`\\b${entityName}\\b`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - contextWindow);
      const end = Math.min(text.length, match.index + entityName.length + contextWindow);
      const context = text.substring(start, end);
      
      // Find which node this mention belongs to
      const nodeId = this.findNodeForPosition(match.index, nodes);

      mentions.push({
        text: match[0],
        context: context.trim(),
        position: match.index,
        nodeId
      });
    }

    return mentions;
  }

  /**
   * Find which document node contains a specific text position
   */
  private findNodeForPosition(position: number, nodes: DocumentNode[]): string | undefined {
    let currentPosition = 0;
    
    for (const node of nodes) {
      const nodeLength = node.content.length + 2; // +2 for \n\n between nodes
      if (position >= currentPosition && position < currentPosition + nodeLength) {
        return node.metadata?.id || `node-${node.order}`;
      }
      currentPosition += nodeLength;
    }
    
    return undefined;
  }

  /**
   * Generate entity description based on mentions and context
   */
  private generateEntityDescription(
    entityName: string,
    type: EntityType,
    mentions: EntityMention[]
  ): string {
    const contexts = mentions.map(m => m.context);
    const uniqueContexts = [...new Set(contexts)];
    
    // Extract descriptive phrases about the entity
    const descriptors: string[] = [];
    
    for (const context of uniqueContexts) {
      // Look for descriptive patterns
      const patterns = [
        new RegExp(`${entityName}\\s+(?:is|was)\\s+([^.!?]+)`, 'gi'),
        new RegExp(`([^.!?]+)\\s+${entityName}`, 'gi'),
        new RegExp(`${entityName}[,'s]*\\s+([^.!?]+)`, 'gi')
      ];
      
      for (const pattern of patterns) {
        const matches = context.match(pattern);
        if (matches) {
          descriptors.push(...matches);
        }
      }
    }

    // Create a basic description
    let description = `A ${type}`;
    
    if (mentions.length > 1) {
      description += ` mentioned ${mentions.length} times`;
    }
    
    if (descriptors.length > 0) {
      const cleanDescriptors = descriptors
        .map(d => d.trim())
        .filter(d => d.length > 5 && d.length < 100)
        .slice(0, 3);
      
      if (cleanDescriptors.length > 0) {
        description += `. ${cleanDescriptors.join('; ')}`;
      }
    }
    
    return description;
  }

  /**
   * Extract relationships between entities
   */
  private extractRelationships(
    text: string,
    entities: ExtractedEntity[]
  ): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];
    const entityNames = entities.map(e => e.name);
    
    for (const [relationType, patterns] of Object.entries(this.relationshipPatterns)) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const entity1 = match[1];
          const entity2 = match[2];
          
          // Check if both entities are in our extracted entities
          if (entityNames.includes(entity1) && entityNames.includes(entity2)) {
            const contextStart = Math.max(0, match.index - 50);
            const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
            const context = text.substring(contextStart, contextEnd);
            
            relationships.push({
              from: entity1,
              to: entity2,
              type: relationType as RelationshipType,
              confidence: 0.8, // Base relationship confidence
              context: context.trim()
            });
          }
        }
      }
    }

    return this.deduplicateRelationships(relationships);
  }

  /**
   * Group similar entities together
   */
  private groupSimilarEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const grouped: ExtractedEntity[] = [];
    const processed = new Set<number>();
    
    for (let i = 0; i < entities.length; i++) {
      if (processed.has(i)) continue;
      
      const mainEntity = entities[i];
      const similarEntities = [];
      
      for (let j = i + 1; j < entities.length; j++) {
        if (processed.has(j)) continue;
        
        const otherEntity = entities[j];
        if (this.areEntitiesSimilar(mainEntity, otherEntity)) {
          similarEntities.push(otherEntity);
          processed.add(j);
        }
      }
      
      if (similarEntities.length > 0) {
        // Merge similar entities
        const mergedEntity = this.mergeEntities(mainEntity, similarEntities);
        grouped.push(mergedEntity);
      } else {
        grouped.push(mainEntity);
      }
      
      processed.add(i);
    }
    
    return grouped;
  }

  /**
   * Check if two entities are similar and should be grouped
   */
  private areEntitiesSimilar(entity1: ExtractedEntity, entity2: ExtractedEntity): boolean {
    // Same type
    if (entity1.type !== entity2.type) return false;
    
    // Similar names (Levenshtein distance or partial match)
    const name1 = entity1.name.toLowerCase();
    const name2 = entity2.name.toLowerCase();
    
    // Exact match
    if (name1 === name2) return true;
    
    // One is a substring of the other
    if (name1.includes(name2) || name2.includes(name1)) return true;
    
    // Similar enough (simple similarity check)
    const similarity = this.calculateStringSimilarity(name1, name2);
    return similarity > 0.8;
  }

  /**
   * Calculate string similarity (simple version)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Merge similar entities
   */
  private mergeEntities(mainEntity: ExtractedEntity, similarEntities: ExtractedEntity[]): ExtractedEntity {
    const allEntities = [mainEntity, ...similarEntities];
    
    // Use the name with highest confidence or longest length
    const bestEntity = allEntities.reduce((best, current) => 
      current.confidence > best.confidence || 
      (current.confidence === best.confidence && current.name.length > best.name.length)
        ? current : best
    );
    
    // Collect all aliases
    const aliases = new Set<string>();
    allEntities.forEach(entity => {
      if (entity.name !== bestEntity.name) {
        aliases.add(entity.name);
      }
      entity.aliases?.forEach(alias => aliases.add(alias));
    });
    
    // Merge mentions
    const mentions: EntityMention[] = [];
    allEntities.forEach(entity => mentions.push(...entity.mentions));
    
    // Calculate average confidence
    const avgConfidence = allEntities.reduce((sum, entity) => sum + entity.confidence, 0) / allEntities.length;
    
    return {
      ...bestEntity,
      aliases: Array.from(aliases),
      mentions,
      confidence: avgConfidence
    };
  }

  /**
   * Remove duplicate entities
   */
  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Map<string, ExtractedEntity>();
    
    for (const entity of entities) {
      const key = `${entity.type}:${entity.name.toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.set(key, entity);
      } else {
        // Merge mentions if duplicate found
        const existing = seen.get(key)!;
        existing.mentions.push(...entity.mentions);
        existing.confidence = Math.max(existing.confidence, entity.confidence);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Remove duplicate relationships
   */
  private deduplicateRelationships(relationships: EntityRelationship[]): EntityRelationship[] {
    const seen = new Set<string>();
    const unique: EntityRelationship[] = [];
    
    for (const rel of relationships) {
      const key = `${rel.from}:${rel.type}:${rel.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rel);
      }
    }
    
    return unique;
  }

  /**
   * Convert extracted entities to codex entries
   */
  private convertToCodexEntries(
    entities: ExtractedEntity[],
    relationships: EntityRelationship[]
  ): CodexEntry[] {
    return entities.map(entity => {
      const entityRelationships = relationships.filter(
        rel => rel.from === entity.name || rel.to === entity.name
      );
      
      return {
        id: this.generateId(),
        type: entity.type,
        name: entity.name,
        aliases: entity.aliases || [],
        description: entity.description || `A ${entity.type} mentioned in the document.`,
        category: this.categorizeEntity(entity),
        tags: this.generateEntityTags(entity),
        relationships: entityRelationships,
        mentions: entity.mentions,
        properties: this.extractEntityProperties(entity),
        confidence: entity.confidence,
        verified: false,
        notes: `Automatically extracted from imported document. Confidence: ${Math.round(entity.confidence * 100)}%`
      };
    });
  }

  /**
   * Categorize entity based on context and type
   */
  private categorizeEntity(entity: ExtractedEntity): string {
    const context = entity.mentions.map(m => m.context.toLowerCase()).join(' ');
    
    switch (entity.type) {
      case 'character':
        if (context.includes('protagonist') || context.includes('main')) return 'main';
        if (context.includes('villain') || context.includes('enemy')) return 'antagonist';
        if (context.includes('supporting') || context.includes('friend')) return 'supporting';
        return 'character';
      
      case 'location':
        if (context.includes('city') || context.includes('town')) return 'settlement';
        if (context.includes('castle') || context.includes('palace')) return 'building';
        if (context.includes('forest') || context.includes('mountain')) return 'natural';
        return 'location';
      
      case 'item':
        if (context.includes('weapon') || context.includes('sword')) return 'weapon';
        if (context.includes('magical') || context.includes('enchanted')) return 'magical';
        if (context.includes('treasure') || context.includes('valuable')) return 'treasure';
        return 'item';
      
      default:
        return entity.type;
    }
  }

  /**
   * Generate tags for an entity based on context
   */
  private generateEntityTags(entity: ExtractedEntity): string[] {
    const tags = [entity.type];
    const context = entity.mentions.map(m => m.context.toLowerCase()).join(' ');
    
    // Common descriptive tags
    const tagPatterns = {
      'important': /important|significant|major|key|crucial|vital/,
      'mysterious': /mysterious|unknown|hidden|secret|enigmatic/,
      'powerful': /powerful|strong|mighty|great|formidable/,
      'ancient': /ancient|old|historic|legendary|mythical/,
      'magical': /magical|enchanted|mystical|supernatural|arcane/,
      'dangerous': /dangerous|deadly|threatening|hostile|evil/,
      'friendly': /friendly|kind|helpful|ally|companion/,
      'royal': /royal|noble|king|queen|prince|princess|lord|lady/,
      'military': /military|soldier|warrior|knight|guard|army/,
      'religious': /religious|holy|sacred|divine|priest|temple/
    };
    
    for (const [tag, pattern] of Object.entries(tagPatterns)) {
      if (pattern.test(context)) {
        tags.push(tag);
      }
    }
    
    return [...new Set(tags)];
  }

  /**
   * Extract additional properties for an entity
   */
  private extractEntityProperties(entity: ExtractedEntity): Record<string, any> {
    const properties: Record<string, any> = {
      mentionCount: entity.mentions.length,
      firstMention: entity.mentions[0]?.position || 0,
      extractedAt: new Date().toISOString()
    };
    
    // Type-specific properties
    switch (entity.type) {
      case 'character':
        properties.isProperNoun = /^[A-Z]/.test(entity.name);
        properties.hasTitle = /^(Mr|Mrs|Ms|Dr|Sir|Lady|Lord|Captain)\.?\s/.test(entity.name);
        break;
      
      case 'location':
        properties.isProperNoun = /^[A-Z]/.test(entity.name);
        properties.hasGeographicIndicator = /\b(City|Town|Village|Kingdom|Castle|Forest|Mountain|River|Lake)\b/i.test(entity.name);
        break;
      
      case 'item':
        properties.hasDescriptor = /\b(magical|ancient|legendary|powerful|sacred)\b/i.test(entity.mentions.join(' '));
        break;
    }
    
    return properties;
  }

  /**
   * Generate suggestions for entity management
   */
  private generateSuggestions(
    entities: CodexEntry[],
    relationships: EntityRelationship[]
  ): EntitySuggestion[] {
    const suggestions: EntitySuggestion[] = [];
    
    // Suggest merging similar entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        if (entity1.type === entity2.type && 
            this.calculateStringSimilarity(entity1.name.toLowerCase(), entity2.name.toLowerCase()) > 0.7) {
          suggestions.push({
            type: 'merge',
            entities: [entity1.name, entity2.name],
            confidence: 0.8,
            reason: 'Similar names detected',
            suggestedAction: `Consider merging "${entity1.name}" and "${entity2.name}" as they appear to be the same entity.`
          });
        }
      }
    }
    
    // Suggest categorization for uncategorized entities
    entities.forEach(entity => {
      if (!entity.category || entity.category === entity.type) {
        suggestions.push({
          type: 'categorize',
          entities: [entity.name],
          confidence: 0.6,
          reason: 'Entity needs categorization',
          suggestedAction: `Consider adding a more specific category for "${entity.name}".`
        });
      }
    });
    
    // Suggest relationship verification
    relationships.forEach(rel => {
      if (rel.confidence < 0.9) {
        suggestions.push({
          type: 'relate',
          entities: [rel.from, rel.to],
          confidence: rel.confidence,
          reason: 'Low confidence relationship',
          suggestedAction: `Verify the relationship "${rel.type}" between "${rel.from}" and "${rel.to}".`
        });
      }
    });
    
    return suggestions;
  }

  /**
   * Calculate extraction statistics
   */
  private calculateStatistics(
    entities: CodexEntry[],
    relationships: EntityRelationship[],
    processingTime: number
  ): ExtractionStatistics {
    const entitiesByType: Record<EntityType, number> = {} as Record<EntityType, number>;
    
    entities.forEach(entity => {
      entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
    });
    
    const totalMentions = entities.reduce((sum, entity) => sum + entity.mentions.length, 0);
    const averageConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length;
    
    return {
      totalEntities: entities.length,
      entitiesByType,
      averageConfidence,
      totalMentions,
      relationshipsFound: relationships.length,
      processingTime
    };
  }

  /**
   * Get default extraction options
   */
  private getDefaultOptions(): EntityExtractionOptions {
    return {
      enabledTypes: ['character', 'location', 'organization', 'item', 'concept', 'event'],
      confidenceThreshold: 0.6,
      contextWindow: 100,
      useAdvancedNLP: false,
      excludeCommonWords: true,
      groupSimilarEntities: true,
      extractRelationships: true
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const entityExtractionService = EntityExtractionService.getInstance();