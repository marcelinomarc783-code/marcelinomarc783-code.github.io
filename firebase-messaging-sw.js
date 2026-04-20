// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDiwwV4dE0GGkP_wBwzgY_zDrw3_dJEjRs",
  authDomain: "dailybibleverse-71f31.firebaseapp.com",
  projectId: "dailybibleverse-71f31",
  storageBucket: "dailybibleverse-71f31.firebasestorage.app",
  messagingSenderId: "930866590711",
  appId: "1:930866590711:web:4e952f86d3e9afee4f34f2",
  measurementId: "G-0QTCYQ5XPJ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);
  
  const notificationTitle = payload.notification?.title || "📖 آية اليوم";
  const notificationOptions = {
    body: payload.notification?.body || "وقت قراءة كلمة الله",
    icon: "https://cdn-icons-png.flaticon.com/512/2903/2903510.png",
    vibrate: [200, 100, 200],
    requireInteraction: true
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("https://medhatmena03-code.github.io")
  );
});