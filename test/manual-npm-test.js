#!/usr/bin/env node

/**
 * Manual test script for the MCP server
 * This simulates what an MCP client would do
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { NpmService } from "../lib/npm-service.js";

async function testNpmTools() {
  console.log("Testing npm tools...\n");

  const npmService = new NpmService();

  // Test 1: Get package info
  console.log("1. Testing get_npm_package_info for 'ember-source':");
  try {
    const packageInfo = await npmService.getPackageInfo('ember-source');
    const formatted = npmService.formatPackageInfo(packageInfo);
    console.log(`   ✓ Package: ${formatted.name}`);
    console.log(`   ✓ Latest version: ${formatted.latestVersion}`);
    console.log(`   ✓ Description: ${formatted.description.substring(0, 80)}...`);
    console.log(`   ✓ Dist tags: ${Object.keys(formatted.distTags).join(', ')}\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }

  // Test 2: Compare versions
  console.log("2. Testing compare_npm_versions for 'ember-source' 4.0.0:");
  try {
    const comparison = await npmService.getVersionComparison('ember-source', '4.0.0');
    console.log(`   ✓ Current: ${comparison.currentVersion}`);
    console.log(`   ✓ Latest: ${comparison.latestVersion}`);
    console.log(`   ✓ Is latest: ${comparison.isLatest}`);
    console.log(`   ✓ Needs update: ${comparison.needsUpdate}\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }

  // Test 3: Get latest version
  console.log("3. Testing get latest version for '@glimmer/component':");
  try {
    const latestVersion = await npmService.getLatestVersion('@glimmer/component');
    console.log(`   ✓ Latest version: ${latestVersion}\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }

  // Test 4: Error handling - non-existent package
  console.log("4. Testing error handling with non-existent package:");
  try {
    await npmService.getPackageInfo('this-package-definitely-does-not-exist-12345');
    console.error(`   ✗ Should have thrown an error\n`);
  } catch (error) {
    console.log(`   ✓ Correctly threw error: ${error.message}\n`);
  }

  console.log("All tests completed!");
}

// Run the tests
testNpmTools().catch(console.error);
