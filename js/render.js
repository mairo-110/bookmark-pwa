import { formatBookmarkDate } from './bookmark.js';

function clearNode(node) {
  node.replaceChildren();
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

export function formatProviderLabel(providerKey) {
  if (providerKey === 'default') {
    return 'Default';
  }

  const match = providerKey.match(/provider(\d+)/i);
  return match ? `Provider ${match[1]}` : providerKey;
}

function createBookmarkCard(bookmark, actions) {
  const card = createElement('article', 'bookmark-card');
  const link = createElement('a', 'bookmark-card__link');
  const thumbnail = createElement('img', 'bookmark-card__thumbnail');
  const body = createElement('div', 'bookmark-card__body');
  const title = createElement('h3', 'bookmark-card__title', bookmark.title);
  const url = createElement('p', 'bookmark-card__url', bookmark.url);
  const meta = createElement('p', 'bookmark-card__meta', formatBookmarkDate(bookmark.createdAt));
  const deleteButton = createElement('button', 'bookmark-card__delete', '削除');

  link.href = bookmark.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  thumbnail.src = bookmark.thumbnail;
  thumbnail.alt = '';
  thumbnail.loading = 'lazy';

  body.append(title, url, meta);
  link.append(thumbnail, body);

  deleteButton.type = 'button';
  deleteButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    actions.onDelete?.(bookmark.id);
  });

  card.append(link, deleteButton);
  return card;
}

function createSection(providerKey, bookmarks, actions) {
  const section = createElement('section', 'bookmark-section');
  const header = createElement('header', 'bookmark-section__header');
  const heading = createElement('h2', 'bookmark-section__title', formatProviderLabel(providerKey));
  const count = createElement('span', 'bookmark-section__count', `${bookmarks.length}`);
  const grid = createElement('div', 'bookmark-grid');

  header.append(heading, count);

  for (const bookmark of bookmarks) {
    grid.append(createBookmarkCard(bookmark, actions));
  }

  section.append(header, grid);
  return section;
}

export function renderBookmarkSections(container, groupedBookmarks, actions = {}) {
  clearNode(container);

  const hasBookmarks = groupedBookmarks.some((group) => group.bookmarks.length > 0);

  if (!hasBookmarks) {
    const emptyState = createElement('div', 'empty-state');
    const emptyTitle = createElement('p', 'empty-state__title', 'まだブックマークがありません。');
    const emptyText = createElement('p', 'empty-state__text', '上の入力欄に URL を貼り付けて保存してください。');
    emptyState.append(emptyTitle, emptyText);
    container.append(emptyState);
    return;
  }

  for (const group of groupedBookmarks) {
    if (!group.bookmarks.length) {
      continue;
    }

    container.append(createSection(group.providerKey, group.bookmarks, actions));
  }
}