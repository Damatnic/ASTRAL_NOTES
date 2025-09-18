/**
 * Cloud Export Dialog Component
 * Handles exporting content to cloud storage providers
 */

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Settings,
  Info,
  X,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { 
  cloudExportService, 
  CloudProvider, 
  CloudExportOptions,
  CloudExportResult
} from '@/services/cloudExportService';

interface CloudExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: Blob;
  filename: string;
  title?: string;
  onExportComplete?: (result: CloudExportResult) => void;
}

export function CloudExportDialog({
  isOpen,
  onClose,
  content,
  filename,
  title = 'Export to Cloud',
  onExportComplete
}: CloudExportDialogProps) {
  const toast = useToast();
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [exportOptions, setExportOptions] = useState<CloudExportOptions>({
    provider: 'google-drive' as CloudProvider,
    filename,
    folder: '',
    overwrite: false,
    makePublic: false
  });
  const [exportResult, setExportResult] = useState<CloudExportResult | null>(null);

  // Load available providers on mount
  useEffect(() => {
    if (isOpen) {
      const availableProviders = cloudExportService.getAvailableProviders();
      setProviders(availableProviders);
      
      // Set first configured provider as default
      const firstConfigured = availableProviders.find(p => p.configured);
      if (firstConfigured && !selectedProvider) {
        setSelectedProvider(firstConfigured.id);
        setExportOptions(prev => ({ ...prev, provider: firstConfigured.id }));
      }
    }
  }, [isOpen, selectedProvider]);

  const handleAuthenticate = async (provider: CloudProvider) => {
    setIsAuthenticating(true);
    
    try {
      const result = await cloudExportService.authenticate(provider);
      
      if (result.success) {
        toast.success(`Successfully connected to ${provider}`);
        // Refresh providers to update authentication status
        const updatedProviders = cloudExportService.getAvailableProviders();
        setProviders(updatedProviders);
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleExport = async () => {
    if (!selectedProvider) {
      toast.error('Please select a cloud provider');
      return;
    }

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider?.authenticated) {
      toast.error('Please authenticate with the selected provider first');
      return;
    }

    setIsUploading(true);
    setExportResult(null);

    try {
      const result = await cloudExportService.exportToCloud(content, exportOptions);
      setExportResult(result);
      
      if (result.success) {
        toast.success('File exported successfully to cloud storage');
        onExportComplete?.(result);
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDisconnect = async (provider: CloudProvider) => {
    try {
      await cloudExportService.disconnect(provider);
      toast.success(`Disconnected from ${provider}`);
      
      // Refresh providers
      const updatedProviders = cloudExportService.getAvailableProviders();
      setProviders(updatedProviders);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* File Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">File Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filename:</span>
                  <span className="font-medium">{filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{formatFileSize(content.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{content.type || 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Providers */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Select Cloud Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      selectedProvider === provider.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      !provider.configured && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => provider.configured && setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {!provider.configured ? 'Not configured' :
                             provider.authenticated ? 'Connected' : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      
                      {provider.configured && (
                        <div className="flex items-center gap-2">
                          {provider.authenticated ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDisconnect(provider.id);
                                }}
                              >
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAuthenticate(provider.id);
                              }}
                              disabled={isAuthenticating}
                            >
                              {isAuthenticating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Key className="h-4 w-4" />
                              )}
                              Connect
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!provider.configured && (
                      <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Configure in environment variables
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          {selectedProvider && providers.find(p => p.id === selectedProvider)?.authenticated && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Filename</label>
                    <input
                      type="text"
                      value={exportOptions.filename}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                      placeholder="Enter filename"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Folder (optional)</label>
                    <input
                      type="text"
                      value={exportOptions.folder || ''}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, folder: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                      placeholder="e.g., /Documents/Exports"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.overwrite}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, overwrite: e.target.checked }))}
                      />
                      <span className="text-sm">Overwrite if exists</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.makePublic}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, makePublic: e.target.checked }))}
                      />
                      <span className="text-sm">Make public</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Result */}
          {exportResult && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {exportResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Export Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exportResult.success ? (
                  <div className="space-y-3">
                    <div className="text-sm text-green-600">
                      File successfully exported to cloud storage!
                    </div>
                    
                    {exportResult.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(exportResult.downloadUrl, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View File
                      </Button>
                    )}
                    
                    {exportResult.shareUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(exportResult.shareUrl!)}
                        className="flex items-center gap-2 ml-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Copy Share Link
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-600">
                    {exportResult.error || 'Export failed'}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Close
            </Button>
            <Button
              onClick={handleExport}
              disabled={
                isUploading || 
                !selectedProvider || 
                !providers.find(p => p.id === selectedProvider)?.authenticated ||
                !exportOptions.filename.trim()
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Export to Cloud
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CloudExportDialog;