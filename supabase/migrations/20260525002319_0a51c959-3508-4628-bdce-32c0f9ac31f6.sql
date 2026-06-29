-- 1. Add assigned_admin_id to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid;

CREATE INDEX IF NOT EXISTS idx_applications_assigned_admin
  ON public.applications(assigned_admin_id);

-- 2. Helper: is the current user the parent or the assigned admin (or super_admin) for an application?
CREATE OR REPLACE FUNCTION public.can_access_application(_application_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = _application_id
      AND (
        a.parent_user_id = _user_id
        OR a.assigned_admin_id = _user_id
        OR public.has_role(_user_id, 'super_admin'::app_role)
      )
  )
$$;

-- 3. Replace application_messages policies with stricter ones
DROP POLICY IF EXISTS "Admins insert application messages" ON public.application_messages;
DROP POLICY IF EXISTS "Admins update application messages" ON public.application_messages;
DROP POLICY IF EXISTS "Admins view all application messages" ON public.application_messages;
DROP POLICY IF EXISTS "Parents mark admin messages read" ON public.application_messages;
DROP POLICY IF EXISTS "Parents send messages on their application" ON public.application_messages;
DROP POLICY IF EXISTS "Parents view their application messages" ON public.application_messages;

-- SELECT: only the parent owner or the assigned admin (or super_admin)
CREATE POLICY "Thread participants can view messages"
ON public.application_messages
FOR SELECT
TO authenticated
USING (public.can_access_application(application_id, auth.uid()));

-- INSERT (admin): must be the assigned admin and sender_role admin
CREATE POLICY "Assigned admin can send messages"
ON public.application_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'admin'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_id
      AND (a.assigned_admin_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);

-- INSERT (parent): must own the application
CREATE POLICY "Parent can send messages on own application"
ON public.application_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'parent'
  AND EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_id
      AND a.parent_user_id = auth.uid()
  )
);

-- UPDATE (read receipts): only thread participants
CREATE POLICY "Thread participants can update read receipts"
ON public.application_messages
FOR UPDATE
TO authenticated
USING (public.can_access_application(application_id, auth.uid()))
WITH CHECK (public.can_access_application(application_id, auth.uid()));
