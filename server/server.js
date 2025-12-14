const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

// Broadcast function for WebSocket
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log('Broadcasted:', data.type);
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ CLOTHING ITEMS ENDPOINTS ============

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clothing_items ORDER BY created_at DESC'
    );
    console.log(`GET /api/items - Returning ${result.rows.length} items`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items', details: error.message });
  }
});

// GET single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM clothing_items WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    console.log(`GET /api/items/${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item', details: error.message });
  }
});

// POST create item
app.post('/api/items', async (req, res) => {
  try {
    const { name, category, color, brand, size, material, notes, photo } = req.body;
    
    const result = await pool.query(
      `INSERT INTO clothing_items (name, category, color, brand, size, material, notes, photo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, color, brand, size, material, notes, photo]
    );
    
    const item = result.rows[0];
    console.log(`POST /api/items - Created item with ID ${item.id}`);
    
    // Broadcast to all connected clients
    broadcast({
      type: 'ITEM_CREATED',
      item
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item', details: error.message });
  }
});

// PUT update item
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, color, brand, size, material, notes, photo } = req.body;
    
    const result = await pool.query(
      `UPDATE clothing_items 
       SET name = $1, category = $2, color = $3, brand = $4, 
           size = $5, material = $6, notes = $7, photo = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, category, color, brand, size, material, notes, photo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const item = result.rows[0];
    console.log(`PUT /api/items/${id} - Updated item`);
    
    // Broadcast to all connected clients
    broadcast({
      type: 'ITEM_UPDATED',
      item
    });
    
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item', details: error.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Delete from outfit_items (junction table) - cascading delete
    const outfitsResult = await client.query(
      'SELECT DISTINCT outfit_id FROM outfit_items WHERE item_id = $1',
      [id]
    );
    
    // Delete the item (cascade will handle outfit_items)
    const result = await client.query(
      'DELETE FROM clothing_items WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }
    
    await client.query('COMMIT');
    
    console.log(`DELETE /api/items/${id} - Deleted item`);
    
    // Broadcast item deletion
    broadcast({
      type: 'ITEM_DELETED',
      itemId: parseInt(id)
    });
    
    // Broadcast outfit deletions if any outfits became empty
    for (const row of outfitsResult.rows) {
      const checkOutfit = await pool.query(
        'SELECT COUNT(*) as count FROM outfit_items WHERE outfit_id = $1',
        [row.outfit_id]
      );
      
      if (checkOutfit.rows[0].count === '0') {
        await pool.query('DELETE FROM outfits WHERE outfit_id = $1', [row.outfit_id]);
        broadcast({
          type: 'OUTFIT_DELETED',
          outfitId: row.outfit_id
        });
      }
    }
    
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
  } finally {
    client.release();
  }
});

// ============ OUTFITS ENDPOINTS ============

function toOutfitDto(row) {
  if (!row) return row;

  return {
    outfitId: row.outfit_id,
    occasion: row.occasion,
    aestheticStyleType: row.aesthetic_style_type,
    photo: row.photo,
    notes: row.notes,
    dateWorn: row.date_worn,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: row.items ?? []
  };
}


// GET all outfits (with items array)
app.get('/api/outfits', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        COALESCE(
          json_agg(oi.item_id) FILTER (WHERE oi.item_id IS NOT NULL),
          '[]'
        ) as items
      FROM outfits o
      LEFT JOIN outfit_items oi ON o.outfit_id = oi.outfit_id
      GROUP BY o.outfit_id
      ORDER BY o.created_at DESC
    `);
    
    console.log(`GET /api/outfits - Returning ${result.rows.length} outfits`);
    res.json(result.rows.map(toOutfitDto));
  } catch (error) {
    console.error('Error fetching outfits:', error);
    res.status(500).json({ error: 'Failed to fetch outfits', details: error.message });
  }
});

// GET single outfit
app.get('/api/outfits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        o.*,
        COALESCE(
          json_agg(oi.item_id) FILTER (WHERE oi.item_id IS NOT NULL),
          '[]'
        ) as items
      FROM outfits o
      LEFT JOIN outfit_items oi ON o.outfit_id = oi.outfit_id
      WHERE o.outfit_id = $1
      GROUP BY o.outfit_id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    console.log(`GET /api/outfits/${id}`);
    res.json(toOutfitDto(result.rows[0]));
  } catch (error) {
    console.error('Error fetching outfit:', error);
    res.status(500).json({ error: 'Failed to fetch outfit', details: error.message });
  }
});

// POST create outfit
app.post('/api/outfits', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { occasion, aestheticStyleType, photo, notes, dateWorn, items } = req.body;
    
    await client.query('BEGIN');
    
    // Insert outfit
    const outfitResult = await client.query(
      `INSERT INTO outfits (occasion, aesthetic_style_type, photo, notes, date_worn)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [occasion, aestheticStyleType, photo, notes, dateWorn]
    );
    
    const outfit = outfitResult.rows[0];
    
    // Insert outfit items (junction table)
    if (items && items.length > 0) {
      for (const itemId of items) {
        await client.query(
          'INSERT INTO outfit_items (outfit_id, item_id) VALUES ($1, $2)',
          [outfit.outfit_id, itemId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Add items array to response
    outfit.items = items || [];
    
    console.log(`POST /api/outfits - Created outfit with ID ${outfit.outfit_id}`);
    
    // Broadcast to all connected clients
    broadcast({
      type: 'OUTFIT_CREATED',
      outfit: toOutfitDto(outfit)
    });
    
    res.status(201).json(outfit);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating outfit:', error);
    res.status(500).json({ error: 'Failed to create outfit', details: error.message });
  } finally {
    client.release();
  }
});

// PUT update outfit
app.put('/api/outfits/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { occasion, aestheticStyleType, photo, notes, dateWorn, items } = req.body;
    
    await client.query('BEGIN');
    
    // Update outfit
    const result = await client.query(
      `UPDATE outfits 
       SET occasion = $1, aesthetic_style_type = $2, photo = $3, notes = $4, 
           date_worn = $5, updated_at = CURRENT_TIMESTAMP
       WHERE outfit_id = $6
       RETURNING *`,
      [occasion, aestheticStyleType, photo, notes, dateWorn, id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    const outfit = result.rows[0];
    
    // Update outfit items if provided
    if (items) {
      // Delete existing items
      await client.query('DELETE FROM outfit_items WHERE outfit_id = $1', [id]);
      
      // Insert new items
      for (const itemId of items) {
        await client.query(
          'INSERT INTO outfit_items (outfit_id, item_id) VALUES ($1, $2)',
          [id, itemId]
        );
      }
      
      outfit.items = items;
    }
    
    await client.query('COMMIT');
    
    console.log(`PUT /api/outfits/${id} - Updated outfit`);
    
    // Broadcast to all connected clients
    broadcast({
      type: 'OUTFIT_UPDATED',
      outfit: toOutfitDto(outfit)
    });
    
    res.json(outfit);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating outfit:', error);
    res.status(500).json({ error: 'Failed to update outfit', details: error.message });
  } finally {
    client.release();
  }
});

// DELETE outfit
app.delete('/api/outfits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cascade delete will handle outfit_items
    const result = await pool.query(
      'DELETE FROM outfits WHERE outfit_id = $1 RETURNING outfit_id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    console.log(`DELETE /api/outfits/${id} - Deleted outfit`);
    
    // Broadcast to all connected clients
    broadcast({
      type: 'OUTFIT_DELETED',
      outfitId: parseInt(id)
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting outfit:', error);
    res.status(500).json({ error: 'Failed to delete outfit', details: error.message });
  }
});

// ============ UTILITY ENDPOINTS ============

// Clear all data (for testing)
app.post('/api/clear', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE outfit_items, outfits, clothing_items RESTART IDENTITY CASCADE');
    console.log('CLEARED all data');
    res.json({ message: 'All data cleared' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data', details: error.message });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const itemsCount = await pool.query('SELECT COUNT(*) FROM clothing_items');
    const outfitsCount = await pool.query('SELECT COUNT(*) FROM outfits');
    
    res.json({
      itemsCount: parseInt(itemsCount.rows[0].count),
      outfitsCount: parseInt(outfitsCount.rows[0].count),
      connectedClients: wss.clients.size
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   FitLog Server Running                ║
║                                        ║
║   HTTP: http://localhost:${PORT}       ║
║   WebSocket: ws://localhost:${PORT}    ║
║   Database: PostgreSQL                 ║
║                                        ║
║   Press Ctrl+C to stop                 ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    pool.end(() => {
      console.log('Server and database connections closed');
      process.exit(0);
    });
  });
});

