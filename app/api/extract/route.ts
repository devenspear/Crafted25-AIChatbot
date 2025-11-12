import { extractRateLimit, getClientIP, checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Security: URL whitelist for trusted domains
const ALLOWED_DOMAINS = [
  // News and media sites
  'nytimes.com', 'wsj.com', 'ft.com', 'economist.com', 'reuters.com', 'bloomberg.com',
  'theguardian.com', 'bbc.com', 'cnn.com', 'forbes.com', 'wired.com', 'techcrunch.com',
  'arstechnica.com', 'theverge.com', 'engadget.com', 'mashable.com', 'venturebeat.com',
  'axios.com', 'politico.com', 'theatlantic.com', 'newyorker.com', 'medium.com',
  'substack.com', 'mit.edu', 'stanford.edu', 'harvard.edu', 'nature.com', 'science.org',
  'arxiv.org', 'acm.org', 'ieee.org', 'sciencedirect.com', 'springer.com', 'wiley.com',
  // Alys Beach specific
  'alysbeach.com', 'craftedatbeach.com'
];

/**
 * Validates URL to prevent SSRF attacks
 * Blocks: localhost, private IPs, metadata endpoints
 * Allows: Only whitelisted domains
 */
function validateURL(urlString: string): { valid: boolean; error?: string; hostname?: string } {
  try {
    const url = new URL(urlString);

    // Security: Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    const hostname = url.hostname.toLowerCase();

    // Security: Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }

    // Security: Block private IP ranges (RFC 1918)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
      // Link-local: 169.254.0.0/16 (AWS metadata)
      if (a === 169 && b === 254) {
        return { valid: false, error: 'Link-local addresses are not allowed' };
      }
    }

    // Security: Check domain whitelist
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return {
        valid: false,
        error: `Domain not whitelisted. Allowed domains: ${ALLOWED_DOMAINS.slice(0, 5).join(', ')} and more`
      };
    }

    return { valid: true, hostname };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function POST(req: Request) {
  try {
    // Security: Rate limiting (10 requests/minute per IP)
    const clientIP = getClientIP(req);
    const rateLimitResponse = await checkRateLimit(extractRateLimit, clientIP);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { url } = await req.json();
    console.log('[Extract API] Received URL:', url);

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Security: Validate URL to prevent SSRF attacks
    const validation = validateURL(url);
    if (!validation.valid) {
      console.log('[Extract API] URL validation failed:', validation.error);
      return new Response(JSON.stringify({
        success: false,
        error: validation.error
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Extract API] URL validated:', validation.hostname);

    // Try Jina AI extraction
    const jinaUrl = `https://r.jina.ai/${url}`;
    console.log('[Extract API] Fetching from Jina:', jinaUrl);

    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'text',
      },
    });

    console.log('[Extract API] Jina response status:', response.status);

    if (!response.ok) {
      const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      console.error('[Extract API] Jina fetch failed:', errorMsg);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const content = await response.text();
    console.log('[Extract API] Content received, length:', content.length);

    // Check if content is substantial (> 400 words)
    const wordCount = content.split(/\s+/).filter(w => w).length;
    console.log('[Extract API] Word count:', wordCount);

    if (wordCount < 400) {
      console.log('[Extract API] Content too short');
      return new Response(
        JSON.stringify({
          success: false,
          error: `Content too short (${wordCount} words, need 400+)`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Extract API] Extraction successful');
    return new Response(
      JSON.stringify({
        success: true,
        content,
        wordCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Extract API] Error:', errorMsg);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
