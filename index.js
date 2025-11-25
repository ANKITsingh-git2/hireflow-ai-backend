import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateResponse } from './services/ai.js';

dotenv.config(); // load env variable

const app = express();
const PORT = process.env.PORT || 5000;

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

// start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
})