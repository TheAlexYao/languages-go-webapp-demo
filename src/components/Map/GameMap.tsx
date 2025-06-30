import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { divIcon } from 'leaflet';
import { MapPin, Users, Target } from 'lucide-react';
import { PhotoPin } from '../../types/vocabulary';
import { Location } from '../../types/location';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { resolvePhotoUrl } from '../../services/supabase';
import { VocabularyCard } from '../../types/vocabulary';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GameMapProps {
  pins: PhotoPin[];
  currentLocation: Location | null;
  onPinClick: (pin: PhotoPin) => void;
  className?: string;
}

// Custom pin icons with better visibility
const createPinIcon = (status: 'new' | 'visited' | 'collected') => {
  const colors = {
    new: '#3b82f6', // blue
    visited: '#eab308', // yellow
    collected: '#22c55e' // green
  };
  
  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[status]};
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #ff4444;
          border: 2px solid white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    className: 'custom-pin-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const currentLocationIcon = L.divIcon({
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #3b82f6;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      animation: pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    </style>
  `,
  className: 'current-location-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle map centering
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

// Helper function to calculate distance between two points
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Cluster pins that are close together
const clusterPins = (pins: PhotoPin[], clusterRadius: number = 50): Array<{
  id: string;
  lat: number;
  lng: number;
  pins: PhotoPin[];
  isCluster: boolean;
}> => {
  const clusters: Array<{
    id: string;
    lat: number;
    lng: number;
    pins: PhotoPin[];
    isCluster: boolean;
  }> = [];
  
  const processedPins = new Set<string>();

  pins.forEach(pin => {
    if (processedPins.has(pin.id)) return;

    const nearbyPins = pins.filter(otherPin => {
      if (otherPin.id === pin.id || processedPins.has(otherPin.id)) return false;
      const distance = getDistance(pin.lat, pin.lng, otherPin.lat, otherPin.lng);
      return distance <= clusterRadius;
    });

    if (nearbyPins.length > 0) {
      // Create cluster
      const allPins = [pin, ...nearbyPins];
      const centerLat = allPins.reduce((sum, p) => sum + p.lat, 0) / allPins.length;
      const centerLng = allPins.reduce((sum, p) => sum + p.lng, 0) / allPins.length;
      
      clusters.push({
        id: `cluster-${pin.id}`,
        lat: centerLat,
        lng: centerLng,
        pins: allPins,
        isCluster: true
      });

      // Mark all pins as processed
      allPins.forEach(p => processedPins.add(p.id));
    } else {
      // Single pin
      clusters.push({
        id: pin.id,
        lat: pin.lat,
        lng: pin.lng,
        pins: [pin],
        isCluster: false
      });
      processedPins.add(pin.id);
    }
  });

  return clusters;
};

export const GameMap: React.FC<GameMapProps> = ({
  pins,
  currentLocation,
  onPinClick,
  className = ''
}) => {
  const { isMobile } = useMobileDetection();
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  
  // Update map center when current location changes
  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
    }
  }, [currentLocation]);

  // Cluster pins to handle overlapping locations
  const clusteredPins = useMemo(() => clusterPins(pins), [pins]);

  const handleClusterClick = (cluster: any) => {
    if (cluster.isCluster && cluster.pins.length > 1) {
      // Show cluster selection UI
      setSelectedCluster(cluster.id);
    } else {
      // Single pin - open directly
      onPinClick(cluster.pins[0]);
      setSelectedCluster(null);
    }
  };

  const handlePinSelection = (pin: PhotoPin) => {
    onPinClick(pin);
    setSelectedCluster(null);
  };

  const getPinStatus = (pin: PhotoPin): 'new' | 'visited' | 'collected' => {
    if (pin.hasCollectedAll) return 'collected';
    if (pin.cards.some(card => card.collectedAt)) return 'visited';
    return 'new';
  };

  // Debug logging
  useEffect(() => {
    console.log('🗺️ GameMap render:', {
      pinsCount: pins.length,
      currentLocation,
      mapCenter,
      pins: pins.map(p => ({ id: p.id, lat: p.lat, lng: p.lng, cardsCount: p.cards.length }))
    });
  }, [pins, currentLocation, mapCenter]);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={currentLocation ? [currentLocation.lat, currentLocation.lng] : [40.7128, -74.0060]}
        zoom={15}
        className="w-full h-full rounded-2xl overflow-hidden"
        zoomControl={!isMobile}
        style={{ minHeight: '400px' }}
      >
        <MapController center={mapCenter} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <MapPin className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <p className="font-medium">You are here</p>
                {currentLocation.accuracy && (
                  <p className="text-xs text-gray-600">±{Math.round(currentLocation.accuracy)}m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Clustered pin markers */}
        {clusteredPins.map((cluster) => (
          <Marker
            key={cluster.id}
            position={[cluster.lat, cluster.lng]}
            eventHandlers={{
              click: () => handleClusterClick(cluster),
            }}
            icon={divIcon({
              className: 'custom-pin',
              html: cluster.isCluster 
                ? `<div class="cluster-pin">
                     <span class="cluster-count">${cluster.pins.length}</span>
                     <div class="cluster-ring"></div>
                   </div>`
                : `<div class="single-pin">
                     <div class="pin-icon">📍</div>
                   </div>`,
              iconSize: cluster.isCluster ? [40, 40] : [30, 30],
              iconAnchor: cluster.isCluster ? [20, 20] : [15, 15],
            })}
          >
            <Popup>
              {cluster.isCluster 
                ? `${cluster.pins.length} vocabulary discoveries at this location`
                : `${cluster.pins[0].cards.length} vocabulary cards discovered`
              }
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-200">
        <h4 className="text-sm font-bold mb-3 text-gray-800">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
            <span className="text-sm text-gray-700">New cards</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-md"></div>
            <span className="text-sm text-gray-700">Partially collected</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
            <span className="text-sm text-gray-700">All collected</span>
          </div>
        </div>
      </div>
      
      {/* Pins Counter */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <Target className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-bold text-gray-800">Your Discoveries</span>
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total pins:</span>
            <span className="font-medium text-gray-800">{pins.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Cards found:</span>
            <span className="font-medium text-gray-800">{pins.reduce((total, pin) => total + pin.cards.length, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Collected:</span>
            <span className="font-medium text-green-600">
              {pins.reduce((total, pin) => total + pin.cards.filter(card => card.collectedAt).length, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* No pins message */}
      {pins.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
          <div className="text-center text-white bg-black/60 p-6 rounded-2xl backdrop-blur-md">
            <Target className="h-12 w-12 mx-auto mb-3 text-blue-400" />
            <h3 className="text-lg font-bold mb-2">No discoveries yet</h3>
            <p className="text-sm text-gray-300">Take photos to discover vocabulary cards!</p>
          </div>
        </div>
      )}

      {/* Cluster selection modal */}
      {selectedCluster && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full max-h-[70vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Select Discovery</h3>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {clusteredPins
                  .find(c => c.id === selectedCluster)
                  ?.pins.map((pin, index) => (
                    <button
                      key={pin.id}
                      onClick={() => handlePinSelection(pin)}
                      className="w-full p-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-2xl border border-gray-200 hover:border-blue-200 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Discovery #{index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            {pin.cards.length} vocabulary {pin.cards.length === 1 ? 'word' : 'words'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(pin.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for custom pin styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .cluster-pin {
            position: relative;
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
          }
          
          .cluster-count {
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          
          .cluster-ring {
            position: absolute;
            width: 50px;
            height: 50px;
            border: 2px solid #3B82F6;
            border-radius: 50%;
            opacity: 0.5;
            animation: pulse 2s infinite;
          }
          
          .single-pin {
            position: relative;
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #10B981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          }
          
          .pin-icon {
            font-size: 16px;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(1); opacity: 0.5; }
          }
        `
      }} />
    </div>
  );
};