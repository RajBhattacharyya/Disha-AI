export const dataSources = {
  noaa: {
    name: "NOAA Weather API",
    endpoint: "https://api.weather.gov/alerts",
    apiKey: process.env.NOAA_API_KEY,
  },
  usgs: {
    name: "USGS Earthquake API",
    endpoint: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  },
  nasaFirms: {
    name: "NASA FIRMS",
    endpoint: "https://firms.modaps.eosdis.nasa.gov/api/area/",
    apiKey: process.env.NASA_API_KEY,
  },
  openMeteo: {
    name: "Open-Meteo API",
    endpoint: "https://api.open-meteo.com/v1/forecast",
  },
}
