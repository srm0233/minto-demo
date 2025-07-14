import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const props = [...block.children];
  const imageElement = props[0]?.querySelector('picture img') || props[0]?.querySelector('img');
  const textContent = props[1]?.innerHTML || '';
  
  if (!imageElement) {
    console.warn('Hero block: No image found');
    return;
  }

  // Get image properties
  const imageSrc = imageElement.src;
  const imageAlt = imageElement.alt || 'Hero image';
  
  // Create optimized picture with high fetch priority for hero images
  const optimizedPicture = createOptimizedPicture(
    imageSrc, 
    imageAlt, 
    true, // eager loading for hero
    [{ media: '(min-width: 1200px)', width: '1920' }, { media: '(min-width: 768px)', width: '1200' }, { width: '768' }],
    'high' // fetchpriority for better performance
  );

  // Create hero structure
  const heroWrapper = document.createElement('div');
  heroWrapper.className = 'hero-wrapper';
  
  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';
  
  // Add the optimized image
  const imageContainer = document.createElement('div');
  imageContainer.className = 'hero-image-container';
  imageContainer.appendChild(optimizedPicture);
  
  // Add text content
  const textContainer = document.createElement('div');
  textContainer.className = 'hero-text-container';
  textContainer.innerHTML = textContent;
  
  heroContent.appendChild(imageContainer);
  heroContent.appendChild(textContainer);
  heroWrapper.appendChild(heroContent);
  
  // Clear block and add new structure
  block.textContent = '';
  block.appendChild(heroWrapper);
}
