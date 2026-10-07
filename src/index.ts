import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'CampusCore is running', timestamp: new Date().toISOString() });
});

app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const start = async () => {
  await connectDB();
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`CampusCore server running on port ${PORT}`);
  });
};

start();

export default app;