# Server Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Test Server (2 minutes)

```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Start server
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   FitLog Server Running                ║
║                                        ║
║   HTTP: http://localhost:3000          ║
║   WebSocket: ws://localhost:3000       ║
╚════════════════════════════════════════╝
```

### Step 2: Configure App (1 minute)

The app is already configured for Android Emulator. If using a different setup:

**Edit `non-native/src/config/api.ts`:**

```typescript
// For Android Emulator (default - already configured)
BASE_URL: "http://10.0.2.2:3000/api",
WS_URL: "ws://10.0.2.2:3000",

// For iOS Simulator
BASE_URL: "http://localhost:3000/api",
WS_URL: "ws://localhost:3000",

// For Physical Device (find your IP with `ipconfig` or `ifconfig`)
BASE_URL: "http://YOUR_COMPUTER_IP:3000/api",
WS_URL: "ws://YOUR_COMPUTER_IP:3000",
```

### Step 3: Run the App (2 minutes)

```bash
cd non-native

# If Metro is not running, start it:
npx expo start --clear

# The app should now connect to the server!
```

### Step 4: Test It Works ✅

#### Online Operations
1. **Create an item** in the app
2. **Check server console** - you should see: `POST /api/items - Created item with ID 1`
3. **Check app** - item appears with server ID
4. **Edit the item** - server logs `PUT /api/items/1 - Updated item`
5. **Delete the item** - server logs `DELETE /api/items/1 - Deleted item`

✅ **Online mode working!**

#### Offline Operations
1. **Stop the server** (Ctrl+C in server terminal)
2. **Create an item** in the app
3. **Check app** - item appears immediately with negative ID (e.g., -1702834567890)
4. **Check notification** - "Offline" message shown
5. **Check queued operations** - counter increases
6. **Start the server again** (`npm start`)
7. **Watch the magic** 🎩✨:
   - Queue processes automatically
   - Server receives operation
   - Item gets real server ID
   - Counter goes to 0

✅ **Offline sync working!**

#### Real-time Updates (requires 2 devices/emulators)
1. **Open app on Device A**
2. **Open app on Device B**
3. **Create item on Device A**
4. **Watch Device B** - item appears instantly! 🚀

✅ **Real-time updates working!**

## 🎯 What You Get

### User Experience
- ✅ Works offline seamlessly
- ✅ Instant UI feedback
- ✅ Automatic background sync
- ✅ Real-time collaboration
- ✅ No data loss ever

### Developer Experience
- ✅ Simple configuration
- ✅ Easy to test
- ✅ Well documented
- ✅ Production-ready architecture
- ✅ Clean code

## 📊 Monitoring

Check these values in your components:

```typescript
const { 
  items,           // Your data
  isOnline,        // Network status (true/false)
  isSyncing,       // Currently syncing (true/false)
  queuedOperations // Number of pending operations
} = useWardrobe();

// Show status to user
{!isOnline && <Text>Offline Mode</Text>}
{queuedOperations > 0 && <Text>{queuedOperations} pending</Text>}
{isSyncing && <ActivityIndicator />}
```

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Kill the process or use a different port
```

### App Won't Connect
1. **Check server is running** - visit http://localhost:3000/health in browser
2. **Check URL configuration** in `api.ts`
3. **Check firewall** - allow port 3000
4. **For physical device** - use your computer's IP, not localhost

### Operations Not Syncing
1. **Check `isOnline`** - is the app detecting network?
2. **Check `queuedOperations`** - are operations being queued?
3. **Check server logs** - are requests reaching server?
4. **Check console logs** - look for error messages

### WebSocket Not Connecting
1. **Check WebSocket URL** in `api.ts`
2. **Check server logs** - "Client connected to WebSocket"
3. **Check network** - WebSocket requires open connection
4. **Check CORS** - server has CORS enabled

## 🔄 Common Development Workflow

```bash
# Terminal 1: Run server
cd server
npm start

# Terminal 2: Run app
cd non-native
npx expo start

# Terminal 3: View logs
npx react-native log-android
# or
npx react-native log-ios

# Make changes, test offline:
# Ctrl+C in Terminal 1 (stop server)
# Make operations in app
# npm start in Terminal 1 (restart server)
# Watch sync happen automatically
```

## 📚 Next Steps

1. ✅ **Test the implementation** - Try all scenarios
2. 📖 **Read full documentation** - `SERVER_INTEGRATION.md`
3. 🔐 **Add authentication** - JWT tokens
4. 🗄️ **Add real database** - PostgreSQL/MongoDB
5. 🚀 **Deploy to production** - Heroku/AWS/etc.

## 💡 Pro Tips

### Development
- Use `npx nodemon server.js` for auto-reload
- Check `http://localhost:3000/api/stats` for server stats
- Use `POST http://localhost:3000/api/clear` to reset test data

### Testing Offline
- Android Emulator: `adb shell svc wifi disable` / `enable`
- iOS Simulator: WiFi settings
- Physical Device: Airplane mode

### Debugging
- Server logs show all operations
- App console shows queue processing
- WebSocket messages logged in both
- Use Chrome DevTools for network inspection

## 🎉 You're Done!

Your app now has:
- ✅ Server integration
- ✅ Offline support
- ✅ Real-time updates
- ✅ Automatic sync
- ✅ Production-ready architecture

Enjoy building! 🚀

