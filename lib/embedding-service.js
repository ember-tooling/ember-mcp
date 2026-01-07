import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to use local models
env.allowLocalModels = true;
env.allowRemoteModels = true;

/**
 * EmbeddingService
 * 
 * Provides semantic search capabilities using embeddings and vector similarity.
 * Uses HuggingFace transformers.js to generate embeddings locally without external API calls.
 */
export class EmbeddingService {
  constructor() {
    this.embedder = null;
    this.embeddingCache = new Map();
    this.initialized = false;
    // Use a lightweight model suitable for semantic search
    this.modelName = 'Xenova/all-MiniLM-L6-v2';
  }

  /**
   * Initialize the embedding pipeline
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.error('Initializing embedding model...');
      this.embedder = await pipeline('feature-extraction', this.modelName);
      this.initialized = true;
      console.error('Embedding model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize embedding model:', error.message);
      console.error('Embeddings will be disabled. Falling back to keyword search only.');
      this.initialized = false;
      // Don't throw - allow graceful degradation
    }
  }

  /**
   * Generate embedding for a text string
   * @param {string} text - Text to embed
   * @returns {Promise<number[]|null>} Embedding vector or null if not available
   */
  async embed(text) {
    if (!this.initialized) {
      await this.initialize();
    }

    // If initialization failed, return null
    if (!this.embedder) {
      return null;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    try {
      // Generate embedding
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Convert to regular array
      const embedding = Array.from(output.data);

      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} Array of embedding vectors (may include nulls if embedding fails)
   */
  async embedBatch(texts) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.embedder) {
      return texts.map(() => null);
    }

    const embeddings = [];
    for (const text of texts) {
      const embedding = await this.embed(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {number[]} embedding1 - First embedding vector
   * @param {number[]} embedding2 - Second embedding vector
   * @returns {number} Cosine similarity score (0-1)
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Find most similar texts to a query using embeddings
   * @param {string} query - Query text
   * @param {Array<{text: string, metadata: any}>} documents - Documents to search
   * @param {number} [topK=5] - Number of top results to return
   * @returns {Promise<Array<{similarity: number, metadata: any}>>} Top similar documents
   */
  async findSimilar(query, documents, topK = 5) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.embedder) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.embed(query);
    if (!queryEmbedding) {
      return [];
    }

    // Calculate similarities
    const results = [];
    for (const doc of documents) {
      const docEmbedding = await this.embed(doc.text);
      if (docEmbedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        results.push({
          similarity,
          metadata: doc.metadata,
        });
      }
    }

    // Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Generate cache key for text
   * @private
   * @param {string} text - Text to generate key for
   * @returns {string} Cache key
   */
  getCacheKey(text) {
    // Simple hash function for cache keys
    // Truncate very long texts for caching
    const truncated = text.substring(0, 500);
    let hash = 0;
    for (let i = 0; i < truncated.length; i++) {
      const char = truncated.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.embeddingCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {{size: number, maxSize: number}}
   */
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      maxSize: 1000, // We can add a limit if needed
    };
  }
}
