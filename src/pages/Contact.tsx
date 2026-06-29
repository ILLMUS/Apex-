import { useState } from "react";
import Layout from "@/components/Layout";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Save to database for admin notifications
      const { error: dbError } = await supabase.from("contact_messages").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      if (dbError) console.error("DB save error:", dbError);

      // Also send to Airtable
      try {
        await supabase.functions.invoke("contact-form", { body: form });
      } catch (airtableErr) {
        console.error("Airtable error:", airtableErr);
      }

      toast({ title: "Message Sent", description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send message. Please try again.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <Layout>
      <section className="bg-blue-gradient py-20 md:py-28">
        <div className="container-narrow mx-auto px-4 sm:px-6 lg:px-8 text-primary-foreground">
          <p className="font-bold text-xs uppercase tracking-widest mb-3 opacity-80">Contact Us</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold max-w-2xl">Get in Touch</h1>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">We'd Love to Hear From You</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Whether you have questions about admissions, academics, or school life — our team is here to help.
              </p>
              <div className="space-y-5">
                {[
                  { icon: Phone, label: "Phone", value: "+27 12 345 6789" },
                  { icon: Mail, label: "Email", value: "admissions@apexacademy.edu" },
                  { icon: MapPin, label: "Address", value: "123 Academy Drive, Pretoria, South Africa" },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.label}</p>
                      <p className="text-muted-foreground text-sm">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-muted border border-border p-6 md:p-8 card-elevated space-y-5">
              {[
                { name: "name" as const, label: "Full Name", type: "text", placeholder: "Your name" },
                { name: "email" as const, label: "Email Address", type: "email", placeholder: "your@email.com" },
                { name: "phone" as const, label: "Phone Number", type: "tel", placeholder: "+27 ..." },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Your message..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary-school w-full">
                {submitting ? "Sending..." : "Send Message"} {!submitting && <Send className="ml-2 h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
