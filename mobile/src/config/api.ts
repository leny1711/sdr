// API configuration for mobile app
// ⚠️ CRITICAL: Update these URLs with your computer's IP address when on a different network
//
// HOW TO FIND YOUR IP:
// - Windows: Run 'ipconfig' in Command Prompt (look for IPv4 Address)
// - Mac/Linux: Run 'ifconfig' or 'ip addr' in Terminal
//
// EXAMPLE: If your IP is 192.168.1.105, use:
// export const API_URL = 'http://192.168.1.105:5000';
// export const SOCKET_URL = 'http://192.168.1.105:5000';
//
// ⚠️ IMPORTANT NOTES:
// - Android devices CANNOT use 'localhost' or '127.0.0.1'
// - You MUST use your computer's actual local network IP address
// - Your phone and computer MUST be on the same WiFi network
// - If backend logs show no requests, your IP is probably wrong
// - IP addresses can change when you switch networks or restart your router
//
// ALSO UPDATE: backend/.env with CORS_ORIGIN=http://YOUR_IP:5173

// Default values - REPLACE WITH YOUR ACTUAL IP ADDRESS
export const API_URL = process.env.API_URL || 'http://192.168.1.100:5000';
export const SOCKET_URL = process.env.SOCKET_URL || 'http://192.168.1.100:5000';
