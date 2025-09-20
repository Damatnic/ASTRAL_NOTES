interface VoiceWritingConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  grammars?: SpeechGrammarList;
}

interface VoiceCommand {
  trigger: string[];
  action: (params?: string[]) => void;
  description: string;
  category: 'navigation' | 'formatting' | 'editing' | 'document';
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
}

class VoiceWritingService {
  private recognition: any = null;
  private isInitialized = false;
  private isListening = false;
  private onTranscriptionCallback?: (result: TranscriptionResult) => void;
  private onCommandCallback?: (command: string, params: string[]) => void;
  private onErrorCallback?: (error: string) => void;
  private config: VoiceWritingConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3
  };

  private commands: VoiceCommand[] = [
    {
      trigger: ['new paragraph', 'new line', 'paragraph break'],
      action: () => this.insertText('\n\n'),
      description: 'Insert a new paragraph',
      category: 'formatting'
    },
    {
      trigger: ['bold', 'make bold', 'format bold'],
      action: (params) => this.formatText('bold', params?.[0]),
      description: 'Make text bold',
      category: 'formatting'
    },
    {
      trigger: ['italic', 'make italic', 'format italic'],
      action: (params) => this.formatText('italic', params?.[0]),
      description: 'Make text italic',
      category: 'formatting'
    },
    {
      trigger: ['heading', 'make heading', 'title'],
      action: (params) => this.formatText('heading', params?.[0]),
      description: 'Make text a heading',
      category: 'formatting'
    },
    {
      trigger: ['bullet point', 'bullet', 'list item'],
      action: () => this.insertText('• '),
      description: 'Insert bullet point',
      category: 'formatting'
    },
    {
      trigger: ['numbered list', 'number', 'ordered list'],
      action: () => this.insertText('1. '),
      description: 'Start numbered list',
      category: 'formatting'
    },
    {
      trigger: ['delete', 'delete that', 'remove that'],
      action: () => this.deleteText(),
      description: 'Delete selected text or last word',
      category: 'editing'
    },
    {
      trigger: ['undo', 'undo that'],
      action: () => this.undoAction(),
      description: 'Undo last action',
      category: 'editing'
    },
    {
      trigger: ['redo', 'redo that'],
      action: () => this.redoAction(),
      description: 'Redo last undone action',
      category: 'editing'
    },
    {
      trigger: ['save', 'save document'],
      action: () => this.saveDocument(),
      description: 'Save the current document',
      category: 'document'
    },
    {
      trigger: ['go to beginning', 'start of document'],
      action: () => this.navigateToPosition('start'),
      description: 'Go to document beginning',
      category: 'navigation'
    },
    {
      trigger: ['go to end', 'end of document'],
      action: () => this.navigateToPosition('end'),
      description: 'Go to document end',
      category: 'navigation'
    },
    {
      trigger: ['select all', 'select everything'],
      action: () => this.selectText('all'),
      description: 'Select all text',
      category: 'editing'
    },
    {
      trigger: ['stop listening', 'stop recording', 'voice off'],
      action: () => this.stopListening(),
      description: 'Stop voice recognition',
      category: 'document'
    }
  ];

  async initialize(config?: Partial<VoiceWritingConfig>): Promise<boolean> {
    if (this.isInitialized) return true;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return false;
    }

    this.config = { ...this.config, ...config };

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    if (this.config.grammars) {
      this.recognition.grammars = this.config.grammars;
    }

    this.setupEventListeners();
    this.isInitialized = true;
    return true;
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Voice recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Voice recognition ended');
    };

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        const confidence = result[0].confidence || 0;

        // Check if this is a voice command
        const command = this.parseCommand(transcript);
        if (command) {
          this.onCommandCallback?.(command.trigger[0], []);
          command.action();
          return;
        }

        // Regular transcription
        const alternatives = [];
        for (let j = 0; j < Math.min(result.length, this.config.maxAlternatives); j++) {
          alternatives.push(result[j].transcript);
        }

        const transcriptionResult: TranscriptionResult = {
          text: transcript,
          confidence,
          isFinal: result.isFinal,
          alternatives
        };

        this.onTranscriptionCallback?.(transcriptionResult);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.onErrorCallback?.(event.error);
    };

    this.recognition.onnomatch = () => {
      console.log('No speech was recognized');
    };
  }

  private parseCommand(text: string): VoiceCommand | null {
    const lowerText = text.toLowerCase();
    
    for (const command of this.commands) {
      for (const trigger of command.trigger) {
        if (lowerText.includes(trigger.toLowerCase())) {
          return command;
        }
      }
    }

    return null;
  }

  startListening(): boolean {
    if (!this.isInitialized || !this.recognition) {
      console.error('Voice service not initialized');
      return false;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.onErrorCallback?.('Failed to start voice recognition');
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  addCustomCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  removeCustomCommand(trigger: string): void {
    this.commands = this.commands.filter(cmd => 
      !cmd.trigger.some(t => t.toLowerCase() === trigger.toLowerCase())
    );
  }

  getAvailableCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  onTranscription(callback: (result: TranscriptionResult) => void): void {
    this.onTranscriptionCallback = callback;
  }

  onCommand(callback: (command: string, params: string[]) => void): void {
    this.onCommandCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // Text manipulation methods (these would interact with the active editor)
  private insertText(text: string): void {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const value = activeElement.value;
      
      activeElement.value = value.slice(0, start) + text + value.slice(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
      
      // Trigger input event
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private formatText(format: 'bold' | 'italic' | 'heading', text?: string): void {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;
    const selectedText = text || activeElement.value.slice(start, end);

    if (!selectedText) return;

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'heading':
        formattedText = `# ${selectedText}`;
        break;
    }

    const value = activeElement.value;
    activeElement.value = value.slice(0, start) + formattedText + value.slice(end);
    activeElement.selectionStart = start;
    activeElement.selectionEnd = start + formattedText.length;
    
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private deleteText(): void {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;

    if (start !== end) {
      // Delete selected text
      const value = activeElement.value;
      activeElement.value = value.slice(0, start) + value.slice(end);
      activeElement.selectionStart = activeElement.selectionEnd = start;
    } else {
      // Delete last word
      const value = activeElement.value;
      const beforeCursor = value.slice(0, start);
      const words = beforeCursor.split(/\s+/);
      
      if (words.length > 1) {
        words.pop();
        const newText = words.join(' ') + (words.length > 0 ? ' ' : '');
        activeElement.value = newText + value.slice(start);
        activeElement.selectionStart = activeElement.selectionEnd = newText.length;
      }
    }
    
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private undoAction(): void {
    document.execCommand('undo');
  }

  private redoAction(): void {
    document.execCommand('redo');
  }

  private saveDocument(): void {
    // Trigger save through keyboard shortcut
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  private navigateToPosition(position: 'start' | 'end'): void {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    if (position === 'start') {
      activeElement.selectionStart = activeElement.selectionEnd = 0;
    } else {
      const length = activeElement.value.length;
      activeElement.selectionStart = activeElement.selectionEnd = length;
    }
  }

  private selectText(selection: 'all' | 'word' | 'sentence'): void {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    if (selection === 'all') {
      activeElement.select();
    }
  }

  // Enhanced features
  async loadLanguageModel(language: string): Promise<boolean> {
    // This would load language-specific models for better recognition
    try {
      this.setLanguage(language);
      return true;
    } catch (error) {
      console.error('Failed to load language model:', error);
      return false;
    }
  }

  async trainCustomVocabulary(words: string[]): Promise<void> {
    // This would train the recognition system on custom vocabulary
    try {
      if ('webkitSpeechGrammarList' in window || 'SpeechGrammarList' in window) {
        const SpeechGrammarList = (window as any).webkitSpeechGrammarList || (window as any).SpeechGrammarList;
        const grammar = '#JSGF V1.0; grammar words; public <word> = ' + words.join(' | ') + ' ;';
        const speechRecognitionList = new SpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        this.config.grammars = speechRecognitionList;
        
        if (this.recognition) {
          this.recognition.grammars = speechRecognitionList;
        }
      }
    } catch (error) {
      console.error('Failed to train custom vocabulary:', error);
    }
  }

  getRecognitionCapabilities(): {
    isSupported: boolean;
    supportsContinuous: boolean;
    supportsInterimResults: boolean;
    supportedLanguages: string[];
  } {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    return {
      isSupported,
      supportsContinuous: isSupported,
      supportsInterimResults: isSupported,
      supportedLanguages: [
        'en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
        'pt-BR', 'zh-CN', 'ja-JP', 'ko-KR', 'ru-RU', 'ar-SA', 'hi-IN'
      ]
    };
  }

  destroy(): void {
    this.stopListening();
    this.recognition = null;
    this.isInitialized = false;
    this.onTranscriptionCallback = undefined;
    this.onCommandCallback = undefined;
    this.onErrorCallback = undefined;
  }
}

export const voiceWritingService = new VoiceWritingService();