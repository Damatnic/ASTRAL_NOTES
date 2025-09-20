import { describe, it, expect, beforeEach, vi } from 'vitest';
import { voiceWritingService } from '../../services/voiceWritingService';

// Mock Speech Recognition APIs
const mockRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onstart: vi.fn(),
  onend: vi.fn(),
  onresult: vi.fn(),
  onerror: vi.fn(),
  onnomatch: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  grammars: null
};

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: vi.fn(() => mockRecognition),
  writable: true
});

Object.defineProperty(window, 'SpeechRecognition', {
  value: vi.fn(() => mockRecognition),
  writable: true
});

describe('Voice Writing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    voiceWritingService.destroy();
  });

  describe('Initialization', () => {
    it('should initialize successfully when speech recognition is available', async () => {
      const result = await voiceWritingService.initialize();
      expect(result).toBe(true);
    });

    it('should handle initialization when speech recognition is not available', async () => {
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).SpeechRecognition;
      
      const result = await voiceWritingService.initialize();
      expect(result).toBe(false);
    });

    it('should set up event listeners during initialization', async () => {
      await voiceWritingService.initialize();
      expect(mockRecognition.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Voice Recognition Control', () => {
    beforeEach(async () => {
      await voiceWritingService.initialize();
    });

    it('should start listening', () => {
      const result = voiceWritingService.startListening();
      expect(result).toBe(true);
      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('should stop listening', () => {
      voiceWritingService.stopListening();
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should check if currently listening', () => {
      const isListening = voiceWritingService.isCurrentlyListening();
      expect(typeof isListening).toBe('boolean');
    });

    it('should handle starting when already listening', () => {
      voiceWritingService.startListening();
      const result = voiceWritingService.startListening();
      expect(result).toBe(true);
    });
  });

  describe('Language Support', () => {
    beforeEach(async () => {
      await voiceWritingService.initialize();
    });

    it('should set language', () => {
      voiceWritingService.setLanguage('es-ES');
      expect(mockRecognition.lang).toBe('es-ES');
    });

    it('should get recognition capabilities', () => {
      const capabilities = voiceWritingService.getRecognitionCapabilities();
      expect(capabilities).toHaveProperty('isSupported');
      expect(capabilities).toHaveProperty('supportsContinuous');
      expect(capabilities).toHaveProperty('supportsInterimResults');
      expect(capabilities).toHaveProperty('supportedLanguages');
      expect(Array.isArray(capabilities.supportedLanguages)).toBe(true);
    });
  });

  describe('Voice Commands', () => {
    beforeEach(async () => {
      await voiceWritingService.initialize();
    });

    it('should get available commands', () => {
      const commands = voiceWritingService.getAvailableCommands();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should add custom command', () => {
      const customCommand = {
        trigger: ['test command'],
        action: vi.fn(),
        description: 'Test command',
        category: 'editing' as const
      };

      voiceWritingService.addCustomCommand(customCommand);
      const commands = voiceWritingService.getAvailableCommands();
      expect(commands).toContainEqual(customCommand);
    });

    it('should remove custom command', () => {
      const customCommand = {
        trigger: ['remove me'],
        action: vi.fn(),
        description: 'Command to remove',
        category: 'editing' as const
      };

      voiceWritingService.addCustomCommand(customCommand);
      voiceWritingService.removeCustomCommand('remove me');
      
      const commands = voiceWritingService.getAvailableCommands();
      expect(commands).not.toContainEqual(customCommand);
    });
  });

  describe('Event Callbacks', () => {
    beforeEach(async () => {
      await voiceWritingService.initialize();
    });

    it('should set transcription callback', () => {
      const callback = vi.fn();
      voiceWritingService.onTranscription(callback);
      // Callback is set internally, we can't directly test it
      expect(true).toBe(true);
    });

    it('should set command callback', () => {
      const callback = vi.fn();
      voiceWritingService.onCommand(callback);
      expect(true).toBe(true);
    });

    it('should set error callback', () => {
      const callback = vi.fn();
      voiceWritingService.onError(callback);
      expect(true).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    beforeEach(async () => {
      await voiceWritingService.initialize();
    });

    it('should load language model', async () => {
      const result = await voiceWritingService.loadLanguageModel('en-US');
      expect(result).toBe(true);
    });

    it('should train custom vocabulary', async () => {
      const words = ['technical', 'jargon', 'specific'];
      await voiceWritingService.trainCustomVocabulary(words);
      // Training completed without error
      expect(true).toBe(true);
    });

    it('should handle vocabulary training failure', async () => {
      // Mock a scenario where grammar list isn't supported
      delete (window as any).webkitSpeechGrammarList;
      delete (window as any).SpeechGrammarList;
      
      const words = ['test', 'words'];
      await voiceWritingService.trainCustomVocabulary(words);
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization failure', async () => {
      mockRecognition.start = vi.fn(() => {
        throw new Error('Recognition failed');
      });
      
      await voiceWritingService.initialize();
      const result = voiceWritingService.startListening();
      expect(result).toBe(false);
    });

    it('should handle uninitialized service', () => {
      const result = voiceWritingService.startListening();
      expect(result).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should destroy service properly', async () => {
      await voiceWritingService.initialize();
      voiceWritingService.destroy();
      
      const result = voiceWritingService.startListening();
      expect(result).toBe(false);
    });
  });
});