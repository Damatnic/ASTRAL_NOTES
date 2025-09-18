import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  Share2, 
  Users, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  Star,
  Download,
  Upload,
  Plus,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Link,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Select } from '../ui/Select';
import { Tabs } from '../ui/Tabs';

interface UniverseManagerProps {
  projectId?: string;
  onEntityImport?: (entityId: string, importType: 'reference' | 'clone') => void;
  onEntityShare?: (entityId: string, universeId: string) => void;
}

interface Universe {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  owners: string[];
  editors: string[];
  viewers: string[];
  entityCount: number;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  color?: string;
}

interface SharedEntity {
  id: string;
  type: 'character' | 'location' | 'item' | 'lore' | 'organization' | 'concept';
  name: string;
  description: string;
  category?: string;
  importance: number;
  isUniversal: boolean;
  universeId?: string;
  ownerId: string;
  ownerName: string;
  usageCount: number;
  tags: string[];
  avatar?: string;
  color?: string;
  lastModified: Date;
  conflictStatus?: 'none' | 'minor' | 'major';
}

interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  universeId: string;
  universeName: string;
  requestedRole: 'editor' | 'viewer';
  message?: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Date;
}

export const UniverseManager: React.FC<UniverseManagerProps> = ({
  projectId,
  onEntityImport,
  onEntityShare
}) => {
  const [activeTab, setActiveTab] = useState('explore');
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [myUniverses, setMyUniverses] = useState<Universe[]>([]);
  const [entities, setEntities] = useState<SharedEntity[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showCreateUniverse, setShowCreateUniverse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load data
  useEffect(() => {
    loadUniverses();
    loadMyUniverses();
    loadAccessRequests();
  }, []);

  useEffect(() => {
    if (selectedUniverse) {
      loadUniverseEntities(selectedUniverse.id);
    }
  }, [selectedUniverse]);

  const loadUniverses = async () => {
    setIsLoading(true);
    try {
      // API call to fetch public universes
      const response = await fetch('/api/universes/public');
      const data = await response.json();
      setUniverses(data);
    } catch (error) {
      console.error('Error loading universes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyUniverses = async () => {
    try {
      // API call to fetch user's universes
      const response = await fetch('/api/universes/my');
      const data = await response.json();
      setMyUniverses(data);
    } catch (error) {
      console.error('Error loading my universes:', error);
    }
  };

  const loadUniverseEntities = async (universeId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/universes/${universeId}/entities`);
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      console.error('Error loading universe entities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccessRequests = async () => {
    try {
      const response = await fetch('/api/universes/access-requests');
      const data = await response.json();
      setAccessRequests(data);
    } catch (error) {
      console.error('Error loading access requests:', error);
    }
  };

  const handleCreateUniverse = async (universeData: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    try {
      const response = await fetch('/api/universes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(universeData)
      });
      
      if (response.ok) {
        const newUniverse = await response.json();
        setMyUniverses(prev => [...prev, newUniverse]);
        setShowCreateUniverse(false);
      }
    } catch (error) {
      console.error('Error creating universe:', error);
    }
  };

  const handleRequestAccess = async (universeId: string, role: 'editor' | 'viewer', message?: string) => {
    try {
      const response = await fetch('/api/universes/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universeId, role, message })
      });
      
      if (response.ok) {
        // Show success message
        console.log('Access request sent');
      }
    } catch (error) {
      console.error('Error requesting access:', error);
    }
  };

  const handleImportEntity = useCallback((entity: SharedEntity, importType: 'reference' | 'clone') => {
    if (onEntityImport) {
      onEntityImport(entity.id, importType);
    }
  }, [onEntityImport]);

  const handleShareEntity = useCallback((entityId: string, universeId: string) => {
    if (onEntityShare) {
      onEntityShare(entityId, universeId);
    }
  }, [onEntityShare]);

  const handleReviewAccessRequest = async (requestId: string, decision: 'approved' | 'denied') => {
    try {
      const response = await fetch(`/api/universes/access-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      
      if (response.ok) {
        setAccessRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Error reviewing access request:', error);
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = entityFilter === 'all' || entity.type === entityFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'usage':
        return b.usageCount - a.usageCount;
      case 'importance':
        return b.importance - a.importance;
      case 'modified':
        return b.lastModified.getTime() - a.lastModified.getTime();
      default:
        return 0;
    }
  });

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'character': return 'bg-blue-100 text-blue-800';
      case 'location': return 'bg-green-100 text-green-800';
      case 'item': return 'bg-purple-100 text-purple-800';
      case 'lore': return 'bg-yellow-100 text-yellow-800';
      case 'organization': return 'bg-red-100 text-red-800';
      case 'concept': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceStars = (importance: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < importance ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const tabs = [
    { id: 'explore', label: 'Explore Universes', icon: Globe },
    { id: 'my-universes', label: 'My Universes', icon: Star },
    { id: 'access-requests', label: 'Access Requests', icon: Users, badge: accessRequests.length }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Universe Manager</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateUniverse(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Universe
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="border-b border-gray-200"
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'explore' && (
          <div className="h-full flex">
            {/* Universe List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <Input
                    placeholder="Search universes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <Select
                    value={sortBy}
                    onChange={(value) => setSortBy(value)}
                    options={[
                      { value: 'name', label: 'Name' },
                      { value: 'entities', label: 'Entity Count' },
                      { value: 'updated', label: 'Last Updated' }
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  {universes.map(universe => (
                    <Card
                      key={universe.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedUniverse?.id === universe.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedUniverse(universe)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar
                          src={universe.avatar}
                          alt={universe.name}
                          fallback={universe.name.charAt(0)}
                          size="sm"
                          className={universe.color ? `bg-${universe.color}` : ''}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {universe.name}
                            </h3>
                            {universe.isPublic ? (
                              <Unlock className="w-3 h-3 text-green-500" />
                            ) : (
                              <Lock className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {universe.description}
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span>{universe.entityCount} entities</span>
                            <span>{universe.owners.length + universe.editors.length + universe.viewers.length} collaborators</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Entity Browser */}
            <div className="flex-1 flex flex-col">
              {selectedUniverse ? (
                <>
                  {/* Universe Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={selectedUniverse.avatar}
                          alt={selectedUniverse.name}
                          fallback={selectedUniverse.name.charAt(0)}
                          size="md"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {selectedUniverse.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedUniverse.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestAccess(selectedUniverse.id, 'viewer')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Request Access
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Entity Controls */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Input
                        placeholder="Search entities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={entityFilter}
                        onChange={(value) => setEntityFilter(value)}
                        options={[
                          { value: 'all', label: 'All Types' },
                          { value: 'character', label: 'Characters' },
                          { value: 'location', label: 'Locations' },
                          { value: 'item', label: 'Items' },
                          { value: 'lore', label: 'Lore' },
                          { value: 'organization', label: 'Organizations' },
                          { value: 'concept', label: 'Concepts' }
                        ]}
                      />
                      <Select
                        value={sortBy}
                        onChange={(value) => setSortBy(value)}
                        options={[
                          { value: 'name', label: 'Name' },
                          { value: 'type', label: 'Type' },
                          { value: 'usage', label: 'Usage' },
                          { value: 'importance', label: 'Importance' },
                          { value: 'modified', label: 'Last Modified' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* Entity List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        Loading entities...
                      </div>
                    ) : filteredEntities.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No entities found
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredEntities.map(entity => (
                          <Card key={entity.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                              <Avatar
                                src={entity.avatar}
                                alt={entity.name}
                                fallback={entity.name.charAt(0)}
                                size="sm"
                                className={entity.color ? `bg-${entity.color}` : ''}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {entity.name}
                                  </h4>
                                  <Badge 
                                    className={getEntityTypeColor(entity.type)}
                                    size="sm"
                                  >
                                    {entity.type}
                                  </Badge>
                                  {entity.conflictStatus && entity.conflictStatus !== 'none' && (
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {entity.description}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    {getImportanceStars(entity.importance)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Used {entity.usageCount} times
                                  </div>
                                </div>
                                
                                {entity.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {entity.tags.slice(0, 3).map(tag => (
                                      <Badge key={tag} variant="outline" size="sm">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {entity.tags.length > 3 && (
                                      <Badge variant="outline" size="sm">
                                        +{entity.tags.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs text-gray-500">
                                by {entity.ownerName}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleImportEntity(entity, 'reference')}
                                >
                                  <Link className="w-3 h-3 mr-1" />
                                  Reference
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleImportEntity(entity, 'clone')}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Clone
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a universe to browse its entities
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'my-universes' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myUniverses.map(universe => (
                <Card key={universe.id} className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar
                      src={universe.avatar}
                      alt={universe.name}
                      fallback={universe.name.charAt(0)}
                      size="md"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{universe.name}</h3>
                      <p className="text-sm text-gray-600">{universe.description}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {universe.isPublic ? (
                        <Unlock className="w-4 h-4 text-green-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{universe.entityCount} entities</span>
                    <span>{universe.owners.length + universe.editors.length + universe.viewers.length} collaborators</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'access-requests' && (
          <div className="p-4">
            {accessRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending access requests
              </div>
            ) : (
              <div className="space-y-4">
                {accessRequests.map(request => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          alt={request.requesterName}
                          fallback={request.requesterName.charAt(0)}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.requesterName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Requests {request.requestedRole} access to "{request.universeName}"
                          </p>
                          {request.message && (
                            <p className="text-sm text-gray-500 mt-1">
                              "{request.message}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Requested {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewAccessRequest(request.id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewAccessRequest(request.id, 'denied')}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Universe Modal */}
      {showCreateUniverse && (
        <CreateUniverseModal
          onSubmit={handleCreateUniverse}
          onCancel={() => setShowCreateUniverse(false)}
        />
      )}
    </div>
  );
};

// Create Universe Modal Component
interface CreateUniverseModalProps {
  onSubmit: (data: { name: string; description?: string; isPublic: boolean }) => void;
  onCancel: () => void;
}

const CreateUniverseModal: React.FC<CreateUniverseModalProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Universe</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universe Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter universe name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your universe"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Make this universe public</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Public universes can be discovered and accessed by other users
            </p>
          </div>
          
          <div className="flex items-center space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Create Universe
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};