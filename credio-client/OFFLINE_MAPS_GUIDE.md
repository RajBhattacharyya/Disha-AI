# Offline Maps Feature Guide

## Overview
The offline maps feature allows users to view maps and nearby emergency services (hospitals, police stations, fire stations, pharmacies) even when internet connectivity is lost.

## How It Works

### 1. Data Caching
- **Emergency Locations**: When online, the app fetches nearby emergency services from Google Places API and stores them in IndexedDB
- **Map Tiles**: OpenStreetMap tiles are cached for offline viewing
- **User Location**: Last known location is cached for offline access
- **Cache Duration**: Data is cached for 7 days before expiring

### 2. Automatic Offline Detection
- The app automatically detects when the device goes offline
- Switches to offline map mode automatically
- Shows a clear indicator of offline status
- Displays cached emergency services data

### 3. Features Available Offline
- ✅ View cached map tiles (OpenStreetMap)
- ✅ See your last known location
- ✅ View nearby hospitals, police stations, fire stations, and pharmacies
- ✅ See distance to each emergency service
- ✅ Call emergency services (phone functionality works offline)
- ❌ Get real-time directions (requires internet)
- ❌ Fetch fresh disaster data (requires internet)

## Usage

### For Users

1. **While Online (Preparation)**:
   - Visit the map page at `/map`
   - Allow location permissions
   - The app will automatically cache nearby emergency services
   - Map tiles will be cached as you browse

2. **When Offline**:
   - The app automatically switches to offline mode
   - You'll see an "Offline Mode" badge
   - Cached emergency services are displayed
   - Click on any location to see details
   - Use the phone number to call (works offline)

3. **Manual Toggle**:
   - Click the "Online/Offline Map" button to manually switch between modes
   - Useful for testing or preferring offline maps

### For Developers

#### Backend Setup

1. **Add Google Maps API Key** to `.env`:
```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

2. **Enable Google Places API**:
   - Go to Google Cloud Console
   - Enable "Places API"
   - Create/use an API key with Places API access

#### Frontend Implementation

The offline maps feature uses:
- **Leaflet**: Lightweight map library
- **React-Leaflet**: React wrapper for Leaflet
- **IndexedDB (via idb)**: Client-side database for caching
- **OpenStreetMap**: Free map tiles that work offline

#### Key Components

1. **OfflineMapService** (`lib/services/offlineMapService.ts`):
   - Manages IndexedDB operations
   - Caches emergency locations
   - Handles distance calculations
   - Manages cache expiration

2. **OfflineMap Component** (`components/map/OfflineMap.tsx`):
   - Renders Leaflet map
   - Shows cached emergency locations
   - Handles online/offline detection
   - Custom markers for different location types

3. **Map Page** (`app/map/page.tsx`):
   - Integrates both Google Maps and Offline Maps
   - Switches between modes based on connectivity
   - Shows disaster zones when online
   - Shows emergency services when offline

## API Endpoints

### GET `/api/places/nearby`
Fetch nearby emergency services from Google Places API.

**Query Parameters**:
- `lat` (required): Latitude
- `lng` (required): Longitude
- `type` (required): Place type (hospital, police, fire_station, pharmacy)
- `radius` (optional): Search radius in meters (default: 5000)

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "City Hospital",
      "vicinity": "123 Main St",
      "geometry": {
        "location": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "rating": 4.5,
      "user_ratings_total": 250
    }
  ]
}
```

## Storage Structure

### IndexedDB Stores

1. **emergency-locations**:
   - Stores cached emergency service locations
   - Indexed by type and cached timestamp
   - Includes distance from user

2. **map-tiles**:
   - Stores map tile images as Blobs
   - Keyed by tile URL
   - Cached for 7 days

3. **user-location**:
   - Stores last known user location
   - Used as fallback when GPS unavailable

## Testing Offline Mode

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Refresh the page

### Firefox DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox

### Mobile Testing
1. Enable Airplane mode
2. Keep WiFi on but disconnect from network
3. Or use browser's offline mode

## Limitations

1. **Initial Cache Required**: Users must visit the map while online at least once
2. **Cache Expiration**: Data expires after 7 days
3. **No Real-time Updates**: Offline data is static
4. **Limited Map Area**: Only viewed areas are cached
5. **No Navigation**: Turn-by-turn directions require internet

## Future Enhancements

- [ ] Pre-cache larger map areas
- [ ] Offline routing using cached data
- [ ] Background sync when connection restored
- [ ] Progressive Web App (PWA) for better offline support
- [ ] Download specific regions for offline use
- [ ] Offline disaster alerts using cached data

## Troubleshooting

### Maps not loading offline
- Ensure you visited the map while online first
- Check if cache has expired (7 days)
- Clear browser cache and revisit while online

### No emergency services showing
- Location permissions must be granted
- Visit map while online to cache data
- Check if within 5km radius of cached locations

### Performance issues
- Clear old cache using browser DevTools
- Reduce cache duration if storage is limited
- Limit number of cached locations

## Browser Support

- ✅ Chrome/Edge (Chromium): Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (iOS 14+)
- ⚠️ IE11: Not supported (IndexedDB limitations)
