// sw.js - Service Worker كامل مع دعم Firebase

// استيراد Firebase SDK
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDiwwV4dE0GGkP_wBwzgY_zDrw3_dJEjRs",
  authDomain: "dailybibleverse-71f31.firebaseapp.com",
  projectId: "dailybibleverse-71f31",
  storageBucket: "dailybibleverse-71f31.firebasestorage.app",
  messagingSenderId: "930866590711",
  appId: "1:930866590711:web:4e952f86d3e9afee4f34f2",
  measurementId: "G-0QTCYQ5XPJ"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ========== 1. معالجة الإشعارات في الخلفية (حتى لو التطبيق مقفول) ==========
messaging.onBackgroundMessage((payload) => {
  console.log("[sw.js] Background message received:", payload);
  
  const notificationTitle = payload.notification?.title || "📖 آية اليوم";
  const notificationOptions = {
    body: payload.notification?.body || "وقت قراءة كلمة الله",
    icon: payload.notification?.icon || "https://cdn-icons-png.flaticon.com/512/2903/2903510.png",
    badge: "https://cdn-icons-png.flaticon.com/512/2903/2903510.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: payload.fcmOptions?.link || "https://medhatmena03-code.github.io"
    }
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ========== 2. عند الضغط على الإشعار ==========
self.addEventListener('notificationclick', (event) => {
  console.log("[sw.js] Notification clicked:", event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "https://medhatmena03-code.github.io";
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // لو فيه نافذة مفتوحة، نفتحها بدل ما نعمل نافذة جديدة
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // لو مفيش نافذة مفتوحة، نفتح واحدة جديدة
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ========== 3. تسجيل التذكير في Service Worker ==========
self.addEventListener('message', (event) => {
  console.log("[sw.js] Message received:", event.data);
  
  if (event.data && event.data.type === 'SET_REMINDER') {
    const targetTime = event.data.time;
    const [hours, minutes] = targetTime.split(':');
    
    const now = new Date();
    const target = new Date();
    target.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    let delay = target - now;
    if (delay < 0) delay += 24 * 60 * 60 * 1000;
    
    console.log(`[sw.js] Reminder set for ${targetTime}, delay: ${delay}ms`);
    
    setTimeout(() => {
      console.log("[sw.js] Sending reminder notification");
      self.registration.showNotification("📖 آية اليوم", {
        body: `وقت قراءة كلمة الله الساعة ${targetTime}`,
        icon: "https://cdn-icons-png.flaticon.com/512/2903/2903510.png",
        vibrate: [200, 100, 200],
        requireInteraction: true
      });
    }, delay);
  }
});

// ========== 4. تثبيت Service Worker (تخزين الملفات مؤقتًا) ==========
const CACHE_NAME = 'daily-bible-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  console.log("[sw.js] Installing Service Worker");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[sw.js] Caching files");
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// ========== 5. تنشيط Service Worker ==========
self.addEventListener('activate', (event) => {
  console.log("[sw.js] Activating Service Worker");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("[sw.js] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// ========== 6. استراتيجية Fetch (شبكة أولاً، ثم الكاش) ==========
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين نسخة من الرد في الكاش
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // لو فشلت الشبكة، نجيب من الكاش
        return caches.match(event.request);
      })
  );
});