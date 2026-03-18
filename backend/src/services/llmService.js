const { GoogleGenerativeAI } = require("@google/generative-ai");
const SYSTEM_PROMPT = require('../utils/systemPrompt');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseUserIntent = async (userMessage, sessionState = {}) => {
    try {
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
        });

        const prompt = `Session State: ${JSON.stringify(sessionState)}\nUser Message: ${userMessage}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let jsonString = text.replace(/\`\`\`json\n?|\n?\`\`\`/g, "").trim();

        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonString);
        return parsed;

    } catch (error) {
        console.error('LLM Intent Parsing Error:', error);
        return {
            intent_detected: false,
            error: `Failed to process intent. Debug: ${error.message}`,
            confidence: 0,
            action: null,
            asset: null,
            amount: null,
            to_address: null,
            chain: null,
            risk_flags: []
        };
    }
};

module.exports = { parseUserIntent };
