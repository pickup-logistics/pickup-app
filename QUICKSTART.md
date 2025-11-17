# PickUp - Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### Step 1: Install Dependencies

```bash
npm run install:all
```

### Step 2: Configure Environment

**Backend (.env):**
```bash
cd backend
cp .env.example .env
nano .env  # Edit with your credentials
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
nano .env  # Add your Google Maps API key
```

### Step 3: Set Up Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Step 4: Start Development

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

### Verify Installation

- Frontend: http://localhost:3000
- Backend Health: http://localhost:5000/health

## 🔧 Required Services

### PostgreSQL Setup

```bash
# Ubuntu/Debian
sudo apt install postgresql

# macOS
brew install postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE pickup_db;
```

### Redis Setup

```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis
```

### Google Maps API

1. Go to Google Cloud Console
2. Enable: Maps JavaScript API, Geocoding API, Distance Matrix API
3. Create API key
4. Add to .env files

## 🆘 Common Issues

**Port already in use:** Change PORT in backend/.env

**Database connection:** Check DATABASE_URL and PostgreSQL status

**Prisma errors:** Run `npm run prisma:generate` in backend

## 📚 Next Steps

1. Review README.md for full documentation
2. Check database schema (Phase 2)
3. Start building authentication

---

Happy coding! 🚀
