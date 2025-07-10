import { getAEMAuthor, getAEMPublish } from '../../scripts/endpointconfig.js';
import { initializeMaps, getUserCity } from '../../scripts/google-maps.js';
import { getLanguage } from '../../scripts/utils.js';

/**
 * Listings Carousel Block
 * Displays real estate listings in a carousel format with Google Maps integration
 */

// Function to fetch listings from API
async function fetchListings(endpoint, cachebuster) {
  const aemurl = getAEMAuthor();
  const locale = getLanguage();
  const url = `${aemurl}/graphql/execute.json/securbank/${endpoint};locale=${locale}?ts=${cachebuster}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.listingList?.items || [];
}

export default async function decorate(block) {
  const props = [...block.children];
  const personalization = props[0]?.textContent.trim() || '';
  const configuredTag = props[1]?.textContent.trim() || '';
  const cachebuster = Math.floor(Math.random() * 1000);
  
  try {
    let listings = [];
    let city = configuredTag;
    
    // Only use personalization if a valid option is selected
    if (personalization === 'taxonomy' && configuredTag) {
      const endpoint = `ListingsByTag;tag=${configuredTag}`;
      listings = await fetchListings(endpoint, cachebuster);
      console.log(`Tried configured tag "${configuredTag}": ${listings.length} listings found`);
    } else if (personalization === 'geolocation') {
      try {
        const userCity = await getUserCity();
        const cityTag = userCity.toLowerCase();
        const endpoint = `ListingsByTag;tag=${cityTag}`;
        listings = await fetchListings(endpoint, cachebuster);
        city = userCity; // Keep original case for display
        console.log(`Tried user's city "${cityTag}": ${listings.length} listings found`);
      } catch (error) {
        console.warn('Could not get user location:', error);
      }
    }
    
    // If no listings found or no valid personalization, use the fallback API
    if (listings.length === 0) {
      try {
        const endpoint = 'ListingList';
        listings = await fetchListings(endpoint, cachebuster);
        console.log(`Tried ListingList API: ${listings.length} listings found`);
        // Reset city since we're showing all listings, not city-specific ones
        city = '';
      } catch (error) {
        console.warn('ListingList API failed:', error);
      }
    }
    
    // If still no listings, show a message
    if (listings.length === 0) {
      block.innerHTML = `
        <div class="listings-carousel">
          <h2 class="carousel-title">Featured Listings</h2>
          <p class="no-listings-message">
            No listings available at the moment. Please check back later.
          </p>
        </div>
      `;
      return;
    }
    
    // Create carousel structure
    const carousel = document.createElement('div');
    carousel.classList.add('listings-carousel');
    
    // Add title with context about what was used
    const titleElement = document.createElement('h2');
    titleElement.classList.add('carousel-title');
    if (city) {
      titleElement.textContent = `Featured Listings in ${city}`;
    } else {
      titleElement.textContent = 'Featured Listings';
    }
    carousel.appendChild(titleElement);
    
    // Create carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.classList.add('carousel-container');
    
    // Create carousel track
    const carouselTrack = document.createElement('div');
    carouselTrack.classList.add('carousel-track');
    
    // Generate listing cards
    listings.forEach((listing) => {
      const card = document.createElement('div');
      card.classList.add('carousel-item', 'listing-card');
      
      const imageUrl = listing.image?._publishUrl || '';
      const dynamicUrl = "";//listing.image?._dynamicUrl ? `${getAEMPublish()}${listing.image._dynamicUrl}` : '';
      const imageAlt = listing.image?.title || listing.title || 'Property listing image';
      const formattedRent = new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
      }).format(listing.monthlyRent);
      
      // Create responsive image with srcset
      let imageHtml = '';
      /* if (dynamicUrl) {
        imageHtml = `<img src="${dynamicUrl}?width=200&height=150&fit=crop&preferwebp=true" 
          srcset="${dynamicUrl}?width=200&height=150&fit=crop&preferwebp=true 200w,
                  ${dynamicUrl}?width=300&height=225&fit=crop&preferwebp=true 300w,
                  ${dynamicUrl}?width=400&height=300&fit=crop&preferwebp=true 400w"
          sizes="(max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
          alt="${imageAlt}" loading="lazy">`;
      } else  */if (imageUrl) {
        imageHtml = `<img src="${imageUrl}" alt="${imageAlt}" loading="lazy">`;
      }
      
      card.innerHTML = `
        <div class="listing-image">
          ${imageHtml}
        </div>
        <div class="listing-content">
          <h3 class="listing-title">${listing.title}</h3>
          <p class="listing-address">${listing.address}</p>
          <div class="listing-details">
            <span class="bedrooms">${listing.bedrooms} bed</span>
            <span class="bathrooms">${listing.bathrooms} bath</span>
            <span class="rent">${formattedRent}/month</span>
          </div>
          <div class="listing-description">
            ${listing.description?.html || listing.description?.plaintext || ''}
          </div>
          <div class="listing-map" data-address="${listing.address}"></div>
        </div>
      `;
      
      carouselTrack.appendChild(card);
    });
    
    carouselContainer.appendChild(carouselTrack);
    carousel.appendChild(carouselContainer);
    
    // Add navigation buttons
    const navigation = document.createElement('div');
    navigation.classList.add('carousel-nav');
    navigation.innerHTML = `
      <button class="carousel-prev" aria-label="Previous listing">‹</button>
      <button class="carousel-next" aria-label="Next listing">›</button>
    `;
    carousel.appendChild(navigation);
    
    // Clear block and add carousel
    block.textContent = '';
    block.appendChild(carousel);
    
    // Initialize carousel functionality
    initializeCarousel(carousel);
    
    // Initialize maps after carousel is set up
    initializeListingMaps();
    
  } catch (error) {
    console.error('Error loading listings:', error);
    block.innerHTML = `
      <div class="listings-carousel">
        <h2 class="carousel-title">Featured Listings</h2>
        <p class="error-message">Error loading listings. Please try again later.</p>
      </div>
    `;
  }
}

// Function to initialize maps for all listings
async function initializeListingMaps() {
  try {
    // Get all map containers
    const mapContainers = document.querySelectorAll('.listing-map');
    
    // Create map configurations
    const mapConfigs = Array.from(mapContainers).map(container => ({
      container,
      address: container.getAttribute('data-address'),
      options: {} // Use default options
    })).filter(config => config.address); // Only include containers with addresses
    
    // Initialize all maps
    await initializeMaps(mapConfigs);
  } catch (error) {
    console.error('Error initializing listing maps:', error);
  }
}

function initializeCarousel(carousel) {
  const track = carousel.querySelector('.carousel-track');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  const items = carousel.querySelectorAll('.carousel-item');
  
  let currentIndex = 0;
  const itemWidth = 100 / 3; // Show 3 items at a time
  
  function updateCarousel() {
    const translateX = -currentIndex * itemWidth;
    track.style.transform = `translateX(${translateX}%)`;
    
    // Update button states
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= items.length - 3;
  }
  
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentIndex < items.length - 3) {
      currentIndex++;
      updateCarousel();
    }
  });
  
  // Initialize
  updateCarousel();
} 