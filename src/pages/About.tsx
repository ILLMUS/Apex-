import Layout from "@/components/Layout";
import aboutImg from "@/assets/about-school.jpg";
import { Target, Eye, Compass } from "lucide-react";

const values = [
  { icon: Target, title: "Our Mission", desc: "To develop disciplined, high-performing students equipped with the academic skills, critical thinking abilities, and personal resilience required to thrive in higher education and beyond." },
  { icon: Eye, title: "Our Vision", desc: "To be recognised as a leading institution for structured academic excellence — producing graduates who are confident, capable, and future-ready." },
  { icon: Compass, title: "Our Values", desc: "Discipline, Integrity, Excellence, Accountability, and Continuous Improvement guide everything we do — from the classroom to the sports field." },
];

const About = () => (
  <Layout>
    <section className="relative py-20 md:py-28">
      <div className="absolute inset-0">
        <img src={aboutImg} alt="Apex Academy building" className="w-full h-full object-cover" loading="lazy" width={1280} height={720} />
        <div className="absolute inset-0 bg-blue-gradient opacity-80" />
      </div>
      <div className="relative container-narrow mx-auto px-4 sm:px-6 lg:px-8 text-primary-foreground">
        <p className="font-bold text-xs uppercase tracking-widest mb-3 opacity-80">About Us</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold max-w-2xl">A School Built on Structure, Driven by Results</h1>
      </div>
    </section>

    <section className="section-padding bg-background">
      <div className="container-narrow mx-auto max-w-3xl">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-6">Who We Are</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>Apex Academy is a performance-driven educational institution focused on producing students who excel academically and develop the personal discipline needed for long-term success.</p>
          <p>Our structured environment ensures that every student receives consistent, high-quality instruction paired with regular assessment and personalised feedback. We believe that discipline is not a restriction — it is the foundation of freedom, enabling students to take control of their learning and their futures.</p>
          <p>With small class sizes, experienced educators, and a clear academic framework, we create the conditions for every student to reach their full potential.</p>
        </div>
      </div>
    </section>

    <section className="section-padding bg-muted">
      <div className="container-narrow mx-auto">
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {values.map((v) => (
            <div key={v.title} className="bg-background p-8 text-center">
              <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <v.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{v.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default About;
