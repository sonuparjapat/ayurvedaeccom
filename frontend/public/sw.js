// Oroganix Service Worker — v1
// Strategy: stale-while-revalidate for pages, cache-first for S3 images

const SHELL_CACHE = 'oroganix-shell-v1'
const IMAGE_CACHE = 'oroganix-images-v1'

// Pages/assets to pre-cache on install
const SHELL_URLS = ['/', '/products', '/cart', '/wishlist', '/account']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_URLS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== IMAGE_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept: API calls, admin, auth, socket
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.hostname !== self.location.hostname && !url.hostname.includes('amazonaws.com')
  ) return

  // S3 product images — cache-first (images rarely change, long TTL)
  if (url.hostname.includes('amazonaws.com')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        const fresh = await fetch(request).catch(() => null)
        if (fresh && fresh.ok) cache.put(request, fresh.clone())
        return fresh || new Response('', { status: 503 })
      })
    )
    return
  }

  // Navigation + same-origin assets — stale-while-revalidate
  if (request.method !== 'GET') return

  event.respondWith(
    caches.open(SHELL_CACHE).then(async cache => {
      const cached = await cache.match(request)
      const fetchPromise = fetch(request)
        .then(fresh => { if (fresh && fresh.ok) cache.put(request, fresh.clone()); return fresh })
        .catch(() => null)
      return cached || fetchPromise || new Response('', { status: 503 })
    })
  )
})
