/**
 * Attachment Rules Modal
 * Interface for creating and managing automated attachment rules
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  ToggleLeft as Toggle, 
  Filter, 
  Tag, 
  FileText, 
  Calendar, 
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Slider } from '@/components/ui/Slider';
import { projectAttachmentService, type AttachmentRule, type AttachmentCondition, type AttachmentAction } from '@/services/projectAttachmentService';
import { projectService } from '@/services/projectService';
import { quickNotesService } from '@/services/quickNotesService';
import type { Project } from '@/types/global';
import { cn } from '@/utils/cn';

interface AttachmentRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesChanged: () => void;
}

type RuleEditorMode = 'list' | 'create' | 'edit';

interface RuleFormData {
  name: string;
  enabled: boolean;
  priority: number;
  conditions: AttachmentCondition[];
  actions: AttachmentAction[];
}

const DEFAULT_RULE: RuleFormData = {
  name: '',
  enabled: true,
  priority: 1,
  conditions: [],
  actions: []
};

const CONDITION_TYPES = [
  { value: 'tag', label: 'Has Tag', icon: <Tag className="h-4 w-4" /> },
  { value: 'keyword', label: 'Contains Keyword', icon: <FileText className="h-4 w-4" /> },
  { value: 'title', label: 'Title Matches', icon: <FileText className="h-4 w-4" /> },
  { value: 'content', label: 'Content Contains', icon: <FileText className="h-4 w-4" /> },
  { value: 'dateRange', label: 'Created In Range', icon: <Calendar className="h-4 w-4" /> }
];

const OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'regex', label: 'Regex Match' },
  { value: 'between', label: 'Between' }
];

const ACTION_TYPES = [
  { value: 'attach', label: 'Attach to Project', icon: <Target className="h-4 w-4" /> },
  { value: 'suggest', label: 'Suggest Project', icon: <AlertCircle className="h-4 w-4" /> },
  { value: 'tag', label: 'Add Tags', icon: <Tag className="h-4 w-4" /> },
  { value: 'notify', label: 'Send Notification', icon: <AlertCircle className="h-4 w-4" /> }
];

export function AttachmentRulesModal({
  isOpen,
  onClose,
  onRulesChanged
}: AttachmentRulesModalProps) {
  const [mode, setMode] = useState<RuleEditorMode>('list');
  const [rules, setRules] = useState<AttachmentRule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingRule, setEditingRule] = useState<AttachmentRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(DEFAULT_RULE);
  const [testResults, setTestResults] = useState<{ matched: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    try {
      // Load existing rules (would need to implement getAttachmentRules in service)
      const existingRules: AttachmentRule[] = []; // projectAttachmentService.getAttachmentRules();
      setRules(existingRules);
      
      const allProjects = projectService.getAllProjects().filter(p => p.status !== 'deleted');
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading rules data:', error);
    }
  };

  const handleCreateRule = () => {
    setMode('create');
    setFormData(DEFAULT_RULE);
    setEditingRule(null);
  };

  const handleEditRule = (rule: AttachmentRule) => {
    setMode('edit');
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      enabled: rule.enabled,
      priority: rule.priority,
      conditions: [...rule.conditions],
      actions: [...rule.actions]
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      onRulesChanged();
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
    onRulesChanged();
  };

  const handleSaveRule = () => {
    try {
      if (editingRule) {
        // Update existing rule
        setRules(prev => prev.map(rule => 
          rule.id === editingRule.id 
            ? { ...rule, ...formData, updatedAt: new Date().toISOString() }
            : rule
        ));
      } else {
        // Create new rule
        const newRule = projectAttachmentService.createAttachmentRule(formData);
        setRules(prev => [...prev, newRule]);
      }
      
      setMode('list');
      setFormData(DEFAULT_RULE);
      setEditingRule(null);
      onRulesChanged();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleTestRule = () => {
    try {
      const allNotes = quickNotesService.getAllQuickNotes();
      let matchedCount = 0;
      
      // Test rule against all notes
      for (const note of allNotes) {
        const matches = formData.conditions.every(condition => {
          // Simple condition testing (would need full implementation)
          const noteText = (note.title + ' ' + note.content).toLowerCase();
          
          switch (condition.type) {
            case 'tag':
              return Array.isArray(condition.value) 
                ? condition.value.some(tag => note.tags.includes(tag as string))
                : note.tags.includes(condition.value as string);
            case 'keyword':
            case 'content':
              const searchValue = Array.isArray(condition.value) ? condition.value[0] : condition.value;
              return noteText.includes((searchValue as string).toLowerCase());
            case 'title':
              const titleValue = Array.isArray(condition.value) ? condition.value[0] : condition.value;
              return note.title.toLowerCase().includes((titleValue as string).toLowerCase());
            default:
              return false;
          }
        });
        
        if (matches) matchedCount++;
      }
      
      setTestResults({ matched: matchedCount, total: allNotes.length });
    } catch (error) {
      console.error('Error testing rule:', error);
    }
  };

  const handleApplyRules = async () => {
    setIsLoading(true);
    try {
      const appliedCount = projectAttachmentService.applyAttachmentRules();
      alert(`Applied rules to ${appliedCount} notes`);
      onRulesChanged();
    } catch (error) {
      console.error('Error applying rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCondition = () => {
    const newCondition: AttachmentCondition = {
      type: 'tag',
      operator: 'contains',
      value: ''
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (index: number, updates: Partial<AttachmentCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    const newAction: AttachmentAction = {
      type: 'attach'
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (index: number, updates: Partial<AttachmentAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const renderRulesList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Attachment Rules</h3>
          <p className="text-muted-foreground">
            Automate note organization with custom rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleApplyRules}
            disabled={isLoading || rules.filter(r => r.enabled).length === 0}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Apply Rules
          </Button>
          <Button onClick={handleCreateRule} className="gap-2">
            <Plus className="h-4 w-4" />
            New Rule
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <Card className="p-8 text-center">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">No rules configured</h4>
          <p className="text-muted-foreground mb-4">
            Create your first attachment rule to automate note organization
          </p>
          <Button onClick={handleCreateRule} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Rule
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant="outline">
                      Priority {rule.priority}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>
                      <strong>Conditions:</strong> {rule.conditions.length} rule{rule.conditions.length !== 1 ? 's' : ''}
                      {rule.conditions.slice(0, 2).map((condition, index) => (
                        <span key={index} className="ml-2">
                          • {CONDITION_TYPES.find(t => t.value === condition.type)?.label}
                        </span>
                      ))}
                      {rule.conditions.length > 2 && (
                        <span className="ml-2">... +{rule.conditions.length - 2} more</span>
                      )}
                    </div>
                    
                    <div>
                      <strong>Actions:</strong> {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                      {rule.actions.slice(0, 2).map((action, index) => (
                        <span key={index} className="ml-2">
                          • {ACTION_TYPES.find(t => t.value === action.type)?.label}
                        </span>
                      ))}
                      {rule.actions.length > 2 && (
                        <span className="ml-2">... +{rule.actions.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id)}
                    className="gap-2"
                  >
                    <Toggle className="h-4 w-4" />
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderRuleForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {mode === 'create' ? 'Create New Rule' : 'Edit Rule'}
          </h3>
          <p className="text-muted-foreground">
            Define conditions and actions for automatic note attachment
          </p>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rule Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter rule name"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Enable this rule</span>
          </label>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Priority:</label>
            <div className="flex items-center gap-2">
              <Slider
                value={[formData.priority]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, priority: value }))}
                min={1}
                max={10}
                step={1}
                className="w-24"
              />
              <span className="text-sm w-6">{formData.priority}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Conditions</h4>
          <Button variant="outline" size="sm" onClick={addCondition} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Condition
          </Button>
        </div>

        {formData.conditions.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-muted-foreground">No conditions defined</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {formData.conditions.map((condition, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-3">
                  <Dropdown
                    options={CONDITION_TYPES.map(type => ({
                      value: type.value,
                      label: type.label
                    }))}
                    value={condition.type}
                    onChange={(value) => updateCondition(index, { type: value as any })}
                    placeholder="Condition type"
                  />

                  <Dropdown
                    options={OPERATORS.filter(op => 
                      condition.type === 'dateRange' ? op.value === 'between' : op.value !== 'between'
                    )}
                    value={condition.operator}
                    onChange={(value) => updateCondition(index, { operator: value as any })}
                    placeholder="Operator"
                  />

                  <Input
                    value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value as string}
                    onChange={(e) => updateCondition(index, { 
                      value: condition.type === 'tag' ? e.target.value.split(',').map(s => s.trim()) : e.target.value 
                    })}
                    placeholder={
                      condition.type === 'tag' ? 'tag1, tag2, ...' :
                      condition.type === 'dateRange' ? 'YYYY-MM-DD,YYYY-MM-DD' :
                      'Enter value'
                    }
                    className="flex-1"
                  />

                  {condition.type !== 'dateRange' && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={condition.caseSensitive}
                        onChange={(e) => updateCondition(index, { caseSensitive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      Case sensitive
                    </label>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Actions</h4>
          <Button variant="outline" size="sm" onClick={addAction} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Action
          </Button>
        </div>

        {formData.actions.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-muted-foreground">No actions defined</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {formData.actions.map((action, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-3">
                  <Dropdown
                    options={ACTION_TYPES.map(type => ({
                      value: type.value,
                      label: type.label
                    }))}
                    value={action.type}
                    onChange={(value) => updateAction(index, { type: value as any })}
                    placeholder="Action type"
                  />

                  {(action.type === 'attach' || action.type === 'suggest') && (
                    <Dropdown
                      options={projects.map(project => ({
                        value: project.id,
                        label: project.title
                      }))}
                      value={action.projectId || ''}
                      onChange={(value) => updateAction(index, { projectId: value })}
                      placeholder="Select project"
                      className="flex-1"
                    />
                  )}

                  {action.type === 'tag' && (
                    <Input
                      value={action.tags?.join(', ') || ''}
                      onChange={(e) => updateAction(index, { 
                        tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="tag1, tag2, ..."
                      className="flex-1"
                    />
                  )}

                  {action.type === 'suggest' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Confidence:</span>
                      <Slider
                        value={[action.confidence || 0.5]}
                        onValueChange={([value]) => updateAction(index, { confidence: value })}
                        min={0.1}
                        max={1}
                        step={0.1}
                        className="w-24"
                      />
                      <span className="text-sm w-8">{Math.round((action.confidence || 0.5) * 100)}%</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Test Rule */}
      <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
        <Button variant="outline" onClick={handleTestRule} className="gap-2">
          <Play className="h-4 w-4" />
          Test Rule
        </Button>
        {testResults && (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              Matches {testResults.matched} of {testResults.total} notes
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const handleClose = () => {
    setMode('list');
    setFormData(DEFAULT_RULE);
    setEditingRule(null);
    setTestResults(null);
    onClose();
  };

  const isFormValid = formData.name.trim() && formData.conditions.length > 0 && formData.actions.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="large">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Attachment Rules</h2>
            <p className="text-muted-foreground">
              Create automated rules for organizing your notes
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {mode === 'list' ? renderRulesList() : renderRuleForm()}
        </div>

        {/* Actions */}
        {mode !== 'list' && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {formData.conditions.length} condition{formData.conditions.length !== 1 ? 's' : ''}, {' '}
              {formData.actions.length} action{formData.actions.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setMode('list')}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRule}
                disabled={!isFormValid}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Rule
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}