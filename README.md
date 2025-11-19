# PickUp - Multi-Modal Transportation Platform

A full-stack transportation platform supporting bikes, tricycles, buses, and trucks. Built with React, TypeScript, Node.js, Express, PostgreSQL, and Redis.

## 🚀 Features

- **Multi-Vehicle Support**: Bikes, tricycles, buses, and trucks
- **Real-time Tracking**: Live location updates via WebSocket
- **Company Registration**: Businesses can register and manage fleets
- **Smart Matching**: Algorithm to pair riders with nearest available drivers
- **Payment Integration**: Cash and digital payment options
- **Rating System**: Two-way ratings for quality assurance

## 🛠️ Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL with Prisma ORM
- Redis (for location tracking)
- Socket.IO (real-time)
- JWT authentication

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Query
- Socket.IO Client
- Google Maps API

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- Google Maps API key
- SMS Gateway API key (Termii for Nigeria)

## 🚦 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

### 2. Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edit .env with your Google Maps API key
```

### 3. Set Up Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📊 Project Structure

```
pickup-app/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── prisma/
├── frontend/            # React App
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       └── utils/
└── admin-panel/         # Admin Dashboard
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-otp` - Verify OTP

### Rides
- `POST /api/v1/rides` - Create new ride
- `GET /api/v1/rides/:id` - Get ride details
- `GET /api/v1/rides/history` - Get ride history

### Riders
- `POST /api/v1/riders/register` - Register as rider
- `PATCH /api/v1/riders/availability` - Toggle availability

## 🚀 Deployment

### Backend
- Deploy to Railway, Render, or DigitalOcean
- Set up PostgreSQL and Redis
- Configure environment variables

### Frontend
- Deploy to Vercel or Netlify
- Configure environment variables
- Update API URLs

## 📝 Development Roadmap

### Phase 1: MVP (Bikes Only) ✅
- [x] Project structure setup
- [x] Database Schema
- [x] Authentication system
- [x] Ride booking
- [x] Real-time tracking
- [x] Payment (cash)
- [x] Rating system

### Phase 2: Enhanced Features
- [ ] Add Tricycle support
- [ ] Payment gateway integration
- [ ] Scheduled rides
- [ ] Promotional codes

### Phase 3: Scale
- [ ] Add Bus and Truck support
- [ ] Company/fleet management
- [ ] Mobile apps

## 📄 License

MIT License

## 👤 Author

**Ebis**
- Full-stack Engineer
- Nigeria

---

Built with ❤️ for Nigeria's transportation needs
