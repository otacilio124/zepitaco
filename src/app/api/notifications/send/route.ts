import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions, notificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

webpush.setVapidDetails(
  "mailto:noreply@zepitaco.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, url, tag, type } = await request.json();

  const allSubscriptions = await db.select().from(pushSubscriptions);

  let sent = 0;
  let failed = 0;

  for (const sub of allSubscriptions) {
    if (type) {
      const [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, sub.userId))
        .limit(1);

      if (prefs) {
        if (type === "match_start" && !prefs.notifyMatchStart) continue;
        if (type === "big_analysis" && !prefs.notifyBigAnalyses) continue;
      }
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({ title, body, url, tag })
      );
      sent++;
    } catch (error: unknown) {
      failed++;
      if (error && typeof error === "object" && "statusCode" in error && (error as { statusCode: number }).statusCode === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, sub.endpoint));
      }
    }
  }

  return NextResponse.json({ sent, failed });
}
