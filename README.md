# Ember MCP Server

An MCP (Model Context Protocol) server that provides comprehensive access to Ember documentation, API references, guides, and community best practices.

## Features

- **Complete Documentation Access**: Search through official Ember.js API docs, guides, and community articles
- **API References**: Get detailed API documentation for Ember classes, modules, and methods
- **Best Practices**: Access curated best practices and modern patterns for Ember development
- **Version Information**: Stay up-to-date with Ember versions and migration guides
- **npm Package Tools**: Get the latest package versions and dependency information from npm registry
- **Package Manager Detection**: Automatically detect which package manager (pnpm, yarn, npm, bun) is being used in a workspace to provide the correct commands
- **Smart Search**: Intelligent search with relevance ranking across all documentation sources

## Installation

### Prerequisites

- Node.js 22 or higher
- any MCP-compatible client

### Setup

Using the latest release in your configuration:
```jsonc
{
  "servers": {
    "ember": {
      "command": "npx",
      "args": ["-y", "ember-mcp"]
    }
  }
}
```

Or if you need to ensure a specific shell environment is used:
```bash
{
  "servers": {
    "ember": {
      "command": "/opt/homebrew/bin/bash",
      "args": ["-l", "-c", "pnpm dlx ember-mcp"]
    }
  }
}
```


<details><summary>using a tag-release from github</summary>

```jsonc
{
  "servers": {
    "ember": {
      "command": "npx",
      "args": ["-y", "github:NullVoxPopuli/ember-mcp#v0.0.2-ember-mcp"]
    }
  }
}
```

Any syntax supported by npx would work here    

</details>

<details><summary>local</summary>

1. Clone or download this repository:

```bash
cd ember-mcp
npm install
```

2. Configure in Claude Desktop by editing your `claude_desktop_config.json`:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this to your MCP servers configuration:

```json
{
  "servers": {
    "ember-docs": {
      "command": "node",
      "args": ["/absolute/path/to/ember-mcp/index.js"]
    }
  }
}
```


</details>

Then, restart your editor or its extension host

> [!NOTE]
> VSCode uses the `servers` key for all the MCP servers and Claud uses `mcpServers`

## Available Tools

### 1. `search_ember_docs`

Search through all Ember documentation including API docs, guides, and community content.

**Parameters:**
- `query` (required): Search query (e.g., 'component lifecycle', 'tracked properties')
- `category` (optional): Filter by 'all', 'api', 'guides', or 'community' (default: 'all')
- `limit` (optional): Maximum number of results (default: 5)

**Example:**
```
Search for "tracked properties" in Ember docs
```

### 2. `get_api_reference`

Get detailed API documentation for a specific Ember class, module, or method.

**Parameters:**
- `name` (required): Name of the API element (e.g., 'Component', '@glimmer/component', 'Service')
- `type` (optional): Type of API element ('class', 'module', 'method', 'property')

**Example:**
```
Get API documentation for the Component class
```

### 3. `get_best_practices`

Get Ember best practices and recommendations for specific topics. This tool provides modern patterns, anti-patterns to avoid, and community-approved approaches.

**Parameters:**
- `topic` (required): Topic to get best practices for (e.g., 'component patterns', 'state management', 'testing')

**Example:**
```
What are the best practices for component patterns in Ember?
```

### 4. `get_ember_version_info`

Get information about Ember versions, including current stable version, recent releases, and migration guides.

**Parameters:**
- `version` (optional): Specific version to get info about (returns latest if not specified)

**Example:**
```
What's new in the latest Ember version?
```

### 5. `get_npm_package_info`

Get comprehensive information about an npm package including latest version, description, dependencies, maintainers, and more.

**Parameters:**
- `packageName` (required): Name of the npm package (e.g., 'ember-source', '@glimmer/component')

**Example:**
```
What's the latest version of ember-source?
Get information about @glimmer/component package
```

### 6. `compare_npm_versions`

Compare a current package version with the latest available version on npm. Shows if an update is needed and provides version details to help with dependency upgrades.

**Parameters:**
- `packageName` (required): Name of the npm package
- `currentVersion` (required): Current version being used (e.g., '4.12.0')

**Example:**
```
I'm using ember-source 4.12.0, should I upgrade?
Compare my current version of @glimmer/component (1.1.2) with the latest
```

### 7. `detect_package_manager`

Detect which package manager (pnpm, yarn, npm, bun) is being used in a workspace by examining lockfiles and package.json. Returns the appropriate commands to use for installing dependencies, running scripts, and executing packages.

**Parameters:**
- `workspacePath` (required): Absolute path to the workspace directory to analyze (e.g., '/path/to/project')

**Example:**
```
What package manager should I use in this project?
Which commands should I use to install dependencies?
```

**Why this is important:**
AI agents often default to using `npm` or `npx` commands, but many projects use different package managers. Using the wrong package manager can cause issues with lockfile consistency and dependency resolution. This tool ensures the AI always uses the correct commands for the project.

## Usage Examples

### Getting Started with a New Feature

```
User: I need to implement a feature that tracks user preferences. What's the best approach in modern Ember?

The agent will:
1. Use search_ember_docs to find relevant service and state management docs
2. Use get_best_practices to recommend modern patterns
3. Use get_api_reference to show specific API details for Services
4. Provide code examples following best practices
```

### Understanding API Details

```
User: How do I use the @tracked decorator?

The agent will:
1. Use get_api_reference to get detailed @tracked documentation
2. Use search_ember_docs to find related concepts
3. Use get_best_practices to show modern reactive patterns
```

### Migration Help

```
User: I'm upgrading from Ember 3.x to 4.x, what do I need to know?

The agent will:
1. Use get_ember_version_info to get migration information
2. Use get_best_practices for modern patterns replacing deprecated ones
3. Use search_ember_docs to find upgrade guides
```

### Dependency Management

```
User: Help me upgrade my Ember dependencies. I'm on ember-source 4.8.0

The agent will:
1. Use detect_package_manager to determine which package manager the project uses
2. Use get_npm_package_info to get the latest ember-source information
3. Use compare_npm_versions to check if an update is available
4. Use get_ember_version_info for migration guides
5. Check other related packages for compatibility
6. Provide commands using the correct package manager
```

### Package Manager Awareness

```
User: I want to add ember-concurrency to my project

The agent will:
1. Use detect_package_manager to check the workspace's package manager
2. Provide the correct command (pnpm add, yarn add, npm install, or bun add)
3. Avoid suggesting npm/npx when the project uses a different package manager
```

## Data Source

This MCP server fetches documentation from the comprehensive Ember documentation aggregator:
https://nullvoxpopuli.github.io/ember-ai-information-aggregator/llms-full.txt

This source includes:
- Official Ember.js API documentation (JSON format)
- Official guides and tutorials
- Community blog posts and articles
- Best practices and modern patterns

The documentation is loaded and parsed on server startup, then cached in memory for fast access.

## Best Practices Emphasis

This MCP server is specifically designed to promote Ember best practices by:

1. **Modern Patterns First**: Prioritizes Octane edition patterns and modern JavaScript
2. **Anti-Pattern Detection**: Highlights patterns to avoid
3. **Community Wisdom**: Includes insights from community experts
4. **Version Awareness**: Helps users understand version-specific features and deprecations
5. **Complete Context**: Provides not just "how" but "why" and "when"

## Development

### Running the Server Directly

```bash
npm start
```

The server communicates over stdio and expects MCP protocol messages.

### Development Mode

```bash
npm run dev
```

Uses Node's `--watch` flag for automatic restarts during development.

## Architecture

The server consists of:

- **index.js**: Main MCP server implementation with tool handlers
- **lib/documentation-service.js**: Documentation parsing, indexing, and search logic

The documentation service:
1. Fetches the full documentation on startup
2. Parses it into searchable sections
3. Indexes API documentation for fast lookup
4. Provides smart search with relevance ranking
5. Extracts best practices and examples

## Troubleshooting

### Server not appearing in Claude Desktop

1. Check that the path in `claude_desktop_config.json` is absolute and correct
2. Ensure Node.js is in your PATH
3. Check Claude Desktop logs: `~/Library/Logs/Claude/` (macOS)
4. Restart Claude Desktop completely

### Documentation not loading

The server fetches documentation on first use. Check:
1. Internet connection is available
2. The documentation URL is accessible
3. Server logs for error messages

### Search returning no results

- Try broader search terms
- Use the `category` parameter to narrow the search
- Check spelling of API names

## Contributing

Contributions are welcome! Areas for improvement:

- Better relevance ranking algorithms
- Caching of frequently accessed documentation
- Support for offline mode
- Additional best practice extraction
- Integration with Ember CLI documentation

## License

MIT

## Links

- [Ember.js Official Site](https://emberjs.com)
- [Ember.js API Docs](https://api.emberjs.com)
- [Ember.js Guides](https://guides.emberjs.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Documentation Source](https://nullvoxpopuli.github.io/ember-ai-information-aggregator/)
