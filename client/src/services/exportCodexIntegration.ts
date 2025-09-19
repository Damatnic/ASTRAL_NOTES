/**
 * Export-Codex Integration Service
 * 
 * Integrates the Phase 1D export system with existing Codex and Plot systems
 * Provides rich metadata injection for professional manuscript exports
 */

import { CodexIntegration, PlotStructureIntegration } from './advancedExportEngine';

export interface CodexEntity {
  id: string;
  name: string;
  type: 'character' | 'location' | 'item' | 'concept';
  description: string;
  metadata: Record<string, any>;
  relationships: Array<{
    entityId: string;
    type: string;
    description?: string;
  }>;
  appearances: Array<{
    documentId: string;
    chapterId?: string;
    sceneId?: string;
    context: string;
  }>;
}

export interface PlotPoint {
  id: string;
  name: string;
  type: 'inciting_incident' | 'plot_point_1' | 'midpoint' | 'plot_point_2' | 'climax' | 'resolution' | 'custom';
  description: string;
  chapterId?: string;
  sceneId?: string;
  timestamp?: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
  consequences: string[];
  characters: string[];
  locations: string[];
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  content: string;
  wordCount: number;
  order: number;
  scenes: Scene[];
  plotPoints: PlotPoint[];
  characters: string[];
  locations: string[];
  themes: string[];
  mood: string;
  pov: string;
}

export interface Scene {
  id: string;
  title: string;
  summary: string;
  content: string;
  wordCount: number;
  order: number;
  chapterId: string;
  characters: string[];
  location: string;
  timeOfDay: string;
  duration: string;
  purpose: string;
  conflict: string;
  outcome: string;
  plotPoints: PlotPoint[];
}

export interface Timeline {
  id: string;
  name: string;
  type: 'story' | 'character' | 'world';
  events: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    duration?: string;
    importance: 'low' | 'medium' | 'high';
    characters: string[];
    locations: string[];
    relatedScenes: string[];
  }>;
}

export interface ProjectAnalytics {
  wordCount: number;
  chapterCount: number;
  sceneCount: number;
  characterCount: number;
  locationCount: number;
  plotPointCount: number;
  writingVelocity: number;
  sessionCount: number;
  timeSpent: number;
  averageWordsPerSession: number;
  consistency: {
    charactersIntroduced: number;
    plotThreadsResolved: number;
    conflictsEstablished: number;
    themesExplored: string[];
  };
}

class ExportCodexIntegration {
  /**
   * Extracts and formats codex data for export integration
   */
  public async extractCodexData(projectId: string): Promise<CodexIntegration> {
    try {
      // In a real implementation, these would be API calls to load data
      const characters = await this.loadCharacters(projectId);
      const locations = await this.loadLocations(projectId);
      const items = await this.loadItems(projectId);
      const concepts = await this.loadConcepts(projectId);

      return {
        characters: characters.map(char => ({
          id: char.id,
          name: char.name,
          description: char.description,
          relationships: char.relationships.map(rel => rel.entityId)
        })),
        locations: locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          description: loc.description,
          type: loc.metadata.type || 'location'
        })),
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          significance: item.metadata.significance || 'minor'
        })),
        concepts: concepts.map(concept => ({
          id: concept.id,
          name: concept.name,
          description: concept.description,
          category: concept.metadata.category || 'general'
        }))
      };
    } catch (error) {
      console.error('Failed to extract codex data:', error);
      throw new Error('Codex data extraction failed');
    }
  }

  /**
   * Extracts and formats plot structure data for export integration
   */
  public async extractPlotStructureData(projectId: string): Promise<PlotStructureIntegration> {
    try {
      const chapters = await this.loadChapters(projectId);
      const scenes = await this.loadScenes(projectId);
      const plotPoints = await this.loadPlotPoints(projectId);

      // Organize data into acts based on story structure
      const acts = this.organizeIntoActs(chapters, plotPoints);

      return {
        acts: acts.map(act => ({
          id: act.id,
          name: act.name,
          description: act.description,
          chapters: act.chapters
        })),
        chapters: chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          summary: chapter.summary,
          wordCount: chapter.wordCount,
          scenes: chapter.scenes.map(scene => scene.id)
        })),
        scenes: scenes.map(scene => ({
          id: scene.id,
          title: scene.title,
          summary: scene.summary,
          characters: scene.characters,
          location: scene.location,
          plotPoints: scene.plotPoints.map(pp => pp.id)
        })),
        plotPoints: plotPoints.map(pp => ({
          id: pp.id,
          name: pp.name,
          type: pp.type,
          description: pp.description,
          chapter: pp.chapterId || ''
        }))
      };
    } catch (error) {
      console.error('Failed to extract plot structure data:', error);
      throw new Error('Plot structure data extraction failed');
    }
  }

  /**
   * Generates export appendices with codex information
   */
  public generateCodexAppendices(codexData: CodexIntegration, format: string): string {
    let appendices = '';

    // Character appendix
    if (codexData.characters.length > 0) {
      appendices += this.generateCharacterAppendix(codexData.characters, format);
    }

    // Location appendix
    if (codexData.locations.length > 0) {
      appendices += this.generateLocationAppendix(codexData.locations, format);
    }

    // Items and concepts appendices
    if (codexData.items.length > 0) {
      appendices += this.generateItemsAppendix(codexData.items, format);
    }

    if (codexData.concepts.length > 0) {
      appendices += this.generateConceptsAppendix(codexData.concepts, format);
    }

    return appendices;
  }

  /**
   * Generates plot structure summary for export
   */
  public generatePlotStructureSummary(plotData: PlotStructureIntegration, format: string): string {
    let summary = '';

    switch (format) {
      case 'html':
      case 'web_optimized':
        summary = this.generateHTMLPlotSummary(plotData);
        break;
      case 'markdown':
      case 'github_markdown':
        summary = this.generateMarkdownPlotSummary(plotData);
        break;
      case 'latex':
      case 'ieee_latex':
        summary = this.generateLaTeXPlotSummary(plotData);
        break;
      default:
        summary = this.generatePlainTextPlotSummary(plotData);
    }

    return summary;
  }

  /**
   * Analyzes content for codex entity mentions and adds annotations
   */
  public annotateContentWithCodexData(content: string, codexData: CodexIntegration): string {
    let annotatedContent = content;

    // Add character annotations
    codexData.characters.forEach(character => {
      const regex = new RegExp(`\\b${character.name}\\b`, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        // Add footnote or annotation (format-dependent)
        const annotation = `[Character: ${character.name} - ${character.description.substring(0, 100)}...]`;
        // In a real implementation, this would be more sophisticated
        annotatedContent = annotatedContent.replace(
          regex,
          `${character.name}${annotation}`
        );
      }
    });

    // Similar processing for locations, items, and concepts
    codexData.locations.forEach(location => {
      const regex = new RegExp(`\\b${location.name}\\b`, 'gi');
      if (regex.test(content)) {
        const annotation = `[Location: ${location.name} - ${location.description.substring(0, 100)}...]`;
        annotatedContent = annotatedContent.replace(regex, `${location.name}${annotation}`);
      }
    });

    return annotatedContent;
  }

  /**
   * Generates enhanced metadata for export
   */
  public generateEnhancedMetadata(
    projectId: string,
    codexData: CodexIntegration,
    plotData: PlotStructureIntegration,
    analytics: ProjectAnalytics
  ): Record<string, any> {
    return {
      project: {
        id: projectId,
        analysisDate: new Date().toISOString(),
        exportVersion: '1D.1.0'
      },
      content: {
        wordCount: analytics.wordCount,
        chapterCount: analytics.chapterCount,
        sceneCount: analytics.sceneCount,
        averageWordsPerChapter: Math.round(analytics.wordCount / analytics.chapterCount),
        readingTime: Math.round(analytics.wordCount / 250) // 250 words per minute average
      },
      structure: {
        acts: plotData.acts.length,
        plotPoints: plotData.plotPoints.length,
        majorPlotPoints: plotData.plotPoints.filter(pp => 
          ['inciting_incident', 'plot_point_1', 'midpoint', 'plot_point_2', 'climax', 'resolution'].includes(pp.type)
        ).length,
        storyArc: this.analyzeStoryArc(plotData)
      },
      worldBuilding: {
        characterCount: codexData.characters.length,
        locationCount: codexData.locations.length,
        itemCount: codexData.items.length,
        conceptCount: codexData.concepts.length,
        complexity: this.calculateWorldBuildingComplexity(codexData),
        consistency: this.analyzeWorldBuildingConsistency(codexData, plotData)
      },
      writingAnalytics: {
        velocityWordsPerDay: analytics.writingVelocity,
        sessionCount: analytics.sessionCount,
        averageSessionLength: analytics.timeSpent / analytics.sessionCount,
        consistency: analytics.consistency
      }
    };
  }

  // Private helper methods

  private async loadCharacters(projectId: string): Promise<CodexEntity[]> {
    // Mock data - in real implementation, this would be an API call
    return [
      {
        id: 'char_1',
        name: 'Elena Stardust',
        type: 'character',
        description: 'A brilliant astrophysicist who discovers the quantum gateway',
        metadata: { role: 'protagonist', age: 28, occupation: 'Astrophysicist' },
        relationships: [
          { entityId: 'char_2', type: 'colleague', description: 'Research partner' }
        ],
        appearances: [
          { documentId: 'doc_1', chapterId: 'ch_1', context: 'Introduction scene' }
        ]
      },
      {
        id: 'char_2',
        name: 'Dr. Marcus Chen',
        type: 'character',
        description: 'Elena\'s mentor and research director',
        metadata: { role: 'mentor', age: 52, occupation: 'Research Director' },
        relationships: [
          { entityId: 'char_1', type: 'mentor', description: 'Mentors Elena' }
        ],
        appearances: [
          { documentId: 'doc_1', chapterId: 'ch_1', context: 'Laboratory scene' }
        ]
      }
    ];
  }

  private async loadLocations(projectId: string): Promise<CodexEntity[]> {
    return [
      {
        id: 'loc_1',
        name: 'Quantum Research Laboratory',
        type: 'location',
        description: 'State-of-the-art facility for quantum physics research',
        metadata: { type: 'building', significance: 'high' },
        relationships: [],
        appearances: [
          { documentId: 'doc_1', chapterId: 'ch_1', context: 'Main setting' }
        ]
      }
    ];
  }

  private async loadItems(projectId: string): Promise<CodexEntity[]> {
    return [
      {
        id: 'item_1',
        name: 'Quantum Gateway Device',
        type: 'item',
        description: 'Experimental device that opens portals between dimensions',
        metadata: { significance: 'critical', type: 'technology' },
        relationships: [],
        appearances: [
          { documentId: 'doc_1', chapterId: 'ch_2', context: 'Discovery scene' }
        ]
      }
    ];
  }

  private async loadConcepts(projectId: string): Promise<CodexEntity[]> {
    return [
      {
        id: 'concept_1',
        name: 'Quantum Entanglement Theory',
        type: 'concept',
        description: 'The theoretical foundation for dimensional travel',
        metadata: { category: 'science', complexity: 'high' },
        relationships: [],
        appearances: [
          { documentId: 'doc_1', chapterId: 'ch_1', context: 'Explanation scene' }
        ]
      }
    ];
  }

  private async loadChapters(projectId: string): Promise<Chapter[]> {
    // Mock chapter data
    return [
      {
        id: 'ch_1',
        title: 'The Discovery',
        summary: 'Elena makes the initial quantum discovery',
        content: 'Chapter content...',
        wordCount: 2500,
        order: 1,
        scenes: [],
        plotPoints: [],
        characters: ['char_1', 'char_2'],
        locations: ['loc_1'],
        themes: ['discovery', 'science'],
        mood: 'mysterious',
        pov: 'Elena'
      }
    ];
  }

  private async loadScenes(projectId: string): Promise<Scene[]> {
    // Mock scene data
    return [
      {
        id: 'scene_1',
        title: 'Laboratory Breakthrough',
        summary: 'Elena observes unexpected quantum behavior',
        content: 'Scene content...',
        wordCount: 1200,
        order: 1,
        chapterId: 'ch_1',
        characters: ['char_1'],
        location: 'loc_1',
        timeOfDay: 'late night',
        duration: '2 hours',
        purpose: 'establish discovery',
        conflict: 'scientific challenge',
        outcome: 'breakthrough moment',
        plotPoints: []
      }
    ];
  }

  private async loadPlotPoints(projectId: string): Promise<PlotPoint[]> {
    return [
      {
        id: 'pp_1',
        name: 'Quantum Anomaly Discovery',
        type: 'inciting_incident',
        description: 'Elena discovers the quantum anomaly that leads to the gateway',
        chapterId: 'ch_1',
        sceneId: 'scene_1',
        importance: 'critical',
        consequences: ['Scientific investigation', 'Character development'],
        characters: ['char_1'],
        locations: ['loc_1']
      }
    ];
  }

  private organizeIntoActs(chapters: Chapter[], plotPoints: PlotPoint[]): Array<{
    id: string;
    name: string;
    description: string;
    chapters: string[];
  }> {
    // Simple three-act structure organization
    const totalChapters = chapters.length;
    const act1End = Math.floor(totalChapters * 0.25);
    const act2End = Math.floor(totalChapters * 0.75);

    return [
      {
        id: 'act_1',
        name: 'Act I: Setup',
        description: 'Introduction of characters, world, and conflict',
        chapters: chapters.slice(0, act1End).map(ch => ch.id)
      },
      {
        id: 'act_2',
        name: 'Act II: Confrontation',
        description: 'Development of conflict and character growth',
        chapters: chapters.slice(act1End, act2End).map(ch => ch.id)
      },
      {
        id: 'act_3',
        name: 'Act III: Resolution',
        description: 'Climax and resolution of the story',
        chapters: chapters.slice(act2End).map(ch => ch.id)
      }
    ];
  }

  private generateCharacterAppendix(characters: CodexIntegration['characters'], format: string): string {
    if (format === 'html' || format === 'web_optimized') {
      return `
<div class="appendix character-appendix">
  <h2>Character Reference</h2>
  ${characters.map(char => `
    <div class="character-entry">
      <h3>${char.name}</h3>
      <p>${char.description}</p>
      ${char.relationships.length > 0 ? `
        <div class="relationships">
          <strong>Relationships:</strong> ${char.relationships.join(', ')}
        </div>
      ` : ''}
    </div>
  `).join('')}
</div>`;
    }

    // Plain text format
    let appendix = '\n\nCHARACTER REFERENCE\n==================\n\n';
    characters.forEach(char => {
      appendix += `${char.name}\n${'-'.repeat(char.name.length)}\n`;
      appendix += `${char.description}\n`;
      if (char.relationships.length > 0) {
        appendix += `Relationships: ${char.relationships.join(', ')}\n`;
      }
      appendix += '\n';
    });
    return appendix;
  }

  private generateLocationAppendix(locations: CodexIntegration['locations'], format: string): string {
    if (format === 'html' || format === 'web_optimized') {
      return `
<div class="appendix location-appendix">
  <h2>Location Reference</h2>
  ${locations.map(loc => `
    <div class="location-entry">
      <h3>${loc.name}</h3>
      <p><em>Type:</em> ${loc.type}</p>
      <p>${loc.description}</p>
    </div>
  `).join('')}
</div>`;
    }

    let appendix = '\n\nLOCATION REFERENCE\n==================\n\n';
    locations.forEach(loc => {
      appendix += `${loc.name}\n${'-'.repeat(loc.name.length)}\n`;
      appendix += `Type: ${loc.type}\n`;
      appendix += `${loc.description}\n\n`;
    });
    return appendix;
  }

  private generateItemsAppendix(items: CodexIntegration['items'], format: string): string {
    let appendix = '\n\nITEMS & ARTIFACTS\n=================\n\n';
    items.forEach(item => {
      appendix += `${item.name}\n${'-'.repeat(item.name.length)}\n`;
      appendix += `Significance: ${item.significance}\n`;
      appendix += `${item.description}\n\n`;
    });
    return appendix;
  }

  private generateConceptsAppendix(concepts: CodexIntegration['concepts'], format: string): string {
    let appendix = '\n\nCONCEPTS & THEMES\n=================\n\n';
    concepts.forEach(concept => {
      appendix += `${concept.name}\n${'-'.repeat(concept.name.length)}\n`;
      appendix += `Category: ${concept.category}\n`;
      appendix += `${concept.description}\n\n`;
    });
    return appendix;
  }

  private generateHTMLPlotSummary(plotData: PlotStructureIntegration): string {
    return `
<div class="plot-structure-summary">
  <h2>Story Structure Analysis</h2>
  
  <div class="acts-overview">
    <h3>Act Structure</h3>
    ${plotData.acts.map(act => `
      <div class="act">
        <h4>${act.name}</h4>
        <p>${act.description}</p>
        <p><strong>Chapters:</strong> ${act.chapters.length}</p>
      </div>
    `).join('')}
  </div>
  
  <div class="plot-points">
    <h3>Major Plot Points</h3>
    ${plotData.plotPoints.map(pp => `
      <div class="plot-point">
        <h4>${pp.name} (${pp.type.replace('_', ' ')})</h4>
        <p>${pp.description}</p>
      </div>
    `).join('')}
  </div>
</div>`;
  }

  private generateMarkdownPlotSummary(plotData: PlotStructureIntegration): string {
    let markdown = '## Story Structure Analysis\n\n';
    
    markdown += '### Act Structure\n\n';
    plotData.acts.forEach(act => {
      markdown += `#### ${act.name}\n`;
      markdown += `${act.description}\n`;
      markdown += `**Chapters:** ${act.chapters.length}\n\n`;
    });
    
    markdown += '### Major Plot Points\n\n';
    plotData.plotPoints.forEach(pp => {
      markdown += `#### ${pp.name} (${pp.type.replace('_', ' ')})\n`;
      markdown += `${pp.description}\n\n`;
    });
    
    return markdown;
  }

  private generateLaTeXPlotSummary(plotData: PlotStructureIntegration): string {
    let latex = '\\section{Story Structure Analysis}\n\n';
    
    latex += '\\subsection{Act Structure}\n\n';
    plotData.acts.forEach(act => {
      latex += `\\subsubsection{${act.name}}\n`;
      latex += `${act.description}\n\n`;
      latex += `\\textbf{Chapters:} ${act.chapters.length}\n\n`;
    });
    
    latex += '\\subsection{Major Plot Points}\n\n';
    plotData.plotPoints.forEach(pp => {
      latex += `\\subsubsection{${pp.name} (${pp.type.replace('_', ' ')})}\n`;
      latex += `${pp.description}\n\n`;
    });
    
    return latex;
  }

  private generatePlainTextPlotSummary(plotData: PlotStructureIntegration): string {
    let summary = '\n\nSTORY STRUCTURE ANALYSIS\n========================\n\n';
    
    summary += 'ACT STRUCTURE\n-------------\n\n';
    plotData.acts.forEach(act => {
      summary += `${act.name}\n${act.description}\n`;
      summary += `Chapters: ${act.chapters.length}\n\n`;
    });
    
    summary += 'MAJOR PLOT POINTS\n-----------------\n\n';
    plotData.plotPoints.forEach(pp => {
      summary += `${pp.name} (${pp.type.replace('_', ' ')})\n`;
      summary += `${pp.description}\n\n`;
    });
    
    return summary;
  }

  private analyzeStoryArc(plotData: PlotStructureIntegration): string {
    const majorPoints = plotData.plotPoints.filter(pp => 
      ['inciting_incident', 'plot_point_1', 'midpoint', 'plot_point_2', 'climax', 'resolution'].includes(pp.type)
    );
    
    if (majorPoints.length >= 5) {
      return 'Three-Act Structure (Complete)';
    } else if (majorPoints.length >= 3) {
      return 'Three-Act Structure (Partial)';
    } else {
      return 'Free-form Structure';
    }
  }

  private calculateWorldBuildingComplexity(codexData: CodexIntegration): 'simple' | 'moderate' | 'complex' | 'epic' {
    const totalEntities = codexData.characters.length + 
                         codexData.locations.length + 
                         codexData.items.length + 
                         codexData.concepts.length;
    
    if (totalEntities < 10) return 'simple';
    if (totalEntities < 25) return 'moderate';
    if (totalEntities < 50) return 'complex';
    return 'epic';
  }

  private analyzeWorldBuildingConsistency(
    codexData: CodexIntegration, 
    plotData: PlotStructureIntegration
  ): Record<string, number> {
    // Analyze how consistently world elements are used throughout the story
    const charactersInScenes = new Set();
    const locationsInScenes = new Set();
    
    plotData.scenes.forEach(scene => {
      scene.characters.forEach(charId => charactersInScenes.add(charId));
      if (scene.location) locationsInScenes.add(scene.location);
    });
    
    return {
      characterUtilization: (charactersInScenes.size / codexData.characters.length) * 100,
      locationUtilization: (locationsInScenes.size / codexData.locations.length) * 100,
      plotIntegration: (plotData.plotPoints.length / plotData.chapters.length) * 100
    };
  }
}

export default new ExportCodexIntegration();