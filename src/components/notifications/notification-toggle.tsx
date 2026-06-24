"use client";

import { useState, useEffect } from "react";

export function NotificationToggle() {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (res.ok) {
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
    setLoading(false);
  }

  if (!mounted) return null;

  if (!("Notification" in window)) return null;

  if (permission === "denied") {
    return (
      <div className="rounded-xl bg-card-bg border border-card-border p-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔕</span>
          <div>
            <p className="text-sm text-white font-medium">Notificações bloqueadas</p>
            <p className="text-xs text-muted">Habilite nas configurações do navegador</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card-bg border border-card-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{subscribed ? "🔔" : "🔕"}</span>
          <div>
            <p className="text-sm text-white font-medium">Notificações Push</p>
            <p className="text-xs text-muted">
              {subscribed
                ? "Você receberá alertas de jogos"
                : "Ative para receber alertas"}
            </p>
          </div>
        </div>

        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            subscribed
              ? "bg-card-border text-muted hover:bg-accent-red/20 hover:text-accent-red"
              : "gradient-spectrum text-white hover:opacity-90"
          }`}
        >
          {loading ? "..." : subscribed ? "Desativar" : "Ativar"}
        </button>
      </div>
    </div>
  );
}
