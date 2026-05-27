#!/bin/bash

# Network Troubleshooting Script for React Native Backend Connection

echo "🔍 Network Troubleshooting for React Native App"
echo "================================================"
echo ""

# Get the port from user or use default
PORT=${1:-3000}

echo "📋 Checking backend on port: $PORT"
echo ""

# 1. Find IP addresses
echo "1️⃣  Your Computer's IP Addresses:"
echo "-----------------------------------"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "WiFi IP (en0):"
    ipconfig getifaddr en0 2>/dev/null || echo "  Not connected to WiFi"
    echo ""
    echo "Ethernet IP (en1):"
    ipconfig getifaddr en1 2>/dev/null || echo "  Not connected to Ethernet"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    hostname -I | awk '{print "  " $1}'
else
    # Windows (Git Bash)
    ipconfig | grep "IPv4" | head -1
fi
echo ""

# 2. Check if backend is running
echo "2️⃣  Checking if Backend is Running:"
echo "-----------------------------------"
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "✅ Something is listening on port $PORT"
    lsof -i :$PORT
else
    echo "❌ Nothing is listening on port $PORT"
    echo "   👉 Start your backend server first!"
fi
echo ""

# 3. Test localhost connection
echo "3️⃣  Testing Backend on localhost:"
echo "-----------------------------------"
if command -v curl &> /dev/null; then
    echo "Testing: http://localhost:$PORT"
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:$PORT 2>/dev/null | grep -q "200\|404\|401"; then
        echo "✅ Backend is accessible on localhost"
    else
        echo "❌ Cannot reach backend on localhost"
        echo "   👉 Make sure your backend is running"
    fi
else
    echo "⚠️  curl not found, skipping test"
fi
echo ""

# 4. Get the actual IP to use
echo "4️⃣  Recommended Configuration:"
echo "-----------------------------------"
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1 2>/dev/null)
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
fi

if [ -n "$IP" ]; then
    echo "Update constants/api.ts with:"
    echo ""
    echo "  BASE_URL: 'http://$IP:$PORT'"
    echo ""
    echo "Then test from your phone's browser:"
    echo "  http://$IP:$PORT"
else
    echo "❌ Could not determine IP address"
    echo "   Run 'ifconfig' (macOS/Linux) or 'ipconfig' (Windows)"
fi
echo ""

# 5. Firewall check
echo "5️⃣  Firewall Status:"
echo "-----------------------------------"
if [[ "$OSTYPE" == "darwin"* ]]; then
    if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled"; then
        echo "⚠️  Firewall is enabled"
        echo "   If connection fails, allow your backend app in:"
        echo "   System Preferences > Security & Privacy > Firewall"
    else
        echo "✅ Firewall is disabled"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v ufw &> /dev/null; then
        sudo ufw status | head -3
    else
        echo "ℹ️  UFW not installed"
    fi
fi
echo ""

echo "📱 Next Steps:"
echo "-----------------------------------"
echo "1. Make sure backend listens on 0.0.0.0 (not just localhost)"
echo "2. Update constants/api.ts with the IP shown above"
echo "3. Ensure phone and computer are on same WiFi"
echo "4. Test http://YOUR_IP:$PORT in phone's browser"
echo "5. Restart your app after updating the IP"
echo ""
