import Layout from "@/components/Layout";
import classroomImg from "@/assets/classroom.jpg";
import { BookOpen, FlaskConical, Calculator, Globe, Palette, Laptop, BarChart3, ClipboardCheck } from "lucide-react";

const subjects = [
  { icon: Calculator, name: "Mathematics" },
  { icon: FlaskConical, name: "Natural Sciences" },
  { icon: Globe, name: "Social Sciences" },
  { icon: BookOpen, name: "Languages (English & Afrikaans)" },
  { icon: Laptop, name: "Technology & IT" },
  { icon: Palette, name: "Creative Arts" },
  { icon: BarChart3, name: "Economic & Management Sciences" },
  { icon: ClipboardCheck, name: "Life Orientation" },
];

const methodology = [
  { title: "Direct Instruction", desc: "Experienced educators deliver structured lessons with clear objectives and measurable outcomes for every period." },
  { title: "Continuous Assessment", desc: "Weekly tests, assignments, and projects provide ongoing feedback — identifying gaps early and reinforcing strengths." },
  { title: "Exam Preparation", desc: "Dedicated revision blocks, past paper practice, and exam technique workshops ensure students perform under pressure." },
  { title: "Data-Driven Tracking", desc: "Every student's progress is tracked against benchmarks, allowing targeted intervention when needed." },
];

const Academics = () => (
  <Layout>
    <section className="relative py-20 md:py-28">
      <div className="absolute inset-0">
        <img src={classroomImg} alt="Classroom" className="w-full h-full object-cover" loading="lazy" width={1280} height={720} />
        <div className="absolute inset-0 bg-blue-gradient opacity-80" />
      </div>
      <div className="relative container-narrow mx-auto px-4 sm:px-6 lg:px-8 text-primary-foreground">
        <p className="font-bold text-xs uppercase tracking-widest mb-3 opacity-80">Academics</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold max-w-2xl">Excellence Through Structure and Rigour</h1>
      </div>
    </section>

    <section className="section-padding bg-background">
      <div className="container-narrow mx-auto">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-3 text-center">Subjects Offered</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">A comprehensive curriculum designed to build strong foundations across all core disciplines.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {subjects.map((s) => (
            <div key={s.name} className="bg-background p-6 card-elevated flex flex-col items-center text-center gap-3">
              <s.icon className="h-8 w-8 text-primary" />
              <span className="font-semibold text-sm text-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding bg-muted">
      <div className="container-narrow mx-auto max-w-4xl">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-3 text-center">Teaching Methodology</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">Our approach is built on proven educational strategies that deliver consistent results.</p>
        <div className="grid sm:grid-cols-2 gap-px bg-border">
          {methodology.map((m, i) => (
            <div key={m.title} className="bg-background p-6 card-elevated">
              <div className="w-8 h-8 bg-primary/10 flex items-center justify-center mb-3 text-primary font-bold text-sm">
                {i + 1}
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{m.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default Academics;
