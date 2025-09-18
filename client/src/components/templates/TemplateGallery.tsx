/**
 * Template Gallery Component
 * Provides template selection interface with preview and application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { 
  BookOpen,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Clock,
  Users,
  Target,
  Zap,
  FileText,
  Play,
  Copy,
  Heart,
  Settings,
  Plus,
  ArrowRight,
  CheckCircle,
  Info,
  Bookmark,
  Share,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { 
  templateService,
  type NovelTemplate,
  type TemplateCategory
} from '@/services/templateService';

interface TemplateGalleryProps {
  onTemplateSelect?: (template: NovelTemplate) => void;
  onTemplateApply?: (templateId: string) => void;
  className?: string;
  projectId?: string;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
};

const DIFFICULTY_ICONS = {
  beginner: <Zap className="h-3 w-3" />,
  intermediate: <Target className="h-3 w-3" />,
  advanced: <Settings className="h-3 w-3" />,
};

export function TemplateGallery({
  onTemplateSelect,
  onTemplateApply,
  className,
  projectId
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<NovelTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<NovelTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'wordcount' | 'alphabetical'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<NovelTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toast = useToast();

  // Load templates and categories
  useEffect(() => {
    setTemplates(templateService.getTemplates());
    setCategories(templateService.getCategories());
  }, []);

  // Filter and sort templates
  useEffect(() => {
    let filtered = templates;

    // Category filter
    if (selectedCategory !== 'all') {
      const categoryTemplates = templateService.getTemplatesByCategory(selectedCategory);
      filtered = filtered.filter(t => categoryTemplates.some(ct => ct.id === t.id));
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(t => t.genre.includes(selectedGenre));
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(t => t.difficulty === selectedDifficulty);
    }

    // Search filter
    if (searchQuery) {
      filtered = templateService.searchTemplates(searchQuery)
        .filter(t => filtered.includes(t));
    }

    // Sort templates
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.rating || 0) * (b.downloads || 0) - (a.rating || 0) * (a.downloads || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'wordcount':
        filtered.sort((a, b) => a.targetWordCount - b.targetWordCount);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, selectedGenre, selectedDifficulty, searchQuery, sortBy]);

  // Get all genres from templates
  const genres = Array.from(new Set(templates.flatMap(t => t.genre)));

  // Filter options
  const categoryOptions: DropdownOption[] = [
    { value: 'all', label: 'All Categories', icon: <BookOpen className="h-4 w-4" /> },
    ...categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      description: cat.description,
      icon: <span className="text-sm">{cat.icon}</span>,
    })),
  ];

  const genreOptions: DropdownOption[] = [
    { value: 'all', label: 'All Genres' },
    ...genres.map(genre => ({
      value: genre,
      label: genre.charAt(0).toUpperCase() + genre.slice(1),
    })),
  ];

  const difficultyOptions: DropdownOption[] = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner', icon: DIFFICULTY_ICONS.beginner },
    { value: 'intermediate', label: 'Intermediate', icon: DIFFICULTY_ICONS.intermediate },
    { value: 'advanced', label: 'Advanced', icon: DIFFICULTY_ICONS.advanced },
  ];

  const sortOptions: DropdownOption[] = [
    { value: 'popular', label: 'Most Popular', icon: <Star className="h-4 w-4" /> },
    { value: 'recent', label: 'Recently Updated', icon: <Clock className="h-4 w-4" /> },
    { value: 'wordcount', label: 'Word Count', icon: <FileText className="h-4 w-4" /> },
    { value: 'alphabetical', label: 'Alphabetical', icon: <BookOpen className="h-4 w-4" /> },
  ];

  // Handle template selection
  const handleTemplateClick = useCallback((template: NovelTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  }, [onTemplateSelect]);

  // Handle template preview
  const handlePreview = useCallback((template: NovelTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  }, []);

  // Handle template application
  const handleApply = useCallback((templateId: string) => {
    onTemplateApply?.(templateId);
    toast.success('Template applied to project!');
  }, [onTemplateApply, toast]);

  // Toggle favorite
  const handleToggleFavorite = useCallback((templateId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
        toast.info('Removed from favorites');
      } else {
        next.add(templateId);
        toast.success('Added to favorites');
      }
      return next;
    });
  }, [toast]);

  // Format word count
  const formatWordCount = useCallback((count: number) => {
    if (count >= 1000) {
      return `${Math.round(count / 1000)}k`;
    }
    return count.toString();
  }, []);

  // Render template card
  const renderTemplateCard = useCallback((template: NovelTemplate) => {
    const isFavorite = favorites.has(template.id);

    return (
      <Card 
        key={template.id}
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-cosmic-300",
          selectedTemplate?.id === template.id && "ring-2 ring-cosmic-500 border-cosmic-300"
        )}
        onClick={() => handleTemplateClick(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {template.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(template.id);
              }}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                isFavorite && "opacity-100 text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge 
              variant="outline" 
              className={DIFFICULTY_COLORS[template.difficulty]}
            >
              {DIFFICULTY_ICONS[template.difficulty]}
              <span className="ml-1 capitalize">{template.difficulty}</span>
            </Badge>
            
            <Badge variant="secondary" className="text-xs">
              {template.structure}
            </Badge>

            {template.genre.slice(0, 2).map(genre => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
            
            {template.genre.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{template.genre.length - 2}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{formatWordCount(template.targetWordCount)} words</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{template.estimatedDuration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{template.sections.length} sections</span>
            </div>
          </div>

          {/* Rating and Downloads */}
          {template.rating && template.downloads && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>{template.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                <span>{template.downloads.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(template);
              }}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            
            {projectId && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply(template.id);
                }}
                className="flex-1"
              >
                <Play className="h-3 w-3 mr-1" />
                Apply
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, [selectedTemplate, favorites, handleTemplateClick, handlePreview, handleApply, handleToggleFavorite, formatWordCount, projectId]);

  // Render template list item
  const renderTemplateListItem = useCallback((template: NovelTemplate) => {
    const isFavorite = favorites.has(template.id);

    return (
      <Card 
        key={template.id}
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-cosmic-300",
          selectedTemplate?.id === template.id && "ring-2 ring-cosmic-500 border-cosmic-300"
        )}
        onClick={() => handleTemplateClick(template)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold truncate">{template.title}</h3>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", DIFFICULTY_COLORS[template.difficulty])}
                >
                  {template.difficulty}
                </Badge>
                {template.rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{template.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {template.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{formatWordCount(template.targetWordCount)} words</span>
                <span>{template.estimatedDuration}</span>
                <span>{template.sections.length} sections</span>
                <div className="flex gap-1">
                  {template.genre.slice(0, 3).map(genre => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(template.id);
                }}
                className={cn(isFavorite && "text-red-500")}
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(template);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              
              {projectId && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(template.id);
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [selectedTemplate, favorites, handleTemplateClick, handlePreview, handleApply, handleToggleFavorite, formatWordCount, projectId]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Novel Templates</h2>
          <p className="text-muted-foreground">
            Choose a template to structure your novel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9"
              />
            </div>
            
            <Dropdown
              options={sortOptions}
              value={sortBy}
              onChange={(value) => setSortBy(value as any)}
              placeholder="Sort"
              className="w-40"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Dropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Category"
            />
            
            <Dropdown
              options={genreOptions}
              value={selectedGenre}
              onChange={setSelectedGenre}
              placeholder="Genre"
            />
            
            <Dropdown
              options={difficultyOptions}
              value={selectedDifficulty}
              onChange={setSelectedDifficulty}
              placeholder="Difficulty"
            />

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredTemplates.length} templates found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedGenre('all');
                setSelectedDifficulty('all');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        )}>
          {filteredTemplates.map(template => 
            viewMode === 'grid' 
              ? renderTemplateCard(template)
              : renderTemplateListItem(template)
          )}
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-center h-full p-8">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedTemplate.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPreview(false)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Template Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Target Length</h4>
                    <p className="font-semibold">{selectedTemplate.targetWordCount.toLocaleString()} words</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Duration</h4>
                    <p className="font-semibold">{selectedTemplate.estimatedDuration}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Difficulty</h4>
                    <Badge className={DIFFICULTY_COLORS[selectedTemplate.difficulty]}>
                      {selectedTemplate.difficulty}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Sections</h4>
                    <p className="font-semibold">{selectedTemplate.sections.length}</p>
                  </div>
                </div>

                {/* Structure */}
                <div>
                  <h4 className="font-semibold mb-3">Story Structure</h4>
                  <div className="space-y-2">
                    {selectedTemplate.sections.map((section, index) => (
                      <div key={section.id} className="flex items-center gap-3 p-3 border rounded">
                        <span className="w-8 h-8 rounded-full bg-cosmic-100 text-cosmic-800 text-sm font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h5 className="font-medium">{section.title}</h5>
                          {section.description && (
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {section.estimatedWordCount && (
                            <p className="text-sm font-medium">{formatWordCount(section.estimatedWordCount)} words</p>
                          )}
                          <Badge 
                            variant={section.isRequired ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {section.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  
                  {projectId && (
                    <Button
                      onClick={() => {
                        handleApply(selectedTemplate.id);
                        setShowPreview(false);
                      }}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Apply Template
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}