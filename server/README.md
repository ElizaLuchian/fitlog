# Simple Express Server for FitLog

This is a basic server implementation for testing the FitLog app with server integration.

## Setup

```bash
npm install express cors ws body-parser
npm install --save-dev nodemon
```

## Running the Server

```bash
node server.js
# or with nodemon for auto-reload:
npx nodemon server.js
```

Server will run on `http://localhost:3000`

## API Endpoints

- `GET /api/items` - Get all clothing items
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/outfits` - Get all outfits
- `POST /api/outfits` - Create outfit
- `PUT /api/outfits/:id` - Update outfit
- `DELETE /api/outfits/:id` - Delete outfit

## WebSocket

WebSocket server runs on the same port. Connects at `ws://localhost:3000`

Real-time events broadcasted:
- `ITEM_CREATED`
- `ITEM_UPDATED`
- `ITEM_DELETED`
- `OUTFIT_CREATED`
- `OUTFIT_UPDATED`
- `OUTFIT_DELETED`

## Update App Configuration

In `non-native/src/config/api.ts`, update:

```typescript
BASE_URL: "http://10.0.2.2:3000/api",  // Android Emulator
// or
BASE_URL: "http://localhost:3000/api",  // iOS Simulator
// or
BASE_URL: "http://YOUR_COMPUTER_IP:3000/api",  // Physical device

WS_URL: "ws://10.0.2.2:3000",  // Android Emulator
// etc.
```

To find your computer's IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

## Testing

1. Start server: `node server.js`
2. Run React Native app
3. Create/update/delete items
4. Watch console for server logs
5. Test offline mode by stopping server
6. Restart server and watch sync happen

