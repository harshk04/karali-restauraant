export function createUniqueId() {
  if (typeof globalThis !== "undefined") {
    const cryptoApi = globalThis.crypto as Crypto | undefined;
    if (cryptoApi?.randomUUID) {
      return cryptoApi.randomUUID();
    }
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
