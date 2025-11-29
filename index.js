import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

// Services
import { generateResponse } from './services/ai.js';
import { addResumeToVectorDB, queryVectorDB } from './services/rag.js';
import { extractTextFromPDF } from './services/pdf.js';

// --- Configuration ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Configure Multer (Keep file in memory for immediate processing)
const upload = multer({ storage: multer.memoryStorage() });

// --- Middleware ---
app.use(cors());              // Allow Frontend access
app.use(express.json());      // Parse JSON bodies

// --- Routes ---

/**
 * 1. Health Check
 * Used by Render to verify the server is alive.
 */
app.get('/', (req, res) => {
    res.send({
        status: 'Active',
        message: 'HireFlow AI Backend is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * 2. Resume Upload
 * - Accepts a PDF file
 * - Extracts text
 * - Stores embeddings in Pinecone
 */
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    const { file } = req;
    const { candidateId } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📄 Received file: ${file.originalname}`);

    // Extract text from PDF
    const text = await extractTextFromPDF(file.buffer);
    console.log(`📝 Extracted ${text.length} characters`);

    // Save to Vector DB
    // Use filename as ID if candidateId is not provided
    const id = candidateId || file.originalname; 
    await addResumeToVectorDB(text, id);

    res.json({ 
      success: true, 
      message: "Resume processed and stored in memory.",
      id: id
    });

  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Failed to process resume" });
  }
});

/**
 * 3. AI Chat Interface (RAG Enabled)
 * - Retrives resume context based on user query
 * - Generates interview response using Groq
 */
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // A. Retrieve Context (RAG)
    const context = await queryVectorDB(message);

    // B. Construct System Prompt
    const systemPrompt = `
      You are an AI Technical Recruiter named "HireFlow".
      
      Your Goal: Conduct a technical screening interview for a Software Engineering role.
      
      CONTEXT FROM CANDIDATE'S RESUME:
      "${context || "No specific resume context found. Ask general technical questions."}"
      
      INSTRUCTIONS:
      1. Use the Context above to ask specific questions about their experience.
      2. Keep your responses concise (max 2-3 sentences).
      3. Be professional but conversational.
      4. Do not reveal that you were given this context text directly.
      5. If the candidate answers correctly, move to a harder topic.
      
      USER'S LATEST MESSAGE: "${message}"
      
      Generate the next interview question or response:
    `;

    // C. Generate Response
    const aiReply = await generateResponse(systemPrompt);

    res.json({ 
      reply: aiReply,
      contextUsed: context ? "Found relevant resume info" : "No context found" 
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});