import { embeddingService } from "../services/embeddingService"
import { vectorStore } from "../services/vectorStore"

async function testEmbeddings() {
  console.log("Testing embedding generation...")
  
  const text = "What should I do during an earthquake?"
  const embedding = await embeddingService.generateEmbedding(text)
  
  console.log(`Generated embedding with ${embedding.length} dimensions`)
  console.assert(embedding.length === 768, "Expected 768 dimensions")
  
  console.log("Testing similarity search...")
  const results = await vectorStore.searchSimilar(text, 3)
  
  console.log(`Found ${results.length} results`)
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. Score: ${r.score.toFixed(4)} - ${r.content.slice(0, 80)}...`)
  })
}

testEmbeddings().catch(console.error)
