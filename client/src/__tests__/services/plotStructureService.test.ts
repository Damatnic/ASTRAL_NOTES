import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlotStructureService, PlotPoint, StoryArc, CharacterDevelopment } from '../../services/plotStructureService';

describe('PlotStructureService', () => {
  let service: PlotStructureService;
  let plotPointId: string;
  let storyArcId: string;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    if (service) {
      service.removeAllListeners();
    }
    
    service = new PlotStructureService();
    service.setActiveProject('test-project');
  });

  describe('Plot Point Management', () => {
    it('should create a new plot point', () => {
      const plotPointData = {
        name: 'Opening Scene',
        description: 'The story begins',
        type: 'opening' as const,
        position: 5,
        tags: ['dramatic'],
        characterIds: ['char1'],
        locationIds: ['loc1'],
        notes: 'Important opening',
        completed: false
      };

      const plotPoint = service.createPlotPoint(plotPointData);

      expect(plotPoint).toBeDefined();
      expect(plotPoint.id).toBeDefined();
      expect(plotPoint.name).toBe('Opening Scene');
      expect(plotPoint.type).toBe('opening');
      expect(plotPoint.position).toBe(5);
      expect(plotPoint.timestamp).toBeDefined();
    });

    it('should update an existing plot point', async () => {
      const plotPoint = service.createPlotPoint({
        name: 'Original Name',
        description: 'Original description',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = service.updatePlotPoint(plotPoint.id, {
        name: 'Updated Name',
        description: 'Updated description',
        completed: true
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('Updated description');
      expect(updated!.completed).toBe(true);
    });

    it('should delete a plot point', () => {
      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test description',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const deleted = service.deletePlotPoint(plotPoint.id);
      expect(deleted).toBe(true);

      const retrieved = service.getPlotPoint(plotPoint.id);
      expect(retrieved).toBeNull();
    });

    it('should get plot point by ID', () => {
      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test description',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const retrieved = service.getPlotPoint(plotPoint.id);
      expect(retrieved).toEqual(plotPoint);
    });

    it('should return null for non-existent plot point', () => {
      const retrieved = service.getPlotPoint('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all plot points sorted by position', () => {
      service.createPlotPoint({
        name: 'Third Point',
        description: 'Third',
        type: 'climax',
        position: 90,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.createPlotPoint({
        name: 'First Point',
        description: 'First',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.createPlotPoint({
        name: 'Second Point',
        description: 'Second',
        type: 'midpoint',
        position: 50,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const allPoints = service.getAllPlotPoints();
      expect(allPoints).toHaveLength(3);
      expect(allPoints[0].name).toBe('First Point');
      expect(allPoints[1].name).toBe('Second Point');
      expect(allPoints[2].name).toBe('Third Point');
    });

    it('should get plot points by type', () => {
      service.createPlotPoint({
        name: 'Opening 1',
        description: 'First opening',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.createPlotPoint({
        name: 'Opening 2',
        description: 'Second opening',
        type: 'opening',
        position: 10,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.createPlotPoint({
        name: 'Climax',
        description: 'The climax',
        type: 'climax',
        position: 90,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const openingPoints = service.getPlotPointsByType('opening');
      expect(openingPoints).toHaveLength(2);
      expect(openingPoints.every(pp => pp.type === 'opening')).toBe(true);
    });
  });

  describe('Story Arc Management', () => {
    it('should create a new story arc', () => {
      const arcData = {
        name: 'Main Story',
        description: 'The main storyline',
        type: 'main' as const,
        plotPoints: [],
        characterIds: ['char1', 'char2'],
        startPosition: 0,
        endPosition: 100,
        priority: 'high' as const,
        status: 'planning' as const,
        tags: ['main-arc'],
        notes: 'Important arc'
      };

      const arc = service.createStoryArc(arcData);

      expect(arc).toBeDefined();
      expect(arc.id).toBeDefined();
      expect(arc.name).toBe('Main Story');
      expect(arc.type).toBe('main');
      expect(arc.createdAt).toBeDefined();
      expect(arc.updatedAt).toBeDefined();
    });

    it('should update an existing story arc', async () => {
      const arc = service.createStoryArc({
        name: 'Original Arc',
        description: 'Original description',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = service.updateStoryArc(arc.id, {
        name: 'Updated Arc',
        status: 'in_progress',
        priority: 'high'
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Arc');
      expect(updated!.status).toBe('in_progress');
      expect(updated!.priority).toBe('high');
      expect(updated!.updatedAt).toBeGreaterThan(arc.updatedAt);
    });

    it('should delete a story arc', () => {
      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test description',
        type: 'subplot',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 50,
        priority: 'low',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const deleted = service.deleteStoryArc(arc.id);
      expect(deleted).toBe(true);

      const retrieved = service.getStoryArc(arc.id);
      expect(retrieved).toBeNull();
    });

    it('should get story arc by ID', () => {
      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test description',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const retrieved = service.getStoryArc(arc.id);
      expect(retrieved).toEqual(arc);
    });

    it('should return null for non-existent story arc', () => {
      const retrieved = service.getStoryArc('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all story arcs sorted by start position', () => {
      service.createStoryArc({
        name: 'Third Arc',
        description: 'Third',
        type: 'subplot',
        plotPoints: [],
        characterIds: [],
        startPosition: 50,
        endPosition: 100,
        priority: 'low',
        status: 'planning',
        tags: [],
        notes: ''
      });

      service.createStoryArc({
        name: 'First Arc',
        description: 'First',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'high',
        status: 'planning',
        tags: [],
        notes: ''
      });

      service.createStoryArc({
        name: 'Second Arc',
        description: 'Second',
        type: 'character',
        plotPoints: [],
        characterIds: [],
        startPosition: 25,
        endPosition: 75,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const allArcs = service.getAllStoryArcs();
      expect(allArcs).toHaveLength(3);
      expect(allArcs[0].name).toBe('First Arc');
      expect(allArcs[1].name).toBe('Second Arc');
      expect(allArcs[2].name).toBe('Third Arc');
    });

    it('should get story arcs by type', () => {
      service.createStoryArc({
        name: 'Main Arc 1',
        description: 'First main arc',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'high',
        status: 'planning',
        tags: [],
        notes: ''
      });

      service.createStoryArc({
        name: 'Subplot 1',
        description: 'First subplot',
        type: 'subplot',
        plotPoints: [],
        characterIds: [],
        startPosition: 20,
        endPosition: 80,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      service.createStoryArc({
        name: 'Main Arc 2',
        description: 'Second main arc',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 50,
        priority: 'high',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const mainArcs = service.getStoryArcsByType('main');
      expect(mainArcs).toHaveLength(2);
      expect(mainArcs.every(arc => arc.type === 'main')).toBe(true);
    });
  });

  describe('Plot Point and Arc Relationships', () => {
    it('should add plot point to story arc', () => {
      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const added = service.addPlotPointToArc(arc.id, plotPoint.id);
      expect(added).toBe(true);

      const updatedArc = service.getStoryArc(arc.id);
      expect(updatedArc!.plotPoints).toContain(plotPoint.id);
    });

    it('should remove plot point from story arc', () => {
      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [plotPoint.id],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const removed = service.removePlotPointFromArc(arc.id, plotPoint.id);
      expect(removed).toBe(true);

      const updatedArc = service.getStoryArc(arc.id);
      expect(updatedArc!.plotPoints).not.toContain(plotPoint.id);
    });

    it('should return false when adding plot point to non-existent arc', () => {
      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const added = service.addPlotPointToArc('non-existent', plotPoint.id);
      expect(added).toBe(false);
    });

    it('should return false when adding non-existent plot point to arc', () => {
      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const added = service.addPlotPointToArc(arc.id, 'non-existent');
      expect(added).toBe(false);
    });

    it('should sort plot points in arc by position', () => {
      const point1 = service.createPlotPoint({
        name: 'Third Point',
        description: 'Third',
        type: 'climax',
        position: 90,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const point2 = service.createPlotPoint({
        name: 'First Point',
        description: 'First',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const point3 = service.createPlotPoint({
        name: 'Second Point',
        description: 'Second',
        type: 'midpoint',
        position: 50,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      service.addPlotPointToArc(arc.id, point1.id);
      service.addPlotPointToArc(arc.id, point2.id);
      service.addPlotPointToArc(arc.id, point3.id);

      const updatedArc = service.getStoryArc(arc.id);
      const plotPoints = updatedArc!.plotPoints.map(id => service.getPlotPoint(id)!);
      
      expect(plotPoints[0].position).toBe(5);
      expect(plotPoints[1].position).toBe(50);
      expect(plotPoints[2].position).toBe(90);
    });
  });

  describe('Character Development', () => {
    it('should create character development', () => {
      const development: CharacterDevelopment = {
        characterId: 'char1',
        arcId: 'arc1',
        startingTraits: ['shy', 'insecure'],
        endingTraits: ['confident', 'brave'],
        motivations: ['save family'],
        conflicts: ['internal doubt'],
        growth: ['overcomes fear'],
        keyMoments: ['first challenge', 'mentor meeting'],
        relationshipChanges: { 'char2': 'becomes ally' }
      };

      const created = service.createCharacterDevelopment(development);
      expect(created).toEqual(development);

      const retrieved = service.getCharacterDevelopment('char1');
      expect(retrieved).toEqual(development);
    });

    it('should update character development', () => {
      const development: CharacterDevelopment = {
        characterId: 'char1',
        arcId: 'arc1',
        startingTraits: ['shy'],
        endingTraits: ['confident'],
        motivations: ['save family'],
        conflicts: ['internal doubt'],
        growth: ['overcomes fear'],
        keyMoments: ['first challenge'],
        relationshipChanges: {}
      };

      service.createCharacterDevelopment(development);

      const updated = service.updateCharacterDevelopment('char1', {
        endingTraits: ['confident', 'brave'],
        keyMoments: ['first challenge', 'mentor meeting', 'final test']
      });

      expect(updated).toBeDefined();
      expect(updated!.endingTraits).toEqual(['confident', 'brave']);
      expect(updated!.keyMoments).toHaveLength(3);
    });

    it('should get all character developments', () => {
      const dev1: CharacterDevelopment = {
        characterId: 'char1',
        arcId: 'arc1',
        startingTraits: ['shy'],
        endingTraits: ['confident'],
        motivations: ['save family'],
        conflicts: ['internal doubt'],
        growth: ['overcomes fear'],
        keyMoments: ['first challenge'],
        relationshipChanges: {}
      };

      const dev2: CharacterDevelopment = {
        characterId: 'char2',
        arcId: 'arc2',
        startingTraits: ['arrogant'],
        endingTraits: ['humble'],
        motivations: ['prove worth'],
        conflicts: ['pride'],
        growth: ['learns humility'],
        keyMoments: ['failure moment'],
        relationshipChanges: {}
      };

      service.createCharacterDevelopment(dev1);
      service.createCharacterDevelopment(dev2);

      const allDevelopments = service.getAllCharacterDevelopments();
      expect(allDevelopments).toHaveLength(2);
    });

    it('should get character developments by arc', () => {
      const dev1: CharacterDevelopment = {
        characterId: 'char1',
        arcId: 'arc1',
        startingTraits: ['shy'],
        endingTraits: ['confident'],
        motivations: ['save family'],
        conflicts: ['internal doubt'],
        growth: ['overcomes fear'],
        keyMoments: ['first challenge'],
        relationshipChanges: {}
      };

      const dev2: CharacterDevelopment = {
        characterId: 'char2',
        arcId: 'arc1',
        startingTraits: ['arrogant'],
        endingTraits: ['humble'],
        motivations: ['prove worth'],
        conflicts: ['pride'],
        growth: ['learns humility'],
        keyMoments: ['failure moment'],
        relationshipChanges: {}
      };

      const dev3: CharacterDevelopment = {
        characterId: 'char3',
        arcId: 'arc2',
        startingTraits: ['naive'],
        endingTraits: ['wise'],
        motivations: ['understand world'],
        conflicts: ['innocence'],
        growth: ['gains wisdom'],
        keyMoments: ['revelation'],
        relationshipChanges: {}
      };

      service.createCharacterDevelopment(dev1);
      service.createCharacterDevelopment(dev2);
      service.createCharacterDevelopment(dev3);

      const arc1Developments = service.getCharacterDevelopmentsByArc('arc1');
      expect(arc1Developments).toHaveLength(2);
      expect(arc1Developments.every(dev => dev.arcId === 'arc1')).toBe(true);
    });
  });

  describe('Templates', () => {
    it('should get available templates', () => {
      const templates = service.getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const threeAct = templates.find(t => t.id === 'three_act');
      expect(threeAct).toBeDefined();
      expect(threeAct!.name).toBe('Three-Act Structure');
      
      const heroJourney = templates.find(t => t.id === 'heros_journey');
      expect(heroJourney).toBeDefined();
      expect(heroJourney!.name).toBe("Hero's Journey");
    });

    it('should create story from template', () => {
      const created = service.createFromTemplate('three_act', 'My Story');
      expect(created).toBe(true);

      const plotPoints = service.getAllPlotPoints();
      expect(plotPoints.length).toBeGreaterThan(0);
      
      const storyArcs = service.getAllStoryArcs();
      expect(storyArcs).toHaveLength(1);
      expect(storyArcs[0].name).toBe('My Story - Main Arc');
    });

    it('should return false when creating from non-existent template', () => {
      const created = service.createFromTemplate('non-existent');
      expect(created).toBe(false);
    });
  });

  describe('Narrative Analysis', () => {
    beforeEach(() => {
      service.createPlotPoint({
        name: 'Opening',
        description: 'Story begins',
        type: 'opening',
        position: 5,
        tags: ['theme:courage'],
        characterIds: ['char1'],
        locationIds: [],
        notes: '',
        completed: true
      });

      service.createPlotPoint({
        name: 'Inciting Incident',
        description: 'Call to adventure',
        type: 'inciting_incident',
        position: 15,
        tags: ['theme:courage'],
        characterIds: ['char1'],
        locationIds: [],
        notes: '',
        completed: true
      });

      service.createPlotPoint({
        name: 'Climax',
        description: 'Final battle',
        type: 'climax',
        position: 90,
        tags: ['theme:courage', 'action'],
        characterIds: ['char1'],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.createStoryArc({
        name: 'Main Arc',
        description: 'Main story',
        type: 'main',
        plotPoints: [],
        characterIds: ['char1'],
        startPosition: 0,
        endPosition: 100,
        priority: 'high',
        status: 'in_progress',
        tags: ['theme:courage'],
        notes: ''
      });

      const dev: CharacterDevelopment = {
        characterId: 'char1',
        arcId: 'arc1',
        startingTraits: ['coward'],
        endingTraits: ['hero'],
        motivations: ['save village'],
        conflicts: ['fear'],
        growth: ['becomes brave', 'overcomes fear'],
        keyMoments: ['first fight', 'mentor death', 'final battle', 'training'],
        relationshipChanges: {}
      };

      service.createCharacterDevelopment(dev);
    });

    it('should analyze narrative overview', () => {
      const analysis = service.analyzeNarrative();
      
      expect(analysis.overview.totalArcs).toBe(1);
      expect(analysis.overview.totalPlotPoints).toBe(3);
      expect(analysis.overview.completionRate).toBeCloseTo(66.67, 1);
      expect(analysis.overview.averageArcLength).toBe(100);
      expect(analysis.overview.structureType).toBe('undefined');
    });

    it('should analyze pacing', () => {
      const analysis = service.analyzeNarrative();
      
      expect(analysis.pacing.actBreakdown.act1).toBe(2);
      expect(analysis.pacing.actBreakdown.act2).toBe(0);
      expect(analysis.pacing.actBreakdown.act3).toBe(1);
      expect(analysis.pacing.tensionCurve).toHaveLength(3);
      expect(analysis.pacing.pacingIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should analyze character development', () => {
      const analysis = service.analyzeNarrative();
      
      expect(analysis.characterDevelopment.totalCharacters).toBe(1);
      expect(analysis.characterDevelopment.developmentArcs).toBe(1);
      expect(analysis.characterDevelopment.underdevelopedCharacters.length).toBeGreaterThanOrEqual(0);
      expect(analysis.characterDevelopment.overlapIssues).toHaveLength(0);
    });

    it('should analyze structure', () => {
      const analysis = service.analyzeNarrative();
      
      expect(analysis.structure.missingElements).toContain('resolution');
      expect(analysis.structure.structuralIssues.length).toBeGreaterThanOrEqual(0);
      expect(analysis.structure.suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should analyze themes', () => {
      const analysis = service.analyzeNarrative();
      
      expect(analysis.themes.identifiedThemes).toContain('courage');
      expect(analysis.themes.themeConsistency).toBeGreaterThan(0);
      expect(analysis.themes.themeDistribution.courage).toBeGreaterThan(0);
    });

    it('should identify three-act structure', () => {
      service.createPlotPoint({
        name: 'Plot Point 1',
        description: 'End of Act 1',
        type: 'plot_point_1',
        position: 25,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.createPlotPoint({
        name: 'Plot Point 2',
        description: 'End of Act 2',
        type: 'plot_point_2',
        position: 75,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const analysis = service.analyzeNarrative();
      expect(analysis.overview.structureType).toBe('three_act');
    });

    it('should handle empty world analysis', () => {
      service.clearAllData();
      
      const analysis = service.analyzeNarrative();
      expect(analysis.overview.totalArcs).toBe(0);
      expect(analysis.overview.totalPlotPoints).toBe(0);
      expect(analysis.overview.completionRate).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    it('should search plot points by query', () => {
      service.createPlotPoint({
        name: 'Hero Arrives',
        description: 'The hero arrives in town',
        type: 'opening',
        position: 5,
        tags: ['arrival'],
        characterIds: [],
        locationIds: [],
        notes: 'Important scene',
        completed: false
      });

      service.createPlotPoint({
        name: 'Villain Appears',
        description: 'The villain makes first appearance',
        type: 'inciting_incident',
        position: 15,
        tags: ['villain'],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const heroResults = service.searchPlotPoints('hero');
      expect(heroResults).toHaveLength(1);
      expect(heroResults[0].name).toBe('Hero Arrives');

      const arrivalResults = service.searchPlotPoints('arrival');
      expect(arrivalResults).toHaveLength(1);

      const importantResults = service.searchPlotPoints('important');
      expect(importantResults).toHaveLength(1);
    });

    it('should search story arcs by query', () => {
      service.createStoryArc({
        name: 'Hero Journey',
        description: 'The hero\'s transformation',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'high',
        status: 'planning',
        tags: ['transformation'],
        notes: 'Main storyline'
      });

      service.createStoryArc({
        name: 'Romance Subplot',
        description: 'Love interest development',
        type: 'romantic',
        plotPoints: [],
        characterIds: [],
        startPosition: 20,
        endPosition: 80,
        priority: 'medium',
        status: 'planning',
        tags: ['romance'],
        notes: ''
      });

      const heroResults = service.searchStoryArcs('hero');
      expect(heroResults).toHaveLength(1);
      expect(heroResults[0].name).toBe('Hero Journey');

      const transformationResults = service.searchStoryArcs('transformation');
      expect(transformationResults).toHaveLength(1);

      const storylineResults = service.searchStoryArcs('storyline');
      expect(storylineResults).toHaveLength(1);
    });
  });

  describe('Export/Import Functionality', () => {
    beforeEach(() => {
      service.createPlotPoint({
        name: 'Test Point',
        description: 'Test plot point',
        type: 'opening',
        position: 5,
        tags: ['test'],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.createStoryArc({
        name: 'Test Arc',
        description: 'Test story arc',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });
    });

    it('should export plot structure as JSON', () => {
      const exported = service.exportPlotStructure('json');
      expect(exported).toBeDefined();
      
      const data = JSON.parse(exported);
      expect(data.plotPoints).toHaveLength(1);
      expect(data.storyArcs).toHaveLength(1);
      expect(data.exportedAt).toBeDefined();
    });

    it('should export plot structure as Markdown', () => {
      const exported = service.exportPlotStructure('markdown');
      expect(exported).toBeDefined();
      expect(exported).toContain('# Plot Structure Export');
      expect(exported).toContain('## Story Arcs');
      expect(exported).toContain('## Plot Points');
      expect(exported).toContain('Test Arc');
      expect(exported).toContain('Test Point');
    });

    it('should import plot structure', () => {
      const exportData = service.exportPlotStructure('json');
      service.clearAllData();
      
      expect(service.getAllPlotPoints()).toHaveLength(0);
      expect(service.getAllStoryArcs()).toHaveLength(0);
      
      const imported = service.importPlotStructure(exportData);
      expect(imported).toBe(true);
      
      expect(service.getAllPlotPoints()).toHaveLength(1);
      expect(service.getAllStoryArcs()).toHaveLength(1);
    });

    it('should handle invalid import data', () => {
      const imported = service.importPlotStructure('invalid json');
      expect(imported).toBe(false);
    });
  });

  describe('Settings Management', () => {
    it('should get default settings', () => {
      const settings = service.getSettings();
      expect(settings.defaultTemplate).toBe('three_act');
      expect(settings.autoSuggestConnections).toBe(true);
      expect(settings.trackCharacterArcs).toBe(true);
      expect(settings.enablePacingAnalysis).toBe(true);
      expect(settings.showProgressIndicators).toBe(true);
    });

    it('should update settings', () => {
      service.updateSettings({
        defaultTemplate: 'heros_journey',
        autoSuggestConnections: false
      });

      const settings = service.getSettings();
      expect(settings.defaultTemplate).toBe('heros_journey');
      expect(settings.autoSuggestConnections).toBe(false);
      expect(settings.trackCharacterArcs).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data to localStorage', () => {
      service.createPlotPoint({
        name: 'Persistent Point',
        description: 'This should persist',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const saved = localStorage.getItem('plotStructure_test-project');
      expect(saved).not.toBeNull();
      expect(saved).not.toBe('undefined');
      
      const data = JSON.parse(saved!);
      expect(data.plotPoints).toBeDefined();
      expect(data.plotPoints.length).toBeGreaterThan(0);
    });

    it('should load existing data from localStorage', () => {
      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      // Verify data was saved
      const saved = localStorage.getItem('plotStructure_test-project');
      expect(saved).not.toBeNull();
      expect(saved).not.toBe('undefined');

      const newService = new PlotStructureService();
      newService.setActiveProject('test-project');
      
      const loadedPoint = newService.getPlotPoint(plotPoint.id);
      expect(loadedPoint).not.toBeNull();
      expect(loadedPoint?.name).toBe('Test Point');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('plotStructure_test-project', 'invalid json');
      
      const newService = new PlotStructureService();
      newService.setActiveProject('test-project');
      
      expect(newService.getAllPlotPoints()).toHaveLength(0);
    });
  });

  describe('Event Handling', () => {
    it('should emit plotPointCreated event', () => {
      const eventSpy = vi.fn();
      service.on('plotPointCreated', eventSpy);

      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      expect(eventSpy).toHaveBeenCalledWith(plotPoint);
    });

    it('should emit plotPointUpdated event', () => {
      const eventSpy = vi.fn();
      service.on('plotPointUpdated', eventSpy);

      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const updated = service.updatePlotPoint(plotPoint.id, { name: 'Updated' });
      expect(eventSpy).toHaveBeenCalledWith(updated);
    });

    it('should emit plotPointDeleted event', () => {
      const eventSpy = vi.fn();
      service.on('plotPointDeleted', eventSpy);

      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      service.deletePlotPoint(plotPoint.id);
      expect(eventSpy).toHaveBeenCalledWith(plotPoint);
    });

    it('should emit storyArcCreated event', () => {
      const eventSpy = vi.fn();
      service.on('storyArcCreated', eventSpy);

      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      expect(eventSpy).toHaveBeenCalledWith(arc);
    });

    it('should emit plotPointAddedToArc event', () => {
      const eventSpy = vi.fn();
      service.on('plotPointAddedToArc', eventSpy);

      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      service.addPlotPointToArc(arc.id, plotPoint.id);
      expect(eventSpy).toHaveBeenCalledWith({ arcId: arc.id, plotPointId: plotPoint.id });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return null when updating non-existent plot point', () => {
      const updated = service.updatePlotPoint('non-existent', { name: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should return false when deleting non-existent plot point', () => {
      const deleted = service.deletePlotPoint('non-existent');
      expect(deleted).toBe(false);
    });

    it('should return null when updating non-existent story arc', () => {
      const updated = service.updateStoryArc('non-existent', { name: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should return false when deleting non-existent story arc', () => {
      const deleted = service.deleteStoryArc('non-existent');
      expect(deleted).toBe(false);
    });

    it('should return null when updating non-existent character development', () => {
      const updated = service.updateCharacterDevelopment('non-existent', { growth: ['test'] });
      expect(updated).toBeNull();
    });

    it('should handle empty search results', () => {
      const plotResults = service.searchPlotPoints('nonexistent');
      expect(plotResults).toHaveLength(0);

      const arcResults = service.searchStoryArcs('nonexistent');
      expect(arcResults).toHaveLength(0);
    });

    it('should handle plot point deletion from arcs', () => {
      const plotPoint = service.createPlotPoint({
        name: 'Test Point',
        description: 'Test',
        type: 'opening',
        position: 5,
        tags: [],
        characterIds: [],
        locationIds: [],
        notes: '',
        completed: false
      });

      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      service.addPlotPointToArc(arc.id, plotPoint.id);
      service.deletePlotPoint(plotPoint.id);

      const updatedArc = service.getStoryArc(arc.id);
      expect(updatedArc!.plotPoints).not.toContain(plotPoint.id);
    });

    it('should handle character development deletion when arc is deleted', () => {
      const arc = service.createStoryArc({
        name: 'Test Arc',
        description: 'Test',
        type: 'main',
        plotPoints: [],
        characterIds: [],
        startPosition: 0,
        endPosition: 100,
        priority: 'medium',
        status: 'planning',
        tags: [],
        notes: ''
      });

      const development: CharacterDevelopment = {
        characterId: 'char1',
        arcId: arc.id,
        startingTraits: ['shy'],
        endingTraits: ['confident'],
        motivations: ['save family'],
        conflicts: ['internal doubt'],
        growth: ['overcomes fear'],
        keyMoments: ['first challenge'],
        relationshipChanges: {}
      };

      service.createCharacterDevelopment(development);
      service.deleteStoryArc(arc.id);

      const retrievedDev = service.getCharacterDevelopment('char1');
      expect(retrievedDev).toBeNull();
    });
  });
});