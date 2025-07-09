require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Flarebee Backend API!', status: 'OK' });
});

// A simple test route
app.get('/api/test', (req, res) => {
    res.json({
        service: 'flarebee-api',
        timestamp: new Date().toISOString(),
    });
});


app.listen(PORT, () => {
  console.log(`🚀 API Server is running on http://localhost:${PORT}`);
});
