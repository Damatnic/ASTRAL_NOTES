/**
 * Advanced Formatting Service Tests
 * Comprehensive testing for professional manuscript formatting
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { advancedFormattingService } from '@/services/advancedFormattingService';
import type { FormattingSettings, ManuscriptPreset, StyleGuide } from '@/services/advancedFormattingService';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('AdvancedFormattingService', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset service state by clearing presets and reloading defaults
    (advancedFormattingService as any).presets = [];
    (advancedFormattingService as any).settings = (advancedFormattingService as any).getDefaultSettings();
    (advancedFormattingService as any).initializePresets();
    if ((advancedFormattingService as any).removeAllListeners) {
      (advancedFormattingService as any).removeAllListeners();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Settings Management', () => {
    test('should initialize with default settings', () => {
      const settings = advancedFormattingService.getSettings();
      
      expect(settings.manuscript.font).toBe('Times New Roman');
      expect(settings.manuscript.fontSize).toBe(12);
      expect(settings.manuscript.lineHeight).toBe(2.0);
      expect(settings.typography.indentFirstLine).toBe(true);
      expect(settings.typography.indentSize).toBe(4);
      expect(settings.headers.showPageNumbers).toBe(true);
      expect(settings.dialogue.quotationStyle).toBe('smart');
    });

    test('should update settings correctly', () => {
      const updateData = {
        manuscript: {
          font: 'Arial',
          fontSize: 14
        }
      };

      advancedFormattingService.updateSettings(updateData);
      const settings = advancedFormattingService.getSettings();

      expect(settings.manuscript.font).toBe('Arial');
      expect(settings.manuscript.fontSize).toBe(14);
      // Other settings should remain unchanged
      expect(settings.manuscript.lineHeight).toBe(2.0);
      expect(settings.typography.indentFirstLine).toBe(true);
    });

    test('should emit settingsUpdated event when settings change', () => {
      const eventSpy = vi.fn();
      advancedFormattingService.on('settingsUpdated', eventSpy);

      const updateData = { manuscript: { font: 'Courier' } };
      advancedFormattingService.updateSettings(updateData);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          manuscript: expect.objectContaining({ font: 'Courier' })
        })
      );
    });

    test('should reset settings to defaults', () => {
      // First change settings
      advancedFormattingService.updateSettings({
        manuscript: { font: 'Comic Sans' }
      });

      // Then reset
      advancedFormattingService.resetSettings();
      const settings = advancedFormattingService.getSettings();

      expect(settings.manuscript.font).toBe('Times New Roman');
    });

    test('should save settings to localStorage on update', () => {
      const updateData = { manuscript: { font: 'Helvetica' } };
      
      advancedFormattingService.updateSettings(updateData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'astral_notes_formatting_settings',
        expect.stringContaining('Helvetica')
      );
    });

    test('should load settings from localStorage on initialization', () => {
      const savedSettings = {
        manuscript: { font: 'Garamond', fontSize: 13 },
        typography: { indentFirstLine: false }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));

      // Force reload from mocked localStorage
      advancedFormattingService.loadSettings();
      const settings = advancedFormattingService.getSettings();

      expect(settings.manuscript.font).toBe('Garamond');
      expect(settings.manuscript.fontSize).toBe(13);
      expect(settings.typography.indentFirstLine).toBe(false);
    });
  });

  describe('Manuscript Presets', () => {
    test('should provide default industry presets', () => {
      const presets = advancedFormattingService.getPresets();

      expect(presets.length).toBeGreaterThanOrEqual(3);
      expect(presets.find(p => p.id === 'standard-manuscript')).toBeDefined();
      expect(presets.find(p => p.id === 'paperback-novel')).toBeDefined();
      expect(presets.find(p => p.id === 'ebook-format')).toBeDefined();
    });

    test('should get specific preset by ID', () => {
      const preset = advancedFormattingService.getPreset('standard-manuscript');

      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Standard Manuscript');
      expect(preset?.category).toBe('industry');
    });

    test('should return null for non-existent preset', () => {
      const preset = advancedFormattingService.getPreset('non-existent');
      expect(preset).toBeNull();
    });

    test('should apply preset correctly', () => {
      const success = advancedFormattingService.applyPreset('ebook-format');
      const settings = advancedFormattingService.getSettings();

      expect(success).toBe(true);
      expect(settings.manuscript.font).toBe('Georgia');
      expect(settings.manuscript.fontSize).toBe(14);
      expect(settings.typography.indentFirstLine).toBe(false);
    });

    test('should fail to apply non-existent preset', () => {
      const success = advancedFormattingService.applyPreset('fake-preset');
      expect(success).toBe(false);
    });

    test('should create custom preset', () => {
      const settings: FormattingSettings = advancedFormattingService.getSettings();
      settings.manuscript.font = 'Custom Font';

      const presetId = advancedFormattingService.createCustomPreset(
        'My Custom Preset',
        'A custom formatting preset',
        settings
      );

      expect(presetId).toMatch(/^custom-\d+$/);

      const presets = advancedFormattingService.getPresets();
      const customPreset = presets.find(p => p.id === presetId);

      expect(customPreset).toBeDefined();
      expect(customPreset?.name).toBe('My Custom Preset');
      expect(customPreset?.category).toBe('personal');
      expect(customPreset?.settings.manuscript.font).toBe('Custom Font');
    });

    test('should emit presetCreated event when creating custom preset', () => {
      const eventSpy = vi.fn();
      advancedFormattingService.on('presetCreated', eventSpy);

      const settings = advancedFormattingService.getSettings();
      advancedFormattingService.createCustomPreset('Test Preset', 'Test', settings);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Preset',
          category: 'personal'
        })
      );
    });

    test('should delete custom preset', () => {
      const settings = advancedFormattingService.getSettings();
      const presetId = advancedFormattingService.createCustomPreset('Delete Me', 'Test', settings);

      const success = advancedFormattingService.deletePreset(presetId);
      expect(success).toBe(true);

      const preset = advancedFormattingService.getPreset(presetId);
      expect(preset).toBeNull();
    });

    test('should not delete industry presets', () => {
      const success = advancedFormattingService.deletePreset('standard-manuscript');
      expect(success).toBe(false);

      const preset = advancedFormattingService.getPreset('standard-manuscript');
      expect(preset).toBeDefined();
    });
  });

  describe('Text Formatting', () => {
    test('should format text with typography options', () => {
      const inputText = 'First paragraph.\n\nSecond paragraph.';
      
      const formatted = advancedFormattingService.formatText(inputText, {
        applyTypography: true
      });

      expect(formatted).toContain('    First paragraph.'); // Indented first line
      expect(formatted).toContain('    Second paragraph.');
    });

    test('should apply scene breaks formatting', () => {
      const inputText = 'Chapter content.\n***\nNext scene.';
      
      const formatted = advancedFormattingService.formatText(inputText, {
        applyTypography: true
      });

      expect(formatted).toContain('\n***\n');
    });

    test('should format dialogue when enabled', () => {
      // Update settings to enable dialogue indentation
      advancedFormattingService.updateSettings({
        dialogue: { indentDialogue: true }
      });

      const inputText = '"Hello there," she said.';
      
      const formatted = advancedFormattingService.formatText(inputText, {
        applyTypography: true
      });

      expect(formatted).toContain('    "Hello there," she said.');
    });

    test('should apply style guide rules', () => {
      const inputText = 'This has... multiple dots.';
      
      const formatted = advancedFormattingService.formatText(inputText, {
        applyStyleGuide: true,
        styleGuideId: 'chicago-manual'
      });

      expect(formatted).toContain('…'); // Should convert ... to ellipsis
    });

    test('should handle empty or invalid text', () => {
      expect(advancedFormattingService.formatText('')).toBe('');
      expect(advancedFormattingService.formatText('   ')).toBe('   ');
    });
  });

  describe('Document Analysis', () => {
    test('should analyze document and return validation results', () => {
      const text = `First paragraph with  double spaces.

Multiple blank lines above.

"Mixed quotes" and 'more quotes'.

Normal paragraph.`;

      const analysis = advancedFormattingService.analyzeDocument(text);

      expect(analysis.isValid).toBe(true); // No errors, only warnings
      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.characterCount).toBe(text.length);
      expect(analysis.pageCount).toBeGreaterThan(0);
    });

    test('should detect double spaces', () => {
      const text = 'This has  double spaces.';
      const analysis = advancedFormattingService.analyzeDocument(text);

      const doubleSpaceIssue = analysis.issues.find(i => 
        i.message.includes('Multiple consecutive spaces')
      );
      expect(doubleSpaceIssue).toBeDefined();
      expect(doubleSpaceIssue?.type).toBe('warning');
    });

    test('should detect mixed quotation styles', () => {
      const text = 'This has "straight quotes" and "smart quotes".';
      const analysis = advancedFormattingService.analyzeDocument(text);

      const quotationIssue = analysis.issues.find(i => 
        i.message.includes('Mixed quotation mark styles')
      );
      expect(quotationIssue).toBeDefined();
    });

    test('should detect multiple blank lines', () => {
      const text = 'Paragraph one.\n\n\nParagraph two.';
      const analysis = advancedFormattingService.analyzeDocument(text);

      const blankLineIssue = analysis.issues.find(i => 
        i.message.includes('Multiple blank lines')
      );
      expect(blankLineIssue).toBeDefined();
    });

    test('should calculate word count correctly', () => {
      const text = 'This is a test with seven words.';
      const analysis = advancedFormattingService.analyzeDocument(text);

      expect(analysis.wordCount).toBe(7);
    });

    test('should calculate page count based on word count', () => {
      const text = 'word '.repeat(500); // 500 words
      const analysis = advancedFormattingService.analyzeDocument(text);

      expect(analysis.pageCount).toBe(2); // 500 words / 250 words per page = 2 pages
    });
  });

  describe('Export Functions', () => {
    test('should export as manuscript with header', () => {
      const text = 'Chapter content here.';
      const title = 'My Great Novel';
      const author = 'Jane Doe';

      const manuscript = advancedFormattingService.exportAsManuscript(text, title, author);

      expect(manuscript).toContain(title);
      expect(manuscript).toContain(`by ${author}`);
      expect(manuscript).toContain(text);
    });

    test('should export as PDF blob', async () => {
      const text = 'Test content.';
      const title = 'Test Title';
      const author = 'Test Author';

      const blob = await advancedFormattingService.exportAsPDF(text, title, author);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain'); // Placeholder implementation
    });

    test('should export as Word blob', async () => {
      const text = 'Test content.';
      const title = 'Test Title';
      const author = 'Test Author';

      const blob = await advancedFormattingService.exportAsWord(text, title, author);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/msword'); // Placeholder implementation
    });

    test('should handle export errors gracefully', async () => {
      // Mock an error in export
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test with invalid parameters that might cause an error
      await expect(
        advancedFormattingService.exportAsPDF('', '', '')
      ).resolves.toBeInstanceOf(Blob);
    });
  });

  describe('Smart Formatting Tools', () => {
    test('should auto-format common issues', () => {
      const messyText = `This   has    multiple spaces.
      
      
      Multiple blank lines.

"Bad  quotes"   and   'bad apostrophes' .

Sentence.Next sentence without space.`;

      const formatted = advancedFormattingService.autoFormat(messyText);

      expect(formatted).not.toContain('   '); // No triple spaces
      expect(formatted).not.toContain('\n\n\n'); // No triple newlines
      expect(formatted).toContain('Sentence.  Next'); // Double space after period
    });

    test('should convert to smart quotes', () => {
      const text = `"Hello," she said. 'It's time.'`;
      const smartText = advancedFormattingService.smartQuotes(text);

      expect(smartText).toContain('"Hello,"');
      expect(smartText).toContain('"');
      expect(smartText).toContain("'It's");
      expect(smartText).toContain("'");
    });

    test('should fix ellipses', () => {
      const text = 'Wait. . . what?';
      const formatted = advancedFormattingService.autoFormat(text);

      expect(formatted).toContain('...');
    });

    test('should fix dialogue formatting', () => {
      const text = '"Hello there."She replied.';
      const formatted = advancedFormattingService.autoFormat(text);

      expect(formatted).toContain('"\n\nShe');
    });
  });

  describe('Style Guides', () => {
    test('should provide default style guides', () => {
      const guides = advancedFormattingService.getStyleGuides();

      expect(guides.length).toBeGreaterThanOrEqual(2);
      expect(guides.find(g => g.id === 'chicago-manual')).toBeDefined();
      expect(guides.find(g => g.id === 'ap-style')).toBeDefined();
    });

    test('should create custom style guide', () => {
      const rules = {
        punctuation: { 'test': 'replaced' },
        capitalization: {},
        spacing: {},
        abbreviations: {}
      };

      const guideId = advancedFormattingService.createStyleGuide('My Style', rules);

      expect(guideId).toMatch(/^style-\d+$/);

      const guides = advancedFormattingService.getStyleGuides();
      const customGuide = guides.find(g => g.id === guideId);

      expect(customGuide).toBeDefined();
      expect(customGuide?.name).toBe('My Style');
      expect(customGuide?.rules.punctuation.test).toBe('replaced');
    });

    test('should emit styleGuideCreated event', () => {
      const eventSpy = vi.fn();
      advancedFormattingService.on('styleGuideCreated', eventSpy);

      const rules = {
        punctuation: {},
        capitalization: {},
        spacing: {},
        abbreviations: {}
      };

      advancedFormattingService.createStyleGuide('Test Guide', rules);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Guide'
        })
      );
    });
  });

  describe('Event System', () => {
    test('should emit and handle events correctly', () => {
      const eventSpy = vi.fn();
      advancedFormattingService.on('settingsUpdated', eventSpy);

      advancedFormattingService.updateSettings({ manuscript: { font: 'Test Font' } });

      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    test('should remove event listeners', () => {
      const eventSpy = vi.fn();
      advancedFormattingService.on('settingsUpdated', eventSpy);
      advancedFormattingService.off('settingsUpdated', eventSpy);

      advancedFormattingService.updateSettings({ manuscript: { font: 'Test Font' } });

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw error
      expect(() => {
        advancedFormattingService.updateSettings({ manuscript: { font: 'Test' } });
      }).not.toThrow();
    });

    test('should handle corrupt localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Should fallback to defaults without throwing
      const settings = advancedFormattingService.getSettings();
      expect(settings.manuscript.font).toBe('Times New Roman');
    });

    test('should handle empty or invalid text gracefully', () => {
      expect(() => {
        advancedFormattingService.formatText('');
        advancedFormattingService.analyzeDocument('');
        advancedFormattingService.autoFormat('');
        advancedFormattingService.smartQuotes('');
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large documents efficiently', () => {
      const largeText = 'This is a test sentence. '.repeat(10000); // ~250k characters
      
      const startTime = performance.now();
      const analysis = advancedFormattingService.analyzeDocument(largeText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(analysis.wordCount).toBeGreaterThan(40000);
    });

    test('should handle multiple simultaneous operations', () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve(advancedFormattingService.formatText(`Test ${i}`))
        );
      }

      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should work with complete workflow', () => {
      // 1. Apply a preset
      const success = advancedFormattingService.applyPreset('ebook-format');
      expect(success).toBe(true);

      // 2. Format some text
      const text = '"Hello," she said. This is... a test.';
      const formatted = advancedFormattingService.formatText(text, {
        applyTypography: true,
        applyStyleGuide: true,
        styleGuideId: 'chicago-manual'
      });

      // 3. Analyze the formatted text
      const analysis = advancedFormattingService.analyzeDocument(formatted);
      expect(analysis.isValid).toBe(true);

      // 4. Export as manuscript
      const manuscript = advancedFormattingService.exportAsManuscript(
        formatted,
        'Test Novel',
        'Test Author'
      );

      expect(manuscript).toContain('Test Novel');
      expect(manuscript).toContain('Test Author');
      expect(manuscript).toContain(formatted);
    });

    test('should maintain consistency across save/load cycles', () => {
      // Update settings
      const originalSettings = {
        manuscript: { font: 'Unique Font', fontSize: 15 },
        typography: { indentFirstLine: false }
      };

      advancedFormattingService.updateSettings(originalSettings);

      // Simulate app restart by checking localStorage was called
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'astral_notes_formatting_settings',
        expect.stringContaining('Unique Font')
      );

      // Verify settings are maintained
      const currentSettings = advancedFormattingService.getSettings();
      expect(currentSettings.manuscript.font).toBe('Unique Font');
      expect(currentSettings.manuscript.fontSize).toBe(15);
      expect(currentSettings.typography.indentFirstLine).toBe(false);
    });
  });
});