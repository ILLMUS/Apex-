
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parent_user_id uuid;
CREATE INDEX IF NOT EXISTS idx_applications_parent_user ON public.applications(parent_user_id);

CREATE POLICY "Parents can view their own applications"
  ON public.applications FOR SELECT TO authenticated
  USING (parent_user_id = auth.uid());

CREATE TABLE public.application_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('parent','admin')),
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_msg_app ON public.application_messages(application_id, created_at);

ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all application messages"
  ON public.application_messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert application messages"
  ON public.application_messages FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND sender_id = auth.uid() AND sender_role = 'admin');

CREATE POLICY "Admins update application messages"
  ON public.application_messages FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents view their application messages"
  ON public.application_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.parent_user_id = auth.uid()));

CREATE POLICY "Parents send messages on their application"
  ON public.application_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND sender_role = 'parent'
    AND EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.parent_user_id = auth.uid())
  );

CREATE POLICY "Parents mark admin messages read"
  ON public.application_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.parent_user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.application_messages;
ALTER TABLE public.application_messages REPLICA IDENTITY FULL;
