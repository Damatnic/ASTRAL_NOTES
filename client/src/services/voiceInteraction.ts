/**
 * Voice Interaction Service
 * Enables hands-free writing and voice control for the writing environment
 * Supports speech-to-text, voice commands, and audio feedback
 */

import { EventEmitter } from 'events';

export interface VoiceCommand {
  id: string;
  phrase: string[];
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
  context?: 'writing' | 'navigation' | 'editing' | 'system' | 'global';
  description: string;
  enabled: boolean;
}

export interface VoiceSession {
  id: string;
  startTime: number;
  endTime?: number;
  mode: 'dictation' | 'commands' | 'mixed';
  language: string;
  totalWords: number;
  commandsExecuted: number;
  accuracy: number;
  corrections: VoiceCorrection[];
  status: 'active' | 'paused' | 'completed';
}

export interface VoiceCorrection {
  id: string;
  original: string;
  corrected: string;
  confidence: number;
  timestamp: number;
  method: 'auto' | 'manual' | 'suggestion';
}

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  sensitivity: number;
  noiseReduction: boolean;
  adaptiveListening: boolean;
  punctuationMode: 'auto' | 'manual' | 'disabled';
}

export interface VoiceFeedback {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  confirmCommands: boolean;
  readback: boolean;
  errorNotification: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  accent?: string;
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'professional';
  writingStyle: 'casual' | 'formal' | 'creative' | 'academic' | 'technical';
  customVocabulary: string[];
  adaptations: VoiceAdaptation[];
  trainingData: VoiceTrainingData;
  createdAt: number;
  lastUsed: number;
}

export interface VoiceAdaptation {
  word: string;
  pronunciation: string;
  frequency: number;
  accuracy: number;
  alternatives: string[];
}

export interface VoiceTrainingData {
  totalSessions: number;
  totalWords: number;
  averageAccuracy: number;
  commonMistakes: Record<string, number>;
  improvementAreas: string[];
  lastTrainingSession?: number;
}

export interface AudioFeedback {
  type: 'success' | 'error' | 'warning' | 'info' | 'confirmation';
  message?: string;
  sound?: string;
  duration?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface DictationResult {
  text: string;
  confidence: number;
  alternatives: string[];
  isFinal: boolean;
  timestamp: number;
  duration: number;
}

export interface VoiceMetrics {
  totalSessions: number;
  totalDictationTime: number; // milliseconds
  totalWordsSpoken: number;
  averageAccuracy: number;
  commandsExecuted: number;
  commandAccuracy: number;
  mostUsedCommands: Record<string, number>;
  improvementRate: number;
  preferredMode: 'dictation' | 'commands' | 'mixed';
}

class VoiceInteractionService extends EventEmitter {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private currentSession?: VoiceSession;
  private sessions: Map<string, VoiceSession> = new Map();
  private commands: Map<string, VoiceCommand> = new Map();
  private profiles: Map<string, VoiceProfile> = new Map();
  private currentProfile: string = 'default';
  private config: SpeechRecognitionConfig;
  private feedbackConfig: VoiceFeedback;
  private isInitialized = false;
  private isListening = false;
  private supportedLanguages: string[] = [];
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    super();
    
    // Default configuration
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      sensitivity: 0.8,
      noiseReduction: true,
      adaptiveListening: true,
      punctuationMode: 'auto'
    };

    this.feedbackConfig = {
      enabled: true,
      voice: 'default',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      confirmCommands: true,
      readback: false,
      errorNotification: true
    };

    this.initializeVoiceAPI();
    this.loadDataFromStorage();
    this.initializeDefaultData();
  }

  private async initializeVoiceAPI(): Promise<void> {
    try {
      // Check for speech recognition support
      if ('webkitSpeechRecognition' in window) {
        this.recognition = new webkitSpeechRecognition();
      } else if ('SpeechRecognition' in window) {
        this.recognition = new SpeechRecognition();
      }

      // Check for speech synthesis support
      if ('speechSynthesis' in window) {
        this.synthesis = speechSynthesis;
        
        // Load available voices
        const loadVoices = () => {
          this.availableVoices = this.synthesis!.getVoices();
          this.emit('voicesLoaded', this.availableVoices);
        };

        if (this.synthesis.getVoices().length > 0) {
          loadVoices();
        } else {
          this.synthesis.addEventListener('voiceschanged', loadVoices);
        }
      }

      // Configure speech recognition
      if (this.recognition) {
        this.setupSpeechRecognition();
        this.isInitialized = true;
        this.emit('initialized', {
          speechRecognition: !!this.recognition,
          speechSynthesis: !!this.synthesis
        });
      } else {
        this.emit('error', new Error('Speech recognition not supported'));
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private setupSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('listeningStarted');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('listeningEnded');
      
      // Auto-restart if in continuous mode and session is active
      if (this.currentSession && this.currentSession.status === 'active' && this.config.continuous) {
        setTimeout(() => this.startListening(), 100);
      }
    };

    this.recognition.onresult = (event) => {
      this.processRecognitionResults(event);
    };

    this.recognition.onerror = (event) => {
      this.handleRecognitionError(event);
    };
  }

  private processRecognitionResults(event: SpeechRecognitionEvent): void {
    const results: DictationResult[] = [];
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alternatives: string[] = [];
      
      for (let j = 0; j < result.length; j++) {
        alternatives.push(result[j].transcript);
      }

      const dictationResult: DictationResult = {
        text: result[0].transcript,
        confidence: result[0].confidence || 0,
        alternatives,
        isFinal: result.isFinal,
        timestamp: Date.now(),
        duration: 0
      };

      results.push(dictationResult);

      // Process the result
      if (result.isFinal) {
        this.processFinalResult(dictationResult);
      } else {
        this.processInterimResult(dictationResult);
      }
    }

    this.emit('recognitionResults', results);
  }

  private processFinalResult(result: DictationResult): void {
    const text = result.text.trim();
    
    // Check if it's a voice command
    if (this.isVoiceCommand(text)) {
      this.executeVoiceCommand(text, result.confidence);
    } else {
      // Process as dictation
      this.processDictation(result);
    }
  }

  private processInterimResult(result: DictationResult): void {
    // Emit interim results for real-time feedback
    this.emit('interimResult', result);
  }

  private isVoiceCommand(text: string): boolean {
    const normalizedText = text.toLowerCase().trim();
    
    for (const command of this.commands.values()) {
      if (!command.enabled) continue;
      
      for (const phrase of command.phrase) {
        if (normalizedText.includes(phrase.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }

  private executeVoiceCommand(text: string, confidence: number): void {
    const normalizedText = text.toLowerCase().trim();
    
    for (const command of this.commands.values()) {
      if (!command.enabled) continue;
      
      for (const phrase of command.phrase) {
        if (normalizedText.includes(phrase.toLowerCase())) {
          this.executeCommand(command, text, confidence);
          return;
        }
      }
    }
  }

  private executeCommand(command: VoiceCommand, originalText: string, confidence: number): void {
    if (this.currentSession) {
      this.currentSession.commandsExecuted++;
    }

    // Extract parameters from the original text
    const parameters = this.extractCommandParameters(command, originalText);

    this.emit('commandExecuted', {
      command,
      originalText,
      confidence,
      parameters
    });

    // Provide audio feedback if enabled
    if (this.feedbackConfig.confirmCommands) {
      this.provideFeedback({
        type: 'confirmation',
        message: `Executing ${command.description}`,
        priority: 'medium'
      });
    }

    // Execute the command based on its action
    this.performCommandAction(command, parameters);
  }

  private extractCommandParameters(command: VoiceCommand, text: string): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Simple parameter extraction based on command type
    switch (command.action) {
      case 'navigate_to_story':
        // Extract story name from "open story [name]" or "go to story [name]"
        const storyMatch = text.match(/(?:open|go to) story (.+)/i);
        if (storyMatch) {
          parameters.storyName = storyMatch[1].trim();
        }
        break;
        
      case 'insert_text':
        // Extract text after command phrase
        const phrases = command.phrase.map(p => p.toLowerCase());
        const textLower = text.toLowerCase();
        
        for (const phrase of phrases) {
          const index = textLower.indexOf(phrase);
          if (index !== -1) {
            parameters.text = text.substring(index + phrase.length).trim();
            break;
          }
        }
        break;
        
      case 'set_word_count_goal':
        // Extract number from "set word count goal to [number]"
        const goalMatch = text.match(/(\d+)/);
        if (goalMatch) {
          parameters.wordCount = parseInt(goalMatch[1]);
        }
        break;
    }
    
    return parameters;
  }

  private performCommandAction(command: VoiceCommand, parameters: Record<string, any>): void {
    switch (command.action) {
      case 'start_dictation':
        this.startDictationMode();
        break;
        
      case 'stop_dictation':
        this.stopDictationMode();
        break;
        
      case 'new_story':
        this.emit('actionRequested', { action: 'createNewStory', parameters });
        break;
        
      case 'save_story':
        this.emit('actionRequested', { action: 'saveCurrentStory', parameters });
        break;
        
      case 'navigate_to_story':
        this.emit('actionRequested', { action: 'navigateToStory', parameters });
        break;
        
      case 'insert_text':
        if (parameters.text) {
          this.emit('actionRequested', { action: 'insertText', parameters });
        }
        break;
        
      case 'undo':
        this.emit('actionRequested', { action: 'undo', parameters });
        break;
        
      case 'redo':
        this.emit('actionRequested', { action: 'redo', parameters });
        break;
        
      case 'start_new_paragraph':
        this.emit('actionRequested', { action: 'insertText', parameters: { text: '\n\n' } });
        break;
        
      case 'read_current_text':
        this.emit('actionRequested', { action: 'getCurrentText', parameters });
        break;
        
      case 'set_word_count_goal':
        if (parameters.wordCount) {
          this.emit('actionRequested', { action: 'setWordCountGoal', parameters });
        }
        break;
        
      case 'show_writing_stats':
        this.emit('actionRequested', { action: 'showWritingStats', parameters });
        break;
        
      case 'pause_listening':
        this.pauseListening();
        break;
        
      case 'resume_listening':
        this.resumeListening();
        break;
    }
  }

  private processDictation(result: DictationResult): void {
    if (!this.currentSession) return;

    // Apply punctuation if auto mode is enabled
    let processedText = result.text;
    if (this.config.punctuationMode === 'auto') {
      processedText = this.addAutoPunctuation(processedText);
    }

    // Update session metrics
    const wordCount = processedText.split(/\s+/).filter(w => w.length > 0).length;
    this.currentSession.totalWords += wordCount;
    this.currentSession.accuracy = (this.currentSession.accuracy + result.confidence) / 2;

    // Apply voice profile adaptations
    const profile = this.profiles.get(this.currentProfile);
    if (profile) {
      processedText = this.applyVoiceAdaptations(processedText, profile);
    }

    this.emit('dictationProcessed', {
      originalText: result.text,
      processedText,
      confidence: result.confidence,
      wordCount,
      session: this.currentSession
    });
  }

  private addAutoPunctuation(text: string): string {
    let processed = text;
    
    // Basic auto-punctuation rules
    processed = processed.replace(/\b(period|full stop)\b/gi, '.');
    processed = processed.replace(/\b(comma)\b/gi, ',');
    processed = processed.replace(/\b(question mark)\b/gi, '?');
    processed = processed.replace(/\b(exclamation mark|exclamation point)\b/gi, '!');
    processed = processed.replace(/\b(semicolon)\b/gi, ';');
    processed = processed.replace(/\b(colon)\b/gi, ':');
    processed = processed.replace(/\b(new paragraph|paragraph)\b/gi, '\n\n');
    processed = processed.replace(/\b(new line|line break)\b/gi, '\n');
    
    // Capitalize first letter of sentences
    processed = processed.replace(/(^|\.\s*)([a-z])/g, (match, prefix, letter) => 
      prefix + letter.toUpperCase()
    );
    
    return processed;
  }

  private applyVoiceAdaptations(text: string, profile: VoiceProfile): string {
    let adapted = text;
    
    // Apply custom vocabulary corrections
    for (const adaptation of profile.adaptations) {
      const regex = new RegExp(`\\b${adaptation.word}\\b`, 'gi');
      if (adapted.match(regex)) {
        // Use the most accurate alternative if available
        const bestAlternative = adaptation.alternatives.length > 0 
          ? adaptation.alternatives[0] 
          : adaptation.pronunciation;
        adapted = adapted.replace(regex, bestAlternative);
      }
    }
    
    return adapted;
  }

  private handleRecognitionError(event: any): void {
    let errorMessage = 'Speech recognition error';
    
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected';
        break;
      case 'audio-capture':
        errorMessage = 'Audio capture failed';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone access not allowed';
        break;
      case 'network':
        errorMessage = 'Network error during recognition';
        break;
      case 'service-not-allowed':
        errorMessage = 'Speech recognition service not available';
        break;
    }

    this.emit('error', { type: event.error, message: errorMessage });

    if (this.feedbackConfig.errorNotification) {
      this.provideFeedback({
        type: 'error',
        message: errorMessage,
        priority: 'high'
      });
    }
  }

  private loadDataFromStorage(): void {
    try {
      // Load sessions
      const sessions = localStorage.getItem('astral_voice_sessions');
      if (sessions) {
        const sessionData = JSON.parse(sessions);
        Object.entries(sessionData).forEach(([id, session]) => {
          this.sessions.set(id, session as VoiceSession);
        });
      }

      // Load voice profiles
      const profiles = localStorage.getItem('astral_voice_profiles');
      if (profiles) {
        const profileData = JSON.parse(profiles);
        Object.entries(profileData).forEach(([id, profile]) => {
          this.profiles.set(id, profile as VoiceProfile);
        });
      }

      // Load configuration
      const config = localStorage.getItem('astral_voice_config');
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) };
      }

      // Load feedback configuration
      const feedbackConfig = localStorage.getItem('astral_voice_feedback');
      if (feedbackConfig) {
        this.feedbackConfig = { ...this.feedbackConfig, ...JSON.parse(feedbackConfig) };
      }

      // Load current profile
      const currentProfile = localStorage.getItem('astral_voice_current_profile');
      if (currentProfile) {
        this.currentProfile = currentProfile;
      }
    } catch (error) {
      console.error('Failed to load voice interaction data:', error);
    }
  }

  private saveDataToStorage(): void {
    try {
      const sessions = Object.fromEntries(this.sessions);
      localStorage.setItem('astral_voice_sessions', JSON.stringify(sessions));

      const profiles = Object.fromEntries(this.profiles);
      localStorage.setItem('astral_voice_profiles', JSON.stringify(profiles));

      localStorage.setItem('astral_voice_config', JSON.stringify(this.config));
      localStorage.setItem('astral_voice_feedback', JSON.stringify(this.feedbackConfig));
      localStorage.setItem('astral_voice_current_profile', this.currentProfile);
    } catch (error) {
      console.error('Failed to save voice interaction data:', error);
    }
  }

  private initializeDefaultData(): void {
    this.initializeDefaultCommands();
    this.initializeDefaultProfile();
  }

  private initializeDefaultCommands(): void {
    const defaultCommands: Omit<VoiceCommand, 'id'>[] = [
      {
        phrase: ['start dictation', 'begin dictation', 'start writing'],
        action: 'start_dictation',
        confidence: 0.8,
        context: 'global',
        description: 'Start dictation mode',
        enabled: true
      },
      {
        phrase: ['stop dictation', 'end dictation', 'stop writing'],
        action: 'stop_dictation',
        confidence: 0.8,
        context: 'dictation',
        description: 'Stop dictation mode',
        enabled: true
      },
      {
        phrase: ['new story', 'create new story', 'start new story'],
        action: 'new_story',
        confidence: 0.8,
        context: 'navigation',
        description: 'Create a new story',
        enabled: true
      },
      {
        phrase: ['save story', 'save document', 'save work'],
        action: 'save_story',
        confidence: 0.8,
        context: 'writing',
        description: 'Save current story',
        enabled: true
      },
      {
        phrase: ['open story', 'go to story', 'navigate to story'],
        action: 'navigate_to_story',
        confidence: 0.8,
        context: 'navigation',
        description: 'Navigate to a specific story',
        enabled: true
      },
      {
        phrase: ['undo', 'undo that', 'take that back'],
        action: 'undo',
        confidence: 0.8,
        context: 'editing',
        description: 'Undo last action',
        enabled: true
      },
      {
        phrase: ['redo', 'redo that', 'bring that back'],
        action: 'redo',
        confidence: 0.8,
        context: 'editing',
        description: 'Redo last undone action',
        enabled: true
      },
      {
        phrase: ['new paragraph', 'start new paragraph', 'paragraph break'],
        action: 'start_new_paragraph',
        confidence: 0.8,
        context: 'writing',
        description: 'Start a new paragraph',
        enabled: true
      },
      {
        phrase: ['read current text', 'read back', 'what did I write'],
        action: 'read_current_text',
        confidence: 0.8,
        context: 'writing',
        description: 'Read back current text',
        enabled: true
      },
      {
        phrase: ['set word count goal to', 'set goal to'],
        action: 'set_word_count_goal',
        confidence: 0.8,
        context: 'system',
        description: 'Set word count goal',
        enabled: true
      },
      {
        phrase: ['show stats', 'show writing statistics', 'show progress'],
        action: 'show_writing_stats',
        confidence: 0.8,
        context: 'system',
        description: 'Show writing statistics',
        enabled: true
      },
      {
        phrase: ['pause listening', 'pause voice', 'stop listening'],
        action: 'pause_listening',
        confidence: 0.9,
        context: 'system',
        description: 'Pause voice recognition',
        enabled: true
      },
      {
        phrase: ['resume listening', 'resume voice', 'start listening'],
        action: 'resume_listening',
        confidence: 0.9,
        context: 'system',
        description: 'Resume voice recognition',
        enabled: true
      }
    ];

    defaultCommands.forEach(command => {
      const id = this.generateId('command');
      this.commands.set(id, { ...command, id });
    });
  }

  private initializeDefaultProfile(): void {
    if (this.profiles.size === 0) {
      const defaultProfile: VoiceProfile = {
        id: 'default',
        name: 'Default Profile',
        language: 'en-US',
        vocabularyLevel: 'intermediate',
        writingStyle: 'casual',
        customVocabulary: [],
        adaptations: [],
        trainingData: {
          totalSessions: 0,
          totalWords: 0,
          averageAccuracy: 0,
          commonMistakes: {},
          improvementAreas: []
        },
        createdAt: Date.now(),
        lastUsed: Date.now()
      };

      this.profiles.set('default', defaultProfile);
    }
  }

  // Public API methods
  public async startVoiceSession(mode: VoiceSession['mode'] = 'mixed'): Promise<string> {
    if (this.currentSession) {
      await this.endVoiceSession();
    }

    this.currentSession = {
      id: this.generateId('session'),
      startTime: Date.now(),
      mode,
      language: this.config.language,
      totalWords: 0,
      commandsExecuted: 0,
      accuracy: 0,
      corrections: [],
      status: 'active'
    };

    this.sessions.set(this.currentSession.id, this.currentSession);
    this.saveDataToStorage();
    this.emit('sessionStarted', this.currentSession);

    return this.currentSession.id;
  }

  public async endVoiceSession(): Promise<VoiceSession | null> {
    if (!this.currentSession) return null;

    if (this.isListening) {
      this.stopListening();
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.status = 'completed';

    // Update voice profile training data
    const profile = this.profiles.get(this.currentProfile);
    if (profile) {
      profile.trainingData.totalSessions++;
      profile.trainingData.totalWords += this.currentSession.totalWords;
      profile.trainingData.averageAccuracy = 
        (profile.trainingData.averageAccuracy + this.currentSession.accuracy) / 2;
      profile.lastUsed = Date.now();
    }

    const endedSession = this.currentSession;
    this.currentSession = undefined;

    this.saveDataToStorage();
    this.emit('sessionEnded', endedSession);

    return endedSession;
  }

  public startListening(): void {
    if (!this.recognition || this.isListening) return;

    try {
      this.recognition.start();
    } catch (error) {
      this.emit('error', error);
    }
  }

  public stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      this.emit('error', error);
    }
  }

  public pauseListening(): void {
    if (this.currentSession) {
      this.currentSession.status = 'paused';
    }
    this.stopListening();
    this.emit('listeningPaused');
  }

  public resumeListening(): void {
    if (this.currentSession) {
      this.currentSession.status = 'active';
    }
    this.startListening();
    this.emit('listeningResumed');
  }

  public startDictationMode(): void {
    if (!this.currentSession) {
      this.startVoiceSession('dictation');
    } else {
      this.currentSession.mode = 'dictation';
    }
    this.startListening();
    this.emit('dictationModeStarted');
  }

  public stopDictationMode(): void {
    this.stopListening();
    this.emit('dictationModeStopped');
  }

  public speak(text: string, options?: Partial<VoiceFeedback>): void {
    if (!this.synthesis || !this.feedbackConfig.enabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply configuration
    utterance.rate = options?.rate || this.feedbackConfig.rate;
    utterance.pitch = options?.pitch || this.feedbackConfig.pitch;
    utterance.volume = options?.volume || this.feedbackConfig.volume;
    
    // Set voice
    const voiceName = options?.voice || this.feedbackConfig.voice;
    if (voiceName !== 'default') {
      const voice = this.availableVoices.find(v => v.name === voiceName);
      if (voice) {
        utterance.voice = voice;
      }
    }

    this.synthesis.speak(utterance);
    this.emit('speechStarted', { text, utterance });

    utterance.onend = () => {
      this.emit('speechEnded', { text, utterance });
    };

    utterance.onerror = (error) => {
      this.emit('speechError', { text, error });
    };
  }

  public provideFeedback(feedback: AudioFeedback): void {
    if (!this.feedbackConfig.enabled) return;

    // Play system sound if specified
    if (feedback.sound) {
      this.playSystemSound(feedback.sound);
    }

    // Speak message if provided
    if (feedback.message) {
      this.speak(feedback.message);
    }

    this.emit('feedbackProvided', feedback);
  }

  private playSystemSound(sound: string): void {
    // Play browser notification sounds or custom audio
    // This would typically use Web Audio API or HTML5 Audio
    const audio = new Audio();
    
    switch (sound) {
      case 'success':
        // Play success sound
        break;
      case 'error':
        // Play error sound
        break;
      case 'notification':
        // Play notification sound
        break;
    }
  }

  public updateConfiguration(newConfig: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }

    this.saveDataToStorage();
    this.emit('configurationUpdated', this.config);
  }

  public updateFeedbackConfiguration(newConfig: Partial<VoiceFeedback>): void {
    this.feedbackConfig = { ...this.feedbackConfig, ...newConfig };
    this.saveDataToStorage();
    this.emit('feedbackConfigurationUpdated', this.feedbackConfig);
  }

  public createVoiceProfile(profile: Omit<VoiceProfile, 'id' | 'createdAt' | 'lastUsed' | 'trainingData'>): string {
    const profileData: VoiceProfile = {
      ...profile,
      id: this.generateId('profile'),
      trainingData: {
        totalSessions: 0,
        totalWords: 0,
        averageAccuracy: 0,
        commonMistakes: {},
        improvementAreas: []
      },
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    this.profiles.set(profileData.id, profileData);
    this.saveDataToStorage();
    this.emit('profileCreated', profileData);

    return profileData.id;
  }

  public switchProfile(profileId: string): void {
    if (this.profiles.has(profileId)) {
      this.currentProfile = profileId;
      
      // Update configuration based on profile
      const profile = this.profiles.get(profileId);
      if (profile) {
        this.updateConfiguration({ language: profile.language });
        profile.lastUsed = Date.now();
      }

      this.saveDataToStorage();
      this.emit('profileSwitched', profile);
    }
  }

  public addCustomCommand(command: Omit<VoiceCommand, 'id'>): string {
    const commandData: VoiceCommand = {
      ...command,
      id: this.generateId('command')
    };

    this.commands.set(commandData.id, commandData);
    this.saveDataToStorage();
    this.emit('commandAdded', commandData);

    return commandData.id;
  }

  public trainVoiceAdaptation(word: string, correctPronunciation: string): void {
    const profile = this.profiles.get(this.currentProfile);
    if (!profile) return;

    const existingAdaptation = profile.adaptations.find(a => a.word === word);
    
    if (existingAdaptation) {
      existingAdaptation.frequency++;
      existingAdaptation.pronunciation = correctPronunciation;
    } else {
      profile.adaptations.push({
        word,
        pronunciation: correctPronunciation,
        frequency: 1,
        accuracy: 0,
        alternatives: []
      });
    }

    this.saveDataToStorage();
    this.emit('adaptationTrained', { word, pronunciation: correctPronunciation });
  }

  public getVoiceMetrics(): VoiceMetrics {
    const sessions = Array.from(this.sessions.values());
    const completedSessions = sessions.filter(s => s.endTime);
    
    const totalDictationTime = completedSessions.reduce((sum, s) => 
      sum + ((s.endTime || 0) - s.startTime), 0
    );
    
    const totalWords = sessions.reduce((sum, s) => sum + s.totalWords, 0);
    const totalCommands = sessions.reduce((sum, s) => sum + s.commandsExecuted, 0);
    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;

    // Calculate most used commands
    const mostUsedCommands: Record<string, number> = {};
    // This would be calculated from actual command usage data

    return {
      totalSessions: sessions.length,
      totalDictationTime,
      totalWordsSpoken: totalWords,
      averageAccuracy: averageAccuracy || 0,
      commandsExecuted: totalCommands,
      commandAccuracy: 0.85, // Mock value
      mostUsedCommands,
      improvementRate: 0, // Mock value
      preferredMode: this.getMostUsedMode(sessions)
    };
  }

  private getMostUsedMode(sessions: VoiceSession[]): 'dictation' | 'commands' | 'mixed' {
    const modeCounts = sessions.reduce((counts, session) => {
      counts[session.mode] = (counts[session.mode] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(modeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as 'dictation' | 'commands' | 'mixed' || 'mixed';
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  public getCurrentSession(): VoiceSession | null {
    return this.currentSession || null;
  }

  public getAllSessions(): VoiceSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.startTime - a.startTime);
  }

  public getVoiceProfiles(): VoiceProfile[] {
    return Array.from(this.profiles.values());
  }

  public getCurrentProfile(): VoiceProfile | null {
    return this.profiles.get(this.currentProfile) || null;
  }

  public getVoiceCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  public getConfiguration(): SpeechRecognitionConfig {
    return { ...this.config };
  }

  public getFeedbackConfiguration(): VoiceFeedback {
    return { ...this.feedbackConfig };
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isVoiceSupported(): boolean {
    return this.isInitialized;
  }
}

export default new VoiceInteractionService();