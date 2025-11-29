import { useEffect, useState } from "react";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await ApiService.getNotifications(user.id);
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [user]);

  const markAsRead = async (id: string) => {
    await ApiService.markNotificationRead(id);
    fetchNotifications();
  };

  if (!user) return <div className="p-8">Please log in to view notifications.</div>;
  if (loading) return <div className="p-8">Loading notifications...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      {notifications.length === 0 ? (
        <div className="text-gray-500">No notifications yet.</div>
      ) : (
        notifications.map((notif) => (
          <Card
            key={notif.id}
            className={`mb-4 ${!notif.is_read ? "border-orange-400 bg-orange-50" : ""}`}
          >
            <CardHeader>
              <CardTitle>{notif.title}</CardTitle>
              <span className="text-xs text-gray-400">{new Date(notif.created_at).toLocaleString()}</span>
            </CardHeader>
            <CardContent>
              <div className="mb-2">{notif.message}</div>
              {!notif.is_read && (
                <Button size="sm" onClick={() => markAsRead(notif.id)}>
                  Mark as read
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
} 