import { getAEMAuthor, getAEMPublish } from '../../scripts/endpointconfig.js';
import { div, p, span, a } from '../../scripts/dom-helpers.js';

/**
 * Listing Block
 * Displays a single real estate listing with detailed information in a 3-column layout
 */

// Function to extract first paragraph content from HTML
function extractFirstParagraph(htmlContent) {
  if (!htmlContent) return '';
  
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Get the first p tag
  const firstParagraph = tempDiv.querySelector('p');
  
  if (firstParagraph) {
    return firstParagraph.textContent || firstParagraph.innerText || '';
  }
  
  // If no p tags found, return the plain text content
  return tempDiv.textContent || tempDiv.innerText || '';
}

// Function to fetch listing data from API
async function fetchListing(path, cachebuster) {
  const aemurl = getAEMAuthor();
  const url = `${aemurl}/graphql/execute.json/securbank/ListingByPath;path=${path}?ts=${cachebuster}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.listingList?.items[0];
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
    
    // Extract first paragraph from description
    const descriptionText = extractFirstParagraph(listing.description?.html || listing.description?.plaintext || '');
    
    // Create the 3-column layout
    const listingBlock = div({ class: 'listing-block' },
      // Column 1: Thumbnail and Description
      div({ class: 'listing-col col1' },
        (() => {
          const thumbnailUrl = listing.thumbnail?._publishUrl || '';
          const thumbnailDynamicUrl = listing.thumbnail?._dynamicUrl ? `${getAEMPublish()}${listing.thumbnail._dynamicUrl}` : '';
          const thumbnailAlt = listing.title || 'Property thumbnail';
          
          let thumbnailHtml = '';
          if (thumbnailDynamicUrl) {
            thumbnailHtml = `<img src="${thumbnailDynamicUrl}?width=200&height=150&fit=crop&preferwebp=true" 
              srcset="${thumbnailDynamicUrl}?width=200&height=150&fit=crop&preferwebp=true 200w,
                      ${thumbnailDynamicUrl}?width=300&height=225&fit=crop&preferwebp=true 300w,
                      ${thumbnailDynamicUrl}?width=400&height=300&fit=crop&preferwebp=true 400w"
              sizes="(max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
              alt="${thumbnailAlt}" loading="lazy" class="listing-thumbnail">`;
          } else if (thumbnailUrl) {
            thumbnailHtml = `<img src="${thumbnailUrl}" alt="${thumbnailAlt}" loading="lazy" class="listing-thumbnail">`;
          }
          
          const thumbnailDiv = div({ class: 'listing-thumbnail-container' });
          thumbnailDiv.innerHTML = thumbnailHtml;
          return thumbnailDiv;
        })(),
        (() => {
          const descDiv = div({ class: 'listing-description' });
          descDiv.innerHTML = descriptionText;
          return descDiv;
        })()
      ),
      
      // Column 2: Property Details
      div({ class: 'listing-col col2' },
        p({ class: 'listing-address' }, listing.address),
        div({ class: 'listing-details' },
          div({ class: 'listing-detail-item' },
            span({ class: 'detail-label' }, 'Home Type:'),
            span({ class: 'detail-value' }, listing.type || 'N/A')
          ),
          div({ class: 'listing-detail-item' },
            span({ class: 'detail-label' }, 'Bedrooms:'),
            span({ class: 'detail-value' }, `${listing.bedrooms} bed`)
          ),
          div({ class: 'listing-detail-item' },
            span({ class: 'detail-label' }, 'Starting From:'),
            span({ class: 'detail-value' }, `${formattedRent}/month`)
          )
        ),
        div({ class: 'listing-ctas' },
          a({ href: '#', class: 'cta-button email-cta' }, 'Email'),
          a({ href: '#', class: 'cta-button community-cta' }, 'Community')
        )
      ),
      
      // Column 3: Main Image
      div({ class: 'listing-col col3' },
        (() => {
          const imageUrl = listing.image?._publishUrl || '';
          const dynamicUrl = listing.image?._dynamicUrl ? `${getAEMPublish()}${listing.image._dynamicUrl}` : '';
          const imageAlt = listing.image?.title || listing.title || 'Property image';
          
          let imageHtml = '';
          if (dynamicUrl) {
            imageHtml = `<img src="${dynamicUrl}?width=400&height=300&fit=crop&preferwebp=true" 
              srcset="${dynamicUrl}?width=400&height=300&fit=crop&preferwebp=true 400w,
                      ${dynamicUrl}?width=600&height=450&fit=crop&preferwebp=true 600w,
                      ${dynamicUrl}?width=800&height=600&fit=crop&preferwebp=true 800w,
                      ${dynamicUrl}?width=1000&height=750&fit=crop&preferwebp=true 1000w"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 35vw, 35vw"
              alt="${imageAlt}" loading="lazy" class="listing-image">`;
          } else if (imageUrl) {
            imageHtml = `<img src="${imageUrl}" alt="${imageAlt}" loading="lazy" class="listing-image">`;
          }
          
          const imageDiv = div({ class: 'listing-image-container' });
          imageDiv.innerHTML = imageHtml;
          return imageDiv;
        })(),
        div({ class: 'community-closeout' }, 'Community Closeout')
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