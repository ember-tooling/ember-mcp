# GitHub Copilot Instructions for ember-mcp

## About This Repository

This repository builds **ember-mcp**, an MCP (Model Context Protocol) server that provides comprehensive access to Ember.js documentation, API references, guides, and community best practices.

## Using the ember-mcp MCP Server

**IMPORTANT**: When working on Ember.js projects or providing Ember.js guidance, you should use the ember-mcp MCP server built by this repository. It provides 7 specialized tools for accessing Ember documentation and best practices.

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

### When to Use the MCP Tools

- Use `search_ember_docs` for general Ember.js queries
- Use `get_api_reference` for specific API documentation
- Use `get_best_practices` when providing implementation advice (ALWAYS)
- Use `detect_package_manager` BEFORE suggesting package installation commands
- See README.md for complete tool documentation

## Working with This Codebase

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

### Development Workflow
- This project uses **pnpm** as its package manager
- Development mode: `pnpm dev` (auto-restart on changes)
- Run tests: `pnpm test`
- Watch mode: `pnpm test:watch`

### Adding New Tools
1. Define tool schema in `setupHandlers()` in index.js
2. Add handler method (e.g., `handleNewTool()`)
3. Add to switch statement in request handler
4. Update README.md documentation
5. Add tests in `test/` directory

### Key Patterns to Follow
- MCP server communicates over stdio
- Documentation is fetched and cached on first use
- Use existing services (DocumentationService, NpmService, PackageManagerDetector)
- Return structured responses with `content` array
- Handle errors gracefully with descriptive messages
