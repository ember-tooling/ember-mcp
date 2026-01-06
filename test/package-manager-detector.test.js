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
      // Create pnpm-lock.yaml
      await fs.writeFile(join(testDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('pnpm');
      expect(result.command).toBe('pnpm');
      expect(result.runner).toBe('pnpm');
      expect(result.lockfile).toBe('pnpm-lock.yaml');
      expect(result.detectionMethod).toBe('lockfile');
      expect(result.confidence).toBe('high');
    });

    it('should detect yarn from yarn.lock', async () => {
      // Create yarn.lock
      await fs.writeFile(join(testDir, 'yarn.lock'), '# yarn lockfile v1', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('yarn');
      expect(result.command).toBe('yarn');
      expect(result.runner).toBe('yarn');
      expect(result.lockfile).toBe('yarn.lock');
      expect(result.detectionMethod).toBe('lockfile');
      expect(result.confidence).toBe('high');
    });

    it('should detect npm from package-lock.json', async () => {
      // Create package-lock.json
      await fs.writeFile(join(testDir, 'package-lock.json'), '{"lockfileVersion": 3}', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('npm');
      expect(result.command).toBe('npm');
      expect(result.runner).toBe('npx');
      expect(result.lockfile).toBe('package-lock.json');
      expect(result.detectionMethod).toBe('lockfile');
      expect(result.confidence).toBe('high');
    });

    it('should detect bun from bun.lockb', async () => {
      // Create bun.lockb
      await fs.writeFile(join(testDir, 'bun.lockb'), Buffer.from([0x00, 0x01, 0x02]));

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('bun');
      expect(result.command).toBe('bun');
      expect(result.runner).toBe('bunx');
      expect(result.lockfile).toBe('bun.lockb');
      expect(result.detectionMethod).toBe('lockfile');
      expect(result.confidence).toBe('high');
    });

    it('should prioritize pnpm over yarn when both lockfiles exist', async () => {
      // Create both lockfiles
      await fs.writeFile(join(testDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0', 'utf-8');
      await fs.writeFile(join(testDir, 'yarn.lock'), '# yarn lockfile v1', 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('pnpm');
    });

    it('should detect from packageManager field in package.json', async () => {
      // Create package.json with packageManager field
      const packageJson = {
        name: 'test-project',
        packageManager: 'pnpm@9.0.0',
      };
      await fs.writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('pnpm');
      expect(result.command).toBe('pnpm');
      expect(result.runner).toBe('pnpm');
      expect(result.detectionMethod).toBe('packageManager field');
      expect(result.confidence).toBe('high');
    });

    it('should prioritize lockfile over packageManager field', async () => {
      // Create both
      await fs.writeFile(join(testDir, 'yarn.lock'), '# yarn lockfile v1', 'utf-8');
      const packageJson = {
        name: 'test-project',
        packageManager: 'pnpm@9.0.0',
      };
      await fs.writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

      const result = await detector.detectPackageManager(testDir);

      // Lockfile should take priority
      expect(result.manager).toBe('yarn');
      expect(result.detectionMethod).toBe('lockfile');
    });

    it('should fallback to npm when no indicators found', async () => {
      const result = await detector.detectPackageManager(testDir);

      expect(result.manager).toBe('npm');
      expect(result.command).toBe('npm');
      expect(result.runner).toBe('npx');
      expect(result.lockfile).toBeNull();
      expect(result.detectionMethod).toBe('default fallback');
      expect(result.confidence).toBe('low');
    });
  });

  describe('parsePackageManagerField', () => {
    it('should parse pnpm packageManager field', () => {
      const result = detector.parsePackageManagerField('pnpm@9.0.0');

      expect(result.manager).toBe('pnpm');
      expect(result.command).toBe('pnpm');
      expect(result.runner).toBe('pnpm');
    });

    it('should parse yarn packageManager field', () => {
      const result = detector.parsePackageManagerField('yarn@3.6.0');

      expect(result.manager).toBe('yarn');
      expect(result.command).toBe('yarn');
      expect(result.runner).toBe('yarn');
    });

    it('should parse npm packageManager field', () => {
      const result = detector.parsePackageManagerField('npm@10.0.0');

      expect(result.manager).toBe('npm');
      expect(result.command).toBe('npm');
      expect(result.runner).toBe('npx');
    });

    it('should return null for invalid format', () => {
      const result = detector.parsePackageManagerField('invalid-format');

      expect(result).toBeNull();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const testFile = join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'test', 'utf-8');

      const exists = await detector.fileExists(testFile);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await detector.fileExists(join(testDir, 'nonexistent.txt'));

      expect(exists).toBe(false);
    });
  });

  describe('formatDetectionResult', () => {
    it('should format pnpm detection result', () => {
      const result = {
        manager: 'pnpm',
        command: 'pnpm',
        runner: 'pnpm',
        lockfile: 'pnpm-lock.yaml',
        detectionMethod: 'lockfile',
        confidence: 'high',
      };

      const formatted = detector.formatDetectionResult(result);

      expect(formatted).toContain('**Package Manager:** pnpm');
      expect(formatted).toContain('pnpm install');
      expect(formatted).toContain('pnpm run');
      expect(formatted).toContain('pnpm add');
      expect(formatted).toContain('**Lockfile:** pnpm-lock.yaml');
      expect(formatted).toContain('**Detection Method:** lockfile');
      expect(formatted).toContain('**Confidence:** high');
    });

    it('should format npm detection result with special commands', () => {
      const result = {
        manager: 'npm',
        command: 'npm',
        runner: 'npx',
        lockfile: 'package-lock.json',
        detectionMethod: 'lockfile',
        confidence: 'high',
      };

      const formatted = detector.formatDetectionResult(result);

      expect(formatted).toContain('**Package Manager:** npm');
      expect(formatted).toContain('npm install');
      expect(formatted).toContain('npm run');
      expect(formatted).toContain('npx <command>');
      expect(formatted).toContain('npm uninstall');
      expect(formatted).toContain('--');
      expect(formatted).toContain('note the `--` separator');
    });

    it('should include warning for low confidence', () => {
      const result = {
        manager: 'npm',
        command: 'npm',
        runner: 'npx',
        lockfile: null,
        detectionMethod: 'default fallback',
        confidence: 'low',
      };

      const formatted = detector.formatDetectionResult(result);

      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('Detection confidence is low');
    });
  });

  describe('getCommandForScenario', () => {
    const result = {
      manager: 'pnpm',
      command: 'pnpm',
      runner: 'pnpm',
    };

    it('should return install command', () => {
      expect(detector.getCommandForScenario(result, 'install')).toBe('pnpm install');
    });

    it('should return add command', () => {
      expect(detector.getCommandForScenario(result, 'add')).toBe('pnpm add');
    });

    it('should return remove command', () => {
      expect(detector.getCommandForScenario(result, 'remove')).toBe('pnpm remove');
    });

    it('should return run command', () => {
      expect(detector.getCommandForScenario(result, 'run')).toBe('pnpm run');
    });

    it('should return execute command', () => {
      expect(detector.getCommandForScenario(result, 'execute')).toBe('pnpm');
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
