import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire
}) => {
  // Get the site key from environment variables
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  console.log('🔑 Turnstile site key:', siteKey ? `${siteKey.substring(0, 10)}...` : 'NOT FOUND');

  if (!siteKey) {
    console.warn('Turnstile site key not configured');
    return null;
  }

  return (
    <div className="flex justify-center my-4">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onVerify}
        onError={(error) => {
          console.error('🚨 Turnstile error:', error);
          if (onError) onError();
        }}
        onExpire={onExpire}
        options={{
          theme: 'dark', // Match your app's dark theme
          size: 'normal',
        }}
      />
    </div>
  );
}; 