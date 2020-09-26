import {registerRoute} from 'workbox-routing';
import {CacheFirst, StaleWhileRevalidate} from 'workbox-strategies';
import {precacheAndRoute} from 'workbox-precaching';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {ExpirationPlugin} from 'workbox-expiration';

//precacheAndRoute(self.__precacheManifest || []);
precacheAndRoute(self.__WB_MANIFEST);

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com',
    new StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );

  // Cache the underlying font files with a cache-first strategy for 1 year.
  registerRoute(
    ({url}) => url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 365,
          maxEntries: 30,
        }),
      ],
    })
  );

  registerRoute(
    '/share',
    shareTargetHandler,
    'POST'
  );

  async function shareTargetHandler ({event}) {
    const formData = await event.request.formData();
    const mediaFiles = formData.getAll('media');

    for (const mediaFile of mediaFiles) {
      // Do something with mediaFile
      // Maybe cache it or post it back to a server
      debugger;
    }

    // Do something with the rest of formData as you need
    // Maybe save it to IndexedDB
  }

// This is what used to be in the webpack file.
// let oldConfig = {
//     // Do not precache images
//     exclude: [/\.(?:png|jpg|jpeg|svg)$/],
//     // Define runtime caching rules.
//     runtimeCaching: [
//         {
//             // Match any request that ends with .png, .jpg, .jpeg or .svg.
//             urlPattern: /\.(?:png|jpg|jpeg|svg)$/,

//             // Apply a cache-first strategy.
//             handler: 'CacheFirst',

//             options: {
//                 // Use a custom cache name.
//                 cacheName: 'curatorimages',

//                 // Only cache 10 images.
//                 expiration: {
//                     maxEntries: 10,
//                 },
//             },
//         },
//         {
//             urlPattern: /fonts\.gstatic\.com\/(.*)/,
//             handler: 'CacheFirst',
//             options: {
//                 cacheName: 'google-font-file-cache',
//                 expiration: {
//                     maxEntries: 10,
//                 },
//             },
//         },
//         {
//             urlPattern: /fonts\.googleapis\.com\/(.*)/,
//             handler: 'CacheFirst',
//             options: {
//                 cacheName: 'google-font-style-cache',
//                 expiration: {
//                     maxEntries: 10,
//                 },
//             },
//         },
//     ],
// };
