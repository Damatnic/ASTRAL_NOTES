/**
 * Test Data Factories for ASTRAL_NOTES
 * Comprehensive factories for generating realistic test data
 */

import { faker } from '@faker-js/faker';

// Core entity interfaces (based on the application structure)
export interface TestNote {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  storyId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isArchived: boolean;
  wordCount: number;
  metadata: {
    characterCount: number;
    readingTime: number;
    lastViewedAt?: Date;
  };
}

export interface TestProject {
  id: string;
  name: string;
  description: string;
  userId: string;
  notes: string[];
  stories: string[];
  createdAt: Date;
  updatedAt: Date;
  settings: {
    defaultTemplate?: string;
    autoSave: boolean;
    collaborators: string[];
  };
  status: 'active' | 'archived' | 'completed';
}

export interface TestStory {
  id: string;
  title: string;
  summary: string;
  projectId: string;
  userId: string;
  chapters: TestChapter[];
  characters: TestCharacter[];
  locations: TestLocation[];
  timeline: TestTimelineEvent[];
  genre: string;
  status: 'planning' | 'drafting' | 'editing' | 'completed';
  wordTarget?: number;
  currentWordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestChapter {
  id: string;
  title: string;
  summary: string;
  order: number;
  storyId: string;
  scenes: TestScene[];
  wordCount: number;
  status: 'outline' | 'draft' | 'revision' | 'complete';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestScene {
  id: string;
  title: string;
  content: string;
  summary: string;
  chapterId: string;
  order: number;
  characters: string[];
  locations: string[];
  mood: string;
  purpose: string;
  wordCount: number;
  beats: TestSceneBeat[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSceneBeat {
  id: string;
  type: 'action' | 'dialogue' | 'description' | 'transition';
  content: string;
  order: number;
  sceneId: string;
  characterFocus?: string;
  emotionalTone: string;
}

export interface TestCharacter {
  id: string;
  name: string;
  description: string;
  storyId: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: {
    physical: string[];
    personality: string[];
    background: string[];
  };
  relationships: Array<{
    characterId: string;
    relationship: string;
    description: string;
  }>;
  development: {
    motivation: string;
    goal: string;
    conflict: string;
    arc: string;
  };
  appearances: string[]; // scene IDs where character appears
  createdAt: Date;
  updatedAt: Date;
}

export interface TestLocation {
  id: string;
  name: string;
  description: string;
  storyId: string;
  type: 'city' | 'building' | 'room' | 'landscape' | 'other';
  details: {
    atmosphere: string;
    significance: string;
    history?: string;
  };
  appearances: string[]; // scene IDs where location is used
  createdAt: Date;
  updatedAt: Date;
}

export interface TestTimelineEvent {
  id: string;
  title: string;
  description: string;
  storyId: string;
  date: Date;
  type: 'backstory' | 'plot' | 'character' | 'world';
  importance: 'minor' | 'major' | 'critical';
  relatedCharacters: string[];
  relatedLocations: string[];
  createdAt: Date;
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
  profile: {
    displayName: string;
    bio: string;
    avatar?: string;
    preferences: {
      theme: 'light' | 'dark' | 'auto';
      editorMode: 'rich' | 'markdown' | 'distraction-free';
      autoSave: boolean;
      writingGoals: {
        dailyWordTarget: number;
        weeklyWordTarget: number;
      };
    };
  };
  subscription: {
    plan: 'free' | 'pro' | 'premium';
    expiresAt?: Date;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// Factory classes
export class NoteFactory {
  static create(overrides: Partial<TestNote> = {}): TestNote {
    const wordCount = faker.number.int({ min: 50, max: 2000 });
    
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 10 })),
      projectId: faker.string.uuid(),
      storyId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.6 }),
      tags: faker.helpers.arrayElements([
        'character', 'plot', 'worldbuilding', 'research', 'dialogue',
        'description', 'revision', 'ideas', 'outline', 'draft'
      ], faker.number.int({ min: 0, max: 4 })),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
      userId: faker.string.uuid(),
      isArchived: faker.helpers.maybe(() => true, { probability: 0.1 }) ?? false,
      wordCount,
      metadata: {
        characterCount: wordCount * faker.number.int({ min: 4, max: 7 }),
        readingTime: Math.ceil(wordCount / 200), // Approximate reading time in minutes
        lastViewedAt: faker.helpers.maybe(() => faker.date.recent({ days: 7 }))
      },
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<TestNote> = {}): TestNote[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createForProject(projectId: string, count: number = 5): TestNote[] {
    return this.createMany(count, { projectId });
  }

  static createForStory(storyId: string, count: number = 3): TestNote[] {
    return this.createMany(count, { storyId });
  }
}

export class ProjectFactory {
  static create(overrides: Partial<TestProject> = {}): TestProject {
    const noteCount = faker.number.int({ min: 1, max: 20 });
    const storyCount = faker.number.int({ min: 0, max: 5 });

    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Project',
      description: faker.lorem.sentences(2),
      userId: faker.string.uuid(),
      notes: Array.from({ length: noteCount }, () => faker.string.uuid()),
      stories: Array.from({ length: storyCount }, () => faker.string.uuid()),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 7 }),
      settings: {
        defaultTemplate: faker.helpers.arrayElement(['novel', 'screenplay', 'short-story', 'non-fiction']),
        autoSave: faker.datatype.boolean(),
        collaborators: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => faker.string.uuid())
      },
      status: faker.helpers.arrayElement(['active', 'archived', 'completed']),
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<TestProject> = {}): TestProject[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createActive(count: number = 3): TestProject[] {
    return this.createMany(count, { status: 'active' });
  }
}

export class StoryFactory {
  static create(overrides: Partial<TestStory> = {}): TestStory {
    const chapterCount = faker.number.int({ min: 5, max: 25 });
    const characterCount = faker.number.int({ min: 3, max: 12 });
    const locationCount = faker.number.int({ min: 2, max: 8 });
    const eventCount = faker.number.int({ min: 5, max: 20 });
    const wordTarget = faker.number.int({ min: 50000, max: 150000 });

    return {
      id: faker.string.uuid(),
      title: faker.lorem.words({ min: 2, max: 5 }),
      summary: faker.lorem.sentences(3),
      projectId: faker.string.uuid(),
      userId: faker.string.uuid(),
      chapters: Array.from({ length: chapterCount }, (_, index) => 
        ChapterFactory.create({ order: index + 1 })
      ),
      characters: Array.from({ length: characterCount }, () => 
        CharacterFactory.create()
      ),
      locations: Array.from({ length: locationCount }, () => 
        LocationFactory.create()
      ),
      timeline: Array.from({ length: eventCount }, () => 
        TimelineEventFactory.create()
      ),
      genre: faker.helpers.arrayElement([
        'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller',
        'Horror', 'Historical Fiction', 'Contemporary Fiction', 'Literary Fiction'
      ]),
      status: faker.helpers.arrayElement(['planning', 'drafting', 'editing', 'completed']),
      wordTarget,
      currentWordCount: faker.number.int({ min: 0, max: wordTarget }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 3 }),
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<TestStory> = {}): TestStory[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

export class ChapterFactory {
  static create(overrides: Partial<TestChapter> = {}): TestChapter {
    const sceneCount = faker.number.int({ min: 3, max: 8 });

    return {
      id: faker.string.uuid(),
      title: `Chapter ${faker.number.int({ min: 1, max: 30 })}: ${faker.lorem.words({ min: 2, max: 4 })}`,
      summary: faker.lorem.sentences(2),
      order: faker.number.int({ min: 1, max: 30 }),
      storyId: faker.string.uuid(),
      scenes: Array.from({ length: sceneCount }, (_, index) => 
        SceneFactory.create({ order: index + 1 })
      ),
      wordCount: faker.number.int({ min: 2000, max: 8000 }),
      status: faker.helpers.arrayElement(['outline', 'draft', 'revision', 'complete']),
      createdAt: faker.date.past({ months: 6 }),
      updatedAt: faker.date.recent({ days: 5 }),
      ...overrides
    };
  }
}

export class SceneFactory {
  static create(overrides: Partial<TestScene> = {}): TestScene {
    const beatCount = faker.number.int({ min: 3, max: 12 });

    return {
      id: faker.string.uuid(),
      title: faker.lorem.words({ min: 2, max: 5 }),
      content: faker.lorem.paragraphs(faker.number.int({ min: 3, max: 15 })),
      summary: faker.lorem.sentence(),
      chapterId: faker.string.uuid(),
      order: faker.number.int({ min: 1, max: 10 }),
      characters: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.string.uuid()),
      locations: Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () => faker.string.uuid()),
      mood: faker.helpers.arrayElement([
        'tense', 'peaceful', 'exciting', 'melancholy', 'hopeful', 'mysterious', 'romantic', 'dramatic'
      ]),
      purpose: faker.helpers.arrayElement([
        'character development', 'plot advancement', 'world building', 'conflict resolution',
        'information reveal', 'relationship building', 'tension building', 'climax'
      ]),
      wordCount: faker.number.int({ min: 500, max: 3000 }),
      beats: Array.from({ length: beatCount }, (_, index) => 
        SceneBeatFactory.create({ order: index + 1 })
      ),
      createdAt: faker.date.past({ months: 3 }),
      updatedAt: faker.date.recent({ days: 2 }),
      ...overrides
    };
  }
}

export class SceneBeatFactory {
  static create(overrides: Partial<TestSceneBeat> = {}): TestSceneBeat {
    const type = faker.helpers.arrayElement(['action', 'dialogue', 'description', 'transition'] as const);
    
    return {
      id: faker.string.uuid(),
      type,
      content: this.generateContentForType(type),
      order: faker.number.int({ min: 1, max: 20 }),
      sceneId: faker.string.uuid(),
      characterFocus: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.7 }),
      emotionalTone: faker.helpers.arrayElement([
        'neutral', 'angry', 'sad', 'happy', 'fearful', 'surprised', 'disgusted', 'anticipatory'
      ]),
      ...overrides
    };
  }

  private static generateContentForType(type: TestSceneBeat['type']): string {
    switch (type) {
      case 'action':
        return faker.lorem.sentence() + ' ' + faker.helpers.arrayElement([
          'He ran toward the door.',
          'She grabbed the weapon.',
          'The explosion rocked the building.',
          'They fought desperately.',
          'The ground shook beneath their feet.'
        ]);
      case 'dialogue':
        return `"${faker.lorem.sentence()}" ${faker.person.firstName()} said.`;
      case 'description':
        return faker.lorem.sentences(2) + ' The atmosphere was thick with tension.';
      case 'transition':
        return faker.helpers.arrayElement([
          'Meanwhile, across the city...',
          'Hours later...',
          'Back at the headquarters...',
          'The next morning...',
          'Suddenly...'
        ]);
      default:
        return faker.lorem.sentence();
    }
  }
}

export class CharacterFactory {
  static create(overrides: Partial<TestCharacter> = {}): TestCharacter {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    
    return {
      id: faker.string.uuid(),
      name,
      description: faker.lorem.sentences(2),
      storyId: faker.string.uuid(),
      role: faker.helpers.arrayElement(['protagonist', 'antagonist', 'supporting', 'minor']),
      traits: {
        physical: faker.helpers.arrayElements([
          'tall', 'short', 'athletic', 'slender', 'muscular', 'elegant',
          'blue eyes', 'brown hair', 'pale skin', 'dark complexion'
        ], faker.number.int({ min: 2, max: 4 })),
        personality: faker.helpers.arrayElements([
          'brave', 'intelligent', 'stubborn', 'kind', 'mysterious', 'ambitious',
          'loyal', 'impulsive', 'analytical', 'charming', 'determined'
        ], faker.number.int({ min: 3, max: 6 })),
        background: faker.helpers.arrayElements([
          'wealthy family', 'difficult childhood', 'military service', 'scholarly education',
          'criminal past', 'noble heritage', 'common origins', 'tragic loss'
        ], faker.number.int({ min: 1, max: 3 }))
      },
      relationships: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
        characterId: faker.string.uuid(),
        relationship: faker.helpers.arrayElement([
          'friend', 'enemy', 'lover', 'family', 'mentor', 'rival', 'ally'
        ]),
        description: faker.lorem.sentence()
      })),
      development: {
        motivation: faker.lorem.sentence(),
        goal: faker.lorem.words({ min: 3, max: 8 }),
        conflict: faker.lorem.sentence(),
        arc: faker.helpers.arrayElement([
          'hero\'s journey', 'fall from grace', 'redemption', 'coming of age',
          'tragic hero', 'antihero transformation', 'mentor to student'
        ])
      },
      appearances: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => faker.string.uuid()),
      createdAt: faker.date.past({ months: 6 }),
      updatedAt: faker.date.recent({ days: 10 }),
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<TestCharacter> = {}): TestCharacter[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createProtagonist(overrides: Partial<TestCharacter> = {}): TestCharacter {
    return this.create({ role: 'protagonist', ...overrides });
  }

  static createAntagonist(overrides: Partial<TestCharacter> = {}): TestCharacter {
    return this.create({ role: 'antagonist', ...overrides });
  }
}

export class LocationFactory {
  static create(overrides: Partial<TestLocation> = {}): TestLocation {
    const type = faker.helpers.arrayElement(['city', 'building', 'room', 'landscape', 'other'] as const);
    
    return {
      id: faker.string.uuid(),
      name: this.generateNameForType(type),
      description: faker.lorem.sentences(2),
      storyId: faker.string.uuid(),
      type,
      details: {
        atmosphere: faker.helpers.arrayElement([
          'mysterious', 'welcoming', 'threatening', 'peaceful', 'bustling',
          'abandoned', 'luxurious', 'gritty', 'ancient', 'modern'
        ]),
        significance: faker.lorem.sentence(),
        history: faker.helpers.maybe(() => faker.lorem.sentences(2), { probability: 0.6 })
      },
      appearances: Array.from({ length: faker.number.int({ min: 1, max: 8 }) }, () => faker.string.uuid()),
      createdAt: faker.date.past({ months: 6 }),
      updatedAt: faker.date.recent({ days: 15 }),
      ...overrides
    };
  }

  private static generateNameForType(type: TestLocation['type']): string {
    switch (type) {
      case 'city':
        return faker.location.city();
      case 'building':
        return `${faker.company.name()} ${faker.helpers.arrayElement(['Tower', 'Building', 'Complex', 'Institute'])}`;
      case 'room':
        return `${faker.helpers.arrayElement(['The', 'Main', 'Old', 'Secret'])} ${faker.helpers.arrayElement(['Library', 'Office', 'Laboratory', 'Chamber'])}`;
      case 'landscape':
        return `${faker.helpers.arrayElement(['Dark', 'Ancient', 'Forgotten', 'Sacred'])} ${faker.helpers.arrayElement(['Forest', 'Mountain', 'Valley', 'Plains'])}`;
      default:
        return faker.location.streetAddress();
    }
  }
}

export class TimelineEventFactory {
  static create(overrides: Partial<TestTimelineEvent> = {}): TestTimelineEvent {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.words({ min: 2, max: 6 }),
      description: faker.lorem.sentences(2),
      storyId: faker.string.uuid(),
      date: faker.date.between({ 
        from: new Date('1000-01-01'), 
        to: new Date('2100-12-31') 
      }),
      type: faker.helpers.arrayElement(['backstory', 'plot', 'character', 'world']),
      importance: faker.helpers.arrayElement(['minor', 'major', 'critical']),
      relatedCharacters: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => faker.string.uuid()),
      relatedLocations: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => faker.string.uuid()),
      createdAt: faker.date.past({ months: 3 }),
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<TestTimelineEvent> = {}): TestTimelineEvent[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

export class UserFactory {
  static create(overrides: Partial<TestUser> = {}): TestUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.userName({ firstName, lastName });
    
    return {
      id: faker.string.uuid(),
      username,
      email: faker.internet.email({ firstName, lastName }),
      profile: {
        displayName: `${firstName} ${lastName}`,
        bio: faker.lorem.sentences(2),
        avatar: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.7 }),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
          editorMode: faker.helpers.arrayElement(['rich', 'markdown', 'distraction-free']),
          autoSave: faker.datatype.boolean(),
          writingGoals: {
            dailyWordTarget: faker.number.int({ min: 250, max: 2000 }),
            weeklyWordTarget: faker.number.int({ min: 2000, max: 10000 })
          }
        }
      },
      subscription: {
        plan: faker.helpers.arrayElement(['free', 'pro', 'premium']),
        expiresAt: faker.helpers.maybe(() => faker.date.future({ years: 1 }), { probability: 0.6 }),
        features: faker.helpers.arrayElements([
          'unlimited-projects', 'ai-assistance', 'collaboration', 'advanced-export',
          'version-history', 'priority-support', 'custom-templates'
        ], faker.number.int({ min: 2, max: 5 }))
      },
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 7 }),
      lastActiveAt: faker.date.recent({ days: 1 }),
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createPremiumUser(overrides: Partial<TestUser> = {}): TestUser {
    return this.create({
      subscription: {
        plan: 'premium',
        expiresAt: faker.date.future({ years: 1 }),
        features: [
          'unlimited-projects', 'ai-assistance', 'collaboration', 'advanced-export',
          'version-history', 'priority-support', 'custom-templates'
        ]
      },
      ...overrides
    });
  }
}

// Composite factories for complex scenarios
export class ScenarioFactory {
  // Create a complete writing project with all related entities
  static createWritingProject(): {
    user: TestUser;
    project: TestProject;
    story: TestStory;
    notes: TestNote[];
  } {
    const user = UserFactory.create();
    const project = ProjectFactory.create({ userId: user.id });
    const story = StoryFactory.create({ projectId: project.id, userId: user.id });
    const notes = NoteFactory.createMany(8, { 
      projectId: project.id, 
      storyId: story.id, 
      userId: user.id 
    });

    return { user, project, story, notes };
  }

  // Create a collaborative project
  static createCollaborativeProject(collaboratorCount: number = 3): {
    owner: TestUser;
    collaborators: TestUser[];
    project: TestProject;
    story: TestStory;
    notes: TestNote[];
  } {
    const owner = UserFactory.create();
    const collaborators = UserFactory.createMany(collaboratorCount);
    const project = ProjectFactory.create({
      userId: owner.id,
      settings: {
        ...ProjectFactory.create().settings,
        collaborators: collaborators.map(c => c.id)
      }
    });
    const story = StoryFactory.create({ projectId: project.id, userId: owner.id });
    const notes = NoteFactory.createMany(12, { projectId: project.id, userId: owner.id });

    return { owner, collaborators, project, story, notes };
  }

  // Create a large-scale story with detailed world-building
  static createEpicStory(): {
    story: TestStory;
    detailedCharacters: TestCharacter[];
    locations: TestLocation[];
    timeline: TestTimelineEvent[];
  } {
    const story = StoryFactory.create({
      genre: 'Fantasy',
      status: 'drafting',
      wordTarget: 120000
    });

    const detailedCharacters = [
      CharacterFactory.createProtagonist({ storyId: story.id }),
      CharacterFactory.createAntagonist({ storyId: story.id }),
      ...CharacterFactory.createMany(6, { storyId: story.id, role: 'supporting' })
    ];

    const locations = LocationFactory.createMany(10, { storyId: story.id });
    const timeline = TimelineEventFactory.createMany(25, { storyId: story.id });

    return { story, detailedCharacters, locations, timeline };
  }
}

// Export all factories
export const factories = {
  Note: NoteFactory,
  Project: ProjectFactory,
  Story: StoryFactory,
  Chapter: ChapterFactory,
  Scene: SceneFactory,
  SceneBeat: SceneBeatFactory,
  Character: CharacterFactory,
  Location: LocationFactory,
  TimelineEvent: TimelineEventFactory,
  User: UserFactory,
  Scenario: ScenarioFactory
};

export default factories;