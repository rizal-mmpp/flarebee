
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { pool } from './db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Flarebee Backend API!', status: 'OK' });
});

// Use API routes
app.use('/api', apiRoutes);

// Test Database Connection
app.get('/db-test', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({
            message: 'Database connection successful!',
            timestamp: result.rows[0].now,
        });
    } catch (err) {
        console.error('Database connection error', err);
        res.status(500).json({
            message: 'Database connection failed!',
            error: (err as Error).message,
        });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server is running on http://localhost:${PORT}`);
});
