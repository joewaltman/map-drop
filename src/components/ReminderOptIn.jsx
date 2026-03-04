import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeReminders, unsubscribeReminders } from '../utils/auth';

export default function ReminderOptIn() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  // If already subscribed, show toggle-off option
  if (user.reminderEnabled) {
    const handleUnsubscribe = async () => {
      setLoading(true);
      try {
        await unsubscribeReminders();
        await refreshUser();
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="reminder-opt-in">
        <span className="reminder-text">Daily reminders: ON</span>
        <button className="btn-reminder-toggle" onClick={handleUnsubscribe} disabled={loading}>
          {loading ? '...' : 'Turn off'}
        </button>
      </div>
    );
  }

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await subscribeReminders(tz);
      await refreshUser();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reminder-opt-in">
      <span className="reminder-text">Get reminded when the next puzzle drops?</span>
      <div className="reminder-actions">
        <button className="btn btn-primary btn-reminder" onClick={handleSubscribe} disabled={loading}>
          {loading ? '...' : 'Yes, remind me'}
        </button>
        <button className="btn-reminder-dismiss" onClick={() => setDismissed(true)}>
          No thanks
        </button>
      </div>
    </div>
  );
}
