/**
 * Content fetching service for extracting text from URLs
 * Uses multiple fallback methods to fetch content from external domains
 */

export async function fetchContentFromUrl(url: string): Promise<string> {
  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('Please enter a valid URL');
  }

  // Try multiple CORS proxy services as fallbacks
  const proxyServices = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
  ];

  let lastError: Error | null = null;

  for (const proxyUrl of proxyServices) {
    try {
      console.log(`Attempting to fetch from: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; ContentAnalyzer/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let htmlContent: string;
      
      // Handle different response formats from different proxy services
      if (proxyUrl.includes('allorigins')) {
        const data = await response.json();
        if (!data.contents) {
          throw new Error('No content received from proxy service');
        }
        htmlContent = data.contents;
      } else {
        htmlContent = await response.text();
      }
      
      if (!htmlContent || htmlContent.trim().length < 100) {
        throw new Error('Received empty or minimal content');
      }

      // Parse the HTML content and extract readable text
      const extractedText = extractTextFromHtml(htmlContent);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Unable to extract meaningful content from the page');
      }

      console.log(`Successfully fetched content using: ${proxyUrl}`);
      return `Content fetched from: ${url}\n\n${extractedText}`;
      
    } catch (error) {
      console.warn(`Failed with proxy ${proxyUrl}:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      continue;
    }
  }

  // If all proxy services failed, provide helpful error message
  throw new Error(
    `Unable to fetch content from the URL. This could be due to:\n` +
    `• The website blocks automated access\n` +
    `• CORS restrictions\n` +
    `• Network connectivity issues\n` +
    `• The URL might not be publicly accessible\n\n` +
    `Try copying and pasting the content directly instead.\n` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Extract readable text content from HTML
 */
function extractTextFromHtml(html: string): string {
  try {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove script and style elements and other non-content elements
    const elementsToRemove = doc.querySelectorAll(
      'script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .ads, .advertisement, .social-share, .comments, noscript, iframe'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // Try to find main content areas first
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.blog-content',
      '.post-body',
      '#content',
      '#main-content',
      '.main-content',
      '.article-body'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent && element.textContent.trim().length > 200) {
        mainContent = element;
        break;
      }
    }
    
    // If no main content found, try to find content in common blog/article containers
    if (!mainContent) {
      const fallbackSelectors = [
        '.post',
        '.article',
        '.blog-post',
        '[class*="content"]',
        '[class*="post"]',
        '[class*="article"]'
      ];
      
      for (const selector of fallbackSelectors) {
        const element = doc.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 200) {
          mainContent = element;
          break;
        }
      }
    }
    
    // Last resort: use body but filter out common non-content elements
    if (!mainContent) {
      mainContent = doc.body;
      if (mainContent) {
        const elementsToRemove = mainContent.querySelectorAll(
          'nav, header, footer, aside, .sidebar, .menu, .navigation, .comments, .related, .ads, .advertisement, .social-share, .author-bio, .breadcrumb'
        );
        elementsToRemove.forEach(el => el.remove());
      }
    }
    
    if (!mainContent) {
      throw new Error('Unable to find content in the page');
    }
    
    // Extract and clean text
    let text = mainContent.textContent || '';
    
    // Clean up the text
    text = text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove common navigation and UI text
      .replace(/\b(Home|About|Contact|Menu|Search|Login|Register|Subscribe|Share|Tweet|Like|Follow|Skip to|Jump to|Read more|Continue reading)\b/gi, '')
      // Remove email addresses and URLs that might be in the text
      .replace(/\S+@\S+\.\S+/g, '')
      .replace(/https?:\/\/\S+/g, '')
      // Remove common footer text
      .replace(/\b(Copyright|©|\d{4}|All rights reserved|Privacy Policy|Terms of Service)\b/gi, '')
      // Clean up extra spaces and line breaks
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split into sentences and filter meaningful ones
    const sentences = text.split(/[.!?]+/).filter(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length > 15 && 
             trimmed.split(' ').length > 3 && 
             !trimmed.match(/^(Copyright|©|\d{4}|All rights reserved|Home|Menu|Search)/i) &&
             !trimmed.match(/^\d+$/) && // Remove standalone numbers
             trimmed.length < 500; // Remove extremely long sentences (likely corrupted)
    });
    
    if (sentences.length === 0) {
      throw new Error('No meaningful sentences could be extracted');
    }
    
    // Join sentences back together and limit length
    let cleanedText = sentences.slice(0, 50).join('. ').trim(); // Limit to first 50 sentences
    
    // Ensure we have substantial content but not too much
    if (cleanedText.length < 100) {
      throw new Error('Extracted content is too short to analyze meaningfully');
    }
    
    // Limit content length to avoid API issues (keep first 4000 characters)
    if (cleanedText.length > 4000) {
      cleanedText = cleanedText.substring(0, 4000) + '...';
    }
    
    return cleanedText;
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse HTML content');
  }
}