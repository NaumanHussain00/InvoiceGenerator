/**
 * API Configuration
 *
 * For Android Emulator: Use 10.0.2.2 to access host machine's localhost
 * For iOS Simulator: Use localhost
 * For Physical Device: Use your machine's IP address on the same network
 */

// Detect platform
import { Platform } from 'react-native';

// Primary API base URL - for Android emulator, use 10.0.2.2 instead of localhost
export const API_BASE_URL = Platform.select({
  android: 'http://10.140.166.122:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

// Fallback URLs to try if primary fails
export const API_FALLBACK_URLS = [
  'http://10.0.2.2:3000', // Android emulator to host
  'http://localhost:3000', // iOS simulator or web
  'http://10.140.166.122:3000', // Your machine's network IP (for physical devices)
  'https://mkqfdpqq-3000.inc1.devtunnels.ms', // Tunnel/remote (if configured - UPDATE THIS URL)
];

/**
 * Helper function to try multiple API endpoints until one succeeds
 * @param path - API endpoint path (e.g., '/customers/ledger')
 * @param options - fetch options
 * @returns Response from the first successful URL
 */
export async function fetchWithFallback(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  let lastError: Error | null = null;

  // Try primary URL first
  const primaryUrl = `${API_BASE_URL}${path}`;
  try {
    console.log(`[API] Trying primary: ${primaryUrl}`);
    const response = await fetch(primaryUrl, {
      ...options,
      timeout: 5000,
    } as any);
    if (response.ok || response.status < 500) {
      return response;
    }
  } catch (err: any) {
    lastError = err;
    console.warn(`[API] Primary URL failed: ${err.message}`);
  }

  // Try fallback URLs
  for (const baseUrl of API_FALLBACK_URLS) {
    if (baseUrl === API_BASE_URL) continue; // Skip if same as primary

    const url = `${baseUrl}${path}`;
    try {
      console.log(`[API] Trying fallback: ${url}`);
      const response = await fetch(url, {
        ...options,
        timeout: 5000,
      } as any);
      if (response.ok || response.status < 500) {
        console.log(`[API] Success with: ${url}`);
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[API] Fallback failed (${url}): ${err.message}`);
    }
  }

  // All attempts failed
  throw lastError || new Error('All API endpoints failed');
}

export default {
  API_BASE_URL,
  API_FALLBACK_URLS,
  fetchWithFallback,
};
