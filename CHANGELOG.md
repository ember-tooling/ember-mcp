# Changelog






## Release (2026-02-20)

* ember-mcp 0.1.0 (minor)

#### :rocket: Enhancement
* `ember-mcp`
  * [#19](https://github.com/ember-tooling/ember-mcp/pull/19) Add package manager detection tool and update documentation ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#16](https://github.com/ember-tooling/ember-mcp/pull/16) Add tools for getting latest npm versions ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### :bug: Bug Fix
* `ember-mcp`
  * [#23](https://github.com/ember-tooling/ember-mcp/pull/23) Fix npm audit vulnerabilities: upgrade @modelcontextprotocol/sdk and override tar ([@Copilot](https://github.com/apps/copilot-swe-agent))

#### :memo: Documentation
* `ember-mcp`
  * [#20](https://github.com/ember-tooling/ember-mcp/pull/20) Add disclaimer section to README for user safety and risk awareness ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#10](https://github.com/ember-tooling/ember-mcp/pull/10) Drop versions for the default docs example ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#9](https://github.com/ember-tooling/ember-mcp/pull/9) Update README with shell environment instructions ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#7](https://github.com/ember-tooling/ember-mcp/pull/7) Revise README for Ember MCP Server and Node.js version ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### :house: Internal
* `ember-mcp`
  * [#32](https://github.com/ember-tooling/ember-mcp/pull/32) Update release-plan ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#21](https://github.com/ember-tooling/ember-mcp/pull/21) Add GitHub Copilot instructions and VSCode settings with ember-mcp MCP server integration ([@Copilot](https://github.com/apps/copilot-swe-agent))
  * [#17](https://github.com/ember-tooling/ember-mcp/pull/17) Add test ci job ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: 2
- Copilot [Bot] ([@copilot-swe-agent](https://github.com/apps/copilot-swe-agent))
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)

## Unreleased

#### :rocket: Enhancement
* `ember-mcp`
  * [#12](https://github.com/ember-tooling/ember-mcp/issues/12) Add package manager detection tool
    - New tool: `detect_package_manager` - Automatically detect which package manager (pnpm, yarn, npm, bun) is being used in a workspace
    - Provides correct commands for the detected package manager
    - Helps AI agents avoid using npm/npx when project uses a different package manager
  * [#15](https://github.com/ember-tooling/ember-mcp/issues/15) Add npm package tools for dependency management
    - New tool: `get_npm_package_info` - Get comprehensive information about npm packages
    - New tool: `compare_npm_versions` - Compare current package versions with latest available
    - Helps agents upgrade dependencies and check package versions

## Release (2025-10-22)

* ember-mcp 0.0.3 (patch)

#### :bug: Bug Fix
* `ember-mcp`
  * [#4](https://github.com/NullVoxPopuli/ember-mcp/pull/4) Fix release info ([@wagenet](https://github.com/wagenet))

#### :memo: Documentation
* `ember-mcp`
  * [#6](https://github.com/NullVoxPopuli/ember-mcp/pull/6) Add more detailed setup insturctions ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: 2
- Peter Wagenet ([@wagenet](https://github.com/wagenet))
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)

## Release (2025-10-21)

* ember-mcp 0.0.2 (patch)

#### :house: Internal
* `ember-mcp`
  * [#1](https://github.com/NullVoxPopuli/ember-mcp/pull/1) Release-plan ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: 1
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)
