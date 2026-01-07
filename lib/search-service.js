import { create, insert, search as oramaSearch } from '@orama/orama';
import { pipeline } from '@huggingface/transformers';

/**
 * SearchService using Orama for hybrid keyword + vector search
 * 
 * Uses Orama's built-in BM25 keyword search and vector search capabilities
 * to provide hybrid search functionality with minimal custom code.
 */
export class SearchService {
  constructor() {
    this.db = null;
    this.embedder = null;
    this.initialized = false;
    this.embeddingsEnabled = true;
    this.modelName = 'Xenova/all-MiniLM-L6-v2';
  }

  /**
   * Initialize the search database and embedding model
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create Orama database with schema
      this.db = await create({
        schema: {
          id: 'string',
          title: 'string',
          content: 'string',
          category: 'string',
          sectionName: 'string',
          embedding: 'vector[384]', // all-MiniLM-L6-v2 produces 384-dim vectors
        },
      });

      // Initialize embeddings (optional, graceful fallback)
      if (this.embeddingsEnabled) {
        try {
          console.error('Initializing embedding model...');
          this.embedder = await pipeline('feature-extraction', this.modelName);
          console.error('Embedding model initialized successfully');
        } catch (error) {
          console.error('Failed to initialize embedding model:', error.message);
          console.error('Continuing with keyword-only search');
          this.embeddingsEnabled = false;
        }
      }

      this.initialized = true;
      console.error('Search service initialized');
    } catch (error) {
      console.error('Error initializing search service:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for text
   * @private
   * @param {string} text - Text to embed
   * @returns {Promise<number[]|null>} Embedding vector or null
   */
  async generateEmbedding(text) {
    if (!this.embedder || !this.embeddingsEnabled) {
      return null;
    }

    try {
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      return null;
    }
  }

  /**
   * Index a document
   * @param {Object} doc - Document to index
   * @param {string} doc.id - Unique document ID
   * @param {string} doc.title - Document title
   * @param {string} doc.content - Document content
   * @param {string} doc.category - Document category
   * @param {string} doc.sectionName - Section name
   * @returns {Promise<void>}
   */
  async indexDocument(doc) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate embedding for document
    const searchableText = `${doc.title}\n${doc.content.substring(0, 1000)}`;
    const embedding = await this.generateEmbedding(searchableText);

    // Insert into Orama database
    await insert(this.db, {
      id: doc.id,
      title: doc.title,
      content: doc.content.substring(0, 5000), // Limit indexed content size
      category: doc.category,
      sectionName: doc.sectionName,
      embedding: embedding || new Array(384).fill(0), // Use zero vector if embedding failed
    });
  }

  /**
   * Search documents using hybrid keyword + vector search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {string} [options.category] - Filter by category
   * @param {number} [options.limit=5] - Maximum results
   * @param {string} [options.mode='hybrid'] - Search mode: 'fulltext', 'vector', or 'hybrid'
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      category = null,
      limit = 5,
      mode = 'hybrid',
    } = options;

    // Determine search mode based on embeddings availability
    let searchMode = mode;
    if (mode === 'hybrid' && !this.embeddingsEnabled) {
      searchMode = 'fulltext'; // Fall back to keyword-only
    } else if (mode === 'vector' && !this.embeddingsEnabled) {
      console.warn('Vector search requested but embeddings unavailable, using fulltext');
      searchMode = 'fulltext';
    }

    // Build search configuration
    const searchConfig = {
      term: query,
      mode: searchMode,
      limit: limit * 3, // Get more results for filtering
      properties: ['title', 'content'], // Search in these fields
    };

    // Generate query embedding for vector/hybrid search
    if (searchMode === 'vector' || searchMode === 'hybrid') {
      const queryEmbedding = await this.generateEmbedding(query);
      if (queryEmbedding) {
        searchConfig.vector = {
          value: queryEmbedding,
          property: 'embedding',
        };
      } else {
        // If embedding generation fails, fall back to fulltext
        searchConfig.mode = 'fulltext';
        delete searchConfig.vector;
      }
    }

    // Perform search using Orama
    const results = await oramaSearch(this.db, searchConfig);

    // Format and filter results
    let formattedResults = results.hits.map(hit => ({
      id: hit.document.id,
      title: hit.document.title,
      content: hit.document.content,
      category: hit.document.category,
      sectionName: hit.document.sectionName,
      score: hit.score,
    }));

    // Apply category filter manually (Orama's where clause seems unreliable)
    if (category && category !== 'all') {
      formattedResults = formattedResults.filter(r => r.category === category);
    }

    return formattedResults.slice(0, limit);
  }

  /**
   * Get total number of indexed documents
   * @returns {number} Document count
   */
  getDocumentCount() {
    if (!this.db) {
      return 0;
    }
    return this.db.data.docs.count;
  }

  /**
   * Check if embeddings are enabled
   * @returns {boolean}
   */
  areEmbeddingsEnabled() {
    return this.embeddingsEnabled && this.embedder !== null;
  }
}
