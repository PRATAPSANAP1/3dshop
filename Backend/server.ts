import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import logger, { morganStream } from './config/logger';
import { responseTimeTracker } from './middleware/audit';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import rackRoutes from './routes/racks';
import doorRoutes from './routes/doors';
import shopConfigRoutes from './routes/shopConfig';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import smartStoreRoutes from './routes/smartstore';
import billingRoutes from './routes/billing';
import orderRoutes from './routes/orders';
import publicRoutes from './routes/public';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import auditLogRoutes from './routes/auditLogs';
import couponRoutes from './routes/coupons';
import shopRoutes from './routes/shops';

import { apiLimiter } from './middleware/security';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://3dshop-tawny.vercel.app',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
app.use(hpp());              // Prevent HTTP parameter pollution
app.use('/api', apiLimiter); // Rate limiting

app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));
app.use(responseTimeTracker); // Logs slow API calls (>1s)

const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    logger.debug(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/racks', rackRoutes);
app.use('/api/doors', doorRoutes);
app.use('/api/shop-config', shopConfigRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/smartstore', smartStoreRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/shops', shopRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.2.0'
  });
});

app.get('/heartbeat', (req, res) => {
  console.log('💓 Heartbeat verified at', new Date().toLocaleString());
  res.send('Server is alive and pumping! 👍');
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Backend is operational!",
    service: "3Dshop-API",
    status: "Healthy"
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled Error: ${err.message}`, { 
    stack: err.stack, 
    url: req.originalUrl, 
    method: req.method 
  });
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', { reason: reason?.message || reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  process.exit(1);
});

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
