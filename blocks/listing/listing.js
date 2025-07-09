import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { div, img, h1, p, span } from '../../scripts/dom-helpers.js';

/**
 * Listing Block
 * Displays a single real estate listing with detailed information in a 3-column layout
 */

// Function to fetch listing data from API
async function fetchListing(path, cachebuster) {
  const aempublishurl = getAEMPublish();
  const url = `${aempublishurl}/graphql/execute.json/securbank/ListingByPath;path=${path}?ts=${cachebuster}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.listingByPath?.item;
}

export default async function decorate(block) {
  // Get the listing path from the block configuration
  const listingPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const cachebuster = Math.floor(Math.random() * 1000);
  
  if (!listingPath) {
    block.innerHTML = '<p>No Listing Path provided.</p>';
    return;
  }
  
  try {
    // Fetch listing data
    const listing = await fetchListing(listingPath, cachebuster);
    
    if (!listing) {
      block.innerHTML = '<p>No listing data found.</p>';
      return;
    }
    
    // Format the monthly rent
    const formattedRent = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(listing.monthlyRent);
    
    // Create the 3-column layout
    const listingBlock = div({ class: 'listing-block' },
      // Column 1: Thumbnail and Description
      div({ class: 'listing-col col1' },
        img({ 
          class: 'listing-thumbnail', 
          src: listing.thumbnail?._publishUrl, 
          alt: listing.title || 'Property thumbnail',
          loading: 'lazy'
        }),
        div({ 
          class: 'listing-description',
          innerHTML: listing.description?.html || listing.description?.plaintext || ''
        })
      ),
      
      // Column 2: Property Details
      div({ class: 'listing-col col2' },
        h1({ class: 'listing-title' }, listing.title),
        p({ class: 'listing-address' }, listing.address),
        div({ class: 'listing-details' },
          span({ class: 'listing-bed' }, `${listing.bedrooms} bed`),
          span({ class: 'listing-bath' }, `${listing.bathrooms} bath`),
          span({ class: 'listing-rent' }, `${formattedRent}/month`)
        ),
        div({ class: 'listing-region' },
          p({ class: 'region-label' }, 'Region:'),
          p({ class: 'region-value' }, listing.region?.[0]?.split('/').pop() || 'N/A')
        )
      ),
      
      // Column 3: Main Image
      div({ class: 'listing-col col3' },
        img({ 
          class: 'listing-image', 
          src: listing.image?._publishUrl, 
          alt: listing.title || 'Property image',
          loading: 'lazy'
        })
      )
    );
    
    // Clear block and add listing content
    block.textContent = '';
    block.appendChild(listingBlock);
    
  } catch (error) {
    console.error('Error loading listing:', error);
    block.innerHTML = `
      <div class="listing-block">
        <p class="error-message">Error loading listing. Please try again later.</p>
      </div>
    `;
  }
} 