# Authentication Setup

This app uses Auth.js for authentication with email/password login only. Signup is disabled - users must be created by the super admin.
// Clerk environment variables removed

## Super Admin User Management

- Only the super admin (admin@cautiousndlovu.co.za) can add, edit, or block users.
- Users cannot sign up themselves.

# Clerk Authentication Setup

This app uses Clerk for authentication with email/password login only. Signup is disabled - users must be created from the Clerk Dashboard.

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
```

## Clerk Dashboard Configuration

1. **Disable Signup**:
   - Go to your Clerk Dashboard → User & Authentication → Email, Phone, Username
   - Disable "Allow users to sign up" option
   - Only enable "Email address" as an authentication method

2. **Create Users**:
   - Go to Users section in Clerk Dashboard
   - Click "Create user"
   - Enter email and password
   - User will be able to sign in with these credentials

3. **Configure Email/Password**:
   - Ensure email/password authentication is enabled
   - Configure email templates if needed

## Features

- ✅ Email/password authentication only
- ✅ Custom sign-in page matching app design
- ✅ Protected routes (all routes except `/sign-in`)
- ✅ User button in header for account management
- ✅ Automatic redirect to dashboard after sign-in

## Routes

- `/sign-in` - Custom sign-in page (public)
- All other routes are protected and require authentication
