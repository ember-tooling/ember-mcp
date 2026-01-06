import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PackageManagerDetector } from '../lib/package-manager-detector.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PackageManagerDetector', () => {
  let detector;
  let testDir;

  beforeEach(async () => {
    detector = new PackageManagerDetector();
    // Create a temporary test directory
    testDir = join(__dirname, '.test-workspace');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm from pnpm-lock.yaml', async () => {
      await fs.writeFile(join(testDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('pnpm');
      expect(result.runner).toBe('pnpm');
      expect(result.lockfile).toBe('pnpm-lock.yaml');
      expect(result.detectionMethod).toBe('lockfile');
      expect(result.confidence).toBe('high');
    });

    it('should detect yarn from yarn.lock', async () => {
      await fs.writeFile(join(testDir, 'yarn.lock'), '# yarn lockfile v1', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('yarn');
      expect(result.runner).toBe('yarn');
      expect(result.lockfile).toBe('yarn.lock');
    });

    it('should detect npm from package-lock.json', async () => {
      await fs.writeFile(join(testDir, 'package-lock.json'), '{"lockfileVersion": 3}', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('npm');
      expect(result.runner).toBe('npx');
      expect(result.lockfile).toBe('package-lock.json');
    });

    it('should detect bun from bun.lockb', async () => {
      await fs.writeFile(join(testDir, 'bun.lockb'), Buffer.from([0x00, 0x01, 0x02]));

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('bun');
      expect(result.runner).toBe('bunx');
    });

    it('should prioritize pnpm over yarn when both lockfiles exist', async () => {
      await fs.writeFile(join(testDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0', 'utf-8');
      await fs.writeFile(join(testDir, 'yarn.lock'), '# yarn lockfile v1', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('pnpm');
    });

    it('should detect from packageManager field in package.json', async () => {
      const packageJson = { name: 'test-project', packageManager: 'pnpm@9.0.0' };
      await fs.writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('pnpm');
      expect(result.runner).toBe('pnpm');
      expect(result.detectionMethod).toBe('packageManager field');
    });

    it('should prioritize lockfile over packageManager field', async () => {
      await fs.writeFile(join(testDir, 'yarn.lock'), '# yarn lockfile v1', 'utf-8');
      const packageJson = { name: 'test-project', packageManager: 'pnpm@9.0.0' };
      await fs.writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('yarn');
      expect(result.detectionMethod).toBe('lockfile');
    });

    it('should fallback to npm when no indicators found', async () => {
      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('npm');
      expect(result.runner).toBe('npx');
      expect(result.lockfile).toBeNull();
      expect(result.confidence).toBe('low');
    });
  });

  describe('formatDetectionResult', () => {
    it('should format detection result with key information', () => {
      const result = {
        manager: 'pnpm',
        runner: 'pnpm',
        lockfile: 'pnpm-lock.yaml',
        detectionMethod: 'lockfile',
        confidence: 'high',
      };

      const formatted = detector.formatDetectionResult(result);

      expect(formatted).toContain('Package Manager: pnpm');
      expect(formatted).toContain('pnpm install');
      expect(formatted).toContain('pnpm-lock.yaml');
    });

    it('should include npm-specific notes', () => {
      const result = {
        manager: 'npm',
        runner: 'npx',
        lockfile: 'package-lock.json',
        detectionMethod: 'lockfile',
        confidence: 'high',
      };

      const formatted = detector.formatDetectionResult(result);

      expect(formatted).toContain('npm-specific notes');
      expect(formatted).toContain('npm install');
      expect(formatted).toContain('npm uninstall');
      expect(formatted).toContain('npx <command>');
      expect(formatted).toContain('Pass args to scripts with `--`');
    });

    it('should include warning for low confidence', () => {
      const result = {
        manager: 'npm',
        runner: 'npx',
        lockfile: null,
        detectionMethod: 'default fallback',
        confidence: 'low',
      };

      const formatted = detector.formatDetectionResult(result);

      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('No lockfile found');
    });
  });

  describe('getCommandForScenario', () => {
    it('should return correct commands for different scenarios', () => {
      const pnpmResult = { manager: 'pnpm', runner: 'pnpm' };
      const npmResult = { manager: 'npm', runner: 'npx' };

      expect(detector.getCommandForScenario(pnpmResult, 'install')).toBe('pnpm install');
      expect(detector.getCommandForScenario(pnpmResult, 'add')).toBe('pnpm add');
      expect(detector.getCommandForScenario(pnpmResult, 'remove')).toBe('pnpm remove');
      expect(detector.getCommandForScenario(pnpmResult, 'execute')).toBe('pnpm');

      expect(detector.getCommandForScenario(npmResult, 'add')).toBe('npm install');
      expect(detector.getCommandForScenario(npmResult, 'remove')).toBe('npm uninstall');
      expect(detector.getCommandForScenario(npmResult, 'execute')).toBe('npx');
    });
  });

  describe('Real workspace detection', () => {
    it('should detect package manager in actual ember-mcp workspace', async () => {
      // Test on the actual workspace
      const workspaceRoot = join(__dirname, '..');
      const result = await detector.detectPackageManager(workspaceRoot);

      // ember-mcp uses pnpm
      expect(result.manager).toBe('pnpm');
      expect(result.lockfile).toBe('pnpm-lock.yaml');
      expect(result.confidence).toBe('high');
    });
  });
});
