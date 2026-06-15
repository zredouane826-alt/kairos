-- Expo push token on users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Reminder tracking on reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reminder_whatsapp_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_push_sent     BOOLEAN DEFAULT false;

-- Notification audit log
CREATE TABLE IF NOT EXISTS notification_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID        REFERENCES reservations(id) ON DELETE CASCADE,
  channel          TEXT        NOT NULL CHECK (channel IN ('whatsapp', 'push')),
  status           TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
  sent_at          TIMESTAMPTZ DEFAULT now(),
  error_message    TEXT
);

-- pg_cron: send-reminders every day at 17:00 UTC (18:00 Algiers)
-- Requires pg_cron extension enabled in Supabase Dashboard → Extensions
SELECT cron.schedule(
  'send-reminders-daily',
  '0 17 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
