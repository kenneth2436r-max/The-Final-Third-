import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing subscription' });
    }

    const key = subscription.endpoint.replace(/[^a-zA-Z0-9]/g, '');
    await kv.set(`sub:${key}`, JSON.stringify(subscription));

    const count = await kv.incr('sub_count');
    console.log(`Subscriber #${count}: ${subscription.endpoint.slice(0, 50)}...`);

    return res.status(200).json({ ok: true, count });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
