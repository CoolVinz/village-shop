# LINE Login Setup Guide

This guide explains how to set up LINE Login integration for the Village Shop marketplace.

## Prerequisites

1. LINE Developers account
2. Village Shop application running locally or deployed
3. Access to environment variables configuration

## Step 1: Create LINE Developers Account

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Sign in with your LINE account
3. If you don't have a LINE account, create one first

## Step 2: Create a New Provider

1. Click "Create" in the LINE Developers Console
2. Select "Create a new provider"
3. Enter your company/organization name (e.g., "Village Shop")
4. Click "Create"

## Step 3: Create LINE Login Channel

1. In your provider dashboard, click "Create a new channel"
2. Select "LINE Login" as the channel type
3. Fill in the required information:
   - **Channel name**: "Village Shop Login"
   - **Channel description**: "Authentication for Village Shop marketplace"
   - **App type**: "Web app"
   - **Email address**: Your contact email
   - **Privacy policy URL**: Your privacy policy URL (optional for development)
   - **Terms of use URL**: Your terms of use URL (optional for development)

## Step 4: Configure Channel Settings

### Basic Settings
1. Go to the "Basic settings" tab
2. Note down your **Channel ID** (this is your `LINE_CLIENT_ID`)
3. Note down your **Channel secret** (this is your `LINE_CLIENT_SECRET`)

### LINE Login Settings
1. Go to the "LINE Login" tab
2. Configure the following:

#### Callback URLs
**IMPORTANT**: Add BOTH callback URLs to support development and production:

**Step-by-Step Instructions:**

1. **Access LINE Developers Console**:
   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Sign in with your LINE account
   - Select your provider and your LINE Login channel

2. **Navigate to Callback URL Settings**:
   - Click on your LINE Login channel
   - Go to the **"LINE Login"** tab
   - Find the **"Callback URL"** section

3. **Add Both URLs** (Enter each URL on a separate line):
   ```
   http://localhost:3000/api/auth/callback/line
   https://line-shop.aivinz.xyz/api/auth/callback/line
   ```

4. **How to Enter Multiple URLs**:
   - **Method 1**: Enter each URL on a separate line in the callback URL text field
   - **Method 2**: Press Enter after each URL to create line breaks
   - **Method 3**: Some versions have an "Add URL" button for multiple entries

5. **Save Configuration**:
   - Click **"Update"** or **"Save"** to save the changes
   - Verify both URLs appear in the callback URL list

**Visual Example of Callback URL Field:**
```
Callback URLs:
┌─────────────────────────────────────────────────────┐
│ http://localhost:3000/api/auth/callback/line       │
│ https://line-shop.aivinz.xyz/api/auth/callback/line │
└─────────────────────────────────────────────────────┘
```

**Why Both URLs Are Required:**
- **Development URL**: For local testing when running `npm run dev`
- **Production URL**: For your deployed Coolify application
- **Same credentials**: Use the same LINE Login channel for both environments

#### Scopes
Enable the following scopes:
- ✅ `profile` (required) - Basic profile information
- ✅ `openid` (required) - OpenID Connect
- ✅ `email` (optional) - Email address

#### Email Permission
If you want to access user email addresses:
1. Go to "Permissions" tab
2. Apply for "Email address permission"
3. Wait for approval (usually takes 1-2 business days)

## Step 5: Update Environment Variables

### Development Environment (.env.local)
Create or update your `.env.local` file for localhost development:

```env
# NextAuth.js Configuration (Development)
NEXTAUTH_SECRET="xCf1ogtxdSRpBZXIYxDSpZ+AllgRsyOm1pDnyz3LPqw="
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_DEBUG=true

# LINE Login Configuration
LINE_CLIENT_ID="2007628106"
LINE_CLIENT_SECRET="1142c0abf2cca23bbcc281f1c63a5a65"
```

### Production Environment (.env)
Your production `.env` file should have:

```env
# NextAuth.js Configuration (Production)
NEXTAUTH_SECRET="xCf1ogtxdSRpBZXIYxDSpZ+AllgRsyOm1pDnyz3LPqw="
NEXTAUTH_URL="https://line-shop.aivinz.xyz"
NEXTAUTH_DEBUG=false

# LINE Login Configuration (same credentials)
LINE_CLIENT_ID="2007628106"
LINE_CLIENT_SECRET="1142c0abf2cca23bbcc281f1c63a5a65"
```

### Generate NEXTAUTH_SECRET

You can generate a secure secret using:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## Step 6: Test LINE Login

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/auth/login`
3. Click "Continue with LINE" button
4. You should be redirected to LINE's authorization page
5. After granting permission, you should be redirected back to your app

## Step 7: Production Setup

For production deployment:

1. Update `NEXTAUTH_URL` to your production domain
2. Add production callback URL to LINE Login settings
3. Ensure HTTPS is enabled (required for production)
4. Test the complete flow in production environment

## Troubleshooting

### Common Issues

#### "Invalid redirect_uri" Error
- Check that your callback URL exactly matches what's configured in LINE Login settings
- Ensure protocol (http/https) matches your environment
- Verify there are no trailing slashes or typos
- **Solution**: Go to LINE Developers Console → Your Channel → LINE Login tab → Update callback URLs

#### "Invalid client_id" Error
- Double-check your `LINE_CLIENT_ID` environment variable
- Ensure the Channel ID is copied correctly from LINE Developers Console
- **Solution**: Copy Channel ID from Basic Settings tab, not Channel Secret

#### "Forbidden" Error
- Verify your `LINE_CLIENT_SECRET` is correct
- Check that the channel is active and not suspended
- **Solution**: Copy Channel Secret from Basic Settings tab

#### Email Not Available
- Email permission requires approval from LINE
- Users can still sign up without email if permission is not granted
- Email will be null in the user session if not available

#### Multiple Callback URL Issues
- **Problem**: Only one URL works, other gives redirect_uri error
- **Cause**: URLs not properly separated in LINE Console
- **Solution**: Ensure each URL is on a separate line with proper line breaks

#### Channel Status Issues
- **Problem**: "Channel is not available" error
- **Cause**: Channel may be suspended or under review
- **Solution**: Check channel status in Basic Settings tab

#### Local Development Not Working
- **Problem**: LINE Login works in production but not localhost
- **Cause**: Missing localhost callback URL in LINE Console
- **Solution**: Add `http://localhost:3000/api/auth/callback/line` to callback URLs

#### Production HTTPS Issues
- **Problem**: "Protocol error" in production
- **Cause**: LINE requires HTTPS for production environments
- **Solution**: Ensure your production URL uses HTTPS and is properly configured

### Debug Mode

Enable debug mode for development:

```env
NEXTAUTH_DEBUG=true
```

This will show detailed logs in the console for troubleshooting.

## Verification Steps

### Development Environment Verification

1. **Check Environment Variables**:
   ```bash
   # Verify .env.local exists and contains:
   cat .env.local | grep -E "(NEXTAUTH_URL|LINE_CLIENT)"
   ```

2. **Test LOCAL Callback URL**:
   ```bash
   # Start development server
   npm run dev
   
   # Open in browser and test login
   open http://localhost:3000/auth/login
   ```

3. **Verify LINE Console Configuration**:
   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Check callback URLs include: `http://localhost:3000/api/auth/callback/line`
   - Verify Channel ID matches your `LINE_CLIENT_ID`

### Production Environment Verification

1. **Check Production Environment**:
   ```bash
   # Verify .env contains production values
   cat .env | grep -E "(NEXTAUTH_URL|LINE_CLIENT)"
   ```

2. **Test PRODUCTION Callback URL**:
   - Open your production URL: `https://line-shop.aivinz.xyz/auth/login`
   - Attempt LINE Login
   - Verify successful authentication and redirect

3. **Verify HTTPS Configuration**:
   ```bash
   # Test HTTPS connectivity
   curl -I https://line-shop.aivinz.xyz/api/auth/callback/line
   ```

### Complete Flow Verification

1. **Development Flow**:
   ```
   localhost:3000/auth/login → LINE → localhost:3000/api/auth/callback/line → Success
   ```

2. **Production Flow**:
   ```
   line-shop.aivinz.xyz/auth/login → LINE → line-shop.aivinz.xyz/api/auth/callback/line → Success
   ```

3. **Check Database Integration**:
   ```bash
   # Verify user creation in database
   npm run db:studio
   # Check Users table for new LINE authenticated users
   ```

### LINE Console Final Checklist

- ✅ Both callback URLs added and saved
- ✅ Channel ID copied to environment variables
- ✅ Channel Secret copied to environment variables  
- ✅ Required scopes enabled (profile, openid, email)
- ✅ Channel status is "Active"
- ✅ App type set to "Web app"

## Security Considerations

1. **Never commit secrets**: Keep your `LINE_CLIENT_SECRET` secure and never commit it to version control
2. **Use HTTPS in production**: LINE Login requires HTTPS for production environments
3. **Validate redirect URLs**: Only add trusted domains to your callback URL list
4. **Rotate secrets regularly**: Change your channel secret periodically for better security

## Additional Resources

- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)
- [NextAuth.js LINE Provider](https://next-auth.js.org/providers/line)
- [LINE Developers Console](https://developers.line.biz/console/)

## Support

If you encounter issues:
1. Check the LINE Developers Console for error messages
2. Review NextAuth.js debug logs
3. Consult LINE Login documentation
4. Contact LINE Developer Support if needed