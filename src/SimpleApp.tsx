import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/Auth/AuthScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { supabase } from './services/supabase';

function SimpleApp() {
  console.log('🚀 SimpleApp rendering at:', new Date().toISOString());
  
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'error'>('loading');
  const [permissionState, setPermissionState] = useState<'loading' | 'granted' | 'denied'>('loading');
  
  console.log('🔍 Current auth state in render:', authState);

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

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setPermissionState('granted');
      } catch (error) {
        setPermissionState('denied');
      }
    };
    
    checkPermissions();
  }, []);

  const handlePermissionGranted = () => {
    setPermissionState('granted');
  };

  const handlePermissionDenied = () => {
    setPermissionState('denied');
  };

  const handleAuthSuccess = () => {
    setAuthState('authenticated');
  };

  const handleAuthError = (error: Error) => {
    console.error('Auth error:', error);
    setAuthState('error');
  };

  // Debug render state
  console.log('🎨 SimpleApp render state:', { 
    authState, 
    permissionState
  });

  // Show loading screen until authentication and permissions are resolved
  if (authState === 'loading' || permissionState === 'loading') {
    console.log('⏳ Loading state:', { authState, permissionState });
    return (
      <LoadingScreen
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        isPWA={false}
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
        isMobile={true}
      />
    );
  }

  // Show authentication error state
  if (authState === 'error') {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Authentication Error</h1>
        <p>Unable to authenticate. Please try again.</p>
        <button onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }

  // Show permission denied state
  if (permissionState === 'denied') {
    return (
      <div style={{ padding: '20px', color: 'orange' }}>
        <h1>Camera Permission Required</h1>
        <p>Please enable camera access and refresh.</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  // Main authenticated app
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 Languages Go - Authenticated!</h1>
      <p>Auth state: {authState}</p>
      <p>Permission state: {permissionState}</p>
      <p>You should see the main app here!</p>
    </div>
  );
}

export default SimpleApp; 