/**
 * Import/Export Modal Component
 * Modal for importing and exporting quick notes
 */

import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileText, FileJson, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (data: string) => void;
}

type ExportFormat = 'markdown' | 'json' | 'text';
type ImportResult = { success: boolean; imported: number; errors: string[] } | null;

const EXPORT_FORMATS = [
  {
    value: 'markdown' as const,
    label: 'Markdown',
    description: 'Human-readable format with formatting',
    icon: <FileText className="h-4 w-4" />,
    extension: 'md',
  },
  {
    value: 'json' as const,
    label: 'JSON',
    description: 'Complete data with all metadata',
    icon: <FileJson className="h-4 w-4" />,
    extension: 'json',
  },
  {
    value: 'text' as const,
    label: 'Plain Text',
    description: 'Simple text format',
    icon: <FileText className="h-4 w-4" />,
    extension: 'txt',
  },
];

export function ImportExportModal({
  isOpen,
  onClose,
  onExport,
  onImport,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<ImportResult>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await onExport();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) return;

    setIsProcessing(true);
    try {
      await onImport(importData.trim());
      setImportData('');
      setImportResult({
        success: true,
        imported: 0, // This would be set by the actual import function
        errors: [],
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyToClipboard = async () => {
    if (!importData) return;

    try {
      await navigator.clipboard.writeText(importData);
      // Could show a toast here
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const selectedFormatInfo = EXPORT_FORMATS.find(f => f.value === selectedFormat);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Import & Export
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab('export')}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'export'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Export
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'import'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Import
            </button>
          </div>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Export Quick Notes
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Download your quick notes in your preferred format.
              </p>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Export Format
              </label>
              
              <div className="grid gap-3">
                {EXPORT_FORMATS.map(format => (
                  <button
                    key={format.value}
                    onClick={() => setSelectedFormat(format.value)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                      selectedFormat === format.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-md',
                      selectedFormat === format.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {format.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format.description}
                      </div>
                    </div>
                    {selectedFormat === format.value && (
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export as {selectedFormatInfo?.label}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Import Quick Notes
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Import quick notes from a JSON file or paste JSON data directly.
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Upload File
              </label>
              
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <div className="text-sm text-muted-foreground mb-3">
                  Drag & drop a JSON file here, or
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </Button>
              </div>
            </div>

            {/* Manual Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  Or Paste JSON Data
                </label>
                {importData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="gap-2"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                )}
              </div>
              
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your JSON data here..."
                className="w-full h-32 p-3 text-sm border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={cn(
                'p-4 rounded-lg border',
                importResult.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </span>
                </div>
                
                {importResult.success && (
                  <div className="text-sm">
                    Successfully imported {importResult.imported} note{importResult.imported === 1 ? '' : 's'}.
                  </div>
                )}
                
                {importResult.errors.length > 0 && (
                  <div className="text-sm mt-2">
                    <div className="font-medium mb-1">Errors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Import Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importData.trim() || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Notes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}