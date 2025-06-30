import { useState, useEffect, useCallback } from 'react';
import { GeolocationState, Location } from '../types/location';

// Default location (New York City)
const DEFAULT_LOCATION: Location = {
  lat: 40.7128,
  lng: -74.0060,
  accuracy: 1000
};

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: DEFAULT_LOCATION, // Always start with default location
    accuracy: DEFAULT_LOCATION.accuracy || null,
    isLoading: false,
    error: null,
    isSupported: 'geolocation' in navigator
  });

  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser');
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        reject(error);
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('📍 Requesting location with generous timeout');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          setState(prev => ({
            ...prev,
            location,
            accuracy: position.coords.accuracy || null,
            isLoading: false,
            error: null
          }));
          
          console.log('✅ Real location obtained:', location);
          resolve(location);
        },
        (error) => {
          
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Using default location.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Using default location.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Using default location.';
              break;
          }
          
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage
          }));
          
          console.log('Using default location due to error:', errorMessage);
          resolve(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: false, // Disable for mobile reliability
          timeout: 10000, // More generous 10-second timeout
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }, []);

  // Auto-get location on mount if supported (disabled - now handled in onboarding)
  useEffect(() => {
    // Skip auto-request - location is now requested during onboarding
    // if (state.isSupported && !state.location && !state.isLoading) {
    //   getCurrentLocation().catch(console.error);
    // }
  }, [state.isSupported, state.location, state.isLoading, getCurrentLocation]);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) return null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setState(prev => ({
          ...prev,
          location,
          accuracy: position.coords.accuracy || null,
          error: null
        }));
      },
      (error) => {
        console.error('Geolocation watch error:', error);
        // Don't update state on watch errors to avoid disrupting existing location
      },
      {
        enableHighAccuracy: false, // Less aggressive for watching
        timeout: 10000,
        maximumAge: 60000 // 1 minute cache for watching
      }
    );

    return watchId;
  }, []);

  const clearWatch = useCallback((watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  }, []);

  const retryLocation = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    return getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    ...state,
    getCurrentLocation,
    watchLocation,
    clearWatch,
    retryLocation
  };
};