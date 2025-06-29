import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Users, Target } from 'lucide-react';
import { PhotoPin } from '../../types/vocabulary';
import { Location } from '../../types/location';
import { useMobileDetection } from '../../hooks/useMobileDetection';

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

export const GameMap: React.FC<GameMapProps> = ({
  pins,
  currentLocation,
  onPinClick,
  className = ''
}) => {
  const { isMobile } = useMobileDetection();
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  
  // Update map center when current location changes
  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
    }
  }, [currentLocation]);

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
        center={mapCenter}
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
        
        {/* Photo Pins */}
        {pins.map((pin) => {
          console.log('📍 Rendering pin:', pin.id, 'at', pin.lat, pin.lng);
          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createPinIcon(getPinStatus(pin))}
              eventHandlers={{
                click: () => {
                  console.log('📌 Pin clicked in map:', pin.id);
                  onPinClick(pin);
                }
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <img
                    src={pin.photoUrl}
                    alt="Photo location"
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {pin.cards.length} vocabulary card{pin.cards.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pin.cards.slice(0, 3).map((card) => (
                        <span
                          key={card.id}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                        >
                          {card.word}
                        </span>
                      ))}
                      {pin.cards.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{pin.cards.length - 3} more
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(pin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
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
    </div>
  );
};