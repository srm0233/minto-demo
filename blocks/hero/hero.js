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
  const imageSrc = imageElement.getAttribute("src");
  const imageAlt = imageElement.getAttribute("alt") || 'Hero image';
  
  if (!imageSrc) {
    console.error("Image element source not found");
    return;
  }

  // Get imageName from imageSrc expected in the format /content/dam/<...>/<imageName>.<extension>
  let imageName = imageSrc.split("/").pop().split(".")[0];
  
  // Use default DM URL like dynamicmedia-image block
  const dmUrl = "https://smartimaging.scene7.com/is/image/DynamicMediaNA";
  
  // Create new image element following dynamicmedia-image pattern
  const newImageEl = document.createElement('img');
  newImageEl.setAttribute("id", "responsiveImage");
  newImageEl.setAttribute("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"); // transparent gif
  newImageEl.setAttribute("data-src", dmUrl + (dmUrl.endsWith('/') ? "" : "/") + imageName);
  newImageEl.setAttribute("data-breakpoints", "200,400,800,1200,1600");
  newImageEl.setAttribute("style", "width:100%; height:100%; object-fit:cover; object-position:center;");
  newImageEl.setAttribute("alt", imageAlt);
  newImageEl.setAttribute("fetchpriority", "high");
  newImageEl.setAttribute("loading", "eager");
  
  // Create hero structure
  const heroWrapper = document.createElement('div');
  heroWrapper.className = 'hero-wrapper';
  
  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';
  
  // Add the image
  const imageContainer = document.createElement('div');
  imageContainer.className = 'hero-image-container';
  imageContainer.appendChild(newImageEl);
  
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
  
  // Initialize responsive image if s7responsiveImage is available
  if (typeof s7responsiveImage === 'function') {
    s7responsiveImage(newImageEl);
  } else {
    console.warn('s7responsiveImage function is not available');
  }
}
