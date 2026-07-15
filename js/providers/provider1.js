import { createThumbnailDataUrl, getReadableTitle } from './shared.js';

const THEME = {
	start: '#0f172a',
	end: '#2563eb',
	accent: '#93c5fd',
};

export function getProviderName() {
	return 'provider1';
}

export function getTitle(url) {
	return getReadableTitle(url);
}

export function getThumbnail(url) {
	return createThumbnailDataUrl(url, THEME);
}
