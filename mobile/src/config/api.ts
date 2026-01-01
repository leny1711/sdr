// API configuration for mobile app
// For development, update these URLs with your computer's IP address
// To find your IP: Windows: ipconfig | Mac/Linux: ifconfig
// Example: http://192.168.1.100:5000

// Default values (update these or use .env file)
export const API_URL = process.env.API_URL || 'http://192.168.1.116:5000/api';
export const SOCKET_URL = process.env.SOCKET_URL || 'http://192.168.1.116:5000';

// Note: On Android physical device, you cannot use 'localhost'
// You must use your computer's local network IP address
// Both your phone and computer must be on the same WiFi network
