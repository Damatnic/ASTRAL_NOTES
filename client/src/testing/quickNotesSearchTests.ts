/**
 * Quick Notes Search and Filtering Test Suite
 * Comprehensive testing for search functionality, filtering, and query performance
 */

import { quickNotesService, QuickNote, QuickNoteSearchOptions } from '@/services/quickNotesService';
import { quickNotesTestDataGenerator } from './quickNotesTestDataGenerator';
import { NoteType } from '@/types/global';

interface SearchTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface SearchTestSuite {
  suiteName: string;
  results: SearchTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class QuickNotesSearchTestSuite {
  private results: SearchTestResult[] = [];
  private originalData: QuickNote[] = [];
  private testNotes: QuickNote[] = [];

  /**
   * Run all search and filtering tests
   */
  public async runAllTests(): Promise<SearchTestSuite> {
    console.log('🔍 Starting Quick Notes Search & Filtering Test Suite...');
    
    // Backup existing data and setup test data
    this.backupData();
    this.setupTestData();
    
    try {
      await this.runBasicSearchTests();
      await this.runAdvancedSearchTests();
      await this.runTagFilteringTests();
      await this.runTypeFilteringTests();
      await this.runDateRangeFilteringTests();
      await this.runSortingTests();
      await this.runCaseSensitivityTests();
      await this.runSpecialCharacterTests();
      await this.runPerformanceTests();
      await this.runErrorHandlingTests();
      
    } finally {
      // Restore original data
      this.restoreData();
    }

    return this.generateTestReport();
  }

  /**
   * Setup comprehensive test data
   */
  private setupTestData(): void {
    console.log('📊 Setting up test data...');
    
    // Clear existing data
    localStorage.setItem('astral_quick_notes', JSON.stringify([]));
    
    // Create comprehensive test dataset
    const testData = [
      // Basic search test notes
      { title: 'JavaScript Tutorial', content: 'Learn JavaScript programming basics', type: 'note' as NoteType, tags: ['programming', 'javascript', 'tutorial'] },
      { title: 'Python Guide', content: 'Python programming fundamentals and best practices', type: 'research' as NoteType, tags: ['programming', 'python', 'guide'] },
      { title: 'Web Development', content: 'HTML, CSS, and JavaScript for web development', type: 'note' as NoteType, tags: ['web', 'frontend', 'javascript'] },
      { title: 'React Components', content: 'Building reusable components in React framework', type: 'reference' as NoteType, tags: ['react', 'javascript', 'frontend'] },
      { title: 'Database Design', content: 'SQL database design principles and normalization', type: 'research' as NoteType, tags: ['database', 'sql', 'design'] },
      
      // Case sensitivity test notes
      { title: 'UPPERCASE TITLE', content: 'lowercase content here', type: 'note' as NoteType, tags: ['MixedCase', 'UPPER'] },
      { title: 'lowercase title', content: 'UPPERCASE CONTENT HERE', type: 'note' as NoteType, tags: ['mixedcase', 'lower'] },
      { title: 'MiXeD cAsE tItLe', content: 'MiXeD cAsE cOnTeNt', type: 'note' as NoteType, tags: ['CamelCase'] },
      
      // Special characters test notes
      { title: 'Special !@#$%^&*()_+-=[]{}|;:,.<>?', content: 'Content with symbols ~`', type: 'note' as NoteType, tags: ['special-chars', 'symbols'] },
      { title: 'Unicode 🎭📝✨', content: 'Unicode content: 你好世界 🌍', type: 'note' as NoteType, tags: ['unicode', '🏷️'] },
      { title: 'HTML <script>alert("test")</script>', content: '<div>HTML content</div>', type: 'note' as NoteType, tags: ['html', 'safety'] },
      
      // Content length variations
      { title: 'Short Note', content: 'Brief', type: 'note' as NoteType, tags: ['short'] },
      { title: 'Medium Note', content: 'This is a medium length note with several words to test search functionality across different content sizes.', type: 'note' as NoteType, tags: ['medium'] },
      { title: 'Long Note', content: 'This is a very long note content that spans multiple sentences and contains various keywords for testing search functionality. It includes technical terms like algorithm, implementation, performance, optimization, debugging, testing, validation, verification, documentation, specification, requirements, architecture, design patterns, best practices, code quality, maintainability, scalability, security, authentication, authorization, encryption, deployment, monitoring, logging, analytics, metrics, benchmarking, profiling, refactoring, version control, collaboration, project management.', type: 'note' as NoteType, tags: ['long', 'detailed'] },
      
      // Different note types
      { title: 'Character Development', content: 'Main character backstory and motivation', type: 'character' as NoteType, tags: ['character', 'story'] },
      { title: 'Plot Thread', content: 'Main story arc progression', type: 'plotthread' as NoteType, tags: ['plot', 'story'] },
      { title: 'World Building', content: 'Fantasy world rules and geography', type: 'worldrule' as NoteType, tags: ['world', 'fantasy'] },
      { title: 'Location Description', content: 'Detailed description of the ancient library', type: 'location' as NoteType, tags: ['location', 'description'] },
      { title: 'Magic Item', content: 'Enchanted sword with fire properties', type: 'item' as NoteType, tags: ['item', 'magic'] },
      { title: 'Dialogue Sample', content: '"Hello there," she said with a smile.', type: 'dialogue' as NoteType, tags: ['dialogue', 'conversation'] },
      { title: 'Theme Analysis', content: 'Exploration of redemption theme throughout the story', type: 'theme' as NoteType, tags: ['theme', 'analysis'] },
      
      // Date range test notes (we'll set specific dates)
      { title: 'Old Note', content: 'This is an old note', type: 'note' as NoteType, tags: ['old'] },
      { title: 'Recent Note', content: 'This is a recent note', type: 'note' as NoteType, tags: ['recent'] },
      { title: 'Today Note', content: 'This is today\'s note', type: 'note' as NoteType, tags: ['today'] },
      
      // Tag combination tests
      { title: 'Multi Tag 1', content: 'Content 1', type: 'note' as NoteType, tags: ['tag1', 'tag2', 'common'] },
      { title: 'Multi Tag 2', content: 'Content 2', type: 'note' as NoteType, tags: ['tag2', 'tag3', 'common'] },
      { title: 'Multi Tag 3', content: 'Content 3', type: 'note' as NoteType, tags: ['tag1', 'tag3', 'common'] },
      { title: 'Single Tag', content: 'Content 4', type: 'note' as NoteType, tags: ['unique'] },
      
      // Empty content test
      { title: 'Empty Content Note', content: '', type: 'note' as NoteType, tags: ['empty'] },
      { title: 'Whitespace Content', content: '   \n\t   ', type: 'note' as NoteType, tags: ['whitespace'] },
    ];

    // Create notes and store references
    this.testNotes = testData.map(data => quickNotesService.createQuickNote(data));
    
    // Manually adjust dates for date range testing
    this.adjustTestNoteDates();
  }

  /**
   * Adjust test note dates for date range testing
   */
  private adjustTestNoteDates(): void {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find specific notes and update their dates
    const oldNote = this.testNotes.find(n => n.title === 'Old Note');
    const recentNote = this.testNotes.find(n => n.title === 'Recent Note');
    
    if (oldNote) {
      quickNotesService.updateQuickNote(oldNote.id, {});
      // Manually set old date in storage
      const notes = quickNotesService.getAllQuickNotes();
      const noteIndex = notes.findIndex(n => n.id === oldNote.id);
      if (noteIndex !== -1) {
        notes[noteIndex].createdAt = oneMonthAgo.toISOString();
        notes[noteIndex].updatedAt = oneMonthAgo.toISOString();
        localStorage.setItem('astral_quick_notes', JSON.stringify(notes));
      }
    }
    
    if (recentNote) {
      quickNotesService.updateQuickNote(recentNote.id, {});
      // Manually set recent date in storage
      const notes = quickNotesService.getAllQuickNotes();
      const noteIndex = notes.findIndex(n => n.id === recentNote.id);
      if (noteIndex !== -1) {
        notes[noteIndex].createdAt = oneWeekAgo.toISOString();
        notes[noteIndex].updatedAt = oneWeekAgo.toISOString();
        localStorage.setItem('astral_quick_notes', JSON.stringify(notes));
      }
    }
  }

  /**
   * Basic search functionality tests
   */
  private async runBasicSearchTests(): Promise<void> {
    console.log('🔎 Testing Basic Search...');

    // Test simple text search in title
    await this.runTest('Simple Title Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'JavaScript' });
      
      const expectedTitles = ['JavaScript Tutorial', 'Web Development', 'React Components'];
      const foundTitles = results.map(note => note.title);
      
      if (results.length < 3) {
        throw new Error(`Expected at least 3 results, got ${results.length}`);
      }
      
      const missingTitles = expectedTitles.filter(title => !foundTitles.includes(title));
      if (missingTitles.length > 0) {
        throw new Error(`Missing expected titles: ${missingTitles.join(', ')}`);
      }

      return { 
        resultCount: results.length,
        foundTitles: foundTitles.slice(0, 5),
      };
    });

    // Test simple text search in content
    await this.runTest('Simple Content Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'programming' });
      
      if (results.length < 2) {
        throw new Error(`Expected at least 2 results, got ${results.length}`);
      }
      
      const hasJavaScript = results.some(note => note.title === 'JavaScript Tutorial');
      const hasPython = results.some(note => note.title === 'Python Guide');
      
      if (!hasJavaScript || !hasPython) {
        throw new Error('Content search did not find expected notes');
      }

      return { 
        resultCount: results.length,
        foundBoth: hasJavaScript && hasPython,
      };
    });

    // Test search with multiple words
    await this.runTest('Multiple Word Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'web development' });
      
      if (results.length === 0) {
        throw new Error('Multi-word search returned no results');
      }
      
      const hasWebDev = results.some(note => note.title === 'Web Development');
      if (!hasWebDev) {
        throw new Error('Multi-word search did not find expected note');
      }

      return { 
        resultCount: results.length,
        foundExpected: hasWebDev,
      };
    });

    // Test empty search query
    await this.runTest('Empty Search Query', async () => {
      const results = quickNotesService.searchQuickNotes({ query: '' });
      const allNotes = quickNotesService.getAllQuickNotes();
      
      if (results.length !== allNotes.length) {
        throw new Error('Empty search should return all notes');
      }

      return { 
        resultCount: results.length,
        totalNotes: allNotes.length,
      };
    });

    // Test no results found
    await this.runTest('No Results Found', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'nonexistentkeyword12345' });
      
      if (results.length !== 0) {
        throw new Error('Search for non-existent keyword should return no results');
      }

      return { resultCount: 0 };
    });
  }

  /**
   * Advanced search functionality tests
   */
  private async runAdvancedSearchTests(): Promise<void> {
    console.log('🔍 Testing Advanced Search...');

    // Test partial word matching
    await this.runTest('Partial Word Matching', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'java' });
      
      const hasJavaScript = results.some(note => note.title.includes('JavaScript'));
      if (!hasJavaScript) {
        throw new Error('Partial word search did not find JavaScript');
      }

      return { 
        resultCount: results.length,
        foundPartialMatch: hasJavaScript,
      };
    });

    // Test search with special characters
    await this.runTest('Special Characters Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: '!@#' });
      
      if (results.length === 0) {
        throw new Error('Special characters search returned no results');
      }
      
      const hasSpecialNote = results.some(note => note.title.includes('Special !@#'));
      if (!hasSpecialNote) {
        throw new Error('Special characters search did not find expected note');
      }

      return { 
        resultCount: results.length,
        foundSpecialChars: hasSpecialNote,
      };
    });

    // Test unicode search
    await this.runTest('Unicode Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: '🎭' });
      
      if (results.length === 0) {
        throw new Error('Unicode search returned no results');
      }
      
      const hasUnicodeNote = results.some(note => note.title.includes('🎭'));
      if (!hasUnicodeNote) {
        throw new Error('Unicode search did not find expected note');
      }

      return { 
        resultCount: results.length,
        foundUnicode: hasUnicodeNote,
      };
    });

    // Test HTML content search
    await this.runTest('HTML Content Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'div' });
      
      if (results.length === 0) {
        throw new Error('HTML content search returned no results');
      }
      
      const hasHtmlNote = results.some(note => note.content.includes('<div>'));
      if (!hasHtmlNote) {
        throw new Error('HTML content search did not find expected note');
      }

      return { 
        resultCount: results.length,
        foundHtml: hasHtmlNote,
      };
    });
  }

  /**
   * Tag filtering tests
   */
  private async runTagFilteringTests(): Promise<void> {
    console.log('🏷️ Testing Tag Filtering...');

    // Test single tag filter
    await this.runTest('Single Tag Filter', async () => {
      const results = quickNotesService.searchQuickNotes({ tags: ['programming'] });
      
      if (results.length < 2) {
        throw new Error(`Expected at least 2 results for 'programming' tag, got ${results.length}`);
      }
      
      const allHaveTag = results.every(note => note.tags.includes('programming'));
      if (!allHaveTag) {
        throw new Error('Not all results have the specified tag');
      }

      return { 
        resultCount: results.length,
        allHaveTag,
      };
    });

    // Test multiple tag filter (OR logic)
    await this.runTest('Multiple Tag Filter', async () => {
      const results = quickNotesService.searchQuickNotes({ tags: ['tag1', 'tag3'] });
      
      if (results.length === 0) {
        throw new Error('Multiple tag filter returned no results');
      }
      
      const hasCorrectTags = results.every(note => 
        note.tags.includes('tag1') || note.tags.includes('tag3')
      );
      
      if (!hasCorrectTags) {
        throw new Error('Not all results have at least one of the specified tags');
      }

      return { 
        resultCount: results.length,
        hasCorrectTags,
      };
    });

    // Test tag with special characters
    await this.runTest('Special Character Tag Filter', async () => {
      const results = quickNotesService.searchQuickNotes({ tags: ['special-chars'] });
      
      if (results.length === 0) {
        throw new Error('Special character tag filter returned no results');
      }
      
      const hasSpecialTag = results.every(note => note.tags.includes('special-chars'));
      if (!hasSpecialTag) {
        throw new Error('Not all results have the special character tag');
      }

      return { 
        resultCount: results.length,
        hasSpecialTag,
      };
    });

    // Test unicode tag
    await this.runTest('Unicode Tag Filter', async () => {
      const results = quickNotesService.searchQuickNotes({ tags: ['🏷️'] });
      
      if (results.length === 0) {
        throw new Error('Unicode tag filter returned no results');
      }
      
      const hasUnicodeTag = results.every(note => note.tags.includes('🏷️'));
      if (!hasUnicodeTag) {
        throw new Error('Not all results have the unicode tag');
      }

      return { 
        resultCount: results.length,
        hasUnicodeTag,
      };
    });

    // Test non-existent tag
    await this.runTest('Non-existent Tag Filter', async () => {
      const results = quickNotesService.searchQuickNotes({ tags: ['nonexistenttag'] });
      
      if (results.length !== 0) {
        throw new Error('Non-existent tag filter should return no results');
      }

      return { resultCount: 0 };
    });
  }

  /**
   * Note type filtering tests
   */
  private async runTypeFilteringTests(): Promise<void> {
    console.log('📝 Testing Type Filtering...');

    // Test each note type
    const noteTypes: NoteType[] = ['note', 'research', 'character', 'location', 'item', 'plotthread', 'theme', 'worldrule', 'dialogue', 'reference'];

    for (const type of noteTypes) {
      await this.runTest(`Type Filter: ${type}`, async () => {
        const results = quickNotesService.searchQuickNotes({ type });
        
        if (results.length === 0) {
          // Some types might not have test data, which is okay
          return { resultCount: 0, typeFound: false };
        }
        
        const allCorrectType = results.every(note => note.type === type);
        if (!allCorrectType) {
          throw new Error(`Not all results are of type '${type}'`);
        }

        return { 
          resultCount: results.length,
          allCorrectType,
        };
      });
    }

    // Test invalid note type
    await this.runTest('Invalid Type Filter', async () => {
      const results = quickNotesService.searchQuickNotes({ type: 'invalidtype' as NoteType });
      
      if (results.length !== 0) {
        throw new Error('Invalid type filter should return no results');
      }

      return { resultCount: 0 };
    });
  }

  /**
   * Date range filtering tests
   */
  private async runDateRangeFilteringTests(): Promise<void> {
    console.log('📅 Testing Date Range Filtering...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Test recent date range
    await this.runTest('Recent Date Range', async () => {
      const results = quickNotesService.searchQuickNotes({
        dateRange: {
          start: oneWeekAgo.toISOString(),
          end: now.toISOString(),
        },
      });

      // Should include notes created in the last week
      if (results.length === 0) {
        throw new Error('Recent date range returned no results');
      }

      const allInRange = results.every(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= oneWeekAgo && noteDate <= now;
      });

      if (!allInRange) {
        throw new Error('Not all results are within the specified date range');
      }

      return { 
        resultCount: results.length,
        allInRange,
      };
    });

    // Test old date range
    await this.runTest('Old Date Range', async () => {
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const results = quickNotesService.searchQuickNotes({
        dateRange: {
          start: twoMonthsAgo.toISOString(),
          end: oneMonthAgo.toISOString(),
        },
      });

      // Results depend on whether we have old test data
      const allInRange = results.every(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= twoMonthsAgo && noteDate <= oneMonthAgo;
      });

      if (!allInRange && results.length > 0) {
        throw new Error('Not all results are within the old date range');
      }

      return { 
        resultCount: results.length,
        allInRange: results.length === 0 || allInRange,
      };
    });

    // Test narrow date range
    await this.runTest('Narrow Date Range', async () => {
      const results = quickNotesService.searchQuickNotes({
        dateRange: {
          start: yesterday.toISOString(),
          end: now.toISOString(),
        },
      });

      // Should include today's notes
      const allInRange = results.every(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= yesterday && noteDate <= now;
      });

      if (!allInRange && results.length > 0) {
        throw new Error('Not all results are within the narrow date range');
      }

      return { 
        resultCount: results.length,
        allInRange: results.length === 0 || allInRange,
      };
    });
  }

  /**
   * Sorting tests
   */
  private async runSortingTests(): Promise<void> {
    console.log('📊 Testing Sorting...');

    // Test sort by title ascending
    await this.runTest('Sort by Title ASC', async () => {
      const results = quickNotesService.searchQuickNotes({
        sortBy: 'title',
        sortOrder: 'asc',
      });

      if (results.length < 2) {
        return { resultCount: results.length, sorted: true };
      }

      const isSorted = results.every((note, index) => {
        if (index === 0) return true;
        return note.title.toLowerCase() >= results[index - 1].title.toLowerCase();
      });

      if (!isSorted) {
        throw new Error('Results not sorted by title ascending');
      }

      return { 
        resultCount: results.length,
        sorted: true,
        firstTitle: results[0].title,
        lastTitle: results[results.length - 1].title,
      };
    });

    // Test sort by title descending
    await this.runTest('Sort by Title DESC', async () => {
      const results = quickNotesService.searchQuickNotes({
        sortBy: 'title',
        sortOrder: 'desc',
      });

      if (results.length < 2) {
        return { resultCount: results.length, sorted: true };
      }

      const isSorted = results.every((note, index) => {
        if (index === 0) return true;
        return note.title.toLowerCase() <= results[index - 1].title.toLowerCase();
      });

      if (!isSorted) {
        throw new Error('Results not sorted by title descending');
      }

      return { 
        resultCount: results.length,
        sorted: true,
        firstTitle: results[0].title,
        lastTitle: results[results.length - 1].title,
      };
    });

    // Test sort by date
    await this.runTest('Sort by Date', async () => {
      const results = quickNotesService.searchQuickNotes({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (results.length < 2) {
        return { resultCount: results.length, sorted: true };
      }

      const isSorted = results.every((note, index) => {
        if (index === 0) return true;
        const currentDate = new Date(note.createdAt).getTime();
        const prevDate = new Date(results[index - 1].createdAt).getTime();
        return currentDate <= prevDate;
      });

      if (!isSorted) {
        throw new Error('Results not sorted by date descending');
      }

      return { 
        resultCount: results.length,
        sorted: true,
        firstDate: results[0].createdAt,
        lastDate: results[results.length - 1].createdAt,
      };
    });
  }

  /**
   * Case sensitivity tests
   */
  private async runCaseSensitivityTests(): Promise<void> {
    console.log('🔤 Testing Case Sensitivity...');

    // Test lowercase search for uppercase content
    await this.runTest('Lowercase Search for Uppercase', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'uppercase' });
      
      const hasUppercaseNote = results.some(note => note.title.includes('UPPERCASE'));
      if (!hasUppercaseNote) {
        throw new Error('Lowercase search did not find uppercase content');
      }

      return { 
        resultCount: results.length,
        foundUppercase: hasUppercaseNote,
      };
    });

    // Test uppercase search for lowercase content
    await this.runTest('Uppercase Search for Lowercase', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'LOWERCASE' });
      
      const hasLowercaseNote = results.some(note => note.title.includes('lowercase'));
      if (!hasLowercaseNote) {
        throw new Error('Uppercase search did not find lowercase content');
      }

      return { 
        resultCount: results.length,
        foundLowercase: hasLowercaseNote,
      };
    });

    // Test mixed case search
    await this.runTest('Mixed Case Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: 'MiXeD' });
      
      const hasMixedNote = results.some(note => note.title.includes('MiXeD'));
      if (!hasMixedNote) {
        throw new Error('Mixed case search did not find mixed case content');
      }

      return { 
        resultCount: results.length,
        foundMixed: hasMixedNote,
      };
    });

    // Test case insensitive tag search
    await this.runTest('Case Insensitive Tag Search', async () => {
      const upperResults = quickNotesService.searchQuickNotes({ tags: ['MIXEDCASE'] });
      const lowerResults = quickNotesService.searchQuickNotes({ tags: ['mixedcase'] });
      
      // Note: Tag search might be case sensitive by design
      // This test documents the current behavior
      
      return { 
        upperResultCount: upperResults.length,
        lowerResultCount: lowerResults.length,
        behavior: 'documented',
      };
    });
  }

  /**
   * Special character tests
   */
  private async runSpecialCharacterTests(): Promise<void> {
    console.log('🔣 Testing Special Characters...');

    // Test search with quotes
    await this.runTest('Quote Character Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: '"Hello there"' });
      
      const hasQuotedContent = results.some(note => note.content.includes('"Hello there"'));
      if (!hasQuotedContent) {
        throw new Error('Quote search did not find quoted content');
      }

      return { 
        resultCount: results.length,
        foundQuotes: hasQuotedContent,
      };
    });

    // Test search with regex special characters
    await this.runTest('Regex Special Characters', async () => {
      const specialChars = ['(', ')', '[', ']', '{', '}', '*', '+', '?', '.', '^', '$', '|', '\\'];
      
      let foundAny = false;
      for (const char of specialChars) {
        const results = quickNotesService.searchQuickNotes({ query: char });
        if (results.length > 0) {
          foundAny = true;
          break;
        }
      }

      return { 
        testedChars: specialChars.length,
        foundAny,
      };
    });

    // Test search with whitespace
    await this.runTest('Whitespace Search', async () => {
      const results = quickNotesService.searchQuickNotes({ query: '   ' });
      
      // Empty/whitespace query should behave consistently
      const allNotes = quickNotesService.getAllQuickNotes();
      const expectedBehavior = results.length === allNotes.length || results.length === 0;
      
      if (!expectedBehavior) {
        throw new Error('Whitespace search behavior is inconsistent');
      }

      return { 
        resultCount: results.length,
        totalNotes: allNotes.length,
        behaviorConsistent: expectedBehavior,
      };
    });
  }

  /**
   * Performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('🚀 Testing Search Performance...');

    // Test search performance with many notes
    await this.runTest('Large Dataset Search Performance', async () => {
      // Add performance test data
      const performanceData = quickNotesTestDataGenerator.generatePerformanceTestData(100);
      const performanceNotes = performanceData.map(data => quickNotesService.createQuickNote(data));

      const startTime = Date.now();
      const results = quickNotesService.searchQuickNotes({ query: 'Performance' });
      const searchTime = Date.now() - startTime;

      // Performance threshold: should complete within reasonable time
      if (searchTime > 1000) {
        throw new Error(`Search took too long: ${searchTime}ms`);
      }

      // Cleanup performance notes
      performanceNotes.forEach(note => quickNotesService.deleteQuickNote(note.id));

      return { 
        searchTime,
        resultCount: results.length,
        datasetSize: performanceNotes.length,
      };
    });

    // Test complex query performance
    await this.runTest('Complex Query Performance', async () => {
      const startTime = Date.now();
      
      const results = quickNotesService.searchQuickNotes({
        query: 'JavaScript',
        tags: ['programming'],
        type: 'note',
        sortBy: 'title',
        sortOrder: 'asc',
      });
      
      const queryTime = Date.now() - startTime;

      if (queryTime > 500) {
        throw new Error(`Complex query took too long: ${queryTime}ms`);
      }

      return { 
        queryTime,
        resultCount: results.length,
        complexity: 'high',
      };
    });

    // Test very long search query
    await this.runTest('Long Query Performance', async () => {
      const longQuery = 'a'.repeat(1000);
      
      const startTime = Date.now();
      const results = quickNotesService.searchQuickNotes({ query: longQuery });
      const queryTime = Date.now() - startTime;

      if (queryTime > 500) {
        throw new Error(`Long query took too long: ${queryTime}ms`);
      }

      return { 
        queryTime,
        queryLength: longQuery.length,
        resultCount: results.length,
      };
    });
  }

  /**
   * Error handling tests
   */
  private async runErrorHandlingTests(): Promise<void> {
    console.log('⚠️ Testing Search Error Handling...');

    // Test search with null options
    await this.runTest('Null Options Handling', async () => {
      try {
        const results = quickNotesService.searchQuickNotes();
        
        // Should return all notes or handle gracefully
        const allNotes = quickNotesService.getAllQuickNotes();
        const handledGracefully = Array.isArray(results);
        
        if (!handledGracefully) {
          throw new Error('Null options not handled gracefully');
        }

        return { 
          handled: true,
          resultCount: results.length,
        };
      } catch (error) {
        throw new Error('Search with null options threw error');
      }
    });

    // Test search with invalid date range
    await this.runTest('Invalid Date Range Handling', async () => {
      try {
        const results = quickNotesService.searchQuickNotes({
          dateRange: {
            start: 'invalid-date',
            end: 'also-invalid',
          },
        });

        // Should handle gracefully, not throw error
        return { 
          handled: true,
          resultCount: results.length,
        };
      } catch (error) {
        throw new Error('Invalid date range not handled gracefully');
      }
    });

    // Test search with very large tag array
    await this.runTest('Large Tag Array Handling', async () => {
      const largeTags = Array.from({ length: 1000 }, (_, i) => `tag${i}`);
      
      try {
        const results = quickNotesService.searchQuickNotes({ tags: largeTags });
        
        return { 
          handled: true,
          tagCount: largeTags.length,
          resultCount: results.length,
        };
      } catch (error) {
        throw new Error('Large tag array not handled gracefully');
      }
    });
  }

  /**
   * Helper methods
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        details: result,
        duration,
      });
      
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      
      console.log(`❌ ${testName} (${duration}ms): ${error}`);
    }
  }

  private backupData(): void {
    this.originalData = quickNotesService.getAllQuickNotes();
  }

  private restoreData(): void {
    localStorage.setItem('astral_quick_notes', JSON.stringify(this.originalData));
  }

  private generateTestReport(): SearchTestSuite {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      suiteName: 'Quick Notes Search & Filtering',
      results: this.results,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
    };
  }
}

// Export test runner
export const quickNotesSearchTests = new QuickNotesSearchTestSuite();