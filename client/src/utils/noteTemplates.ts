/**
 * Note Templates for Different Note Types
 * Provides structured templates and validation for comprehensive note types
 */

import type { NoteType } from '@/types/story';

export interface NoteTemplate {
  type: NoteType;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultContent: string;
  fields: TemplateField[];
  requiredFields: string[];
  tags: string[];
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'color' | 'boolean' | 'image' | 'relationship';
  placeholder?: string;
  required?: boolean;
  options?: string[] | TemplateFieldOption[];
  validation?: FieldValidation;
  helpText?: string;
}

export interface TemplateFieldOption {
  value: string;
  label: string;
  color?: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  errorMessage?: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    type: 'character',
    name: 'Character Profile',
    description: 'Comprehensive character development template',
    icon: '👤',
    color: '#3B82F6',
    defaultContent: `# {{name}}

## Overview
{{description}}

## Physical Description
**Age:** {{age}}
**Height:** {{height}}
**Build:** {{build}}
**Hair:** {{hairColor}} {{hairStyle}}
**Eyes:** {{eyeColor}}
**Distinguishing Features:** {{distinguishingFeatures}}

## Personality
**Core Traits:** {{personality.traits}}
**Strengths:** {{personality.strengths}}
**Weaknesses:** {{personality.weaknesses}}
**Fears:** {{personality.fears}}
**Desires:** {{personality.desires}}
**Motivations:** {{personality.motivations}}

## Background
**Occupation:** {{occupation}}
**Education:** {{education}}
**Family:** {{family}}
**Backstory:** {{backstory}}

## Character Arc
**Starting Point:** {{arc.startingPoint}}
**Character Growth:** {{arc.transformation}}
**Ending Point:** {{arc.endingPoint}}

## Voice & Dialogue
**Speech Patterns:** {{speechPatterns}}
**Vocabulary Level:** {{vocabulary}}
**Accent/Dialect:** {{accent}}
**Catchphrases:** {{catchphrases}}

## Relationships
{{relationships}}

## Notes
{{notes}}`,
    fields: [
      { id: 'name', name: 'Character Name', type: 'text', required: true, placeholder: 'Enter character name' },
      { id: 'description', name: 'Brief Description', type: 'textarea', placeholder: 'One sentence description of the character' },
      { id: 'age', name: 'Age', type: 'text', placeholder: 'e.g., 25, mid-30s, elderly' },
      { id: 'height', name: 'Height', type: 'text', placeholder: 'e.g., 5\'8", tall, average' },
      { id: 'build', name: 'Build', type: 'select', options: ['Slim', 'Average', 'Athletic', 'Heavy', 'Muscular', 'Petite', 'Tall'] },
      { id: 'hairColor', name: 'Hair Color', type: 'text', placeholder: 'e.g., Brown, Blonde, Black' },
      { id: 'hairStyle', name: 'Hair Style', type: 'text', placeholder: 'e.g., Short, Long, Curly' },
      { id: 'eyeColor', name: 'Eye Color', type: 'text', placeholder: 'e.g., Blue, Brown, Green' },
      { id: 'occupation', name: 'Occupation', type: 'text', placeholder: 'What does this character do for work?' },
      { id: 'role', name: 'Story Role', type: 'select', options: ['Protagonist', 'Antagonist', 'Supporting', 'Minor', 'Background'] },
      { id: 'importance', name: 'Importance Level', type: 'select', options: ['1 - Background', '2 - Minor', '3 - Supporting', '4 - Major', '5 - Main Character'] },
    ],
    requiredFields: ['name'],
    tags: ['character', 'profile']
  },
  {
    type: 'location',
    name: 'Location/Setting',
    description: 'Detailed location and setting information',
    icon: '🏛️',
    color: '#059669',
    defaultContent: `# {{name}}

## Overview
**Type:** {{type}}
**Description:** {{description}}

## Physical Details
**Size:** {{geography.size}}
**Climate:** {{geography.climate}}
**Terrain:** {{geography.terrain}}
**Architecture:** {{architecture}}

## Atmosphere & Mood
**Atmosphere:** {{atmosphere}}
**Mood:** {{mood}}
**Sounds:** {{sounds}}
**Smells:** {{smells}}
**Notable Features:** {{notableFeatures}}

## Inhabitants
**Population:** {{geography.population}}
**Demographics:** {{demographics}}
**Culture:** {{culture}}
**Government:** {{government}}

## Connections
{{connections}}

## History
{{history}}

## Story Significance
**Importance:** {{importance}}
**Scenes Set Here:** {{scenes}}
**Plot Relevance:** {{plotRelevance}}

## Notes
{{notes}}`,
    fields: [
      { id: 'name', name: 'Location Name', type: 'text', required: true, placeholder: 'Enter location name' },
      { id: 'type', name: 'Location Type', type: 'select', options: ['City', 'Building', 'Room', 'Natural Area', 'Fictional Place', 'Other'] },
      { id: 'description', name: 'Description', type: 'textarea', placeholder: 'Brief description of the location' },
      { id: 'mood', name: 'Mood/Atmosphere', type: 'select', options: ['Mysterious', 'Welcoming', 'Hostile', 'Neutral', 'Foreboding', 'Cheerful', 'Melancholy'] },
      { id: 'importance', name: 'Story Importance', type: 'select', options: ['1 - Minor', '2 - Occasional', '3 - Regular', '4 - Important', '5 - Central'] },
    ],
    requiredFields: ['name', 'type'],
    tags: ['location', 'setting']
  },
  {
    type: 'item',
    name: 'Item/Artifact',
    description: 'Important objects, artifacts, or items in your story',
    icon: '⚔️',
    color: '#DC2626',
    defaultContent: `# {{name}}

## Overview
**Type:** {{type}}
**Description:** {{description}}

## Physical Properties
**Size:** {{properties.physical.size}}
**Weight:** {{properties.physical.weight}}
**Material:** {{properties.physical.material}}
**Color:** {{properties.physical.color}}
**Condition:** {{properties.physical.condition}}

## Functional Properties
**Purpose:** {{properties.functional.purpose}}
**Abilities:** {{properties.functional.abilities}}
**Limitations:** {{properties.functional.limitations}}
**Power Level:** {{properties.functional.power}}

## Ownership & Location
**Current Owner:** {{currentOwner}}
**Current Location:** {{currentLocation}}
**Ownership History:** {{ownershipHistory}}

## Story Significance
**Significance:** {{significance}}
**Symbolism:** {{symbolism}}
**Plot Relevance:** {{plotRelevance}}

## Appearances
**Scenes:** {{scenes}}
**Characters Who Know About It:** {{knownByCharacters}}

## Notes
{{notes}}`,
    fields: [
      { id: 'name', name: 'Item Name', type: 'text', required: true, placeholder: 'Enter item name' },
      { id: 'type', name: 'Item Type', type: 'select', options: ['Weapon', 'Tool', 'Jewelry', 'Document', 'Vehicle', 'Magical Item', 'Technology', 'Other'] },
      { id: 'description', name: 'Description', type: 'textarea', placeholder: 'Physical description of the item' },
      { id: 'significance', name: 'Story Significance', type: 'select', options: ['Minor', 'Important', 'Crucial', 'Legendary'] },
      { id: 'currentOwner', name: 'Current Owner', type: 'relationship', placeholder: 'Which character currently owns this?' },
      { id: 'currentLocation', name: 'Current Location', type: 'relationship', placeholder: 'Where is this item currently?' },
    ],
    requiredFields: ['name', 'type'],
    tags: ['item', 'object', 'artifact']
  },
  {
    type: 'plotthread',
    name: 'Plot Thread',
    description: 'Track plot lines, subplots, and story arcs',
    icon: '🧵',
    color: '#7C3AED',
    defaultContent: `# {{name}}

## Overview
**Type:** {{type}}
**Status:** {{status}}
**Priority:** {{priority}}

## Description
{{description}}

## Structure
**Introduction:** {{introduction}}
**Key Developments:** {{developments}}
**Climax:** {{climax}}
**Resolution:** {{resolution}}

## Connected Elements
**Main Characters:** {{characters}}
**Key Locations:** {{locations}}
**Important Items:** {{items}}
**Related Scenes:** {{scenes}}

## Dependencies
**Depends On:** {{dependsOn}}
**Blocks:** {{blocks}}

## Timeline
{{timeline}}

## Themes
{{themes}}

## Notes
{{notes}}`,
    fields: [
      { id: 'name', name: 'Plot Thread Name', type: 'text', required: true, placeholder: 'Enter plot thread name' },
      { id: 'type', name: 'Thread Type', type: 'select', options: ['Main Plot', 'Subplot', 'Character Arc', 'Mystery', 'Romance', 'Theme', 'Other'] },
      { id: 'status', name: 'Status', type: 'select', options: ['Planned', 'Active', 'Resolved', 'Abandoned'] },
      { id: 'priority', name: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
      { id: 'description', name: 'Description', type: 'textarea', placeholder: 'Brief description of this plot thread' },
    ],
    requiredFields: ['name', 'type'],
    tags: ['plot', 'thread', 'storyline']
  },
  {
    type: 'theme',
    name: 'Theme/Motif',
    description: 'Track themes, symbols, and recurring motifs',
    icon: '💭',
    color: '#F59E0B',
    defaultContent: `# {{name}}

## Overview
**Type:** {{type}}
**Description:** {{description}}

## Development
**Introduction:** {{introduction}}
**Key Moments:** {{keyMoments}}
**Resolution:** {{resolution}}

## Manifestations
**Symbols:** {{symbols}}
**Recurring Elements:** {{recurringElements}}
**Character Connections:** {{characterConnections}}
**Scene Examples:** {{sceneExamples}}

## Analysis
**Central Question:** {{centralQuestion}}
**Character Growth:** {{characterGrowth}}
**Plot Significance:** {{plotSignificance}}

## Related Themes
{{relatedThemes}}

## Notes
{{notes}}`,
    fields: [
      { id: 'name', name: 'Theme Name', type: 'text', required: true, placeholder: 'Enter theme name' },
      { id: 'type', name: 'Theme Type', type: 'select', options: ['Major Theme', 'Minor Theme', 'Symbol', 'Motif', 'Metaphor'] },
      { id: 'description', name: 'Description', type: 'textarea', placeholder: 'What is this theme about?' },
    ],
    requiredFields: ['name'],
    tags: ['theme', 'motif', 'symbol']
  },
  {
    type: 'research',
    name: 'Research Notes',
    description: 'Research findings, facts, and reference material',
    icon: '📚',
    color: '#0891B2',
    defaultContent: `# {{title}}

## Source Information
**Source:** {{source}}
**Author:** {{author}}
**Date:** {{date}}
**Type:** {{sourceType}}
**Reliability:** {{reliability}}

## Key Findings
{{keyFindings}}

## Relevant Quotes
{{quotes}}

## Application to Story
**Relevant Scenes:** {{relevantScenes}}
**Character Applications:** {{characterApplications}}
**World Building:** {{worldBuilding}}
**Plot Applications:** {{plotApplications}}

## Follow-up Research
{{followUpResearch}}

## Tags & Categories
{{categories}}

## Notes
{{notes}}`,
    fields: [
      { id: 'title', name: 'Research Title', type: 'text', required: true, placeholder: 'Research topic or title' },
      { id: 'source', name: 'Source', type: 'text', placeholder: 'Book, website, interview, etc.' },
      { id: 'sourceType', name: 'Source Type', type: 'select', options: ['Book', 'Article', 'Website', 'Interview', 'Documentary', 'Academic Paper', 'Other'] },
      { id: 'reliability', name: 'Source Reliability', type: 'select', options: ['High', 'Medium', 'Low', 'Questionable'] },
      { id: 'categories', name: 'Research Categories', type: 'multiselect', options: ['Historical', 'Scientific', 'Cultural', 'Technical', 'Biographical', 'Geographic', 'Social'] },
    ],
    requiredFields: ['title'],
    tags: ['research', 'reference']
  },
  {
    type: 'dialogue',
    name: 'Dialogue Snippet',
    description: 'Capture interesting dialogue, conversations, and speech patterns',
    icon: '💬',
    color: '#EC4899',
    defaultContent: `# {{title}}

## Context
**Characters:** {{characters}}
**Setting:** {{setting}}
**Situation:** {{situation}}
**Mood:** {{mood}}

## Dialogue
{{dialogue}}

## Analysis
**Character Voice:** {{characterVoice}}
**Subtext:** {{subtext}}
**Purpose:** {{purpose}}
**Conflict:** {{conflict}}

## Usage Notes
**Story Integration:** {{storyIntegration}}
**Revision Notes:** {{revisionNotes}}

## Related Elements
{{relatedElements}}

## Notes
{{notes}}`,
    fields: [
      { id: 'title', name: 'Dialogue Title', type: 'text', required: true, placeholder: 'Brief title for this dialogue' },
      { id: 'characters', name: 'Characters', type: 'multiselect', placeholder: 'Which characters are speaking?' },
      { id: 'setting', name: 'Setting', type: 'relationship', placeholder: 'Where does this conversation take place?' },
      { id: 'mood', name: 'Mood', type: 'select', options: ['Tense', 'Casual', 'Romantic', 'Confrontational', 'Humorous', 'Serious', 'Mysterious'] },
      { id: 'purpose', name: 'Purpose', type: 'select', options: ['Character Development', 'Plot Advancement', 'World Building', 'Comic Relief', 'Tension', 'Information Delivery'] },
    ],
    requiredFields: ['title'],
    tags: ['dialogue', 'conversation', 'speech']
  },
  {
    type: 'worldrule',
    name: 'World Rule/Law',
    description: 'Document the rules, laws, and systems of your fictional world',
    icon: '⚖️',
    color: '#6366F1',
    defaultContent: `# {{name}}

## Overview
**Type:** {{type}}
**Scope:** {{scope}}
**Authority:** {{authority}}

## Description
{{description}}

## Details
**How It Works:** {{howItWorks}}
**Limitations:** {{limitations}}
**Exceptions:** {{exceptions}}
**Consequences:** {{consequences}}

## Implementation
**Who Enforces It:** {{whoEnforces}}
**How It's Enforced:** {{howEnforced}}
**Penalties for Breaking:** {{penalties}}

## Story Impact
**Character Effects:** {{characterEffects}}
**Plot Relevance:** {{plotRelevance}}
**Conflict Potential:** {{conflictPotential}}

## Examples
{{examples}}

## Related Rules
{{relatedRules}}

## Notes
{{notes}}`,
    fields: [
      { id: 'name', name: 'Rule Name', type: 'text', required: true, placeholder: 'Name of the rule or law' },
      { id: 'type', name: 'Rule Type', type: 'select', options: ['Physical Law', 'Magic Rule', 'Social Law', 'Government Policy', 'Cultural Norm', 'Religious Doctrine', 'Natural Law'] },
      { id: 'scope', name: 'Scope', type: 'select', options: ['Universal', 'World-wide', 'Regional', 'Local', 'Organization-specific', 'Character-specific'] },
      { id: 'authority', name: 'Authority', type: 'text', placeholder: 'Who or what established this rule?' },
    ],
    requiredFields: ['name', 'type'],
    tags: ['world-building', 'rules', 'laws']
  },
  {
    type: 'scene',
    name: 'Scene',
    description: 'Individual scene with full metadata and structure',
    icon: '🎬',
    color: '#10B981',
    defaultContent: `# {{title}}

## Scene Overview
**Summary:** {{summary}}
**Purpose:** {{purpose}}
**POV Character:** {{povCharacter}}

## Setting
**Location:** {{location}}
**Time of Day:** {{timeOfDay}}
**Duration:** {{duration}}

## Characters Present
{{characters}}

## Plot Elements
**Plot Threads Advanced:** {{plotThreads}}
**Conflicts:** {{conflicts}}
**Revelations:** {{revelations}}

## Scene Content
{{content}}

## Technical Notes
**Status:** {{status}}
**Word Count Target:** {{wordCountTarget}}
**Estimated Read Time:** {{estimatedReadTime}}

## Notes
{{notes}}`,
    fields: [
      { id: 'title', name: 'Scene Title', type: 'text', required: true, placeholder: 'Enter scene title' },
      { id: 'summary', name: 'Scene Summary', type: 'textarea', placeholder: 'Brief summary of what happens in this scene' },
      { id: 'purpose', name: 'Scene Purpose', type: 'select', options: ['Plot Advancement', 'Character Development', 'World Building', 'Tension/Conflict', 'Resolution', 'Setup', 'Transition'] },
      { id: 'povCharacter', name: 'POV Character', type: 'relationship', placeholder: 'Whose perspective is this scene from?' },
      { id: 'location', name: 'Location', type: 'relationship', placeholder: 'Where does this scene take place?' },
      { id: 'timeOfDay', name: 'Time of Day', type: 'select', options: ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Evening', 'Night', 'Late Night'] },
      { id: 'status', name: 'Status', type: 'select', options: ['Planned', 'Outline', 'Draft', 'Revised', 'Complete'] },
    ],
    requiredFields: ['title'],
    tags: ['scene', 'content']
  },
  {
    type: 'outline',
    name: 'Outline',
    description: 'Story outlines, chapter summaries, and structural planning',
    icon: '📋',
    color: '#8B5CF6',
    defaultContent: `# {{title}}

## Overview
**Type:** {{type}}
**Scope:** {{scope}}
**Status:** {{status}}

## Structure
{{structure}}

## Key Elements
**Main Characters:** {{mainCharacters}}
**Central Conflict:** {{centralConflict}}
**Key Themes:** {{keyThemes}}
**Setting:** {{setting}}

## Act Breakdown
## Act 1: Setup
{{act1}}

## Act 2: Confrontation
{{act2}}

## Act 3: Resolution
{{act3}}

## Chapter Breakdown
{{chapters}}

## Plot Points
{{plotPoints}}

## Character Arcs
{{characterArcs}}

## Notes
{{notes}}`,
    fields: [
      { id: 'title', name: 'Outline Title', type: 'text', required: true, placeholder: 'Title of the outline' },
      { id: 'type', name: 'Outline Type', type: 'select', options: ['Story Outline', 'Chapter Outline', 'Character Arc', 'Plot Thread', 'Act Structure'] },
      { id: 'scope', name: 'Scope', type: 'select', options: ['Full Story', 'Single Book', 'Chapter', 'Scene Sequence', 'Character Arc'] },
      { id: 'status', name: 'Status', type: 'select', options: ['Draft', 'In Progress', 'Complete', 'Needs Revision'] },
    ],
    requiredFields: ['title', 'type'],
    tags: ['outline', 'structure', 'planning']
  },
  {
    type: 'note',
    name: 'General Note',
    description: 'Free-form notes for any purpose',
    icon: '📝',
    color: '#6B7280',
    defaultContent: `# {{title}}

## Content
{{content}}

## Related Elements
{{relatedElements}}

## Tags
{{tags}}

## Notes
{{notes}}`,
    fields: [
      { id: 'title', name: 'Note Title', type: 'text', required: true, placeholder: 'Enter note title' },
      { id: 'content', name: 'Content', type: 'textarea', placeholder: 'Note content' },
    ],
    requiredFields: ['title'],
    tags: ['note', 'general']
  }
];

// Helper functions for template management
export function getTemplateByType(type: NoteType): NoteTemplate | undefined {
  return NOTE_TEMPLATES.find(template => template.type === type);
}

export function getAllTemplates(): NoteTemplate[] {
  return NOTE_TEMPLATES;
}

export function getTemplatesByCategory(category: string): NoteTemplate[] {
  return NOTE_TEMPLATES.filter(template => 
    template.tags.includes(category.toLowerCase())
  );
}

export function generateTemplateContent(template: NoteTemplate, data: Record<string, any>): string {
  let content = template.defaultContent;
  
  // Replace template variables with actual data
  Object.keys(data).forEach(key => {
    const value = data[key];
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value || '');
  });
  
  // Clean up any remaining template variables
  content = content.replace(/{{[^}]+}}/g, '');
  
  return content;
}

export function validateTemplateData(template: NoteTemplate, data: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  template.requiredFields.forEach(fieldId => {
    if (!data[fieldId] || (typeof data[fieldId] === 'string' && data[fieldId].trim() === '')) {
      const field = template.fields.find(f => f.id === fieldId);
      errors.push(`${field?.name || fieldId} is required`);
    }
  });
  
  // Validate field types and constraints
  template.fields.forEach(field => {
    const value = data[field.id];
    if (value !== undefined && value !== null && value !== '') {
      if (field.validation) {
        const validation = field.validation;
        
        if (field.type === 'text' || field.type === 'textarea') {
          if (validation.min && value.length < validation.min) {
            errors.push(`${field.name} must be at least ${validation.min} characters`);
          }
          if (validation.max && value.length > validation.max) {
            errors.push(`${field.name} must be no more than ${validation.max} characters`);
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            errors.push(validation.errorMessage || `${field.name} format is invalid`);
          }
        }
        
        if (field.type === 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`${field.name} must be a valid number`);
          } else {
            if (validation.min && numValue < validation.min) {
              errors.push(`${field.name} must be at least ${validation.min}`);
            }
            if (validation.max && numValue > validation.max) {
              errors.push(`${field.name} must be no more than ${validation.max}`);
            }
          }
        }
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getTemplateFieldsForType(type: NoteType): TemplateField[] {
  const template = getTemplateByType(type);
  return template?.fields || [];
}

export function getDefaultTagsForType(type: NoteType): string[] {
  const template = getTemplateByType(type);
  return template?.tags || [];
}