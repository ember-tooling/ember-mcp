# Semantic Search Implementation

## Overview

This document explains the semantic search enhancement using embeddings and vector similarity to improve search quality in the ember-mcp server.

## Problem

The original search implementation used keyword-based matching with:
- Exact term matching
- Proximity scoring (terms close together)
- Title matching bonuses

**Limitations:**
- Couldn't find content when users used different terminology
- Missed semantically related content
- Example: Searching for "reactive state" wouldn't find "tracked properties"

## Solution

Implemented **hybrid search** combining keyword matching with semantic search using machine learning embeddings.

### Key Components

#### 1. Embedding Service (`lib/embedding-service.js`)
- Uses HuggingFace Transformers.js with `all-MiniLM-L6-v2` model
- Generates 384-dimensional vector embeddings for text
- Runs locally - no external API calls
- Caches embeddings for performance
- Calculates cosine similarity between vectors

#### 2. Vector Similarity
Cosine similarity formula:
```
similarity = (A · B) / (||A|| × ||B||)
```
Where:
- A and B are embedding vectors
- · is dot product
- ||A|| is magnitude of vector A

Results in score from 0 (unrelated) to 1 (identical)

#### 3. Hybrid Scoring
Final score = (keyword_score × 0.6) + (semantic_score × 0.4)

**Why this weighting?**
- Keyword matching is precise for exact matches
- Semantic search adds broader context
- 60/40 split balances both approaches
- Documents found by both methods get highest scores

### Architecture Flow

```
User Query
    ↓
┌───────────────────┐     ┌────────────────────┐
│ Keyword Search    │     │ Semantic Search    │
│ - Term matching   │     │ - Generate query   │
│ - Proximity score │     │   embedding        │
│ - Title bonus     │     │ - Compare with doc │
└─────────┬─────────┘     │   embeddings       │
          │               └──────────┬─────────┘
          │                          │
          └──────────┬───────────────┘
                     ↓
          ┌─────────────────────┐
          │  Merge & Re-rank    │
          │  - Combine scores   │
          │  - Boost overlaps   │
          │  - Sort by hybrid   │
          └──────────┬──────────┘
                     ↓
              Final Results
```

## Benefits

### 1. Semantic Understanding
```javascript
Query: "lifecycle methods"
Matches:
- "component hooks" (semantic similarity)
- "lifecycle callbacks" (keyword + semantic)
- "didInsert and willDestroy" (semantic)
```

### 2. Synonym Handling
```javascript
Query: "reactive state"
Matches:
- "tracked properties" ✓ (would miss with keywords only)
- "state management"
- "reactive data"
```

### 3. Conceptual Queries
```javascript
Query: "dependency injection"
Matches:
- "Services in Ember" ✓
- "Injecting services"
- "Service patterns"
```

## Performance Considerations

### Model Size
- Model: ~80MB (one-time download)
- Cached locally after first download
- Embeddings: 384 floats × 4 bytes = 1.5KB per document

### Initialization
- First run: 10-30 seconds (model download + index building)
- Subsequent runs: 2-5 seconds (load cached model + generate embeddings)
- Background processing doesn't block search

### Search Performance
- Keyword search: ~1-5ms
- Semantic search: ~10-50ms (depends on index size)
- Total: ~15-55ms (acceptable for interactive use)

## Graceful Degradation

System works in multiple modes:

### Mode 1: Full Hybrid (Internet Available)
1. Download embedding model
2. Build embedding index
3. Use keyword + semantic search

### Mode 2: Keyword Only (No Internet / Model Failed)
1. Model download fails → log warning
2. Disable semantic search
3. Use keyword search only
4. No errors, fully functional

### Mode 3: Embeddings Enabled Option
```javascript
// Disable embeddings explicitly
const service = new DocumentationService({ 
  useEmbeddings: false 
});
```

## Testing Strategy

### Unit Tests
- Embedding service tests (skip if no internet)
- Cosine similarity calculations
- Cache management

### Integration Tests
- Hybrid search with both result types
- Fallback to keyword-only
- Result merging logic
- Score calculations

### All Tests Pass
```
Test Files  9 passed (9)
Tests      147 passed (147)
```

## Future Enhancements

### Potential Improvements
1. **Semantic Caching**: Cache embeddings to disk
2. **Larger Models**: Option for more accurate (but slower) models
3. **Query Expansion**: Use embeddings to suggest related searches
4. **Filtering**: Pre-filter by category before semantic search
5. **Re-ranking**: Use a second model to re-rank top results

### Alternative Approaches
- **ONNX Runtime**: Faster inference with quantized models
- **Vector Databases**: Use Qdrant/Weaviate for larger datasets
- **Custom Models**: Fine-tune model on Ember-specific docs

## Configuration

### Current Settings (`lib/config.js`)
```javascript
SEARCH_CONFIG: {
  HYBRID_KEYWORD_WEIGHT: 0.6,
  HYBRID_SEMANTIC_WEIGHT: 0.4,
  EMBEDDING_TEXT_LIMIT: 1000, // chars per document
  SEMANTIC_MIN_SIMILARITY: 0.1, // minimum score threshold
}
```

### Tuning Recommendations
- Increase keyword weight for technical docs (0.7/0.3)
- Increase semantic weight for conceptual content (0.5/0.5)
- Adjust similarity threshold based on precision/recall needs

## References

- [HuggingFace Transformers.js](https://huggingface.co/docs/transformers.js)
- [all-MiniLM-L6-v2 Model](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [Sentence Transformers](https://www.sbert.net/)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
