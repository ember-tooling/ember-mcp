# GitHub Copilot Instructions for ember-mcp

## About This Repository

This repository builds **ember-mcp**, an MCP (Model Context Protocol) server that provides comprehensive access to Ember.js documentation, API references, guides, and community best practices. The MCP server is designed to help AI agents provide better Ember.js development assistance.

## Using the ember-mcp MCP Server

**IMPORTANT**: When working on Ember.js projects or providing Ember.js guidance, you should use the ember-mcp MCP server built by this repository. The server provides seven specialized tools for accessing Ember documentation and best practices.

### How to Configure ember-mcp

For local development in this repository:

```json
{
  "mcpServers": {
    "ember-docs": {
      "command": "node",
      "args": ["/absolute/path/to/ember-mcp/index.js"]
    }
  }
}
```

For production use:

```json
{
  "mcpServers": {
    "ember": {
      "command": "npx",
      "args": ["-y", "ember-mcp"]
    }
  }
}
```

### Available MCP Tools

Always use these tools when providing Ember.js assistance:

1. **search_ember_docs** - Search through all Ember documentation
   - Use for general queries about Ember concepts, features, or usage
   - Parameters: `query`, `category` (api/guides/community), `limit`

2. **get_api_reference** - Get detailed API documentation
   - Use for specific class, module, or method documentation
   - Parameters: `name`, `type` (class/module/method/property)

3. **get_best_practices** - Get Ember best practices and recommendations
   - ALWAYS use this when providing implementation advice
   - Parameters: `topic` (e.g., 'component patterns', 'state management', 'testing')

4. **get_ember_version_info** - Get version information and migration guides
   - Use for version-specific features and deprecations
   - Parameters: `version` (optional)

5. **get_npm_package_info** - Get npm package information
   - Use before suggesting package upgrades
   - Parameters: `packageName`

6. **compare_npm_versions** - Compare package versions
   - Use to determine if updates are needed
   - Parameters: `packageName`, `currentVersion`

7. **detect_package_manager** - Detect project's package manager
   - ALWAYS use BEFORE suggesting package installation commands
   - Ensures correct commands (pnpm/yarn/npm/bun)
   - Parameters: `workspacePath`

## Development Best Practices

### Code Style
- Modern ES modules (ESM) - use `import`/`export`
- Use descriptive variable names
- Minimal comments - code should be self-documenting
- Follow existing patterns in the codebase

### Architecture
- **index.js**: Main MCP server with tool handlers
- **lib/documentation-service.js**: Documentation parsing and search
- **lib/npm-service.js**: npm registry integration
- **lib/package-manager-detector.js**: Package manager detection
- **lib/formatters.js**: Output formatting
- **lib/deprecation-manager.js**: Deprecation tracking
- **lib/release-notes-parser.js**: Release notes parsing
- **lib/url-builder.js**: URL construction

### Testing
- Use Vitest for testing
- Run tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage: `pnpm test:coverage`
- Tests are in the `test/` directory

### Running Locally
- Development mode: `pnpm dev` (auto-restart on changes)
- Production mode: `pnpm start`
- Server communicates over stdio using MCP protocol

## Ember.js Best Practices to Promote

When providing code examples or suggestions for Ember.js:

1. **Modern Patterns First**
   - Octane edition patterns (tracked properties, native classes)
   - Modern JavaScript (async/await, destructuring)
   - Glimmer components over classic components

2. **Reactivity**
   - Use `@tracked` for reactive state
   - Use `@cached` for derived state
   - Avoid manual `notifyPropertyChange()`

3. **Components**
   - Prefer template-only components when possible
   - Use angle bracket invocation
   - Pass data down, actions up

4. **Services**
   - Use for shared state and behavior
   - Keep them focused and single-purpose
   - Inject only where needed

5. **Testing**
   - Write tests for all new features
   - Use modern testing patterns (setupTest, setupRenderingTest)
   - Test user behavior, not implementation

## Anti-Patterns to Avoid

- Classic components (use Glimmer components)
- Computed properties (use native getters with @tracked/@cached)
- Observers (use reactive patterns)
- Manual DOM manipulation (use declarative templates)
- Using npm when project uses different package manager

## Working with This Codebase

### Adding New Tools
1. Define tool schema in `setupHandlers()` in index.js
2. Add handler method (e.g., `handleNewTool()`)
3. Add to switch statement in request handler
4. Update README.md documentation
5. Add tests in `test/` directory

### Modifying Documentation Service
- Main logic in `lib/documentation-service.js`
- Fetches from: https://nullvoxpopuli.github.io/ember-ai-information-aggregator/llms-full.txt
- Caches documentation in memory
- Uses relevance ranking for search

### Package Manager Detection
- Checks for lockfiles (pnpm-lock.yaml, yarn.lock, package-lock.json, bun.lockb)
- Checks package.json packageManager field
- Returns appropriate commands for detected manager

## MCP Protocol

This server implements the Model Context Protocol:
- Uses `@modelcontextprotocol/sdk`
- Communicates over stdio
- Provides tools (not prompts or resources)
- Returns structured JSON responses

## Release Process

- Uses semantic versioning
- Automated with release-plan
- Updates CHANGELOG.md automatically
- Published to npm as `ember-mcp`

## Key Files to Know

- **README.md**: User-facing documentation
- **USAGE_EXAMPLES.md**: Detailed usage examples
- **package.json**: Dependencies and scripts
- **index.js**: Main entry point (has shebang for CLI)
- **vitest.config.js**: Test configuration

## When Suggesting Code Changes

1. Check existing patterns in the codebase first
2. Maintain consistency with current architecture
3. Update tests when changing functionality
4. Update documentation when changing behavior
5. Consider backward compatibility
6. Think about error handling and edge cases

## Common Development Tasks

### Running the server locally
```bash
pnpm dev  # Development with auto-restart
```

### Testing changes
```bash
pnpm test  # Run all tests
pnpm test:watch  # Watch mode
```

### Updating dependencies
```bash
# This project uses pnpm
pnpm update
```

### Debugging
- Server logs errors to stderr
- Use console.error for debugging
- Check Claude Desktop logs: `~/Library/Logs/Claude/` (macOS)

## Documentation Sources

The server aggregates documentation from:
- Official Ember.js API documentation
- Official guides and tutorials  
- Community blog posts and articles
- Best practices and modern patterns

Source URL: https://nullvoxpopuli.github.io/ember-ai-information-aggregator/llms-full.txt

## Remember

- **Always test changes**: Run the server locally and verify MCP tools work
- **Use the MCP server**: When providing Ember.js guidance, use the tools from this server
- **Modern patterns**: Promote Octane edition and modern JavaScript
- **Package manager awareness**: Always detect and use the correct package manager
- **Error handling**: Provide helpful error messages
- **Documentation**: Keep README and examples up to date
