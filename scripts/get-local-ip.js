#!/usr/bin/env node

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  console.log('\n🔍 Finding your local IP addresses...\n');
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`✅ ${name}: ${iface.address}`);
      }
    }
  }
  
  console.log('\n📱 Update constants/api.ts with one of these IPs:');
  console.log('   BASE_URL: \'http://YOUR_IP:YOUR_PORT\'');
  console.log('\n💡 Common scenarios:');
  console.log('   - iOS Simulator: http://localhost:PORT');
  console.log('   - Android Emulator: http://10.0.2.2:PORT');
  console.log('   - Physical Device: http://YOUR_IP:PORT (from above)\n');
}

getLocalIP();
