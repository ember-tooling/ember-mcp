import { describe, it, expect, beforeEach } from 'vitest';
import { EmbeddingService } from '../lib/embedding-service.js';

describe('EmbeddingService', () => {
  let service;

  beforeEach(() => {
    service = new EmbeddingService();
  });

  describe('initialization', () => {
    it('should initialize the embedding model', async () => {
      await service.initialize();
      expect(service.initialized).toBe(true);
      expect(service.embedder).toBeDefined();
    });

    it('should not reinitialize if already initialized', async () => {
      await service.initialize();
      const firstEmbedder = service.embedder;
      await service.initialize();
      expect(service.embedder).toBe(firstEmbedder);
    });
  });

  describe('embed', () => {
    it('should generate embeddings for text', async () => {
      const text = 'This is a test sentence for embedding';
      const embedding = await service.embed(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(typeof embedding[0]).toBe('number');
    }, 30000); // Longer timeout for model loading

    it('should cache embeddings', async () => {
      const text = 'Cached text';
      const embedding1 = await service.embed(text);
      const embedding2 = await service.embed(text);

      expect(embedding1).toBe(embedding2); // Same reference
    }, 30000);

    it('should generate different embeddings for different texts', async () => {
      const text1 = 'Component lifecycle methods';
      const text2 = 'Database query optimization';
      
      const embedding1 = await service.embed(text1);
      const embedding2 = await service.embed(text2);

      expect(embedding1).not.toEqual(embedding2);
    }, 30000);
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const similarity = service.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      const similarity = service.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should calculate similarity for negative vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [-1, 0, 0];
      const similarity = service.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should throw error for vectors of different lengths', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0];
      expect(() => service.cosineSimilarity(vec1, vec2)).toThrow();
    });
  });

  describe('findSimilar', () => {
    it('should find similar documents based on semantic meaning', async () => {
      const query = 'component lifecycle';
      const documents = [
        { text: 'Understanding component lifecycle hooks in Ember', metadata: { id: 1 } },
        { text: 'Database optimization techniques', metadata: { id: 2 } },
        { text: 'Component rendering and lifecycle management', metadata: { id: 3 } },
      ];

      const results = await service.findSimilar(query, documents, 2);

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
      // First result should be about components
      expect([1, 3]).toContain(results[0].metadata.id);
    }, 30000);

    it('should return results sorted by similarity', async () => {
      const query = 'testing';
      const documents = [
        { text: 'How to write unit tests for Ember components', metadata: { score: 'high' } },
        { text: 'Setting up your development environment', metadata: { score: 'low' } },
        { text: 'Integration testing best practices', metadata: { score: 'medium' } },
      ];

      const results = await service.findSimilar(query, documents, 3);

      expect(results).toHaveLength(3);
      // Check that results are sorted by decreasing similarity
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].similarity).toBeGreaterThanOrEqual(results[i + 1].similarity);
      }
    }, 30000);
  });

  describe('cache management', () => {
    it('should track cache size', async () => {
      await service.embed('First text');
      await service.embed('Second text');
      
      const stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    }, 30000);

    it('should clear cache', async () => {
      await service.embed('Text to cache');
      expect(service.getCacheStats().size).toBeGreaterThan(0);
      
      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    }, 30000);
  });

  describe('semantic relationships', () => {
    it('should recognize semantically similar phrases', async () => {
      const text1 = 'tracked properties';
      const text2 = 'reactive state management';
      
      const embedding1 = await service.embed(text1);
      const embedding2 = await service.embed(text2);
      const similarity = service.cosineSimilarity(embedding1, embedding2);

      // These should be somewhat similar
      expect(similarity).toBeGreaterThan(0.3);
    }, 30000);

    it('should recognize dissimilar topics', async () => {
      const text1 = 'component rendering';
      const text2 = 'network protocols';
      
      const embedding1 = await service.embed(text1);
      const embedding2 = await service.embed(text2);
      const similarity = service.cosineSimilarity(embedding1, embedding2);

      // These should be less similar
      expect(similarity).toBeLessThan(0.5);
    }, 30000);
  });
});
