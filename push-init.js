(function() {
  if (!('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) {
    console.log('Push notifications not supported');
    return;
  }

  if (localStorage.getItem('push_declined')) return;

  const publicKey = document.querySelector('meta[name="vapid-key"]')?.content;
  if (!publicKey) {
    console.log('VAPID public key not found');
    return;
  }

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON())
      });

      console.log('Push subscribed');
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        localStorage.setItem('push_declined', '1');
      }
      console.log('Push subscribe failed:', err);
    }
  }

  if (Notification.permission === 'granted') {
    subscribe();
  } else if (Notification.permission === 'default') {
    const handler = () => {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') subscribe();
        else localStorage.setItem('push_declined', '1');
      });
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
  }

  function urlBase64ToUint8Array(base64) {
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }
})();
