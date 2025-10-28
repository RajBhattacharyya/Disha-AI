import { ragService } from "../services/ragService"

async function testRAGPipeline() {
  console.log("Testing RAG pipeline...")

  const userId = "test-user-id"
  const sessionId = "test-session-id"
  const query = "What should I do during an earthquake?"

  try {
    const response = await ragService.processQuery(userId, query, sessionId)

    console.log("Intent:", response.intent)
    console.log("Response:", response.response)
    console.log("Sources:", response.context)

    console.assert(response.response.length > 0, "Response should not be empty")
    console.assert(response.intent !== null, "Intent should be detected")
    console.log("✅ RAG pipeline test passed")
  } catch (error) {
    console.error("❌ RAG pipeline test failed:", error)
  }
}

testRAGPipeline()
