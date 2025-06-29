# Cloudflare Turnstile Setup Guide

## 1. Complete Turnstile Widget Configuration

In your Cloudflare Turnstile dashboard, configure the widget with these settings:

### Widget Settings
- **Widget name**: `Languages-Go-Webapp`
- **Hostnames**: 
  - `localhost` (for development)
  - `play.languagesgo.app` (for production)
- **Widget Mode**: `Managed` (recommended for best UX)
- **Pre-clearance**: `Enabled` (reduces repeated challenges)

### After Creation
You'll receive two keys:
- **Site Key** (public) - goes in your frontend
- **Secret Key** (private) - goes in Supabase

## 2. Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jdmzqrbabxnaarihvwfp.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Cloudflare Turnstile Configuration
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key-here
```

## 3. Configure Supabase Auth

1. Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/jdmzqrbabxnaarihvwfp/settings/auth)
2. Scroll to "Bot and Abuse Protection"
3. Toggle "Enable CAPTCHA protection" to ON
4. Select "Cloudflare Turnstile" from the dropdown
5. Enter your **Secret Key** from Turnstile
6. Click "Save"

## 4. Test the Integration

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. The app should show the new authentication screen
4. Click "Start Your Language Adventure"
5. If CAPTCHA is required, you'll see the Turnstile widget
6. Complete the challenge and verify authentication works

## 5. Security Benefits

With Turnstile enabled, your app now has:

✅ **Anonymous Authentication** - Users can play without providing personal info
✅ **CAPTCHA Protection** - Prevents bot abuse and spam sign-ups
✅ **Rate Limiting** - Built-in protection against excessive requests
✅ **Proper RLS Policies** - Anonymous users can only access their own data

## 6. Monitoring and Maintenance

### Check Security Advisors
Regularly review your [Security Advisors](https://supabase.com/dashboard/project/jdmzqrbabxnaarihvwfp/advisors/security) for any new security recommendations.

### Monitor Rate Limits
Check your [Auth Rate Limits](https://supabase.com/dashboard/project/jdmzqrbabxnaarihvwfp/auth/rate-limits) to ensure they're appropriate for your usage.

### Clean Up Anonymous Users
Consider running this SQL periodically to clean up old anonymous users:

```sql
-- Delete anonymous users older than 30 days
DELETE FROM auth.users 
WHERE is_anonymous = true 
AND created_at < now() - interval '30 days';
```

## 7. Production Deployment

When deploying to production:

1. Update your Turnstile widget to include your production domain
2. Set the production environment variables
3. Test the CAPTCHA flow on your live site
4. Monitor for any authentication issues

## Troubleshooting

### Common Issues

**CAPTCHA not showing**: Check that `VITE_TURNSTILE_SITE_KEY` is set correctly

**Authentication fails**: Verify the secret key is configured in Supabase Auth settings

**CORS errors**: Ensure your domain is added to the Turnstile widget hostnames

**Rate limiting**: Check if you're hitting the anonymous sign-in rate limits (30/hour by default) 