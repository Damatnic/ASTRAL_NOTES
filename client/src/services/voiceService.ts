/**
 * Voice Service - Advanced Voice-to-Text Integration
 * Provides hands-free writing capabilities with intelligent text processing
 * Addresses user demand for mobile and accessibility-friendly writing
 */

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
  timestamp: Date;
}

export interface VoiceCommand {
  command: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
}

export interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  autoCapitalization: boolean;
  autoPunctuation: boolean;
  customCommands: boolean;
  noiseReduction: boolean;
  adaptToUser: boolean;
}

export interface VoiceDictationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalWords: number;
  accuracy: number;
  corrections: number;
  commands: number;
  text: string;
}

type VoiceEventCallback = (event: any) => void;

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isRecording = false;
  private isPaused = false;
  private settings: VoiceSettings;
  private eventListeners: Map<string, VoiceEventCallback[]> = new Map();
  private currentSession: VoiceDictationSession | null = null;
  private commandPatterns: Map<string, RegExp> = new Map();
  private userVocabulary: Set<string> = new Set();
  private offlineQueue: Array<{ audioBlob: Blob; timestamp: Date }> = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.settings = this.getDefaultSettings();
    this.initializeCommandPatterns();
    this.loadUserVocabulary();
  }

  /**
   * Initialize voice recognition with enhanced features
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw new Error('Speech recognition not supported in this browser');
      }

      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.setupRecognitionSettings();
      this.setupEventHandlers();

      return true;
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      return false;
    }
  }

  /**
   * Start voice recognition with intelligent processing
   */
  async startRecording(settings?: Partial<VoiceSettings>): Promise<void> {
    if (!this.recognition) {
      throw new Error('Voice recognition not initialized');
    }

    if (this.isRecording) {
      return;
    }

    // Update settings if provided
    if (settings) {
      this.settings = { ...this.settings, ...settings };
      this.setupRecognitionSettings();
    }

    // Start new session
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: new Date(),
      totalWords: 0,
      accuracy: 0,
      corrections: 0,
      commands: 0,
      text: ''
    };

    this.isRecording = true;
    this.isPaused = false;

    try {
      this.recognition.start();
      this.emit('recording-started', { sessionId: this.currentSession.id });
    } catch (error) {
      this.isRecording = false;
      this.emit('error', { error: 'Failed to start recording', details: error });
      throw error;
    }
  }

  /**
   * Stop voice recognition and return final results
   */
  async stopRecording(): Promise<VoiceDictationSession | null> {
    if (!this.recognition || !this.isRecording) {
      return null;
    }

    this.recognition.stop();
    this.isRecording = false;

    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.accuracy = this.calculateSessionAccuracy();
      
      // Save session for analytics
      await this.saveSession(this.currentSession);
      
      this.emit('recording-stopped', { session: this.currentSession });
      
      const session = this.currentSession;
      this.currentSession = null;
      return session;
    }

    return null;
  }

  /**
   * Pause voice recognition temporarily
   */
  pauseRecording(): void {
    if (this.isRecording && !this.isPaused) {
      this.recognition?.stop();
      this.isPaused = true;
      this.emit('recording-paused', {});
    }
  }

  /**
   * Resume paused voice recognition
   */
  resumeRecording(): void {
    if (this.isRecording && this.isPaused) {
      this.recognition?.start();
      this.isPaused = false;
      this.emit('recording-resumed', {});
    }
  }

  /**
   * Process voice commands for app navigation and editing
   */
  processVoiceCommand(transcript: string): VoiceCommand | null {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    for (const [command, pattern] of this.commandPatterns) {
      const match = normalizedTranscript.match(pattern);
      if (match) {
        const voiceCommand: VoiceCommand = {
          command,
          action: this.getCommandAction(command),
          parameters: this.extractCommandParameters(command, match),
          confidence: 0.9
        };

        if (this.currentSession) {
          this.currentSession.commands++;
        }

        this.emit('voice-command', { command: voiceCommand });
        return voiceCommand;
      }
    }

    return null;
  }

  /**
   * Convert text to speech for proofreading and accessibility
   */
  async speakText(text: string, options?: SpeechSynthesisUtteranceOptions): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply options
      if (options) {
        Object.assign(utterance, options);
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Get available voices for text-to-speech
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Smart text processing with auto-punctuation and capitalization
   */
  processTranscript(transcript: string, confidence: number): string {
    let processed = transcript;

    if (this.settings.autoCapitalization) {
      processed = this.applyCapitalization(processed);
    }

    if (this.settings.autoPunctuation) {
      processed = this.applyPunctuation(processed);
    }

    // Learn new words for future recognition
    if (confidence > 0.8) {
      this.learnUserVocabulary(processed);
    }

    return processed;
  }

  /**
   * Handle offline voice recording with queue management
   */
  async startOfflineRecording(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Offline recording not supported');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        this.offlineQueue.push({ audioBlob, timestamp: new Date() });
        
        // Try to process immediately if online
        if (navigator.onLine) {
          this.processOfflineQueue();
        }
      };

      mediaRecorder.start();
      
      // Stop recording after 30 seconds or when manually stopped
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to start offline recording:', error);
      throw error;
    }
  }

  /**
   * Process queued offline recordings when back online
   */
  async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        await this.processOfflineRecording(item.audioBlob);
      } catch (error) {
        console.error('Failed to process offline recording:', error);
        // Re-queue failed items
        this.offlineQueue.push(item);
      }
    }
  }

  /**
   * Check if voice recognition is supported
   */
  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Get current recording state
   */
  getRecordingState(): {
    isRecording: boolean;
    isPaused: boolean;
    session: VoiceDictationSession | null;
  } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      session: this.currentSession
    };
  }

  /**
   * Update voice recognition settings
   */
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.recognition) {
      this.setupRecognitionSettings();
    }

    // Save settings to localStorage
    localStorage.setItem('astral_voice_settings', JSON.stringify(this.settings));
  }

  /**
   * Add event listener for voice events
   */
  on(event: string, callback: VoiceEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: VoiceEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private methods

  private getDefaultSettings(): VoiceSettings {
    const saved = localStorage.getItem('astral_voice_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved voice settings');
      }
    }

    return {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      autoCapitalization: true,
      autoPunctuation: true,
      customCommands: true,
      noiseReduction: true,
      adaptToUser: true
    };
  }

  private setupRecognitionSettings(): void {
    if (!this.recognition) return;

    this.recognition.lang = this.settings.language;
    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.maxAlternatives = this.settings.maxAlternatives;
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.emit('recognition-started', {});
    };

    this.recognition.onresult = (event) => {
      const results: VoiceRecognitionResult[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = [];

        for (let j = 0; j < result.length; j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence
          });
        }

        const recognitionResult: VoiceRecognitionResult = {
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          alternatives,
          timestamp: new Date()
        };

        results.push(recognitionResult);

        // Process the result
        if (result.isFinal) {
          const processedText = this.processTranscript(
            result[0].transcript,
            result[0].confidence
          );

          // Check for voice commands
          const command = this.processVoiceCommand(result[0].transcript);
          
          if (!command) {
            // Regular transcription
            if (this.currentSession) {
              this.currentSession.text += processedText + ' ';
              this.currentSession.totalWords += processedText.split(' ').length;
            }

            this.emit('transcription', {
              text: processedText,
              confidence: result[0].confidence,
              sessionId: this.currentSession?.id
            });
          }
        } else {
          // Interim result
          this.emit('interim-result', {
            text: result[0].transcript,
            confidence: result[0].confidence
          });
        }
      }

      this.emit('recognition-result', { results });
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.emit('error', { error: event.error, message: event.message });
      
      // Auto-restart on certain errors
      if (event.error === 'network' || event.error === 'no-speech') {
        setTimeout(() => {
          if (this.isRecording && !this.isPaused) {
            this.recognition?.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      this.emit('recognition-ended', {});
      
      // Auto-restart if still recording
      if (this.isRecording && !this.isPaused) {
        setTimeout(() => {
          this.recognition?.start();
        }, 100);
      }
    };
  }

  private initializeCommandPatterns(): void {
    // Navigation commands
    this.commandPatterns.set('new-project', /(?:new|create)\s+project/i);
    this.commandPatterns.set('open-project', /(?:open|switch to)\s+project\s+(.+)/i);
    this.commandPatterns.set('save-project', /save\s+(?:project|document|work)/i);
    
    // Writing commands
    this.commandPatterns.set('new-paragraph', /(?:new|start)\s+paragraph/i);
    this.commandPatterns.set('new-chapter', /(?:new|start)\s+chapter/i);
    this.commandPatterns.set('new-scene', /(?:new|start)\s+scene/i);
    
    // Editing commands
    this.commandPatterns.set('undo', /undo\s+(?:that|last)?/i);
    this.commandPatterns.set('redo', /redo\s+(?:that|last)?/i);
    this.commandPatterns.set('delete-sentence', /delete\s+(?:sentence|last sentence)/i);
    this.commandPatterns.set('delete-paragraph', /delete\s+(?:paragraph|last paragraph)/i);
    
    // Punctuation commands
    this.commandPatterns.set('period', /(?:period|full stop|end sentence)/i);
    this.commandPatterns.set('comma', /comma/i);
    this.commandPatterns.set('question-mark', /question mark/i);
    this.commandPatterns.set('exclamation', /(?:exclamation mark|exclamation point)/i);
    
    // Formatting commands
    this.commandPatterns.set('bold', /(?:make|format)\s+(?:that\s+)?bold/i);
    this.commandPatterns.set('italic', /(?:make|format)\s+(?:that\s+)?italic/i);
    this.commandPatterns.set('underline', /(?:make|format)\s+(?:that\s+)?underline/i);
    
    // App control
    this.commandPatterns.set('stop-recording', /(?:stop|end)\s+(?:recording|dictation)/i);
    this.commandPatterns.set('pause-recording', /pause\s+(?:recording|dictation)/i);
    this.commandPatterns.set('resume-recording', /(?:resume|continue)\s+(?:recording|dictation)/i);
  }

  private getCommandAction(command: string): string {
    const actions: Record<string, string> = {
      'new-project': 'CREATE_PROJECT',
      'open-project': 'SWITCH_PROJECT',
      'save-project': 'SAVE_PROJECT',
      'new-paragraph': 'INSERT_PARAGRAPH',
      'new-chapter': 'INSERT_CHAPTER',
      'new-scene': 'INSERT_SCENE',
      'undo': 'UNDO',
      'redo': 'REDO',
      'delete-sentence': 'DELETE_SENTENCE',
      'delete-paragraph': 'DELETE_PARAGRAPH',
      'period': 'INSERT_PUNCTUATION',
      'comma': 'INSERT_PUNCTUATION',
      'question-mark': 'INSERT_PUNCTUATION',
      'exclamation': 'INSERT_PUNCTUATION',
      'bold': 'FORMAT_BOLD',
      'italic': 'FORMAT_ITALIC',
      'underline': 'FORMAT_UNDERLINE',
      'stop-recording': 'STOP_RECORDING',
      'pause-recording': 'PAUSE_RECORDING',
      'resume-recording': 'RESUME_RECORDING'
    };

    return actions[command] || 'UNKNOWN';
  }

  private extractCommandParameters(command: string, match: RegExpMatchArray): Record<string, any> {
    const params: Record<string, any> = {};

    switch (command) {
      case 'open-project':
        params.projectName = match[1]?.trim();
        break;
      case 'period':
        params.punctuation = '.';
        break;
      case 'comma':
        params.punctuation = ',';
        break;
      case 'question-mark':
        params.punctuation = '?';
        break;
      case 'exclamation':
        params.punctuation = '!';
        break;
    }

    return params;
  }

  private applyCapitalization(text: string): string {
    // Capitalize first letter of sentences
    return text.replace(/(^|\. )(\w)/g, (match, prefix, letter) => {
      return prefix + letter.toUpperCase();
    });
  }

  private applyPunctuation(text: string): string {
    let processed = text;

    // Add periods at the end of sentences (basic heuristic)
    if (!processed.match(/[.!?]$/)) {
      processed += '.';
    }

    // Add commas before common conjunctions
    processed = processed.replace(/\s+(and|but|or|yet|so)\s+/g, ', $1 ');

    return processed;
  }

  private learnUserVocabulary(text: string): void {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => this.userVocabulary.add(word));

    // Limit vocabulary size
    if (this.userVocabulary.size > 10000) {
      const wordsArray = Array.from(this.userVocabulary);
      this.userVocabulary = new Set(wordsArray.slice(-5000));
    }

    // Save to localStorage
    localStorage.setItem('astral_user_vocabulary', 
      JSON.stringify(Array.from(this.userVocabulary))
    );
  }

  private loadUserVocabulary(): void {
    const saved = localStorage.getItem('astral_user_vocabulary');
    if (saved) {
      try {
        const words = JSON.parse(saved);
        this.userVocabulary = new Set(words);
      } catch (error) {
        console.warn('Failed to load user vocabulary');
      }
    }
  }

  private async processOfflineRecording(audioBlob: Blob): Promise<void> {
    // Send to server for transcription when online
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('language', this.settings.language);

    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      this.emit('offline-transcription', {
        text: result.transcript,
        confidence: result.confidence
      });
    }
  }

  private calculateSessionAccuracy(): number {
    // Calculate accuracy based on corrections and confidence scores
    if (!this.currentSession) return 0;

    const totalWords = this.currentSession.totalWords;
    const corrections = this.currentSession.corrections;

    if (totalWords === 0) return 0;

    return Math.max(0, (totalWords - corrections) / totalWords);
  }

  private async saveSession(session: VoiceDictationSession): Promise<void> {
    try {
      // Save session data for analytics and improvement
      const sessions = JSON.parse(localStorage.getItem('astral_voice_sessions') || '[]');
      sessions.push(session);
      
      // Keep only last 50 sessions
      if (sessions.length > 50) {
        sessions.splice(0, sessions.length - 50);
      }
      
      localStorage.setItem('astral_voice_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save voice session:', error);
    }
  }

  private generateSessionId(): string {
    return 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in voice event listener for ${event}:`, error);
        }
      });
    }
  }
}

export const voiceService = new VoiceService();

// Auto-initialize when module loads
voiceService.initialize().catch(error => {
  console.warn('Voice service auto-initialization failed:', error);
});