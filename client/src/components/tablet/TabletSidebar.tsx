/**
 * TabletSidebar Component
 * Touch-optimized sidebar for tablet interfaces with collapsible sections
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { Project, Scene, Character } from '@/types/story';
import {
  Search,
  FileText,
  Users,
  MapPin,
  Clock,
  Plus,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  Edit3
} from 'lucide-react';

export interface TabletSidebarProps {
  project: Project;
  scenes: Scene[];
  characters: Character[];
  currentView: string;
  onViewChange?: (viewId: string) => void;
  onSceneSelect?: (sceneId: string) => void;
  onClose?: () => void;
  className?: string;
}

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  isExpanded: boolean;
  items: any[];
}

export const TabletSidebar: React.FC<TabletSidebarProps> = ({
  project,
  scenes,
  characters,
  currentView,
  onViewChange,
  onSceneSelect,
  onClose,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState<SidebarSection[]>([
    {
      id: 'scenes',
      title: 'Scenes',
      icon: FileText,
      isExpanded: true,
      items: scenes
    },
    {
      id: 'characters',
      title: 'Characters',
      icon: Users,
      isExpanded: false,
      items: characters
    },
    {
      id: 'locations',
      title: 'Locations',
      icon: MapPin,
      isExpanded: false,
      items: [] // Would be populated with location data
    }
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  const filteredScenes = scenes.filter(scene =>
    scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scene.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSceneItem = (scene: Scene) => (
    <motion.button
      key={scene.id}
      onClick={() => onSceneSelect?.(scene.id)}
      className="w-full p-3 text-left hover:bg-muted/50 rounded-lg transition-colors group"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-xs font-bold text-primary">
            {scene.order || '#'}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {scene.title}
          </h4>
          {scene.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {scene.summary}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{scene.characters.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{scene.wordCount} words</span>
            </div>
            {scene.metadata?.importance && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                <span>{scene.metadata.importance}/10</span>
              </div>
            )}
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
    </motion.button>
  );

  const renderCharacterItem = (character: Character) => (
    <motion.div
      key={character.id}
      className="p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {character.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{character.name}</h4>
          {character.role && (
            <p className="text-xs text-muted-foreground">{character.role}</p>
          )}
        </div>
        
        <Badge variant="outline" className="text-xs">
          {character.scenes?.length || 0}
        </Badge>
      </div>
    </motion.div>
  );

  const renderSection = (section: SidebarSection) => {
    let filteredItems = section.items;
    
    if (searchQuery) {
      if (section.id === 'scenes') {
        filteredItems = filteredScenes;
      } else if (section.id === 'characters') {
        filteredItems = filteredCharacters;
      }
    }

    return (
      <Card key={section.id} className="mb-3">
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <section.icon className="h-5 w-5 text-primary" />
            <span className="font-medium">{section.title}</span>
            <Badge variant="outline" className="text-xs">
              {filteredItems.length}
            </Badge>
          </div>
          {section.isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        <AnimatePresence>
          {section.isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-2 pb-2 space-y-1 max-h-[300px] overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchQuery ? 'No results found' : `No ${section.title.toLowerCase()} yet`}
                  </div>
                ) : (
                  filteredItems.map(item => 
                    section.id === 'scenes' 
                      ? renderSceneItem(item)
                      : renderCharacterItem(item)
                  )
                )}
              </div>
              
              {/* Add new item button */}
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {section.title.slice(0, -1)}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  return (
    <div className={cn("tablet-sidebar h-full flex flex-col bg-background border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">{project.title}</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scenes, characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {sections.map(renderSection)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{scenes.length} scenes</span>
          <span>{characters.length} characters</span>
        </div>
      </div>
    </div>
  );
};

export default TabletSidebar;