export const forceRefreshToLatest = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  if (!navigator.onLine) {
    throw new Error('目前離線，請連上網路後再試一次。');
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          await registration.update();
        } catch {
          return;
        }
      })
    );
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          await registration.unregister();
        } catch {
          return;
        }
      })
    );
  }

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('refresh', Date.now().toString());
  window.location.replace(nextUrl.toString());
};
