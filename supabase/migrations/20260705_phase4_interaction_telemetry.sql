-- Create interaction telemetry and safe-space pipeline tables (Beteseb v3.6 Phase 4.5)

CREATE TABLE IF NOT EXISTS public.interaction_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  friendship_id UUID REFERENCES public.friendships(id) ON DELETE CASCADE UNIQUE,
  reply_latency_seconds INT DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  conflict_score INT DEFAULT 0, -- 0 to 100
  phase INT DEFAULT 1, -- Phase 1: Icebreakers, Phase 2: Pulse Check, Phase 3: Safe Space Room
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for telemetry to ensure strict privacy isolation
ALTER TABLE public.interaction_telemetry ENABLE ROW LEVEL SECURITY;

-- Telemetry is strictly hidden from Admins & Moderators. Only the two chatting participants can access it.
CREATE POLICY telemetry_isolation_policy ON public.interaction_telemetry
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.id = friendship_id
      AND (f.sender_id = auth.uid() OR f.receiver_id = auth.uid())
    )
  );

-- Populate telemetry automatically when friendships are accepted
CREATE OR REPLACE FUNCTION public.handle_new_friendship_telemetry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.interaction_telemetry (friendship_id, reply_latency_seconds, is_frozen, conflict_score, phase)
    VALUES (NEW.id, 0, false, 0, 1)
    ON CONFLICT (friendship_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friendship_accepted_telemetry
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_friendship_telemetry();
