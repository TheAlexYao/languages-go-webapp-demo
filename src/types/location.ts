export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeolocationState {
  location: Location | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}