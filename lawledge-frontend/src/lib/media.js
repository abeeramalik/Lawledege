export function normalizeUrl(url = '') {
  return String(url || '').trim();
}

export function getUrlInfo(url = '') {
  const clean = normalizeUrl(url);
  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const path = decodeURIComponent(`${parsed.pathname}${parsed.search}`).toLowerCase();
    return { valid: true, host, path, url: clean };
  } catch {
    return { valid: false, host: '', path: '', url: clean };
  }
}

export function isDirectVideoUrl(url = '') {
  const { path } = getUrlInfo(url);
  return /\.(mp4|webm|mov|ogg|m4v)(\?|#|$)/i.test(path) || path.includes('video/');
}

export function isDirectImageUrl(url = '') {
  const { path } = getUrlInfo(url);
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|#|$)/i.test(path) || path.includes('image/');
}

export function isKnownSocialUrl(url = '') {
  const { host } = getUrlInfo(url);
  return ['youtube.com', 'youtu.be', 'facebook.com', 'fb.watch', 'instagram.com', 'tiktok.com'].some(domain => host === domain || host.endsWith(`.${domain}`));
}

export function getYouTubeEmbedUrl(url = '') {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId = '';
    if (host === 'youtu.be') videoId = parsed.pathname.replace('/', '').split('/')[0];
    if (host.endsWith('youtube.com')) videoId = parsed.searchParams.get('v') || parsed.pathname.match(/\/(shorts|embed)\/([^/?#]+)/)?.[2] || '';
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  } catch {
    return '';
  }
}

export function getLinkLabel(url = '') {
  const { host } = getUrlInfo(url);
  if (host.includes('youtube') || host === 'youtu.be') return 'YouTube Link';
  if (host.includes('facebook') || host === 'fb.watch') return 'Facebook Link';
  if (host.includes('instagram')) return 'Instagram Link';
  if (host.includes('tiktok')) return 'TikTok Link';
  return 'Attached Link';
}
