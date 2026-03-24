export const AUTH_TOKEN_KEY = "authToken";

/**
 * Backend API base URL.
 * - Dev Android emulator: set EXPO_PUBLIC_API_URL=http://10.0.2.2:5000 in .env
 * - Dev physical device: use your machine IP (e.g. http://192.168.1.x:5000)
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8002";
