/**
 * Batch Processing Service
 * Handles batch import/export operations for multiple files
 */

import { documentParserService } from './documentParserService';
import { entityExtractionService } from './entityExtractionService';
import { importExportService } from './importExportService';
import { templateEngineService } from './templateEngineService';

export interface BatchImportOptions {
  extractEntities?: boolean;
  mergeDocuments?: boolean;
  preserveStructure?: boolean;
  maxConcurrentFiles?: number;
  progressCallback?: (progress: BatchProgress) => void;
}

export interface BatchExportOptions {
  format: string;
  templateId?: string;
  outputOptions?: {
    separateFiles?: boolean;
    mergeIntoSingle?: boolean;
    addTimestamp?: boolean;
    customFilenames?: string[];
  };
  maxConcurrentFiles?: number;
  progressCallback?: (progress: BatchProgress) => void;
}

export interface BatchProgress {
  total: number;
  completed: number;
  current: string;
  errors: BatchError[];
  results: BatchResult[];
}

export interface BatchError {
  filename: string;
  error: string;
  timestamp: Date;
}

export interface BatchResult {
  filename: string;
  success: boolean;
  outputFilename?: string;
  size?: number;
  processingTime?: number;
  entities?: number;
}

export interface BatchImportResult {
  success: boolean;
  results: BatchResult[];
  errors: BatchError[];
  mergedContent?: string;
  totalEntities?: number;
  processingStats: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    totalProcessingTime: number;
  };
}

export interface BatchExportResult {
  success: boolean;
  results: BatchResult[];
  errors: BatchError[];
  outputs: Blob[];
  processingStats: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    totalProcessingTime: number;
  };
}

class BatchProcessingService {
  private maxConcurrentDefault = 3;

  /**
   * Import multiple files in batch
   */
  public async batchImport(
    files: File[],
    options: BatchImportOptions = {}
  ): Promise<BatchImportResult> {
    const startTime = Date.now();
    const maxConcurrent = options.maxConcurrentFiles || this.maxConcurrentDefault;
    const results: BatchResult[] = [];
    const errors: BatchError[] = [];
    let mergedContent = '';
    let totalEntities = 0;

    const progress: BatchProgress = {
      total: files.length,
      completed: 0,
      current: '',
      errors: [],
      results: []
    };

    // Process files in batches to avoid overwhelming the system
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (file) => {
        const fileStartTime = Date.now();
        progress.current = file.name;
        options.progressCallback?.(progress);

        try {
          // Import the file
          const importResult = await importExportService.importProject(
            file,
            undefined,
            {
              preserveStructure: options.preserveStructure,
              detectFormat: true
            },
            {
              extractEntities: options.extractEntities,
              includeRelationships: true
            }
          );

          if (importResult.success) {
            const processingTime = Date.now() - fileStartTime;
            const entityCount = importResult.entities?.length || 0;
            
            const result: BatchResult = {
              filename: file.name,
              success: true,
              size: file.size,
              processingTime,
              entities: entityCount
            };

            results.push(result);
            totalEntities += entityCount;

            // Merge content if requested
            if (options.mergeDocuments && importResult.content) {
              mergedContent += `\n\n<!-- ${file.name} -->\n${importResult.content}`;
            }

            progress.completed++;
            progress.results = [...results];
            options.progressCallback?.(progress);
          } else {
            throw new Error(importResult.error || 'Import failed');
          }
        } catch (error) {
          const batchError: BatchError = {
            filename: file.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          };
          errors.push(batchError);
          
          results.push({
            filename: file.name,
            success: false,
            size: file.size,
            processingTime: Date.now() - fileStartTime
          });

          progress.completed++;
          progress.errors = [...errors];
          options.progressCallback?.(progress);
        }
      });

      await Promise.all(batchPromises);
    }

    const totalProcessingTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      results,
      errors,
      mergedContent: mergedContent.trim(),
      totalEntities,
      processingStats: {
        totalFiles: files.length,
        successfulFiles: results.filter(r => r.success).length,
        failedFiles: errors.length,
        totalProcessingTime
      }
    };
  }

  /**
   * Export multiple pieces of content in batch
   */
  public async batchExport(
    contentItems: Array<{
      content: string;
      title: string;
      author?: string;
      metadata?: Record<string, any>;
    }>,
    options: BatchExportOptions
  ): Promise<BatchExportResult> {
    const startTime = Date.now();
    const maxConcurrent = options.maxConcurrentFiles || this.maxConcurrentDefault;
    const results: BatchResult[] = [];
    const errors: BatchError[] = [];
    const outputs: Blob[] = [];

    const progress: BatchProgress = {
      total: contentItems.length,
      completed: 0,
      current: '',
      errors: [],
      results: []
    };

    // If merging into single file, combine all content first
    if (options.outputOptions?.mergeIntoSingle) {
      try {
        const mergedContent = contentItems
          .map(item => `# ${item.title}\n\n${item.content}`)
          .join('\n\n---\n\n');

        const exportResult = await importExportService.exportContent(
          mergedContent,
          options.format as any,
          {
            title: 'Batch Export',
            author: contentItems[0]?.author || 'Unknown',
            metadata: { batchExport: true, itemCount: contentItems.length }
          }
        );

        if (exportResult.success && exportResult.blob) {
          outputs.push(exportResult.blob);
          results.push({
            filename: 'batch-export',
            success: true,
            outputFilename: `batch-export.${options.format}`,
            size: exportResult.blob.size,
            processingTime: Date.now() - startTime
          });
        } else {
          throw new Error(exportResult.error || 'Export failed');
        }
      } catch (error) {
        errors.push({
          filename: 'batch-export',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    } else {
      // Process files in batches
      for (let i = 0; i < contentItems.length; i += maxConcurrent) {
        const batch = contentItems.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (item, batchIndex) => {
          const globalIndex = i + batchIndex;
          const fileStartTime = Date.now();
          progress.current = item.title;
          options.progressCallback?.(progress);

          try {
            let finalContent = item.content;

            // Apply template if specified
            if (options.templateId) {
              const templateEngine = new templateEngineService();
              const context = {
                title: item.title,
                content: item.content,
                htmlContent: item.content,
                author: item.author || 'Unknown Author',
                genre: '',
                wordCount: item.content.split(/\s+/).length,
                createdAt: new Date().toISOString(),
                exportedAt: new Date().toISOString(),
                chapters: [],
                paragraphs: item.content.split('\n\n').map((text, index) => ({
                  number: index + 1,
                  content: text
                })),
                metadata: item.metadata || {}
              };
              finalContent = await templateEngine.renderTemplate(options.templateId, context);
            }

            const exportResult = await importExportService.exportContent(
              finalContent,
              options.format as any,
              {
                title: item.title,
                author: item.author || 'Unknown',
                metadata: item.metadata || {}
              }
            );

            if (exportResult.success && exportResult.blob) {
              const processingTime = Date.now() - fileStartTime;
              const filename = options.outputOptions?.customFilenames?.[globalIndex] || 
                             `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
              const outputFilename = options.outputOptions?.addTimestamp 
                ? `${filename}_${Date.now()}.${options.format}`
                : `${filename}.${options.format}`;

              outputs.push(exportResult.blob);
              results.push({
                filename: item.title,
                success: true,
                outputFilename,
                size: exportResult.blob.size,
                processingTime
              });

              progress.completed++;
              progress.results = [...results];
              options.progressCallback?.(progress);
            } else {
              throw new Error(exportResult.error || 'Export failed');
            }
          } catch (error) {
            const batchError: BatchError = {
              filename: item.title,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            };
            errors.push(batchError);
            
            results.push({
              filename: item.title,
              success: false,
              processingTime: Date.now() - fileStartTime
            });

            progress.completed++;
            progress.errors = [...errors];
            options.progressCallback?.(progress);
          }
        });

        await Promise.all(batchPromises);
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      results,
      errors,
      outputs,
      processingStats: {
        totalFiles: contentItems.length,
        successfulFiles: results.filter(r => r.success).length,
        failedFiles: errors.length,
        totalProcessingTime
      }
    };
  }

  /**
   * Get processing statistics
   */
  public getProcessingStats() {
    return {
      maxConcurrentDefault: this.maxConcurrentDefault,
      supportedImportFormats: [
        'docx', 'pdf', 'epub', 'html', 'md', 'txt', 'fdx', 'fountain'
      ],
      supportedExportFormats: [
        'md', 'txt', 'html', 'docx', 'pdf', 'epub', 'mobi', 'latex', 
        'fdx', 'fountain', 'rtf', 'json'
      ]
    };
  }

  /**
   * Validate files before batch processing
   */
  public validateBatch(files: File[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (files.length === 0) {
      errors.push('No files selected');
    }

    if (files.length > 50) {
      warnings.push('Large batch size may impact performance');
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (totalSize > maxSize) {
      errors.push('Total file size exceeds 100MB limit');
    }

    // Check for unsupported formats
    const supportedExtensions = [
      'docx', 'pdf', 'epub', 'html', 'htm', 'md', 'txt', 'fdx', 'fountain'
    ];
    
    files.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !supportedExtensions.includes(extension)) {
        warnings.push(`Unsupported format: ${file.name}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const batchProcessingService = new BatchProcessingService();