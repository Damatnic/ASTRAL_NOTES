/**
 * Template Marketplace Page
 * Main marketplace page showcasing all template marketplace features
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { 
  Sparkles,
  Crown,
  TrendingUp,
  Users,
  Star,
  Download,
  Award,
  Zap,
  Gift,
  BookOpen,
  FileText,
  Palette,
  Users2,
  MessageSquare,
  Heart,
  Eye,
  ArrowRight,
  Play,
  ChevronRight,
  Trophy,
  Target,
  Calendar,
  DollarSign,
  Verified,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { TemplateMarketplace } from '@/components/marketplace/TemplateMarketplace';
import { TemplateSubmissionModal } from '@/components/marketplace/TemplateSubmissionModal';
import { CreatorDashboard } from '@/components/marketplace/CreatorDashboard';
import { marketplaceApi } from '@/services/marketplaceApi';

interface FeaturedTemplate {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  category: string;
  genre: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  licenseType: 'free' | 'premium' | 'exclusive';
  averageRating: number;
  downloadCount: number;
  coverImage?: string;
  isFeatured: boolean;
  isVerified: boolean;
}

interface MarketplaceStats {
  totalTemplates: number;
  totalCreators: number;
  totalDownloads: number;
  totalRevenue: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

interface TrendingCreator {
  id: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  totalTemplates: number;
  averageRating: number;
  followerCount: number;
  isVerified: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [currentView, setCurrentView] = useState<'marketplace' | 'dashboard' | 'creator-profile'>('marketplace');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [featuredTemplates, setFeaturedTemplates] = useState<FeaturedTemplate[]>([]);
  const [trendingCreators, setTrendingCreators] = useState<TrendingCreator[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Parse URL to determine current view
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view') || 'marketplace';
    setCurrentView(view as any);
  }, [location]);

  // Load marketplace data
  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      const [trending, stats] = await Promise.all([
        marketplaceApi.getTrendingContent(),
        marketplaceApi.getMarketplaceStats(),
      ]);

      setFeaturedTemplates(trending.templates);
      setTrendingCreators(trending.creators);
      setMarketplaceStats(stats);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast.error('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const changeView = (view: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('view', view);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const renderHeroSection = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-cosmic-50 via-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cosmic-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Template Marketplace
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover professional writing templates from our community of creators. 
              From novels to screenplays, find the perfect structure for your next masterpiece.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button size="lg" onClick={() => setCurrentView('marketplace')}>
                <Search className="h-5 w-5 mr-2" />
                Browse Templates
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowSubmissionModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Submit Template
              </Button>
            </div>

            {/* Quick Stats */}
            {marketplaceStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-2xl font-bold text-cosmic-600">
                    {marketplaceStats.totalTemplates.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Templates</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-2xl font-bold text-cosmic-600">
                    {marketplaceStats.totalCreators.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Creators</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-2xl font-bold text-cosmic-600">
                    {(marketplaceStats.totalDownloads / 1000).toFixed(1)}k
                  </p>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-2xl font-bold text-cosmic-600">4.8</p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );

  const renderFeaturedSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Featured Templates
          </h2>
          <p className="text-muted-foreground">Hand-picked templates from our editorial team</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentView('marketplace')}>
          View All <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredTemplates.slice(0, 6).map(template => (
          <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
            <CardContent className="p-0">
              <div className="aspect-video bg-gradient-to-br from-cosmic-100 to-blue-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                {template.coverImage ? (
                  <img 
                    src={template.coverImage} 
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="h-12 w-12 text-cosmic-600" />
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className="bg-yellow-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                  {template.isVerified && (
                    <Badge className="bg-blue-500 text-white">
                      <Verified className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant={template.licenseType === 'free' ? 'secondary' : 'default'}>
                    {template.licenseType === 'free' ? (
                      <>
                        <Gift className="h-3 w-3 mr-1" />
                        Free
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${template.price}
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-1">{template.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>by {template.author}</span>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {template.averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {template.downloadCount > 1000 
                        ? `${(template.downloadCount / 1000).toFixed(1)}k` 
                        : template.downloadCount}
                    </div>
                  </div>
                  
                  <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTrendingCreators = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            Trending Creators
          </h2>
          <p className="text-muted-foreground">Top template creators this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trendingCreators.slice(0, 4).map(creator => (
          <Card key={creator.id} className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="relative mb-4">
                {creator.avatar ? (
                  <img 
                    src={creator.avatar} 
                    alt={creator.displayName}
                    className="w-16 h-16 rounded-full mx-auto"
                  />
                ) : (
                  <div className="w-16 h-16 bg-cosmic-100 rounded-full mx-auto flex items-center justify-center">
                    <Users className="h-8 w-8 text-cosmic-600" />
                  </div>
                )}
                
                <div className="absolute -bottom-1 -right-1">
                  {creator.tier === 'platinum' && <Sparkles className="h-5 w-5 text-purple-500" />}
                  {creator.tier === 'gold' && <Crown className="h-5 w-5 text-yellow-500" />}
                  {creator.tier === 'silver' && <Award className="h-5 w-5 text-gray-500" />}
                  {creator.tier === 'bronze' && <Trophy className="h-5 w-5 text-orange-500" />}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="font-semibold">{creator.displayName}</h3>
                  {creator.isVerified && (
                    <Verified className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                
                {creator.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {creator.bio}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <p className="text-lg font-bold text-cosmic-600">{creator.totalTemplates}</p>
                    <p className="text-xs text-muted-foreground">Templates</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-cosmic-600">{creator.averageRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-cosmic-600">
                      {creator.followerCount > 1000 
                        ? `${(creator.followerCount / 1000).toFixed(1)}k` 
                        : creator.followerCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-3">
                  <Users2 className="h-3 w-3 mr-1" />
                  Follow
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCategoryShowcase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Template Categories</h2>
        <p className="text-muted-foreground">Find the perfect template for your writing project</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            category: 'Novel Templates',
            description: 'Complete story structures and frameworks',
            icon: BookOpen,
            color: 'from-blue-500 to-blue-600',
            count: 156,
          },
          {
            category: 'Screenplay Templates',
            description: 'Script formats and story beats',
            icon: Play,
            color: 'from-purple-500 to-purple-600',
            count: 89,
          },
          {
            category: 'Non-Fiction Templates',
            description: 'Educational and informational content',
            icon: FileText,
            color: 'from-green-500 to-green-600',
            count: 73,
          },
          {
            category: 'World-Building Templates',
            description: 'Fantasy and sci-fi world creation',
            icon: Palette,
            color: 'from-orange-500 to-orange-600',
            count: 45,
          },
          {
            category: 'Character Templates',
            description: 'Character development frameworks',
            icon: Users,
            color: 'from-pink-500 to-pink-600',
            count: 38,
          },
          {
            category: 'Marketing Templates',
            description: 'Query letters, synopses, and promotion',
            icon: Target,
            color: 'from-indigo-500 to-indigo-600',
            count: 24,
          },
        ].map((category, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
            <div className={cn("h-32 bg-gradient-to-br", category.color, "relative")}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-4 left-4 text-white">
                <category.icon className="h-8 w-8 mb-2" />
                <p className="text-2xl font-bold">{category.count}</p>
                <p className="text-sm opacity-90">templates</p>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{category.category}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {category.description}
              </p>
              <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Browse Templates <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderNavigationTabs = () => (
    <div className="border-b mb-8">
      <nav className="flex space-x-8">
        {[
          { id: 'marketplace', label: 'Browse Templates', icon: Search },
          { id: 'dashboard', label: 'Creator Dashboard', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => changeView(tab.id)}
            className={cn(
              "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
              currentView === tab.id
                ? "border-cosmic-500 text-cosmic-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {currentView === 'marketplace' && (
          <>
            {renderHeroSection()}
            {renderNavigationTabs()}
            <TemplateMarketplace />
          </>
        )}

        {currentView === 'dashboard' && (
          <>
            {renderNavigationTabs()}
            <CreatorDashboard />
          </>
        )}

        {/* Home view with overview */}
        {!currentView || currentView === 'home' && (
          <>
            {renderHeroSection()}
            {renderFeaturedSection()}
            {renderTrendingCreators()}
            {renderCategoryShowcase()}
          </>
        )}

        {/* Template Submission Modal */}
        <TemplateSubmissionModal
          isOpen={showSubmissionModal}
          onClose={() => setShowSubmissionModal(false)}
          onSubmit={(submission) => {
            console.log('Template submitted:', submission);
            toast.success('Template submitted for review!');
          }}
        />
      </div>
    </div>
  );
}