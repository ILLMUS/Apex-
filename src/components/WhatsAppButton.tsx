import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/26876427025?text=Hello%2C%20I%20would%20like%20to%20enquire%20about%20admissions."
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 text-sm font-semibold shadow-lg transition-all hover:scale-105"
    style={{ backgroundColor: "#25D366", color: "#fff" }}
    aria-label="Chat on WhatsApp"
  >
    <MessageCircle className="h-5 w-5" />
    <span className="hidden sm:inline">WhatsApp Us</span>
  </a>
);

export default WhatsAppButton;
