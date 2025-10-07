const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Parse BBCode to HTML with XSS protection
 * Only allows direct image links (no file uploads)
 * @param {string} text - BBCode text to parse
 * @returns {string} - Sanitized HTML
 */
function parseBBCode(text) {
  if (!text) return '';
  
  // First, convert BBCode to HTML
  let html = text
    // Bold
    .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
    // Italic
    .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
    // Underline
    .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
    // Strikethrough
    .replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>')
    // URL with text
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
    // URL without text
    .replace(/\[url\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images - only direct links allowed
    .replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" alt="User image" style="max-width: 100%; height: auto;" loading="lazy" />')
    // Quote with author
    .replace(/\[quote=(.*?)\](.*?)\[\/quote\]/gis, '<blockquote class="forum-quote"><div class="quote-author">$1 wrote:</div>$2</blockquote>')
    // Quote without author
    .replace(/\[quote\](.*?)\[\/quote\]/gis, '<blockquote class="forum-quote">$1</blockquote>')
    // Code blocks
    .replace(/\[code\](.*?)\[\/code\]/gis, '<pre><code>$1</code></pre>')
    // Color
    .replace(/\[color=(#[0-9a-f]{3,6}|[a-z]+)\](.*?)\[\/color\]/gi, '<span style="color: $1">$2</span>')
    // Size (limit to reasonable sizes)
    .replace(/\[size=(\d+)\](.*?)\[\/size\]/gi, (match, size, content) => {
      const sizeNum = parseInt(size);
      const clampedSize = Math.min(Math.max(sizeNum, 8), 32); // Clamp between 8 and 32px
      return `<span style="font-size: ${clampedSize}px">${content}</span>`;
    })
    // Lists
    .replace(/\[list\](.*?)\[\/list\]/gis, '<ul>$1</ul>')
    .replace(/\[\*\](.*?)(?=\[\*\]|\[\/list\])/gi, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  // Sanitize the HTML to prevent XSS
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'strong', 'em', 'u', 's', 'a', 'img', 'blockquote', 'pre', 'code', 
      'br', 'span', 'div', 'ul', 'li', 'p'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'style', 'target', 'rel', 'class', 'loading'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true
  });
  
  return sanitized;
}

/**
 * Strip all BBCode tags and return plain text
 * @param {string} text - BBCode text
 * @returns {string} - Plain text
 */
function stripBBCode(text) {
  if (!text) return '';
  
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Validate image URL (only allow direct image links from trusted domains)
 * @param {string} url - Image URL to validate
 * @returns {boolean} - True if valid
 */
function isValidImageUrl(url) {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Check if URL ends with image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );
    
    // Also check for common image hosting domains
    const trustedImageHosts = [
      'imgur.com', 'i.imgur.com',
      'gyazo.com', 'i.gyazo.com',
      'prntscr.com',
      'postimg.cc',
      'ibb.co',
      'imageban.ru',
      'imgbb.com',
      'tinypic.com',
      'photobucket.com',
      'discord.com', 'cdn.discordapp.com',
      'githubusercontent.com'
    ];
    
    const isTrustedHost = trustedImageHosts.some(host => 
      parsedUrl.hostname.includes(host)
    );
    
    return hasImageExtension || isTrustedHost;
  } catch (error) {
    return false;
  }
}

module.exports = {
  parseBBCode,
  stripBBCode,
  isValidImageUrl
};
