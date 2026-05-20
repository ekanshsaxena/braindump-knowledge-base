import { UrlMetadata } from '@/types';

function extractMeta(html: string, url: string): UrlMetadata {
  const get = (pattern: RegExp) => {
    const match = html.match(pattern);
    return match ? match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim() : '';
  };

  const title =
    get(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    get(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
    get(/<title[^>]*>([^<]+)<\/title>/i) ||
    '';

  const description =
    get(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    get(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
    get(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    get(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
    '';

  const thumbnail =
    get(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    get(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
    '';

  const siteName =
    get(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) ||
    get(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i) ||
    '';

  const domain = new URL(url).hostname;
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  return { title, description, thumbnail, favicon, siteName: siteName || domain, url };
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBaseBot/1.0)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    return extractMeta(html, url);
  } catch {
    try {
      const domain = new URL(url).hostname;
      return {
        title: url,
        description: '',
        thumbnail: '',
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        siteName: domain,
        url,
      };
    } catch {
      return null;
    }
  }
}

export function extractUrls(text: string): string[] {
  const pattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  return [...new Set(text.match(pattern) || [])];
}
