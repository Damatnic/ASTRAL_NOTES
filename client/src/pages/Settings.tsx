/**
 * Settings Page - Production Ready
 */

import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Save, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { THEME_OPTIONS } from '@/utils/constants';
import { storageService } from '@/services/storageService';
import { exportService } from '@/services/exportService';
import { usePreferencesAutoSave } from '@/hooks/useAutoSave';
import type { UserPreferences } from '@/types/global';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>(() => storageService.getPreferences());
  const [storageInfo, setStorageInfo] = useState(() => storageService.getStorageInfo());
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Auto-save preferences when they change
  usePreferencesAutoSave(preferences);

  // Update storage info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStorageInfo(storageService.getStorageInfo());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    setPreferences(prev => ({ ...prev, theme: newTheme }));
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleExportData = () => {
    exportService.downloadDataAsJson();
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage('');

    try {
      const result = await exportService.importFromFile(file);
      if (result.success) {
        setImportMessage(`Successfully imported ${result.stats.projectsImported} projects and ${result.stats.notesImported} notes.`);
        // Refresh the page to show imported data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setImportMessage(`Import failed: ${result.message}`);
      }
    } catch (error) {
      setImportMessage('Import failed: Unable to process file.');
    } finally {
      setIsImporting(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      storageService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and data
        </p>
      </div>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>
            Monitor your local storage usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Used</span>
              <span className="text-sm text-muted-foreground">
                {(storageInfo.used / 1024).toFixed(1)} KB of {(storageInfo.total / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              />
            </div>
            {storageInfo.percentage > 80 && (
              <p className="text-sm text-orange-600">
                Storage is getting full. Consider exporting data or cleaning up old projects.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the application looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange(option.value as typeof theme)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Choose between light, dark, or system theme
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Writing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Writing Preferences</CardTitle>
          <CardDescription>
            Configure your writing experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto-save</label>
                <p className="text-xs text-muted-foreground">
                  Automatically save your work as you type
                </p>
              </div>
              <Button 
                variant={preferences.autoSave ? "default" : "outline"} 
                size="sm"
                onClick={() => handlePreferenceChange('autoSave', !preferences.autoSave)}
              >
                {preferences.autoSave ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Sidebar collapsed by default</label>
                <p className="text-xs text-muted-foreground">
                  Start with sidebar minimized
                </p>
              </div>
              <Button 
                variant={preferences.sidebarCollapsed ? "default" : "outline"} 
                size="sm"
                onClick={() => handlePreferenceChange('sidebarCollapsed', !preferences.sidebarCollapsed)}
              >
                {preferences.sidebarCollapsed ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Notifications</label>
                <p className="text-xs text-muted-foreground">
                  Show system notifications
                </p>
              </div>
              <Button 
                variant={preferences.notifications ? "default" : "outline"} 
                size="sm"
                onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
              >
                {preferences.notifications ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Backup, export, and import your writing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Export Data</label>
                <p className="text-xs text-muted-foreground">
                  Download all your projects and notes as JSON
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Import Data</label>
                <p className="text-xs text-muted-foreground">
                  Import projects and notes from JSON file
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  disabled={isImporting}
                  className="hidden"
                  id="import-file"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('import-file')?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </div>
            
            {importMessage && (
              <div className={`text-sm p-3 rounded-md ${
                importMessage.includes('failed') || importMessage.includes('error') 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                {importMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Clear All Data</label>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all projects, notes, and settings
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleClearAllData}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}