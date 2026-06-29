
-- Replace the assigned-admin-only insert policy with one allowing any admin
DROP POLICY IF EXISTS "Assigned admin can send messages" ON public.application_messages;

CREATE POLICY "Admins can send messages on any application"
ON public.application_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'admin'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_messages.application_id
      AND a.parent_user_id IS NOT NULL
  )
);

-- Parent insert policy is fine (already scopes to own application). Keep as-is.

-- Broaden can_access_application so any admin (not just assigned) can view/update read receipts
CREATE OR REPLACE FUNCTION public.can_access_application(_application_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = _application_id
      AND (
        a.parent_user_id = _user_id
        OR public.has_role(_user_id, 'admin'::app_role)
      )
  )
$function$;
