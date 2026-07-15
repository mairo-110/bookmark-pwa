const HTTP_SCHEME = /^https?:\/\//i;

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeDomainEntry(value) {
  const trimmed = String(value ?? '').trim().toLowerCase();

  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(HTTP_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.hostname.toLowerCase();
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').split('/')[0];
  }
}

export function normalizeBookmarkUrl(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    throw new Error('URLを入力してください。');
  }

  try {
    return new URL(HTTP_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`).toString();
  } catch {
    throw new Error('URLが正しくありません。');
  }
}

export function getHostnameFromUrl(value) {
  return new URL(value).hostname.toLowerCase();
}

function toDisplayTitle(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(' ');
}

export function getReadableTitle(value) {
  const url = new URL(value);
  const hostname = url.hostname.replace(/^www\./i, '');
  const segments = url.pathname.split('/').filter(Boolean);

  if (!segments.length) {
    return hostname;
  }

  const lastSegment = safeDecode(segments[segments.length - 1]);
  const candidate = toDisplayTitle(lastSegment.replace(/\.[a-z0-9]+$/i, ''));

  if (!candidate) {
    return hostname;
  }

  return `${candidate} · ${hostname}`;
}

export function matchesConfiguredDomain(hostname, configuredDomain) {
  const normalizedHost = String(hostname ?? '').toLowerCase();
  const normalizedDomain = normalizeDomainEntry(configuredDomain);

  if (!normalizedHost || !normalizedDomain) {
    return false;
  }

  return normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`);
}

function escapeSvgText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getBadgeLabel(url) {
  const hostname = getHostnameFromUrl(url).replace(/^www\./i, '');
  const label = hostname.split('.')[0] || hostname;
  return label.slice(0, 2).toUpperCase();
}

function getPathLabel(url) {
  const pathname = new URL(url).pathname.replace(/\/+$/g, '');

  if (!pathname || pathname === '/') {
    return 'HOME';
  }

  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? '';
  const label = toDisplayTitle(safeDecode(lastSegment)).slice(0, 18).toUpperCase();
  return label || 'PAGE';
}

export function createThumbnailDataUrl(url, theme) {
  const safeUrl = normalizeBookmarkUrl(url);
  const hostname = getHostnameFromUrl(safeUrl).replace(/^www\./i, '');
  const label = getBadgeLabel(safeUrl);
  const pathLabel = getPathLabel(safeUrl);
  const accent = theme?.accent ?? '#60a5fa';
  const start = theme?.start ?? '#0f172a';
  const end = theme?.end ?? '#1d4ed8';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" role="img" aria-label="${escapeSvgText(hostname)}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${escapeSvgText(start)}" />
          <stop offset="100%" stop-color="${escapeSvgText(end)}" />
        </linearGradient>
      </defs>
      <rect width="640" height="400" rx="40" fill="url(#bg)" />
      <rect x="36" y="36" width="568" height="328" rx="32" fill="rgba(255,255,255,0.08)" />
      <circle cx="140" cy="130" r="60" fill="rgba(255,255,255,0.16)" />
      <text x="140" y="151" text-anchor="middle" font-size="56" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${escapeSvgText(label)}</text>
      <text x="220" y="142" font-size="40" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${escapeSvgText(pathLabel)}</text>
      <text x="220" y="190" font-size="24" font-family="Arial, sans-serif" fill="rgba(255,255,255,0.88)">${escapeSvgText(hostname)}</text>
      <rect x="80" y="252" width="480" height="12" rx="6" fill="${escapeSvgText(accent)}" opacity="0.9" />
      <rect x="80" y="286" width="340" height="10" rx="5" fill="rgba(255,255,255,0.7)" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}