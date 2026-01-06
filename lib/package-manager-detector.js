import { promises as fs } from 'fs';
import { join, resolve } from 'path';

/**
 * Service for detecting which package manager is being used in a project
 */
export class PackageManagerDetector {
  constructor() {
    // Priority order for detection
    this.lockfilePatterns = [
      { file: 'pnpm-lock.yaml', manager: 'pnpm', command: 'pnpm', runner: 'pnpm' },
      { file: 'yarn.lock', manager: 'yarn', command: 'yarn', runner: 'yarn' },
      { file: 'package-lock.json', manager: 'npm', command: 'npm', runner: 'npx' },
      { file: 'bun.lockb', manager: 'bun', command: 'bun', runner: 'bunx' },
    ];
  }

  /**
   * Detect the package manager used in a workspace
   * @param {string} workspacePath - Absolute path to the workspace directory
   * @returns {Promise<Object>} Package manager information
   */
  async detectPackageManager(workspacePath) {
    const resolvedPath = resolve(workspacePath);

    // Check for lockfiles
    for (const pattern of this.lockfilePatterns) {
      const lockfilePath = join(resolvedPath, pattern.file);
      if (await this.fileExists(lockfilePath)) {
        return {
          manager: pattern.manager,
          lockfile: pattern.file,
          command: pattern.command,
          runner: pattern.runner,
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
          const managerInfo = this.parsePackageManagerField(packageJson.packageManager);
          if (managerInfo) {
            return {
              ...managerInfo,
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
      command: 'npm',
      runner: 'npx',
      detectionMethod: 'default fallback',
      confidence: 'low',
    };
  }

  /**
   * Parse the packageManager field from package.json
   * @param {string} packageManagerField - Value of packageManager field (e.g., "pnpm@9.0.0")
   * @returns {Object|null} Parsed package manager info
   */
  parsePackageManagerField(packageManagerField) {
    const match = packageManagerField.match(/^([a-z]+)@/);
    if (!match) return null;

    const manager = match[1];
    const runnerMap = {
      pnpm: 'pnpm',
      yarn: 'yarn',
      npm: 'npx',
      bun: 'bunx',
    };

    return {
      manager,
      lockfile: null,
      command: manager,
      runner: runnerMap[manager] || 'npx',
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
    let text = `# Package Manager Detection\n\n`;
    text += `**Package Manager:** ${result.manager}\n`;
    text += `**Install Command:** \`${result.command} install\`\n`;
    
    // npm has specific command patterns
    if (result.manager === 'npm') {
      text += `**Run Script Command:** \`npm run <script>\`\n`;
      text += `**Execute Package Command:** \`npx <command>\`\n`;
    } else {
      text += `**Run Script Command:** \`${result.command} run <script>\` or \`${result.command} <script>\`\n`;
      text += `**Execute Package Command:** \`${result.runner} <command>\`\n`;
    }
    
    if (result.lockfile) {
      text += `**Lockfile:** ${result.lockfile}\n`;
    }
    
    text += `**Detection Method:** ${result.detectionMethod}\n`;
    text += `**Confidence:** ${result.confidence}\n\n`;
    
    text += `## Usage Guidelines\n\n`;
    text += `When working with this project, use the following commands:\n\n`;
    text += `- Installing dependencies: \`${result.command} install\`\n`;
    
    if (result.manager === 'npm') {
      text += `- Adding a package: \`npm install <package-name>\` or \`npm install --save <package-name>\`\n`;
      text += `- Removing a package: \`npm uninstall <package-name>\`\n`;
      text += `- Running scripts: \`npm run <script-name>\`\n`;
      text += `- Executing packages: \`npx <command>\`\n`;
      text += `- Passing args to scripts: \`npm run <script-name> -- --arg\` (note the \`--\` separator)\n\n`;
      text += `**Note:** npm requires \`--\` to pass additional arguments to scripts (e.g., \`npm run test -- --watch\`).\n\n`;
    } else {
      text += `- Adding a package: \`${result.command} add <package-name>\`\n`;
      text += `- Removing a package: \`${result.command} remove <package-name>\`\n`;
      text += `- Running scripts: \`${result.command} run <script-name>\` or \`${result.command} <script-name>\`\n`;
      text += `- Executing packages: \`${result.runner} <command>\`\n\n`;
    }
    
    if (result.confidence === 'low') {
      text += `⚠️ **Note:** Detection confidence is low. No lockfile or packageManager field was found. `;
      text += `Defaulting to npm. If this project uses a different package manager, `;
      text += `consider adding a lockfile or specifying the package manager in package.json.\n`;
    }
    
    return text;
  }

  /**
   * Get usage instructions for a specific scenario
   * @param {Object} result - Detection result
   * @param {string} scenario - Scenario type (install, add, run, execute)
   * @returns {string} Command to use
   */
  getCommandForScenario(result, scenario) {
    const commands = {
      install: `${result.command} install`,
      add: `${result.command} add`,
      remove: `${result.command} remove`,
      run: `${result.command} run`,
      execute: result.runner,
    };
    
    return commands[scenario] || result.command;
  }
}
