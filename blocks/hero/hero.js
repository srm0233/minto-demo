import { readBlockConfig } from '../../scripts/aem.js';
import { div, h1, p } from '../../scripts/dom-helpers.js';

/**
 * Hero Block
 * Displays a hero section with responsive image and text content
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  
  // Get the image element from the block
  const imageElement = block.querySelector('img');
  const textContent = block.querySelector('h1, p');
  
  if (!imageElement) {
    console.error('No image found in hero block');
    return;
  }

  // Get image source and alt text
  const imageSrc = imageElement.getAttribute('src');
  const altText = config.imagealt || imageElement.getAttribute('alt') || 'Hero image';
  
  if (!imageSrc) {
    console.error('No image source found in hero block');
    return;
  }

  // Extract image name from the source path
  // Expected format: /content/dam/.../imageName.extension
  const imageName = imageSrc.split('/').pop().split('.')[0];
  
  // Default Dynamic Media URL
  const dmUrl = 'https://smartimaging.scene7.com/is/image/DynamicMediaNA';

  // Build the full DM URL (replace with your actual DM asset if needed)
  const dmAssetUrl = `${dmUrl}/${imageName}`;
  
  // Create new image element for S7 responsive image
  const s7Image = document.createElement('img');
  s7Image.id = 'responsiveImage';
  s7Image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  s7Image.setAttribute('data-src', dmAssetUrl);
  s7Image.setAttribute('alt', altText);
  s7Image.setAttribute('data-breakpoints', '360,720,940');
  s7Image.setAttribute('style', 'max-width: 100%; height: auto;');
  
  // Create hero structure
  const heroContainer = div({ class: 'hero-container' },
    div({ class: 'hero-image' }, s7Image),
    div({ class: 'hero-content' },
      textContent ? textContent.cloneNode(true) : ''
    )
  );
  
  // Clear block and add new structure
  block.innerHTML = '';
  block.appendChild(heroContainer);
  
  // Apply S7 responsive image if function is available
  if (typeof s7responsiveImage === 'function') {
    s7responsiveImage(s7Image);
  } else {
    console.warn('s7responsiveImage function not available, using fallback image');
    // Fallback to original image if S7 is not available
    s7Image.setAttribute('src', imageSrc);
  }
}
