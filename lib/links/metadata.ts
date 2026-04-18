export interface LinkMetadata {
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  favicon_url: string | null;
  source_type: "youtube" | "twitter" | "instagram" | "facebook" | "web" | "other";
  tags: string[];
}

export function detectSourceType(url: string): LinkMetadata["source_type"] {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname.includes("youtube.com") || hostname === "youtu.be") return "youtube";
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
    if (hostname.includes("instagram.com")) return "instagram";
    if (hostname.includes("facebook.com") || hostname.includes("fb.com") || hostname.includes("fb.watch")) return "facebook";
    return "web";
  } catch {
    return "other";
  }
}

export function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }
  } catch { /* ignore */ }
  return null;
}

const STOP_WORDS = new Set([
  "this","that","with","from","have","been","will","your","about","into",
  "they","them","their","which","when","where","what","then","there",
  "these","those","some","more","also","just","like","over","such",
  "make","made","know","take","come","good","time","very","only",
]);

function autoTags(
  source_type: string,
  title: string | null,
  site_name: string | null,
): string[] {
  const tags: string[] = [];

  // Source type as first tag (except generic "web")
  if (source_type !== "web" && source_type !== "other") {
    tags.push(source_type);
  }

  // Site name if meaningful and not duplicate
  if (site_name) {
    const s = site_name.toLowerCase();
    if (!tags.includes(s) && s !== source_type) tags.push(s);
  }

  // Keywords from title
  if (title) {
    const words = title.toLowerCase().match(/[a-záéíóúñ]{4,}/g) ?? [];
    for (const word of words) {
      if (!STOP_WORDS.has(word) && !tags.includes(word) && tags.length < 4) {
        tags.push(word);
      }
    }
  }

  return tags.slice(0, 4);
}

function extractMeta(html: string, ...props: string[]): string | null {
  for (const prop of props) {
    // property="prop" ... content="val"  OR  content="val" ... property="prop"
    const a = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    );
    if (a) return a[1].trim();
    const b = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"),
    );
    if (b) return b[1].trim();
  }
  return null;
}

// ── Twitter / X via oEmbed ────────────────────────────────────────────────────

async function fetchTwitterMetadata(url: string): Promise<Partial<LinkMetadata>> {
  try {
    const oembed = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!oembed.ok) return {};
    const data = await oembed.json();

    // Extract tweet text from the blockquote HTML
    const tweetText = data.html
      ?.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
      ?.replace(/<[^>]+>/g, "")   // strip inner tags
      ?.replace(/&amp;/g, "&")
      ?.replace(/&lt;/g, "<")
      ?.replace(/&gt;/g, ">")
      ?.replace(/&#39;/g, "'")
      ?.replace(/&quot;/g, '"')
      ?.trim() ?? null;

    const author: string = data.author_name ?? null;

    return {
      title:       author ? `@${author}` : null,
      description: tweetText,
      site_name:   "X / Twitter",
      favicon_url: "https://abs.twimg.com/favicons/twitter.3.ico",
    };
  } catch {
    return {};
  }
}

// ── Main fetcher ──────────────────────────────────────────────────────────────

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const source_type = detectSourceType(url);

  let title: string | null = null;
  let description: string | null = null;
  let image_url: string | null = null;
  let site_name: string | null = null;
  let favicon_url: string | null = null;

  // YouTube: build maxres thumbnail directly from video ID
  if (source_type === "youtube") {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      image_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  // Twitter/X: use oEmbed API (regular fetch is blocked by their login wall)
  if (source_type === "twitter") {
    const meta = await fetchTwitterMetadata(url);
    title       = meta.title       ?? null;
    description = meta.description ?? null;
    site_name   = meta.site_name   ?? "X / Twitter";
    favicon_url = meta.favicon_url ?? null;
    const tags  = autoTags(source_type, description, site_name);
    return { title, description, image_url, site_name, favicon_url, source_type, tags };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await res.text();

    title =
      extractMeta(html, "og:title", "twitter:title") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
      null;

    description =
      extractMeta(html, "og:description", "twitter:description", "description") ?? null;

    if (!image_url) {
      image_url = extractMeta(html, "og:image", "twitter:image") ?? null;
    }

    site_name = extractMeta(html, "og:site_name") ?? null;

    try {
      const origin = new URL(url).origin;
      favicon_url = `${origin}/favicon.ico`;
    } catch { /* ignore */ }

  } catch { /* fetch failed — return what we already have */ }

  const tags = autoTags(source_type, title, site_name);

  return { title, description, image_url, site_name, favicon_url, source_type, tags };
}
