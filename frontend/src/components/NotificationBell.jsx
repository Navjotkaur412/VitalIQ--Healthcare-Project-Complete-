import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { formatDateTime } from "../lib/vitals";

const TYPE_DOT = {
  appointment: "bg-brand",
  medication_reminder: "bg-status-moderate",
  system: "bg-muted",
  high_risk: "bg-signal",
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      // silent — notification bell shouldn't interrupt the rest of the app
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      /* no-op */
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      /* no-op */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-brand-light transition-colors"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-signal text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-line rounded-xl shadow-card z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <p className="font-display font-semibold text-sm text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-brand hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => !n.read && markRead(n._id)}
                  className={`w-full text-left px-4 py-3 border-b border-line last:border-0 hover:bg-brand-light/50 transition-colors ${
                    n.read ? "bg-surface" : "bg-brand-light/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${TYPE_DOT[n.type] || "bg-muted"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted/70 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
