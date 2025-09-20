import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaQuery } from '@mui/material';
import {
  Box,
  Fab,
  SwipeableDrawer,
  Typography,
  TextField,
  IconButton,
  Paper,
  Chip,
  Grid,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Mic as MicIcon,
  Camera as CameraIcon,
  FormatSize as FormatSizeIcon,
  Palette as PaletteIcon,
  TouchApp as TouchAppIcon,
  Gesture as GestureIcon,
  Vibration as VibrationIcon,
  NearMe as NearMeIcon,
  FlashOn as FlashOnIcon,
  AutoAwesome as AutoAwesomeIcon,
  Close as CloseIcon,
  FullscreenExit as FullscreenExitIcon,
  Fullscreen as FullscreenIcon,
  KeyboardVoice as KeyboardVoiceIcon,
  Stop as StopIcon
} from '@mui/icons-material';

interface MobileWritingInterfaceProps {
  noteId?: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
}

interface GestureAction {
  name: string;
  action: () => void;
  icon: React.ReactElement;
  description: string;
}

export const MobileWritingInterface: React.FC<MobileWritingInterfaceProps> = ({
  noteId,
  onSave,
  onClose
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isGestureMode, setIsGestureMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'sepia' | 'contrast'>('light');
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [isHapticEnabled, setIsHapticEnabled] = useState(true);
  const [gestureDrawerOpen, setGestureDrawerOpen] = useState(false);
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const gestureAreaRef = useRef<HTMLDivElement>(null);

  const themeStyles = {
    light: {
      backgroundColor: '#ffffff',
      color: '#000000',
      paperColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#121212',
      color: '#ffffff',
      paperColor: '#1e1e1e'
    },
    sepia: {
      backgroundColor: '#f4f1ea',
      color: '#5c4b37',
      paperColor: '#f9f6ef'
    },
    contrast: {
      backgroundColor: '#000000',
      color: '#ffff00',
      paperColor: '#1a1a1a'
    }
  };

  const gestureActions: GestureAction[] = [
    {
      name: 'Quick Save',
      action: () => handleSave(),
      icon: <FlashOnIcon />,
      description: 'Double tap to save'
    },
    {
      name: 'Voice Input',
      action: () => toggleVoiceMode(),
      icon: <KeyboardVoiceIcon />,
      description: 'Swipe up to start voice'
    },
    {
      name: 'AI Assist',
      action: () => triggerAIAssist(),
      icon: <AutoAwesomeIcon />,
      description: 'Circle gesture for AI'
    },
    {
      name: 'Format Text',
      action: () => showFormatOptions(),
      icon: <FormatSizeIcon />,
      description: 'Pinch to format'
    }
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setContent(prev => prev + finalTranscript);
          vibrateDevice(100);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const vibrateDevice = useCallback((duration: number = 50) => {
    if (isHapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }, [isHapticEnabled]);

  const handleSave = useCallback(() => {
    onSave?.(content);
    vibrateDevice(100);
  }, [content, onSave, vibrateDevice]);

  const toggleVoiceMode = useCallback(() => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      vibrateDevice(200);
    }
  }, [recognition, isRecording, vibrateDevice]);

  const triggerAIAssist = useCallback(() => {
    vibrateDevice(150);
    // AI assistance logic here
  }, [vibrateDevice]);

  const showFormatOptions = useCallback(() => {
    vibrateDevice(100);
    // Format options logic here
  }, [vibrateDevice]);

  const handleGestureStart = useCallback((event: React.TouchEvent) => {
    if (!isGestureMode) return;
    
    const touches = event.touches;
    vibrateDevice(50);
    
    // Handle different gesture patterns
    if (touches.length === 2) {
      // Pinch gesture for formatting
      showFormatOptions();
    }
  }, [isGestureMode, vibrateDevice, showFormatOptions]);

  const handleDoubleTap = useCallback(() => {
    if (isGestureMode) {
      handleSave();
    }
  }, [isGestureMode, handleSave]);

  const handleSwipeUp = useCallback(() => {
    if (isGestureMode) {
      setVoiceDrawerOpen(true);
    }
  }, [isGestureMode]);

  const adjustFontSize = useCallback((increment: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + increment)));
    vibrateDevice(50);
  }, [vibrateDevice]);

  const switchTheme = useCallback((newTheme: typeof selectedTheme) => {
    setSelectedTheme(newTheme);
    vibrateDevice(100);
  }, [vibrateDevice]);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      <Fab
        color="primary"
        aria-label="mobile writing"
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <EditIcon />
      </Fab>

      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        disableSwipeToOpen={false}
        PaperProps={{
          sx: {
            height: isFullscreen ? '100vh' : '80vh',
            backgroundColor: themeStyles[selectedTheme].backgroundColor,
            color: themeStyles[selectedTheme].color
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6">Mobile Writing</Typography>
            <Box>
              <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
              <IconButton onClick={() => setIsOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ p: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<MicIcon />}
              label={isRecording ? "Recording..." : "Voice"}
              onClick={toggleVoiceMode}
              color={isVoiceMode ? "primary" : "default"}
              variant={isRecording ? "filled" : "outlined"}
            />
            <Chip
              icon={<GestureIcon />}
              label="Gestures"
              onClick={() => setIsGestureMode(!isGestureMode)}
              color={isGestureMode ? "primary" : "default"}
            />
            <Chip
              icon={<VibrationIcon />}
              label="Haptic"
              onClick={() => setIsHapticEnabled(!isHapticEnabled)}
              color={isHapticEnabled ? "primary" : "default"}
            />
            <Chip
              icon={<PaletteIcon />}
              label="Theme"
              onClick={() => setGestureDrawerOpen(true)}
            />
          </Box>

          {/* Writing Area */}
          <Box 
            ref={gestureAreaRef}
            sx={{ 
              flex: 1, 
              p: 2,
              position: 'relative'
            }}
            onTouchStart={handleGestureStart}
            onDoubleClick={handleDoubleTap}
          >
            <TextField
              ref={textAreaRef}
              multiline
              fullWidth
              variant="outlined"
              placeholder="Start writing... Use gestures and voice for enhanced input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  backgroundColor: alpha(themeStyles[selectedTheme].paperColor, 0.8),
                  color: themeStyles[selectedTheme].color,
                  minHeight: '400px',
                  '& fieldset': {
                    borderColor: alpha(themeStyles[selectedTheme].color, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(themeStyles[selectedTheme].color, 0.5),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  }
                },
                '& .MuiInputBase-input': {
                  color: themeStyles[selectedTheme].color
                }
              }}
              InputProps={{
                sx: { height: '100%', alignItems: 'flex-start' }
              }}
            />

            {/* Voice Recording Indicator */}
            <Zoom in={isRecording}>
              <Paper
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: theme.palette.error.main,
                  color: 'white'
                }}
              >
                <MicIcon />
                <Typography variant="body2">Recording...</Typography>
              </Paper>
            </Zoom>

            {/* Gesture Mode Indicator */}
            <Zoom in={isGestureMode}>
              <Paper
                sx={{
                  position: 'absolute',
                  top: 20,
                  left: 20,
                  p: 1,
                  backgroundColor: theme.palette.primary.main,
                  color: 'white'
                }}
              >
                <TouchAppIcon />
              </Paper>
            </Zoom>
          </Box>

          {/* Font Size Controls */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <IconButton onClick={() => adjustFontSize(-2)}>
                  <Typography variant="caption">A-</Typography>
                </IconButton>
              </Grid>
              <Grid item xs>
                <Typography variant="body2" align="center">
                  Font Size: {fontSize}px
                </Typography>
              </Grid>
              <Grid item>
                <IconButton onClick={() => adjustFontSize(2)}>
                  <Typography variant="caption">A+</Typography>
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Theme Selection Dialog */}
      <Dialog
        open={gestureDrawerOpen}
        onClose={() => setGestureDrawerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Writing Themes</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.entries(themeStyles).map(([themeName, themeStyle]) => (
              <Grid item xs={6} key={themeName}>
                <Paper
                  onClick={() => switchTheme(themeName as typeof selectedTheme)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    backgroundColor: themeStyle.backgroundColor,
                    color: themeStyle.color,
                    border: selectedTheme === themeName ? 2 : 1,
                    borderColor: selectedTheme === themeName ? 'primary.main' : 'divider',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      transition: 'transform 0.2s'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                  </Typography>
                  <Typography variant="body2">
                    Sample text in {themeName} theme
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Voice Commands Dialog */}
      <Dialog
        open={voiceDrawerOpen}
        onClose={() => setVoiceDrawerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Voice Commands</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Available voice commands:
          </Typography>
          <Box sx={{ mt: 2 }}>
            {[
              'Start recording / Stop recording',
              'Save document',
              'New paragraph',
              'Delete last sentence',
              'Format bold / Format italic',
              'Insert bullet point',
              'Go to beginning / Go to end'
            ].map((command, index) => (
              <Chip
                key={index}
                label={command}
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};