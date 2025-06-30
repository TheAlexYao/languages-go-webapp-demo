import { useState } from 'react';
import { TurnstileWidget } from './TurnstileWidget';
import { signInAnonymously } from '../../services/supabase';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  onAuthError: (error: Error) => void;
  isMobile: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  onAuthError,
  isMobile
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleSignIn = async (token?: string) => {
    setIsAuthenticating(true);
    
    try {
      console.log('🔑 Signing in anonymously...');
      console.log('🎫 Using CAPTCHA token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      const authData = await signInAnonymously(token);
      console.log('✅ Anonymous authentication successful:', authData.user?.id);
      onAuthSuccess();
    } catch (error: any) {
      console.error('❌ Authentication error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        fullError: error
      });
      
      // If CAPTCHA is required, show the widget
      if (error.message?.includes('captcha') || error.message?.includes('Captcha')) {
        console.log('🤖 CAPTCHA required, showing Turnstile widget...');
        setShowCaptcha(true);
      } else {
        onAuthError(error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    console.log('✅ CAPTCHA verified, attempting sign-in...');
    console.log('🎫 CAPTCHA token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    setCaptchaToken(token);
    handleSignIn(token);
  };

  const handleCaptchaError = () => {
    console.error('❌ CAPTCHA verification failed');
    setShowCaptcha(false);
    onAuthError(new Error('CAPTCHA verification failed'));
  };

  const handleCaptchaExpire = () => {
    console.log('⏰ CAPTCHA expired');
    setCaptchaToken(null);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 min-h-screen">
      <div className="text-center text-gray-100 max-w-md w-full">
        <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
          <img 
            src="/icons/map-kun.svg" 
            alt="Languages Go Logo" 
            className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} drop-shadow-lg`}
          />
        </div>
        
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent`}>
          Welcome to Languages Go!
        </h1>
        
        <p className={`text-gray-400 mb-8 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
          Catch vocabulary in the wild! Take photos and collect vocabulary cards in 8 languages as you explore the world around you.
        </p>

        {showCaptcha && (
          <div className="mb-6">
            <p className="text-gray-300 mb-4 text-sm">
              Please complete the security check to continue:
            </p>
            <TurnstileWidget
              onVerify={handleCaptchaVerify}
              onError={handleCaptchaError}
              onExpire={handleCaptchaExpire}
            />
          </div>
        )}

        {!showCaptcha && (
          <div className="space-y-4">
            <button
              onClick={() => handleSignIn()}
              disabled={isAuthenticating}
              className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white ${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'} rounded-2xl transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed w-full`}
            >
              {isAuthenticating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting Adventure...
                </span>
              ) : (
                'Start Your Language Adventure'
              )}
            </button>
            
            {/* Development Mode - Only show on localhost */}
            {window.location.hostname === 'localhost' && (
              <div className="space-y-3">
                <div className="border-t border-gray-600 pt-4">
                  <p className="text-gray-400 text-xs mb-3 text-center">Development Mode</p>
                  <button
                    onClick={async () => {
                      setIsAuthenticating(true);
                      try {
                        console.log('🧪 Admin mode - creating anonymous session...');
                        const authData = await signInAnonymously(); // No CAPTCHA needed for admin
                        console.log('✅ Admin session created:', authData.user?.id);
                        onAuthSuccess();
                      } catch (error: any) {
                        console.error('❌ Admin mode failed:', error);
                        // If anonymous auth fails, just proceed anyway for development
                        console.log('🚧 Proceeding with demo mode...');
                        onAuthSuccess();
                      } finally {
                        setIsAuthenticating(false);
                      }
                    }}
                    disabled={isAuthenticating}
                    className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white ${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'} rounded-2xl transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed w-full`}
                  >
                    {isAuthenticating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Session...
                      </span>
                    ) : (
                      '🧪 Admin Mode (Skip Auth)'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p>Anonymous access • No personal data required</p>
          <p className="mt-1">Protected by Cloudflare Turnstile</p>
        </div>
      </div>
    </div>
  );
}; 