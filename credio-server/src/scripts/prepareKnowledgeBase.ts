import { vectorStore } from "../services/vectorStore"
import { v4 as uuidv4 } from "uuid"
import { DataCategory } from "@prisma/client"

const knowledgeBaseContent = [
    {
        category: "PROTOCOL" as DataCategory,
        source: "FEMA",
        content:
            "Earthquake safety: Drop, Cover, and Hold On. Drop to hands and knees before the earthquake knocks you down. Cover your head and neck under a sturdy table. Hold on to your shelter until the shaking stops.",
        metadata: { disasterType: "EARTHQUAKE", language: "en" },
    },
    {
        category: "PROTOCOL" as DataCategory,
        source: "WHO",
        content:
            "Flood evacuation: Move to higher ground immediately. Avoid walking through moving water - six inches of moving water can knock you down. Do not drive through flooded areas.",
        metadata: { disasterType: "FLOOD", language: "en" },
    },
    {
        category: "HISTORICAL" as DataCategory,
        source: "USGS",
        content:
            "2011 Tohoku Earthquake: Magnitude 9.0 earthquake struck Japan on March 11, 2011. It triggered a massive tsunami with waves up to 40 meters. Over 15,000 deaths and triggered Fukushima nuclear disaster.",
        metadata: { year: 2011, location: "Japan", disasterType: "EARTHQUAKE" },
    },
    {
        category: "GUIDANCE" as DataCategory,
        source: "Red Cross",
        content:
            "Hurricane evacuation checklist: 1. Secure important documents in waterproof container 2. Pack emergency supplies (water, food, medications) 3. Fill vehicle with fuel 4. Know evacuation routes 5. Notify family of plans",
        metadata: { disasterType: "HURRICANE", language: "en" },
    },
    {
        category: "GUIDANCE" as DataCategory,
        source: "Red Cross",
        content:
            "Treating shock: Lay person down flat. Elevate legs about 12 inches unless head, neck, or back injury suspected. Keep person warm with blanket. Monitor breathing. Do not give food or water.",
        metadata: { category: "first-aid", language: "en" },
    },
    {
        category: "PREDICTION" as DataCategory,
        source: "NOAA",
        content:
            'California earthquake risk: San Andreas Fault poses significant threat. Scientists predict "Big One" (magnitude 7.8+) has 7% probability in next 30 years. Would affect 10 million people in Southern California.',
        metadata: { location: "California", disasterType: "EARTHQUAKE" },
    },
    {
        category: "PROTOCOL" as DataCategory,
        source: "CDC",
        content:
            "Wildfire evacuation: Close all windows and doors. Remove curtains and move furniture to center of rooms. Turn off gas. Leave lights on for visibility. Evacuate immediately when ordered.",
        metadata: { disasterType: "WILDFIRE", language: "en" },
    },
]

async function indexKnowledgeBase() {
    console.log("Indexing knowledge base...")

    const documents = knowledgeBaseContent.map((item) => ({
        id: uuidv4(),
        content: item.content,
        metadata: { ...item.metadata, category: item.category, source: item.source },
        category: item.category,
        source: item.source,
        language: item.metadata.language || "en",
    }))

    await vectorStore.bulkIndex(documents)
    console.log(`Indexed ${documents.length} documents`)
}

// Run if executed directly
if (require.main === module) {
    indexKnowledgeBase()
        .then(() => console.log("Knowledge base indexing complete"))
        .catch((error) => console.error("Indexing failed:", error))
        .finally(() => process.exit(0))
}

export { indexKnowledgeBase }
