import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { Server as SocketServer } from 'socket.io';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import riderRoutes from './routes/rider.routes';
import adminRoutes from './routes/admin.routes';

// Import middlewares
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

// Initialize express app
const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.IO
export const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'PickUp API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/riders`, riderRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
// app.use(`/api/${API_VERSION}/rides`, rideRoutes);      // Phase 5
// app.use(`/api/${API_VERSION}/ratings`, ratingRoutes);  // Phase 7

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Rider joins their room
  socket.on('rider:join', (riderId: string) => {
    socket.join(`rider:${riderId}`);
    console.log(`Rider ${riderId} joined their room`);
  });

  // User joins their room
  socket.on('user:join', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Handle rider location updates
  socket.on('rider:location-update', (data: { riderId: string; latitude: number; longitude: number }) => {
    // Broadcast to all users
    socket.broadcast.emit('rider:location-changed', data);
  });

  // Handle ride status updates
  socket.on('ride:status-update', (data: { rideId: string; status: string; riderId?: string; userId?: string }) => {
    // Send to specific rider
    if (data.riderId) {
      io.to(`rider:${data.riderId}`).emit('ride:status-changed', data);
    }
    // Send to specific user
    if (data.userId) {
      io.to(`user:${data.userId}`).emit('ride:status-changed', data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/${API_VERSION}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
});

export default app;