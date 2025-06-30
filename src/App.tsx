import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { LoadingScreen } from './components/LoadingScreen';
import { PhotoCapture } from './components/Camera/PhotoCapture';
import { GameMap } from './components/Map/GameMap';
import { CardGrid } from './components/Cards/CardGrid';
import { CardModal } from './components/Cards/CardModal';
import { NearbyPlayers } from './components/Community/NearbyPlayers';
import { ActivityFeed } from './components/Community/ActivityFeed';
import { Leaderboard } from './components/Community/Leaderboard';
import { Header } from './components/Layout/Header';
import { TabNavigation } from './components/Layout/TabNavigation';
import { PoweredByBolt } from './components/Layout/PoweredByBolt';
import { InstallPrompt } from './components/InstallPrompt';
import { AuthScreen } from './components/Auth/AuthScreen';
import { useCardCollection } from './hooks/useCardCollection';
import { useGeolocation } from './hooks/useGeolocation';
import { useMobileDetection } from './hooks/useMobileDetection';
import { getMockCommunityData } from './services/mockData';
import { signInAnonymously, supabase, savePinsLocally, loadPinsLocally, resolvePhotoUrl } from './services/supabase';
import { initializeStickerGeneration, getStickerUrl } from './services/stickers/stickerIntegration';
import { VocabularyCard, PhotoPin, CollectionStats } from './types/vocabulary';
import { Player } from './types/player';
import { PWAOnboardingScreen } from './components/PWAOnboardingScreen';
import { pwaManager } from './utils/pwa';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';
type PermissionState = 'loading' | 'granted' | 'denied';
type PWAState = 'checking' | 'show-onboarding' | 'completed';
type Tab = 'camera' | 'map' | 'collection' | 'community';

function App() {
  console.log('🚀 App component rendering at:', new Date().toISOString());
  
  const { isMobile, viewportHeight, isPWA } = useMobileDetection();
  const { location, getCurrentLocation, isLoading: locationLoading, error: locationError } = useGeolocation();
  
  const [currentTab, setCurrentTab] = useState<Tab>('camera');
  const [permissionState, setPermissionState] = useState<PermissionState>('loading');
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [pwaState, setPwaState] = useState<PWAState>('checking');
  
  console.log(' Current auth state in render:', authState);
  
  const { collectedCards, stats: hookStats, isLoading: collectionLoading, collectCard } = useCardCollection(authState === 'authenticated');
  const [pins, setPins] = useState<PhotoPin[]>([]);
  const [selectedCard, setSelectedCard] = useState<VocabularyCard | null>(null);
  const [selectedPin, setSelectedPin] = useState<PhotoPin | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [collectingCardId, setCollectingCardId] = useState<string | null>(null);
  const [showCollectSuccess, setShowCollectSuccess] = useState<{ cardId: string; word: string } | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es'); // Default to Spanish
  
  // Mock community data
  const communityData = getMockCommunityData();

  // Use hook's stats directly - the hook now handles both authenticated and demo modes
  const currentStats = hookStats;

  // Check PWA state on mount
  useEffect(() => {
    const checkPWAState = () => {
      if (pwaManager.isAppInstalled()) {
        // Already installed as PWA
        setPwaState('completed');
      } else if (pwaManager.shouldShowOnboarding()) {
        // Should show onboarding based on PWA manager logic
        setPwaState('show-onboarding');
      } else {
        // Skip onboarding
        setPwaState('completed');
      }
    };

    // Small delay to let PWA manager initialize
    setTimeout(checkPWAState, 500);
  }, [isMobile]);

  // Initialize authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ User already authenticated:', session.user.id);
          setAuthState('authenticated');
        } else {
          // No existing session, show auth screen
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('❌ Error checking authentication:', error);
        setAuthState('unauthenticated');
      }
    };

    checkExistingAuth();

    // Initialize sticker generation for existing vocabulary
    initializeStickerGeneration().catch(error => {
      console.error('Failed to initialize sticker generation:', error);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      if (session) {
        console.log('✅ Setting auth state to authenticated');
        setAuthState('authenticated');
      } else {
        console.log('🔓 Setting auth state to unauthenticated');
        setAuthState('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check permissions on mount - This is now handled by the LoadingScreen flow
  useEffect(() => {
    // const checkPermissions = async () => {
    //   try {
    //     // This is a passive check. It will fail if permission is not already granted.
    //     // The actual request happens in the LoadingScreen.
    //     const stream = await navigator.mediaDevices.enumerateDevices();
    //     const hasCamera = stream.some(device => device.kind === 'videoinput');
    //     if (hasCamera) {
    //       // A camera exists, but we don't know the permission state yet.
    //       // We'll let the LoadingScreen handle the actual request.
    //     }
    //   } catch (error) {
    //     setPermissionState('denied');
    //   }
    // };
    // checkPermissions();
  }, []);

  // Load pins from local storage on app initialization
  useEffect(() => {
    const loadStoredPins = () => {
      try {
        const storedPins = loadPinsLocally();
        if (storedPins.length > 0) {
          console.log('📍 Loaded pins from local storage:', storedPins.length);
          setPins(storedPins);
        }
      } catch (error) {
        console.error('Failed to load pins from local storage:', error);
      }
    };

    loadStoredPins();
  }, []);

  // Save pins to local storage whenever pins change
  useEffect(() => {
    if (pins.length > 0) {
      savePinsLocally(pins);
      console.log('💾 Saved pins to local storage:', pins.length);
    }
  }, [pins]);

  const handlePermissionGranted = () => {
    setPermissionState('granted');
    
    // Trigger location request after permissions are granted
    if (location === null) {
      getCurrentLocation().catch((error) => {
        console.warn('Location request failed after permission grant:', error);
        // Continue anyway - app works with default location
      });
    }
  };

  const handlePermissionDenied = () => {
    setPermissionState('denied');
  };

  const handlePWAInstall = () => {
    console.log('🎉 PWA installed successfully');
    setPwaState('completed');
  };

  const handlePWASkip = () => {
    console.log('⏭️ PWA onboarding skipped');
    pwaManager.skipOnboarding(); // Mark as dismissed in PWA manager
    setPwaState('completed');
  };

  const handleCardsGenerated = (cards: VocabularyCard[], pin: PhotoPin) => {
    console.log('🎯 Cards generated:', { cards: cards.length, pin: pin.id });
    
    // Add the pin to the pins array first
    setPins(prev => {
      const newPins = [pin, ...prev];
      console.log('📍 Pins updated:', newPins.length);
      return newPins;
    });
    
    // Set the selected pin to show the modal
    console.log('🔍 Setting selected pin:', pin.id);
    setSelectedPin(pin);
    
    // Switch to map tab with a small delay to ensure state is updated
    setTimeout(() => {
      console.log('🗺️ Switching to map tab');
      setCurrentTab('map');
    }, 100);
  };

  const handlePinClick = (pin: PhotoPin) => {
    console.log('📌 Pin clicked:', pin.id);
    setSelectedPin(pin);
  };

  // Helper function to check if a card is already collected
  const isCardAlreadyCollected = (cardId: string): boolean => {
    return collectedCards.some(collected => collected.id === cardId);
  };

  // Helper function to check if a card is in the current pin and already marked as collected
  const isCardCollectedInPin = (card: VocabularyCard): boolean => {
    return !!card.collectedAt || isCardAlreadyCollected(card.id);
  };

  const handleCollectCard = async (card: VocabularyCard) => {
    console.log('🎴 Attempting to collect card:', card.word, card.id);
    
    // Prevent collection if already collected or currently collecting
    if (isCardCollectedInPin(card) || collectingCardId === card.id) {
      console.log('❌ Card already collected or currently collecting:', card.id);
      return;
    }
    
    // Set collecting state for this specific card
    setCollectingCardId(card.id);
    
    // Add haptic feedback immediately
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
    
    try {
      // Simulate a brief delay for the collection animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Double-check that the card hasn't been collected while we were waiting
      if (isCardAlreadyCollected(card.id)) {
        console.log('❌ Card was collected while processing:', card.id);
        setCollectingCardId(null);
        return;
      }
      
      // Actually collect the card
      await collectCard(card);
      
      // Show success feedback
      setShowCollectSuccess({ cardId: card.id, word: card.word });
      
      // Update pin status - mark the card as collected in the pin
      setPins(prev => prev.map(pin => {
        if (pin.id === card.pinId) {
          const updatedCards = pin.cards.map(c => 
            c.id === card.id ? { ...c, collectedAt: new Date() } : c
          );
          return {
            ...pin,
            cards: updatedCards,
            hasCollectedAll: updatedCards.every(c => c.collectedAt)
          };
        }
        return pin;
      }));

      console.log('✅ Card collected successfully:', card.word);
      
    } catch (error) {
      console.error('❌ Error collecting card:', error);
    } finally {
      // Clear collecting state
      setCollectingCardId(null);
      
      // Hide success message after delay
      setTimeout(() => {
        setShowCollectSuccess(null);
      }, 2000);
    }
  };

  const handleCloseSelectedPin = () => {
    console.log('❌ Closing selected pin modal');
    setSelectedPin(null);
  };

  const handleAuthSuccess = () => {
    setAuthState('authenticated');
  };

  const handleAuthError = (error: Error) => {
    console.error('❌ Authentication failed:', error);
    setAuthState('error');
  };

  // Debug: Log current state
  console.log('🐛 App render state:', { authState, permissionState, collectionLoading, pwaState });

  // Debug render state
  console.log('🎨 App render state:', { 
    authState, 
    permissionState, 
    collectionLoading,
    pwaState,
    collectedCardsCount: collectedCards.length
  });

  // Show loading screen until authentication and permissions are resolved
  if (authState === 'loading' || permissionState === 'loading' || collectionLoading || pwaState === 'checking') {
    console.log('⏳ Loading state:', { authState, permissionState, collectionLoading, pwaState });
    return (
      <LoadingScreen
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        isPWA={isPWA}
      />
    );
  }

  // Show authentication screen for unauthenticated users
  if (authState === 'unauthenticated') {
    console.log('🔓 Showing authentication screen');
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
        isMobile={isMobile}
      />
    );
  }

  // Show PWA onboarding after permissions are granted but before main app
  if (pwaState === 'show-onboarding') {
    console.log('📱 Showing PWA onboarding screen');
    return (
      <PWAOnboardingScreen
        onInstall={handlePWAInstall}
        onSkip={handlePWASkip}
        isMobile={isMobile}
      />
    );
  }

  // Show authentication error state
  if (authState === 'error') {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6" style={{ height: viewportHeight }}>
        <div className="text-center text-gray-100 max-w-md">
          <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
            <span className={`${isMobile ? 'text-3xl' : 'text-4xl'}`}>🔐</span>
          </div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent`}>
            Authentication Error
          </h1>
          <p className={`text-gray-400 mb-8 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
            Unable to authenticate with the server. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'} rounded-2xl transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show permission denied state
  if (permissionState === 'denied') {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6" style={{ height: viewportHeight }}>
        <div className="text-center text-gray-100 max-w-md">
          <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
            <span className={`${isMobile ? 'text-3xl' : 'text-4xl'}`}>📸</span>
          </div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent`}>
            Camera Access Required
          </h1>
          <p className={`text-gray-400 mb-8 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
            Languages Go needs camera access to analyze photos and generate vocabulary cards. 
            Please enable permissions and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'} rounded-2xl transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 flex flex-col relative"
      style={{ height: isMobile ? viewportHeight : '100vh' }}
    >
      {/* Header */}
      <Header 
        stats={currentStats} 
        currentTab={currentTab}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Main Content */}
      <main className={`flex-1 overflow-hidden ${isMobile ? 'pb-20' : ''}`}>
        {currentTab === 'camera' && (
          <div className={`h-full ${isMobile ? 'p-4' : 'p-6'}`}>
            <PhotoCapture
              onCardsGenerated={handleCardsGenerated}
              isEnabled={authState === 'authenticated'}
              selectedLanguage={selectedLanguage}
              location={location}
              locationLoading={locationLoading}
              locationError={locationError}
              onRetryLocation={() => getCurrentLocation()}
            />
          </div>
        )}

        {currentTab === 'map' && (
          <div className="h-full relative">
            <GameMap
              pins={pins}
              currentLocation={location}
              onPinClick={handlePinClick}
              className="h-full"
            />
            
            {/* Desktop Community Sidebar */}
            {!isMobile && (
              <div className="absolute top-6 left-6 w-80 space-y-6 max-h-[calc(100%-3rem)] overflow-y-auto">
                <NearbyPlayers
                  players={communityData.nearbyPlayers}
                  onPlayerClick={setSelectedPlayer}
                />
                <ActivityFeed activities={communityData.activityFeed} />
              </div>
            )}
          </div>
        )}

        {currentTab === 'collection' && (
          <div className={`h-full overflow-y-auto ${isMobile ? 'p-4' : 'p-6'}`}>
            <CardGrid
              cards={collectedCards}
              stats={currentStats}
              onCardClick={setSelectedCard}
            />
          </div>
        )}

        {currentTab === 'community' && (
          <div className={`h-full overflow-y-auto ${isMobile ? 'p-4 space-y-6' : 'p-6 space-y-8'}`}>
            <Leaderboard
              players={communityData.leaderboard}
              currentPlayerId="current-user"
            />
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'lg:grid-cols-2 gap-8'}`}>
              <NearbyPlayers
                players={communityData.nearbyPlayers}
                onPlayerClick={setSelectedPlayer}
              />
              <ActivityFeed activities={communityData.activityFeed} />
            </div>
          </div>
        )}
      </main>

      {/* Tab Navigation - now always visible */}
      <TabNavigation
        activeTab={currentTab}
        onTabChange={setCurrentTab}
        isMobile={isMobile}
      />

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {/* Pin Modal - This is the key modal that should show the generated cards */}
      {selectedPin && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              handleCloseSelectedPin();
            }
          }}
        >
          <div 
            className={`bg-white rounded-3xl shadow-2xl ${isMobile ? 'max-w-sm w-full max-h-[85vh]' : 'max-w-md w-full max-h-[90vh]'} overflow-y-auto border border-gray-200 relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${isMobile ? 'p-6' : 'p-8'}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>Vocabulary Discovery</h3>
                  <p className="text-gray-600 text-sm">Collect these words to add them to your collection</p>
                </div>
                <button
                  onClick={handleCloseSelectedPin}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <img
                src={resolvePhotoUrl(selectedPin.photoUrl)}
                alt="Location photo"
                className={`w-full ${isMobile ? 'h-32' : 'h-40'} object-cover rounded-2xl mb-6 shadow-lg`}
              />
              
              <div className="space-y-4">
                {selectedPin.cards.map((card) => {
                  const isCollecting = collectingCardId === card.id;
                  const isCollected = isCardCollectedInPin(card);
                  const showSuccess = showCollectSuccess?.cardId === card.id;
                  const canCollect = !isCollected && !isCollecting;
                  
                  return (
                    <div
                      key={card.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                        isCollected 
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                          : showSuccess
                          ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-300 scale-105'
                          : isCollecting
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 scale-105'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:from-blue-50 hover:to-purple-50 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 bg-white border-2 ${
                          isCollected 
                            ? 'border-emerald-500' 
                            : showSuccess
                            ? 'border-emerald-400 scale-110'
                            : isCollecting
                            ? 'border-blue-400 animate-pulse'
                            : 'border-gray-300'
                        }`}>
                          {isCollected || showSuccess ? (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">✓</span>
                            </div>
                          ) : isCollecting ? (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            <img
                              src={getStickerUrl(card)}
                              alt={card.word}
                              className="w-full h-full object-contain p-1"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{card.word}</p>
                          <p className="text-sm text-gray-600">{card.translation}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                              {card.language}
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              card.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                              card.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {card.rarity}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {canCollect ? (
                        <button
                          onClick={() => handleCollectCard(card)}
                          disabled={!canCollect}
                          className={`font-bold rounded-xl transition-all duration-200 shadow-lg transform ${
                            isCollecting
                              ? 'bg-blue-400 text-white px-4 py-2 cursor-not-allowed scale-95'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 hover:shadow-xl hover:scale-105 active:scale-95'
                          } ${isMobile ? 'text-sm' : ''}`}
                        >
                          {isCollecting ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Collecting...</span>
                            </div>
                          ) : (
                            'Collect'
                          )}
                        </button>
                      ) : (
                        <div className={`flex items-center space-x-2 text-emerald-600 font-bold bg-emerald-100 rounded-xl transition-all duration-300 ${
                          showSuccess ? 'animate-bounce' : ''
                        } ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'}`}>
                          <span className="text-lg">✓</span>
                          <span>Collected</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Success Toast */}
      {showCollectSuccess && (
        <div 
          className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400 animate-bounce"
          style={{ zIndex: 10001 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">🎉</span>
            </div>
            <div>
              <p className="font-bold">Card Collected!</p>
              <p className="text-sm opacity-90">"{showCollectSuccess.word}" added to your collection</p>
            </div>
          </div>
        </div>
      )}

      {/* Powered by Bolt Logo */}
      <PoweredByBolt />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;