# SOS Location Permission & Status Fix

## Issues Fixed

### 1. SOS Not Requesting Location Permission
**Problem:** SOS button was using fallback location (0,0) without asking for permission.

**Solution:**
- Added `requestLocation()` function that uses browser's Geolocation API
- Requests location permission when SOS is activated
- Uses high accuracy mode for precise coordinates
- Falls back to stored location or (0,0) if permission denied
- Shows user-friendly message about location sharing

**Implementation:**
```typescript
const requestLocation = async () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        resolve({ latitude, longitude, address: `${lat}, ${lng}` })
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}
```

### 2. SOS Created in DISPATCHED State Instead of PENDING
**Problem:** SOS service was auto-dispatching requests after creation.

**Solution:**
- Changed initial status to remain as 'PENDING'
- Removed auto-dispatch after notifications
- Admin must manually dispatch from admin panel
- Notifications still sent immediately (responders, emergency services, contacts, admins)

**Changes in `sosService.ts`:**
```typescript
// Before
status: 'PENDING' → notifications → update to 'DISPATCHED'

// After  
status: 'PENDING' → notifications → stays 'PENDING'
```

## User Flow

### Creating SOS
1. User clicks SOS button
2. Confirmation dialog appears with location permission notice
3. User clicks "Activate SOS"
4. Browser requests location permission
5. If granted: Uses actual GPS coordinates
6. If denied: Falls back to stored/default location
7. SOS created with status: **PENDING**
8. Notifications sent to:
   - Emergency services
   - Nearby responders
   - Emergency contacts
   - Admin panel
9. User redirected to tracking page

### Admin Dispatch
1. Admin sees SOS in "PENDING" status
2. Admin reviews SOS details
3. Admin manually changes status to "DISPATCHED"
4. Responder can be assigned
5. Status can be updated through workflow:
   - PENDING → DISPATCHED → IN_PROGRESS → RESOLVED

## Location Permission

### Browser Prompt
When SOS is activated, browser shows:
```
[Your Site] wants to know your location
[Block] [Allow]
```

### Permission States
- **Granted:** Uses real-time GPS coordinates
- **Denied:** Uses fallback location with warning message
- **Prompt:** Asks user each time

### Location Accuracy
- `enableHighAccuracy: true` - Uses GPS for best accuracy
- `timeout: 10000` - 10 second timeout
- `maximumAge: 0` - Always get fresh location

## Status Workflow

### SOS Status States
1. **PENDING** - Awaiting admin review/dispatch
2. **DISPATCHED** - Responder assigned, en route
3. **IN_PROGRESS** - Responder on scene
4. **RESOLVED** - Emergency resolved
5. **CANCELLED** - False alarm or cancelled

### Admin Actions
From admin panel (`/admin/sos`):
- View all SOS requests
- Filter by status, severity, type
- Assign responders
- Update status
- Add notes
- View location on map

## Testing

### Test Location Permission
1. Clear browser location permissions
2. Navigate to `/emergency/sos`
3. Click SOS button
4. Click "Activate SOS"
5. Browser should prompt for location
6. Grant permission
7. Check console for coordinates
8. Verify SOS created with real location

### Test PENDING Status
1. Create new SOS request
2. Check database: `node check-sos-requests.js`
3. Verify status is "PENDING"
4. Check admin panel
5. Verify SOS appears in pending list
6. Manually dispatch from admin panel

### Test Location Denial
1. Deny location permission
2. Create SOS
3. Verify fallback location used
4. Check warning message in console

## Database Verification

Run this to check SOS status:
```bash
cd credio-server
node check-sos-requests.js
```

Should show:
- Status: PENDING (for new SOS)
- Location: Real coordinates (if permission granted)
- Location: "Unknown location" or fallback (if denied)

## API Response

### Create SOS Response
```json
{
  "success": true,
  "data": {
    "sosId": "uuid",
    "status": "PENDING",
    "estimatedResponse": "Awaiting dispatch",
    "trackingUrl": "http://..."
  }
}
```

## Notes

- Location permission is requested at SOS activation time
- Notifications are sent even in PENDING state
- Admin must manually dispatch for workflow to continue
- Location accuracy depends on device GPS capability
- Indoor locations may have reduced accuracy
- Browser must support Geolocation API

## Future Enhancements

- [ ] Reverse geocoding for human-readable addresses
- [ ] Show map preview before sending SOS
- [ ] Save location permission preference
- [ ] Background location tracking during emergency
- [ ] Offline SOS queueing
- [ ] Location history for tracking
- [ ] Multiple location updates during emergency
