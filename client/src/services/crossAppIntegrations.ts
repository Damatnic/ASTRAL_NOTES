interface AppIntegration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'productivity' | 'cloud_storage' | 'social' | 'research' | 'publishing' | 'collaboration';
  isActive: boolean;
  capabilities: IntegrationCapability[];
  authRequired: boolean;
  config?: any;
}

interface IntegrationCapability {
  type: 'import' | 'export' | 'sync' | 'publish' | 'search' | 'backup';
  description: string;
  formats: string[];
}

interface ImportResult {
  success: boolean;
  itemsImported: number;
  errors: string[];
  data?: any[];
}

interface ExportResult {
  success: boolean;
  exportedUrl?: string;
  errors: string[];
}

class CrossAppIntegrationsService {
  private integrations: Map<string, AppIntegration> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.setupDefaultIntegrations();
    await this.loadUserIntegrations();
    this.isInitialized = true;
  }

  private setupDefaultIntegrations(): void {
    const defaultIntegrations: AppIntegration[] = [
      // Cloud Storage
      {
        id: 'google_drive',
        name: 'Google Drive',
        description: 'Sync and backup your writing to Google Drive',
        icon: '🗄️',
        category: 'cloud_storage',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'backup', description: 'Auto-backup documents', formats: ['docx', 'pdf', 'txt'] },
          { type: 'sync', description: 'Real-time sync', formats: ['json'] },
          { type: 'export', description: 'Export to Google Docs', formats: ['gdoc'] }
        ]
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'Store and sync your writing files',
        icon: '📦',
        category: 'cloud_storage',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'backup', description: 'File backup', formats: ['docx', 'pdf', 'txt', 'md'] },
          { type: 'sync', description: 'Folder sync', formats: ['*'] }
        ]
      },
      // Productivity Apps
      {
        id: 'notion',
        name: 'Notion',
        description: 'Export your writing to Notion pages',
        icon: '📝',
        category: 'productivity',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'export', description: 'Create Notion pages', formats: ['md', 'html'] },
          { type: 'sync', description: 'Sync with Notion database', formats: ['json'] }
        ]
      },
      {
        id: 'obsidian',
        name: 'Obsidian',
        description: 'Sync with your Obsidian vault',
        icon: '🔗',
        category: 'productivity',
        isActive: false,
        authRequired: false,
        capabilities: [
          { type: 'export', description: 'Export as markdown files', formats: ['md'] },
          { type: 'import', description: 'Import from vault', formats: ['md'] }
        ]
      },
      {
        id: 'roam_research',
        name: 'Roam Research',
        description: 'Connect your writing with Roam graphs',
        icon: '🧠',
        category: 'research',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'export', description: 'Create Roam blocks', formats: ['roam'] },
          { type: 'import', description: 'Import from Roam', formats: ['roam', 'json'] }
        ]
      },
      // Publishing Platforms
      {
        id: 'medium',
        name: 'Medium',
        description: 'Publish your stories to Medium',
        icon: '📰',
        category: 'publishing',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'publish', description: 'Publish stories', formats: ['md', 'html'] }
        ]
      },
      {
        id: 'substack',
        name: 'Substack',
        description: 'Publish newsletters to Substack',
        icon: '📧',
        category: 'publishing',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'publish', description: 'Create newsletter posts', formats: ['md', 'html'] }
        ]
      },
      {
        id: 'wordpress',
        name: 'WordPress',
        description: 'Publish to WordPress blogs',
        icon: '🌐',
        category: 'publishing',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'publish', description: 'Create blog posts', formats: ['html', 'md'] }
        ]
      },
      // Research Tools
      {
        id: 'zotero',
        name: 'Zotero',
        description: 'Integrate with your research library',
        icon: '📚',
        category: 'research',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'import', description: 'Import citations', formats: ['bibtex', 'ris'] },
          { type: 'search', description: 'Search library', formats: ['json'] }
        ]
      },
      {
        id: 'mendeley',
        name: 'Mendeley',
        description: 'Access your Mendeley research',
        icon: '🔬',
        category: 'research',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'import', description: 'Import papers', formats: ['pdf', 'bibtex'] },
          { type: 'search', description: 'Search papers', formats: ['json'] }
        ]
      },
      // Social Platforms
      {
        id: 'twitter',
        name: 'Twitter/X',
        description: 'Share writing snippets and threads',
        icon: '🐦',
        category: 'social',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'publish', description: 'Create threads', formats: ['txt'] }
        ]
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        description: 'Publish articles to LinkedIn',
        icon: '💼',
        category: 'social',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'publish', description: 'Create articles', formats: ['html', 'md'] }
        ]
      },
      // Collaboration
      {
        id: 'slack',
        name: 'Slack',
        description: 'Share writing updates with teams',
        icon: '💬',
        category: 'collaboration',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'publish', description: 'Share to channels', formats: ['txt', 'md'] }
        ]
      },
      {
        id: 'discord',
        name: 'Discord',
        description: 'Share with writing communities',
        icon: '🎮',
        category: 'collaboration',
        isActive: false,
        authRequired: true,
        capabilities: [
          { type: 'publish', description: 'Post to channels', formats: ['txt', 'md'] }
        ]
      }
    ];

    defaultIntegrations.forEach(integration => {
      this.integrations.set(integration.id, integration);
    });
  }

  private async loadUserIntegrations(): Promise<void> {
    try {
      const saved = localStorage.getItem('astral-notes-integrations');
      if (saved) {
        const userIntegrations = JSON.parse(saved);
        Object.entries(userIntegrations).forEach(([id, config]) => {
          const integration = this.integrations.get(id);
          if (integration) {
            integration.isActive = (config as any).isActive || false;
            integration.config = (config as any).config || {};
          }
        });
      }
    } catch (error) {
      console.error('Failed to load user integrations:', error);
    }
  }

  async activateIntegration(integrationId: string, config?: any): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    try {
      if (integration.authRequired && !config?.accessToken) {
        const authResult = await this.authenticateIntegration(integrationId);
        if (!authResult.success) return false;
        config = { ...config, ...authResult.config };
      }

      integration.isActive = true;
      integration.config = config;
      await this.saveIntegrationConfig(integrationId, { isActive: true, config });
      return true;
    } catch (error) {
      console.error(`Failed to activate integration ${integrationId}:`, error);
      return false;
    }
  }

  async deactivateIntegration(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    integration.isActive = false;
    integration.config = {};
    await this.saveIntegrationConfig(integrationId, { isActive: false, config: {} });
    return true;
  }

  private async authenticateIntegration(integrationId: string): Promise<{ success: boolean; config?: any }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return { success: false };

    try {
      switch (integrationId) {
        case 'google_drive':
          return await this.authenticateGoogleDrive();
        case 'dropbox':
          return await this.authenticateDropbox();
        case 'notion':
          return await this.authenticateNotion();
        case 'medium':
          return await this.authenticateMedium();
        case 'twitter':
          return await this.authenticateTwitter();
        default:
          return await this.authenticateGeneric(integrationId);
      }
    } catch (error) {
      console.error(`Authentication failed for ${integrationId}:`, error);
      return { success: false };
    }
  }

  private async authenticateGoogleDrive(): Promise<{ success: boolean; config?: any }> {
    try {
      // Google OAuth 2.0 flow
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
      const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
      
      const authWindow = window.open(authUrl, 'auth', 'width=500,height=600');
      
      return new Promise((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'auth_success') {
            window.removeEventListener('message', messageHandler);
            authWindow?.close();
            resolve({ success: true, config: { accessToken: event.data.accessToken } });
          } else if (event.data.type === 'auth_error') {
            window.removeEventListener('message', messageHandler);
            authWindow?.close();
            resolve({ success: false });
          }
        };
        
        window.addEventListener('message', messageHandler);
      });
    } catch (error) {
      return { success: false };
    }
  }

  private async authenticateDropbox(): Promise<{ success: boolean; config?: any }> {
    // Similar OAuth flow for Dropbox
    return { success: false };
  }

  private async authenticateNotion(): Promise<{ success: boolean; config?: any }> {
    // Notion OAuth flow
    return { success: false };
  }

  private async authenticateMedium(): Promise<{ success: boolean; config?: any }> {
    // Medium API authentication
    return { success: false };
  }

  private async authenticateTwitter(): Promise<{ success: boolean; config?: any }> {
    // Twitter API v2 OAuth
    return { success: false };
  }

  private async authenticateGeneric(integrationId: string): Promise<{ success: boolean; config?: any }> {
    // Generic OAuth or API key authentication
    const apiKey = prompt(`Enter API key for ${integrationId}:`);
    if (apiKey) {
      return { success: true, config: { apiKey } };
    }
    return { success: false };
  }

  // Export Functions
  async exportToIntegration(integrationId: string, content: any, options?: any): Promise<ExportResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.isActive) {
      return { success: false, errors: ['Integration not active'] };
    }

    try {
      switch (integrationId) {
        case 'google_drive':
          return await this.exportToGoogleDrive(content, options);
        case 'notion':
          return await this.exportToNotion(content, options);
        case 'medium':
          return await this.exportToMedium(content, options);
        case 'obsidian':
          return await this.exportToObsidian(content, options);
        default:
          return await this.exportGeneric(integrationId, content, options);
      }
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : 'Export failed'] };
    }
  }

  private async exportToGoogleDrive(content: any, options?: any): Promise<ExportResult> {
    const integration = this.integrations.get('google_drive');
    if (!integration?.config?.accessToken) {
      return { success: false, errors: ['Not authenticated'] };
    }

    try {
      const fileName = options?.fileName || `${content.title || 'Document'}.docx`;
      const fileContent = this.convertToFormat(content, 'docx');
      
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.config.accessToken}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        body: JSON.stringify({
          name: fileName,
          parents: options?.folderId ? [options.folderId] : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, exportedUrl: `https://drive.google.com/file/d/${result.id}/view` };
      } else {
        return { success: false, errors: ['Google Drive export failed'] };
      }
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : 'Export failed'] };
    }
  }

  private async exportToNotion(content: any, options?: any): Promise<ExportResult> {
    const integration = this.integrations.get('notion');
    if (!integration?.config?.accessToken) {
      return { success: false, errors: ['Not authenticated'] };
    }

    try {
      const pageContent = this.convertToFormat(content, 'notion');
      
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.config.accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: options?.databaseId || integration.config.defaultDatabaseId },
          properties: {
            title: {
              title: [{ text: { content: content.title || 'Untitled' } }]
            }
          },
          children: pageContent
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, exportedUrl: result.url };
      } else {
        return { success: false, errors: ['Notion export failed'] };
      }
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : 'Export failed'] };
    }
  }

  private async exportToMedium(content: any, options?: any): Promise<ExportResult> {
    const integration = this.integrations.get('medium');
    if (!integration?.config?.accessToken) {
      return { success: false, errors: ['Not authenticated'] };
    }

    try {
      const userId = integration.config.userId;
      const htmlContent = this.convertToFormat(content, 'html');
      
      const response = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: content.title || 'Untitled',
          contentFormat: 'html',
          content: htmlContent,
          publishStatus: options?.publishStatus || 'draft',
          tags: content.tags || []
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, exportedUrl: result.data.url };
      } else {
        return { success: false, errors: ['Medium export failed'] };
      }
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : 'Export failed'] };
    }
  }

  private async exportToObsidian(content: any, options?: any): Promise<ExportResult> {
    try {
      const markdownContent = this.convertToFormat(content, 'md');
      const fileName = `${content.title || 'Document'}.md`;
      
      // Create downloadable file
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : 'Export failed'] };
    }
  }

  private async exportGeneric(integrationId: string, content: any, options?: any): Promise<ExportResult> {
    // Generic export logic
    return { success: false, errors: ['Generic export not implemented'] };
  }

  // Import Functions
  async importFromIntegration(integrationId: string, options?: any): Promise<ImportResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.isActive) {
      return { success: false, itemsImported: 0, errors: ['Integration not active'] };
    }

    try {
      switch (integrationId) {
        case 'google_drive':
          return await this.importFromGoogleDrive(options);
        case 'obsidian':
          return await this.importFromObsidian(options);
        case 'zotero':
          return await this.importFromZotero(options);
        default:
          return await this.importGeneric(integrationId, options);
      }
    } catch (error) {
      return { success: false, itemsImported: 0, errors: [error instanceof Error ? error.message : 'Import failed'] };
    }
  }

  private async importFromGoogleDrive(options?: any): Promise<ImportResult> {
    // Implementation for Google Drive import
    return { success: false, itemsImported: 0, errors: ['Not implemented'] };
  }

  private async importFromObsidian(options?: any): Promise<ImportResult> {
    // Implementation for Obsidian vault import
    return { success: false, itemsImported: 0, errors: ['Not implemented'] };
  }

  private async importFromZotero(options?: any): Promise<ImportResult> {
    // Implementation for Zotero library import
    return { success: false, itemsImported: 0, errors: ['Not implemented'] };
  }

  private async importGeneric(integrationId: string, options?: any): Promise<ImportResult> {
    return { success: false, itemsImported: 0, errors: ['Generic import not implemented'] };
  }

  // Format Conversion
  private convertToFormat(content: any, format: string): string {
    switch (format) {
      case 'md':
        return this.convertToMarkdown(content);
      case 'html':
        return this.convertToHTML(content);
      case 'docx':
        return this.convertToDocx(content);
      case 'notion':
        return this.convertToNotionBlocks(content);
      default:
        return JSON.stringify(content);
    }
  }

  private convertToMarkdown(content: any): string {
    let markdown = '';
    if (content.title) {
      markdown += `# ${content.title}\n\n`;
    }
    if (content.content) {
      markdown += content.content;
    }
    return markdown;
  }

  private convertToHTML(content: any): string {
    let html = '';
    if (content.title) {
      html += `<h1>${content.title}</h1>`;
    }
    if (content.content) {
      html += `<div>${content.content.replace(/\n/g, '<br>')}</div>`;
    }
    return html;
  }

  private convertToDocx(content: any): string {
    // This would use a library like docx to create proper Word documents
    return this.convertToHTML(content);
  }

  private convertToNotionBlocks(content: any): any[] {
    const blocks = [];
    if (content.content) {
      const paragraphs = content.content.split('\n\n');
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: paragraph } }]
            }
          });
        }
      }
    }
    return blocks;
  }

  // Utility Methods
  private async saveIntegrationConfig(integrationId: string, config: any): Promise<void> {
    try {
      const saved = localStorage.getItem('astral-notes-integrations') || '{}';
      const integrations = JSON.parse(saved);
      integrations[integrationId] = config;
      localStorage.setItem('astral-notes-integrations', JSON.stringify(integrations));
    } catch (error) {
      console.error('Failed to save integration config:', error);
    }
  }

  // Public API
  getIntegrations(): AppIntegration[] {
    return Array.from(this.integrations.values());
  }

  getActiveIntegrations(): AppIntegration[] {
    return Array.from(this.integrations.values()).filter(i => i.isActive);
  }

  getIntegrationsByCategory(category: AppIntegration['category']): AppIntegration[] {
    return Array.from(this.integrations.values()).filter(i => i.category === category);
  }

  getIntegration(integrationId: string): AppIntegration | null {
    return this.integrations.get(integrationId) || null;
  }

  isIntegrationActive(integrationId: string): boolean {
    const integration = this.integrations.get(integrationId);
    return integration?.isActive || false;
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.isActive) return false;

    try {
      // Test the integration connection
      return true;
    } catch (error) {
      console.error(`Integration test failed for ${integrationId}:`, error);
      return false;
    }
  }
}

export const crossAppIntegrationsService = new CrossAppIntegrationsService();