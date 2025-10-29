import { create } from 'zustand'

interface Location {
  latitude: number
  longitude: number
  address: string
}

interface LocationState {
  currentLocation: Location | null
  isTracking: boolean
  watchId: number | null
  setLocation: (location: Location) => void
  startTracking: () => void
  stopTracking: () => void
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isTracking: false,
  watchId: null,

  setLocation: (location) => set({ currentLocation: location }),

  startTracking: () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Reverse geocode to get address
        const address = await reverseGeocode(latitude, longitude)

        set({
          currentLocation: { latitude, longitude, address },
          isTracking: true,
        })
      },
      (error) => {
        console.error('Geolocation error:', error)
        set({ isTracking: false })
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )

    set({ watchId, isTracking: true })
  },

  stopTracking: () => {
    const { watchId } = get()
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      set({ watchId: null, isTracking: false })
    }
  },
}))

// Helper function for reverse geocoding
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    )
    const data = await response.json()
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  } catch (error) {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }
}
