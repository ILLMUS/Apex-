import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MessageNotification from "@/components/MessageNotification";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Academics", path: "/academics" },
  { label: "Student Life", path: "/student-life" },
  { label: "Admissions", path: "/admissions" },
  { label: "Contact", path: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);
  const location = useLocation();
  const userEmail = session?.user?.email;
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-md border-b border-border/50"
      }`}
    >
      <div className="container-narrow mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className={`h-8 w-8 transition-colors duration-300 ${"text-primary"}`} />
          <span className={`font-heading text-xl md:text-2xl font-bold transition-colors duration-300 ${"text-foreground"}`}>
            Apex Academy
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/apply" className="btn-primary-school ml-3 text-sm !py-2 !px-5 font-bold">
            Apply Now
          </Link>
          {session ? (
            <div className="ml-2 flex items-center gap-2">
              <MessageNotification userId={session.user.id} />
              <span className={`text-sm font-medium truncate max-w-[160px] ${"text-foreground"}`}>
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/admin"
              className="ml-2 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Staff Login
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <div className="lg:hidden flex items-center gap-1">
          {session && <MessageNotification userId={session.user.id} />}
          <button
            className={`p-2 transition-colors duration-300 ${"text-foreground"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="lg:hidden bg-background border-b border-border animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 text-base font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/5 font-bold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/apply"
              onClick={() => setMobileOpen(false)}
              className="btn-primary-school w-full text-center mt-3 block font-bold"
            >
              Apply Now
            </Link>
            {session ? (
              <div className="space-y-1 mt-1">
                <span className="block px-4 py-2 text-sm font-medium text-foreground truncate">
                  {userEmail}
                </span>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-base font-bold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md mt-1"
              >
                <LogIn className="h-4 w-4" />
                Staff Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
