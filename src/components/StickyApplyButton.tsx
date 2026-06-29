import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const StickyApplyButton = () => (
  <Link
    to="/apply"
    className="sticky-apply btn-primary-school !px-5 !py-3 text-sm font-bold shadow-lg flex items-center gap-2 md:hidden"
  >
    Apply <ArrowRight className="h-4 w-4" />
  </Link>
);

export default StickyApplyButton;
