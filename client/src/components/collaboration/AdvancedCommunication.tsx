/**
 * Advanced Communication Component
 * Comprehensive communication hub with video conferencing, voice notes, screen sharing, chat channels, and translation
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Share2,
  Settings,
  Users,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Calendar,
  Volume2,
  VolumeX,
  Monitor,
  MonitorOff,
  Languages,
  Bell,
  BellOff,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { communicationService } from '@/services/communicationService';
import type {
  CommunicationChannel,
  VideoConference,
  VoiceNote,
  ScreenShare,
  ChatMessage,
  NotificationData,
  CommunicationMetrics
} from '@/types/collaboration';

interface AdvancedCommunicationProps {
  currentUserId: string;
  groupId?: string;
  className?: string;
}

type CommunicationView = 'channels' | 'conference' | 'chat' | 'notifications' | 'settings' | 'analytics';

export const AdvancedCommunication: React.FC<AdvancedCommunicationProps> = ({
  currentUserId,
  groupId,
  className
}) => {
  const [currentView, setCurrentView] = useState<CommunicationView>('channels');
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | null>(null);
  const [conferences, setConferences] = useState<VideoConference[]>([]);
  const [activeConference, setActiveConference] = useState<VideoConference | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [screenShares, setScreenShares] = useState<ScreenShare[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [metrics, setMetrics] = useState<CommunicationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'voice' | 'video'>('all');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [groupId]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      loadVoiceNotes(selectedChannel.id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [channelsData, conferencesData, notificationsData, metricsData] = await Promise.all([
        communicationService.getChannels(groupId),
        communicationService.getConferences(),
        communicationService.getNotifications(currentUserId),
        groupId ? communicationService.getCommunicationMetrics(groupId) : Promise.resolve(null)
      ]);

      setChannels(channelsData);
      setConferences(conferencesData);
      setNotifications(notificationsData);
      setMetrics(metricsData);

      if (channelsData.length > 0 && !selectedChannel) {
        setSelectedChannel(channelsData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communication data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const messagesData = await communicationService.getMessages(channelId);
      setMessages(messagesData.reverse()); // Show oldest first
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const loadVoiceNotes = async (channelId: string) => {
    try {
      const voiceNotesData = await communicationService.getVoiceNotes(channelId);
      setVoiceNotes(voiceNotesData);
    } catch (err) {
      console.error('Failed to load voice notes:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;

    try {
      const newMessage = await communicationService.sendMessage({
        channelId: selectedChannel.id,
        senderId: currentUserId,
        content: messageInput.trim(),
        type: 'text'
      });

      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleJoinConference = async (conferenceId: string) => {
    try {
      const conference = await communicationService.joinConference(conferenceId, currentUserId);
      setActiveConference(conference);
      setCurrentView('conference');
    } catch (err) {
      console.error('Failed to join conference:', err);
    }
  };

  const handleLeaveConference = async () => {
    if (!activeConference) return;

    try {
      await communicationService.leaveConference(activeConference.id, currentUserId);
      setActiveConference(null);
      setCurrentView('channels');
    } catch (err) {
      console.error('Failed to leave conference:', err);
    }
  };

  const handleStartScreenShare = async () => {
    if (!activeConference) return;

    try {
      const screenShare = await communicationService.startScreenShare({
        conferenceId: activeConference.id,
        presenterId: currentUserId,
        title: 'Screen Share Session'
      });
      
      setScreenShares(prev => [...prev, screenShare]);
      setIsScreenSharing(true);
    } catch (err) {
      console.error('Failed to start screen share:', err);
    }
  };

  const handleStopScreenShare = async () => {
    const activeScreenShare = screenShares.find(s => s.isActive && s.presenterId === currentUserId);
    if (!activeScreenShare) return;

    try {
      await communicationService.stopScreenShare(activeScreenShare.id);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Failed to stop screen share:', err);
    }
  };

  const handleTranslateMessage = async (messageId: string, targetLanguage: string) => {
    try {
      const translation = await communicationService.translateMessage(messageId, targetLanguage);
      // In a real implementation, this would update the message display
      console.log('Translation:', translation);
    } catch (err) {
      console.error('Failed to translate message:', err);
    }
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || channel.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading communication tools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center space-y-2">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-cosmic-500 text-white rounded-lg hover:bg-cosmic-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("advanced-communication flex h-full max-h-screen", className)}>
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-background flex flex-col">
        {/* Navigation */}
        <div className="p-4 border-b border-border">
          <div className="flex space-x-1">
            {[
              { id: 'channels', icon: MessageSquare, label: 'Channels' },
              { id: 'conference', icon: Video, label: 'Conference' },
              { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
              { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id as CommunicationView)}
                className={cn(
                  "relative p-2 rounded-lg transition-colors",
                  currentView === id
                    ? "bg-cosmic-500 text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on current view */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'channels' && (
            <div className="h-full flex flex-col">
              {/* Search and Filters */}
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500"
                  />
                </div>
                
                <div className="flex space-x-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'text', label: 'Text' },
                    { id: 'voice', label: 'Voice' },
                    { id: 'video', label: 'Video' }
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setFilterType(id as typeof filterType)}
                      className={cn(
                        "px-3 py-1 text-xs rounded-md transition-colors",
                        filterType === id
                          ? "bg-cosmic-500 text-white"
                          : "bg-accent text-accent-foreground hover:bg-cosmic-100"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channels List */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-2">
                  {filteredChannels.map(channel => (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors",
                        selectedChannel?.id === channel.id
                          ? "bg-cosmic-500 text-white"
                          : "hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {channel.type === 'text' && <MessageSquare className="h-4 w-4" />}
                          {channel.type === 'voice' && <Mic className="h-4 w-4" />}
                          {channel.type === 'video' && <Video className="h-4 w-4" />}
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        {channel.isActive && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {channel.participantIds.length} members • {channel.metadata.messageCount} messages
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Channel Button */}
              <div className="p-4 border-t border-border">
                <button className="w-full flex items-center justify-center space-x-2 p-2 border border-dashed border-border rounded-lg hover:bg-accent transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Create Channel</span>
                </button>
              </div>
            </div>
          )}

          {currentView === 'conference' && (
            <div className="h-full flex flex-col p-4">
              {/* Active Conference */}
              {activeConference ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold">{activeConference.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeConference.participantIds.length} participants
                    </p>
                  </div>

                  {/* Conference Controls */}
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                      className={cn(
                        "p-3 rounded-full transition-colors",
                        isVideoEnabled
                          ? "bg-cosmic-500 text-white hover:bg-cosmic-600"
                          : "bg-red-500 text-white hover:bg-red-600"
                      )}
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                      className={cn(
                        "p-3 rounded-full transition-colors",
                        isAudioEnabled
                          ? "bg-cosmic-500 text-white hover:bg-cosmic-600"
                          : "bg-red-500 text-white hover:bg-red-600"
                      )}
                    >
                      {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                      className={cn(
                        "p-3 rounded-full transition-colors",
                        isScreenSharing
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "bg-gray-500 text-white hover:bg-gray-600"
                      )}
                    >
                      {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={handleLeaveConference}
                      className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Participants */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Participants</h4>
                    <div className="space-y-1">
                      {activeConference.participantIds.map(participantId => (
                        <div key={participantId} className="flex items-center space-x-2 p-2 rounded-lg bg-accent">
                          <div className="w-8 h-8 bg-cosmic-500 rounded-full flex items-center justify-center text-white text-sm">
                            {participantId.slice(-2).toUpperCase()}
                          </div>
                          <span className="text-sm">User {participantId}</span>
                          {participantId === activeConference.hostId && (
                            <span className="text-xs bg-cosmic-500 text-white px-2 py-1 rounded">Host</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">Scheduled Conferences</h3>
                  <div className="space-y-2">
                    {conferences
                      .filter(conf => conf.status === 'scheduled' || conf.status === 'active')
                      .map(conference => (
                        <div key={conference.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{conference.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {conference.startTime.toLocaleTimeString()} - {conference.endTime.toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleJoinConference(conference.id)}
                              className="px-3 py-1 bg-cosmic-500 text-white rounded-lg hover:bg-cosmic-600 transition-colors"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  <button className="w-full flex items-center justify-center space-x-2 p-3 border border-dashed border-border rounded-lg hover:bg-accent transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Schedule Conference</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {currentView === 'notifications' && (
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notifications</h3>
                <button
                  onClick={() => communicationService.markAllNotificationsRead(currentUserId)}
                  className="text-sm text-cosmic-500 hover:text-cosmic-600"
                >
                  Mark all read
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 border border-border rounded-lg",
                      !notification.isRead && "bg-cosmic-50 border-cosmic-200"
                    )}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-cosmic-500 rounded-full mt-2"></div>
                      )}
                    </div>
                    
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex space-x-2 mt-2">
                        {notification.actions.map(action => (
                          <button
                            key={action.action}
                            className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded hover:bg-cosmic-100 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'analytics' && metrics && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <h3 className="font-semibold">Communication Analytics</h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-accent rounded-lg text-center">
                  <div className="text-lg font-semibold">{metrics.totalMessages}</div>
                  <div className="text-xs text-muted-foreground">Total Messages</div>
                </div>
                <div className="p-3 bg-accent rounded-lg text-center">
                  <div className="text-lg font-semibold">{metrics.activeUsers}</div>
                  <div className="text-xs text-muted-foreground">Active Users</div>
                </div>
                <div className="p-3 bg-accent rounded-lg text-center">
                  <div className="text-lg font-semibold">{metrics.totalConferences}</div>
                  <div className="text-xs text-muted-foreground">Conferences</div>
                </div>
                <div className="p-3 bg-accent rounded-lg text-center">
                  <div className="text-lg font-semibold">{Math.round(metrics.engagementScore * 100)}%</div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                </div>
              </div>

              {/* Period Stats */}
              <div className="space-y-2">
                <h4 className="font-medium">Period Statistics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages per day:</span>
                    <span>{metrics.periodStats.messagesPerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Voice notes per day:</span>
                    <span>{metrics.periodStats.voiceNotesPerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg conference length:</span>
                    <span>{metrics.periodStats.averageConferenceLength}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participation rate:</span>
                    <span>{Math.round(metrics.periodStats.participationRate * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <h3 className="font-semibold">Communication Settings</h3>
              
              <div className="space-y-4">
                {/* Notification Settings */}
                <div className="space-y-2">
                  <h4 className="font-medium">Notifications</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'messages', label: 'New Messages' },
                      { id: 'conferences', label: 'Conference Invites' },
                      { id: 'mentions', label: 'Mentions' },
                      { id: 'voiceNotes', label: 'Voice Notes' }
                    ].map(({ id, label }) => (
                      <div key={id} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <button className="w-8 h-4 bg-cosmic-500 rounded-full relative">
                          <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language Settings */}
                <div className="space-y-2">
                  <h4 className="font-medium">Language & Translation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-translate messages</span>
                      <button className="w-8 h-4 bg-gray-300 rounded-full relative">
                        <div className="w-3 h-3 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                      </button>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Primary Language</label>
                      <select className="w-full mt-1 p-2 border border-border rounded-lg">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Video Settings */}
                <div className="space-y-2">
                  <h4 className="font-medium">Video & Audio</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-join with video</span>
                      <button className="w-8 h-4 bg-cosmic-500 rounded-full relative">
                        <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-join with audio</span>
                      <button className="w-8 h-4 bg-cosmic-500 rounded-full relative">
                        <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Background blur</span>
                      <button className="w-8 h-4 bg-gray-300 rounded-full relative">
                        <div className="w-3 h-3 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {currentView === 'conference' && activeConference ? (
          /* Video Conference View */
          <div className="flex-1 bg-black relative">
            {/* Video Grid */}
            <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
              {activeConference.participantIds.map(participantId => (
                <div key={participantId} className="bg-gray-800 rounded-lg flex items-center justify-center relative">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-cosmic-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      {participantId.slice(-2).toUpperCase()}
                    </div>
                    <p className="text-sm">User {participantId}</p>
                  </div>
                  {participantId === currentUserId && (
                    <div className="absolute top-2 left-2 text-xs bg-cosmic-500 text-white px-2 py-1 rounded">
                      You
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Screen Share Overlay */}
            {isScreenSharing && (
              <div className="absolute inset-4 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Monitor className="h-12 w-12 mx-auto mb-2" />
                  <p>Screen Sharing Active</p>
                </div>
              </div>
            )}
          </div>
        ) : selectedChannel ? (
          /* Chat Interface */
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedChannel.type === 'text' && <MessageSquare className="h-5 w-5" />}
                {selectedChannel.type === 'voice' && <Mic className="h-5 w-5" />}
                {selectedChannel.type === 'video' && <Video className="h-5 w-5" />}
                <h2 className="font-semibold">{selectedChannel.name}</h2>
                <span className="text-sm text-muted-foreground">
                  {selectedChannel.participantIds.length} members
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-accent rounded-lg">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-accent rounded-lg">
                  <Video className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-accent rounded-lg">
                  <Users className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-accent rounded-lg">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div key={message.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-cosmic-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                    {message.senderId.slice(-2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">User {message.senderId}</span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.isEdited && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                    </div>
                    
                    {message.type === 'text' ? (
                      <p className="text-sm mt-1">{message.content}</p>
                    ) : message.type === 'voice' && message.voiceNoteId ? (
                      <div className="mt-2 p-3 bg-accent rounded-lg max-w-xs">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 bg-cosmic-500 text-white rounded-full">
                            <Play className="h-3 w-3" />
                          </button>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-cosmic-500 rounded-full w-1/3"></div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {voiceNotes.find(v => v.id === message.voiceNoteId)?.duration}s
                          </span>
                        </div>
                        {voiceNotes.find(v => v.id === message.voiceNoteId)?.transcription && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {voiceNotes.find(v => v.id === message.voiceNoteId)?.transcription}
                          </p>
                        )}
                      </div>
                    ) : null}

                    {/* Reactions */}
                    {message.reactions.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        {message.reactions.map(reaction => (
                          <button
                            key={reaction.emoji}
                            className="flex items-center space-x-1 px-2 py-1 bg-accent rounded-full text-xs hover:bg-cosmic-100 transition-colors"
                          >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Message #${selectedChannel.name}`}
                    className="w-full pl-4 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button className="p-1 hover:bg-accent rounded">
                      <Smile className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-1 hover:bg-accent rounded">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                
                <button className="p-2 hover:bg-accent rounded-lg">
                  <Mic className="h-4 w-4" />
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-2 bg-cosmic-500 text-white rounded-lg hover:bg-cosmic-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* No Channel Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Select a channel to start communicating</h3>
              <p className="text-muted-foreground">
                Choose a channel from the sidebar or create a new one to begin your conversation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedCommunication;