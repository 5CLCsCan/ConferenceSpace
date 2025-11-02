import { useEffect, useState } from 'react'

/**
 * Debounce hook to delay the execution of a value change
 * Useful for search inputs to avoid excessive API calls
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This will only run 500ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: cancel timeout if value changes before delay expires
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
