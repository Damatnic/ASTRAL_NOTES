/**
 * Template Marketplace Component
 * Full-featured template marketplace with discovery, purchasing, and community features
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Heart,
  ShoppingCart,
  TrendingUp,
  Users,
  Crown,
  Zap,
  Target,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Verified,
  Award,
  Bookmark,
  Share2,
  DollarSign,
  Clock,
  FileText,
  Play,
  Plus,
  X,
  Check,
  AlertCircle,
  Info,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Gift,
  Trophy,
  Calendar
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { marketplaceApi } from '@/services/marketplaceApi';

interface MarketplaceTemplate {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  genre: string[];
  subgenre: string[];
  category: string;
  structure: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  targetWordCount: number;
  estimatedDuration: string;
  targetAudience: string;
  writingLevel: string;
  licenseType: 'free' | 'premium' | 'exclusive';
  price: number;
  isPublic: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  downloadCount: number;
  purchaseCount: number;
  viewCount: number;
  likeCount: number;
  averageRating: number;
  reviewCount: number;
  previewContent?: string;
  coverImage?: string;
  screenshots: string[];
  publishedAt: string;
  stats: {
    reviews: number;
    downloads: number;
    purchases: number;
    likes: number;
  };
  userStatus?: {
    purchased: boolean;
    downloaded: boolean;
    liked: boolean;
    hasAccess: boolean;
  };
}

interface TemplateMarketplaceProps {
  onTemplateSelect?: (template: MarketplaceTemplate) => void;
  projectId?: string;
  className?: string;
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

const LICENSE_ICONS = {
  free: <Gift className="h-4 w-4 text-green-600" />,
  premium: <Crown className="h-4 w-4 text-yellow-600" />,
  exclusive: <Award className="h-4 w-4 text-purple-600" />,
};

export function TemplateMarketplace({
  onTemplateSelect,
  projectId,
  className
}: TemplateMarketplaceProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get('difficulty') || 'all');
  const [selectedLicense, setSelectedLicense] = useState(searchParams.get('license') || 'all');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [showFeatured, setShowFeatured] = useState(searchParams.get('featured') === 'true');
  const [showVerified, setShowVerified] = useState(searchParams.get('verified') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');

  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Load templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        genre: selectedGenre !== 'all' ? selectedGenre : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        licenseType: selectedLicense !== 'all' ? selectedLicense : undefined,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        featured: showFeatured || undefined,
        verified: showVerified || undefined,
      };

      const result = await marketplaceApi.searchTemplates(filters, {
        page: currentPage,
        limit: 20,
        sortBy,
      });

      setTemplates(result.templates);
      setTotalPages(result.pagination.pages);
      setTotalResults(result.pagination.total);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedGenre,
    selectedDifficulty,
    selectedLicense,
    priceRange,
    showFeatured,
    showVerified,
    sortBy,
    currentPage,
    toast,
  ]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedGenre !== 'all') params.set('genre', selectedGenre);
    if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
    if (selectedLicense !== 'all') params.set('license', selectedLicense);
    if (showFeatured) params.set('featured', 'true');
    if (showVerified) params.set('verified', 'true');
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    setSearchParams(params);
  }, [
    searchQuery,
    selectedCategory,
    selectedGenre,
    selectedDifficulty,
    selectedLicense,
    showFeatured,
    showVerified,
    sortBy,
    currentPage,
    setSearchParams,
  ]);

  // Load templates when filters change
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Filter options
  const categoryOptions: DropdownOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'novel', label: 'Novel Templates' },
    { value: 'screenplay', label: 'Screenplay Templates' },
    { value: 'non-fiction', label: 'Non-Fiction Templates' },
    { value: 'world-building', label: 'World-Building Templates' },
    { value: 'character', label: 'Character Templates' },
    { value: 'marketing', label: 'Marketing Templates' },
  ];

  const genreOptions: DropdownOption[] = [
    { value: 'all', label: 'All Genres' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'science-fiction', label: 'Science Fiction' },
    { value: 'romance', label: 'Romance' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'horror', label: 'Horror' },
    { value: 'literary', label: 'Literary Fiction' },
    { value: 'young-adult', label: 'Young Adult' },
    { value: 'historical', label: 'Historical Fiction' },
    { value: 'contemporary', label: 'Contemporary' },
  ];

  const difficultyOptions: DropdownOption[] = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner', icon: DIFFICULTY_ICONS.beginner },
    { value: 'intermediate', label: 'Intermediate', icon: DIFFICULTY_ICONS.intermediate },
    { value: 'advanced', label: 'Advanced', icon: DIFFICULTY_ICONS.advanced },
  ];

  const licenseOptions: DropdownOption[] = [
    { value: 'all', label: 'All Licenses' },
    { value: 'free', label: 'Free', icon: LICENSE_ICONS.free },
    { value: 'premium', label: 'Premium', icon: LICENSE_ICONS.premium },
    { value: 'exclusive', label: 'Exclusive', icon: LICENSE_ICONS.exclusive },
  ];

  const sortOptions: DropdownOption[] = [
    { value: 'popular', label: 'Most Popular', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'recent', label: 'Recently Added', icon: <Clock className="h-4 w-4" /> },
    { value: 'rating', label: 'Highest Rated', icon: <Star className="h-4 w-4" /> },
    { value: 'downloads', label: 'Most Downloaded', icon: <Download className="h-4 w-4" /> },
    { value: 'price', label: 'Price: Low to High', icon: <DollarSign className="h-4 w-4" /> },
  ];

  // Actions
  const handleTemplateClick = useCallback((template: MarketplaceTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  }, [onTemplateSelect]);

  const handlePreview = useCallback(async (template: MarketplaceTemplate) => {
    try {
      const preview = await marketplaceApi.getTemplatePreview(template.id);
      setSelectedTemplate({ ...template, previewContent: preview.previewContent });
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
    }
  }, [toast]);

  const handlePurchase = useCallback(async (templateId: string) => {
    try {
      await marketplaceApi.purchaseTemplate(templateId, 'stripe');
      toast.success('Template purchased successfully!');
      loadTemplates(); // Refresh to update purchase status
    } catch (error) {
      console.error('Error purchasing template:', error);
      toast.error('Failed to purchase template');
    }
  }, [toast, loadTemplates]);

  const handleDownload = useCallback(async (templateId: string) => {
    try {
      const download = await marketplaceApi.downloadTemplate(templateId);
      toast.success('Template downloaded successfully!');
      loadTemplates(); // Refresh to update download status
      
      // If this is for a project, apply the template
      if (projectId && download.templateData) {
        // Would integrate with project system
        toast.info('Template applied to project!');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  }, [toast, loadTemplates, projectId]);

  const handleToggleLike = useCallback(async (templateId: string) => {
    try {
      const result = await marketplaceApi.toggleTemplateLike(templateId);
      toast.success(result.liked ? 'Template liked!' : 'Template unliked!');
      
      // Update templates list
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              likeCount: result.likeCount,
              userStatus: template.userStatus ? { ...template.userStatus, liked: result.liked } : undefined
            }
          : template
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  }, [toast]);

  const formatPrice = useCallback((price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  }, []);

  const formatWordCount = useCallback((count: number) => {
    if (count >= 1000) {
      return `${Math.round(count / 1000)}k`;
    }
    return count.toString();
  }, []);

  // Render template card
  const renderTemplateCard = useCallback((template: MarketplaceTemplate) => {
    const hasAccess = template.userStatus?.hasAccess || template.licenseType === 'free';

    return (
      <motion.div
        key={template.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={cn(
            "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-cosmic-300",
            selectedTemplate?.id === template.id && "ring-2 ring-cosmic-500 border-cosmic-300"
          )}
          onClick={() => handleTemplateClick(template)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold truncate">
                    {template.title}
                  </CardTitle>
                  {template.isFeatured && (
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  )}
                  {template.isVerified && (
                    <Verified className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {template.description}
                </p>
                
                {/* Creator info */}
                <div className="flex items-center gap-2 mt-2">
                  {template.creator.avatar ? (
                    <img 
                      src={template.creator.avatar} 
                      alt={template.author}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-cosmic-100 flex items-center justify-center">
                      <Users className="h-3 w-3 text-cosmic-600" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    by {template.author}
                  </span>
                </div>
              </div>
              
              {/* Price and license */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {LICENSE_ICONS[template.licenseType]}
                  <span className={cn(
                    "text-sm font-semibold",
                    template.licenseType === 'free' ? 'text-green-600' : 'text-cosmic-600'
                  )}>
                    {formatPrice(template.price)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike(template.id);
                  }}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    template.userStatus?.liked && "opacity-100 text-red-500"
                  )}
                >
                  <Heart className={cn("h-4 w-4", template.userStatus?.liked && "fill-current")} />
                </Button>
              </div>
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
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{formatWordCount(template.targetWordCount)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{template.estimatedDuration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                <span>{template.downloadCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>{template.averageRating.toFixed(1)}</span>
              </div>
            </div>

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
              
              {hasAccess ? (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(template.id);
                  }}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {template.userStatus?.downloaded ? 'Re-download' : 'Download'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (template.licenseType === 'free') {
                      handleDownload(template.id);
                    } else {
                      handlePurchase(template.id);
                    }
                  }}
                  className="flex-1"
                >
                  {template.licenseType === 'free' ? (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Buy
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }, [
    selectedTemplate,
    handleTemplateClick,
    handlePreview,
    handlePurchase,
    handleDownload,
    handleToggleLike,
    formatPrice,
    formatWordCount,
  ]);

  // Render template list item
  const renderTemplateListItem = useCallback((template: MarketplaceTemplate) => {
    const hasAccess = template.userStatus?.hasAccess || template.licenseType === 'free';

    return (
      <motion.div
        key={template.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{template.title}</h3>
                      {template.isFeatured && (
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      )}
                      {template.isVerified && (
                        <Verified className="h-4 w-4 text-blue-500" />
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", DIFFICULTY_COLORS[template.difficulty])}
                      >
                        {template.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {LICENSE_ICONS[template.licenseType]}
                        <span className={cn(
                          "text-sm font-semibold",
                          template.licenseType === 'free' ? 'text-green-600' : 'text-cosmic-600'
                        )}>
                          {formatPrice(template.price)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>by {template.author}</span>
                      <span>{formatWordCount(template.targetWordCount)} words</span>
                      <span>{template.estimatedDuration}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{template.averageRating.toFixed(1)} ({template.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{template.downloadCount}</span>
                      </div>
                      <div className="flex gap-1">
                        {template.genre.slice(0, 3).map(genre => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike(template.id);
                  }}
                  className={cn(template.userStatus?.liked && "text-red-500")}
                >
                  <Heart className={cn("h-4 w-4", template.userStatus?.liked && "fill-current")} />
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
                
                {hasAccess ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(template.id);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (template.licenseType === 'free') {
                        handleDownload(template.id);
                      } else {
                        handlePurchase(template.id);
                      }
                    }}
                  >
                    {template.licenseType === 'free' ? (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Buy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }, [
    selectedTemplate,
    handleTemplateClick,
    handlePreview,
    handlePurchase,
    handleDownload,
    handleToggleLike,
    formatPrice,
    formatWordCount,
  ]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Template Marketplace
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </h2>
          <p className="text-muted-foreground">
            Discover professional writing templates from the community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Submit Template
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, author, or tags..."
                className="pl-9"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-cosmic-50 border-cosmic-300")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <Dropdown
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort"
              className="w-48"
            />
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t"
              >
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
                
                <Dropdown
                  options={licenseOptions}
                  value={selectedLicense}
                  onChange={setSelectedLicense}
                  placeholder="License"
                />

                <div className="flex items-center gap-2">
                  <Button
                    variant={showFeatured ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFeatured(!showFeatured)}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Featured
                  </Button>
                  <Button
                    variant={showVerified ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowVerified(!showVerified)}
                  >
                    <Verified className="h-3 w-3 mr-1" />
                    Verified
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{totalResults} templates found</span>
            {(searchQuery || selectedCategory !== 'all' || selectedGenre !== 'all' || 
              selectedDifficulty !== 'all' || selectedLicense !== 'all' || showFeatured || showVerified) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedGenre('all');
                  setSelectedDifficulty('all');
                  setSelectedLicense('all');
                  setShowFeatured(false);
                  setShowVerified(false);
                  setCurrentPage(1);
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedGenre('all');
                setSelectedDifficulty('all');
                setSelectedLicense('all');
                setShowFeatured(false);
                setShowVerified(false);
                setCurrentPage(1);
              }}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
            )}
          >
            {templates.map(template => 
              viewMode === 'grid' 
                ? renderTemplateCard(template)
                : renderTemplateListItem(template)
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
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
                    <CardTitle className="text-xl flex items-center gap-2">
                      {selectedTemplate.title}
                      {selectedTemplate.isFeatured && (
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                      )}
                      {selectedTemplate.isVerified && (
                        <Verified className="h-5 w-5 text-blue-500" />
                      )}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      by {selectedTemplate.author}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Template Info */}
                <div>
                  <p className="text-muted-foreground mb-4">
                    {selectedTemplate.description}
                  </p>
                  
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
                      <h4 className="font-medium text-sm text-muted-foreground">Price</h4>
                      <div className="flex items-center gap-1">
                        {LICENSE_ICONS[selectedTemplate.licenseType]}
                        <span className="font-semibold">
                          {formatPrice(selectedTemplate.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Content */}
                {selectedTemplate.previewContent && (
                  <div>
                    <h4 className="font-semibold mb-3">Preview</h4>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                        {selectedTemplate.previewContent}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  
                  {selectedTemplate.userStatus?.hasAccess || selectedTemplate.licenseType === 'free' ? (
                    <Button
                      onClick={() => {
                        handleDownload(selectedTemplate.id);
                        setShowPreview(false);
                      }}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (selectedTemplate.licenseType === 'free') {
                          handleDownload(selectedTemplate.id);
                        } else {
                          handlePurchase(selectedTemplate.id);
                        }
                        setShowPreview(false);
                      }}
                      className="flex-1"
                    >
                      {selectedTemplate.licenseType === 'free' ? (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download Free
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase for {formatPrice(selectedTemplate.price)}
                        </>
                      )}
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