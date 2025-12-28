import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NpmService } from '../lib/npm-service.js';

describe('NpmService', () => {
  let npmService;

  beforeEach(() => {
    npmService = new NpmService();
  });

  describe('getPackageInfo', () => {
    it('should fetch package info from npm registry', async () => {
      // This is a real call to npm registry - could be mocked in the future
      const packageInfo = await npmService.getPackageInfo('ember-source');
      
      expect(packageInfo).toBeDefined();
      expect(packageInfo.name).toBe('ember-source');
      expect(packageInfo['dist-tags']).toBeDefined();
      expect(packageInfo['dist-tags'].latest).toBeDefined();
    });

    it('should throw error for non-existent package', async () => {
      await expect(
        npmService.getPackageInfo('this-package-definitely-does-not-exist-12345')
      ).rejects.toThrow('not found');
    });
  });

  describe('getLatestVersion', () => {
    it('should return latest version for a package', async () => {
      const version = await npmService.getLatestVersion('ember-source');
      
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('getDistTags', () => {
    it('should return dist-tags for a package', async () => {
      const distTags = await npmService.getDistTags('ember-source');
      
      expect(distTags).toBeDefined();
      expect(distTags.latest).toBeDefined();
      expect(typeof distTags.latest).toBe('string');
    });
  });

  describe('formatPackageInfo', () => {
    it('should format package info correctly', () => {
      const mockPackageInfo = {
        name: 'test-package',
        description: 'Test description',
        'dist-tags': {
          latest: '1.0.0',
          next: '1.1.0-beta.1',
        },
        versions: {
          '1.0.0': {
            license: 'MIT',
            keywords: ['test', 'package'],
            dependencies: { 'dep1': '^1.0.0' },
            devDependencies: { 'dev-dep1': '^2.0.0' },
            peerDependencies: { 'peer-dep1': '^3.0.0' },
            engines: { node: '>=14' },
            homepage: 'https://example.com',
            repository: { url: 'https://github.com/test/test' },
            author: { name: 'Test Author', email: 'test@example.com' },
          },
        },
        maintainers: [{ name: 'maintainer1' }],
        time: {
          '1.0.0': '2024-01-01T00:00:00.000Z',
          created: '2023-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
        },
      };

      const formatted = npmService.formatPackageInfo(mockPackageInfo);

      expect(formatted.name).toBe('test-package');
      expect(formatted.description).toBe('Test description');
      expect(formatted.latestVersion).toBe('1.0.0');
      expect(formatted.distTags.latest).toBe('1.0.0');
      expect(formatted.distTags.next).toBe('1.1.0-beta.1');
      expect(formatted.license).toBe('MIT');
      expect(formatted.keywords).toEqual(['test', 'package']);
      expect(formatted.dependencies).toEqual({ 'dep1': '^1.0.0' });
      expect(formatted.devDependencies).toEqual({ 'dev-dep1': '^2.0.0' });
      expect(formatted.peerDependencies).toEqual({ 'peer-dep1': '^3.0.0' });
      expect(formatted.engines).toEqual({ node: '>=14' });
      expect(formatted.author).toContain('Test Author');
      expect(formatted.author).toContain('test@example.com');
    });

    it('should handle missing optional fields', () => {
      const mockPackageInfo = {
        name: 'minimal-package',
        'dist-tags': { latest: '1.0.0' },
        versions: { '1.0.0': {} },
        maintainers: [],
      };

      const formatted = npmService.formatPackageInfo(mockPackageInfo);

      expect(formatted.name).toBe('minimal-package');
      expect(formatted.description).toBe('No description available');
      expect(formatted.license).toBe('Unknown');
      expect(formatted.keywords).toEqual([]);
      expect(formatted.dependencies).toEqual({});
    });
  });

  describe('formatAuthor', () => {
    it('should format author object', () => {
      const author = {
        name: 'John Doe',
        email: 'john@example.com',
        url: 'https://johndoe.com',
      };

      const formatted = npmService.formatAuthor(author);
      expect(formatted).toBe('John Doe <john@example.com> (https://johndoe.com)');
    });

    it('should handle string author', () => {
      const formatted = npmService.formatAuthor('John Doe');
      expect(formatted).toBe('John Doe');
    });

    it('should handle null author', () => {
      const formatted = npmService.formatAuthor(null);
      expect(formatted).toBeNull();
    });
  });

  describe('getVersions', () => {
    it('should return all versions of a package', async () => {
      const versions = await npmService.getVersions('ember-source');
      
      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThan(0);
      expect(versions.every(v => typeof v === 'string')).toBe(true);
    });
  });

  describe('getVersionComparison', () => {
    it('should compare versions correctly', async () => {
      // Use a known stable package
      const comparison = await npmService.getVersionComparison('ember-source', '4.0.0');
      
      expect(comparison.packageName).toBe('ember-source');
      expect(comparison.currentVersion).toBe('4.0.0');
      expect(comparison.latestVersion).toBeDefined();
      expect(typeof comparison.isLatest).toBe('boolean');
      expect(typeof comparison.needsUpdate).toBe('boolean');
      expect(comparison.availableVersionsCount).toBeGreaterThan(0);
    });

    it('should identify when current version is latest', async () => {
      // Get the actual latest version first
      const latestVersion = await npmService.getLatestVersion('ember-source');
      const comparison = await npmService.getVersionComparison('ember-source', latestVersion);
      
      expect(comparison.isLatest).toBe(true);
      expect(comparison.needsUpdate).toBe(false);
    });
  });
});
