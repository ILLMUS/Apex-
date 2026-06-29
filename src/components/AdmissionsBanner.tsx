import { Link } from "react-router-dom";

const AdmissionsBanner = () => (
  <div className="bg-primary text-primary-foreground text-center text-sm font-semibold py-2 px-4">
    🎓 Applications Open for 2026 — Limited Places Available!{" "}
    <Link to="/apply" className="underline underline-offset-2 hover:opacity-80 ml-1">
      Apply Now →
    </Link>
  </div>
);

export default AdmissionsBanner;
