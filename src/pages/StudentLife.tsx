import { useState } from "react";
import Layout from "@/components/Layout";
import studentLifeImg from "@/assets/student-life.jpg";
import gallerySports from "@/assets/gallery-sports.jpg";
import galleryArts from "@/assets/gallery-arts.jpg";
import galleryScience from "@/assets/gallery-science.jpg";
import galleryAwards from "@/assets/gallery-awards.jpg";
import galleryCommunity from "@/assets/gallery-community.jpg";
import galleryLeadership from "@/assets/gallery-leadership.jpg";
import { Trophy, Users, Music, Briefcase, Heart, Dumbbell, X } from "lucide-react";

const activities = [
  { icon: Trophy, title: "Competitive Sports", desc: "Soccer, netball, athletics, and cricket — building teamwork, resilience, and physical fitness." },
  { icon: Music, title: "Arts & Culture", desc: "Drama, music, visual arts, and cultural events that nurture creativity and self-expression." },
  { icon: Users, title: "Leadership Programme", desc: "Prefect system, student council, and mentorship opportunities that develop real leadership skills." },
  { icon: Briefcase, title: "Career Guidance", desc: "Workshops, career days, and university preparation to help students make informed decisions." },
  { icon: Heart, title: "Community Service", desc: "Outreach programmes that instil empathy, responsibility, and a sense of purpose in every student." },
  { icon: Dumbbell, title: "Personal Development", desc: "Life skills, financial literacy, and wellness sessions that prepare students for life beyond school." },
];

const galleryItems = [
  { src: gallerySports, alt: "Students playing soccer on the sports field", label: "Sports Day" },
  { src: galleryArts, alt: "Students performing in a drama production", label: "Arts & Drama" },
  { src: galleryScience, alt: "Students conducting science experiments", label: "Science Lab" },
  { src: galleryAwards, alt: "Students receiving awards at ceremony", label: "Awards Ceremony" },
  { src: galleryCommunity, alt: "Students doing community service", label: "Community Outreach" },
  { src: galleryLeadership, alt: "Student council meeting", label: "Student Leadership" },
];

const StudentLife = () => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <Layout>
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0">
          <img src={studentLifeImg} alt="Students on sports field" className="w-full h-full object-cover" loading="lazy" width={1280} height={720} />
          <div className="absolute inset-0 bg-blue-gradient opacity-80" />
        </div>
        <div className="relative container-narrow mx-auto px-4 sm:px-6 lg:px-8 text-primary-foreground">
          <p className="font-bold text-xs uppercase tracking-widest mb-3 opacity-80">Student Life</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold max-w-2xl">More Than Academics — Building Complete Individuals</h1>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow mx-auto">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3 text-center">Life at Apex Academy</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">Beyond the classroom, our students grow through sport, leadership, and service.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {activities.map((a) => (
              <div key={a.title} className="bg-background p-6 card-elevated">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                  <a.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{a.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="section-padding bg-muted">
        <div className="container-narrow mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Campus Gallery</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Life in Action</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {galleryItems.map((item, idx) => (
              <button
                key={item.label}
                onClick={() => setLightboxIdx(idx)}
                className="group relative overflow-hidden aspect-[3/2] bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  width={768}
                  height={512}
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors duration-300 flex items-end">
                  <span className="text-primary-foreground font-semibold text-sm px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 text-primary-foreground hover:text-primary-foreground/80"
            aria-label="Close lightbox"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={galleryItems[lightboxIdx].src}
            alt={galleryItems[lightboxIdx].alt}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-primary-foreground font-semibold text-lg">
            {galleryItems[lightboxIdx].label}
          </p>
        </div>
      )}
    </Layout>
  );
};

export default StudentLife;
