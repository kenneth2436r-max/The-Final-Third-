import { Redis } from "@upstash/redis";
import webpush from "web-push";

const redis = new Redis({
  url: process.env.Thefinalthird_KV_REST_API_URL,
  token: process.env.Thefinalthird_KV_REST_API_TOKEN,
});

webpush.setVapidDetails(
  "mailto:kenny@the-final-third.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  const auth = req.query.key || req.headers["x-broadcast-key"];
  if (auth !== process.env.BROADCAST_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, body, url } = req.method === "POST"
      ? req.body
      : { title: "New Post", body: "A new match analysis has been published", url: "/" };

    const subscriptions = await redis.get("push-subscriptions") || [];
    const results = await Promise.allSettled(
      subscriptions.map((sub) => webpush.sendNotification(sub, JSON.stringify({ title, body, url })))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    res.status(200).json({ sent, failed, total: subscriptions.length });
  } catch (err) {
    console.error("Broadcast error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
