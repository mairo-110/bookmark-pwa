import { groupBookmarksByProvider } from './bookmark.js';
import { renderBookmarkSections } from './render.js';
import { resolveBookmark } from './router.js';
import { hasSavedProviders, loadSettings, saveSettings } from './settings.js';
import { addBookmark, deleteBookmark, getAllBookmarks } from './storage.js';
import { getProviderKeyList } from './router.js';

const PROVIDER_ORDER = [...getProviderKeyList(), 'default'];

function getPageName() {
  return document.body.dataset.page ?? 'main';
}

function setStatus(element, message, tone = 'neutral') {
  element.textContent = message;
  element.dataset.tone = tone;
}

function clearStatus(element) {
  element.textContent = '';
  delete element.dataset.tone;
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '処理に失敗しました。';
}

function setLoading(buttons, isLoading) {
  for (const button of buttons) {
    if (button) {
      button.disabled = isLoading;
    }
  }
}

async function initMainPage() {
  const settings = loadSettings();

  if (!hasSavedProviders(settings)) {
    window.location.replace('./setting.html');
    return;
  }

  const bookmarkForm = document.querySelector('#bookmark-form');
  const urlInput = document.querySelector('#bookmark-url');
  const pasteButton = document.querySelector('#paste-button');
  const saveButton = document.querySelector('#save-button');
  const settingsButton = document.querySelector('#settings-button');
  const statusElement = document.querySelector('#status-message');
  const sectionsElement = document.querySelector('#bookmark-sections');

  const state = {
    draftUrl: '',
    bookmarks: [],
    busy: false,
  };

  function renderList() {
    const groupedBookmarks = groupBookmarksByProvider(state.bookmarks, PROVIDER_ORDER);
    renderBookmarkSections(sectionsElement, groupedBookmarks, {
      onDelete: handleDeleteBookmark,
    });
  }

  function syncInputValue() {
    urlInput.value = state.draftUrl;
  }

  async function refreshBookmarks() {
    state.bookmarks = await getAllBookmarks();
    renderList();
  }

  async function handleDeleteBookmark(id) {
    if (state.busy) {
      return;
    }

    try {
      state.busy = true;
      setLoading([pasteButton, saveButton, settingsButton], true);
      await deleteBookmark(id);
      await refreshBookmarks();
      setStatus(statusElement, 'ブックマークを削除しました。', 'success');
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), 'error');
    } finally {
      state.busy = false;
      setLoading([pasteButton, saveButton, settingsButton], false);
    }
  }

  async function handlePaste() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      state.draftUrl = clipboardText.trim();
      syncInputValue();
      clearStatus(statusElement);
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), 'error');
    }
  }

  async function handleSaveBookmark(event) {
    event.preventDefault();

    if (state.busy) {
      return;
    }

    state.draftUrl = urlInput.value;

    try {
      state.busy = true;
      setLoading([pasteButton, saveButton, settingsButton], true);

      const bookmark = resolveBookmark(state.draftUrl, settings);
      await addBookmark(bookmark);

      state.draftUrl = '';
      syncInputValue();
      await refreshBookmarks();
      setStatus(statusElement, 'ブックマークを保存しました。', 'success');
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), 'error');
    } finally {
      state.busy = false;
      setLoading([pasteButton, saveButton, settingsButton], false);
    }
  }

  urlInput.addEventListener('input', () => {
    state.draftUrl = urlInput.value;
  });

  bookmarkForm.addEventListener('submit', handleSaveBookmark);
  pasteButton.addEventListener('click', handlePaste);
  settingsButton.addEventListener('click', () => {
    window.location.href = './setting.html';
  });

  syncInputValue();
  await refreshBookmarks();

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is best-effort on browsers that allow it.
    });
  }
}

function isDomainEntryFilled(value) {
  return Boolean(String(value ?? '').trim());
}

async function initSettingsPage() {
  const form = document.querySelector('#settings-form');
  const provider1Input = document.querySelector('#provider1-domain');
  const provider2Input = document.querySelector('#provider2-domain');
  const provider3Input = document.querySelector('#provider3-domain');
  const saveButton = document.querySelector('#settings-save-button');
  const statusElement = document.querySelector('#settings-status');

  const currentSettings = loadSettings();

  if (hasSavedProviders(currentSettings)) {
    window.location.replace('./index.html');
    return;
  }

  provider1Input.value = currentSettings.provider1;
  provider2Input.value = currentSettings.provider2;
  provider3Input.value = currentSettings.provider3;

  async function handleSaveSettings(event) {
    event.preventDefault();

    const provider1 = provider1Input.value.trim();
    const provider2 = provider2Input.value.trim();
    const provider3 = provider3Input.value.trim();

    if (!isDomainEntryFilled(provider1) || !isDomainEntryFilled(provider2) || !isDomainEntryFilled(provider3)) {
      setStatus(statusElement, '3つのドメインをすべて入力してください。', 'error');
      return;
    }

    try {
      setLoading([saveButton], true);
      saveSettings({
        provider1,
        provider2,
        provider3,
      });

      setStatus(statusElement, '設定を保存しました。', 'success');
      window.location.replace('./index.html');
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), 'error');
    } finally {
      setLoading([saveButton], false);
    }
  }

  form.addEventListener('submit', handleSaveSettings);

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is best-effort on browsers that allow it.
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pageName = getPageName();

  if (pageName === 'settings') {
    void initSettingsPage();
    return;
  }

  void initMainPage();
});