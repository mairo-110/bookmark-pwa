import * as defaultProvider from './providers/default.js';
import * as provider1 from './providers/provider1.js';
import * as provider2 from './providers/provider2.js';
import * as provider3 from './providers/provider3.js';
import { getHostnameFromUrl, matchesConfiguredDomain, normalizeBookmarkUrl } from './providers/shared.js';

const PROVIDERS = [
	{ key: 'provider1', module: provider1 },
	{ key: 'provider2', module: provider2 },
	{ key: 'provider3', module: provider3 },
];

function findProviderModule(urlValue, settings) {
	const hostname = getHostnameFromUrl(urlValue);

	for (const entry of PROVIDERS) {
		if (matchesConfiguredDomain(hostname, settings?.[entry.key])) {
			return entry.module;
		}
	}

	return defaultProvider;
}

export function getProviderKeyList() {
	return PROVIDERS.map((entry) => entry.key);
}

export function resolveBookmark(urlInput, settings) {
	const normalizedUrl = normalizeBookmarkUrl(urlInput);
	const provider = findProviderModule(normalizedUrl, settings);

	return {
		title: provider.getTitle(normalizedUrl),
		url: normalizedUrl,
		provider: provider.getProviderName(),
		thumbnail: provider.getThumbnail(normalizedUrl),
		createdAt: new Date(),
	};
}

export function resolveProviderKey(urlInput, settings) {
	const normalizedUrl = normalizeBookmarkUrl(urlInput);
	const provider = findProviderModule(normalizedUrl, settings);
	return provider.getProviderName();
}
