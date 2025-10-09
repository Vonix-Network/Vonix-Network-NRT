import api from '../services/api';

/**
 * Generic API error handler
 */
export interface ApiError {
  message: string;
  status?: number;
  details?: string[];
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data?.error || 'An error occurred',
      status: error.response.status,
      details: error.response.data?.details
    };
  } else if (error.request) {
    return {
      message: 'Network error - please check your connection',
      status: 0
    };
  } else {
    return {
      message: error.message || 'Unknown error occurred',
      status: -1
    };
  }
};

/**
 * Generic paginated API fetcher
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const fetchPaginated = async <T>(
  endpoint: string,
  page: number = 1,
  limit: number = 20,
  params: Record<string, any> = {}
): Promise<PaginatedResponse<T>> => {
  try {
    const response = await api.get(endpoint, {
      params: {
        page,
        limit,
        offset: (page - 1) * limit,
        ...params
      }
    });

    const data = Array.isArray(response.data) ? response.data : response.data.data || [];
    
    return {
      data,
      total: response.data.total || data.length,
      page,
      limit,
      hasMore: data.length === limit
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Cached API requests with TTL
 */
class ApiCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const apiCache = new ApiCache();

/**
 * Cached API fetcher
 */
export const fetchCached = async <T>(
  endpoint: string,
  params: Record<string, any> = {},
  ttl?: number
): Promise<T> => {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  
  // Try cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await api.get(endpoint, { params });
    const data = response.data;
    
    // Cache the result
    apiCache.set(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Optimistic update helper
 */
export const optimisticUpdate = <T>(
  currentData: T[],
  id: number | string,
  updates: Partial<T>,
  idField: keyof T = 'id' as keyof T
): T[] => {
  return currentData.map(item => 
    item[idField] === id ? { ...item, ...updates } : item
  );
};

/**
 * Debounced API call helper
 */
export const createDebouncedApiCall = <T extends any[], R>(
  apiCall: (...args: T) => Promise<R>,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await apiCall(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

/**
 * Retry logic for failed API calls
 */
export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw handleApiError(error);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw handleApiError(lastError);
};
