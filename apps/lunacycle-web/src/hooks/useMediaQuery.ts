import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect if the current viewport matches a given media query.
 * @param query The media query string (e.g., "(max-width: 768px)").
 * @returns True if the media query matches, false otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false; // Default for SSR or if window is not available
  };

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  const handleChange = useCallback(() => {
    setMatches(getMatches(query));
  }, [query]);

  useEffect(() => {
    const matchMedia = window.matchMedia(query);
    handleChange(); // Initial check
    matchMedia.addEventListener('change', handleChange);
    return () => {
      matchMedia.removeEventListener('change', handleChange);
    };
  }, [query, handleChange]);

  return matches;
}