import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface WorldElement {
  id: string;
  name: string;
  type: 'location' | 'character' | 'culture' | 'religion' | 'organization' | 'artifact' | 'event' | 'language' | 'species' | 'technology';
  description: string;
  category: string;
  tags: string[];
  relationships: WorldRelationship[];
  attributes: Record<string, any>;
  notes: string;
  status: 'draft' | 'developing' | 'complete' | 'published';
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  children: string[];
}

export interface WorldRelationship {
  id: string;
  targetId: string;
  type: 'connected-to' | 'part-of' | 'controls' | 'founded-by' | 'enemy-of' | 'allied-with' | 'trades-with' | 'worships' | 'created-by' | 'influences';
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
  bidirectional: boolean;
}

export interface Location extends WorldElement {
  type: 'location';
  geography: {
    terrain: string[];
    climate: string;
    size: string;
    population?: number;
    coordinates?: { x: number; y: number; z?: number };
  };
  economy: {
    primaryIndustries: string[];
    tradeRoutes: string[];
    currency?: string;
    economicStatus: 'thriving' | 'stable' | 'declining' | 'struggling';
  };
  government: {
    type: string;
    ruler?: string;
    laws: string[];
    militaryStrength: 'none' | 'weak' | 'moderate' | 'strong' | 'overwhelming';
  };
  culture: {
    languages: string[];
    religions: string[];
    customs: string[];
    architecture: string;
  };
}

export interface Character extends WorldElement {
  type: 'character';
  demographics: {
    species: string;
    age?: number;
    gender?: string;
    occupation: string;
    socialStatus: string;
    birthplace?: string;
  };
  appearance: {
    height?: string;
    build?: string;
    hairColor?: string;
    eyeColor?: string;
    distinguishingFeatures: string[];
  };
  personality: {
    traits: string[];
    motivations: string[];
    fears: string[];
    values: string[];
    flaws: string[];
  };
  abilities: {
    skills: string[];
    talents: string[];
    powers?: string[];
    equipment: string[];
  };
  background: {
    family: string[];
    education: string;
    history: string;
    secrets: string[];
  };
}

export interface Culture extends WorldElement {
  type: 'culture';
  demographics: {
    primarySpecies: string[];
    population: number;
    locations: string[];
    socialStructure: string;
  };
  beliefs: {
    religions: string[];
    philosophies: string[];
    myths: string[];
    taboos: string[];
  };
  practices: {
    traditions: string[];
    rituals: string[];
    celebrations: string[];
    artForms: string[];
  };
  language: {
    spokenLanguages: string[];
    writingSystem?: string;
    literacyRate?: number;
    linguisticTraits: string[];
  };
  technology: {
    level: 'primitive' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'futuristic';
    specializations: string[];
    innovations: string[];
  };
}

export interface WorldMap {
  id: string;
  name: string;
  description: string;
  scale: string;
  dimensions: { width: number; height: number };
  layers: MapLayer[];
  elements: MapElement[];
  settings: MapSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'base' | 'political' | 'geographical' | 'cultural' | 'trade' | 'military' | 'custom';
  visible: boolean;
  opacity: number;
  elements: string[];
}

export interface MapElement {
  id: string;
  worldElementId?: string;
  type: 'city' | 'region' | 'landmark' | 'route' | 'border' | 'label' | 'icon';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    color: string;
    borderColor?: string;
    backgroundColor?: string;
    fontSize?: number;
    icon?: string;
  };
  label: string;
  description: string;
  layerId: string;
}

export interface MapSettings {
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showCoordinates: boolean;
  backgroundColor: string;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
}

export interface WorldTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  category: 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'steampunk' | 'cyberpunk' | 'post-apocalyptic' | 'custom';
  elements: Partial<WorldElement>[];
  relationships: Partial<WorldRelationship>[];
  mapTemplates: Partial<WorldMap>[];
  settings: WorldSettings;
  metadata: {
    author: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    popularity: number;
    rating: number;
    usageCount: number;
  };
  isOfficial: boolean;
  createdAt: Date;
}

export interface WorldSettings {
  theme: string;
  genre: string;
  techLevel: 'stone-age' | 'bronze-age' | 'iron-age' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'near-future' | 'far-future';
  magicLevel: 'none' | 'rare' | 'common' | 'abundant' | 'reality-defining';
  scope: 'room' | 'building' | 'city' | 'region' | 'continent' | 'world' | 'system' | 'galaxy' | 'universe';
  realism: 'realistic' | 'semi-realistic' | 'fantastical' | 'surreal';
  complexity: 'simple' | 'moderate' | 'complex' | 'intricate';
  consistency: {
    enforceLogic: boolean;
    trackContinuity: boolean;
    validateRelationships: boolean;
    autoGenerateMissing: boolean;
  };
}

export interface WorldAnalysis {
  overview: {
    totalElements: number;
    elementsByType: Record<string, number>;
    relationshipCount: number;
    completeness: number;
  };
  structure: {
    hierarchyDepth: number;
    connectionDensity: number;
    centralElements: string[];
    isolatedElements: string[];
  };
  consistency: {
    issues: ConsistencyIssue[];
    contradictions: string[];
    gaps: string[];
    suggestions: string[];
  };
  complexity: {
    score: number;
    factors: string[];
    recommendations: string[];
  };
  development: {
    mostDeveloped: string[];
    leastDeveloped: string[];
    missingElements: string[];
    nextSteps: string[];
  };
}

export interface ConsistencyIssue {
  id: string;
  type: 'contradiction' | 'gap' | 'orphan' | 'inconsistency' | 'implausibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  elements: string[];
  description: string;
  suggestion: string;
  autoFixAvailable: boolean;
}

export interface WorldGenerator {
  generateLocation(parameters: LocationGenerationParams): Partial<Location>;
  generateCharacter(parameters: CharacterGenerationParams): Partial<Character>;
  generateCulture(parameters: CultureGenerationParams): Partial<Culture>;
  generateRelationships(elements: WorldElement[]): WorldRelationship[];
  generateNames(type: 'person' | 'place' | 'organization', style: string, count: number): string[];
}

export interface LocationGenerationParams {
  type: 'city' | 'town' | 'village' | 'wilderness' | 'dungeon' | 'landmark';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  climate: string;
  terrain: string[];
  culture?: string;
  economicFocus?: string;
}

export interface CharacterGenerationParams {
  role: 'protagonist' | 'antagonist' | 'ally' | 'neutral' | 'background';
  importance: 'major' | 'minor' | 'background';
  species: string;
  culture?: string;
  occupation?: string;
  archetypes?: string[];
}

export interface CultureGenerationParams {
  size: 'tribe' | 'city-state' | 'kingdom' | 'empire';
  environment: string;
  focus: 'military' | 'trade' | 'scholarly' | 'artistic' | 'religious';
  techLevel: string;
  values: string[];
}

export interface WorldExport {
  format: 'json' | 'markdown' | 'wiki' | 'pdf' | 'timeline' | 'map';
  options: {
    includePrivateNotes: boolean;
    includeIncomplete: boolean;
    filterByType?: string[];
    filterByTags?: string[];
    sortBy: 'name' | 'type' | 'created' | 'updated' | 'importance';
    groupBy?: 'type' | 'category' | 'location' | 'culture';
    includeRelationships: boolean;
    includeMap: boolean;
  };
}

export class WorldBuildingService extends BrowserEventEmitter {
  private worlds: Map<string, { id: string; name: string; elements: Map<string, WorldElement>; maps: Map<string, WorldMap>; settings: WorldSettings }>;
  private templates: Map<string, WorldTemplate>;
  private generator: WorldGenerator;
  private activeWorldId: string | null;

  constructor() {
    super();
    this.worlds = new Map();
    this.templates = new Map();
    this.activeWorldId = null;
    this.generator = this.createGenerator();
    
    this.initializeTemplates();
    this.loadUserData();
  }

  private createGenerator(): WorldGenerator {
    return {
      generateLocation: (params: any): Partial<Location> => {
        // Handle null/undefined parameters
        const safeParams = params || {};
        
        // Map test parameters to expected interface
        const locationParams: LocationGenerationParams = {
          type: safeParams.type || 'town',
          size: safeParams.size || 'medium',
          climate: safeParams.climate || safeParams.biome || 'temperate',
          terrain: safeParams.terrain || (safeParams.biome ? [safeParams.biome] : ['plains']),
          culture: safeParams.culture || safeParams.civilization,
          economicFocus: safeParams.economicFocus
        };

        const baseLocation: Partial<Location> = {
          name: this.generateLocationName(locationParams.type),
          type: 'location',
          description: this.generateLocationDescription(locationParams),
          category: locationParams.type,
          tags: [locationParams.type, locationParams.size, ...locationParams.terrain],
          attributes: {},
          geography: {
            terrain: locationParams.terrain,
            climate: locationParams.climate,
            size: locationParams.size,
            population: this.calculatePopulation(locationParams.type, locationParams.size)
          },
          economy: {
            primaryIndustries: this.generateIndustries(locationParams),
            tradeRoutes: [],
            economicStatus: 'stable'
          },
          government: {
            type: this.generateGovernmentType(locationParams.size),
            laws: [],
            militaryStrength: this.generateMilitaryStrength(locationParams.size)
          },
          culture: {
            languages: ['Common'],
            religions: [],
            customs: [],
            architecture: this.generateArchitectureStyle(locationParams)
          }
        };

        return baseLocation;
      },

      generateCharacter: (params: CharacterGenerationParams): Partial<Character> => {
        // Handle null/undefined parameters
        const safeParams = params || { species: 'Human', role: 'citizen', importance: 'minor' };
        
        const baseCharacter: Partial<Character> = {
          name: this.generateCharacterName(safeParams.species),
          type: 'character',
          description: this.generateCharacterDescription(safeParams),
          category: safeParams.role,
          tags: [safeParams.role, safeParams.importance, safeParams.species],
          attributes: {},
          demographics: {
            species: safeParams.species,
            age: this.generateAge(safeParams.species),
            occupation: safeParams.occupation || this.generateOccupation(),
            socialStatus: this.generateSocialStatus()
          },
          appearance: {
            distinguishingFeatures: this.generateDistinguishingFeatures()
          },
          personality: {
            traits: this.generatePersonalityTraits(),
            motivations: this.generateMotivations(safeParams.role),
            fears: this.generateFears(),
            values: this.generateValues(),
            flaws: this.generateFlaws()
          },
          abilities: {
            skills: this.generateSkills(params.occupation),
            talents: this.generateTalents(),
            equipment: this.generateEquipment(params.role)
          },
          background: {
            family: [],
            education: this.generateEducation(),
            history: this.generateHistory(params),
            secrets: this.generateSecrets()
          }
        };

        return baseCharacter;
      },

      generateCulture: (params: CultureGenerationParams): Partial<Culture> => {
        // Handle null/undefined parameters
        const safeParams = params || { size: 'tribe', environment: 'temperate', focus: 'trade', techLevel: 'medieval' };
        
        const baseCulture: Partial<Culture> = {
          name: this.generateCultureName(),
          type: 'culture',
          description: this.generateCultureDescription(safeParams),
          category: safeParams.size,
          tags: [safeParams.size, safeParams.environment, safeParams.focus],
          attributes: {},
          demographics: {
            primarySpecies: ['Human'],
            population: this.calculateCulturePopulation(safeParams.size),
            locations: [],
            socialStructure: this.generateSocialStructure(safeParams.size)
          },
          beliefs: {
            religions: [],
            philosophies: this.generatePhilosophies(safeParams.focus),
            myths: this.generateMyths(),
            taboos: this.generateTaboos()
          },
          practices: {
            traditions: this.generateTraditions(safeParams.focus),
            rituals: this.generateRituals(),
            celebrations: this.generateCelebrations(),
            artForms: this.generateArtForms(safeParams.focus)
          },
          language: {
            spokenLanguages: [this.generateLanguageName()],
            literacyRate: this.generateLiteracyRate(safeParams.techLevel),
            linguisticTraits: this.generateLinguisticTraits()
          },
          technology: {
            level: safeParams.techLevel as Culture['technology']['level'],
            specializations: this.generateTechSpecializations(safeParams.focus),
            innovations: this.generateInnovations(safeParams.techLevel)
          }
        };

        return baseCulture;
      },

      generateRelationships: (elements: WorldElement[]): WorldRelationship[] => {
        const relationships: WorldRelationship[] = [];
        
        for (let i = 0; i < elements.length; i++) {
          for (let j = i + 1; j < elements.length; j++) {
            const element1 = elements[i];
            const element2 = elements[j];
            
            const relationshipType = this.generateRelationshipType(element1, element2);
            if (relationshipType) {
              relationships.push({
                id: `rel-${Date.now()}-${i}-${j}`,
                targetId: element2.id,
                type: relationshipType,
                strength: this.generateRelationshipStrength(),
                description: this.generateRelationshipDescription(element1, element2, relationshipType),
                bidirectional: this.isRelationshipBidirectional(relationshipType)
              });
            }
          }
        }

        return relationships;
      },

      generateNames: (type: 'person' | 'place' | 'organization', style: string, count: number): string[] => {
        const names: string[] = [];
        for (let i = 0; i < count; i++) {
          names.push(this.generateName(type, style));
        }
        return names;
      }
    };
  }

  // Generator helper methods
  private generateLocationName(type: string): string {
    const prefixes = {
      city: ['New', 'Old', 'Great', 'Grand', 'Royal'],
      town: ['Little', 'Upper', 'Lower', 'North', 'South'],
      village: ['Green', 'Silver', 'Golden', 'Peaceful', 'Hidden'],
      wilderness: ['The', 'Wild', 'Lost', 'Ancient', 'Forgotten'],
      dungeon: ['The', 'Dark', 'Deep', 'Ancient', 'Cursed'],
      landmark: ['The', 'Great', 'Ancient', 'Sacred', 'Eternal']
    };

    const suffixes = {
      city: ['City', 'Haven', 'Gate', 'Hall', 'Reach'],
      town: ['Town', 'Bridge', 'Ford', 'Mill', 'Cross'],
      village: ['Village', 'End', 'Dale', 'Glen', 'Hollow'],
      wilderness: ['Woods', 'Forest', 'Marsh', 'Plains', 'Hills'],
      dungeon: ['Depths', 'Caverns', 'Ruins', 'Catacombs', 'Lair'],
      landmark: ['Peak', 'Tower', 'Stone', 'Falls', 'Grove']
    };

    const prefix = prefixes[type as keyof typeof prefixes]?.[Math.floor(Math.random() * 5)] || 'The';
    const suffix = suffixes[type as keyof typeof suffixes]?.[Math.floor(Math.random() * 5)] || 'Place';
    
    return `${prefix} ${suffix}`;
  }

  private generateLocationDescription(params: LocationGenerationParams): string {
    return `A ${params.size} ${params.type} characterized by ${params.terrain.join(' and ')} terrain with a ${params.climate} climate.`;
  }

  private calculatePopulation(type: string, size: string): number {
    const basePopulations = {
      city: { tiny: 5000, small: 25000, medium: 100000, large: 500000, huge: 2000000 },
      town: { tiny: 500, small: 2500, medium: 10000, large: 50000, huge: 200000 },
      village: { tiny: 50, small: 250, medium: 1000, large: 5000, huge: 20000 }
    };

    const base = basePopulations[type as keyof typeof basePopulations];
    if (!base) return 0;

    const population = base[size as keyof typeof base] || 1000;
    return Math.floor(population * (0.8 + Math.random() * 0.4)); // ±20% variation
  }

  private generateIndustries(params: LocationGenerationParams): string[] {
    const industries = {
      city: ['Trade', 'Crafting', 'Administration', 'Military'],
      town: ['Agriculture', 'Crafting', 'Trade', 'Services'],
      village: ['Agriculture', 'Fishing', 'Hunting', 'Crafting'],
      wilderness: ['Hunting', 'Gathering', 'Mining'],
      dungeon: ['Ancient Magic', 'Treasure'],
      landmark: ['Pilgrimage', 'Tourism']
    };

    const available = industries[params.type as keyof typeof industries] || ['Trade'];
    return available.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private generateGovernmentType(size: string): string {
    const governments = {
      tiny: ['Elder Council', 'Chieftain', 'Mayor'],
      small: ['Mayor', 'Lord', 'Council'],
      medium: ['Governor', 'Duke', 'Parliament'],
      large: ['King', 'Emperor', 'Senate'],
      huge: ['Emperor', 'High King', 'Republic']
    };

    const options = governments[size as keyof typeof governments] || ['Council'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateMilitaryStrength(size: string): Location['government']['militaryStrength'] {
    const strengths = {
      tiny: ['none', 'weak'],
      small: ['weak', 'moderate'],
      medium: ['moderate', 'strong'],
      large: ['strong', 'overwhelming'],
      huge: ['overwhelming']
    };

    const options = strengths[size as keyof typeof strengths] || ['moderate'];
    return options[Math.floor(Math.random() * options.length)] as Location['government']['militaryStrength'];
  }

  private generateArchitectureStyle(params: LocationGenerationParams): string {
    const styles = ['Stone', 'Timber', 'Adobe', 'Brick', 'Crystal', 'Metal', 'Organic'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private generateCharacterName(species: string): string {
    const nameComponents = {
      Human: { first: ['Aiden', 'Elena', 'Marcus', 'Sophia', 'Gareth', 'Luna'], last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'] },
      Elf: { first: ['Aelindra', 'Thalorin', 'Silviana', 'Galadren', 'Miriel', 'Eleryn'], last: ['Starweaver', 'Moonwhisper', 'Silverleaf', 'Dawnbringer', 'Nightsong', 'Stormwind'] },
      Dwarf: { first: ['Thorek', 'Daina', 'Gimli', 'Nala', 'Balin', 'Vera'], last: ['Ironforge', 'Stonebeard', 'Goldaxe', 'Deepdelver', 'Hammerfist', 'Rockbreaker'] }
    };

    const names = nameComponents[species as keyof typeof nameComponents] || nameComponents.Human;
    const firstName = names.first[Math.floor(Math.random() * names.first.length)];
    const lastName = names.last[Math.floor(Math.random() * names.last.length)];
    
    return `${firstName} ${lastName}`;
  }

  private generateCharacterDescription(params: CharacterGenerationParams): string {
    return `A ${params.importance} ${params.species} ${params.role} with a compelling backstory and unique motivations.`;
  }

  private generateAge(species: string): number {
    const ageRanges = {
      Human: { min: 16, max: 80 },
      Elf: { min: 100, max: 800 },
      Dwarf: { min: 40, max: 350 }
    };

    const range = ageRanges[species as keyof typeof ageRanges] || ageRanges.Human;
    return Math.floor(Math.random() * (range.max - range.min)) + range.min;
  }

  private generateOccupation(): string {
    const occupations = ['Merchant', 'Guard', 'Scholar', 'Artisan', 'Farmer', 'Noble', 'Priest', 'Adventurer', 'Mage', 'Thief'];
    return occupations[Math.floor(Math.random() * occupations.length)];
  }

  private generateSocialStatus(): string {
    const statuses = ['Peasant', 'Commoner', 'Merchant', 'Noble', 'Aristocrat'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private generateDistinguishingFeatures(): string[] {
    const features = ['Scar on left cheek', 'Unusual eye color', 'Distinctive voice', 'Unique tattoo', 'Missing finger', 'Prominent birthmark'];
    return features.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private generatePersonalityTraits(): string[] {
    const traits = ['Brave', 'Curious', 'Loyal', 'Cunning', 'Compassionate', 'Stubborn', 'Witty', 'Ambitious'];
    return this.selectRandom(traits, 3);
  }

  private generateMotivations(role: string): string[] {
    const motivations = {
      protagonist: ['Protect loved ones', 'Seek justice', 'Discover truth', 'Achieve greatness'],
      antagonist: ['Gain power', 'Seek revenge', 'Control others', 'Achieve immortality'],
      ally: ['Support friends', 'Uphold honor', 'Serve cause', 'Find belonging'],
      neutral: ['Survive', 'Prosper', 'Stay neutral', 'Pursue knowledge']
    };

    const options = motivations[role as keyof typeof motivations] || motivations.neutral;
    return this.selectRandom(options, 2);
  }

  private generateFears(): string[] {
    const fears = ['Death', 'Failure', 'Betrayal', 'Loss of loved ones', 'Being forgotten', 'Powerlessness'];
    return this.selectRandom(fears, 2);
  }

  private generateValues(): string[] {
    const values = ['Honor', 'Family', 'Justice', 'Freedom', 'Knowledge', 'Power', 'Compassion', 'Tradition'];
    return this.selectRandom(values, 3);
  }

  private generateFlaws(): string[] {
    const flaws = ['Pride', 'Anger', 'Greed', 'Jealousy', 'Cowardice', 'Dishonesty', 'Impulsiveness', 'Pessimism'];
    return this.selectRandom(flaws, 2);
  }

  private generateSkills(occupation?: string): string[] {
    const skillSets = {
      Merchant: ['Negotiation', 'Appraisal', 'Accounting', 'Networking'],
      Guard: ['Combat', 'Intimidation', 'Investigation', 'Athletics'],
      Scholar: ['Research', 'Languages', 'History', 'Analysis'],
      Artisan: ['Crafting', 'Artistic Vision', 'Tool Use', 'Patience'],
      Farmer: ['Animal Handling', 'Agriculture', 'Weather Reading', 'Endurance']
    };

    const skills = skillSets[occupation as keyof typeof skillSets] || ['General Knowledge', 'Common Sense'];
    return this.selectRandom(skills, 3);
  }

  private generateTalents(): string[] {
    const talents = ['Perfect Pitch', 'Eidetic Memory', 'Natural Charisma', 'Quick Reflexes', 'Intuition', 'Leadership'];
    return this.selectRandom(talents, 2);
  }

  private generateEquipment(role: string): string[] {
    const equipment = {
      protagonist: ['Sword', 'Shield', 'Armor', 'Healing Potion'],
      antagonist: ['Dark Blade', 'Cursed Amulet', 'Spell Components'],
      ally: ['Weapon', 'Useful Tool', 'Traveling Gear'],
      neutral: ['Basic Weapon', 'Work Tools', 'Personal Items']
    };

    const options = equipment[role as keyof typeof equipment] || equipment.neutral;
    return this.selectRandom(options, 3);
  }

  private generateEducation(): string {
    const educations = ['Self-taught', 'Apprenticeship', 'Formal schooling', 'University', 'Private tutoring', 'Military training'];
    return educations[Math.floor(Math.random() * educations.length)];
  }

  private generateHistory(params: CharacterGenerationParams): string {
    return `Born into a ${params.species} family, this character has developed into a ${params.role} through various life experiences.`;
  }

  private generateSecrets(): string[] {
    const secrets = ['Hidden heritage', 'Secret love', 'Past mistake', 'Hidden ability', 'Family shame', 'Lost memory'];
    return this.selectRandom(secrets, 1);
  }

  private generateCultureName(): string {
    const prefixes = ['The', 'Ancient', 'Noble', 'Free', 'United'];
    const roots = ['Sun', 'Moon', 'Star', 'Stone', 'Wood', 'Iron', 'Gold', 'Silver'];
    const suffixes = ['folk', 'people', 'clan', 'tribe', 'nation', 'empire'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const root = roots[Math.floor(Math.random() * roots.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix} ${root}${suffix}`;
  }

  private generateCultureDescription(params: CultureGenerationParams): string {
    return `A ${params.size} culture focused on ${params.focus}, living in ${params.environment} environments with ${params.techLevel} technology.`;
  }

  private calculateCulturePopulation(size: string): number {
    const populations = {
      tribe: 500 + Math.floor(Math.random() * 1000),
      'city-state': 10000 + Math.floor(Math.random() * 40000),
      kingdom: 100000 + Math.floor(Math.random() * 400000),
      empire: 1000000 + Math.floor(Math.random() * 4000000)
    };

    return populations[size as keyof typeof populations] || 10000;
  }

  private generateSocialStructure(size: string): string {
    const structures = {
      tribe: 'Tribal council with elders',
      'city-state': 'Citizen assembly with elected leaders',
      kingdom: 'Feudal hierarchy with noble houses',
      empire: 'Complex bureaucracy with emperor'
    };

    return structures[size as keyof typeof structures] || 'Hierarchical';
  }

  private generatePhilosophies(focus: string): string[] {
    const philosophies = {
      military: ['Honor in battle', 'Strength through unity', 'Victory at any cost'],
      trade: ['Prosperity through cooperation', 'Fair dealing builds trust', 'Innovation drives progress'],
      scholarly: ['Knowledge is power', 'Truth through inquiry', 'Wisdom guides action'],
      artistic: ['Beauty inspires the soul', 'Expression reveals truth', 'Art transcends mortality'],
      religious: ['Faith guides all', 'Divine will be done', 'Sacred duty above all']
    };

    const options = philosophies[focus as keyof typeof philosophies] || ['Live and let live'];
    return this.selectRandom(options, 2);
  }

  private generateMyths(): string[] {
    const myths = ['Creation story', 'Hero legend', 'Cautionary tale', 'Origin of magic', 'First king story', 'End times prophecy'];
    return this.selectRandom(myths, 2);
  }

  private generateTaboos(): string[] {
    const taboos = ['Speaking of the dead', 'Touching sacred objects', 'Eating certain foods', 'Breaking hospitality', 'Showing weakness'];
    return this.selectRandom(taboos, 2);
  }

  private generateTraditions(focus: string): string[] {
    const traditions = {
      military: ['Weapon blessing ceremony', 'Victory celebrations', 'Honor duels'],
      trade: ['Market day rituals', 'Contract ceremonies', 'Prosperity festivals'],
      scholarly: ['Knowledge sharing gatherings', 'Debate tournaments', 'Book preservation rites'],
      artistic: ['Creative competitions', 'Masterwork presentations', 'Inspiration quests'],
      religious: ['Sacred ceremonies', 'Pilgrimage journeys', 'Divine communion rites']
    };

    const options = traditions[focus as keyof typeof traditions] || ['Seasonal celebrations'];
    return this.selectRandom(options, 2);
  }

  private generateRituals(): string[] {
    const rituals = ['Coming of age', 'Marriage ceremony', 'Funeral rites', 'Harvest blessing', 'New year celebration'];
    return this.selectRandom(rituals, 3);
  }

  private generateCelebrations(): string[] {
    const celebrations = ['Founding day', 'Harvest festival', 'Midsummer celebration', 'Victory commemoration', 'Religious holy day'];
    return this.selectRandom(celebrations, 2);
  }

  private generateArtForms(focus: string): string[] {
    const artForms = {
      military: ['War songs', 'Victory dances', 'Weapon decoration', 'Battle paintings'],
      trade: ['Merchant tales', 'Prosperity symbols', 'Trade route maps', 'Commercial architecture'],
      scholarly: ['Written poetry', 'Philosophical debates', 'Historical chronicles', 'Scientific illustrations'],
      artistic: ['Fine paintings', 'Sculptures', 'Musical compositions', 'Dramatic performances'],
      religious: ['Sacred hymns', 'Religious iconography', 'Temple architecture', 'Ritual dances']
    };

    const options = artForms[focus as keyof typeof artForms] || ['Folk music', 'Storytelling'];
    return this.selectRandom(options, 3);
  }

  private generateLanguageName(): string {
    const prefixes = ['Ancient', 'High', 'Old', 'Common', 'Sacred'];
    const roots = ['Draconic', 'Elvish', 'Dwarvish', 'Celestial', 'Infernal', 'Primordial'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const root = roots[Math.floor(Math.random() * roots.length)];
    
    return `${prefix} ${root}`;
  }

  private generateLiteracyRate(techLevel: string): number {
    const rates = {
      'stone-age': 0.05,
      'bronze-age': 0.10,
      'iron-age': 0.15,
      medieval: 0.25,
      renaissance: 0.40,
      industrial: 0.70,
      modern: 0.95,
      'near-future': 0.98,
      'far-future': 0.99
    };

    const base = rates[techLevel as keyof typeof rates] || 0.50;
    return Math.min(1.0, base + (Math.random() * 0.1 - 0.05)); // ±5% variation
  }

  private generateLinguisticTraits(): string[] {
    const traits = ['Tonal', 'Agglutinative', 'Complex grammar', 'Multiple writing systems', 'Ritual language variants', 'Trade lingua franca'];
    return this.selectRandom(traits, 2);
  }

  private generateTechSpecializations(focus: string): string[] {
    const specializations = {
      military: ['Metallurgy', 'Siege engineering', 'Logistics', 'Fortification'],
      trade: ['Navigation', 'Preservation', 'Transportation', 'Communication'],
      scholarly: ['Mathematics', 'Astronomy', 'Medicine', 'Engineering'],
      artistic: ['Pigments', 'Instruments', 'Architecture', 'Textiles'],
      religious: ['Ceremonial crafts', 'Sacred geometry', 'Healing arts', 'Preservation']
    };

    const options = specializations[focus as keyof typeof specializations] || ['Basic crafts'];
    return this.selectRandom(options, 2);
  }

  private generateInnovations(techLevel: string): string[] {
    const innovations = {
      'stone-age': ['Fire making', 'Tool crafting', 'Basic agriculture'],
      'bronze-age': ['Metal working', 'Writing systems', 'Wheel technology'],
      'iron-age': ['Iron forging', 'Advanced agriculture', 'Currency systems'],
      medieval: ['Engineering', 'Navigation', 'Mechanical devices'],
      renaissance: ['Printing', 'Optics', 'Scientific method'],
      industrial: ['Steam power', 'Mass production', 'Railways'],
      modern: ['Electronics', 'Computers', 'Telecommunications'],
      'near-future': ['AI systems', 'Bioengineering', 'Quantum computing'],
      'far-future': ['Nanotechnology', 'Interstellar travel', 'Consciousness transfer']
    };

    const options = innovations[techLevel as keyof typeof innovations] || ['Basic tools'];
    return this.selectRandom(options, 2);
  }

  private generateRelationshipType(element1: WorldElement, element2: WorldElement): WorldRelationship['type'] | null {
    const typeMap = {
      'location-location': ['connected-to', 'trades-with'],
      'location-character': ['controls', 'founded-by'],
      'location-culture': ['part-of'],
      'character-character': ['allied-with', 'enemy-of'],
      'character-culture': ['part-of'],
      'culture-culture': ['allied-with', 'enemy-of', 'trades-with']
    };

    const key = `${element1.type}-${element2.type}`;
    const reverseKey = `${element2.type}-${element1.type}`;
    const options = typeMap[key as keyof typeof typeMap] || typeMap[reverseKey as keyof typeof typeMap];

    if (!options) return null;
    return options[Math.floor(Math.random() * options.length)] as WorldRelationship['type'];
  }

  private generateRelationshipStrength(): WorldRelationship['strength'] {
    const strengths: WorldRelationship['strength'][] = ['weak', 'moderate', 'strong'];
    return strengths[Math.floor(Math.random() * strengths.length)];
  }

  private generateRelationshipDescription(element1: WorldElement, element2: WorldElement, type: string): string {
    return `${element1.name} ${type.replace(/-/g, ' ')} ${element2.name}`;
  }

  private isRelationshipBidirectional(type: string): boolean {
    const bidirectional = ['connected-to', 'allied-with', 'enemy-of', 'trades-with'];
    return bidirectional.includes(type);
  }

  private generateName(type: 'person' | 'place' | 'organization', style: string): string {
    // Simple name generation - could be expanded with more sophisticated algorithms
    const components = {
      person: ['Aiden', 'Elena', 'Marcus', 'Sophia', 'Gareth', 'Luna'],
      place: ['Riverview', 'Stonebridge', 'Goldmead', 'Shadowvale', 'Brightwater'],
      organization: ['The Order', 'Brotherhood', 'Guild', 'Company', 'Alliance']
    };

    const names = components[type];
    return names[Math.floor(Math.random() * names.length)];
  }

  private selectRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  private initializeTemplates(): void {
    const templates: WorldTemplate[] = [
      {
        id: 'medieval-fantasy',
        name: 'Medieval Fantasy World',
        description: 'Classic medieval fantasy setting with kingdoms, magic, and mythical creatures',
        genre: 'fantasy',
        category: 'fantasy',
        elements: [
          {
            name: 'The Kingdom of Valeria',
            type: 'location',
            description: 'A prosperous human kingdom known for its knights and scholars',
            category: 'kingdom'
          },
          {
            name: 'King Aldric Valerian',
            type: 'character',
            description: 'The wise and just ruler of Valeria',
            category: 'ruler'
          },
          {
            name: 'The Order of the Silver Rose',
            type: 'organization',
            description: 'Elite knights dedicated to protecting the realm',
            category: 'military'
          }
        ],
        relationships: [],
        mapTemplates: [],
        settings: {
          theme: 'heroic fantasy',
          genre: 'fantasy',
          techLevel: 'medieval',
          magicLevel: 'common',
          scope: 'continent',
          realism: 'semi-realistic',
          complexity: 'moderate',
          consistency: {
            enforceLogic: true,
            trackContinuity: true,
            validateRelationships: true,
            autoGenerateMissing: false
          }
        },
        metadata: {
          author: 'System',
          difficulty: 'beginner',
          popularity: 95,
          rating: 4.8,
          usageCount: 0
        },
        isOfficial: true,
        createdAt: new Date()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private loadUserData(): void {
    try {
      const savedWorlds = localStorage.getItem('worldBuilding_worlds');
      if (savedWorlds) {
        const worlds = JSON.parse(savedWorlds);
        worlds.forEach((worldData: any) => {
          const elements = new Map<string, WorldElement>();
          worldData.elements.forEach((element: any) => {
            elements.set(element.id, {
              ...element,
              createdAt: new Date(element.createdAt),
              updatedAt: new Date(element.updatedAt)
            });
          });

          const maps = new Map<string, WorldMap>();
          worldData.maps.forEach((map: any) => {
            maps.set(map.id, {
              ...map,
              createdAt: new Date(map.createdAt),
              updatedAt: new Date(map.updatedAt)
            });
          });

          this.worlds.set(worldData.id, {
            id: worldData.id,
            name: worldData.name,
            elements,
            maps,
            settings: worldData.settings
          });
        });
      }

      const savedActiveWorld = localStorage.getItem('worldBuilding_activeWorld');
      if (savedActiveWorld) {
        this.activeWorldId = savedActiveWorld;
      }

      const savedTemplates = localStorage.getItem('worldBuilding_customTemplates');
      if (savedTemplates) {
        const templates = JSON.parse(savedTemplates);
        templates.forEach((template: any) => {
          this.templates.set(template.id, {
            ...template,
            createdAt: new Date(template.createdAt)
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load world building data:', error);
    }
  }

  private saveUserData(): void {
    try {
      const worldsData = Array.from(this.worlds.values()).map(world => ({
        id: world.id,
        name: world.name,
        elements: Array.from(world.elements.values()),
        maps: Array.from(world.maps.values()),
        settings: world.settings
      }));
      localStorage.setItem('worldBuilding_worlds', JSON.stringify(worldsData));

      if (this.activeWorldId) {
        localStorage.setItem('worldBuilding_activeWorld', this.activeWorldId);
      }

      const customTemplates = Array.from(this.templates.values()).filter(template => !template.isOfficial);
      localStorage.setItem('worldBuilding_customTemplates', JSON.stringify(customTemplates));
    } catch (error) {
      console.warn('Failed to save world building data:', error);
    }
  }

  public createWorld(name: string, settings?: Partial<WorldSettings>): string {
    const worldId = `world-${Date.now()}`;
    const defaultSettings: WorldSettings = {
      theme: 'fantasy',
      genre: 'fantasy',
      techLevel: 'medieval',
      magicLevel: 'common',
      scope: 'continent',
      realism: 'semi-realistic',
      complexity: 'moderate',
      consistency: {
        enforceLogic: true,
        trackContinuity: true,
        validateRelationships: true,
        autoGenerateMissing: false
      }
    };

    this.worlds.set(worldId, {
      id: worldId,
      name,
      elements: new Map(),
      maps: new Map(),
      settings: { ...defaultSettings, ...settings }
    });

    this.activeWorldId = worldId;
    this.saveUserData();
    this.emit('worldCreated', { worldId, name });
    return worldId;
  }

  public getWorlds(): Array<{ id: string; name: string; elementCount: number; mapCount: number }> {
    return Array.from(this.worlds.values()).map(world => ({
      id: world.id,
      name: world.name,
      elementCount: world.elements.size,
      mapCount: world.maps.size
    }));
  }

  public setActiveWorld(worldId: string): boolean {
    if (!this.worlds.has(worldId)) {
      return false;
    }

    this.activeWorldId = worldId;
    this.saveUserData();
    this.emit('activeWorldChanged', worldId);
    return true;
  }

  public getActiveWorldId(): string | null {
    return this.activeWorldId;
  }

  public createElement(elementData: Partial<WorldElement>): WorldElement | null {
    if (!this.activeWorldId) {
      return null;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return null;
    }

    const element: WorldElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: elementData.name || 'New Element',
      type: elementData.type || 'location',
      description: elementData.description || '',
      category: elementData.category || 'general',
      tags: elementData.tags || [],
      relationships: elementData.relationships || [],
      attributes: elementData.attributes || {},
      notes: elementData.notes || '',
      status: elementData.status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: elementData.parentId,
      children: elementData.children || []
    };

    world.elements.set(element.id, element);

    if (element.parentId) {
      const parent = world.elements.get(element.parentId);
      if (parent && !parent.children.includes(element.id)) {
        parent.children.push(element.id);
        parent.updatedAt = new Date();
        world.elements.set(parent.id, parent);
      }
    }

    this.saveUserData();
    this.emit('elementCreated', { worldId: this.activeWorldId, element });
    return element;
  }

  public updateElement(elementId: string, updates: Partial<WorldElement>): WorldElement | null {
    if (!this.activeWorldId) {
      return null;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return null;
    }

    const element = world.elements.get(elementId);
    if (!element) {
      return null;
    }

    const updatedElement = {
      ...element,
      ...updates,
      updatedAt: new Date()
    };

    world.elements.set(elementId, updatedElement);
    this.saveUserData();
    this.emit('elementUpdated', { worldId: this.activeWorldId, element: updatedElement });
    return updatedElement;
  }

  public deleteElement(elementId: string): boolean {
    if (!this.activeWorldId) {
      return false;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return false;
    }

    const element = world.elements.get(elementId);
    if (!element) {
      return false;
    }

    // Remove from parent's children
    if (element.parentId) {
      const parent = world.elements.get(element.parentId);
      if (parent) {
        parent.children = parent.children.filter(id => id !== elementId);
        parent.updatedAt = new Date();
        world.elements.set(parent.id, parent);
      }
    }

    // Handle children
    element.children.forEach(childId => {
      const child = world.elements.get(childId);
      if (child) {
        child.parentId = element.parentId;
        child.updatedAt = new Date();
        world.elements.set(childId, child);
      }
    });

    // Remove relationships
    world.elements.forEach(el => {
      el.relationships = el.relationships.filter(rel => rel.targetId !== elementId);
    });

    world.elements.delete(elementId);
    this.saveUserData();
    this.emit('elementDeleted', { worldId: this.activeWorldId, elementId });
    return true;
  }

  public getElements(filters?: { type?: string; category?: string; tags?: string[] }): WorldElement[] {
    if (!this.activeWorldId) {
      return [];
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return [];
    }

    let elements = Array.from(world.elements.values());

    if (filters) {
      if (filters.type) {
        elements = elements.filter(el => el.type === filters.type);
      }
      if (filters.category) {
        elements = elements.filter(el => el.category === filters.category);
      }
      if (filters.tags && filters.tags.length > 0) {
        elements = elements.filter(el => 
          filters.tags!.some(tag => el.tags.includes(tag))
        );
      }
    }

    return elements.sort((a, b) => a.name.localeCompare(b.name));
  }

  public getElementById(elementId: string): WorldElement | null {
    if (!this.activeWorldId) {
      return null;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return null;
    }

    return world.elements.get(elementId) || null;
  }

  public generateElement(type: WorldElement['type'], parameters: any): WorldElement | null {
    if (!this.activeWorldId) {
      return null;
    }

    let generated: Partial<WorldElement>;

    switch (type) {
      case 'location':
        generated = this.generator.generateLocation(parameters);
        break;
      case 'character':
        generated = this.generator.generateCharacter(parameters);
        break;
      case 'culture':
        generated = this.generator.generateCulture(parameters);
        break;
      default:
        return null;
    }

    return this.createElement(generated);
  }

  public analyzeWorld(): WorldAnalysis | null {
    if (!this.activeWorldId) {
      return null;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return null;
    }

    const elements = Array.from(world.elements.values());
    const elementsByType = elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRelationships = elements.reduce((sum, el) => sum + el.relationships.length, 0);

    // Calculate hierarchy depth
    const hierarchyDepth = this.calculateHierarchyDepth(elements);

    // Find central and isolated elements
    const connectionCounts = new Map<string, number>();
    elements.forEach(el => {
      connectionCounts.set(el.id, el.relationships.length);
      el.relationships.forEach(rel => {
        connectionCounts.set(rel.targetId, (connectionCounts.get(rel.targetId) || 0) + 1);
      });
    });

    const sortedByConnections = Array.from(connectionCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    const centralElements = sortedByConnections.slice(0, 3).map(([id]) => id);
    const isolatedElements = sortedByConnections
      .filter(([, count]) => count === 0)
      .map(([id]) => id);

    // Detect consistency issues
    const issues = this.detectConsistencyIssues(elements);

    const analysis: WorldAnalysis = {
      overview: {
        totalElements: elements.length,
        elementsByType,
        relationshipCount: totalRelationships,
        completeness: this.calculateCompleteness(elements)
      },
      structure: {
        hierarchyDepth,
        connectionDensity: elements.length > 0 ? totalRelationships / elements.length : 0,
        centralElements,
        isolatedElements
      },
      consistency: {
        issues,
        contradictions: issues.filter(i => i.type === 'contradiction').map(i => i.description),
        gaps: issues.filter(i => i.type === 'gap').map(i => i.description),
        suggestions: this.generateWorldSuggestions(elements, elementsByType)
      },
      complexity: {
        score: this.calculateComplexityScore(elements, totalRelationships),
        factors: this.getComplexityFactors(elements),
        recommendations: this.getComplexityRecommendations(elements.length)
      },
      development: {
        mostDeveloped: this.getMostDeveloped(elements),
        leastDeveloped: this.getLeastDeveloped(elements),
        missingElements: this.getMissingElements(elementsByType),
        nextSteps: this.getNextSteps(elements, elementsByType)
      }
    };

    return analysis;
  }

  private calculateHierarchyDepth(elements: WorldElement[]): number {
    let maxDepth = 0;

    const calculateDepth = (elementId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(elementId)) return 0;
      visited.add(elementId);

      const element = elements.find(el => el.id === elementId);
      if (!element || element.children.length === 0) return 1;

      return 1 + Math.max(...element.children.map(childId => calculateDepth(childId, new Set(visited))));
    };

    const rootElements = elements.filter(el => !el.parentId);
    rootElements.forEach(root => {
      maxDepth = Math.max(maxDepth, calculateDepth(root.id));
    });

    return maxDepth;
  }

  private calculateCompleteness(elements: WorldElement[]): number {
    if (elements.length === 0) return 0;

    const completenessScores = elements.map(el => {
      let score = 0;
      if (el.description && el.description.length > 50) score += 25;
      if (el.tags && el.tags.length > 0) score += 25;
      if (el.relationships && el.relationships.length > 0) score += 25;
      if (el.status === 'complete') score += 25;
      return score;
    });

    return completenessScores.reduce((sum, score) => sum + score, 0) / elements.length;
  }

  private detectConsistencyIssues(elements: WorldElement[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Find orphaned relationships
    elements.forEach(element => {
      element.relationships.forEach(rel => {
        const target = elements.find(el => el.id === rel.targetId);
        if (!target) {
          issues.push({
            id: `orphan-${Date.now()}-${element.id}`,
            type: 'orphan',
            severity: 'medium',
            elements: [element.id],
            description: `${element.name} has a relationship with non-existent element`,
            suggestion: 'Remove the orphaned relationship or create the missing element',
            autoFixAvailable: true
          });
        }
      });
    });

    // Find isolated elements
    const isolatedElements = elements.filter(el => 
      el.relationships.length === 0 && 
      !elements.some(other => other.relationships.some(rel => rel.targetId === el.id))
    );

    isolatedElements.forEach(element => {
      issues.push({
        id: `isolated-${Date.now()}-${element.id}`,
        type: 'gap',
        severity: 'low',
        elements: [element.id],
        description: `${element.name} has no relationships with other elements`,
        suggestion: 'Consider adding relationships to integrate this element into the world',
        autoFixAvailable: false
      });
    });

    return issues;
  }

  private generateWorldSuggestions(elements: WorldElement[], elementsByType: Record<string, number>): string[] {
    const suggestions: string[] = [];

    if (elements.length < 5) {
      suggestions.push('Add more elements to create a richer world');
    }

    if (!elementsByType.location || elementsByType.location < 3) {
      suggestions.push('Add more locations to provide setting variety');
    }

    if (!elementsByType.character || elementsByType.character < 2) {
      suggestions.push('Add more characters to populate your world');
    }

    if (!elementsByType.culture) {
      suggestions.push('Consider adding cultures to define how people live in your world');
    }

    const totalRelationships = elements.reduce((sum, el) => sum + el.relationships.length, 0);
    if (totalRelationships < elements.length) {
      suggestions.push('Add more relationships between elements to create connections');
    }

    return suggestions;
  }

  private calculateComplexityScore(elements: WorldElement[], relationships: number): number {
    const baseScore = elements.length * 10;
    const relationshipScore = relationships * 5;
    const typeVariety = new Set(elements.map(el => el.type)).size * 20;
    
    return Math.min(100, baseScore + relationshipScore + typeVariety);
  }

  private getComplexityFactors(elements: WorldElement[]): string[] {
    const factors: string[] = [];

    const typeCount = new Set(elements.map(el => el.type)).size;
    if (typeCount >= 5) factors.push('High element type variety');

    const avgRelationships = elements.reduce((sum, el) => sum + el.relationships.length, 0) / elements.length;
    if (avgRelationships >= 2) factors.push('Rich interconnections');

    const hierarchicalElements = elements.filter(el => el.children.length > 0 || el.parentId);
    if (hierarchicalElements.length >= elements.length * 0.5) factors.push('Hierarchical organization');

    return factors;
  }

  private getComplexityRecommendations(elementCount: number): string[] {
    const recommendations: string[] = [];

    if (elementCount < 10) {
      recommendations.push('Add more elements to increase world complexity');
    } else if (elementCount > 50) {
      recommendations.push('Consider organizing elements into hierarchies for better management');
    }

    return recommendations;
  }

  private getMostDeveloped(elements: WorldElement[]): string[] {
    return elements
      .filter(el => el.status === 'complete' && el.description.length > 100)
      .slice(0, 5)
      .map(el => el.id);
  }

  private getLeastDeveloped(elements: WorldElement[]): string[] {
    return elements
      .filter(el => el.status === 'draft' || el.description.length < 50)
      .slice(0, 5)
      .map(el => el.id);
  }

  private getMissingElements(elementsByType: Record<string, number>): string[] {
    const missing: string[] = [];
    
    const essentialTypes = ['location', 'character'];
    essentialTypes.forEach(type => {
      if (!elementsByType[type]) {
        missing.push(type);
      }
    });

    return missing;
  }

  private getNextSteps(elements: WorldElement[], elementsByType: Record<string, number>): string[] {
    const steps: string[] = [];

    if (elements.length === 0) {
      steps.push('Create your first world element');
    } else if (elements.length < 5) {
      steps.push('Add more core elements to establish your world');
    } else {
      const draftElements = elements.filter(el => el.status === 'draft');
      if (draftElements.length > 0) {
        steps.push(`Develop ${draftElements.length} draft elements`);
      }

      const unconnectedElements = elements.filter(el => el.relationships.length === 0);
      if (unconnectedElements.length > 0) {
        steps.push(`Connect ${unconnectedElements.length} isolated elements`);
      }

      if (!elementsByType.culture) {
        steps.push('Add cultural elements to define societies');
      }
    }

    return steps;
  }

  public getTemplates(): WorldTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => b.metadata.rating - a.metadata.rating);
  }

  public createWorldFromTemplate(templateId: string, worldName: string): string | null {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const worldId = this.createWorld(worldName, template.settings);
    const world = this.worlds.get(worldId);
    if (!world) {
      return null;
    }

    // Create elements from template
    const elementIdMap = new Map<string, string>();
    template.elements.forEach(elementTemplate => {
      const element = this.createElement(elementTemplate);
      if (element && elementTemplate.name) {
        elementIdMap.set(elementTemplate.name, element.id);
      }
    });

    // Create relationships
    template.relationships.forEach(relTemplate => {
      if (relTemplate.targetId) {
        const sourceElement = Array.from(world.elements.values()).find(el => 
          elementIdMap.has(el.name)
        );
        const targetId = elementIdMap.get(relTemplate.targetId);
        
        if (sourceElement && targetId && relTemplate.type) {
          sourceElement.relationships.push({
            id: `rel-${Date.now()}`,
            targetId,
            type: relTemplate.type,
            strength: relTemplate.strength || 'moderate',
            description: relTemplate.description || '',
            bidirectional: relTemplate.bidirectional || false
          });
          
          this.updateElement(sourceElement.id, sourceElement);
        }
      }
    });

    template.metadata.usageCount++;
    this.saveUserData();
    this.emit('worldCreatedFromTemplate', { worldId, templateId });
    return worldId;
  }

  public exportWorld(format: WorldExport['format'], options: WorldExport['options']): string | null {
    if (!this.activeWorldId) {
      return null;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return null;
    }

    let elements = Array.from(world.elements.values());

    // Apply filters
    const typeFilter = (options as any).elementTypes || options.filterByType;
    if (typeFilter && typeFilter.length > 0) {
      elements = elements.filter(el => typeFilter.includes(el.type));
    }

    if (options.filterByTags && options.filterByTags.length > 0) {
      elements = elements.filter(el => 
        el.tags.some(tag => options.filterByTags!.includes(tag))
      );
    }

    if (!options.includeIncomplete) {
      elements = elements.filter(el => el.status === 'complete');
    }

    // Sort elements
    elements.sort((a, b) => {
      switch (options.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'created':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });

    switch (format) {
      case 'json':
        return JSON.stringify({
          world: {
            id: world.id,
            name: world.name,
            settings: world.settings
          },
          elements: elements.map(el => ({
            ...el,
            notes: options.includePrivateNotes ? el.notes : ''
          })),
          exportedAt: new Date(),
          options
        }, null, 2);

      case 'markdown':
        return this.exportToMarkdown(world, elements, options);

      default:
        return null;
    }
  }

  private exportToMarkdown(
    world: { name: string; settings: WorldSettings }, 
    elements: WorldElement[], 
    options: WorldExport['options']
  ): string {
    const lines = [`# ${world.name}`, ''];

    if (options.groupBy === 'type') {
      const grouped = elements.reduce((acc, el) => {
        if (!acc[el.type]) acc[el.type] = [];
        acc[el.type].push(el);
        return acc;
      }, {} as Record<string, WorldElement[]>);

      Object.entries(grouped).forEach(([type, typeElements]) => {
        lines.push(`## ${type.charAt(0).toUpperCase() + type.slice(1)}s`, '');
        
        typeElements.forEach(element => {
          lines.push(`### ${element.name}`);
          lines.push(element.description);
          
          if (element.tags.length > 0) {
            lines.push(`**Tags:** ${element.tags.join(', ')}`);
          }

          if (options.includeRelationships && element.relationships.length > 0) {
            lines.push('**Relationships:**');
            element.relationships.forEach(rel => {
              lines.push(`- ${rel.type.replace(/-/g, ' ')} with ${rel.targetId} (${rel.strength})`);
            });
          }

          if (options.includePrivateNotes && element.notes) {
            lines.push('**Notes:**', element.notes);
          }

          lines.push('');
        });
      });
    } else {
      elements.forEach(element => {
        lines.push(`## ${element.name}`);
        lines.push(`**Type:** ${element.type}`);
        lines.push(element.description);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  public addRelationship(elementId: string, relationship: Omit<WorldRelationship, 'id' | 'bidirectional'>): WorldElement | null {
    if (!this.activeWorldId) {
      return null;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return null;
    }

    const element = world.elements.get(elementId);
    if (!element) {
      return null;
    }

    const fullRelationship: WorldRelationship = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...relationship,
      bidirectional: false
    };

    element.relationships.push(fullRelationship);
    element.updatedAt = new Date();

    this.saveUserData();
    this.emit('relationshipAdded', { elementId, relationship: fullRelationship });

    return element;
  }

  public removeRelationship(elementId: string, targetId: string): WorldElement | null {
    if (!this.activeWorldId) {
      return null;
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return null;
    }

    const element = world.elements.get(elementId);
    if (!element) {
      return null;
    }

    const initialLength = element.relationships.length;
    element.relationships = element.relationships.filter(rel => rel.targetId !== targetId);
    
    if (element.relationships.length < initialLength) {
      element.updatedAt = new Date();
      this.saveUserData();
      this.emit('relationshipRemoved', { elementId, targetId });
    }

    return element;
  }

  public getRelatedElements(elementId: string): WorldElement[] {
    if (!this.activeWorldId) {
      return [];
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return [];
    }

    const element = world.elements.get(elementId);
    if (!element) {
      return [];
    }

    const relatedElements: WorldElement[] = [];
    element.relationships.forEach(rel => {
      const relatedElement = world.elements.get(rel.targetId);
      if (relatedElement) {
        relatedElements.push(relatedElement);
      }
    });

    return relatedElements;
  }

  public searchElements(query: string, filters?: { type?: string; category?: string; tags?: string[] }): WorldElement[] {
    if (!this.activeWorldId) {
      return [];
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return [];
    }

    const elements = Array.from(world.elements.values());
    const lowercaseQuery = query.toLowerCase();

    return elements.filter(element => {
      // Text search
      const matchesQuery = !query || 
        element.name.toLowerCase().includes(lowercaseQuery) ||
        element.description.toLowerCase().includes(lowercaseQuery) ||
        element.notes.toLowerCase().includes(lowercaseQuery) ||
        element.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery));

      // Filter checks
      const matchesType = !filters?.type || element.type === filters.type;
      const matchesCategory = !filters?.category || element.category === filters.category;
      const matchesTags = !filters?.tags || filters.tags.every(tag => element.tags.includes(tag));

      return matchesQuery && matchesType && matchesCategory && matchesTags;
    });
  }

  public generateRelatedElements(baseType: WorldElement['type'], options: { count: number; baseType?: string; theme?: string }): WorldElement[] {
    const elements: WorldElement[] = [];
    
    for (let i = 0; i < options.count; i++) {
      const generated = this.generateElement(baseType, {
        theme: options.theme,
        variation: i
      });
      
      if (generated) {
        elements.push(generated);
      }
    }

    // Add relationships between generated elements
    for (let i = 0; i < elements.length - 1; i++) {
      const relationshipTypes: Array<WorldRelationship['type']> = ['connected-to', 'part-of', 'trades-with'];
      const randomType = relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)];
      
      this.addRelationship(elements[i].id, {
        targetId: elements[i + 1].id,
        type: randomType,
        strength: 'moderate',
        description: `Generated relationship`
      });
    }

    return elements;
  }

  public detectInconsistencies(): Array<{
    id: string;
    type: 'conflict' | 'gap' | 'redundancy';
    severity: 'low' | 'medium' | 'high';
    elements: string[];
    description: string;
    suggestion: string;
    autoFixAvailable: boolean;
  }> {
    if (!this.activeWorldId) {
      return [];
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return [];
    }

    const elements = Array.from(world.elements.values());
    const issues: Array<{
      id: string;
      type: 'conflict' | 'gap' | 'redundancy';
      severity: 'low' | 'medium' | 'high';
      elements: string[];
      description: string;
      suggestion: string;
      autoFixAvailable: boolean;
    }> = [];

    // Check for broken relationships
    elements.forEach(element => {
      element.relationships.forEach(rel => {
        const targetExists = world.elements.has(rel.targetId);
        if (!targetExists) {
          issues.push({
            id: `broken-rel-${Date.now()}-${element.id}`,
            type: 'conflict',
            severity: 'medium',
            elements: [element.id],
            description: `${element.name} has a relationship to a non-existent element`,
            suggestion: 'Remove the broken relationship or create the missing element',
            autoFixAvailable: true
          });
        }
      });
    });

    // Check for isolated elements
    const isolatedElements = elements.filter(el => 
      el.relationships.length === 0 && 
      !elements.some(other => other.relationships.some(rel => rel.targetId === el.id))
    );

    isolatedElements.forEach(element => {
      issues.push({
        id: `isolated-${Date.now()}-${element.id}`,
        type: 'gap',
        severity: 'low',
        elements: [element.id],
        description: `${element.name} has no relationships with other elements`,
        suggestion: 'Consider adding relationships to integrate this element into the world',
        autoFixAvailable: false
      });
    });

    return issues;
  }

  public suggestMissingElements(): string[] {
    if (!this.activeWorldId) {
      return [];
    }

    const world = this.worlds.get(this.activeWorldId);
    if (!world) {
      return [];
    }

    const elements = Array.from(world.elements.values());
    const elementsByType = elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const suggestions: string[] = [];

    if (elements.length < 5) {
      suggestions.push('Add more elements to create a richer world');
    }

    if (!elementsByType.location || elementsByType.location < 3) {
      suggestions.push('Add more locations to provide setting variety');
    }

    if (!elementsByType.character || elementsByType.character < 2) {
      suggestions.push('Add more characters to populate your world');
    }

    if (!elementsByType.culture) {
      suggestions.push('Consider adding cultures to define how people live in your world');
    }

    const totalRelationships = elements.reduce((sum, el) => sum + el.relationships.length, 0);
    if (totalRelationships < elements.length) {
      suggestions.push('Add more relationships between elements to create connections');
    }

    return suggestions;
  }

  public getAnalytics(): any {
    const totalWorlds = this.worlds.size;
    const totalElements = Array.from(this.worlds.values()).reduce((sum, world) => sum + world.elements.size, 0);
    
    const elementsByType = new Map<string, number>();
    this.worlds.forEach(world => {
      world.elements.forEach(element => {
        elementsByType.set(element.type, (elementsByType.get(element.type) || 0) + 1);
      });
    });

    const templateUsage = Array.from(this.templates.values())
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 5);

    return {
      worlds: {
        total: totalWorlds,
        averageElements: totalWorlds > 0 ? totalElements / totalWorlds : 0
      },
      elements: {
        total: totalElements,
        byType: Object.fromEntries(elementsByType)
      },
      templates: {
        total: this.templates.size,
        official: Array.from(this.templates.values()).filter(t => t.isOfficial).length,
        custom: Array.from(this.templates.values()).filter(t => !t.isOfficial).length,
        popular: templateUsage
      }
    };
  }
}

export const worldBuildingService = new WorldBuildingService();
export { WorldBuildingService };