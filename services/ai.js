import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();

// initializing model
const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.6
});

export async function generateResponse(promptText) {
    try {
        const response = await llm.invoke(promptText);
        return response.content;
    }
    catch (error) {
        console.error("Error communicating with groq:", error);
        return "Sorry, I am having trouble thinking right now";
    }
}