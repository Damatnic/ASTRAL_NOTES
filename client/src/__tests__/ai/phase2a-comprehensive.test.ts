/**
 * Comprehensive Test Suite for Phase 2A AI-Powered Writing Workflows
 * Tests all genre-specific assistants, style analysis, content suggestions, consistency checking, and plot development
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { genreSpecificAssistants, type GenreContext } from '@/services/ai/genreSpecificAssistants';
import { personalizedStyleAnalysis, type WritingDNAProfile } from '@/services/ai/personalizedStyleAnalysis';
import { intelligentContentSuggestions, type ContentContext } from '@/services/ai/intelligentContentSuggestions';
import { consistencyChecker } from '@/services/ai/consistencyChecker';
import { plotDevelopmentAnalyzer } from '@/services/ai/plotDevelopmentAnalyzer';
import { aiWritingService } from '@/services/aiWritingService';

// Test data
const sampleTexts = {
  literaryFiction: `The morning sun cast long shadows across the cobblestone street as Margaret contemplated the weight of her decision. She had spent years building this life, brick by careful brick, only to realize that the foundation itself was built on shifting sand. The letter in her trembling hands held the power to unravel everything she thought she knew about herself.`,
  
  fantasy: `The dragon's roar echoed through the Crystal Caverns as Elara raised her staff, feeling the familiar tingle of magic coursing through her veins. The ancient runes carved into the obsidian walls began to glow with an ethereal blue light, responding to her presence. She had trained for this moment her entire life, but standing here now, facing the last guardian of the Eternal Flame, she questioned whether her magic would be enough.`,
  
  mystery: `Detective Sarah Chen examined the crime scene with practiced eyes. The victim lay sprawled across the mahogany desk, a single bullet wound to the head. What bothered her most wasn't what she found, but what was missing. The safe was open, but nothing had been taken. The computer was still on, displaying a half-finished email. Someone had wanted Dr. Harrison dead, but this wasn't a robbery gone wrong. This was personal.`,
  
  romance: `When Jake walked into the coffee shop that Tuesday morning, he had no idea his life was about to change forever. There, behind the counter, stood the most beautiful woman he'd ever seen. Her laugh was like music, and when their eyes met over his order of black coffee, he felt something shift inside his chest. "I'm Emma," she said, her smile lighting up the entire room. "And you look like you could use something stronger than coffee."`,
  
  nonFiction: `According to the latest research from MIT, artificial intelligence systems are now capable of processing natural language with 95% accuracy. This breakthrough has significant implications for how we communicate with machines and how they understand human intent. The study, published in the Journal of Computational Linguistics, analyzed over 10 million conversation samples to reach these conclusions.`,
  
  screenplay: `FADE IN:\n\nINT. SARAH'S APARTMENT - NIGHT\n\nSARAH (30s, determined, wearing a detective's badge) paces the small living room. Photos and evidence are spread across every surface.\n\nSARAH\n(into phone)\nI don't care what the captain says. This case isn't closed.\n\nShe slams the phone down and stares at a photo of the victim.\n\nSARAH (CONT'D)\n(to herself)\nThere's something we're missing.`
};

const mockCharacters = [
  {
    id: 'char1',
    name: 'Sarah Chen',
    role: 'protagonist',
    traits: ['determined', 'analytical', 'experienced'],
    goals: ['solve the case', 'find justice'],
    conflicts: ['pressure from superiors', 'personal involvement'],
    arc: 'growth through adversity',
    relationships: { 'jake': 'partner', 'captain': 'superior' },
    voice: {
      formality: 0.7,
      vocabulary: ['detective terms', 'police jargon'],
      speechPatterns: ['direct questions', 'short sentences'],
      dialects: [],
      emotionalDefault: 'professional',
      quirks: ['taps pen when thinking']
    },
    knowledge: ['police procedure', 'forensics', 'criminal psychology'],
    currentState: {
      location: 'crime scene',
      emotionalState: 'focused',
      motivation: 'solve the case',
      knownInformation: ['victim identity', 'time of death'],
      relationships: { 'jake': 'trusting' }
    }
  }
];

const mockWorldElements = [
  {
    id: 'world1',
    type: 'location',
    name: 'Crystal Caverns',
    description: 'Ancient magical caverns with crystal formations',
    rules: ['magic amplifies here', 'echoes carry for miles'],
    relationships: ['connected to Eternal Flame'],
    history: 'Built by ancient mages',
    currentState: 'active magical site'
  },
  {
    id: 'world2',
    type: 'magic-system',
    name: 'Elemental Magic',
    description: 'Magic based on natural elements',
    rules: ['requires physical focus item', 'drains user energy', 'stronger near elemental sources'],
    relationships: ['tied to ancient bloodlines'],
    history: 'Discovered 1000 years ago',
    currentState: 'widely practiced'
  }
];

const mockPlotThreads = [
  {
    id: 'thread1',
    name: 'Murder Investigation',
    description: 'Detective investigates mysterious murder',
    type: 'main',
    status: 'developing',
    elements: [
      {
        id: 'elem1',
        type: 'setup',
        description: 'Murder discovered',
        importance: 0.9,
        dependencies: [],
        location: { documentId: 'doc1', position: 0 }
      }
    ],
    dependencies: [],
    conflicts: [
      {
        id: 'conflict1',
        type: 'interpersonal',
        description: 'Detective vs. pressure from superiors',
        participants: ['sarah', 'captain'],
        stakes: 'career vs. justice',
        escalation: [],
        resolution: undefined
      }
    ],
    milestones: [],
    currentStage: 'investigation',
    completionPercentage: 0.3,
    plantedElements: [],
    payoffs: [],
    foreshadowing: []
  }
];

describe('Phase 2A AI-Powered Writing Workflows', () => {
  beforeAll(async () => {
    // Initialize all AI services
    await genreSpecificAssistants.initialize();
    await personalizedStyleAnalysis.initialize();
    await intelligentContentSuggestions.initialize();
    await consistencyChecker.initialize();
    await plotDevelopmentAnalyzer.initialize();
    await aiWritingService.initializePhase2A();
  });

  describe('Genre-Specific AI Assistants', () => {
    test('should provide literary fiction analysis', async () => {
      const context: GenreContext = {
        genre: 'literary-fiction',
        text: sampleTexts.literaryFiction,
        characters: mockCharacters,
        worldElements: [],
        plotPoints: [],
        themes: ['self-discovery', 'identity']
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(context);

      expect(analysis).toBeDefined();
      expect(analysis.genre).toBe('Literary Fiction');
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.suggestions).toBeInstanceOf(Array);
      expect(analysis.genreElements).toBeInstanceOf(Array);
    });

    test('should provide fantasy/sci-fi analysis', async () => {
      const context: GenreContext = {
        genre: 'fantasy-scifi',
        text: sampleTexts.fantasy,
        characters: mockCharacters,
        worldElements: mockWorldElements,
        plotPoints: [],
        themes: ['magic', 'heroism']
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(context);

      expect(analysis).toBeDefined();
      expect(analysis.genre).toBe('Fantasy/Sci-Fi');
      expect(analysis.suggestions.some(s => s.category === 'world')).toBe(true);
    });

    test('should provide mystery/thriller analysis', async () => {
      const context: GenreContext = {
        genre: 'mystery-thriller',
        text: sampleTexts.mystery,
        characters: mockCharacters,
        plotPoints: mockPlotThreads,
        themes: ['justice', 'truth']
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(context);

      expect(analysis).toBeDefined();
      expect(analysis.genre).toBe('Mystery/Thriller');
      expect(analysis.suggestions.some(s => s.category === 'plot' || s.category === 'tension')).toBe(true);
    });

    test('should provide romance analysis', async () => {
      const context: GenreContext = {
        genre: 'romance',
        text: sampleTexts.romance,
        characters: mockCharacters,
        themes: ['love', 'connection']
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(context);

      expect(analysis).toBeDefined();
      expect(analysis.genre).toBe('Romance');
      expect(analysis.suggestions.some(s => s.category === 'character')).toBe(true);
    });

    test('should provide non-fiction analysis', async () => {
      const context: GenreContext = {
        genre: 'non-fiction',
        text: sampleTexts.nonFiction,
        targetAudience: 'general'
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(context);

      expect(analysis).toBeDefined();
      expect(analysis.genre).toBe('Non-Fiction');
      expect(analysis.suggestions.some(s => s.category === 'style')).toBe(true);
    });

    test('should provide screenplay analysis', async () => {
      const context: GenreContext = {
        genre: 'screenplay',
        text: sampleTexts.screenplay,
        characters: mockCharacters
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(context);

      expect(analysis).toBeDefined();
      expect(analysis.genre).toBe('Screenplay');
      expect(analysis.suggestions.some(s => s.category === 'dialogue' || s.category === 'style')).toBe(true);
    });

    test('should provide genre-specific prompts', () => {
      const literaryPrompts = genreSpecificAssistants.getGenrePrompts('literary-fiction');
      const fantasyPrompts = genreSpecificAssistants.getGenrePrompts('fantasy-scifi');
      const mysteryPrompts = genreSpecificAssistants.getGenrePrompts('mystery-thriller');

      expect(literaryPrompts).toBeInstanceOf(Array);
      expect(literaryPrompts.length).toBeGreaterThan(0);
      expect(fantasyPrompts).toBeInstanceOf(Array);
      expect(fantasyPrompts.length).toBeGreaterThan(0);
      expect(mysteryPrompts).toBeInstanceOf(Array);
      expect(mysteryPrompts.length).toBeGreaterThan(0);

      // Check that prompts are genre-specific
      expect(literaryPrompts.some(p => p.includes('symbolic') || p.includes('theme'))).toBe(true);
      expect(fantasyPrompts.some(p => p.includes('magic') || p.includes('world'))).toBe(true);
      expect(mysteryPrompts.some(p => p.includes('clue') || p.includes('tension'))).toBe(true);
    });
  });

  describe('Personalized Writing Style Analysis', () => {
    let testProfile: WritingDNAProfile;

    test('should create writing DNA profile', async () => {
      const authorId = 'test-author-1';
      const texts = [sampleTexts.literaryFiction, sampleTexts.mystery];

      testProfile = await personalizedStyleAnalysis.createOrUpdateProfile(authorId, texts);

      expect(testProfile).toBeDefined();
      expect(testProfile.authorId).toBe(authorId);
      expect(testProfile.styleSignature).toBeDefined();
      expect(testProfile.voiceCharacteristics).toBeDefined();
      expect(testProfile.writingPatterns).toBeDefined();
      expect(testProfile.consistencyScore).toBeGreaterThan(0);
    });

    test('should update existing profile', async () => {
      const authorId = 'test-author-1';
      const newTexts = [sampleTexts.romance, sampleTexts.nonFiction];

      const updatedProfile = await personalizedStyleAnalysis.createOrUpdateProfile(authorId, newTexts);

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.authorId).toBe(authorId);
      expect(updatedProfile.evolutionHistory.length).toBeGreaterThan(0);
      expect(updatedProfile.lastUpdated.getTime()).toBeGreaterThan(testProfile.createdAt.getTime());
    });

    test('should analyze voice consistency', async () => {
      const analysis = await personalizedStyleAnalysis.analyzeVoiceConsistency(
        sampleTexts.literaryFiction, 
        testProfile
      );

      expect(analysis).toBeDefined();
      expect(analysis.overallConsistency).toBeGreaterThan(0);
      expect(analysis.characterVoices).toBeInstanceOf(Array);
      expect(analysis.narratorConsistency).toBeGreaterThan(0);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    test('should provide adaptive suggestions', async () => {
      const suggestions = await personalizedStyleAnalysis.getAdaptiveSuggestions(
        sampleTexts.mystery,
        testProfile
      );

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty('relevance');
        expect(suggestions[0]).toHaveProperty('description');
        expect(suggestions[0]).toHaveProperty('confidence');
      }
    });

    test('should learn from feedback', async () => {
      await personalizedStyleAnalysis.learnFromFeedback(
        'test-suggestion-1',
        'accepted',
        testProfile,
        'User found this suggestion helpful',
        'Improved clarity'
      );

      const updatedProfile = personalizedStyleAnalysis.getProfile(testProfile.authorId);
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile!.learningData.acceptedSuggestions.length).toBeGreaterThan(0);
    });

    test('should track style evolution', () => {
      const evolutionReport = personalizedStyleAnalysis.getStyleEvolutionReport(testProfile);

      expect(evolutionReport).toBeDefined();
      expect(evolutionReport.hasEvolution).toBeDefined();
      expect(evolutionReport.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Intelligent Content Suggestions', () => {
    const mockContentContext: ContentContext = {
      precedingText: sampleTexts.mystery,
      currentSentence: 'She needed to find',
      cursorPosition: 100,
      characters: mockCharacters,
      plotPoints: mockPlotThreads,
      worldElements: mockWorldElements,
      themes: [{ id: 'theme1', name: 'Justice', description: 'Quest for justice', manifestations: [], symbols: [], conflicts: [], development: [] }],
      currentScene: {
        id: 'scene1',
        purpose: 'investigation',
        setting: {
          location: 'crime scene',
          timeOfDay: 'morning',
          atmosphere: 'tense',
          sensoryDetails: { visual: ['blood'], auditory: [], tactile: [], olfactory: [], gustatory: [] },
          significance: 'discovery of evidence'
        },
        characters: ['sarah'],
        conflicts: [],
        emotions: { startingEmotion: 'focused', targetEmotion: 'determined', progressionBeats: [], intensity: 0.7, authenticity: 0.8 },
        pacing: { overall: 'moderate', actionPacing: 0.6, dialoguePacing: 0.5, descriptionPacing: 0.7, transitionPacing: 0.6 },
        dynamics: { tension: 0.8, momentum: 0.7, engagement: 0.8, clarity: 0.9, purpose: 0.9 },
        goals: ['find evidence'],
        outcomes: ['clue discovered']
      },
      previousScenes: [],
      userPreferences: {
        suggestionTypes: ['completion', 'enhancement'],
        autocompletionLevel: 'moderate',
        creativityLevel: 0.7,
        consistencyFocus: 0.8,
        stylePreservation: 0.8
      },
      documentStructure: {
        type: 'novel',
        chapters: [],
        outline: [],
        currentProgress: { totalWords: 1000, completedChapters: 0, currentChapter: 1, percentComplete: 0.1 }
      },
      metadata: {
        genre: 'mystery-thriller',
        targetAudience: 'adult',
        wordCountGoal: 80000,
        tags: ['detective', 'murder'],
        notes: []
      }
    };

    test('should generate intelligent content suggestions', async () => {
      const suggestions = await intelligentContentSuggestions.generateSuggestions(mockContentContext);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('suggestion');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('should analyze scene dynamics', async () => {
      const analysis = await intelligentContentSuggestions.analyzeSceneDynamics(
        sampleTexts.mystery,
        mockContentContext
      );

      expect(analysis).toBeDefined();
      expect(analysis.sceneId).toBe('scene1');
      expect(analysis.effectiveness).toBeDefined();
      expect(analysis.dynamics).toBeDefined();
      expect(analysis.improvements).toBeInstanceOf(Array);
      expect(analysis.strengths).toBeInstanceOf(Array);
      expect(analysis.weaknesses).toBeInstanceOf(Array);
    });

    test('should provide contextual completions', async () => {
      const completions = await intelligentContentSuggestions.getContextualCompletions(
        'Detective Sarah',
        14,
        mockContentContext
      );

      expect(completions).toBeInstanceOf(Array);
      
      if (completions.length > 0) {
        expect(completions[0]).toHaveProperty('text');
        expect(completions[0]).toHaveProperty('confidence');
        expect(completions[0]).toHaveProperty('contextRelevance');
      }
    });

    test('should analyze emotional progression', () => {
      const targetArc = {
        startingEmotion: 'curious',
        targetEmotion: 'determined',
        progressionBeats: [],
        intensity: 0.8,
        authenticity: 0.9
      };

      const analysis = intelligentContentSuggestions.analyzeEmotionalProgression(
        sampleTexts.mystery,
        targetArc
      );

      expect(analysis).toBeDefined();
      expect(analysis.overallProgression).toBeDefined();
      expect(analysis.consistency).toBeDefined();
      expect(analysis.beats).toBeInstanceOf(Array);
      expect(analysis.suggestions).toBeInstanceOf(Array);
      expect(analysis.authenticity).toBeDefined();
    });

    test('should generate dialogue improvements', async () => {
      const dialogue = '"I don\'t care what the captain says," she said.';
      const character = mockCharacters[0];

      const improvements = await intelligentContentSuggestions.generateDialogueImprovements(
        dialogue,
        character,
        mockContentContext
      );

      expect(improvements).toBeInstanceOf(Array);
      
      if (improvements.length > 0) {
        expect(improvements[0]).toHaveProperty('type');
        expect(improvements[0]).toHaveProperty('priority');
        expect(improvements[0]).toHaveProperty('description');
        expect(improvements[0]).toHaveProperty('suggestion');
      }
    });
  });

  describe('Automated Consistency Checking', () => {
    const mockDocuments = [
      {
        id: 'doc1',
        content: sampleTexts.mystery,
        chapter: 1,
        metadata: { genre: 'mystery' }
      },
      {
        id: 'doc2',
        content: sampleTexts.fantasy,
        chapter: 2,
        metadata: { genre: 'fantasy' }
      }
    ];

    test('should perform comprehensive consistency check', async () => {
      const report = await consistencyChecker.performConsistencyCheck(
        mockDocuments,
        mockCharacters,
        mockWorldElements,
        mockPlotThreads
      );

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.issues).toBeInstanceOf(Array);
      expect(report.timeline).toBeDefined();
      expect(report.characters).toBeInstanceOf(Array);
      expect(report.world).toBeDefined();
      expect(report.plot).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    test('should monitor real-time consistency', async () => {
      const newText = 'Sarah suddenly gained magical powers and cast a spell.';
      const context = {
        currentCharacter: 'sarah',
        currentLocation: 'police station',
        currentTime: 'morning',
        recentEvents: ['crime discovered']
      };

      const alerts = await consistencyChecker.monitorRealTimeConsistency(newText, context);

      expect(alerts).toBeInstanceOf(Array);
      
      if (alerts.length > 0) {
        expect(alerts[0]).toHaveProperty('type');
        expect(alerts[0]).toHaveProperty('message');
        expect(alerts[0]).toHaveProperty('confidence');
      }
    });

    test('should generate auto-fix suggestions', async () => {
      const mockIssue = {
        id: 'issue1',
        type: 'character' as const,
        category: 'trait-inconsistency',
        severity: 'major' as const,
        title: 'Character Trait Inconsistency',
        description: 'Character shows conflicting traits',
        explanation: 'Sarah is described as both shy and confident',
        locations: [],
        affectedElements: ['sarah'],
        suggestedFix: 'Clarify character development',
        alternativeFixes: [],
        autoFixable: true,
        context: {
          relatedCharacters: ['sarah'],
          relatedLocations: [],
          relatedEvents: [],
          relatedFacts: [],
          timeframe: 'current',
          dependencies: []
        },
        confidence: 0.8,
        detectedAt: new Date(),
        status: 'open' as const
      };

      const autoFix = await consistencyChecker.generateAutoFix(mockIssue);

      if (autoFix) {
        expect(autoFix).toHaveProperty('description');
        expect(autoFix).toHaveProperty('changes');
        expect(autoFix).toHaveProperty('confidence');
      }
    });
  });

  describe('Plot Development Analyzer', () => {
    const mockManuscript = {
      id: 'manuscript1',
      content: sampleTexts.mystery + '\n\n' + sampleTexts.fantasy,
      chapters: [
        {
          id: 'chapter1',
          title: 'The Discovery',
          content: sampleTexts.mystery,
          wordCount: 500,
          scenes: []
        }
      ],
      characters: mockCharacters,
      metadata: { genre: 'mystery' }
    };

    test('should analyze plot development', async () => {
      const analysis = await plotDevelopmentAnalyzer.analyzePlotDevelopment(
        mockManuscript,
        'three-act',
        'mystery-thriller'
      );

      expect(analysis).toBeDefined();
      expect(analysis.structure).toBeDefined();
      expect(analysis.characterArcs).toBeInstanceOf(Array);
      expect(analysis.pacing).toBeDefined();
      expect(analysis.engagement).toBeDefined();
      expect(analysis.recommendations).toBeInstanceOf(Array);
      expect(analysis.optimization).toBeDefined();
    });

    test('should optimize character arc', async () => {
      const optimization = await plotDevelopmentAnalyzer.optimizeCharacterArc(
        'char1',
        mockManuscript
      );

      expect(optimization).toBeDefined();
      expect(optimization.strengths).toBeInstanceOf(Array);
      expect(optimization.weaknesses).toBeInstanceOf(Array);
      expect(optimization.opportunities).toBeInstanceOf(Array);
      expect(optimization.threats).toBeInstanceOf(Array);
      expect(optimization.recommendations).toBeInstanceOf(Array);
    });

    test('should analyze individual scenes', async () => {
      const mockScene = {
        id: 'scene1',
        title: 'Crime Scene Investigation',
        purpose: { primary: 'plot-advancement' as const, secondary: [], significance: 0.9 },
        setting: {
          location: 'office',
          time: 'morning',
          atmosphere: 'tense',
          significance: 'discovery location'
        },
        characters: ['sarah'],
        conflicts: [],
        content: sampleTexts.mystery,
        wordCount: 200,
        beats: [],
        effectiveness: { purposeFulfillment: 0.8, engagement: 0.7, clarity: 0.9, pacing: 0.6, emotionalImpact: 0.7 },
        contribution: { plotAdvancement: 0.9, characterDevelopment: 0.5, worldBuilding: 0.3, themeExploration: 0.4, tensionBuilding: 0.8 },
        quality: { writingQuality: 0.8, dialogue: 0.7, description: 0.8, action: 0.6, overall: 0.75 }
      };

      const context = {
        previousScenes: [],
        plotContext: 'murder investigation',
        characterContext: mockCharacters,
        thematicContext: ['justice', 'truth']
      };

      const analysis = await plotDevelopmentAnalyzer.analyzeScene(mockScene, context);

      expect(analysis).toBeDefined();
      expect(analysis.sceneId).toBe('scene1');
      expect(analysis.effectiveness).toBeDefined();
      expect(analysis.contribution).toBeDefined();
      expect(analysis.quality).toBeDefined();
    });

    test('should generate structural recommendations', async () => {
      const mockStructure = {
        id: 'structure1',
        type: 'three-act' as const,
        title: 'Three-Act Structure',
        description: 'Classic dramatic structure',
        acts: [],
        plotPoints: [],
        pacing: {} as any,
        adherence: 0.7,
        effectiveness: 0.8,
        recommendations: [],
        genreAlignment: {} as any,
        audienceExpectations: []
      };

      const recommendations = await plotDevelopmentAnalyzer.generateStructuralRecommendations(
        mockManuscript,
        mockStructure,
        'mystery-thriller'
      );

      expect(recommendations).toBeInstanceOf(Array);
      
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('category');
        expect(recommendations[0]).toHaveProperty('priority');
        expect(recommendations[0]).toHaveProperty('title');
        expect(recommendations[0]).toHaveProperty('description');
      }
    });

    test('should provide real-time plot development feedback', async () => {
      const newContent = 'Sarah discovered a crucial clue that changed everything.';
      const context = {
        currentChapter: 1,
        currentScene: 'scene1',
        recentContent: sampleTexts.mystery,
        plotProgress: 0.3,
        characterStates: { sarah: { motivation: 'solve case' } }
      };

      const feedback = await plotDevelopmentAnalyzer.analyzeRealTimePlotDevelopment(
        newContent,
        context,
        mockManuscript
      );

      expect(feedback).toBeDefined();
      expect(feedback.plotAdvancement).toBeDefined();
      expect(feedback.characterDevelopment).toBeDefined();
      expect(feedback.structuralAlignment).toBeDefined();
      expect(feedback.pacing).toBeDefined();
      expect(feedback.suggestions).toBeInstanceOf(Array);
      expect(feedback.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Comprehensive AI Writing Service Integration', () => {
    test('should check Phase 2A availability', () => {
      const isEnabled = aiWritingService.isPhase2AEnabled();
      expect(typeof isEnabled).toBe('boolean');
    });

    test('should perform comprehensive analysis', async () => {
      const result = await aiWritingService.performComprehensiveAnalysis(
        sampleTexts.mystery,
        {
          genre: 'mystery-thriller',
          authorId: 'test-author',
          characters: mockCharacters,
          worldElements: mockWorldElements,
          plotThreads: mockPlotThreads
        }
      );

      expect(result).toBeDefined();
      expect(result.basicAnalysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('should integrate all Phase 2A features', async () => {
      // Test genre analysis
      const genreContext: GenreContext = {
        genre: 'mystery-thriller',
        text: sampleTexts.mystery,
        characters: mockCharacters
      };
      const genreAnalysis = await aiWritingService.analyzeWithGenre(genreContext);
      expect(genreAnalysis).toBeDefined();

      // Test style analysis
      const profile = await aiWritingService.createWritingDNAProfile('test-author', [sampleTexts.mystery]);
      expect(profile).toBeDefined();

      // Test voice consistency
      const voiceAnalysis = await aiWritingService.analyzeVoiceConsistency(sampleTexts.mystery, profile);
      expect(voiceAnalysis).toBeDefined();

      // Test content suggestions
      const contentContext: ContentContext = {
        precedingText: sampleTexts.mystery,
        currentSentence: '',
        cursorPosition: 0,
        characters: mockCharacters,
        plotPoints: mockPlotThreads,
        worldElements: mockWorldElements,
        themes: [],
        currentScene: {
          id: 'scene1',
          purpose: 'investigation',
          setting: { location: '', timeOfDay: '', atmosphere: '', sensoryDetails: { visual: [], auditory: [], tactile: [], olfactory: [], gustatory: [] }, significance: '' },
          characters: [],
          conflicts: [],
          emotions: { startingEmotion: '', targetEmotion: '', progressionBeats: [], intensity: 0, authenticity: 0 },
          pacing: { overall: 'moderate', actionPacing: 0, dialoguePacing: 0, descriptionPacing: 0, transitionPacing: 0 },
          dynamics: { tension: 0, momentum: 0, engagement: 0, clarity: 0, purpose: 0 },
          goals: [],
          outcomes: []
        },
        previousScenes: [],
        userPreferences: { suggestionTypes: [], autocompletionLevel: 'moderate', creativityLevel: 0.7, consistencyFocus: 0.8, stylePreservation: 0.8 },
        documentStructure: { type: 'novel', chapters: [], outline: [], currentProgress: { totalWords: 0, completedChapters: 0, currentChapter: 1, percentComplete: 0 } },
        metadata: { genre: 'mystery-thriller', targetAudience: '', wordCountGoal: 0, tags: [], notes: [] }
      };
      const suggestions = await aiWritingService.generateIntelligentSuggestions(contentContext);
      expect(suggestions).toBeInstanceOf(Array);

      // Test consistency checking
      const documents = [{ id: 'doc1', content: sampleTexts.mystery, metadata: {} }];
      const consistencyReport = await aiWritingService.performConsistencyCheck(
        documents,
        mockCharacters,
        mockWorldElements,
        mockPlotThreads
      );
      expect(consistencyReport).toBeDefined();
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle empty content gracefully', async () => {
      const emptyContext: GenreContext = {
        genre: 'literary-fiction',
        text: '',
        characters: [],
        worldElements: [],
        plotPoints: [],
        themes: []
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(emptyContext);
      expect(analysis).toBeDefined();
      expect(analysis.suggestions).toBeInstanceOf(Array);
    });

    test('should handle invalid genre gracefully', async () => {
      const invalidContext = {
        genre: 'invalid-genre' as any,
        text: sampleTexts.literaryFiction,
        characters: [],
        worldElements: [],
        plotPoints: [],
        themes: []
      };

      const analysis = await genreSpecificAssistants.analyzeWithGenre(invalidContext);
      expect(analysis).toBeDefined();
    });

    test('should handle large content efficiently', async () => {
      const largeText = sampleTexts.literaryFiction.repeat(100); // ~50KB text
      const startTime = Date.now();

      const profile = await personalizedStyleAnalysis.createOrUpdateProfile('large-text-author', [largeText]);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(profile).toBeDefined();
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should maintain service health', async () => {
      const healthCheck = await aiWritingService.healthCheck();
      
      expect(healthCheck).toBeDefined();
      expect(healthCheck.status).toBeDefined();
      expect(healthCheck.checks).toBeDefined();
    });
  });

  describe('User Experience and Feedback', () => {
    test('should provide meaningful error messages', async () => {
      try {
        await plotDevelopmentAnalyzer.optimizeCharacterArc('non-existent-character', {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Character arc not found');
      }
    });

    test('should maintain user preferences', async () => {
      const profile = await personalizedStyleAnalysis.createOrUpdateProfile('pref-test-author', [sampleTexts.literaryFiction]);
      
      // Test preference learning
      await personalizedStyleAnalysis.learnFromFeedback(
        'test-suggestion',
        'rejected',
        profile,
        'Too formal for my style'
      );

      const updatedProfile = personalizedStyleAnalysis.getProfile(profile.authorId);
      expect(updatedProfile!.learningData.rejectedSuggestions.length).toBeGreaterThan(0);
    });

    test('should provide actionable recommendations', async () => {
      const analysis = await aiWritingService.performComprehensiveAnalysis(
        sampleTexts.mystery,
        { genre: 'mystery-thriller' }
      );

      expect(analysis.recommendations).toBeInstanceOf(Array);
      
      if (analysis.recommendations.length > 0) {
        const rec = analysis.recommendations[0];
        expect(rec.suggestions).toBeInstanceOf(Array);
        expect(rec.suggestions.length).toBeGreaterThan(0);
        expect(rec.title).toBeTruthy();
        expect(rec.description).toBeTruthy();
      }
    });
  });
});

// Additional utility tests
describe('Phase 2A Utility Functions', () => {
  test('should properly classify writing styles', () => {
    const literaryFeatures = genreSpecificAssistants.getGenrePrompts('literary-fiction');
    const mysteryFeatures = genreSpecificAssistants.getGenrePrompts('mystery-thriller');
    
    expect(literaryFeatures).not.toEqual(mysteryFeatures);
    expect(literaryFeatures.some(f => f.toLowerCase().includes('symbol') || f.toLowerCase().includes('theme'))).toBe(true);
    expect(mysteryFeatures.some(f => f.toLowerCase().includes('clue') || f.toLowerCase().includes('suspect'))).toBe(true);
  });

  test('should maintain consistency across service calls', async () => {
    const text = sampleTexts.literaryFiction;
    const authorId = 'consistency-test-author';

    // Create profile twice - should be consistent
    const profile1 = await personalizedStyleAnalysis.createOrUpdateProfile(authorId, [text]);
    const profile2 = await personalizedStyleAnalysis.createOrUpdateProfile(authorId, [text]);

    expect(profile1.authorId).toBe(profile2.authorId);
    expect(Math.abs(profile1.consistencyScore - profile2.consistencyScore)).toBeLessThan(0.1);
  });

  test('should handle concurrent requests properly', async () => {
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        genreSpecificAssistants.analyzeWithGenre({
          genre: 'literary-fiction',
          text: sampleTexts.literaryFiction,
          characters: [],
          worldElements: [],
          plotPoints: [],
          themes: []
        })
      );
    }

    const results = await Promise.all(promises);
    
    expect(results.length).toBe(5);
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.genre).toBe('Literary Fiction');
    });
  });
});