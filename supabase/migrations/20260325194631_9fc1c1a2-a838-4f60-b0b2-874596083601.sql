-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  previous_school TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  last_grade TEXT NOT NULL,
  report_url TEXT,
  birth_cert_url TEXT,
  parent_id_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public application form)
CREATE POLICY "Anyone can submit an application"
ON public.applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users (admins) can view
CREATE POLICY "Authenticated users can view applications"
ON public.applications FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update status
CREATE POLICY "Authenticated users can update applications"
ON public.applications FOR UPDATE
TO authenticated
USING (true);

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false);

-- Allow anyone to upload to application-documents
CREATE POLICY "Anyone can upload application documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'application-documents');

-- Allow authenticated users to view documents
CREATE POLICY "Authenticated users can view application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'application-documents');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();