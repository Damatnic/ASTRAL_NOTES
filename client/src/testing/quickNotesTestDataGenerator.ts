/**
 * Quick Notes Test Data Generator
 * Generates various types of test data for comprehensive Quick Notes testing
 */

import { QuickNote, CreateQuickNoteData } from '@/services/quickNotesService';
import { NoteType } from '@/types/global';

interface TestDataOptions {
  count?: number;
  includeEdgeCases?: boolean;
  includeInvalidData?: boolean;
  tags?: string[];
  projectIds?: string[];
}

interface TestScenario {
  name: string;
  description: string;
  data: CreateQuickNoteData[];
  expectedResults?: any;
  validationRules?: any;
}

export class QuickNotesTestDataGenerator {
  private readonly sampleTitles = [
    'Meeting Notes',
    'Project Ideas',
    'Character Development',
    'Research References',
    'Plot Outline',
    'World Building Notes',
    'Dialogue Ideas',
    'Theme Analysis',
    'Location Descriptions',
    'Story Structure',
    'Character Backstory',
    'Conflict Resolution',
    'Setting Details',
    'Motivation Notes',
    'Scene Planning',
    'Chapter Summary',
    'Beta Reader Feedback',
    'Publication Plan',
    'Marketing Strategy',
    'Book Cover Ideas',
  ];

  private readonly sampleContent = [
    'This is a basic note with simple text content.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    `# Heading 1\n\n## Heading 2\n\nThis note contains **markdown** formatting with *emphasis* and [links](https://example.com).\n\n- List item 1\n- List item 2\n- List item 3`,
    'A very short note.',
    `This is a much longer note content that spans multiple lines and contains various types of information including detailed descriptions, explanations, and comprehensive documentation that might be typical of research notes or extensive character development documents.

The content includes multiple paragraphs to simulate real-world usage where users might write detailed notes with substantial content.

It also includes special characters: !@#$%^&*()_+-=[]{}|;:,.<>?

And numbers: 1234567890

Unicode characters: 🎭📝✨🎨🎪🎨🎭📚

This helps test various scenarios including word count calculations, search functionality, and display formatting.`,
    '',
    'Single line without punctuation',
    'Note with "quotes" and \'apostrophes\' and special chars: <>&',
    `Code block example:

\`\`\`javascript
function test() {
  return "Hello World";
}
\`\`\`

More content after code block.`,
    'Tab	separated	content	here',
    'Line 1\nLine 2\nLine 3\nMultiple\nNew\nLines',
  ];

  private readonly sampleTags = [
    'important',
    'urgent',
    'draft',
    'review',
    'complete',
    'research',
    'character',
    'plot',
    'world-building',
    'dialogue',
    'setting',
    'theme',
    'reference',
    'inspiration',
    'feedback',
    'revision',
    'marketing',
    'publishing',
    'brainstorm',
    'meeting',
  ];

  private readonly noteTypes: NoteType[] = [
    'note',
    'research',
    'dialogue',
    'character',
    'location',
    'item',
    'plotthread',
    'theme',
    'worldrule',
    'reference',
  ];

  private readonly priorities = ['low', 'medium', 'high', 'urgent'] as const;

  /**
   * Generate basic test notes
   */
  public generateBasicNotes(options: TestDataOptions = {}): CreateQuickNoteData[] {
    const { count = 10, tags = this.sampleTags, projectIds = [] } = options;
    const notes: CreateQuickNoteData[] = [];

    for (let i = 0; i < count; i++) {
      const note: CreateQuickNoteData = {
        title: this.getRandomElement(this.sampleTitles) + ` ${i + 1}`,
        content: this.getRandomElement(this.sampleContent),
        type: this.getRandomElement(this.noteTypes),
        tags: this.getRandomTags(tags, Math.floor(Math.random() * 4)),
        projectId: projectIds.length > 0 && Math.random() > 0.5 
          ? this.getRandomElement(projectIds) 
          : null,
      };
      notes.push(note);
    }

    return notes;
  }

  /**
   * Generate edge case test data
   */
  public generateEdgeCases(): CreateQuickNoteData[] {
    return [
      // Empty/minimal data
      { title: '', content: '', type: 'note', tags: [] },
      { title: ' ', content: ' ', type: 'note', tags: [] },
      { title: 'Minimal Note', type: 'note' },
      
      // Maximum length scenarios
      { title: 'A'.repeat(1000), content: 'B'.repeat(50000), type: 'note', tags: [] },
      { title: 'C'.repeat(255), content: 'D'.repeat(10000), type: 'note', tags: [] },
      
      // Special characters
      { title: '!@#$%^&*()_+-=[]{}|;:,.<>?', content: 'Special chars test', type: 'note', tags: [] },
      { title: 'Unicode: 🎭📝✨🎨🎪', content: 'Unicode content: 你好世界 🌍', type: 'note', tags: [] },
      { title: 'HTML <script>alert("test")</script>', content: '<div>HTML content</div>', type: 'note', tags: [] },
      
      // Tag edge cases
      { title: 'Many Tags Test', content: 'Testing many tags', type: 'note', tags: Array.from({length: 20}, (_, i) => `tag${i}`) },
      { title: 'Special Tag Chars', content: 'Special tag characters', type: 'note', tags: ['tag with spaces', 'tag-with-dashes', 'tag_with_underscores', '123numeric'] },
      
      // Whitespace variations
      { title: '\t\nWhitespace Test\t\n', content: '\t\nContent with whitespace\t\n', type: 'note', tags: ['\ttab-tag\n'] },
      { title: '   Spaces   ', content: '   Spaced content   ', type: 'note', tags: ['  spaced-tag  '] },
      
      // All note types
      ...this.noteTypes.map(type => ({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Note`,
        content: `This is a ${type} type note for testing.`,
        type,
        tags: [type],
      })),
    ];
  }

  /**
   * Generate performance test data
   */
  public generatePerformanceTestData(count: number = 1000): CreateQuickNoteData[] {
    const notes: CreateQuickNoteData[] = [];
    
    for (let i = 0; i < count; i++) {
      const contentSize = Math.floor(Math.random() * 5000) + 100; // 100-5100 chars
      const tagCount = Math.floor(Math.random() * 10); // 0-9 tags
      
      notes.push({
        title: `Performance Test Note ${i + 1}`,
        content: this.generateLongContent(contentSize),
        type: this.getRandomElement(this.noteTypes),
        tags: this.getRandomTags(this.sampleTags, tagCount),
        projectId: Math.random() > 0.7 ? `project_${Math.floor(Math.random() * 10)}` : null,
      });
    }
    
    return notes;
  }

  /**
   * Generate search test scenarios
   */
  public generateSearchTestScenarios(): TestScenario[] {
    return [
      {
        name: 'Basic Text Search',
        description: 'Test searching for specific text in titles and content',
        data: [
          { title: 'JavaScript Tutorial', content: 'Learning JavaScript basics', type: 'note', tags: ['programming'] },
          { title: 'Python Guide', content: 'Python programming fundamentals', type: 'note', tags: ['programming'] },
          { title: 'Web Development', content: 'HTML, CSS, and JavaScript', type: 'note', tags: ['web'] },
        ],
        expectedResults: {
          'JavaScript': 2, // Should find 2 notes
          'Python': 1,
          'programming': 2,
          'web': 1,
          'nonexistent': 0,
        },
      },
      {
        name: 'Tag-based Search',
        description: 'Test searching by tags',
        data: [
          { title: 'Note 1', content: 'Content 1', type: 'note', tags: ['tag1', 'tag2'] },
          { title: 'Note 2', content: 'Content 2', type: 'note', tags: ['tag2', 'tag3'] },
          { title: 'Note 3', content: 'Content 3', type: 'note', tags: ['tag1', 'tag3'] },
        ],
        expectedResults: {
          'tag1': 2,
          'tag2': 2,
          'tag3': 2,
          'tag1,tag2': 1, // Should find notes with both tags
        },
      },
      {
        name: 'Case Sensitivity',
        description: 'Test case-insensitive search functionality',
        data: [
          { title: 'UPPERCASE TITLE', content: 'lowercase content', type: 'note', tags: ['MixedCase'] },
          { title: 'lowercase title', content: 'UPPERCASE CONTENT', type: 'note', tags: ['mixedcase'] },
        ],
        expectedResults: {
          'uppercase': 2,
          'LOWERCASE': 2,
          'MixedCase': 2,
          'mixedcase': 2,
        },
      },
    ];
  }

  /**
   * Generate import/export test data
   */
  public generateImportExportTestData(): {
    validJson: string;
    invalidJson: string;
    duplicateIds: string;
    partialData: string;
  } {
    const validNotes = this.generateBasicNotes({ count: 5 });
    const notesWithIds = validNotes.map((note, index) => ({
      ...note,
      id: `test_note_${index}`,
      isQuickNote: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: note.content?.split(' ').length || 0,
      readTime: Math.ceil((note.content?.split(' ').length || 0) / 200),
      status: 'draft',
      priority: 'medium',
      position: index,
    }));

    return {
      validJson: JSON.stringify(notesWithIds, null, 2),
      invalidJson: '{ invalid json syntax',
      duplicateIds: JSON.stringify([
        { ...notesWithIds[0], id: 'duplicate_id' },
        { ...notesWithIds[1], id: 'duplicate_id' },
      ], null, 2),
      partialData: JSON.stringify([
        { title: 'Incomplete Note' }, // Missing required fields
        { id: 'note_2', title: '', content: 'No title' }, // Empty title
      ], null, 2),
    };
  }

  /**
   * Generate bulk operations test data
   */
  public generateBulkOperationsTestData(): {
    smallBatch: CreateQuickNoteData[];
    mediumBatch: CreateQuickNoteData[];
    largeBatch: CreateQuickNoteData[];
    mixedTypes: CreateQuickNoteData[];
  } {
    return {
      smallBatch: this.generateBasicNotes({ count: 5 }),
      mediumBatch: this.generateBasicNotes({ count: 50 }),
      largeBatch: this.generateBasicNotes({ count: 200 }),
      mixedTypes: this.noteTypes.map(type => ({
        title: `${type} Note`,
        content: `This is a ${type} note`,
        type,
        tags: [type, 'mixed-batch'],
      })),
    };
  }

  /**
   * Generate attachment test scenarios
   */
  public generateAttachmentTestData(projectIds: string[]): {
    unattachedNotes: CreateQuickNoteData[];
    attachedNotes: CreateQuickNoteData[];
    mixedNotes: CreateQuickNoteData[];
  } {
    return {
      unattachedNotes: this.generateBasicNotes({ count: 10, projectIds: [] }),
      attachedNotes: this.generateBasicNotes({ count: 10, projectIds }).map(note => ({
        ...note,
        projectId: this.getRandomElement(projectIds),
      })),
      mixedNotes: this.generateBasicNotes({ count: 20, projectIds }),
    };
  }

  /**
   * Generate auto-save test scenarios
   */
  public generateAutoSaveTestData(): {
    rapidChanges: string[];
    largeContent: string;
    specialCharacters: string;
    emptyContent: string;
  } {
    return {
      rapidChanges: [
        'A',
        'AB',
        'ABC',
        'ABCD',
        'ABCDE',
        'ABCDEF',
        'ABCDEFG',
        'ABCDEFGH',
        'ABCDEFGHI',
        'ABCDEFGHIJ',
      ],
      largeContent: this.generateLongContent(10000),
      specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?~`\'"\\/',
      emptyContent: '',
    };
  }

  /**
   * Helper methods
   */
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomTags(availableTags: string[], count: number): string[] {
    if (count <= 0) return [];
    const shuffled = [...availableTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, availableTags.length));
  }

  private generateLongContent(length: number): string {
    const words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
      'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
      'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
    ];

    let content = '';
    while (content.length < length) {
      const word = this.getRandomElement(words);
      content += word + ' ';
    }

    return content.substring(0, length).trim();
  }

  /**
   * Validate generated test data
   */
  public validateTestData(notes: CreateQuickNoteData[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    notes.forEach((note, index) => {
      // Check required fields
      if (!note.title && note.title !== '') {
        errors.push(`Note ${index}: Missing title`);
      }

      // Check note type validity
      if (note.type && !this.noteTypes.includes(note.type)) {
        errors.push(`Note ${index}: Invalid note type '${note.type}'`);
      }

      // Check for extremely long content
      if (note.content && note.content.length > 100000) {
        warnings.push(`Note ${index}: Very long content (${note.content.length} chars)`);
      }

      // Check for too many tags
      if (note.tags && note.tags.length > 50) {
        warnings.push(`Note ${index}: Many tags (${note.tags.length})`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate complete test suite data
   */
  public generateCompleteTestSuite(projectIds: string[] = []): {
    basic: CreateQuickNoteData[];
    edgeCases: CreateQuickNoteData[];
    performance: CreateQuickNoteData[];
    searchScenarios: TestScenario[];
    importExport: ReturnType<typeof this.generateImportExportTestData>;
    bulkOperations: ReturnType<typeof this.generateBulkOperationsTestData>;
    attachment: ReturnType<typeof this.generateAttachmentTestData>;
    autoSave: ReturnType<typeof this.generateAutoSaveTestData>;
  } {
    return {
      basic: this.generateBasicNotes({ count: 25, projectIds }),
      edgeCases: this.generateEdgeCases(),
      performance: this.generatePerformanceTestData(100),
      searchScenarios: this.generateSearchTestScenarios(),
      importExport: this.generateImportExportTestData(),
      bulkOperations: this.generateBulkOperationsTestData(),
      attachment: this.generateAttachmentTestData(projectIds),
      autoSave: this.generateAutoSaveTestData(),
    };
  }
}

// Export singleton instance
export const quickNotesTestDataGenerator = new QuickNotesTestDataGenerator();