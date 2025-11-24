const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

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

// 2. dummy route to test later
app.get('/api/test', (req, res) => {
    res.json({ message: "if u see this the api is working" });
});

// start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
})
