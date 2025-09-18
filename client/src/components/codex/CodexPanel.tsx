/**
 * Codex Panel Component
 * Interactive world-building element manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import { codexSystemService, CodexElement, CodexElementType, CodexSearchResult } from '@/services/codexSystemService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Modal } from '../ui/Modal';
import { 
  Search, 
  Plus, 
  Filter, 
  Grid, 
  List, 
  Share2, 
  Archive,
  Edit,
  Trash2,
  Link,
  Image,
  Tag,
  ChevronRight,
  Users,
  MapPin,
  Package,
  Building,
  Calendar,
  Globe,
  BookOpen,
  Zap,
  Shield
} from 'lucide-react';

interface CodexPanelProps {
  projectId: string;
  onElementSelect?: (element: CodexElement) => void;
  className?: string;
}

export function CodexPanel({ projectId, onElementSelect, className }: CodexPanelProps) {
  const [elements, setElements] = useState<CodexElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<CodexElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CodexElementType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'graph'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Form state for new/edit element
  const [formData, setFormData] = useState({
    type: 'character' as CodexElementType,
    name: '',
    summary: '',
    description: '',
    tags: [] as string[],
    attributes: {} as Record<string, any>
  });

  useEffect(() => {
    loadElements();
    loadStats();

    const handleElementCreated = () => loadElements();
    const handleElementUpdated = () => loadElements();
    const handleElementDeleted = () => loadElements();

    codexSystemService.on('elementCreated', handleElementCreated);
    codexSystemService.on('elementUpdated', handleElementUpdated);
    codexSystemService.on('elementDeleted', handleElementDeleted);

    return () => {
      codexSystemService.off('elementCreated', handleElementCreated);
      codexSystemService.off('elementUpdated', handleElementUpdated);
      codexSystemService.off('elementDeleted', handleElementDeleted);
    };
  }, [projectId]);

  const loadElements = () => {
    const results = codexSystemService.searchElements('', { projectId });
    setElements(results.map(r => r.element));
  };

  const loadStats = () => {
    setStats(codexSystemService.getStats(projectId));
  };

  const filteredElements = useMemo(() => {
    let filtered = elements;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(el => el.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const results = codexSystemService.searchElements(searchQuery, {
        projectId,
        types: selectedType !== 'all' ? [selectedType] : undefined
      });
      filtered = results.map(r => r.element);
    }

    return filtered;
  }, [elements, selectedType, searchQuery, projectId]);

  const getTypeIcon = (type: CodexElementType) => {
    const icons = {
      character: Users,
      location: MapPin,
      item: Package,
      organization: Building,
      event: Calendar,
      magic_system: Zap,
      technology: Zap,
      language: Globe,
      culture: Globe,
      creature: Shield,
      concept: BookOpen,
      custom: BookOpen
    };
    return icons[type] || BookOpen;
  };

  const handleCreateElement = () => {
    const element = codexSystemService.createElement(
      projectId,
      formData.type,
      formData.name,
      {
        summary: formData.summary,
        description: formData.description,
        tags: formData.tags,
        attributes: formData.attributes
      }
    );

    setIsCreateModalOpen(false);
    resetForm();
    setSelectedElement(element);
  };

  const handleUpdateElement = () => {
    if (!selectedElement) return;

    codexSystemService.updateElement(selectedElement.id, {
      name: formData.name,
      summary: formData.summary,
      description: formData.description,
      tags: formData.tags,
      attributes: formData.attributes
    });

    setIsEditModalOpen(false);
    resetForm();
  };

  const handleDeleteElement = (element: CodexElement) => {
    if (confirm(`Delete "${element.name}"?`)) {
      codexSystemService.deleteElement(element.id);
      if (selectedElement?.id === element.id) {
        setSelectedElement(null);
      }
    }
  };

  const handleArchiveElement = (element: CodexElement) => {
    codexSystemService.archiveElement(element.id);
  };

  const resetForm = () => {
    setFormData({
      type: 'character',
      name: '',
      summary: '',
      description: '',
      tags: [],
      attributes: {}
    });
  };

  const openEditModal = (element: CodexElement) => {
    setSelectedElement(element);
    setFormData({
      type: element.type,
      name: element.name,
      summary: element.summary,
      description: element.description,
      tags: element.tags,
      attributes: element.attributes
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Codex</h2>
          {stats && (
            <Badge variant="secondary">
              {stats.totalElements} elements
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'graph' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('graph')}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Element
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
        <div className="flex-1">
          <Input
            placeholder="Search codex..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Types</option>
          <option value="character">Characters</option>
          <option value="location">Locations</option>
          <option value="item">Items</option>
          <option value="organization">Organizations</option>
          <option value="event">Events</option>
          <option value="magic_system">Magic Systems</option>
          <option value="technology">Technology</option>
          <option value="culture">Cultures</option>
          <option value="creature">Creatures</option>
          <option value="concept">Concepts</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filteredElements.map((element) => {
              const Icon = getTypeIcon(element.type);
              return (
                <Card
                  key={element.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedElement(element);
                    onElementSelect?.(element);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Icon 
                        className="w-5 h-5" 
                        style={{ color: element.color }}
                      />
                      <Badge variant="outline" className="text-xs">
                        {element.type}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">
                      {element.name}
                    </h3>

                    {element.aliases.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2">
                        aka {element.aliases.join(', ')}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {element.summary}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      {element.relationships.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Link className="w-3 h-3 mr-1" />
                          {element.relationships.length}
                        </Badge>
                      )}
                      {element.mentions.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {element.mentions.length} mentions
                        </Badge>
                      )}
                    </div>

                    {element.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {element.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 p-2 border-t bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(element);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveElement(element);
                      }}
                    >
                      <Archive className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteElement(element);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="divide-y">
            {filteredElements.map((element) => {
              const Icon = getTypeIcon(element.type);
              return (
                <div
                  key={element.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedElement(element);
                    onElementSelect?.(element);
                  }}
                >
                  <Icon 
                    className="w-5 h-5 flex-shrink-0" 
                    style={{ color: element.color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {element.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {element.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {element.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {element.relationships.length > 0 && (
                      <Badge variant="secondary">
                        {element.relationships.length} links
                      </Badge>
                    )}
                    {element.mentions.length > 0 && (
                      <Badge variant="secondary">
                        {element.mentions.length} mentions
                      </Badge>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'graph' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Share2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Relationship graph visualization</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Element' : 'Create New Element'}
      >
        <div className="space-y-4">
          {!isEditModalOpen && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CodexElementType })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="character">Character</option>
                <option value="location">Location</option>
                <option value="item">Item</option>
                <option value="organization">Organization</option>
                <option value="event">Event</option>
                <option value="magic_system">Magic System</option>
                <option value="technology">Technology</option>
                <option value="culture">Culture</option>
                <option value="creature">Creature</option>
                <option value="concept">Concept</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <Input
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief summary..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description..."
              className="w-full px-3 py-2 border rounded-lg"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <Input
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              })}
              placeholder="Enter tags, separated by commas..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditModalOpen ? handleUpdateElement : handleCreateElement}
              disabled={!formData.name}
            >
              {isEditModalOpen ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CodexPanel;