#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DocumentationService } from "./lib/documentation-service.js";
import { NpmService } from "./lib/npm-service.js";
import { PackageManagerDetector } from "./lib/package-manager-detector.js";
import {
  formatSearchResults,
  formatApiReference,
  formatBestPractices,
  formatVersionInfo,
} from "./lib/formatters.js";

class EmberDocsServer {
  constructor() {
    this.server = new Server(
      {
        name: "ember-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.docService = new DocumentationService();
    this.npmService = new NpmService();
    this.packageManagerDetector = new PackageManagerDetector();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_ember_docs",
          description:
            "Search through Ember.js documentation including API docs, guides, and community content. Returns relevant documentation with links to official sources. Use this for general queries about Ember concepts, features, or usage.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "Search query (e.g., 'component lifecycle', 'tracked properties', 'routing')",
              },
              category: {
                type: "string",
                enum: ["all", "api", "guides", "community"],
                description:
                  "Filter by documentation category (default: all)",
              },
              limit: {
                type: "number",
                description: "Maximum number of results (default: 5)",
                default: 5,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_api_reference",
          description:
            "Get detailed API reference documentation for a specific Ember class, module, or method. Returns full API documentation including parameters, return values, examples, and links to official API docs.",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description:
                  "Name of the API element (e.g., 'Component', '@glimmer/component', 'Service', 'Router')",
              },
              type: {
                type: "string",
                enum: ["class", "module", "method", "property"],
                description: "Type of API element (optional)",
              },
            },
            required: ["name"],
          },
        },
        {
          name: "get_best_practices",
          description:
            "Get Ember best practices and recommendations for specific topics. This includes modern patterns, anti-patterns to avoid, performance tips, and community-approved approaches. Always use this when providing implementation advice.",
          inputSchema: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                description:
                  "Topic to get best practices for (e.g., 'component patterns', 'state management', 'testing', 'performance')",
              },
            },
            required: ["topic"],
          },
        },
        {
          name: "get_ember_version_info",
          description:
            "Get information about Ember versions, including current stable version, what's new in recent releases, and migration guides. Useful for understanding version-specific features and deprecations.",
          inputSchema: {
            type: "object",
            properties: {
              version: {
                type: "string",
                description:
                  "Specific version to get info about (optional, returns latest if not specified)",
              },
            },
          },
        },
        {
          name: "get_npm_package_info",
          description:
            "Get comprehensive information about an npm package including latest version, description, dependencies, maintainers, and more. Essential for understanding package details before upgrading dependencies.",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description:
                  "Name of the npm package (e.g., 'ember-source', '@glimmer/component', 'ember-cli')",
              },
            },
            required: ["packageName"],
          },
        },
        {
          name: "compare_npm_versions",
          description:
            "Compare a current package version with the latest available version on npm. Shows if an update is needed and provides version details to help with dependency upgrades.",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description:
                  "Name of the npm package (e.g., 'ember-source', '@glimmer/component')",
              },
              currentVersion: {
                type: "string",
                description:
                  "Current version being used (e.g., '4.12.0', '1.1.2')",
              },
            },
            required: ["packageName", "currentVersion"],
          },
        },
        {
          name: "detect_package_manager",
          description:
            "Detect which package manager (pnpm, yarn, npm, bun) is being used in a workspace by examining lockfiles and package.json. Returns the appropriate commands to use for installing dependencies, running scripts, and executing packages. Use this tool BEFORE suggesting package installation or script execution commands to ensure you use the correct package manager.",
          inputSchema: {
            type: "object",
            properties: {
              workspacePath: {
                type: "string",
                description:
                  "Absolute path to the workspace directory to analyze (e.g., '/path/to/project')",
              },
            },
            required: ["workspacePath"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Ensure documentation is loaded
        await this.docService.ensureLoaded();

        switch (name) {
          case "search_ember_docs":
            return await this.handleSearchDocs(args);

          case "get_api_reference":
            return await this.handleGetApiReference(args);

          case "get_best_practices":
            return await this.handleGetBestPractices(args);

          case "get_ember_version_info":
            return await this.handleGetVersionInfo(args);

          case "get_npm_package_info":
            return await this.handleGetNpmPackageInfo(args);

          case "compare_npm_versions":
            return await this.handleCompareNpmVersions(args);

          case "detect_package_manager":
            return await this.handleDetectPackageManager(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleSearchDocs(args) {
    const { query, category = "all", limit = 5 } = args;
    const results = await this.docService.search(query, category, limit);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No results found for "${query}". Try different keywords or broader search terms.`,
          },
        ],
      };
    }

    const formattedResults = formatSearchResults(results, this.docService.deprecationManager);
    return {
      content: [
        {
          type: "text",
          text: formattedResults,
        },
      ],
    };
  }

  async handleGetApiReference(args) {
    const { name, type } = args;
    const apiDoc = await this.docService.getApiReference(name, type);

    if (!apiDoc) {
      return {
        content: [
          {
            type: "text",
            text: `No API documentation found for "${name}". Try searching with search_ember_docs first.`,
          },
        ],
      };
    }

    const formattedDoc = formatApiReference(apiDoc, this.docService.deprecationManager);
    return {
      content: [
        {
          type: "text",
          text: formattedDoc,
        },
      ],
    };
  }

  async handleGetBestPractices(args) {
    const { topic } = args;
    const practices = await this.docService.getBestPractices(topic);

    if (practices.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No best practices found for "${topic}". Try searching with search_ember_docs for general information.`,
          },
        ],
      };
    }

    const formattedPractices = formatBestPractices(practices, topic, this.docService.deprecationManager);
    return {
      content: [
        {
          type: "text",
          text: formattedPractices,
        },
      ],
    };
  }

  async handleGetVersionInfo(args) {
    const { version } = args;
    const versionInfo = await this.docService.getVersionInfo(version);

    const formattedInfo = formatVersionInfo(versionInfo);
    return {
      content: [
        {
          type: "text",
          text: formattedInfo,
        },
      ],
    };
  }

  async handleGetNpmPackageInfo(args) {
    const { packageName } = args;

    try {
      const packageInfo = await this.npmService.getPackageInfo(packageName);
      const formatted = this.npmService.formatPackageInfo(packageInfo);

      let text = `# ${formatted.name}\n\n`;
      text += `**Description:** ${formatted.description}\n\n`;
      text += `**Latest Version:** ${formatted.latestVersion}\n\n`;

      // Dist tags
      if (Object.keys(formatted.distTags).length > 0) {
        text += `**Distribution Tags:**\n`;
        for (const [tag, version] of Object.entries(formatted.distTags)) {
          text += `  - ${tag}: ${version}\n`;
        }
        text += `\n`;
      }

      // Metadata
      if (formatted.license) {
        text += `**License:** ${formatted.license}\n`;
      }
      if (formatted.author) {
        text += `**Author:** ${formatted.author}\n`;
      }
      if (formatted.homepage) {
        text += `**Homepage:** ${formatted.homepage}\n`;
      }
      if (formatted.repository) {
        text += `**Repository:** ${formatted.repository}\n`;
      }

      // Keywords
      if (formatted.keywords.length > 0) {
        text += `\n**Keywords:** ${formatted.keywords.join(', ')}\n`;
      }

      // Dependencies
      const depCount = Object.keys(formatted.dependencies).length;
      const devDepCount = Object.keys(formatted.devDependencies).length;
      const peerDepCount = Object.keys(formatted.peerDependencies).length;

      if (depCount > 0 || devDepCount > 0 || peerDepCount > 0) {
        text += `\n**Dependencies:**\n`;
        if (depCount > 0) {
          text += `  - ${depCount} runtime dependencies\n`;
        }
        if (peerDepCount > 0) {
          text += `  - ${peerDepCount} peer dependencies\n`;
        }
        if (devDepCount > 0) {
          text += `  - ${devDepCount} dev dependencies\n`;
        }
      }

      // Engines
      if (Object.keys(formatted.engines).length > 0) {
        text += `\n**Engine Requirements:**\n`;
        for (const [engine, version] of Object.entries(formatted.engines)) {
          text += `  - ${engine}: ${version}\n`;
        }
      }

      // Dates
      if (formatted.created) {
        text += `\n**Created:** ${new Date(formatted.created).toLocaleDateString()}\n`;
      }
      if (formatted.lastPublished) {
        text += `**Last Published:** ${new Date(formatted.lastPublished).toLocaleDateString()}\n`;
      }

      // Maintainers
      if (formatted.maintainers.length > 0) {
        text += `\n**Maintainers:** ${formatted.maintainers.length} maintainer(s)\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching package information: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleCompareNpmVersions(args) {
    const { packageName, currentVersion } = args;

    try {
      const comparison = await this.npmService.getVersionComparison(packageName, currentVersion);

      let text = `# Version Comparison: ${comparison.packageName}\n\n`;
      text += `**Current Version:** ${comparison.currentVersion}\n`;
      text += `**Latest Version:** ${comparison.latestVersion}\n\n`;

      if (comparison.isLatest) {
        text += `✅ **Status:** You are using the latest version!\n\n`;
      } else {
        text += `⚠️ **Status:** An update is available.\n\n`;
      }

      // Dist tags
      if (Object.keys(comparison.distTags).length > 0) {
        text += `**Available Tags:**\n`;
        for (const [tag, version] of Object.entries(comparison.distTags)) {
          const isCurrent = version === comparison.currentVersion ? ' (current)' : '';
          text += `  - ${tag}: ${version}${isCurrent}\n`;
        }
        text += `\n`;
      }

      // Release dates
      if (comparison.currentVersionReleaseDate) {
        text += `**Current Version Released:** ${new Date(comparison.currentVersionReleaseDate).toLocaleDateString()}\n`;
      }
      if (comparison.releaseDate) {
        text += `**Latest Version Released:** ${new Date(comparison.releaseDate).toLocaleDateString()}\n`;
      }

      text += `\n**Total Available Versions:** ${comparison.availableVersionsCount}\n`;

      if (comparison.needsUpdate) {
        text += `\n**Recommendation:** Consider updating to version ${comparison.latestVersion}. `;
        text += `Use \`get_npm_package_info\` to see more details about the latest version.`;
      }

      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error comparing versions: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleDetectPackageManager(args) {
    const { workspacePath } = args;

    try {
      const result = await this.packageManagerDetector.detectPackageManager(workspacePath);
      const formattedResult = this.packageManagerDetector.formatDetectionResult(result);

      return {
        content: [
          {
            type: "text",
            text: formattedResult,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error detecting package manager: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Ember Docs MCP Server running on stdio");
  }
}

const server = new EmberDocsServer();
server.run().catch(console.error);
