import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';

function TestApp() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  console.log('🧪 TestApp rendering with auth state:', authState);

  useEffect(() => {
    console.log('🔧 TestApp useEffect running...');
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📋 Initial session check:', session?.user?.id || 'no session');
        
        if (session) {
          setAuthState('authenticated');
        } else {
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('❌ Error checking auth:', error);
        setAuthState('unauthenticated');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 TestApp auth state changed:', event, session?.user?.id || 'no session');
      if (session) {
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test App - Auth Debug</h1>
      <p>Current auth state: <strong>{authState}</strong></p>
      
      {authState === 'loading' && (
        <div style={{ color: 'blue' }}>Loading...</div>
      )}
      
      {authState === 'unauthenticated' && (
        <div style={{ color: 'red' }}>
          <p>Not authenticated</p>
          <button onClick={() => console.log('Sign in button clicked')}>
            Sign In (Test)
          </button>
        </div>
      )}
      
      {authState === 'authenticated' && (
        <div style={{ color: 'green' }}>
          <p>Authenticated!</p>
        </div>
      )}
    </div>
  );
}

export default TestApp; 