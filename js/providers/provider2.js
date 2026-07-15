import { createThumbnailDataUrl, getReadableTitle } from './shared.js';

const THEME = {
	start: '#052e16',
	end: '#16a34a',
	accent: '#86efac',
};

export function getProviderName() {
	return 'provider2';
}

export function getTitle(url) {
	return getReadableTitle(url);
}

export function getThumbnail(url) {
	return createThumbnailDataUrl(url, THEME);
}
