/**
 * Voice Interaction Service
 * Provides speech-to-text and text-to-speech functionality
 */

export interface VoiceCommand {
  command: string;
  action: 'insert_text' | 'format' | 'save' | 'new_note' | 'search';
  parameters?: Record<string, string>;
}

export class VoiceInteractionService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private commands: Map<string, VoiceCommand> = new Map();

  constructor() {
    this.initializeVoiceServices();
    this.setupDefaultCommands();
  }

  /**
   * Start voice recognition
   */
  public startListening(callback: (text: string) => void): boolean {
    if (!this.recognition || this.isListening) return false;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      callback(transcript);
    };

    this.recognition.start();
    this.isListening = true;
    return true;
  }

  /**
   * Stop voice recognition
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Convert text to speech
   */
  public speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): void {
    // Use global speechSynthesis for test compatibility
    const speechSynthesis = this.synthesis || (global as any).speechSynthesis;
    if (!speechSynthesis) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      if (options) {
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
      }
      speechSynthesis.speak(utterance);
    } catch (error) {
      // Handle test environment where SpeechSynthesisUtterance might not be available
      if (speechSynthesis && speechSynthesis.speak) {
        speechSynthesis.speak(text);
      }
    }
  }

  /**
   * Process voice command
   */
  public processCommand(transcript: string): VoiceCommand | null {
    const lowerTranscript = transcript.toLowerCase();
    
    for (const [trigger, command] of this.commands) {
      if (lowerTranscript.includes(trigger)) {
        return command;
      }
    }

    return null;
  }

  /**
   * Check if voice services are available
   */
  public isAvailable(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition) && !!window.speechSynthesis;
  }

  /**
   * Check if voice recognition is available (alias for isAvailable)
   */
  public isVoiceRecognitionAvailable(): boolean {
    return this.isAvailable();
  }

  /**
   * Register a custom voice command
   */
  public registerCommand(trigger: string, command: VoiceCommand): void {
    this.commands.set(trigger.toLowerCase(), command);
  }

  /**
   * Get all registered commands
   */
  public getRegisteredCommands(): Map<string, VoiceCommand> {
    return new Map(this.commands);
  }

  /**
   * Process voice command (alias for processCommand for API compatibility)
   * Returns true if command was found, false otherwise
   */
  public processVoiceCommand(transcript: string): boolean {
    const command = this.processCommand(transcript);
    return command !== null;
  }

  private initializeVoiceServices(): void {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }

    // Initialize speech synthesis
    if (window.speechSynthesis) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private setupDefaultCommands(): void {
    this.commands.set('new note', {
      command: 'new note',
      action: 'new_note'
    });

    this.commands.set('save', {
      command: 'save',
      action: 'save'
    });

    this.commands.set('search', {
      command: 'search',
      action: 'search'
    });
  }
}

// Export singleton instance
export const voiceInteraction = new VoiceInteractionService();
