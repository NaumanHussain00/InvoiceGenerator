import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_FALLBACK_URLS } from './api';

/**
 * Axios instance configured for React Native with proper timeout and error handling
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request interceptor - log outgoing requests
 */
apiClient.interceptors.request.use(
  config => {
    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`,
    );
    console.log('[API Request] Full URL:', `${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

/**
 * Response interceptor - log responses and format errors
 */
apiClient.interceptors.response.use(
  response => {
    console.log(
      `[API Response] ${response.config.url} - Status: ${response.status}`,
    );
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error(
        `[API Error] ${error.config?.url} - Status: ${error.response.status}`,
        error.response.data,
      );
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API Network Error] No response received:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        message: error.message,
        code: error.code,
      });
      console.error(
        '[API Network Error] Troubleshooting:',
        '\n1. Verify backend is running on port 3000',
        '\n2. For Android emulator, backend must be accessible at 10.0.2.2:3000',
        '\n3. Check Windows Firewall allows port 3000',
        '\n4. Try: adb reverse tcp:3000 tcp:3000',
      );
    } else {
      // Something else happened
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  },
);

/**
 * Test connectivity to backend server with fallback URLs
 * @returns Promise<{success: boolean, url?: string, error?: string}>
 */
export const testConnection = async (): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> => {
  // Try primary URL first
  try {
    console.log('[Connection Test] Trying primary URL:', API_BASE_URL);
    const response = await apiClient.get('/health', { timeout: 5000 });
    if (response.status === 200) {
      console.log('[Connection Test] ✅ Primary URL works:', API_BASE_URL);
      return { success: true, url: API_BASE_URL };
    }
  } catch (error: any) {
    console.warn('[Connection Test] Primary URL failed:', error.message);
  }

  // Try fallback URLs
  for (const fallbackUrl of API_FALLBACK_URLS) {
    if (fallbackUrl === API_BASE_URL) continue; // Skip if same as primary

    try {
      console.log('[Connection Test] Trying fallback:', fallbackUrl);
      const testClient = axios.create({
        baseURL: fallbackUrl,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const response = await testClient.get('/health');
      if (response.status === 200) {
        console.log('[Connection Test] ✅ Fallback URL works:', fallbackUrl);
        return { success: true, url: fallbackUrl };
      }
    } catch (error: any) {
      console.warn('[Connection Test] Fallback failed:', fallbackUrl, error.message);
    }
  }

  return {
    success: false,
    error: 'All connection attempts failed. Please check backend server and network configuration.',
  };
};

/**
 * Make an API request with automatic fallback to alternative URLs
 */
export const apiRequestWithFallback = async <T = any>(
  config: AxiosRequestConfig,
): Promise<T> => {
  // Try primary URL first
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (primaryError: any) {
    console.warn('[API] Primary request failed, trying fallbacks...');

    // Try each fallback URL
    for (const fallbackUrl of API_FALLBACK_URLS) {
      if (fallbackUrl === API_BASE_URL) continue;

      try {
        console.log('[API] Trying fallback:', fallbackUrl);
        const fallbackClient = axios.create({
          baseURL: fallbackUrl,
          timeout: config.timeout || 15000,
          headers: config.headers || {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        const response = await fallbackClient.request<T>(config);
        console.log('[API] ✅ Fallback succeeded:', fallbackUrl);
        
        // Update the primary client to use this working URL
        apiClient.defaults.baseURL = fallbackUrl;
        console.log('[API] Updated primary baseURL to:', fallbackUrl);
        
        return response.data;
      } catch (fallbackError: any) {
        console.warn('[API] Fallback failed:', fallbackUrl, fallbackError.message);
      }
    }

    // All attempts failed
    throw primaryError;
  }
};

export default apiClient;
