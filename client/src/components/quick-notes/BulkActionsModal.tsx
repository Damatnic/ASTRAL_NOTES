/**
 * Bulk Actions Modal Component
 * Modal for performing bulk operations on selected quick notes
 */

import React, { useState } from 'react';
import { X, Trash2, Archive, FolderOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/utils/cn';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  availableProjects: Array<{ id: string; title: string }>;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkAttachToProject: (projectId: string) => void;
}

type BulkAction = 'delete' | 'archive' | 'attach';

export function BulkActionsModal({
  isOpen,
  onClose,
  selectedCount,
  availableProjects,
  onBulkDelete,
  onBulkArchive,
  onBulkAttachToProject,
}: BulkActionsModalProps) {
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedProject = availableProjects.find(p => p.id === selectedProjectId);

  const handleActionSelect = (action: BulkAction) => {
    setSelectedAction(action);
    if (action === 'attach') {
      setSelectedProjectId('');
    } else {
      setShowConfirmation(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      switch (selectedAction) {
        case 'delete':
          onBulkDelete();
          break;
        case 'archive':
          onBulkArchive();
          break;
        case 'attach':
          if (selectedProjectId) {
            onBulkAttachToProject(selectedProjectId);
          }
          break;
      }
      onClose();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
      setSelectedAction(null);
      setSelectedProjectId('');
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedAction(null);
    setSelectedProjectId('');
  };

  const getActionInfo = (action: BulkAction) => {
    switch (action) {
      case 'delete':
        return {
          title: 'Delete Notes',
          description: `Permanently delete ${selectedCount} selected note${selectedCount === 1 ? '' : 's'}?`,
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          buttonText: 'Delete',
          buttonVariant: 'destructive' as const,
          warning: 'This action cannot be undone.',
        };
      case 'archive':
        return {
          title: 'Archive Notes',
          description: `Archive ${selectedCount} selected note${selectedCount === 1 ? '' : 's'}?`,
          icon: <Archive className="h-5 w-5 text-blue-500" />,
          buttonText: 'Archive',
          buttonVariant: 'default' as const,
          warning: 'Archived notes can be restored later.',
        };
      case 'attach':
        return {
          title: 'Attach to Project',
          description: `Attach ${selectedCount} selected note${selectedCount === 1 ? '' : 's'} to "${selectedProject?.title}"?`,
          icon: <FolderOpen className="h-5 w-5 text-green-500" />,
          buttonText: 'Attach',
          buttonVariant: 'default' as const,
          warning: 'Notes will be linked to the selected project.',
        };
      default:
        return null;
    }
  };

  const actionInfo = selectedAction ? getActionInfo(selectedAction) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Bulk Actions
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!showConfirmation ? (
          /* Action Selection */
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {selectedCount} note{selectedCount === 1 ? '' : 's'} selected
            </div>

            <div className="space-y-2">
              {/* Archive Action */}
              <Button
                variant="outline"
                onClick={() => handleActionSelect('archive')}
                className="w-full justify-start gap-3 p-4 h-auto"
                disabled={isProcessing}
              >
                <Archive className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Archive Notes</div>
                  <div className="text-sm text-muted-foreground">
                    Move selected notes to archive
                  </div>
                </div>
              </Button>

              {/* Attach to Project */}
              {availableProjects.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => handleActionSelect('attach')}
                    className="w-full justify-start gap-3 p-4 h-auto"
                    disabled={isProcessing}
                  >
                    <FolderOpen className="h-5 w-5 text-green-500" />
                    <div className="text-left">
                      <div className="font-medium">Attach to Project</div>
                      <div className="text-sm text-muted-foreground">
                        Link notes to a project
                      </div>
                    </div>
                  </Button>

                  {/* Project Selection */}
                  {selectedAction === 'attach' && (
                    <div className="ml-8 space-y-2">
                      <div className="text-sm font-medium text-foreground">
                        Select project:
                      </div>
                      <Dropdown
                        trigger={
                          <Button variant="outline" className="w-full justify-between">
                            <span>{selectedProject?.title || 'Choose project...'}</span>
                          </Button>
                        }
                      >
                        <div className="p-1 space-y-1 max-h-64 overflow-y-auto">
                          {availableProjects.map(project => (
                            <Button
                              key={project.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProjectId(project.id)}
                              className={cn(
                                'w-full justify-start',
                                selectedProjectId === project.id && 'bg-accent'
                              )}
                            >
                              {project.title}
                            </Button>
                          ))}
                        </div>
                      </Dropdown>
                      
                      {selectedProjectId && (
                        <Button
                          onClick={() => setShowConfirmation(true)}
                          className="w-full gap-2"
                          disabled={isProcessing}
                        >
                          <FolderOpen className="h-4 w-4" />
                          Attach to {selectedProject?.title}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Delete Action */}
              <Button
                variant="outline"
                onClick={() => handleActionSelect('delete')}
                className="w-full justify-start gap-3 p-4 h-auto border-red-200 hover:border-red-300 hover:bg-red-50"
                disabled={isProcessing}
              >
                <Trash2 className="h-5 w-5 text-red-500" />
                <div className="text-left">
                  <div className="font-medium text-red-700">Delete Notes</div>
                  <div className="text-sm text-red-600">
                    Permanently remove selected notes
                  </div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation Dialog */
          actionInfo && (
            <div className="space-y-6">
              {/* Icon and Title */}
              <div className="flex items-center gap-3">
                {actionInfo.icon}
                <h3 className="text-lg font-semibold text-foreground">
                  {actionInfo.title}
                </h3>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-foreground">
                  {actionInfo.description}
                </p>
                
                {/* Warning */}
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-md text-sm',
                  selectedAction === 'delete' 
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                )}>
                  {selectedAction === 'delete' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {actionInfo.warning}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionInfo.buttonVariant}
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {actionInfo.icon}
                      {actionInfo.buttonText}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}