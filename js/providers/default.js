import { createThumbnailDataUrl, getReadableTitle } from './shared.js';

const THEME = {
	start: '#111827',
	end: '#374151',
	accent: '#9ca3af',
};

export function getProviderName() {
	return 'default';
}

export function getTitle(url) {
	return getReadableTitle(url);
}

export function getThumbnail(url) {
	return createThumbnailDataUrl(url, THEME);
}
