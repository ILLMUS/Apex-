import { Link } from "react-router-dom";
import { GraduationCap, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-blue-gradient text-primary-foreground">
      <div className="container-narrow mx-auto section-padding !py-12 md:!py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
              <span className="font-heading text-xl font-bold">Apex Academy</span>
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              Building disciplined, high-performing students ready for the future through structured learning and academic excellence.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "About Us", path: "/about" },
                { label: "Academics", path: "/academics" },
                { label: "Admissions", path: "/admissions" },
                { label: "Apply Now", path: "/apply" },
              ].map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-primary-foreground/80" />
                <span>+27 12 345 6789</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-primary-foreground/80" />
                <span>admissions@apexacademy.edu</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary-foreground/80" />
                <span>123 Academy Drive, Pretoria</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Admissions</h4>
            <p className="text-primary-foreground/60 text-sm mb-4">
              Applications are now open for the upcoming academic year.
            </p>
            <Link to="/apply" className="btn-primary-school text-sm !py-2 border border-primary-foreground/20">
              Apply Now
            </Link>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex items-center justify-between text-xs text-primary-foreground/40">
          <span>© {new Date().getFullYear()} Apex Academy. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/parent" className="hover:text-primary-foreground/70 transition-colors">
              Parent Portal
            </Link>
            <Link to="/admin" className="text-primary-foreground/20 hover:text-primary-foreground/40 transition-colors" aria-label="Staff portal">
              Staff
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
