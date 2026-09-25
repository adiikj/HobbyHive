import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000/api/v1/users";

// Node 25+ has its own global `localStorage` that is undefined unless Node runs with --localstorage-file,
// and it shadows jsdom's. Give tests a working in-memory one in that case.
if (typeof globalThis.localStorage === "undefined" || globalThis.localStorage === null) {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => void store.set(key, String(value)),
  };
  Object.defineProperty(globalThis, "localStorage", { value: memoryStorage, configurable: true, writable: true });
}
