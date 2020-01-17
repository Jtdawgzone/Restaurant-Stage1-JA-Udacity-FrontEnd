// Credit to Alexandro Perez for the walkthrough at
// https://alexandroperez.github.io/mws-walkthrough/?1.23.registering-service-worker-and-caching-static-assets
//
//
// Credit to https://developers.google.com/web/fundamentals/primers/service-workers
//
// Both elped me when I was stuck on this section

const APP_NAME = "restaurant-reviews-ja";
const STATIC_CACHE_NAME = `${APP_NAME}-v1.0`;
const CONTENT_IMG_CACHE = `${APP_NAME}-images`;

var cachesWhiteList = [STATIC_CACHE_NAME, CONTENT_IMG_CACHE];

var urlsToCache = [
  "/", // cache index.html
  "/restaurant.html",
  "/css/styles.css",
  "/js/dbhelper.js",
  "/js/main.js",
  "/js/restaurant_info.js",
  "js/register-sw.js",
  "js/map.js",
  "data/restaurants.json"
  // We don't need to cache images
];

// Cache all assets at SW install
self.addEventListener("install", event => {
  // Perform install steps
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cachesWhiteList.indexOf(cacheName) === -1) {
            console.log(`Deleted cache of ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle fetch events
self.addEventListener("fetch", event => {
  const requestUrl = new URL(event.request.url);

  // Only highjack app requests not mapbox
  if (requestUrl.origin === location.origin) {

    // Handle pages
    // RespondWith restaurant.html if pathname startsWith '/restaurant.html'
    if (requestUrl.pathname.startsWith("/restaurant.html")) {
      event.respondWith(caches.match("/restaurant.html"));
      return; // Done handling
    }

     // Handle images
     if (requestUrl.pathname.startsWith('/img')) {
        event.respondWith(serveImage(event.request));
        return; // Done handling
      }
  }

  // Default behavior From https://developers.google.com/web/fundamentals/primers/service-workers
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then(function(response) {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        var responseToCache = response.clone();

        caches.open(STATIC_CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Credit to https://developers.google.com/web/fundamentals/primers/service-workers
// This part was difficult and took forever to understand and walkthrough
function serveImage(request) {
    let imageStorageUrl = request.url;
  
    // Make a new URL with a stripped suffix and extension from the request url
    // i.e. /img/1-300w.jpg  will become  /img/1
    // Using this as the cache
    imageStorageUrl = imageStorageUrl.replace(/-300w\.\w{3}|-360w\.\w{3}|C-558w\.\w{3}|-800w\.\w{3}/i, '');
  
    return caches.open(contentImgsCache).then((cache) => {
      return cache.match(imageStorageUrl).then((response) => {
        // if image is in cache, return it, else fetch from network, cache a clone, then return network response
        return response || fetch(request).then((networkResponse) => {
          cache.put(imageStorageUrl, networkResponse.clone());
          return networkResponse;
        });
      });
    });
  }