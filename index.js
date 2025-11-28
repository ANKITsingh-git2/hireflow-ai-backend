import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { generateResponse } from './services/ai.js';
import { addResumeToVectorDB, queryVectorDB } from './services/rag.js';
import { extractTextFromPDF } from './services/pdf.js';

dotenv.config(); // load env variable

const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({storage:multer.memoryStorage()})

// middleware
app.use(cors()); // allow frontend access
app.use(express.json());  // parse json bodies

//1. basic health check route , render checks to see if server is alive
app.get('/', (req, res) => {
    res.send({
        status: 'Active',
        message: 'HireFlow AI Backend is running',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: "message is required" });
    }
    try {
        const aiReply = await generateResponse(message);
        res.json({
            reply: aiReply,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "AI generation failed" });
    }
});

app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    const { file } = req;
    const { candidateId } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📄 Received file: ${file.originalname}`);

    // 1. Convert PDF Buffer to Text
    const text = await extractTextFromPDF(file.buffer);
    console.log(`📝 Extracted ${text.length} characters`);

    // 2. Save to Pinecone Memory
    // Use the filename as candidateId if none provided
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

// test : feeding brain
app.post('/api/test-memory-add', async (req, res) => {
    const { text, candidateId } = req.body;
    await addResumeToVectorDB(text, candidateId);
  res.json({ success: true, message: "I have memorized this!" });
})

// test : ask the brain
app.post('/api/test-memory-query', async (req, res) => {
  const { question } = req.body;
  const context = await queryVectorDB(question);
  res.json({ contextFound: context });
});

// start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
})