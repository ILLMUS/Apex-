import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { FileText, CheckCircle, ArrowRight, ClipboardList, Upload, UserCheck } from "lucide-react";

const requirements = [
  "Student's most recent school report",
  "Certified copy of birth certificate",
  "Parent/guardian ID document (certified copy)",
  "Proof of residence",
  "Transfer card (if from another school)",
];

const steps = [
  { icon: ClipboardList, title: "Complete Online Application", desc: "Fill in the multi-step application form with student and parent details." },
  { icon: Upload, title: "Upload Documents", desc: "Attach required documents including school report, birth certificate, and parent ID." },
  { icon: UserCheck, title: "Review & Admission Decision", desc: "Our admissions team reviews your application and contacts you within 5 business days." },
];

const Admissions = () => (
  <Layout>
    <section className="bg-blue-gradient py-20 md:py-28">
      <div className="container-narrow mx-auto px-4 sm:px-6 lg:px-8 text-primary-foreground">
        <p className="font-bold text-xs uppercase tracking-widest mb-3 opacity-80">Admissions</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold max-w-2xl mb-4">Begin Your Child's Journey to Excellence</h1>
        <p className="text-primary-foreground/70 max-w-lg text-lg mb-6">Follow our simple, transparent application process to secure a place at Apex Academy.</p>
        <a href="/apex-academy-prospectus.pdf" download className="btn-outline-school text-sm font-bold border-primary-foreground/30">
          Download Prospectus
        </a>
      </div>
    </section>

    <section className="section-padding bg-background">
      <div className="container-narrow mx-auto max-w-4xl">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-10 text-center">How to Apply</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <s.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-xs font-bold text-primary mb-2">STEP {i + 1}</div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding bg-muted">
      <div className="container-narrow mx-auto max-w-3xl">
        <div className="bg-background border border-border p-8 md:p-10 card-elevated">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold text-foreground">Required Documents</h2>
          </div>
          <ul className="space-y-3">
            {requirements.map((r) => (
              <li key={r} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    <section className="bg-blue-gradient section-padding">
      <div className="container-narrow mx-auto text-center text-primary-foreground">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Ready to Apply?</h2>
        <p className="text-primary-foreground/70 max-w-md mx-auto mb-8">
          Complete the online application form in under 10 minutes. Secure your child's place today.
        </p>
        <Link to="/apply" className="btn-primary-school text-lg border border-primary-foreground/20">
          Start Application <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </section>
  </Layout>
);

export default Admissions;
