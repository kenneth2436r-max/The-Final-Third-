import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.Thefinalthird_KV_REST_API_URL,
  token: process.env.Thefinalthird_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription" });
    }

    const subscriptions = await redis.get("push-subscriptions") || [];
    subscriptions.push(subscription);
    await redis.set("push-subscriptions", subscriptions);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
