# Deploying FitLog Server to Render with PostgreSQL

## Step 1: Update Server for PostgreSQL

Install PostgreSQL client:

```bash
cd server
npm install pg
npm install --save-dev @types/pg
```

## Step 2: Create Database Schema

Create `server/schema.sql`:

```sql
-- Clothing Items Table
CREATE TABLE IF NOT EXISTS clothing_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    color VARCHAR(100),
    brand VARCHAR(100),
    size VARCHAR(20),
    material VARCHAR(100),
    notes TEXT,
    photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outfits Table
CREATE TABLE IF NOT EXISTS outfits (
    outfit_id SERIAL PRIMARY KEY,
    occasion VARCHAR(255),
    aesthetic_style_type VARCHAR(100),
    notes TEXT,
    date_worn DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outfit Items Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS outfit_items (
    outfit_id INTEGER REFERENCES outfits(outfit_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES clothing_items(id) ON DELETE CASCADE,
    PRIMARY KEY (outfit_id, item_id)
);

-- Indexes for performance
CREATE INDEX idx_items_category ON clothing_items(category);
CREATE INDEX idx_items_created ON clothing_items(created_at DESC);
CREATE INDEX idx_outfits_date ON outfits(date_worn DESC);
CREATE INDEX idx_outfits_created ON outfits(created_at DESC);
```

## Step 3: Update server.js for PostgreSQL

See `server-postgres.js` for the updated implementation.

## Step 4: Deploy to Render

### A. Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click "New" → "PostgreSQL"
3. Configure:
   - Name: `fitlog-db`
   - Database: `fitlog`
   - User: `fitlog`
   - Region: Choose closest to you
   - Plan: Free (or paid for production)
4. Click "Create Database"
5. **Copy the "Internal Database URL"** (looks like: `postgresql://user:pass@host/dbname`)

### B. Deploy Web Service

1. Push your code to GitHub
2. Go to Render Dashboard
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: `fitlog-api`
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node server-postgres.js`
   - Plan: Free (or paid)
6. Add Environment Variables:
   - `DATABASE_URL` = (paste Internal Database URL from Step A)
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render default)
7. Click "Create Web Service"

### C. Initialize Database Schema

After deployment:

1. Go to your database in Render
2. Click "Connect" → "External Connection"
3. Use psql or any PostgreSQL client:

```bash
psql "postgresql://user:pass@host/dbname" < schema.sql
```

Or use Render's web shell:
- Go to database → "Shell"
- Paste schema.sql contents

## Step 5: Update React Native App

Update `non-native/src/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? "http://10.0.2.2:3000/api"  // Local development
    : "https://fitlog-api.onrender.com/api",  // Your Render URL
  
  WS_URL: __DEV__
    ? "ws://10.0.2.2:3000"
    : "wss://fitlog-api.onrender.com",  // WSS for production
  // ... rest of config
};
```

## Step 6: Test Deployment

1. **Test API:**
```bash
curl https://fitlog-api.onrender.com/health
# Should return: {"status":"ok"}
```

2. **Test from app:**
- Build release app or update config
- Create/update/delete items
- Check Render logs for database queries

## Step 7: Monitor

Render provides:
- Automatic HTTPS/WSS
- Auto-deploy on git push
- Logs and metrics
- Environment variables
- Free tier available

## Database Connection Pooling

For production, add connection pooling in `server-postgres.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Render Free Tier Limits

- Database: 1 GB storage, 90 days retention
- Web Service: 750 hours/month, spins down after 15 min inactivity
- First request after sleep takes ~30 seconds (cold start)

For production, consider paid tier for:
- No spin down
- More resources
- Better performance
- Automatic backups

## Alternative: Railway, Heroku, AWS

The same code works on:
- Railway.app (similar to Render)
- Heroku (add PostgreSQL addon)
- AWS RDS + Elastic Beanstalk
- Digital Ocean App Platform

Just update DATABASE_URL environment variable!

