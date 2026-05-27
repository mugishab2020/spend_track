# Debugging Network Issues

## How to View Logs

### React Native Debugger
1. Open your app
2. Shake your device (or press Cmd+D on iOS Simulator / Cmd+M on Android Emulator)
3. Select "Debug" or "Open Debugger"
4. Open Chrome DevTools Console to see all logs

### Expo CLI
All logs appear in the terminal where you ran `npx expo start`

### Metro Bundler
Logs also appear in the Metro bundler terminal

## What the Logs Show

With the enhanced logging, you'll see:

### API Client Initialization
```
🔧 API Client initialized with BASE_URL: http://192.168.1.100:3000
```

### Login Attempts
```
🔐 Attempting login for: user@example.com

📡 API Request Starting...
  Method: POST
  URL: http://192.168.1.100:3000/api/auth/login
  Has Token: false
  Headers: {
    "Content-Type": "application/json"
  }
  Body: {"email":"user@example.com","password":"..."}
  Sending request...
```

### Successful Response
```
✅ Response received in 234 ms
  Status: 200 OK
  OK: true
  Response Data: {
    "token": "eyJ...",
    "user": { "id": "123", "email": "user@example.com" }
  }
✅ Login successful
  User: user@example.com
  Token stored securely
```

### Network Errors
```
❌ API Request Failed
  URL: http://192.168.1.100:3000/api/auth/login
  Error Type: AbortError
  Error Message: The operation was aborted
  Reason: Request timeout after 10000 ms
  💡 Tip: Check if backend is running and accessible
```

## Common Issues & Solutions

### 1. Request Timeout
**Symptom:** `Request timeout after 10000 ms`

**Causes:**
- Backend server not running
- Wrong IP address in `constants/api.ts`
- Device can't reach your computer's network

**Solutions:**
1. Verify backend is running:
   ```bash
   # Check if your backend is running on the expected port
   curl http://localhost:3000/api/auth/login
   ```

2. Find your correct IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
   Look for your WiFi/Ethernet IP (usually 192.168.x.x or 10.0.x.x)

3. Update `constants/api.ts` with correct IP:
   ```typescript
   BASE_URL: 'http://YOUR_IP_HERE:YOUR_PORT'
   ```

4. Ensure device and computer are on same WiFi network

### 2. Connection Refused
**Symptom:** `Network error - Cannot reach backend`

**Solutions:**
1. Check firewall settings - allow incoming connections on your backend port
2. Ensure backend is listening on `0.0.0.0` not just `localhost`
3. Try accessing backend from browser on your phone: `http://YOUR_IP:PORT`

### 3. Wrong URL
**Symptom:** Logs show wrong URL being called

**Solution:** Update `constants/api.ts` with correct BASE_URL

### 4. CORS Errors (Web only)
**Symptom:** CORS policy errors in console

**Solution:** Configure CORS on your backend to allow requests from your app

## Testing Backend Connectivity

### From Your Computer
```bash
# Test if backend is accessible locally
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### From Your Phone/Device
1. Open browser on your device
2. Navigate to: `http://YOUR_COMPUTER_IP:YOUR_PORT`
3. You should see your backend response (or at least not a timeout)

## Quick Checklist

- [ ] Backend server is running
- [ ] Backend is accessible from your computer (test with curl/browser)
- [ ] Correct IP address in `constants/api.ts`
- [ ] Device and computer on same WiFi network
- [ ] Firewall allows connections on backend port
- [ ] Backend listening on `0.0.0.0` not just `localhost`
- [ ] Check logs in Expo CLI terminal
- [ ] Try increasing timeout in `constants/api.ts` if network is slow

## Platform-Specific Notes

### iOS Simulator
- Can use `http://localhost:PORT` or `http://127.0.0.1:PORT`
- Should work without special configuration

### Android Emulator
- Use `http://10.0.2.2:PORT` to reach host machine's localhost
- Or use your computer's actual IP address

### Physical Devices
- MUST use your computer's local network IP address
- Both devices must be on same WiFi network
- Some corporate/public WiFi networks block device-to-device communication

## Still Having Issues?

Check the logs for:
1. The exact URL being called (should match your backend)
2. The error type (timeout vs network error vs HTTP error)
3. Response status codes (401, 404, 500, etc.)

The detailed logs will help identify exactly where the connection is failing.
