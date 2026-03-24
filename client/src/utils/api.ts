import { API_URL } from "../constants";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_TOKEN_KEY } from "../constants";

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
  const {
    method = 'GET',
    body,
    headers = {},
    withCredentials = true,
  } = options;

  const authToken = await (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return session.access_token;
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    }
  })();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
    throw error;
  }
}