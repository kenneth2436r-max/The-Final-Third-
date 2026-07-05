import { kv } from '@vercel/kv';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:thefinalthird@buttondown.email',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.query.key !== process.env.BROADCAST_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const title = req.query.title || 'New post on The Final Third';
  const body = req.query.body || 'New match analysis published.';
  const url = req.query.url || '/';
  const tag = req.query.tag || 'tft-new-post';

  try {
    const keys = await kv.keys('sub:*');
    let sent = 0;
    let failed = 0;

    for (const key of keys) {
      try {
        const raw = await kv.get(key);
        if (!raw) continue;
        const sub = JSON.parse(raw);
        await webpush.sendNotification(sub, JSON.stringify({
          title, body, url, tag, icon: '/icon-192.png'
        }));
        sent++;
      } catch (err) {
        if (err.statusCode === 410) {
          await kv.del(key);
        }
        failed++;
      }
    }

    return res.status(200).json({ ok: true, sent, failed, total: keys.length });
  } catch (err) {
    console.error('Broadcast error:', err);
    return res.status(500).json({ error: err.message });
  }
}
