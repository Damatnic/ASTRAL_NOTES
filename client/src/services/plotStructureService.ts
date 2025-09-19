import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface PlotPoint {
  id: string;
  name: string;
  description: string;
  type: 'opening' | 'inciting_incident' | 'plot_point_1' | 'midpoint' | 'plot_point_2' | 'climax' | 'resolution' | 'custom';
  position: number;
  timestamp: number;
  tags: string[];
  characterIds: string[];
  locationIds: string[];
  notes: string;
  completed: boolean;
}

export interface StoryArc {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'subplot' | 'character' | 'romantic' | 'mystery';
  plotPoints: string[];
  characterIds: string[];
  startPosition: number;
  endPosition: number;
  priority: 'high' | 'medium' | 'low';
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface CharacterDevelopment {
  characterId: string;
  arcId: string;
  startingTraits: string[];
  endingTraits: string[];
  motivations: string[];
  conflicts: string[];
  growth: string[];
  keyMoments: string[];
  relationshipChanges: Record<string, string>;
}

export interface PlotStructureTemplate {
  id: string;
  name: string;
  description: string;
  type: 'three_act' | 'five_act' | 'heros_journey' | 'seven_point' | 'save_the_cat' | 'custom';
  plotPoints: Omit<PlotPoint, 'id' | 'timestamp' | 'completed'>[];
  estimatedLength: number;
  genre: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface NarrativeAnalysis {
  overview: {
    totalArcs: number;
    totalPlotPoints: number;
    completionRate: number;
    averageArcLength: number;
    structureType: string;
  };
  pacing: {
    actBreakdown: Record<string, number>;
    tensionCurve: Array<{ position: number; intensity: number }>;
    pacingIssues: string[];
  };
  characterDevelopment: {
    totalCharacters: number;
    developmentArcs: number;
    underdevelopedCharacters: string[];
    overlapIssues: string[];
  };
  structure: {
    missingElements: string[];
    structuralIssues: string[];
    suggestions: string[];
  };
  themes: {
    identifiedThemes: string[];
    themeConsistency: number;
    themeDistribution: Record<string, number>;
  };
}

export interface PlotStructureSettings {
  defaultTemplate: string;
  autoSuggestConnections: boolean;
  trackCharacterArcs: boolean;
  enablePacingAnalysis: boolean;
  showProgressIndicators: boolean;
}

export class PlotStructureService extends BrowserEventEmitter {
  private plotPoints: Map<string, PlotPoint> = new Map();
  private storyArcs: Map<string, StoryArc> = new Map();
  private characterDevelopments: Map<string, CharacterDevelopment> = new Map();
  private templates: Map<string, PlotStructureTemplate> = new Map();
  private settings: PlotStructureSettings;
  private activeProjectId: string | null = null;

  constructor() {
    super();
    this.settings = this.getDefaultSettings();
    this.initializeTemplates();
    this.loadUserData();
  }

  private getDefaultSettings(): PlotStructureSettings {
    return {
      defaultTemplate: 'three_act',
      autoSuggestConnections: true,
      trackCharacterArcs: true,
      enablePacingAnalysis: true,
      showProgressIndicators: true
    };
  }

  private initializeTemplates(): void {
    const templates: PlotStructureTemplate[] = [
      {
        id: 'three_act',
        name: 'Three-Act Structure',
        description: 'Classic three-act story structure with setup, confrontation, and resolution',
        type: 'three_act',
        plotPoints: [
          { name: 'Opening Image', description: 'Visual representation of the story theme', type: 'opening', position: 5, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Inciting Incident', description: 'Event that sets the story in motion', type: 'inciting_incident', position: 15, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Plot Point 1', description: 'End of Act 1, protagonist commits to the journey', type: 'plot_point_1', position: 25, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Midpoint', description: 'Major revelation or turning point', type: 'midpoint', position: 50, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Plot Point 2', description: 'End of Act 2, all seems lost', type: 'plot_point_2', position: 75, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Climax', description: 'Final confrontation and resolution', type: 'climax', position: 90, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Resolution', description: 'New equilibrium and closing image', type: 'resolution', position: 95, tags: [], characterIds: [], locationIds: [], notes: '' }
        ],
        estimatedLength: 80000,
        genre: ['drama', 'thriller', 'romance'],
        complexity: 'simple'
      },
      {
        id: 'heros_journey',
        name: "Hero's Journey",
        description: 'Joseph Campbell\'s monomyth structure following the hero\'s transformation',
        type: 'heros_journey',
        plotPoints: [
          { name: 'Ordinary World', description: 'Hero\'s normal life before transformation', type: 'opening', position: 5, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Call to Adventure', description: 'Hero faces a problem or challenge', type: 'inciting_incident', position: 10, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Refusal of the Call', description: 'Hero hesitates or refuses the adventure', type: 'custom', position: 15, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Meeting the Mentor', description: 'Hero encounters wise figure who gives advice', type: 'custom', position: 20, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Crossing the Threshold', description: 'Hero commits to the adventure', type: 'plot_point_1', position: 25, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Tests and Trials', description: 'Hero faces challenges in the special world', type: 'custom', position: 40, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Ordeal', description: 'Hero faces greatest fear or difficult challenge', type: 'midpoint', position: 60, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Reward', description: 'Hero survives and gains something', type: 'custom', position: 70, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'The Road Back', description: 'Hero begins journey back to ordinary world', type: 'plot_point_2', position: 80, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Resurrection', description: 'Final test where hero is transformed', type: 'climax', position: 90, tags: [], characterIds: [], locationIds: [], notes: '' },
          { name: 'Return with Elixir', description: 'Hero returns home changed and with wisdom', type: 'resolution', position: 95, tags: [], characterIds: [], locationIds: [], notes: '' }
        ],
        estimatedLength: 100000,
        genre: ['fantasy', 'adventure', 'mythology'],
        complexity: 'complex'
      }
    ];

    templates.forEach(template => this.templates.set(template.id, template));
  }

  setActiveProject(projectId: string): void {
    this.activeProjectId = projectId;
    this.loadUserData();
  }

  createPlotPoint(data: Omit<PlotPoint, 'id' | 'timestamp'>): PlotPoint {
    const plotPoint: PlotPoint = {
      ...data,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.plotPoints.set(plotPoint.id, plotPoint);
    this.saveUserData();
    this.emit('plotPointCreated', plotPoint);
    return plotPoint;
  }

  updatePlotPoint(id: string, updates: Partial<Omit<PlotPoint, 'id' | 'timestamp'>>): PlotPoint | null {
    const plotPoint = this.plotPoints.get(id);
    if (!plotPoint) return null;

    const updatedPlotPoint = { ...plotPoint, ...updates };
    this.plotPoints.set(id, updatedPlotPoint);
    this.saveUserData();
    this.emit('plotPointUpdated', updatedPlotPoint);
    return updatedPlotPoint;
  }

  deletePlotPoint(id: string): boolean {
    const plotPoint = this.plotPoints.get(id);
    if (!plotPoint) return false;

    this.plotPoints.delete(id);
    
    this.storyArcs.forEach(arc => {
      if (arc.plotPoints.includes(id)) {
        arc.plotPoints = arc.plotPoints.filter(ppId => ppId !== id);
        this.storyArcs.set(arc.id, arc);
      }
    });

    this.saveUserData();
    this.emit('plotPointDeleted', plotPoint);
    return true;
  }

  getPlotPoint(id: string): PlotPoint | null {
    return this.plotPoints.get(id) || null;
  }

  getAllPlotPoints(): PlotPoint[] {
    return Array.from(this.plotPoints.values()).sort((a, b) => a.position - b.position);
  }

  getPlotPointsByType(type: PlotPoint['type']): PlotPoint[] {
    return this.getAllPlotPoints().filter(pp => pp.type === type);
  }

  createStoryArc(data: Omit<StoryArc, 'id' | 'createdAt' | 'updatedAt'>): StoryArc {
    const now = Date.now();
    const storyArc: StoryArc = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    this.storyArcs.set(storyArc.id, storyArc);
    this.saveUserData();
    this.emit('storyArcCreated', storyArc);
    return storyArc;
  }

  updateStoryArc(id: string, updates: Partial<Omit<StoryArc, 'id' | 'createdAt'>>): StoryArc | null {
    const storyArc = this.storyArcs.get(id);
    if (!storyArc) return null;

    const updatedArc = { ...storyArc, ...updates, updatedAt: Date.now() };
    this.storyArcs.set(id, updatedArc);
    this.saveUserData();
    this.emit('storyArcUpdated', updatedArc);
    return updatedArc;
  }

  deleteStoryArc(id: string): boolean {
    const storyArc = this.storyArcs.get(id);
    if (!storyArc) return false;

    this.storyArcs.delete(id);
    this.characterDevelopments.forEach(dev => {
      if (dev.arcId === id) {
        this.characterDevelopments.delete(dev.characterId);
      }
    });

    this.saveUserData();
    this.emit('storyArcDeleted', storyArc);
    return true;
  }

  getStoryArc(id: string): StoryArc | null {
    return this.storyArcs.get(id) || null;
  }

  getAllStoryArcs(): StoryArc[] {
    return Array.from(this.storyArcs.values()).sort((a, b) => a.startPosition - b.startPosition);
  }

  getStoryArcsByType(type: StoryArc['type']): StoryArc[] {
    return this.getAllStoryArcs().filter(arc => arc.type === type);
  }

  addPlotPointToArc(arcId: string, plotPointId: string): boolean {
    const arc = this.storyArcs.get(arcId);
    const plotPoint = this.plotPoints.get(plotPointId);
    
    if (!arc || !plotPoint) return false;
    if (arc.plotPoints.includes(plotPointId)) return false;

    arc.plotPoints.push(plotPointId);
    arc.plotPoints.sort((a, b) => {
      const ppA = this.plotPoints.get(a);
      const ppB = this.plotPoints.get(b);
      return (ppA?.position || 0) - (ppB?.position || 0);
    });

    this.storyArcs.set(arcId, { ...arc, updatedAt: Date.now() });
    this.saveUserData();
    this.emit('plotPointAddedToArc', { arcId, plotPointId });
    return true;
  }

  removePlotPointFromArc(arcId: string, plotPointId: string): boolean {
    const arc = this.storyArcs.get(arcId);
    if (!arc || !arc.plotPoints.includes(plotPointId)) return false;

    arc.plotPoints = arc.plotPoints.filter(id => id !== plotPointId);
    this.storyArcs.set(arcId, { ...arc, updatedAt: Date.now() });
    this.saveUserData();
    this.emit('plotPointRemovedFromArc', { arcId, plotPointId });
    return true;
  }

  createCharacterDevelopment(data: CharacterDevelopment): CharacterDevelopment {
    this.characterDevelopments.set(data.characterId, data);
    this.saveUserData();
    this.emit('characterDevelopmentCreated', data);
    return data;
  }

  updateCharacterDevelopment(characterId: string, updates: Partial<CharacterDevelopment>): CharacterDevelopment | null {
    const development = this.characterDevelopments.get(characterId);
    if (!development) return null;

    const updated = { ...development, ...updates };
    this.characterDevelopments.set(characterId, updated);
    this.saveUserData();
    this.emit('characterDevelopmentUpdated', updated);
    return updated;
  }

  getCharacterDevelopment(characterId: string): CharacterDevelopment | null {
    return this.characterDevelopments.get(characterId) || null;
  }

  getAllCharacterDevelopments(): CharacterDevelopment[] {
    return Array.from(this.characterDevelopments.values());
  }

  getCharacterDevelopmentsByArc(arcId: string): CharacterDevelopment[] {
    return this.getAllCharacterDevelopments().filter(dev => dev.arcId === arcId);
  }

  createFromTemplate(templateId: string, projectName: string = 'New Story'): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    template.plotPoints.forEach(ppData => {
      this.createPlotPoint({
        ...ppData,
        completed: false
      });
    });

    const mainArc = this.createStoryArc({
      name: `${projectName} - Main Arc`,
      description: `Main story arc based on ${template.name}`,
      type: 'main',
      plotPoints: [],
      characterIds: [],
      startPosition: 0,
      endPosition: 100,
      priority: 'high',
      status: 'planning',
      tags: [template.type],
      notes: `Created from ${template.name} template`
    });

    this.getAllPlotPoints().forEach(pp => {
      this.addPlotPointToArc(mainArc.id, pp.id);
    });

    this.emit('templateApplied', { templateId, arcId: mainArc.id });
    return true;
  }

  getAvailableTemplates(): PlotStructureTemplate[] {
    return Array.from(this.templates.values());
  }

  analyzeNarrative(): NarrativeAnalysis {
    const allArcs = this.getAllStoryArcs();
    const allPlotPoints = this.getAllPlotPoints();
    const allDevelopments = this.getAllCharacterDevelopments();

    const completionRate = allPlotPoints.length > 0 
      ? (allPlotPoints.filter(pp => pp.completed).length / allPlotPoints.length) * 100 
      : 0;

    const averageArcLength = allArcs.length > 0
      ? allArcs.reduce((sum, arc) => sum + (arc.endPosition - arc.startPosition), 0) / allArcs.length
      : 0;

    const actBreakdown = this.calculateActBreakdown(allPlotPoints);
    const tensionCurve = this.calculateTensionCurve(allPlotPoints);
    const structuralIssues = this.identifyStructuralIssues(allPlotPoints, allArcs);

    return {
      overview: {
        totalArcs: allArcs.length,
        totalPlotPoints: allPlotPoints.length,
        completionRate,
        averageArcLength,
        structureType: this.identifyStructureType(allPlotPoints)
      },
      pacing: {
        actBreakdown,
        tensionCurve,
        pacingIssues: this.identifyPacingIssues(allPlotPoints)
      },
      characterDevelopment: {
        totalCharacters: new Set(allDevelopments.map(d => d.characterId)).size,
        developmentArcs: allDevelopments.length,
        underdevelopedCharacters: this.findUnderdevelopedCharacters(allDevelopments),
        overlapIssues: this.findCharacterOverlaps(allDevelopments)
      },
      structure: {
        missingElements: this.findMissingElements(allPlotPoints),
        structuralIssues,
        suggestions: this.generateSuggestions(allPlotPoints, allArcs)
      },
      themes: {
        identifiedThemes: this.identifyThemes(allPlotPoints, allArcs),
        themeConsistency: this.calculateThemeConsistency(allPlotPoints),
        themeDistribution: this.calculateThemeDistribution(allPlotPoints)
      }
    };
  }

  private calculateActBreakdown(plotPoints: PlotPoint[]): Record<string, number> {
    const breakdown: Record<string, number> = { act1: 0, act2: 0, act3: 0 };
    
    plotPoints.forEach(pp => {
      if (pp.position <= 25) breakdown.act1++;
      else if (pp.position <= 75) breakdown.act2++;
      else breakdown.act3++;
    });

    return breakdown;
  }

  private calculateTensionCurve(plotPoints: PlotPoint[]): Array<{ position: number; intensity: number }> {
    const curve: Array<{ position: number; intensity: number }> = [];
    const tensionMap: Record<PlotPoint['type'], number> = {
      opening: 2,
      inciting_incident: 6,
      plot_point_1: 7,
      midpoint: 8,
      plot_point_2: 9,
      climax: 10,
      resolution: 3,
      custom: 5
    };

    plotPoints.forEach(pp => {
      curve.push({
        position: pp.position,
        intensity: tensionMap[pp.type] || 5
      });
    });

    return curve.sort((a, b) => a.position - b.position);
  }

  private identifyStructuralIssues(plotPoints: PlotPoint[], arcs: StoryArc[]): string[] {
    const issues: string[] = [];
    
    if (plotPoints.length === 0) {
      issues.push('No plot points defined');
    }

    if (arcs.length === 0) {
      issues.push('No story arcs created');
    }

    const hasIncitingIncident = plotPoints.some(pp => pp.type === 'inciting_incident');
    if (!hasIncitingIncident) {
      issues.push('Missing inciting incident');
    }

    const hasClimax = plotPoints.some(pp => pp.type === 'climax');
    if (!hasClimax) {
      issues.push('Missing climax');
    }

    return issues;
  }

  private identifyPacingIssues(plotPoints: PlotPoint[]): string[] {
    const issues: string[] = [];
    const sortedPoints = plotPoints.sort((a, b) => a.position - b.position);

    for (let i = 1; i < sortedPoints.length; i++) {
      const gap = sortedPoints[i].position - sortedPoints[i - 1].position;
      if (gap > 30) {
        issues.push(`Large gap between plot points at positions ${sortedPoints[i - 1].position}-${sortedPoints[i].position}`);
      }
    }

    return issues;
  }

  private findUnderdevelopedCharacters(developments: CharacterDevelopment[]): string[] {
    return developments
      .filter(dev => dev.growth.length < 2 || dev.keyMoments.length < 3)
      .map(dev => dev.characterId);
  }

  private findCharacterOverlaps(developments: CharacterDevelopment[]): string[] {
    const issues: string[] = [];
    
    for (let i = 0; i < developments.length; i++) {
      for (let j = i + 1; j < developments.length; j++) {
        const dev1 = developments[i];
        const dev2 = developments[j];
        
        const sharedMoments = dev1.keyMoments.filter(moment => 
          dev2.keyMoments.includes(moment)
        );
        
        if (sharedMoments.length > 2) {
          issues.push(`Characters ${dev1.characterId} and ${dev2.characterId} have overlapping development`);
        }
      }
    }
    
    return issues;
  }

  private findMissingElements(plotPoints: PlotPoint[]): string[] {
    const missing: string[] = [];
    const types = new Set(plotPoints.map(pp => pp.type));
    
    const essentialTypes: PlotPoint['type'][] = ['inciting_incident', 'climax', 'resolution'];
    essentialTypes.forEach(type => {
      if (!types.has(type)) {
        missing.push(type.replace('_', ' '));
      }
    });

    return missing;
  }

  private generateSuggestions(plotPoints: PlotPoint[], arcs: StoryArc[]): string[] {
    const suggestions: string[] = [];
    
    if (plotPoints.length < 5) {
      suggestions.push('Consider adding more plot points for better story structure');
    }

    if (arcs.filter(arc => arc.type === 'subplot').length === 0) {
      suggestions.push('Adding subplots could enrich your story');
    }

    const mainArcs = arcs.filter(arc => arc.type === 'main');
    if (mainArcs.length === 0) {
      suggestions.push('Create a main story arc to organize your plot points');
    }

    return suggestions;
  }

  private identifyStructureType(plotPoints: PlotPoint[]): string {
    const types = plotPoints.map(pp => pp.type);
    
    if (types.includes('plot_point_1') && types.includes('plot_point_2')) {
      return 'three_act';
    }
    
    if (types.filter(t => t === 'custom').length > 5) {
      return 'custom';
    }
    
    return 'undefined';
  }

  private identifyThemes(plotPoints: PlotPoint[], arcs: StoryArc[]): string[] {
    const themes = new Set<string>();
    
    plotPoints.forEach(pp => {
      pp.tags.forEach(tag => {
        if (tag.startsWith('theme:')) {
          themes.add(tag.replace('theme:', ''));
        }
      });
    });

    arcs.forEach(arc => {
      arc.tags.forEach(tag => {
        if (tag.startsWith('theme:')) {
          themes.add(tag.replace('theme:', ''));
        }
      });
    });

    return Array.from(themes);
  }

  private calculateThemeConsistency(plotPoints: PlotPoint[]): number {
    const themes = this.identifyThemes(plotPoints, []);
    if (themes.length === 0) return 0;

    const themeAppearances = themes.map(theme => 
      plotPoints.filter(pp => 
        pp.tags.some(tag => tag === `theme:${theme}`) ||
        pp.description.toLowerCase().includes(theme.toLowerCase())
      ).length
    );

    const averageAppearances = themeAppearances.reduce((sum, count) => sum + count, 0) / themes.length;
    const maxPossible = plotPoints.length;
    
    return Math.min((averageAppearances / maxPossible) * 100, 100);
  }

  private calculateThemeDistribution(plotPoints: PlotPoint[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const themes = this.identifyThemes(plotPoints, []);
    
    themes.forEach(theme => {
      distribution[theme] = plotPoints.filter(pp => 
        pp.tags.some(tag => tag === `theme:${theme}`) ||
        pp.description.toLowerCase().includes(theme.toLowerCase())
      ).length;
    });

    return distribution;
  }

  searchPlotPoints(query: string): PlotPoint[] {
    const searchTerm = query.toLowerCase();
    return this.getAllPlotPoints().filter(pp =>
      pp.name.toLowerCase().includes(searchTerm) ||
      pp.description.toLowerCase().includes(searchTerm) ||
      pp.notes.toLowerCase().includes(searchTerm) ||
      pp.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  searchStoryArcs(query: string): StoryArc[] {
    const searchTerm = query.toLowerCase();
    return this.getAllStoryArcs().filter(arc =>
      arc.name.toLowerCase().includes(searchTerm) ||
      arc.description.toLowerCase().includes(searchTerm) ||
      arc.notes.toLowerCase().includes(searchTerm) ||
      arc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  exportPlotStructure(format: 'json' | 'markdown' = 'json'): string {
    const data = {
      plotPoints: this.getAllPlotPoints(),
      storyArcs: this.getAllStoryArcs(),
      characterDevelopments: this.getAllCharacterDevelopments(),
      analysis: this.analyzeNarrative(),
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    return this.formatAsMarkdown(data);
  }

  private formatAsMarkdown(data: any): string {
    let markdown = '# Plot Structure Export\n\n';
    markdown += `Exported on: ${data.exportedAt}\n\n`;
    
    markdown += '## Story Arcs\n\n';
    data.storyArcs.forEach((arc: StoryArc) => {
      markdown += `### ${arc.name}\n`;
      markdown += `- **Type**: ${arc.type}\n`;
      markdown += `- **Status**: ${arc.status}\n`;
      markdown += `- **Description**: ${arc.description}\n\n`;
    });

    markdown += '## Plot Points\n\n';
    data.plotPoints.forEach((pp: PlotPoint) => {
      markdown += `### ${pp.name} (${pp.position}%)\n`;
      markdown += `- **Type**: ${pp.type}\n`;
      markdown += `- **Completed**: ${pp.completed ? 'Yes' : 'No'}\n`;
      markdown += `- **Description**: ${pp.description}\n\n`;
    });

    return markdown;
  }

  importPlotStructure(data: string, format: 'json' = 'json'): boolean {
    try {
      const imported = JSON.parse(data);
      
      if (imported.plotPoints) {
        imported.plotPoints.forEach((pp: PlotPoint) => {
          this.plotPoints.set(pp.id, pp);
        });
      }

      if (imported.storyArcs) {
        imported.storyArcs.forEach((arc: StoryArc) => {
          this.storyArcs.set(arc.id, arc);
        });
      }

      if (imported.characterDevelopments) {
        imported.characterDevelopments.forEach((dev: CharacterDevelopment) => {
          this.characterDevelopments.set(dev.characterId, dev);
        });
      }

      this.saveUserData();
      this.emit('plotStructureImported', imported);
      return true;
    } catch (error) {
      console.error('Failed to import plot structure:', error);
      return false;
    }
  }

  updateSettings(newSettings: Partial<PlotStructureSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveUserData();
    this.emit('settingsUpdated', this.settings);
  }

  getSettings(): PlotStructureSettings {
    return { ...this.settings };
  }

  private generateId(): string {
    return `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveUserData(): void {
    if (!this.activeProjectId) return;

    const data = {
      plotPoints: Array.from(this.plotPoints.entries()),
      storyArcs: Array.from(this.storyArcs.entries()),
      characterDevelopments: Array.from(this.characterDevelopments.entries()),
      settings: this.settings
    };

    localStorage.setItem(`plotStructure_${this.activeProjectId}`, JSON.stringify(data));
  }

  private loadUserData(): void {
    if (!this.activeProjectId) return;

    const saved = localStorage.getItem(`plotStructure_${this.activeProjectId}`);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      
      this.plotPoints.clear();
      if (data.plotPoints) {
        data.plotPoints.forEach(([id, plotPoint]: [string, PlotPoint]) => {
          this.plotPoints.set(id, plotPoint);
        });
      }

      this.storyArcs.clear();
      if (data.storyArcs) {
        data.storyArcs.forEach(([id, arc]: [string, StoryArc]) => {
          this.storyArcs.set(id, arc);
        });
      }

      this.characterDevelopments.clear();
      if (data.characterDevelopments) {
        data.characterDevelopments.forEach(([id, dev]: [string, CharacterDevelopment]) => {
          this.characterDevelopments.set(id, dev);
        });
      }

      if (data.settings) {
        this.settings = { ...this.getDefaultSettings(), ...data.settings };
      }
    } catch (error) {
      console.error('Failed to load plot structure data:', error);
    }
  }

  clearAllData(): void {
    this.plotPoints.clear();
    this.storyArcs.clear();
    this.characterDevelopments.clear();
    this.settings = this.getDefaultSettings();
    this.saveUserData();
    this.emit('dataCleared');
  }
}

export const plotStructureService = new PlotStructureService();
export default plotStructureService;