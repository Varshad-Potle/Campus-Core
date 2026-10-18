import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import adminRoutes from './routes/admin.routes';
import companyRouter from './routes/company.routes';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'CampusCore is running', timestamp: new Date().toISOString() });
});

app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const start = async () => {
  await connectDB();
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`CampusCore server running on port ${PORT}`);
  });
};

start();

export default app;