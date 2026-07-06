(function () {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const vapidKey = document.querySelector('meta[name="vapid-key"]')?.getAttribute("content");
  if (!vapidKey) return;

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64).split("").map((c) => c.charCodeAt(0)));
  }

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }

  if ("Notification" in window && Notification.permission === "default") {
    document.addEventListener("click", () => {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") subscribe();
      });
    }, { once: true });
  }

  if (Notification.permission === "granted") subscribe();
})();
