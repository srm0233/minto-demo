/**
 * Google Maps Utility Script
 * Provides reusable Google Maps functionality for the application
 */

// Global variable to track if Google Maps API is loaded
let isGoogleMapsLoaded = false;

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyB5cFEO6DwkOmdGzAg-s8BiQgiFymCH1mk';

/**
 * Load Google Maps API
 * @returns {Promise} Promise that resolves when API is loaded
 */
export function loadGoogleMapsAPI() {
  if (isGoogleMapsLoaded) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Get user's city from their current location
 * @returns {Promise<string>} Promise that resolves to the city name
 */
export function getUserCity() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await loadGoogleMapsAPI();
          
          const geocoder = new google.maps.Geocoder();
          const latlng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
              // Find the city from address components
              const addressComponents = results[0].address_components;
              const cityComponent = addressComponents.find(component => 
                component.types.includes('locality') || 
                component.types.includes('administrative_area_level_2')
              );
              
              if (cityComponent) {
                resolve(cityComponent.long_name);
              } else {
                // Fallback: try to extract city from formatted address
                const formattedAddress = results[0].formatted_address;
                const cityMatch = formattedAddress.match(/^([^,]+)/);
                resolve(cityMatch ? cityMatch[1] : 'Unknown City');
              }
            } else {
              reject(new Error('Could not determine city from location'));
            }
          });
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Create a map for a specific address
 * @param {HTMLElement} container - The container element for the map
 * @param {string} address - The address to geocode and display
 * @param {Object} options - Optional map configuration
 * @returns {Promise} Promise that resolves when map is created
 */
export async function createAddressMap(container, address, options = {}) {
  try {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const defaultOptions = {
            center: results[0].geometry.location,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          };
          
          const mapOptions = { ...defaultOptions, ...options };
          const map = new google.maps.Map(container, mapOptions);
          
          // Add marker
          const marker = new google.maps.Marker({
            position: results[0].geometry.location,
            map: map,
            title: address
          });
          
          resolve({ map, marker, location: results[0].geometry.location });
        } else {
          // If geocoding fails, show a placeholder
          container.innerHTML = '<div class="map-placeholder">Map unavailable</div>';
          reject(new Error(`Geocoding failed for address: ${address}`));
        }
      });
    });
  } catch (error) {
    console.error('Error creating map:', error);
    container.innerHTML = '<div class="map-placeholder">Map unavailable</div>';
    throw error;
  }
}

/**
 * Initialize maps for multiple containers with addresses
 * @param {Array} mapConfigs - Array of { container, address, options } objects
 * @returns {Promise} Promise that resolves when all maps are created
 */
export async function initializeMaps(mapConfigs) {
  try {
    await loadGoogleMapsAPI();
    
    const mapPromises = mapConfigs.map(({ container, address, options }) => 
      createAddressMap(container, address, options)
    );
    
    return Promise.allSettled(mapPromises);
  } catch (error) {
    console.error('Error initializing maps:', error);
    // Show placeholder for all maps
    mapConfigs.forEach(({ container }) => {
      container.innerHTML = '<div class="map-placeholder">Map unavailable</div>';
    });
    throw error;
  }
}

/**
 * Create a simple map for a single address (convenience function)
 * @param {HTMLElement} container - The container element
 * @param {string} address - The address to display
 * @returns {Promise} Promise that resolves when map is created
 */
export async function createSimpleMap(container, address) {
  return createAddressMap(container, address);
} 