import { promises as fs } from 'fs';
import { join, resolve } from 'path';

/**
 * Service for detecting which package manager is being used in a project
 */
export class PackageManagerDetector {
  constructor() {
    // Priority order for detection (lockfile -> manager name)
    this.lockfiles = {
      'pnpm-lock.yaml': 'pnpm',
      'yarn.lock': 'yarn',
      'package-lock.json': 'npm',
      'bun.lockb': 'bun',
    };
  }

  getRunner(manager) {
    return manager === 'npm' ? 'npx' : manager === 'bun' ? 'bunx' : manager;
  }

  /**
   * Detect the package manager used in a workspace
   * @param {string} workspacePath - Absolute path to the workspace directory
   * @returns {Promise<Object>} Package manager information
   */
  async detectPackageManager(workspacePath) {
    const resolvedPath = resolve(workspacePath);

    // Check for lockfiles
    for (const [lockfile, manager] of Object.entries(this.lockfiles)) {
      if (await this.fileExists(join(resolvedPath, lockfile))) {
        return {
          manager,
          lockfile,
          runner: this.getRunner(manager),
          detectionMethod: 'lockfile',
          confidence: 'high',
        };
      }
    }

    // Check package.json for packageManager field
    const packageJsonPath = join(resolvedPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        if (packageJson.packageManager) {
          const manager = packageJson.packageManager.match(/^([a-z]+)@/)?.[1];
          if (manager) {
            return {
              manager,
              lockfile: null,
              runner: this.getRunner(manager),
              detectionMethod: 'packageManager field',
              confidence: 'high',
            };
          }
        }
      } catch (error) {
        // Continue to fallback
      }
    }

    // Fallback to npm (most common default)
    return {
      manager: 'npm',
      lockfile: null,
      runner: 'npx',
      detectionMethod: 'default fallback',
      confidence: 'low',
    };
  }

  /**
   * Check if a file exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format detection result as human-readable text
   * @param {Object} result - Detection result from detectPackageManager
   * @returns {string} Formatted output
   */
  formatDetectionResult(result) {
    const { manager, runner, lockfile, detectionMethod, confidence } = result;
    
    let text = `# Package Manager: ${manager}\n\n`;
    
    if (lockfile) {
      text += `Detected via **${lockfile}** (${confidence} confidence)\n\n`;
    } else {
      text += `Detected via **${detectionMethod}** (${confidence} confidence)\n\n`;
    }
    
    text += `## Commands to use:\n\n`;
    text += `- Install: \`${manager} install\`\n`;
    text += `- Add package: \`${manager} ${manager === 'npm' ? 'install' : 'add'} <pkg>\`\n`;
    text += `- Remove package: \`${manager} ${manager === 'npm' ? 'uninstall' : 'remove'} <pkg>\`\n`;
    text += `- Run script: \`${manager} run <script>\`\n`;
    text += `- Execute binary: \`${runner} <command>\`\n`;
    
    if (manager === 'npm') {
      text += `\n**npm-specific notes:**\n`;
      text += `- Scripts require \`npm run <script>\` (can't omit \`run\`)\n`;
      text += `- Binaries use \`npx <command>\` (not \`npm exec\`)\n`;
      text += `- Pass args to scripts with \`--\`: \`npm run test -- --watch\`\n`;
    }
    
    if (confidence === 'low') {
      text += `\n⚠️ **Warning:** No lockfile found. Defaulting to npm. Consider committing your lockfile.\n`;
    }
    
    return text;
  }

  /**
   * Get usage instructions for a specific scenario
   * @param {Object} result - Detection result
   * @param {string} scenario - Scenario type (install, add, remove, run, execute)
   * @returns {string} Command to use
   */
  getCommandForScenario(result, scenario) {
    const { manager, runner } = result;
    
    const commands = {
      install: `${manager} install`,
      add: `${manager} ${manager === 'npm' ? 'install' : 'add'}`,
      remove: `${manager} ${manager === 'npm' ? 'uninstall' : 'remove'}`,
      run: `${manager} run`,
      execute: runner,
    };
    
    return commands[scenario] || manager;
  }
}
