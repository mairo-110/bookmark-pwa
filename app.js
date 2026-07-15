const STORAGE_KEY = 'local-bookmark-pwa-v1';

const form = document.getElementById('bookmark-form');
const titleInput = document.getElementById('bookmark-title');
const input = document.getElementById('bookmark-url');
const exportButton = document.getElementById('export-data');
const importButton = document.getElementById('import-data');
const importFileInput = document.getElementById('import-file');
const sortModeSelect = document.getElementById('sort-mode');
const list = document.getElementById('bookmark-list');
const count = document.getElementById('bookmark-count');
const domainTabs = document.getElementById('domain-tabs');

const incomingShare = readIncomingShare();
const bookmarks = loadBookmarks();
let activeDomain = '';

if (incomingShare.url) {
  titleInput.value = incomingShare.title ?? '';
  input.value = incomingShare.url;
}

if (incomingShare.saveOnLoad) {
  queueMicrotask(() => {
    try {
      upsertBookmark({
        urlValue: incomingShare.url,
        titleValue: incomingShare.title ?? '',
        source: 'shortcut',
      });
      clearIncomingShare();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'URLを保存できませんでした');
    }
  });
}

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((bookmark) => bookmark && typeof bookmark.url === 'string')
      .map((bookmark) => ({
        ...bookmark,
        favorite: Boolean(bookmark.favorite),
      }));
  } catch {
    return [];
  }
}

function saveBookmarks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

function normalizeUrl(rawValue) {
  const trimmed = rawValue.trim();
  const prefixed = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(prefixed);

  if (!url.hostname) {
    throw new Error('URLのホスト名を取得できませんでした');
  }

  return url;
}

function getDomain(url) {
  return url.hostname.replace(/^www\./i, '').toLowerCase();
}

function buildLabel(url) {
  const path = `${url.pathname}${url.search}`.replace(/\/$/, '');
  if (!path || path === '') {
    return url.origin;
  }

  return `${url.hostname}${path}`;
}

function readIncomingShare() {
  const params = new URLSearchParams(window.location.search);
  const urlValue = normalizeIncomingValue(params.get('url'));
  const titleValue = normalizeIncomingValue(params.get('title'));
  const payloadValue = normalizeIncomingValue(params.get('payload'));
  const saveOnLoad = params.get('save') === '1' || params.get('autopost') === '1';

  const payload = parseIncomingPayload(payloadValue);

  return {
    url: payload.url || urlValue,
    title: payload.title || titleValue,
    saveOnLoad,
  };
}

function normalizeIncomingValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return decodeRepeatedly(value.trim());
}

function decodeRepeatedly(value) {
  let current = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(current)) {
      break;
    }

    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) {
        break;
      }

      current = decoded;
    } catch {
      break;
    }
  }

  return current;
}

function parseIncomingPayload(payloadValue) {
  if (!payloadValue) {
    return { url: '', title: '' };
  }

  try {
    const normalized = decodeRepeatedly(payloadValue.startsWith('{') ? payloadValue : payloadValue);
    const parsed = JSON.parse(normalized);

    return {
      url: typeof parsed.url === 'string' ? parsed.url.trim() : '',
      title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
    };
  } catch {
    return { url: '', title: '' };
  }
}

function clearIncomingShare() {
  if (window.location.search.length === 0) {
    return;
  }

  window.history.replaceState({}, '', window.location.pathname);
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function downloadJson(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function setStatus(message, kind = 'info') {
  void message;
  void kind;
}

function render() {
  count.textContent = String(bookmarks.length);

  if (bookmarks.length === 0) {
    domainTabs.innerHTML = '';
    list.innerHTML = '<p class="empty-state">まだブックマークはありません。URLを1つ貼り付けて保存してください。</p>';
    return;
  }

  const grouped = bookmarks.reduce((accumulator, bookmark) => {
    const domain = bookmark.domain;
    if (!accumulator[domain]) {
      accumulator[domain] = [];
    }
    accumulator[domain].push(bookmark);
    return accumulator;
  }, {});

  const sortedDomains = Object.keys(grouped).sort((left, right) => left.localeCompare(right, 'ja'));
  if (!sortedDomains.includes(activeDomain)) {
    activeDomain = sortedDomains[0];
  }

  const sortMode = sortModeSelect?.value ?? 'favorite-first';

  domainTabs.innerHTML = sortedDomains
    .map((domain) => {
      const domainItems = grouped[domain];
      const favoriteCount = domainItems.filter((bookmark) => bookmark.favorite).length;
      const isActive = domain === activeDomain;

      return `
        <button class="domain-tab${isActive ? ' active' : ''}" type="button" data-domain="${escapeAttribute(domain)}" aria-pressed="${isActive ? 'true' : 'false'}">
          <span class="domain-tab-name">${escapeHtml(domain)}</span>
          <span class="domain-tab-meta">
            <span>${domainItems.length}</span>
            ${favoriteCount > 0 ? `<span class="domain-tab-favorite" aria-label="お気に入り件数">★</span><span>${favoriteCount}</span>` : ''}
          </span>
        </button>
      `;
    })
    .join('');

  const activeItems = (grouped[activeDomain] ?? [])
    .sort((left, right) => sortBookmarks(left, right, sortMode));

  list.innerHTML = `
    <section class="group" aria-label="${escapeAttribute(activeDomain)}">
      <div class="group-header">
        <h2>${escapeHtml(activeDomain)}</h2>
        <span class="badge">${activeItems.length}</span>
      </div>
      <div class="group-items">
        ${activeItems
          .map(
            (bookmark) => `
              <article class="bookmark${bookmark.favorite ? ' favorite' : ''}" data-id="${bookmark.id}">
                <div class="bookmark-top">
                  <div class="bookmark-title-wrap">
                    <p class="bookmark-title">${escapeHtml(bookmark.title || bookmark.label)}</p>
                  </div>
                  <button class="favorite-toggle${bookmark.favorite ? ' active' : ''}" type="button" data-action="favorite" aria-label="${bookmark.favorite ? 'お気に入りを解除' : 'お気に入りに追加'}">${bookmark.favorite ? '★' : '☆'}</button>
                </div>
                <div class="bookmark-actions">
                  <a class="bookmark-action" href="${escapeAttribute(bookmark.url)}" target="_blank" rel="noreferrer">開く</a>
                  <button class="bookmark-action" type="button" data-action="edit-title">タイトル編集</button>
                  <button class="bookmark-action delete" type="button" data-action="delete">削除</button>
                </div>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function sortBookmarks(left, right, sortMode) {
  if (sortMode === 'newest') {
    return right.createdAt - left.createdAt;
  }

  if (sortMode === 'oldest') {
    return left.createdAt - right.createdAt;
  }

  if (left.favorite !== right.favorite) {
    return Number(right.favorite) - Number(left.favorite);
  }

  return right.createdAt - left.createdAt;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function upsertBookmark(rawValue) {
  const inputValue = typeof rawValue === 'string' ? rawValue : rawValue.urlValue;
  const titleValue = typeof rawValue === 'object' && rawValue ? rawValue.titleValue : '';
  const url = normalizeUrl(inputValue);
  const cleanedTitle = typeof titleValue === 'string' ? titleValue.trim() : '';
  const bookmark = {
    id: crypto.randomUUID(),
    url: url.toString(),
    domain: getDomain(url),
    label: buildLabel(url),
    title: cleanedTitle || url.hostname,
    favorite: false,
    createdAt: Date.now(),
  };

  bookmarks.unshift(bookmark);
  saveBookmarks();
  render();
  setStatus(`「${bookmark.domain}」に保存しました`);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    upsertBookmark({
      urlValue: input.value,
      titleValue: titleInput.value,
    });
    form.reset();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'URLを保存できませんでした');
  }
});

sortModeSelect.addEventListener('change', () => {
  render();
});

domainTabs.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-domain]');
  if (!button) {
    return;
  }

  activeDomain = button.dataset.domain ?? activeDomain;
  render();
});

exportButton.addEventListener('click', () => {
  downloadJson(`bookmarks-${new Date().toISOString().slice(0, 10)}.json`, {
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmarks,
  });
  setStatus('データを書き出しました');
});

importButton.addEventListener('click', () => {
  importFileInput.value = '';
  importFileInput.click();
});

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const incoming = Array.isArray(payload) ? payload : payload.bookmarks;

    if (!Array.isArray(incoming)) {
      throw new Error('インポート形式が正しくありません');
    }

    const normalized = incoming
      .filter((item) => item && typeof item.url === 'string')
      .map((item) => {
        const url = normalizeUrl(item.url);
        return {
          id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
          url: url.toString(),
          domain: typeof item.domain === 'string' && item.domain.trim() ? item.domain : getDomain(url),
          label: typeof item.label === 'string' && item.label.trim() ? item.label : buildLabel(url),
          title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : url.hostname,
          favorite: Boolean(item.favorite),
          createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
        };
      });

    const merged = new Map();
    [...normalized, ...bookmarks].forEach((bookmark) => {
      merged.set(bookmark.url, bookmark);
    });

    bookmarks.splice(0, bookmarks.length, ...Array.from(merged.values()).sort((left, right) => right.createdAt - left.createdAt));
    saveBookmarks();
    render();
    setStatus('データを取り込みました');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'インポートに失敗しました');
  }
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const card = button.closest('.bookmark');
  const bookmark = bookmarks.find((item) => item.id === card?.dataset.id);

  if (!bookmark) {
    return;
  }

  if (button.dataset.action === 'edit-title') {
    const nextTitle = window.prompt('タイトルを編集', bookmark.title || bookmark.label || '');
    if (nextTitle === null) {
      return;
    }

    const trimmedTitle = nextTitle.trim();
    bookmark.title = trimmedTitle || bookmark.label || bookmark.domain;
    saveBookmarks();
    render();
    setStatus('タイトルを更新しました');
  }

  if (button.dataset.action === 'favorite') {
    bookmark.favorite = !bookmark.favorite;
    saveBookmarks();
    render();
    setStatus(bookmark.favorite ? '★ を追加しました' : '★ を解除しました');
  }

  if (button.dataset.action === 'delete') {
    const confirmed = window.confirm('このブックマークを削除しますか？');
    if (!confirmed) {
      return;
    }

    const nextIndex = bookmarks.findIndex((item) => item.id === bookmark.id);
    if (nextIndex >= 0) {
      bookmarks.splice(nextIndex, 1);
      saveBookmarks();
      render();
      setStatus('削除しました');
    }
  }
});

window.addEventListener('beforeunload', saveBookmarks);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is best-effort.
    });
  });
}

if (incomingShare.url && !incomingShare.saveOnLoad) {
  setStatus('タイトルとURLを受け取りました。必要なら保存してください。');
}

render();