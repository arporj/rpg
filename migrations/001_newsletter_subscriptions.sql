-- Migration: 001_newsletter_subscriptions

CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribe_all BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE newsletter_chronicle_subscriptions (
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  chronicle_id UUID REFERENCES chronicles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (subscriber_id, chronicle_id)
);

-- Policies (RLS)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_chronicle_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert into subscribers
CREATE POLICY "Enable insert for anonymous users on subscribers" ON newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anonymous users to update their own sub rules (if they somehow match the email)
CREATE POLICY "Enable update for anonymous users on subscribers" ON newsletter_subscribers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow anonymous users to insert into chronicle links
CREATE POLICY "Enable insert for anonymous users on chronicle links" ON newsletter_chronicle_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Provide a function to upsert a subscriber and their preferences securely
-- (Because Postgres upserts with DO UPDATE work best with a function for complex cases)
CREATE OR REPLACE FUNCTION subscribe_to_newsletter(
  p_email text,
  p_chronicle_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_sub_id uuid;
BEGIN
  -- Insert or update the subscriber
  INSERT INTO newsletter_subscribers (email, subscribe_all, created_at)
  VALUES (p_email, CASE WHEN p_chronicle_id IS NULL THEN true ELSE false END, now())
  ON CONFLICT (email) DO UPDATE 
  SET subscribe_all = CASE 
                        WHEN p_chronicle_id IS NULL THEN true 
                        ELSE newsletter_subscribers.subscribe_all 
                      END
  RETURNING id INTO v_sub_id;

  -- Insert chronicle link if provided
  IF p_chronicle_id IS NOT NULL THEN
    INSERT INTO newsletter_chronicle_subscriptions (subscriber_id, chronicle_id, created_at)
    VALUES (v_sub_id, p_chronicle_id, now())
    ON CONFLICT (subscriber_id, chronicle_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
