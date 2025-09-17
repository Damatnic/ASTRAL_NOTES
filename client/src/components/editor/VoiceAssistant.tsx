/**
 * Voice Assistant Component
 * Integrated voice-to-text functionality for hands-free writing
 * Revolutionary mobile and accessibility-friendly writing experience
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Volume2, 
  VolumeX,
  Waveform,
  Languages,
  Command,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { voiceService, type VoiceSettings, type VoiceDictationSession } from '../../services/voiceService';
import { smartWritingCompanion } from '../../services/smartWritingCompanion';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface VoiceAssistantProps {
  onTextInsert: (text: string) => void;
  onCommand: (command: string, parameters?: any) => void;
  currentContext?: {
    projectId: string;
    sceneId?: string;
    characterId?: string;
    genre?: string;
  };
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  session: VoiceDictationSession | null;
  transcription: string;
  interimText: string;
  confidence: number;
  errorMessage?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onTextInsert,
  onCommand,
  currentContext,
  className = ''
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    session: null,
    transcription: '',
    interimText: '',
    confidence: 0
  });
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerData, setVisualizerData] = useState<number[]>([]);
  const [commandHistory, setCommandHistory] = useState<Array<{
    command: string;
    timestamp: Date;
    success: boolean;
  }>>([]);

  const audioVisualizerRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize voice service
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        const supported = voiceService.isSupported();
        setIsSupported(supported);

        if (supported) {
          const initialized = await voiceService.initialize();
          setIsInitialized(initialized);

          if (initialized) {
            setupEventListeners();
          }
        }
      } catch (error) {
        console.error('Failed to initialize voice assistant:', error);
        setRecordingState(prev => ({
          ...prev,
          errorMessage: 'Failed to initialize voice recognition'
        }));
      }
    };

    initializeVoice();

    return () => {
      cleanup();
    };
  }, []);

  // Setup voice service event listeners
  const setupEventListeners = useCallback(() => {
    voiceService.on('recording-started', (data) => {
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        session: data.session,
        errorMessage: undefined
      }));
      startAudioVisualization();
    });

    voiceService.on('recording-stopped', (data) => {
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        session: data.session
      }));
      stopAudioVisualization();
    });

    voiceService.on('recording-paused', () => {
      setRecordingState(prev => ({
        ...prev,
        isPaused: true
      }));
    });

    voiceService.on('recording-resumed', () => {
      setRecordingState(prev => ({
        ...prev,
        isPaused: false
      }));
    });

    voiceService.on('transcription', (data) => {
      setRecordingState(prev => ({
        ...prev,
        transcription: prev.transcription + data.text,
        confidence: data.confidence
      }));
      
      // Insert text into editor
      onTextInsert(data.text);
    });

    voiceService.on('interim-result', (data) => {
      setRecordingState(prev => ({
        ...prev,
        interimText: data.text,
        confidence: data.confidence
      }));
    });

    voiceService.on('voice-command', (data) => {
      const { command } = data;
      setCommandHistory(prev => [
        ...prev.slice(-9), // Keep last 10 commands
        {
          command: command.command,
          timestamp: new Date(),
          success: true
        }
      ]);

      // Execute command
      onCommand(command.action, command.parameters);
    });

    voiceService.on('error', (data) => {
      setRecordingState(prev => ({
        ...prev,
        errorMessage: data.error,
        isRecording: false,
        isPaused: false
      }));
      stopAudioVisualization();
    });
  }, [onTextInsert, onCommand]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      await voiceService.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingState(prev => ({
        ...prev,
        errorMessage: 'Failed to start recording'
      }));
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      const session = await voiceService.stopRecording();
      if (session) {
        // Show session summary
        console.log('Recording session completed:', session);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  // Pause/Resume recording
  const togglePauseRecording = useCallback(() => {
    if (recordingState.isPaused) {
      voiceService.resumeRecording();
    } else {
      voiceService.pauseRecording();
    }
  }, [recordingState.isPaused]);

  // Text-to-speech playback
  const speakText = useCallback(async (text: string) => {
    try {
      setIsPlaying(true);
      await voiceService.speakText(text, {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8
      });
    } catch (error) {
      console.error('Failed to speak text:', error);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  // Audio visualization
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const animate = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        setVisualizerData(Array.from(dataArray));
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();
    } catch (error) {
      console.error('Failed to start audio visualization:', error);
    }
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setVisualizerData([]);
  }, []);

  const cleanup = useCallback(() => {
    stopAudioVisualization();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [stopAudioVisualization]);

  // Language options
  const languageOptions = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' }
  ];

  if (!isSupported) {
    return (
      <Card className={`bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Voice recognition not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`voice-assistant ${className}`}
    >
      {/* Main Voice Controls */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-400" />
              <span>Voice Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={recordingState.isRecording ? stopRecording : startRecording}
              disabled={!isInitialized}
              variant={recordingState.isRecording ? "destructive" : "default"}
              className={`relative ${recordingState.isRecording ? 'animate-pulse' : ''}`}
            >
              {recordingState.isRecording ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {recordingState.isRecording ? 'Stop' : 'Start Recording'}
            </Button>

            {recordingState.isRecording && (
              <Button
                onClick={togglePauseRecording}
                variant="outline"
              >
                {recordingState.isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Audio Visualizer */}
          <AnimatePresence>
            {recordingState.isRecording && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                className="flex items-center justify-center h-12 bg-black/20 rounded-lg"
              >
                <div className="flex items-end gap-1 h-8">
                  {visualizerData.slice(0, 32).map((value, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-t from-purple-500 to-blue-500 w-2 rounded-full"
                      style={{
                        height: `${Math.max(2, (value / 255) * 32)}px`
                      }}
                      animate={{
                        height: `${Math.max(2, (value / 255) * 32)}px`
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Transcription */}
          {(recordingState.transcription || recordingState.interimText) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-black/20 rounded-lg"
            >
              <div className="text-sm text-gray-300">
                {recordingState.transcription}
                <span className="text-gray-500 italic">
                  {recordingState.interimText}
                </span>
              </div>
              {recordingState.confidence > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Confidence:</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${recordingState.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round(recordingState.confidence * 100)}%
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Session Info */}
          {recordingState.session && (
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {Math.floor((Date.now() - recordingState.session.startTime.getTime()) / 1000)}s
                </span>
              </div>
              <div>
                {recordingState.session.totalWords} words
              </div>
            </div>
          )}

          {/* Error Message */}
          {recordingState.errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{recordingState.errorMessage}</span>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => speakText(recordingState.transcription)}
              disabled={!recordingState.transcription || isPlaying}
              className="flex-1"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isPlaying ? 'Speaking...' : 'Read Back'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecordingState(prev => ({ ...prev, transcription: '', interimText: '' }))}
              disabled={!recordingState.transcription}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Commands History */}
      {commandHistory.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Command className="w-4 h-4" />
              Recent Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {commandHistory.slice(-3).map((cmd, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{cmd.command}</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-gray-500">
                      {cmd.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    className="w-full p-2 bg-black/20 border border-gray-600 rounded-lg text-sm"
                    defaultValue="en-US"
                    onChange={(e) => {
                      voiceService.updateSettings({ language: e.target.value });
                    }}
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Settings Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      onChange={(e) => {
                        voiceService.updateSettings({ autoCapitalization: e.target.checked });
                      }}
                    />
                    Auto Capitalization
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      onChange={(e) => {
                        voiceService.updateSettings({ autoPunctuation: e.target.checked });
                      }}
                    />
                    Auto Punctuation
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      onChange={(e) => {
                        voiceService.updateSettings({ customCommands: e.target.checked });
                      }}
                    />
                    Voice Commands
                  </label>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};