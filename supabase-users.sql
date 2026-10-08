-- Run this migration in the Supabase SQL Editor to sync Auth users
-- into the public.officers profile table.

CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    badge TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'officer'
        CHECK (role IN ('officer', 'analyst', 'supervisor', 'admin')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Officers can read own profile" ON public.officers;
CREATE POLICY "Officers can read own profile"
    ON public.officers FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        badge = EXCLUDED.badge,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
