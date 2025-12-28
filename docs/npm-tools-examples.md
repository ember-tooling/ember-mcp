# npm Tools Usage Examples

This document provides detailed examples of how to use the npm package tools in the Ember MCP Server.

## Overview

The MCP server includes two powerful tools for working with npm packages:

1. **get_npm_package_info** - Get comprehensive package information
2. **compare_npm_versions** - Compare your current version with the latest

These tools are especially useful when:
- Planning dependency upgrades
- Checking if packages need updates
- Understanding package dependencies
- Verifying compatibility between packages

## Example Use Cases

### 1. Checking the Latest Version of ember-source

**Query to Agent:**
```
What's the latest version of ember-source and what does it include?
```

**What the Agent Does:**
1. Calls `get_npm_package_info` with packageName: "ember-source"
2. Returns information including:
   - Latest version (e.g., 5.12.0)
   - Distribution tags (latest, lts, beta, etc.)
   - Description
   - Dependencies
   - Release date
   - Homepage and repository links

**Expected Output Format:**
```markdown
# ember-source

**Description:** A JavaScript framework for creating ambitious web applications

**Latest Version:** 5.12.0

**Distribution Tags:**
  - latest: 5.12.0
  - lts: 4.12.4
  - beta: 6.0.0-beta.1

**License:** MIT
**Homepage:** https://emberjs.com
**Repository:** https://github.com/emberjs/ember.js

**Dependencies:** 45 runtime dependencies

**Last Published:** December 15, 2024
```

### 2. Planning an Upgrade from Ember 4.x to 5.x

**Query to Agent:**
```
I'm currently on ember-source 4.8.0. Should I upgrade to the latest version?
```

**What the Agent Does:**
1. Calls `compare_npm_versions` with:
   - packageName: "ember-source"
   - currentVersion: "4.8.0"
2. Analyzes the comparison results
3. May also call `get_ember_version_info` for migration guides

**Expected Output Format:**
```markdown
# Version Comparison: ember-source

**Current Version:** 4.8.0
**Latest Version:** 5.12.0

⚠️ **Status:** An update is available.

**Available Tags:**
  - latest: 5.12.0
  - lts: 4.12.4 (current branch)
  - beta: 6.0.0-beta.1

**Current Version Released:** March 15, 2023
**Latest Version Released:** December 15, 2024

**Total Available Versions:** 450

**Recommendation:** Consider updating to version 5.12.0 or staying on the LTS 
version 4.12.4. Use `get_npm_package_info` to see more details about the 
latest version.
```

### 3. Auditing Multiple Dependencies

**Query to Agent:**
```
Check if these packages need updates:
- ember-source: 4.12.0
- @glimmer/component: 1.1.2
- ember-cli: 4.12.0
```

**What the Agent Does:**
1. Iterates through each package
2. Calls `compare_npm_versions` for each one
3. Summarizes which need updates
4. Provides recommendations

**Expected Output Format:**
```markdown
# Dependency Audit Results

## ember-source
- Current: 4.12.0
- Latest: 5.12.0
- Status: ⚠️ Update available (major version)

## @glimmer/component
- Current: 1.1.2
- Latest: 1.1.4
- Status: ⚠️ Update available (patch version)

## ember-cli
- Current: 4.12.0
- Latest: 5.12.0
- Status: ⚠️ Update available (major version)

## Recommendations:
1. Update @glimmer/component first (minor change)
2. Consider updating ember-cli and ember-source together
3. Review the migration guide for 4.x → 5.x upgrade path
```

### 4. Checking Addon Compatibility

**Query to Agent:**
```
I want to use ember-data. What version should I use with ember-source 5.12.0?
```

**What the Agent Does:**
1. Calls `get_npm_package_info` for "ember-data"
2. Examines peerDependencies
3. Checks compatibility information
4. Recommends appropriate version

### 5. Exploring Pre-release Versions

**Query to Agent:**
```
What beta versions are available for ember-source?
```

**What the Agent Does:**
1. Calls `get_npm_package_info` for "ember-source"
2. Shows all distribution tags including beta, canary, etc.
3. Provides release dates and information

**Expected Output Format:**
```markdown
# ember-source Pre-release Versions

**Distribution Tags:**
  - latest: 5.12.0 (stable)
  - beta: 6.0.0-beta.1
  - canary: 6.0.0-canary.20241220
  - lts: 4.12.4

The latest beta is **6.0.0-beta.1**, which includes early access to:
- [New features from the beta]
- Breaking changes to be aware of
- Timeline for stable release

**Note:** Beta versions are suitable for testing but not recommended for 
production use.
```

## Integration with Other Tools

The npm tools work seamlessly with other Ember MCP tools:

### Combined Example: Full Upgrade Plan

**Query to Agent:**
```
Create a complete upgrade plan for moving from Ember 4.8.0 to the latest 
version, checking all my dependencies.
```

**Agent Workflow:**
1. Uses `compare_npm_versions` to check current ember-source status
2. Uses `get_npm_package_info` to get latest versions of all deps
3. Uses `get_ember_version_info` to find migration guides
4. Uses `search_ember_docs` to find breaking changes
5. Uses `get_best_practices` for modern upgrade patterns

This creates a comprehensive upgrade plan with:
- Version comparisons
- Breaking changes
- Migration steps
- Updated dependency list
- Testing recommendations

## Tips for Best Results

1. **Be Specific with Versions**: Always provide exact version numbers when comparing
2. **Check Multiple Packages**: Ask about related packages (ember-source, ember-cli, ember-data) together
3. **Consider LTS**: Ask about LTS versions if stability is important
4. **Review Dependencies**: Check both runtime and peer dependencies
5. **Plan Incrementally**: For major upgrades, consider intermediate versions

## Common Patterns

### Pattern 1: Quick Version Check
```
What's the latest version of [package-name]?
```

### Pattern 2: Should I Update?
```
I'm on [package-name] version X.Y.Z, should I upgrade?
```

### Pattern 3: Full Dependency Audit
```
Review all my Ember dependencies and tell me what needs updating:
[paste package.json dependencies]
```

### Pattern 4: Compatibility Check
```
Is [package-name] version X.Y.Z compatible with ember-source A.B.C?
```

### Pattern 5: Pre-release Investigation
```
What beta/canary features are available in [package-name]?
```
