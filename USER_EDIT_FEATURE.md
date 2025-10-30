# User Edit Feature - Admin Panel

## Overview
Added functionality for admins to edit user information from the user details page.

## Changes Made

### 1. Backend (Server)

#### Admin Controller (`credio-server/src/controllers/adminController.ts`)
Added new function `updateUserInfo`:
- Accepts: `name`, `email`, `phoneNumber` (all optional)
- Updates only provided fields
- Returns updated user object
- Logs admin action for audit trail

#### Admin Routes (`credio-server/src/routes/adminRoutes.ts`)
Added new route:
```
PATCH /api/admin/users/:id
```
With validation for:
- `name` (optional string)
- `email` (optional email)
- `phoneNumber` (optional string)

### 2. Frontend (Client)

#### API Client (`credio-client/lib/api-client.ts`)
Added new method:
```typescript
updateAdminUserInfo(userId: string, data: {
  name?: string
  email?: string
  phoneNumber?: string
})
```

#### User Details Page (`credio-client/app/(admin)/admin/users/[id]/page.tsx`)
Added features:
- **Edit Info Button** in header
- **Edit Dialog** with form fields for:
  - Name
  - Email
  - Phone Number
- **Form State Management** with React hooks
- **Mutation Hook** for API call with loading states
- **Success/Error Toasts** for user feedback
- **Auto-refresh** of user data after successful update

## User Flow

1. Admin navigates to user details page (`/admin/users/[id]`)
2. Clicks "Edit Info" button in header
3. Dialog opens with current user information pre-filled
4. Admin modifies desired fields
5. Clicks "Update User" button
6. API call is made to update user
7. Success toast appears
8. Dialog closes
9. User data refreshes automatically
10. Updated information is displayed

## Features

### Edit Dialog
- Pre-fills current user data
- Validates email format
- Shows loading state during update
- Handles errors gracefully
- Can be cancelled without saving

### Security
- Only accessible by ADMIN role users
- Requires authentication token
- Validates user ID (UUID format)
- Logs all admin actions

### Data Validation
Server-side validation ensures:
- Valid UUID for user ID
- Valid email format if provided
- String types for name and phone

## Testing

1. Login as admin (`admin@credio.com` / `Admin@123456`)
2. Navigate to Users page (`/admin/users`)
3. Click on any user to view details
4. Click "Edit Info" button
5. Modify user information
6. Click "Update User"
7. Verify success toast appears
8. Verify user information is updated on the page
9. Refresh page to confirm changes persisted

## API Endpoint

**Request:**
```http
PATCH /api/admin/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Updated Name",
      "email": "newemail@example.com",
      "phoneNumber": "+1234567890",
      "role": "USER",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Notes
- All fields are optional - only provided fields will be updated
- Email uniqueness is enforced by database constraints
- Phone number format is not validated (can be any string)
- Changes are logged for audit purposes
