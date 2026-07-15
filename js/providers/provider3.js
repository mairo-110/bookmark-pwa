import { createThumbnailDataUrl, getReadableTitle } from './shared.js';

const THEME = {
	start: '#2a0a1d',
	end: '#db2777',
	accent: '#f9a8d4',
};

export function getProviderName() {
	return 'provider3';
}

export function getTitle(url) {
	return getReadableTitle(url);
}

export function getThumbnail(url) {
	return createThumbnailDataUrl(url, THEME);
}
