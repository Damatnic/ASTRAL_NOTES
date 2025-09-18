/**
 * Advanced Search Page
 * Comprehensive search functionality with AI-powered suggestions and advanced filtering
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Search as SearchIcon, 
  BookOpen,
  Users,
  MapPin,
  Star,
  TrendingUp,
  Zap,
  Package,
  MessageSquare,
  Scales,
  FileText,
  Clock,
  Filter,
  BarChart3,
  Activity,
  Brain,
  Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useProjects } from '@/hooks/useProjects';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import { SemanticSearch } from '@/components/search/SemanticSearch';
import { searchService } from '@/services/searchService';
import type { SearchResult } from '@/types/story';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projects, currentProject } = useProjects();
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('semantic');

  // Get initial query from URL params
  const initialQuery = searchParams.get('q') || '';
  const projectId = searchParams.get('project') || currentProject?.id;

  // Load search statistics
  useEffect(() => {
    if (projectId) {
      const stats = searchService.getSearchStats(projectId);
      setSearchStats(stats);
      
      // Build search index for the project
      searchService.buildSearchIndex(projectId);
    }
  }, [projectId]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleResultSelect = (result: SearchResult) => {
    // Save search to recent searches
    const query = searchParams.get('q');
    if (query) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }

    // Navigate to the result
    handleNavigate(result.id, result.type);
  };

  const handleNavigate = (id: string, type: string) => {
    switch (type) {
      case 'note':
        navigate(`/projects/${projectId}/notes/${id}`);
        break;
      case 'character':
        navigate(`/projects/${projectId}/characters/${id}`);
        break;
      case 'location':
        navigate(`/projects/${projectId}/locations/${id}`);
        break;
      case 'item':
        navigate(`/projects/${projectId}/items/${id}`);
        break;
      case 'plotthread':
        navigate(`/projects/${projectId}/plot-threads/${id}`);
        break;
      case 'scene':
        navigate(`/projects/${projectId}/scenes/${id}`);
        break;
      default:
        navigate(`/projects/${projectId}`);
    }
  };

  const quickSearches = [
    { label: 'Characters', query: 'type:character', icon: Users },
    { label: 'Locations', query: 'type:location', icon: MapPin },
    { label: 'Plot Threads', query: 'type:plotthread', icon: Zap },
    { label: 'Scenes', query: 'type:scene', icon: MessageSquare },
    { label: 'Research', query: 'type:research', icon: BookOpen },
    { label: 'Recent Notes', query: 'updated:week', icon: Clock }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" data-testid="search">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-cosmic-500 to-cosmic-600 rounded-lg text-white">
            <SearchIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Search</h1>
            <p className="text-muted-foreground">
              Find anything across your projects with AI-powered search
            </p>
          </div>
        </div>

        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Search in:</span>
            <select
              value={projectId || ''}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) {
                  newParams.set('project', e.target.value);
                } else {
                  newParams.delete('project');
                }
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border rounded bg-background"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Search Area */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semantic" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Semantic Search
              </TabsTrigger>
              <TabsTrigger value="traditional" className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4" />
                Traditional Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="semantic" className="space-y-4">
              <SemanticSearch />
            </TabsContent>

            <TabsContent value="traditional" className="space-y-4">
              <AdvancedSearch
                projectId={projectId}
                onResultSelect={handleResultSelect}
                onNavigate={handleNavigate}
                autoFocus={activeTab === 'traditional'}
                placeholder="Search notes, characters, locations, plot threads..."
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Searches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickSearches.map((search, index) => {
                const IconComponent = search.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('q', search.query);
                      setSearchParams(newParams);
                    }}
                    className="w-full p-3 text-left hover:bg-muted rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{search.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('q', search);
                      setSearchParams(newParams);
                    }}
                    className="w-full p-2 text-left hover:bg-muted rounded text-sm transition-colors"
                  >
                    {search}
                  </button>
                ))}
                {recentSearches.length > 5 && (
                  <button
                    onClick={() => setRecentSearches([])}
                    className="w-full p-2 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear Recent Searches
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search Statistics */}
          {searchStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Search Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Items</span>
                    <Badge variant="outline">{searchStats.totalItems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Words</span>
                    <Badge variant="outline">{searchStats.totalWords.toLocaleString()}</Badge>
                  </div>
                  
                  {/* Content Type Breakdown */}
                  <div className="space-y-2 pt-2 border-t">
                    <span className="text-sm font-medium">Content Types</span>
                    {Object.entries(searchStats.itemsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground capitalize">{type}</span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Last indexed: {new Date(searchStats.lastIndexed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                Search Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Use quotes for exact phrases: "dark forest"</p>
              <p>• Filter by type: type:character</p>
              <p>• Search by tag: tag:important</p>
              <p>• Use [[links]] to connect content</p>
              <p>• Fuzzy search finds similar words</p>
              <p>• Date filters: updated:week, created:month</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Empty State for No Project Selected */}
      {!projectId && projects.length > 0 && (
        <div className="mt-12 text-center">
          <div className="p-8">
            <div className="w-16 h-16 bg-gradient-to-r from-cosmic-500 to-cosmic-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <SearchIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select a Project to Search</h3>
            <p className="text-muted-foreground mb-6">
              Choose a project from the dropdown above to start searching through your notes, characters, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {projects.slice(0, 3).map(project => (
                <Button
                  key={project.id}
                  variant="outline"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('project', project.id);
                    setSearchParams(newParams);
                  }}
                >
                  Search in {project.title}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
