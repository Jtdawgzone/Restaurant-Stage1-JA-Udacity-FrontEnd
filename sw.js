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
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
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
  // From https://developers.google.com/web/fundamentals/primers/service-workers
  self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
          .then((response) => {
            // Cache hit - return response
            if (response) {
              return response;
            }
    
            return fetch(event.request).then(
              function(response) {
                // Check if we received a valid response
                if(!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
    
                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                var responseToCache = response.clone();
    
                caches.open(STATIC_CACHE_NAME)
                  .then(function(cache) {
                    cache.put(event.request, responseToCache);
                  });
    
                return response;
              }
            );
          })
        );
  });