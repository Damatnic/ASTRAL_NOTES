/**
 * Batch Processing Dialog Component
 * Handles batch import/export operations with progress tracking
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  Files,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Settings,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { 
  batchProcessingService, 
  BatchImportOptions, 
  BatchExportOptions,
  BatchProgress,
  BatchResult,
  BatchError
} from '@/services/batchProcessingService';
import { TemplateEngineService } from '@/services/templateEngineService';

interface BatchProcessingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  contentItems?: Array<{
    content: string;
    title: string;
    author?: string;
    metadata?: Record<string, any>;
  }>;
  onImportComplete?: (results: any) => void;
  onExportComplete?: (results: any) => void;
}

export function BatchProcessingDialog({
  isOpen,
  onClose,
  mode,
  contentItems = [],
  onImportComplete,
  onExportComplete
}: BatchProcessingDialogProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    current: '',
    errors: [],
    results: []
  });
  const [showResults, setShowResults] = useState(false);
  const [importOptions, setImportOptions] = useState<BatchImportOptions>({
    extractEntities: true,
    mergeDocuments: false,
    preserveStructure: true,
    maxConcurrentFiles: 3
  });
  const [exportOptions, setExportOptions] = useState<BatchExportOptions>({
    format: 'md',
    outputOptions: {
      separateFiles: true,
      mergeIntoSingle: false,
      addTimestamp: false
    },
    maxConcurrentFiles: 3
  });
  const [templates, setTemplates] = useState<any[]>([]);

  // Initialize templates on mount
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateEngine = new TemplateEngineService();
        const availableTemplates = await templateEngine.getAvailableTemplates();
        setTemplates(availableTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    // Validate files
    const validation = batchProcessingService.validateBatch(files);
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
    }
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => toast.warning(warning));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProgressUpdate = useCallback((newProgress: BatchProgress) => {
    setProgress(newProgress);
  }, []);

  const handleBatchImport = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to import');
      return;
    }

    setIsProcessing(true);
    setShowResults(false);
    
    try {
      const result = await batchProcessingService.batchImport(
        selectedFiles,
        {
          ...importOptions,
          progressCallback: handleProgressUpdate
        }
      );

      setShowResults(true);
      setProgress(prev => ({ ...prev, results: result.results, errors: result.errors }));

      if (result.success) {
        toast.success(`Successfully imported ${result.processingStats.successfulFiles} files`);
      } else {
        toast.warning(`Imported ${result.processingStats.successfulFiles} of ${result.processingStats.totalFiles} files`);
      }

      onImportComplete?.(result);
    } catch (error) {
      console.error('Batch import failed:', error);
      toast.error('Batch import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchExport = async () => {
    if (contentItems.length === 0) {
      toast.error('No content to export');
      return;
    }

    setIsProcessing(true);
    setShowResults(false);

    try {
      const result = await batchProcessingService.batchExport(
        contentItems,
        {
          ...exportOptions,
          progressCallback: handleProgressUpdate
        }
      );

      setShowResults(true);
      setProgress(prev => ({ ...prev, results: result.results, errors: result.errors }));

      if (result.success) {
        // Download all files
        result.outputs.forEach((blob, index) => {
          const filename = result.results[index]?.outputFilename || `export-${index}.${exportOptions.format}`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

        toast.success(`Successfully exported ${result.processingStats.successfulFiles} files`);
      } else {
        toast.warning(`Exported ${result.processingStats.successfulFiles} of ${result.processingStats.totalFiles} files`);
      }

      onExportComplete?.(result);
    } catch (error) {
      console.error('Batch export failed:', error);
      toast.error('Batch export failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {mode === 'import' ? <Upload className="h-5 w-5" /> : <Download className="h-5 w-5" />}
              <h2 className="text-xl font-semibold">
                Batch {mode === 'import' ? 'Import' : 'Export'}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {mode === 'import' ? (
            <div className="space-y-6">
              {/* File Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Files className="h-4 w-4" />
                    Select Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".md,.txt,.html,.htm,.docx,.epub,.pdf,.fdx,.fountain"
                    onChange={handleFileSelection}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-dashed"
                    disabled={isProcessing}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6" />
                      <span>Choose Files to Import</span>
                      <span className="text-xs text-muted-foreground">
                        Supports: .md, .txt, .html, .docx, .epub, .pdf, .fdx, .fountain
                      </span>
                    </div>
                  </Button>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Import Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Import Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={importOptions.extractEntities}
                        onChange={(e) => setImportOptions(prev => ({ 
                          ...prev, 
                          extractEntities: e.target.checked 
                        }))}
                      />
                      <span className="text-sm">Extract entities for codex</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={importOptions.mergeDocuments}
                        onChange={(e) => setImportOptions(prev => ({ 
                          ...prev, 
                          mergeDocuments: e.target.checked 
                        }))}
                      />
                      <span className="text-sm">Merge all documents</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={importOptions.preserveStructure}
                        onChange={(e) => setImportOptions(prev => ({ 
                          ...prev, 
                          preserveStructure: e.target.checked 
                        }))}
                      />
                      <span className="text-sm">Preserve document structure</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Max concurrent:</span>
                      <select
                        value={importOptions.maxConcurrentFiles}
                        onChange={(e) => setImportOptions(prev => ({ 
                          ...prev, 
                          maxConcurrentFiles: parseInt(e.target.value) 
                        }))}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Content Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Files className="h-4 w-4" />
                    Content to Export ({contentItems.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {contentItems.map((item, index) => (
                      <div key={index} className="p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {item.content.split(/\s+/).length} words
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Format:</label>
                      <select
                        value={exportOptions.format}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          format: e.target.value 
                        }))}
                        className="w-full text-sm border rounded px-2 py-1 mt-1"
                      >
                        <option value="md">Markdown</option>
                        <option value="txt">Plain Text</option>
                        <option value="html">HTML</option>
                        <option value="docx">Word Document</option>
                        <option value="pdf">PDF</option>
                        <option value="epub">EPUB</option>
                        <option value="mobi">MOBI</option>
                        <option value="latex">LaTeX</option>
                        <option value="fdx">Final Draft</option>
                        <option value="fountain">Fountain</option>
                        <option value="rtf">RTF</option>
                      </select>
                    </div>
                    
                    {templates.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Template:</label>
                        <select
                          value={exportOptions.templateId || ''}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            templateId: e.target.value || undefined 
                          }))}
                          className="w-full text-sm border rounded px-2 py-1 mt-1"
                        >
                          <option value="">No Template</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.outputOptions?.separateFiles}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          outputOptions: { 
                            ...prev.outputOptions, 
                            separateFiles: e.target.checked,
                            mergeIntoSingle: !e.target.checked
                          }
                        }))}
                      />
                      <span className="text-sm">Separate files</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.outputOptions?.addTimestamp}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          outputOptions: { 
                            ...prev.outputOptions, 
                            addTimestamp: e.target.checked 
                          }
                        }))}
                      />
                      <span className="text-sm">Add timestamp to filenames</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{progress.current}</span>
                    <span>{progress.completed} / {progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {showResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progress.results.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Successful ({progress.results.filter(r => r.success).length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {progress.results.filter(r => r.success).map((result, index) => (
                          <div key={index} className="flex items-center justify-between text-sm p-2 bg-green-50 rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>{result.filename}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {result.size && <span>{formatFileSize(result.size)}</span>}
                              {result.processingTime && <span>{formatDuration(result.processingTime)}</span>}
                              {result.entities && <span>{result.entities} entities</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {progress.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Failed ({progress.errors.length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {progress.errors.map((error, index) => (
                          <div key={index} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>{error.filename}</span>
                            </div>
                            <span className="text-xs text-red-600">{error.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={mode === 'import' ? handleBatchImport : handleBatchExport}
              disabled={
                isProcessing || 
                (mode === 'import' && selectedFiles.length === 0) ||
                (mode === 'export' && contentItems.length === 0)
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'import' ? <Upload className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  {mode === 'import' ? 'Import Files' : 'Export Files'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchProcessingDialog;