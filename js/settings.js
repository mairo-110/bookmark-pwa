import { normalizeDomainEntry } from './providers/shared.js';

const STORAGE_KEY = 'bookmark-settings';
const EMPTY_SETTINGS = {
	provider1: '',
	provider2: '',
	provider3: '',
};

function toSettingsRecord(source) {
	return {
		provider1: normalizeDomainEntry(source?.provider1),
		provider2: normalizeDomainEntry(source?.provider2),
		provider3: normalizeDomainEntry(source?.provider3),
	};
}

export function createDefaultSettings() {
	return { ...EMPTY_SETTINGS };
}

export function loadSettings() {
	try {
		const rawValue = localStorage.getItem(STORAGE_KEY);

		if (!rawValue) {
			return createDefaultSettings();
		}

		return toSettingsRecord(JSON.parse(rawValue));
	} catch {
		return createDefaultSettings();
	}
}

export function saveSettings(settings) {
	const normalized = toSettingsRecord(settings);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
	return normalized;
}

export function hasSavedProviders(settings) {
	const normalized = toSettingsRecord(settings);
	return Boolean(normalized.provider1 && normalized.provider2 && normalized.provider3);
}

export function getSettingsStorageKey() {
	return STORAGE_KEY;
}
