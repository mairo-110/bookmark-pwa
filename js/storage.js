const DB_NAME = 'BookmarkDB';
const DB_VERSION = 1;
const STORE_NAME = 'bookmarks';

let databasePromise = null;

function requestToPromise(request) {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
	});
}

function transactionDone(transaction) {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
		transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
	});
}

function openDatabase() {
	if (databasePromise) {
		return databasePromise;
	}

	databasePromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const database = request.result;

			if (database.objectStoreNames.contains(STORE_NAME)) {
				return;
			}

			const store = database.createObjectStore(STORE_NAME, {
				keyPath: 'id',
				autoIncrement: true,
			});

			store.createIndex('byProvider', 'provider', { unique: false });
			store.createIndex('byCreatedAt', 'createdAt', { unique: false });
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed.'));
	});

	return databasePromise;
}

function normalizeBookmarkRecord(bookmark) {
	return {
		...bookmark,
		createdAt: bookmark.createdAt instanceof Date ? bookmark.createdAt : new Date(bookmark.createdAt),
	};
}

export async function addBookmark(bookmark) {
	const database = await openDatabase();
	const transaction = database.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);
	const record = normalizeBookmarkRecord(bookmark);

	const id = await requestToPromise(store.add(record));
	await transactionDone(transaction);

	return id;
}

export async function getAllBookmarks() {
	const database = await openDatabase();
	const transaction = database.transaction(STORE_NAME, 'readonly');
	const store = transaction.objectStore(STORE_NAME);
	const records = await requestToPromise(store.getAll());

	await transactionDone(transaction);

	return records.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function deleteBookmark(id) {
	const database = await openDatabase();
	const transaction = database.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);

	await requestToPromise(store.delete(id));
	await transactionDone(transaction);
}
