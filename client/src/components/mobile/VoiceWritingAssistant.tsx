/**
 * VoiceWritingAssistant Component
 * Advanced voice-to-text writing interface optimized for mobile devices
 * Features intelligent voice commands, punctuation detection, and writing assistance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Languages,
  Wand2
} from 'lucide-react';

export interface VoiceWritingAssistantProps {
  onTranscriptUpdate?: (transcript: string) => void;
  onToggle?: () => void;
  initialLanguage?: string;
  enablePunctuation?: boolean;
  enableCommands?: boolean;
  className?: string;
}

interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  enablePunctuation: boolean;
  enableCommands: boolean;
  autoSubmit: boolean;
  confidenceThreshold: number;
}

interface VoiceCommand {
  phrase: string;
  action: string;
  description: string;
  example: string;
}

interface AudioVisualization {
  isActive: boolean;
  volume: number;
  frequency: number[];
}

const VOICE_COMMANDS: VoiceCommand[] = [
  { phrase: 'new paragraph', action: 'newParagraph', description: 'Start a new paragraph', example: 'new paragraph' },
  { phrase: 'new line', action: 'newLine', description: 'Insert line break', example: 'new line' },
  { phrase: 'delete that', action: 'deleteLast', description: 'Delete last sentence', example: 'delete that' },
  { phrase: 'delete paragraph', action: 'deleteParagraph', description: 'Delete current paragraph', example: 'delete paragraph' },
  { phrase: 'save document', action: 'save', description: 'Save the document', example: 'save document' },
  { phrase: 'start dictation', action: 'startDictation', description: 'Begin voice writing', example: 'start dictation' },
  { phrase: 'stop dictation', action: 'stopDictation', description: 'End voice writing', example: 'stop dictation' },
  { phrase: 'correct that', action: 'correctLast', description: 'Mark last phrase for correction', example: 'correct that' },
  { phrase: 'spell', action: 'spellMode', description: 'Enter spelling mode', example: 'spell W-O-R-D' },
  { phrase: 'punctuation', action: 'punctuationMode', description: 'Insert punctuation', example: 'punctuation comma' }
];

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' }
];

export const VoiceWritingAssistant: React.FC<VoiceWritingAssistantProps> = ({
  onTranscriptUpdate,
  onToggle,
  initialLanguage = 'en-US',
  enablePunctuation = true,
  enableCommands = true,
  className
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [settings, setSettings] = useState<VoiceSettings>({
    language: initialLanguage,
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    enablePunctuation,
    enableCommands,
    autoSubmit: false,
    confidenceThreshold: 0.7
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [audioVisualization, setAudioVisualization] = useState<AudioVisualization>({
    isActive: false,
    volume: 0,
    frequency: new Array(32).fill(0)
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      setIsSupported(true);
      
      setupRecognition();
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = settings.continuous;
    recognition.interimResults = settings.interimResults;
    recognition.lang = settings.language;
    recognition.maxAlternatives = settings.maxAlternatives;

    recognition.onstart = () => {
      setIsRecording(true);
      setAudioVisualization(prev => ({ ...prev, isActive: true }));
      setupAudioVisualization();
    };

    recognition.onend = () => {
      setIsRecording(false);
      setAudioVisualization(prev => ({ ...prev, isActive: false }));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        setConfidence(confidence);

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript);
      
      if (finalTranscript) {
        const processedTranscript = processVoiceInput(finalTranscript);
        setFinalTranscript(prev => prev + processedTranscript);
        onTranscriptUpdate?.(processedTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };
  }, [settings, onTranscriptUpdate]);

  const setupAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;
      
      const updateVisualization = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        
        setAudioVisualization(prev => ({
          ...prev,
          volume: volume / 255,
          frequency: Array.from(dataArray).map(value => value / 255)
        }));
        
        animationFrameRef.current = requestAnimationFrame(updateVisualization);
      };
      
      updateVisualization();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  }, []);

  const processVoiceInput = useCallback((transcript: string): string => {
    let processed = transcript.trim();

    if (settings.enableCommands) {
      // Check for voice commands
      for (const command of VOICE_COMMANDS) {
        if (processed.toLowerCase().includes(command.phrase)) {
          executeVoiceCommand(command.action, processed);
          return ''; // Don't add command text to transcript
        }
      }
    }

    if (settings.enablePunctuation) {
      // Auto-punctuation processing
      processed = addAutoPunctuation(processed);
    }

    return processed + ' ';
  }, [settings]);

  const executeVoiceCommand = useCallback((action: string, context: string) => {
    switch (action) {
      case 'newParagraph':
        onTranscriptUpdate?.('\n\n');
        break;
      case 'newLine':
        onTranscriptUpdate?.('\n');
        break;
      case 'deleteLast':
        // Signal to parent component to delete last sentence
        break;
      case 'save':
        // Signal to parent component to save
        break;
      default:
        console.log('Unknown voice command:', action);
    }
  }, [onTranscriptUpdate]);

  const addAutoPunctuation = useCallback((text: string): string => {
    // Simple auto-punctuation rules
    return text
      .replace(/\bperiod\b/gi, '.')
      .replace(/\bcomma\b/gi, ',')
      .replace(/\bquestion mark\b/gi, '?')
      .replace(/\bexclamation mark\b/gi, '!')
      .replace(/\bcolon\b/gi, ':')
      .replace(/\bsemicolon\b/gi, ';')
      .replace(/\bopen quote\b/gi, '"')
      .replace(/\bclose quote\b/gi, '"')
      .replace(/\bnew paragraph\b/gi, '\n\n');
  }, []);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setCurrentTranscript('');
    setFinalTranscript('');
  }, []);

  const renderAudioVisualization = () => (
    <div className="flex items-center justify-center gap-1 h-16">
      {audioVisualization.frequency.slice(0, 16).map((value, index) => (
        <motion.div
          key={index}
          className="w-1 bg-blue-500 rounded-full"
          animate={{
            height: audioVisualization.isActive ? `${Math.max(4, value * 60)}px` : '4px',
            opacity: audioVisualization.isActive ? 0.7 + value * 0.3 : 0.3
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
  );

  const renderSettings = () => (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            className="bg-background rounded-lg p-6 m-4 max-w-md w-full"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-4">Voice Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enablePunctuation}
                    onChange={(e) => setSettings(prev => ({ ...prev, enablePunctuation: e.target.checked }))}
                  />
                  <span className="text-sm">Auto punctuation</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enableCommands}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableCommands: e.target.checked }))}
                  />
                  <span className="text-sm">Voice commands</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.continuous}
                    onChange={(e) => setSettings(prev => ({ ...prev, continuous: e.target.checked }))}
                  />
                  <span className="text-sm">Continuous listening</span>
                </label>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.confidenceThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowSettings(false)} className="flex-1">
                Done
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!isSupported) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <VolumeX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Voice Recognition Not Available</h3>
        <p className="text-sm text-muted-foreground">
          Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Safari.
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("voice-writing-assistant", className)}>
      {/* Main Interface */}
      <Card className="p-6">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant={isRecording ? 'destructive' : 'secondary'}>
              {isRecording ? 'Recording' : 'Ready'}
            </Badge>
            {confidence > 0 && (
              <Badge variant="outline">
                {Math.round(confidence * 100)}% confidence
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommands(!showCommands)}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Audio Visualization */}
        {renderAudioVisualization()}

        {/* Transcript Display */}
        <div className="min-h-[120px] p-4 bg-muted/30 rounded-lg mb-4">
          <div className="text-sm">
            {finalTranscript && (
              <span className="text-foreground">{finalTranscript}</span>
            )}
            {currentTranscript && (
              <span className="text-muted-foreground italic">{currentTranscript}</span>
            )}
            {!finalTranscript && !currentTranscript && (
              <span className="text-muted-foreground">
                Start speaking to begin dictation...
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isRecording ? 'destructive' : 'default'}
            size="lg"
            onClick={toggleRecording}
            className="rounded-full h-12 w-12"
          >
            {isRecording ? (
              <Square className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearTranscript}
            disabled={!finalTranscript && !currentTranscript}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Voice Commands Help */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <Card className="p-4">
              <h4 className="font-medium mb-3">Voice Commands</h4>
              <div className="space-y-2 text-sm">
                {VOICE_COMMANDS.slice(0, 6).map((command, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-mono text-blue-600">"{command.phrase}"</span>
                    <span className="text-muted-foreground">{command.description}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      {renderSettings()}
    </div>
  );
};

export default VoiceWritingAssistant;