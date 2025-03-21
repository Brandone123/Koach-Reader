import { mockFetchApi } from './mockApi';

// Configuration for API usage
const API_URL = 'http://localhost:5000'; // Replace with your API URL if needed
const USE_MOCK_API = true; // For development with Expo Go

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: HeadersInit;
  withCredentials?: boolean;
}

export async function fetchApi(
  endpoint: string,
  options: ApiOptions = {}
): Promise<any> {
  // Use mock API in development or when server is unavailable
  if (USE_MOCK_API) {
    try {
      return await mockFetchApi(endpoint, {
        method: options.method,
        body: options.body,
      });
    } catch (error) {
      console.error(`Mock API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Otherwise use the real API
  const {
    method = 'GET',
    body,
    headers = {},
    withCredentials = true,
  } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: withCredentials ? 'include' : 'omit',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'An error occurred');
    }

    // Check if response is empty
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    
    // If real API fails, try to fall back to mock API
    if (!USE_MOCK_API) {
      try {
        console.log('Falling back to mock API...');
        return await mockFetchApi(endpoint, {
          method: options.method,
          body: options.body,
        });
      } catch (mockError) {
        console.error(`Mock API fallback also failed:`, mockError);
        throw error; // Throw the original error
      }
    } else {
      throw error;
    }
  }
}