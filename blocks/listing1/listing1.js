mport { getAEMPublish } from '../../scripts/endpointconfig.js';
import { div, p, span, a } from '../../scripts/dom-helpers.js';

/**
 * listing1 Block
 * Displays a single real estate listing1 with detailed information in a 3-column layout
 */

// Function to fetch listing1 data from API
async function fetchlisting1(path, cachebuster) {
  const aemurl = getAEMPublish();
  const url = `${aemurl}/graphql/execute.json/securbank/listing1ByPath;path=${path}?ts=${cachebuster}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.listing1List?.items[0];
}

export default async function decorate(block) {
  // Get the listing1 path from the block configuration
  const listing1Path = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const cachebuster = Math.floor(Math.random() * 1000);
  
  if (!listing1Path) {
    block.innerHTML = '<p>No listing1 Path provided.</p>';
    return;
  }
  
  try {
    // Fetch listing1 data
    const listing1 = await fetchlisting1(listing1Path, cachebuster);
    
    if (!listing1) {
      block.innerHTML = '<p>No listing1 data found.</p>';
      return;
    }
    
    // Format the monthly rent
    const formattedRent = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(listing1.monthlyRent);
    
    // Create the 3-column layout
    const listing1Block = div({ class: 'listing1-block' },
      // Column 1: Thumbnail and Description
      div({ class: 'listing1-col col1' },
        (() => {
          const thumbnailUrl = listing1.thumbnail?._publishUrl || '';
          const thumbnailDynamicUrl = listing1.thumbnail?._dynamicUrl ? `${getAEMPublish()}${listing1.thumbnail._dynamicUrl}` : '';
          const thumbnailAlt = listing1.title || 'Property thumbnail';
          
          let thumbnailHtml = '';
          if (thumbnailDynamicUrl) {
            thumbnailHtml = `<img src="${thumbnailDynamicUrl}?width=200&height=150&fit=crop&preferwebp=true" 
              srcset="${thumbnailDynamicUrl}?width=200&height=150&fit=crop&preferwebp=true 200w,
                      ${thumbnailDynamicUrl}?width=300&height=225&fit=crop&preferwebp=true 300w,
                      ${thumbnailDynamicUrl}?width=400&height=300&fit=crop&preferwebp=true 400w"
              sizes="(max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
              alt="${thumbnailAlt}" loading="lazy" class="listing1-thumbnail">`;
          } else if (thumbnailUrl) {
            thumbnailHtml = `<img src="${thumbnailUrl}" alt="${thumbnailAlt}" loading="lazy" class="listing1-thumbnail">`;
          }
          
          const thumbnailDiv = div({ class: 'listing1-thumbnail-container' });
          thumbnailDiv.innerHTML = thumbnailHtml;
          return thumbnailDiv;
        })(),
        (() => {
          const descDiv = div({ class: 'listing1-description' });
          const descriptionContent = listing1.description?.html || listing1.description?.plaintext || '';
          
          // Create a temporary div to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = descriptionContent;
          
          // Keep only the first paragraph tag
          const paragraphs = tempDiv.querySelectorAll('p');
          if (paragraphs.length > 1) {
            // Remove all paragraphs except the first one
            for (let i = 1; i < paragraphs.length; i++) {
              paragraphs[i].remove();
            }
          }
          
          descDiv.innerHTML = tempDiv.innerHTML;
          return descDiv;
        })()
      ),
      
      // Column 2: Property Details and CTAs
      div({ class: 'listing1-col col2' },
        p({ class: 'listing1-address' }, listing1.address),
        div({ class: 'listing1-details' },
          div({ class: 'listing1-detail-item' },
            span({ class: 'detail-label' }, 'Home Type:'),
            span({ class: 'detail-value' }, listing1.type || 'N/A')
          ),
          div({ class: 'listing1-detail-item' },
            span({ class: 'detail-label' }, 'Bedrooms:'),
            span({ class: 'detail-value' }, `${listing1.bedrooms} bed`)
          ),
          div({ class: 'listing1-detail-item' },
            span({ class: 'detail-label' }, 'Starting From:'),
            span({ class: 'detail-value' }, `${formattedRent}/month`)
          )
        ),
        div({ class: 'listing1-ctas' },
          a({ href: '#', class: 'cta-button email-cta' }, 'Email'),
          a({ href: '#', class: 'cta-button community-cta' }, 'Community')
        )
      ),
      
      // Column 3: Main Image and Community Closeout
      div({ class: 'listing1-col col3' },
        (() => {
          const imageUrl = listing1.image?._publishUrl || '';
          const dynamicUrl = listing1.image?._dynamicUrl ? `${getAEMPublish()}${listing1.image._dynamicUrl}` : '';
          const imageAlt = listing1.image?.title || listing1.title || 'Property image';
          
          let imageHtml = '';
          if (dynamicUrl) {
            imageHtml = `<img src="${dynamicUrl}?width=400&height=300&fit=crop&preferwebp=true" 
              srcset="${dynamicUrl}?width=400&height=300&fit=crop&preferwebp=true 400w,
                      ${dynamicUrl}?width=600&height=450&fit=crop&preferwebp=true 600w,
                      ${dynamicUrl}?width=800&height=600&fit=crop&preferwebp=true 800w,
                      ${dynamicUrl}?width=1000&height=750&fit=crop&preferwebp=true 1000w"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 35vw, 35vw"
              alt="${imageAlt}" loading="lazy" class="listing1-image">`;
          } else if (imageUrl) {
            imageHtml = `<img src="${imageUrl}" alt="${imageAlt}" loading="lazy" class="listing1-image">`;
          }
          
          const imageDiv = div({ class: 'listing1-image-container' });
          imageDiv.innerHTML = imageHtml;
          return imageDiv;
        })(),
        div({ class: 'community-closeout' }, 'Community Closeout')
      )
    );
    
    // Clear block and add listing1 content
    block.textContent = '';
    block.appendChild(listing1Block);
    
  } catch (error) {
    console.error('Error loading listing1:', error);
    block.innerHTML = `
      <div class="listing1-block">
        <p class="error-message">Error loading listing1. Please try again later.</p>
      </div>
    `;
  }
} 
