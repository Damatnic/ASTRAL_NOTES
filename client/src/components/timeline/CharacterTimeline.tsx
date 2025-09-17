/**
 * Character Timeline Component
 * Shows timeline from a specific character's perspective
 */

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import TimelineEvent from './TimelineEvent';
import type { Character, Scene, TimelineEvent as TEvent } from '@/types/story';
import { 
  User,
  Heart,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  MapPin,
  Users,
  MessageSquare,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';

interface CharacterTimelineProps {
  character: Character;
  events: TEvent[];
  scenes: Scene[];
  scale: {
    unit: string;
    zoom: number;
    pixelsPerUnit: number;
  };
  selectedEvents: Set<string>;
  onEventSelect: (eventId: string, multi: boolean) => void;
  onEventEdit: (event: TEvent) => void;
  className?: string;
}

interface CharacterArc {
  phase: 'introduction' | 'rising' | 'climax' | 'falling' | 'resolution';
  emotionalState: number; // -100 to 100
  relationships: Array<{
    characterId: string;
    strength: number; // -100 to 100
    type: 'ally' | 'enemy' | 'neutral' | 'romantic';
  }>;
  goals: string[];
  conflicts: string[];
}

export function CharacterTimeline({
  character,
  events,
  scenes,
  scale,
  selectedEvents,
  onEventSelect,
  onEventEdit,
  className
}: CharacterTimelineProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [arcView, setArcView] = useState<'timeline' | 'emotional' | 'relationships'>('timeline');
  const [filters, setFilters] = useState({
    showDialogue: true,
    showActions: true,
    showThoughts: true,
    showInteractions: true
  });

  // Calculate character arc data from events
  const calculateCharacterArc = (): CharacterArc[] => {
    const arcPoints: CharacterArc[] = [];
    
    events.forEach((event, index) => {
      const scene = scenes.find(s => s.id === event.sceneId);
      if (!scene) return;
      
      // Determine arc phase based on position in story
      const progress = index / events.length;
      let phase: CharacterArc['phase'] = 'introduction';
      if (progress < 0.2) phase = 'introduction';
      else if (progress < 0.5) phase = 'rising';
      else if (progress < 0.6) phase = 'climax';
      else if (progress < 0.8) phase = 'falling';
      else phase = 'resolution';
      
      // Calculate emotional state from scene metadata
      let emotionalState = 0;
      if (scene.metadata?.mood) {
        const moodScores: Record<string, number> = {
          happy: 80,
          excited: 70,
          hopeful: 60,
          neutral: 0,
          tense: -30,
          sad: -60,
          angry: -70,
          desperate: -80
        };
        emotionalState = moodScores[scene.metadata.mood] || 0;
      }
      
      // Extract relationships from scene
      const relationships: CharacterArc['relationships'] = [];
      if (scene.metadata?.characters) {
        scene.metadata.characters.forEach(charName => {
          const otherChar = charName; // In real app, would look up character by name
          if (otherChar !== character.name) {
            relationships.push({
              characterId: otherChar,
              strength: 50, // Would be calculated from interactions
              type: 'neutral'
            });
          }
        });
      }
      
      arcPoints.push({
        phase,
        emotionalState,
        relationships,
        goals: character.goals || [],
        conflicts: character.conflicts || []
      });
    });
    
    return arcPoints;
  };

  const arcData = calculateCharacterArc();

  // Calculate timeline range
  const getTimelineRange = () => {
    const times = events
      .map(e => e.storyTime ? new Date(e.storyTime).getTime() : null)
      .filter(Boolean) as number[];
    
    if (times.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }
    
    return {
      start: new Date(Math.min(...times)),
      end: new Date(Math.max(...times))
    };
  };

  const range = getTimelineRange();
  const totalDays = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
  const trackWidth = Math.max(totalDays * scale.pixelsPerUnit, 1000);

  // Group events by type
  const eventsByType = {
    dialogue: events.filter(e => e.metadata?.type === 'dialogue'),
    action: events.filter(e => e.metadata?.type === 'action'),
    thought: events.filter(e => e.metadata?.type === 'thought'),
    interaction: events.filter(e => e.metadata?.type === 'interaction')
  };

  // Calculate event position
  const getEventPosition = (event: TEvent): number => {
    if (!event.storyTime) return 0;
    
    const eventTime = new Date(event.storyTime).getTime();
    const startTime = range.start.getTime();
    const daysSinceStart = (eventTime - startTime) / (1000 * 60 * 60 * 24);
    
    return daysSinceStart * scale.pixelsPerUnit;
  };

  const renderTimelineView = () => (
    <div className="relative" style={{ width: trackWidth, height: '300px' }}>
      {/* Character presence indicator */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-cosmic-100/20 to-transparent" />
      
      {/* Timeline axis */}
      <div className="absolute top-10 left-0 right-0 h-px bg-border" />
      
      {/* Character events */}
      <div className="relative pt-12">
        {events.map((event, index) => {
          const position = getEventPosition(event);
          const scene = scenes.find(s => s.id === event.sceneId);
          
          return (
            <div
              key={event.id}
              className="absolute"
              style={{ 
                left: `${position}px`,
                top: `${(index % 3) * 50}px`
              }}
            >
              <TimelineEvent
                event={event}
                scene={scene}
                isSelected={selectedEvents.has(event.id)}
                scale={scale}
                type="story"
                onSelect={onEventSelect}
                onEdit={onEventEdit}
              />
              
              {/* Character-specific indicators */}
              {event.metadata?.characterRole && (
                <Badge 
                  variant="outline" 
                  className="absolute -top-2 left-0 text-xs"
                >
                  {event.metadata.characterRole}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Emotional arc overlay */}
      <svg className="absolute inset-0 pointer-events-none" style={{ width: trackWidth, height: '300px' }}>
        <polyline
          points={arcData.map((arc, i) => {
            const x = (i / arcData.length) * trackWidth;
            const y = 150 - (arc.emotionalState * 1.2); // Center at 150px, scale emotion
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="url(#emotionGradient)"
          strokeWidth="2"
          opacity="0.7"
        />
        <defs>
          <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  const renderEmotionalArcView = () => (
    <div className="emotional-arc-view p-4">
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Emotional Journey</h4>
        <div className="relative h-64 bg-muted/20 rounded-lg p-4">
          <svg className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="0" y1="25%" x2="100%" y2="25%" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="0" y1="75%" x2="100%" y2="75%" stroke="currentColor" strokeOpacity="0.1" />
            
            {/* Emotional arc line */}
            <polyline
              points={arcData.map((arc, i) => {
                const x = (i / (arcData.length - 1)) * 100;
                const y = 50 - (arc.emotionalState / 2); // Normalize to 0-100%
                return `${x}%,${y}%`;
              }).join(' ')}
              fill="none"
              stroke="url(#emotionGradient2)"
              strokeWidth="3"
            />
            
            {/* Arc phase indicators */}
            {arcData.map((arc, i) => {
              const x = (i / (arcData.length - 1)) * 100;
              const y = 50 - (arc.emotionalState / 2);
              
              return (
                <g key={i}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={arc.emotionalState > 0 ? '#10b981' : '#ef4444'}
                  />
                  {i % 3 === 0 && (
                    <text
                      x={`${x}%`}
                      y="95%"
                      textAnchor="middle"
                      className="text-xs fill-muted-foreground"
                    >
                      {arc.phase}
                    </text>
                  )}
                </g>
              );
            })}
            
            <defs>
              <linearGradient id="emotionGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Emotion labels */}
          <div className="absolute top-2 left-2 text-xs text-green-500">Positive</div>
          <div className="absolute bottom-2 left-2 text-xs text-red-500">Negative</div>
        </div>
      </div>
      
      {/* Emotional milestones */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Key Emotional Moments</h5>
        {arcData
          .filter((arc, i) => Math.abs(arc.emotionalState) > 60)
          .map((arc, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
              {arc.emotionalState > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {arc.phase}: {Math.abs(arc.emotionalState)}% intensity
              </span>
            </div>
          ))}
      </div>
    </div>
  );

  const renderRelationshipsView = () => (
    <div className="relationships-view p-4">
      <h4 className="font-semibold mb-4">Character Relationships Over Time</h4>
      
      {/* Relationship graph */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from(new Set(
          arcData.flatMap(arc => arc.relationships.map(r => r.characterId))
        )).map(charId => {
          const relationshipProgression = arcData.map(arc => {
            const rel = arc.relationships.find(r => r.characterId === charId);
            return rel ? rel.strength : 0;
          });
          
          return (
            <Card key={charId} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{charId}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {relationshipProgression[relationshipProgression.length - 1] > 0 ? 'Ally' : 'Rival'}
                </Badge>
              </div>
              
              <div className="h-20 relative">
                <svg className="w-full h-full">
                  <polyline
                    points={relationshipProgression.map((strength, i) => {
                      const x = (i / (relationshipProgression.length - 1)) * 100;
                      const y = 50 - (strength / 2);
                      return `${x}%,${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke={relationshipProgression[relationshipProgression.length - 1] > 0 ? '#10b981' : '#ef4444'}
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Interaction summary */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <h5 className="text-sm font-medium mb-2">Interaction Summary</h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{events.filter(e => e.metadata?.type === 'dialogue').length} dialogues</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{events.filter(e => e.metadata?.type === 'interaction').length} interactions</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{events.filter(e => e.metadata?.conflict).length} conflicts</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{arcData.filter(a => a.relationships.some(r => r.type === 'romantic')).length} romantic moments</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={cn("character-timeline", className)}>
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cosmic-100 flex items-center justify-center">
              <User className="h-5 w-5 text-cosmic-700" />
            </div>
            <div>
              <h3 className="font-semibold">{character.name}</h3>
              <p className="text-xs text-muted-foreground">
                {character.role} • {events.length} events
              </p>
            </div>
          </div>
          
          {/* View selector */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={arcView === 'timeline' ? 'default' : 'ghost'}
              onClick={() => setArcView('timeline')}
            >
              <Activity className="h-4 w-4 mr-1" />
              Timeline
            </Button>
            <Button
              size="sm"
              variant={arcView === 'emotional' ? 'default' : 'ghost'}
              onClick={() => setArcView('emotional')}
            >
              <Heart className="h-4 w-4 mr-1" />
              Emotional
            </Button>
            <Button
              size="sm"
              variant={arcView === 'relationships' ? 'default' : 'ghost'}
              onClick={() => setArcView('relationships')}
            >
              <Users className="h-4 w-4 mr-1" />
              Relationships
            </Button>
          </div>
        </div>
      </div>
      
      {/* Character Stats */}
      <div className="p-3 border-b bg-muted/30">
        <div className="grid grid-cols-5 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">First Appears</div>
            <div className="font-medium">
              {events[0]?.storyTime 
                ? new Date(events[0].storyTime).toLocaleDateString()
                : 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Last Seen</div>
            <div className="font-medium">
              {events[events.length - 1]?.storyTime 
                ? new Date(events[events.length - 1].storyTime).toLocaleDateString()
                : 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Total Scenes</div>
            <div className="font-medium">{events.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Word Count</div>
            <div className="font-medium">
              {scenes
                .filter(s => events.some(e => e.sceneId === s.id))
                .reduce((sum, s) => sum + (s.wordCount || 0), 0)
                .toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Arc Completion</div>
            <div className="font-medium">
              {Math.round((events.length / scenes.length) * 100)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="overflow-x-auto p-4">
        {arcView === 'timeline' && renderTimelineView()}
        {arcView === 'emotional' && renderEmotionalArcView()}
        {arcView === 'relationships' && renderRelationshipsView()}
      </div>
      
      {/* Footer */}
      <div className="border-t p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Character arc analysis powered by story metadata
          </div>
          <Button size="sm" variant="ghost" className="h-6 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export Arc
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CharacterTimeline;