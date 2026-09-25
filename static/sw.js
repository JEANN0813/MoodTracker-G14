// static/sw.js

// Listen for background Web Push events
self.addEventListener('push', function(event) {
    let data = { title: '⏰ Alarm Alert', body: 'Your scheduled alarm time has arrived!' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/static/icons/alarm-icon.png',
        badge: '/static/icons/badge-icon.png',
        requireInteraction: true, // Keep notification visible until user interacts
        data: {
            url: '/'
        }
    };

    // Trigger system notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle user click on notification
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    // Focus or reopen the web application tab
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});