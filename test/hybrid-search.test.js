import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentationService } from '../lib/documentation-service.js';

describe('Hybrid Search Integration', () => {
  let service;

  beforeEach(() => {
    service = new DocumentationService({ useEmbeddings: true });
  });

  describe('search with embeddings disabled', () => {
    it('should fall back to keyword search gracefully', async () => {
      const mockDoc = `# api-docs

## Component

Component is a base class for Ember components. It provides lifecycle hooks
and rendering capabilities for creating reusable UI elements.

----------

## Service

Service provides a way to share state and functionality across your application.
Services are long-lived singletons that can be injected into routes and components.`;

      service.parseDocumentation(mockDoc);

      // Search should work even without embeddings
      const results = await service.search('component', 'all', 5);
      
      // With keyword-only search, we should get at least some results
      expect(results.length).toBeGreaterThan(0);
    });

    it('should provide keyword-based results when embeddings unavailable', async () => {
      const mockDoc = `# guides

## Understanding Tracked Properties

Tracked properties are reactive state in Ember. When you modify a tracked
property, the UI automatically updates to reflect the change.

----------

## State Management Patterns

Learn about different approaches to managing application state in Ember,
including services, tracked properties, and data stores.`;

      service.parseDocumentation(mockDoc);

      const results = await service.search('state', 'all', 5);
      
      // With keyword search, should find results
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('keyword vs semantic search capabilities', () => {
    beforeEach(() => {
      const mockDoc = `# guides

## Component Lifecycle Hooks

Learn about component lifecycle hooks like willDestroy, didInsert,
and how to use them effectively in your Ember applications.

----------

## Managing Component State

Best practices for handling reactive data and state management
in Ember components using tracked properties and args.

----------

## Database Query Performance

Tips for optimizing database queries and improving application
performance at the data layer.`;

      service.parseDocumentation(mockDoc);
    });

    it('should find exact keyword matches', async () => {
      const results = await service.search('lifecycle', 'all', 5);
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find results for related terms through keywords', async () => {
      const results = await service.search('state', 'all', 5);
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter out unrelated content', async () => {
      const results = await service.search('component rendering', 'all', 5);
      
      // Database query article should not appear (or be ranked low)
      if (results.length > 0) {
        const topResult = results[0];
        expect(topResult.title.toLowerCase()).not.toContain('database');
      }
    });
  });

  describe('hybrid scoring behavior', () => {
    it('should handle merging when only keyword results exist', async () => {
      const keywordResults = [
        { title: 'Test 1', keywordScore: 50, url: '/test1' },
        { title: 'Test 2', keywordScore: 30, url: '/test2' },
      ];
      const semanticResults = [];

      const merged = service.mergeSearchResults(keywordResults, semanticResults);

      expect(merged.length).toBe(2);
      expect(merged[0].hybridScore).toBe(50 * 0.6); // 60% weight
      expect(merged[0].title).toBe('Test 1');
    });

    it('should handle merging when only semantic results exist', async () => {
      const keywordResults = [];
      const semanticResults = [
        { title: 'Test 1', semanticScore: 80, url: '/test1' },
        { title: 'Test 2', semanticScore: 60, url: '/test2' },
      ];

      const merged = service.mergeSearchResults(keywordResults, semanticResults);

      expect(merged.length).toBe(2);
      expect(merged[0].hybridScore).toBe(80 * 0.4); // 40% weight
      expect(merged[0].title).toBe('Test 1');
    });

    it('should boost documents found by both methods', async () => {
      const keywordResults = [
        { title: 'Test 1', keywordScore: 50, url: '/test1' },
        { title: 'Test 2', keywordScore: 40, url: '/test2' },
      ];
      const semanticResults = [
        { title: 'Test 2', semanticScore: 60, url: '/test2' },
        { title: 'Test 3', semanticScore: 50, url: '/test3' },
      ];

      const merged = service.mergeSearchResults(keywordResults, semanticResults);

      // Test 2 appears in both, should get highest score
      const test2 = merged.find(r => r.title === 'Test 2');
      expect(test2).toBeDefined();
      expect(test2.hybridScore).toBe(40 * 0.6 + 60 * 0.4); // 24 + 24 = 48
      expect(test2.searchType).toBe('hybrid');
      
      // Test 2 should be ranked first
      expect(merged[0].title).toBe('Test 2');
    });

    it('should properly sort merged results by hybrid score', async () => {
      const keywordResults = [
        { title: 'Low keyword', keywordScore: 20, url: '/low' },
        { title: 'High keyword', keywordScore: 100, url: '/high' },
      ];
      const semanticResults = [
        { title: 'Medium semantic', semanticScore: 50, url: '/medium' },
      ];

      const merged = service.mergeSearchResults(keywordResults, semanticResults);

      // Should be sorted: High keyword (60), Medium semantic (20), Low keyword (12)
      expect(merged[0].title).toBe('High keyword');
      expect(merged[0].hybridScore).toBe(60);
    });
  });
});
