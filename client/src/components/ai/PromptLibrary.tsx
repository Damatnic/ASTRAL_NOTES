/**
 * Prompt Library - Component for browsing, creating, and managing AI prompts and recipes
 * Supports categorization, search, favorites, and custom prompt creation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { 
  Search, 
  Plus, 
  Star, 
  StarOff,
  Play, 
  Edit, 
  Trash2, 
  Copy,
  Download,
  Upload,
  Filter,
  BookOpen,
  Wand2,
  Settings,
  Eye,
  Heart,
  TrendingUp,
  Clock,
  Tag,
  Sparkles,
  FileText,
  Code,
  Brain,
  Users,
  Globe,
  Lock,
  Check,
  X
} from 'lucide-react';

import { 
  promptLibraryService, 
  PromptTemplate, 
  AIRecipe, 
  PromptCategory,
  RecipeCategory,
  PromptVariable 
} from '@/services/promptLibraryService';

interface PromptLibraryProps {
  onPromptExecute?: (promptId: string, variables: Record<string, any>) => void;
  onRecipeExecute?: (recipeId: string, input: Record<string, any>) => void;
}

export function PromptLibrary({ onPromptExecute, onRecipeExecute }: PromptLibraryProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [recipes, setRecipes] = useState<AIRecipe[]>([]);
  const [selectedTab, setSelectedTab] = useState('prompts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PromptTemplate | AIRecipe | null>(null);
  const [executionVariables, setExecutionVariables] = useState<Record<string, any>>({});

  useEffect(() => {
    loadPrompts();
    loadRecipes();
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [searchQuery, selectedCategory, showFavoritesOnly, selectedTags]);

  useEffect(() => {
    loadRecipes();
  }, [searchQuery, selectedCategory, showFavoritesOnly, selectedTags]);

  const loadPrompts = () => {
    const filter: any = {};
    
    if (searchQuery) filter.search = searchQuery;
    if (selectedCategory !== 'all') filter.category = selectedCategory as PromptCategory;
    if (showFavoritesOnly) filter.favorites = true;
    if (selectedTags.length > 0) filter.tags = selectedTags;
    
    const filteredPrompts = promptLibraryService.getPrompts(filter);
    setPrompts(filteredPrompts);
  };

  const loadRecipes = () => {
    const filter: any = {};
    
    if (searchQuery) filter.search = searchQuery;
    if (selectedCategory !== 'all') filter.category = selectedCategory as RecipeCategory;
    if (showFavoritesOnly) filter.favorites = true;
    if (selectedTags.length > 0) filter.tags = selectedTags;
    
    const filteredRecipes = promptLibraryService.getRecipes(filter);
    setRecipes(filteredRecipes);
  };

  const toggleFavorite = (id: string, type: 'prompt' | 'recipe') => {
    const newFavoriteStatus = promptLibraryService.toggleFavorite(id, type);
    
    if (type === 'prompt') {
      setPrompts(prev => prev.map(p => 
        p.id === id ? { ...p, isFavorite: newFavoriteStatus } : p
      ));
    } else {
      setRecipes(prev => prev.map(r => 
        r.id === id ? { ...r, isFavorite: newFavoriteStatus } : r
      ));
    }
  };

  const executePrompt = async (prompt: PromptTemplate, variables: Record<string, any>) => {
    try {
      await promptLibraryService.executePrompt(prompt.id, variables);
      onPromptExecute?.(prompt.id, variables);
      setShowExecuteDialog(false);
    } catch (error) {
      console.error('Error executing prompt:', error);
    }
  };

  const executeRecipe = async (recipe: AIRecipe, input: Record<string, any>) => {
    try {
      await promptLibraryService.executeRecipe(recipe.id, input);
      onRecipeExecute?.(recipe.id, input);
      setShowExecuteDialog(false);
    } catch (error) {
      console.error('Error executing recipe:', error);
    }
  };

  const openExecuteDialog = (item: PromptTemplate | AIRecipe) => {
    setSelectedItem(item);
    setExecutionVariables({});
    setShowExecuteDialog(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'writing_assistance': return <FileText className="h-4 w-4" />;
      case 'character_development': return <Users className="h-4 w-4" />;
      case 'world_building': return <Globe className="h-4 w-4" />;
      case 'plot_development': return <BookOpen className="h-4 w-4" />;
      case 'dialogue_enhancement': return <Users className="h-4 w-4" />;
      case 'style_analysis': return <Brain className="h-4 w-4" />;
      case 'content_generation': return <Sparkles className="h-4 w-4" />;
      case 'editing_revision': return <Edit className="h-4 w-4" />;
      case 'research_analysis': return <Search className="h-4 w-4" />;
      case 'brainstorming': return <Brain className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const renderPromptCard = (prompt: PromptTemplate) => (
    <Card key={prompt.id} className="group hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getCategoryIcon(prompt.category)}
            <div className="flex-1">
              <CardTitle className="text-lg">{prompt.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {prompt.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(prompt.id, 'prompt')}
            >
              {prompt.isFavorite ? 
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
                <StarOff className="h-4 w-4" />
              }
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {prompt.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{prompt.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {prompt.category.replace('_', ' ')}
            </Badge>
            {prompt.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {prompt.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{prompt.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Variables */}
          {prompt.variables.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Variables: {prompt.variables.map(v => v.name).join(', ')}
            </div>
          )}

          {/* Statistics */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{prompt.usageCount} uses</span>
              <span>by {prompt.createdBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(prompt.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => openExecuteDialog(prompt)}
              className="flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              Execute
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecipeCard = (recipe: AIRecipe) => (
    <Card key={recipe.id} className="group hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Wand2 className="h-5 w-5 text-purple-500" />
            <div className="flex-1">
              <CardTitle className="text-lg">{recipe.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {recipe.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(recipe.id, 'recipe')}
            >
              {recipe.isFavorite ? 
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
                <StarOff className="h-4 w-4" />
              }
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {recipe.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{recipe.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {recipe.category.replace('_', ' ')}
            </Badge>
            {recipe.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Steps */}
          <div className="text-sm text-muted-foreground">
            {recipe.steps.length} steps • {recipe.variables.length} variables
          </div>

          {/* Statistics */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{recipe.usageCount} executions</span>
              <span>by {recipe.createdBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(recipe.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => openExecuteDialog(recipe)}
              className="flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              Execute
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-3 w-3 mr-1" />
              Clone
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExecuteDialog = () => {
    if (!selectedItem) return null;

    const isPrompt = 'prompt' in selectedItem;
    const variables = isPrompt ? 
      (selectedItem as PromptTemplate).variables : 
      (selectedItem as AIRecipe).variables;

    return (
      <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Execute {isPrompt ? 'Prompt' : 'Recipe'}: {selectedItem.title}
            </DialogTitle>
            <DialogDescription>
              {selectedItem.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {variables.map(variable => (
              <div key={variable.name} className="space-y-2">
                <label className="text-sm font-medium">
                  {variable.name}
                  {variable.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="text-xs text-muted-foreground mb-2">
                  {variable.description}
                </div>
                
                {variable.type === 'text' && (
                  <Input
                    placeholder={variable.placeholder}
                    value={executionVariables[variable.name] || ''}
                    onChange={(e) => setExecutionVariables(prev => ({
                      ...prev,
                      [variable.name]: e.target.value
                    }))}
                  />
                )}
                
                {variable.type === 'multiline' && (
                  <Textarea
                    placeholder={variable.placeholder}
                    value={executionVariables[variable.name] || ''}
                    onChange={(e) => setExecutionVariables(prev => ({
                      ...prev,
                      [variable.name]: e.target.value
                    }))}
                    className="min-h-[100px]"
                  />
                )}
                
                {variable.type === 'number' && (
                  <Input
                    type="number"
                    min={variable.validation?.min}
                    max={variable.validation?.max}
                    value={executionVariables[variable.name] || variable.defaultValue || ''}
                    onChange={(e) => setExecutionVariables(prev => ({
                      ...prev,
                      [variable.name]: parseFloat(e.target.value) || 0
                    }))}
                  />
                )}
                
                {variable.type === 'select' && variable.options && (
                  <Select 
                    value={executionVariables[variable.name] || variable.defaultValue}
                    onValueChange={(value) => setExecutionVariables(prev => ({
                      ...prev,
                      [variable.name]: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {variable.options.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {variable.type === 'boolean' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={executionVariables[variable.name] || variable.defaultValue || false}
                      onChange={(e) => setExecutionVariables(prev => ({
                        ...prev,
                        [variable.name]: e.target.checked
                      }))}
                    />
                    <span className="text-sm">{variable.description}</span>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (isPrompt) {
                    executePrompt(selectedItem as PromptTemplate, executionVariables);
                  } else {
                    executeRecipe(selectedItem as AIRecipe, executionVariables);
                  }
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts and recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="writing_assistance">Writing Assistance</SelectItem>
          <SelectItem value="character_development">Character Dev</SelectItem>
          <SelectItem value="world_building">World Building</SelectItem>
          <SelectItem value="plot_development">Plot Development</SelectItem>
          <SelectItem value="dialogue_enhancement">Dialogue</SelectItem>
          <SelectItem value="content_generation">Content Gen</SelectItem>
          <SelectItem value="brainstorming">Brainstorming</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={showFavoritesOnly ? "default" : "outline"}
        size="sm"
        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
      >
        <Star className="h-4 w-4 mr-1" />
        Favorites
      </Button>

      <Button variant="outline" size="sm">
        <Filter className="h-4 w-4 mr-1" />
        Filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prompt Library</h2>
          <p className="text-muted-foreground">
            Discover, create, and execute AI prompts and workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Prompt</DialogTitle>
                <DialogDescription>
                  Create a custom prompt template for reuse
                </DialogDescription>
              </DialogHeader>
              {/* Create form would go here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {renderFilters()}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prompts">
            Prompts ({prompts.length})
          </TabsTrigger>
          <TabsTrigger value="recipes">
            Recipes ({recipes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-4">
          {prompts.length === 0 ? (
            <Card className="py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No prompts found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or create a new prompt
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Prompt
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prompts.map(renderPromptCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          {recipes.length === 0 ? (
            <Card className="py-12">
              <div className="text-center">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No recipes found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or create a new recipe
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Recipe
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map(renderRecipeCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {renderExecuteDialog()}
    </div>
  );
}