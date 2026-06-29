import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, User, Users, BookOpen, FileText, Eye } from "lucide-react";

type FormData = {
  studentName: string;
  dob: string;
  previousSchool: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  lastGrade: string;
  reportFile: File | null;
  birthCertFile: File | null;
  parentIdFile: File | null;
};

const initialData: FormData = {
  studentName: "",
  dob: "",
  previousSchool: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  lastGrade: "",
  reportFile: null,
  birthCertFile: null,
  parentIdFile: null,
};

const stepsMeta = [
  { label: "Student Info", icon: User },
  { label: "Parent Info", icon: Users },
  { label: "Academics", icon: BookOpen },
  { label: "Documents", icon: FileText },
  { label: "Review", icon: Eye },
];

const uploadFile = async (file: File, folder: string) => {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("application-documents").upload(path, file);
  if (error) throw error;
  return path;
};

const Apply = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email || "");
        setForm((p) => ({ ...p, parentEmail: p.parentEmail || data.session!.user.email || "" }));
      }
      setAuthChecked(true);
    });
  }, []);

  const set = (field: keyof FormData, value: string | File | null) =>
    setForm((p) => ({ ...p, [field]: value }));

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const canNext = () => {
    if (step === 0) return form.studentName && form.dob && form.previousSchool;
    if (step === 1) return form.parentName && form.parentPhone && form.parentEmail;
    if (step === 2) return form.lastGrade;
    if (step === 3) return form.birthCertFile && form.parentIdFile;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let reportUrl: string | null = null;
      let birthCertUrl: string | null = null;
      let parentIdUrl: string | null = null;

      if (form.reportFile) reportUrl = await uploadFile(form.reportFile, "reports");
      if (form.birthCertFile) birthCertUrl = await uploadFile(form.birthCertFile, "birth-certs");
      if (form.parentIdFile) parentIdUrl = await uploadFile(form.parentIdFile, "parent-ids");

      const { error } = await supabase.from("applications").insert({
        student_name: form.studentName,
        date_of_birth: form.dob,
        previous_school: form.previousSchool,
        parent_name: form.parentName,
        parent_phone: form.parentPhone,
        parent_email: form.parentEmail,
        last_grade: form.lastGrade,
        report_url: reportUrl,
        birth_cert_url: birthCertUrl,
        parent_id_url: parentIdUrl,
        parent_user_id: userId,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Application Submitted!", description: "We'll review your application and contact you soon." });
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <Layout>
        <section className="section-padding bg-background min-h-[40vh] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </section>
      </Layout>
    );
  }

  if (!userId) {
    return <Navigate to="/parent/auth?next=/apply" replace />;
  }

  if (submitted) {
    return (
      <Layout>
        <section className="section-padding bg-background min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Application Received!</h1>
            <p className="text-muted-foreground mb-2">Thank you for applying to Apex Academy.</p>
            <p className="text-muted-foreground text-sm mb-6">Our admissions team will review your application and contact you within 5 business days.</p>
            <a href="/parent" className="btn-primary-school text-sm">Go to Parent Portal</a>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-blue-gradient py-12 md:py-16">
        <div className="container-narrow mx-auto px-4 sm:px-6 lg:px-8 text-primary-foreground">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Online Application</h1>
          <p className="text-primary-foreground/70">Complete all steps to submit your application.</p>
        </div>
      </section>

      <section className="section-padding bg-background !py-10">
        <div className="container-narrow mx-auto max-w-3xl">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
            {stepsMeta.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center min-w-[64px]">
                  <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-colors ${
                    i < step ? "bg-primary text-primary-foreground" :
                    i === step ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <CheckCircle className="h-5 w-5" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 4 && <div className={`w-8 md:w-16 h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* Form Steps */}
          <div className="bg-muted border border-border p-6 md:p-8 card-elevated min-h-[320px]">
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-foreground">Student Information</h2>
                <InputField label="Full Name" value={form.studentName} onChange={(v) => set("studentName", v)} placeholder="e.g. John Smith" />
                <InputField label="Date of Birth" value={form.dob} onChange={(v) => set("dob", v)} type="date" />
                <InputField label="Previous School" value={form.previousSchool} onChange={(v) => set("previousSchool", v)} placeholder="e.g. Springfield High" />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-foreground">Parent / Guardian Information</h2>
                <InputField label="Full Name" value={form.parentName} onChange={(v) => set("parentName", v)} placeholder="e.g. Jane Smith" />
                <InputField label="Phone Number" value={form.parentPhone} onChange={(v) => set("parentPhone", v)} type="tel" placeholder="+27 ..." />
                <InputField label="Email Address" value={form.parentEmail} onChange={(v) => set("parentEmail", v)} type="email" placeholder="parent@email.com" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-foreground">Academic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Last Grade Completed</label>
                  <select
                    value={form.lastGrade}
                    onChange={(e) => set("lastGrade", e.target.value)}
                    className="w-full border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select grade...</option>
                    {["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <FileUpload label="Upload Latest School Report (optional)" file={form.reportFile} onFile={(f) => set("reportFile", f)} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-foreground">Document Upload</h2>
                <p className="text-muted-foreground text-sm">Upload certified copies of the following documents.</p>
                <FileUpload label="Birth Certificate *" file={form.birthCertFile} onFile={(f) => set("birthCertFile", f)} required />
                <FileUpload label="Parent/Guardian ID *" file={form.parentIdFile} onFile={(f) => set("parentIdFile", f)} required />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-foreground">Review Your Application</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReviewItem label="Student Name" value={form.studentName} />
                  <ReviewItem label="Date of Birth" value={form.dob} />
                  <ReviewItem label="Previous School" value={form.previousSchool} />
                  <ReviewItem label="Last Grade" value={form.lastGrade} />
                  <ReviewItem label="Parent Name" value={form.parentName} />
                  <ReviewItem label="Parent Phone" value={form.parentPhone} />
                  <ReviewItem label="Parent Email" value={form.parentEmail} />
                  <ReviewItem label="Report" value={form.reportFile?.name || "Not uploaded"} />
                  <ReviewItem label="Birth Certificate" value={form.birthCertFile?.name || "Not uploaded"} />
                  <ReviewItem label="Parent ID" value={form.parentIdFile?.name || "Not uploaded"} />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={prev}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-muted border border-border hover:bg-muted/80 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canNext()}
                className="btn-primary-school text-sm disabled:opacity-40"
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary-school text-sm disabled:opacity-60">
                {submitting ? "Submitting..." : "Submit Application"} {!submitting && <CheckCircle className="ml-1 h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

const InputField = ({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
    <input
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

const FileUpload = ({ label, file, onFile, required = false }: {
  label: string; file: File | null; onFile: (f: File | null) => void; required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
    <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-input bg-background px-4 py-4 hover:border-primary/50 transition-colors">
      <Upload className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{file ? file.name : "Click to upload (PDF, JPG, PNG)"}</span>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        required={required}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
    </label>
  </div>
);

const ReviewItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-background border border-border p-3">
    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

export default Apply;
