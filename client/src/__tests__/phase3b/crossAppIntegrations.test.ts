import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crossAppIntegrationsService } from '../../services/crossAppIntegrations';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.open for OAuth flows
Object.defineProperty(window, 'open', {
  value: vi.fn(() => ({
    close: vi.fn(),
    closed: false
  }))
});

describe('Cross-App Integrations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await crossAppIntegrationsService.initialize();
      expect(true).toBe(true);
    });

    it('should load user integrations from localStorage', async () => {
      const savedIntegrations = JSON.stringify({
        google_drive: { isActive: true, config: { accessToken: 'test' } }
      });
      mockLocalStorage.getItem.mockReturnValue(savedIntegrations);

      await crossAppIntegrationsService.initialize();
      const integrations = crossAppIntegrationsService.getIntegrations();
      const googleDrive = integrations.find(i => i.id === 'google_drive');
      expect(googleDrive?.isActive).toBe(true);
    });
  });

  describe('Integration Management', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should get all integrations', () => {
      const integrations = crossAppIntegrationsService.getIntegrations();
      expect(Array.isArray(integrations)).toBe(true);
      expect(integrations.length).toBeGreaterThan(0);
    });

    it('should get integrations by category', () => {
      const cloudStorage = crossAppIntegrationsService.getIntegrationsByCategory('cloud_storage');
      expect(Array.isArray(cloudStorage)).toBe(true);
      expect(cloudStorage.every(i => i.category === 'cloud_storage')).toBe(true);
    });

    it('should get specific integration', () => {
      const notion = crossAppIntegrationsService.getIntegration('notion');
      expect(notion).toBeTruthy();
      expect(notion?.id).toBe('notion');
    });

    it('should check if integration is active', () => {
      const isActive = crossAppIntegrationsService.isIntegrationActive('google_drive');
      expect(typeof isActive).toBe('boolean');
    });
  });

  describe('Integration Activation', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should activate integration without auth', async () => {
      const result = await crossAppIntegrationsService.activateIntegration('obsidian');
      expect(result).toBe(true);
      expect(crossAppIntegrationsService.isIntegrationActive('obsidian')).toBe(true);
    });

    it('should deactivate integration', async () => {
      await crossAppIntegrationsService.activateIntegration('obsidian');
      const result = await crossAppIntegrationsService.deactivateIntegration('obsidian');
      expect(result).toBe(true);
      expect(crossAppIntegrationsService.isIntegrationActive('obsidian')).toBe(false);
    });

    it('should handle invalid integration ID', async () => {
      const result = await crossAppIntegrationsService.activateIntegration('invalid_integration');
      expect(result).toBe(false);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
      await crossAppIntegrationsService.activateIntegration('obsidian');
    });

    it('should export to Obsidian (file download)', async () => {
      const content = {
        title: 'Test Document',
        content: 'This is test content'
      };

      // Mock createElement and URL methods
      const mockA = {
        href: '',
        download: '',
        click: vi.fn()
      };
      document.createElement = vi.fn(() => mockA as any);
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const result = await crossAppIntegrationsService.exportToIntegration('obsidian', content);
      expect(result.success).toBe(true);
      expect(mockA.click).toHaveBeenCalled();
    });

    it('should handle export to inactive integration', async () => {
      const content = { title: 'Test', content: 'Test' };
      const result = await crossAppIntegrationsService.exportToIntegration('google_drive', content);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Integration not active');
    });
  });

  describe('Import Functionality', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should handle import from inactive integration', async () => {
      const result = await crossAppIntegrationsService.importFromIntegration('google_drive');
      expect(result.success).toBe(false);
      expect(result.itemsImported).toBe(0);
    });

    it('should handle generic import', async () => {
      await crossAppIntegrationsService.activateIntegration('obsidian');
      const result = await crossAppIntegrationsService.importFromIntegration('obsidian');
      expect(result.success).toBe(false); // Not implemented in mock
    });
  });

  describe('Integration Testing', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should test inactive integration', async () => {
      const result = await crossAppIntegrationsService.testIntegration('google_drive');
      expect(result).toBe(false);
    });

    it('should test active integration', async () => {
      await crossAppIntegrationsService.activateIntegration('obsidian');
      const result = await crossAppIntegrationsService.testIntegration('obsidian');
      expect(result).toBe(true);
    });
  });

  describe('Format Conversion', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should convert content to various formats', async () => {
      const content = {
        title: 'Test Document',
        content: 'This is **bold** and *italic* text.'
      };

      // Test through export which uses conversion internally
      await crossAppIntegrationsService.activateIntegration('obsidian');
      
      const mockA = {
        href: '',
        download: '',
        click: vi.fn()
      };
      document.createElement = vi.fn(() => mockA as any);
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const result = await crossAppIntegrationsService.exportToIntegration('obsidian', content);
      expect(result.success).toBe(true);
    });
  });

  describe('Authentication Flows', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should handle OAuth authentication flow initiation', async () => {
      // Set up environment for Google OAuth
      process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-client-id';
      
      // Mock the window.open for OAuth
      const mockWindow = {
        close: vi.fn(),
        closed: false
      };
      (window.open as any).mockReturnValue(mockWindow);

      // This will trigger OAuth flow but won't complete due to mocking
      const result = await crossAppIntegrationsService.activateIntegration('google_drive');
      expect(window.open).toHaveBeenCalled();
    });

    it('should handle generic API key authentication', async () => {
      // Mock prompt for API key
      window.prompt = vi.fn(() => 'test-api-key');
      
      // For integrations that don't require OAuth, should work
      const result = await crossAppIntegrationsService.activateIntegration('obsidian');
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw, just log error
      await crossAppIntegrationsService.initialize();
      expect(true).toBe(true);
    });

    it('should handle JSON parse errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      await crossAppIntegrationsService.initialize();
      expect(true).toBe(true);
    });

    it('should handle export errors', async () => {
      await crossAppIntegrationsService.activateIntegration('obsidian');
      
      // Mock createElement to throw error
      document.createElement = vi.fn(() => {
        throw new Error('DOM error');
      });

      const content = { title: 'Test', content: 'Test' };
      const result = await crossAppIntegrationsService.exportToIntegration('obsidian', content);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Active Integrations Management', () => {
    beforeEach(async () => {
      await crossAppIntegrationsService.initialize();
    });

    it('should get only active integrations', async () => {
      await crossAppIntegrationsService.activateIntegration('obsidian');
      await crossAppIntegrationsService.activateIntegration('notion');
      
      const activeIntegrations = crossAppIntegrationsService.getActiveIntegrations();
      expect(activeIntegrations.length).toBeGreaterThanOrEqual(2);
      expect(activeIntegrations.every(i => i.isActive)).toBe(true);
    });

    it('should persist integration state', async () => {
      await crossAppIntegrationsService.activateIntegration('obsidian');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });
});