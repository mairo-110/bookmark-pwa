export function sortBookmarksNewestFirst(bookmarks) {
	return [...bookmarks].sort((left, right) => {
		const leftTime = new Date(left.createdAt).getTime();
		const rightTime = new Date(right.createdAt).getTime();
		return rightTime - leftTime;
	});
}

export function groupBookmarksByProvider(bookmarks, providerOrder) {
	const grouped = new Map();

	for (const providerKey of providerOrder) {
		grouped.set(providerKey, []);
	}

	for (const bookmark of bookmarks) {
		const bucket = grouped.get(bookmark.provider) ?? [];
		bucket.push(bookmark);
		grouped.set(bookmark.provider, bucket);
	}

	return providerOrder.map((providerKey) => ({
		providerKey,
		bookmarks: sortBookmarksNewestFirst(grouped.get(providerKey) ?? []),
	}));
}

export function formatBookmarkDate(value, locale = 'ja-JP') {
	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return '';
	}

	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

export function createEmptyBookmarksMap(providerOrder) {
	return providerOrder.map((providerKey) => ({ providerKey, bookmarks: [] }));
}
