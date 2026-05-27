# Network Troubleshooting - Request Timeout

## Your Current Issue

The app is trying to connect to: `http://192.168.1.100:3000/api/auth/login`
But it's timing out after 10 seconds, meaning your device can't reach the backend.

## Step-by-Step Fix

### Step 1: Verify Backend is Running

On your computer, check if the backend is running:

```bash
# Check if something is listening on port 3000
# macOS/Linux:
lsof -i :3000

# Windows:
netstat -ano | findstr :3000

# Or try to access it locally:
curl http://localhost:3000/api/auth/login
```

If nothing is running, start your backend server first!

### Step 2: Find Your Computer's CORRECT IP Address

The IP `192.168.1.100` might be wrong. Find your actual IP:

**macOS/Linux:**
```bash
# Get all network interfaces
ifconfig

# Or just WiFi:
ipconfig getifaddr en0

# Or:
hostname -I
```

**Windows:**
```bash
ipconfig
```

Look for:
- **WiFi adapter** - usually starts with `192.168.x.x` or `10.0.x.x`
- **NOT** `127.0.0.1` or `localhost` (won't work from mobile device)
- **NOT** `169.254.x.x` (self-assigned, means no network)

### Step 3: Test Backend from Your Computer

```bash
# Replace with your actual port
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPassword123"}'
```

If this fails, your backend isn't running or has issues.

### Step 4: Ensure Backend Listens on 0.0.0.0 (Not Just localhost)

Your backend MUST listen on `0.0.0.0` to accept connections from other devices.

**Express.js example:**
```javascript
// ❌ Wrong - only accessible from localhost
app.listen(3000, 'localhost');

// ✅ Correct - accessible from network
app.listen(3000, '0.0.0.0');
// or just:
app.listen(3000);
```

**Check your backend code** and make sure it's not binding to `localhost` or `127.0.0.1` only.

### Step 5: Test Backend from Your Mobile Device Browser

1. Open Safari/Chrome on your phone
2. Navigate to: `http://YOUR_COMPUTER_IP:3000`
3. You should see SOMETHING (even an error page is good - it means connection works)

If you get "Can't connect" or timeout, the issue is network connectivity.

### Step 6: Check Firewall

**macOS:**
```bash
# Check if firewall is blocking
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow incoming connections (if needed)
# System Preferences > Security & Privacy > Firewall > Firewall Options
# Allow your backend app
```

**Windows:**
```bash
# Check Windows Firewall
# Control Panel > Windows Defender Firewall > Allow an app
# Make sure your backend app is allowed
```

**Linux:**
```bash
# Check if port is open
sudo ufw status
sudo ufw allow 3000
```

### Step 7: Verify Same WiFi Network

- Your computer and mobile device MUST be on the same WiFi network
- Some public/corporate WiFi networks block device-to-device communication
- Try using a personal hotspot if on restricted network

### Step 8: Update constants/api.ts

Once you find your correct IP, update the file:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://YOUR_ACTUAL_IP:YOUR_ACTUAL_PORT'  // e.g., 'http://192.168.1.50:3000'
    : 'https://your-production-backend-url.com',
  TIMEOUT: 10000,
};
```

## Platform-Specific Solutions

### iOS Simulator
If using iOS Simulator (not physical device):
```typescript
BASE_URL: 'http://localhost:3000'  // This works for simulator
```

### Android Emulator
If using Android Emulator (not physical device):
```typescript
BASE_URL: 'http://10.0.2.2:3000'  // Special alias for host machine
```

### Physical Devices
MUST use your computer's actual network IP address.

## Quick Test Commands

```bash
# 1. Find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Test backend locally
curl http://localhost:3000/api/auth/login

# 3. Test backend from network IP
curl http://YOUR_IP:3000/api/auth/login

# 4. Check if port is open
nc -zv YOUR_IP 3000
```

## Common Scenarios

### Scenario 1: Backend Not Running
**Symptom:** Timeout
**Fix:** Start your backend server

### Scenario 2: Wrong IP Address
**Symptom:** Timeout
**Fix:** Use correct IP from `ifconfig`/`ipconfig`

### Scenario 3: Backend Only on localhost
**Symptom:** Works on computer, timeout from phone
**Fix:** Make backend listen on `0.0.0.0`

### Scenario 4: Firewall Blocking
**Symptom:** Timeout, backend running
**Fix:** Allow port in firewall settings

### Scenario 5: Different Networks
**Symptom:** Everything looks right but still timeout
**Fix:** Ensure both devices on same WiFi

### Scenario 6: Corporate/Public WiFi
**Symptom:** Can't connect despite correct setup
**Fix:** Use personal hotspot or different network

## Still Not Working?

Try this temporary workaround to test if it's a network issue:

1. Deploy your backend to a cloud service (Heroku, Railway, Render, etc.)
2. Update `constants/api.ts` with the public URL
3. If this works, you know it's a local network issue

## Need More Help?

Share these details:
1. Your computer's IP address (from `ifconfig`/`ipconfig`)
2. Backend port number
3. Are you using physical device or emulator?
4. Can you access `http://YOUR_IP:PORT` from phone browser?
5. Is backend running? (check with `curl localhost:PORT`)
