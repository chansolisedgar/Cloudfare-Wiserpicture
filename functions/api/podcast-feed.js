/**
 * Podcast feed — lee el RSS de "Consejos Gratis" (Spotify for Creators)
 * y lo devuelve como JSON limpio para que podcast.html se arme solo.
 *
 * GET /api/podcast-feed
 *
 * Configuración (Cloudflare Pages → Settings → Variables):
 *   PODCAST_RSS_URL   → el RSS feed de tu show. Ej:
 *                       https://anchor.fm/s/XXXXXXXX/podcast/rss
 *   PODCAST_SEASON_CUTOFF (opcional) → solo se muestran episodios publicados
 *                       en/después de esta fecha ISO (ej "2025-01-01").
 *                       Sirve para que los episodios viejos de 2023 NO
 *                       aparezcan aquí (ya viven en la sección de archivo).
 *
 * Si PODCAST_RSS_URL no está configurada, usa DEFAULT_RSS_URL de abajo.
 * El resultado se cachea 10 min en el edge de Cloudflare (solo si hay
 * episodios — un resultado vacío nunca se cachea).
 */

// Feed de "Consejos Gratis" en Spotify for Creators.
const DEFAULT_RSS_URL = 'https://anchor.fm/s/dff04af8/podcast/rss';

// Página pública del show para oyentes (botón "Escuchar en Spotify").
// Ojo: NO usar creators.spotify.com/pod/profile/... — esa es la consola del
// creador, no la página pública. Configurable con PODCAST_SPOTIFY_URL.
const DEFAULT_SPOTIFY_SHOW_URL = 'https://open.spotify.com/show/3gZnwhumRcHcT3RxxpwQyq';

// La nueva temporada es la 2. Los episodios de temporada 1 (2023) quedan
// ocultos aquí — viven en la sección "Temporadas anteriores" de la página.
// Configurable con PODCAST_MIN_SEASON.
const DEFAULT_MIN_SEASON = 2;

// Respaldo: si algún episodio no trae número de temporada, se muestra solo si
// es de esta fecha en adelante. Configurable con PODCAST_SEASON_CUTOFF.
const DEFAULT_SEASON_CUTOFF = '2026-01-01';

const CACHE_SECONDS = 600; // 10 minutos — un episodio nuevo no debe tardar en verse

// Sube esta versión si cambias la forma del JSON o quieres forzar que todo el
// mundo recalcule de inmediato (invalida cualquier respuesta vieja cacheada).
const CACHE_VERSION = 'v2';

export async function onRequestGet({ request, env }) {
  const rssUrl = (env.PODCAST_RSS_URL || DEFAULT_RSS_URL || '').trim();
  if (!rssUrl) {
    return json({
      error: 'Falta el RSS feed del podcast',
      detail: 'Configura la variable PODCAST_RSS_URL en Cloudflare Pages con el feed de Spotify for Creators (Settings → RSS Distribution).',
      episodes: []
    }, 200);
  }

  // Caché en el edge: evita pegarle al feed en cada visita
  const cache = caches.default;
  const cacheKey = new Request(`${new URL(request.url).origin}/api/podcast-feed?${CACHE_VERSION}`, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let xml;
  try {
    // Importante: NO usar cacheEverything/cacheTtl aquí. Si Cloudflare cachea
    // esta sub-petición a nivel de red, un episodio recién publicado puede
    // quedar "atascado" hasta 30 min con la versión vieja del feed. Nuestro
    // propio caché de abajo (con TTL corto) ya controla la frecuencia.
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'WiserPicture-PodcastBot/1.0' },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    if (!res.ok) {
      return json({ error: `El feed respondió ${res.status}`, episodes: [] }, 200);
    }
    xml = await res.text();
  } catch (err) {
    return json({ error: 'No se pudo leer el feed: ' + err.message, episodes: [] }, 200);
  }

  const cutoffStr = (env.PODCAST_SEASON_CUTOFF || DEFAULT_SEASON_CUTOFF || '').trim();
  const cutoff = cutoffStr ? new Date(cutoffStr).getTime() : 0;
  const minSeason = parseInt(env.PODCAST_MIN_SEASON, 10) || DEFAULT_MIN_SEASON;

  const parsed = parseFeed(xml);
  const allItems = parsed.items
    .map((it, idx) => normalizeItem(it, idx, parsed.channelImage))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let episodes = allItems.filter(ep => {
    // Si el episodio trae número de temporada, eso manda (lo más confiable).
    if (ep.season) return ep.season >= minSeason;
    // Si no trae temporada, caemos al respaldo por fecha.
    return !cutoff || !ep.timestamp || ep.timestamp >= cutoff;
  });

  // Salvaguarda: si el filtro deja todo vacío pero el feed sí tiene
  // episodios (ej. el más nuevo aún no trae bien el tag de temporada),
  // mostramos al menos el más reciente. Mejor eso que una página en blanco.
  if (episodes.length === 0 && allItems.length > 0) {
    episodes = [allItems[0]];
  }

  // Ordena de más nuevo a más viejo (allItems ya viene ordenado, esto es por claridad)
  episodes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Renumera de forma consistente para la nueva temporada (más nuevo = mayor)
  const total = episodes.length;
  episodes = episodes.map((ep, i) => ({
    ...ep,
    displayNumber: ep.episode || (total - i)
  }));

  // El <link> del canal apunta al sitio web, no a Spotify. Usamos la URL
  // pública configurada (con fallback a deriveSpotifyShow solo si alguien
  // quita PODCAST_SPOTIFY_URL y el default).
  const spotifyShow = (env.PODCAST_SPOTIFY_URL || DEFAULT_SPOTIFY_SHOW_URL || '').trim() || deriveSpotifyShow(episodes);

  const body = {
    show: {
      title: parsed.channelTitle || 'Consejos Gratis',
      link: parsed.channelLink || '',
      spotify: spotifyShow,
      image: parsed.channelImage || ''
    },
    count: episodes.length,
    generatedAt: new Date().toISOString(),
    episodes
  };

  const response = json(body, 200, {
    'Cache-Control': `public, max-age=${CACHE_SECONDS}`
  });
  // Solo cachea resultados con episodios. Si algo salió vacío (feed caído,
  // RSS aún no propagado, etc.) no lo dejamos "atascado" hasta que expire.
  if (episodes.length > 0) {
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

// ---------- Parser de RSS ----------

function parseFeed(xml) {
  const channelHead = xml.split(/<item[\s>]/i)[0] || xml;
  const channelTitle = clean(extractTag(channelHead, 'title'));
  const channelLink = clean(extractTag(channelHead, 'link'));
  const channelImage =
    extractAttr(channelHead, 'itunes:image', 'href') ||
    clean(extractFirst(channelHead, /<image>[\s\S]*?<url>([\s\S]*?)<\/url>/i));

  const items = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return { channelTitle, channelLink, channelImage, items };
}

function normalizeItem(block, idx, fallbackImage) {
  const title = clean(extractTag(block, 'title'));
  const rawDesc =
    extractTag(block, 'description') ||
    extractTag(block, 'itunes:summary') ||
    extractTag(block, 'content:encoded') || '';
  const cleanDesc = clean(rawDesc);
  const plain = stripHtml(cleanDesc);
  const description = truncate(plain, 220);          // texto plano para tarjetas
  const descriptionHtml = sanitizeHtml(cleanDesc);   // HTML para el cuerpo del blog
  const pubDate = clean(extractTag(block, 'pubDate'));
  const timestamp = pubDate ? new Date(pubDate).getTime() : 0;
  const link =
    clean(extractTag(block, 'link')) ||
    extractAttr(block, 'enclosure', 'url') || '';
  const audio = extractAttr(block, 'enclosure', 'url') || '';
  const episode = parseInt(clean(extractTag(block, 'itunes:episode')), 10) || null;
  const season = parseInt(clean(extractTag(block, 'itunes:season')), 10) || null;
  const image = extractAttr(block, 'itunes:image', 'href') || fallbackImage || '';
  const duration = clean(extractTag(block, 'itunes:duration'));
  const slug = slugFor(link, title, idx);
  const verse = extractVerse(plain);

  return {
    title,
    slug,
    description,
    descriptionHtml,
    verse,
    pubDate,
    dateLabel: formatDate(timestamp),
    timestamp: timestamp || 0,
    link,
    audio,
    episode,
    season,
    image,
    duration
  };
}

// Slug único y estable: usa el final del link de Spotify (trae un id), o el
// título "slugificado" como respaldo.
function slugFor(link, title, idx) {
  if (link) {
    const m = link.match(/\/episodes\/([^/?#]+)/i) || link.match(/\/([^/?#]+)\/?$/);
    if (m && m[1]) return m[1];
  }
  const s = (title || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || ('episodio-' + idx);
}

// Sanitiza el HTML de las notas del episodio (contenido propio, pero por si acaso).
function sanitizeHtml(s) {
  if (!s) return '';
  return s
    .replace(/<\/?(?:script|style|iframe|object|embed|form|input)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// Detecta una referencia bíblica del tipo "Versículo del episodio: Proverbios 21:20".
function extractVerse(plain) {
  if (!plain) return '';
  const m = plain.match(/vers[ií]culo[^:]*:\s*([0-9]?\s?[A-Za-zÁÉÍÓÚÑáéíóúñ.]+\s+\d+:\d+(?:[-,]\d+)?(?:\s+[A-Z]{2,4})?)/i);
  return m ? m[1].trim() : '';
}

function deriveSpotifyShow(episodes) {
  for (const ep of episodes) {
    if (!ep.link) continue;
    // podcasters/creators.spotify.com/pod/show/<slug>  ó  open.spotify.com/show/<id>
    const m = ep.link.match(/^(https?:\/\/[^/]*spotify\.com\/(?:pod\/(?:show|profile)|show)\/[^/?#]+)/i);
    if (m) {
      return m[1]
        .replace('podcasters.spotify.com/pod/show', 'creators.spotify.com/pod/profile');
    }
  }
  return '';
}

function extractTag(xml, tag) {
  // soporta <tag>...</tag> y <tag><![CDATA[...]]></tag>
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function extractFirst(xml, regex) {
  const m = xml.match(regex);
  return m ? m[1] : '';
}

function clean(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch {
    return '';
  }
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders
    }
  });
}
