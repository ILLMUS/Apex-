import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, BookOpen, Trophy, Users, Target, Shield, ArrowRight, Star } from "lucide-react";
import Layout from "@/components/Layout";
import WhatsAppButton from "@/components/WhatsAppButton";
import heroCampus from "@/assets/hero-campus.jpg";
import heroVideo from "@/assets/hero-loop.mp4";
import heroVideoMobile from "@/assets/hero-loop-mobile.mp4";
import classroomImg from "@/assets/classroom.jpg";

const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
};

const stats = [
  { value: 98, suffix: "%", label: "Matric Pass Rate" },
  { value: 12, suffix: "+", label: "Years of Excellence" },
  { value: 850, suffix: "+", label: "Students Enrolled" },
  { value: 35, suffix: "+", label: "Qualified Educators" },
];

const whyChooseUs = [
  { icon: Shield, title: "Structured Discipline", desc: "A consistent, fair system that builds responsibility and self-management in every student." },
  { icon: Trophy, title: "Academic Excellence", desc: "Proven track record of outstanding exam results through rigorous, focused teaching." },
  { icon: Target, title: "Goal-Oriented Learning", desc: "Every lesson, assessment, and activity is designed to drive measurable academic progress." },
  { icon: Users, title: "Small Class Sizes", desc: "Personalised attention ensures no student falls behind and every learner is challenged." },
];

const outcomes = [
  "Independent, self-directed learners",
  "Confident communicators and leaders",
  "Consistently high academic performers",
  "Students prepared for tertiary education",
  "Strong problem-solving capabilities",
  "Disciplined time management skills",
];

const StatCounter = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="bg-background p-3 sm:p-4 md:p-6 text-center">
      <p className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1">
        {count}{suffix}
      </p>
      <p className="text-muted-foreground text-[10px] sm:text-xs font-medium uppercase tracking-wider leading-tight">{label}</p>
    </div>
  );
};

const Index = () => (
  <Layout>
    {/* Hero — 50vh, video loop background, split layout, text on right */}
    <section className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        poster={heroCampus}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src={heroVideoMobile} media="(max-width: 768px)" />
        <source src={heroVideo} />
      </video>
      <div className="absolute inset-0 bg-blue-gradient opacity-70" />
      <div className="relative container-narrow mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center h-full">
          {/* Left — visual space (image shows through) */}
          <div className="hidden lg:block" />
          {/* Right — text content */}
          <div className="text-primary-foreground">
            <p className="font-semibold tracking-widest uppercase text-xs mb-4 opacity-80 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Now Accepting Applications for 2026
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Building Disciplined, High-Performing Students Ready for the Future
            </h1>
            <p className="text-base text-primary-foreground/80 mb-7 max-w-lg animate-fade-up" style={{ animationDelay: "0.3s" }}>
              A structured academic environment designed to help students focus, perform, and succeed in national examinations and beyond.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <Link to="/apply" className="btn-primary-school text-sm font-bold">
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a href="/apex-academy-prospectus.pdf" download className="btn-outline-school text-sm font-bold">
                Download Prospectus
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Statistics Counter */}
    <section className="bg-muted border-y border-border">
      <div className="container-narrow mx-auto">
        <div className="grid grid-cols-4 gap-px bg-border">
          {stats.map((s) => (
            <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </div>
    </section>

    {/* Why Choose Us */}
    <section className="section-padding bg-background">
      <div className="container-narrow mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Why Apex Academy</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Why Parents Choose Us</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="bg-background p-8 card-elevated">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-5">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Academic Approach */}
    <section className="section-padding bg-muted">
      <div className="container-narrow mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Our Approach</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
              A Rigorous Academic System Built for Results
            </h2>
            <div className="space-y-4">
              {[
                { icon: BookOpen, title: "Continuous Assessment", desc: "Regular testing and feedback loops ensure students stay on track and gaps are addressed immediately." },
                { icon: Target, title: "Exam Preparation", desc: "Structured revision programmes, past paper practice, and targeted intervention for every subject." },
                { icon: Star, title: "Performance Tracking", desc: "Data-driven progress reports so parents and teachers can monitor growth in real time." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-4 bg-background border border-border card-elevated">
                  <div className="w-10 h-10 bg-primary/10 flex-shrink-0 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden border border-border">
            <img src={classroomImg} alt="Students learning in classroom" className="w-full h-full object-cover" loading="lazy" width={1280} height={720} />
          </div>
        </div>
      </div>
    </section>

    {/* Student Outcomes */}
    <section className="section-padding bg-background">
      <div className="container-narrow mx-auto text-center">
        <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Student Outcomes</p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-12">
          What Our Students Become
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border max-w-4xl mx-auto">
          {outcomes.map((o) => (
            <div key={o} className="flex items-center gap-3 bg-background p-5 text-left">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium text-sm">{o}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="section-padding bg-muted">
      <div className="container-narrow mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Parent Testimonials</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">What Parents Say About Us</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {[
            { quote: "My son's grades improved dramatically within the first term. The structured environment and dedicated teachers made all the difference.", name: "Mrs. Nkosi", role: "Parent of Grade 10 Student" },
            { quote: "Apex Academy gave my daughter the discipline and confidence she needed. She now approaches her studies with focus and determination.", name: "Mr. Mokoena", role: "Parent of Grade 8 Student" },
            { quote: "The regular progress reports and open communication with teachers give me peace of mind. I always know exactly how my child is performing.", name: "Mrs. Dlamini", role: "Parent of Grade 11 Student" },
          ].map((t) => (
            <div key={t.name} className="bg-background p-8 flex flex-col">
              <Star className="h-5 w-5 text-primary mb-4" />
              <p className="text-muted-foreground text-sm leading-relaxed italic mb-6 flex-1">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="bg-blue-gradient section-padding">
      <div className="container-narrow mx-auto text-center text-primary-foreground">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
          Give Your Child the Advantage
        </h2>
        <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8 text-lg">
          Join a school where discipline meets excellence. Applications for 2026 are now open — limited places available.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/apply" className="btn-primary-school text-base border-2 border-primary-foreground/20 hover:border-primary-foreground/40">
            Start Application <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link to="/contact" className="btn-outline-school text-base">
            Contact Us
          </Link>
        </div>
      </div>
    </section>

    <WhatsAppButton />
  </Layout>
);

export default Index;
