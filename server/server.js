const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// In-memory storage (replace with real database in production)
let items = [];
let outfits = [];
let nextItemId = 1;
let nextOutfitId = 1;

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
app.get('/api/items', (req, res) => {
  console.log(`GET /api/items - Returning ${items.length} items`);
  res.json(items);
});

// GET single item
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(i => i.id === id);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  console.log(`GET /api/items/${id}`);
  res.json(item);
});

// POST create item
app.post('/api/items', (req, res) => {
  const item = {
    ...req.body,
    id: nextItemId++
  };
  
  items.unshift(item); // Add at beginning (newest first)
  console.log(`POST /api/items - Created item with ID ${item.id}`);
  
  // Broadcast to all connected clients
  broadcast({
    type: 'ITEM_CREATED',
    item
  });
  
  res.status(201).json(item);
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = items.findIndex(i => i.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  // Update item (reuse, don't delete and recreate)
  items[index] = {
    ...items[index],
    ...req.body,
    id // Keep same ID
  };
  
  console.log(`PUT /api/items/${id} - Updated item`);
  
  // Broadcast to all connected clients
  broadcast({
    type: 'ITEM_UPDATED',
    item: items[index]
  });
  
  res.json(items[index]);
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = items.findIndex(i => i.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  items.splice(index, 1);
  console.log(`DELETE /api/items/${id} - Deleted item`);
  
  // Also delete outfits containing this item (cascading delete)
  const outfitsToDelete = outfits.filter(o => 
    o.items && o.items.includes(id)
  );
  
  outfitsToDelete.forEach(outfit => {
    const outfitIndex = outfits.findIndex(o => o.outfitId === outfit.outfitId);
    if (outfitIndex !== -1) {
      outfits.splice(outfitIndex, 1);
      console.log(`  CASCADE DELETE outfit ${outfit.outfitId}`);
      
      broadcast({
        type: 'OUTFIT_DELETED',
        outfitId: outfit.outfitId
      });
    }
  });
  
  // Broadcast to all connected clients
  broadcast({
    type: 'ITEM_DELETED',
    itemId: id
  });
  
  res.status(204).send();
});

// ============ OUTFITS ENDPOINTS ============

// GET all outfits
app.get('/api/outfits', (req, res) => {
  console.log(`GET /api/outfits - Returning ${outfits.length} outfits`);
  res.json(outfits);
});

// GET single outfit
app.get('/api/outfits/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const outfit = outfits.find(o => o.outfitId === id);
  
  if (!outfit) {
    return res.status(404).json({ error: 'Outfit not found' });
  }
  
  console.log(`GET /api/outfits/${id}`);
  res.json(outfit);
});

// POST create outfit
app.post('/api/outfits', (req, res) => {
  const outfit = {
    ...req.body,
    outfitId: nextOutfitId++
  };
  
  outfits.unshift(outfit);
  console.log(`POST /api/outfits - Created outfit with ID ${outfit.outfitId}`);
  
  // Broadcast to all connected clients
  broadcast({
    type: 'OUTFIT_CREATED',
    outfit
  });
  
  res.status(201).json(outfit);
});

// PUT update outfit
app.put('/api/outfits/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = outfits.findIndex(o => o.outfitId === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Outfit not found' });
  }
  
  // Update outfit (reuse, don't delete and recreate)
  outfits[index] = {
    ...outfits[index],
    ...req.body,
    outfitId: id // Keep same ID
  };
  
  console.log(`PUT /api/outfits/${id} - Updated outfit`);
  
  // Broadcast to all connected clients
  broadcast({
    type: 'OUTFIT_UPDATED',
    outfit: outfits[index]
  });
  
  res.json(outfits[index]);
});

// DELETE outfit
app.delete('/api/outfits/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = outfits.findIndex(o => o.outfitId === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Outfit not found' });
  }
  
  outfits.splice(index, 1);
  console.log(`DELETE /api/outfits/${id} - Deleted outfit`);
  
  // Broadcast to all connected clients
  broadcast({
    type: 'OUTFIT_DELETED',
    outfitId: id
  });
  
  res.status(204).send();
});

// ============ UTILITY ENDPOINTS ============

// Clear all data (for testing)
app.post('/api/clear', (req, res) => {
  items = [];
  outfits = [];
  nextItemId = 1;
  nextOutfitId = 1;
  console.log('CLEARED all data');
  res.json({ message: 'All data cleared' });
});

// Get stats
app.get('/api/stats', (req, res) => {
  res.json({
    itemsCount: items.length,
    outfitsCount: outfits.length,
    connectedClients: wss.clients.size
  });
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
║                                        ║
║   Press Ctrl+C to stop                 ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

