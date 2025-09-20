# Jupiter Service Setup Guide

This guide will help you set up the Jupiter service with Firebase Realtime Database for real-time token updates.

## 🚀 **Overview**

The Jupiter service fetches fresh token data from Jupiter API every 4 seconds, stores it in Firebase Realtime Database, and streams updates to frontend clients via WebSocket.

## 📋 **Prerequisites**

1. **Firebase Project** - Create a new Firebase project
2. **Firebase Realtime Database** - Enable Realtime Database
3. **Service Account** - Generate service account credentials
4. **Node.js** - Version 18 or higher

## 🔧 **Setup Steps**

### **1. Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "illusio-jupiter")
4. Enable Google Analytics (optional)
5. Click "Create project"

### **2. Enable Realtime Database**

1. In your Firebase project, go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your server)
5. Click "Done"

### **3. Generate Service Account**

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Keep this file secure - it contains your private key

### **4. Configure Environment Variables**

Add these variables to your `server/.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=illusio-317d3
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@illusio-317d3.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://illusio-317d3-default-rtdb.firebaseio.com/
```

**Important Notes:**
- Use the project ID: `illusio-317d3`
- The private key should include the `\n` characters for line breaks
- Use the client email: `firebase-adminsdk-fbsvc@illusio-317d3.iam.gserviceaccount.com`

### **5. Install Dependencies**

```bash
cd server
npm install
```

### **6. Start the Services**

```bash
npm run dev
```

The server will start:
- **HTTP Server**: Port 8080
- **Jupiter WebSocket**: Port 8081
- **Jupiter Service**: Fetches data every 4 seconds

## 🔍 **Verification**

### **Check Health Status**

Visit: `http://localhost:8080/health`

You should see:
```json
{
  "status": "healthy",
  "services": {
    "jupiterService": "running",
    "jupiterWebSocket": "running"
  }
}
```

### **Check Firebase Data**

1. Go to Firebase Console → Realtime Database
2. You should see data under `jupiter_tokens/recent`
3. Data updates every 4 seconds

### **Test WebSocket Connection**

```javascript
const ws = new WebSocket('ws://localhost:8081/jupiter-tokens');
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## 📊 **Data Structure**

### **Firebase Schema**

```json
{
  "jupiter_tokens": {
    "recent": {
      "timestamp": "2024-01-15T10:30:00Z",
      "total_count": 150,
      "filtered_count": 25,
      "tokens": {
        "token_id_1": {
          "id": "token_id_1",
          "name": "Token Name",
          "symbol": "SYMBOL",
          "imageUrl": "https://...",
          "marketCap": 1000000,
          "price": 0.001,
          "volume24h": 50000,
          "liquidity": 250000,
          "createdAt": "2024-01-15T10:25:00Z",
          "tokenProgram": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "filterReason": "token_program",
          "lastUpdated": "2024-01-15T10:30:00Z"
        }
      }
    },
    "metadata": {
      "last_fetch": "2024-01-15T10:30:00Z",
      "fetch_count": 1250,
      "error_count": 3,
      "status": "active"
    }
  }
}
```

## 🛠️ **Configuration**

### **Jupiter Service Settings**

Edit `server/src/services/jupiterService.ts`:

```typescript
const FETCH_INTERVAL = 4000; // 4 seconds
const TARGET_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
```

### **WebSocket Settings**

Edit `server/src/services/jupiterWebSocketService.ts`:

```typescript
const WS_URL = 'ws://localhost:8081/jupiter-tokens'; // Development
const WS_URL = 'wss://your-domain.com/jupiter-tokens'; // Production
```

## 🔒 **Security**

### **Firebase Security Rules**

For production, update your Firebase security rules:

```json
{
  "rules": {
    "jupiter_tokens": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### **CORS Configuration**

Update `server/src/app.ts` to include your frontend domain:

```typescript
const allowedOrigins = [
  'https://your-frontend-domain.com',
  'http://localhost:3000'
];
```

## 📈 **Monitoring**

### **Health Check Endpoints**

- **HTTP Health**: `GET /health`
- **WebSocket Status**: Check connection status in frontend

### **Logs**

Check server logs for:
- Jupiter API fetch status
- Firebase write operations
- WebSocket connections
- Error messages

### **Firebase Console**

Monitor:
- Database usage
- Read/write operations
- Storage usage

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Firebase Connection Failed**
   - Check environment variables
   - Verify service account permissions
   - Check Firebase project ID

2. **WebSocket Connection Failed**
   - Check if port 8081 is available
   - Verify CORS settings
   - Check firewall rules

3. **No Token Data**
   - Check Jupiter API status
   - Verify network connectivity
   - Check service logs

### **Debug Commands**

```bash
# Check service status
curl http://localhost:8080/health

# Test WebSocket
wscat -c ws://localhost:8081/jupiter-tokens

# Check logs
tail -f server/logs/combined.log
```

## 🔄 **Updates**

The system automatically:
- Fetches new tokens every 4 seconds
- Filters tokens by program or "bonk" ending
- Updates Firebase in real-time
- Streams updates to connected clients
- Handles errors and reconnections

## 📞 **Support**

If you encounter issues:
1. Check the logs
2. Verify configuration
3. Test individual components
4. Check Firebase Console for data

---

**🎉 You're all set!** The Jupiter service is now running and providing real-time token updates to your frontend.
