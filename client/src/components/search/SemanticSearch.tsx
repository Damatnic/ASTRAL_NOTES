/**
 * Semantic Search - AI-powered intelligent search with natural language understanding
 */

import React, { useState, useEffect, useRef } from 'react';
import { toSafeInnerHtml } from '@/utils/sanitizeHtml';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Search,
  Brain,
  Sparkles,
  Filter,
  Clock,
  BookOpen,
  Target,
  Lightbulb,
  TrendingUp,
  MapPin,
  Users,
  FileText,
  Hash,
  Calendar,
  Zap,
  ArrowRight,
  Star,
  MoreHorizontal,
  Copy,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

// Import AI services
import personalKnowledgeAIService from '@/services/personalKnowledgeAI';
import intelligentContentSuggestionsService from '@/services/intelligentContentSuggestions';
import patternRecognitionService from '@/services/patternRecognition';
import { searchService } from '@/services/searchService';

interface SemanticResult {
  id: string;
  type: 'note' | 'character' | 'location' | 'concept' | 'theme' | 'connection';
  title: string;
  content: string;
  relevanceScore: number;
  semanticContext: string[];
  relatedConcepts: string[];
  connections: Connection[];
  excerpt: string;
  highlightedText: string;
  metadata: {
    created: number;
    modified: number;
    wordCount: number;
    readingTime: number;
    tags: string[];
    projectId?: string;
  };
}

interface Connection {
  id: string;
  type: 'reference' | 'similarity' | 'causality' | 'temporal' | 'thematic';
  target: string;
  strength: number;
  description: string;
}

interface SearchSuggestion {
  query: string;
  type: 'completion' | 'related' | 'conceptual' | 'temporal';
  confidence: number;
  reasoning: string;
}

interface ConceptCluster {
  id: string;
  name: string;
  items: SemanticResult[];
  centralConcept: string;
  relationships: string[];
  strength: number;
}

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [conceptClusters, setConceptClusters] = useState<ConceptCluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'semantic' | 'exact' | 'fuzzy'>('semantic');
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent' | 'week' | 'month'>('all');
  const [activeTab, setActiveTab] = useState('results');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 2) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const generateSuggestions = async () => {
    try {
      // Generate AI-powered search suggestions
      const aiSuggestions: SearchSuggestion[] = [
        {
          query: query + ' themes',
          type: 'conceptual',
          confidence: 0.9,
          reasoning: 'Explore thematic connections to your search'
        },
        {
          query: query + ' characters',
          type: 'related',
          confidence: 0.8,
          reasoning: 'Find related character mentions'
        },
        {
          query: `similar to "${query}"`,
          type: 'completion',
          confidence: 0.85,
          reasoning: 'Discover semantically similar content'
        }
      ];

      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const performSemanticSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Mock semantic search results with AI-powered insights
      const mockResults: SemanticResult[] = [
        {
          id: '1',
          type: 'note',
          title: 'Character Development: Sarah\'s Journey',
          content: 'Sarah\'s character arc represents the classic hero\'s journey, starting from her mundane life in the village...',
          relevanceScore: 0.95,
          semanticContext: ['character development', 'hero\'s journey', 'transformation'],
          relatedConcepts: ['growth', 'conflict', 'resolution'],
          excerpt: 'Sarah\'s character arc represents the classic hero\'s journey...',
          highlightedText: 'Sarah\'s character arc represents the classic <mark>hero\'s journey</mark>...',
          connections: [
            {
              id: 'c1',
              type: 'thematic',
              target: 'Hero\'s Journey Structure',
              strength: 0.9,
              description: 'Follows the classic monomyth pattern'
            }
          ],
          metadata: {
            created: Date.now() - 86400000,
            modified: Date.now() - 3600000,
            wordCount: 1247,
            readingTime: 5,
            tags: ['character', 'protagonist', 'development'],
            projectId: 'project-1'
          }
        },
        {
          id: '2',
          type: 'concept',
          title: 'Thematic Analysis: Coming of Age',
          content: 'The coming-of-age theme permeates throughout the narrative, manifesting in various character interactions...',
          relevanceScore: 0.88,
          semanticContext: ['coming of age', 'maturity', 'growth'],
          relatedConcepts: ['adolescence', 'responsibility', 'wisdom'],
          excerpt: 'The coming-of-age theme permeates throughout the narrative...',
          highlightedText: 'The <mark>coming-of-age</mark> theme permeates throughout the narrative...',
          connections: [
            {
              id: 'c2',
              type: 'thematic',
              target: 'Character Development: Sarah\'s Journey',
              strength: 0.85,
              description: 'Sarah embodies the coming-of-age archetype'
            }
          ],
          metadata: {
            created: Date.now() - 172800000,
            modified: Date.now() - 7200000,
            wordCount: 892,
            readingTime: 4,
            tags: ['theme', 'analysis', 'symbolism']
          }
        },
        {
          id: '3',
          type: 'location',
          title: 'The Ancient Forest',
          content: 'A mystical woodland that serves as both sanctuary and trial ground for the protagonist...',
          relevanceScore: 0.82,
          semanticContext: ['mystical setting', 'transformation space', 'trial ground'],
          relatedConcepts: ['nature', 'magic', 'challenge'],
          excerpt: 'A mystical woodland that serves as both sanctuary and trial ground...',
          highlightedText: 'A <mark>mystical woodland</mark> that serves as both sanctuary and <mark>trial ground</mark>...',
          connections: [
            {
              id: 'c3',
              type: 'temporal',
              target: 'Sarah\'s Forest Vision',
              strength: 0.78,
              description: 'Scene where Sarah receives her calling'
            }
          ],
          metadata: {
            created: Date.now() - 259200000,
            modified: Date.now() - 14400000,
            wordCount: 634,
            readingTime: 3,
            tags: ['location', 'mystical', 'forest']
          }
        }
      ];

      // Generate concept clusters
      const clusters: ConceptCluster[] = [
        {
          id: 'cluster-1',
          name: 'Character Development',
          centralConcept: 'Personal Growth',
          relationships: ['transformation', 'conflict resolution', 'self-discovery'],
          strength: 0.92,
          items: mockResults.filter(r => r.semanticContext.some(c => 
            c.includes('character') || c.includes('growth') || c.includes('journey')
          ))
        },
        {
          id: 'cluster-2',
          name: 'Mystical Elements',
          centralConcept: 'Magic and Wonder',
          relationships: ['supernatural', 'mystery', 'otherworldly'],
          strength: 0.78,
          items: mockResults.filter(r => r.semanticContext.some(c => 
            c.includes('mystical') || c.includes('magic')
          ))
        }
      ];

      setResults(mockResults);
      setConceptClusters(clusters);
    } catch (error) {
      console.error('Error performing semantic search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSemanticSearch();
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-500';
    if (score >= 0.8) return 'bg-blue-500';
    if (score >= 0.7) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="h-4 w-4" />;
      case 'character': return <Users className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'concept': return <Brain className="h-4 w-4" />;
      case 'theme': return <Target className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderResults = () => (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0">
                  {getTypeIcon(result.type)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{result.title}</CardTitle>
                  <CardDescription className="mt-1">
                    <div dangerouslySetInnerHTML={toSafeInnerHtml(result.highlightedText)} />
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-white ${getRelevanceColor(result.relevanceScore)}`}>
                  {Math.round(result.relevanceScore * 100)}%
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {result.type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Semantic Context */}
              <div>
                <p className="text-sm font-medium mb-2">Semantic Context:</p>
                <div className="flex flex-wrap gap-1">
                  {result.semanticContext.map((context, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {context}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Related Concepts */}
              <div>
                <p className="text-sm font-medium mb-2">Related Concepts:</p>
                <div className="flex flex-wrap gap-1">
                  {result.relatedConcepts.map((concept, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Connections */}
              {result.connections.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Connections:</p>
                  <div className="space-y-2">
                    {result.connections.map((connection) => (
                      <div key={connection.id} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground capitalize">{connection.type}:</span>
                        <span>{connection.target}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(connection.strength * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{result.metadata.readingTime}m read</span>
                </div>
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>{result.metadata.wordCount} words</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(result.metadata.created).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Link
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Discuss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderConcepts = () => (
    <div className="space-y-4">
      {conceptClusters.map((cluster) => (
        <Card key={cluster.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{cluster.name}</CardTitle>
                <CardDescription>
                  Central concept: {cluster.centralConcept} • {cluster.items.length} related items
                </CardDescription>
              </div>
              <Badge className={`text-white ${getRelevanceColor(cluster.strength)}`}>
                {Math.round(cluster.strength * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Key Relationships:</p>
                <div className="flex flex-wrap gap-1">
                  {cluster.relationships.map((rel, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {rel}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Related Items:</p>
                <div className="space-y-2">
                  {cluster.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{item.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(item.relevanceScore * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSuggestions = () => (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => (
        <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setQuery(suggestion.query)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="font-medium">{suggestion.query}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {suggestion.type}
                </Badge>
                <Badge className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semantic Search</h1>
          <p className="text-muted-foreground">
            AI-powered intelligent search with natural language understanding
          </p>
        </div>
        <Button variant="outline">
          <Brain className="h-4 w-4 mr-2" />
          Search Tips
        </Button>
      </div>

      {/* Search Interface */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Ask anything about your content... (e.g., 'show me character development themes')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Searching...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-3">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semantic">Semantic</SelectItem>
                  <SelectItem value="exact">Exact</SelectItem>
                  <SelectItem value="fuzzy">Fuzzy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                More Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {(results.length > 0 || suggestions.length > 0) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="results">
              Results ({results.length})
            </TabsTrigger>
            <TabsTrigger value="concepts">
              Concepts ({conceptClusters.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions ({suggestions.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            {results.length > 0 ? renderResults() : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No results found. Try a different search term.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="concepts" className="space-y-4">
            {conceptClusters.length > 0 ? renderConcepts() : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No concept clusters found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {suggestions.length > 0 ? renderSuggestions() : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No suggestions available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Analytics</CardTitle>
                <CardDescription>Insights about your search patterns and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Search analytics coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
