# Local Backend Setup Guide

## Problem
Mobile apps can't reach `localhost` or `127.0.0.1` because that refers to the device itself, not your computer.

## Solution

### Step 1: Find Your Computer's Local IP

Run this command:
```bash
node scripts/get-local-ip.js
```

Or manually:
- **macOS/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

Look for an IP like `192.168.x.x` or `10.0.x.x`

### Step 2: Update API Configuration

Edit `constants/api.ts` and replace the IP address:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://192.168.1.100:3000' // ← Replace with YOUR IP and port
    : 'https://your-production-backend-url.com',
  TIMEOUT: 10000,
};
```

### Step 3: Configure Your Backend

Make sure your backend server is:

1. **Listening on all interfaces** (not just localhost):
   ```javascript
   // Express example
   app.listen(3000, '0.0.0.0', () => {
     console.log('Server running on port 3000');
   });
   ```

2. **CORS enabled** for your mobile app:
   ```javascript
   // Express example
   const cors = require('cors');
   app.use(cors({
     origin: '*', // For development only
     credentials: true
   }));
   ```

3. **Firewall allows connections** on your port (3000, 8000, etc.)

### Step 4: Test Connection

1. Start your backend server
2. Reload your React Native app
3. Try to login

## Device-Specific URLs

### iOS Simulator
```typescript
BASE_URL: 'http://localhost:3000'
// or
BASE_URL: 'http://127.0.0.1:3000'
```

### Android Emulator
```typescript
BASE_URL: 'http://10.0.2.2:3000'
```
Note: `10.0.2.2` is a special alias to your host machine's localhost

### Physical Device (iPhone/Android)
```typescript
BASE_URL: 'http://192.168.1.100:3000' // Your computer's IP
```

**Important**: Your phone and computer must be on the same WiFi network!

## Troubleshooting

### "Network Error" or "Request Failed"

1. **Check if backend is running**:
   ```bash
   curl http://YOUR_IP:PORT/api/auth/login
   ```

2. **Verify devices are on same network**:
   - Computer and phone must use same WiFi
   - Some public WiFi networks block device-to-device communication

3. **Check firewall**:
   - macOS: System Preferences → Security & Privacy → Firewall
   - Windows: Windows Defender Firewall → Allow an app
   - Linux: `sudo ufw allow 3000` (or your port)

4. **Test from browser on phone**:
   - Open Safari/Chrome on your phone
   - Navigate to `http://YOUR_IP:PORT`
   - Should see your backend response

### Backend Not Accessible

If your backend is running but not accessible:

```javascript
// Make sure your server binds to 0.0.0.0, not localhost
// ❌ Wrong
app.listen(3000, 'localhost');

// ✅ Correct
app.listen(3000, '0.0.0.0');
```

### CORS Errors

Add CORS middleware to your backend:

```bash
npm install cors
```

```javascript
const cors = require('cors');
app.use(cors());
```

## Quick Test

1. Find your IP: `node scripts/get-local-ip.js`
2. Update `constants/api.ts` with your IP
3. Start backend: Make sure it listens on `0.0.0.0`
4. Test in browser on phone: `http://YOUR_IP:PORT`
5. Reload React Native app

## Example Configuration

If your computer's IP is `192.168.1.50` and backend runs on port `8000`:

```typescript
// constants/api.ts
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://192.168.1.50:8000'
    : 'https://api.production.com',
  TIMEOUT: 10000,
};
```

## Using ngrok (Alternative)

If you can't get local IP working, use ngrok to expose your backend:

```bash
# Install ngrok
npm install -g ngrok

# Expose your backend
ngrok http 3000

# Use the ngrok URL in your app
# BASE_URL: 'https://abc123.ngrok.io'
```

This creates a public URL that tunnels to your localhost.
