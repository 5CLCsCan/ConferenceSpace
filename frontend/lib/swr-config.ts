import { SWRConfiguration } from 'swr'

/**
 * Global SWR configuration for the application
 */
export const swrConfig: SWRConfiguration = {
  // Cache data for 5 minutes by default
  dedupingInterval: 300000,
  
  // Don't revalidate on window focus (prevents unnecessary API calls)
  revalidateOnFocus: false,
  
  // Revalidate on mount only if data is stale
  revalidateOnMount: true,
  
  // Don't revalidate on reconnect (can be enabled for real-time data)
  revalidateOnReconnect: false,
  
  // Retry on error (max 3 times with exponential backoff)
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Keep previous data while fetching new data (prevents flickering)
  keepPreviousData: true,
}

/**
 * Configuration for frequently changing data (e.g., notifications)
 */
export const realtimeConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 10000, // 10 seconds
  revalidateOnFocus: true,
  refreshInterval: 30000, // Auto refresh every 30 seconds
}

/**
 * Configuration for static/rarely changing data (e.g., user profile)
 */
export const staticConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 600000, // 10 minutes
  revalidateOnMount: false,
}
