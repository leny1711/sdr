# Fix: Users Not Displaying in Mobile App

## Problem Summary
**Issue:** "jarrive bien a me connecter a expo avec mon tel mes il naffiche pas les autre user portent cree avec le frontend"
- Translation: "I can successfully connect to Expo with my phone but it doesn't display the other users that were created with the frontend"

## Root Cause
The mobile app API service had inconsistent response parsing. The backend returns all API responses wrapped in a standard format:
```json
{
  "success": true,
  "data": { /* actual data here */ }
}
```

However, several API methods in the mobile app were only accessing `response.data` instead of `response.data.data`, which means they were receiving the wrapper object instead of the actual data array/object.

Additionally, there were parameter naming mismatches between the mobile app and backend API.

## What Was Fixed

### File Changed: `mobile/src/services/api.ts`

#### 1. Discovery Endpoint (Main Issue)
**Before:**
```typescript
async getDiscoverableUsers(): Promise<DiscoverableUser[]> {
  const response = await this.api.get<DiscoverableUser[]>('/discovery');
  return response.data; // ❌ Returns wrapper object
}
```

**After:**
```typescript
async getDiscoverableUsers(): Promise<DiscoverableUser[]> {
  const response = await this.api.get<{ success: boolean; data: DiscoverableUser[] }>('/discovery');
  return response.data.data; // ✅ Returns actual user array
}
```

#### 2. Like User Endpoint
**Issues:**
- Incorrect parameter name: sent `targetUserId` but backend expects `toUserId`
- Incorrect response parsing: backend returns `matched` field, not `match`
- Return type included unused `conversation` property

**Before:**
```typescript
async likeUser(targetUserId: string): Promise<{ match: boolean; conversation?: Conversation }> {
  const response = await this.api.post<{ match: boolean; conversation?: Conversation }>(
    '/discovery/like',
    { targetUserId } // ❌ Wrong parameter name
  );
  return response.data; // ❌ Wrong response structure
}
```

**After:**
```typescript
async likeUser(toUserId: string): Promise<{ match: boolean; matchId?: string }> {
  const response = await this.api.post<{ success: boolean; data: { matched: boolean; matchId?: string }; message: string }>(
    '/discovery/like',
    { toUserId } // ✅ Correct parameter name
  );
  return { match: response.data.data.matched, matchId: response.data.data.matchId }; // ✅ Correct parsing
}
```

#### 3. Dislike User Endpoint
**Issues:**
- Incorrect parameter name: sent `targetUserId` but backend expects `toUserId`
- Used `any` type, weakening type safety

**Before:**
```typescript
async dislikeUser(targetUserId: string): Promise<{ success: boolean }> {
  const response = await this.api.post<{ success: boolean }>('/discovery/dislike', {
    targetUserId, // ❌ Wrong parameter name
  });
  return response.data; // ❌ Wrong response structure
}
```

**After:**
```typescript
async dislikeUser(toUserId: string): Promise<{ success: boolean }> {
  const response = await this.api.post<{ success: boolean; data: { id: string; fromUserId: string; toUserId: string; isLike: boolean; createdAt: string } }>('/discovery/dislike', {
    toUserId, // ✅ Correct parameter name
  });
  return { success: response.data.success }; // ✅ Correct parsing with proper typing
}
```

#### 4. Other Endpoints
Also fixed similar issues in:
- `getProfile()` - Now correctly accesses `response.data.data`
- `updateProfile()` - Now correctly accesses `response.data.data`
- `getMatches()` - Now correctly accesses `response.data.data`
- `getConversation()` - Now correctly accesses `response.data.data`
- `getMessages()` - Now correctly accesses `response.data.data`
- `sendTextMessage()` - Now correctly accesses `response.data.data`

## How to Test

### Prerequisites
1. Backend server must be running on port 5000
2. Mobile app API configuration must point to your computer's IP (see QUICK_START.md)
3. Database must have multiple test users created (via frontend or backend)

### Testing Steps

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify Test Users Exist**
   - Create users via the frontend web app (http://localhost:5173)
   - Or directly in the database
   - You need at least 2-3 users to test discovery

3. **Start the Mobile App**
   ```bash
   cd mobile
   npx expo start
   ```

4. **Test on Your Phone**
   - Open Expo Go app
   - Scan the QR code
   - Login with a test user account

5. **Verify the Fix**
   - Navigate to the "Discovery" tab
   - You should now see other users displayed with their:
     - Name
     - Age
     - City
     - Description
   - The counter should show "X of Y" where Y > 0
   - You should be able to:
     - Like or Pass on users
     - Navigate through multiple profiles
     - See the "No More Profiles" message when you've seen all users

### Expected Behavior After Fix

✅ **Discovery Screen:**
- Shows user profiles one at a time
- Displays user information (name, age, city, description)
- Shows counter "1 of X" where X is the number of available users
- Like/Pass buttons work correctly
- Matching notification appears when there's a mutual match

✅ **Matches Screen:**
- Shows all mutual matches
- Each match displays the matched user's information

✅ **Profile Screen:**
- Shows current user's profile correctly
- Profile updates work correctly

### If Users Still Don't Appear

1. **Check Backend Logs**
   - Look for incoming GET requests to `/api/discovery`
   - Verify the response includes user data

2. **Check Mobile App Console**
   - Look for any error messages
   - Verify API calls are reaching the backend

3. **Verify API Configuration**
   ```typescript
   // mobile/src/config/api.ts should have:
   export const API_URL = 'http://YOUR_COMPUTER_IP:5000/api';
   ```

4. **Check CORS Configuration**
   ```env
   # backend/.env should have:
   CORS_ORIGIN=http://YOUR_COMPUTER_IP:5173
   ```

5. **Verify Database**
   - Check that users exist in the database with `isActive: true`
   - Verify the current user is not the only user in the database

## Technical Details

### Backend Response Format
All backend endpoints return responses in this format:
```typescript
{
  success: boolean;
  data: T; // The actual response data
  message?: string; // Optional message
  error?: string; // Error message if success is false
}
```

### Mobile App API Service Pattern
The correct pattern for parsing backend responses:
```typescript
async someEndpoint(): Promise<T> {
  const response = await this.api.get<{ success: boolean; data: T }>('/endpoint');
  return response.data.data; // Extract the data from the wrapper
}
```

## Related Files
- `/mobile/src/services/api.ts` - API service with all endpoint calls
- `/mobile/src/screens/DiscoveryScreen.tsx` - Discovery screen UI
- `/backend/src/controllers/discovery.controller.ts` - Backend discovery controller
- `/backend/src/services/discovery.service.ts` - Backend discovery service

## Commit
- Commit: `Fix API response parsing to correctly extract user data from backend responses`
- Branch: `copilot/fix-user-listing-issue`
