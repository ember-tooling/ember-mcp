# Changelog

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
