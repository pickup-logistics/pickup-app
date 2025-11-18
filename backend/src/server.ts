import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';

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
// app.use(`/api/${API_VERSION}/users`, userRoutes);      // Phase 4
// app.use(`/api/${API_VERSION}/riders`, riderRoutes);    // Phase 4
// app.use(`/api/${API_VERSION}/rides`, rideRoutes);      // Phase 5
// app.use(`/api/${API_VERSION}/ratings`, ratingRoutes);  // Phase 7

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle rider location updates
  socket.on('rider:location-update', (data) => {
    // Broadcast to relevant clients
    socket.broadcast.emit('rider:location-changed', data);
  });

  // Handle ride status updates
  socket.on('ride:status-update', (data) => {
    socket.broadcast.emit('ride:status-changed', data);
  });

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
});

export default app;
