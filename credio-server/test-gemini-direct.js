// test-openai-direct.js
require("dotenv").config();
const OpenAI = require("openai");

// Initialize client with API key from environment variable
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
    try {
        console.log("=== Testing OpenAI API Directly ===\n");

        const model = "gpt-4o-mini"; // or "gpt-4o" for higher quality

        // Test 1: Simple Generation
        console.log("\n--- Test 1: Simple Generation ---");
        const res1 = await openai.chat.completions.create({
            model,
            messages: [{ role: "user", content: "What is an earthquake?" }],
        });
        const response1 = res1.choices[0].message.content;
        console.log("Response 1 preview:", response1.substring(0, 100));

        // Test 2: Different question
        console.log("\n--- Test 2: Different Question ---");
        const res2 = await openai.chat.completions.create({
            model,
            messages: [{ role: "user", content: "How do I prepare for a hurricane?" }],
        });
        const response2 = res2.choices[0].message.content;
        console.log("Response 2 preview:", response2.substring(0, 100));

        // Test 3: Another question
        console.log("\n--- Test 3: Another Question ---");
        const res3 = await openai.chat.completions.create({
            model,
            messages: [{ role: "user", content: "Where can I find emergency shelters?" }],
        });
        const response3 = res3.choices[0].message.content;
        console.log("Response 3 preview:", response3.substring(0, 100));

        // Compare
        console.log("\n--- Comparison ---");
        if (response1 === response2 && response2 === response3) {
            console.log("❌ All responses are identical!");
        } else {
            console.log("✅ Responses are different!");
        }

        console.log("\n=== OpenAI API is working correctly ===");
    } catch (error) {
        console.error("❌ OpenAI API test failed:");
        console.error(error);
    }
}

testOpenAI();
