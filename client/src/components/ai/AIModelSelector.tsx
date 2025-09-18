/**
 * AI Model Selector - Component for switching between AI providers and models
 * Displays available models, their capabilities, costs, and real-time status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { 
  Bot, 
  Zap, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Info,
  TrendingUp,
  Wifi,
  WifiOff,
  Cloud,
  Server,
  Eye,
  EyeOff,
  Gauge,
  Brain,
  Sparkles,
  Code,
  Image,
  Mic,
  FileText
} from 'lucide-react';

import { aiProviderService, AIProvider, AIModel } from '@/services/aiProviderService';

interface AIModelSelectorProps {
  onProviderChange?: (providerId: string) => void;
  onModelChange?: (modelId: string) => void;
  showAdvancedOptions?: boolean;
}

export function AIModelSelector({ 
  onProviderChange, 
  onModelChange, 
  showAdvancedOptions = false 
}: AIModelSelectorProps) {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<AIProvider | undefined>();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const [usageStats, setUsageStats] = useState<Record<string, any>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState('models');

  useEffect(() => {
    loadProviders();
    checkProviderStatuses();
    loadUsageStats();
  }, []);

  const loadProviders = () => {
    const allProviders = aiProviderService.getProviders();
    setProviders(allProviders);
    
    const active = aiProviderService.getActiveProvider();
    setActiveProvider(active);
    
    if (active && active.models.length > 0) {
      setSelectedModel(active.models[0].id);
    }
  };

  const checkProviderStatuses = async () => {
    const statuses: Record<string, boolean> = {};
    
    for (const provider of providers) {
      try {
        const isAvailable = await aiProviderService.checkProviderStatus(provider.id);
        statuses[provider.id] = isAvailable;
      } catch (error) {
        statuses[provider.id] = false;
      }
    }
    
    setProviderStatus(statuses);
  };

  const loadUsageStats = () => {
    const stats = aiProviderService.getUsageStats();
    setUsageStats(stats);
  };

  const selectProvider = (providerId: string) => {
    aiProviderService.setActiveProvider(providerId);
    const provider = aiProviderService.getProvider(providerId);
    setActiveProvider(provider);
    
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
      onModelChange?.(provider.models[0].id);
    }
    
    onProviderChange?.(providerId);
  };

  const selectModel = (modelId: string) => {
    setSelectedModel(modelId);
    onModelChange?.(modelId);
  };

  const getStatusIcon = (providerId: string) => {
    const isAvailable = providerStatus[providerId];
    
    if (isAvailable === undefined) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return isAvailable ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (providerId: string) => {
    const isAvailable = providerStatus[providerId];
    
    if (isAvailable === undefined) return 'Checking...';
    return isAvailable ? 'Available' : 'Unavailable';
  };

  const getCapabilityIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'creative': return <Sparkles className="h-4 w-4" />;
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'multimodal': return <Image className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'basic': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}/1K tokens`;
    return `$${cost.toFixed(3)}/1K tokens`;
  };

  const formatUsage = (usage: any) => {
    if (!usage) return { tokens: 0, cost: 0 };
    return {
      tokens: usage.totalTokens || 0,
      cost: usage.cost || 0
    };
  };

  const renderProviderCard = (provider: AIProvider) => {
    const isActive = activeProvider?.id === provider.id;
    const isAvailable = providerStatus[provider.id];
    const usage = formatUsage(usageStats[provider.id]);

    return (
      <Card 
        key={provider.id}
        className={`cursor-pointer transition-all ${
          isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'
        }`}
        onClick={() => selectProvider(provider.id)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {provider.id === 'openai' && <Bot className="h-6 w-6 text-green-600" />}
                {provider.id === 'anthropic' && <Brain className="h-6 w-6 text-orange-600" />}
                {provider.id === 'google' && <Sparkles className="h-6 w-6 text-blue-600" />}
                {provider.id === 'local' && <Server className="h-6 w-6 text-purple-600" />}
                
                <div className="absolute -bottom-1 -right-1">
                  {getStatusIcon(provider.id)}
                </div>
              </div>
              
              <div>
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {getStatusText(provider.id)}
                  {provider.id === 'local' ? <Server className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
                </CardDescription>
              </div>
            </div>
            
            {isActive && <Badge>Active</Badge>}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Models */}
            <div>
              <div className="text-sm font-medium mb-2">
                Models ({provider.models.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {provider.models.slice(0, 3).map(model => (
                  <Badge 
                    key={model.id} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {model.displayName}
                  </Badge>
                ))}
                {provider.models.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{provider.models.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <div className="text-sm font-medium mb-2">Features</div>
              <div className="flex flex-wrap gap-1">
                {provider.features.slice(0, 3).map(feature => (
                  <Badge 
                    key={feature.id} 
                    variant={feature.enabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {feature.name}
                  </Badge>
                ))}
                {provider.features.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{provider.features.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Usage Statistics */}
            {usage.tokens > 0 && (
              <div className="text-xs text-muted-foreground">
                Used: {usage.tokens.toLocaleString()} tokens • ${usage.cost.toFixed(4)}
              </div>
            )}

            {/* Cost */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost per 1K tokens:</span>
              <span className="font-medium">
                {formatCost(provider.costPerToken * 1000)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderModelSelector = () => {
    if (!activeProvider) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {activeProvider.name} Models
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        <div className="space-y-3">
          {activeProvider.models.map(model => (
            <Card 
              key={model.id}
              className={`cursor-pointer transition-all ${
                selectedModel === model.id ? 'ring-2 ring-primary' : 'hover:shadow-sm'
              }`}
              onClick={() => selectModel(model.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{model.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {model.contextWindow.toLocaleString()} context • {formatCost(model.costPer1kTokens)}
                    </div>
                  </div>
                  
                  {selectedModel === model.id && (
                    <Badge>Selected</Badge>
                  )}
                </div>

                {/* Capabilities */}
                <div className="flex items-center gap-2 mb-3">
                  {model.capabilities.map(capability => (
                    <div 
                      key={capability.type}
                      className="flex items-center gap-1"
                      title={`${capability.type}: ${capability.quality}`}
                    >
                      {getCapabilityIcon(capability.type)}
                      <span className={`text-xs ${getQualityColor(capability.quality)}`}>
                        {capability.quality}
                      </span>
                    </div>
                  ))}
                </div>

                {showDetails && (
                  <div className="space-y-2 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Max Output:</span>
                        <span className="ml-2">{model.maxTokens.toLocaleString()} tokens</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Context Window:</span>
                        <span className="ml-2">{model.contextWindow.toLocaleString()} tokens</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.capabilities.map(cap => (
                          <Badge key={cap.type} variant="outline" className="text-xs">
                            {cap.type} ({cap.quality})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderUsageStatistics = () => {
    const totalUsage = Object.values(usageStats).reduce((acc: any, usage: any) => ({
      totalTokens: (acc.totalTokens || 0) + (usage?.totalTokens || 0),
      cost: (acc.cost || 0) + (usage?.cost || 0)
    }), {});

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Usage Statistics</h3>
        
        {/* Overall Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {totalUsage.totalTokens?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${totalUsage.cost?.toFixed(4) || '0.0000'}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-Provider Usage */}
        <div className="space-y-3">
          {Object.entries(usageStats).map(([providerId, usage]: [string, any]) => {
            const provider = providers.find(p => p.id === providerId);
            if (!provider || !usage) return null;

            const percentage = totalUsage.totalTokens > 0 ? 
              (usage.totalTokens / totalUsage.totalTokens) * 100 : 0;

            return (
              <Card key={providerId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                  
                  <Progress value={percentage} className="mb-2" />
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Tokens</div>
                      <div className="font-medium">{usage.totalTokens?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost</div>
                      <div className="font-medium">${usage.cost?.toFixed(4) || '0.0000'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg/Request</div>
                      <div className="font-medium">
                        {usage.totalTokens && usage.requestCount ? 
                          Math.round(usage.totalTokens / usage.requestCount) : 0} tokens
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderConfiguration = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Provider Configuration</h3>
      
      {providers.map(provider => (
        <Card key={provider.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{provider.name}</CardTitle>
              {getStatusIcon(provider.id)}
            </div>
            <CardDescription>
              Configure settings and API keys for {provider.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Configuration would go here */}
              <div className="text-sm text-muted-foreground">
                {provider.id === 'openai' && 'OpenAI API key configured via environment variables'}
                {provider.id === 'anthropic' && 'Anthropic API key not configured'}
                {provider.id === 'google' && 'Google API key not configured'}
                {provider.id === 'local' && 'Local LLM server connection settings'}
              </div>
              
              {provider.id === 'local' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Server URL</label>
                  <input 
                    type="text"
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Models</h2>
          <p className="text-muted-foreground">
            Choose and configure AI providers for your writing assistance
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={checkProviderStatuses}
          disabled={Object.keys(providerStatus).length === 0}
        >
          <Wifi className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {providers.map(renderProviderCard)}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {renderModelSelector()}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {renderUsageStatistics()}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          {renderConfiguration()}
        </TabsContent>
      </Tabs>

      {showAdvancedOptions && activeProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Options</CardTitle>
            <CardDescription>
              Fine-tune AI behavior for {activeProvider.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Temperature</label>
                <input 
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Controls randomness (0 = deterministic, 2 = very random)
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Max Tokens</label>
                <input 
                  type="number"
                  min="1"
                  max="4096"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Maximum tokens in response
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}