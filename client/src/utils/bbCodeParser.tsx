import React from 'react';

/**
 * Validates if a URL is safe to use
 * @param url - The URL to validate
 * @returns true if URL uses http or https protocol
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Escapes HTML to prevent XSS attacks
 * @param text - The text to escape
 * @returns HTML-escaped text
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Parses BB Code content and converts it to safe HTML
 * Supports: [img], [url], [b], [i], [u], [color], [size]
 * @param content - The BB code content to parse
 * @param className - Optional CSS class prefix for styling
 * @returns React elements with parsed content
 */
export const parsePostContent = (content: string, className: string = 'post'): React.ReactNode => {
  if (!content) return '';
  
  // Parse BB Code with security measures
  let parsedContent = content;
  
  // Parse [img] tags with URL validation
  parsedContent = parsedContent.replace(/\[img\](.*?)\[\/img\]/gi, (match, url) => {
    const cleanUrl = url.trim();
    if (isValidUrl(cleanUrl)) {
      return `<img src="${escapeHtml(cleanUrl)}" alt="Image" class="${className}-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`;
    }
    return `[Invalid image URL]`;
  });
  
  // Parse [img=url] format
  parsedContent = parsedContent.replace(/\[img=([^\]]+)\]/gi, (match, url) => {
    const cleanUrl = url.trim();
    if (isValidUrl(cleanUrl)) {
      return `<img src="${escapeHtml(cleanUrl)}" alt="Image" class="${className}-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`;
    }
    return `[Invalid image URL]`;
  });
  
  // Parse [url] tags with validation
  parsedContent = parsedContent.replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, (match, url, text) => {
    const cleanUrl = url.trim();
    const cleanText = escapeHtml(text.trim());
    if (isValidUrl(cleanUrl)) {
      return `<a href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="${className}-link">${cleanText}</a>`;
    }
    return `[Invalid link: ${cleanText}]`;
  });
  
  // Parse simple [url] tags
  parsedContent = parsedContent.replace(/\[url\](.*?)\[\/url\]/gi, (match, url) => {
    const cleanUrl = url.trim();
    if (isValidUrl(cleanUrl)) {
      return `<a href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="${className}-link">${escapeHtml(cleanUrl)}</a>`;
    }
    return `[Invalid URL]`;
  });
  
  // Parse text formatting (escape content)
  parsedContent = parsedContent.replace(/\[b\](.*?)\[\/b\]/gi, (match, text) => `<strong>${escapeHtml(text)}</strong>`);
  parsedContent = parsedContent.replace(/\[i\](.*?)\[\/i\]/gi, (match, text) => `<em>${escapeHtml(text)}</em>`);
  parsedContent = parsedContent.replace(/\[u\](.*?)\[\/u\]/gi, (match, text) => `<u>${escapeHtml(text)}</u>`);
  parsedContent = parsedContent.replace(/\[s\](.*?)\[\/s\]/gi, (match, text) => `<s>${escapeHtml(text)}</s>`);
  
  // Parse [color] tags with validation
  parsedContent = parsedContent.replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, (match, color, text) => {
    // Only allow hex colors and basic color names
    const validColor = /^(#[0-9a-f]{3,6}|red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)$/i.test(color.trim());
    if (validColor) {
      return `<span style="color: ${escapeHtml(color.trim())}">${escapeHtml(text)}</span>`;
    }
    return escapeHtml(text);
  });
  
  // Parse [size] tags with validation
  parsedContent = parsedContent.replace(/\[size=(.*?)\](.*?)\[\/size\]/gi, (match, size, text) => {
    const numSize = parseInt(size);
    // Limit font size to reasonable range
    if (numSize >= 8 && numSize <= 32) {
      return `<span style="font-size: ${numSize}px">${escapeHtml(text)}</span>`;
    }
    return escapeHtml(text);
  });
  
  // Parse [code] tags
  parsedContent = parsedContent.replace(/\[code\](.*?)\[\/code\]/gi, (match, text) => {
    return `<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">${escapeHtml(text)}</code>`;
  });
  
  // Parse [quote] tags
  parsedContent = parsedContent.replace(/\[quote=(.*?)\](.*?)\[\/quote\]/gi, (match, author, text) => {
    return `<blockquote style="border-left: 3px solid var(--accent-primary); padding-left: 12px; margin: 10px 0; font-style: italic;"><strong>${escapeHtml(author)} said:</strong><br>${escapeHtml(text)}</blockquote>`;
  });
  
  parsedContent = parsedContent.replace(/\[quote\](.*?)\[\/quote\]/gi, (match, text) => {
    return `<blockquote style="border-left: 3px solid var(--accent-primary); padding-left: 12px; margin: 10px 0; font-style: italic;">${escapeHtml(text)}</blockquote>`;
  });
  
  // Escape any remaining content and handle line breaks
  const lines = parsedContent.split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      <span dangerouslySetInnerHTML={{ __html: line }} />
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

/**
 * Formats a timestamp into a human-readable relative time
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string (e.g., "2h ago", "Just now")
 */
export const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};
