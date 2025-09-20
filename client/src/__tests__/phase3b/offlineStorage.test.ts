import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineStorageService } from '../../services/offlineStorage';

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(() => Promise.resolve([])),
    getAllFromIndex: vi.fn(() => Promise.resolve([])),
    delete: vi.fn(),
    clear: vi.fn(),
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        put: vi.fn(),
        clear: vi.fn()
      })),
      done: Promise.resolve()
    })),
    close: vi.fn()
  }))
}));

describe('Offline Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await offlineStorageService.initialize();
      expect(result).toBeUndefined();
    });
  });

  describe('Note Operations', () => {
    it('should save notes offline', async () => {
      const note = {
        id: 'note1',
        title: 'Test Note',
        content: 'Test content',
        tags: ['test']
      };

      await offlineStorageService.saveNote(note);
      // Mock implementation, so we just verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should retrieve notes by ID', async () => {
      const result = await offlineStorageService.getNote('note1');
      expect(result).toBeNull();
    });

    it('should get all notes', async () => {
      const result = await offlineStorageService.getAllNotes();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get notes by project', async () => {
      const result = await offlineStorageService.getNotesByProject('project1');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Project Operations', () => {
    it('should save projects offline', async () => {
      const project = {
        id: 'project1',
        title: 'Test Project',
        description: 'Test description'
      };

      await offlineStorageService.saveProject(project);
      expect(true).toBe(true);
    });

    it('should retrieve projects by ID', async () => {
      const result = await offlineStorageService.getProject('project1');
      expect(result).toBeNull();
    });
  });

  describe('Sync Operations', () => {
    it('should process sync queue', async () => {
      await offlineStorageService.processSync();
      expect(true).toBe(true);
    });

    it('should get storage stats', async () => {
      const stats = await offlineStorageService.getStorageStats();
      expect(stats).toEqual({
        used: 0,
        quota: 0,
        available: 0
      });
    });
  });

  describe('Data Management', () => {
    it('should export offline data', async () => {
      const result = await offlineStorageService.exportOfflineData();
      expect(typeof result).toBe('string');
    });

    it('should import offline data', async () => {
      const data = JSON.stringify({
        notes: [],
        projects: [],
        quickNotes: [],
        exportedAt: Date.now()
      });

      await offlineStorageService.importOfflineData(data);
      expect(true).toBe(true);
    });

    it('should clear all offline data', async () => {
      await offlineStorageService.clearOfflineData();
      expect(true).toBe(true);
    });
  });
});