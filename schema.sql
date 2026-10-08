-- ====================================================================
-- SURAAKSHA: Supabase PostgreSQL Database Schema
-- Run this in your Supabase project's SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id BIGSERIAL PRIMARY KEY,
    account TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Twitter / X',
    type TEXT NOT NULL DEFAULT 'Hate Speech',
    severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 10),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    reported_by TEXT NOT NULL DEFAULT '1 officer',
    evidence JSONB DEFAULT '{}'::jsonb,
    account_profile JSONB DEFAULT '{}'::jsonb,
    decision TEXT,
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migration safety for existing table: ensure newly added columns exist
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_status_check;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_status_check CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed', 'escalated', 'reviewed'));


-- 2. Create officers profile table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    badge TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'officer' CHECK (role IN ('officer', 'analyst', 'supervisor', 'admin')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Row Level Security (RLS) policies
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated officers full read and write access to alerts
DROP POLICY IF EXISTS "Allow authenticated read on alerts" ON public.alerts;
CREATE POLICY "Allow authenticated read on alerts"
    ON public.alerts FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on alerts" ON public.alerts;
CREATE POLICY "Allow authenticated insert on alerts"
    ON public.alerts FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on alerts" ON public.alerts;
CREATE POLICY "Allow authenticated update on alerts"
    ON public.alerts FOR UPDATE
    TO authenticated
    USING (true);

-- Allow public read, insert, and update on alerts
DROP POLICY IF EXISTS "Allow anon read on alerts" ON public.alerts;
CREATE POLICY "Allow anon read on alerts"
    ON public.alerts FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on alerts" ON public.alerts;
CREATE POLICY "Allow anon insert on alerts"
    ON public.alerts FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on alerts" ON public.alerts;
CREATE POLICY "Allow anon update on alerts"
    ON public.alerts FOR UPDATE
    TO anon
    USING (true);

-- Officer profile policies
DROP POLICY IF EXISTS "Officers can read own profile" ON public.officers;
CREATE POLICY "Officers can read own profile"
    ON public.officers FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow anon insert on officers" ON public.officers;
CREATE POLICY "Allow anon insert on officers"
    ON public.officers FOR INSERT
    TO anon
    WITH CHECK (true);


-- Automatic trigger to populate public.officers whenever a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.officers (id, email, name, badge, role, phone)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'badge', 'SOC-' || substring(new.id::text from 1 for 4)),
        COALESCE(new.raw_user_meta_data->>'role', 'officer'),
        new.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        badge = EXCLUDED.badge,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for Supabase Auth users who signed up before the trigger existed
INSERT INTO public.officers (id, email, name, badge, role, phone)
SELECT
    users.id,
    users.email,
    COALESCE(users.raw_user_meta_data->>'name', split_part(users.email, '@', 1)),
    COALESCE(users.raw_user_meta_data->>'badge', 'SOC-' || substring(users.id::text from 1 for 4)),
    COALESCE(users.raw_user_meta_data->>'role', 'officer'),
    users.raw_user_meta_data->>'phone'
FROM auth.users AS users
WHERE users.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    badge = EXCLUDED.badge,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

-- 4. Initial Threat Intelligence Alerts
INSERT INTO public.alerts (account, platform, type, severity, reason, status, reported_by, evidence, account_profile, decision, notes, reviewed_at, reviewed_by)
VALUES
(
    '@crypto_rewards_777',
    'Twitter / X',
    'Impersonation & Scam',
    9,
    'Account impersonates @CryptoRewards (verified). Uses similar handle, posts identical scam content promising free cryptocurrency with shortened links.',
    'open',
    '3 users',
    '{"content": "Congratulations! You won 2 ETH! Claim here: bit.ly/xyz123", "postLink": "https://twitter.com/crypto_rewards_777/status/1234567890", "timestamp": "2024-10-07T14:25:00Z"}'::jsonb,
    '{"username": "crypto_rewards_777", "followers": "12.5K", "created": "2024-09-15", "location": "User reported as Singapore"}'::jsonb,
    NULL,
    '',
    NULL,
    NULL
),
(
    '@suport_paypal_help',
    'Twitter / X',
    'Phishing Impersonation',
    8,
    'Account mimics official PayPal support (@AskPayPal). Uses typo variation in handle, posts phishing links in official account style.',
    'open',
    '5 users',
    '{"content": "PayPal security alert: verify your account immediately paypalveryify.net", "postLink": "https://twitter.com/suport_paypal_help/status/9876543210", "timestamp": "2024-10-07T13:10:00Z"}'::jsonb,
    '{"username": "suport_paypal_help", "followers": "8.2K", "created": "2024-08-20", "location": "User reported as Malaysia"}'::jsonb,
    NULL,
    '',
    NULL,
    NULL
),
(
    '@harassment_bot_2024',
    'Instagram',
    'Coordinated Harassment',
    7,
    'Account posts identical harassment content on rapid schedule (6 posts in 2 hours). Targets same individual with threats and doxxing attempts.',
    'open',
    '12 users',
    '{"content": "Targeting specific user with repeated threats across multiple posts in 2-hour window", "postLink": "https://instagram.com/p/DB12345678", "timestamp": "2024-10-07T11:30:00Z"}'::jsonb,
    '{"username": "harassment_bot_2024", "followers": "324", "created": "2024-10-05", "location": "Not publicly disclosed"}'::jsonb,
    NULL,
    '',
    NULL,
    NULL
),
(
    '@malware_link_bot',
    'Telegram / Discord',
    'Malware Distribution',
    9,
    'Account distributes known malware payload. Domain resolves to C2 infrastructure. 47 user reports of credential theft after clicking link.',
    'reviewed',
    '8 users',
    '{"content": "Free Xbox Game Pass! Download now: suspiciousdownload.ru/pass", "postLink": "https://t.me/malware_link_bot/4444", "timestamp": "2024-10-06T22:05:00Z"}'::jsonb,
    '{"username": "malware_link_bot", "followers": "2.1K", "created": "2024-09-01", "location": "User reported as Russia"}'::jsonb,
    'escalate',
    'Escalated to law enforcement liaison. Domain registered to proxy service. Monitor for migration to backup accounts.',
    '2024-10-06T22:45:00Z',
    'Officer Sarah Jenkins'
),
(
    '@fake_news_politics',
    'Facebook',
    'Misinformation Campaign',
    6,
    'Account spreads election misinformation. Part of coordinated network (7 related accounts detected). Content contradicts official sources.',
    'open',
    '4 users',
    '{"content": "Breaking: Fake election results being spread. Original from unreliable source.", "postLink": "https://facebook.com/story.php?story_fbid=3333333333", "timestamp": "2024-10-07T09:15:00Z"}'::jsonb,
    '{"username": "fake_news_politics", "followers": "5.8K", "created": "2024-10-01", "location": "User reported as Unknown"}'::jsonb,
    NULL,
    '',
    NULL,
    NULL
),
(
    '@bank_security_alert_uk',
    'Twitter / X',
    'Credential Harvesting',
    10,
    'Direct targeted credential harvesting campaign cloning mobile banking OTP portals. Active reverse-proxy stealing 2FA tokens.',
    'open',
    '19 users',
    '{"content": "URGENT: Suspicious activity logged on your UK Barclays/HSBC account. Re-authenticate: secure-auth-gateway.online", "postLink": "https://twitter.com/bank_security_alert_uk/status/11223344", "timestamp": "2024-10-07T15:05:00Z"}'::jsonb,
    '{"username": "bank_security_alert_uk", "followers": "15.9K", "created": "2024-10-02", "location": "Reported IP: Eastern Europe"}'::jsonb,
    NULL,
    '',
    NULL,
    NULL
)
ON CONFLICT DO NOTHING;
